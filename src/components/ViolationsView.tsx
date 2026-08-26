import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Phone, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Trash2, 
  Edit3, 
  Download, 
  Printer, 
  User, 
  BookOpen, 
  BookMarked, 
  HelpCircle,
  X,
  AlertCircle,
  Check,
  Share2,
  ShieldAlert,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { Student, Teacher, ClassItem, TahfizhViolation, ViolationType, Role } from '../types';
import { storageService } from '../services/storageService';

interface ViolationsViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassItem[];
  violations: TahfizhViolation[];
  userRole?: Role;
  onRefreshData: () => void;
  onOpenStudentDetail?: (studentId: string) => void;
}

export const VIOLATION_PRESETS: {
  type: ViolationType;
  name: string;
  defaultPoints: number;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconBg: string;
  iconColor: string;
  description: string;
  defaultAction: string;
}[] = [
  {
    type: 'tidak_setoran',
    name: 'Tidak Setoran',
    defaultPoints: 10,
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    description: 'Santri tidak menyetorkan hafalan/muroja\'ah pada sesi halaqah tanpa keterangan syar\'i.',
    defaultAction: 'Pembinaan ustadz pengampu, muraja\'ah dobel mandiri 1 halaman, & setoran susulan.'
  },
  {
    type: 'kurang_baris_ayat',
    name: 'Kurang Baris/Ayat',
    defaultPoints: 5,
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    description: 'Setoran hafalan baru atau muroja\'ah belum memenuhi target baris/ayat harian minimal.',
    defaultAction: 'Muroja\'ah mandiri 15 menit & menuntaskan sisa baris/ayat pada waktu istirahat.'
  },
  {
    type: 'tidak_bawa_mutabaah',
    name: 'Tidak Membawa Buku Mutaba\'ah',
    defaultPoints: 5,
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    description: 'Buku mutaba\'ah yaumiyah tahfizh tertinggal di rumah/asrama saat sesi halaqah.',
    defaultAction: 'Teguran lisan & menyalin catatan paraf setoran sementara ke buku mutaba\'ah esok pagi.'
  },
  {
    type: 'tidak_bawa_ummi',
    name: 'Tidak Membawa Buku Ummi',
    defaultPoints: 5,
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    description: 'Buku jilid Metode Ummi / Gharib / Tajwid tertinggal saat halaqah pembelajaran Ummi.',
    defaultAction: 'Menyimak mushaf/buku peraga bersama & komitmen membawa di halaqah selanjutnya.'
  }
];

