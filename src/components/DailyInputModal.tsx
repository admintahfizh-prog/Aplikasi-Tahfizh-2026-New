import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  BookOpen, 
  BookMarked, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  UserCheck, 
  Award,
  ChevronRight,
  ShieldAlert,
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Student, 
  Teacher, 
  ClassItem, 
  SetoranType, 
  ScoreBreakdown, 
  MemorizationRecord, 
  UmmiRecord, 
  ScoreCategory,
  UmmiStatus
} from '../types';
import { SURAH_LIST, calculateAyahCount, validateAyahRange, calculateCategory } from '../data/quranData';
import { UMMI_JILIDS } from '../data/ummiData';

interface DailyInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  students?: Student[];
  classes?: ClassItem[];
  currentTeacher?: Teacher;
  allTeachers?: Teacher[];
  onSaveMemorization?: (record: MemorizationRecord) => void;
  onSaveUmmi?: (record: UmmiRecord) => void;
  preSelectedStudentId?: string;
  initialStudentId?: string;
  onSaveSuccess?: () => void;
}

export const DailyInputModal: React.FC<DailyInputModalProps> = ({
  isOpen,
  onClose,
  students = [],
  classes = [],
  currentTeacher,
  allTeachers = [],
  onSaveMemorization,
  onSaveUmmi,
  preSelectedStudentId,
  initialStudentId,
  onSaveSuccess
}) => {
  // Mode: 'quran' | 'ummi'
  const [activeTab, setActiveTab] = useState<'quran' | 'ummi'>('quran');

  const effectiveInitialStudentId = preSelectedStudentId || initialStudentId;

  // Step 1: Selection
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(effectiveInitialStudentId || students[0]?.id || '');
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Quran Form State
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(78); // Default An-Naba
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(10);
  const [setoranType, setSetoranType] = useState<SetoranType>('Hafalan Baru');
  const [tasmiHalaman, setTasmiHalaman] = useState<number>(1);

  // Scores (0-100)
  const [scores, setScores] = useState<ScoreBreakdown>({
    kelancaran: 90,
    tajwid: 88,
    makhraj: 90,
    fashahah: 88,
    adab: 95,
    hafalan: 90
  });

  const [notes, setNotes] = useState<string>('Alhamdulillah bacaan tartil dan lancar.');

  // Ummi Form State
  const [ummiJilid, setUmmiJilid] = useState<string>('Jilid 4');
  const [ummiPage, setUmmiPage] = useState<number>(1);
  const [ummiMaterial, setUmmiMaterial] = useState<string>('Mad Thabi\'i & Qalqalah');
  const [ummiStatus, setUmmiStatus] = useState<UmmiStatus>('Lulus');
  const [ummiScore, setUmmiScore] = useState<number>(88);
  const [ummiNotes, setUmmiNotes] = useState<string>('Lancar dan memahami kaidah dengan baik.');

  // Verification Modal Step
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync preSelectedStudent
  useEffect(() => {
    if (preSelectedStudentId) {
      setSelectedStudentId(preSelectedStudentId);
      const std = students.find(s => s.id === preSelectedStudentId);
      if (std) {
        setSelectedClassId(std.classId);
        if (std.currentUmmiJilid) {
          setUmmiJilid(std.currentUmmiJilid);
        }
        if (std.currentUmmiPage) {
          setUmmiPage(std.currentUmmiPage);
        }
      }
    }
  }, [preSelectedStudentId, students]);

  if (!isOpen) return null;

  const currentSurah = SURAH_LIST.find(s => s.number === selectedSurahNumber) || SURAH_LIST[77];
  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0];
  const selectedClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const filteredStudents = students.filter(s => !selectedClassId || s.classId === selectedClassId);

  // Calculate final score for Quran
  const calculateFinalQuranScore = (): number => {
    const sum = 
      scores.kelancaran * 0.25 +
      scores.tajwid * 0.20 +
      scores.makhraj * 0.20 +
      scores.fashahah * 0.15 +
      scores.adab * 0.10 +
      scores.hafalan * 0.10;
    return Math.round(sum);
  };

  const finalQuranScore = calculateFinalQuranScore();
  const scoreCategory: ScoreCategory = calculateCategory(finalQuranScore);
  const totalAyahCalculated = calculateAyahCount(startAyah, endAyah);

  const handleScorePreset = (val: number) => {
    setScores({
      kelancaran: val,
      tajwid: val,
      makhraj: val,
      fashahah: val,
      adab: Math.min(100, val + 5),
      hafalan: val
    });
  };

  const handleQuickPrompt = (promptText: string) => {
    if (activeTab === 'quran') {
      setNotes(promptText);
    } else {
      setUmmiNotes(promptText);
    }
  };

  // Step 1: Pre-save validation
  const handleInitiateSave = () => {
    setValidationError(null);

    if (!selectedStudent) {
      setValidationError('Silakan pilih siswa terlebih dahulu.');
      return;
    }

    if (activeTab === 'quran') {
      const validation = validateAyahRange(selectedSurahNumber, startAyah, endAyah);
      if (!validation.valid) {
        setValidationError(validation.error || 'Rentang ayat tidak valid.');
        return;
      }
      if (totalAyahCalculated <= 0) {
        setValidationError('Jumlah ayat setoran tidak boleh 0.');
        return;
      }
    } else {
      if (ummiPage < 1) {
        setValidationError('Halaman jilid Ummi minimal adalah halaman 1.');
        return;
      }
      if (!ummiMaterial.trim()) {
        setValidationError('Nama materi Ummi wajib diisi.');
        return;
      }
    }

    // Open Verification Modal
    setShowVerificationModal(true);
  };

  // Step 2: Confirmed Save
  const handleConfirmSave = (continueToNextStudent: boolean = false) => {
    const teacherId = currentTeacher?.id || selectedStudent?.teacherId || allTeachers[0]?.id || 't-1';

    if (activeTab === 'quran') {
      const newRecord: MemorizationRecord = {
        id: 'rec-' + Date.now(),
        studentId: selectedStudent.id,
        teacherId: teacherId,
        date: recordDate,
        juz: currentSurah.juzNumber,
        surahNumber: currentSurah.number,
        surahName: currentSurah.name,
        startAyah: Number(startAyah),
        endAyah: Number(endAyah),
        totalAyah: totalAyahCalculated,
        type: setoranType,
        scores: { ...scores },
        finalScore: finalQuranScore,
        category: scoreCategory,
        notes: notes.trim(),
        verified: true,
        tasmiHalamanCount: setoranType === 'Tasmi\'' ? tasmiHalaman : undefined
      };

      if (onSaveMemorization) {
        onSaveMemorization(newRecord);
      }
    } else {
      const newUmmiRecord: UmmiRecord = {
        id: 'ummi-' + Date.now(),
        studentId: selectedStudent.id,
        teacherId: teacherId,
        date: recordDate,
        jilid: ummiJilid,
        page: Number(ummiPage),
        materialName: ummiMaterial.trim(),
        score: Number(ummiScore),
        status: ummiStatus,
        notes: ummiNotes.trim()
      };

      if (onSaveUmmi) {
        onSaveUmmi(newUmmiRecord);
      }
    }

    if (onSaveSuccess) {
      onSaveSuccess();
    }

    // Confetti celebration if score is excellent
    if ((activeTab === 'quran' && finalQuranScore >= 90) || (activeTab === 'ummi' && ummiScore >= 90)) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    }

    setShowVerificationModal(false);

    if (continueToNextStudent) {
      // Find next student in the filtered list
      const currentIndex = filteredStudents.findIndex(s => s.id === selectedStudentId);
      if (currentIndex >= 0 && currentIndex < filteredStudents.length - 1) {
        const nextStudent = filteredStudents[currentIndex + 1];
        setSelectedStudentId(nextStudent.id);
        if (nextStudent.currentUmmiJilid) {
          setUmmiJilid(nextStudent.currentUmmiJilid);
        }
        if (nextStudent.currentUmmiPage) {
          setUmmiPage(nextStudent.currentUmmiPage);
        }
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-[#1E293B] text-white px-5 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-[#1E293B]" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Setoran Hari Ini (Fast Input iPad)
              </h2>
              <p className="text-xs text-slate-400">
                Pencatatan Hafalan Al-Qur'an & Evaluasi Metode Ummi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Periksa Kembali Data Input:</p>
                <p>{validationError}</p>
              </div>
            </div>
          )}

          {/* Step 1: Select Class, Student & Date */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#D4AF37]" />
                1. Pilih Kelas & Siswa
              </span>
              <span className="text-slate-500 font-normal capitalize">
                Guru Penguji: <strong className="text-slate-800">{currentTeacher?.name || 'Ustadz Ahmad Fauzan, Lc.'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Class Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Kelas</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    const firstInClass = students.find(s => s.classId === e.target.value);
                    if (firstInClass) setSelectedStudentId(firstInClass.id);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
                  ))}
                </select>
              </div>

              {/* Student Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Siswa</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    const std = students.find(s => s.id === e.target.value);
                    if (std?.currentUmmiJilid) setUmmiJilid(std.currentUmmiJilid);
                    if (std?.currentUmmiPage) setUmmiPage(std.currentUmmiPage);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  {filteredStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nis} - {s.name} ({s.nickname})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Setoran</label>
                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            {/* Student Preview Pill */}
            {selectedStudent && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <img src={selectedStudent.photo} alt={selectedStudent.name} className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                  <span className="font-bold text-slate-900">{selectedStudent.name}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">
                    {selectedStudent.program}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <span>Capaian: <strong className="text-[#8C7015]">{selectedStudent.totalJuzHafal} Juz</strong></span>
                  <span>Ummi: <strong className="text-slate-800">{selectedStudent.currentUmmiJilid} Hal. {selectedStudent.currentUmmiPage}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Tab Switcher (Quran vs Ummi) */}
          <div className="flex items-center border-b border-slate-200">
            <button
              onClick={() => setActiveTab('quran')}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                activeTab === 'quran'
                  ? 'border-[#D4AF37] text-slate-900 bg-[#D4AF37]/10'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#D4AF37]" />
              Hafalan Al-Qur'an (Ziyadah / Murojaah / Tasmi')
            </button>
            <button
              onClick={() => setActiveTab('ummi')}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                activeTab === 'ummi'
                  ? 'border-[#1E293B] text-slate-900 bg-slate-100'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookMarked className="w-4 h-4 text-[#1E293B]" />
              Pembelajaran Metode Ummi (Jilid 1-6 & Gharib)
            </button>
          </div>

          {/* TAB 1: FORM HAFALAN AL-QUR'AN */}
          {activeTab === 'quran' && (
            <div className="space-y-4">
              
              {/* Type of Setoran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Jenis Setoran</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Hafalan Baru', 'Murojaah', 'Tasmi\''] as SetoranType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSetoranType(t)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        setoranType === t
                          ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {t === 'Tasmi\'' && <Flame className="w-3.5 h-3.5 text-[#D4AF37]" />}
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Surah & Ayah Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {/* Surah dropdown */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Surat Al-Qur'an ({SURAH_LIST.length} Surat)
                  </label>
                  <select
                    value={selectedSurahNumber}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      setSelectedSurahNumber(num);
                      const surah = SURAH_LIST.find(s => s.number === num);
                      if (surah) {
                        setStartAyah(1);
                        setEndAyah(Math.min(surah.totalAyahs, 10));
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    {SURAH_LIST.map((s) => (
                      <option key={s.number} value={s.number}>
                        {s.number}. {s.name} ({s.arabicName}) - {s.totalAyahs} ayat [Juz {s.juzNumber}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Ayah */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Ayat Mulai</label>
                    <button
                      type="button"
                      onClick={() => setStartAyah(1)}
                      className="text-[10px] text-blue-600 hover:underline font-semibold"
                    >
                      Mulai 1
                    </button>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={currentSurah.totalAyahs}
                    value={startAyah}
                    onChange={(e) => setStartAyah(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>

                {/* End Ayah */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Ayat Selesai</label>
                    <button
                      type="button"
                      onClick={() => setEndAyah(currentSurah.totalAyahs)}
                      className="text-[10px] text-[#8C7015] hover:underline font-semibold"
                    >
                      Penuh ({currentSurah.totalAyahs})
                    </button>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={currentSurah.totalAyahs}
                    value={endAyah}
                    onChange={(e) => setEndAyah(Math.min(currentSurah.totalAyahs, Number(e.target.value)))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Real-time Calculation Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#8C7015]" />
                  <span className="font-bold text-slate-800">
                    {currentSurah.name} ({currentSurah.arabicName}) • Ayat {startAyah} – {endAyah}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-medium">Juz {currentSurah.juzNumber}</span>
                  <span className="px-2.5 py-0.5 bg-[#D4AF37] text-slate-900 rounded-full font-bold text-xs shadow-xs">
                    Total: {totalAyahCalculated} Ayat
                  </span>
                </div>
              </div>

              {/* Tasmi' extra count */}
              {setoranType === 'Tasmi\'' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-blue-950">Jumlah Halaman Tasmi' (Sekali Duduk)</p>
                    <p className="text-blue-700 text-[11px]">Dicatat untuk akumulasi ujian kelayakan juz.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={tasmiHalaman}
                      onChange={(e) => setTasmiHalaman(Number(e.target.value))}
                      className="w-20 bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-center"
                    />
                    <span className="font-semibold text-blue-900">Halaman</span>
                  </div>
                </div>
              )}

              {/* 6-Metric Scoring Rubric */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#D4AF37]" />
                    Komponen Penilaian (0–100)
                  </span>
                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-400 mr-1 hidden sm:inline">Preset:</span>
                    {[95, 90, 85, 80, 75].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleScorePreset(preset)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-[#D4AF37]/20 hover:text-slate-900 text-slate-700 font-semibold border border-slate-200 transition cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'kelancaran', label: 'Kelancaran (25%)', color: 'text-blue-700' },
                    { key: 'tajwid', label: 'Tajwid (20%)', color: 'text-emerald-700' },
                    { key: 'makhraj', label: 'Makhraj (20%)', color: 'text-purple-700' },
                    { key: 'fashahah', label: 'Fashahah (15%)', color: 'text-amber-700' },
                    { key: 'adab', label: 'Adab (10%)', color: 'text-rose-700' },
                    { key: 'hafalan', label: 'Daya Hafal (10%)', color: 'text-cyan-700' },
                  ].map(({ key, label, color }) => (
                    <div key={key} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className={`font-semibold ${color}`}>{label}</span>
                        <span className="font-bold text-slate-900">{scores[key as keyof ScoreBreakdown]}</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={scores[key as keyof ScoreBreakdown]}
                        onChange={(e) => setScores({ ...scores, [key]: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                      />
                    </div>
                  ))}
                </div>

                {/* Score Summary Output */}
                <div className="mt-2 p-3 bg-[#1E293B] text-white rounded-xl flex items-center justify-between border border-slate-700">
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Nilai Akhir Otomatis</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#D4AF37] font-serif">{finalQuranScore}</span>
                      <span className="text-xs text-slate-400">/ 100</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400 font-medium">Kategori</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${
                      finalQuranScore >= 90 ? 'bg-[#D4AF37] text-slate-900' :
                      finalQuranScore >= 80 ? 'bg-blue-600 text-white' :
                      finalQuranScore >= 70 ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {scoreCategory}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes & Quick Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Perkembangan Guru</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Alhamdulillah bacaan sangat lancar & tartil.',
                    'Perhatikan hukum ikhfa dan ketebalan huruf tebal.',
                    'Lancar sekali duduk, lanjutkan ke surat berikutnya.',
                    'Perlu murojaah mandiri di rumah bersama orang tua.',
                    'Makharijul huruf sudah sangat baik.'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleQuickPrompt(chip)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  placeholder="Tuliskan catatan khusus untuk siswa dan orang tua..."
                />
              </div>

            </div>
          )}

          {/* TAB 2: FORM PEMBELAJARAN UMMI */}
          {activeTab === 'ummi' && (
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {/* Jilid */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Jilid Metode Ummi</label>
                  <select
                    value={ummiJilid}
                    onChange={(e) => setUmmiJilid(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    {UMMI_JILIDS.map((j) => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>

                {/* Page */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Halaman</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={ummiPage}
                    onChange={(e) => setUmmiPage(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Status Kelulusan</label>
                  <select
                    value={ummiStatus}
                    onChange={(e) => setUmmiStatus(e.target.value as UmmiStatus)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    <option value="Lulus">Lulus (Lanjut Halaman)</option>
                    <option value="Lancar">Lancar</option>
                    <option value="Sedang Dipelajari">Sedang Dipelajari</option>
                    <option value="Perlu Mengulang">Perlu Mengulang</option>
                    <option value="Belum">Belum</option>
                  </select>
                </div>
              </div>

              {/* Material Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Materi / Pokok Bahasan</label>
                <input
                  type="text"
                  value={ummiMaterial}
                  onChange={(e) => setUmmiMaterial(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                  placeholder="Contoh: Mad Thabi'i Alif & Wawu Sukun, Tanwin & Qalqalah"
                />
              </div>

              {/* Ummi Score */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-bold text-slate-800">Nilai Evaluasi Ummi (0–100)</span>
                  <span className="text-lg font-bold text-[#8C7015]">{ummiScore}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={ummiScore}
                  onChange={(e) => setUmmiScore(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>50 (Kurang)</span>
                  <span>75 (Cukup)</span>
                  <span>85 (Baik)</span>
                  <span>100 (Mumtaz)</span>
                </div>
              </div>

              {/* Ummi Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Pembelajaran Ummi</label>
                <textarea
                  rows={2}
                  value={ummiNotes}
                  onChange={(e) => setUmmiNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
                  placeholder="Catatan guru mengenai tajwid, ketukan lagu Ummi, dll..."
                />
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-verifikasi-setoran"
              type="button"
              onClick={handleInitiateSave}
              className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
              <span>Verifikasi & Simpan Data</span>
            </button>
          </div>
        </div>

      </div>

      {/* VERIFICATION & CONFIRMATION MODAL */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 text-[#8C7015] flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi & Verifikasi Setoran
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pastikan data yang Anda input sudah sesuai sebelum dicatat permanen ke riwayat siswa.
              </p>
            </div>

            {/* Summary card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Siswa:</span>
                <span className="font-bold text-slate-900">{selectedStudent.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kelas:</span>
                <span className="font-semibold text-slate-800">{selectedClass.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori:</span>
                <span className="font-semibold text-blue-700">
                  {activeTab === 'quran' ? `Al-Qur'an (${setoranType})` : `Metode Ummi (${ummiJilid})`}
                </span>
              </div>
              {activeTab === 'quran' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Surat & Ayat:</span>
                    <span className="font-bold text-slate-900">
                      {currentSurah.name} : {startAyah} - {endAyah} ({totalAyahCalculated} Ayat)
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Nilai Akhir:</span>
                    <span className="font-bold text-[#8C7015] text-sm">
                      {finalQuranScore} ({scoreCategory})
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Halaman / Materi:</span>
                    <span className="font-bold text-slate-900">
                      Hal. {ummiPage} - {ummiMaterial}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-bold text-slate-900">{ummiStatus}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Nilai:</span>
                    <span className="font-bold text-[#8C7015] text-sm">{ummiScore}</span>
                  </div>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmSave(false)}
                className="w-full py-2.5 px-4 rounded-lg bg-[#D4AF37] hover:bg-[#c49f2c] text-slate-900 font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-900" />
                <span>Simpan & Selesai</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSave(true)}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
              >
                <span>Simpan & Lanjut Siswa Berikutnya</span>
                <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
              </button>

              <button
                type="button"
                onClick={() => setShowVerificationModal(false)}
                className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                Kembali Edit
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
