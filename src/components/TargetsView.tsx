import React, { useState, useMemo } from 'react';
import { 
  Target, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Search, 
  Filter, 
  Calendar, 
  X,
  Sparkles,
  ArrowUpRight,
  GraduationCap,
  Clock,
  UserCheck,
  Edit3,
  Award,
  Layers,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { TargetProgress, Student, ClassItem, Role } from '../types';
import { storageService } from '../services/storageService';
import { AvatarBadge } from './AvatarBadge';

interface TargetsViewProps {
  targets: TargetProgress[];
  students: Student[];
  classes: ClassItem[];
  userRole: Role;
  onRefreshData: () => void;
  onOpenStudentDetail: (studentId: string) => void;
}

export const TargetsView: React.FC<TargetsViewProps> = ({
  targets,
  students,
  classes = [],
  userRole,
  onRefreshData,
  onOpenStudentDetail
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'Tahunan' | 'Semester' | 'Bulanan'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'on-track' | 'needs-attention' | 'behind'>('all');
  
  // Modal for editing/adding single target
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetFormData, setTargetFormData] = useState<{
    id?: string;
    studentId: string;
    targetType: 'Tahunan' | 'Semester' | 'Bulanan';
    targetJuz: number;
    deadline: string;
  }>({
    studentId: students[0]?.id || '',
    targetType: 'Tahunan',
    targetJuz: 4.0,
    deadline: '2026-12-31'
  });

  // Open modal prefilled for a student
  const handleOpenEditTarget = (studentId: string) => {
    const existing = targets.find(t => t.studentId === studentId);
    if (existing) {
      setTargetFormData({
        id: existing.id,
        studentId: existing.studentId,
        targetType: existing.targetType,
        targetJuz: existing.targetJuz,
        deadline: existing.deadline
      });
    } else {
      setTargetFormData({
        studentId,
        targetType: 'Tahunan',
        targetJuz: 4.0,
        deadline: '2026-12-31'
      });
    }
    setShowTargetModal(true);
  };

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const std = students.find(s => s.id === targetFormData.studentId);
    const achievedJuz = std?.totalJuzHafal || 0;
    const percentage = Math.min(100, Math.round((achievedJuz / targetFormData.targetJuz) * 100));
    const remainingJuz = Math.max(0, Number((targetFormData.targetJuz - achievedJuz).toFixed(1)));
    const status = percentage >= 70 ? 'on-track' : percentage >= 40 ? 'needs-attention' : 'behind';

    const item: TargetProgress = {
      id: targetFormData.id || 'target-' + Date.now(),
      studentId: targetFormData.studentId,
      targetType: targetFormData.targetType,
      targetJuz: Number(targetFormData.targetJuz),
      achievedJuz,
      percentage,
      remainingJuz,
      deadline: targetFormData.deadline,
      status
    };

    storageService.saveTarget(item);
    setShowTargetModal(false);
    onRefreshData();
  };

  // Build a Map of student targets for quick lookup
  const targetMap = useMemo(() => {
    const map = new Map<string, TargetProgress>();
    for (const t of targets) {
      map.set(t.studentId, t);
    }
    return map;
  }, [targets]);

  // Enriched classes with student target information: UI TAMPIS SELURUH KELAS
  const enrichedClassList = useMemo(() => {
    const activeClasses = classes.length > 0 ? classes : [
      { id: 'c-7a', name: '7A', level: 7, academicYear: '2026/2027', homeroomTeacherId: '' },
      { id: 'c-7b', name: '7B', level: 7, academicYear: '2026/2027', homeroomTeacherId: '' }
    ];

    return activeClasses
      .filter(c => selectedClassFilter === 'all' || c.id === selectedClassFilter)
      .map(cls => {
        const classStudents = students
          .filter(s => s.classId === cls.id)
          .filter(s => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return s.name.toLowerCase().includes(term) || s.nis.toLowerCase().includes(term);
          })
          .map(std => {
            const target = targetMap.get(std.id) || {
              id: 'temp-' + std.id,
              studentId: std.id,
              targetType: 'Tahunan' as const,
              targetJuz: 4.0,
              achievedJuz: std.totalJuzHafal || 0,
              percentage: Math.min(100, Math.round(((std.totalJuzHafal || 0) / 4.0) * 100)),
              remainingJuz: Math.max(0, Number((4.0 - (std.totalJuzHafal || 0)).toFixed(1))),
              deadline: '2026-12-31',
              status: ((std.totalJuzHafal || 0) / 4.0) >= 0.7 ? 'on-track' : ((std.totalJuzHafal || 0) / 4.0) >= 0.4 ? 'needs-attention' : 'behind'
            };
            return {
              student: std,
              target
            };
          })
          .filter(item => {
            if (periodFilter !== 'all' && item.target.targetType !== periodFilter) return false;
            if (statusFilter !== 'all' && item.target.status !== statusFilter) return false;
            return true;
          });

        const totalInClass = classStudents.length;
        const onTrackInClass = classStudents.filter(item => item.target.status === 'on-track').length;
        const needsAttentionInClass = classStudents.filter(item => item.target.status === 'needs-attention').length;
        const behindInClass = classStudents.filter(item => item.target.status === 'behind').length;
        const avgPercentage = totalInClass > 0 
          ? Math.round(classStudents.reduce((sum, item) => sum + item.target.percentage, 0) / totalInClass) 
          : 0;

        return {
          ...cls,
          studentsWithTarget: classStudents,
          stats: {
            total: totalInClass,
            onTrack: onTrackInClass,
            needsAttention: needsAttentionInClass,
            behind: behindInClass,
            avgPercentage
          }
        };
      });
  }, [classes, students, targetMap, selectedClassFilter, searchTerm, periodFilter, statusFilter]);

  // Global KPI calculations
  const totalStudentsMonitored = students.length;
  const onTrackCount = targets.filter(t => t.status === 'on-track').length;
  const needsAttentionCount = targets.filter(t => t.status === 'needs-attention').length;
  const behindCount = targets.filter(t => t.status === 'behind').length;

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#D4AF37]" />
            Target Hafalan Al-Qur'an (Seluruh Kelas)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring target hafalan santri terstruktur tampak per kelas. Pengisian target juga dapat dilakukan terpadu di menu Halaqah.
          </p>
        </div>

        {userRole === 'admin' && (
          <button
            onClick={() => setShowTargetModal(true)}
            className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>+ Atur Target Manual</span>
          </button>
        )}
      </div>

      {/* Helpful Hint Notice */}
      <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
        <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Kemudahan Pengisian Target: </span>
          <span>
            Kini guru pembimbing dapat mengisi dan mengubah target hafalan langsung di menu <strong>"Guru, Kelas & Halaqah" &gt; Tab "Kelompok Halaqah"</strong>. Anda dapat mengatur target sekaligus untuk semua anggota halaqah atau perorangan santri dengan 1 klik!
          </span>
        </div>
      </div>

      {/* Global KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Santri Terdaftar</span>
            <GraduationCap className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 mt-1.5">{totalStudentsMonitored} Santri</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Seluruh Rombel & Jenjang</p>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'on-track' ? 'all' : 'on-track')}
          className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 cursor-pointer hover:shadow-xs transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase">🟢 Sesuai Target (&gt;=70%)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-950 mt-1.5">{onTrackCount} Santri</p>
          <p className="text-[10px] text-emerald-700 mt-0.5">Kemajuan ziyadah sangat baik</p>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'needs-attention' ? 'all' : 'needs-attention')}
          className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 cursor-pointer hover:shadow-xs transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase">🟡 Perlu Didorong (40-69%)</span>
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-black text-amber-950 mt-1.5">{needsAttentionCount} Santri</p>
          <p className="text-[10px] text-[#8C7015] mt-0.5">Perlu pendampingan murojaah</p>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'behind' ? 'all' : 'behind')}
          className="p-4 bg-rose-50/70 rounded-xl border border-rose-200 cursor-pointer hover:shadow-xs transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 uppercase">🔴 Terlambat (&lt;40%)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-950 mt-1.5">{behindCount} Santri</p>
          <p className="text-[10px] text-rose-700 mt-0.5">Butuh bimbingan khusus ustadz</p>
        </div>
      </div>

      {/* Filter and Class Navigator Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-3">
        
        {/* Class Selection Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
              Kelas:
            </span>
            <button
              onClick={() => setSelectedClassFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedClassFilter === 'all'
                  ? 'bg-[#1E293B] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tampilkan Semua Kelas ({classes.length})
            </button>
            {classes.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClassFilter(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama santri atau NIS..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            />
          </div>

          {/* Period Filter */}
          <div>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none font-semibold text-slate-700"
            >
              <option value="all">Semua Periode Target (Tahunan, Semester, Bulanan)</option>
              <option value="Tahunan">Target Tahunan (Standar 4.0 Juz)</option>
              <option value="Semester">Target Semester</option>
              <option value="Bulanan">Target Bulanan</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none font-semibold text-slate-700"
            >
              <option value="all">Semua Status Ketercapaian</option>
              <option value="on-track">🟢 Sesuai Target (&gt;= 70%)</option>
              <option value="needs-attention">🟡 Perlu Ditingkatkan (40 - 69%)</option>
              <option value="behind">🔴 Terlambat (&lt; 40%)</option>
            </select>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* UI TAMPAK SELURUH KELAS */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        {enrichedClassList.map((cls) => (
          <div key={cls.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* Header Kelas */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-[#1E293B] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-slate-950 flex items-center justify-center font-black text-sm shadow-xs">
                  {cls.name}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Target Hafalan Kelas {cls.name}</span>
                    <span className="text-xs font-normal text-slate-300">({cls.academicYear})</span>
                  </h2>
                  <p className="text-xs text-[#D4AF37]">
                    Tingkat {cls.level} SMP Islam Al Azhar
                  </p>
                </div>
              </div>

              {/* Stats Bar per Kelas */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold">
                  {cls.stats.total} Santri
                </span>
                <span className="px-2.5 py-1 rounded-md bg-emerald-950/70 text-emerald-300 border border-emerald-800 text-xs font-bold">
                  ✓ {cls.stats.onTrack} Tuntas
                </span>
                <span className="px-2.5 py-1 rounded-md bg-amber-950/70 text-amber-300 border border-amber-800 text-xs font-bold">
                  ⚡ {cls.stats.needsAttention} Perlu Dorongan
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-extrabold">
                  Avg: {cls.stats.avgPercentage}%
                </span>
              </div>
            </div>

            {/* Table Santri Kelas */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-3.5 w-10 text-center">No</th>
                    <th className="py-3 px-3.5">Santri</th>
                    <th className="py-3 px-3.5">Target</th>
                    <th className="py-3 px-3.5">Capaian Saat Ini</th>
                    <th className="py-3 px-3.5">Sisa Target</th>
                    <th className="py-3 px-3.5 w-56">Progress Ketercapaian</th>
                    <th className="py-3 px-3.5">Tenggat Waktu</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    {userRole !== 'wali' && <th className="py-3 px-3.5 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cls.studentsWithTarget.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Tidak ada santri kelas {cls.name} yang cocok dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    cls.studentsWithTarget.map((item, idx) => {
                      const { student, target } = item;
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/90 transition">
                          
                          {/* No */}
                          <td className="py-3 px-3.5 text-center text-slate-400 font-mono font-medium">
                            {idx + 1}
                          </td>

                          {/* Santri */}
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

                          {/* Target */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 text-xs">
                                {target.targetJuz} Juz
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                                {target.targetType}
                              </span>
                            </div>
                          </td>

                          {/* Capaian Saat Ini */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="font-extrabold text-emerald-800 text-xs">
                              {student.totalJuzHafal || 0} Juz
                            </span>
                          </td>

                          {/* Sisa Target */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="font-bold text-slate-600 text-xs font-mono">
                              {target.remainingJuz} Juz
                            </span>
                          </td>

                          {/* Progress Bar */}
                          <td className="py-3 px-3.5">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-800 font-mono">
                                  {target.percentage}%
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {student.totalJuzHafal || 0} / {target.targetJuz} Juz
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    target.percentage >= 70 ? 'bg-emerald-500' :
                                    target.percentage >= 40 ? 'bg-[#D4AF37]' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, target.percentage)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Tenggat Waktu */}
                          <td className="py-3 px-3.5 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                            {target.deadline}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3.5 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-block border ${
                              target.status === 'on-track' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : target.status === 'needs-attention'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              {target.status === 'on-track' ? '🟢 Sesuai Target' : 
                               target.status === 'needs-attention' ? '🟡 Perlu Dorongan' : '🔴 Terlambat'}
                            </span>
                          </td>

                          {/* Aksi */}
                          {userRole !== 'wali' && (
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditTarget(student.id)}
                                  className="px-2 py-1 rounded bg-[#1E293B] text-[#D4AF37] hover:bg-slate-800 font-bold text-[10px] transition cursor-pointer shadow-2xs"
                                  title="Edit Target Santri Ini"
                                >
                                  Atur Target
                                </button>
                              </div>
                            </td>
                          )}

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

      {/* MODAL ATUR TARGET */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-[#D4AF37]" />
                <span>Atur Target Hafalan Santri</span>
              </h3>
              <button 
                onClick={() => setShowTargetModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Pilih Santri:</label>
                <select
                  value={targetFormData.studentId}
                  onChange={(e) => setTargetFormData({ ...targetFormData, studentId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  {students.map(s => {
                    const cls = classes.find(c => c.id === s.classId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({cls?.name || 'Kelas'}) - Hafal: {s.totalJuzHafal || 0} Juz
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Periode Target:</label>
                  <select
                    value={targetFormData.targetType}
                    onChange={(e) => setTargetFormData({ ...targetFormData, targetType: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    <option value="Tahunan">Tahunan</option>
                    <option value="Semester">Semester</option>
                    <option value="Bulanan">Bulanan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Jumlah Juz:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="30"
                    value={targetFormData.targetJuz}
                    onChange={(e) => setTargetFormData({ ...targetFormData, targetJuz: parseFloat(e.target.value) || 1 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tenggat Waktu (Deadline):</label>
                <input
                  type="date"
                  value={targetFormData.deadline}
                  onChange={(e) => setTargetFormData({ ...targetFormData, deadline: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-slate-600 text-[11px] leading-relaxed">
                Ketercapaian akan dihitung otomatis terhadap rekap total juz yang telah disetorkan oleh santri.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E293B] hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Target className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Simpan Target</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
