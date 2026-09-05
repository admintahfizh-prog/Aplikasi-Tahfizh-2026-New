import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  CheckCircle2, 
  RotateCcw,
  Clock, 
  GraduationCap, 
  UserPlus, 
  Star, 
  AlertCircle, 
  Layers, 
  FileText, 
  ChevronRight, 
  Edit, 
  Trash2, 
  Award,
  Sparkles,
  Info,
  CalendarDays,
  CheckCheck,
  TrendingUp,
  X,
  Eye,
  Check
} from 'lucide-react';
import { 
  Student, 
  Teacher, 
  ClassItem, 
  MatrikulasiStudent, 
  MatrikulasiRecord, 
  IqroJilid, 
  MatrikulasiDay, 
  Role,
  AppSettings
} from '../types';
import { IQRO_JILIDS, MATRIKULASI_DAYS, IQRO_SYLLABUS } from '../data/iqroData';
import { storageService } from '../services/storageService';
import { LogoAlAzhar } from './LogoAlAzhar';
import { AvatarBadge } from './AvatarBadge';

interface MatrikulasiViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassItem[];
  matrikulasiStudents: MatrikulasiStudent[];
  matrikulasiRecords: MatrikulasiRecord[];
  userRole: Role;
  settings: AppSettings;
  onRefreshData: () => void;
  onOpenStudentDetail: (studentId: string) => void;
}

