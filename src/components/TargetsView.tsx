import React, { useState } from 'react';
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
  ArrowUpRight
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
  classes,
  userRole,
  onRefreshData,
  onOpenStudentDetail
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'Tahunan' | 'Semester' | 'Bulanan'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'on-track' | 'needs-attention' | 'behind'>('all');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTarget, setNewTarget] = useState({
    studentId: students[0]?.id || '',
    targetType: 'Tahunan' as 'Tahunan' | 'Semester' | 'Bulanan',
    targetJuz: 4.0,
    deadline: '2026-12-31'
  });

  const filteredTargets = targets.filter(t => {
    const std = students.find(s => s.id === t.studentId);
    const matchSearch = 
      (std?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (std?.nis || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchPeriod = periodFilter === 'all' || t.targetType === periodFilter;
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;

    return matchSearch && matchPeriod && matchStatus;
  });

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const std = students.find(s => s.id === newTarget.studentId);
    const achievedJuz = std?.totalJuzHafal || 0;
    const percentage = Math.min(100, Math.round((achievedJuz / newTarget.targetJuz) * 100));
    const remainingJuz = Math.max(0, Number((newTarget.targetJuz - achievedJuz).toFixed(1)));
    const status = percentage >= 70 ? 'on-track' : percentage >= 40 ? 'needs-attention' : 'behind';

    const item: TargetProgress = {
      id: 'target-' + Date.now(),
      studentId: newTarget.studentId,
      targetType: newTarget.targetType,
      targetJuz: newTarget.targetJuz,
      achievedJuz,
      percentage,
      remainingJuz,
      deadline: newTarget.deadline,
      status
    };

    storageService.saveTarget(item);
    setShowAddModal(false);
    onRefreshData();
  };

  // KPI calculations
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
            Target & Capaian Hafalan Santri
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring target hafalan berbasis formula real-time (Tahunan, Semester, & Bulanan)
          </p>
        </div>

        {userRole === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>+ Atur Target Baru</span>
          </button>
        )}
      </div>

      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div 
          onClick={() => setStatusFilter(statusFilter === 'on-track' ? 'all' : 'on-track')}
          className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 cursor-pointer hover:shadow-xs transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase">🟢 Sesuai Target (&gt;=70%)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-950 mt-2">{onTrackCount} Santri</p>
          <p className="text-[11px] text-emerald-700 mt-1">Capaian sangat baik & konsisten</p>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'needs-attention' ? 'all' : 'needs-attention')}
          className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 cursor-pointer hover:shadow-xs transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C7015] uppercase">🟡 Perlu Ditingkatkan (40-69%)</span>
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-bold text-amber-950 mt-2">{needsAttentionCount} Santri</p>
          <p className="text-[11px] text-[#8C7015] mt-1">Butuh percepatan ziyadah</p>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'behind' ? 'all' : 'behind')}
          className="p-4 bg-red-50/60 rounded-xl border border-red-200 cursor-pointer hover:shadow-xs transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-800 uppercase">🔴 Tertinggal (&lt;40%)</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-950 mt-2">{behindCount} Santri</p>
          <p className="text-[11px] text-red-700 mt-1">Perlu pendampingan khusus & murojaah</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari santri..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as any)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
          >
            <option value="all">Semua Periode</option>
            <option value="Tahunan">Tahunan</option>
            <option value="Semester">Semester</option>
            <option value="Bulanan">Bulanan</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="on-track">🟢 Sesuai Target</option>
            <option value="needs-attention">🟡 Perlu Ditingkatkan</option>
            <option value="behind">🔴 Tertinggal</option>
          </select>
        </div>
      </div>

      {/* Target Progress Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTargets.map((t) => {
          const std = students.find(s => s.id === t.studentId);
          const cls = classes.find(c => c.id === std?.classId);

          return (
            <div
              key={t.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <AvatarBadge
                      name={std?.name || 'Santri'}
                      photoUrl={std?.photo}
                      gender={std?.gender}
                      role="santri"
                      size="md"
                      className="shrink-0"
                    />
                    <div>
                      <h4 
                        onClick={() => std && onOpenStudentDetail(std.id)}
                        className="font-bold text-xs text-slate-900 hover:text-[#D4AF37] cursor-pointer"
                      >
                        {std?.name || 'Santri'}
                      </h4>
                      <p className="text-[11px] text-slate-500">Kelas {cls?.name || '7A'} • {std?.program}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    t.status === 'on-track' ? 'bg-emerald-100 text-emerald-800' :
                    t.status === 'needs-attention' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {t.status === 'on-track' ? '🟢 Sesuai' : t.status === 'needs-attention' ? '🟡 Waspada' : '🔴 Tertinggal'}
                  </span>
                </div>

                {/* Progress Visual */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Target {t.targetType}: {t.targetJuz} Juz</span>
                    <span className="font-bold text-slate-900">{t.achievedJuz} Juz ({t.percentage}%)</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        t.percentage >= 70 ? 'bg-emerald-500' :
                        t.percentage >= 40 ? 'bg-[#D4AF37]' : 'bg-red-500'
                      }`}
                      style={{ width: `${t.percentage}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                    <span>Sisa: <strong>{t.remainingJuz} Juz</strong></span>
                    <span>Tenggat: <strong>{t.deadline}</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono text-[11px]">Formula: {t.achievedJuz}/{t.targetJuz}</span>
                <button
                  onClick={() => std && onOpenStudentDetail(std.id)}
                  className="text-[#8C7015] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Detail Santri <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD TARGET MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Atur Target Hafalan Santri</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Santri:</label>
                <select
                  value={newTarget.studentId}
                  onChange={(e) => setNewTarget({ ...newTarget, studentId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.nis})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Target:</label>
                <select
                  value={newTarget.targetType}
                  onChange={(e) => setNewTarget({ ...newTarget, targetType: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Tahunan">Tahunan (Tahun Ajaran)</option>
                  <option value="Semester">Semester (Ganjil/Genap)</option>
                  <option value="Bulanan">Bulanan</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Jumlah Juz:</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="30"
                  value={newTarget.targetJuz}
                  onChange={(e) => setNewTarget({ ...newTarget, targetJuz: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tenggat Waktu (Deadline):</label>
                <input
                  type="date"
                  value={newTarget.deadline}
                  onChange={(e) => setNewTarget({ ...newTarget, deadline: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E293B] hover:bg-slate-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
