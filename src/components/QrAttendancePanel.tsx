import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  ScanLine,
  CheckCircle2,
  Search,
  Download,
  Printer,
  Calendar,
  UserCheck,
  X,
  Trash2,
  Eye,
  BookOpen,
  BookMarked,
  History,
  Sparkles
} from 'lucide-react';
import {
  Student,
  Teacher,
  ClassItem,
  AttendanceRecord,
  AttendanceStatus,
  User
} from '../types';
import { storageService } from '../services/storageService';
import { AvatarBadge } from './AvatarBadge';
import { CameraAndBarcodeScannerBox } from './CameraAndBarcodeScannerBox';
import {
  buildBarcodeSvgDataUrl,
  findStudentByScannedCode,
  printStudentQrCards
} from '../utils/qrPrintAndScanUtils';

export interface QrAttendancePanelProps {
  students: Student[];
  teachers: Teacher[];
  classes?: ClassItem[];
  currentUser?: User | null;
  onOpenStudentDetail?: (studentId: string) => void;
  onAttendanceUpdated?: () => void;
  onOpenDailyInputWithStudent?: (studentId: string, tab?: 'quran' | 'ummi' | 'presensi') => void;
  onOpenPreviousHafalan?: (studentId: string) => void;
  initialActiveMode?: 'qr_cards' | 'qr_scanner' | 'print_cards' | 'attendance_log';
}

const studentQrCache = new Map<string, string>();

/**
 * Generates a deterministic, unique QR payload for a student's daily attendance.
 */
export function buildStudentAttendanceQrPayload(student: Student): string {
  const cleanNis = (student.nis || student.id || '').trim();
  return `ALAZHAR21-ATT|${student.id}|${cleanNis}|${student.name || 'Santri'}`;
}

/**
 * Generates a short human-readable unique QR code badge ID for a student.
 */
export function buildStudentQrCodeBadgeId(student: Student): string {
  const cleanNis = (student.nis || '').replace(/[^a-zA-Z0-9]/g, '');
  if (cleanNis) return `QR-AA21-${cleanNis}`;
  return `QR-AA21-${(student.id || '000000').slice(-6).toUpperCase()}`;
}

/**
 * Returns a cached SVG Data URL for a student's unique QR code without allocating DOM canvas contexts.
 */
