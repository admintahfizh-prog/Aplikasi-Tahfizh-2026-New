import React, { useState, useMemo } from 'react';
import { 
  BookMarked, 
  Search, 
  Filter, 
  PlusCircle, 
  CheckCircle2, 
  Award, 
  Clock, 
  AlertCircle, 
  Sparkles,
  BookOpen,
  ChevronRight,
  UserCheck,
  ArrowUpDown,
  GraduationCap,
  Layers,
  HelpCircle,
  X,
  FileText,
  ChevronDown,
  Info,
  Calendar,
  Edit3,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import { UmmiRecord, Student, Teacher, ClassItem, Role } from '../types';
import { UMMI_SYLLABUS, UMMI_JILIDS, UmmiTopicDetail } from '../data/ummiData';
import { storageService } from '../services/storageService';
import { AvatarBadge } from './AvatarBadge';
import { getGradeFromScore, getGradeBadgeClass } from '../utils/gradeConversion';
import { isGrade7Class, isUmmiEnrolledStudent, isGrade8or9Student } from '../utils/gradeHelper';

interface UmmiViewProps {
  ummiRecords: UmmiRecord[];
  students: Student[];
  teachers: Teacher[];
  classes?: ClassItem[];
  userRole: Role;
  onOpenDailyInput: (studentId?: string) => void;
  onRefreshData: () => void;
  onOpenStudentDetail: (studentId: string) => void;
  onEditRecord?: (record: UmmiRecord) => void;
  onDeleteRecord?: (recordId: string) => void;
}

export const UmmiView: React.FC<UmmiViewProps> = ({
  ummiRecords,
  students,
  teachers,
  classes = [],
  userRole,
  onOpenDailyInput,
  onRefreshData,
  onOpenStudentDetail,
  onEditRecord,
  onDeleteRecord
}) => {
  // Tabs: 'all-classes' (Primary) | 'log' | 'syllabus'
  const [activeTab, setActiveTab] = useState<'all-classes' | 'log' | 'syllabus'>('all-classes');

  const [selectedJilidTab, setSelectedJilidTab] = useState<string>('Jilid 1');
  const [selectedJilidFilter, setSelectedJilidFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'class-asc' | 'class-desc' | 'date-desc' | 'date-asc' | 'name-asc' | 'jilid-asc' | 'score-desc'>('class-asc');
  
  // Active selected module for modal detail popup
  const [selectedModuleDetail, setSelectedModuleDetail] = useState<{
    jilid: string;
    module: UmmiTopicDetail;
  } | null>(null);

  // Helper to find teacher
  const getTeacher = (teacherId?: string) => teachers.find(t => t.id === teacherId);

  // Group latest records per student for the "All Classes" view
  const studentLatestUmmiRecords = useMemo(() => {
    const map = new Map<string, UmmiRecord>();
    const sorted = [...ummiRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const r of sorted) {
      if (!map.has(r.studentId)) {
        map.set(r.studentId, r);
      }
    }
    return map;
  }, [ummiRecords]);

  // Helper to normalize/clean Jilid string
  const normalizeUmmiJilid = (rawJilid?: string): string => {
    if (!rawJilid || rawJilid === '-') return 'Jilid 1';
    const trimmed = rawJilid.trim();
    const lower = trimmed.toLowerCase();
    if (lower === 'munaqasyah' || lower === 'munaqosyah') return 'Munaqosyah';
    if (lower === 'tahfidz' || lower === 'tahfizh') return 'Tahfizh';
    if (lower === 'alquran' || lower === "al-qur'an" || lower === 'al-quran') return "Al-Qur'an";
    if (lower === 'ghorib' || lower === 'gharib') return 'Gharib';
    if (lower === 'tajwid') return 'Tajwid';
    return trimmed;
  };

  // Helper to get student's actual active/effective Ummi Jilid (terkini dari setoran evaluasi atau data santri)
  const getStudentEffectiveJilid = (student: Student): string => {
    const rec = studentLatestUmmiRecords.get(student.id);
    return normalizeUmmiJilid(rec?.jilid || student.currentUmmiJilid);
  };

  // Kebijakan TP Ini: Hanya Kelas 7 yang mengikuti pembelajaran Ummi
  // Kelas 8 & 9 tidak mengikuti pembelajaran UMMI dan tidak masuk jilid Ummi
  const ummiEligibleClasses = useMemo(() => {
    const list = classes.filter(c => isGrade7Class(c));
    if (list.length > 0) return list;
    return [
      { id: 'cls-7a', name: '7A', level: 7, grade: '7', academicYear: '2026/2027', homeroomTeacherId: teachers[0]?.id || '' },
      { id: 'cls-7b', name: '7B', level: 7, grade: '7', academicYear: '2026/2027', homeroomTeacherId: teachers[1]?.id || '' }
    ];
  }, [classes, teachers]);

  // Santri yang berhak mengikuti Ummi (Kelas 7 saja)
  const ummiStudents = useMemo(() => {
    return students.filter(s => isUmmiEnrolledStudent(s, classes));
  }, [students, classes]);

  // Calculate students count per jilid (Khusus santri Kelas 7 yang mengikuti Ummi)
  // Pastikan sinkron sempurna antara angka rekap dan nama-nama santri yang tampil
  const studentDistribution = useMemo(() => {
    return UMMI_JILIDS.map(j => {
      const matchingStudents = ummiStudents.filter(s => {
        const effectiveJilid = getStudentEffectiveJilid(s);
        return effectiveJilid === j || effectiveJilid.toLowerCase() === j.toLowerCase();
      });
      return {
        jilid: j,
        count: matchingStudents.length,
        students: matchingStudents
      };
    });
  }, [ummiStudents, studentLatestUmmiRecords]);

  // Compute enriched classes
  const enrichedClasses = useMemo(() => {
    return ummiEligibleClasses
      .filter(c => !selectedClassFilter || c.id === selectedClassFilter)
      .filter(c => {
        if (userRole === 'wali') {
          return ummiStudents.some(s => s.classId === c.id);
        }
        return true;
      })
      .map(c => {
        const classStudents = ummiStudents.filter(s => {
          if (s.classId !== c.id) return false;
          
          const effectiveJilid = getStudentEffectiveJilid(s);
          const rec = studentLatestUmmiRecords.get(s.id);

          if (selectedJilidFilter && effectiveJilid.toLowerCase() !== selectedJilidFilter.toLowerCase()) {
            return false;
          }

          if (!searchTerm) return true;
          const term = searchTerm.toLowerCase();
          return (
            s.name.toLowerCase().includes(term) ||
            s.nis.toLowerCase().includes(term) ||
            effectiveJilid.toLowerCase().includes(term) ||
            (s.currentUmmiJilid || '').toLowerCase().includes(term) ||
            (rec?.materialName || '').toLowerCase().includes(term)
          );
        });

        const homeroom = teachers.find(t => t.id === c.homeroomTeacherId);

        return {
          ...c,
          homeroomTeacher: homeroom,
          students: classStudents
        };
      });
  }, [ummiEligibleClasses, ummiStudents, studentLatestUmmiRecords, selectedClassFilter, selectedJilidFilter, searchTerm, teachers, userRole]);

  // Filter records for log view (Hanya rekam santri yang mengikuti Ummi)
  const filteredRecords = ummiRecords.filter(r => {
    const std = students.find(s => s.id === r.studentId);
    if (!isUmmiEnrolledStudent(std, classes)) return false;

    const matchSearch = 
      (std?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.notes.toLowerCase().includes(searchTerm.toLowerCase());

    const matchClass = !selectedClassFilter || std?.classId === selectedClassFilter;
    const matchJilid = selectedJilidTab === 'Semua Jilid' || r.jilid === selectedJilidTab;
    const matchStatus = !statusFilter || r.status === statusFilter;

    return matchSearch && matchClass && matchJilid && matchStatus;
  });

  // Sort log records
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const stdA = students.find(s => s.id === a.studentId);
    const stdB = students.find(s => s.id === b.studentId);
    const clsA = classes.find(c => c.id === stdA?.classId);
    const clsB = classes.find(c => c.id === stdB?.classId);

    if (sortBy === 'class-asc') {
      const clsCompare = (clsA?.name || '').localeCompare(clsB?.name || '');
      if (clsCompare !== 0) return clsCompare;
      const nameCompare = (stdA?.name || '').localeCompare(stdB?.name || '');
      if (nameCompare !== 0) return nameCompare;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'class-desc') {
      const clsCompare = (clsB?.name || '').localeCompare(clsA?.name || '');
      if (clsCompare !== 0) return clsCompare;
      return (stdA?.name || '').localeCompare(stdB?.name || '');
    }
    if (sortBy === 'date-desc') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'date-asc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    if (sortBy === 'name-asc') {
      return (stdA?.name || '').localeCompare(stdB?.name || '');
    }
    if (sortBy === 'jilid-asc') {
      return a.jilid.localeCompare(b.jilid);
    }
    if (sortBy === 'score-desc') {
      return b.score - a.score;
    }
    return 0;
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus catatan setoran evaluasi Ummi ini?')) {
      if (onDeleteRecord) {
        onDeleteRecord(id);
      } else {
        storageService.deleteUmmiRecord(id);
        onRefreshData();
      }
    }
  };

  const handleExportCSV = () => {
    const csv = storageService.exportUmmiToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap_pembelajaran_ummi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-[#D4AF37]" />
            {userRole === 'wali'
              ? (students.length === 1 ? `Perkembangan Ummi: ${students[0].name}` : "Perkembangan Metode Ummi Ananda")
              : "Pembelajaran Al-Qur'an Metode Ummi"
            }
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {userRole === 'wali'
              ? "Catatan kenaikan jilid, halaman, fashohah, tajwid, dan kelulusan membaca Al-Qur'an ananda tercinta."
              : "Capaian jilid terkini seluruh kelas & santri lengkap dengan tanggal setoran, nilai huruf (A-D), edit, dan hapus."
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {userRole !== 'wali' && (
            <button
              onClick={() => onOpenDailyInput()}
              className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
              <span>+ Input Setoran Ummi</span>
            </button>
          )}
        </div>
      </div>

      {/* Policy Notice: Kelas 8 & 9 Tidak Mengikuti UMMI, Khusus Kelas 7 */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 sm:p-4 text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-slate-900">
            Kebijakan Kurikulum Pembelajaran Ummi TP 2026/2027:
          </p>
          <p className="text-slate-700 leading-relaxed">
            Pada tahun pengajaran ini, <strong>seluruh santri Kelas 8 dan 9 tidak mengikuti pembelajaran UMMI dan tidak masuk jilid Ummi</strong>. Pembelajaran Metode Ummi dikhususkan untuk <strong>seluruh santri Kelas 7</strong> (tetap berjalan sesuai capaian jilid masing-masing). Santri Kelas 8 dan 9 difokuskan pada Program Tahfizh dan Matrikulasi.
          </p>
        </div>
      </div>

      {/* Primary View Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all-classes')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'all-classes'
                ? 'bg-[#1E293B] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
            <span>Semua Kelas: Capaian Terakhir Santri</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'all-classes' ? 'bg-[#D4AF37] text-slate-950' : 'bg-slate-100 text-slate-700'
            }`}>
              {ummiStudents.length} Santri (Kelas 7)
            </span>
          </button>

          <button
            onClick={() => setActiveTab('log')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'log'
                ? 'bg-[#1E293B] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-[#D4AF37]" />
            <span>Riwayat Log Evaluasi</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'log' ? 'bg-[#D4AF37] text-slate-950' : 'bg-slate-100 text-slate-700'
            }`}>
              {filteredRecords.length} Setoran
            </span>
          </button>

          <button
            onClick={() => setActiveTab('syllabus')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'syllabus'
                ? 'bg-[#1E293B] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-[#D4AF37]" />
            <span>Silabus & Panduan Talaqqi</span>
          </button>
        </div>

        {/* Quick Class Selector Bar (Khusus Rombel yang Mengikuti Ummi - Kelas 7) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setSelectedClassFilter('')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer shrink-0 ${
              selectedClassFilter === '' 
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Kelas 7
          </button>
          {ummiEligibleClasses.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedClassFilter(selectedClassFilter === c.id ? '' : c.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer shrink-0 ${
                selectedClassFilter === c.id
                  ? 'bg-[#D4AF37] text-slate-950 font-black shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Kelas {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Distribution Badges per Jilid (Sinkron Sempurna Antara Rekap Angka & Data Nama) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2.5">
        {studentDistribution.map((item) => {
          const isSelected = selectedJilidFilter === item.jilid || (activeTab === 'log' && selectedJilidTab === item.jilid);
          const studentNames = item.students.map(s => s.name).join(', ');
          const isMunaqosyah = item.jilid === 'Munaqosyah';
          const isTahfizh = item.jilid === 'Tahfizh';

          return (
            <div 
              key={item.jilid}
              onClick={() => {
                if (activeTab === 'all-classes') {
                  setSelectedJilidFilter(selectedJilidFilter === item.jilid ? '' : item.jilid);
                  setSelectedJilidTab(item.jilid);
                } else {
                  setSelectedJilidTab(selectedJilidTab === item.jilid ? 'Semua Jilid' : item.jilid);
                }
              }}
              title={item.count > 0 ? `Santri di ${item.jilid} (${item.count} Anak): ${studentNames}` : `Belum ada santri di ${item.jilid}`}
              className={`p-3 rounded-xl border transition cursor-pointer relative group ${
                isSelected
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs ring-2 ring-[#D4AF37]'
                  : isMunaqosyah
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 hover:border-emerald-400 hover:shadow-2xs'
                    : isTahfizh
                      ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 hover:border-indigo-400 hover:shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-[#D4AF37] hover:shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold truncate">{item.jilid}</span>
                {isMunaqosyah ? (
                  <Award className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#D4AF37]' : 'text-emerald-600'}`} />
                ) : isTahfizh ? (
                  <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#D4AF37]' : 'text-indigo-600'}`} />
                ) : (
                  <BookOpen className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
                )}
              </div>
              <p className={`text-xl font-black mt-1 ${
                isSelected 
                  ? 'text-[#D4AF37]' 
                  : isMunaqosyah 
                    ? 'text-emerald-800' 
                    : isTahfizh 
                      ? 'text-indigo-800' 
                      : 'text-slate-900'
              }`}>
                {item.count} <span className="text-[10px] font-normal text-slate-400">Santri</span>
              </p>
              {item.count > 0 ? (
                <p className={`text-[10px] mt-1 truncate ${
                  isSelected 
                    ? 'text-slate-300' 
                    : isMunaqosyah 
                      ? 'text-emerald-700' 
                      : isTahfizh 
                        ? 'text-indigo-700' 
                        : 'text-slate-500'
                }`}>
                  {item.students.map(s => s.nickname || s.name.split(' ')[0]).join(', ')}
                </p>
              ) : (
                <p className="text-[10px] mt-1 text-slate-400 italic">0 santri</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Jilid Filter Indicator Banner */}
      {selectedJilidFilter && activeTab === 'all-classes' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 flex-wrap">
            <BookMarked className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="text-amber-900 font-medium">Filter Aktif:</span>
            <span className="bg-[#1E293B] text-[#D4AF37] px-2.5 py-0.5 rounded-md font-bold text-xs">
              {selectedJilidFilter}
            </span>
            <span className="text-slate-800 font-bold">
              ({studentDistribution.find(d => d.jilid === selectedJilidFilter)?.count || 0} Santri):
            </span>
            <span className="text-slate-600 font-medium">
              {studentDistribution.find(d => d.jilid === selectedJilidFilter)?.students.map(s => s.name).join(', ')}
            </span>
          </div>
          <button
            onClick={() => setSelectedJilidFilter('')}
            className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer flex items-center gap-1 hover:underline shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            Tampilkan Semua Jilid
          </button>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama santri, NIS, jilid, atau materi..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
          />
        </div>

        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
          >
            Hapus Pencarian
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: UI SEMUA KELAS -> DAFTAR SANTRI + CAPAIAN TERAKHIR UMMI */}
      {/* ========================================================================= */}
      {activeTab === 'all-classes' && (
        <div className="space-y-6">
          {enrichedClasses.map((cls) => (
            <div key={cls.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Class Card Header */}
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 to-[#1E293B] text-white flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#D4AF37] text-slate-950 flex items-center justify-center font-black text-sm shadow-xs">
                    {cls.name}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                      <span>Kelas {cls.name}</span>
                      <span className="text-[11px] font-normal text-slate-300">({cls.academicYear})</span>
                    </h2>
                    <p className="text-[11px] text-[#D4AF37]">
                      Wali Kelas: <span className="text-white font-medium">{cls.homeroomTeacher?.name || 'Belum Ditentukan'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-200 border border-slate-700 text-xs font-bold">
                    {cls.students.length} Santri Terdaftar
                  </span>
                </div>
              </div>

              {/* Class Students Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-3 px-3.5 w-10 text-center">No</th>
                      <th className="py-3 px-3.5">Nama Santri</th>
                      <th className="py-3 px-3.5">Jilid & Halaman Terakhir</th>
                      <th className="py-3 px-3.5">Tanggal Setoran</th>
                      <th className="py-3 px-3.5">Materi Pokok</th>
                      <th className="py-3 px-3.5">Status & Hasil</th>
                      <th className="py-3 px-3.5">Nilai & Predikat</th>
                      <th className="py-3 px-3.5">Guru Penguji</th>
                      <th className="py-3 px-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cls.students.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          Tidak ada santri yang cocok dengan kriteria pada kelas {cls.name}.
                        </td>
                      </tr>
                    ) : (
                      cls.students.map((student, idx) => {
                        const latestRecord = studentLatestUmmiRecords.get(student.id);
                        const teacher = latestRecord ? getTeacher(latestRecord.teacherId) : undefined;
                        const gradeInfo = latestRecord ? getGradeFromScore(latestRecord.score) : null;

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/90 transition">
                            {/* No */}
                            <td className="py-3 px-3.5 text-center text-slate-400 font-mono font-medium">
                              {idx + 1}
                            </td>

                            {/* Nama Santri */}
                            <td className="py-3 px-3.5">
                              <div 
                                onClick={() => onOpenStudentDetail(student.id)}
                                className="flex items-center gap-2.5 cursor-pointer hover:text-[#D4AF37] transition group"
                              >
                                <AvatarBadge
                                  name={student.name}
                                  photoUrl={student.photo}
                                  gender={student.gender}
                                  role="santri"
                                  size="sm"
                                  className="shrink-0"
                                />
                                <div>
                                  <span className="font-bold text-slate-900 group-hover:text-[#D4AF37] block">
                                    {student.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    NIS: {student.nis}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Jilid & Halaman Terakhir */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                {(() => {
                                  const effJilid = getStudentEffectiveJilid(student);
                                  const isMun = effJilid === 'Munaqosyah';
                                  const isTah = effJilid === 'Tahfizh';
                                  return (
                                    <span className={`px-2.5 py-0.5 rounded-md font-black text-xs shadow-2xs ${
                                      isMun 
                                        ? 'bg-emerald-800 text-emerald-200' 
                                        : isTah 
                                          ? 'bg-indigo-800 text-indigo-200' 
                                          : 'bg-[#1E293B] text-[#D4AF37]'
                                    }`}>
                                      {effJilid}
                                    </span>
                                  );
                                })()}
                                <span className="font-bold text-slate-800 text-xs">
                                  Hal. {latestRecord ? latestRecord.page : (student.currentUmmiPage || 1)}
                                </span>
                              </div>
                            </td>

                            {/* Tanggal Setoran Terakhir */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {latestRecord ? (
                                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{latestRecord.date}</span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-400 italic text-[11px]">
                                  <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
                                  Belum ada evaluasi
                                </span>
                              )}
                            </td>

                            {/* Materi Pokok */}
                            <td className="py-3 px-3.5 text-slate-800 font-medium max-w-xs truncate" title={latestRecord?.materialName || '-'}>
                              {latestRecord?.materialName || '-'}
                            </td>

                            {/* Status & Hasil */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {latestRecord ? (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  latestRecord.status === 'Lulus' 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                    : latestRecord.status === 'Lancar'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : latestRecord.status === 'Sedang Dipelajari'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}>
                                  {latestRecord.status === 'Lulus' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                  {latestRecord.status}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>

                            {/* Nilai & Predikat Huruf (A, B, C, D) */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {latestRecord && gradeInfo ? (
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded-md border text-xs font-black shadow-2xs ${getGradeBadgeClass(gradeInfo.grade)}`}>
                                    Grade {gradeInfo.grade}
                                  </span>
                                  <span className="font-bold text-slate-800 text-xs">
                                    ({latestRecord.score})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>

                            {/* Guru Penguji */}
                            <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 text-[11px]">
                              {teacher?.name || (latestRecord ? 'Ustadz Penguji' : '-')}
                            </td>

                            {/* Aksi: Catat, Edit, Hapus, Detail */}
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                {userRole !== 'wali' && (
                                  <button
                                    onClick={() => onOpenDailyInput(student.id)}
                                    className="px-2 py-1 rounded bg-[#1E293B] text-[#D4AF37] hover:bg-slate-800 font-bold text-[10px] transition cursor-pointer shadow-2xs"
                                    title="Catat Evaluasi Ummi Santri Ini"
                                  >
                                    + Setor
                                  </button>
                                )}

                                {latestRecord && userRole !== 'wali' && (
                                  <>
                                    <button
                                      onClick={() => onEditRecord?.(latestRecord)}
                                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition cursor-pointer"
                                      title="Edit Evaluasi Terakhir"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(latestRecord.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                      title="Hapus Evaluasi Terakhir"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}

                                <button
                                  onClick={() => onOpenStudentDetail(student.id)}
                                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition cursor-pointer"
                                  title="Lihat Riwayat Lengkap Santri"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RIWAYAT LOG EVALUASI UMMI (DENGAN EDIT & HAPUS) */}
      {/* ========================================================================= */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          
          {/* Secondary Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              
              {/* Filter Jilid */}
              <div>
                <select
                  value={selectedJilidTab}
                  onChange={(e) => setSelectedJilidTab(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  <option value="Semua Jilid">Semua Jilid & Kategori (Jilid 1-3, Al-Qur'an, Gharib, Tajwid, Munaqosyah, Tahfizh)</option>
                  {UMMI_JILIDS.map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>

              {/* Filter Status */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  <option value="">Semua Status Kelulusan</option>
                  <option value="Lulus">Lulus</option>
                  <option value="Lancar">Lancar</option>
                  <option value="Sedang Dipelajari">Sedang Dipelajari</option>
                  <option value="Perlu Mengulang">Perlu Mengulang</option>
                </select>
              </div>

              {/* Sort Selector */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full py-2 px-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  <option value="class-asc">Sort: Berdasarkan Kelas (A → Z)</option>
                  <option value="class-desc">Sort: Berdasarkan Kelas (Z → A)</option>
                  <option value="date-desc">Sort: Tanggal Terbaru</option>
                  <option value="date-asc">Sort: Tanggal Terlama</option>
                  <option value="name-asc">Sort: Nama Santri (A → Z)</option>
                  <option value="jilid-asc">Sort: Urutan Jilid</option>
                  <option value="score-desc">Sort: Nilai Tertinggi</option>
                </select>
              </div>

            </div>
          </div>

          {/* Log Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th 
                      onClick={() => setSortBy(sortBy === 'class-asc' ? 'class-desc' : 'class-asc')}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition select-none"
                    >
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                        <GraduationCap className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Kelas</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Nama Santri</th>
                    <th 
                      onClick={() => setSortBy(sortBy === 'date-desc' ? 'date-asc' : 'date-desc')}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Tanggal</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Jilid</th>
                    <th className="py-3 px-3">Halaman</th>
                    <th className="py-3 px-3">Materi Pokok</th>
                    <th className="py-3 px-3">Status</th>
                    <th 
                      onClick={() => setSortBy('score-desc')}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Nilai & Predikat</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Guru Penguji</th>
                    <th className="py-3 px-3">Catatan</th>
                    {userRole !== 'wali' && <th className="py-3 px-3 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedRecords.map((r) => {
                    const std = students.find(s => s.id === r.studentId);
                    const teacher = teachers.find(t => t.id === r.teacherId);
                    const cls = std ? classes.find(c => c.id === std.classId) : null;
                    const gradeInfo = getGradeFromScore(r.score);

                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                            {cls?.name || '7A'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div 
                            onClick={() => std && onOpenStudentDetail(std.id)}
                            className="flex items-center gap-2 cursor-pointer hover:text-[#D4AF37] transition"
                          >
                            <AvatarBadge
                              name={std?.name || 'Siswa'}
                              photoUrl={std?.photo}
                              gender={std?.gender}
                              role="santri"
                              size="sm"
                              className="shrink-0"
                            />
                            <div>
                              <span className="font-bold text-slate-800 block">{std?.name || 'Siswa'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">NIS: {std?.nis || '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">{r.date}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{r.jilid}</td>
                        <td className="py-3 px-3 font-semibold">Hal. {r.page}</td>
                        <td className="py-3 px-3 text-slate-800 font-medium">{r.materialName}</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'Lulus' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            r.status === 'Lancar' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                            r.status === 'Sedang Dipelajari' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                            'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-black border ${getGradeBadgeClass(gradeInfo.grade)}`}>
                              Grade {gradeInfo.grade}
                            </span>
                            <span className="font-bold text-slate-800 text-xs">({r.score})</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-[11px] whitespace-nowrap">{teacher?.name || '-'}</td>
                        <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs truncate" title={r.notes}>
                          {r.notes || '-'}
                        </td>
                        {userRole !== 'wali' && (
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onEditRecord?.(r)}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition cursor-pointer"
                                title="Edit Evaluasi Ini"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                title="Hapus Evaluasi Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {sortedRecords.length === 0 && (
              <p className="text-center py-10 text-slate-400 text-xs">Belum ada catatan evaluasi Ummi yang cocok.</p>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SILABUS 6 JILID & PANDUAN TALAQQI */}
      {/* ========================================================================= */}
      {activeTab === 'syllabus' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {UMMI_SYLLABUS.map((s) => (
              <button
                key={s.jilid}
                onClick={() => setSelectedJilidTab(s.jilid)}
                className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer ${
                  selectedJilidTab === s.jilid
                    ? 'bg-[#1E293B] text-[#D4AF37] shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {s.jilid}
              </button>
            ))}
          </div>

          {UMMI_SYLLABUS.filter(s => s.jilid === selectedJilidTab).map((syllabus) => (
            <div key={syllabus.jilid} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-[#1E293B] text-white">
                <div>
                  <span className="px-2.5 py-0.5 rounded bg-[#D4AF37] text-slate-950 font-extrabold text-[11px]">
                    {syllabus.jilid}
                  </span>
                  <h3 className="text-base font-bold mt-1 text-white">
                    {syllabus.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Standar Jilid: {syllabus.totalPages} Halaman • {syllabus.description}
                  </p>
                </div>

                {userRole !== 'wali' && (
                  <button
                    onClick={() => onOpenDailyInput()}
                    className="shrink-0 px-3.5 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c49f2e] text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Input Setoran {syllabus.jilid}</span>
                  </button>
                )}
              </div>

              {/* Key Topics Badges */}
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                  Pokok Bahasan Utama:
                </span>
                {syllabus.keyTopics.map((topic, i) => (
                  <span 
                    key={i}
                    className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium shadow-2xs"
                  >
                    • {topic}
                  </span>
                ))}
              </div>

              {/* Modules Grid */}
              <div className="p-5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                  Rincian Materi & Modul Per Rentang Halaman:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {syllabus.modules.map((mod, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-300 hover:shadow-xs transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs font-mono">
                            {mod.pageRange}
                          </span>
                          <button
                            onClick={() => setSelectedModuleDetail({ jilid: syllabus.jilid, module: mod })}
                            className="text-[11px] text-[#8C7015] hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span>Lihat Panduan Talaqqi</span>
                          </button>
                        </div>

                        <h5 className="font-bold text-slate-900 text-sm">
                          {mod.topicTitle}
                        </h5>

                        <div className="p-3 bg-white rounded-lg border border-slate-200 text-center shadow-2xs">
                          <span className="text-[10px] text-slate-400 font-semibold block mb-1 uppercase tracking-wider">
                            Contoh Lafadz / Bacaan:
                          </span>
                          <p className="font-arabic text-xl text-slate-900 leading-relaxed font-bold dir-rtl">
                            {mod.arabicExample}
                          </p>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <p className="text-slate-700 leading-relaxed">
                            <strong className="text-slate-900">Kaidah:</strong> {mod.rules}
                          </p>
                          <p className="text-slate-600 text-[11px] leading-relaxed">
                            <strong className="text-slate-800">Target Kelulusan:</strong> {mod.competency}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 flex items-start gap-1.5 text-[11px] text-slate-500 bg-amber-50/50 p-2 rounded-lg">
                        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-slate-700">Tips Pengajaran Guru:</strong> {mod.teachingTips}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DETAIL MATERI TALAQQI */}
      {selectedModuleDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-200">
              <div>
                <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white font-extrabold text-[11px]">
                  {selectedModuleDetail.jilid} • {selectedModuleDetail.module.pageRange}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  {selectedModuleDetail.module.topicTitle}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedModuleDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Arabic Big Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Contoh Lafadz & Praktik Bacaan:
              </span>
              <p className="font-arabic text-2xl text-slate-950 font-bold py-2 dir-rtl leading-loose">
                {selectedModuleDetail.module.arabicExample}
              </p>
            </div>

            {/* Rules & Competencies */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 text-[11px] block flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Kaidah Pokok Pembelajaran:
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {selectedModuleDetail.module.rules}
                </p>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-900 text-[11px] block flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Target Capaian & Standar Kelulusan Santri:
                </span>
                <p className="text-emerald-800 leading-relaxed">
                  {selectedModuleDetail.module.competency}
                </p>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 space-y-1">
                <span className="font-bold text-amber-950 text-[11px] block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Panduan Talaqqi & Petunjuk Mengajar Guru:
                </span>
                <p className="text-amber-900 leading-relaxed">
                  {selectedModuleDetail.module.teachingTips}
                </p>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedModuleDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
              >
                Tutup
              </button>
              {userRole !== 'wali' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModuleDetail(null);
                    onOpenDailyInput();
                  }}
                  className="px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Catat Setoran Sekarang</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
