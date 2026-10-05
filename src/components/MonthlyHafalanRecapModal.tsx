import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Printer,
  FileSpreadsheet,
  Calendar,
  Filter,
  Search,
  BookOpen,
  CheckCircle2,
  Award,
  Flame,
  Users,
  GraduationCap,
  X,
  FileText,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import {
  Student,
  Teacher,
  ClassItem,
  MemorizationRecord,
  AppSettings,
  HalaqahGroup,
  Role
} from '../types';
import { storageService } from '../services/storageService';
import { getGradeFromScore } from '../utils/gradeConversion';
import { isClass7Bto7E, resolveRaportTargetHafalan } from '../utils/gradeHelper';

interface MonthlyHafalanRecapProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassItem[];
  records: MemorizationRecord[];
  halaqahGroups?: HalaqahGroup[];
  settings?: AppSettings;
  userRole?: Role;
  initialClassId?: string;
  initialHalaqahId?: string;
  initialTeacherId?: string;
  isModal?: boolean;
  onClose?: () => void;
}

const INDONESIAN_MONTH_NAMES: Record<string, string> = {
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

export function formatYearMonthLabel(ym: string): string {
  if (!ym || ym === 'all') return 'Semua Bulan (Kumulatif Semester)';
  const [year, month] = ym.split('-');
  const monthName = INDONESIAN_MONTH_NAMES[month] || month;
  return `${monthName} ${year}`;
}

export const MonthlyHafalanRecapModal: React.FC<MonthlyHafalanRecapProps> = ({
  students,
  teachers,
  classes,
  records,
  halaqahGroups = [],
  settings: propSettings,
  userRole = 'admin',
  initialClassId = '',
  initialHalaqahId = 'all',
  initialTeacherId = '',
  isModal = false,
  onClose
}) => {
  const settings = useMemo(() => propSettings || storageService.getSettings(), [propSettings]);

  // Discover all available YYYY-MM months from existing records + academic calendar months
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    records.forEach(r => {
      if (r.date && r.date.length >= 7) {
        monthSet.add(r.date.slice(0, 7));
      }
    });

    // Ensure standard academic year months are also selectable
    const defaultAcademicMonths = [
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
      '2027-03',
      '2027-04',
      '2027-05',
      '2027-06'
    ];
    defaultAcademicMonths.forEach(m => monthSet.add(m));

    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [records]);

  // Default to the latest month that actually has memorization records, or 'all'
  const defaultInitialMonth = useMemo(() => {
    const recordMonths = Array.from(
      new Set<string>(
        records
          .map(r => (r.date && r.date.length >= 7 ? r.date.slice(0, 7) : ''))
          .filter((m): m is string => Boolean(m))
      )
    ).sort((a, b) => b.localeCompare(a));
    return recordMonths[0] || 'all';
  }, [records]);

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultInitialMonth);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [selectedHalaqahId, setSelectedHalaqahId] = useState<string>(initialHalaqahId);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(initialTeacherId);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [reportDetailMode, setReportDetailMode] = useState<'summary' | 'summary_and_log'>('summary');
  const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [onlyActiveSetoran, setOnlyActiveSetoran] = useState<boolean>(false);
  const [signDateText, setSignDateText] = useState<string>(
    `Sukoharjo, ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}`
  );

  // Signatures
  const yusrieTeacher = teachers.find(t => (t.name || '').toLowerCase().includes('yusrie'));
  const coordinatorName =
    settings.tahfizhCoordinator &&
    !settings.tahfizhCoordinator.toLowerCase().includes('fauzan') &&
    !settings.tahfizhCoordinator.toLowerCase().includes('sekar')
      ? settings.tahfizhCoordinator
      : yusrieTeacher?.name || 'Ustadz Muhammad Yusrie Alfian, S.Ag.';
  const coordinatorNik =
    settings.tahfizhCoordinatorNik && settings.tahfizhCoordinatorNik !== '02.0367'
      ? settings.tahfizhCoordinatorNik
      : yusrieTeacher?.nip || '04.0413';
  const headmasterName =
    settings.headmasterName || settings.principalName || 'Muh Saifuddin, S.Si.';
  const headmasterNik = settings.headmasterNik || '01.0125';

  // Filter students
  const filteredStudents = useMemo(() => {
    return students
      .filter(std => {
        if (selectedClassId && std.classId !== selectedClassId) return false;
        if (selectedTeacherId && std.teacherId !== selectedTeacherId) return false;
        if (selectedHalaqahId && selectedHalaqahId !== 'all') {
          const grp = halaqahGroups.find(g => g.id === selectedHalaqahId);
          const inGroup =
            std.halaqahGroupId === selectedHalaqahId ||
            (grp?.studentIds && grp.studentIds.includes(std.id)) ||
            (grp?.teacherId && std.teacherId === grp.teacherId);
          if (!inGroup) return false;
        }
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = std.name.toLowerCase().includes(q);
          const matchNis = (std.nis || '').toLowerCase().includes(q);
          if (!matchName && !matchNis) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const clsA = classes.find(c => c.id === a.classId)?.name || '';
        const clsB = classes.find(c => c.id === b.classId)?.name || '';
        const cmp = clsA.localeCompare(clsB);
        if (cmp !== 0) return cmp;
        return a.name.localeCompare(b.name);
      });
  }, [students, selectedClassId, selectedTeacherId, selectedHalaqahId, halaqahGroups, searchTerm, classes]);

  // Compute monthly recap rows per student
  const studentMonthlyRecapRows = useMemo(() => {
    const rows = filteredStudents.map(std => {
      const cls = classes.find(c => c.id === std.classId);
      const teacher = teachers.find(t => t.id === std.teacherId);

      // Filter records for this student & month
      const studentRecords = records
        .filter(r => {
          if (r.studentId !== std.id) return false;
          if (selectedMonth !== 'all') {
            return (r.date || '').startsWith(selectedMonth);
          }
          return true;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const ziyadahCount = studentRecords.filter(r => r.type === 'Hafalan Baru').length;
      const murojaahCount = studentRecords.filter(r => r.type === 'Murojaah').length;
      const tasmiCount = studentRecords.filter(r => r.type === "Tasmi'").length;
      const totalSetoran = studentRecords.length;
      const totalAyatMonth = studentRecords.reduce((sum, r) => sum + (r.totalAyah || 0), 0);

      // Unique surahs / materials deposited this month
      const uniqueMaterials: string[] = [];
      studentRecords.forEach(r => {
        const rangeLabel =
          r.endSurahName && r.endSurahName !== r.surahName
            ? `QS. ${r.surahName}:${r.startAyah} - ${r.endSurahName}:${r.endAyah}`
            : `QS. ${r.surahName}: ${r.startAyah}-${r.endAyah}`;
        if (!uniqueMaterials.includes(rangeLabel)) {
          uniqueMaterials.push(rangeLabel);
        }
      });

      const latestMonthRecord = studentRecords[0] || null;
      const avgMonthScore =
        studentRecords.length > 0
          ? Math.round(
              studentRecords.reduce((sum, r) => sum + (r.finalScore || 0), 0) /
                studentRecords.length
            )
          : std.avgScore || 0;

      const gradeInfo = getGradeFromScore(avgMonthScore || 85);
      const targetText = isClass7Bto7E(std, classes, cls)
        ? resolveRaportTargetHafalan(std, classes, cls, 'TENGAH SEMESTER 1')
        : `${std.targetJuz || 1} Juz`;

      const progressPercent = Math.min(
        100,
        Math.round(((std.totalJuzHafal || 0) / (std.targetJuz || 1)) * 100)
      );

      const statusLabel =
        totalSetoran >= 4 || progressPercent >= 75
          ? 'Tercapai / Aktif'
          : totalSetoran >= 1 || progressPercent >= 45
          ? 'Progres Berjalan'
          : 'Perlu Pembinaan';

      return {
        student: std,
        className: cls?.name || '7A',
        teacherName: teacher?.name || '-',
        ziyadahCount,
        murojaahCount,
        tasmiCount,
        totalSetoran,
        totalAyatMonth,
        materialsSummary:
          uniqueMaterials.length > 0
            ? uniqueMaterials.slice(0, 3).join('; ') +
              (uniqueMaterials.length > 3 ? ` (+${uniqueMaterials.length - 3} lainnya)` : '')
            : std.lastHafalan
            ? `Capaian s.d. ${std.lastHafalan}`
            : 'Belum ada setoran',
        latestHafalanText: latestMonthRecord
          ? `Juz ${latestMonthRecord.juz} • ${latestMonthRecord.surahName} (${latestMonthRecord.startAyah}-${latestMonthRecord.endAyah})`
          : std.lastHafalan || '-',
        latestDateText: latestMonthRecord?.date || std.lastHafalanDate || '-',
        totalJuzHafal: std.totalJuzHafal || 0,
        targetText,
        progressPercent,
        avgMonthScore,
        gradeLetter: gradeInfo.grade,
        predikat:
          avgMonthScore >= 90
            ? 'Mumtaz'
            : avgMonthScore >= 80
            ? 'Jayyid Jiddan'
            : avgMonthScore >= 70
            ? 'Jayyid'
            : 'Maqbul',
        statusLabel,
        records: studentRecords
      };
    });

    if (onlyActiveSetoran) {
      return rows.filter(r => r.totalSetoran > 0);
    }
    return rows;
  }, [filteredStudents, classes, teachers, records, selectedMonth, onlyActiveSetoran]);

  // All monthly log records for optional table 2
  const monthlyLogRecords = useMemo(() => {
    const studentIdSet = new Set(studentMonthlyRecapRows.map(r => r.student.id));
    return records
      .filter(r => {
        if (!studentIdSet.has(r.studentId)) return false;
        if (selectedMonth !== 'all') {
          return (r.date || '').startsWith(selectedMonth);
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, studentMonthlyRecapRows, selectedMonth]);

  // Aggregate KPI metrics for the header summary
  const summaryStats = useMemo(() => {
    const totalStudents = studentMonthlyRecapRows.length;
    const activeStudents = studentMonthlyRecapRows.filter(r => r.totalSetoran > 0).length;
    const totalSetoran = studentMonthlyRecapRows.reduce((s, r) => s + r.totalSetoran, 0);
    const totalZiyadah = studentMonthlyRecapRows.reduce((s, r) => s + r.ziyadahCount, 0);
    const totalMurojaah = studentMonthlyRecapRows.reduce((s, r) => s + r.murojaahCount, 0);
    const totalTasmi = studentMonthlyRecapRows.reduce((s, r) => s + r.tasmiCount, 0);
    const totalAyat = studentMonthlyRecapRows.reduce((s, r) => s + r.totalAyatMonth, 0);
    const avgScoreAll =
      totalStudents > 0
        ? Math.round(
            studentMonthlyRecapRows.reduce((s, r) => s + r.avgMonthScore, 0) / totalStudents
          )
        : 0;

    return {
      totalStudents,
      activeStudents,
      totalSetoran,
      totalZiyadah,
      totalMurojaah,
      totalTasmi,
      totalAyat,
      avgScoreAll
    };
  }, [studentMonthlyRecapRows]);

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportMonthlyExcel = () => {
    const wb = XLSX.utils.book_new();
    const excelRows = studentMonthlyRecapRows.map((row, idx) => ({
      No: idx + 1,
      NIS: row.student.nis || '-',
      'Nama Lengkap Santri': row.student.name,
      'L/P': row.student.gender || 'L',
      Kelas: row.className,
      'Guru Pembimbing': row.teacherName,
      'Periode Bulan': formatYearMonthLabel(selectedMonth),
      'Setoran Ziyadah (Kali)': row.ziyadahCount,
      'Setoran Murojaah (Kali)': row.murojaahCount,
      "Ujian Tasmi' (Kali)": row.tasmiCount,
      'Total Frekuensi Setoran': row.totalSetoran,
      'Total Ayat Disetor Bulan Ini': row.totalAyatMonth,
      'Materi / Surah Disetor': row.materialsSummary,
      'Capaian Setoran Terakhir': row.latestHafalanText,
      'Tanggal Setoran Terakhir': row.latestDateText,
      'Total Hafalan Kumulatif (Juz)': row.totalJuzHafal,
      'Target Hafalan': row.targetText,
      'Nilai Rata-rata': row.avgMonthScore,
      Grade: row.gradeLetter,
      Predikat: row.predikat,
      'Status Perkembangan': row.statusLabel
    }));

    const ws = XLSX.utils.json_to_sheet(
      excelRows.length > 0 ? excelRows : [{ Info: 'Tidak ada data rekap bulanan' }]
    );
    ws['!cols'] = [
      { wch: 5 },
      { wch: 12 },
      { wch: 28 },
      { wch: 5 },
      { wch: 8 },
      { wch: 26 },
      { wch: 22 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 36 },
      { wch: 28 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
      { wch: 8 },
      { wch: 14 },
      { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Hafalan Bulanan');

    if (monthlyLogRecords.length > 0) {
      const logRows = monthlyLogRecords.map((r, idx) => {
        const std = students.find(s => s.id === r.studentId);
        const cls = classes.find(c => c.id === std?.classId);
        const tch = teachers.find(t => t.id === r.teacherId);
        return {
          No: idx + 1,
          Tanggal: r.date,
          NIS: std?.nis || '-',
          'Nama Santri': std?.name || '-',
          Kelas: cls?.name || '-',
          'Jenis Setoran': r.type,
          Juz: r.juz,
          Surah: r.surahName,
          'Ayat Mulai': r.startAyah,
          'Ayat Selesai': r.endAyah,
          'Total Ayat': r.totalAyah,
          'Nilai Akhir': r.finalScore,
          'Guru Penguji': tch?.name || '-',
          Catatan: r.notes || '-'
        };
      });
      const wsLog = XLSX.utils.json_to_sheet(logRows);
      XLSX.utils.book_append_sheet(wb, wsLog, 'Rincian Log Bulanan');
    }

    const monthSlug = selectedMonth === 'all' ? 'Semua_Bulan' : selectedMonth;
    const classObj = classes.find(c => c.id === selectedClassId);
    const classSlug = classObj ? `Kelas_${classObj.name}` : 'Semua_Kelas';
    XLSX.writeFile(wb, `Rekap_Hafalan_Bulanan_${classSlug}_${monthSlug}.xlsx`);
  };

  const selectedClassObj = classes.find(c => c.id === selectedClassId);
  const selectedTeacherObj = teachers.find(t => t.id === selectedTeacherId);
  const selectedHalaqahObj = halaqahGroups.find(g => g.id === selectedHalaqahId);

  const content = (
    <div className="space-y-5">
      {/* Dynamic Print Page Rule for Portrait vs Landscape PDF */}
      <style>
        {`
          @media print {
            @page {
              size: ${pageOrientation === 'landscape' ? '330mm 215mm' : '215mm 330mm'};
              margin: 8mm 10mm;
            }
          }
        `}
      </style>

      {/* FILTER & PRINT CONFIGURATION TOOLBAR (HIDDEN ON PRINT) */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#1E293B] text-[#D4AF37] flex items-center justify-center shadow-xs shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <span>Rekap Perkembangan Hafalan Bulanan Santri</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  Format Cetak PDF Resmi
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Pilih periode bulan, kelas/halaqah, dan klik <strong>Cetak / Simpan PDF</strong> untuk mencetak laporan perkembangan bulanan yang rapi.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportMonthlyExcel}
              className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Unduh Rekap Perkembangan Hafalan Bulanan dalam format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Unduh Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer ring-2 ring-[#D4AF37]/40"
              title="Cetak langsung atau Simpan sebagai PDF (Save as PDF)"
            >
              <Printer className="w-4 h-4 text-[#D4AF37]" />
              <span>Cetak / Simpan PDF</span>
            </button>

            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                title="Tutup Pratinjau Cetak"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Pilih Bulan */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              1. Periode Bulan Laporan:
            </label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full py-2 px-3 bg-amber-50/80 border border-[#D4AF37] rounded-lg text-xs font-extrabold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="all">Semua Bulan (Kumulatif)</option>
              {availableMonths.map(ym => (
                <option key={ym} value={ym}>
                  Bulan {formatYearMonthLabel(ym)}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Filter Kelas */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              2. Filter Rombel Kelas:
            </label>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="">Semua Kelas ({students.length} Santri)</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filter Halaqah */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              3. Filter Kelompok Halaqah:
            </label>
            <select
              value={selectedHalaqahId}
              onChange={e => setSelectedHalaqahId(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="all">Semua Kelompok Halaqah</option>
              {halaqahGroups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Filter Guru Pembimbing */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              4. Guru Pembimbing (Musyrif):
            </label>
            <select
              value={selectedTeacherId}
              onChange={e => setSelectedTeacherId(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="">Semua Ustadz / Ustadzah</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Cari Santri */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              5. Cari Nama / NIS Santri:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Ketik nama / NIS..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Secondary Print Options Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-600 text-[11px]">Format Tabel:</span>
              <button
                type="button"
                onClick={() => setReportDetailMode('summary')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  reportDetailMode === 'summary'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Ringkasan Per Santri
              </button>
              <button
                type="button"
                onClick={() => setReportDetailMode('summary_and_log')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  reportDetailMode === 'summary_and_log'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                + Lampirkan Rincian Setoran Harian
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-600 text-[11px]">Orientasi Kertas:</span>
              <button
                type="button"
                onClick={() => setPageOrientation('portrait')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  pageOrientation === 'portrait'
                    ? 'bg-[#D4AF37] text-slate-950 font-black'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Portrait (Tegak)
              </button>
              <button
                type="button"
                onClick={() => setPageOrientation('landscape')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  pageOrientation === 'landscape'
                    ? 'bg-[#D4AF37] text-slate-950 font-black'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Landscape (Melebar)
              </button>
            </div>

            <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyActiveSetoran}
                onChange={e => setOnlyActiveSetoran(e.target.checked)}
                className="rounded accent-slate-900 cursor-pointer"
              />
              <span>Hanya tampilkan santri yang menyetor di bulan ini</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600">Titimangsa Cetak:</span>
            <input
              type="text"
              value={signDateText}
              onChange={e => setSignDateText(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-semibold text-slate-800 w-52 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LEMBAR DOKUMEN CETAK PDF RESMI (PRINTABLE AREA)                           */}
      {/* ========================================================================= */}
      <div className="monthly-recap-print-sheet printable-report-area bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-sm space-y-5 print:p-0 print:border-none print:shadow-none">
        {/* KOP SURAT RESMI SEKOLAH */}
        <div className="border-b-4 border-double border-slate-900 pb-3.5 flex items-center justify-between gap-4">
          {settings.customLogoUrl?.trim() ? (
            <img
              src={settings.customLogoUrl.trim()}
              alt="Logo Al Azhar"
              className="w-16 h-16 object-contain shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[#1E293B] text-[#D4AF37] flex items-center justify-center font-black text-lg shrink-0 border-2 border-[#D4AF37]">
              AA21
            </div>
          )}

          <div className="text-center flex-1 space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              YAYASAN MAKARTI MUKTI TAMA • YAYASAN PESANTREN ISLAM AL AZHAR
            </p>
            <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-950">
              {settings.schoolName || 'SMP ISLAM AL AZHAR 21 SOLO BARU'}
            </h1>
            <p className="text-xs font-bold text-slate-800">
              {settings.schoolSubtitle || "Program Tahfizh Al-Qur'an & Pembelajaran Metode Ummi"}
            </p>
            <p className="text-[10px] text-slate-600">
              {settings.schoolAddress ||
                'Jl. Raya Solo Baru - Baki, Kudu, Kec. Baki, Kabupaten Sukoharjo, Jawa Tengah 57556'}
            </p>
          </div>

          {settings.customMakarimaLogoUrl?.trim() ? (
            <img
              src={settings.customMakarimaLogoUrl.trim()}
              alt="Logo Yayasan"
              className="w-16 h-16 object-contain shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-amber-50 text-[#8C7015] flex items-center justify-center font-black text-xs shrink-0 border border-amber-300 text-center leading-tight p-1">
              TAHFIZH QUR&apos;AN
            </div>
          )}
        </div>

        {/* JUDUL DOKUMEN & IDENTITAS PERIODE */}
        <div className="text-center space-y-1">
          <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-950 underline decoration-2 underline-offset-4">
            LAPORAN REKAPITULASI PERKEMBANGAN HAFALAN BULANAN SANTRI
          </h2>
          <p className="text-xs font-bold text-slate-800">
            Periode Laporan: <span className="text-[#8C7015] uppercase">{formatYearMonthLabel(selectedMonth)}</span> • Tahun Ajaran {settings.academicYear || '2026/2027'} ({settings.semester || 'Semester Ganjil'})
          </p>
        </div>

        {/* METADATA FILTER & RINGKASAN EKSEKUTIF BULANAN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-300">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-36 font-bold text-slate-700">Rombel Kelas</span>
              <span className="font-extrabold text-slate-900">
                : {selectedClassObj ? `Kelas ${selectedClassObj.name}` : 'Semua Rombel Kelas'}
              </span>
            </div>
            <div className="flex">
              <span className="w-36 font-bold text-slate-700">Kelompok Halaqah</span>
              <span className="font-extrabold text-slate-900">
                : {selectedHalaqahObj ? selectedHalaqahObj.name : 'Semua Kelompok Halaqah'}
              </span>
            </div>
            <div className="flex">
              <span className="w-36 font-bold text-slate-700">Guru Pembimbing</span>
              <span className="font-extrabold text-slate-900">
                : {selectedTeacherObj ? selectedTeacherObj.name : selectedHalaqahObj?.teacherName || 'Tim Musyrif Tahfizh Al Azhar 21'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex">
              <span className="w-40 font-bold text-slate-700">Jumlah Santri Tercatat</span>
              <span className="font-extrabold text-slate-900">
                : {summaryStats.totalStudents} Santri ({summaryStats.activeStudents} Aktif Menyetor)
              </span>
            </div>
            <div className="flex">
              <span className="w-40 font-bold text-slate-700">Total Frekuensi Setoran</span>
              <span className="font-extrabold text-slate-900">
                : {summaryStats.totalSetoran} Kali (Ziyadah: {summaryStats.totalZiyadah}, Muroja&apos;ah: {summaryStats.totalMurojaah}, Tasmi&apos;: {summaryStats.totalTasmi})
              </span>
            </div>
            <div className="flex">
              <span className="w-40 font-bold text-slate-700">Total Ayat &amp; Rata-rata</span>
              <span className="font-extrabold text-emerald-800">
                : {summaryStats.totalAyat} Ayat Disetor • Nilai Rata-rata: {summaryStats.avgScoreAll}
              </span>
            </div>
          </div>
        </div>

        {/* TABEL UTAMA: REKAP PERKEMBANGAN HAFALAN BULANAN PER SANTRI */}
        <div className="overflow-x-auto">
          <table className="w-full text-[10.5px] border-2 border-slate-900 border-collapse">
            <thead>
              <tr className="bg-slate-200 text-slate-950 font-extrabold text-center border-b-2 border-slate-900">
                <th rowSpan={2} className="border border-slate-800 px-1.5 py-1.5 w-8">
                  No
                </th>
                <th rowSpan={2} className="border border-slate-800 px-2 py-1.5 text-left w-16">
                  NIS
                </th>
                <th rowSpan={2} className="border border-slate-800 px-2 py-1.5 text-left min-w-[150px]">
                  Nama Lengkap Santri
                </th>
                <th rowSpan={2} className="border border-slate-800 px-1.5 py-1.5 w-12">
                  Kelas
                </th>
                <th colSpan={4} className="border border-slate-800 px-1.5 py-1 bg-amber-100/70">
                  Frekuensi Setoran Bulan Ini
                </th>
                <th rowSpan={2} className="border border-slate-800 px-2 py-1.5 text-left min-w-[175px]">
                  Materi / Surah yang Disetor &amp; Capaian Terakhir
                </th>
                <th colSpan={2} className="border border-slate-800 px-1.5 py-1 bg-emerald-100/60">
                  Capaian Kumulatif
                </th>
                <th rowSpan={2} className="border border-slate-800 px-1.5 py-1.5 w-16">
                  Nilai &amp; Grade
                </th>
                <th rowSpan={2} className="border border-slate-800 px-2 py-1.5 w-24">
                  Keterangan / Status
                </th>
              </tr>
              <tr className="bg-slate-100 text-slate-900 font-bold text-center text-[10px] border-b border-slate-800">
                <th className="border border-slate-800 px-1 py-1 w-10" title="Hafalan Baru (Ziyadah)">
                  Ziyadah
                </th>
                <th className="border border-slate-800 px-1 py-1 w-11" title="Murojaah Hafalan">
                  Muroja&apos;ah
                </th>
                <th className="border border-slate-800 px-1 py-1 w-10" title="Ujian Tasmi' Sekali Duduk">
                  Tasmi&apos;
                </th>
                <th className="border border-slate-800 px-1 py-1 w-12 bg-amber-50">
                  Jml Ayat
                </th>
                <th className="border border-slate-800 px-1 py-1 w-14">
                  Total Juz
                </th>
                <th className="border border-slate-800 px-1 py-1 w-16">
                  Target
                </th>
              </tr>
            </thead>
            <tbody>
              {studentMonthlyRecapRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="border border-slate-800 py-8 text-center text-slate-500 italic">
                    Tidak ada data santri yang sesuai dengan filter periode / kelas ini.
                  </td>
                </tr>
              ) : (
                studentMonthlyRecapRows.map((row, idx) => (
                  <tr
                    key={row.student.id}
                    className="border-b border-slate-800 odd:bg-white even:bg-slate-50/60 align-middle"
                  >
                    <td className="border border-slate-800 px-1.5 py-1.5 text-center font-mono">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-800 px-2 py-1.5 font-mono text-[10px]">
                      {row.student.nis || '-'}
                    </td>
                    <td className="border border-slate-800 px-2 py-1.5 font-bold text-slate-950">
                      {row.student.name}
                    </td>
                    <td className="border border-slate-800 px-1.5 py-1.5 text-center font-bold">
                      {row.className}
                    </td>
                    <td className="border border-slate-800 px-1 py-1.5 text-center font-semibold">
                      {row.ziyadahCount}x
                    </td>
                    <td className="border border-slate-800 px-1 py-1.5 text-center font-semibold">
                      {row.murojaahCount}x
                    </td>
                    <td className="border border-slate-800 px-1 py-1.5 text-center font-semibold">
                      {row.tasmiCount}x
                    </td>
                    <td className="border border-slate-800 px-1 py-1.5 text-center font-extrabold text-[#8C7015] bg-amber-50/40">
                      {row.totalAyatMonth}
                    </td>
                    <td className="border border-slate-800 px-2 py-1.5 leading-snug">
                      <div className="font-bold text-slate-900">{row.latestHafalanText}</div>
                      <div className="text-[9.5px] text-slate-600">{row.materialsSummary}</div>
                    </td>
                    <td className="border border-slate-800 px-1.5 py-1.5 text-center font-extrabold text-emerald-800">
                      {row.totalJuzHafal} Juz
                    </td>
                    <td className="border border-slate-800 px-1.5 py-1.5 text-center text-[10px] font-semibold text-slate-700">
                      {row.targetText}
                    </td>
                    <td className="border border-slate-800 px-1.5 py-1.5 text-center">
                      <span className="font-extrabold text-slate-950">{row.avgMonthScore}</span>{' '}
                      <span className="text-[9.5px] font-bold px-1 py-0.2 rounded bg-slate-200 text-slate-900">
                        ({row.gradeLetter})
                      </span>
                    </td>
                    <td className="border border-slate-800 px-1.5 py-1.5 text-center font-bold text-[10px]">
                      {row.statusLabel}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* OPSIONAL: LAMPIRAN RINCIAN LOG SETORAN HARIAN PADA BULAN TERPILIH */}
        {reportDetailMode === 'summary_and_log' && (
          <div className="pt-3 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-900 flex items-center gap-1.5">
              <span>LAMPIRAN: RINCIAN LOG SETORAN HAFALAN HARIAN ({formatYearMonthLabel(selectedMonth).toUpperCase()})</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-2 border-slate-900 border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-slate-950 font-extrabold border-b border-slate-900">
                    <th className="border border-slate-800 px-1.5 py-1 text-center w-8">No</th>
                    <th className="border border-slate-800 px-2 py-1 text-left w-20">Tanggal</th>
                    <th className="border border-slate-800 px-2 py-1 text-left">Nama Santri</th>
                    <th className="border border-slate-800 px-1.5 py-1 text-center w-12">Kelas</th>
                    <th className="border border-slate-800 px-2 py-1 text-center w-24">Jenis Setoran</th>
                    <th className="border border-slate-800 px-1.5 py-1 text-center w-12">Juz</th>
                    <th className="border border-slate-800 px-2 py-1 text-left">Surah &amp; Rincian Ayat</th>
                    <th className="border border-slate-800 px-1.5 py-1 text-center w-14">Jml Ayat</th>
                    <th className="border border-slate-800 px-1.5 py-1 text-center w-16">Nilai</th>
                    <th className="border border-slate-800 px-2 py-1 text-left">Guru Penguji</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyLogRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="border border-slate-800 py-5 text-center text-slate-500 italic">
                        Belum ada rincian transaksi setoran pada periode bulan ini.
                      </td>
                    </tr>
                  ) : (
                    monthlyLogRecords.map((rec, idx) => {
                      const std = students.find(s => s.id === rec.studentId);
                      const cls = classes.find(c => c.id === std?.classId);
                      const tch = teachers.find(t => t.id === rec.teacherId);
                      const g = getGradeFromScore(rec.finalScore);
                      return (
                        <tr key={rec.id} className="border-b border-slate-800">
                          <td className="border border-slate-800 px-1.5 py-1 text-center font-mono">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-800 px-2 py-1 font-mono">{rec.date}</td>
                          <td className="border border-slate-800 px-2 py-1 font-bold text-slate-900">
                            {std?.name || '-'}
                          </td>
                          <td className="border border-slate-800 px-1.5 py-1 text-center font-bold">
                            {cls?.name || '-'}
                          </td>
                          <td className="border border-slate-800 px-2 py-1 text-center font-semibold">
                            {rec.type}
                          </td>
                          <td className="border border-slate-800 px-1.5 py-1 text-center font-bold">
                            Juz {rec.juz}
                          </td>
                          <td className="border border-slate-800 px-2 py-1 font-semibold">
                            {rec.endSurahName && rec.endSurahName !== rec.surahName
                              ? `${rec.surahName} (${rec.startAyah}) s.d. ${rec.endSurahName} (${rec.endAyah})`
                              : `${rec.surahName} Ayat ${rec.startAyah}–${rec.endAyah}`}
                          </td>
                          <td className="border border-slate-800 px-1.5 py-1 text-center font-bold">
                            {rec.totalAyah} Ayat
                          </td>
                          <td className="border border-slate-800 px-1.5 py-1 text-center font-bold">
                            {rec.finalScore} ({g.grade})
                          </td>
                          <td className="border border-slate-800 px-2 py-1 text-slate-700">
                            {tch?.name || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LEMBAR PENGESAHAN / TANDA TANGAN RESMI */}
        <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs break-inside-avoid">
          <div className="flex flex-col items-center justify-between">
            <div>
              <p className="text-slate-700">Mengetahui,</p>
              <p className="font-bold text-slate-950">Kepala SMP Islam Al Azhar 21</p>
            </div>
            {settings.headmasterSignatureUrl?.trim() ? (
              <div className="h-16 flex items-center justify-center my-1">
                <img
                  src={settings.headmasterSignatureUrl.trim()}
                  alt="TTD Kepala Sekolah"
                  className="h-14 max-w-[140px] object-contain select-none"
                />
              </div>
            ) : (
              <div className="h-16" />
            )}
            <div>
              <p className="font-bold text-slate-950 underline">{headmasterName}</p>
              <p className="text-[10px] text-slate-600 font-mono">NIK. {headmasterNik}</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between">
            <div>
              <p className="text-slate-700">{signDateText}</p>
              <p className="font-bold text-slate-950">Koordinator Tahfizh</p>
            </div>
            {settings.tahfizhCoordinatorSignatureUrl?.trim() ? (
              <div className="h-16 flex items-center justify-center my-1">
                <img
                  src={settings.tahfizhCoordinatorSignatureUrl.trim()}
                  alt="TTD Koordinator Tahfizh"
                  className="h-14 max-w-[140px] object-contain select-none"
                />
              </div>
            ) : (
              <div className="h-16" />
            )}
            <div>
              <p className="font-bold text-slate-950 underline">{coordinatorName}</p>
              <p className="text-[10px] text-slate-600 font-mono">NIK. {coordinatorNik}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 animate-in fade-in print:static print:bg-white print:p-0 print:overflow-visible">
        <div className="max-w-6xl mx-auto bg-slate-100 p-4 sm:p-6 rounded-2xl shadow-2xl border border-slate-300 print:bg-white print:p-0 print:border-none print:shadow-none">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