export const ViolationsView: React.FC<ViolationsViewProps> = ({
  students,
  teachers,
  classes,
  violations,
  userRole = 'admin',
  onRefreshData,
  onOpenStudentDetail
}) => {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingViolation, setEditingViolation] = useState<TahfizhViolation | null>(null);

  // Form Fields
  const [formStudentId, setFormStudentId] = useState('');
  const [formTeacherId, setFormTeacherId] = useState(teachers[0]?.id || '');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formType, setFormType] = useState<ViolationType>('tidak_setoran');
  const [formPoint, setFormPoint] = useState<number>(10);
  const [formDetails, setFormDetails] = useState('');
  const [formActionTaken, setFormActionTaken] = useState(VIOLATION_PRESETS[0].defaultAction);
  const [formStatus, setFormStatus] = useState<'Tercatat' | 'Dalam Pembinaan' | 'Selesai / Dituntaskan'>('Tercatat');
  const [formNotes, setFormNotes] = useState('');
  const [sendWhatsAppDirectly, setSendWhatsAppDirectly] = useState(false);

  // Quick stats calculation
  const stats = useMemo(() => {
    const total = violations.length;
    const countTidakSetoran = violations.filter(v => v.type === 'tidak_setoran').length;
    const countKurangBaris = violations.filter(v => v.type === 'kurang_baris_ayat').length;
    const countTidakBawaMutabaah = violations.filter(v => v.type === 'tidak_bawa_mutabaah').length;
    const countTidakBawaUmmi = violations.filter(v => v.type === 'tidak_bawa_ummi').length;
    const countDalamPembinaan = violations.filter(v => v.status === 'Dalam Pembinaan' || v.status === 'Tercatat').length;
    const countSelesai = violations.filter(v => v.status === 'Selesai / Dituntaskan').length;

    return {
      total,
      countTidakSetoran,
      countKurangBaris,
      countTidakBawaMutabaah,
      countTidakBawaUmmi,
      countDalamPembinaan,
      countSelesai
    };
  }, [violations]);

  // Filtered List
  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      const student = students.find(s => s.id === v.studentId);
      const studentClass = classes.find(c => c.id === student?.classId);

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const studentName = student?.name.toLowerCase() || '';
        const nis = student?.nis.toLowerCase() || '';
        const details = (v.details || '').toLowerCase();
        const action = (v.actionTaken || '').toLowerCase();
        const typeName = v.typeName.toLowerCase();
        if (!studentName.includes(q) && !nis.includes(q) && !details.includes(q) && !action.includes(q) && !typeName.includes(q)) {
          return false;
        }
      }

      // Type Filter
      if (selectedTypeFilter !== 'all' && v.type !== selectedTypeFilter) {
        return false;
      }

      // Class Filter
      if (selectedClassFilter !== 'all' && student?.classId !== selectedClassFilter) {
        return false;
      }

      // Status Filter
      if (selectedStatusFilter !== 'all' && v.status !== selectedStatusFilter) {
        return false;
      }

      return true;
    });
  }, [violations, students, classes, searchQuery, selectedTypeFilter, selectedClassFilter, selectedStatusFilter]);

  // Handle Preset Change
  const handleSelectPreset = (preset: typeof VIOLATION_PRESETS[0]) => {
    setFormType(preset.type);
    setFormPoint(preset.defaultPoints);
    if (!formActionTaken || VIOLATION_PRESETS.some(p => p.defaultAction === formActionTaken)) {
      setFormActionTaken(preset.defaultAction);
    }
  };

  const handleOpenCreateModal = (studentId?: string, defaultType?: ViolationType) => {
    setEditingViolation(null);
    setFormStudentId(studentId || students[0]?.id || '');
    setFormTeacherId(teachers[0]?.id || '');
    setFormDate(new Date().toISOString().split('T')[0]);
    
    const preset = VIOLATION_PRESETS.find(p => p.type === defaultType) || VIOLATION_PRESETS[0];
    setFormType(preset.type);
    setFormPoint(preset.defaultPoints);
    setFormDetails('');
    setFormActionTaken(preset.defaultAction);
    setFormStatus('Tercatat');
    setFormNotes('');
    setSendWhatsAppDirectly(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (v: TahfizhViolation) => {
    setEditingViolation(v);
    setFormStudentId(v.studentId);
    setFormTeacherId(v.teacherId);
    setFormDate(v.date);
    setFormType(v.type);
    setFormPoint(v.point);
    setFormDetails(v.details || '');
    setFormActionTaken(v.actionTaken || '');
    setFormStatus(v.status);
    setFormNotes(v.notes || '');
    setSendWhatsAppDirectly(false);
    setIsModalOpen(true);
  };

  const handleSaveViolation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId) {
      alert('Silakan pilih santri terlebih dahulu.');
      return;
    }

    const preset = VIOLATION_PRESETS.find(p => p.type === formType);
    const typeName = preset?.name || 'Pelanggaran Tahfizh';

    const violationData: TahfizhViolation = {
      id: editingViolation ? editingViolation.id : `vio-${Date.now()}`,
      studentId: formStudentId,
      teacherId: formTeacherId || teachers[0]?.id || 't-1',
      date: formDate,
      type: formType,
      typeName: typeName,
      point: formPoint,
      details: formDetails,
      actionTaken: formActionTaken,
      status: formStatus,
      resolvedDate: formStatus === 'Selesai / Dituntaskan' ? (editingViolation?.resolvedDate || new Date().toISOString().split('T')[0]) : undefined,
      notes: formNotes
    };

    if (editingViolation) {
      storageService.updateViolation(violationData);
    } else {
      storageService.addViolation(violationData);
    }

    onRefreshData();
    setIsModalOpen(false);

    if (sendWhatsAppDirectly) {
      const student = students.find(s => s.id === formStudentId);
      if (student) {
        handleSendWhatsApp(violationData, student);
      }
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus catatan pelanggaran ini?')) {
      storageService.deleteViolation(id);
      onRefreshData();
    }
  };

  const handleToggleResolved = (v: TahfizhViolation) => {
    const isNowDone = v.status !== 'Selesai / Dituntaskan';
    const updated: TahfizhViolation = {
      ...v,
      status: isNowDone ? 'Selesai / Dituntaskan' : 'Tercatat',
      resolvedDate: isNowDone ? new Date().toISOString().split('T')[0] : undefined
    };
    storageService.updateViolation(updated);
    onRefreshData();
  };

  const handleSendWhatsApp = (v: TahfizhViolation, student: Student) => {
    const teacher = teachers.find(t => t.id === v.teacherId);
    const phone = student.parentPhone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;

    const message = encodeURIComponent(
      `*PEMBERITAHUAN KEDISIPLINAN TAHFIZH & METODE UMMI*\n` +
      `*SMP ISLAM AL AZHAR 21 SUKOHARJO*\n\n` +
      `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n` +
      `Yth. Bapak/Ibu ${student.parentName} (Wali dari ${student.name}),\n\n` +
      `Menginformasikan catatan kedisiplinan ananda pada halaqah tahfizh hari ini:\n` +
      `📅 *Tanggal:* ${v.date}\n` +
      `⚠️ *Catatan:* ${v.typeName}\n` +
      `${v.details ? `📝 *Keterangan:* ${v.details}\n` : ''}` +
      `🛡️ *Tindakan/Pembinaan:* ${v.actionTaken}\n` +
      `📌 *Status:* ${v.status}\n\n` +
      `Mohon bantuan dan pendampingan Bapak/Ibu di rumah agar ananda senantiasa disiplin membawa buku mutaba'ah/Ummi serta istiqomah muroja'ah hafalan Al-Qur'an. Jazaakumullahu khairan katsiran.\n\n` +
      `_Guru Halaqah: ${teacher?.name || 'Ustadz Pengampu'}_`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleExportCSV = () => {
    const csvContent = storageService.exportViolationsToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap_pelanggaran_tahfizh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      
      {/* Header Banner */}
      <div className="bg-[#1E293B] text-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-[#D4AF37] text-xs font-semibold border border-amber-400/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              Monitoring Kedisiplinan Halaqah
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Pelanggaran & Pembinaan Tahfizh
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Pencatatan kedisiplinan santri mencakup: <strong>Tidak Setoran</strong>, <strong>Kurang Baris/Ayat</strong>, <strong>Tidak Membawa Buku Mutaba'ah</strong>, dan <strong>Tidak Membawa Buku Ummi</strong> beserta tindakan edukatif dan notifikasi WhatsApp orang tua.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {userRole !== 'wali' && (
              <button
                onClick={() => handleOpenCreateModal()}
                className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Pelanggaran</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4 Core Violation Categories Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {VIOLATION_PRESETS.map((preset) => {
          const count = violations.filter(v => v.type === preset.type).length;
          const isSelected = selectedTypeFilter === preset.type;

          return (
            <div
              key={preset.type}
              onClick={() => setSelectedTypeFilter(isSelected ? 'all' : preset.type)}
              className={`p-4 rounded-xl border transition cursor-pointer relative overflow-hidden bg-white shadow-xs ${
                isSelected 
                  ? 'ring-2 ring-[#D4AF37] border-[#D4AF37]' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${preset.badgeBg} ${preset.badgeText} ${preset.badgeBorder}`}>
                  {preset.name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {preset.defaultPoints} Poin
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900">{count}</span>
                <span className="text-[11px] text-slate-500">Kasus Tercatat</span>
              </div>

              <p className="text-[10px] text-slate-500 mt-2 line-clamp-1">
                {preset.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari santri, NIS, atau kronologi pelanggaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            />
          </div>

          {/* Quick Select Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Filter Jenis */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="all">Semua Jenis Pelanggaran</option>
              <option value="tidak_setoran">1. Tidak Setoran</option>
              <option value="kurang_baris_ayat">2. Kurang Baris/Ayat</option>
              <option value="tidak_bawa_mutabaah">3. Tidak Membawa Mutaba'ah</option>
              <option value="tidak_bawa_ummi">4. Tidak Membawa Buku Ummi</option>
            </select>

            {/* Filter Kelas */}
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="all">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Filter Status */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="Tercatat">Tercatat</option>
              <option value="Dalam Pembinaan">Dalam Pembinaan</option>
              <option value="Selesai / Dituntaskan">Selesai / Dituntaskan</option>
            </select>

            {(searchQuery || selectedTypeFilter !== 'all' || selectedClassFilter !== 'all' || selectedStatusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTypeFilter('all');
                  setSelectedClassFilter('all');
                  setSelectedStatusFilter('all');
                }}
                className="py-2 px-3 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Violation Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800">
              Daftar Catatan Kedisiplinan Santri ({filteredViolations.length} Data)
            </h2>
          </div>

          <div className="text-[11px] text-slate-500">
            Tuntas: <strong className="text-emerald-700">{stats.countSelesai}</strong> • Pembinaan: <strong className="text-amber-700">{stats.countDalamPembinaan}</strong>
          </div>
        </div>

        {filteredViolations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Alhamdulillah, Tidak Ada Data Pelanggaran</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Semua santri disiplin memenuhi setoran tahfizh dan perlengkapan mutaba'ah sesuai filter yang dipilih.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Santri</th>
                  <th className="py-3 px-4">Jenis Pelanggaran</th>
                  <th className="py-3 px-4">Kronologi & Keterangan</th>
                  <th className="py-3 px-4">Tindakan Pembinaan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredViolations.map((v) => {
                  const student = students.find(s => s.id === v.studentId);
                  const studentClass = classes.find(c => c.id === student?.classId);
                  const teacher = teachers.find(t => t.id === v.teacherId);
                  const preset = VIOLATION_PRESETS.find(p => p.type === v.type) || VIOLATION_PRESETS[0];

                  const isResolved = v.status === 'Selesai / Dituntaskan';

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Tanggal */}
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap align-top">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{v.date}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Oleh: {teacher?.name?.split(' ')[0] || 'Guru'}</span>
                      </td>

                      {/* Santri */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={student?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={student?.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <button
                              onClick={() => student && onOpenStudentDetail && onOpenStudentDetail(student.id)}
                              className="font-bold text-slate-900 hover:text-[#8C7015] hover:underline text-left cursor-pointer"
                            >
                              {student?.name || 'Santri'}
                            </button>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                              <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                                {studentClass?.name || 'Kelas'}
                              </span>
                              <span>NIS: {student?.nis}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Jenis Pelanggaran */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${preset.badgeBg} ${preset.badgeText} ${preset.badgeBorder}`}>
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          {v.typeName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block mt-1">
                          Poin: -{v.point}
                        </span>
                      </td>

                      {/* Kronologi / Detail */}
                      <td className="py-3 px-4 align-top max-w-xs">
                        <p className="text-slate-800 text-xs font-normal">
                          {v.details || '-'}
                        </p>
                        {v.notes && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">
                            Note: {v.notes}
                          </p>
                        )}
                      </td>

                      {/* Tindakan Pembinaan */}
                      <td className="py-3 px-4 align-top max-w-xs">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Pembinaan:</span>
                          <p className="text-slate-700 text-[11px] leading-relaxed">
                            {v.actionTaken || '-'}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 align-top text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleResolved(v)}
                          title="Klik untuk ubah status"
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                            isResolved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : v.status === 'Dalam Pembinaan'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {isResolved ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Tuntas</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>{v.status}</span>
                            </>
                          )}
                        </button>
                        {isResolved && v.resolvedDate && (
                          <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">{v.resolvedDate}</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {student && (
                            <button
                              onClick={() => handleSendWhatsApp(v, student)}
                              title="Kirim Notifikasi WA ke Orang Tua"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition border border-emerald-200 cursor-pointer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {userRole !== 'wali' && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(v)}
                                title="Edit Catatan"
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDelete(v.id)}
                                title="Hapus Catatan"
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
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

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/30">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {editingViolation ? 'Edit Catatan Pelanggaran' : 'Catat Pelanggaran Tahfizh Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Pencatatan kedisiplinan dan pembinaan santri
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveViolation} className="p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* Row 1: Santri & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Santri:*</label>
                  <select
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    required
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    <option value="">-- Pilih Santri --</option>
                    {students.map(s => {
                      const cName = classes.find(c => c.id === s.classId)?.name;
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} ({cName} - NIS: {s.nis})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Kejadian:*</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: 4 Pilihan Jenis Pelanggaran (Preset Cards) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Jenis Pelanggaran Tahfizh:*
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VIOLATION_PRESETS.map((p) => {
                    const isSelected = formType === p.type;
                    return (
                      <button
                        type="button"
                        key={p.type}
                        onClick={() => handleSelectPreset(p)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2 cursor-pointer ${
                          isSelected 
                            ? 'border-[#D4AF37] bg-amber-50/70 ring-1 ring-[#D4AF37]' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${p.iconBg} ${p.iconColor}`}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs leading-tight">{p.name}</p>
                          <span className="text-[10px] text-slate-500 font-mono">Poin: -{p.defaultPoints}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 3: Guru Pembimbing & Poin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Guru Pencatat:*</label>
                  <select
                    value={formTeacherId}
                    onChange={(e) => setFormTeacherId(e.target.value)}
                    required
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Poin Pelanggaran:</label>
                  <input
                    type="number"
                    value={formPoint}
                    onChange={(e) => setFormPoint(Number(e.target.value))}
                    min={1}
                    max={50}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Kronologi / Detail */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kronologi / Detail Kejadian:
                </label>
                <textarea
                  rows={2}
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  placeholder="Contoh: Kurang 4 baris di Surat Al-Mulk, atau buku tertinggal di rumah..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>

              {/* Row 5: Tindakan Pembinaan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tindakan Pembinaan Edukatif:*
                </label>
                <textarea
                  rows={2}
                  value={formActionTaken}
                  onChange={(e) => setFormActionTaken(e.target.value)}
                  required
                  placeholder="Contoh: Muroja'ah mandiri 15 menit & setoran susulan saat istirahat..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>

              {/* Row 6: Status & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Pembinaan:</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    <option value="Tercatat">Tercatat</option>
                    <option value="Dalam Pembinaan">Dalam Pembinaan</option>
                    <option value="Selesai / Dituntaskan">Selesai / Dituntaskan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan:</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Opsional"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              {/* Option: Send WhatsApp Notification */}
              {!editingViolation && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-bold text-emerald-900 text-xs">Kirim Notifikasi WhatsApp ke Wali</p>
                      <p className="text-[10px] text-emerald-700">Otomatis buka WhatsApp dengan format pesan resmi</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={sendWhatsAppDirectly}
                    onChange={(e) => setSendWhatsAppDirectly(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D4AF37] hover:bg-amber-400 text-slate-950 font-bold shadow-xs transition cursor-pointer"
                >
                  {editingViolation ? 'Simpan Perubahan' : 'Simpan Catatan'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
