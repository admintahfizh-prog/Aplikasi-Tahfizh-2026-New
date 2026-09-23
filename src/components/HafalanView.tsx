import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  PlusCircle, 
  Download, 
  Trash2, 
  Edit3, 
  Calendar, 
  CheckCircle2, 
  Flame, 
  Award, 
  Sparkles, 
  ChevronDown, 
  ArrowUpDown, 
  GraduationCap, 
  Layers, 
  Clock, 
  Eye, 
  AlertCircle,
  Users
} from 'lucide-react';
import { MemorizationRecord, Student, Teacher, ClassItem, Role, HalaqahGroup, User } from '../types';
import { storageService } from '../services/storageService';
import { SURAH_LIST } from '../data/quranData';
import { AvatarBadge } from './AvatarBadge';
import { getGradeFromScore, getGradeBadgeClass } from '../utils/gradeConversion';
import { HalaqahFilterBar } from './HalaqahFilterBar';
import { filterStudentsByHalaqah, groupStudentsByHalaqah, DEFAULT_HALAQAH_GROUPS } from '../utils/halaqahHelper';

interface HafalanViewProps {
  records: MemorizationRecord[];
  students: Student[];
  teachers: Teacher[];
  classes?: ClassItem[];
  halaqahGroups?: HalaqahGroup[];
  currentUser?: User | null;
  userRole: Role;
  onOpenDailyInput: (studentId?: string) => void;
  onRefreshData: () => void;
  onOpenStudentDetail: (studentId: string) => void;
  onEditRecord?: (record: MemorizationRecord) => void;
  onDeleteRecord?: (recordId: string) => void;
}

