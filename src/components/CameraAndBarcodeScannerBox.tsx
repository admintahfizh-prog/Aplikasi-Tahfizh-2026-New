import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  ScanLine,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  QrCode,
  Sparkles
} from 'lucide-react';
import { Student, ClassItem } from '../types';
import {
  findStudentByScannedCode,
  playScanSuccessBeep
} from '../utils/qrPrintAndScanUtils';
import {
  decodeQrFromVideoFrame,
  decodeQrFromImageElement
} from '../utils/qrImageProcessor';
import { buildStudentQrCodeBadgeId } from './QrAttendancePanel';

interface CameraAndBarcodeScannerBoxProps {
  students: Student[];
  classes: ClassItem[];
  onStudentScanned: (student: Student, rawCode: string) => void;
  compact?: boolean;
  autoStart?: boolean;
  placeholder?: string;
}

export const CameraAndBarcodeScannerBox: React.FC<CameraAndBarcodeScannerBoxProps> = ({
  students,
  classes,
  onStudentScanned,
  compact = false,
  autoStart = true,
  placeholder = 'Arahkan scanner barcode/QR ke sini atau ketik NIS / Kode QR (Contoh: QR-AA21-2607001)...'
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [scanMessage, setScanMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScannedRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const studentsRef = useRef(students);
  const classesRef = useRef(classes);
  const onStudentScannedRef = useRef(onStudentScanned);

  useEffect(() => {
    studentsRef.current = students;
    classesRef.current = classes;
    onStudentScannedRef.current = onStudentScanned;
  }, [students, classes, onStudentScanned]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
  }, []);

  const handleDecodedString = useCallback((rawText: string) => {
    const clean = (rawText || '').trim();
    if (!clean) return;

    const now = Date.now();
    if (
      lastScannedRef.current.code === clean &&
      now - lastScannedRef.current.time < 2200
    ) {
      return;
    }

    const matched = findStudentByScannedCode(clean, studentsRef.current);
    if (!matched) {
      setScanMessage({
        type: 'error',
        text: `Kode "${clean}" tidak cocok dengan NIS / QR santri manapun.`
      });
      return;
    }

    lastScannedRef.current = { code: clean, time: now };
    playScanSuccessBeep();
    const clsName = classesRef.current.find(c => c.id === matched.classId)?.name || '7A';
    setScanMessage({
      type: 'success',
      text: `Terdeteksi: ${matched.name} (Kelas ${clsName} • ${buildStudentQrCodeBadgeId(matched)})`
    });
    onStudentScannedRef.current(matched, clean);
  }, []);

  const attachStreamToVideoElement = useCallback(async (stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.muted = true;
    try {
      await video.play();
    } catch {
      // Wait for metadata if immediate play was deferred
      video.onloadedmetadata = () => {
        video.play().catch(() => {});
      };
    }
  }, []);

  // Ensure stream is bound whenever isCameraActive changes or videoRef mounts
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      attachStreamToVideoElement(streamRef.current);
    }
  }, [isCameraActive, attachStreamToVideoElement]);

  const startCamera = useCallback(
    async (mode: 'environment' | 'user' = facingMode, customDeviceId?: string) => {
      stopCamera();
      setCameraError(null);
      setIsStartingCamera(true);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError(
            'Browser tidak mendukung akses kamera langsung. Gunakan fitur Upload Foto QR atau Input Alat Scanner di bawah.'
          );
          setIsStartingCamera(false);
          return;
        }

        let stream: MediaStream | null = null;
        const devId = customDeviceId !== undefined ? customDeviceId : selectedDeviceId;

        // Progressive fallback constraints so every phone/laptop webcam succeeds
        const constraintCandidates: MediaStreamConstraints[] = [];
        if (devId) {
          constraintCandidates.push({
            video: { deviceId: { exact: devId }, width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false
          });
        }
        constraintCandidates.push(
          {
            video: { facingMode: { ideal: mode }, width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false
          },
          {
            video: { facingMode: mode },
            audio: false
          },
          {
            video: true,
            audio: false
          }
        );

        let lastErr: unknown = null;
        for (const constraints of constraintCandidates) {
          try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (stream) break;
          } catch (err) {
            lastErr = err;
          }
        }

        if (!stream) {
          throw lastErr || new Error('Camera stream unavailable');
        }

        streamRef.current = stream;
        setIsCameraActive(true);
        setIsStartingCamera(false);

        await attachStreamToVideoElement(stream);

        // Enumerate video input devices after permission is granted
        if (navigator.mediaDevices.enumerateDevices) {
          navigator.mediaDevices
            .enumerateDevices()
            .then(devices => {
              const cams = devices.filter(d => d.kind === 'videoinput');
              setVideoDevices(cams);
            })
            .catch(() => {});
        }

        // Start scanning loop using jsQR + native BarcodeDetector
        const AnyWindow = window as unknown as {
          BarcodeDetector?: new (opts?: { formats: string[] }) => {
            detect: (
              source: HTMLVideoElement | HTMLCanvasElement
            ) => Promise<Array<{ rawValue: string }>>;
          };
        };
        let nativeDetector: {
          detect: (
            source: HTMLVideoElement | HTMLCanvasElement
          ) => Promise<Array<{ rawValue: string }>>;
        } | null = null;
        if (AnyWindow.BarcodeDetector) {
          try {
            nativeDetector = new AnyWindow.BarcodeDetector({
              formats: ['qr_code', 'code_128', 'code_39', 'ean_13']
            });
          } catch {
            nativeDetector = null;
          }
        }

        let frameCounter = 0;
        const tick = async () => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video && canvas && video.readyState >= 2) {
            frameCounter += 1;
            const decoded = await decodeQrFromVideoFrame(
              video,
              canvas,
              frameCounter,
              nativeDetector
            );
            if (decoded && decoded.text) {
              handleDecodedString(decoded.text);
            }
          }
          if (streamRef.current) {
            rafRef.current = requestAnimationFrame(tick);
          }
        };

        rafRef.current = requestAnimationFrame(tick);
      } catch (err: any) {
        setIsStartingCamera(false);
        setIsCameraActive(false);
        const errName = err?.name || '';
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setCameraError(
            'Izin kamera ditolak oleh browser. Klik ikon gembok/kamera di bilah alamat browser lalu pilih "Allow / Izinkan Kamera", kemudian klik Buka Kamera kembali.'
          );
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          setCameraError(
            'Perangkat kamera tidak ditemukan pada perangkat ini. Gunakan fitur Upload Gambar QR atau Alat Barcode Scanner USB.'
          );
        } else {
          setCameraError(
            'Kamera belum dapat diakses. Pastikan tidak sedang dipakai aplikasi lain dan izin kamera sudah diberikan, atau gunakan Upload Gambar QR.'
          );
        }
      }
    },
    [facingMode, selectedDeviceId, stopCamera, attachStreamToVideoElement, handleDecodedString]
  );

  useEffect(() => {
    if (autoStart) {
      startCamera('environment');
    }
    return () => {
      stopCamera();
    };
  }, []);

  const handleToggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera(facingMode);
    }
  };

  const handleSwitchCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    setSelectedDeviceId('');
    startCamera(nextMode, '');
  };

  const handleImageUploadScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;
      const img = new window.Image();
      img.onload = () => {
        const decoded = decodeQrFromImageElement(img);
        if (decoded && decoded.text) {
          handleDecodedString(decoded.text);
        } else {
          setScanMessage({
            type: 'error',
            text: 'Gambar tidak mengandung QR Code yang terbaca jelas. Coba gunakan gambar Kartu QR yang diunduh.'
          });
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    handleDecodedString(manualCodeInput);
    setManualCodeInput('');
  };

  return (
    <div className="space-y-3">
      {/* Top Controls: Camera Toggle & Image Upload */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 text-white p-3 rounded-xl border border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-slate-950 flex items-center justify-center shrink-0">
            <ScanLine className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white">
              Scanner Barcode &amp; QR Code Santri
            </h4>
            <p className="text-[10px] text-slate-300">
              Mendukung Kamera Live, Alat Laser Barcode/QR USB, &amp; Upload Gambar Kartu QR
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {videoDevices.length > 1 && isCameraActive && (
            <select
              value={selectedDeviceId}
              onChange={e => {
                const id = e.target.value;
                setSelectedDeviceId(id);
                startCamera(facingMode, id);
              }}
              className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-600 text-[11px] font-bold focus:outline-none"
            >
              <option value="">Pilih Kamera ({videoDevices.length})</option>
              {videoDevices.map((dev, idx) => (
                <option key={dev.deviceId || idx} value={dev.deviceId}>
                  {dev.label || `Kamera ${idx + 1}`}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleToggleCamera}
            disabled={isStartingCamera}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
              isCameraActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-[#D4AF37] hover:bg-[#c49f2c] text-slate-950'
            }`}
          >
            {isCameraActive ? (
              <>
                <CameraOff className="w-3.5 h-3.5" />
                <span>Matikan Kamera</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>{isStartingCamera ? 'Membuka Kamera...' : 'Buka Kamera Scan QR'}</span>
              </>
            )}
          </button>

          {isCameraActive && (
            <button
              type="button"
              onClick={handleSwitchCameraFacing}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Ganti Kamera Depan / Belakang"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Balik Kamera</span>
            </button>
          )}

          <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Scan dari File Gambar QR</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUploadScan}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Camera Live Viewfinder - Always mounted in DOM so videoRef is never null */}
      <div
        className={`relative bg-slate-950 rounded-xl overflow-hidden border-2 border-[#D4AF37] max-w-md mx-auto aspect-4/3 flex items-center justify-center ${
          isCameraActive || isStartingCamera ? 'block' : 'hidden'
        }`}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {isStartingCamera && !isCameraActive && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2 text-white text-xs font-bold">
            <RefreshCw className="w-6 h-6 text-[#D4AF37] animate-spin" />
            <span>Mengaktifkan kamera perangkat...</span>
          </div>
        )}

        {/* Target Frame Overlay */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
            <div className="w-48 h-48 border-2 border-[#D4AF37] rounded-2xl relative shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]">
              <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-4 border-l-4 border-[#D4AF37] rounded-tl-lg" />
              <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-4 border-r-4 border-[#D4AF37] rounded-tr-lg" />
              <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-4 border-l-4 border-[#D4AF37] rounded-bl-lg" />
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-4 border-r-4 border-[#D4AF37] rounded-br-lg" />
              <div className="absolute inset-x-2 top-1/2 h-0.5 bg-emerald-400 animate-pulse" />
            </div>
            <span className="mt-3 px-3 py-1 rounded-full bg-slate-900/90 text-[#D4AF37] text-[11px] font-bold border border-[#D4AF37]/40">
              Arahkan Kartu QR / Barcode Santri ke Kotak Kamera
            </span>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{cameraError}</span>
          </div>
          <button
            type="button"
            onClick={() => startCamera(facingMode)}
            className="px-2.5 py-1 rounded-lg bg-[#1E293B] text-white font-bold text-[11px] shrink-0 cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Barcode / QR Hardware Scanner Input Bar */}
      <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <QrCode className="w-4 h-4 text-[#8C7015] absolute left-3 top-2.5" />
          <input
            type="text"
            value={manualCodeInput}
            onChange={e => setManualCodeInput(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 bg-white border-2 border-[#D4AF37] rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E293B]"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Proses Scan Barcode / QR</span>
        </button>
      </form>

      {/* Scan Status Feedback */}
      {scanMessage && !compact && (
        <div
          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            scanMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {scanMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{scanMessage.text}</span>
        </div>
      )}
    </div>
  );
};
