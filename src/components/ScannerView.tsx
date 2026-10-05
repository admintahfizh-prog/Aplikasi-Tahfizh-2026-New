import React, { useState, useEffect, useRef, useMemo } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CameraOff,
  ScanLine,
  Search,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Upload,
  Eye,
  BookOpen,
  BookMarked,
  History,
  Printer,
  Calendar,
  Award,
  QrCode,
  X,
  Clock,
  Filter
} from 'lucide-react';
import {
  Student,
  Teacher,
  ClassItem,
  AttendanceRecord,
  AttendanceStatus,
  User,
  HalaqahGroup
} from '../types';
import { storageService } from '../services/storageService';
import { AvatarBadge } from './AvatarBadge';
import { isGrade8or9Student } from '../utils/gradeHelper';
import { getStudentHalaqahInfo, resolveCurrentTeacher } from '../utils/halaqahHelper';
import {
  buildStudentAttendanceQrPayload,
  buildStudentQrCodeBadgeId,
  getCachedStudentQrDataUrl
} from './QrAttendancePanel';
import {
  findStudentByScannedCode,
  playScanSuccessBeep,
  printStudentQrCards
} from '../utils/qrPrintAndScanUtils';

export type ScannerWorkflowMode = 'lookup_and_attendance' | 'quick_lookup' | 'auto_attendance';

interface ScannedSessionEntry {
  id: string;
  student: Student;
  timestamp: string;
  mode: ScannerWorkflowMode;
  attendanceStatus?: AttendanceStatus;
  rawCode: string;
}

