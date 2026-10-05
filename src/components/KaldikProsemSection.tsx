import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Calendar,
  Table2,
  Edit3,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Paintbrush,
  Layers,
  Eye,
  Filter,
  Users,
  UserCheck,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import {
  KaldikData,
  KaldikCategory,
  KaldikCellStyle,
  ProsemSheet,
  ProsemRow,
  INITIAL_KALDIK_DATA,
  INITIAL_KALDIK_REGULER_DATA,
  INITIAL_PROSEM_SHEETS
} from '../data/kaldikProsemData';
import { storageService } from '../services/storageService';
import { Role, User, Teacher, HalaqahGroup } from '../types';

interface KaldikSectionProps {
  userRole: Role;
  onOpenQuickView?: () => void;
  isDirectEdit?: boolean;
}

export const KaldikSection: React.FC<KaldikSectionProps> = ({
  userRole,
  onOpenQuickView,
  isDirectEdit = false
}) => {
  const canEdit = userRole === 'admin' || userRole === 'guru';
  const [activeCategory, setActiveCategory] = useState<KaldikCategory>('tahfizh');
  const [kaldik, setKaldik] = useState<KaldikData>(() => storageService.getKaldikData('tahfizh'));
  const [isEditing, setIsEditing] = useState<boolean>(isDirectEdit);

  useEffect(() => {
    if (isDirectEdit) {
      setIsEditing(true);
    }
  }, [isDirectEdit]);

  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const handleSwitchCategory = (cat: KaldikCategory) => {
    setActiveCategory(cat);
    const data = storageService.getKaldikData(cat);
    setKaldik(data);
    setBatchMonthId(data.months[0]?.id || (cat === 'reguler' ? 'reg-m-juli' : 'm-juli'));
    setIsEditing(false);
  };

  // Selected brush / quick input tool for Kaldik cells
  const [activeBrushStyle, setActiveBrushStyle] = useState<KaldikCellStyle | 'keep'>('keep');
  const [batchMonthId, setBatchMonthId] = useState<string>(kaldik.months[0]?.id || 'm-juli');
  const [batchStartDay, setBatchStartDay] = useState<number>(1);
  const [batchEndDay, setBatchEndDay] = useState<number>(5);
  const [batchText, setBatchText] = useState<string>('');
  const [batchAutoNumberStart, setBatchAutoNumberStart] = useState<string>('');
  const [batchStyle, setBatchStyle] = useState<KaldikCellStyle>('normal');

  const showSavedMessage = (msg: string) => {
    setSaveBanner(msg);
    setTimeout(() => setSaveBanner(null), 3500);
  };

  const handleSaveKaldik = () => {
    storageService.saveKaldikData(kaldik, activeCategory);
    setIsEditing(false);
    showSavedMessage(`Kalender Pendidikan (${activeCategory === 'reguler' ? 'Kelas Reguler' : 'Kelas Tahfizh'}) berhasil disimpan.`);
  };

  const handleResetKaldik = () => {
    const fresh = storageService.resetKaldikData(activeCategory);
    setKaldik(fresh);
    showSavedMessage(`Kalender Pendidikan (${activeCategory === 'reguler' ? 'Kelas Reguler' : 'Kelas Tahfizh'}) dikembalikan ke data standar.`);
  };

  const handleCellTextChange = (monthId: string, day: number, newText: string) => {
    setKaldik(prev => ({
      ...prev,
      months: prev.months.map(m => {
        if (m.id !== monthId) return m;
        const currentCell = m.days[day] || { text: '', style: 'normal' };
        const nextStyle = activeBrushStyle === 'keep' ? currentCell.style : activeBrushStyle;
        return {
          ...m,
          days: {
            ...m.days,
            [day]: {
              text: newText,
              style: nextStyle
            }
          }
        };
      })
    }));
  };

  const handleCellStyleCycle = (monthId: string, day: number) => {
    if (!canEdit || !isEditing) return;
    const order: KaldikCellStyle[] = ['normal', 'sunday_red', 'holiday_text_red', 'invalid_black'];
    setKaldik(prev => ({
      ...prev,
      months: prev.months.map(m => {
        if (m.id !== monthId) return m;
        const currentCell = m.days[day] || { text: '', style: 'normal' };
        const nextStyle =
          activeBrushStyle !== 'keep'
            ? activeBrushStyle
            : order[(order.indexOf(currentCell.style || 'normal') + 1) % order.length];
        return {
          ...m,
          days: {
            ...m.days,
            [day]: {
              ...currentCell,
              style: nextStyle
            }
          }
        };
      })
    }));
  };

  const handleApplyBatchRange = () => {
    const start = Math.max(1, Math.min(31, batchStartDay));
    const end = Math.max(start, Math.min(31, batchEndDay));
    let autoCounter = batchAutoNumberStart.trim() !== '' ? parseInt(batchAutoNumberStart, 10) : null;

    setKaldik(prev => ({
      ...prev,
      months: prev.months.map(m => {
        if (m.id !== batchMonthId) return m;
        const updatedDays = { ...m.days };
        for (let d = start; d <= end; d++) {
          let cellText = batchText;
          if (autoCounter !== null && !isNaN(autoCounter)) {
            cellText = String(autoCounter);
            autoCounter++;
          }
          updatedDays[d] = {
            text: cellText,
            style: batchStyle
          };
        }
        return { ...m, days: updatedDays };
      })
    }));
    showSavedMessage(`Rentang tanggal ${start}–${end} berhasil diperbarui. Jangan lupa klik Simpan.`);
  };

  const handleEffectiveWeekChange = (
    semester: 1 | 2,
    monthIndex: number,
    weekIndex: number,
    val: string,
    isJam = false
  ) => {
    const parsed = val.trim() === '' ? null : Number(val);
    const key = semester === 1 ? 'semester1Effective' : 'semester2Effective';
    setKaldik(prev => {
      const list = [...prev[key]];
      const item = { ...list[monthIndex] };
      if (isJam) {
        const jamWeeks: [number | null, number | null, number | null, number | null, number | null] = [
          ...(item.jamWeeks || [null, null, null, null, null])
        ] as any;
        jamWeeks[weekIndex] = isNaN(parsed as number) ? null : parsed;
        item.jamWeeks = jamWeeks;
      } else {
        const weeks: [number | null, number | null, number | null, number | null, number | null] = [
          ...item.weeks
        ] as any;
        weeks[weekIndex] = isNaN(parsed as number) ? null : parsed;
        item.weeks = weeks;
      }
      list[monthIndex] = item;
      return { ...prev, [key]: list };
    });
  };

  const handleExportKaldikExcel = () => {
    const wb = XLSX.utils.book_new();
    const headerRow = ['NO', 'BULAN', ...Array.from({ length: 31 }, (_, i) => String(i + 1))];
    const rows: (string | number)[][] = [
      [kaldik.title],
      [kaldik.schoolName],
      [`${kaldik.academicYear} - ${kaldik.semesterLabel}`],
      [],
      headerRow
    ];

    kaldik.months.forEach((m, idx) => {
      const r: (string | number)[] = [idx + 1, m.monthName];
      for (let d = 1; d <= 31; d++) {
        const cell = m.days[d];
        r.push(cell?.style === 'invalid_black' ? 'X' : cell?.text || '');
      }
      rows.push(r);
    });

    rows.push([]);
    const tmLabel = activeCategory === 'reguler' ? 'TM (2 TM/Pekan)' : 'Jam';
    rows.push([]);
    rows.push([`PERHITUNGAN HARI & ${activeCategory === 'reguler' ? 'TM' : 'JAM'} EFEKTIF SEMESTER 1`]);
    rows.push([
      'Bulan',
      'Pekan 1 (Hari)', 'Pekan 2 (Hari)', 'Pekan 3 (Hari)', 'Pekan 4 (Hari)', 'Pekan 5 (Hari)',
      'Jml Hari Efektif', 'Jml Pekan Efektif',
      `Pekan 1 (${tmLabel})`, `Pekan 2 (${tmLabel})`, `Pekan 3 (${tmLabel})`, `Pekan 4 (${tmLabel})`, `Pekan 5 (${tmLabel})`,
      `Jml ${activeCategory === 'reguler' ? 'TM' : 'Jam'} Efektif`, 'Jml Pekan Efektif'
    ]);
    kaldik.semester1Effective.forEach(item => {
      const validWeeks = item.weeks.filter((w): w is number => typeof w === 'number' && w > 0);
      const sumDays = validWeeks.reduce((a, b) => a + b, 0);
      const jamList = item.jamWeeks || [null, null, null, null, null];
      const validJam = jamList.filter((w): w is number => typeof w === 'number' && w > 0);
      const sumJam = validJam.reduce((a, b) => a + b, 0);
      rows.push([
        item.monthName,
        item.weeks[0] ?? '-',
        item.weeks[1] ?? '-',
        item.weeks[2] ?? '-',
        item.weeks[3] ?? '-',
        item.weeks[4] ?? '-',
        sumDays,
        validWeeks.length,
        jamList[0] ?? '-',
        jamList[1] ?? '-',
        jamList[2] ?? '-',
        jamList[3] ?? '-',
        jamList[4] ?? '-',
        sumJam,
        validJam.length
      ]);
    });

    rows.push([]);
    rows.push([`PERHITUNGAN HARI & ${activeCategory === 'reguler' ? 'TM' : 'JAM'} EFEKTIF SEMESTER 2`]);
    rows.push([
      'Bulan',
      'Pekan 1 (Hari)', 'Pekan 2 (Hari)', 'Pekan 3 (Hari)', 'Pekan 4 (Hari)', 'Pekan 5 (Hari)',
      'Jml Hari Efektif', 'Jml Pekan Efektif',
      `Pekan 1 (${tmLabel})`, `Pekan 2 (${tmLabel})`, `Pekan 3 (${tmLabel})`, `Pekan 4 (${tmLabel})`, `Pekan 5 (${tmLabel})`,
      `Jml ${activeCategory === 'reguler' ? 'TM' : 'Jam'} Efektif`, 'Jml Pekan Efektif'
    ]);
    kaldik.semester2Effective.forEach(item => {
      const validWeeks = item.weeks.filter((w): w is number => typeof w === 'number' && w > 0);
      const sumDays = validWeeks.reduce((a, b) => a + b, 0);
      const jamList = item.jamWeeks || [null, null, null, null, null];
      const validJam = jamList.filter((w): w is number => typeof w === 'number' && w > 0);
      const sumJam = validJam.reduce((a, b) => a + b, 0);
      rows.push([
        item.monthName,
        item.weeks[0] ?? '-',
        item.weeks[1] ?? '-',
        item.weeks[2] ?? '-',
        item.weeks[3] ?? '-',
        item.weeks[4] ?? '-',
        sumDays,
        validWeeks.length,
        jamList[0] ?? '-',
        jamList[1] ?? '-',
        jamList[2] ?? '-',
        jamList[3] ?? '-',
        jamList[4] ?? '-',
        sumJam,
        validJam.length
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const sheetName = activeCategory === 'reguler' ? 'Kaldik Reguler' : 'Kaldik Ummi';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const fileName = `Kaldik_${activeCategory === 'reguler' ? 'Reguler_Non_Tahfizh' : 'Metode_Ummi'}_${kaldik.academicYear.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Totals for Semester 1 & Semester 2
  const sem1Stats = useMemo(() => {
    let totalDays = 0;
    let totalWeeks = 0;
    let totalJam = 0;
    let totalJamWeeks = 0;
    kaldik.semester1Effective.forEach(m => {
      const valid = m.weeks.filter((w): w is number => typeof w === 'number' && w > 0);
      totalDays += valid.reduce((a, b) => a + b, 0);
      totalWeeks += valid.length;

      const validJam = (m.jamWeeks || []).filter((w): w is number => typeof w === 'number' && w > 0);
      totalJam += validJam.reduce((a, b) => a + b, 0);
      totalJamWeeks += validJam.length;
    });
    return { totalDays, totalWeeks, totalJam, totalJamWeeks };
  }, [kaldik.semester1Effective]);

  const sem2Stats = useMemo(() => {
    let totalDays = 0;
    let totalWeeks = 0;
    let totalJam = 0;
    let totalJamWeeks = 0;
    kaldik.semester2Effective.forEach(m => {
      const valid = m.weeks.filter((w): w is number => typeof w === 'number' && w > 0);
      totalDays += valid.reduce((a, b) => a + b, 0);
      totalWeeks += valid.length;

      const validJam = (m.jamWeeks || []).filter((w): w is number => typeof w === 'number' && w > 0);
      totalJam += validJam.reduce((a, b) => a + b, 0);
      totalJamWeeks += validJam.length;
    });
    return { totalDays, totalWeeks, totalJam, totalJamWeeks };
  }, [kaldik.semester2Effective]);

  const yearlyStats = useMemo(() => ({
    totalDays: sem1Stats.totalDays + sem2Stats.totalDays,
    totalWeeks: sem1Stats.totalWeeks + sem2Stats.totalWeeks,
    totalJam: sem1Stats.totalJam + sem2Stats.totalJam,
    totalJamWeeks: sem1Stats.totalJamWeeks + sem2Stats.totalJamWeeks
  }), [sem1Stats, sem2Stats]);

  const handlePrintKaldik = () => {
    const styleEl = document.createElement('style');
    styleEl.id = 'kaldik-print-page-style';
    styleEl.innerHTML = `
      @page {
        size: landscape !important;
        margin: 5mm 6mm !important;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .kaldik-print-container {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          box-shadow: none !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
    window.print();
    setTimeout(() => {
      const el = document.getElementById('kaldik-print-page-style');
      if (el) el.remove();
    }, 1200);
  };

  const leftLegends = kaldik.legends.filter(l => l.column === 'left');
  const rightLegends = kaldik.legends.filter(l => l.column === 'right');
  const maxLegendRows = Math.max(leftLegends.length, rightLegends.length);

  return (
    <div className="space-y-4">
      {/* Category Tab Selector: Kaldik Kelas Tahfizh vs Kaldik Kelas Reguler */}
      <div className="no-print bg-slate-900 p-2 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleSwitchCategory('tahfizh')}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeCategory === 'tahfizh'
                ? 'bg-[#D4AF37] text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kaldik Kelas Tahfizh (Al-Qur&apos;an Metode Ummi)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchCategory('reguler')}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeCategory === 'reguler'
                ? 'bg-[#D4AF37] text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Kaldik Kelas Reguler (Non-Tahfizh / Akademik)</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 px-2 flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] sm:text-xs">
            Mode Aktif: <strong className="text-slate-100">{activeCategory === 'reguler' ? 'Kelas Reguler (Akademik Sekolah)' : 'Kelas Tahfizh (Al-Qur\'an Ummi)'}</strong>
          </span>
        </div>
      </div>

      {/* Top Action Bar */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              {activeCategory === 'reguler'
                ? 'Kalender Pendidikan Kelas Reguler (Non-Tahfizh)'
                : "Kalender Pendidikan Al-Qur'an Metode Ummi (Kaldik Tahfizh)"}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeCategory === 'reguler'
              ? 'Agenda akademik KBM reguler, penilaian ASTS/ASAS/ASAT, libur umum, dan perhitungan pekan & jam efektif reguler.'
              : 'Jadwal hari efektif, agenda munaqosyah & ujian Ummi, libur semester, serta perhitungan pekan & jam efektif tahfizh.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenQuickView && (
            <button
              type="button"
              onClick={onOpenQuickView}
              className="px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-700" />
              <span>Pratinjau Dokumen</span>
            </button>
          )}

          {canEdit && (
            <>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Input / Edit Kaldik</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveKaldik}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan Kaldik</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setKaldik(storageService.getKaldikData(activeCategory));
                      setIsEditing(false);
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                  >
                    Selesai / Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleResetKaldik}
                    className="px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                    title="Kembalikan ke Kaldik Standar"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Standar</span>
                  </button>
                </>
              )}
            </>
          )}

          <button
            type="button"
            onClick={handleExportKaldikExcel}
            className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrintKaldik}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Kaldik</span>
          </button>
        </div>
      </div>

      {saveBanner && (
        <div className="no-print bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* Quick Batch Editor Toolbar when in Edit Mode */}
      {canEdit && isEditing && (
        <div className="no-print bg-amber-50/90 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold text-amber-950">
                Panel Input Cepat Kalender Pendidikan (Mode Guru &amp; Admin)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="font-semibold text-slate-700 flex items-center gap-1 mr-1">
                <Paintbrush className="w-3.5 h-3.5 text-amber-700" />
                Kuas Warna Klik Sel:
              </span>
              {[
                { id: 'keep', label: 'Tetap (Hanya Teks)' },
                { id: 'normal', label: 'Putih Normal' },
                { id: 'sunday_red', label: 'Merah Penuh (Minggu)' },
                { id: 'holiday_text_red', label: 'Teks Merah (Libur)' },
                { id: 'invalid_black', label: 'Hitam (Tgl Kosong)' }
              ].map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setActiveBrushStyle(b.id as any)}
                  className={`px-2 py-1 rounded font-semibold transition cursor-pointer ${
                    activeBrushStyle === b.id
                      ? 'bg-[#1E293B] text-white shadow-2xs'
                      : 'bg-white text-slate-700 border border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-end text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Pilih Bulan</label>
              <select
                value={batchMonthId}
                onChange={e => setBatchMonthId(e.target.value)}
                className="w-full p-2 bg-white border border-amber-300 rounded-lg font-semibold text-xs"
              >
                {kaldik.months.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.monthName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Dari Tgl</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={batchStartDay}
                  onChange={e => setBatchStartDay(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-amber-300 rounded-lg font-semibold text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">S/d Tgl</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={batchEndDay}
                  onChange={e => setBatchEndDay(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-amber-300 rounded-lg font-semibold text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Kode Kegiatan (LS/ASTS/ASAS/LU)
              </label>
              <input
                type="text"
                value={batchText}
                onChange={e => {
                  setBatchText(e.target.value);
                  if (e.target.value) setBatchAutoNumberStart('');
                }}
                placeholder="Misal: ASTS / LS / PUS"
                className="w-full p-2 bg-white border border-amber-300 rounded-lg font-semibold text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Atau Urut Hari Efektif Mulai #
              </label>
              <input
                type="number"
                value={batchAutoNumberStart}
                onChange={e => {
                  setBatchAutoNumberStart(e.target.value);
                  if (e.target.value) setBatchText('');
                }}
                placeholder="Misal: 1 (otomatis 1,2,3..)"
                className="w-full p-2 bg-white border border-amber-300 rounded-lg font-semibold text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Warna / Gaya Sel</label>
              <select
                value={batchStyle}
                onChange={e => setBatchStyle(e.target.value as KaldikCellStyle)}
                className="w-full p-2 bg-white border border-amber-300 rounded-lg font-semibold text-xs"
              >
                <option value="normal">Putih Normal</option>
                <option value="sunday_red">Merah Penuh (Hari Minggu)</option>
                <option value="holiday_text_red">Teks Merah (Libur)</option>
                <option value="invalid_black">Hitam (Tanggal Tidak Ada)</option>
              </select>
            </div>

            <div>
              <button
                type="button"
                onClick={handleApplyBatchRange}
                className="w-full py-2 px-3 bg-[#1E293B] hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs transition cursor-pointer"
              >
                Terapkan ke Rentang
              </button>
            </div>
          </div>
          <p className="text-[11px] text-amber-900">
            Tips: Anda juga dapat langsung mengetik kode/angka di setiap kotak tanggal pada tabel di bawah, atau klik dua kali pada kotak tanggal untuk mengganti warna sel (Putih / Merah Minggu / Teks Merah / Hitam).
          </p>
        </div>
      )}

      {/* MAIN KALDIK SHEET (MATCHING UPLOADED IMAGE IMG_2918.jpeg) */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-300 shadow-xs overflow-x-auto">
        <div className="min-w-[1060px] space-y-4">
          {/* Header Box */}
          <div className="border-2 border-slate-800 p-3 bg-white">
            <div className="text-center space-y-1">
              {isEditing ? (
                <div className="max-w-xl mx-auto space-y-1.5">
                  <input
                    type="text"
                    value={kaldik.title}
                    onChange={e => setKaldik({ ...kaldik, title: e.target.value })}
                    className="w-full text-center font-extrabold text-sm sm:text-base uppercase border border-amber-400 rounded px-2 py-1 bg-amber-50/40"
                  />
                  <input
                    type="text"
                    value={kaldik.schoolName}
                    onChange={e => setKaldik({ ...kaldik, schoolName: e.target.value })}
                    className="w-full text-center font-extrabold text-sm sm:text-base uppercase border border-amber-400 rounded px-2 py-1 bg-amber-50/40"
                  />
                </div>
              ) : (
                <>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-wide uppercase">
                    {kaldik.title}
                  </h3>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-wide uppercase">
                    {kaldik.schoolName}
                  </h4>
                </>
              )}
            </div>

            <div className="mt-2 text-xs font-bold text-slate-900 space-y-0.5">
              {isEditing ? (
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={kaldik.academicYear}
                    onChange={e => setKaldik({ ...kaldik, academicYear: e.target.value })}
                    className="font-bold text-xs border border-amber-400 rounded px-2 py-1 bg-amber-50/40"
                  />
                  <input
                    type="text"
                    value={kaldik.semesterLabel}
                    onChange={e => setKaldik({ ...kaldik, semesterLabel: e.target.value })}
                    className="font-bold text-xs border border-amber-400 rounded px-2 py-1 bg-amber-50/40"
                  />
                </div>
              ) : (
                <>
                  <div>{kaldik.academicYear}</div>
                  <div>{kaldik.semesterLabel}</div>
                </>
              )}
            </div>
          </div>

          {/* 12 Months x 31 Days Grid Table */}
          <table className="w-full border-collapse border-2 border-slate-800 text-[11px]">
            <thead>
              <tr className="bg-[#BDD7EE] text-slate-900 font-extrabold">
                <th rowSpan={2} className="border border-slate-800 px-1.5 py-1 text-center w-8">
                  NO
                </th>
                <th rowSpan={2} className="border border-slate-800 px-2.5 py-1 text-center w-28">
                  BULAN
                </th>
                <th colSpan={31} className="border border-slate-800 py-1 text-center tracking-wider">
                  TANGGAL
                </th>
              </tr>
              <tr className="bg-[#BDD7EE] text-slate-900 font-bold">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <th key={d} className="border border-slate-800 px-0.5 py-1 text-center w-7">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kaldik.months.map((month, mIdx) => (
                <tr key={month.id} className="h-6">
                  <td className="border border-slate-800 text-center font-bold text-slate-900 bg-white">
                    {mIdx + 1}
                  </td>
                  <td className="border border-slate-800 px-2 font-bold text-slate-900 bg-white whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="text"
                        value={month.monthName}
                        onChange={e => {
                          const val = e.target.value;
                          setKaldik(prev => ({
                            ...prev,
                            months: prev.months.map(item =>
                              item.id === month.id ? { ...item, monthName: val } : item
                            )
                          }));
                        }}
                        className="w-full font-bold text-[11px] bg-amber-50/50 border-b border-amber-300 focus:outline-none"
                      />
                    ) : (
                      month.monthName
                    )}
                  </td>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                    const cell = month.days[day] || { text: '', style: 'normal' };
                    const style = cell.style || 'normal';

                    const cellBgClass =
                      style === 'invalid_black'
                        ? 'bg-slate-950 text-white'
                        : style === 'sunday_red'
                        ? 'bg-red-600 text-white font-bold'
                        : style === 'holiday_text_red'
                        ? 'bg-white text-red-600 font-bold'
                        : 'bg-white text-slate-900 font-semibold';

                    return (
                      <td
                        key={day}
                        onDoubleClick={() => handleCellStyleCycle(month.id, day)}
                        title={
                          isEditing
                            ? `Tgl ${day} ${month.monthName}: Ketik untuk isi, klik 2x untuk ganti warna`
                            : `${day} ${month.monthName}: ${cell.text || '-'}`
                        }
                        className={`border border-slate-800 text-center p-0 align-middle transition-colors ${cellBgClass}`}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={style === 'invalid_black' ? '' : cell.text}
                            onChange={e => handleCellTextChange(month.id, day, e.target.value)}
                            className={`w-full h-6 text-center text-[10px] bg-transparent focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                              style === 'sunday_red' || style === 'invalid_black'
                                ? 'text-white font-bold'
                                : style === 'holiday_text_red'
                                ? 'text-red-600 font-bold'
                                : 'text-slate-900 font-semibold'
                            }`}
                          />
                        ) : (
                          <span className="block px-0.5 text-[10px] leading-tight tracking-tighter">
                            {style === 'invalid_black' ? '' : cell.text}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom Section: Keterangan (Left), Signature + Effective Weeks (Right) */}
          <div className="grid grid-cols-12 gap-4 pt-1 items-start">
            {/* Left: Keterangan Legend Table */}
            <div className="col-span-5">
              <table className="w-full border-collapse border-2 border-slate-800 text-[11px]">
                <thead>
                  <tr className="bg-[#BDD7EE]">
                    <th colSpan={6} className="border border-slate-800 px-2 py-1 text-left font-bold text-slate-900">
                      Keterangan :
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: maxLegendRows }, (_, idx) => {
                    const left = leftLegends[idx];
                    const right = rightLegends[idx];
                    return (
                      <tr key={idx} className="h-5">
                        <td className="border border-slate-800 px-1.5 font-bold text-slate-900 w-11">
                          {left ? (
                            isEditing ? (
                              <input
                                type="text"
                                value={left.code}
                                onChange={e => {
                                  const v = e.target.value;
                                  setKaldik(prev => ({
                                    ...prev,
                                    legends: prev.legends.map(l => (l.id === left.id ? { ...l, code: v } : l))
                                  }));
                                }}
                                className="w-full font-bold bg-amber-50/40 text-[10px]"
                              />
                            ) : (
                              left.code
                            )
                          ) : (
                            ''
                          )}
                        </td>
                        <td className="border border-slate-800 px-1 text-center w-4">{left ? ':' : ''}</td>
                        <td className="border border-slate-800 px-1.5 text-slate-900">
                          {left ? (
                            isEditing ? (
                              <input
                                type="text"
                                value={left.description}
                                onChange={e => {
                                  const v = e.target.value;
                                  setKaldik(prev => ({
                                    ...prev,
                                    legends: prev.legends.map(l =>
                                      l.id === left.id ? { ...l, description: v } : l
                                    )
                                  }));
                                }}
                                className="w-full bg-amber-50/40 text-[10px]"
                              />
                            ) : (
                              left.description
                            )
                          ) : (
                            ''
                          )}
                        </td>

                        <td className="border border-slate-800 px-1.5 font-bold text-slate-900 w-12">
                          {right ? (
                            isEditing ? (
                              <input
                                type="text"
                                value={right.code}
                                onChange={e => {
                                  const v = e.target.value;
                                  setKaldik(prev => ({
                                    ...prev,
                                    legends: prev.legends.map(l => (l.id === right.id ? { ...l, code: v } : l))
                                  }));
                                }}
                                className="w-full font-bold bg-amber-50/40 text-[10px]"
                              />
                            ) : (
                              right.code
                            )
                          ) : (
                            ''
                          )}
                        </td>
                        <td className="border border-slate-800 px-1 text-center w-4">{right ? ':' : ''}</td>
                        <td className="border border-slate-800 px-1.5 text-slate-900">
                          {right ? (
                            isEditing ? (
                              <input
                                type="text"
                                value={right.description}
                                onChange={e => {
                                  const v = e.target.value;
                                  setKaldik(prev => ({
                                    ...prev,
                                    legends: prev.legends.map(l =>
                                      l.id === right.id ? { ...l, description: v } : l
                                    )
                                  }));
                                }}
                                className="w-full bg-amber-50/40 text-[10px]"
                              />
                            ) : (
                              right.description
                            )
                          ) : (
                            ''
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Right: Effective Days & Hours Calculation Tables (Semester 1 & Semester 2) */}
            <div className="col-span-7 space-y-3">
              {/* Semester 1: Perhitungan Hari & Jam Efektif */}
              <div>
                <div className="text-[11px] font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    <span>Perhitungan Hari &amp; {activeCategory === 'reguler' ? 'Tatap Muka (2 TM/Pekan)' : 'Jam'} Efektif — Semester 1 (Gasal)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">Tahun Ajaran {kaldik.academicYear}</span>
                </div>
                <table className="w-full border-collapse border-2 border-slate-800 text-[10px]">
                  <thead>
                    <tr className="bg-[#BDD7EE] text-slate-900 font-bold">
                      <th rowSpan={2} className="border border-slate-800 px-1.5 py-0.5 text-left">
                        Semester 1
                      </th>
                      <th colSpan={5} className="border border-slate-800 px-1 py-0.5 text-center">
                        Pekan ke- (Hari)
                      </th>
                      <th rowSpan={2} className="border border-slate-800 px-1 py-0.5 text-center leading-tight">
                        Jml Hari
                        <br />
                        Efektif
                      </th>
                      <th rowSpan={2} className="border border-slate-800 px-1 py-0.5 text-center leading-tight">
                        Jml Pekan
                        <br />
                        Efektif
                      </th>
                      <th colSpan={5} className="border border-slate-800 px-1 py-0.5 text-center">
                        Pekan ke- ({activeCategory === 'reguler' ? 'TM: 2 TM/Pekan' : 'Jam'})
                      </th>
                      <th rowSpan={2} className="border border-slate-800 px-1 py-0.5 text-center leading-tight">
                        {activeCategory === 'reguler' ? 'Jml TM' : 'Jml Jam'}
                        <br />
                        Efektif
                      </th>
                      <th rowSpan={2} className="border border-slate-800 px-1 py-0.5 text-center leading-tight">
                        Jml Pekan
                        <br />
                        Efektif
                      </th>
                    </tr>
                    <tr className="bg-[#BDD7EE] text-slate-900 font-bold">
                      {[1, 2, 3, 4, 5].map(w => (
                        <th key={`d-${w}`} className="border border-slate-800 px-1 py-0.5 text-center w-5">
                          {w}
                        </th>
                      ))}
                      {[1, 2, 3, 4, 5].map(w => (
                        <th key={`j-${w}`} className="border border-slate-800 px-1 py-0.5 text-center w-5">
                          {w}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kaldik.semester1Effective.map((row, rIdx) => {
                      const validDays = row.weeks.filter((w): w is number => typeof w === 'number' && w > 0);
                      const sumDays = validDays.reduce((a, b) => a + b, 0);
                      const countWeeks = validDays.length;

                      const jamList = row.jamWeeks || [null, null, null, null, null];
                      const validJam = jamList.filter((w): w is number => typeof w === 'number' && w > 0);
                      const sumJam = validJam.reduce((a, b) => a + b, 0);
                      const countJamWeeks = validJam.length;

                      return (
                        <tr key={row.monthName} className="h-5">
                          <td className="border border-slate-800 px-1.5 font-semibold text-slate-900">
                            {row.monthName}
                          </td>
                          {[0, 1, 2, 3, 4].map(wIdx => (
                            <td key={`sd-${wIdx}`} className="border border-slate-800 text-center p-0">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={row.weeks[wIdx] ?? ''}
                                  onChange={e =>
                                    handleEffectiveWeekChange(1, rIdx, wIdx, e.target.value, false)
                                  }
                                  className="w-full text-center bg-amber-50/40 text-[10px]"
                                />
                              ) : (
                                row.weeks[wIdx] ?? '-'
                              )}
                            </td>
                          ))}
                          <td className="border border-slate-800 text-center font-bold bg-slate-50">
                            {sumDays}
                          </td>
                          <td className="border border-slate-800 text-center font-bold bg-slate-50">
                            {countWeeks}
                          </td>

                          {[0, 1, 2, 3, 4].map(wIdx => (
                            <td key={`sj-${wIdx}`} className="border border-slate-800 text-center p-0">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={jamList[wIdx] ?? ''}
                                  onChange={e =>
                                    handleEffectiveWeekChange(1, rIdx, wIdx, e.target.value, true)
                                  }
                                  className="w-full text-center bg-amber-50/40 text-[10px]"
                                />
                              ) : (
                                jamList[wIdx] ?? '-'
                              )}
                            </td>
                          ))}
                          <td className="border border-slate-800 text-center font-bold bg-slate-50">
                            {sumJam}
                          </td>
                          <td className="border border-slate-800 text-center font-bold bg-slate-50">
                            {countJamWeeks}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-[#BDD7EE] font-extrabold text-slate-900 h-5">
                      <td colSpan={6} className="border border-slate-800 text-center">
                        Total Semester 1
                      </td>
                      <td className="border border-slate-800 text-center">{sem1Stats.totalDays} Hari</td>
                      <td className="border border-slate-800 text-center">{sem1Stats.totalWeeks} Pekan</td>
                      <td colSpan={5} className="border border-slate-800 text-center">
                        Total
                      </td>
                      <td className="border border-slate-800 text-center">{sem1Stats.totalJam} {activeCategory === 'reguler' ? 'TM' : 'Jam'}</td>
                      <td className="border border-slate-800 text-center">{sem1Stats.totalJamWeeks} Pekan</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Semester 2: Perhitungan Hari & Jam Efektif (Matches Exactly Semester 1 Width & Structure) */}
              <div>
                <div className="text-[11px] font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                    <span>Perhitungan Hari &amp; {activeCategory === 'reguler' ? 'Tatap Muka (2 TM/Pekan)' : 'Jam'} Efektif — Semester 2 (Genap)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">Tahun Ajaran {kaldik.academicYear}</span>
                </div>
                <table className="w-full border-collapse border-2 border-slate-800 text-[10px]">
                  <thead>
                    <tr className="bg-[#BDD7EE] text-slate-900 font-bold">
                      <th rowSpan={2} className="border border-slate-800 px-1.5 py-0.5 text-left">
                        Semester 2
                      </th>
                      <th colSpan={5} className="border border-slate-800 px-1 py-0.5 text-center">
                        Pekan ke- (Hari)
                      </th>
                      <th rowSpan={2} className="border border-slate-800 px-1 py-0.5 text-center leading-tight">
                        Jml Hari
                        <br />
                        Efektif
                      </th>
                      <th rowSpan={2} className="border border-slate-800 px-1 py-0.5 text-center leading-tight">
                        Jml Pekan
                        <br />
                        Efektif
                      </th>
                      <th colSpan={5} className="border border-slate-800 px-1 py-0.5 text-center">
                        Pekan ke- ({activeCategory === 'reguler' ? 'TM: 2 TM/Pekan' : 'Jam'})
                      </th>
                      <th rowSpan={2} className="border border-slate-800 px-1 py-0.5 text-center leading-tight">
                        {activeCategory === 'reguler' ? 'Jml TM' : 'Jml Jam'}
                        <br />
                        Efektif
                      </th>
                      <th rowSpan={2} className="border border-slate-800 px-1 py-0.5 text-center leading-tight">
                        Jml Pekan
                        <br />
                        Efektif
                      </th>
                    </tr>
                    <tr className="bg-[#BDD7EE] text-slate-900 font-bold">
                      {[1, 2, 3, 4, 5].map(w => (
                        <th key={`d2-${w}`} className="border border-slate-800 px-1 py-0.5 text-center w-5">
                          {w}
                        </th>
                      ))}
                      {[1, 2, 3, 4, 5].map(w => (
                        <th key={`j2-${w}`} className="border border-slate-800 px-1 py-0.5 text-center w-5">
                          {w}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kaldik.semester2Effective.map((row, rIdx) => {
                      const validDays = row.weeks.filter((w): w is number => typeof w === 'number' && w > 0);
                      const sumDays = validDays.reduce((a, b) => a + b, 0);
                      const countWeeks = validDays.length;

                      const jamList = row.jamWeeks || [null, null, null, null, null];
                      const validJam = jamList.filter((w): w is number => typeof w === 'number' && w > 0);
                      const sumJam = validJam.reduce((a, b) => a + b, 0);
                      const countJamWeeks = validJam.length;

                      return (
                        <tr key={row.monthName} className="h-5">
                          <td className="border border-slate-800 px-1.5 font-semibold text-slate-900">
                            {row.monthName}
                          </td>
                          {[0, 1, 2, 3, 4].map(wIdx => (
                            <td key={`sd2-${wIdx}`} className="border border-slate-800 text-center p-0">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={row.weeks[wIdx] ?? ''}
                                  onChange={e =>
                                    handleEffectiveWeekChange(2, rIdx, wIdx, e.target.value, false)
                                  }
                                  className="w-full text-center bg-amber-50/40 text-[10px]"
                                />
                              ) : (
                                row.weeks[wIdx] ?? '-'
                              )}
                            </td>
                          ))}
                          <td className="border border-slate-800 text-center font-bold bg-slate-50">
                            {sumDays}
                          </td>
                          <td className="border border-slate-800 text-center font-bold bg-slate-50">
                            {countWeeks}
                          </td>

                          {[0, 1, 2, 3, 4].map(wIdx => (
                            <td key={`sj2-${wIdx}`} className="border border-slate-800 text-center p-0">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={jamList[wIdx] ?? ''}
                                  onChange={e =>
                                    handleEffectiveWeekChange(2, rIdx, wIdx, e.target.value, true)
                                  }
                                  className="w-full text-center bg-amber-50/40 text-[10px]"
                                />
                              ) : (
                                jamList[wIdx] ?? '-'
                              )}
                            </td>
                          ))}
                          <td className="border border-slate-800 text-center font-bold bg-slate-50">
                            {sumJam}
                          </td>
                          <td className="border border-slate-800 text-center font-bold bg-slate-50">
                            {countJamWeeks}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-[#BDD7EE] font-extrabold text-slate-900 h-5">
                      <td colSpan={6} className="border border-slate-800 text-center">
                        Total Semester 2
                      </td>
                      <td className="border border-slate-800 text-center">{sem2Stats.totalDays} Hari</td>
                      <td className="border border-slate-800 text-center">{sem2Stats.totalWeeks} Pekan</td>
                      <td colSpan={5} className="border border-slate-800 text-center">
                        Total
                      </td>
                      <td className="border border-slate-800 text-center">{sem2Stats.totalJam} {activeCategory === 'reguler' ? 'TM' : 'Jam'}</td>
                      <td className="border border-slate-800 text-center">{sem2Stats.totalJamWeeks} Pekan</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Annual Accumulation Summary Bar */}
              <div className="bg-[#EBF3FB] border-2 border-slate-800 rounded p-2 text-xs font-bold text-slate-900 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Total Efektif Tahun Ajaran ({kaldik.academicYear}):</span>
                </span>
                <div className="flex flex-wrap items-center gap-3 text-slate-900">
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-300 font-extrabold">
                    {yearlyStats.totalDays} Hari Efektif
                  </span>
                  <span>•</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-300 font-extrabold">
                    {yearlyStats.totalWeeks} Pekan Efektif
                  </span>
                  <span>•</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-300 font-extrabold">
                    {yearlyStats.totalJam} {activeCategory === 'reguler' ? 'Tatap Muka (TM)' : 'Jam Pelajaran'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SIGNATURE SECTION (Proporsional & Sejajar di Bawah Tabel Kaldik) */}
          <div className="pt-4 border-t-2 border-slate-800 mt-3">
            <div className="grid grid-cols-2 gap-8 text-xs text-slate-900">
              {/* Left Signature: Kepala Sekolah */}
              <div className="text-center space-y-1">
                <div>Mengetahui,</div>
                {isEditing ? (
                  <div className="space-y-1 max-w-xs mx-auto">
                    <input
                      type="text"
                      value={kaldik.signHeadmasterTitle || 'Kepala SMP Islam Al Azhar 21'}
                      onChange={e => setKaldik({ ...kaldik, signHeadmasterTitle: e.target.value })}
                      placeholder="Jabatan Kepala Sekolah"
                      className="w-full text-center border border-amber-400 rounded px-1.5 py-0.5 text-xs font-bold bg-amber-50/40"
                    />
                    <div className="h-12" />
                    <input
                      type="text"
                      value={kaldik.signHeadmasterName || 'Muh Saifuddin, S.Si.'}
                      onChange={e => setKaldik({ ...kaldik, signHeadmasterName: e.target.value })}
                      placeholder="Nama Kepala Sekolah"
                      className="w-full text-center border border-amber-400 rounded px-1.5 py-0.5 text-xs font-bold bg-amber-50/40"
                    />
                  </div>
                ) : (
                  <>
                    <div className="font-bold">{kaldik.signHeadmasterTitle || 'Kepala SMP Islam Al Azhar 21'}</div>
                    <div className="h-14 sm:h-16" />
                    <div className="font-bold underline text-sm tracking-wide">
                      {kaldik.signHeadmasterName || 'Muh Saifuddin, S.Si.'}
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium">NIK. 01.0125</div>
                  </>
                )}
              </div>

              {/* Right Signature: Koordinator / Waka Kurikulum */}
              <div className="text-center space-y-1">
                {isEditing ? (
                  <div className="space-y-1 max-w-xs mx-auto">
                    <input
                      type="text"
                      value={kaldik.signPlaceDate}
                      onChange={e => setKaldik({ ...kaldik, signPlaceDate: e.target.value })}
                      placeholder="Tempat, Tanggal Titimangsa"
                      className="w-full text-center border border-amber-400 rounded px-1.5 py-0.5 text-xs bg-amber-50/40"
                    />
                    <input
                      type="text"
                      value={kaldik.signRoleTitle}
                      onChange={e => setKaldik({ ...kaldik, signRoleTitle: e.target.value })}
                      placeholder="Jabatan Penanggung Jawab"
                      className="w-full text-center border border-amber-400 rounded px-1.5 py-0.5 text-xs font-bold bg-amber-50/40"
                    />
                    <div className="h-12" />
                    <input
                      type="text"
                      value={kaldik.signCoordinatorName}
                      onChange={e => setKaldik({ ...kaldik, signCoordinatorName: e.target.value })}
                      placeholder="Nama Pejabat Penandatangan"
                      className="w-full text-center border border-amber-400 rounded px-1.5 py-0.5 text-xs font-bold bg-amber-50/40"
                    />
                  </div>
                ) : (
                  <>
                    <div>{kaldik.signPlaceDate}</div>
                    <div className="font-bold">{kaldik.signRoleTitle || 'Koordinator Tahfizh'}</div>
                    <div className="h-14 sm:h-16" />
                    <div className="font-bold underline text-sm tracking-wide">
                      {kaldik.signCoordinatorName || 'Ustadz Muhammad Yusrie Alfian, S.Ag.'}
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium">NIK. 04.0413</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProsemSectionProps {
  userRole: Role;
  currentUser?: User;
  currentTeacher?: Teacher;
  teachers?: Teacher[];
  halaqahGroups?: HalaqahGroup[];
  onOpenQuickView?: (sheetId?: string) => void;
  isDirectEdit?: boolean;
  selectedSheetIdProp?: string;
}

export const ProsemSection: React.FC<ProsemSectionProps> = ({
  userRole,
  currentUser,
  currentTeacher,
  teachers,
  halaqahGroups,
  onOpenQuickView,
  isDirectEdit = false,
  selectedSheetIdProp
}) => {
  const canEdit = userRole === 'admin' || userRole === 'guru';
  const [sheets, setSheets] = useState<ProsemSheet[]>(() => storageService.getProsemSheets());
  const [activeSheetId, setActiveSheetId] = useState<string>(
    () => selectedSheetIdProp || sheets[0]?.id || 'prosem-sem1-jilid1'
  );
  const [isEditing, setIsEditing] = useState<boolean>(isDirectEdit);

  useEffect(() => {
    if (isDirectEdit) {
      setIsEditing(true);
    }
  }, [isDirectEdit]);

  useEffect(() => {
    if (selectedSheetIdProp) {
      setActiveSheetId(selectedSheetIdProp);
    }
  }, [selectedSheetIdProp]);

  // Halaqahs & Teachers for filters and modals
  const allHalaqahs = useMemo(() => {
    const list = halaqahGroups && halaqahGroups.length > 0 ? halaqahGroups : storageService.getHalaqahGroups();
    return list;
  }, [halaqahGroups]);

  const allTeachers = useMemo(() => {
    const list = teachers && teachers.length > 0 ? teachers : storageService.getTeachers();
    return list;
  }, [teachers]);

  // Filters state: halaqah, jilid, musyrif, semester
  const [filterHalaqah, setFilterHalaqah] = useState<string>('all');
  const [filterJilid, setFilterJilid] = useState<string>('all');
  const [filterMusyrif, setFilterMusyrif] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');

  // Filtered sheets according to halaqah, jilid, musyrif, semester
  const filteredSheets = useMemo(() => {
    return sheets.filter(s => {
      // Halaqah filter
      if (filterHalaqah !== 'all') {
        const matchesHalaqah =
          s.halaqahId === filterHalaqah ||
          (s.halaqahName && s.halaqahName.toLowerCase().includes(filterHalaqah.toLowerCase()));
        if (!matchesHalaqah) return false;
      }
      // Jilid filter
      if (filterJilid !== 'all') {
        const matchesJilid =
          s.jilidLabel.toLowerCase().trim() === filterJilid.toLowerCase().trim();
        if (!matchesJilid) return false;
      }
      // Musyrif filter
      if (filterMusyrif !== 'all') {
        const matchesMusyrif =
          s.musyrifId === filterMusyrif ||
          (s.musyrifName && s.musyrifName.toLowerCase().includes(filterMusyrif.toLowerCase()));
        if (!matchesMusyrif) return false;
      }
      // Semester filter
      if (filterSemester !== 'all') {
        if (s.semester !== filterSemester) return false;
      }
      return true;
    });
  }, [sheets, filterHalaqah, filterJilid, filterMusyrif, filterSemester]);

  const activeSheet = useMemo(
    () => filteredSheets.find(s => s.id === activeSheetId) || filteredSheets[0] || sheets[0],
    [filteredSheets, activeSheetId, sheets]
  );

  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [showNewSheetModal, setShowNewSheetModal] = useState<boolean>(false);
  const [newSheetForm, setNewSheetForm] = useState<{
    semester: 'Semester I' | 'Semester II';
    jilidLabel: string;
    halaqahId: string;
    halaqahName: string;
    musyrifId: string;
    musyrifName: string;
  }>({
    semester: 'Semester I',
    jilidLabel: 'Jilid 1',
    halaqahId: allHalaqahs[0]?.id || 'hlq-1',
    halaqahName: allHalaqahs[0]?.name || 'Halaqah 1 (Umar bin Khattab)',
    musyrifId: allHalaqahs[0]?.teacherId || allTeachers[0]?.id || 't-1',
    musyrifName: allHalaqahs[0]?.teacherName || allTeachers[0]?.name || 'Ustadz Ahmad Fauzan, Lc.'
  });

  const showSavedMessage = (msg: string) => {
    setSaveBanner(msg);
    setTimeout(() => setSaveBanner(null), 3500);
  };

  const updateActiveSheet = (updater: (sheet: ProsemSheet) => ProsemSheet) => {
    if (!activeSheet) return;
    setSheets(prev => prev.map(s => (s.id === activeSheet.id ? updater(s) : s)));
  };

  const handleSaveAllSheets = () => {
    storageService.saveProsemSheets(sheets);
    setIsEditing(false);
    showSavedMessage('Program Semester (Prosem) berhasil disimpan.');
  };

  const handleResetProsem = () => {
    const fresh = storageService.resetProsemSheets();
    setSheets(fresh);
    setActiveSheetId(fresh[0]?.id || 'prosem-sem1-jilid1');
    showSavedMessage('Program Semester dikembalikan ke data standar.');
  };

  const handleAddRow = () => {
    if (!activeSheet) return;
    updateActiveSheet(sheet => {
      const nextNo = sheet.rows.length + 1;
      const newRow: ProsemRow = {
        id: `pr-${Date.now()}`,
        no: nextNo,
        jilid: sheet.jilidLabel.replace(/[^0-9]/g, '') || '1',
        hlmPeraga: '',
        hlmBuku: '',
        targetHafalanSurat: '',
        drillHafalanSurat: '',
        tm: 2,
        weekValues: {},
        keterangan: ''
      };
      return { ...sheet, rows: [...sheet.rows, newRow] };
    });
  };

  const handleDeleteRow = (rowId: string) => {
    if (!activeSheet) return;
    updateActiveSheet(sheet => {
      const filtered = sheet.rows
        .filter(r => r.id !== rowId)
        .map((r, idx) => ({ ...r, no: idx + 1 }));
      return { ...sheet, rows: filtered };
    });
  };

  const handleCreateNewSheet = (e: React.FormEvent) => {
    e.preventDefault();
    const isSem1 = newSheetForm.semester === 'Semester I';
    const newId = `prosem-${Date.now()}`;
    const newSheet: ProsemSheet = {
      id: newId,
      semester: newSheetForm.semester,
      jilidLabel: newSheetForm.jilidLabel || 'Jilid 1',
      title: `PROGRAM ${newSheetForm.semester.toUpperCase()} PEMBELAJARAN AL QUR'AN METODE UMMI`,
      lembaga: 'SMP ISLAM AL AZHAR 21 SOLO BARU',
      halaqahId: newSheetForm.halaqahId,
      halaqahName: newSheetForm.halaqahName,
      musyrifId: newSheetForm.musyrifId,
      musyrifName: newSheetForm.musyrifName,
      monthNames: isSem1
        ? ['Juli', 'Agustus', 'September', 'Oktober', 'Nopember', 'Desember']
        : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'],
      headerTatapMuka: {},
      headerTatapMukaHighlighted: {
        '0_4': true, '0_5': true,
        '1_1': true, '1_2': true, '1_3': true, '1_4': true,
        '2_1': true, '2_2': true, '2_3': true,
        '3_2': true, '3_3': true, '3_4': true, '3_5': true,
        '4_1': true, '4_2': true, '4_3': true, '4_4': true
      },
      rows: Array.from({ length: 16 }, (_, idx) => ({
        id: `pr-${newId}-${idx + 1}`,
        no: idx + 1,
        jilid: idx === 0 ? '' : newSheetForm.jilidLabel.replace(/[^0-9]/g, '') || '1',
        hlmPeraga: idx === 0 ? `Orientasi ${newSheetForm.semester}` : '',
        hlmBuku: '',
        targetHafalanSurat: '',
        drillHafalanSurat: '',
        tm: idx === 0 ? '' : 2,
        weekValues: {},
        keterangan: ''
      })),
      ujianKenaikanJilidTM: '',
      ujianKenaikanJilidWeeks: {},
      ujianKenaikanJilidKeterangan: '',
      totalPertemuanOverride: 26,
      signPlaceDate: isSem1 ? 'Sukoharjo, 14 Juli 2026' : 'Sukoharjo, 05 Januari 2027',
      signRoleTitle: "Koordinator Al Qur'an",
      signCoordinatorName: '(Muh. Yusrie Alfian, S.Ag)',
      signMusyrifTitle: 'Guru / Musyrif Halaqah',
      signMusyrifName: `(${newSheetForm.musyrifName || 'Ustadz Pembimbing'})`
    };

    const updated = [...sheets, newSheet];
    setSheets(updated);
    storageService.saveProsemSheets(updated);
    setActiveSheetId(newId);
    setShowNewSheetModal(false);
    setIsEditing(true);
    showSavedMessage(
      `Tabel Prosem ${newSheet.semester} (${newSheet.jilidLabel}) untuk ${newSheet.halaqahName} berhasil dibuat.`
    );
  };

  // Calculate Total Pertemuan from rows or headerTatapMuka
  const calculatedTotalPertemuan = useMemo(() => {
    if (!activeSheet) return 0;
    if (
      activeSheet.totalPertemuanOverride !== undefined &&
      String(activeSheet.totalPertemuanOverride).trim() !== ''
    ) {
      return activeSheet.totalPertemuanOverride;
    }
    let sum = 0;
    activeSheet.rows.forEach(r => {
      const n = Number(r.tm);
      if (!isNaN(n) && n > 0) sum += n;
    });
    return sum;
  }, [activeSheet]);

  const handleExportProsemExcel = () => {
    if (!activeSheet) return;
    const wb = XLSX.utils.book_new();
    const weekHeaders: string[] = [];
    activeSheet.monthNames.forEach(m => {
      for (let w = 1; w <= 5; w++) {
        weekHeaders.push(`${m} P${w}`);
      }
    });

    const aoa: (string | number)[][] = [
      [activeSheet.title],
      [`LEMBAGA : ${activeSheet.lembaga}`],
      [`HALAQAH : ${activeSheet.halaqahName || '-'} • GURU / MUSYRIF : ${activeSheet.musyrifName || '-'}`],
      [`SEMESTER : ${activeSheet.semester} - JENJANG : ${activeSheet.jilidLabel}`],
      [],
      [
        'NO',
        'Jilid',
        'Hlm. Peraga',
        'Hlm. Buku',
        'Target Hafalan Surat',
        'Drill Hafalan Surat',
        'TM',
        ...weekHeaders,
        'KET'
      ]
    ];

    // Row Jumlah Tatap Muka
    const tmHeaderRow: (string | number)[] = ['Jumlah Tatap Muka', '', '', '', '', '', ''];
    for (let m = 0; m < 6; m++) {
      for (let w = 1; w <= 5; w++) {
        tmHeaderRow.push(activeSheet.headerTatapMuka[`${m}_${w}`] ?? '');
      }
    }
    tmHeaderRow.push('');
    aoa.push(tmHeaderRow);

    activeSheet.rows.forEach(r => {
      const rowArr: (string | number)[] = [
        r.no,
        r.jilid,
        r.hlmPeraga,
        r.hlmBuku,
        r.targetHafalanSurat,
        r.drillHafalanSurat,
        r.tm
      ];
      for (let m = 0; m < 6; m++) {
        for (let w = 1; w <= 5; w++) {
          rowArr.push(r.weekValues[`${m}_${w}`] ?? '');
        }
      }
      rowArr.push(r.keterangan || '');
      aoa.push(rowArr);
    });

    aoa.push(['Ujian Kenaikan Jilid', '', '', '', '', '', activeSheet.ujianKenaikanJilidTM || '']);
    aoa.push(['Total Pertemuan', '', '', '', '', '', calculatedTotalPertemuan]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, `${activeSheet.semester} ${activeSheet.jilidLabel}`.slice(0, 30));
    XLSX.writeFile(
      wb,
      `Prosem_Ummi_${(activeSheet.halaqahName || 'Halaqah').replace(/\s+/g, '_')}_${activeSheet.jilidLabel.replace(/\s+/g, '_')}.xlsx`
    );
  };

  const isTeacherRole = userRole === 'guru';
  const hasActiveFilters =
    filterHalaqah !== 'all' ||
    filterJilid !== 'all' ||
    filterMusyrif !== 'all' ||
    filterSemester !== 'all';

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Table2 className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Program Semester (Prosem) Per Halaqah Al-Qur&apos;an Metode Ummi
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dikelola dan diinput oleh masing-masing Guru Tahfizh Halaqah. Lengkap dengan filter Halaqah, Jilid, Musyrif, dan Semester.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenQuickView && (
            <button
              type="button"
              onClick={() => onOpenQuickView(activeSheet?.id)}
              className="px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-700" />
              <span>Pratinjau Dokumen</span>
            </button>
          )}

          {canEdit && (
            <>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Input / Edit Prosem</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveAllSheets}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan Prosem</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSheets(storageService.getProsemSheets());
                      setIsEditing(false);
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                  >
                    Selesai / Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleResetProsem}
                    className="px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Standar</span>
                  </button>
                </>
              )}
            </>
          )}

          <button
            type="button"
            onClick={handleExportProsemExcel}
            className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Prosem</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR: HALAQAH, JILID, MUSYRIF, SEMESTER */}
      <div className="no-print bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-bold text-slate-800">
              Filter Lembar Prosem (Halaqah, Jilid, Musyrif, Semester)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isTeacherRole && currentTeacher && (
              <button
                type="button"
                onClick={() => {
                  setFilterMusyrif(currentTeacher.id);
                  setFilterHalaqah('all');
                }}
                className="text-[11px] font-bold text-amber-900 bg-amber-100/70 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1"
              >
                <UserCheck className="w-3 h-3 text-amber-800" />
                <span>Halaqah Saya ({currentTeacher.name.split(' ')[0]})</span>
              </button>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setFilterHalaqah('all');
                  setFilterJilid('all');
                  setFilterMusyrif('all');
                  setFilterSemester('all');
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* 1. Filter Halaqah */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Halaqah</label>
            <select
              value={filterHalaqah}
              onChange={e => setFilterHalaqah(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            >
              <option value="all">Semua Halaqah</option>
              {allHalaqahs.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Filter Jilid */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Jilid / Jenjang</label>
            <select
              value={filterJilid}
              onChange={e => setFilterJilid(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            >
              <option value="all">Semua Jilid / Jenjang</option>
              {['Jilid 1', 'Jilid 2', 'Jilid 3', 'Jilid 4', 'Jilid 5', 'Jilid 6', 'Al-Qur\'an', 'Tahfizh', 'Gharib', 'Tajwid'].map(j => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filter Musyrif */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Musyrif / Guru Tahfizh</label>
            <select
              value={filterMusyrif}
              onChange={e => setFilterMusyrif(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            >
              <option value="all">Semua Musyrif</option>
              {allTeachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Filter Semester */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Semester</label>
            <select
              value={filterSemester}
              onChange={e => setFilterSemester(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            >
              <option value="all">Semua Semester (I &amp; II)</option>
              <option value="Semester I">Semester I (Juli - Des)</option>
              <option value="Semester II">Semester II (Jan - Jun)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sheet Selector Tabs */}
      <div className="no-print bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
            Lembar Terpilih ({filteredSheets.length}):
          </span>
          {filteredSheets.map(s => {
            const isTabActive = activeSheet?.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSheetId(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  isTabActive
                    ? 'bg-[#1E293B] text-white font-bold shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{s.semester} • {s.jilidLabel}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                  isTabActive ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-200 text-slate-600'
                }`}>
                  {s.halaqahName?.split('(')[0] || 'Halaqah'}
                </span>
              </button>
            );
          })}

          {filteredSheets.length === 0 && (
            <span className="text-xs text-slate-400 italic">
              Tidak ada lembar Prosem yang sesuai filter.
            </span>
          )}
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => {
              if (allHalaqahs.length > 0) {
                const defaultHlq = allHalaqahs[0];
                setNewSheetForm({
                  semester: 'Semester I',
                  jilidLabel: 'Jilid 1',
                  halaqahId: defaultHlq.id,
                  halaqahName: defaultHlq.name,
                  musyrifId: defaultHlq.teacherId || allTeachers[0]?.id || 't-1',
                  musyrifName: defaultHlq.teacherName || allTeachers[0]?.name || 'Ustadz Pembimbing'
                });
              }
              setShowNewSheetModal(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Buat Prosem Halaqah Baru</span>
          </button>
        )}
      </div>

      {saveBanner && (
        <div className="no-print bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* When no sheet matches filters */}
      {filteredSheets.length === 0 && (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <Table2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">
            Tidak Ada Lembar Prosem Sesuai Kriteria Filter
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Belum ada Program Semester untuk Halaqah atau Musyrif yang dipilih. Silakan buat lembar Prosem baru untuk halaqah ini atau klik reset filter.
          </p>
          <div className="flex justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setFilterHalaqah('all');
                setFilterJilid('all');
                setFilterMusyrif('all');
                setFilterSemester('all');
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
            >
              Reset Filter
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => setShowNewSheetModal(true)}
                className="px-4 py-1.5 bg-[#1E293B] text-white font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Buat Prosem untuk Halaqah Ini</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* MAIN PROSEM SHEET (MATCHING UPLOADED IMAGE IMG_2917.jpeg) */}
      {activeSheet && (
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-300 shadow-xs overflow-x-auto">
          <div className="min-w-[1180px] space-y-3">
            {/* Title & Lembaga Header */}
            <div className="space-y-1">
              <div className="text-center">
                {isEditing ? (
                  <input
                    type="text"
                    value={activeSheet.title}
                    onChange={e => updateActiveSheet(s => ({ ...s, title: e.target.value }))}
                    className="w-full max-w-2xl mx-auto text-center font-extrabold text-sm sm:text-base uppercase border border-amber-400 rounded px-2 py-1 bg-amber-50/40"
                  />
                ) : (
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-wide uppercase">
                    {activeSheet.title}
                  </h3>
                )}
              </div>

              {/* HALAQAH, MUSYRIF, LEMBAGA, AND JILID INFO BOX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-300">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-24 text-slate-500">LEMBAGA:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={activeSheet.lembaga}
                        onChange={e => updateActiveSheet(s => ({ ...s, lembaga: e.target.value }))}
                        className="font-extrabold text-xs uppercase border border-amber-400 rounded px-2 py-0.5 bg-amber-50/40 flex-1"
                      />
                    ) : (
                      <span className="font-extrabold">{activeSheet.lembaga}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-24 text-slate-500">HALAQAH:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={activeSheet.halaqahName || ''}
                        onChange={e => updateActiveSheet(s => ({ ...s, halaqahName: e.target.value }))}
                        className="font-extrabold text-xs text-blue-900 border border-amber-400 rounded px-2 py-0.5 bg-amber-50/40 flex-1"
                      />
                    ) : (
                      <span className="font-extrabold text-blue-900">
                        {activeSheet.halaqahName || 'Halaqah 1 (Umar bin Khattab)'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-24 text-slate-500">GURU/MUSYRIF:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={activeSheet.musyrifName || ''}
                        onChange={e => updateActiveSheet(s => ({ ...s, musyrifName: e.target.value }))}
                        className="font-extrabold text-xs text-emerald-900 border border-amber-400 rounded px-2 py-0.5 bg-amber-50/40 flex-1"
                      />
                    ) : (
                      <span className="font-extrabold text-emerald-900">
                        {activeSheet.musyrifName || 'Ustadz Ahmad Fauzan, Lc.'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-24 text-slate-500">SEMESTER / JILID:</span>
                    <span className="font-extrabold text-amber-900">
                      {activeSheet.semester} • {activeSheet.jilidLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prosem Table */}
            <table className="w-full border-collapse border-2 border-slate-800 text-[11px]">
              <thead>
                {/* Header Row 1 */}
                <tr className="bg-[#A9D08E] text-slate-900 font-extrabold">
                  <th rowSpan={3} className="border border-slate-800 px-1.5 py-1 text-center w-8">
                    NO
                  </th>
                  <th colSpan={5} className="border border-slate-800 py-1 text-center">
                    MATERI
                  </th>
                  <th rowSpan={3} className="border border-slate-800 px-1.5 py-1 text-center w-9">
                    TM
                  </th>
                  <th colSpan={30} className="border border-slate-800 py-1 text-center tracking-wide">
                    BULAN DAN PEKAN
                  </th>
                  <th rowSpan={3} className="border border-slate-800 px-2 py-1 text-center w-16">
                    KET
                  </th>
                  {isEditing && (
                    <th rowSpan={4} className="no-print border border-slate-800 px-1 py-1 text-center w-8 bg-amber-100">
                      Aksi
                    </th>
                  )}
                </tr>

                {/* Header Row 2 */}
                <tr className="bg-[#A9D08E] text-slate-900 font-bold">
                  <th rowSpan={2} className="border border-slate-800 px-1.5 py-1 text-center w-11">
                    Jilid
                  </th>
                  <th rowSpan={2} className="border border-slate-800 px-2 py-1 text-center w-20 leading-tight">
                    Hlm.
                    <br />
                    Peraga
                  </th>
                  <th rowSpan={2} className="border border-slate-800 px-2 py-1 text-center w-16 leading-tight">
                    Hlm.
                    <br />
                    Buku
                  </th>
                  <th rowSpan={2} className="border border-slate-800 px-2 py-1 text-center w-32 leading-tight">
                    Target Hafalan
                    <br />
                    Surat
                  </th>
                  <th rowSpan={2} className="border border-slate-800 px-2 py-1 text-center w-32 leading-tight">
                    Drill Hafalan
                    <br />
                    Surat
                  </th>
                  {activeSheet.monthNames.map((mName, mIdx) => (
                    <th key={mIdx} colSpan={5} className="border border-slate-800 py-1 text-center">
                      {isEditing ? (
                        <input
                          type="text"
                          value={mName}
                          onChange={e => {
                            const val = e.target.value;
                            updateActiveSheet(s => {
                              const nextMonths = [...s.monthNames] as [
                                string,
                                string,
                                string,
                                string,
                                string,
                                string
                              ];
                              nextMonths[mIdx] = val;
                              return { ...s, monthNames: nextMonths };
                            });
                          }}
                          className="w-full text-center font-bold bg-amber-50/60 text-[11px]"
                        />
                      ) : (
                        mName
                      )}
                    </th>
                  ))}
                </tr>

                {/* Header Row 3: Weeks 1..5 for each of the 6 months */}
                <tr className="bg-[#A9D08E] text-slate-900 font-bold">
                  {activeSheet.monthNames.map((_, mIdx) =>
                    [1, 2, 3, 4, 5].map(w => (
                      <th key={`${mIdx}_${w}`} className="border border-slate-800 px-0.5 py-0.5 text-center w-6">
                        {w}
                      </th>
                    ))
                  )}
                </tr>

                {/* Header Row 4: Jumlah Tatap Muka */}
                <tr className="bg-white text-slate-900 font-bold h-6">
                  <th colSpan={6} className="border border-slate-800 px-2 py-1 text-center font-extrabold">
                    Jumlah Tatap Muka
                  </th>
                  <th className="border border-slate-800 px-1 py-0.5 text-center" />
                  {activeSheet.monthNames.map((_, mIdx) =>
                    [1, 2, 3, 4, 5].map(w => {
                      const key = `${mIdx}_${w}`;
                      const val = activeSheet.headerTatapMuka[key] ?? '';
                      const isBlue = activeSheet.headerTatapMukaHighlighted?.[key] ?? false;
                      return (
                        <th
                          key={`tm_${key}`}
                          onDoubleClick={() => {
                            if (!canEdit || !isEditing) return;
                            updateActiveSheet(s => ({
                              ...s,
                              headerTatapMukaHighlighted: {
                                ...s.headerTatapMukaHighlighted,
                                [key]: !s.headerTatapMukaHighlighted?.[key]
                              }
                            }));
                          }}
                          title={
                            isEditing
                              ? 'Ketik jumlah TM pekan ini, atau klik 2x untuk toggle warna biru'
                              : undefined
                          }
                          className={`border border-slate-800 p-0 text-center font-extrabold ${
                            isBlue ? 'bg-[#BDD7EE]' : 'bg-white'
                          }`}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={val}
                              onChange={e => {
                                const v = e.target.value;
                                updateActiveSheet(s => ({
                                  ...s,
                                  headerTatapMuka: { ...s.headerTatapMuka, [key]: v }
                                }));
                              }}
                              className="w-full h-5 text-center text-[10px] font-extrabold bg-transparent focus:outline-none"
                            />
                          ) : (
                            val
                          )}
                        </th>
                      );
                    })
                  )}
                  <th className="border border-slate-800 px-1 py-0.5" />
                </tr>
              </thead>

              <tbody>
                {activeSheet.rows.map(row => (
                  <tr key={row.id} className="h-6 hover:bg-amber-50/30">
                    <td className="border border-slate-800 text-center font-semibold text-slate-900">
                      {row.no}
                    </td>
                    <td className="border border-slate-800 text-center font-semibold text-slate-900 p-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.jilid}
                          onChange={e => {
                            const v = e.target.value;
                            updateActiveSheet(s => ({
                              ...s,
                              rows: s.rows.map(r => (r.id === row.id ? { ...r, jilid: v } : r))
                            }));
                          }}
                          className="w-full h-6 text-center bg-amber-50/40 text-[11px]"
                        />
                      ) : (
                        row.jilid
                      )}
                    </td>
                    <td className="border border-slate-800 text-center font-semibold text-slate-900 p-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.hlmPeraga}
                          onChange={e => {
                            const v = e.target.value;
                            updateActiveSheet(s => ({
                              ...s,
                              rows: s.rows.map(r => (r.id === row.id ? { ...r, hlmPeraga: v } : r))
                            }));
                          }}
                          className="w-full h-6 text-center bg-amber-50/40 text-[11px]"
                        />
                      ) : (
                        row.hlmPeraga
                      )}
                    </td>
                    <td className="border border-slate-800 text-center font-semibold text-slate-900 p-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.hlmBuku}
                          onChange={e => {
                            const v = e.target.value;
                            updateActiveSheet(s => ({
                              ...s,
                              rows: s.rows.map(r => (r.id === row.id ? { ...r, hlmBuku: v } : r))
                            }));
                          }}
                          className="w-full h-6 text-center bg-amber-50/40 text-[11px]"
                        />
                      ) : (
                        row.hlmBuku
                      )}
                    </td>
                    <td className="border border-slate-800 px-1.5 font-medium text-slate-900 p-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.targetHafalanSurat}
                          onChange={e => {
                            const v = e.target.value;
                            updateActiveSheet(s => ({
                              ...s,
                              rows: s.rows.map(r =>
                                r.id === row.id ? { ...r, targetHafalanSurat: v } : r
                              )
                            }));
                          }}
                          className="w-full h-6 px-1 bg-amber-50/40 text-[11px]"
                        />
                      ) : (
                        <span className="block px-1">{row.targetHafalanSurat}</span>
                      )}
                    </td>
                    <td className="border border-slate-800 px-1.5 font-medium text-slate-900 p-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.drillHafalanSurat}
                          onChange={e => {
                            const v = e.target.value;
                            updateActiveSheet(s => ({
                              ...s,
                              rows: s.rows.map(r =>
                                r.id === row.id ? { ...r, drillHafalanSurat: v } : r
                              )
                            }));
                          }}
                          className="w-full h-6 px-1 bg-amber-50/40 text-[11px]"
                        />
                      ) : (
                        <span className="block px-1">{row.drillHafalanSurat}</span>
                      )}
                    </td>
                    <td className="border border-slate-800 text-center font-semibold text-slate-900 p-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.tm}
                          onChange={e => {
                            const v = e.target.value;
                            updateActiveSheet(s => ({
                              ...s,
                              rows: s.rows.map(r => (r.id === row.id ? { ...r, tm: v } : r))
                            }));
                          }}
                          className="w-full h-6 text-center bg-amber-50/40 text-[11px]"
                        />
                      ) : (
                        row.tm
                      )}
                    </td>

                    {/* 30 Week Cells */}
                    {activeSheet.monthNames.map((_, mIdx) =>
                      [1, 2, 3, 4, 5].map(w => {
                        const key = `${mIdx}_${w}`;
                        const cellVal = row.weekValues[key] ?? '';
                        return (
                          <td
                            key={key}
                            className="border border-slate-800 text-center font-semibold text-slate-900 p-0"
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                value={cellVal}
                                onChange={e => {
                                  const v = e.target.value;
                                  updateActiveSheet(s => ({
                                    ...s,
                                    rows: s.rows.map(r =>
                                      r.id === row.id
                                        ? {
                                            ...r,
                                            weekValues: { ...r.weekValues, [key]: v }
                                          }
                                        : r
                                    )
                                  }));
                                }}
                                className="w-full h-6 text-center text-[10px] bg-transparent focus:bg-amber-100 focus:outline-none"
                              />
                            ) : (
                              cellVal
                            )}
                          </td>
                        );
                      })
                    )}

                    <td className="border border-slate-800 px-1 text-center text-slate-800 p-0">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.keterangan}
                          onChange={e => {
                            const v = e.target.value;
                            updateActiveSheet(s => ({
                              ...s,
                              rows: s.rows.map(r => (r.id === row.id ? { ...r, keterangan: v } : r))
                            }));
                          }}
                          className="w-full h-6 px-1 bg-amber-50/40 text-[10px]"
                        />
                      ) : (
                        row.keterangan
                      )}
                    </td>

                    {isEditing && (
                      <td className="no-print border border-slate-800 text-center p-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                          title="Hapus baris ini"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {/* Row: Ujian Kenaikan Jilid */}
                <tr className="h-6 font-bold text-slate-900 bg-white">
                  <td colSpan={6} className="border border-slate-800 text-center font-extrabold">
                    Ujian Kenaikan Jilid
                  </td>
                  <td className="border border-slate-800 text-center p-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={activeSheet.ujianKenaikanJilidTM}
                        onChange={e =>
                          updateActiveSheet(s => ({ ...s, ujianKenaikanJilidTM: e.target.value }))
                        }
                        className="w-full h-6 text-center bg-amber-50/40 text-[11px]"
                      />
                    ) : (
                      activeSheet.ujianKenaikanJilidTM
                    )}
                  </td>
                  {activeSheet.monthNames.map((_, mIdx) =>
                    [1, 2, 3, 4, 5].map(w => {
                      const key = `${mIdx}_${w}`;
                      const val = activeSheet.ujianKenaikanJilidWeeks?.[key] ?? '';
                      return (
                        <td key={`ukj_${key}`} className="border border-slate-800 text-center p-0">
                          {isEditing ? (
                            <input
                              type="text"
                              value={val}
                              onChange={e => {
                                const v = e.target.value;
                                updateActiveSheet(s => ({
                                  ...s,
                                  ujianKenaikanJilidWeeks: {
                                    ...(s.ujianKenaikanJilidWeeks || {}),
                                    [key]: v
                                  }
                                }));
                              }}
                              className="w-full h-6 text-center text-[10px] bg-transparent focus:bg-amber-100 focus:outline-none"
                            />
                          ) : (
                            val
                          )}
                        </td>
                      );
                    })
                  )}
                  <td className="border border-slate-800 px-1 text-center p-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={activeSheet.ujianKenaikanJilidKeterangan}
                        onChange={e =>
                          updateActiveSheet(s => ({
                            ...s,
                            ujianKenaikanJilidKeterangan: e.target.value
                          }))
                        }
                        className="w-full h-6 px-1 bg-amber-50/40 text-[10px]"
                      />
                    ) : (
                      activeSheet.ujianKenaikanJilidKeterangan
                    )}
                  </td>
                  {isEditing && <td className="no-print border border-slate-800" />}
                </tr>

                {/* Row: Total Pertemuan */}
                <tr className="h-6 font-extrabold text-slate-900 bg-white">
                  <td colSpan={6} className="border border-slate-800 text-center">
                    Total Pertemuan
                  </td>
                  <td className="border border-slate-800 text-center p-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={activeSheet.totalPertemuanOverride ?? calculatedTotalPertemuan}
                        onChange={e =>
                          updateActiveSheet(s => ({ ...s, totalPertemuanOverride: e.target.value }))
                        }
                        className="w-full h-6 text-center font-extrabold bg-amber-50/60 text-[11px]"
                      />
                    ) : (
                      calculatedTotalPertemuan
                    )}
                  </td>
                  <td colSpan={31} className="border border-slate-800" />
                  {isEditing && <td className="no-print border border-slate-800" />}
                </tr>
              </tbody>
            </table>

            {/* TWO PROPORTIONAL SIGNATURES: KOORDINATOR & MUSYRIF HALAQAH */}
            <div className="grid grid-cols-2 gap-8 pt-6 px-4 text-xs text-slate-900">
              {/* Left Signature: Koordinator Al-Qur'an */}
              <div className="space-y-1">
                <div>Mengetahui,</div>
                {isEditing ? (
                  <input
                    type="text"
                    value={activeSheet.signRoleTitle || "Koordinator Al Qur'an"}
                    onChange={e => updateActiveSheet(s => ({ ...s, signRoleTitle: e.target.value }))}
                    className="w-full border border-amber-400 rounded px-2 py-0.5 text-xs bg-amber-50/40"
                  />
                ) : (
                  <div className="font-semibold">{activeSheet.signRoleTitle || "Koordinator Al Qur'an"}</div>
                )}
                <div className="h-12" />
                {isEditing ? (
                  <input
                    type="text"
                    value={activeSheet.signCoordinatorName}
                    onChange={e =>
                      updateActiveSheet(s => ({ ...s, signCoordinatorName: e.target.value }))
                    }
                    className="w-full border border-amber-400 rounded px-2 py-0.5 text-xs font-bold bg-amber-50/40"
                  />
                ) : (
                  <div className="font-bold underline">{activeSheet.signCoordinatorName}</div>
                )}
              </div>

              {/* Right Signature: Musyrif / Guru Tahfizh */}
              <div className="space-y-1 text-right">
                {isEditing ? (
                  <input
                    type="text"
                    value={activeSheet.signPlaceDate}
                    onChange={e => updateActiveSheet(s => ({ ...s, signPlaceDate: e.target.value }))}
                    className="w-48 ml-auto text-right border border-amber-400 rounded px-2 py-0.5 text-xs bg-amber-50/40 block"
                  />
                ) : (
                  <div>{activeSheet.signPlaceDate}</div>
                )}
                {isEditing ? (
                  <input
                    type="text"
                    value={activeSheet.signMusyrifTitle || 'Guru / Musyrif Halaqah'}
                    onChange={e => updateActiveSheet(s => ({ ...s, signMusyrifTitle: e.target.value }))}
                    className="w-48 ml-auto text-right border border-amber-400 rounded px-2 py-0.5 text-xs bg-amber-50/40 block"
                  />
                ) : (
                  <div className="font-semibold">
                    {activeSheet.signMusyrifTitle || 'Guru / Musyrif Halaqah'}
                  </div>
                )}
                <div className="h-12" />
                {isEditing ? (
                  <input
                    type="text"
                    value={activeSheet.signMusyrifName || `(${activeSheet.musyrifName || 'Ustadz Pembimbing'})`}
                    onChange={e => updateActiveSheet(s => ({ ...s, signMusyrifName: e.target.value }))}
                    className="w-56 ml-auto text-right border border-amber-400 rounded px-2 py-0.5 text-xs font-bold bg-amber-50/40 block"
                  />
                ) : (
                  <div className="font-bold underline">
                    {activeSheet.signMusyrifName || `(${activeSheet.musyrifName || 'Ustadz Pembimbing'})`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat Lembar Prosem Baru Per Halaqah */}
      {showNewSheetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Table2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Buat Lembar Program Semester (Prosem) Halaqah</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewSheetModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateNewSheet} className="space-y-3 text-xs">
              {/* 1. Pilih Halaqah */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Halaqah *</label>
                <select
                  value={newSheetForm.halaqahId}
                  onChange={e => {
                    const selId = e.target.value;
                    const foundHlq = allHalaqahs.find(h => h.id === selId);
                    const teacherOfHlq = allTeachers.find(t => t.id === foundHlq?.teacherId);
                    setNewSheetForm({
                      ...newSheetForm,
                      halaqahId: selId,
                      halaqahName: foundHlq?.name || 'Halaqah',
                      musyrifId: foundHlq?.teacherId || teacherOfHlq?.id || 't-1',
                      musyrifName: foundHlq?.teacherName || teacherOfHlq?.name || 'Ustadz Pembimbing'
                    });
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs"
                >
                  {allHalaqahs.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} {h.teacherName ? `(${h.teacherName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Guru / Musyrif Halaqah */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Guru / Musyrif Halaqah *
                </label>
                <select
                  value={newSheetForm.musyrifId}
                  onChange={e => {
                    const tId = e.target.value;
                    const foundT = allTeachers.find(t => t.id === tId);
                    setNewSheetForm({
                      ...newSheetForm,
                      musyrifId: tId,
                      musyrifName: foundT?.name || newSheetForm.musyrifName
                    });
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs"
                >
                  {allTeachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 3. Semester */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester *</label>
                  <select
                    value={newSheetForm.semester}
                    onChange={e =>
                      setNewSheetForm({ ...newSheetForm, semester: e.target.value as any })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs"
                  >
                    <option value="Semester I">Semester I (Juli – Des)</option>
                    <option value="Semester II">Semester II (Jan – Jun)</option>
                  </select>
                </div>

                {/* 4. Jilid / Jenjang */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenjang / Jilid *</label>
                  <select
                    value={newSheetForm.jilidLabel}
                    onChange={e => setNewSheetForm({ ...newSheetForm, jilidLabel: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs"
                  >
                    {['Jilid 1', 'Jilid 2', 'Jilid 3', 'Jilid 4', 'Jilid 5', 'Jilid 6', 'Al-Qur\'an', 'Tahfizh', 'Gharib', 'Tajwid'].map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewSheetModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1E293B] hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Buat Lembar Prosem</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
