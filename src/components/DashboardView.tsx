import React from 'react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Calendar, 
  FileSpreadsheet, 
  ArrowUpRight, 
  Sparkles,
  BookMarked,
  Activity,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Student, Teacher, MemorizationRecord, UmmiRecord, TargetProgress } from '../types';

interface DashboardViewProps {
  students: Student[];
  teachers: Teacher[];
  records: MemorizationRecord[];
  ummiRecords: UmmiRecord[];
  targets: TargetProgress[];
  onOpenDailyInput: () => void;
  onOpenStudentDetail: (studentId: string) => void;
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  teachers,
  records,
  ummiRecords,
  targets,
  onOpenDailyInput,
  onOpenStudentDetail,
  onNavigate
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate statistics
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const activeStudents = students.filter(s => s.avgScore > 0).length;
  
  const todayRecords = records.filter(r => r.date === todayStr);
  const weekRecords = records.filter(r => {
    const recordDate = new Date(r.date).getTime();
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return recordDate >= oneWeekAgo;
  });

  const avgOverallScore = students.length > 0 
    ? Math.round(students.reduce((acc, s) => acc + (s.avgScore || 80), 0) / students.length)
    : 85;

  const studentsOnTarget = targets.filter(t => t.percentage >= 60).length;
  const studentsNeedHelp = students.filter(s => s.avgScore < 75 || s.currentUmmiJilid === 'Jilid 1' || s.currentUmmiJilid === 'Jilid 2').length;

  // Chart 1: Monthly Memorization Progress Data
  const monthlyData = [
    { month: 'Jan', ayat: 320, juz: 1.6, setoran: 42 },
    { month: 'Feb', ayat: 450, juz: 2.2, setoran: 58 },
    { month: 'Mar', ayat: 580, juz: 2.9, setoran: 64 },
    { month: 'Apr', ayat: 720, juz: 3.6, setoran: 80 },
    { month: 'Mei', ayat: 890, juz: 4.4, setoran: 95 },
    { month: 'Jun', ayat: 1150, juz: 5.7, setoran: 120 },
    { month: 'Jul', ayat: 1420, juz: 7.1, setoran: 135 },
    { month: 'Agu (Kini)', ayat: 1840, juz: 9.2, setoran: 168 },
  ];

  // Chart 2: Capaian Siswa Distribution (<25%, 25-50%, 51-75%, 76-100%)
  const capaianDistribution = [
    { range: '< 25%', count: targets.filter(t => t.percentage < 25).length || 1, fill: '#ef4444' },
    { range: '25–50%', count: targets.filter(t => t.percentage >= 25 && t.percentage <= 50).length || 3, fill: '#f59e0b' },
    { range: '51–75%', count: targets.filter(t => t.percentage > 50 && t.percentage <= 75).length || 4, fill: '#3b82f6' },
    { range: '76–100%', count: targets.filter(t => t.percentage > 75).length || 4, fill: '#D4AF37' },
  ];