export const HafalanView: React.FC<HafalanViewProps> = ({
  records,
  students,
  teachers,
  classes = [],
  halaqahGroups = [],
  currentUser = null,
  userRole,
  onOpenDailyInput,
  onRefreshData,
  onOpenStudentDetail,
  onEditRecord,
  onDeleteRecord
}) => {
  // View mode: 'all-classes' (Primary) vs 'log' (Full history)
  const [activeTab, setActiveTab] = useState<'all-classes' | 'log'>('all-classes');

  // Halaqah filter states
  const [selectedHalaqahFilter, setSelectedHalaqahFilter] = useState<string>('all');
  const [viewGroupingMode, setViewGroupingMode] = useState<'class' | 'halaqah'>('class');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [selectedJuzFilter, setSelectedJuzFilter] = useState('');
  const [selectedSurahFilter, setSelectedSurahFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('');
  const [selectedScoreCategoryFilter, setSelectedScoreCategoryFilter] = useState('');
  
  // Sort state for log table
  const [sortBy, setSortBy] = useState<'class-asc' | 'class-desc' | 'date-desc' | 'date-asc' | 'name-asc' | 'score-desc' | 'juz-asc'>('class-asc');

  // Active Teachers & Halaqah Groups
  const activeTeachers = useMemo(() => {
    return teachers.length > 0 ? teachers : storageService.getTeachers();
  }, [teachers]);

  const activeHalaqahGroups = useMemo(() => {
    return halaqahGroups.length > 0 ? halaqahGroups : DEFAULT_HALAQAH_GROUPS;
  }, [halaqahGroups]);

  const currentTeacher = useMemo(() => {
    if (!currentUser) return null;
    return activeTeachers.find(t => 
      (currentUser.teacherId && t.id === currentUser.teacherId) ||
      t.id === currentUser.id ||
      (currentUser.email && t.email && t.email.toLowerCase() === currentUser.email.toLowerCase())
    ) || null;
  }, [currentUser, activeTeachers]);

  // Students filtered by halaqah
  const studentsFilteredByHalaqah = useMemo(() => {
    return filterStudentsByHalaqah(students, selectedHalaqahFilter, currentTeacher, activeHalaqahGroups, activeTeachers);
  }, [students, selectedHalaqahFilter, currentTeacher, activeHalaqahGroups, activeTeachers]);

  // Helper to find teacher
  const getTeacher = (teacherId?: string) => activeTeachers.find(t => t.id === teacherId);

  // Group latest records per student for the "All Classes" view
  const studentLatestRecords = useMemo(() => {
    const map = new Map<string, MemorizationRecord>();
    // records are typically chronologically ordered or we sort by date descending
    const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const r of sorted) {
      if (!map.has(r.studentId)) {
        map.set(r.studentId, r);
      }
    }
    return map;
  }, [records]);

  // Compute all classes enriched with their students and latest records
  const enrichedClasses = useMemo(() => {
    // If no classes prop, gather unique classes or use defaults
    const activeClasses = classes.length > 0 ? classes : [
      { id: 'c-7a', name: '7A', level: 7, academicYear: '2026/2027', homeroomTeacherId: activeTeachers[0]?.id || '' },
      { id: 'c-7b', name: '7B', level: 7, academicYear: '2026/2027', homeroomTeacherId: activeTeachers[1]?.id || '' }
    ];

    return activeClasses
      .filter(c => !selectedClassFilter || c.id === selectedClassFilter)
      .filter(c => {
        if (userRole === 'wali') {
          return studentsFilteredByHalaqah.some(s => s.classId === c.id);
        }
        return true;
      })
      .map(c => {
        const classStudents = studentsFilteredByHalaqah.filter(s => {
          if (s.classId !== c.id) return false;
          if (!searchTerm) return true;
          const term = searchTerm.toLowerCase();
          const rec = studentLatestRecords.get(s.id);
          return (
            s.name.toLowerCase().includes(term) ||
            s.nis.toLowerCase().includes(term) ||
            (rec?.surahName || '').toLowerCase().includes(term)
          );
        });

        const homeroom = activeTeachers.find(t => t.id === c.homeroomTeacherId);

        return {
          ...c,
          homeroomTeacher: homeroom,
          students: classStudents
        };
      });
  }, [classes, studentsFilteredByHalaqah, studentLatestRecords, selectedClassFilter, searchTerm, activeTeachers, userRole]);

  // Compute enriched halaqah groups with students and latest records
  const enrichedHalaqahs = useMemo(() => {
    const grouped = groupStudentsByHalaqah(studentsFilteredByHalaqah, activeHalaqahGroups, activeTeachers);

    return grouped.map(g => {
      const filteredGroupStudents = g.students.filter(s => {
        if (selectedClassFilter && s.classId !== selectedClassFilter) return false;
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const rec = studentLatestRecords.get(s.id);
        return (
          s.name.toLowerCase().includes(term) ||
          s.nis.toLowerCase().includes(term) ||
          (rec?.surahName || '').toLowerCase().includes(term)
        );
      });

      return {
        ...g,
        students: filteredGroupStudents
      };
    });
  }, [studentsFilteredByHalaqah, activeHalaqahGroups, activeTeachers, selectedClassFilter, searchTerm, studentLatestRecords]);

  // Filtered individual records for the Log view
  const filteredRecords = records.filter(r => {
    const std = students.find(s => s.id === r.studentId);
    if (!std) return false;

    // Must match halaqah filter
    const isHalaqahMatch = studentsFilteredByHalaqah.some(s => s.id === r.studentId);
    if (!isHalaqahMatch) return false;

    const matchSearch = 
      (std?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.surahName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.notes.toLowerCase().includes(searchTerm.toLowerCase());

    const matchClass = !selectedClassFilter || std?.classId === selectedClassFilter;
    const matchJuz = !selectedJuzFilter || r.juz.toString() === selectedJuzFilter;
    const matchSurah = !selectedSurahFilter || r.surahNumber.toString() === selectedSurahFilter;
    const matchType = !selectedTypeFilter || r.type === selectedTypeFilter;
    const matchTeacher = !selectedTeacherFilter || r.teacherId === selectedTeacherFilter;
    const matchScore = !selectedScoreCategoryFilter || r.category === selectedScoreCategoryFilter;

    return matchSearch && matchClass && matchJuz && matchSurah && matchType && matchTeacher && matchScore;
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
    if (sortBy === 'score-desc') {
      return b.finalScore - a.finalScore;
    }
    if (sortBy === 'juz-asc') {
      return a.juz - b.juz;
    }
    return 0;
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus riwayat setoran ini? Data capaian santri akan dihitung ulang secara otomatis.')) {
      if (onDeleteRecord) {
        onDeleteRecord(id);
      } else {
        storageService.deleteMemorizationRecord(id);
        onRefreshData();
      }
    }
  };

  const handleExportCSV = () => {
    const csv = storageService.exportHafalanToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap_hafalan_quran_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats
  const totalAyahs = filteredRecords.reduce((acc, r) => acc + r.totalAyah, 0);
  const tasmiCount = filteredRecords.filter(r => r.type === 'Tasmi\'').length;
  const avgScore = filteredRecords.length > 0 
    ? Math.round(filteredRecords.reduce((acc, r) => acc + r.finalScore, 0) / filteredRecords.length)
    : 0;

  // Helper to render student table for classes or halaqahs
  const renderStudentTable = (studentsList: Student[], groupTitle: string) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-3 px-3.5 w-10 text-center">No</th>
              <th className="py-3 px-3.5">Nama Santri</th>
              <th className="py-3 px-3.5">Capaian Terakhir Disetor</th>
              <th className="py-3 px-3.5">Tanggal Setoran</th>
              <th className="py-3 px-3.5">Nilai & Predikat</th>
              <th className="py-3 px-3.5">Jenis</th>
              <th className="py-3 px-3.5">Guru Penguji</th>
              <th className="py-3 px-3.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {studentsList.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  Tidak ada santri yang cocok dengan kriteria pada {groupTitle}.
                </td>
              </tr>
            ) : (
              studentsList.map((student, idx) => {
                const latestRecord = studentLatestRecords.get(student.id);
                const teacher = latestRecord ? getTeacher(latestRecord.teacherId) : undefined;
                const gradeInfo = latestRecord ? getGradeFromScore(latestRecord.finalScore) : null;

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
                            NIS: {student.nis} • Kelas: {classes.find(c => c.id === student.classId)?.name || '7A'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Capaian Terakhir */}
                    <td className="py-3 px-3.5">
                      {latestRecord ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <span className="px-1.5 py-0.5 rounded-sm bg-slate-900 text-white font-mono text-[10px]">
                              Juz {latestRecord.juz}
                            </span>
                            <span>{latestRecord.surahName}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Ayat {latestRecord.ayahStart} - {latestRecord.ayahEnd} ({latestRecord.totalAyah} Ayat)
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-700 block">
                            {student.lastHafalan || 'Belum ada data'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Total: {student.totalJuzHafal} Juz
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Tanggal Setoran Terakhir */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {latestRecord ? (
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{latestRecord.date}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Nilai & Predikat Huruf (A, B, C, D) */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {latestRecord && gradeInfo ? (
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md border text-xs font-black shadow-2xs ${getGradeBadgeClass(gradeInfo.grade)}`}>
                            Grade {gradeInfo.grade}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            ({latestRecord.finalScore})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Jenis Setoran */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {latestRecord ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          latestRecord.type === 'Tasmi\'' 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : latestRecord.type === 'Murojaah'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {latestRecord.type === 'Tasmi\'' && <Flame className="w-3 h-3 text-[#D4AF37]" />}
                          {latestRecord.type}
                        </span>
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
                            title="Catat Setoran Baru untuk Santri Ini"
                          >
                            + Setor
                          </button>
                        )}

                        {latestRecord && userRole !== 'wali' && (
                          <>
                            <button
                              onClick={() => onEditRecord?.(latestRecord)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition cursor-pointer"
                              title="Edit Capaian Setoran Terakhir"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(latestRecord.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Hapus Capaian Setoran Terakhir"
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
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#D4AF37]" />
            {userRole === 'wali' 
              ? (students.length === 1 ? `Perkembangan Hafalan: ${students[0].name}` : "Perkembangan Hafalan Al-Qur'an Ananda")
              : "Modul Hafalan Al-Qur'an (Tahfizh)"
            }
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {userRole === 'wali'
              ? "Riwayat lengkap setoran Ziyadah (Hafalan Baru), Muroja'ah berkala, dan Ujian Tasmi' Al-Qur'an ananda tercinta."
              : "Capaian terkini seluruh kelas & nama santri lengkap dengan tanggal setoran, nilai huruf (A-D), serta fitur edit dan hapus."
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
              <span>+ Catat Setoran</span>
            </button>
          )}
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
              {students.length} Santri
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
            <span>Riwayat Log Lengkap</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'log' ? 'bg-[#D4AF37] text-slate-950' : 'bg-slate-100 text-slate-700'
            }`}>
              {records.length} Setoran
            </span>
          </button>
        </div>

        {/* Quick Class Selector Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setSelectedClassFilter('')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer shrink-0 ${
              selectedClassFilter === '' 
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Kelas
          </button>
          {classes.map(c => (
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

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Setoran</span>
          <p className="text-xl font-bold text-slate-800 mt-1">{filteredRecords.length} Kali</p>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Ayat Disetor</span>
          <p className="text-xl font-bold text-[#8C7015] mt-1">{totalAyahs} Ayat</p>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Rata-rata Nilai</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">{avgScore} / 100</p>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Ujian Tasmi'</span>
          <p className="text-xl font-bold text-[#1E293B] mt-1">{tasmiCount} Sesi</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama santri, NIS, surat, atau catatan..."
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
      {/* TAB 1: UI SEMUA KELAS -> DAFTAR SANTRI + CAPAIAN TERAKHIR + TANGGAL SETORAN */}
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
                      <th className="py-3 px-3.5">Capaian Terakhir Disetor</th>
                      <th className="py-3 px-3.5">Tanggal Setoran</th>
                      <th className="py-3 px-3.5">Nilai & Predikat</th>
                      <th className="py-3 px-3.5">Jenis</th>
                      <th className="py-3 px-3.5">Guru Penguji</th>
                      <th className="py-3 px-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cls.students.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Tidak ada santri yang cocok dengan kriteria pada kelas {cls.name}.
                        </td>
                      </tr>
                    ) : (
                      cls.students.map((student, idx) => {
                        const latestRecord = studentLatestRecords.get(student.id);
                        const teacher = latestRecord ? getTeacher(latestRecord.teacherId) : undefined;
                        const gradeInfo = latestRecord ? getGradeFromScore(latestRecord.finalScore) : null;

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
                                    NIS: {student.nis} • Total: {student.totalJuzHafal || 0} Juz
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Capaian Terakhir */}
                            <td className="py-3 px-3.5">
                              {latestRecord ? (
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-black text-[11px]">
                                      Juz {latestRecord.juz}
                                    </span>
                                    <span className="font-bold text-slate-900">
                                      {latestRecord.surahName}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                    Ayat {latestRecord.startAyah} s.d. {latestRecord.endAyah} ({latestRecord.totalAyah} ayat)
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-400 italic text-[11px]">
                                  <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
                                  Belum ada setoran
                                </span>
                              )}
                            </td>

                            {/* Tanggal Setoran */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {latestRecord ? (
                                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{latestRecord.date}</span>
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>

                            {/* Nilai & Predikat Huruf (A, B, C, D) */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {latestRecord && gradeInfo ? (
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-md border text-xs font-black shadow-2xs ${getGradeBadgeClass(gradeInfo.grade)}`}>
                                    Grade {gradeInfo.grade}
                                  </span>
                                  <span className="font-bold text-slate-800 text-xs">
                                    ({latestRecord.finalScore})
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>

                            {/* Jenis Setoran */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              {latestRecord ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                  latestRecord.type === 'Tasmi\'' 
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                    : latestRecord.type === 'Murojaah'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {latestRecord.type === 'Tasmi\'' && <Flame className="w-3 h-3 text-[#D4AF37]" />}
                                  {latestRecord.type}
                                </span>
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
                                    title="Catat Setoran Baru untuk Santri Ini"
                                  >
                                    + Setor
                                  </button>
                                )}

                                {latestRecord && userRole !== 'wali' && (
                                  <>
                                    <button
                                      onClick={() => onEditRecord?.(latestRecord)}
                                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition cursor-pointer"
                                      title="Edit Capaian Setoran Terakhir"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(latestRecord.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                      title="Hapus Capaian Setoran Terakhir"
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
      {/* TAB 2: RIWAYAT LOG LENGKAP SEMUA SETORAN (DENGAN EDIT & HAPUS) */}
      {/* ========================================================================= */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          
          {/* Secondary Filters Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              
              {/* Filter Juz */}
              <div>
                <select
                  value={selectedJuzFilter}
                  onChange={(e) => setSelectedJuzFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  <option value="">Semua Juz (1-30)</option>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                    <option key={j} value={j.toString()}>Juz {j}</option>
                  ))}
                </select>
              </div>

              {/* Filter Surat */}
              <div>
                <select
                  value={selectedSurahFilter}
                  onChange={(e) => setSelectedSurahFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  <option value="">Semua Surat ({SURAH_LIST.length})</option>
                  {SURAH_LIST.map(s => (
                    <option key={s.number} value={s.number.toString()}>{s.number}. {s.name}</option>
                  ))}
                </select>
              </div>

              {/* Filter Jenis Setoran */}
              <div>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  <option value="">Semua Jenis Setoran</option>
                  <option value="Hafalan Baru">Hafalan Baru (Ziyadah)</option>
                  <option value="Murojaah">Murojaah</option>
                  <option value="Tasmi'">Tasmi' (Ujian Sekali Duduk)</option>
                </select>
              </div>

              {/* Filter Guru */}
              <div>
                <select
                  value={selectedTeacherFilter}
                  onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  <option value="">Semua Guru Penguji</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
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
                  <option value="score-desc">Sort: Nilai Tertinggi</option>
                  <option value="juz-asc">Sort: Urutan Juz (1 → 30)</option>
                </select>
              </div>

            </div>
          </div>

          {/* Main Log Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th 
                      onClick={() => setSortBy(sortBy === 'class-asc' ? 'class-desc' : 'class-asc')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition select-none"
                    >
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                        <GraduationCap className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Kelas</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3.5">Nama Santri</th>
                    <th 
                      onClick={() => setSortBy(sortBy === 'date-desc' ? 'date-asc' : 'date-desc')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Tanggal</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3.5">Juz</th>
                    <th className="py-3 px-3.5">Surat & Ayat</th>
                    <th className="py-3 px-3.5">Total Ayat</th>
                    <th className="py-3 px-3.5">Jenis</th>
                    <th 
                      onClick={() => setSortBy('score-desc')}
                      className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Nilai & Predikat</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3.5">Guru Penguji</th>
                    <th className="py-3 px-3.5">Catatan</th>
                    {userRole !== 'wali' && <th className="py-3 px-3.5 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedRecords.map((r) => {
                    const std = students.find(s => s.id === r.studentId);
                    const teacher = teachers.find(t => t.id === r.teacherId);
                    const cls = std ? classes.find(c => c.id === std.classId) : null;
                    const gradeInfo = getGradeFromScore(r.finalScore);

                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                            {cls?.name || '7A'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5">
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
                        <td className="py-3 px-3.5 whitespace-nowrap text-slate-500 font-mono">{r.date}</td>
                        <td className="py-3 px-3.5 font-bold text-slate-800">Juz {r.juz}</td>
                        <td className="py-3 px-3.5">
                          {r.endSurahName && r.endSurahName !== r.surahName ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-xs">
                                {r.surahName} <span className="font-mono font-normal text-slate-500 text-[11px]">(Ayat {r.startAyah})</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">s.d.</span>
                              <span className="font-bold text-slate-900 text-xs">
                                {r.endSurahName} <span className="font-mono font-normal text-slate-500 text-[11px]">(Ayat {r.endAyah})</span>
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="font-bold text-slate-900">{r.surahName}</span>
                              <span className="text-slate-500 ml-1 font-mono">({r.startAyah}–{r.endAyah})</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-slate-800">{r.totalAyah} Ayat</td>
                        <td className="py-3 px-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.type === 'Tasmi\'' 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                              : r.type === 'Murojaah'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {r.type === 'Tasmi\'' && <Flame className="w-3 h-3 text-[#D4AF37]" />}
                            {r.type}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-black border ${getGradeBadgeClass(gradeInfo.grade)}`}>
                              Grade {gradeInfo.grade}
                            </span>
                            <span className="font-bold text-slate-800 text-xs">({r.finalScore})</span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 text-[11px] whitespace-nowrap">{teacher?.name || '-'}</td>
                        <td className="py-3 px-3.5 text-slate-600 max-w-xs truncate text-[11px]" title={r.notes}>
                          {r.notes || '-'}
                        </td>
                        {userRole !== 'wali' && (
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onEditRecord?.(r)}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition cursor-pointer"
                                title="Edit Setoran Ini"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                title="Hapus Setoran Ini"
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
              <p className="text-center py-12 text-slate-400 text-xs">Tidak ada riwayat setoran yang sesuai filter.</p>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
