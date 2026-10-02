import React, { useState } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Edit3,
  Calendar,
  Table2,
  School,
  Sparkles,
  Layers,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { KaldikData, ProsemSheet } from '../data/kaldikProsemData';

interface DocumentQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  kaldikData: KaldikData;
  prosemSheets: ProsemSheet[];
  initialType?: 'kaldik' | 'prosem';
  initialSheetId?: string;
  onEditDocument: (type: 'kaldik' | 'prosem', sheetId?: string) => void;
}

export const DocumentQuickViewModal: React.FC<DocumentQuickViewModalProps> = ({
  isOpen,
  onClose,
  kaldikData,
  prosemSheets,
  initialType = 'kaldik',
  initialSheetId,
  onEditDocument
}) => {
  const [docType, setDocType] = useState<'kaldik' | 'prosem'>(initialType);
  const [selectedSheetId, setSelectedSheetId] = useState<string>(
    initialSheetId || prosemSheets[0]?.id || ''
  );

  if (!isOpen) return null;

  const currentSheet =
    prosemSheets.find(s => s.id === selectedSheetId) || prosemSheets[0];

  const handleExportCurrent = () => {
    const wb = XLSX.utils.book_new();
    if (docType === 'kaldik') {
      const headerRow = ['NO', 'BULAN', ...Array.from({ length: 31 }, (_, i) => String(i + 1))];
      const rows: (string | number)[][] = [
        [kaldikData.title],
        [kaldikData.schoolName],
        [`${kaldikData.academicYear} - ${kaldikData.semesterLabel}`],
        [],
        headerRow
      ];
      kaldikData.months.forEach((m, idx) => {
        const r: (string | number)[] = [idx + 1, m.monthName];
        for (let d = 1; d <= 31; d++) {
          const cell = m.days[d];
          r.push(cell?.style === 'invalid_black' ? 'X' : cell?.text || '');
        }
        rows.push(r);
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Kaldik Ummi');
      XLSX.writeFile(wb, `Pratinjau_Kaldik_${kaldikData.academicYear.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    } else if (currentSheet) {
      const weekHeaders: string[] = [];
      currentSheet.monthNames.forEach(m => {
        for (let w = 1; w <= 5; w++) {
          weekHeaders.push(`${m} P${w}`);
        }
      });
      const aoa: (string | number)[][] = [
        [currentSheet.title],
        [`LEMBAGA : ${currentSheet.lembaga}`],
        [`HALAQAH : ${currentSheet.halaqahName || '-'} • MUSYRIF : ${currentSheet.musyrifName || '-'}`],
        [`SEMESTER : ${currentSheet.semester} • JENJANG : ${currentSheet.jilidLabel}`],
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
      const tmRow: (string | number)[] = ['Jumlah Tatap Muka', '', '', '', '', '', ''];
      for (let m = 0; m < 6; m++) {
        for (let w = 1; w <= 5; w++) {
          tmRow.push(currentSheet.headerTatapMuka[`${m}_${w}`] ?? '');
        }
      }
      tmRow.push('');
      aoa.push(tmRow);

      currentSheet.rows.forEach(r => {
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
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, `${currentSheet.semester} ${currentSheet.jilidLabel}`.slice(0, 30));
      XLSX.writeFile(
        wb,
        `Pratinjau_Prosem_${(currentSheet.halaqahName || 'Halaqah').replace(/[^a-zA-Z0-9]/g, '_')}_${currentSheet.jilidLabel}.xlsx`
      );
    }
  };

  const leftLegends = kaldikData.legends.filter(l => l.column === 'left');
  const rightLegends = kaldikData.legends.filter(l => l.column === 'right');
  const maxLegendRows = Math.max(leftLegends.length, rightLegends.length);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex flex-col justify-between animate-in fade-in">
      {/* Modal Top Navbar (Dark, Non-print) */}
      <div className="no-print bg-slate-900 border-b border-slate-700/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Pratinjau Dokumen Format Resmi</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Siap Cetak / Edit
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Tampilan lembar kerja format cetak sebelum melakukan revisi data atau pengisian nilai.
            </p>
          </div>
        </div>

        {/* Document Switcher Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => setDocType('kaldik')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              docType === 'kaldik'
                ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Kalender Pendidikan (Kaldik)</span>
          </button>
          <button
            type="button"
            onClick={() => setDocType('prosem')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              docType === 'prosem'
                ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Program Semester (Prosem)</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEditDocument(docType, docType === 'prosem' ? currentSheet?.id : undefined)}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Dokumen Ini</span>
          </button>
          <button
            type="button"
            onClick={handleExportCurrent}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ekspor Excel</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer ml-1"
            title="Tutup Pratinjau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Prosem Sheet Sub-Toolbar (When Prosem is selected) */}
      {docType === 'prosem' && (
        <div className="no-print bg-slate-800/95 border-b border-slate-700 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-300 font-bold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
              Pilih Lembar Halaqah:
            </span>
            <select
              value={selectedSheetId}
              onChange={e => setSelectedSheetId(e.target.value)}
              className="bg-slate-900 border border-slate-600 text-white rounded-md px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            >
              {prosemSheets.map(s => (
                <option key={s.id} value={s.id}>
                  {s.semester} • {s.jilidLabel} • {s.halaqahName || 'Halaqah'} ({s.musyrifName || 'Musyrif'})
                </option>
              ))}
            </select>
          </div>

          {currentSheet && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-700">
                {currentSheet.halaqahName || 'Semua Halaqah'}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700">
                Musyrif: {currentSheet.musyrifName || '-'}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-700">
                Jenjang: {currentSheet.jilidLabel}
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700">
                {currentSheet.semester}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Document Preview Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950/60">
        <div className="max-w-6xl mx-auto bg-white text-slate-900 shadow-2xl rounded-xl border border-slate-200 p-6 sm:p-8 space-y-5">
          {/* Institutional Kop Surat Header */}
          <div className="border-b-2 border-slate-900 pb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#1E293B] text-[#D4AF37] font-bold flex items-center justify-center text-xl shrink-0 border-2 border-[#D4AF37]">
                  A
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                    YAYASAN MA&apos;HAD AL AZHAR SOLO BARU
                  </h4>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight uppercase">
                    SMP ISLAM AL AZHAR 21 SOLO BARU
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Bidang Keagamaan &amp; Koordinator Al-Qur&apos;an Metode Ummi &bull; Jl. Pelajar No. 21 Solo Baru, Sukoharjo
                  </p>
                </div>
              </div>
              <div className="text-right text-[11px] font-semibold text-slate-500 hidden sm:block">
                <div>Tahun Ajaran 2026/2027</div>
                <div className="text-amber-800 font-bold">Terakreditasi A</div>
              </div>
            </div>
          </div>

          {/* DOCUMENT CONTENT: KALDIK */}
          {docType === 'kaldik' && (
            <div className="space-y-4">
              {/* Document Sub-Header Box */}
              <div className="border-2 border-slate-800 p-3 bg-white text-center space-y-1">
                <h3 className="font-extrabold text-base text-slate-900 tracking-wide uppercase">
                  {kaldikData.title}
                </h3>
                <h4 className="font-extrabold text-sm text-slate-900 tracking-wide uppercase">
                  {kaldikData.schoolName}
                </h4>
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 pt-1 px-2 border-t border-slate-300 mt-2">
                  <span>{kaldikData.academicYear}</span>
                  <span>{kaldikData.semesterLabel}</span>
                </div>
              </div>

              {/* Main Kaldik 12 Months x 31 Days Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-slate-800 text-[10px]">
                  <thead>
                    <tr className="bg-[#BDD7EE] text-slate-900 font-extrabold">
                      <th rowSpan={2} className="border border-slate-800 px-1 py-1 text-center w-7">
                        NO
                      </th>
                      <th rowSpan={2} className="border border-slate-800 px-2 py-1 text-center w-24">
                        BULAN
                      </th>
                      <th colSpan={31} className="border border-slate-800 py-1 text-center tracking-wider">
                        TANGGAL
                      </th>
                    </tr>
                    <tr className="bg-[#BDD7EE] text-slate-900 font-bold">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <th key={d} className="border border-slate-800 px-0.5 py-0.5 text-center w-6">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kaldikData.months.map((month, mIdx) => (
                      <tr key={month.id} className="h-5">
                        <td className="border border-slate-800 text-center font-bold text-slate-900 bg-white">
                          {mIdx + 1}
                        </td>
                        <td className="border border-slate-800 px-1.5 font-bold text-slate-900 bg-white whitespace-nowrap">
                          {month.monthName}
                        </td>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                          const cell = month.days[day] || { text: '', style: 'normal' };
                          const style = cell.style || 'normal';
                          const bg =
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
                              className={`border border-slate-800 text-center p-0 align-middle ${bg}`}
                            >
                              <span className="block px-0.5 leading-tight text-[9px]">
                                {style === 'invalid_black' ? '' : cell.text}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Section: Keterangan (Left) & Effective Weeks (Right) */}
              <div className="grid grid-cols-12 gap-3 pt-1 items-start text-[10px]">
                {/* Left: Keterangan Legend */}
                <div className="col-span-5">
                  <table className="w-full border-collapse border-2 border-slate-800">
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
                          <tr key={idx} className="h-4">
                            <td className="border border-slate-800 px-1 font-bold text-slate-900 w-9">
                              {left?.code || ''}
                            </td>
                            <td className="border border-slate-800 text-center w-3">{left ? ':' : ''}</td>
                            <td className="border border-slate-800 px-1 text-slate-900">
                              {left?.description || ''}
                            </td>
                            <td className="border border-slate-800 px-1 font-bold text-slate-900 w-10">
                              {right?.code || ''}
                            </td>
                            <td className="border border-slate-800 text-center w-3">{right ? ':' : ''}</td>
                            <td className="border border-slate-800 px-1 text-slate-900">
                              {right?.description || ''}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Right: Signature & Semester 1 & 2 Tables */}
                <div className="col-span-7 space-y-2">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4 text-[10px] text-slate-900 pt-1 pl-1 space-y-0.5">
                      <div>{kaldikData.signPlaceDate}</div>
                      <div>{kaldikData.signRoleTitle}</div>
                      <div className="h-10" />
                      <div className="font-bold underline">{kaldikData.signCoordinatorName}</div>
                    </div>

                    <div className="col-span-8">
                      <div className="text-[10px] font-bold text-slate-900 mb-0.5 flex justify-between">
                        <span>Perhitungan hari efektif</span>
                        <span>Perhitungan jam efektif</span>
                      </div>
                      <table className="w-full border-collapse border-2 border-slate-800 text-[9px]">
                        <thead>
                          <tr className="bg-[#BDD7EE] font-bold">
                            <th rowSpan={2} className="border border-slate-800 px-1 py-0.5 text-left">
                              Sem 1
                            </th>
                            <th colSpan={5} className="border border-slate-800 text-center">
                              Pekan
                            </th>
                            <th rowSpan={2} className="border border-slate-800 text-center leading-tight">
                              Hari
                            </th>
                            <th rowSpan={2} className="border border-slate-800 text-center leading-tight">
                              Pekan
                            </th>
                            <th colSpan={5} className="border border-slate-800 text-center">
                              Pekan
                            </th>
                            <th rowSpan={2} className="border border-slate-800 text-center leading-tight">
                              Jam
                            </th>
                            <th rowSpan={2} className="border border-slate-800 text-center leading-tight">
                              Pekan
                            </th>
                          </tr>
                          <tr className="bg-[#BDD7EE] font-bold">
                            {[1, 2, 3, 4, 5].map(w => (
                              <th key={`d-${w}`} className="border border-slate-800 text-center w-4">
                                {w}
                              </th>
                            ))}
                            {[1, 2, 3, 4, 5].map(w => (
                              <th key={`j-${w}`} className="border border-slate-800 text-center w-4">
                                {w}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {kaldikData.semester1Effective.map(row => {
                            const validDays = row.weeks.filter((w): w is number => typeof w === 'number' && w > 0);
                            const sumDays = validDays.reduce((a, b) => a + b, 0);
                            const countWeeks = validDays.length;

                            const jamList = row.jamWeeks || [null, null, null, null, null];
                            const validJam = jamList.filter((w): w is number => typeof w === 'number' && w > 0);
                            const sumJam = validJam.reduce((a, b) => a + b, 0);
                            const countJamWeeks = validJam.length;

                            return (
                              <tr key={row.monthName} className="h-4">
                                <td className="border border-slate-800 px-1 font-semibold">{row.monthName}</td>
                                {[0, 1, 2, 3, 4].map(wIdx => (
                                  <td key={`sd-${wIdx}`} className="border border-slate-800 text-center">
                                    {row.weeks[wIdx] ?? '-'}
                                  </td>
                                ))}
                                <td className="border border-slate-800 text-center font-bold bg-slate-50">
                                  {sumDays}
                                </td>
                                <td className="border border-slate-800 text-center font-bold bg-slate-50">
                                  {countWeeks}
                                </td>
                                {[0, 1, 2, 3, 4].map(wIdx => (
                                  <td key={`sj-${wIdx}`} className="border border-slate-800 text-center">
                                    {jamList[wIdx] ?? '-'}
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
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENT CONTENT: PROSEM */}
          {docType === 'prosem' && currentSheet && (
            <div className="space-y-3">
              {/* Document Title & Meta Box */}
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-base text-slate-900 tracking-wide uppercase">
                  {currentSheet.title}
                </h3>
              </div>

              <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 text-xs text-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div>
                    <span className="font-bold">LEMBAGA:</span> {currentSheet.lembaga}
                  </div>
                  <div>
                    <span className="font-bold">HALAQAH:</span>{' '}
                    <span className="font-extrabold text-blue-900">
                      {currentSheet.halaqahName || 'Halaqah 1 (Umar bin Khattab)'}
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div>
                    <span className="font-bold">GURU / MUSYRIF:</span>{' '}
                    <span className="font-extrabold text-emerald-900">
                      {currentSheet.musyrifName || 'Ustadz Ahmad Fauzan, Lc.'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold">JENJANG / SEMESTER:</span>{' '}
                    <span className="font-extrabold text-amber-900">
                      {currentSheet.jilidLabel} • {currentSheet.semester}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Prosem Multi-Row Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-slate-800 text-[10px]">
                  <thead>
                    <tr className="bg-[#A9D08E] text-slate-900 font-extrabold">
                      <th rowSpan={3} className="border border-slate-800 px-1 py-1 text-center w-7">
                        NO
                      </th>
                      <th colSpan={5} className="border border-slate-800 py-1 text-center">
                        MATERI
                      </th>
                      <th rowSpan={3} className="border border-slate-800 px-1 py-1 text-center w-8">
                        TM
                      </th>
                      <th colSpan={30} className="border border-slate-800 py-1 text-center tracking-wide">
                        BULAN DAN PEKAN
                      </th>
                      <th rowSpan={3} className="border border-slate-800 px-1.5 py-1 text-center w-14">
                        KET
                      </th>
                    </tr>

                    <tr className="bg-[#A9D08E] text-slate-900 font-bold">
                      <th rowSpan={2} className="border border-slate-800 px-1 py-1 text-center w-10">
                        Jilid
                      </th>
                      <th rowSpan={2} className="border border-slate-800 px-1 py-1 text-center w-16 leading-tight">
                        Hlm.
                        <br />
                        Peraga
                      </th>
                      <th rowSpan={2} className="border border-slate-800 px-1 py-1 text-center w-14 leading-tight">
                        Hlm.
                        <br />
                        Buku
                      </th>
                      <th rowSpan={2} className="border border-slate-800 px-1.5 py-1 text-center w-28 leading-tight">
                        Target Hafalan
                        <br />
                        Surat
                      </th>
                      <th rowSpan={2} className="border border-slate-800 px-1.5 py-1 text-center w-28 leading-tight">
                        Drill Hafalan
                        <br />
                        Surat
                      </th>
                      {currentSheet.monthNames.map((mName, mIdx) => (
                        <th key={mIdx} colSpan={5} className="border border-slate-800 py-0.5 text-center">
                          {mName}
                        </th>
                      ))}
                    </tr>

                    <tr className="bg-[#A9D08E] text-slate-900 font-bold">
                      {currentSheet.monthNames.map((_, mIdx) =>
                        [1, 2, 3, 4, 5].map(w => (
                          <th key={`${mIdx}_${w}`} className="border border-slate-800 px-0.5 py-0.5 text-center w-5">
                            {w}
                          </th>
                        ))
                      )}
                    </tr>

                    {/* Row: Jumlah Tatap Muka */}
                    <tr className="bg-white text-slate-900 font-bold h-5">
                      <th colSpan={6} className="border border-slate-800 px-2 py-0.5 text-center font-extrabold">
                        Jumlah Tatap Muka
                      </th>
                      <th className="border border-slate-800" />
                      {currentSheet.monthNames.map((_, mIdx) =>
                        [1, 2, 3, 4, 5].map(w => {
                          const key = `${mIdx}_${w}`;
                          const val = currentSheet.headerTatapMuka[key] ?? '';
                          const isBlue = currentSheet.headerTatapMukaHighlighted?.[key] ?? false;
                          return (
                            <th
                              key={`pv_tm_${key}`}
                              className={`border border-slate-800 p-0 text-center font-extrabold ${
                                isBlue ? 'bg-[#BDD7EE]' : 'bg-white'
                              }`}
                            >
                              {val}
                            </th>
                          );
                        })
                      )}
                      <th className="border border-slate-800" />
                    </tr>
                  </thead>

                  <tbody>
                    {currentSheet.rows.map(row => (
                      <tr key={row.id} className="h-5">
                        <td className="border border-slate-800 text-center font-semibold text-slate-900">
                          {row.no}
                        </td>
                        <td className="border border-slate-800 text-center font-semibold text-slate-900">
                          {row.jilid}
                        </td>
                        <td className="border border-slate-800 text-center font-semibold text-slate-900">
                          {row.hlmPeraga}
                        </td>
                        <td className="border border-slate-800 text-center font-semibold text-slate-900">
                          {row.hlmBuku}
                        </td>
                        <td className="border border-slate-800 px-1 font-medium text-slate-900">
                          {row.targetHafalanSurat}
                        </td>
                        <td className="border border-slate-800 px-1 font-medium text-slate-900">
                          {row.drillHafalanSurat}
                        </td>
                        <td className="border border-slate-800 text-center font-semibold text-slate-900">
                          {row.tm}
                        </td>
                        {currentSheet.monthNames.map((_, mIdx) =>
                          [1, 2, 3, 4, 5].map(w => {
                            const key = `${mIdx}_${w}`;
                            return (
                              <td
                                key={key}
                                className="border border-slate-800 text-center font-semibold text-slate-900 p-0"
                              >
                                {row.weekValues[key] ?? ''}
                              </td>
                            );
                          })
                        )}
                        <td className="border border-slate-800 px-1 text-center text-slate-800">
                          {row.keterangan}
                        </td>
                      </tr>
                    ))}

                    {/* Ujian Kenaikan Jilid */}
                    <tr className="h-5 font-bold text-slate-900 bg-white">
                      <td colSpan={6} className="border border-slate-800 text-center font-extrabold">
                        Ujian Kenaikan Jilid
                      </td>
                      <td className="border border-slate-800 text-center">
                        {currentSheet.ujianKenaikanJilidTM}
                      </td>
                      {currentSheet.monthNames.map((_, mIdx) =>
                        [1, 2, 3, 4, 5].map(w => {
                          const key = `${mIdx}_${w}`;
                          return (
                            <td key={`pv_ukj_${key}`} className="border border-slate-800 text-center p-0">
                              {currentSheet.ujianKenaikanJilidWeeks?.[key] ?? ''}
                            </td>
                          );
                        })
                      )}
                      <td className="border border-slate-800 px-1 text-center">
                        {currentSheet.ujianKenaikanJilidKeterangan}
                      </td>
                    </tr>

                    {/* Total Pertemuan */}
                    <tr className="h-5 font-extrabold text-slate-900 bg-white">
                      <td colSpan={6} className="border border-slate-800 text-center">
                        Total Pertemuan
                      </td>
                      <td className="border border-slate-800 text-center">
                        {currentSheet.totalPertemuanOverride ?? 26}
                      </td>
                      <td colSpan={31} className="border border-slate-800" />
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Two Proportional Institutional Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-4 px-6 text-xs text-slate-900">
                <div className="space-y-1">
                  <div>Mengetahui,</div>
                  <div className="font-semibold">{currentSheet.signRoleTitle || "Koordinator Al Qur'an"}</div>
                  <div className="h-14" />
                  <div className="font-bold underline">{currentSheet.signCoordinatorName}</div>
                </div>

                <div className="space-y-1 text-right">
                  <div>{currentSheet.signPlaceDate}</div>
                  <div className="font-semibold">
                    {currentSheet.signMusyrifTitle || 'Guru / Musyrif Halaqah'}
                  </div>
                  <div className="h-14" />
                  <div className="font-bold underline">
                    {currentSheet.signMusyrifName || `(${currentSheet.musyrifName || 'Ustadz Pembimbing'})`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