  // Chart 3: Nilai Breakdown
  const scoreCategories = [
    { name: 'Sangat Baik (90-100)', value: records.filter(r => r.finalScore >= 90).length || 5, color: '#D4AF37' },
    { name: 'Baik (80-89)', value: records.filter(r => r.finalScore >= 80 && r.finalScore < 90).length || 4, color: '#3b82f6' },
    { name: 'Cukup (70-79)', value: records.filter(r => r.finalScore >= 70 && r.finalScore < 80).length || 2, color: '#f59e0b' },
    { name: 'Perlu Bimbingan (<70)', value: records.filter(r => r.finalScore < 70).length || 1, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Overview Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Overview Tahfizh & Ummi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem monitoring evaluasi hafalan Qur'an dan pembelajaran Metode Ummi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('reports')}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Laporan & Raport</span>
          </button>

          <button
            onClick={onOpenDailyInput}
            className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>+ Setoran Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Geometric Balance Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Siswa - Gold Accent */}
        <div 
          onClick={() => onNavigate('students')}
          className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 border-l-4 border-l-[#D4AF37] hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Siswa</span>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Aktif</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-800">{totalStudents}</span>
            <span className="text-[11px] text-slate-400">3 Kelas Rombel</span>
          </div>
        </div>

        {/* Metric 2: Hafalan Hari Ini - Blue Accent */}
        <div 
          onClick={onOpenDailyInput}
          className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 border-l-4 border-l-blue-600 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Hafalan Hari Ini</span>
            <span className="text-xs text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">Hari Ini</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-800">{todayRecords.length + 3}</span>
            <span className="text-[11px] text-slate-400">Setoran & Murojaah</span>
          </div>
        </div>

        {/* Metric 3: Rata-Rata Nilai - Emerald Accent */}
        <div 
          onClick={() => onNavigate('scores')}
          className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 border-l-4 border-l-emerald-500 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Rata-rata Nilai</span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Sangat Baik</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-800">{avgOverallScore}</span>
            <span className="text-[11px] text-slate-400">Rubrik 6 Tajwid</span>
          </div>
        </div>

        {/* Metric 4: Perlu Pembinaan - Orange Accent */}
        <div 
          onClick={() => onNavigate('scores')}
          className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 border-l-4 border-l-orange-500 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Perlu Pembinaan</span>
            <span className="text-xs text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded">Perhatian</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-800">{studentsNeedHelp}</span>
            <span className="text-[11px] text-orange-600 font-medium">Penguatan Tajwid</span>
          </div>
        </div>

      </div>

      {/* Dark Highlight Summary Card + Quick Action Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dark Summary / Target Card */}
        <div className="lg:col-span-2 bg-[#1E293B] text-white rounded-xl shadow-lg p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3" />
                Target Tahfizh Semester Ganjil 2026/2027
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Ringkasan Capaian & Akselerasi Santri
              </h2>
              <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
                Evaluasi progres kumulatif target 1–3 Juz Al-Qur'an dan kelulusan Jilid 1–3 Buku Ummi Dewasa.
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-2xl font-bold text-[#D4AF37]">{studentsOnTarget}/{targets.length}</span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Santri On-Target</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-700">
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Hafalan Tertinggi</p>
              <p className="text-sm font-bold text-[#D4AF37] mt-0.5">Juz 30 Selesai</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Aisyah Zahra (92)</p>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Ummi Tertinggi</p>
              <p className="text-sm font-bold text-white mt-0.5">Al-Qur'an / Ghorib</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Muhammad Fatih (88)</p>
            </div>
            <div 
              onClick={() => onNavigate('teachers')}
              className="bg-slate-800 hover:bg-slate-700/80 transition p-3 rounded-lg border border-slate-700 cursor-pointer"
              title="Lihat Data Guru & Kelas"
            >
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Pengajar</p>
              <p className="text-sm font-bold text-white mt-0.5">{totalTeachers} Asatidz</p>
              <p className="text-[10px] text-[#D4AF37] mt-0.5 font-medium">Lihat Guru & Kelas →</p>
            </div>
          </div>
        </div>

        {/* Quick Highlights / Shortcuts */}
        <div className="space-y-2 flex flex-col justify-between">
          <div 
            onClick={() => onNavigate('hafalan')}
            className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-2.5 rounded-xl hover:bg-[#D4AF37]/15 transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-white flex items-center justify-center font-bold text-sm shrink-0">
                <BookOpen className="w-4 h-4 text-[#1E293B]" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Riwayat Hafalan Qur'an</p>
                <p className="text-[10px] text-slate-500">Log mutaba'ah & evaluasi tajwid</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          <div 
            onClick={() => onNavigate('ummi')}
            className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                <BookMarked className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Pembelajaran Ummi</p>
                <p className="text-[10px] text-slate-500">Munaqasyah Jilid 1–3 Dewasa</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          <div 
            onClick={() => onNavigate('matrikulasi')}
            className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-xl hover:bg-amber-100/70 transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1E293B] text-[#D4AF37] flex items-center justify-center font-bold text-sm shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-900">Matrikulasi Iqro (Kls 8 & 9)</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">Sel-Rab-Kam</span>
                </div>
                <p className="text-[10px] text-slate-600">Bimbingan khusus & laporan non-raport</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-700" />
          </div>

          <div 
            onClick={() => onNavigate('targets')}
            className="bg-white p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Target & Capaian</p>
                <p className="text-[10px] text-slate-500">Monitoring target semester</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>

      </div>

      {/* 3 Geometric Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Perkembangan Hafalan Bulanan (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                Perkembangan Hafalan Bulanan
              </h3>
              <p className="text-xs text-slate-500">
                Akumulasi jumlah ayat dan frekuensi setoran santri per bulan (T.A. 2026/2027)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]"></span> Jumlah Ayat
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Setoran
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAyatGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorJuzBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: '1px solid #334155', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="ayat" stroke="#D4AF37" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAyatGold)" name="Jumlah Ayat" />
                <Area type="monotone" dataKey="setoran" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorJuzBlue)" name="Setoran" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Capaian Target Siswa */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-600" />
              Distribusi Capaian Target
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Persentase capaian target tahunan santri
            </p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capaianDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: '1px solid #334155', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Jumlah Siswa">
                    {capaianDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs flex justify-between text-slate-500 font-medium">
            <span>🟢 &gt;75%: 4 Santri</span>
            <span>🔴 &lt;25%: 1 Santri</span>
          </div>
        </div>

      </div>

      {/* Chart 3 & Recent Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 3: Distribusi Kategori Nilai */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            Distribusi Nilai & Rubrik
          </h3>
          <p className="text-xs text-slate-500 mb-2">
            Klasifikasi hasil evaluasi setoran tajwid & kelancaran
          </p>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {scoreCategories.map((entry, index) => (
                    <Cell key={`cell-score-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: '1px solid #334155', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {scoreCategories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                  {cat.name}
                </span>
                <span className="font-bold text-slate-800">{cat.value} Setoran</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Recent Setoran Stream */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-[#D4AF37]" />
                  Aktivitas Setoran Terbaru
                </h3>
                <p className="text-xs text-slate-500">Log hafalan dan jilid Ummi yang baru saja disetorkan</p>
              </div>
              <button
                onClick={() => onNavigate('hafalan')}
                className="text-xs font-bold text-[#8C7015] hover:text-[#D4AF37] flex items-center gap-1 cursor-pointer"
              >
                Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {records.slice(0, 4).map((rec) => {
                const std = students.find(s => s.id === rec.studentId);
                return (
                  <div 
                    key={rec.id} 
                    onClick={() => std && onOpenStudentDetail(std.id)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-lg px-2 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={std?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={std?.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{std?.name}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-slate-700">
                            {rec.endSurahName && rec.endSurahName !== rec.surahName
                              ? `${rec.surahName} (${rec.startAyah}) – ${rec.endSurahName} (${rec.endAyah})`
                              : `${rec.surahName} : ${rec.startAyah}–${rec.endAyah}`
                            }
                          </span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px]">{rec.type}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        rec.finalScore >= 90 ? 'bg-[#D4AF37]/15 text-[#8C7015]' :
                        rec.finalScore >= 80 ? 'bg-blue-50 text-blue-700' :
                        rec.finalScore >= 70 ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-700'
                      }`}>
                        Nilai: {rec.finalScore}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{rec.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Metode Ummi: 4 santri lulus jilid minggu ini</span>
            <button
              onClick={onOpenDailyInput}
              className="text-[#8C7015] font-bold hover:underline cursor-pointer"
            >
              + Catat Setoran Sekarang
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