export async function getCachedStudentQrDataUrl(student: Student): Promise<string> {
  const payload = buildStudentAttendanceQrPayload(student);
  const cached = studentQrCache.get(payload);
  if (cached) return cached;

  try {
    const svgStr = await QRCode.toString(payload, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#1E293B',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
    studentQrCache.set(payload, dataUrl);
    return dataUrl;
  } catch {
    return '';
  }
}

export const QrAttendancePanel: React.FC<QrAttendancePanelProps> = ({
  students,
  teachers,
  classes: propClasses,
  currentUser,
  onOpenStudentDetail,
  onAttendanceUpdated,
  onOpenDailyInputWithStudent,
  onOpenPreviousHafalan,
  initialActiveMode = 'qr_cards'
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const classes = useMemo(
    () => (propClasses && propClasses.length > 0 ? propClasses : storageService.getClasses()),
    [propClasses]
  );

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    storageService.getAttendanceRecords()
  );
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeMode, setActiveMode] = useState<
    'qr_cards' | 'qr_scanner' | 'print_cards' | 'attendance_log'
  >(initialActiveMode);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | 'belum'
  >('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    setActiveMode(initialActiveMode);
  }, [initialActiveMode]);

  // QR / Barcode Scanner states
  const [scanActionMode, setScanActionMode] = useState<
    'absen_dan_pilih' | 'absen_dan_hafalan' | 'absen_dan_ummi' | 'hanya_absen'
  >('absen_dan_pilih');
  const [scanStatusToApply, setScanStatusToApply] = useState<AttendanceStatus>('Hadir');
  const [scanNotes, setScanNotes] = useState<string>('');
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null);
  const [printLayoutMode, setPrintLayoutMode] = useState<'grid_8' | 'grid_4'>('grid_8');

  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Modal state for enlarged student QR ID Card
  const [selectedQrModalStudent, setSelectedQrModalStudent] = useState<Student | null>(null);

  // Map of studentId -> generated QR DataURL
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});

  // Subscribe to storage sync changes so attendance updates live
  useEffect(() => {
    const refresh = () => {
      setAttendanceRecords(storageService.getAttendanceRecords());
    };
    const unsubscribe = storageService.onSyncChange(refresh);
    return () => {
      unsubscribe();
    };
  }, []);

  // Generate QR Code DataURLs for all students using fast cached SVG data URLs
  useEffect(() => {
    let isMounted = true;
    const generateAllQrCodes = async () => {
      const nextMap: Record<string, string> = {};
      for (const std of students) {
        if (!std || !std.id) continue;
        const url = await getCachedStudentQrDataUrl(std);
        if (url) {
          nextMap[std.id] = url;
        }
      }
      if (isMounted) {
        setQrDataUrls(nextMap);
      }
    };
    generateAllQrCodes();
    return () => {
      isMounted = false;
    };
  }, [students]);

  const showFeedback = (type: 'success' | 'warning' | 'error', message: string) => {
    setFeedbackBanner({ type, message });
    setTimeout(() => {
      setFeedbackBanner(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Map of studentId -> AttendanceRecord for selectedDate
  const dateAttendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendanceRecords.forEach(rec => {
      if (rec.date === selectedDate && !map.has(rec.studentId)) {
        map.set(rec.studentId, rec);
      }
    });
    return map;
  }, [attendanceRecords, selectedDate]);

  // Cumulative counts per student across all dates
  const cumulativeCountsMap = useMemo(() => {
    const map = new Map<
      string,
      { hadir: number; sakit: number; izin: number; alfa: number }
    >();
    students.forEach(s => {
      map.set(s.id, { hadir: 0, sakit: 0, izin: 0, alfa: 0 });
    });
    attendanceRecords.forEach(rec => {
      const cur = map.get(rec.studentId) || { hadir: 0, sakit: 0, izin: 0, alfa: 0 };
      if (rec.status === 'Hadir') cur.hadir += 1;
      else if (rec.status === 'Sakit') cur.sakit += 1;
      else if (rec.status === 'Izin') cur.izin += 1;
      else if (rec.status === 'Alfa') cur.alfa += 1;
      map.set(rec.studentId, cur);
    });
    return map;
  }, [attendanceRecords, students]);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return students
      .filter(std => {
        if (selectedClassFilter && std.classId !== selectedClassFilter) return false;
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const badgeId = buildStudentQrCodeBadgeId(std).toLowerCase();
          const matchName = std.name.toLowerCase().includes(q);
          const matchNis = (std.nis || '').toLowerCase().includes(q);
          const matchBadge = badgeId.includes(q);
          if (!matchName && !matchNis && !matchBadge) return false;
        }
        if (statusFilter !== 'all') {
          const rec = dateAttendanceMap.get(std.id);
          if (statusFilter === 'belum') {
            if (rec) return false;
          } else {
            if (!rec || rec.status !== statusFilter) return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const clsA = classes.find(c => c.id === a.classId)?.name || '';
        const clsB = classes.find(c => c.id === b.classId)?.name || '';
        const cmp = clsA.localeCompare(clsB);
        if (cmp !== 0) return cmp;
        return a.name.localeCompare(b.name);
      });
  }, [students, selectedClassFilter, searchTerm, statusFilter, dateAttendanceMap, classes]);

  // Daily Attendance Summary KPIs for selectedDate
  const dailySummary = useMemo(() => {
    const scopeStudents = students.filter(
      s => !selectedClassFilter || s.classId === selectedClassFilter
    );
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alfa = 0;
    let belum = 0;

    scopeStudents.forEach(s => {
      const rec = dateAttendanceMap.get(s.id);
      if (!rec) belum++;
      else if (rec.status === 'Hadir') hadir++;
      else if (rec.status === 'Sakit') sakit++;
      else if (rec.status === 'Izin') izin++;
      else if (rec.status === 'Alfa') alfa++;
    });

    const total = scopeStudents.length;
    const recorded = hadir + sakit + izin + alfa;
    const hadirPercent = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return {
      total,
      recorded,
      hadir,
      sakit,
      izin,
      alfa,
      belum,
      hadirPercent
    };
  }, [students, selectedClassFilter, dateAttendanceMap]);

  // Record or update attendance for a student on selectedDate
  const handleRecordAttendance = (
    student: Student,
    status: AttendanceStatus = 'Hadir',
    customNotes?: string,
    viaQrScan = false
  ) => {
    const existing = dateAttendanceMap.get(student.id);
    const defaultTeacherId =
      currentUser?.teacherId || student.teacherId || teachers[0]?.id || 't-1';
    const timeStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const resolvedNotes =
      customNotes && customNotes.trim() !== ''
        ? customNotes.trim()
        : viaQrScan
        ? `Scan QR/Barcode (${buildStudentQrCodeBadgeId(student)}) pukul ${timeStr}`
        : existing?.notes || `Presensi ${status} tercatat pukul ${timeStr}`;

    const record: AttendanceRecord = {
      id: existing?.id || `att-${student.id}-${selectedDate}`,
      studentId: student.id,
      teacherId: defaultTeacherId,
      date: selectedDate,
      status,
      notes: resolvedNotes
    };

    storageService.addAttendanceRecord(record);
    setAttendanceRecords(storageService.getAttendanceRecords());
    onAttendanceUpdated?.();

    showFeedback(
      'success',
      `Presensi ${student.name} (${buildStudentQrCodeBadgeId(student)}) berhasil dicatat sebagai "${status}" pada tanggal ${selectedDate}!`
    );
  };

  // Delete attendance record for a student on selectedDate
  const handleRemoveAttendance = (recordId: string, studentName: string) => {
    storageService.deleteAttendanceRecord(recordId);
    setAttendanceRecords(storageService.getAttendanceRecords());
    onAttendanceUpdated?.();
    showFeedback('warning', `Data presensi ${studentName} pada ${selectedDate} telah direset.`);
  };

  // Bulk mark all filtered students as Hadir
  const handleBulkMarkHadir = () => {
    const targetList = filteredStudents;
    if (targetList.length === 0) return;
    const timeStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    targetList.forEach(student => {
      const existing = dateAttendanceMap.get(student.id);
      if (!existing) {
        const record: AttendanceRecord = {
          id: `att-${student.id}-${selectedDate}`,
          studentId: student.id,
          teacherId: currentUser?.teacherId || student.teacherId || teachers[0]?.id || 't-1',
          date: selectedDate,
          status: 'Hadir',
          notes: `Presensi QR Kolektif (${buildStudentQrCodeBadgeId(student)}) pukul ${timeStr}`
        };
        storageService.addAttendanceRecord(record);
      }
    });

    setAttendanceRecords(storageService.getAttendanceRecords());
    onAttendanceUpdated?.();
    showFeedback(
      'success',
      `Berhasil mencatat kehadiran ("Hadir") untuk seluruh santri terfilter pada tanggal ${selectedDate}!`
    );
  };

  // Unified handler when a student QR or Barcode is scanned
  const handleStudentScanned = (matchedStudent: Student) => {
    setLastScannedStudent(matchedStudent);
    handleRecordAttendance(matchedStudent, scanStatusToApply, scanNotes, true);
    setScanNotes('');

    if (scanActionMode === 'absen_dan_hafalan' && onOpenDailyInputWithStudent) {
      onOpenDailyInputWithStudent(matchedStudent.id, 'quran');
    } else if (scanActionMode === 'absen_dan_ummi' && onOpenDailyInputWithStudent) {
      onOpenDailyInputWithStudent(matchedStudent.id, 'ummi');
    }
  };

  // Parse and process scanned QR code string from quick button
  const handleProcessQrScanInput = (rawCode: string, directTab?: 'quran' | 'ummi') => {
    const matchedStudent = findStudentByScannedCode(rawCode, students);
    if (!matchedStudent) {
      showFeedback(
        'error',
        `Kode QR/Barcode "${rawCode}" tidak ditemukan dalam daftar santri aktif.`
      );
      return;
    }

    setLastScannedStudent(matchedStudent);
    handleRecordAttendance(matchedStudent, scanStatusToApply, scanNotes, true);
    if (directTab && onOpenDailyInputWithStudent) {
      onOpenDailyInputWithStudent(matchedStudent.id, directTab);
    } else if (scanActionMode === 'absen_dan_hafalan' && onOpenDailyInputWithStudent) {
      onOpenDailyInputWithStudent(matchedStudent.id, 'quran');
    } else if (scanActionMode === 'absen_dan_ummi' && onOpenDailyInputWithStudent) {
      onOpenDailyInputWithStudent(matchedStudent.id, 'ummi');
    }
  };

  // Download individual QR Code card PNG
  const handleDownloadQrPng = (student: Student) => {
    const dataUrl = qrDataUrls[student.id];
    if (!dataUrl) return;

    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const clsName = classes.find(c => c.id === student.classId)?.name || '7A';
    const badgeId = buildStudentQrCodeBadgeId(student);

    // Card Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header Bar
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, canvas.width, 95);

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KARTU QR & BARCODE PRESENSI, HAFALAN & UMMI', canvas.width / 2, 36);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('SMP ISLAM AL AZHAR 21 SOLO BARU', canvas.width / 2, 65);

    // Gold Accent Line
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(0, 95, canvas.width, 6);

    const img = new window.Image();
    img.onload = () => {
      // Draw QR box border
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.strokeRect(110, 125, 260, 260);
      ctx.drawImage(img, 120, 135, 240, 240);

      // Student Details
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(student.name, canvas.width / 2, 425);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`NIS: ${student.nis || '-'}  •  KELAS: ${clsName}`, canvas.width / 2, 452);

      // Badge Pill
      ctx.fillStyle = '#FEF3C7';
      ctx.fillRect(120, 472, 240, 40);
      ctx.strokeStyle = '#D4AF37';
      ctx.strokeRect(120, 472, 240, 40);

      ctx.fillStyle = '#92400E';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(badgeId, canvas.width / 2, 497);

      ctx.fillStyle = '#64748B';
      ctx.font = '12px sans-serif';
      ctx.fillText(
        'Scan QR / Barcode untuk Absen, Input Hafalan & Metode Ummi',
        canvas.width / 2,
        548
      );

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `QR_Kartu_${student.name.replace(/\s+/g, '_')}_${student.nis || student.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = dataUrl;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#1E293B] to-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#D4AF37] text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                Sistem Cetak Kartu QR, Scan Barcode Absensi &amp; Input Hafalan / Ummi
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                Terintegrasi Absen, Hafalan &amp; Ummi
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Cetak kartu QR/Barcode santri (per siswa / per kelas A4) dan scan untuk absensi sekaligus input setoran Hafalan atau Ummi
            </p>
          </div>
        </div>

        {/* Date Picker & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-600 rounded-lg px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-[11px] font-bold text-slate-300">Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value || todayStr)}
              className="bg-transparent text-xs font-extrabold text-amber-300 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex flex-wrap items-center bg-slate-800 p-1 rounded-lg border border-slate-700 gap-1">
            <button
              type="button"
              onClick={() => setActiveMode('qr_cards')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeMode === 'qr_cards'
                  ? 'bg-[#D4AF37] text-slate-950 shadow-2xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Kartu QR Santri</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('qr_scanner')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeMode === 'qr_scanner'
                  ? 'bg-[#D4AF37] text-slate-950 shadow-2xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Scan Barcode / QR (Absen &amp; Input)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('print_cards')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeMode === 'print_cards'
                  ? 'bg-[#D4AF37] text-slate-950 shadow-2xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Print QR Siswa (A4)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('attendance_log')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeMode === 'attendance_log'
                  ? 'bg-[#D4AF37] text-slate-950 shadow-2xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Data Kehadiran ({dailySummary.recorded}/{dailySummary.total})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* Feedback Toast / Banner */}
        {feedbackBanner && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : feedbackBanner.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="p-1 hover:opacity-75 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Daily Attendance Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75 block">
              Total Santri
            </span>
            <p className="text-lg font-black mt-0.5">{dailySummary.total} Santri</p>
            <span className="text-[10px] opacity-75">
              {dailySummary.hadirPercent}% Hadir Hari Ini
            </span>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'Hadir' ? 'all' : 'Hadir')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              statusFilter === 'Hadir'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200 text-emerald-900'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">
              Hadir (QR / Manual)
            </span>
            <p className="text-lg font-black mt-0.5">{dailySummary.hadir} Santri</p>
            <span className="text-[10px] font-semibold">Tercatat Hadir</span>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'Sakit' ? 'all' : 'Sakit')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              statusFilter === 'Sakit'
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-blue-50/70 hover:bg-blue-100/70 border-blue-200 text-blue-900'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">
              Sakit (S)
            </span>
            <p className="text-lg font-black mt-0.5">{dailySummary.sakit} Santri</p>
            <span className="text-[10px] font-semibold">Izin Kesehatan</span>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'Izin' ? 'all' : 'Izin')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              statusFilter === 'Izin'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-200 text-amber-900'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">
              Izin (I)
            </span>
            <p className="text-lg font-black mt-0.5">{dailySummary.izin} Santri</p>
            <span className="text-[10px] font-semibold">Keperluan Resmi</span>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'Alfa' ? 'all' : 'Alfa')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              statusFilter === 'Alfa'
                ? 'bg-rose-700 text-white border-rose-700'
                : 'bg-rose-50/70 hover:bg-rose-100/70 border-rose-200 text-rose-900'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">
              Alfa (A)
            </span>
            <p className="text-lg font-black mt-0.5">{dailySummary.alfa} Santri</p>
            <span className="text-[10px] font-semibold">Tanpa Keterangan</span>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'belum' ? 'all' : 'belum')}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              statusFilter === 'belum'
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-slate-100/80 hover:bg-slate-200/70 border-slate-300 text-slate-700'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block">
              Belum Scan QR
            </span>
            <p className="text-lg font-black mt-0.5">{dailySummary.belum} Santri</p>
            <span className="text-[10px] font-semibold">Menunggu Presensi</span>
          </div>
        </div>

        {/* Search, Class Filter, & Bulk Print / Attendance Actions Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[210px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari nama santri, NIS, atau kode QR/Barcode (QR-AA21-...)..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              />
            </div>

            <select
              value={selectedClassFilter}
              onChange={e => setSelectedClassFilter(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="">Semua Kelas ({students.length} Santri)</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                printStudentQrCards(filteredStudents, classes, qrDataUrls, printLayoutMode)
              }
              className="px-3.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              title="Cetak / Print Kartu QR & Barcode untuk santri yang tampil saat ini"
            >
              <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Cetak / Print QR Siswa ({filteredStudents.length})</span>
            </button>

            {currentUser?.role !== 'wali' && dailySummary.belum > 0 && (
              <button
                type="button"
                onClick={handleBulkMarkHadir}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                title="Tandai Hadir untuk seluruh santri yang belum absen pada tanggal ini"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>Tandai Semua Hadir ({dailySummary.belum})</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODE 1: GENERATOR KARTU QR UNIK SETIAP SANTRI & PRESENSI CEPAT            */}
        {/* ========================================================================= */}
        {activeMode === 'qr_cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredStudents.length === 0 ? (
              <div className="col-span-full py-10 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Tidak ada santri yang sesuai dengan filter pencarian.
              </div>
            ) : (
              filteredStudents.map(student => {
                const cls = classes.find(c => c.id === student.classId);
                const qrUrl = qrDataUrls[student.id];
                const badgeId = buildStudentQrCodeBadgeId(student);
                const todayRec = dateAttendanceMap.get(student.id);
                const cum = cumulativeCountsMap.get(student.id) || {
                  hadir: 0,
                  sakit: 0,
                  izin: 0,
                  alfa: 0
                };

                const statusBadgeStyle = !todayRec
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : todayRec.status === 'Hadir'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : todayRec.status === 'Sakit'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : todayRec.status === 'Izin'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300';

                return (
                  <div
                    key={student.id}
                    className={`rounded-xl border p-3.5 transition flex flex-col justify-between gap-3 ${
                      todayRec?.status === 'Hadir'
                        ? 'bg-emerald-50/30 border-emerald-200 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Top Student Info & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div
                        onClick={() => onOpenStudentDetail?.(student.id)}
                        className="flex items-center gap-2.5 cursor-pointer group min-w-0"
                      >
                        <AvatarBadge
                          name={student.name}
                          photoUrl={student.photo}
                          gender={student.gender}
                          role="santri"
                          size="sm"
                          className="shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="text-xs font-extrabold text-slate-900 group-hover:text-[#8C7015] truncate">
                            {student.name}
                          </h3>
                          <p className="text-[10px] font-mono text-slate-500">
                            NIS: {student.nis || '-'} • Kls {cls?.name || '7A'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${statusBadgeStyle}`}
                      >
                        {todayRec ? todayRec.status : 'Belum Absen'}
                      </span>
                    </div>

                    {/* Center Unique QR Code Box */}
                    <div className="flex items-center gap-3 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/80">
                      <div
                        onClick={() => setSelectedQrModalStudent(student)}
                        className="w-20 h-20 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 cursor-pointer hover:ring-2 hover:ring-[#D4AF37] transition"
                        title="Klik untuk memperbesar / cetak Kartu QR Absensi Santri"
                      >
                        {qrUrl?.trim() ? (
                          <img
                            src={qrUrl.trim()}
                            alt={`QR ${student.name}`}
                            className="w-full h-full object-contain select-none"
                          />
                        ) : (
                          <QrCode className="w-8 h-8 text-slate-300 animate-pulse" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-100/80 text-amber-950 border border-amber-300 font-mono font-black text-[10px]">
                          {badgeId}
                        </span>
                        <p className="text-[10px] text-slate-500 leading-snug">
                          Rekap: <strong className="text-emerald-700">{cum.hadir}H</strong> •{' '}
                          <strong className="text-blue-700">{cum.sakit}S</strong> •{' '}
                          <strong className="text-amber-700">{cum.izin}I</strong> •{' '}
                          <strong className="text-rose-700">{cum.alfa}A</strong>
                        </p>
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              printStudentQrCards([student], classes, qrDataUrls, 'single')
                            }
                            className="px-2 py-0.5 rounded bg-[#1E293B] hover:bg-slate-800 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Cetak / Print Kartu QR Siswa Ini"
                          >
                            <Printer className="w-3 h-3 text-[#D4AF37]" />
                            <span>Print</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadQrPng(student)}
                            className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Unduh Kartu QR Santri (PNG)"
                          >
                            <Download className="w-3 h-3 text-[#8C7015]" />
                            <span>PNG</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedQrModalStudent(student)}
                            className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Lihat Kartu QR Penuh"
                          >
                            <Eye className="w-3 h-3 text-slate-600" />
                            <span>Kartu</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Direct Input Hafalan & Ummi Shortcuts */}
                    {onOpenDailyInputWithStudent && currentUser?.role !== 'wali' && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            handleRecordAttendance(student, 'Hadir', undefined, true);
                            onOpenDailyInputWithStudent(student.id, 'quran');
                          }}
                          className="py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                          title="Absen Hadir & Langsung Input Hafalan Al-Qur'an"
                        >
                          <BookOpen className="w-3 h-3 text-[#8C7015]" />
                          <span>+ Input Hafalan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            handleRecordAttendance(student, 'Hadir', undefined, true);
                            onOpenDailyInputWithStudent(student.id, 'ummi');
                          }}
                          className="py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[10px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                          title="Absen Hadir & Langsung Input Evaluasi Metode Ummi"
                        >
                          <BookMarked className="w-3 h-3 text-blue-700" />
                          <span>+ Input Ummi</span>
                        </button>
                      </div>
                    )}

                    {/* Bottom Quick Attendance Actions */}
                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleRecordAttendance(student, 'Hadir', undefined, true)}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          todayRec?.status === 'Hadir'
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-[#1E293B] hover:bg-slate-800 text-white'
                        }`}
                        title="Simulasikan Scan QR / Tandai Hadir Sekarang"
                      >
                        <ScanLine className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{todayRec?.status === 'Hadir' ? 'Tercatat Hadir' : 'Scan Hadir'}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {(['Sakit', 'Izin', 'Alfa'] as AttendanceStatus[]).map(st => {
                          const active = todayRec?.status === st;
                          const btnColor =
                            st === 'Sakit'
                              ? active
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                              : st === 'Izin'
                              ? active
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              : active
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';

                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleRecordAttendance(student, st)}
                              className={`w-7 h-7 rounded-lg border text-[10px] font-black transition cursor-pointer ${btnColor}`}
                              title={`Tandai ${st}`}
                            >
                              {st[0]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: SCAN BARCODE / QR CODE UNTUK ABSEN & INPUT HAFALAN ATAU UMMI      */}
        {/* ========================================================================= */}
        {activeMode === 'qr_scanner' && (
          <div className="space-y-5">
            {/* Action Mode Selector Strip */}
            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#8C7015]" />
                    <span>Pilih Mode Aksi Otomatis Saat Barcode / QR Siswa Di-Scan:</span>
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    Saat kartu santri di-scan melalui Kamera atau Alat Scanner Barcode, sistem akan otomatis mencatat kehadiran dan menjalankan aksi berikut
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-700">Status Absen:</span>
                  <select
                    value={scanStatusToApply}
                    onChange={e => setScanStatusToApply(e.target.value as AttendanceStatus)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="Hadir">Hadir (Tepat Waktu)</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Izin">Izin</option>
                    <option value="Alfa">Alfa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  {
                    id: 'absen_dan_pilih',
                    label: '1. Absen + Pilih Hafalan / Ummi',
                    desc: 'Catat Hadir & tampilkan tombol cepat Input Hafalan atau Ummi'
                  },
                  {
                    id: 'absen_dan_hafalan',
                    label: '2. Absen + Langsung Input Hafalan',
                    desc: 'Catat Hadir & otomatis buka form Setoran Hafalan Al-Qur\'an'
                  },
                  {
                    id: 'absen_dan_ummi',
                    label: '3. Absen + Langsung Input Ummi',
                    desc: 'Catat Hadir & otomatis buka form Evaluasi Metode Ummi'
                  },
                  {
                    id: 'hanya_absen',
                    label: '4. Hanya Absen Harian Beruntun',
                    desc: 'Scan banyak kartu santri secara cepat khusus presensi'
                  }
                ].map(item => {
                  const active = scanActionMode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setScanActionMode(item.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        active
                          ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs'
                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      <span
                        className={`block text-xs font-extrabold ${
                          active ? 'text-[#D4AF37]' : 'text-slate-900'
                        }`}
                      >
                        {item.label}
                      </span>
                      <span
                        className={`block text-[10px] mt-0.5 ${
                          active ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Live Camera + Hardware Barcode Scanner + Scanned Student Action Card */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <CameraAndBarcodeScannerBox
                    students={students}
                    classes={classes}
                    onStudentScanned={std => handleStudentScanned(std)}
                  />
                </div>

                {/* Scanned Student Action Panel (Appears immediately when a student is scanned) */}
                {lastScannedStudent && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-amber-50 border-2 border-[#D4AF37] shadow-md space-y-3 animate-in fade-in">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <AvatarBadge
                          name={lastScannedStudent.name}
                          photoUrl={lastScannedStudent.photo}
                          gender={lastScannedStudent.gender}
                          role="santri"
                          size="md"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                              ✓ SCAN BERHASIL &amp; ABSEN TERCATAT
                            </span>
                            <span className="font-mono text-[10px] font-black text-[#8C7015]">
                              {buildStudentQrCodeBadgeId(lastScannedStudent)}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 mt-0.5">
                            {lastScannedStudent.name}
                          </h4>
                          <p className="text-[11px] text-slate-600">
                            Kelas{' '}
                            <strong>
                              {classes.find(c => c.id === lastScannedStudent.classId)?.name || '7A'}
                            </strong>{' '}
                            • Capaian: <strong>{lastScannedStudent.totalJuzHafal} Juz</strong> •
                            Terakhir: <strong>{lastScannedStudent.lastHafalan || '-'}</strong>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setLastScannedStudent(null)}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80">
                      <p className="text-[11px] font-extrabold text-slate-700 mb-2">
                        Lanjutkan Input Nilai untuk {lastScannedStudent.name}:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {onOpenDailyInputWithStudent && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                onOpenDailyInputWithStudent(lastScannedStudent.id, 'quran')
                              }
                              className="py-2.5 px-3 rounded-xl bg-[#1E293B] hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                              <span>+ Input Hafalan</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onOpenDailyInputWithStudent(lastScannedStudent.id, 'ummi')
                              }
                              className="py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <BookMarked className="w-4 h-4 text-amber-300" />
                              <span>+ Input Ummi</span>
                            </button>
                          </>
                        )}

                        {onOpenPreviousHafalan && (
                          <button
                            type="button"
                            onClick={() => onOpenPreviousHafalan(lastScannedStudent.id)}
                            className="py-2.5 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <History className="w-4 h-4 text-[#8C7015]" />
                            <span>+ Hafalan Lalu</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Instant 1-Click Scan & Direct Hafalan/Ummi List */}
              <div className="lg:col-span-6 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Daftar Cepat Scan Barcode / QR &amp; Input Santri ({filteredStudents.length}{' '}
                      Santri)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Klik tombol <strong>Scan Absen</strong>, <strong>+ Hafalan</strong>, atau{' '}
                      <strong>+ Ummi</strong> pada baris santri
                    </p>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {filteredStudents.map(std => {
                    const rec = dateAttendanceMap.get(std.id);
                    const badgeId = buildStudentQrCodeBadgeId(std);
                    const clsName = classes.find(c => c.id === std.classId)?.name || '7A';

                    return (
                      <div
                        key={std.id}
                        className="p-2.5 flex flex-wrap items-center justify-between gap-2 hover:bg-slate-50 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {std.name}{' '}
                            <span className="text-[10px] font-semibold text-slate-500">
                              (Kls {clsName})
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-[#8C7015] font-bold">
                            {badgeId} • NIS: {std.nis || '-'}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          {rec && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {rec.status}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleProcessQrScanInput(buildStudentAttendanceQrPayload(std))
                            }
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-[#D4AF37] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            title="Scan Absen Kehadiran"
                          >
                            <ScanLine className="w-3 h-3 text-[#8C7015]" />
                            <span>Scan Absen</span>
                          </button>

                          {onOpenDailyInputWithStudent && currentUser?.role !== 'wali' && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleProcessQrScanInput(
                                    buildStudentAttendanceQrPayload(std),
                                    'quran'
                                  )
                                }
                                className="px-2 py-1 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                title="Scan Absen + Langsung Input Hafalan Al-Qur'an"
                              >
                                <BookOpen className="w-3 h-3 text-[#D4AF37]" />
                                <span>+ Hafalan</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleProcessQrScanInput(
                                    buildStudentAttendanceQrPayload(std),
                                    'ummi'
                                  )
                                }
                                className="px-2 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                title="Scan Absen + Langsung Input Metode Ummi"
                              >
                                <BookMarked className="w-3 h-3 text-amber-300" />
                                <span>+ Ummi</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 3: CETAK / PRINT LEMBAR KARTU QR & BARCODE SISWA (A4 SIAP GUNTING)   */}
        {/* ========================================================================= */}
        {activeMode === 'print_cards' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#D4AF37] flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  <span>Pratinjau Cetak Kartu QR &amp; Barcode Siswa (Kertas A4)</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Menampilkan <strong>{filteredStudents.length} Kartu Santri</strong> siap cetak
                  lengkap dengan QR Code 2D dan Barcode 1D untuk ditempel pada buku mutaba&apos;ah / ID Card
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrintLayoutMode('grid_8')}
                    className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                      printLayoutMode === 'grid_8'
                        ? 'bg-[#D4AF37] text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Ukuran Standar (8/Hal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintLayoutMode('grid_4')}
                    className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                      printLayoutMode === 'grid_4'
                        ? 'bg-[#D4AF37] text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Ukuran Besar (4/Hal)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    printStudentQrCards(filteredStudents, classes, qrDataUrls, printLayoutMode)
                  }
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2c] text-slate-950 font-black text-xs shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Sekarang / Simpan PDF ({filteredStudents.length} Kartu)</span>
                </button>
              </div>
            </div>

            {/* Visual Sheet Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStudents.map(std => {
                const clsName = classes.find(c => c.id === std.classId)?.name || '7A';
                const badgeId = buildStudentQrCodeBadgeId(std);
                const qrUrl = qrDataUrls[std.id];
                const barcodeUrl = buildBarcodeSvgDataUrl(badgeId);

                return (
                  <div
                    key={std.id}
                    className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs flex flex-col justify-between"
                  >
                    <div className="bg-[#1E293B] text-white text-center py-2 px-3 border-b-2 border-[#D4AF37]">
                      <p className="text-[9px] font-extrabold text-[#D4AF37] tracking-wider uppercase">
                        KARTU PRESENSI, HAFALAN &amp; UMMI
                      </p>
                      <p className="text-[11px] font-black">
                        SMP ISLAM AL AZHAR 21 SOLO BARU
                      </p>
                    </div>

                    <div className="p-3.5 text-center space-y-2">
                      <div className="w-28 h-28 mx-auto p-1.5 rounded-lg border-2 border-[#D4AF37] bg-white flex items-center justify-center">
                        {qrUrl?.trim() ? (
                          <img
                            src={qrUrl.trim()}
                            alt={std.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <QrCode className="w-10 h-10 text-slate-300" />
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-slate-900 truncate">
                          {std.name}
                        </h4>
                        <p className="text-[10px] font-semibold text-slate-500">
                          NIS: <strong>{std.nis || '-'}</strong> • Kelas{' '}
                          <strong>{clsName}</strong> • {std.program || 'Reguler'}
                        </p>
                      </div>

                      {/* 1D Barcode Box */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 max-w-[200px] mx-auto">
                        <img
                          src={barcodeUrl}
                          alt={`Barcode ${badgeId}`}
                          className="h-5 w-full object-fill"
                        />
                        <span className="block font-mono text-[10px] font-black text-[#8C7015] mt-0.5">
                          {badgeId}
                        </span>
                      </div>

                      <div className="pt-1 flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            printStudentQrCards([std], classes, qrDataUrls, 'single')
                          }
                          className="px-2.5 py-1 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3 text-[#D4AF37]" />
                          <span>Cetak Kartu Ini</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadQrPng(std)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3 text-[#8C7015]" />
                          <span>PNG</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 4: TABEL REKAP & LOG DATA KEHADIRAN TERINTEGRASI                     */}
        {/* ========================================================================= */}
        {activeMode === 'attendance_log' && (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-extrabold text-[11px]">
                  <th className="py-2.5 px-3 text-center w-10">No</th>
                  <th className="py-2.5 px-3">Kode QR Unik</th>
                  <th className="py-2.5 px-3">Nama Lengkap Santri</th>
                  <th className="py-2.5 px-3 text-center">Kelas</th>
                  <th className="py-2.5 px-3 text-center">Status ({selectedDate})</th>
                  <th className="py-2.5 px-3">Catatan Log QR / Waktu</th>
                  <th className="py-2.5 px-3 text-center">Akumulasi Semester (H/S/I/A)</th>
                  <th className="py-2.5 px-3 text-center">Ubah Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((std, idx) => {
                  const clsName = classes.find(c => c.id === std.classId)?.name || '7A';
                  const rec = dateAttendanceMap.get(std.id);
                  const badgeId = buildStudentQrCodeBadgeId(std);
                  const cum = cumulativeCountsMap.get(std.id) || {
                    hadir: 0,
                    sakit: 0,
                    izin: 0,
                    alfa: 0
                  };

                  return (
                    <tr key={std.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#8C7015] text-[11px]">
                        {badgeId}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {std.name}
                        <span className="block text-[10px] font-mono text-slate-400 font-normal">
                          NIS: {std.nis || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">{clsName}</td>
                      <td className="py-2.5 px-3 text-center">
                        {rec ? (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              rec.status === 'Hadir'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : rec.status === 'Sakit'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : rec.status === 'Izin'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {rec.status}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum Absen</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600">
                        {rec?.notes || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                        <span className="text-emerald-700 font-bold">{cum.hadir}H</span> /{' '}
                        <span className="text-blue-700 font-bold">{cum.sakit}S</span> /{' '}
                        <span className="text-amber-700 font-bold">{cum.izin}I</span> /{' '}
                        <span className="text-rose-700 font-bold">{cum.alfa}A</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {(['Hadir', 'Sakit', 'Izin', 'Alfa'] as AttendanceStatus[]).map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleRecordAttendance(std, st)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                                rec?.status === st
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {st[0]}
                            </button>
                          ))}
                          {rec && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAttendance(rec.id, std.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Reset Presensi Tanggal Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL KARTU QR ABSENSI INDIVIDU SANTRI */}
      {selectedQrModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-[#1E293B] text-white p-4 text-center relative">
              <button
                type="button"
                onClick={() => setSelectedQrModalStudent(null)}
                className="absolute right-3 top-3 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37]">
                Kartu QR &amp; Barcode Presensi Santri
              </p>
              <h3 className="text-sm font-black mt-0.5">
                SMP ISLAM AL AZHAR 21 SOLO BARU
              </h3>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="w-48 h-48 mx-auto p-3 rounded-2xl bg-white border-2 border-[#D4AF37] shadow-xs flex items-center justify-center">
                {qrDataUrls[selectedQrModalStudent.id]?.trim() ? (
                  <img
                    src={qrDataUrls[selectedQrModalStudent.id].trim()}
                    alt={selectedQrModalStudent.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <QrCode className="w-16 h-16 text-slate-300" />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 max-w-[220px] mx-auto">
                  <img
                    src={buildBarcodeSvgDataUrl(buildStudentQrCodeBadgeId(selectedQrModalStudent))}
                    alt="Barcode"
                    className="h-5 w-full object-fill"
                  />
                  <span className="block font-mono font-black text-xs text-[#8C7015] mt-0.5">
                    {buildStudentQrCodeBadgeId(selectedQrModalStudent)}
                  </span>
                </div>

                <h4 className="text-base font-black text-slate-900 pt-1">
                  {selectedQrModalStudent.name}
                </h4>
                <p className="text-xs font-semibold text-slate-500">
                  NIS: {selectedQrModalStudent.nis || '-'} • Kelas{' '}
                  {classes.find(c => c.id === selectedQrModalStudent.classId)?.name || '7A'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    printStudentQrCards(
                      [selectedQrModalStudent],
                      classes,
                      qrDataUrls,
                      'single'
                    )
                  }
                  className="py-2 px-3 rounded-xl bg-[#1E293B] hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#D4AF37]" />
                  <span>Cetak / Print Kartu</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadQrPng(selectedQrModalStudent)}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#8C7015]" />
                  <span>Unduh PNG</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleRecordAttendance(selectedQrModalStudent, 'Hadir', undefined, true);
                    setSelectedQrModalStudent(null);
                  }}
                  className="py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ScanLine className="w-4 h-4 text-amber-300" />
                  <span>Scan Absen Hadir Sekarang</span>
                </button>

                {onOpenDailyInputWithStudent && currentUser?.role !== 'wali' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleRecordAttendance(selectedQrModalStudent, 'Hadir', undefined, true);
                        const sid = selectedQrModalStudent.id;
                        setSelectedQrModalStudent(null);
                        onOpenDailyInputWithStudent(sid, 'quran');
                      }}
                      className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#8C7015]" />
                      <span>+ Input Hafalan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleRecordAttendance(selectedQrModalStudent, 'Hadir', undefined, true);
                        const sid = selectedQrModalStudent.id;
                        setSelectedQrModalStudent(null);
                        onOpenDailyInputWithStudent(sid, 'ummi');
                      }}
                      className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <BookMarked className="w-3.5 h-3.5 text-blue-700" />
                      <span>+ Input Ummi</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
