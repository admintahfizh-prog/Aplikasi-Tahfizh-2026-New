import React, { useState, useMemo } from 'react';
import { 
  Target, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Search, 
  Calendar, 
  X,
  Sparkles,
  GraduationCap,
  Clock,
  Edit3,
  Layers,
  BookOpen,
  BookMarked,
  Check,
  RefreshCw,
  Info,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { TargetProgress, Student, ClassItem, Role, TermName, TargetCategory } from '../types';
import { storageService } from '../services/storageService';
import { AvatarBadge } from './AvatarBadge';
import { 
  TERM_DEFINITIONS, 
  HAFALAN_TERM_STANDARDS, 
  UMMI_TERM_STANDARDS,
  getStudentStandardTermTarget,
  evaluateHafalanTerm,
  evaluateUmmiTerm
} from '../data/targetTermData';

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
  // Primary Tabs: Hafalan per Term, Ummi per Term, Standar Kurikulum Term
  const [activeTab, setActiveTab] = useState<'hafalan' | 'ummi' | 'kurikulum'>('hafalan');
  
  // Term filter (Term 1, Term 2, Term 3, Term 4, atau all)
  const [selectedTerm, setSelectedTerm] = useState<TermName | 'all'>('Term 1');
  
  // Class & search filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'on-track' | 'needs-attention' | 'behind'>('all');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal for editing/adding target
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [modalCategory, setModalCategory] = useState<TargetCategory>('Hafalan');
  const [targetFormData, setTargetFormData] = useState<{
    id?: string;
    studentId: string;
    category: TargetCategory;
    term: TermName;
    targetType: 'Term' | 'Tahunan';
    targetJuz: number;
    targetUmmiJilid: string;
    targetUmmiPage: number;
    deadline: string;
    notes: string;
  }>({
    studentId: students[0]?.id || '',
    category: 'Hafalan',
    term: 'Term 1',
    targetType: 'Term',
    targetJuz: 0.5,
    targetUmmiJilid: 'Jilid 1',
    targetUmmiPage: 40,
    deadline: '2026-09-30',
    notes: ''
  });

  // Handle Sync Standar Otomatis
  const handleGenerateDefaultTargets = () => {
    setIsSyncing(true);
    try {
      const res = storageService.generateDefaultTermTargets();
      setSyncFeedback(res.message);
      onRefreshData();
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err: any) {
      console.error(err);
      setSyncFeedback('Terjadi kesalahan saat menyinkronkan target standar.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Open modal prefilled for a student
  const handleOpenEditTarget = (studentId: string, category: TargetCategory, term: TermName) => {
    const std = students.find(s => s.id === studentId);
    const existing = targets.find(t => 
      t.studentId === studentId && 
      (t.category === category || (!t.category && category === 'Hafalan')) && 
      (t.term === term || (t.targetType === 'Term' && t.period?.includes(term)))
    );

    const stdStandard = std ? getStudentStandardTermTarget(std, term, category) : null;

    setModalCategory(category);
    setTargetFormData({
      id: existing?.id,
      studentId,
      category,
      term,
      targetType: 'Term',
      targetJuz: existing?.targetJuz ?? (stdStandard?.targetNumber || 0.5),
      targetUmmiJilid: existing?.targetUmmiJilid || stdStandard?.targetJilid || 'Jilid 1',
      targetUmmiPage: existing?.targetUmmiPage || stdStandard?.targetPage || 40,
      deadline: existing?.deadline || stdStandard?.deadline || '2026-09-30',
      notes: existing?.notes || ''
    });
    setShowTargetModal(true);
  };

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const std = students.find(s => s.id === targetFormData.studentId);
    if (!std) return;

    if (targetFormData.category === 'Hafalan') {
      const achievedJuz = std.totalJuzHafal || 0;
      const evalRes = evaluateHafalanTerm(achievedJuz, targetFormData.targetJuz);
      
      const item: TargetProgress = {
        id: targetFormData.id || `tgt-hfl-${std.id}-${targetFormData.term.toLowerCase().replace(' ', '')}`,
        studentId: std.id,
        category: 'Hafalan',
        targetType: targetFormData.targetType,
        term: targetFormData.term,
        academicYear: '2026/2027',
        period: `${targetFormData.term} (${targetFormData.term === 'Term 1' ? 'Juli - Sep' : targetFormData.term === 'Term 2' ? 'Okt - Des' : targetFormData.term === 'Term 3' ? 'Jan - Mar' : 'Apr - Jun'} 2026/2027)`,
        targetJuz: Number(targetFormData.targetJuz),
        achievedJuz,
        currentAchievement: achievedJuz,
        remainingJuz: evalRes.remainingJuz,
        percentage: evalRes.percentage,
        status: evalRes.status,
        deadline: targetFormData.deadline,
        notes: targetFormData.notes
      };
      storageService.saveTarget(item);
    } else {
      // Ummi target
      const currentJilid = std.currentUmmiJilid || 'Jilid 1';
      const currentPage = std.currentUmmiPage || 1;
      const evalRes = evaluateUmmiTerm(currentJilid, currentPage, targetFormData.targetUmmiJilid, targetFormData.targetUmmiPage);

      const item: TargetProgress = {
        id: targetFormData.id || `tgt-ummi-${std.id}-${targetFormData.term.toLowerCase().replace(' ', '')}`,
        studentId: std.id,
        category: 'Ummi',
        targetType: targetFormData.targetType,
        term: targetFormData.term,
        academicYear: '2026/2027',
        period: `${targetFormData.term} (${targetFormData.term === 'Term 1' ? 'Juli - Sep' : targetFormData.term === 'Term 2' ? 'Okt - Des' : targetFormData.term === 'Term 3' ? 'Jan - Mar' : 'Apr - Jun'} 2026/2027)`,
        targetJuz: 0,
        targetUmmiJilid: targetFormData.targetUmmiJilid,
        targetUmmiPage: Number(targetFormData.targetUmmiPage),
        achievedUmmiJilid: currentJilid,
        achievedUmmiPage: currentPage,
        remainingJuz: 0,
        percentage: evalRes.percentage,
        status: evalRes.status,
        ummiStatus: evalRes.status,
        ummiPercentage: evalRes.percentage,
        deadline: targetFormData.deadline,
        notes: targetFormData.notes
      };
      storageService.saveTarget(item);
    }

    setShowTargetModal(false);
    onRefreshData();
  };

  // Build Target Lookup Maps
  const { hafalanTargetMap, ummiTargetMap } = useMemo(() => {
    const hMap = new Map<string, TargetProgress>();
    const uMap = new Map<string, TargetProgress>();

    for (const t of targets) {
      const termKey = t.term || (t.period?.includes('Term 1') ? 'Term 1' : t.period?.includes('Term 2') ? 'Term 2' : t.period?.includes('Term 3') ? 'Term 3' : t.period?.includes('Term 4') ? 'Term 4' : 'Tahunan');
      const cat = t.category || (t.targetUmmiJilid ? 'Ummi' : 'Hafalan');

      if (cat === 'Ummi') {
        uMap.set(`${t.studentId}_${termKey}`, t);
      } else {
        hMap.set(`${t.studentId}_${termKey}`, t);
      }
    }
    return { hafalanTargetMap: hMap, ummiTargetMap: uMap };
  }, [targets]);

  // Active Term Information
  const activeTermDef = useMemo(() => {
    if (selectedTerm === 'all') return null;
    return TERM_DEFINITIONS.find(t => t.term === selectedTerm) || TERM_DEFINITIONS[0];
  }, [selectedTerm]);

  // Filter and Enrich Student List per Class
  const enrichedClassList = useMemo(() => {
    const activeClasses = classes.length > 0 ? classes : [];

    return activeClasses
      .filter(c => selectedClassFilter === 'all' || c.id === selectedClassFilter)
      .map(cls => {
        // Untuk tab Ummi: prioritaskan Level 7, namun jangan kecualikan jika ada santri Ummi di rombel lain
        const classStudents = students
          .filter(s => s.classId === cls.id)
          .filter(s => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return s.name.toLowerCase().includes(term) || (s.nis || '').toLowerCase().includes(term);
          })
          .map(std => {
            const currentTermKey = selectedTerm === 'all' ? 'Term 1' : selectedTerm;

            if (activeTab === 'ummi') {
              // Target Ummi
              const storedTarget = ummiTargetMap.get(`${std.id}_${currentTermKey}`);
              const standard = getStudentStandardTermTarget(std, currentTermKey, 'Ummi');
              const curJilid = std.currentUmmiJilid || 'Jilid 1';
              const curPage = std.currentUmmiPage || 1;
              const tgtJilid = storedTarget?.targetUmmiJilid || standard.targetJilid || 'Jilid 1';
              const tgtPage = storedTarget?.targetUmmiPage || standard.targetPage || 40;
              const evalRes = evaluateUmmiTerm(curJilid, curPage, tgtJilid, tgtPage);

              const target: TargetProgress = storedTarget || {
                id: `temp-ummi-${std.id}-${currentTermKey}`,
                studentId: std.id,
                category: 'Ummi',
                targetType: 'Term',
                term: currentTermKey,
                academicYear: '2026/2027',
                targetJuz: 0,
                targetUmmiJilid: tgtJilid,
                targetUmmiPage: tgtPage,
                achievedUmmiJilid: curJilid,
                achievedUmmiPage: curPage,
                remainingJuz: 0,
                percentage: evalRes.percentage,
                status: evalRes.status,
                deadline: standard.deadline,
                notes: standard.notes
              };

              return {
                student: std,
                target,
                evalRes
              };
            } else {
              // Target Hafalan
              const storedTarget = hafalanTargetMap.get(`${std.id}_${currentTermKey}`);
              const standard = getStudentStandardTermTarget(std, currentTermKey, 'Hafalan');
              const achievedJuz = std.totalJuzHafal || 0;
              const tgtJuz = storedTarget?.targetJuz || standard.targetNumber;
              const evalRes = evaluateHafalanTerm(achievedJuz, tgtJuz);

              const target: TargetProgress = storedTarget || {
                id: `temp-hfl-${std.id}-${currentTermKey}`,
                studentId: std.id,
                category: 'Hafalan',
                targetType: 'Term',
                term: currentTermKey,
                academicYear: '2026/2027',
                targetJuz: tgtJuz,
                achievedJuz,
                remainingJuz: evalRes.remainingJuz,
                percentage: evalRes.percentage,
                status: evalRes.status,
                deadline: standard.deadline,
                notes: standard.notes
              };

              return {
                student: std,
                target,
                evalRes
              };
            }
          })
          .filter(item => {
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
  }, [classes, students, selectedClassFilter, searchTerm, activeTab, selectedTerm, hafalanTargetMap, ummiTargetMap, statusFilter]);

  // Global KPI Calculations
  const allFilteredStudents = useMemo(() => {
    return enrichedClassList.flatMap(c => c.studentsWithTarget);
  }, [enrichedClassList]);

  const globalStats = useMemo(() => {
    const total = allFilteredStudents.length;
    const onTrack = allFilteredStudents.filter(s => s.target.status === 'on-track').length;
    const needsAttention = allFilteredStudents.filter(s => s.target.status === 'needs-attention').length;
    const behind = allFilteredStudents.filter(s => s.target.status === 'behind').length;
    const avgPct = total > 0 ? Math.round(allFilteredStudents.reduce((sum, s) => sum + s.target.percentage, 0) / total) : 0;
    return { total, onTrack, needsAttention, behind, avgPct };
  }, [allFilteredStudents]);

  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      
      {/* Header & Title Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-[#D4AF37]">
              <Target className="w-5 h-5 text-amber-700" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Target UMMI & Hafalan per Term (3 Bulan)
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Monitoring capaian berkala triwulan SMP Islam Al Azhar 21 Solo Baru (Tahun Ajaran 2026/2027).
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {userRole !== 'wali' && (
            <button
              onClick={handleGenerateDefaultTargets}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
              title="Membuat dan menyinkronkan target standar 4 Term untuk seluruh santri sesuai program dan jenjangnya"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Target Standar Term (Semua Santri)'}</span>
            </button>
          )}

          {userRole === 'admin' && (
            <button
              onClick={() => {
                setModalCategory(activeTab === 'ummi' ? 'Ummi' : 'Hafalan');
                setShowTargetModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#1E293B] hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>+ Atur Target Manual</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Feedback Toast */}
      {syncFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <button onClick={() => setSyncFeedback(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('hafalan')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'hafalan'
              ? 'bg-[#1E293B] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className={`w-4 h-4 ${activeTab === 'hafalan' ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
          <span>Target Hafalan Al-Qur'an per Term</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'hafalan' ? 'bg-amber-400/20 text-[#D4AF37]' : 'bg-slate-100 text-slate-500'
          }`}>
            Kelas 7, 8, 9
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ummi')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'ummi'
              ? 'bg-[#1E293B] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookMarked className={`w-4 h-4 ${activeTab === 'ummi' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>Target Metode UMMI per Term</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'ummi' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-slate-100 text-slate-500'
          }`}>
            Khusus Kelas 7 (Jilid & Munaqosyah)
          </span>
        </button>

        <button
          onClick={() => setActiveTab('kurikulum')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'kurikulum'
              ? 'bg-[#1E293B] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className={`w-4 h-4 ${activeTab === 'kurikulum' ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
          <span>Matriks Standar Kurikulum 4 Term (SOP Acuan)</span>
        </button>
      </div>

      {/* Term Selector Bar (Triwulan 1 s/d 4) */}
      {activeTab !== 'kurikulum' && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Pilih Periode Term / 3 Bulan:
              </span>
            </div>
            {activeTermDef && (
              <span className="text-xs font-semibold text-[#D4AF37] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Tenggat Evaluasi: <strong>{activeTermDef.defaultDeadline}</strong>
              </span>
            )}
          </div>

          {/* 4 Term Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {TERM_DEFINITIONS.map(td => {
              const isSelected = selectedTerm === td.term;
              return (
                <button
                  key={td.term}
                  onClick={() => setSelectedTerm(td.term)}
                  className={`p-3 rounded-xl text-left transition cursor-pointer border relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-[#D4AF37] text-white shadow-xs ring-1 ring-[#D4AF37]'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${isSelected ? 'text-[#D4AF37]' : 'text-slate-200'}`}>
                      {td.term}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-black/40 text-slate-300 font-mono">
                      {td.monthsRange}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold mt-1 text-slate-100">
                    {td.months}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                    {td.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB KURIKULUM: Matriks Standar Target Term */}
      {activeTab === 'kurikulum' ? (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Overview Banner */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-base font-bold text-white">
                Struktur Target Berkala Kurikulum UMMI & Tahfizh per Term (3 Bulan)
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              Pembagian 1 tahun ajaran menjadi 4 Term (Triwulan) menjamin pencapaian target santri terukur secara bertahap, mudah dievaluasi setiap 3 bulan bersama orang tua, dan mencegah keterlambatan materi di akhir tahun.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              {TERM_DEFINITIONS.map(td => (
                <div key={td.term} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#D4AF37] text-xs">{td.term}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{td.monthsRange}</span>
                  </div>
                  <div className="text-xs font-semibold text-white mt-1">{td.months}</div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">{td.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Matriks Standar Hafalan Al-Qur'an */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-bold text-slate-900 text-sm">
                  1. Standar Acuan Target Hafalan Al-Qur'an (Tahfizh) per Term
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Berlaku untuk Kelas 7, 8, dan 9</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-4 w-44">Program & Target Tahunan</th>
                    <th className="py-3 px-4">Term 1 (Jul - Sep)</th>
                    <th className="py-3 px-4">Term 2 (Okt - Des)</th>
                    <th className="py-3 px-4">Term 3 (Jan - Mar)</th>
                    <th className="py-3 px-4">Term 4 (Apr - Jun)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {HAFALAN_TERM_STANDARDS.map((std, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-4 align-top font-bold text-slate-900">
                        <div className="text-xs text-slate-900">{std.program}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black">
                          {std.annualTarget}
                        </span>
                      </td>
                      {std.terms.map(t => (
                        <td key={t.term} className="py-4 px-4 align-top space-y-1">
                          <div className="font-black text-[#8C7015] text-xs">
                            {t.targetValue}
                          </div>
                          <div className="text-slate-800 font-medium text-[11px] leading-snug">
                            {t.materialSummary}
                          </div>
                          <div className="text-[10px] text-slate-500 leading-snug pt-1">
                            <em>Indikator:</em> {t.competencyIndicator}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Matriks Standar Metode UMMI (Khusus Kelas 7) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  2. Standar Acuan Target Metode UMMI per Term (Khusus Jenjang Kelas 7)
                </h3>
              </div>
              <span className="text-xs text-emerald-800 font-bold bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                Target Tuntas 1 Tahun & Lulus Munaqosyah
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-4 w-52">Jalur Penempatan & Target 1 Tahun</th>
                    <th className="py-3 px-4">Term 1 (Jul - Sep)</th>
                    <th className="py-3 px-4">Term 2 (Okt - Des)</th>
                    <th className="py-3 px-4">Term 3 (Jan - Mar)</th>
                    <th className="py-3 px-4">Term 4 (Apr - Jun)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {UMMI_TERM_STANDARDS.map((std, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-4 align-top font-bold text-slate-900">
                        <div className="text-xs text-slate-900">{std.program}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-black">
                          {std.annualTarget}
                        </span>
                      </td>
                      {std.terms.map(t => (
                        <td key={t.term} className="py-4 px-4 align-top space-y-1">
                          <div className="font-black text-emerald-700 text-xs">
                            {t.targetValue}
                          </div>
                          <div className="text-slate-800 font-medium text-[11px] leading-snug">
                            {t.materialSummary}
                          </div>
                          <div className="text-[10px] text-slate-500 leading-snug pt-1">
                            <em>Kelulusan:</em> {t.competencyIndicator}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        /* TAB HAFALAN ATAU UMMI: Live Dashboard Monitoring Santri */
        <div className="space-y-6">

          {/* Global KPI Summary Cards for Active Tab & Term */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Santri Dipantau
                </span>
                <GraduationCap className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-2xl font-black text-slate-800 mt-1.5">{globalStats.total} Santri</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {activeTab === 'ummi' ? 'Kelas 7 & Rombel Ummi' : 'Seluruh Rombel & Jenjang'}
              </p>
            </div>

            <div 
              onClick={() => setStatusFilter(statusFilter === 'on-track' ? 'all' : 'on-track')}
              className={`p-4 rounded-2xl border cursor-pointer transition shadow-xs ${
                statusFilter === 'on-track' 
                  ? 'bg-emerald-100/90 border-emerald-400 ring-2 ring-emerald-500' 
                  : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  🟢 Sesuai Target (&gt;=70%)
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-950 mt-1.5">{globalStats.onTrack} Santri</p>
              <p className="text-[10px] text-emerald-700 mt-0.5">Capaian tuntas dan stabil</p>
            </div>

            <div 
              onClick={() => setStatusFilter(statusFilter === 'needs-attention' ? 'all' : 'needs-attention')}
              className={`p-4 rounded-2xl border cursor-pointer transition shadow-xs ${
                statusFilter === 'needs-attention' 
                  ? 'bg-amber-100/90 border-[#D4AF37] ring-2 ring-[#D4AF37]' 
                  : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                  🟡 Perlu Dorongan (40-69%)
                </span>
                <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <p className="text-2xl font-black text-amber-950 mt-1.5">{globalStats.needsAttention} Santri</p>
              <p className="text-[10px] text-[#8C7015] mt-0.5">Memerlukan akselerasi target</p>
            </div>

            <div 
              onClick={() => setStatusFilter(statusFilter === 'behind' ? 'all' : 'behind')}
              className={`p-4 rounded-2xl border cursor-pointer transition shadow-xs ${
                statusFilter === 'behind' 
                  ? 'bg-rose-100/90 border-rose-400 ring-2 ring-rose-500' 
                  : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                  🔴 Tertinggal (&lt;40%)
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-rose-950 mt-1.5">{globalStats.behind} Santri</p>
              <p className="text-[10px] text-rose-700 mt-0.5">Butuh bimbingan intensif</p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            
            {/* Class Pill Navigator */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Filter Kelas:
                </span>
                <button
                  onClick={() => setSelectedClassFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedClassFilter === 'all'
                      ? 'bg-[#1E293B] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua Kelas ({classes.length})
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
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Secondary Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari nama santri atau NIS..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none font-semibold text-slate-700"
                >
                  <option value="all">Semua Status Ketercapaian</option>
                  <option value="on-track">🟢 Sesuai Target (&gt;= 70%)</option>
                  <option value="needs-attention">🟡 Perlu Didorong (40 - 69%)</option>
                  <option value="behind">🔴 Tertinggal (&lt; 40%)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Render Santri Table by Class */}
          <div className="space-y-6">
            {enrichedClassList.map((cls) => {
              if (cls.studentsWithTarget.length === 0 && selectedClassFilter === 'all') return null;

              return (
                <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  
                  {/* Header Kelas */}
                  <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-[#1E293B] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-slate-950 flex items-center justify-center font-black text-sm shadow-xs">
                        {cls.name}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                          <span>
                            {activeTab === 'ummi' ? 'Target UMMI' : 'Target Hafalan'} Kelas {cls.name}
                          </span>
                          <span className="text-xs font-normal text-slate-300">
                            ({selectedTerm === 'all' ? 'Semua Term' : selectedTerm})
                          </span>
                        </h2>
                        <p className="text-xs text-[#D4AF37]">
                          Tingkat {cls.level} SMP Islam Al Azhar 21 • TP 2026/2027
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
                          <th className="py-3 px-3.5">Program / Jenjang</th>
                          <th className="py-3 px-3.5">
                            {activeTab === 'ummi' ? 'Target Ummi Term' : 'Target Hafalan Term'}
                          </th>
                          <th className="py-3 px-3.5">Capaian Riil Saat Ini</th>
                          <th className="py-3 px-3.5 w-52">Progress Ketercapaian</th>
                          <th className="py-3 px-3.5 text-center">Status</th>
                          {userRole !== 'wali' && <th className="py-3 px-3.5 text-center">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cls.studentsWithTarget.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400">
                              Tidak ada data santri yang cocok dengan filter di kelas ini.
                            </td>
                          </tr>
                        ) : (
                          cls.studentsWithTarget.map((item, idx) => {
                            const { student, target } = item;
                            const isUmmi = activeTab === 'ummi';

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
                                        NIS: {student.nis || '-'}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Program */}
                                <td className="py-3 px-3.5">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                    {student.program || 'Reguler Tahfizh'}
                                  </span>
                                </td>

                                {/* Target Term */}
                                <td className="py-3 px-3.5 font-bold">
                                  {isUmmi ? (
                                    <div className="space-y-0.5">
                                      <span className="text-emerald-800 font-black">
                                        {target.targetUmmiJilid || 'Jilid 1'} {target.targetUmmiPage ? `(Hal ${target.targetUmmiPage})` : ''}
                                      </span>
                                      <div className="text-[10px] text-slate-500 font-normal">
                                        {target.term || selectedTerm} • DL: {target.deadline || '30 Sep 2026'}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-0.5">
                                      <span className="text-slate-900 font-black">
                                        {target.targetJuz} Juz
                                      </span>
                                      <div className="text-[10px] text-slate-500 font-normal">
                                        {target.term || selectedTerm} • DL: {target.deadline || '30 Sep 2026'}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Capaian Riil */}
                                <td className="py-3 px-3.5">
                                  {isUmmi ? (
                                    <div>
                                      <span className="font-extrabold text-slate-800">
                                        {student.currentUmmiJilid || 'Jilid 1'}
                                      </span>
                                      <span className="text-slate-500 text-[11px] ml-1">
                                        Hal {student.currentUmmiPage || 1}
                                      </span>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="font-extrabold text-slate-800">
                                        {student.totalJuzHafal || 0} Juz
                                      </span>
                                      <span className="text-[10px] text-slate-400 block font-normal">
                                        Sisa: {target.remainingJuz} Juz
                                      </span>
                                    </div>
                                  )}
                                </td>

                                {/* Progress Ketercapaian */}
                                <td className="py-3 px-3.5">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-bold">
                                      <span className="text-slate-600">
                                        {target.percentage}%
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-normal">
                                        {isUmmi ? (target.percentage >= 100 ? 'Tuntas Target' : `${target.percentage}% tuntas`) : `${student.totalJuzHafal || 0}/${target.targetJuz} Juz`}
                                      </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          target.percentage >= 100 ? 'bg-emerald-500' :
                                          target.percentage >= 70 ? 'bg-emerald-400' :
                                          target.percentage >= 40 ? 'bg-[#D4AF37]' : 'bg-rose-500'
                                        }`}
                                        style={{ width: `${Math.min(100, target.percentage)}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="py-3 px-3.5 text-center">
                                  {target.status === 'on-track' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Sesuai Target
                                    </span>
                                  ) : target.status === 'needs-attention' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900">
                                      <TrendingUp className="w-3 h-3 text-[#D4AF37]" />
                                      Perlu Dorongan
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                                      Tertinggal
                                    </span>
                                  )}
                                </td>

                                {/* Aksi */}
                                {userRole !== 'wali' && (
                                  <td className="py-3 px-3.5 text-center">
                                    <button
                                      onClick={() => handleOpenEditTarget(
                                        student.id, 
                                        isUmmi ? 'Ummi' : 'Hafalan', 
                                        (selectedTerm === 'all' ? 'Term 1' : selectedTerm)
                                      )}
                                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
                                      title="Atur target individual santri ini"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
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
              );
            })}
          </div>

        </div>
      )}

      {/* MODAL ATUR TARGET (HAFALAN & UMMI PER TERM) */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-[#D4AF37]" />
                <span>Atur Target Santri per Term (3 Bulan)</span>
              </h3>
              <button 
                onClick={() => setShowTargetModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="space-y-4 text-xs">
              
              {/* Pilihan Kategori Target: Hafalan vs Ummi */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Jenis Target:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetFormData({
                        ...targetFormData,
                        category: 'Hafalan',
                        targetJuz: 0.5
                      });
                    }}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer border ${
                      targetFormData.category === 'Hafalan'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Hafalan Al-Qur'an</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetFormData({
                        ...targetFormData,
                        category: 'Ummi',
                        targetUmmiJilid: 'Jilid 1',
                        targetUmmiPage: 40
                      });
                    }}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer border ${
                      targetFormData.category === 'Ummi'
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <BookMarked className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Metode UMMI</span>
                  </button>
                </div>
              </div>

              {/* Pilih Santri */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Pilih Santri:</label>
                <select
                  value={targetFormData.studentId}
                  onChange={(e) => {
                    const stdId = e.target.value;
                    const std = students.find(s => s.id === stdId);
                    if (std) {
                      const stdStd = getStudentStandardTermTarget(std, targetFormData.term, targetFormData.category);
                      setTargetFormData({
                        ...targetFormData,
                        studentId: stdId,
                        targetJuz: stdStd.targetNumber,
                        targetUmmiJilid: stdStd.targetJilid || 'Jilid 1',
                        targetUmmiPage: stdStd.targetPage || 40,
                        deadline: stdStd.deadline
                      });
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  {students.map(s => {
                    const cls = classes.find(c => c.id === s.classId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({cls?.name || 'Kelas'}) - Hafal: {s.totalJuzHafal || 0} Juz • Ummi: {s.currentUmmiJilid || 'Jilid 1'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Pilih Periode Term (3 Bulanan) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Periode Term:</label>
                  <select
                    value={targetFormData.term}
                    onChange={(e) => {
                      const term = e.target.value as TermName;
                      const std = students.find(s => s.id === targetFormData.studentId);
                      const stdStd = std ? getStudentStandardTermTarget(std, term, targetFormData.category) : null;
                      setTargetFormData({
                        ...targetFormData,
                        term,
                        targetJuz: stdStd?.targetNumber ?? targetFormData.targetJuz,
                        targetUmmiJilid: stdStd?.targetJilid ?? targetFormData.targetUmmiJilid,
                        targetUmmiPage: stdStd?.targetPage ?? targetFormData.targetUmmiPage,
                        deadline: stdStd?.deadline || targetFormData.deadline
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    <option value="Term 1">Term 1 (Jul - Sep)</option>
                    <option value="Term 2">Term 2 (Okt - Des)</option>
                    <option value="Term 3">Term 3 (Jan - Mar)</option>
                    <option value="Term 4">Term 4 (Apr - Jun)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tenggat Waktu (Deadline):</label>
                  <input
                    type="date"
                    value={targetFormData.deadline}
                    onChange={(e) => setTargetFormData({ ...targetFormData, deadline: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              {/* Form Input Spesifik Kategori */}
              {targetFormData.category === 'Hafalan' ? (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Jumlah Juz Term Ini:</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="30"
                    value={targetFormData.targetJuz}
                    onChange={(e) => setTargetFormData({ ...targetFormData, targetJuz: parseFloat(e.target.value) || 0.5 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Standar acuan Term 1: 0.5 Juz (Reguler) / 1.0 Juz (Unggulan).
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Target Jilid Ummi:</label>
                    <select
                      value={targetFormData.targetUmmiJilid}
                      onChange={(e) => setTargetFormData({ ...targetFormData, targetUmmiJilid: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                    >
                      <option value="Jilid 1">Jilid 1</option>
                      <option value="Jilid 2">Jilid 2</option>
                      <option value="Jilid 3">Jilid 3</option>
                      <option value="Al-Qur'an">Al-Qur'an Remaja</option>
                      <option value="Gharib">Gharibul Qur'an</option>
                      <option value="Tajwid">Tajwid Praktis</option>
                      <option value="Munaqosyah">Munaqosyah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Target Halaman:</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={targetFormData.targetUmmiPage}
                      onChange={(e) => setTargetFormData({ ...targetFormData, targetUmmiPage: parseInt(e.target.value) || 40 })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Catatan Pembinaan */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Target / Bimbingan Ustadz:</label>
                <textarea
                  rows={2}
                  value={targetFormData.notes}
                  onChange={(e) => setTargetFormData({ ...targetFormData, notes: e.target.value })}
                  placeholder="Contoh: Fokus pada ziyadah surat An-Naba dan pemantapan mad thabi'i..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E293B] hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Target className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Simpan Target Term</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
