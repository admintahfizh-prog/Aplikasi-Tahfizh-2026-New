import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  History,
  Plus,
  Trash2,
  CheckCircle2,
  BookOpen,
  Calendar,
  Award,
  Layers,
  Save,
  Sparkles,
  AlertCircle,
  CheckSquare,
  Square
} from 'lucide-react';
import {
  Student,
  Teacher,
  ClassItem,
  MemorizationRecord,
  SetoranType,
  User
} from '../types';
import {
  SURAH_LIST,
  calculateMultiSurahAyahCount,
  calculateCategory
} from '../data/quranData';
import { storageService } from '../services/storageService';
import { AvatarBadge } from './AvatarBadge';

interface PreviousHafalanModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teachers: Teacher[];
  classes: ClassItem[];
  currentUser?: User | null;
  initialStudentId?: string;
  onSaved?: () => void;
}

interface PastEntryRow {
  rowId: string;
  date: string;
  type: SetoranType;
  startSurahNumber: number;
  startAyah: number;
  endSurahNumber: number;
  endAyah: number;
  score: number;
  notes: string;
}

function getRelativePastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export const PreviousHafalanModal: React.FC<PreviousHafalanModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers,
  classes,
  initialStudentId,
  onSaved
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.id || ''
  );
  const [activeMode, setActiveMode] = useState<'multi_rows' | 'by_juz_surah' | 'baseline_summary'>(
    'multi_rows'
  );

  // Mode 1: Multi-row past memorization entries
  const createDefaultRow = (daysAgo = 1, surahNum = 78): PastEntryRow => {
    const s = SURAH_LIST.find(item => item.number === surahNum) || SURAH_LIST[77];
    return {
      rowId: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: getRelativePastDate(daysAgo),
      type: 'Hafalan Baru',
      startSurahNumber: s.number,
      startAyah: 1,
      endSurahNumber: s.number,
      endAyah: s.totalAyahs,
      score: 90,
      notes: 'Rekap hafalan sebelumnya (Alhamdulillah lancar)'
    };
  };

  const [entryRows, setEntryRows] = useState<PastEntryRow[]>(() => [createDefaultRow(1, 78)]);

  // Mode 2: Quick Juz / Multi-Surah selection
  const [selectedJuzPicker, setSelectedJuzPicker] = useState<number>(30);
  const [checkedSurahNumbers, setCheckedSurahNumbers] = useState<number[]>([114, 113, 112]);
  const [batchJuzDate, setBatchJuzDate] = useState<string>(() => getRelativePastDate(7));
  const [batchJuzScore, setBatchJuzScore] = useState<number>(90);
  const [batchJuzType, setBatchJuzType] = useState<SetoranType>('Hafalan Baru');
  const [batchJuzNotes, setBatchJuzNotes] = useState<string>(
    'Capaian hafalan sebelumnya yang telah diselesaikan santri'
  );

  // Mode 3: Baseline / Cumulative Summary Override
  const [baselineTotalJuz, setBaselineTotalJuz] = useState<number>(0);
  const [baselineTotalSurah, setBaselineTotalSurah] = useState<number>(0);
  const [baselineTotalAyah, setBaselineTotalAyah] = useState<number>(0);
  const [baselineLastHafalan, setBaselineLastHafalan] = useState<string>('');
  const [baselineLastDate, setBaselineLastDate] = useState<string>(() => getRelativePastDate(1));
  const [baselineAvgScore, setBaselineAvgScore] = useState<number>(88);
  const [baselineTargetJuz, setBaselineTargetJuz] = useState<number>(2);

  // Feedback banner
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Existing student records
  const [allRecords, setAllRecords] = useState<MemorizationRecord[]>(() =>
    storageService.getMemorizationRecords()
  );

  useEffect(() => {
    if (!isOpen) return;
    setAllRecords(storageService.getMemorizationRecords());
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    } else if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [isOpen, initialStudentId, students]);

  const filteredStudents = useMemo(() => {
    if (!selectedClassFilter) return students;
    return students.filter(s => s.classId === selectedClassFilter);
  }, [students, selectedClassFilter]);

  const selectedStudent = useMemo(
    () =>
      students.find(s => s.id === selectedStudentId) ||
      filteredStudents[0] ||
      students[0],
    [students, filteredStudents, selectedStudentId]
  );

  // Sync baseline fields when selectedStudent changes
  useEffect(() => {
    if (!selectedStudent) return;
    setBaselineTotalJuz(Number(selectedStudent.totalJuzHafal) || 0);
    setBaselineTotalSurah(Number(selectedStudent.totalSurahHafal) || 0);
    setBaselineTotalAyah(Number(selectedStudent.totalAyahHafal) || 0);
    setBaselineLastHafalan(
      selectedStudent.lastHafalan && selectedStudent.lastHafalan !== '-'
        ? selectedStudent.lastHafalan
        : ''
    );
    setBaselineLastDate(
      selectedStudent.lastHafalanDate && selectedStudent.lastHafalanDate !== '-'
        ? selectedStudent.lastHafalanDate
        : getRelativePastDate(1)
    );
    setBaselineAvgScore(Number(selectedStudent.avgScore) || 88);
    setBaselineTargetJuz(Number(selectedStudent.targetJuz) || 2);
  }, [selectedStudent]);

  const studentExistingRecords = useMemo(() => {
    if (!selectedStudent) return [];
    return allRecords
      .filter(r => r.studentId === selectedStudent.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allRecords, selectedStudent]);

  const surahsInSelectedJuz = useMemo(() => {
    return SURAH_LIST.filter(s => s.juzNumber === selectedJuzPicker);
  }, [selectedJuzPicker]);

  if (!isOpen) return null;

  const showMessage = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback(prev => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Row handlers for Mode 1
  const handleAddRow = () => {
    const lastRow = entryRows[entryRows.length - 1];
    const nextSurahNum = lastRow
      ? Math.min(114, lastRow.endSurahNumber + 1)
      : 78;
    setEntryRows(prev => [...prev, createDefaultRow(prev.length + 1, nextSurahNum)]);
  };

  const handleRemoveRow = (rowId: string) => {
    if (entryRows.length <= 1) return;
    setEntryRows(prev => prev.filter(r => r.rowId !== rowId));
  };

  const handleUpdateRow = (rowId: string, patch: Partial<PastEntryRow>) => {
    setEntryRows(prev =>
      prev.map(row => {
        if (row.rowId !== rowId) return row;
        const updated = { ...row, ...patch };
        if (patch.startSurahNumber !== undefined) {
          const sObj = SURAH_LIST.find(s => s.number === patch.startSurahNumber);
          if (sObj) {
            updated.startAyah = 1;
            if (updated.endSurahNumber < patch.startSurahNumber || row.endSurahNumber === row.startSurahNumber) {
              updated.endSurahNumber = sObj.number;
              updated.endAyah = sObj.totalAyahs;
            }
          }
        }
        if (patch.endSurahNumber !== undefined) {
          const eObj = SURAH_LIST.find(s => s.number === patch.endSurahNumber);
          if (eObj) {
            updated.endAyah = eObj.totalAyahs;
          }
        }
        return updated;
      })
    );
  };

  // Save Mode 1: Multi-row past memorization entries
  const handleSaveMultiRows = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      showMessage('error', 'Pilih santri terlebih dahulu.');
      return;
    }

    const teacherId = selectedStudent.teacherId || teachers[0]?.id || 't-1';
    const recordsToSave: MemorizationRecord[] = [];

    for (let i = 0; i < entryRows.length; i++) {
      const r = entryRows[i];
      const startSurah = SURAH_LIST.find(s => s.number === r.startSurahNumber) || SURAH_LIST[77];
      const endSurah = SURAH_LIST.find(s => s.number === r.endSurahNumber) || startSurah;
      const totalAyah = calculateMultiSurahAyahCount(
        startSurah.number,
        Number(r.startAyah) || 1,
        endSurah.number,
        Number(r.endAyah) || startSurah.totalAyahs
      );

      if (totalAyah <= 0) {
        showMessage('error', `Baris ke-${i + 1}: Rentang surat & ayat tidak valid.`);
        return;
      }

      const finalScore = Math.min(100, Math.max(50, Number(r.score) || 88));
      recordsToSave.push({
        id: `rec-prev-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        studentId: selectedStudent.id,
        teacherId,
        date: r.date || getRelativePastDate(1),
        juz: startSurah.juzNumber,
        surahNumber: startSurah.number,
        surahName: startSurah.name,
        startAyah: Number(r.startAyah) || 1,
        endSurahNumber: endSurah.number,
        endSurahName: endSurah.name,
        endAyah: Number(r.endAyah) || endSurah.totalAyahs,
        totalAyah,
        type: r.type,
        scores: {
          kelancaran: finalScore,
          tajwid: finalScore,
          makhraj: finalScore,
          fashahah: finalScore,
          adab: Math.min(100, finalScore + 2),
          hafalan: finalScore
        },
        finalScore,
        category: calculateCategory(finalScore),
        notes: r.notes.trim() || 'Riwayat hafalan sebelumnya',
        verified: true
      });
    }

    storageService.addBulkMemorizationRecords(recordsToSave);
    setAllRecords(storageService.getMemorizationRecords());
    onSaved?.();
    setEntryRows([createDefaultRow(1, 78)]);
    showMessage(
      'success',
      `Alhamdulillah! ${recordsToSave.length} riwayat hafalan sebelumnya untuk ${selectedStudent.name} berhasil disimpan dan diakumulasikan.`
    );
  };

  // Save Mode 2: Batch Surahs in a Juz
  const handleSaveBatchJuzSurahs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (checkedSurahNumbers.length === 0) {
      showMessage('error', 'Pilih minimal 1 surah yang sudah dihafal sebelumnya.');
      return;
    }

    const teacherId = selectedStudent.teacherId || teachers[0]?.id || 't-1';
    const finalScore = Math.min(100, Math.max(50, Number(batchJuzScore) || 90));
    const sortedNums = [...checkedSurahNumbers].sort((a, b) => a - b);

    const recordsToSave: MemorizationRecord[] = sortedNums
      .map((sNum, idx) => {
        const surah = SURAH_LIST.find(s => s.number === sNum);
        if (!surah) return null;
        return {
          id: `rec-juzprev-${Date.now()}-${idx}-${sNum}`,
          studentId: selectedStudent.id,
          teacherId,
          date: batchJuzDate || getRelativePastDate(7),
          juz: surah.juzNumber,
          surahNumber: surah.number,
          surahName: surah.name,
          startAyah: 1,
          endSurahNumber: surah.number,
          endSurahName: surah.name,
          endAyah: surah.totalAyahs,
          totalAyah: surah.totalAyahs,
          type: batchJuzType,
          scores: {
            kelancaran: finalScore,
            tajwid: finalScore,
            makhraj: finalScore,
            fashahah: finalScore,
            adab: Math.min(100, finalScore + 2),
            hafalan: finalScore
          },
          finalScore,
          category: calculateCategory(finalScore),
          notes: batchJuzNotes.trim() || `Hafalan sebelumnya Juz ${surah.juzNumber} (${surah.name})`,
          verified: true
        } as MemorizationRecord;
      })
      .filter((item): item is MemorizationRecord => item !== null);

    storageService.addBulkMemorizationRecords(recordsToSave);
    setAllRecords(storageService.getMemorizationRecords());
    onSaved?.();
    showMessage(
      'success',
      `Berhasil menyimpan ${recordsToSave.length} surah pada Juz ${selectedJuzPicker} ke riwayat hafalan ${selectedStudent.name}!`
    );
  };

  // Save Mode 3: Baseline Cumulative Summary
  const handleSaveBaselineSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const updatedStudent: Student = {
      ...selectedStudent,
      totalJuzHafal: Number(baselineTotalJuz) || 0,
      totalSurahHafal: Number(baselineTotalSurah) || 0,
      totalAyahHafal: Number(baselineTotalAyah) || 0,
      lastHafalan: baselineLastHafalan.trim() || selectedStudent.lastHafalan || '-',
      lastHafalanDate: baselineLastDate || selectedStudent.lastHafalanDate || '-',
      avgScore: Number(baselineAvgScore) || selectedStudent.avgScore || 85,
      targetJuz: Math.max(0.5, Number(baselineTargetJuz) || selectedStudent.targetJuz || 2)
    };

    storageService.saveStudent(updatedStudent);
    storageService.updateStudentTargetProgress(
      updatedStudent.id,
      updatedStudent.totalJuzHafal
    );
    onSaved?.();
    showMessage(
      'success',
      `Rekap capaian hafalan kumulatif ${selectedStudent.name} (${updatedStudent.totalJuzHafal} Juz) berhasil diperbarui!`
    );
  };

  const handleDeleteExistingRecord = (recId: string) => {
    storageService.deleteMemorizationRecord(recId);
    setAllRecords(storageService.getMemorizationRecords());
    onSaved?.();
    showMessage('success', 'Data riwayat setoran berhasil dihapus.');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-[#1E293B] to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                  Input Hafalan Sebelum-Sebelumnya (Riwayat &amp; Capaian Lampau)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                  Otomatis Akumulasi ke Raport &amp; Grafik
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Catat setoran tanggal-tanggal sebelumnya, surah/juz yang telah dihafal sebelumnya, atau sesuaikan modal capaian awal santri
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border font-bold flex items-center justify-between ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="p-1 hover:opacity-75 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 1: Student Selection & Current Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Filter Rombel Kelas
                </label>
                <select
                  value={selectedClassFilter}
                  onChange={e => {
                    const clsId = e.target.value;
                    setSelectedClassFilter(clsId);
                    const firstStd = students.find(s => !clsId || s.classId === clsId);
                    if (firstStd) setSelectedStudentId(firstStd.id);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  <option value="">Semua Kelas ({students.length} Santri)</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      Kelas {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Pilih Santri yang Akan Diinput Hafalan Sebelumnya ({filteredStudents.length} Santri)
                </label>
                <select
                  value={selectedStudent?.id || ''}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-[#D4AF37] rounded-lg text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-[#1E293B] focus:outline-none"
                >
                  {filteredStudents.map(s => {
                    const clsName = classes.find(c => c.id === s.classId)?.name || '7A';
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} — Kelas {clsName} (NIS: {s.nis} • Capaian: {s.totalJuzHafal} Juz)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {selectedStudent && (
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AvatarBadge
                    name={selectedStudent.name}
                    photoUrl={selectedStudent.photo}
                    gender={selectedStudent.gender}
                    role="santri"
                    size="sm"
                  />
                  <div>
                    <p className="font-extrabold text-slate-900 text-xs">
                      {selectedStudent.name}{' '}
                      <span className="font-mono text-[10px] text-slate-500">
                        (NIS: {selectedStudent.nis})
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Hafalan Terakhir:{' '}
                      <strong className="text-slate-800">
                        {selectedStudent.lastHafalan || 'Belum ada'}
                      </strong>{' '}
                      ({selectedStudent.lastHafalanDate || '-'})
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[#8C7015] font-extrabold text-xs">
                    Total Hafal: {selectedStudent.totalJuzHafal} / {selectedStudent.targetJuz} Juz
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs">
                    {selectedStudent.totalSurahHafal} Surat • {selectedStudent.totalAyahHafal} Ayat
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
                    {studentExistingRecords.length} Log Riwayat Setoran
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: 3 Mode Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveMode('multi_rows')}
              className={`py-2.5 px-3 rounded-lg font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                activeMode === 'multi_rows'
                  ? 'bg-[#1E293B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              <span>1. Input Setoran Tanggal Sebelumnya</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('by_juz_surah')}
              className={`py-2.5 px-3 rounded-lg font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                activeMode === 'by_juz_surah'
                  ? 'bg-[#1E293B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Layers className="w-4 h-4 text-[#D4AF37]" />
              <span>2. Pilih Cepat per Juz / Surah Selesai</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('baseline_summary')}
              className={`py-2.5 px-3 rounded-lg font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                activeMode === 'baseline_summary'
                  ? 'bg-[#1E293B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <span>3. Sesuaikan Total Capaian Awal (Juz)</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* MODE 1: MULTI-ROW BACKDATED MEMORIZATION INPUT                            */}
          {/* ========================================================================= */}
          {activeMode === 'multi_rows' && (
            <form onSubmit={handleSaveMultiRows} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Daftar Input Setoran Hafalan Sebelumnya (Bisa Banyak Baris Sekaligus)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tambahkan satu atau beberapa setoran hafalan dari hari, pekan, atau bulan sebelumnya
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-[#D4AF37] font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#8C7015]" />
                  <span>+ Tambah Baris Setoran Sebelumnya</span>
                </button>
              </div>

              <div className="space-y-3">
                {entryRows.map((row, idx) => {
                  const startSurah =
                    SURAH_LIST.find(s => s.number === row.startSurahNumber) || SURAH_LIST[77];
                  const endSurah =
                    SURAH_LIST.find(s => s.number === row.endSurahNumber) || startSurah;
                  const ayahCount = calculateMultiSurahAyahCount(
                    startSurah.number,
                    Number(row.startAyah) || 1,
                    endSurah.number,
                    Number(row.endAyah) || startSurah.totalAyahs
                  );

                  return (
                    <div
                      key={row.rowId}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#1E293B] text-[#D4AF37] font-black text-[10px]">
                            RIWAYAT #{idx + 1}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600">
                            Juz {startSurah.juzNumber} • Total {ayahCount} Ayat
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Pilih Cepat Tanggal:
                          </span>
                          {[
                            { label: 'Kemarin', days: 1 },
                            { label: '3 Hari Lalu', days: 3 },
                            { label: '1 Pekan Lalu', days: 7 },
                            { label: '1 Bulan Lalu', days: 30 }
                          ].map(preset => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() =>
                                handleUpdateRow(row.rowId, {
                                  date: getRelativePastDate(preset.days)
                                })
                              }
                              className="px-2 py-0.5 rounded bg-white hover:bg-amber-50 text-slate-700 border border-slate-200 text-[10px] font-bold cursor-pointer"
                            >
                              {preset.label}
                            </button>
                          ))}

                          {entryRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.rowId)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer ml-1"
                              title="Hapus baris ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
                        {/* Tanggal */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Tanggal Setoran
                          </label>
                          <input
                            type="date"
                            value={row.date}
                            onChange={e =>
                              handleUpdateRow(row.rowId, { date: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>

                        {/* Jenis Setoran */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Jenis Setoran
                          </label>
                          <select
                            value={row.type}
                            onChange={e =>
                              handleUpdateRow(row.rowId, {
                                type: e.target.value as SetoranType
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                          >
                            <option value="Hafalan Baru">Hafalan Baru (Ziyadah)</option>
                            <option value="Murojaah">Murojaah (Ulang)</option>
                            <option value="Tasmi'">Tasmi&apos; (Sekali Duduk)</option>
                          </select>
                        </div>

                        {/* Surat Awal */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Surat Awal
                          </label>
                          <select
                            value={row.startSurahNumber}
                            onChange={e =>
                              handleUpdateRow(row.rowId, {
                                startSurahNumber: Number(e.target.value)
                              })
                            }
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                          >
                            {SURAH_LIST.map(s => (
                              <option key={s.number} value={s.number}>
                                {s.number}. {s.name} (Juz {s.juzNumber})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Ayat Mulai & Selesai (atau Lintas Surat) */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Surat Akhir
                          </label>
                          <select
                            value={row.endSurahNumber}
                            onChange={e =>
                              handleUpdateRow(row.rowId, {
                                endSurahNumber: Number(e.target.value)
                              })
                            }
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                          >
                            {SURAH_LIST.map(s => (
                              <option key={s.number} value={s.number}>
                                {s.number}. {s.name} ({s.totalAyahs} Ayt)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Rentang Ayat */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Ayat Mulai – Selesai
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              max={startSurah.totalAyahs}
                              value={row.startAyah}
                              onChange={e =>
                                handleUpdateRow(row.rowId, {
                                  startAyah: Number(e.target.value)
                                })
                              }
                              className="w-1/2 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center"
                            />
                            <span className="text-slate-400 font-bold">-</span>
                            <input
                              type="number"
                              min={1}
                              max={endSurah.totalAyahs}
                              value={row.endAyah}
                              onChange={e =>
                                handleUpdateRow(row.rowId, {
                                  endAyah: Number(e.target.value)
                                })
                              }
                              className="w-1/2 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center"
                            />
                          </div>
                        </div>

                        {/* Nilai Akhir */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Nilai (0-100)
                          </label>
                          <input
                            type="number"
                            min={50}
                            max={100}
                            value={row.score}
                            onChange={e =>
                              handleUpdateRow(row.rowId, {
                                score: Number(e.target.value)
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-[#8C7015]"
                          />
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={row.notes}
                          onChange={e =>
                            handleUpdateRow(row.rowId, { notes: e.target.value })
                          }
                          placeholder="Catatan evaluasi hafalan sebelumnya..."
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Baris Lagi</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1E293B] hover:bg-slate-800 text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#D4AF37]" />
                  <span>Simpan {entryRows.length} Riwayat Hafalan Sebelumnya</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* MODE 2: QUICK BATCH INPUT PER JUZ / COMPLETED SURAHS                      */}
          {/* ========================================================================= */}
          {activeMode === 'by_juz_surah' && (
            <form onSubmit={handleSaveBatchJuzSurahs} className="space-y-4">
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Pilih Cepat Surah-Surah yang Sudah Dihafal Sebelumnya per Juz
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      Centang surah yang telah selesai dihafal santri pada waktu sebelumnya untuk dimasukkan sekaligus ke riwayat
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCheckedSurahNumbers(surahsInSelectedJuz.map(s => s.number))
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#1E293B] text-white font-bold text-[11px] cursor-pointer"
                    >
                      Pilih Semua di Juz {selectedJuzPicker}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckedSurahNumbers([])}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-[11px] cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                {/* Juz Selector Strip */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[30, 29, 28, 27, 26, 1, 2, 3, 4, 5].map(juzNum => (
                    <button
                      key={juzNum}
                      type="button"
                      onClick={() => {
                        setSelectedJuzPicker(juzNum);
                        const listInJuz = SURAH_LIST.filter(s => s.juzNumber === juzNum);
                        setCheckedSurahNumbers(listInJuz.map(s => s.number));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition cursor-pointer ${
                        selectedJuzPicker === juzNum
                          ? 'bg-[#D4AF37] text-slate-950 border-[#8C7015] shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Juz {juzNum}
                    </button>
                  ))}
                  <select
                    value={selectedJuzPicker}
                    onChange={e => {
                      const j = Number(e.target.value);
                      setSelectedJuzPicker(j);
                      const listInJuz = SURAH_LIST.filter(s => s.juzNumber === j);
                      setCheckedSurahNumbers(listInJuz.map(s => s.number));
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                      <option key={j} value={j}>
                        Pilih Juz Lain: Juz {j}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Surahs Checkbox Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                  {surahsInSelectedJuz.map(surah => {
                    const isChecked = checkedSurahNumbers.includes(surah.number);
                    const alreadyInHistory = studentExistingRecords.some(
                      r => r.surahNumber === surah.number
                    );
                    return (
                      <div
                        key={surah.number}
                        onClick={() => {
                          setCheckedSurahNumbers(prev =>
                            prev.includes(surah.number)
                              ? prev.filter(n => n !== surah.number)
                              : [...prev, surah.number]
                          );
                        }}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 cursor-pointer transition ${
                          isChecked
                            ? 'bg-amber-50 border-[#D4AF37] text-slate-900 font-bold'
                            : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#8C7015] shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="block truncate">
                              {surah.number}. {surah.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {surah.totalAyahs} Ayat
                            </span>
                          </div>
                        </div>
                        {alreadyInHistory && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold shrink-0">
                            Ada
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Metadata for Batch Juz Input */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Tanggal Pencatatan Riwayat
                    </label>
                    <input
                      type="date"
                      value={batchJuzDate}
                      onChange={e => setBatchJuzDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Kategori Setoran
                    </label>
                    <select
                      value={batchJuzType}
                      onChange={e => setBatchJuzType(e.target.value as SetoranType)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      <option value="Hafalan Baru">Hafalan Baru</option>
                      <option value="Murojaah">Murojaah</option>
                      <option value="Tasmi'">Tasmi&apos;</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Nilai Rata-rata (0-100)
                    </label>
                    <input
                      type="number"
                      min={60}
                      max={100}
                      value={batchJuzScore}
                      onChange={e => setBatchJuzScore(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-[#8C7015]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Keterangan Riwayat
                    </label>
                    <input
                      type="text"
                      value={batchJuzNotes}
                      onChange={e => setBatchJuzNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1E293B] hover:bg-slate-800 text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#D4AF37]" />
                  <span>
                    Simpan {checkedSurahNumbers.length} Surah Terpilih (Juz {selectedJuzPicker}) ke Riwayat
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* MODE 3: DIRECT CUMULATIVE BASELINE ADJUSTMENT                             */}
          {/* ========================================================================= */}
          {activeMode === 'baseline_summary' && (
            <form onSubmit={handleSaveBaselineSummary} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Sesuaikan Total Capaian Hafalan Kumulatif (Modal Hafalan Sebelumnya)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Gunakan menu ini untuk langsung menetapkan total Juz, jumlah Surat, dan jumlah Ayat yang sudah dimiliki santri dari semester/jenjang sebelumnya
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Total Juz yang Sudah Dihafal
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="30"
                      value={baselineTotalJuz}
                      onChange={e => setBaselineTotalJuz(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border-2 border-[#D4AF37] rounded-lg font-black text-sm text-slate-900"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[0.5, 1, 1.5, 2, 3, 4, 5].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setBaselineTotalJuz(val);
                            setBaselineTotalAyah(Math.round(val * 200));
                          }}
                          className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-[#8C7015] border border-amber-200 text-[10px] font-bold cursor-pointer"
                        >
                          {val} Juz
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Total Surat yang Sudah Dihafal
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="114"
                      value={baselineTotalSurah}
                      onChange={e => setBaselineTotalSurah(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-sm text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Total Akumulasi Ayat Dihafal
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="6236"
                      value={baselineTotalAyah}
                      onChange={e => setBaselineTotalAyah(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Batas Hafalan Terakhir Sebelumnya
                    </label>
                    <input
                      type="text"
                      value={baselineLastHafalan}
                      onChange={e => setBaselineLastHafalan(e.target.value)}
                      placeholder="Contoh: An-Naba : 1-40 / Juz 30 Selesai"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tanggal Setoran Terakhir
                    </label>
                    <input
                      type="date"
                      value={baselineLastDate}
                      onChange={e => setBaselineLastDate(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Target Hafalan Santri (Juz)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="30"
                      value={baselineTargetJuz}
                      onChange={e => setBaselineTargetJuz(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1E293B] hover:bg-slate-800 text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#D4AF37]" />
                  <span>Simpan Rekap Capaian Kumulatif Santri</span>
                </button>
              </div>
            </form>
          )}

          {/* Existing Memorization History Table for Selected Student */}
          {selectedStudent && (
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>
                    Daftar Riwayat Setoran Hafalan {selectedStudent.name} ({studentExistingRecords.length}{' '}
                    Catatan)
                  </span>
                </h4>
              </div>

              {studentExistingRecords.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Belum ada catatan riwayat setoran hafalan untuk santri ini.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-2 px-3">Tanggal</th>
                        <th className="py-2 px-3">Jenis</th>
                        <th className="py-2 px-3">Surat &amp; Ayat</th>
                        <th className="py-2 px-3 text-center">Juz</th>
                        <th className="py-2 px-3 text-center">Jml Ayat</th>
                        <th className="py-2 px-3 text-center">Nilai</th>
                        <th className="py-2 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentExistingRecords.map(rec => (
                        <tr key={rec.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-semibold text-slate-700">
                            {rec.date}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-800">{rec.type}</td>
                          <td className="py-2 px-3 font-bold text-[#1E293B]">
                            {rec.endSurahName && rec.endSurahName !== rec.surahName
                              ? `${rec.surahName} (${rec.startAyah}) – ${rec.endSurahName} (${rec.endAyah})`
                              : `${rec.surahName} : ${rec.startAyah}–${rec.endAyah}`}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">Juz {rec.juz}</td>
                          <td className="py-2 px-3 text-center font-bold">{rec.totalAyah}</td>
                          <td className="py-2 px-3 text-center font-extrabold text-[#8C7015]">
                            {rec.finalScore}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingRecord(rec.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Hapus riwayat ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Seluruh input hafalan sebelumnya otomatis memperbarui progres Juz, Grafik Bulanan, dan Raport.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer"
          >
            Selesai &amp; Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
