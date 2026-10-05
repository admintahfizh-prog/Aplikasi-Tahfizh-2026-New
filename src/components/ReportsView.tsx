import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Filter, 
  Search, 
  BookOpen, 
  BookMarked, 
  Award, 
  CheckCircle2, 
  Calendar,
  Layers,
  Sparkles,
  UserCheck,
  FileCheck2,
  Check,
  X,
  TrendingUp,
  BarChart3,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Student, Teacher, ClassItem, MemorizationRecord, UmmiRecord, AppSettings, Role, User, TermName, TargetProgress } from '../types';
import { storageService } from '../services/storageService';
import { StudentRaportCard } from './StudentRaportCard';
import { MonthlyHafalanRecapModal } from './MonthlyHafalanRecapModal';
import { isGrade8or9Student, isClass7Bto7E, resolveRaportTargetHafalan } from '../utils/gradeHelper';
import { getGradeFromScore } from '../utils/gradeConversion';
import { getStudentStandardTermTarget, evaluateUmmiTerm, TERM_DEFINITIONS } from '../data/targetTermData';

interface ReportsViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassItem[];
  records: MemorizationRecord[];
  ummiRecords: UmmiRecord[];
  settings: AppSettings;
  userRole?: Role;
  currentUser?: User | null;
  onOpenStudentDetail: (studentId: string) => void;
  onRefreshData?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  teachers,
  classes,
  records,
  ummiRecords,
  settings,
  userRole,
  currentUser,
  onOpenStudentDetail,
  onRefreshData
}) => {
  const isWali = userRole === 'wali';
  const [reportType, setReportType] = useState<'raport_individu' | 'rekap_bulanan' | 'hafalan' | 'ummi' | 'rekap_nilai' | 'raport_kelas'>('raport_individu');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedUmmiTerm, setSelectedUmmiTerm] = useState<TermName>('Term 1');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'class-asc' | 'class-desc' | 'name-asc' | 'score-desc' | 'juz-desc'>('class-asc');
  const [selectedIndividualStudentId, setSelectedIndividualStudentId] = useState<string>(students[0]?.id || '');
  const [chartViewMode, setChartViewMode] = useState<'area_ayat' | 'bar_setoran' | 'line_kualitas'>('area_ayat');
  const [selectedChartStudentId, setSelectedChartStudentId] = useState<string>('all');
  const [showTrendChart, setShowTrendChart] = useState<boolean>(true);

  const allTargets = React.useMemo(() => storageService.getTargets(), [students, ummiRecords, records]);

  const getStudentUmmiTargetInfo = (std: Student, termKey: TermName = selectedUmmiTerm) => {
    const storedTarget = allTargets.find(t =>
      t.studentId === std.id &&
      (t.category === 'Ummi' || Boolean(t.targetUmmiJilid)) &&
      (t.term === termKey || (!t.term && termKey === 'Term 1') || (t.period && t.period.includes(termKey)))
    );
    const standard = getStudentStandardTermTarget(std, termKey, 'Ummi');
    const curJilid = std.currentUmmiJilid && std.currentUmmiJilid !== '-' ? std.currentUmmiJilid : 'Jilid 1';
    const curPage = std.currentUmmiPage || 1;
    const isOldAutoJilid3 = termKey === 'Term 1' && curJilid === 'Jilid 3' && storedTarget?.targetUmmiJilid === 'Al-Qur\'an' && (storedTarget?.notes || '').startsWith('Target Term 1: Pemantapan tilawah');
    const targetJilid = (isOldAutoJilid3 ? standard.targetJilid : storedTarget?.targetUmmiJilid) || standard.targetJilid || 'Jilid 1';
    const targetPage = (isOldAutoJilid3 ? standard.targetPage : storedTarget?.targetUmmiPage) || standard.targetPage || 40;
    const evalRes = evaluateUmmiTerm(curJilid, curPage, targetJilid, targetPage);

    return {
      targetJilid,
      targetPage,
      curJilid,
      curPage,
      percentage: evalRes.percentage,
      status: evalRes.status,
      summary: evalRes.summary
    };
  };

  const yusrieTeacher = teachers.find(t => (t.name || '').toLowerCase().includes('yusrie'));
  const coordinatorName = (settings.tahfizhCoordinator && !settings.tahfizhCoordinator.toLowerCase().includes('fauzan') && !settings.tahfizhCoordinator.toLowerCase().includes('sekar'))
    ? settings.tahfizhCoordinator
    : (yusrieTeacher?.name || 'Ustadz Muhammad Yusrie Alfian, S.Ag.');
  const coordinatorNik = (settings.tahfizhCoordinatorNik && settings.tahfizhCoordinatorNik !== '02.0367')
    ? settings.tahfizhCoordinatorNik
    : (yusrieTeacher?.nip || '04.0413');
  const headmasterName = settings.headmasterName || settings.principalName || 'Muh Saifuddin,S.Si';
  const headmasterNik = settings.headmasterNik || '01.0125';

  // If user is wali, always lock to raport_individu
  React.useEffect(() => {
    if (isWali && reportType !== 'raport_individu') {
      setReportType('raport_individu');
    }
  }, [isWali, reportType]);

  // Keep selectedIndividualStudentId updated
  React.useEffect(() => {
    if (students.length > 0 && (!selectedIndividualStudentId || !students.some(s => s.id === selectedIndividualStudentId))) {
      setSelectedIndividualStudentId(students[0].id);
    }
  }, [students, selectedIndividualStudentId]);

  const filteredStudents = students.filter(s => {
    const matchClass = !selectedClass || s.classId === selectedClass;
    const matchTeacher = !selectedTeacher || s.teacherId === selectedTeacher;
    const matchSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.nis || '').includes(searchTerm);
    return matchClass && matchTeacher && matchSearch;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const clsA = classes.find(c => c.id === a.classId)?.name || '';
    const clsB = classes.find(c => c.id === b.classId)?.name || '';

    if (sortBy === 'class-asc') {
      const clsCompare = clsA.localeCompare(clsB);
      if (clsCompare !== 0) return clsCompare;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'class-desc') {
      const clsCompare = clsB.localeCompare(clsA);
      if (clsCompare !== 0) return clsCompare;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'score-desc') {
      return b.avgScore - a.avgScore;
    }
    if (sortBy === 'juz-desc') {
      return b.totalJuzHafal - a.totalJuzHafal;
    }
    return 0;
  });

  const reportStudents = reportType === 'ummi'
    ? sortedStudents.filter(std => !isGrade8or9Student(std, classes))
    : sortedStudents;

  const currentIndividualStudent = students.find(s => s.id === selectedIndividualStudentId) || students[0];
  const currentStudentTeacher = teachers.find(t => t.id === currentIndividualStudent?.teacherId);
  const currentStudentClass = classes.find(c => c.id === currentIndividualStudent?.classId);

  // =========================================================================
  // DATA VISUALISASI RECHARTS: TREN PERKEMBANGAN HAFALAN BULANAN SANTRI
  // =========================================================================
  const chartTargetStudents = React.useMemo(() => {
    if (isWali && currentIndividualStudent) {
      return [currentIndividualStudent];
    }
    if (selectedChartStudentId !== 'all') {
      return filteredStudents.filter(s => s.id === selectedChartStudentId);
    }
    return filteredStudents;
  }, [isWali, currentIndividualStudent, selectedChartStudentId, filteredStudents]);

  const monthlyHafalanTrendData = React.useMemo(() => {
    const targetIds = new Set(chartTargetStudents.map(s => s.id));
    const relevantRecords = records.filter(r => targetIds.has(r.studentId));

    const monthNamesShort: Record<string, string> = {
      '01': 'Jan',
      '02': 'Feb',
      '03': 'Mar',
      '04': 'Apr',
      '05': 'Mei',
      '06': 'Jun',
      '07': 'Jul',
      '08': 'Agu',
      '09': 'Sep',
      '10': 'Okt',
      '11': 'Nov',
      '12': 'Des'
    };

    const monthNamesFull: Record<string, string> = {
      '01': 'Januari',
      '02': 'Februari',
      '03': 'Maret',
      '04': 'April',
      '05': 'Mei',
      '06': 'Juni',
      '07': 'Juli',
      '08': 'Agustus',
      '09': 'September',
      '10': 'Oktober',
      '11': 'November',
      '12': 'Desember'
    };

    // Base semester months + any month present in records or student lastHafalanDate
    const monthSet = new Set<string>([
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12'
    ]);

    relevantRecords.forEach(r => {
      if (r.date && r.date.length >= 7) {
        monthSet.add(r.date.slice(0, 7));
      }
    });

    chartTargetStudents.forEach(s => {
      if (s.lastHafalanDate && s.lastHafalanDate.length >= 7) {
        monthSet.add(s.lastHafalanDate.slice(0, 7));
      }
    });

    const sortedMonths = Array.from(monthSet).sort((a, b) => a.localeCompare(b));

    // Baseline progression weights for semester months if only summary student data exists
    const totalStudentsCount = chartTargetStudents.length;
    const totalCumulativeJuz = chartTargetStudents.reduce((acc, s) => acc + (s.totalJuzHafal || 0), 0);
    const avgStudentScore =
      totalStudentsCount > 0
        ? Math.round(chartTargetStudents.reduce((acc, s) => acc + (s.avgScore || 85), 0) / totalStudentsCount)
        : 85;

    let runningCumulativeAyat = 0;

    return sortedMonths.map((ym, idx) => {
      const [year, m] = ym.split('-');
      const monthRecs = relevantRecords.filter(r => (r.date || '').startsWith(ym));

      // Also check students whose lastHafalanDate is in this month but aren't in monthRecs
      const recordStudentIds = new Set(monthRecs.map(r => r.studentId));
      const milestoneStudents = chartTargetStudents.filter(
        s => (s.lastHafalanDate || '').startsWith(ym) && !recordStudentIds.has(s.id)
      );

      const ziyadah =
        monthRecs.filter(r => r.type === 'Hafalan Baru').length + milestoneStudents.length;
      const murojaah = monthRecs.filter(r => r.type === 'Murojaah').length;
      const tasmi = monthRecs.filter(r => r.type === "Tasmi'").length;
      const totalSetoran = ziyadah + murojaah + tasmi;

      const recAyat = monthRecs.reduce((sum, r) => sum + (r.totalAyah || 0), 0);
      const milestoneAyat = milestoneStudents.reduce(
        (sum, s) => sum + Math.min(40, Math.max(15, Math.round((s.totalAyahHafal || 60) * 0.12))),
        0
      );
      const totalAyat = recAyat + milestoneAyat;
      runningCumulativeAyat += totalAyat;

      const activeSantri = recordStudentIds.size + milestoneStudents.length;

      const avgScore =
        monthRecs.length > 0
          ? Math.round(monthRecs.reduce((sum, r) => sum + (r.finalScore || 0), 0) / monthRecs.length)
          : milestoneStudents.length > 0
          ? Math.round(
              milestoneStudents.reduce((sum, s) => sum + (s.avgScore || 85), 0) /
                milestoneStudents.length
            )
          : totalSetoran > 0
          ? avgStudentScore
          : 0;

      // Progressive cumulative Juz trajectory across the academic year
      const progressRatio = Math.min(1, (idx + 1) / Math.max(4, sortedMonths.length));
      const rataRataJuzSantri =
        totalStudentsCount > 0
          ? Number(((totalCumulativeJuz / totalStudentsCount) * progressRatio).toFixed(2))
          : 0;

      return {
        monthKey: ym,
        monthLabel: `${monthNamesShort[m] || m} ${year.slice(2)}`,
        monthFullLabel: `${monthNamesFull[m] || m} ${year}`,
        totalAyat,
        kumulatifAyat: runningCumulativeAyat,
        ziyadah,
        murojaah,
        tasmi,
        totalSetoran,
        avgScore,
        activeSantri,
        rataRataJuzSantri
      };
    });
  }, [chartTargetStudents, records]);

  const monthlyTrendKPIs = React.useMemo(() => {
    const totalAyat = monthlyHafalanTrendData.reduce((s, d) => s + d.totalAyat, 0);
    const totalSetoran = monthlyHafalanTrendData.reduce((s, d) => s + d.totalSetoran, 0);
    const totalZiyadah = monthlyHafalanTrendData.reduce((s, d) => s + d.ziyadah, 0);
    const totalMurojaah = monthlyHafalanTrendData.reduce((s, d) => s + d.murojaah, 0);
    const totalTasmi = monthlyHafalanTrendData.reduce((s, d) => s + d.tasmi, 0);
    const monthsWithScore = monthlyHafalanTrendData.filter(d => d.avgScore > 0);
    const overallAvgScore =
      monthsWithScore.length > 0
        ? Math.round(monthsWithScore.reduce((s, d) => s + d.avgScore, 0) / monthsWithScore.length)
        : chartTargetStudents.length > 0
        ? Math.round(
            chartTargetStudents.reduce((s, std) => s + (std.avgScore || 85), 0) /
              chartTargetStudents.length
          )
        : 0;

    const peakMonth = [...monthlyHafalanTrendData].sort((a, b) => b.totalAyat - a.totalAyat)[0];

    return {
      totalAyat,
      totalSetoran,
      totalZiyadah,
      totalMurojaah,
      totalTasmi,
      overallAvgScore,
      peakMonthLabel: peakMonth && peakMonth.totalAyat > 0 ? peakMonth.monthFullLabel : 'Agustus 2026',
      peakMonthAyat: peakMonth ? peakMonth.totalAyat : 0
    };
  }, [monthlyHafalanTrendData, chartTargetStudents]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportHafalanCSV = () => {
    const csv = storageService.exportHafalanToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_tahfizh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Modal & Feedback State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDataset, setExportDataset] = useState<
    'active_view' | 'rekap_hafalan' | 'rekap_ummi' | 'gabungan_lengkap' | 'log_hafalan' | 'log_ummi'
  >('gabungan_lengkap');
  const [exportClassId, setExportClassId] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Build structured rows for Rekap Hafalan Santri
  const buildRekapHafalanRows = (studentList: Student[]) => {
    return studentList.map((std, idx) => {
      const cls = classes.find(c => c.id === std.classId);
      const teacher = teachers.find(t => t.id === std.teacherId);
      const percent = Math.min(100, Math.round(((std.totalJuzHafal || 0) / (std.targetJuz || 1)) * 100));
      const targetText = isClass7Bto7E(std, classes, cls)
        ? resolveRaportTargetHafalan(std, classes, cls, 'TENGAH SEMESTER 1')
        : `${std.targetJuz} Juz`;
      const statusText =
        percent >= 70 ? 'Sesuai Target' : percent >= 40 ? 'Perlu Ditingkatkan' : 'Tertinggal';
      const predikat =
        std.avgScore >= 90 ? 'MUMTAZ' : std.avgScore >= 80 ? 'JAYYID JIDDAN' : 'JAYYID';

      return {
        No: idx + 1,
        NIS: std.nis || '-',
        NISN: std.nisn || '-',
        'Nama Lengkap Santri': std.name,
        'L/P': std.gender || 'L',
        Kelas: cls?.name || '-',
        'Guru Pembimbing': teacher?.name || '-',
        Program: std.program || 'Reguler Tahfizh',
        'Target Hafalan': targetText,
        'Target Tahunan (Juz)': std.targetJuz || 1,
        'Capaian Riil (Juz)': std.totalJuzHafal || 0,
        'Total Surah Hafal': std.totalSurahHafal || 0,
        'Total Ayat Hafal': std.totalAyahHafal || 0,
        'Persentase Capaian (%)': `${percent}%`,
        'Hafalan Terakhir': std.lastHafalan || '-',
        'Tgl Setoran Terakhir': std.lastHafalanDate || '-',
        'Nilai Rata-rata': std.avgScore || 0,
        Predikat: predikat,
        'Status Evaluasi': statusText
      };
    });
  };

  // Build structured rows for Rekap Metode Ummi
  const buildRekapUmmiRows = (studentList: Student[], termKey: TermName = selectedUmmiTerm) => {
    const ummiStudents = studentList.filter(std => !isGrade8or9Student(std, classes));
    return ummiStudents.map((std, idx) => {
      const cls = classes.find(c => c.id === std.classId);
      const teacher = teachers.find(t => t.id === std.teacherId);
      const ummiInfo = getStudentUmmiTargetInfo(std, termKey);
      const gradeLetter = std.raportUmmiNilai || getGradeFromScore(std.avgScore || 85).letter;
      const statusText =
        ummiInfo.status === 'on-track'
          ? 'Sesuai Target'
          : ummiInfo.status === 'needs-attention'
          ? 'Perlu Ditingkatkan'
          : 'Tertinggal';

      return {
        No: idx + 1,
        NIS: std.nis || '-',
        'Nama Lengkap Santri': std.name,
        'L/P': std.gender || 'L',
        Kelas: cls?.name || '-',
        'Guru Pembimbing': teacher?.name || '-',
        'Periode Evaluasi': termKey,
        'Target Jilid Ummi': ummiInfo.targetJilid,
        'Target Halaman': ummiInfo.targetPage,
        'Capaian Jilid Saat Ini': ummiInfo.curJilid,
        'Capaian Halaman Saat Ini': ummiInfo.curPage,
        'Persentase Capaian (%)': `${ummiInfo.percentage}%`,
        'Nilai Rata-rata': std.avgScore || 85,
        'Grade Ummi': `Grade ${gradeLetter}`,
        'Status Evaluasi': statusText,
        'Ringkasan Evaluasi': ummiInfo.summary || '-'
      };
    });
  };

  // Build structured rows for Log Setoran Hafalan
  const buildLogHafalanRows = (studentIdsSet: Set<string>) => {
    const filteredRecs = records.filter(r => studentIdsSet.has(r.studentId));
    return filteredRecs.map((r, idx) => {
      const std = students.find(s => s.id === r.studentId);
      const cls = classes.find(c => c.id === std?.classId);
      const tch = teachers.find(t => t.id === r.teacherId);
      return {
        No: idx + 1,
        Tanggal: r.date || '-',
        NIS: std?.nis || '-',
        'Nama Santri': std?.name || '-',
        Kelas: cls?.name || '-',
        'Guru Pengampu': tch?.name || '-',
        'Jenis Setoran': r.type || 'Hafalan Baru',
        Juz: r.juz || 30,
        Surah: r.surahName || '-',
        'Ayat Mulai': r.startAyah || 1,
        'Ayat Selesai': r.endAyah || 1,
        'Total Ayat': r.totalAyah || 1,
        'Nilai Kelancaran': r.scores?.kelancaran ?? r.finalScore ?? 0,
        'Nilai Tajwid': r.scores?.tajwid ?? r.finalScore ?? 0,
        'Nilai Makhraj': r.scores?.makhraj ?? r.finalScore ?? 0,
        'Nilai Fashahah': r.scores?.fashahah ?? r.finalScore ?? 0,
        'Nilai Adab': r.scores?.adab ?? r.finalScore ?? 0,
        'Nilai Akhir': r.finalScore ?? 0,
        Kategori: r.category || '-',
        Catatan: r.notes || '-'
      };
    });
  };

  // Build structured rows for Log Setoran Ummi
  const buildLogUmmiRows = (studentIdsSet: Set<string>) => {
    const filteredRecs = ummiRecords.filter(r => studentIdsSet.has(r.studentId));
    return filteredRecs.map((r, idx) => {
      const std = students.find(s => s.id === r.studentId);
      const cls = classes.find(c => c.id === std?.classId);
      const tch = teachers.find(t => t.id === r.teacherId);
      const gradeLetter = getGradeFromScore(r.score || 85).letter;
      return {
        No: idx + 1,
        Tanggal: r.date || '-',
        NIS: std?.nis || '-',
        'Nama Santri': std?.name || '-',
        Kelas: cls?.name || '-',
        'Guru Pengampu': tch?.name || '-',
        'Jilid Ummi': r.jilid || '-',
        Halaman: r.page || 1,
        'Materi Pokok': r.materialName || '-',
        'Nilai Angka': r.score || 0,
        'Grade Huruf': gradeLetter,
        'Status Kelulusan': r.status || 'Lulus',
        Catatan: r.notes || '-'
      };
    });
  };

  // Convert array of objects to CSV string with UTF-8 BOM
  const convertObjectsToCSV = (rows: Record<string, any>[]): string => {
    if (!rows || rows.length === 0) {
      return '\uFEFFTidak ada data untuk diekspor';
    }
    const headers = Object.keys(rows[0]);
    const csvLines = rows.map(row =>
      headers
        .map(h => {
          const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    return '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...csvLines].join('\n');
  };

  // Helper to auto-fit column widths on an XLSX worksheet
  const applyAutoColumnWidths = (ws: XLSX.WorkSheet, rows: Record<string, any>[]) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    ws['!cols'] = headers.map(h => {
      const maxCellLen = rows.reduce((max, row) => {
        const len = String(row[h] ?? '').length;
        return len > max ? len : max;
      }, h.length);
      return { wch: Math.min(42, Math.max(10, maxCellLen + 3)) };
    });
  };

  // Trigger CSV file download
  const downloadCSVFile = (rows: Record<string, any>[], filenameBase: string) => {
    const csvContent = convertObjectsToCSV(rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenameBase}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Main unified export executor (Quick buttons + Modal)
  const executeReportExport = (
    datasetType: 'active_view' | 'rekap_hafalan' | 'rekap_ummi' | 'gabungan_lengkap' | 'log_hafalan' | 'log_ummi',
    format: 'xlsx' | 'csv',
    customClassId?: string
  ) => {
    const dateStamp = new Date().toISOString().split('T')[0];
    const effectiveClassId = customClassId !== undefined ? customClassId : selectedClass;
    const classObj = classes.find(c => c.id === effectiveClassId);
    const classSlug = classObj ? `kelas_${classObj.name.toLowerCase()}` : 'semua_kelas';

    const targetStudents = sortedStudents.filter(s => !effectiveClassId || s.classId === effectiveClassId);
    const targetStudentIds = new Set(targetStudents.map(s => s.id));

    const resolvedDataset =
      datasetType === 'active_view'
        ? reportType === 'ummi'
          ? 'rekap_ummi'
          : reportType === 'hafalan'
          ? 'rekap_hafalan'
          : 'gabungan_lengkap'
        : datasetType;

    if (format === 'csv') {
      if (resolvedDataset === 'rekap_ummi') {
        const rows = buildRekapUmmiRows(targetStudents, selectedUmmiTerm);
        downloadCSVFile(rows, `rekap_metode_ummi_${selectedUmmiTerm.toLowerCase().replace(' ', '')}_${classSlug}_${dateStamp}`);
      } else if (resolvedDataset === 'log_hafalan') {
        const rows = buildLogHafalanRows(targetStudentIds);
        downloadCSVFile(rows, `riwayat_setoran_hafalan_${classSlug}_${dateStamp}`);
      } else if (resolvedDataset === 'log_ummi') {
        const rows = buildLogUmmiRows(targetStudentIds);
        downloadCSVFile(rows, `riwayat_setoran_ummi_${classSlug}_${dateStamp}`);
      } else if (resolvedDataset === 'gabungan_lengkap') {
        // Combined Hafalan + Ummi summary in a single comprehensive CSV table
        const combinedRows = targetStudents.map((std, idx) => {
          const cls = classes.find(c => c.id === std.classId);
          const teacher = teachers.find(t => t.id === std.teacherId);
          const isGrade89 = isGrade8or9Student(std, classes);
          const hflPercent = Math.min(100, Math.round(((std.totalJuzHafal || 0) / (std.targetJuz || 1)) * 100));
          const ummiInfo = !isGrade89 ? getStudentUmmiTargetInfo(std, selectedUmmiTerm) : null;
          const targetHafalan = isClass7Bto7E(std, classes, cls)
            ? resolveRaportTargetHafalan(std, classes, cls, 'TENGAH SEMESTER 1')
            : `${std.targetJuz} Juz`;

          return {
            No: idx + 1,
            NIS: std.nis || '-',
            'Nama Lengkap Santri': std.name,
            'L/P': std.gender || 'L',
            Kelas: cls?.name || '-',
            'Guru Pembimbing': teacher?.name || '-',
            Program: std.program || 'Reguler Tahfizh',
            'Target Hafalan': targetHafalan,
            'Capaian Hafalan (Juz)': std.totalJuzHafal || 0,
            '% Capaian Hafalan': `${hflPercent}%`,
            'Hafalan Terakhir': std.lastHafalan || '-',
            'Target Ummi': ummiInfo ? `${ummiInfo.targetJilid} Hal ${ummiInfo.targetPage}` : '- (Non-Ummi)',
            'Capaian Ummi Saat Ini': ummiInfo ? `${ummiInfo.curJilid} Hal ${ummiInfo.curPage}` : '- (Non-Ummi)',
            '% Capaian Ummi': ummiInfo ? `${ummiInfo.percentage}%` : '-',
            'Nilai Rata-rata': std.avgScore || 0
          };
        });
        downloadCSVFile(combinedRows, `laporan_tahfizh_dan_ummi_${classSlug}_${dateStamp}`);
      } else {
        const rows = buildRekapHafalanRows(targetStudents);
        downloadCSVFile(rows, `rekap_capaian_hafalan_${classSlug}_${dateStamp}`);
      }

      setExportFeedback(`Berhasil mengekspor laporan ke format CSV (${classObj ? `Kelas ${classObj.name}` : 'Semua Kelas'})!`);
      setTimeout(() => setExportFeedback(null), 5000);
      setShowExportModal(false);
      return;
    }

    // Format === 'xlsx' (Multi-sheet or single-sheet Excel Workbook)
    const wb = XLSX.utils.book_new();

    if (resolvedDataset === 'rekap_hafalan') {
      const hflRows = buildRekapHafalanRows(targetStudents);
      const ws = XLSX.utils.json_to_sheet(hflRows.length > 0 ? hflRows : [{ Info: 'Tidak ada data santri' }]);
      applyAutoColumnWidths(ws, hflRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap Hafalan');
      XLSX.writeFile(wb, `Rekap_Hafalan_${classSlug}_${dateStamp}.xlsx`);
    } else if (resolvedDataset === 'rekap_ummi') {
      const ummiRows = buildRekapUmmiRows(targetStudents, selectedUmmiTerm);
      const ws = XLSX.utils.json_to_sheet(ummiRows.length > 0 ? ummiRows : [{ Info: 'Tidak ada data Ummi Kelas 7' }]);
      applyAutoColumnWidths(ws, ummiRows);
      XLSX.utils.book_append_sheet(wb, ws, `Rekap Ummi ${selectedUmmiTerm}`);
      XLSX.writeFile(wb, `Rekap_Metode_Ummi_${selectedUmmiTerm.replace(' ', '_')}_${classSlug}_${dateStamp}.xlsx`);
    } else if (resolvedDataset === 'log_hafalan') {
      const logHfl = buildLogHafalanRows(targetStudentIds);
      const ws = XLSX.utils.json_to_sheet(logHfl.length > 0 ? logHfl : [{ Info: 'Belum ada riwayat setoran hafalan' }]);
      applyAutoColumnWidths(ws, logHfl);
      XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Setoran Hafalan');
      XLSX.writeFile(wb, `Riwayat_Setoran_Hafalan_${classSlug}_${dateStamp}.xlsx`);
    } else if (resolvedDataset === 'log_ummi') {
      const logUmmi = buildLogUmmiRows(targetStudentIds);
      const ws = XLSX.utils.json_to_sheet(logUmmi.length > 0 ? logUmmi : [{ Info: 'Belum ada riwayat setoran Ummi' }]);
      applyAutoColumnWidths(ws, logUmmi);
      XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Setoran Ummi');
      XLSX.writeFile(wb, `Riwayat_Setoran_Ummi_${classSlug}_${dateStamp}.xlsx`);
    } else {
      // Multi-sheet Workbook: Sheet 1 Rekap Hafalan, Sheet 2 Rekap Ummi, Sheet 3 Log Setoran Hafalan, Sheet 4 Log Setoran Ummi
      const hflRows = buildRekapHafalanRows(targetStudents);
      const wsHfl = XLSX.utils.json_to_sheet(hflRows.length > 0 ? hflRows : [{ Info: 'Tidak ada data santri' }]);
      applyAutoColumnWidths(wsHfl, hflRows);
      XLSX.utils.book_append_sheet(wb, wsHfl, 'Rekap Hafalan Santri');

      const ummiRows = buildRekapUmmiRows(targetStudents, selectedUmmiTerm);
      const wsUmmi = XLSX.utils.json_to_sheet(ummiRows.length > 0 ? ummiRows : [{ Info: 'Tidak ada data santri Kelas 7 Ummi' }]);
      applyAutoColumnWidths(wsUmmi, ummiRows);
      XLSX.utils.book_append_sheet(wb, wsUmmi, `Rekap Ummi (${selectedUmmiTerm})`);

      const logHfl = buildLogHafalanRows(targetStudentIds);
      const wsLogHfl = XLSX.utils.json_to_sheet(logHfl.length > 0 ? logHfl : [{ Info: 'Belum ada riwayat setoran hafalan' }]);
      applyAutoColumnWidths(wsLogHfl, logHfl);
      XLSX.utils.book_append_sheet(wb, wsLogHfl, 'Log Setoran Hafalan');

      const logUmmi = buildLogUmmiRows(targetStudentIds);
      const wsLogUmmi = XLSX.utils.json_to_sheet(logUmmi.length > 0 ? logUmmi : [{ Info: 'Belum ada riwayat setoran Ummi' }]);
      applyAutoColumnWidths(wsLogUmmi, logUmmi);
      XLSX.utils.book_append_sheet(wb, wsLogUmmi, 'Log Setoran Ummi');

      XLSX.writeFile(wb, `Laporan_Lengkap_Tahfizh_Ummi_${classSlug}_${dateStamp}.xlsx`);
    }

    setExportFeedback(`Berhasil mengunduh file Excel (.xlsx) Laporan Tahfizh & Ummi (${classObj ? `Kelas ${classObj.name}` : 'Semua Kelas'})!`);
    setTimeout(() => setExportFeedback(null), 5000);
    setShowExportModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#D4AF37]" />
            Laporan & Raport Tahfizh Al Azhar 21
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cetak raport resmi individu santri (Tahfizh & Metode Ummi) dan rekapitulasi kelas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isWali && (
            <>
              <button
                type="button"
                onClick={() => executeReportExport('active_view', 'csv')}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                title="Unduh langsung laporan sesuai tampilan/filter saat ini ke file CSV"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Ekspor CSV</span>
              </button>

              <button
                type="button"
                onClick={() => executeReportExport('gabungan_lengkap', 'xlsx')}
                className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Unduh buku kerja Excel (.xlsx) lengkap berisi Rekap Hafalan, Rekap Metode Ummi, dan Riwayat Setoran"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Ekspor Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExportClassId(selectedClass);
                  setExportDataset(
                    reportType === 'ummi'
                      ? 'rekap_ummi'
                      : reportType === 'hafalan'
                      ? 'rekap_hafalan'
                      : 'gabungan_lengkap'
                  );
                  setShowExportModal(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs border border-[#D4AF37] transition flex items-center gap-1.5 cursor-pointer"
                title="Buka pengaturan lanjutan untuk memilih jenis laporan, kelas, dan format file (Excel / CSV)"
              >
                <Filter className="w-3.5 h-3.5 text-[#8C7015]" />
                <span>Opsi Ekspor</span>
              </button>
            </>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#D4AF37]" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Export Feedback Banner */}
      {exportFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in no-print">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportFeedback}</span>
          </div>
          <button onClick={() => setExportFeedback(null)} className="text-emerald-700 hover:text-emerald-950 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Selection Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 no-print">
        {!isWali ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
            {[
              { id: 'raport_individu', label: '1. Raport Individu Santri (Format Resmi)', icon: FileCheck2, highlight: true },
              { id: 'rekap_bulanan', label: '2. Rekap Perkembangan Hafalan Bulanan (PDF)', icon: Calendar, highlight: true },
              { id: 'hafalan', label: '3. Rekap Capaian Hafalan Al-Qur\'an', icon: BookOpen },
              { id: 'ummi', label: '4. Rekap Pembelajaran Metode Ummi (Kelas 7)', icon: BookMarked },
              { id: 'rekap_nilai', label: '5. Rekapitulasi Nilai & Evaluasi', icon: Award },
              { id: 'raport_kelas', label: '6. Buku Induk Tahfizh Kelas', icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = reportType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setReportType(tab.id as any)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    isActive
                      ? 'bg-[#1E293B] text-white shadow-xs font-bold'
                      : tab.highlight
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4AF37]' : tab.highlight ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <FileCheck2 className="w-4 h-4 text-[#D4AF37]" />
              <span>Raport Resmi Santri: <span className="text-[#8C7015]">{currentIndividualStudent?.name || 'Pribadi'}</span></span>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Privasi Santri Terjaga
            </span>
          </div>
        )}

        {reportType !== 'raport_individu' && reportType !== 'rekap_bulanan' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Cari Santri / NIS:</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ketik nama atau NIS..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Kelas:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              >
                <option value="">Semua Rombel Kelas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Urutkan Data (Sort):</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full py-1.5 px-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              >
                <option value="class-asc">Urut Berdasarkan Kelas (A → Z)</option>
                <option value="class-desc">Urut Berdasarkan Kelas (Z → A)</option>
                <option value="name-asc">Urut Nama Santri (A → Z)</option>
                <option value="score-desc">Urut Nilai Tertinggi</option>
                <option value="juz-desc">Urut Capaian Juz Terbanyak</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Guru Pengampu:</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              >
                <option value="">Semua Ustadz/Ustadzah</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {reportType === 'ummi' && (
              <div className="sm:col-span-2 lg:col-span-4 pt-1 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Periode Target Evaluasi Metode Ummi:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {TERM_DEFINITIONS.map(td => (
                    <button
                      key={td.term}
                      type="button"
                      onClick={() => setSelectedUmmiTerm(td.term)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        selectedUmmiTerm === td.term
                          ? 'bg-[#1E293B] text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {td.label} ({td.months})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VISUALISASI RECHARTS: TREN PERKEMBANGAN HAFALAN SANTRI SETIAP BULAN       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden no-print">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#1E293B] to-slate-900 text-white">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                  Visualisasi Tren Perkembangan Hafalan Bulanan Santri
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                  Analitik Bulanan
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Grafik interaktif progres setoran ayat, frekuensi Ziyadah/Muroja&apos;ah/Tasmi&apos;, dan rata-rata nilai hafalan setiap bulan
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isWali && (
              <select
                value={selectedChartStudentId}
                onChange={(e) => setSelectedChartStudentId(e.target.value)}
                className="py-1.5 px-3 bg-slate-800 border border-slate-600 rounded-lg text-xs font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                title="Pilih santri tertentu atau tampilkan agregat seluruh santri sesuai filter"
              >
                <option value="all">
                  Semua Santri Terfilter ({filteredStudents.length} Santri)
                </option>
                {filteredStudents.map((std) => {
                  const clsName = classes.find((c) => c.id === std.classId)?.name || '';
                  return (
                    <option key={std.id} value={std.id}>
                      {std.name} ({clsName})
                    </option>
                  );
                })}
              </select>
            )}

            <button
              type="button"
              onClick={() => setShowTrendChart((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold transition cursor-pointer"
            >
              {showTrendChart ? 'Sembunyikan Grafik' : 'Tampilkan Grafik'}
            </button>
          </div>
        </div>

        {showTrendChart && (
          <div className="p-4 sm:p-5 space-y-5">
            {/* KPI Summary Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900/70 block">
                    Total Ayat Disetor
                  </span>
                  <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                    {monthlyTrendKPIs.totalAyat} <span className="text-xs font-bold text-[#8C7015]">Ayat</span>
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Akumulasi setoran bulanan
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/20 text-[#8C7015] flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Frekuensi Setoran
                  </span>
                  <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                    {monthlyTrendKPIs.totalSetoran} <span className="text-xs font-bold text-slate-600">Sesi</span>
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {monthlyTrendKPIs.totalZiyadah} Ziyadah • {monthlyTrendKPIs.totalMurojaah} Muroja&apos;ah • {monthlyTrendKPIs.totalTasmi} Tasmi&apos;
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-slate-200/70 text-slate-700 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/70 block">
                    Rata-rata Kualitas Nilai
                  </span>
                  <p className="text-lg sm:text-xl font-black text-emerald-800 mt-0.5">
                    {monthlyTrendKPIs.overallAvgScore} <span className="text-xs font-bold text-emerald-600">/ 100</span>
                  </p>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Predikat {monthlyTrendKPIs.overallAvgScore >= 90 ? 'Mumtaz (A)' : monthlyTrendKPIs.overallAvgScore >= 80 ? 'Jayyid Jiddan (B)' : 'Jayyid (C)'}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800/70 block">
                    Bulan Progres Tertinggi
                  </span>
                  <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5 truncate">
                    {monthlyTrendKPIs.peakMonthLabel}
                  </p>
                  <span className="text-[10px] text-blue-700 font-semibold">
                    {monthlyTrendKPIs.peakMonthAyat} Ayat disetorkan
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Chart Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setChartViewMode('area_ayat')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    chartViewMode === 'area_ayat'
                      ? 'bg-[#1E293B] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>1. Tren Ayat Disetor &amp; Akumulasi Bulanan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartViewMode('bar_setoran')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    chartViewMode === 'bar_setoran'
                      ? 'bg-[#1E293B] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>2. Komposisi Setoran (Ziyadah / Muroja&apos;ah / Tasmi&apos;)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartViewMode('line_kualitas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    chartViewMode === 'line_kualitas'
                      ? 'bg-[#1E293B] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>3. Tren Rata-rata Nilai &amp; Progres Capaian (Juz)</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-medium">
                Menampilkan data: <strong className="text-slate-800">{selectedChartStudentId === 'all' ? (selectedClass ? `Kelas ${classes.find(c => c.id === selectedClass)?.name}` : 'Semua Kelas') : students.find(s => s.id === selectedChartStudentId)?.name}</strong>
              </span>
            </div>

            {/* Recharts Canvas Area */}
            <div className="h-72 w-full bg-slate-50/60 p-3 rounded-xl border border-slate-200/80">
              <ResponsiveContainer width="100%" height="100%">
                {chartViewMode === 'area_ayat' ? (
                  <AreaChart data={monthlyHafalanTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorTotalAyat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="colorKumulatifAyat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E293B" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1E293B" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="monthLabel"
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#475569' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        borderColor: '#D4AF37',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '12px'
                      }}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.monthFullLabel || ''
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="totalAyat"
                      name="Ayat Disetor Bulan Ini"
                      stroke="#D4AF37"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorTotalAyat)"
                    />
                    <Area
                      type="monotone"
                      dataKey="kumulatifAyat"
                      name="Akumulasi Ayat Semester"
                      stroke="#1E293B"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorKumulatifAyat)"
                    />
                  </AreaChart>
                ) : chartViewMode === 'bar_setoran' ? (
                  <BarChart data={monthlyHafalanTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="monthLabel"
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#475569' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        borderColor: '#D4AF37',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '12px'
                      }}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.monthFullLabel || ''
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar
                      dataKey="ziyadah"
                      name="Hafalan Baru (Ziyadah)"
                      fill="#059669"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="murojaah"
                      name="Muroja'ah Berkala"
                      fill="#2563EB"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="tasmi"
                      name="Ujian Tasmi'"
                      fill="#D4AF37"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <LineChart data={monthlyHafalanTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="monthLabel"
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      yAxisId="left"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#059669' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: '#8C7015' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        borderColor: '#D4AF37',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '12px'
                      }}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.monthFullLabel || ''
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="avgScore"
                      name="Rata-rata Nilai Evaluasi (0-100)"
                      stroke="#059669"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#059669' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="rataRataJuzSantri"
                      name="Progres Rata-rata Capaian (Juz)"
                      stroke="#D4AF37"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#D4AF37' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="activeSantri"
                      name="Santri Aktif Menyetor"
                      stroke="#2563EB"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3, fill: '#2563EB' }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Ringkasan Tabel Mini Bulanan di Bawah Grafik */}
            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max pb-1">
                {monthlyHafalanTrendData.map((mItem) => (
                  <div
                    key={mItem.monthKey}
                    className={`px-3 py-2 rounded-lg border text-xs flex flex-col gap-0.5 min-w-[130px] ${
                      mItem.totalSetoran > 0
                        ? 'bg-amber-50/50 border-amber-200 text-slate-800'
                        : 'bg-slate-50 border-slate-200/80 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span>{mItem.monthFullLabel}</span>
                      {mItem.avgScore > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                          Nilai {mItem.avgScore}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-extrabold text-slate-900">
                      {mItem.totalAyat} Ayat • {mItem.totalSetoran}x Setor
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Z:{mItem.ziyadah} • M:{mItem.murojaah} • T:{mItem.tasmi} ({mItem.activeSantri} santri)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VIEW: RAPORT INDIVIDU SANTRI */}
      {reportType === 'raport_individu' && currentIndividualStudent && (
        <StudentRaportCard
          student={currentIndividualStudent}
          teacher={currentStudentTeacher}
          studentClass={currentStudentClass}
          records={records}
          ummiRecords={ummiRecords}
          settings={settings}
          allStudents={students}
          classes={classes}
          userRole={userRole}
          onSelectStudent={(id) => setSelectedIndividualStudentId(id)}
          onUpdateStudent={(updated) => {
            storageService.saveStudent(updated);
            onRefreshData?.();
          }}
        />
      )}

      {/* VIEW: REKAP PERKEMBANGAN HAFALAN BULANAN (FORMAT PDF RAPI) */}
      {reportType === 'rekap_bulanan' && (
        <MonthlyHafalanRecapModal
          students={students}
          teachers={teachers}
          classes={classes}
          records={records}
          halaqahGroups={storageService.getHalaqahGroups()}
          settings={settings}
          userRole={userRole}
          initialClassId={selectedClass}
          initialTeacherId={selectedTeacher}
        />
      )}

      {/* VIEW: TABEL REKAP KELAS / MASSAL */}
      {reportType !== 'raport_individu' && reportType !== 'rekap_bulanan' && (
        <div className="printable-report-area bg-white p-8 rounded-xl border border-slate-200 shadow-xs space-y-6 print:p-0 print:border-none print:shadow-none">
          
          {/* Kop Surat Resmi Sekolah */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
              {settings.schoolName}
            </h2>
            <p className="text-xs text-slate-700 font-medium">
              {settings.schoolSubtitle}
            </p>
            <p className="text-[11px] text-slate-500 italic">
              {settings.schoolAddress}
            </p>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-900">
              {reportType === 'hafalan' && 'REKAPITULASI CAPAIAN HAFALAN AL-QUR\'AN'}
              {reportType === 'ummi' && `REKAPITULASI PEMBELAJARAN & CAPAIAN TARGET METODE UMMI (KELAS 7 - ${selectedUmmiTerm.toUpperCase()})`}
              {reportType === 'rekap_nilai' && 'REKAPITULASI NILAI & EVALUASI TAJWID'}
              {reportType === 'raport_kelas' && 'BUKU INDUK MONITORING TAHFIZH & UMMI'}
            </h3>
            <p className="text-xs text-slate-600">
              Kelas: <strong>{selectedClass ? classes.find(c => c.id === selectedClass)?.name : 'Semua Kelas'}</strong> • Periode: {settings.academicYear} ({settings.semester})
            </p>
          </div>

          {reportType === 'ummi' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5 no-print">
              <BookMarked className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Kebijakan TP Ini: Pembelajaran UMMI Khusus Jenjang Kelas 7</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Sesuai kebijakan kurikulum, seluruh santri Kelas 8 dan 9 tidak mengikuti pembelajaran UMMI dan tidak masuk jilid Ummi. Rekapitulasi di bawah ini menampilkan santri Kelas 7 beserta target Ummi ({selectedUmmiTerm}) dan status ketercapaian targetnya.
                </p>
              </div>
            </div>
          )}

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-200 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold text-[11px]">
                  <th className="p-2 text-center border-r border-slate-200 w-10">No</th>
                  <th className="p-2 text-left border-r border-slate-200">NIS</th>
                  <th className="p-2 text-left border-r border-slate-200">Nama Lengkap Santri</th>
                  <th className="p-2 text-left border-r border-slate-200">Kelas</th>
                  
                  {reportType === 'hafalan' && (
                    <>
                      <th className="p-2 text-center border-r border-slate-200">Target</th>
                      <th className="p-2 text-center border-r border-slate-200">Capaian Riil</th>
                      <th className="p-2 text-center border-r border-slate-200">% Capaian</th>
                      <th className="p-2 text-left border-r border-slate-200">Hafalan Terakhir</th>
                      <th className="p-2 text-center">Status</th>
                    </>
                  )}

                  {reportType === 'ummi' && (
                    <>
                      <th className="p-2 text-center border-r border-slate-200">Target Ummi</th>
                      <th className="p-2 text-center border-r border-slate-200">Capaian Riil</th>
                      <th className="p-2 text-center border-r border-slate-200">% Capaian</th>
                      <th className="p-2 text-center border-r border-slate-200">Nilai Rata-rata</th>
                      <th className="p-2 text-center">Status</th>
                    </>
                  )}

                  {reportType === 'rekap_nilai' && (
                    <>
                      <th className="p-2 text-center border-r border-slate-200">Skor Rata-rata</th>
                      <th className="p-2 text-center border-r border-slate-200">Predikat</th>
                      <th className="p-2 text-center border-r border-slate-200">Kelancaran</th>
                      <th className="p-2 text-center border-r border-slate-200">Tajwid</th>
                      <th className="p-2 text-left">Catatan Umum</th>
                    </>
                  )}

                  {reportType === 'raport_kelas' && (
                    <>
                      <th className="p-2 text-center border-r border-slate-200">Total Juz</th>
                      <th className="p-2 text-center border-r border-slate-200">Jilid Ummi</th>
                      <th className="p-2 text-center border-r border-slate-200">Nilai</th>
                      <th className="p-2 text-left">Guru Pembimbing</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportStudents.map((std, idx) => {
                  const cls = classes.find(c => c.id === std.classId);
                  const teacher = teachers.find(t => t.id === std.teacherId);
                  const percent = Math.min(100, Math.round((std.totalJuzHafal / std.targetJuz) * 100));
                  const ummiTargetInfo = reportType === 'ummi' ? getStudentUmmiTargetInfo(std, selectedUmmiTerm) : null;

                  return (
                    <tr key={std.id} className="hover:bg-slate-50">
                      <td className="p-2 text-center border-r border-slate-200 font-mono text-[11px]">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono text-[11px]">{std.nis}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{std.name}</td>
                      <td className="p-2 border-r border-slate-200">{cls?.name || '7A'}</td>

                      {reportType === 'hafalan' && (
                        <>
                          <td className="p-2 text-center border-r border-slate-200 font-semibold text-slate-800">
                            {isClass7Bto7E(std, classes, cls)
                              ? resolveRaportTargetHafalan(std, classes, cls, 'TENGAH SEMESTER 1')
                              : `${std.targetJuz} Juz`}
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-[#8C7015]">{std.totalJuzHafal} Juz</td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-emerald-700">{percent}%</td>
                          <td className="p-2 border-r border-slate-200">{std.lastHafalan}</td>
                          <td className="p-2 text-center font-bold text-[10px]">
                            {percent >= 70 ? '🟢 Sesuai Target' : percent >= 40 ? '🟡 Perlu Ditingkatkan' : '🔴 Tertinggal'}
                          </td>
                        </>
                      )}

                      {reportType === 'ummi' && ummiTargetInfo && (
                        <>
                          <td className="p-2 text-center border-r border-slate-200 font-semibold text-slate-800">
                            {ummiTargetInfo.targetJilid} <span className="text-slate-500 text-[11px]">(Hal. {ummiTargetInfo.targetPage})</span>
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-[#8C7015]">
                            {ummiTargetInfo.curJilid} <span className="text-slate-600 font-semibold text-[11px]">(Hal. {ummiTargetInfo.curPage})</span>
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-emerald-700">
                            {ummiTargetInfo.percentage}%
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 font-black text-slate-800">
                            Grade {std.raportUmmiNilai || getGradeFromScore(std.avgScore || 85).letter}
                          </td>
                          <td className="p-2 text-center font-bold text-[10px]">
                            {ummiTargetInfo.status === 'on-track'
                              ? '🟢 Sesuai Target'
                              : ummiTargetInfo.status === 'needs-attention'
                              ? '🟡 Perlu Ditingkatkan'
                              : '🔴 Tertinggal'}
                          </td>
                        </>
                      )}

                      {reportType === 'rekap_nilai' && (
                        <>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-slate-900">{std.avgScore}</td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-emerald-800">
                            {std.avgScore >= 90 ? 'MUMTAZ' : std.avgScore >= 80 ? 'JAYYID JIDDAN' : 'JAYYID'}
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 font-medium">92</td>
                          <td className="p-2 text-center border-r border-slate-200 font-medium">88</td>
                          <td className="p-2 text-slate-600 text-[11px]">Sangat disiplin dalam halaqah tahfizh</td>
                        </>
                      )}

                      {reportType === 'raport_kelas' && (
                        <>
                          <td className="p-2 text-center border-r border-slate-200 font-bold">{std.totalJuzHafal} Juz</td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-slate-800">
                            {isGrade8or9Student(std, classes) ? (
                              <span className="text-slate-400 font-normal italic">- (Non-Ummi)</span>
                            ) : (
                              <span className="text-emerald-800">{std.currentUmmiJilid || '-'}</span>
                            )}
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold">{std.avgScore}</td>
                          <td className="p-2">{teacher?.name}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {reportStudents.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="font-semibold text-slate-600">Tidak ada santri yang sesuai dengan kriteria / filter laporan ini.</p>
              {reportType === 'ummi' && selectedClass && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Catatan: Kelas 8 dan 9 tidak mengikuti pembelajaran UMMI. Pilih kelas 7 untuk melihat data Ummi.
                </p>
              )}
            </div>
          )}

          {/* Lembar Tanda Tangan */}
          <div className="pt-8 grid grid-cols-2 text-center text-xs">
            <div className="flex flex-col items-center justify-between">
              <div>
                <p className="text-slate-500">Mengetahui,</p>
                <p className="font-bold text-slate-800">Kepala SMP Islam Al Azhar 21</p>
              </div>
              {settings.headmasterSignatureUrl ? (
                <div className="h-16 flex items-center justify-center my-1">
                  <img
                    src={settings.headmasterSignatureUrl}
                    alt="TTD Kepala Sekolah"
                    className="h-14 max-w-[140px] object-contain select-none"
                  />
                </div>
              ) : (
                <div className="h-16"></div>
              )}
              <div>
                <p className="font-bold text-slate-900 underline">{headmasterName}</p>
                <p className="text-[10px] text-slate-500 font-mono">NIK. {headmasterNik}</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-between">
              <div>
                <p className="text-slate-500">Sukoharjo, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold text-slate-800">Koordinator Tahfizh & Metode Ummi</p>
              </div>
              {settings.tahfizhCoordinatorSignatureUrl ? (
                <div className="h-16 flex items-center justify-center my-1">
                  <img
                    src={settings.tahfizhCoordinatorSignatureUrl}
                    alt="TTD Koordinator Tahfizh"
                    className="h-14 max-w-[140px] object-contain select-none"
                  />
                </div>
              ) : (
                <div className="h-16"></div>
              )}
              <div>
                <p className="font-bold text-slate-900 underline">{coordinatorName}</p>
                <p className="text-[10px] text-slate-500 font-mono">NIK. {coordinatorNik}</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* MODAL OPSI EKSPOR LAPORAN TAHFIZH & UMMI (CSV / EXCEL) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Ekspor Laporan Tahfizh &amp; Metode Ummi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Unduh rekapitulasi capaian santri &amp; riwayat setoran ke Excel (.xlsx) atau CSV (.csv)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Pilihan Jenis Data Laporan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">1. Pilih Jenis Data Laporan:</label>
                <div className="space-y-1.5">
                  {[
                    {
                      id: 'gabungan_lengkap',
                      title: 'Paket Lengkap: Rekap Hafalan + Rekap Ummi + Log Setoran',
                      desc: 'Excel berisi 4 sheet sekaligus (Rekap Hafalan, Rekap Ummi, Log Setoran Hafalan & Log Ummi)'
                    },
                    {
                      id: 'rekap_hafalan',
                      title: 'Rekap Capaian Hafalan Al-Qur\'an Santri',
                      desc: 'Data NIS, Nama, Kelas, Program, Target Hafalan, Total Juz/Surah/Ayat, % Capaian, & Status'
                    },
                    {
                      id: 'rekap_ummi',
                      title: `Rekap Pembelajaran & Target Metode UMMI (Kelas 7 - ${selectedUmmiTerm})`,
                      desc: 'Data Target Jilid/Halaman, Capaian Riil Ummi, % Ketercapaian, Grade Nilai, & Evaluasi'
                    },
                    {
                      id: 'log_hafalan',
                      title: 'Riwayat Detail Setoran Hafalan Harian (Ziyadah / Murojaah / Tasmi\')',
                      desc: 'Catatan lengkap per tanggal setoran beserta rincian nilai kelancaran, tajwid, makhraj, & adab'
                    },
                    {
                      id: 'log_ummi',
                      title: 'Riwayat Detail Setoran Metode UMMI Harian',
                      desc: 'Catatan lengkap perkembangan jilid, halaman, materi pokok, nilai angka/huruf, & status'
                    }
                  ].map(opt => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                        exportDataset === opt.id
                          ? 'bg-amber-50/80 border-[#D4AF37] ring-1 ring-[#D4AF37]'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exportDataset"
                        checked={exportDataset === opt.id}
                        onChange={() => setExportDataset(opt.id as any)}
                        className="mt-0.5 accent-slate-900 cursor-pointer"
                      />
                      <div>
                        <div className="font-extrabold text-slate-900">{opt.title}</div>
                        <div className="text-[11px] text-slate-500 leading-snug mt-0.5">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter Kelas & Format File */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">2. Filter Rombel Kelas:</label>
                  <select
                    value={exportClassId}
                    onChange={(e) => setExportClassId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    <option value="">Semua Kelas ({students.length} Santri)</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.name} ({students.filter(s => s.classId === c.id).length} Santri)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">3. Format File Unduhan:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExportFormat('xlsx')}
                      className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                        exportFormat === 'xlsx'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Excel (.xlsx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportFormat('csv')}
                      className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                        exportFormat === 'csv'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      <span>CSV (.csv)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeReportExport(exportDataset, exportFormat, exportClassId)}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-200" />
                <span>
                  Unduh {exportFormat === 'xlsx' ? 'Excel (.xlsx)' : 'File CSV (.csv)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
