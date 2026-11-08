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
  ChevronRight,
  Target,
  Filter,
  Layers,
  School
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
  Cell,
  Legend
} from 'recharts';
import { Student, Teacher, ClassItem, MemorizationRecord, UmmiRecord, TargetProgress, User } from '../types';
import { AvatarBadge } from './AvatarBadge';
import { Card3D } from './Card3D';
import { storageService } from '../services/storageService';
import { resolveCurrentTeacher } from '../utils/halaqahHelper';
import { isGrade8or9Student } from '../utils/gradeHelper';

interface DashboardViewProps {
  students: Student[];
  teachers: Teacher[];
  classes?: ClassItem[];
  records: MemorizationRecord[];
  ummiRecords: UmmiRecord[];
  targets: TargetProgress[];
  currentUser?: User | null;
  onOpenDailyInput: () => void;
  onOpenStudentDetail: (studentId: string) => void;
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  teachers,
  classes: propClasses,
  records,
  ummiRecords,
  targets,
  currentUser: propCurrentUser,
  onOpenDailyInput,
  onOpenStudentDetail,
  onNavigate
}) => {
  const classesList = React.useMemo(
    () => (propClasses && propClasses.length > 0 ? propClasses : storageService.getClasses()),
    [propClasses]
  );
  const activeUser = React.useMemo(
    () => propCurrentUser || storageService.getCurrentUser(),
    [propCurrentUser]
  );

  const currentTeacher = React.useMemo(
    () => resolveCurrentTeacher(activeUser, teachers),
    [activeUser, teachers]
  );

  // Scoped students for the current user (wali -> child, guru -> halaqah students, admin -> all students)
  const userScopedStudents = React.useMemo(() => {
    if (!activeUser) return students;
    if (activeUser.role === 'wali') {
      const byId = students.filter(s => s.id === activeUser.studentId);
      if (byId.length > 0) return byId;
      const byParent = students.filter(
        s =>
          (s.parentName || '').toLowerCase() === (activeUser.name || '').toLowerCase() ||
          (s.parentEmail && s.parentEmail.toLowerCase() === (activeUser.email || '').toLowerCase())
      );
      return byParent.length > 0 ? byParent : students.slice(0, 1);
    }
    if (activeUser.role === 'guru' && currentTeacher) {
      const byTeacher = students.filter(s => s.teacherId === currentTeacher.id);
      if (byTeacher.length > 0) return byTeacher;
    }
    return students;
  }, [activeUser, students, currentTeacher]);

  const [selectedTargetStudentId, setSelectedTargetStudentId] = React.useState<string>('user-default');

  // Compute 'Target Capaian Hafalan' summary for the current user
  const userTargetSummary = React.useMemo(() => {
    const targetList =
      selectedTargetStudentId !== 'user-default'
        ? students.filter(s => s.id === selectedTargetStudentId)
        : userScopedStudents.length > 0
        ? userScopedStudents
        : students;

    const totalAchievedJuz = Number(
      targetList.reduce((sum, s) => sum + (Number(s.totalJuzHafal) || 0), 0).toFixed(2)
    );
    const totalTargetJuz = Number(
      targetList.reduce((sum, s) => sum + Math.max(0.5, Number(s.targetJuz) || 1), 0).toFixed(2)
    );
    const rawPercent = totalTargetJuz > 0 ? Math.round((totalAchievedJuz / totalTargetJuz) * 100) : 0;
    const completedPercentage = Math.min(100, Math.max(0, rawPercent));
    const remainingPercentage = Math.max(0, 100 - completedPercentage);
    const remainingJuz = Number(Math.max(0, totalTargetJuz - totalAchievedJuz).toFixed(2));

    const studentsMeetingTarget = targetList.filter(s => {
      const tJuz = Math.max(0.5, Number(s.targetJuz) || 1);
      const pct = Math.round(((Number(s.totalJuzHafal) || 0) / tJuz) * 100);
      return pct >= 70;
    }).length;

    const singleStudent = targetList.length === 1 ? targetList[0] : null;

    const scopeLabel = singleStudent
      ? `Santri: ${singleStudent.name}`
      : activeUser?.role === 'guru' && currentTeacher
      ? `Halaqah ${currentTeacher.name} (${targetList.length} Santri)`
      : `Target Kumulatif ${activeUser?.name || 'Koordinator'} (${targetList.length} Santri)`;

    const statusBadge =
      completedPercentage >= 70
        ? { label: 'Sesuai Target (On-Track)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
        : completedPercentage >= 45
        ? { label: 'Progres Berjalan', color: 'bg-amber-50 text-amber-800 border-amber-200' }
        : { label: 'Perlu Akselerasi', color: 'bg-rose-50 text-rose-700 border-rose-200' };

    return {
      totalAchievedJuz,
      totalTargetJuz,
      completedPercentage,
      remainingPercentage,
      remainingJuz,
      studentsMeetingTarget,
      totalCount: targetList.length,
      singleStudent,
      scopeLabel,
      statusBadge
    };
  }, [selectedTargetStudentId, students, userScopedStudents, activeUser, currentTeacher]);
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

  // =========================================================================
  // ANALISIS & GRAFIK KETERAPAIAN TARGET HAFALAN & UMMI PER JENJANG & PER KELAS
  // =========================================================================
  const [targetJenjangFilter, setTargetJenjangFilter] = React.useState<'all' | '7' | '8' | '9'>('all');
  const [targetClassFilter, setTargetClassFilter] = React.useState<string>('all');
  const [targetMetricType, setTargetMetricType] = React.useState<'both' | 'tahfizh' | 'ummi'>('both');

  // Helper to extract Jenjang ('7' | '8' | '9')
  const getStudentJenjang = React.useCallback((std: Student): '7' | '8' | '9' => {
    const cls = classesList.find(c => c.id === std.classId);
    const clsName = cls?.name || '';
    if (clsName.includes('7') || clsName.startsWith('VII')) return '7';
    if (clsName.includes('8') || clsName.startsWith('VIII')) return '8';
    if (clsName.includes('9') || clsName.startsWith('IX')) return '9';
    return '7';
  }, [classesList]);

  // Available classes filtered by selected Jenjang
  const availableClassesForJenjang = React.useMemo(() => {
    if (targetJenjangFilter === 'all') return classesList;
    return classesList.filter(c => {
      const name = c.name;
      if (targetJenjangFilter === '7') return name.includes('7') || name.startsWith('VII');
      if (targetJenjangFilter === '8') return name.includes('8') || name.startsWith('VIII');
      if (targetJenjangFilter === '9') return name.includes('9') || name.startsWith('IX');
      return false;
    });
  }, [classesList, targetJenjangFilter]);

  // Compute student target statistics for the active scope
  const targetScopeStudents = React.useMemo(() => {
    return students.filter(s => {
      const j = getStudentJenjang(s);
      const matchJenjang = targetJenjangFilter === 'all' || j === targetJenjangFilter;
      const matchClass = targetClassFilter === 'all' || s.classId === targetClassFilter;
      return matchJenjang && matchClass;
    });
  }, [students, targetJenjangFilter, targetClassFilter, getStudentJenjang]);

  // Compute stats per Jenjang or per Class for the Chart
  const targetBarChartData = React.useMemo(() => {
    // If specific class chosen: show students in that class
    if (targetClassFilter !== 'all') {
      const targetCls = classesList.find(c => c.id === targetClassFilter);
      const clsStudents = students.filter(s => s.classId === targetClassFilter);
      return clsStudents.map(std => {
        const isGr89 = isGrade8or9Student(std, classesList);
        const tJuz = Math.max(0.5, Number(std.targetJuz) || 1);
        const hJuz = Number(std.totalJuzHafal) || 0;
        const pctTahfizh = Math.min(100, Math.round((hJuz / tJuz) * 100));

        let pctUmmi = 100;
        if (!isGr89) {
          const jilidNum = std.currentUmmiJilid?.includes('1') ? 25 :
                           std.currentUmmiJilid?.includes('2') ? 50 :
                           std.currentUmmiJilid?.includes('3') ? 75 :
                           std.currentUmmiJilid?.includes('Qur') ? 90 : 80;
          pctUmmi = Math.min(100, jilidNum);
        }

        return {
          name: std.name.split(' ').slice(0, 2).join(' '),
          fullName: std.name,
          kelas: targetCls?.name || '-',
          tahfizhPct: pctTahfizh,
          ummiPct: isGr89 ? 0 : pctUmmi,
          isGrade89: isGr89,
          tuntas: pctTahfizh >= 70,
          capaianJuz: hJuz,
          targetJuz: tJuz
        };
      });
    }

    // If Jenjang filter chosen (e.g. '7', '8', or '9'): show all classes within that jenjang
    if (targetJenjangFilter !== 'all') {
      const classesInJenjang = availableClassesForJenjang;
      return classesInJenjang.map(cls => {
        const stdsInCls = students.filter(s => s.classId === cls.id);
        const count = stdsInCls.length;
        if (count === 0) {
          return {
            name: cls.name,
            fullName: `Kelas ${cls.name}`,
            kelas: cls.name,
            tahfizhPct: 0,
            ummiPct: 0,
            isGrade89: targetJenjangFilter !== '7',
            totalSantri: 0,
            santriTuntas: 0,
            avgJuz: 0
          };
        }

        const avgTahfizhPct = Math.round(
          stdsInCls.reduce((sum, s) => {
            const tJuz = Math.max(0.5, Number(s.targetJuz) || 1);
            const hJuz = Number(s.totalJuzHafal) || 0;
            return sum + Math.min(100, Math.round((hJuz / tJuz) * 100));
          }, 0) / count
        );

        const isGr89 = targetJenjangFilter !== '7';
        let avgUmmiPct = 0;
        if (!isGr89) {
          avgUmmiPct = Math.round(
            stdsInCls.reduce((sum, s) => {
              const jNum = s.currentUmmiJilid?.includes('1') ? 25 :
                           s.currentUmmiJilid?.includes('2') ? 50 :
                           s.currentUmmiJilid?.includes('3') ? 75 :
                           s.currentUmmiJilid?.includes('Qur') ? 90 : 80;
              return sum + jNum;
            }, 0) / count
          );
        }

        const santriTuntas = stdsInCls.filter(s => {
          const tJuz = Math.max(0.5, Number(s.targetJuz) || 1);
          const hJuz = Number(s.totalJuzHafal) || 0;
          return (hJuz / tJuz) >= 0.7;
        }).length;

        const totalJuz = Number(stdsInCls.reduce((sum, s) => sum + (Number(s.totalJuzHafal) || 0), 0).toFixed(1));

        return {
          name: cls.name,
          fullName: `Kelas ${cls.name}`,
          kelas: cls.name,
          tahfizhPct: avgTahfizhPct,
          ummiPct: isGr89 ? 0 : avgUmmiPct,
          isGrade89: isGr89,
          totalSantri: count,
          santriTuntas,
          avgJuz: Number((totalJuz / count).toFixed(2))
        };
      });
    }

    // Default (Semua Jenjang): Compare Kelas 7, Kelas 8, Kelas 9
    const jenjangs: Array<{ key: '7' | '8' | '9'; label: string }> = [
      { key: '7', label: 'Kelas 7' },
      { key: '8', label: 'Kelas 8' },
      { key: '9', label: 'Kelas 9' },
    ];

    return jenjangs.map(j => {
      const stds = students.filter(s => getStudentJenjang(s) === j.key);
      const count = stds.length || 1;
      const isGr89 = j.key !== '7';

      const avgTahfizhPct = Math.round(
        stds.reduce((sum, s) => {
          const tJuz = Math.max(0.5, Number(s.targetJuz) || 1);
          const hJuz = Number(s.totalJuzHafal) || 0;
          return sum + Math.min(100, Math.round((hJuz / tJuz) * 100));
        }, 0) / count
      );

      let avgUmmiPct = 0;
      if (!isGr89) {
        avgUmmiPct = Math.round(
          stds.reduce((sum, s) => {
            const jNum = s.currentUmmiJilid?.includes('1') ? 25 :
                         s.currentUmmiJilid?.includes('2') ? 50 :
                         s.currentUmmiJilid?.includes('3') ? 75 :
                         s.currentUmmiJilid?.includes('Qur') ? 90 : 80;
            return sum + jNum;
          }, 0) / count
        );
      }

      const santriTuntas = stds.filter(s => {
        const tJuz = Math.max(0.5, Number(s.targetJuz) || 1);
        const hJuz = Number(s.totalJuzHafal) || 0;
        return (hJuz / tJuz) >= 0.7;
      }).length;

      return {
        name: j.label,
        fullName: j.label,
        kelas: j.label,
        tahfizhPct: avgTahfizhPct,
        ummiPct: isGr89 ? 0 : avgUmmiPct,
        isGrade89: isGr89,
        totalSantri: stds.length,
        santriTuntas,
        tuntasPct: Math.round((santriTuntas / count) * 100)
      };
    });
  }, [
    targetClassFilter,
    targetJenjangFilter,
    classesList,
    students,
    availableClassesForJenjang,
    getStudentJenjang
  ]);

  // Summary Metrics for the currently selected scope
  const targetScopeMetrics = React.useMemo(() => {
    const list = targetScopeStudents.length > 0 ? targetScopeStudents : students;
    const count = list.length;
    const totalAchievedJuz = Number(list.reduce((sum, s) => sum + (Number(s.totalJuzHafal) || 0), 0).toFixed(1));
    const totalTargetJuz = Number(list.reduce((sum, s) => sum + Math.max(0.5, Number(s.targetJuz) || 1), 0).toFixed(1));
    const avgTahfizhPct = count > 0 ? Math.round((totalAchievedJuz / (totalTargetJuz || 1)) * 100) : 0;
    
    const tuntasCount = list.filter(s => {
      const tJuz = Math.max(0.5, Number(s.targetJuz) || 1);
      const hJuz = Number(s.totalJuzHafal) || 0;
      return (hJuz / tJuz) >= 0.7;
    }).length;
    const belumTuntasCount = Math.max(0, count - tuntasCount);

    const grade7List = list.filter(s => getStudentJenjang(s) === '7');
    const avgUmmiPct = grade7List.length > 0
      ? Math.round(
          grade7List.reduce((sum, s) => {
            const jNum = s.currentUmmiJilid?.includes('1') ? 25 :
                         s.currentUmmiJilid?.includes('2') ? 50 :
                         s.currentUmmiJilid?.includes('3') ? 75 :
                         s.currentUmmiJilid?.includes('Qur') ? 90 : 80;
            return sum + jNum;
          }, 0) / grade7List.length
        )
      : null;

    return {
      count,
      totalAchievedJuz,
      totalTargetJuz,
      avgTahfizhPct,
      tuntasCount,
      belumTuntasCount,
      tuntasRatioPct: count > 0 ? Math.round((tuntasCount / count) * 100) : 0,
      avgUmmiPct,
      grade7Count: grade7List.length
    };
  }, [targetScopeStudents, students, getStudentJenjang]);

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

        <div className="flex flex-wrap items-center gap-2.5">
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

      {/* 4 Geometric Balance Stat Cards with 3D Floating Tilt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 perspective-container">
        
        {/* Metric 1: Total Siswa - Gold Accent */}
        <Card3D 
          onClick={() => onNavigate('students')}
          className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-[#D4AF37] cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Siswa</span>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Aktif</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-800">{totalStudents}</span>
            <span className="text-[11px] text-slate-400">3 Kelas Rombel</span>
          </div>
        </Card3D>

        {/* Metric 2: Hafalan Hari Ini - Blue Accent */}
        <Card3D 
          onClick={onOpenDailyInput}
          className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-blue-600 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Hafalan Hari Ini</span>
            <span className="text-xs text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">Hari Ini</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-800">{todayRecords.length + 3}</span>
            <span className="text-[11px] text-slate-400">Setoran &amp; Murojaah</span>
          </div>
        </Card3D>

        {/* Metric 3: Rata-Rata Nilai - Emerald Accent */}
        <Card3D 
          onClick={() => onNavigate('scores')}
          className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Rata-rata Nilai</span>
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Sangat Baik</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-800">{avgOverallScore}</span>
            <span className="text-[11px] text-slate-400">Rubrik 6 Tajwid</span>
          </div>
        </Card3D>

        {/* Metric 4: Perlu Pembinaan - Orange Accent */}
        <Card3D 
          onClick={() => onNavigate('scores')}
          className="bg-white p-4 rounded-xl border border-slate-200 border-l-4 border-l-orange-500 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Perlu Pembinaan</span>
            <span className="text-xs text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded">Perhatian</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-800">{studentsNeedHelp}</span>
            <span className="text-[11px] text-orange-600 font-medium">Penguatan Tajwid</span>
          </div>
        </Card3D>

      </div>

      {/* Featured Summary Card: Target Capaian Hafalan (Current User) */}
      <Card3D 
        className="bg-white rounded-xl border border-slate-200 p-5 relative"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 text-[#8C7015] border border-[#D4AF37]/40 text-[11px] font-extrabold uppercase tracking-wider">
                <Target className="w-3.5 h-3.5 text-[#D4AF37]" />
                Target Capaian Hafalan
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${userTargetSummary.statusBadge.color}`}>
                {userTargetSummary.statusBadge.label}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                • {userTargetSummary.scopeLabel}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3 pt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {userTargetSummary.completedPercentage}%
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Tercapai dari Target (100%)
                </span>
              </div>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <div className="text-xs font-bold text-slate-700">
                Capaian Saat Ini:{' '}
                <span className="text-[#8C7015] font-extrabold">
                  {userTargetSummary.totalAchievedJuz} Juz
                </span>{' '}
                dari Target{' '}
                <span className="text-slate-900 font-extrabold">
                  {userTargetSummary.totalTargetJuz} Juz
                </span>{' '}
                <span className="text-slate-500 font-normal">
                  (Sisa {userTargetSummary.remainingJuz} Juz / {userTargetSummary.remainingPercentage}%)
                </span>
              </div>
            </div>

            {/* Progress Bar Comparing Completed vs Target */}
            <div className="pt-2 max-w-3xl space-y-1.5">
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1E293B] via-[#8C7015] to-[#D4AF37] transition-all duration-500"
                  style={{ width: `${userTargetSummary.completedPercentage}%` }}
                />
                {/* 70% On-Track Benchmark Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-emerald-600/70"
                  style={{ left: '70%' }}
                  title="Batas Minimal Sesuai Target (70%)"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                <span>0% (Awal)</span>
                <span className="text-emerald-700 font-bold">Target Minimal On-Track: 70%</span>
                <span className="text-slate-800 font-bold">
                  Target Penuh: 100% ({userTargetSummary.totalTargetJuz} Juz)
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls & Quick Metrics */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-2.5 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
            {activeUser?.role !== 'wali' && (
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                  Fokus Target:
                </label>
                <select
                  value={selectedTargetStudentId}
                  onChange={e => setSelectedTargetStudentId(e.target.value)}
                  className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  <option value="user-default">
                    {activeUser?.role === 'guru' && currentTeacher
                      ? `Halaqah Saya (${userScopedStudents.length} Santri)`
                      : `Semua Santri (${students.length} Santri)`}
                  </option>
                  {userScopedStudents.map(std => (
                    <option key={std.id} value={std.id}>
                      {std.name} ({std.totalJuzHafal}/{std.targetJuz} Juz)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  {userTargetSummary.singleStudent ? 'Hafalan Terakhir' : 'Santri On-Target'}
                </span>
                <span className="text-xs font-extrabold text-slate-800">
                  {userTargetSummary.singleStudent
                    ? userTargetSummary.singleStudent.lastHafalan || 'Belum ada'
                    : `${userTargetSummary.studentsMeetingTarget} dari ${userTargetSummary.totalCount} Santri`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('targets')}
                className="btn-3d px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Detail Target</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#D4AF37]" />
              </button>
            </div>
          </div>
        </div>
      </Card3D>

      {/* Dark Highlight Summary Card + Quick Action Highlights with 3D Perspective */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 perspective-container">
        
        {/* Dark Summary / Target Card */}
        <Card3D 
          className="lg:col-span-2 bg-[#1E293B] text-white rounded-xl p-6 relative flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3" />
                Target Tahfizh Semester Ganjil 2026/2027
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Ringkasan Capaian &amp; Akselerasi Santri
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
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Hafalan Tertinggi</p>
              <p className="text-sm font-bold text-[#D4AF37] mt-0.5">Juz 30 Selesai</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Aisyah Zahra (92)</p>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/80">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Ummi Tertinggi</p>
              <p className="text-sm font-bold text-white mt-0.5">Al-Qur'an / Ghorib</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Muhammad Fatih (88)</p>
            </div>
            <div 
              onClick={() => onNavigate('teachers')}
              className="bg-slate-800/80 hover:bg-slate-700/80 transition p-3 rounded-lg border border-slate-700/80 cursor-pointer"
              title="Lihat Data Guru & Kelas"
            >
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Pengajar</p>
              <p className="text-sm font-bold text-white mt-0.5">{totalTeachers} Asatidz</p>
              <p className="text-[10px] text-[#D4AF37] mt-0.5 font-medium">Lihat Guru &amp; Kelas →</p>
            </div>
          </div>
        </Card3D>

        {/* Quick Highlights / Shortcuts */}
        <div className="space-y-2 flex flex-col justify-between">
          <Card3D 
            onClick={() => onNavigate('hafalan')}
            className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-2.5 rounded-xl cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <BookOpen className="w-4 h-4 text-[#1E293B]" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Riwayat Hafalan Qur'an</p>
                <p className="text-[10px] text-slate-500">Log mutaba'ah &amp; evaluasi tajwid</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Card3D>

          <Card3D 
            onClick={() => onNavigate('ummi')}
            className="bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <BookMarked className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Pembelajaran Ummi</p>
                <p className="text-[10px] text-slate-500">Munaqasyah Jilid 1–3 Dewasa</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Card3D>

          <Card3D 
            onClick={() => onNavigate('matrikulasi')}
            className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-xl cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1E293B] text-[#D4AF37] flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-900">Matrikulasi Iqro (Kls 8 &amp; 9)</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">Sel-Rab-Kam</span>
                </div>
                <p className="text-[10px] text-slate-600">Bimbingan khusus &amp; laporan non-raport</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-700" />
          </Card3D>

          <Card3D 
            onClick={() => onNavigate('targets')}
            className="bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Target &amp; Capaian</p>
                <p className="text-[10px] text-slate-500">Monitoring target semester</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </Card3D>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* GRAFIK & ANALISIS KETERCAPAIAN TARGET HAFALAN & UMMI PER JENJANG & KELAS   */}
      {/* ========================================================================= */}
      <div className="floating-3d-panel bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
        {/* Header & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 text-[#8C7015] border border-[#D4AF37]/40 text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
              <School className="w-3.5 h-3.5 text-[#D4AF37]" />
              Monitoring Target Rombel & Jenjang
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Grafik Ketercapaian Target Hafalan & Ummi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluasi target hafalan Qur'an dan pembelajaran Ummi dibedakan per jenjang (Kelas 7, 8, 9) dan per rombel kelas
            </p>
          </div>

          {/* Interactive Filters: Jenjang, Kelas, and Metrik */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Filter Jenjang Pills */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setTargetJenjangFilter('all');
                  setTargetClassFilter('all');
                }}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  targetJenjangFilter === 'all'
                    ? 'bg-[#1E293B] text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Semua Jenjang
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetJenjangFilter('7');
                  setTargetClassFilter('all');
                }}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  targetJenjangFilter === '7'
                    ? 'bg-[#1E293B] text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Kelas 7
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetJenjangFilter('8');
                  setTargetClassFilter('all');
                }}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  targetJenjangFilter === '8'
                    ? 'bg-[#1E293B] text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Kelas 8
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetJenjangFilter('9');
                  setTargetClassFilter('all');
                }}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  targetJenjangFilter === '9'
                    ? 'bg-[#1E293B] text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                Kelas 9
              </button>
            </div>

            {/* Filter Kelas Dropdown */}
            <div className="relative">
              <select
                value={targetClassFilter}
                onChange={(e) => setTargetClassFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 pr-7 focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="all">
                  {targetJenjangFilter === 'all' ? 'Semua Kelas Rombel' : `Semua Kelas ${targetJenjangFilter}`}
                </option>
                {availableClassesForJenjang.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    Kelas {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Metrik */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTargetMetricType('both')}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  targetMetricType === 'both'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilkan perbandingan Tahfizh & Ummi"
              >
                Tahfizh & Ummi
              </button>
              <button
                type="button"
                onClick={() => setTargetMetricType('tahfizh')}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  targetMetricType === 'tahfizh'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Hanya target Tahfizh Qur'an"
              >
                Tahfizh Saja
              </button>
              <button
                type="button"
                onClick={() => setTargetMetricType('ummi')}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  targetMetricType === 'ummi'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Hanya target Metode Ummi"
              >
                Ummi Saja
              </button>
            </div>
          </div>
        </div>

        {/* Scope KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Santri Lingkup</span>
            <span className="text-xl font-black text-slate-800">{targetScopeMetrics.count}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {targetClassFilter !== 'all'
                ? `Kelas ${classesList.find(c => c.id === targetClassFilter)?.name || ''}`
                : targetJenjangFilter !== 'all'
                ? `Jenjang Kelas ${targetJenjangFilter}`
                : 'Seluruh Rombel 7, 8, 9'}
            </span>
          </div>

          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-[#8C7015] block">Rata-rata Capaian Tahfizh</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">{targetScopeMetrics.avgTahfizhPct}%</span>
              <span className="text-[11px] font-bold text-[#8C7015]">
                ({targetScopeMetrics.totalAchievedJuz}/{targetScopeMetrics.totalTargetJuz} Juz)
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">Target semester berjalan</span>
          </div>

          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200">
            <span className="text-[10px] uppercase font-bold text-blue-700 block">Capaian Metode Ummi</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">
                {targetJenjangFilter === '8' || targetJenjangFilter === '9' ? '-' : `${targetScopeMetrics.avgUmmiPct ?? 78}%`}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {targetJenjangFilter === '8' || targetJenjangFilter === '9'
                  ? 'Diganti Ibadah Harian'
                  : 'Fokus Kelas 7'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {targetJenjangFilter === '8' || targetJenjangFilter === '9'
                ? 'Tidak ada Ummi di Kls 8 & 9'
                : `${targetScopeMetrics.grade7Count} Santri Kls 7`}
            </span>
          </div>

          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Ketuntasan Target</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-800">{targetScopeMetrics.tuntasRatioPct}%</span>
              <span className="text-[10px] font-bold text-slate-600">
                ({targetScopeMetrics.tuntasCount} Tuntas)
              </span>
            </div>
            <span className="text-[10px] text-rose-600 font-medium block mt-0.5">
              {targetScopeMetrics.belumTuntasCount} Santri Belum Tuntas
            </span>
          </div>
        </div>

        {/* Visual Chart Container */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between text-xs gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#D4AF37]" />
              {targetClassFilter !== 'all'
                ? `Ketercapaian Santri Kelas ${classesList.find(c => c.id === targetClassFilter)?.name || ''}`
                : targetJenjangFilter !== 'all'
                ? `Perbandingan Ketercapaian Kelas di Jenjang ${targetJenjangFilter}`
                : 'Perbandingan Ketercapaian Antar Jenjang (Kelas 7, 8, 9)'}
            </span>

            <div className="flex items-center gap-3">
              {(targetMetricType === 'both' || targetMetricType === 'tahfizh') && (
                <span className="flex items-center gap-1.5 font-bold text-slate-700">
                  <span className="w-3 h-3 rounded bg-[#D4AF37]" />
                  Tahfizh Qur'an (%)
                </span>
              )}
              {(targetMetricType === 'both' || targetMetricType === 'ummi') && targetJenjangFilter !== '8' && targetJenjangFilter !== '9' && (
                <span className="flex items-center gap-1.5 font-bold text-slate-700">
                  <span className="w-3 h-3 rounded bg-[#2563eb]" />
                  Metode Ummi (%)
                </span>
              )}
              <span className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                <span className="w-3 h-0.5 bg-emerald-500" />
                Target Minimal (70%)
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full bg-slate-50/50 rounded-xl p-2 border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={targetBarChartData}
                margin={{ top: 15, right: 15, left: -15, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  interval={0}
                  angle={targetClassFilter !== 'all' ? -25 : 0}
                  textAnchor={targetClassFilter !== 'all' ? 'end' : 'middle'}
                />
                <YAxis 
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 70, 100]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  unit="%"
                />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val}%`, name]}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#1E293B] text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1.5 min-w-[190px]">
                          <p className="font-extrabold text-[#D4AF37] border-b border-slate-700 pb-1">
                            {data.fullName || label}
                          </p>
                          <div className="flex justify-between items-center gap-3">
                            <span className="text-slate-300">Capaian Tahfizh:</span>
                            <span className="font-bold text-amber-300">{data.tahfizhPct}%</span>
                          </div>
                          {!data.isGrade89 && (
                            <div className="flex justify-between items-center gap-3">
                              <span className="text-slate-300">Capaian Ummi:</span>
                              <span className="font-bold text-blue-300">{data.ummiPct}%</span>
                            </div>
                          )}
                          {data.totalSantri !== undefined && (
                            <div className="flex justify-between items-center gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-700">
                              <span>Santri Tuntas:</span>
                              <span className="font-semibold text-emerald-400">
                                {data.santriTuntas} dari {data.totalSantri} Santri
                              </span>
                            </div>
                          )}
                          {data.targetJuz !== undefined && (
                            <div className="flex justify-between items-center gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-700">
                              <span>Juz Hafal / Target:</span>
                              <span className="font-semibold text-white">
                                {data.capaianJuz} / {data.targetJuz} Juz
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {(targetMetricType === 'both' || targetMetricType === 'tahfizh') && (
                  <Bar
                    dataKey="tahfizhPct"
                    name="Tahfizh Qur'an"
                    fill="#D4AF37"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                )}
                {(targetMetricType === 'both' || targetMetricType === 'ummi') && (
                  <Bar
                    dataKey="ummiPct"
                    name="Metode Ummi"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
            <span className="flex items-center gap-1 font-medium">
              💡 <span className="font-bold text-slate-700">Kebijakan Kurikulum:</span> Kelas 8 & 9 fokus penguatan Tahfizh & Praktik Ibadah Harian (tanpa pembelajaran metode Ummi).
            </span>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="font-bold text-[#8C7015] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Buka Leger Raport Kelas Lengkap →
            </button>
          </div>
        </div>
      </div>

      {/* 3 Geometric Charts Grid with 3D Depth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 perspective-container">
        
        {/* Chart 1: Perkembangan Hafalan Bulanan (2 Cols) */}
        <Card3D 
          className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200"
        >
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
        </Card3D>

        {/* Chart 2: Capaian Target Siswa */}
        <Card3D 
          className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between"
        >
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
        </Card3D>

      </div>

      {/* Chart 3 & Recent Activity Stream with 3D Depth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 perspective-container">
        
        {/* Chart 3: Distribusi Kategori Nilai */}
        <Card3D 
          className="bg-white p-5 rounded-xl border border-slate-200"
        >
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            Distribusi Nilai &amp; Rubrik
          </h3>
          <p className="text-xs text-slate-500 mb-2">
            Klasifikasi hasil evaluasi setoran tajwid &amp; kelancaran
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
        </Card3D>

        {/* Live Recent Setoran Stream */}
        <Card3D 
          className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between"
        >
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
                      <AvatarBadge
                        name={std?.name || 'Santri'}
                        photoUrl={std?.photo}
                        gender={std?.gender}
                        role="santri"
                        size="sm"
                        className="shrink-0"
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
        </Card3D>

      </div>

    </div>
  );
};