export const MatrikulasiView: React.FC<MatrikulasiViewProps> = ({
  students,
  teachers,
  classes,
  matrikulasiStudents,
  matrikulasiRecords,
  userRole,
  settings,
  onRefreshData,
  onOpenStudentDetail
}) => {
  // Tabs: 'jadwal' | 'santri' | 'jurnal' | 'laporan' | 'silabus'
  const [activeTab, setActiveTab] = useState<'jadwal' | 'santri' | 'jurnal' | 'laporan' | 'silabus'>('jadwal');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'all' | '8' | '9'>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedJilidFilter, setSelectedJilidFilter] = useState<string>('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modals state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [selectedMatStudentForRecord, setSelectedMatStudentForRecord] = useState<MatrikulasiStudent | null>(null);
  const [selectedMatStudentForEdit, setSelectedMatStudentForEdit] = useState<MatrikulasiStudent | null>(null);

  // Form State: Enrollment
  const [enrollStudentId, setEnrollStudentId] = useState<string>('');
  const [enrollJilid, setEnrollJilid] = useState<IqroJilid>('Iqro 1');
  const [enrollPage, setEnrollPage] = useState<number>(1);
  const [enrollTeacherId, setEnrollTeacherId] = useState<string>(teachers[0]?.id || 't-1');
  const [enrollReason, setEnrollReason] = useState<string>('Perbaikan makharijul huruf & kelancaran membaca Al-Qur\'an.');
  const [enrollNotes, setEnrollNotes] = useState<string>('');

  // Form State: Record Session
  const [recordStudentId, setRecordStudentId] = useState<string>('');
  const [recordTeacherId, setRecordTeacherId] = useState<string>(teachers[0]?.id || 't-1');
  const [recordDate, setRecordDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [recordDay, setRecordDay] = useState<MatrikulasiDay>('Selasa');
  const [recordJilid, setRecordJilid] = useState<IqroJilid>('Iqro 1');
  const [recordPage, setRecordPage] = useState<number>(1);
  const [recordMaterialFocus, setRecordMaterialFocus] = useState<string>('Pengenalan Huruf Tunggal & Ketukan 1 Harakat');
  const [recordScore, setRecordScore] = useState<number>(85);
  const [recordStatus, setRecordStatus] = useState<MatrikulasiRecord['status']>('Lulus');
  const [recordNotes, setRecordNotes] = useState<string>('Alhamdulillah bacaan lancar dan artikulasi huruf semakin jelas.');

  // Form State: Edit Student
  const [editStatus, setEditStatus] = useState<MatrikulasiStudent['status']>('Aktif');
  const [editJilid, setEditJilid] = useState<IqroJilid>('Iqro 1');
  const [editPage, setEditPage] = useState<number>(1);
  const [editTeacherId, setEditTeacherId] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Laporan Selection
  const [selectedReportStudentId, setSelectedReportStudentId] = useState<string>(
    matrikulasiStudents[0]?.studentId || ''
  );
  const [reportType, setReportType] = useState<'individu' | 'kolektif' | 'jurnal'>('individu');

  // Filter grade 8 & 9 candidates for enrollment
  const grade8and9Students = useMemo(() => {
    return students.filter(std => {
      const cls = classes.find(c => c.id === std.classId);
      const isGrade8or9 = cls?.grade === '8' || cls?.grade === '9' || cls?.level === 8 || cls?.level === 9 ||
        cls?.name.includes('8') || cls?.name.includes('9');
      // Only include students not already enrolled or allow re-selecting
      return isGrade8or9;
    });
  }, [students, classes]);

  // Enrolled students enriched with full student data
  const enrichedMatrikulasiStudents = useMemo(() => {
    return matrikulasiStudents.map(ms => {
      const std = students.find(s => s.id === ms.studentId);
      const cls = classes.find(c => c.id === std?.classId);
      const tch = teachers.find(t => t.id === ms.assignedTeacherId);
      const studentRecords = matrikulasiRecords.filter(r => r.studentId === ms.studentId);
      const latestRecord = studentRecords[0]; // records are sorted newest first
      const totalSessions = studentRecords.length;
      const avgScore = totalSessions > 0 
        ? Math.round(studentRecords.reduce((acc, curr) => acc + curr.score, 0) / totalSessions) 
        : 0;

      return {
        ...ms,
        student: std,
        className: cls?.name || 'Kelas -',
        grade: cls?.grade || (cls?.name.includes('8') ? '8' : cls?.name.includes('9') ? '9' : '7'),
        teacherName: tch?.name || 'Ust. Pembimbing',
        totalSessions,
        avgScore,
        latestRecord
      };
    });
  }, [matrikulasiStudents, students, classes, teachers, matrikulasiRecords]);

  // Filtered Matrikulasi Students
  const filteredMatrikulasiStudents = useMemo(() => {
    return enrichedMatrikulasiStudents.filter(item => {
      if (!item.student) return false;
      const matchSearch = item.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.className.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchGrade = selectedGradeFilter === 'all' || item.grade === selectedGradeFilter;
      const matchClass = selectedClassFilter === 'all' || item.student.classId === selectedClassFilter;
      const matchJilid = selectedJilidFilter === 'all' || item.currentIqroJilid === selectedJilidFilter;
      const matchStatus = selectedStatusFilter === 'all' || item.status === selectedStatusFilter;

      return matchSearch && matchGrade && matchClass && matchJilid && matchStatus;
    });
  }, [enrichedMatrikulasiStudents, searchQuery, selectedGradeFilter, selectedClassFilter, selectedJilidFilter, selectedStatusFilter]);

  // Summary statistics
  const stats = useMemo(() => {
    const totalActive = matrikulasiStudents.filter(s => s.status === 'Aktif').length;
    const totalCompleted = matrikulasiStudents.filter(s => s.status === 'Lulus / Selesai').length;
    const totalSessions = matrikulasiRecords.length;
    
    // Distribution by Jilid
    const jilidCounts: Record<IqroJilid, number> = {
      'Iqro 1': 0,
      'Iqro 2': 0,
      'Iqro 3': 0,
      'Iqro 4': 0,
      'Iqro 5': 0,
      'Iqro 6': 0
    };
    matrikulasiStudents.forEach(s => {
      if (jilidCounts[s.currentIqroJilid] !== undefined) {
        jilidCounts[s.currentIqroJilid]++;
      }
    });

    const grade8Count = enrichedMatrikulasiStudents.filter(s => s.grade === '8').length;
    const grade9Count = enrichedMatrikulasiStudents.filter(s => s.grade === '9').length;

    return {
      totalActive,
      totalCompleted,
      totalAll: matrikulasiStudents.length,
      totalSessions,
      jilidCounts,
      grade8Count,
      grade9Count
    };
  }, [matrikulasiStudents, matrikulasiRecords, enrichedMatrikulasiStudents]);

  // Handle Enrollment
  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollStudentId) {
      alert('Silakan pilih santri terlebih dahulu.');
      return;
    }

    const alreadyEnrolled = matrikulasiStudents.some(s => s.studentId === enrollStudentId);
    if (alreadyEnrolled) {
      alert('Santri ini sudah terdaftar dalam program matrikulasi.');
      return;
    }

    storageService.addMatrikulasiStudent({
      studentId: enrollStudentId,
      enrolledDate: new Date().toISOString().split('T')[0],
      status: 'Aktif',
      currentIqroJilid: enrollJilid,
      currentIqroPage: Number(enrollPage),
      assignedTeacherId: enrollTeacherId,
      scheduleDays: ['Selasa', 'Rabu', 'Kamis'],
      initialReason: enrollReason,
      notes: enrollNotes
    });

    setIsEnrollModalOpen(false);
    onRefreshData();
  };

  // Handle Open Record Session Modal
  const handleOpenRecordModal = (matStudent?: MatrikulasiStudent) => {
    if (matStudent) {
      setSelectedMatStudentForRecord(matStudent);
      setRecordStudentId(matStudent.studentId);
      setRecordTeacherId(matStudent.assignedTeacherId);
      setRecordJilid(matStudent.currentIqroJilid);
      setRecordPage(matStudent.currentIqroPage);
    } else if (matrikulasiStudents.length > 0) {
      const first = matrikulasiStudents[0];
      setSelectedMatStudentForRecord(first);
      setRecordStudentId(first.studentId);
      setRecordTeacherId(first.assignedTeacherId);
      setRecordJilid(first.currentIqroJilid);
      setRecordPage(first.currentIqroPage);
    }
    
    // Auto-detect day
    const dayIndex = new Date().getDay();
    let detectedDay: MatrikulasiDay = 'Selasa';
    if (dayIndex === 3) detectedDay = 'Rabu';
    else if (dayIndex === 4) detectedDay = 'Kamis';
    setRecordDay(detectedDay);

    setIsRecordModalOpen(true);
  };

  // Handle Record Session Submit
  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordStudentId) {
      alert('Silakan pilih santri terlebih dahulu.');
      return;
    }

    const targetMatStudent = matrikulasiStudents.find(s => s.studentId === recordStudentId);
    if (!targetMatStudent) {
      alert('Santri belum terdaftar di program matrikulasi.');
      return;
    }

    storageService.addMatrikulasiRecord({
      matrikulasiStudentId: targetMatStudent.id,
      studentId: recordStudentId,
      teacherId: recordTeacherId,
      date: recordDate,
      day: recordDay,
      jilid: recordJilid,
      page: Number(recordPage),
      materialFocus: recordMaterialFocus,
      score: Number(recordScore),
      status: recordStatus,
      notes: recordNotes
    });

    // Progression logic based on 'Lulus' vs 'Ulang'
    if (recordStatus === 'Lulus') {
      const pageNum = Number(recordPage);
      if (pageNum >= 32) {
        const currentIndex = IQRO_JILIDS.indexOf(recordJilid);
        if (currentIndex < IQRO_JILIDS.length - 1) {
          targetMatStudent.currentIqroJilid = IQRO_JILIDS[currentIndex + 1];
          targetMatStudent.currentIqroPage = 1;
        } else {
          targetMatStudent.currentIqroPage = 32;
        }
      } else {
        targetMatStudent.currentIqroJilid = recordJilid;
        targetMatStudent.currentIqroPage = pageNum + 1;
      }
      storageService.updateMatrikulasiStudent(targetMatStudent);
    } else {
      // Status 'Ulang' -> tetap di halaman saat ini untuk pemantapan
      targetMatStudent.currentIqroJilid = recordJilid;
      targetMatStudent.currentIqroPage = Number(recordPage);
      storageService.updateMatrikulasiStudent(targetMatStudent);
    }

    setIsRecordModalOpen(false);
    onRefreshData();
  };

  // Handle Edit Student
  const handleOpenEditStudentModal = (item: MatrikulasiStudent) => {
    setSelectedMatStudentForEdit(item);
    setEditStatus(item.status);
    setEditJilid(item.currentIqroJilid);
    setEditPage(item.currentIqroPage);
    setEditTeacherId(item.assignedTeacherId);
    setEditNotes(item.notes || '');
    setIsEditStudentModalOpen(true);
  };

  const handleEditStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatStudentForEdit) return;

    storageService.updateMatrikulasiStudent({
      ...selectedMatStudentForEdit,
      status: editStatus,
      currentIqroJilid: editJilid,
      currentIqroPage: Number(editPage),
      assignedTeacherId: editTeacherId,
      notes: editNotes,
      completedDate: editStatus === 'Lulus / Selesai' ? (selectedMatStudentForEdit.completedDate || new Date().toISOString().split('T')[0]) : undefined
    });

    setIsEditStudentModalOpen(false);
    onRefreshData();
  };

  const handleDeleteMatStudent = (id: string, name: string) => {
    if (window.confirm(`Hapus santri "${name}" dari daftar peserta matrikulasi? Data riwayat bimbingan akan tetap tersimpan di arsip.`)) {
      storageService.deleteMatrikulasiStudent(id);
      onRefreshData();
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Hapus catatan mutaba\'ah sesi bimbingan ini?')) {
      storageService.deleteMatrikulasiRecord(id);
      onRefreshData();
    }
  };

  const handleExportCSV = () => {
    const csv = storageService.exportMatrikulasiToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_matrikulasi_iqro_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Selected student for individual report
  const currentReportStudent = enrichedMatrikulasiStudents.find(
    s => s.studentId === selectedReportStudentId
  ) || enrichedMatrikulasiStudents[0];

  const currentReportStudentRecords = useMemo(() => {
    if (!currentReportStudent) return [];
    return matrikulasiRecords.filter(r => r.studentId === currentReportStudent.studentId);
  }, [matrikulasiRecords, currentReportStudent]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner & Identity */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-amber-50 to-transparent pointer-events-none opacity-60"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1E293B] text-[#D4AF37] border border-[#D4AF37]/30">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                PROGRAM KHUSUS KELAS 8 & 9
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <CalendarDays className="w-3 h-3 text-amber-700" />
                Selasa, Rabu & Kamis
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <Info className="w-3 h-3 text-slate-500" />
                Khusus Laporan Perkembangan (Non-Raport)
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#D4AF37]" />
              Matrikulasi Bimbingan Metode Iqro
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Program akselerasi dan perbaikan makharijul huruf serta kelancaran membaca Al-Qur'an secara intensif dengan buku panduan Iqro Jilid 1–6 untuk santri terpilih kelas 8 dan 9.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {userRole !== 'wali' && (
              <>
                <button
                  id="btn-enroll-matrikulasi"
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  + Daftarkan Santri
                </button>
                <button
                  id="btn-add-record-matrikulasi"
                  onClick={() => handleOpenRecordModal()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E293B] text-white text-xs font-bold hover:bg-slate-800 transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  + Catat Bimbingan
                </button>
              </>
            )}
          </div>
        </div>

        {/* Highlight Schedule Pill */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              Jadwal Sesi Matrikulasi:
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                1. Selasa (13.30 - 15.00)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                2. Rabu (13.30 - 15.00)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                3. Kamis (13.30 - 15.00)
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 italic">
            *Catatan: Nilai matrikulasi tidak mempengaruhi nilai raport reguler.
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Santri Terbina Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalActive}</span>
            <span className="text-[11px] text-slate-500 font-medium">Santri</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Kelas 8: <strong className="text-slate-700">{stats.grade8Count}</strong> • Kelas 9: <strong className="text-slate-700">{stats.grade9Count}</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Sesi Bimbingan</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalSessions}</span>
            <span className="text-[11px] text-slate-500 font-medium">Sesi Mutaba'ah</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Terselenggara: <strong className="text-slate-700">Selasa, Rabu & Kamis</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Santri Lulus Matrikulasi</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{stats.totalCompleted}</span>
            <span className="text-[11px] text-slate-500 font-medium">Santri</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Siap masuk ke <strong className="text-slate-700">Tahfizh Reguler</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Metode & Panduan</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-950">6 Jilid</span>
            <span className="text-[11px] text-slate-500 font-medium">Buku Iqro</span>
          </div>
          <div className="mt-1 text-[11px] text-indigo-800 font-medium truncate">
            Iqro 1 s/d Iqro 6 Praktis
          </div>
        </div>

      </div>

      {/* 3. Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          
          <button
            onClick={() => setActiveTab('jadwal')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'jadwal'
                ? 'bg-[#1E293B] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-[#D4AF37]" />
            Jadwal Harian (Selasa, Rabu, Kamis)
          </button>

          <button
            onClick={() => setActiveTab('santri')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'santri'
                ? 'bg-[#1E293B] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-[#D4AF37]" />
            Santri Terbina ({matrikulasiStudents.length})
          </button>

          <button
            onClick={() => setActiveTab('jurnal')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'jurnal'
                ? 'bg-[#1E293B] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
            Jurnal Mutaba'ah ({matrikulasiRecords.length})
          </button>

          <button
            onClick={() => setActiveTab('laporan')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'laporan'
                ? 'bg-[#1E293B] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
            Laporan & Cetak Perkembangan
          </button>

          <button
            onClick={() => setActiveTab('silabus')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'silabus'
                ? 'bg-[#1E293B] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
            Silabus 6 Jilid Iqro
          </button>

        </div>

        <div className="flex items-center gap-2 px-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
            title="Download Rekap CSV Matrikulasi"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            Ekspor CSV
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: JADWAL HARIAN (SELASA, RABU, KAMIS) */}
      {/* ========================================================================= */}
      {activeTab === 'jadwal' && (
        <div className="space-y-4">
          
          {/* Day selection tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Hari Selasa Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Hari Selasa</h3>
                    <p className="text-[11px] text-slate-500">Sesi 1: 13.30 - 15.00 WIB</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  {matrikulasiStudents.filter(s => s.status === 'Aktif').length} Santri Terjadwal
                </span>
              </div>
              
              <div className="mt-3 space-y-2">
                {enrichedMatrikulasiStudents.filter(s => s.status === 'Aktif').slice(0, 4).map(item => (
                  <div key={item.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AvatarBadge
                        name={item.student?.name || 'Santri'}
                        photoUrl={item.student?.photo}
                        gender={item.student?.gender}
                        role="santri"
                        size="sm"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.student?.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{item.className} • {item.currentIqroJilid} Hal. {item.currentIqroPage}</p>
                      </div>
                    </div>
                    {userRole !== 'wali' && (
                      <button
                        onClick={() => handleOpenRecordModal(item)}
                        className="px-2 py-1 rounded bg-[#1E293B] text-[#D4AF37] hover:bg-slate-800 text-[10px] font-bold shrink-0 transition cursor-pointer"
                      >
                        Input
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Hari Rabu Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Hari Rabu</h3>
                    <p className="text-[11px] text-slate-500">Sesi 2: 13.30 - 15.00 WIB</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                  {matrikulasiStudents.filter(s => s.status === 'Aktif').length} Santri Terjadwal
                </span>
              </div>
              
              <div className="mt-3 space-y-2">
                {enrichedMatrikulasiStudents.filter(s => s.status === 'Aktif').slice(0, 4).map(item => (
                  <div key={item.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AvatarBadge
                        name={item.student?.name || 'Santri'}
                        photoUrl={item.student?.photo}
                        gender={item.student?.gender}
                        role="santri"
                        size="sm"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.student?.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{item.className} • {item.currentIqroJilid} Hal. {item.currentIqroPage}</p>
                      </div>
                    </div>
                    {userRole !== 'wali' && (
                      <button
                        onClick={() => handleOpenRecordModal(item)}
                        className="px-2 py-1 rounded bg-[#1E293B] text-[#D4AF37] hover:bg-slate-800 text-[10px] font-bold shrink-0 transition cursor-pointer"
                      >
                        Input
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Hari Kamis Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Hari Kamis</h3>
                    <p className="text-[11px] text-slate-500">Sesi 3: 13.30 - 15.00 WIB</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                  {matrikulasiStudents.filter(s => s.status === 'Aktif').length} Santri Terjadwal
                </span>
              </div>
              
              <div className="mt-3 space-y-2">
                {enrichedMatrikulasiStudents.filter(s => s.status === 'Aktif').slice(0, 4).map(item => (
                  <div key={item.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AvatarBadge
                        name={item.student?.name || 'Santri'}
                        photoUrl={item.student?.photo}
                        gender={item.student?.gender}
                        role="santri"
                        size="sm"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.student?.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{item.className} • {item.currentIqroJilid} Hal. {item.currentIqroPage}</p>
                      </div>
                    </div>
                    {userRole !== 'wali' && (
                      <button
                        onClick={() => handleOpenRecordModal(item)}
                        className="px-2 py-1 rounded bg-[#1E293B] text-[#D4AF37] hover:bg-slate-800 text-[10px] font-bold shrink-0 transition cursor-pointer"
                      >
                        Input
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sesi Mutaba'ah Terbaru Matrikulasi */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Catatan Bimbingan Mutaba'ah Terbaru</h3>
                <p className="text-xs text-slate-500">Log mutaba'ah sesi bimbingan Iqro yang baru saja selesai</p>
              </div>
              {userRole !== 'wali' && (
                <button
                  onClick={() => handleOpenRecordModal()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1E293B] text-[#D4AF37] text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Catat Sesi Baru
                </button>
              )}
            </div>

            {matrikulasiRecords.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Belum ada catatan mutaba'ah matrikulasi</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Klik tombol di atas untuk mencatat bimbingan perdana hari Selasa, Rabu, atau Kamis.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-semibold">Tanggal & Hari</th>
                      <th className="p-3 font-semibold">Santri</th>
                      <th className="p-3 font-semibold">Kelas</th>
                      <th className="p-3 font-semibold">Jilid & Hal</th>
                      <th className="p-3 font-semibold">Fokus Materi</th>
                      <th className="p-3 font-semibold text-center">Nilai</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold">Guru Pembimbing</th>
                      <th className="p-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {matrikulasiRecords.slice(0, 5).map((rec) => {
                      const std = students.find(s => s.id === rec.studentId);
                      const cls = classes.find(c => c.id === std?.classId);
                      const tch = teachers.find(t => t.id === rec.teacherId);
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-bold text-slate-800">{rec.day}</span>
                            <p className="text-[10px] text-slate-500">{rec.date}</p>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <AvatarBadge
                                name={std?.name || 'Santri'}
                                photoUrl={std?.photo}
                                gender={std?.gender}
                                role="santri"
                                size="sm"
                                className="shrink-0"
                              />
                              <span className="font-bold text-slate-800">{std?.name}</span>
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {cls?.name || '-'}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-bold text-[#1E293B]">{rec.jilid}</span>
                            <span className="text-slate-500 text-[11px] ml-1">Hal. {rec.page}</span>
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs truncate" title={rec.materialFocus}>
                            {rec.materialFocus}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                              rec.score >= 85 ? 'bg-emerald-50 text-emerald-700' :
                              rec.score >= 75 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-800'
                            }`}>
                              {rec.score}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.status === 'Lulus' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {rec.status === 'Lulus' ? '✓ Lulus' : '↻ Ulang'}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap text-slate-600">
                            {tch?.name || 'Ust. Pembimbing'}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            {userRole !== 'wali' && (
                              <button
                                onClick={() => handleDeleteRecord(rec.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                title="Hapus Catatan Sesi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DATA SANTRI PESERTA (KELAS 8 & 9) */}
      {/* ========================================================================= */}
      {activeTab === 'santri' && (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama santri, NIS, atau kelas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Filter Grade (8 vs 9) */}
              <select
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden"
              >
                <option value="all">Semua Jenjang (Kelas 8 & 9)</option>
                <option value="8">Khusus Kelas 8</option>
                <option value="9">Khusus Kelas 9</option>
              </select>

              {/* Filter Jilid Iqro */}
              <select
                value={selectedJilidFilter}
                onChange={(e) => setSelectedJilidFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden"
              >
                <option value="all">Semua Jilid Iqro (1-6)</option>
                {IQRO_JILIDS.map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>

              {/* Filter Status */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden"
              >
                <option value="all">Semua Status</option>
                <option value="Aktif">Aktif Bimbingan</option>
                <option value="Lulus / Selesai">Lulus / Selesai</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>

            </div>

            {userRole !== 'wali' && (
              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1E293B] text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#D4AF37]" />
                + Daftarkan Santri Baru
              </button>
            )}
          </div>

          {/* Table / Cards of Enrolled Students */}
          {filteredMatrikulasiStudents.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
              <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Tidak Ada Data Santri Matrikulasi</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Belum ada santri yang sesuai dengan filter pencarian. Klik "+ Daftarkan Santri Baru" untuk memilih santri dari Kelas 8 atau Kelas 9.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 font-semibold">Santri (Kelas 8/9)</th>
                      <th className="p-3.5 font-semibold">Kelas</th>
                      <th className="p-3.5 font-semibold">Jilid Iqro Saat Ini</th>
                      <th className="p-3.5 font-semibold">Jadwal Sesi</th>
                      <th className="p-3.5 font-semibold text-center">Total Sesi</th>
                      <th className="p-3.5 font-semibold text-center">Rata-rata Nilai</th>
                      <th className="p-3.5 font-semibold">Guru Pembimbing</th>
                      <th className="p-3.5 font-semibold">Status</th>
                      <th className="p-3.5 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMatrikulasiStudents.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <AvatarBadge
                              name={item.student?.name || 'Santri'}
                              photoUrl={item.student?.photo}
                              gender={item.student?.gender}
                              role="santri"
                              size="sm"
                              className="shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{item.student?.name}</p>
                              <p className="text-[11px] text-slate-500 font-mono">NIS: {item.student?.nis}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200">
                            {item.className}
                          </span>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-md bg-[#1E293B] text-[#D4AF37] text-xs font-black shadow-2xs">
                              {item.currentIqroJilid}
                            </span>
                            <span className="text-slate-600 font-semibold text-xs">
                              Hal. {item.currentIqroPage}
                            </span>
                          </div>
                          {item.initialReason && (
                            <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] truncate" title={item.initialReason}>
                              {item.initialReason}
                            </p>
                          )}
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">Sel</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">Rab</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">Kam</span>
                          </div>
                        </td>

                        <td className="p-3.5 text-center whitespace-nowrap font-bold text-slate-800">
                          {item.totalSessions} Sesi
                        </td>

                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            item.avgScore >= 85 ? 'bg-emerald-100 text-emerald-800' :
                            item.avgScore >= 75 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.avgScore > 0 ? item.avgScore : '-'}
                          </span>
                        </td>

                        <td className="p-3.5 whitespace-nowrap text-slate-700">
                          <p className="font-semibold">{item.teacherName}</p>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                            item.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            item.status === 'Lulus / Selesai' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {userRole !== 'wali' && (
                              <>
                                <button
                                  onClick={() => handleOpenRecordModal(item)}
                                  className="px-2.5 py-1 rounded bg-[#1E293B] text-[#D4AF37] hover:bg-slate-800 font-bold text-[11px] transition cursor-pointer shadow-2xs"
                                  title="Catat Bimbingan Sesi Ini"
                                >
                                  Input Sesi
                                </button>
                                <button
                                  onClick={() => handleOpenEditStudentModal(item)}
                                  className="p-1 text-slate-500 hover:text-slate-900 rounded transition cursor-pointer"
                                  title="Edit Data Santri Matrikulasi"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMatStudent(item.id, item.student?.name || '')}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="Hapus Dari Matrikulasi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                setSelectedReportStudentId(item.studentId);
                                setActiveTab('laporan');
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800 rounded transition cursor-pointer"
                              title="Lihat Lembar Laporan"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: JURNAL & CATATAN MUTABA'AH IQRO */}
      {/* ========================================================================= */}
      {activeTab === 'jurnal' && (
        <div className="space-y-4">
          
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedDayFilter}
                onChange={(e) => setSelectedDayFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden"
              >
                <option value="all">Semua Hari Bimbingan</option>
                <option value="Selasa">Hari Selasa</option>
                <option value="Rabu">Hari Rabu</option>
                <option value="Kamis">Hari Kamis</option>
              </select>

              <select
                value={selectedJilidFilter}
                onChange={(e) => setSelectedJilidFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden"
              >
                <option value="all">Semua Jilid Iqro</option>
                {IQRO_JILIDS.map(j => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>

            {userRole !== 'wali' && (
              <button
                onClick={() => handleOpenRecordModal()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1E293B] text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                + Catat Bimbingan Baru
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 font-semibold">Tanggal & Hari</th>
                    <th className="p-3.5 font-semibold">Nama Santri</th>
                    <th className="p-3.5 font-semibold">Jilid & Halaman</th>
                    <th className="p-3.5 font-semibold">Fokus Materi Pembinaan</th>
                    <th className="p-3.5 font-semibold text-center">Nilai (0-100)</th>
                    <th className="p-3.5 font-semibold">Keterangan</th>
                    <th className="p-3.5 font-semibold">Guru Pembimbing</th>
                    <th className="p-3.5 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrikulasiRecords
                    .filter(r => (selectedDayFilter === 'all' || r.day === selectedDayFilter) && (selectedJilidFilter === 'all' || r.jilid === selectedJilidFilter))
                    .map((rec) => {
                      const std = students.find(s => s.id === rec.studentId);
                      const cls = classes.find(c => c.id === std?.classId);
                      const tch = teachers.find(t => t.id === rec.teacherId);
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-bold text-slate-900">{rec.day}</span>
                            <p className="text-[11px] text-slate-500">{rec.date}</p>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <AvatarBadge
                                name={std?.name || 'Santri'}
                                photoUrl={std?.photo}
                                gender={std?.gender}
                                role="santri"
                                size="sm"
                                className="shrink-0"
                              />
                              <div>
                                <p className="font-bold text-slate-800">{std?.name}</p>
                                <p className="text-[10px] text-slate-500">{cls?.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-bold text-[#1E293B]">{rec.jilid}</span>
                            <p className="text-slate-500 text-[11px]">Halaman {rec.page}</p>
                          </td>
                          <td className="p-3.5">
                            <p className="font-semibold text-slate-800">{rec.materialFocus}</p>
                            {rec.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">{rec.notes}</p>}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded text-xs font-black ${
                              rec.score >= 85 ? 'bg-emerald-100 text-emerald-900' :
                              rec.score >= 75 ? 'bg-blue-100 text-blue-900' : 'bg-amber-100 text-amber-900'
                            }`}>
                              {rec.score}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold ${
                              rec.status === 'Lulus' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {rec.status === 'Lulus' ? '✓ Lulus' : '↻ Ulang'}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-slate-600">
                            {tch?.name || 'Ust. Pembimbing'}
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            {userRole !== 'wali' && (
                              <button
                                onClick={() => handleDeleteRecord(rec.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                title="Hapus Mutaba'ah"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LAPORAN & CETAK PERKEMBANGAN (KHUSUS LAPORAN NON-RAPORT) */}
      {/* ========================================================================= */}
      {activeTab === 'laporan' && (
        <div className="space-y-6">
          
          {/* Laporan Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Pilih Santri:</span>
                <select
                  value={selectedReportStudentId}
                  onChange={(e) => setSelectedReportStudentId(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:outline-hidden"
                >
                  {enrichedMatrikulasiStudents.map(ms => (
                    <option key={ms.studentId} value={ms.studentId}>
                      {ms.student?.name} ({ms.className} • {ms.currentIqroJilid})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setReportType('individu')}
                  className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    reportType === 'individu' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lembar Individu Santri
                </button>
                <button
                  onClick={() => setReportType('kolektif')}
                  className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                    reportType === 'kolektif' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rekapitulasi Kolektif (Kelas 8 & 9)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E293B] text-[#D4AF37] hover:bg-slate-800 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Lembar Laporan A4
              </button>
            </div>
          </div>

          {/* Printable Report Canvas */}
          <div className="bg-white rounded-xl border border-slate-300 p-6 sm:p-10 shadow-md max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
            
            {/* Kop Surat Resmi */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center relative">
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                  <LogoAlAzhar size={58} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                    YAYASAN PESANTREN ISLAM AL AZHAR
                  </h2>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                    {settings.schoolName || 'SMP ISLAM AL AZHAR 21'}
                  </h3>
                  <p className="text-[11px] text-slate-600 max-w-lg mx-auto">
                    {settings.schoolAddress || 'Jl. Al-Azhar No. 21, Kompleks Pendidikan Islam, Jakarta'}
                  </p>
                  <p className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider mt-0.5">
                    BIDANG PEMBINAAN TAHFIZH & MATRIKULASI METODE IQRO
                  </p>
                </div>
              </div>
            </div>

            {/* Judul Laporan */}
            <div className="text-center mb-6">
              <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                {reportType === 'individu' ? 'LEMBAR LAPORAN PERKEMBANGAN MATRIKULASI IQRO' : 'REKAPITULASI CAPAIAN MATRIKULASI IQRO (KELAS 8 & 9)'}
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Tahun Ajaran {settings.academicYear || '2026/2027'} • Semester {settings.semester || 'Ganjil'} • Sesi: Selasa, Rabu, Kamis
              </p>
              <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                Dokumen Laporan Perkembangan Internal (Non-Raport Reguler)
              </span>
            </div>

            {reportType === 'individu' && currentReportStudent ? (
              <div className="space-y-6">
                
                {/* Identitas Santri */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Nama Lengkap:</span>
                    <strong className="text-slate-900 font-bold">{currentReportStudent.student?.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">NIS / NISN:</span>
                    <strong className="text-slate-900 font-mono">{currentReportStudent.student?.nis} / {currentReportStudent.student?.nisn}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Kelas & Jenjang:</span>
                    <strong className="text-slate-900">{currentReportStudent.className} (Tingkat {currentReportStudent.grade})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Capaian Jilid Saat Ini:</span>
                    <strong className="text-[#1E293B] font-black">{currentReportStudent.currentIqroJilid} (Hal. {currentReportStudent.currentIqroPage})</strong>
                  </div>
                </div>

                {/* Ringkasan Evaluasi & Capaian */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                    <span className="text-[11px] font-bold text-emerald-900 block">Rata-Rata Nilai</span>
                    <span className="text-2xl font-black text-emerald-800 mt-1 block">
                      {currentReportStudentRecords.length > 0
                        ? Math.round(currentReportStudentRecords.reduce((acc, r) => acc + r.score, 0) / currentReportStudentRecords.length)
                        : 85}
                    </span>
                    <span className="text-[10px] text-emerald-700">Skor Bimbingan (0-100)</span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                    <span className="text-[11px] font-bold text-blue-900 block">Keterangan Terakhir</span>
                    <span className={`text-lg font-black mt-1.5 block ${
                      currentReportStudentRecords[0]?.status === 'Lulus' ? 'text-emerald-700' : 'text-amber-800'
                    }`}>
                      {currentReportStudentRecords[0]?.status ? `✓ ${currentReportStudentRecords[0].status}` : '✓ Lulus'}
                    </span>
                    <span className="text-[10px] text-blue-700">Hasil Sesi Terakhir</span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-center">
                    <span className="text-[11px] font-bold text-amber-900 block">Posisi Materi</span>
                    <span className="text-base font-black text-amber-900 mt-1.5 block truncate">
                      {currentReportStudent.currentIqroJilid}
                    </span>
                    <span className="text-[10px] text-amber-700">Halaman {currentReportStudent.currentIqroPage} dari 32</span>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
                    <span className="text-[11px] font-bold text-purple-900 block">Total Sesi Mutaba'ah</span>
                    <span className="text-2xl font-black text-purple-800 mt-1 block">
                      {currentReportStudentRecords.length}
                    </span>
                    <span className="text-[10px] text-purple-700">Sesi Terlaksana</span>
                  </div>
                </div>

                {/* Tabel Log Sesi Bimbingan */}
                <div>
                  <h5 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Riwayat Sesi Bimbingan Harian (Selasa, Rabu, Kamis)
                  </h5>
                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="p-2 border border-slate-200 font-semibold">Tanggal & Hari</th>
                        <th className="p-2 border border-slate-200 font-semibold">Jilid & Hal</th>
                        <th className="p-2 border border-slate-200 font-semibold">Materi Pembinaan</th>
                        <th className="p-2 border border-slate-200 font-semibold text-center">Nilai (0-100)</th>
                        <th className="p-2 border border-slate-200 font-semibold">Keterangan</th>
                        <th className="p-2 border border-slate-200 font-semibold">Catatan Guru Pembimbing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentReportStudentRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-3 text-center text-slate-500 italic">
                            Belum ada riwayat sesi bimbingan yang tercatat.
                          </td>
                        </tr>
                      ) : (
                        currentReportStudentRecords.map((r) => (
                          <tr key={r.id} className="border-b border-slate-100">
                            <td className="p-2 border border-slate-200 whitespace-nowrap">
                              <span className="font-bold text-slate-800">{r.day}</span>, {r.date}
                            </td>
                            <td className="p-2 border border-slate-200 font-bold whitespace-nowrap">
                              {r.jilid} Hal. {r.page}
                            </td>
                            <td className="p-2 border border-slate-200">{r.materialFocus}</td>
                            <td className="p-2 border border-slate-200 text-center font-bold">{r.score}</td>
                            <td className="p-2 border border-slate-200 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.status === 'Lulus' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {r.status === 'Lulus' ? '✓ Lulus' : '↻ Ulang'}
                              </span>
                            </td>
                            <td className="p-2 border border-slate-200 text-slate-600 italic text-[11px]">
                              {r.notes || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Catatan Kesimpulan & Rekomendasi */}
                <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-amber-950">
                  <span className="font-bold block mb-1">Catatan Evaluasi Perkembangan & Rekomendasi Pembimbing:</span>
                  <p className="leading-relaxed">
                    {currentReportStudent.notes || 'Ananda menunjukkan antusiasme dan peningkatan dalam membedakan huruf serupa serta melafalkan kaidah mad 2 harakat dengan stabil. Disarankan untuk konsisten mempraktikkan tilawah 1 halaman setiap selesai shalat fardhu.'}
                  </p>
                </div>

              </div>
            ) : (
              /* Tabel Rekapitulasi Kolektif */
              <div className="space-y-4">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-2 border border-slate-200 font-semibold">No</th>
                      <th className="p-2 border border-slate-200 font-semibold">NIS</th>
                      <th className="p-2 border border-slate-200 font-semibold">Nama Santri</th>
                      <th className="p-2 border border-slate-200 font-semibold">Kelas</th>
                      <th className="p-2 border border-slate-200 font-semibold">Jilid Iqro</th>
                      <th className="p-2 border border-slate-200 font-semibold text-center">Total Sesi</th>
                      <th className="p-2 border border-slate-200 font-semibold text-center">Rata-Rata</th>
                      <th className="p-2 border border-slate-200 font-semibold">Status</th>
                      <th className="p-2 border border-slate-200 font-semibold">Guru Pembimbing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedMatrikulasiStudents.map((ms, idx) => (
                      <tr key={ms.id} className="border-b border-slate-100">
                        <td className="p-2 border border-slate-200 text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border border-slate-200 font-mono">{ms.student?.nis}</td>
                        <td className="p-2 border border-slate-200 font-bold text-slate-900">{ms.student?.name}</td>
                        <td className="p-2 border border-slate-200">{ms.className}</td>
                        <td className="p-2 border border-slate-200 font-bold text-[#1E293B]">
                          {ms.currentIqroJilid} Hal. {ms.currentIqroPage}
                        </td>
                        <td className="p-2 border border-slate-200 text-center">{ms.totalSessions}</td>
                        <td className="p-2 border border-slate-200 text-center font-bold">{ms.avgScore > 0 ? ms.avgScore : '-'}</td>
                        <td className="p-2 border border-slate-200 font-semibold">{ms.status}</td>
                        <td className="p-2 border border-slate-200">{ms.teacherName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tanda Tangan Resmi */}
            <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-xs">
              <div>
                <p className="text-slate-500">Mengetahui,</p>
                <p className="font-bold text-slate-800">Kepala Sekolah</p>
                <div className="h-16 flex items-end justify-center">
                  <p className="font-bold underline text-slate-900">{settings.headmasterName || 'Drs. H. Sulaiman Affandi, M.Pd.'}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-500">Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold text-slate-800">Koordinator Tahfizh</p>
                <div className="h-16 flex items-end justify-center">
                  <p className="font-bold underline text-slate-900">{settings.tahfizhCoordinator || 'Ustadz Ahmad Fauzan, Lc., M.Ag.'}</p>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <p className="text-slate-500">Pembimbing Matrikulasi,</p>
                <p className="font-bold text-slate-800">Guru Pembimbing Iqro</p>
                <div className="h-16 flex items-end justify-center">
                  <p className="font-bold underline text-slate-900">
                    {currentReportStudent?.teacherName || 'Ustadz M. Ridwan, M.Ag.'}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SILABUS & PANDUAN 6 JILID IQRO */}
      {/* ========================================================================= */}
      {activeTab === 'silabus' && (
        <div className="space-y-4">
          
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#D4AF37]" />
              Struktur Kurikulum & Silabus Buku Iqro Jilid 1 s/d 6
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Panduan standarisasi pembelajaran matrikulasi baca Al-Qur'an terstruktur dari pengenalan huruf hijaiyyah dasar hingga hukum tajwid lanjutan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {IQRO_SYLLABUS.map((item, idx) => (
              <div key={item.jilid} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-md bg-[#1E293B] text-[#D4AF37] text-xs font-black shadow-2xs">
                      {item.jilid}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {item.totalPages} Halaman
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {item.description}
                  </p>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3 text-center">
                    <span className="text-[10px] text-slate-500 block mb-1 font-semibold">Contoh Kaidah Huruf:</span>
                    <span className="font-arabic text-lg text-slate-900 font-bold tracking-widest block dir-rtl" dir="rtl">
                      {item.arabicExample}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700">
                    <span className="font-bold text-slate-800 block text-[11px]">Materi Pokok:</span>
                    <ul className="space-y-1">
                      {item.keyTopics.map((topic, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Tips Pembimbing: </span>
                  {item.guidanceTips[0]}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: DAFTARKAN SANTRI MATRIKULASI (KELAS 8 & 9) */}
      {/* ========================================================================= */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Daftarkan Santri Matrikulasi Iqro</h3>
                  <p className="text-xs text-slate-500">Khusus santri pilihan Kelas 8 dan Kelas 9</p>
                </div>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Pilih Santri (Kelas 8 & 9) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={enrollStudentId}
                  onChange={(e) => setEnrollStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:ring-1 focus:ring-[#D4AF37] focus:outline-hidden"
                >
                  <option value="">-- Pilih Santri Kelas 8 atau 9 --</option>
                  {grade8and9Students.map(s => {
                    const cls = classes.find(c => c.id === s.classId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({cls?.name || 'Kelas'}) - NIS: {s.nis}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  *Menampilkan santri aktif di rombel kelas 8A, 8B, 9A, dan 9B.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Jilid Iqro Awal</label>
                  <select
                    value={enrollJilid}
                    onChange={(e) => setEnrollJilid(e.target.value as IqroJilid)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-[#1E293B]"
                  >
                    {IQRO_JILIDS.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Halaman Awal</label>
                  <input
                    type="number"
                    min={1}
                    max={32}
                    value={enrollPage}
                    onChange={(e) => setEnrollPage(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Guru Pembimbing Iqro</label>
                <select
                  value={enrollTeacherId}
                  onChange={(e) => setEnrollTeacherId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Jadwal Sesi Matrikulasi</label>
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center justify-between text-[11px]">
                  <span>Setiap Hari: Selasa, Rabu, dan Kamis</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-950">13.30 - 15.00</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Alasan Penempatan / Catatan Awal</label>
                <textarea
                  rows={2}
                  value={enrollReason}
                  onChange={(e) => setEnrollReason(e.target.value)}
                  placeholder="Contoh: Perbaikan pengucapan makhraj huruf hams dan pemantapan mad 2 harakat."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1E293B] text-[#D4AF37] font-bold hover:bg-slate-800 transition cursor-pointer shadow-xs"
                >
                  Simpan & Daftarkan
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CATAT SESI MUTABA'AH BIMBINGAN IQRO */}
      {/* ========================================================================= */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1E293B] text-[#D4AF37] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Catat Mutaba'ah Bimbingan Iqro</h3>
                  <p className="text-xs text-slate-500">Sesi Bimbingan: Selasa, Rabu, atau Kamis</p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Pilih Santri Terbina</label>
                  <select
                    value={recordStudentId}
                    onChange={(e) => {
                      setRecordStudentId(e.target.value);
                      const target = matrikulasiStudents.find(s => s.studentId === e.target.value);
                      if (target) {
                        setRecordJilid(target.currentIqroJilid);
                        setRecordPage(target.currentIqroPage);
                        setRecordTeacherId(target.assignedTeacherId);
                      }
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                  >
                    {enrichedMatrikulasiStudents.map(s => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.student?.name} ({s.className} • {s.currentIqroJilid})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Hari Bimbingan</label>
                  <select
                    value={recordDay}
                    onChange={(e) => setRecordDay(e.target.value as MatrikulasiDay)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-emerald-800"
                  >
                    <option value="Selasa">Hari Selasa</option>
                    <option value="Rabu">Hari Rabu</option>
                    <option value="Kamis">Hari Kamis</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Jilid Iqro</label>
                  <select
                    value={recordJilid}
                    onChange={(e) => setRecordJilid(e.target.value as IqroJilid)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-[#1E293B]"
                  >
                    {IQRO_JILIDS.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Halaman</label>
                  <input
                    type="number"
                    min={1}
                    max={32}
                    value={recordPage}
                    onChange={(e) => setRecordPage(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Fokus Materi Pembinaan Sesi Ini</label>
                <input
                  type="text"
                  value={recordMaterialFocus}
                  onChange={(e) => setRecordMaterialFocus(e.target.value)}
                  placeholder="Contoh: Pemantapan Qalqalah Sughra & Huruf Hams"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              {/* Input Nilai & Keterangan Lulus/Ulang */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-800 mb-1 text-xs">
                    Input Nilai Bimbingan (0 - 100) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={recordScore}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRecordScore(val);
                        // Auto suggest status if score is high/low
                        if (val >= 75 && recordStatus === 'Ulang') {
                          setRecordStatus('Lulus');
                        } else if (val < 75 && recordStatus === 'Lulus') {
                          setRecordStatus('Ulang');
                        }
                      }}
                      className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl font-black text-xl text-slate-900 text-center focus:border-[#D4AF37] focus:outline-hidden"
                      placeholder="85"
                    />
                    <span className="absolute right-3 top-3.5 text-xs font-bold text-slate-400">/ 100</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 text-center">
                    *Standar ketuntasan: Nilai ≥ 75 dianjurkan Lulus.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 text-xs">
                    Keterangan Hasil Sesi <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setRecordStatus('Lulus')}
                      className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        recordStatus === 'Lulus'
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Lulus</span>
                      <span className={`text-[9px] font-normal ${recordStatus === 'Lulus' ? 'text-emerald-100' : 'text-slate-400'}`}>
                        Lanjut materi
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecordStatus('Ulang')}
                      className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        recordStatus === 'Ulang'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <RotateCcw className="w-5 h-5" />
                      <span>Ulang</span>
                      <span className={`text-[9px] font-normal ${recordStatus === 'Ulang' ? 'text-amber-100' : 'text-slate-400'}`}>
                        Pemantapan
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Guru Pembimbing</label>
                <select
                  value={recordTeacherId}
                  onChange={(e) => setRecordTeacherId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Catatan Evaluasi / Pesan Pembinaan</label>
                <textarea
                  rows={2}
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  placeholder="Catatan perkembangan khusus santri..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1E293B] text-[#D4AF37] font-bold hover:bg-slate-800 transition cursor-pointer shadow-xs"
                >
                  Simpan Catatan Mutaba'ah
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT DATA SANTRI MATRIKULASI */}
      {/* ========================================================================= */}
      {isEditStudentModalOpen && selectedMatStudentForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Data Santri Matrikulasi</h3>
                <p className="text-xs text-slate-500">Perbarui status kelulusan atau jilid santri</p>
              </div>
              <button
                onClick={() => setIsEditStudentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditStudentSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Jilid Iqro Saat Ini</label>
                  <select
                    value={editJilid}
                    onChange={(e) => setEditJilid(e.target.value as IqroJilid)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    {IQRO_JILIDS.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Halaman</label>
                  <input
                    type="number"
                    min={1}
                    max={32}
                    value={editPage}
                    onChange={(e) => setEditPage(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Status Program Matrikulasi</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                >
                  <option value="Aktif">Aktif (Sedang Menjalani Bimbingan)</option>
                  <option value="Lulus / Selesai">Lulus / Selesai (Siap Masuk Tahfizh Reguler)</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Guru Pembimbing</label>
                <select
                  value={editTeacherId}
                  onChange={(e) => setEditTeacherId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Catatan Perkembangan</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditStudentModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1E293B] text-[#D4AF37] font-bold hover:bg-slate-800 transition cursor-pointer"
                >
                  Perbarui Data
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
