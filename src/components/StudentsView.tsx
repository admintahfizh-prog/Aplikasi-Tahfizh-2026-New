import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Search, 
  Filter, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Eye, 
  Phone, 
  Award, 
  BookOpen, 
  BookMarked, 
  CheckCircle2, 
  AlertCircle, 
  X,
  FileText,
  UserPlus,
  KeyRound,
  Sparkles,
  Share2,
  Save,
  EyeOff,
  Users,
  QrCode,
  ScanLine,
  History,
  Printer,
  Camera
} from 'lucide-react';
import { Student, Teacher, ClassItem, Role, User, HalaqahGroup, AttendanceRecord } from '../types';
import { storageService } from '../services/storageService';
import { UMMI_JILIDS } from '../data/ummiData';
import { AvatarBadge } from './AvatarBadge';
import { isGrade8or9Student, isGrade8or9Class } from '../utils/gradeHelper';
import { HalaqahFilterBar } from './HalaqahFilterBar';
import { 
  filterStudentsByHalaqah, 
  groupStudentsByHalaqah, 
  resolveCurrentTeacher, 
  getStudentHalaqahInfo 
} from '../utils/halaqahHelper';
import {
  QrAttendancePanel,
  buildStudentAttendanceQrPayload,
  buildStudentQrCodeBadgeId,
  getCachedStudentQrDataUrl
} from './QrAttendancePanel';
import { ScannerView, ScannerWorkflowMode } from './ScannerView';
import { PreviousHafalanModal } from './PreviousHafalanModal';
import {
  printStudentQrCards,
  buildBarcodeSvgDataUrl
} from '../utils/qrPrintAndScanUtils';