interface ScannerViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassItem[];
  currentUser?: User | null;
  halaqahGroups?: HalaqahGroup[];
  initialWorkflowMode?: ScannerWorkflowMode;
  autoStartCamera?: boolean;
  onOpenStudentDetail?: (studentId: string) => void;
  onLookupStudentInList?: (student: Student) => void;
  onOpenDailyInputWithStudent?: (
    studentId: string,
    tab?: 'quran' | 'ummi' | 'presensi'
  ) => void;
  onOpenPreviousHafalan?: (studentId: string) => void;
  onAttendanceUpdated?: () => void;
  onClose?: () => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  students,
  teachers,
  classes,
  currentUser,
  halaqahGroups = [],
  initialWorkflowMode = 'lookup_and_attendance',
  autoStartCamera = false,
  onOpenStudentDetail,
  onLookupStudentInList,
  onOpenDailyInputWithStudent,
  onOpenPreviousHafalan,
  onAttendanceUpdated,
  onClose
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [workflowMode, setWorkflowMode] = useState<ScannerWorkflowMode>(initialWorkflowMode);
  const [defaultAttendanceStatus, setDefaultAttendanceStatus] =
    useState<AttendanceStatus>('Hadir');

  // Camera state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Manual / Barcode Gun input state
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [quickFilterSearch, setQuickFilterSearch] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');

  // Identified student & feedback state
  const [identifiedStudent, setIdentifiedStudent] = useState<Student | null>(null);
  const [identifiedStudentQrUrl, setIdentifiedStudentQrUrl] = useState<string>('');
  const [scanFeedback, setScanFeedback] = useState<{
    type: 'success' | 'info' | 'error';
    title: string;
    message: string;
  } | null>(null);
  const [sessionHistory, setSessionHistory] = useState<ScannedSessionEntry[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    storageService.getAttendanceRecords()
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScannedCodeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  const currentTeacher = useMemo(
    () => resolveCurrentTeacher(currentUser, teachers) || teachers[0],
    [currentUser, teachers]
  );

  const activeHalaqahGroups = useMemo(
    () => (halaqahGroups.length > 0 ? halaqahGroups : storageService.getHalaqahGroups()),
    [halaqahGroups]
  );

  useEffect(() => {
    const refresh = () => setAttendanceRecords(storageService.getAttendanceRecords());
    const unsub = storageService.onSyncChange(refresh);
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    setWorkflowMode(initialWorkflowMode);
  }, [initialWorkflowMode]);

  // Generate QR Data URL for the currently identified student
  useEffect(() => {
    let mounted = true;
    if (!identifiedStudent) {
      setIdentifiedStudentQrUrl('');
      return;
    }
    getCachedStudentQrDataUrl(identifiedStudent).then(url => {
      if (mounted) setIdentifiedStudentQrUrl(url);
    });
    return () => {
      mounted = false;
    };
  }, [identifiedStudent]);

  // Stop camera helper
  const stopCamera = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Record attendance for a student
  const handleMarkAttendance = (
    student: Student,
    status: AttendanceStatus,
    customNote?: string
  ): AttendanceRecord => {
    const existing = storageService
      .getAttendanceRecords()
      .find(r => r.studentId === student.id && r.date === selectedDate);
    const timeStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const badgeId = buildStudentQrCodeBadgeId(student);

    const record: AttendanceRecord = {
      id: existing?.id || `att-${student.id}-${selectedDate}`,
      studentId: student.id,
      teacherId: currentTeacher?.id || student.teacherId || teachers[0]?.id || 't-1',
      date: selectedDate,
      status,
      notes:
        customNote !== undefined
          ? customNote
          : `Scan Kamera QR (${badgeId}) pukul ${timeStr}`
    };

    storageService.addAttendanceRecord(record);
    setAttendanceRecords(storageService.getAttendanceRecords());
    onAttendanceUpdated?.();
    return record;
  };

  // Core handler when any QR Code / Barcode is decoded
  const handleDecodedQrCode = (rawCode: string) => {
    const trimmed = rawCode.trim();
    if (!trimmed) return;

    const matched = findStudentByScannedCode(trimmed, students);
    if (!matched) {
      setScanFeedback({
        type: 'error',
        title: 'QR Code Tidak Dikenali',
        message: `Kode "${trimmed}" tidak cocok dengan NIS atau ID santri manapun.`
      });
      return;
    }

    playScanSuccessBeep();
    setIdentifiedStudent(matched);

    const timeStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const clsName = classes.find(c => c.id === matched.classId)?.name || '7A';
    const badgeId = buildStudentQrCodeBadgeId(matched);

    let recordedStatus: AttendanceStatus | undefined = undefined;

    if (workflowMode === 'auto_attendance' || workflowMode === 'lookup_and_attendance') {
      handleMarkAttendance(matched, defaultAttendanceStatus);
      recordedStatus = defaultAttendanceStatus;
      setScanFeedback({
        type: 'success',
        title: `Teridentifikasi & Absen ${defaultAttendanceStatus} Tercatat!`,
        message: `${matched.name} (Kelas ${clsName} • ${badgeId}) otomatis tercatat ${defaultAttendanceStatus.toUpperCase()} pada ${selectedDate}.`
      });
    } else {
      setScanFeedback({
        type: 'info',
        title: 'Santri Berhasil Diidentifikasi!',
        message: `${matched.name} (Kelas ${clsName} • NIS: ${matched.nis}) ditemukan melalui scan QR Code.`
      });
    }

    setSessionHistory(prev => [
      {
        id: `${matched.id}-${Date.now()}`,
        student: matched,
        timestamp: timeStr,
        mode: workflowMode,
        attendanceStatus: recordedStatus,
        rawCode: badgeId
      },
      ...prev.slice(0, 24)
    ]);
  };

  // Start browser camera and continuous QR scan loop
  const startCamera = async (preferredFacingMode = facingMode) => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Browser pada perangkat ini tidak mendukung akses kamera langsung. Gunakan fitur Upload Gambar QR atau input kode di bawah.'
      );
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: preferredFacingMode },
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Optional native BarcodeDetector alongside jsQR
      const NativeDetector = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;
      const nativeDetector = NativeDetector
        ? new NativeDetector({
            formats: ['qr_code', 'code_128', 'code_39', 'ean_13']
          })
        : null;

      const scanFrame = async () => {
        if (!videoRef.current || !streamRef.current) return;
        const video = videoRef.current;

        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          let detectedText: string | null = null;

          // 1. Decode 2D QR Code via jsQR
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
              });
              if (qrResult && qrResult.data) {
                detectedText = qrResult.data;
              }
            }
          }

          // 2. Fallback to native BarcodeDetector if available
          if (!detectedText && nativeDetector) {
            try {
              const barcodes = await nativeDetector.detect(video);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                detectedText = String(barcodes[0].rawValue);
              }
            } catch {
              // ignore frame error
            }
          }

          if (detectedText) {
            const now = Date.now();
            // Prevent duplicate rapid-fire scans of the same QR within 2.2 seconds
            if (
              detectedText !== lastScannedCodeRef.current.code ||
              now - lastScannedCodeRef.current.time > 2200
            ) {
              lastScannedCodeRef.current = { code: detectedText, time: now };
              handleDecodedQrCode(detectedText);
            }
          }
        }

        if (streamRef.current) {
          rafRef.current = requestAnimationFrame(scanFrame);
        }
      };

      rafRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setCameraError(
        'Tidak dapat mengakses kamera. Pastikan izin kamera (Allow Camera) telah diaktifkan di browser Anda.'
      );
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (autoStartCamera) {
      startCamera(facingMode);
    }
    return () => {
      stopCamera();
    };
  }, []);

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (cameraActive) {
      startCamera(nextMode);
    }
  };

  // Decode uploaded QR Code image
  const handleImageQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrResult = jsQR(imageData.data, imageData.width, imageData.height);
        if (qrResult && qrResult.data) {
          handleDecodedQrCode(qrResult.data);
        } else {
          setScanFeedback({
            type: 'error',
            title: 'QR Code Tidak Terbaca dari Gambar',
            message: 'Pastikan gambar kartu QR terlihat jelas dan tidak buram.'
          });
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Quick filtered students for simulator & instant lookup
  const filteredSimulatorStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = !selectedClassFilter || s.classId === selectedClassFilter;
      const q = quickFilterSearch.trim().toLowerCase();
      const badge = buildStudentQrCodeBadgeId(s).toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.nis || '').toLowerCase().includes(q) ||
        badge.includes(q);
      return matchesClass && matchesSearch;
    });
  }, [students, selectedClassFilter, quickFilterSearch]);

  // Map of attendance records for selectedDate
  const dateAttendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendanceRecords.forEach(r => {
      if (r.date === selectedDate) {
        map.set(r.studentId, r);
      }
    });
    return map;
  }, [attendanceRecords, selectedDate]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1E293B] via-slate-900 to-[#1E293B] text-white p-5 border-b border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#D4AF37] text-slate-950 flex items-center justify-center shadow-md shrink-0">
              <Camera className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                  Browser Camera QR Scanner
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Quick Lookup &amp; Presensi Otomatis
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white mt-1">
                Pemindai Kamera QR Code Santri (Identifikasi Cepat &amp; Presensi)
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Arahkan kamera ke Kartu QR Santri untuk mencari profil santri secara instan atau mencatat kehadiran harian
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-[11px] text-slate-300 font-semibold">Tanggal Presensi:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              />
            </div>

            {onClose && (
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Tutup Scanner</span>
              </button>
            )}
          </div>
        </div>

        {/* Mode Selector Pills */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Mode Pemindaian:</span>
            <button
              type="button"
              onClick={() => setWorkflowMode('lookup_and_attendance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                workflowMode === 'lookup_and_attendance'
                  ? 'bg-[#D4AF37] text-slate-950 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Identifikasi + Tandai Absen</span>
            </button>

            <button
              type="button"
              onClick={() => setWorkflowMode('quick_lookup')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                workflowMode === 'quick_lookup'
                  ? 'bg-[#D4AF37] text-slate-950 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Quick Lookup (Cek Profil Saja)</span>
            </button>

            <button
              type="button"
              onClick={() => setWorkflowMode('auto_attendance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                workflowMode === 'auto_attendance'
                  ? 'bg-[#D4AF37] text-slate-950 shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Presensi Cepat Beruntun</span>
            </button>
          </div>

          {workflowMode !== 'quick_lookup' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400">Status Saat Scan:</span>
              {(['Hadir', 'Sakit', 'Izin', 'Alfa'] as AttendanceStatus[]).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setDefaultAttendanceStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                    defaultAttendanceStatus === st
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* Feedback Banner */}
        {scanFeedback && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in ${
              scanFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : scanFeedback.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-950'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {scanFeedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-extrabold">{scanFeedback.title}</p>
                <p className="text-[11px] opacity-90 mt-0.5">{scanFeedback.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setScanFeedback(null)}
              className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN: Browser Camera Viewport & Manual/Hardware Input */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-lg">
              {/* Camera Header Bar */}
              <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  <span className="text-xs font-extrabold text-white">
                    {cameraActive ? 'Kamera Pemindai QR Aktif' : 'Kamera Pemindai Siap'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {cameraActive ? (
                    <>
                      <button
                        type="button"
                        onClick={handleToggleFacingMode}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Ganti Kamera Depan / Belakang"
                      >
                        <RefreshCw className="w-3 h-3 text-[#D4AF37]" />
                        <span>Putar Kamera</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <CameraOff className="w-3 h-3" />
                        <span>Matikan</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c49f2c] text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Aktifkan Kamera QR</span>
                    </button>
                  )}

                  <label className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3 h-3 text-[#D4AF37]" />
                    <span>Foto QR</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageQrUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Camera Viewport */}
              <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {cameraActive ? (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-52 h-44 sm:w-60 sm:h-48 border-2 border-[#D4AF37] rounded-2xl relative shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]">
                      <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-[#D4AF37] rounded-tl-lg" />
                      <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-[#D4AF37] rounded-tr-lg" />
                      <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-[#D4AF37] rounded-bl-lg" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-[#D4AF37] rounded-br-lg" />
                      <div className="absolute inset-x-3 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-pulse" />
                    </div>
                    <span className="mt-3 px-3 py-1 rounded-full bg-slate-900/90 text-[#D4AF37] font-bold text-[11px] border border-[#D4AF37]/40">
                      Posisikan Kartu QR Code Santri di dalam kotak target
                    </span>
                  </div>
                ) : (
                  <div className="p-6 text-center space-y-3 max-w-sm">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-[#D4AF37] flex items-center justify-center mx-auto">
                      <QrCode className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-white">
                        Kamera Pemindai QR Code Santri
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Klik tombol <strong>Aktifkan Kamera QR</strong> di bawah untuk memindai
                        kartu santri menggunakan kamera laptop, tablet, atau smartphone.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => startCamera(facingMode)}
                        className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2c] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Aktifkan Kamera Sekarang</span>
                      </button>
                      <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer">
                        <Upload className="w-4 h-4 text-[#D4AF37]" />
                        <span>Upload Gambar QR</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageQrUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-3 bg-rose-950/90 border-t border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>

            {/* Hardware Scanner / Manual Code Input */}
            <form
              onSubmit={e => {
                e.preventDefault();
                if (!manualCodeInput.trim()) return;
                handleDecodedQrCode(manualCodeInput);
                setManualCodeInput('');
              }}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
            >
              <label className="block text-xs font-extrabold text-slate-800">
                Input Alat Barcode Scanner USB / Kode QR Manual / NIS:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ScanLine className="w-4 h-4 text-[#8C7015] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={e => setManualCodeInput(e.target.value)}
                    placeholder="Ketik / Scan QR-AA21-20267001 atau NIS lalu tekan Enter..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-slate-800 text-white font-extrabold text-xs shrink-0 cursor-pointer"
                >
                  Identifikasi
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Identified Student Card & Quick Lookup Actions */}
          <div className="lg:col-span-6 space-y-4">
            {identifiedStudent ? (
              (() => {
                const cls = classes.find(c => c.id === identifiedStudent.classId);
                const teacher = teachers.find(t => t.id === identifiedStudent.teacherId);
                const halInfo = getStudentHalaqahInfo(
                  identifiedStudent,
                  activeHalaqahGroups,
                  teachers
                );
                const badgeId = buildStudentQrCodeBadgeId(identifiedStudent);
                const attRec = dateAttendanceMap.get(identifiedStudent.id);
                const progressPercent = Math.min(
                  100,
                  Math.round(
                    (identifiedStudent.totalJuzHafal / (identifiedStudent.targetJuz || 4)) * 100
                  )
                );

                return (
                  <div className="bg-white rounded-2xl border-2 border-[#D4AF37] shadow-md overflow-hidden animate-in fade-in">
                    <div className="bg-[#1E293B] text-white px-4 py-3 flex items-center justify-between border-b border-slate-700">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37]">
                          Hasil Identifikasi QR Santri
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                          {badgeId}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIdentifiedStudent(null)}
                          className="p-1 text-slate-400 hover:text-white cursor-pointer"
                          title="Bersihkan Hasil"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 space-y-4">
                      {/* Profile Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <AvatarBadge
                            name={identifiedStudent.name}
                            photoUrl={identifiedStudent.photo}
                            gender={identifiedStudent.gender}
                            role="santri"
                            size="lg"
                            className="shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-950 border border-amber-300">
                                Kelas {cls?.name || '7A'}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                {identifiedStudent.program || 'Reguler'}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-slate-500">
                                NIS: {identifiedStudent.nis}
                              </span>
                            </div>
                            <h3 className="text-base font-black text-slate-900 mt-1 truncate">
                              {identifiedStudent.name}
                            </h3>
                            <p className="text-xs text-[#8C7015] font-bold truncate">
                              {halInfo.groupName} • Ust. {teacher?.name || '-'}
                            </p>
                          </div>
                        </div>

                        {identifiedStudentQrUrl && (
                          <div className="w-14 h-14 p-1 rounded-xl border border-[#D4AF37] bg-white shrink-0 hidden sm:flex items-center justify-center">
                            <img
                              src={identifiedStudentQrUrl}
                              alt={identifiedStudent.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            Capaian Hafalan
                          </span>
                          <span className="font-black text-slate-900 text-sm">
                            {identifiedStudent.totalJuzHafal} / {identifiedStudent.targetJuz} Juz
                          </span>
                          <span className="block text-[10px] text-[#8C7015] font-bold">
                            Tercapai {progressPercent}%
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            Hafalan Terakhir
                          </span>
                          <span className="font-bold text-slate-800 truncate block">
                            {identifiedStudent.lastHafalan || '-'}
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            Nilai Rata: {identifiedStudent.avgScore || 85}
                          </span>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            Metode Ummi
                          </span>
                          {isGrade8or9Student(identifiedStudent, classes) ? (
                            <span className="text-[11px] text-slate-400 italic font-medium">
                              Fokus Tahfizh (Kls 8/9)
                            </span>
                          ) : (
                            <span className="font-bold text-slate-800 block">
                              {identifiedStudent.currentUmmiJilid} (Hal.{' '}
                              {identifiedStudent.currentUmmiPage})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Attendance Status Selector for Identified Student */}
                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-800">
                            Status Kehadiran ({selectedDate}):
                          </span>
                          {attRec ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Tercatat: {attRec.status}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">
                              Belum tercatat pada tanggal ini
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-1.5">
                          {(['Hadir', 'Sakit', 'Izin', 'Alfa'] as AttendanceStatus[]).map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                handleMarkAttendance(identifiedStudent, st);
                                setScanFeedback({
                                  type: 'success',
                                  title: `Presensi Diperbarui (${st})`,
                                  message: `Kehadiran ${identifiedStudent.name} pada ${selectedDate} disimpan sebagai ${st}.`
                                });
                              }}
                              className={`py-1.5 px-2 rounded-lg font-extrabold text-xs border transition cursor-pointer ${
                                attRec?.status === st
                                  ? 'bg-[#1E293B] text-[#D4AF37] border-[#1E293B] shadow-2xs'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quick Lookup & Input Actions */}
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {onOpenStudentDetail && (
                            <button
                              type="button"
                              onClick={() => {
                                stopCamera();
                                onOpenStudentDetail(identifiedStudent.id);
                              }}
                              className="py-2.5 px-3 rounded-xl bg-[#1E293B] hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-[#D4AF37]" />
                              <span>Buka Profil Lengkap Santri</span>
                            </button>
                          )}

                          {onLookupStudentInList && (
                            <button
                              type="button"
                              onClick={() => {
                                stopCamera();
                                onLookupStudentInList(identifiedStudent);
                              }}
                              className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-[#D4AF37] font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Filter className="w-4 h-4 text-[#8C7015]" />
                              <span>Tampilkan di Daftar Kartu Santri</span>
                            </button>
                          )}
                        </div>

                        {onOpenDailyInputWithStudent && currentUser?.role !== 'wali' && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                onOpenDailyInputWithStudent(identifiedStudent.id, 'quran')
                              }
                              className="py-2 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                              <span>+ Input Hafalan</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onOpenDailyInputWithStudent(identifiedStudent.id, 'ummi')
                              }
                              className="py-2 px-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <BookMarked className="w-3.5 h-3.5 text-amber-300" />
                              <span>+ Input Ummi</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                printStudentQrCards(
                                  [identifiedStudent],
                                  classes,
                                  identifiedStudentQrUrl
                                    ? { [identifiedStudent.id]: identifiedStudentQrUrl }
                                    : {},
                                  'single'
                                )
                              }
                              className="col-span-2 sm:col-span-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-[#8C7015]" />
                              <span>Cetak QR</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              /* Empty State before scanning */
              <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-[#8C7015] flex items-center justify-center mx-auto">
                  <ScanLine className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">
                    Belum Ada Santri yang Dipindai
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Arahkan kartu QR Code santri ke kamera, gunakan alat scanner barcode, atau
                    pilih santri pada daftar uji cepat di bawah untuk menampilkan identifikasi
                    santri dan mencatat kehadiran.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Student Scan List / Simulator */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">
                    Daftar Cepat Identifikasi &amp; Simulasi Scan QR ({filteredSimulatorStudents.length}{' '}
                    Santri)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Klik <strong>Scan QR</strong> untuk menguji identifikasi &amp; presensi santri
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedClassFilter}
                    onChange={e => setSelectedClassFilter(e.target.value)}
                    className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="">Semua Kelas</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={quickFilterSearch}
                  onChange={e => setQuickFilterSearch(e.target.value)}
                  placeholder="Cari nama santri atau NIS..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {filteredSimulatorStudents.map(std => {
                  const clsName = classes.find(c => c.id === std.classId)?.name || '7A';
                  const badgeId = buildStudentQrCodeBadgeId(std);
                  const att = dateAttendanceMap.get(std.id);
                  const isSelected = identifiedStudent?.id === std.id;

                  return (
                    <div
                      key={std.id}
                      className={`p-2.5 flex items-center justify-between gap-2 text-xs transition ${
                        isSelected ? 'bg-amber-50/80' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          {std.name}{' '}
                          <span className="text-[10px] font-semibold text-slate-500">
                            (Kls {clsName})
                          </span>
                        </p>
                        <p className="text-[10px] font-mono font-bold text-[#8C7015]">
                          {badgeId} • NIS: {std.nis}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {att && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {att.status}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            handleDecodedQrCode(buildStudentAttendanceQrPayload(std))
                          }
                          className="px-2.5 py-1 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <ScanLine className="w-3 h-3 text-[#D4AF37]" />
                          <span>Scan QR</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Session Scan Log */}
        {sessionHistory.length > 0 && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#8C7015]" />
                <span>Riwayat Identifikasi &amp; Scan Sesi Ini ({sessionHistory.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => setSessionHistory([])}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Bersihkan Riwayat
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {sessionHistory.map(item => {
                const clsName = classes.find(c => c.id === item.student.classId)?.name || '7A';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIdentifiedStudent(item.student)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 text-left flex items-center gap-2 shadow-2xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-900">
                        {item.student.name} ({clsName})
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.timestamp} • {item.attendanceStatus || 'Lookup'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