interface StudentsViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassItem[];
  userRole: Role;
  currentUser?: User | null;
  halaqahGroups?: HalaqahGroup[];
  onOpenStudentDetail: (studentId: string) => void;
  onRefreshData: () => void;
  onOpenDailyInputWithStudent: (studentId: string, tab?: 'quran' | 'ummi' | 'presensi') => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  teachers,
  classes,
  userRole,
  currentUser,
  halaqahGroups = [],
  onOpenStudentDetail,
  onRefreshData,
  onOpenDailyInputWithStudent
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('');
  const [selectedHalaqahFilter, setSelectedHalaqahFilter] = useState('all');
  const [viewGroupingMode, setViewGroupingMode] = useState<'halaqah' | 'class'>('halaqah');

  // Resolved teacher
  const currentTeacher = resolveCurrentTeacher(currentUser, teachers) || (userRole === 'admin' ? teachers[0] : undefined);
  const activeHalaqahGroups = halaqahGroups.length > 0 ? halaqahGroups : storageService.getHalaqahGroups();

  // Modal States
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Student | null>(null);

  // Unified QR Code, Camera ScannerView & Previous Hafalan States inside Data Siswa
  const [activeStudentSubTab, setActiveStudentSubTab] = useState<
    'profil_dan_qr' | 'scanner_view' | 'panel_qr_absensi'
  >('profil_dan_qr');
  const [scannerWorkflowMode, setScannerWorkflowMode] =
    useState<ScannerWorkflowMode>('lookup_and_attendance');
  const [qrPanelInitialMode, setQrPanelInitialMode] = useState<
    'qr_cards' | 'qr_scanner' | 'print_cards' | 'attendance_log'
  >('qr_cards');
  const [showPreviousHafalanModal, setShowPreviousHafalanModal] = useState(false);
  const [previousHafalanStudentId, setPreviousHafalanStudentId] = useState<string | undefined>(undefined);
  const [qrModalStudent, setQrModalStudent] = useState<Student | null>(null);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    storageService.getAttendanceRecords()
  );
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const refreshAtt = () => setAttendanceRecords(storageService.getAttendanceRecords());
    const unsub = storageService.onSyncChange(refreshAtt);
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const genQr = async () => {
      const next: Record<string, string> = {};
      for (const s of students) {
        if (!s || !s.id) continue;
        const url = await getCachedStudentQrDataUrl(s);
        if (url) {
          next[s.id] = url;
        }
      }
      if (mounted) setQrDataUrls(next);
    };
    genQr();
    return () => {
      mounted = false;
    };
  }, [students]);

  const handleOpenPreviousHafalan = (studentId?: string) => {
    setPreviousHafalanStudentId(studentId);
    setShowPreviousHafalanModal(true);
  };

  const handleQuickMarkHadirToday = (student: Student) => {
    const existing = attendanceRecords.find(
      r => r.studentId === student.id && r.date === todayStr
    );
    const timeStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const rec: AttendanceRecord = {
      id: existing?.id || `att-${student.id}-${todayStr}`,
      studentId: student.id,
      teacherId: currentTeacher?.id || student.teacherId || teachers[0]?.id || 't-1',
      date: todayStr,
      status: 'Hadir',
      notes: `Scan QR Unik (${buildStudentQrCodeBadgeId(student)}) pukul ${timeStr}`
    };
    storageService.addAttendanceRecord(rec);
    setAttendanceRecords(storageService.getAttendanceRecords());
    onRefreshData();
  };

  const handleDownloadStudentQrPng = (student: Student) => {
    const dataUrl = qrDataUrls[student.id];
    if (!dataUrl) return;
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const clsName = classes.find(c => c.id === student.classId)?.name || '7A';
    const badgeId = buildStudentQrCodeBadgeId(student);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, canvas.width, 95);
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KARTU QR PRESENSI HARIAN TAHFIZH & UMMI', canvas.width / 2, 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('SMP ISLAM AL AZHAR 21 SOLO BARU', canvas.width / 2, 65);
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(0, 95, canvas.width, 6);

    const img = new window.Image();
    img.onload = () => {
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.strokeRect(110, 130, 260, 260);
      ctx.drawImage(img, 120, 140, 240, 240);
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(student.name, canvas.width / 2, 435);
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`NIS: ${student.nis || '-'}  •  KELAS: ${clsName}`, canvas.width / 2, 465);
      ctx.fillStyle = '#FEF3C7';
      ctx.fillRect(130, 488, 220, 36);
      ctx.strokeStyle = '#D4AF37';
      ctx.strokeRect(130, 488, 220, 36);
      ctx.fillStyle = '#92400E';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(badgeId, canvas.width / 2, 511);
      ctx.fillStyle = '#64748B';
      ctx.font = '12px sans-serif';
      ctx.fillText('Scan QR ini untuk absensi kehadiran halaqah harian', canvas.width / 2, 560);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `QR_Absensi_${student.name.replace(/\s+/g, '_')}_${student.nis || student.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = dataUrl;
  };

  // Student Password Modal State
  const [passwordModalStudent, setPasswordModalStudent] = useState<Student | null>(null);
  const [studentUserAccount, setStudentUserAccount] = useState<User | null>(null);
  const [studentPasswordInput, setStudentPasswordInput] = useState('');
  const [studentUsernameInput, setStudentUsernameInput] = useState('');
  const [showStudentPassEye, setShowStudentPassEye] = useState(false);

  const handleOpenStudentPasswordModal = (student: Student) => {
    let u = storageService.getUserByStudentId(student.id);
    if (!u) {
      u = {
        id: `usr-s-${student.id}`,
        name: `${student.name} (${student.nickname || 'Santri'})`,
        username: student.nis,
        password: 'santri21',
        email: student.parentEmail || `${student.nis}@santri.smpialazhar21.sch.id`,
        role: 'wali',
        avatar: student.photo,
        title: `Wali Santri / Siswa (${student.parentName || student.name})`,
        phone: student.parentPhone,
        studentId: student.id
      };
      storageService.saveUser(u);
    }
    setPasswordModalStudent(student);
    setStudentUserAccount(u);
    setStudentUsernameInput(u.username || student.nis);
    setStudentPasswordInput(u.password || 'santri21');
  };

  const handleSaveStudentPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalStudent || !studentUserAccount) return;
    const updated: User = {
      ...studentUserAccount,
      username: studentUsernameInput.trim().toLowerCase(),
      password: studentPasswordInput.trim()
    };
    storageService.saveUser(updated);
    setPasswordModalStudent(null);
    onRefreshData();
    alert(`Kata sandi akun santri/wali ${passwordModalStudent.name} berhasil diperbarui!`);
  };

  // Helper for halaqah normalization (Akselerasi, Reguler, Khusus)
  const normalizeHalaqah = (prog?: string): string => {
    if (!prog) return 'Reguler';
    const p = prog.toLowerCase();
    if (p.includes('aksel') || p.includes('unggul')) return 'Akselerasi';
    if (p.includes('khusus') || p.includes('takhassus')) return 'Khusus';
    return 'Reguler';
  };

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    nis: '',
    nisn: '',
    name: '',
    nickname: '',
    gender: 'L',
    classId: classes[0]?.id || '',
    teacherId: teachers[0]?.id || '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    program: 'Akselerasi',
    targetJuz: 4.0,
    currentUmmiJilid: 'Jilid 1',
    currentUmmiPage: 1,
    photo: '',
    entryYear: '2026',
    totalJuzHafal: 0,
    totalSurahHafal: 0,
    totalAyahHafal: 0,
    lastHafalan: '-',
    lastHafalanDate: '-',
    avgScore: 0
  });

  // CSV Import State
  const [csvContent, setCsvContent] = useState('');
  const [importResult, setImportResult] = useState<{ successCount: number; errors: string[] } | null>(null);

  // Filter students
  const filteredStudents = useMemo(() => {
    let list = students.filter(s => {
      const matchSearch = 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nisn.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchClass = !selectedClassFilter || s.classId === selectedClassFilter;
      const matchTeacher = !selectedTeacherFilter || s.teacherId === selectedTeacherFilter;
      const matchProgram = !selectedProgramFilter || normalizeHalaqah(s.program) === selectedProgramFilter;

      return matchSearch && matchClass && matchTeacher && matchProgram;
    });

    if (selectedHalaqahFilter !== 'all') {
      list = filterStudentsByHalaqah(list, selectedHalaqahFilter, currentTeacher?.id, activeHalaqahGroups, teachers);
    }
    return list;
  }, [students, searchTerm, selectedClassFilter, selectedTeacherFilter, selectedProgramFilter, selectedHalaqahFilter, currentTeacher, activeHalaqahGroups, teachers]);

  // Grouping per Halaqah
  const groupedHalaqahList = useMemo(() => {
    return groupStudentsByHalaqah(
      filteredStudents, 
      activeHalaqahGroups, 
      teachers, 
      selectedHalaqahFilter, 
      currentTeacher?.id
    );
  }, [filteredStudents, activeHalaqahGroups, teachers, selectedHalaqahFilter, currentTeacher]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      nis: `26070${Math.floor(10 + Math.random() * 90)}`,
      nisn: `01123456${Math.floor(10 + Math.random() * 90)}`,
      name: '',
      nickname: '',
      gender: 'L',
      classId: classes[0]?.id || '',
      teacherId: teachers[0]?.id || '',
      parentName: '',
      parentPhone: '0812',
      parentEmail: '',
      program: 'Akselerasi',
      targetJuz: 4.0,
      currentUmmiJilid: 'Jilid 1',
      currentUmmiPage: 1,
      photo: '',
      entryYear: '2026',
      totalJuzHafal: 0,
      totalSurahHafal: 0,
      totalAyahHafal: 0,
      lastHafalan: '-',
      lastHafalanDate: '-',
      avgScore: 0
    });
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ ...student });
    setShowAddEditModal(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nis) {
      alert('Nama dan NIS wajib diisi.');
      return;
    }

    const nextJilid = formData.currentUmmiJilid || 'Jilid 1';
    const nextPage = Number(formData.currentUmmiPage) || 1;
    const studentToSave: Student = {
      ...(editingStudent || {
        id: 'std-' + Date.now(),
        totalJuzHafal: 0,
        totalSurahHafal: 0,
        totalAyahHafal: 0,
        lastHafalan: '-',
        lastHafalanDate: '-',
        avgScore: 0
      }),
      ...formData,
      targetJuz: Number(formData.targetJuz) || 4.0,
      currentUmmiJilid: nextJilid,
      currentUmmiPage: nextPage,
      raportUmmiCapaian: nextJilid !== '-' ? `${nextJilid} halaman ${nextPage}` : '-'
    } as Student;

    storageService.saveStudent(studentToSave);
    setShowAddEditModal(false);
    onRefreshData();
  };

  const handleDeleteStudent = () => {
    if (showDeleteConfirm) {
      storageService.deleteStudent(showDeleteConfirm.id);
      setShowDeleteConfirm(null);
      onRefreshData();
    }
  };

  const handleDownloadTemplate = () => {
    const template = storageService.generateStudentCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_import_siswa_tahfizh.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const csv = storageService.exportStudentsToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `data_siswa_tahfizh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvContent(text);
      };
      reader.readAsText(file);
    }
  };

  const handleProcessImport = () => {
    if (!csvContent.trim()) {
      alert('Silakan upload file CSV atau tempelkan data CSV.');
      return;
    }
    const result = storageService.importStudentsCSV(csvContent);
    setImportResult(result);
    if (result.successCount > 0) {
      onRefreshData();
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#D4AF37]" />
            Data Santri, QR Presensi &amp; Riwayat Hafalan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen profil santri, QR Code unik absensi harian, input hafalan sebelum-sebelumnya, dan jilid Ummi ({students.length} santri)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setScannerWorkflowMode('lookup_and_attendance');
              setActiveStudentSubTab('scanner_view');
            }}
            className="px-3.5 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#c49f2c] text-slate-950 text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Buka Kamera Scanner QR untuk Identifikasi Cepat (Quick Lookup) & Presensi Santri"
          >
            <Camera className="w-4 h-4 text-slate-950" />
            <span>Kamera Scanner QR (Lookup &amp; Absen)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setQrPanelInitialMode('qr_scanner');
              setActiveStudentSubTab('panel_qr_absensi');
            }}
            className="px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-extrabold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Scan Barcode / QR Siswa untuk Absen Harian sekaligus Input Hafalan atau Metode Ummi"
          >
            <ScanLine className="w-4 h-4 text-[#D4AF37]" />
            <span>Scan &amp; Input Setoran</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setQrPanelInitialMode('print_cards');
              setActiveStudentSubTab('panel_qr_absensi');
            }}
            className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-[#D4AF37] text-xs font-extrabold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Cetak / Print Kartu QR & Barcode Siswa (Format A4 Siap Gunting)"
          >
            <Printer className="w-4 h-4 text-[#8C7015]" />
            <span>Cetak / Print QR Siswa</span>
          </button>

          {userRole !== 'wali' && (
            <>
              <button
                type="button"
                onClick={() => handleOpenPreviousHafalan(undefined)}
                className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Input riwayat setoran hafalan sebelum-sebelumnya atau capaian awal santri"
              >
                <History className="w-4 h-4 text-amber-300" />
                <span>+ Input Hafalan Sebelumnya</span>
              </button>

              <button
                id="btn-import-csv"
                onClick={() => {
                  setImportResult(null);
                  setCsvContent('');
                  setShowImportModal(true);
                }}
                className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Import CSV</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                id="btn-add-student"
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                <span>+ Tambah Siswa</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mode Switcher Bar: Data Siswa vs ScannerView vs Panel QR Code & Cetak QR */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
        <button
          type="button"
          onClick={() => setActiveStudentSubTab('profil_dan_qr')}
          className={`py-2.5 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeStudentSubTab === 'profil_dan_qr'
              ? 'bg-[#1E293B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 text-[#D4AF37]" />
          <span>1. Daftar Kartu Santri ({filteredStudents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setScannerWorkflowMode('lookup_and_attendance');
            setActiveStudentSubTab('scanner_view');
          }}
          className={`py-2.5 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeStudentSubTab === 'scanner_view'
              ? 'bg-[#1E293B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Camera className="w-4 h-4 text-[#D4AF37]" />
          <span>2. Kamera Scanner QR (Lookup &amp; Absen)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setQrPanelInitialMode('qr_scanner');
            setActiveStudentSubTab('panel_qr_absensi');
          }}
          className={`py-2.5 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeStudentSubTab === 'panel_qr_absensi' && qrPanelInitialMode === 'qr_scanner'
              ? 'bg-[#1E293B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ScanLine className="w-4 h-4 text-[#D4AF37]" />
          <span>3. Panel Scan &amp; Input Hafalan/Ummi</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setQrPanelInitialMode('print_cards');
            setActiveStudentSubTab('panel_qr_absensi');
          }}
          className={`py-2.5 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeStudentSubTab === 'panel_qr_absensi' && qrPanelInitialMode === 'print_cards'
              ? 'bg-[#1E293B] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Printer className="w-4 h-4 text-[#D4AF37]" />
          <span>4. Cetak / Print Kartu QR Siswa (A4)</span>
        </button>
      </div>

      {activeStudentSubTab === 'scanner_view' ? (
        <ScannerView
          students={students}
          teachers={teachers}
          classes={classes}
          currentUser={currentUser}
          halaqahGroups={activeHalaqahGroups}
          initialWorkflowMode={scannerWorkflowMode}
          onOpenStudentDetail={onOpenStudentDetail}
          onLookupStudentInList={(student) => {
            setSearchTerm(student.nis || student.name);
            setSelectedClassFilter('');
            setSelectedTeacherFilter('');
            setSelectedProgramFilter('');
            setSelectedHalaqahFilter('all');
            setActiveStudentSubTab('profil_dan_qr');
          }}
          onOpenDailyInputWithStudent={onOpenDailyInputWithStudent}
          onOpenPreviousHafalan={handleOpenPreviousHafalan}
          onAttendanceUpdated={() => {
            setAttendanceRecords(storageService.getAttendanceRecords());
            onRefreshData();
          }}
          onClose={() => setActiveStudentSubTab('profil_dan_qr')}
        />
      ) : activeStudentSubTab === 'panel_qr_absensi' ? (
        <QrAttendancePanel
          students={students}
          teachers={teachers}
          classes={classes}
          currentUser={currentUser}
          onOpenStudentDetail={onOpenStudentDetail}
          onOpenDailyInputWithStudent={onOpenDailyInputWithStudent}
          onOpenPreviousHafalan={handleOpenPreviousHafalan}
          initialActiveMode={qrPanelInitialMode}
          onAttendanceUpdated={() => {
            setAttendanceRecords(storageService.getAttendanceRecords());
            onRefreshData();
          }}
        />
      ) : (
        <>
          {/* Halaqah Filter Bar with Halaqah Saya and Grouping Mode */}
          <HalaqahFilterBar
        halaqahGroups={activeHalaqahGroups}
        teachers={teachers}
        currentUser={currentUser}
        selectedHalaqahFilter={selectedHalaqahFilter}
        onHalaqahFilterChange={(val) => {
          setSelectedHalaqahFilter(val);
          if (val === 'my-halaqah' || val !== 'all') {
            setViewGroupingMode('halaqah');
          }
        }}
        viewGroupingMode={viewGroupingMode}
        onViewGroupingModeChange={setViewGroupingMode}
        totalFilteredCount={filteredStudents.length}
        showGroupingToggle={true}
      />

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Box + Quick Camera QR Lookup Button */}
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama siswa, NIS, NISN..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setScannerWorkflowMode('quick_lookup');
                setActiveStudentSubTab('scanner_view');
              }}
              className="px-2.5 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-[#D4AF37] text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              title="Scan QR Code dengan Kamera untuk Mencari / Identifikasi Siswa"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>
          </div>

          {/* Filter Kelas */}
          <div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="">Semua Kelas ({classes.length})</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Guru */}
          <div>
            <select
              value={selectedTeacherFilter}
              onChange={(e) => setSelectedTeacherFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="">Semua Guru Tahfizh ({teachers.length})</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Program / Halaqah */}
          <div>
            <select
              value={selectedProgramFilter}
              onChange={(e) => setSelectedProgramFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="">Semua Pilihan Halaqah</option>
              <option value="Akselerasi">Akselerasi</option>
              <option value="Reguler">Reguler</option>
              <option value="Khusus">Khusus</option>
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Menampilkan <strong>{filteredStudents.length}</strong> dari <strong>{students.length}</strong> siswa</span>
          {(searchTerm || selectedClassFilter || selectedTeacherFilter || selectedProgramFilter || selectedHalaqahFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedClassFilter('');
                setSelectedTeacherFilter('');
                setSelectedProgramFilter('');
                setSelectedHalaqahFilter('all');
              }}
              className="text-[#8C7015] font-semibold hover:underline cursor-pointer"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      </div>

      {/* Render Student Content by Halaqah or Class */}
      {viewGroupingMode === 'halaqah' ? (
        <div className="space-y-6">
          {groupedHalaqahList.map((group) => {
            if (group.students.length === 0 && selectedHalaqahFilter === 'all') return null;

            return (
              <div key={group.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Halaqah Header */}
                <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-[#1E293B] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-slate-950 flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                      <Users className="w-5 h-5 text-slate-950" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <span>{group.name}</span>
                        {selectedHalaqahFilter === 'my-halaqah' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                            ⭐ Halaqah Saya
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-[#D4AF37] flex items-center gap-2 flex-wrap">
                        <span>Pembimbing: {group.teacherName}</span>
                        {group.room && <span>• Ruang: {group.room}</span>}
                        {group.schedule && <span>• Jadwal: {group.schedule}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        printStudentQrCards(group.students, classes, qrDataUrls, 'grid_8')
                      }
                      className="px-3 py-1 rounded-lg bg-[#D4AF37] hover:bg-[#c49f2c] text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Cetak / Print Kartu QR & Barcode Seluruh Anggota Halaqah Ini"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak QR Halaqah ({group.students.length})</span>
                    </button>
                    <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold">
                      {group.students.length} Santri Anggota
                    </span>
                  </div>
                </div>

                {/* Member Student Cards Grid */}
                <div className="p-4">
                  {group.students.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada santri yang cocok dengan filter pencarian pada halaqah ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {group.students.map((std) => {
                        const cls = classes.find(c => c.id === std.classId);
                        const teacher = teachers.find(t => t.id === std.teacherId);
                        const progressPercent = Math.min(100, Math.round((std.totalJuzHafal / std.targetJuz) * 100));
                        const halInfo = getStudentHalaqahInfo(std, activeHalaqahGroups, teachers);

                        return (
                          <div
                            key={std.id}
                            className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition p-4 flex flex-col justify-between space-y-3 relative group"
                          >
                            {/* Top Row: Avatar & Basic Info */}
                            <div className="flex items-start gap-3">
                              <AvatarBadge
                                name={std.name}
                                photoUrl={std.photo}
                                gender={std.gender}
                                role="santri"
                                size="md"
                                className="shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] font-mono text-slate-400 font-bold">NIS: {std.nis}</span>
                                  <div className="flex items-center gap-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                      normalizeHalaqah(std.program) === 'Akselerasi'
                                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                                        : normalizeHalaqah(std.program) === 'Khusus'
                                        ? 'bg-purple-50 text-purple-900 border-purple-300'
                                        : 'bg-blue-50 text-blue-800 border-blue-200'
                                    }`}>
                                      {normalizeHalaqah(std.program)}
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                      {cls?.name || '7A'}
                                    </span>
                                  </div>
                                </div>
                                <h3 
                                  onClick={() => onOpenStudentDetail(std.id)}
                                  className="text-sm font-bold text-slate-800 truncate hover:text-[#D4AF37] transition cursor-pointer mt-0.5"
                                >
                                  {std.name}
                                </h3>
                                <p className="text-[11px] text-[#8C7015] font-semibold truncate flex items-center gap-1 mt-0.5">
                                  <span>{halInfo.groupName}</span>
                                </p>
                              </div>
                            </div>

                            {/* Progress & Stats Box */}
                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2 text-xs">
                              {/* Visual Progress Bar */}
                              <div>
                                <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700 mb-1">
                                  <span>Target: {std.targetJuz} Juz</span>
                                  <span className="text-[#8C7015] font-bold">{std.totalJuzHafal} Juz ({progressPercent}%)</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      progressPercent >= 75 ? 'bg-[#D4AF37]' :
                                      progressPercent >= 40 ? 'bg-blue-600' : 'bg-slate-500'
                                    }`}
                                    style={{ width: `${progressPercent}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Sub Stats */}
                              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                                <div>
                                  <span className="text-slate-400 block">Jilid Ummi:</span>
                                  {isGrade8or9Student(std, classes) ? (
                                    <span className="text-slate-400 italic font-medium flex items-center gap-1 mt-0.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                      Tidak Ikut Ummi
                                    </span>
                                  ) : (
                                    <span className="font-bold text-slate-800 flex items-center gap-1">
                                      <BookMarked className="w-3 h-3 text-[#1E293B]" />
                                      {std.currentUmmiJilid} (Hal. {std.currentUmmiPage})
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Rata-rata Nilai:</span>
                                  <span className="font-bold text-[#8C7015] flex items-center gap-1">
                                    <Award className="w-3 h-3 text-[#D4AF37]" />
                                    {std.avgScore || 85} / 100
                                  </span>
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                                <span className="text-slate-400">Hafalan Terakhir: </span>
                                <strong className="text-slate-800">{std.lastHafalan}</strong>
                              </div>

                              {/* Integrated QR Code & Attendance Status Row */}
                              {(() => {
                                const qrUrl = qrDataUrls[std.id];
                                const badgeId = buildStudentQrCodeBadgeId(std);
                                const todayRec = attendanceRecords.find(
                                  r => r.studentId === std.id && r.date === todayStr
                                );
                                return (
                                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                                    <div
                                      onClick={() => setQrModalStudent(std)}
                                      className="flex items-center gap-2 cursor-pointer group/qr min-w-0"
                                      title="Klik untuk melihat / unduh Kartu QR Presensi Santri"
                                    >
                                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 group-hover/qr:border-[#D4AF37]">
                                        {qrUrl?.trim() ? (
                                          <img
                                            src={qrUrl.trim()}
                                            alt={`QR ${std.name}`}
                                            className="w-full h-full object-contain"
                                          />
                                        ) : (
                                          <QrCode className="w-4 h-4 text-slate-400" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <span className="block font-mono font-extrabold text-[10px] text-[#8C7015] truncate">
                                          {badgeId}
                                        </span>
                                        <span className="block text-[9px] text-slate-400">
                                          Klik Kartu QR Absensi
                                        </span>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleQuickMarkHadirToday(std)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border transition flex items-center gap-1 cursor-pointer shrink-0 ${
                                        todayRec?.status === 'Hadir'
                                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                          : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
                                      }`}
                                      title="Scan / Tandai Hadir Hari Ini"
                                    >
                                      <ScanLine className="w-3 h-3 text-[#8C7015]" />
                                      <span>{todayRec ? todayRec.status : 'Scan Hadir'}</span>
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-1 gap-1.5">
                              <button
                                onClick={() => onOpenDailyInputWithStudent(std.id)}
                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                                title="Input Setoran Harian"
                              >
                                <span className="text-[#D4AF37] font-bold">+</span>
                                <span>Setoran</span>
                              </button>

                              {userRole !== 'wali' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPreviousHafalan(std.id)}
                                  className="py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                                  title="Input Hafalan Sebelum-Sebelumnya (Riwayat Lampau / Capaian Awal)"
                                >
                                  <History className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Sebelumnya</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setQrModalStudent(std)}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition cursor-pointer"
                                title="Kartu QR Code Presensi Santri"
                              >
                                <QrCode className="w-4 h-4 text-[#8C7015]" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  printStudentQrCards([std], classes, qrDataUrls, 'single')
                                }
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition cursor-pointer"
                                title="Cetak / Print Kartu QR & Barcode Santri Ini"
                              >
                                <Printer className="w-4 h-4 text-[#8C7015]" />
                              </button>

                              <button
                                onClick={() => onOpenStudentDetail(std.id)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                title="Lihat Detail Profil"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {userRole !== 'wali' && (
                                <>
                                  <button
                                    onClick={() => handleOpenEdit(std)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                    title="Edit Data Siswa"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>

                                  {userRole === 'admin' && (
                                    <>
                                      <button
                                        onClick={() => handleOpenStudentPasswordModal(std)}
                                        className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition cursor-pointer"
                                        title="Kelola Username & Password Santri"
                                      >
                                        <KeyRound className="w-4 h-4 text-amber-700" />
                                      </button>
                                      <button
                                        onClick={() => setShowDeleteConfirm(std)}
                                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-red-600 transition cursor-pointer"
                                        title="Hapus Siswa"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Class Mode Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.map((std) => {
            const cls = classes.find(c => c.id === std.classId);
            const teacher = teachers.find(t => t.id === std.teacherId);
            const progressPercent = Math.min(100, Math.round((std.totalJuzHafal / std.targetJuz) * 100));
            const halInfo = getStudentHalaqahInfo(std, activeHalaqahGroups, teachers);

            return (
              <div
                key={std.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition p-4 flex flex-col justify-between space-y-3 relative group"
              >
                {/* Top Row: Avatar & Basic Info */}
                <div className="flex items-start gap-3">
                  <AvatarBadge
                    name={std.name}
                    photoUrl={std.photo}
                    gender={std.gender}
                    role="santri"
                    size="md"
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono text-slate-400 font-bold">NIS: {std.nis}</span>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          normalizeHalaqah(std.program) === 'Akselerasi'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : normalizeHalaqah(std.program) === 'Khusus'
                            ? 'bg-purple-50 text-purple-900 border-purple-300'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {normalizeHalaqah(std.program)}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {cls?.name || '7A'}
                        </span>
                      </div>
                    </div>
                    <h3 
                      onClick={() => onOpenStudentDetail(std.id)}
                      className="text-sm font-bold text-slate-800 truncate hover:text-[#D4AF37] transition cursor-pointer mt-0.5"
                    >
                      {std.name}
                    </h3>
                    <p className="text-[11px] text-[#8C7015] font-semibold truncate flex items-center gap-1 mt-0.5">
                      <span>{halInfo.groupName}</span>
                    </p>
                  </div>
                </div>

                {/* Progress & Stats Box */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700 mb-1">
                      <span>Target: {std.targetJuz} Juz</span>
                      <span className="text-[#8C7015] font-bold">{std.totalJuzHafal} Juz ({progressPercent}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progressPercent >= 75 ? 'bg-[#D4AF37]' :
                          progressPercent >= 40 ? 'bg-blue-600' : 'bg-slate-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Jilid Ummi:</span>
                      {isGrade8or9Student(std, classes) ? (
                        <span className="text-slate-400 italic font-medium flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          Tidak Ikut Ummi
                        </span>
                      ) : (
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <BookMarked className="w-3 h-3 text-[#1E293B]" />
                          {std.currentUmmiJilid} (Hal. {std.currentUmmiPage})
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 block">Rata-rata Nilai:</span>
                      <span className="font-bold text-[#8C7015] flex items-center gap-1">
                        <Award className="w-3 h-3 text-[#D4AF37]" />
                        {std.avgScore || 85} / 100
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span className="text-slate-400">Hafalan Terakhir: </span>
                    <strong className="text-slate-800">{std.lastHafalan}</strong>
                  </div>

                  {/* Integrated QR Code & Attendance Status Row */}
                  {(() => {
                    const qrUrl = qrDataUrls[std.id];
                    const badgeId = buildStudentQrCodeBadgeId(std);
                    const todayRec = attendanceRecords.find(
                      r => r.studentId === std.id && r.date === todayStr
                    );
                    return (
                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                        <div
                          onClick={() => setQrModalStudent(std)}
                          className="flex items-center gap-2 cursor-pointer group/qr min-w-0"
                          title="Klik untuk melihat / unduh Kartu QR Presensi Santri"
                        >
                          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 group-hover/qr:border-[#D4AF37]">
                            {qrUrl?.trim() ? (
                              <img
                                src={qrUrl.trim()}
                                alt={`QR ${std.name}`}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <QrCode className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-mono font-extrabold text-[10px] text-[#8C7015] truncate">
                              {badgeId}
                            </span>
                            <span className="block text-[9px] text-slate-400">
                              Klik Kartu QR Absensi
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQuickMarkHadirToday(std)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border transition flex items-center gap-1 cursor-pointer shrink-0 ${
                            todayRec?.status === 'Hadir'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
                          }`}
                          title="Scan / Tandai Hadir Hari Ini"
                        >
                          <ScanLine className="w-3 h-3 text-[#8C7015]" />
                          <span>{todayRec ? todayRec.status : 'Scan Hadir'}</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-1 gap-1.5">
                  <button
                    onClick={() => onOpenDailyInputWithStudent(std.id)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Input Setoran Harian"
                  >
                    <span className="text-[#D4AF37] font-bold">+</span>
                    <span>Setoran</span>
                  </button>

                  {userRole !== 'wali' && (
                    <button
                      type="button"
                      onClick={() => handleOpenPreviousHafalan(std.id)}
                      className="py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                      title="Input Hafalan Sebelum-Sebelumnya (Riwayat Lampau / Capaian Awal)"
                    >
                      <History className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Sebelumnya</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setQrModalStudent(std)}
                    className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition cursor-pointer"
                    title="Kartu QR Code Presensi Santri"
                  >
                    <QrCode className="w-4 h-4 text-[#8C7015]" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      printStudentQrCards([std], classes, qrDataUrls, 'single')
                    }
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition cursor-pointer"
                    title="Cetak / Print Kartu QR & Barcode Santri Ini"
                  >
                    <Printer className="w-4 h-4 text-[#8C7015]" />
                  </button>

                  <button
                    onClick={() => onOpenStudentDetail(std.id)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    title="Lihat Detail Profil"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {userRole !== 'wali' && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(std)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        title="Edit Data Siswa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {userRole === 'admin' && (
                        <>
                          <button
                            onClick={() => handleOpenStudentPasswordModal(std)}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition cursor-pointer"
                            title="Kelola Username & Password Santri"
                          >
                            <KeyRound className="w-4 h-4 text-amber-700" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(std)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-red-600 transition cursor-pointer"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredStudents.length === 0 && (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-700">Tidak ada santri yang cocok dengan filter pencarian.</p>
          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci atau reset filter.</p>
        </div>
      )}
        </>
      )}

      {/* MODAL: ADD / EDIT STUDENT */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <h2 className="text-base font-bold">
                {editingStudent ? 'Edit Data Santri' : 'Tambah Santri Baru'}
              </h2>
              <button onClick={() => setShowAddEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Photo & Avatar Section */}
              <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <AvatarBadge
                  name={formData.name || 'Santri'}
                  photoUrl={formData.photo}
                  gender={formData.gender}
                  role="santri"
                  size="xl"
                  editable={true}
                  onPhotoChange={(base64) => setFormData({ ...formData, photo: base64 })}
                  onPhotoRemove={() => setFormData({ ...formData, photo: '' })}
                />
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-xs">Foto / Avatar Profil Santri</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Otomatis menggunakan avatar islami ({formData.gender === 'P' ? '🧕 Santriwati / Jilbab' : '👳 Santriwan / Peci'}). Klik tombol kamera untuk mengunggah foto custom.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIS (Nomor Induk Siswa) *</label>
                  <input
                    type="text"
                    required
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NISN</label>
                  <input
                    type="text"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Santri *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                    placeholder="Contoh: Muhammad Fatih Al-Ayyubi"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Panggilan</label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                    placeholder="Contoh: Fatih"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    <option value="L">Laki-laki (Ikhwan)</option>
                    <option value="P">Perempuan (Akhawat)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => {
                      const newClassId = e.target.value;
                      const selectedCls = classes.find(c => c.id === newClassId);
                      const is89 = isGrade8or9Class(selectedCls);
                      setFormData({ 
                        ...formData, 
                        classId: newClassId,
                        ...(is89 ? { currentUmmiJilid: '-', currentUmmiPage: 0 } : (formData.currentUmmiJilid === '-' ? { currentUmmiJilid: 'Jilid 1', currentUmmiPage: 1 } : {}))
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Guru Tahfizh</label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilihan Halaqah Santri</label>
                  <select
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    <option value="Akselerasi">Akselerasi</option>
                    <option value="Reguler">Reguler</option>
                    <option value="Khusus">Khusus</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Hafalan (Juz)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="30"
                    value={formData.targetJuz}
                    onChange={(e) => setFormData({ ...formData, targetJuz: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jilid Ummi Saat Ini</label>
                  {isGrade8or9Class(classes.find(c => c.id === formData.classId)) ? (
                    <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs text-slate-500 font-semibold italic">
                      - (Kelas 8/9 Tidak Masuk Jilid Ummi)
                    </div>
                  ) : (
                    <select
                      value={formData.currentUmmiJilid}
                      onChange={(e) => setFormData({ ...formData, currentUmmiJilid: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                    >
                      {UMMI_JILIDS.map(j => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Data Hafalan Sebelumnya / Capaian Awal Santri */}
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-[#8C7015]" />
                      <span>Data Hafalan Sebelumnya / Capaian Awal Santri</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Isi jika santri sudah memiliki tabungan hafalan dari waktu/semester sebelumnya
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Juz Sudah Dihafal
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="30"
                      value={formData.totalJuzHafal ?? 0}
                      onChange={(e) =>
                        setFormData({ ...formData, totalJuzHafal: Number(e.target.value) })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jumlah Surat Hafal
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="114"
                      value={formData.totalSurahHafal ?? 0}
                      onChange={(e) =>
                        setFormData({ ...formData, totalSurahHafal: Number(e.target.value) })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Total Ayat Hafal
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="6236"
                      value={formData.totalAyahHafal ?? 0}
                      onChange={(e) =>
                        setFormData({ ...formData, totalAyahHafal: Number(e.target.value) })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Batas Hafalan Terakhir
                    </label>
                    <input
                      type="text"
                      value={formData.lastHafalan || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, lastHafalan: e.target.value })
                      }
                      placeholder="Contoh: An-Naba : 40"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>

              {/* Parent Details */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800">Informasi Orang Tua / Wali</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Nama Orang Tua / Wali</label>
                    <input
                      type="text"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      placeholder="Contoh: Bpk. H. Iskandar"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Nomor WhatsApp Orang Tua</label>
                    <input
                      type="text"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      placeholder="Contoh: 081234567890"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Simpan Data Santri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CSV / EXCEL IMPORT */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#D4AF37]" />
                <h2 className="text-base font-bold">Import Data Siswa dari CSV / Excel</h2>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              
              <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">Format Template CSV:</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Gunakan format kolom: NIS, NISN, Nama Lengkap, Nama Panggilan, Jenis Kelamin, Kelas, Program, Target Juz, Nama Orang Tua, No HP WA, Jilid Ummi.
                  </p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c49f2c] text-slate-900 font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Upload Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih File CSV:</label>
                <input
                  type="file"
                  accept=".csv, .txt"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#1E293B] file:text-white hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              {/* Raw CSV Text area */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Atau Tempelkan Teks CSV Langsung:</label>
                <textarea
                  rows={6}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="NIS,NISN,Nama Lengkap,Nama Panggilan,Jenis Kelamin,Kelas,Program,Target Juz,Nama Orang Tua,No HP WA,Jilid Ummi..."
                  className="w-full bg-slate-50 font-mono text-[11px] p-3 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Results Preview */}
              {importResult && (
                <div className={`p-4 rounded-xl border ${importResult.successCount > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                  <p className="font-bold">
                    {importResult.successCount > 0 
                      ? `✅ Berhasil mengimpor ${importResult.successCount} siswa baru!` 
                      : '❌ Gagal mengimpor siswa.'}
                  </p>
                  {importResult.errors.length > 0 && (
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-[11px] text-red-700">
                      {importResult.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 font-bold text-xs"
              >
                Tutup
              </button>
              <button
                onClick={handleProcessImport}
                className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Proses & Simpan ke Database</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: STUDENT PASSWORD MANAGEMENT */}
      {passwordModalStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#1E293B] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-bold text-sm">
                  Kelola Sandi Santri: {passwordModalStudent.name}
                </h3>
              </div>
              <button
                onClick={() => setPasswordModalStudent(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudentPassword} className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <AvatarBadge
                  name={passwordModalStudent.name}
                  photoUrl={passwordModalStudent.photo}
                  gender={passwordModalStudent.gender}
                  role="santri"
                  size="md"
                  className="shrink-0"
                />
                <div>
                  <p className="font-bold text-slate-900">{passwordModalStudent.name}</p>
                  <p className="text-[11px] text-slate-500">NIS: {passwordModalStudent.nis} • Wali: {passwordModalStudent.parentName || 'Orang Tua'}</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Username / NIS Login Santri</label>
                <input
                  type="text"
                  required
                  value={studentUsernameInput}
                  onChange={(e) => setStudentUsernameInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Disarankan menggunakan NIS santri agar mudah diingat.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    Kata Sandi (Password) Akun
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      setStudentPasswordInput(`santri${rand}`);
                    }}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    Sandi Acak
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showStudentPassEye ? 'text' : 'password'}
                    required
                    value={studentPasswordInput}
                    onChange={(e) => setStudentPasswordInput(e.target.value)}
                    placeholder="Masukkan kata sandi santri"
                    className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPassEye(!showStudentPassEye)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    {showStudentPassEye ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const text = `*AKUN LOGIN SANTRI/WALI TAHFIZH SMPI AL AZHAR 21*\nNama Santri: ${passwordModalStudent.name}\nUsername / NIS: ${studentUsernameInput}\nKata Sandi: ${studentPasswordInput}\nLink Website: ${window.location.origin}`;
                    navigator.clipboard.writeText(text);
                    alert('Format pesan WhatsApp login santri berhasil disalin!');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Salin ke WA</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPasswordModalStudent(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1E293B] hover:bg-slate-800 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Simpan Sandi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INPUT HAFALAN SEBELUM-SEBELUMNYA */}
      <PreviousHafalanModal
        isOpen={showPreviousHafalanModal}
        onClose={() => setShowPreviousHafalanModal(false)}
        students={students}
        teachers={teachers}
        classes={classes}
        initialStudentId={previousHafalanStudentId}
        onSaved={onRefreshData}
      />

      {/* MODAL: KARTU QR CODE UNIK SANTRI */}
      {qrModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-[#1E293B] text-white p-4 text-center relative">
              <button
                type="button"
                onClick={() => setQrModalStudent(null)}
                className="absolute right-3 top-3 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37]">
                Kartu QR Presensi Harian Santri
              </p>
              <h3 className="text-sm font-black mt-0.5">
                SMP ISLAM AL AZHAR 21 SOLO BARU
              </h3>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="w-52 h-52 mx-auto p-3 rounded-2xl bg-white border-2 border-[#D4AF37] shadow-xs flex items-center justify-center">
                {qrDataUrls[qrModalStudent.id]?.trim() ? (
                  <img
                    src={qrDataUrls[qrModalStudent.id].trim()}
                    alt={qrModalStudent.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <QrCode className="w-16 h-16 text-slate-300" />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 max-w-[220px] mx-auto">
                  <img
                    src={buildBarcodeSvgDataUrl(buildStudentQrCodeBadgeId(qrModalStudent))}
                    alt="Barcode"
                    className="h-5 w-full object-fill"
                  />
                  <span className="block font-mono font-black text-xs text-[#8C7015] mt-0.5">
                    {buildStudentQrCodeBadgeId(qrModalStudent)}
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900 pt-1">
                  {qrModalStudent.name}
                </h4>
                <p className="text-xs font-semibold text-slate-500">
                  NIS: {qrModalStudent.nis || '-'} • Kelas{' '}
                  {classes.find(c => c.id === qrModalStudent.classId)?.name || '7A'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    printStudentQrCards([qrModalStudent], classes, qrDataUrls, 'single')
                  }
                  className="py-2 px-3 rounded-xl bg-[#1E293B] hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#D4AF37]" />
                  <span>Cetak / Print Kartu</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadStudentQrPng(qrModalStudent)}
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
                    handleQuickMarkHadirToday(qrModalStudent);
                    setQrModalStudent(null);
                  }}
                  className="py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ScanLine className="w-4 h-4 text-amber-300" />
                  <span>Scan Absen Hadir Sekarang</span>
                </button>

                {userRole !== 'wali' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleQuickMarkHadirToday(qrModalStudent);
                        const sid = qrModalStudent.id;
                        setQrModalStudent(null);
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
                        handleQuickMarkHadirToday(qrModalStudent);
                        const sid = qrModalStudent.id;
                        setQrModalStudent(null);
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

      {/* MODAL: DELETE CONFIRM */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900">Hapus Data Santri?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus <strong>{showDeleteConfirm.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteStudent}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
