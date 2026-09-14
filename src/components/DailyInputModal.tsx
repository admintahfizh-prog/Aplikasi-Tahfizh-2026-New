import React, { useState, useEffect, useMemo } from 'react';
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
  Flame,
  ArrowRightLeft,
  Info,
  Edit3
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
import { 
  SURAH_LIST, 
  calculateAyahCount, 
  calculateMultiSurahAyahCount,
  validateAyahRange, 
  validateMultiSurahRange,
  formatHafalanRange,
  calculateCategory 
} from '../data/quranData';
import { UMMI_JILIDS, UMMI_SYLLABUS } from '../data/ummiData';
import { 
  GRADE_CONVERSION_TABLE, 
  getGradeFromScore, 
  getGradeFromLetter, 
  GradeLetter 
} from '../utils/gradeConversion';
import { AvatarBadge } from './AvatarBadge';

interface DailyInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  students?: Student[];
  classes?: ClassItem[];
  currentTeacher?: Teacher;
  allTeachers?: Teacher[];
  onSaveMemorization?: (record: MemorizationRecord) => void;
  onUpdateMemorization?: (record: MemorizationRecord) => void;
  onSaveUmmi?: (record: UmmiRecord) => void;
  onUpdateUmmi?: (record: UmmiRecord) => void;
  preSelectedStudentId?: string;
  initialStudentId?: string;
  onSaveSuccess?: () => void;
  editRecord?: MemorizationRecord | null;
  editUmmiRecord?: UmmiRecord | null;
  defaultTab?: 'quran' | 'ummi';
}

export const DailyInputModal: React.FC<DailyInputModalProps> = ({
  isOpen,
  onClose,
  students = [],
  classes = [],
  currentTeacher,
  allTeachers = [],
  onSaveMemorization,
  onUpdateMemorization,
  onSaveUmmi,
  onUpdateUmmi,
  preSelectedStudentId,
  initialStudentId,
  onSaveSuccess,
  editRecord = null,
  editUmmiRecord = null,
  defaultTab = 'quran'
}) => {
  // Mode: 'quran' | 'ummi'
  const [activeTab, setActiveTab] = useState<'quran' | 'ummi'>(() => {
    if (editUmmiRecord) return 'ummi';
    if (editRecord) return 'quran';
    return defaultTab;
  });

  const effectiveInitialStudentId = preSelectedStudentId || initialStudentId;

  // Step 1: Selection
  const [filterMode, setFilterMode] = useState<'class' | 'halaqah' | 'all'>('class');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(effectiveInitialStudentId || students[0]?.id || '');
  const [recordDate, setRecordDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Quran Form State: Surat Awal & Surat Akhir
  const [selectedStartSurahNumber, setSelectedStartSurahNumber] = useState<number>(78); // Default An-Naba
  const [selectedEndSurahNumber, setSelectedEndSurahNumber] = useState<number>(78); // Default An-Naba
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
  const [ummiJilid, setUmmiJilid] = useState<string>('Jilid 1');
  const [ummiPage, setUmmiPage] = useState<number>(1);
  const [ummiMaterial, setUmmiMaterial] = useState<string>('Huruf Tunggal & Sambung Fathah (A - Ba)');
  const [ummiStatus, setUmmiStatus] = useState<UmmiStatus>('Lulus');
  const [ummiScore, setUmmiScore] = useState<number>(88);
  const [ummiNotes, setUmmiNotes] = useState<string>('Lancar dan memahami kaidah dengan baik.');

  // Grade Guide Modal
  const [showGradeGuide, setShowGradeGuide] = useState<boolean>(false);

  // Verification Modal Step
  const [showVerificationModal, setShowVerificationModal] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state when editRecord or editUmmiRecord changes
  useEffect(() => {
    if (editRecord) {
      setActiveTab('quran');
      setSelectedStudentId(editRecord.studentId);
      setRecordDate(editRecord.date);
      setSelectedStartSurahNumber(editRecord.surahNumber);
      setSelectedEndSurahNumber(editRecord.endSurahNumber || editRecord.surahNumber);
      setStartAyah(editRecord.startAyah);
      setEndAyah(editRecord.endAyah);
      setSetoranType(editRecord.type);
      if (editRecord.scores) {
        setScores(editRecord.scores);
      }
      setNotes(editRecord.notes || '');
      if (editRecord.tasmiHalamanCount) {
        setTasmiHalaman(editRecord.tasmiHalamanCount);
      }
      const std = students.find(s => s.id === editRecord.studentId);
      if (std) setSelectedClassId(std.classId);
    } else if (editUmmiRecord) {
      setActiveTab('ummi');
      setSelectedStudentId(editUmmiRecord.studentId);
      setRecordDate(editUmmiRecord.date);
      setUmmiJilid(editUmmiRecord.jilid);
      setUmmiPage(editUmmiRecord.page);
      setUmmiMaterial(editUmmiRecord.materialName);
      setUmmiScore(editUmmiRecord.score);
      setUmmiStatus(editUmmiRecord.status);
      setUmmiNotes(editUmmiRecord.notes || '');
      const std = students.find(s => s.id === editUmmiRecord.studentId);
      if (std) setSelectedClassId(std.classId);
    } else if (preSelectedStudentId) {
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
  }, [editRecord, editUmmiRecord, preSelectedStudentId, students]);

  if (!isOpen) return null;

  const startSurah = SURAH_LIST.find(s => s.number === selectedStartSurahNumber) || SURAH_LIST[77];
  const endSurah = SURAH_LIST.find(s => s.number === selectedEndSurahNumber) || startSurah;
  const isMultiSurah = selectedStartSurahNumber !== selectedEndSurahNumber;

  const availableClasses = useMemo(() => {
    if (activeTab === 'ummi') {
      return classes.filter(c => c.level === 7 || c.name.startsWith('7'));
    }
    return classes;
  }, [classes, activeTab]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (activeTab === 'ummi') {
        const cls = classes.find(c => c.id === s.classId);
        if (cls && (cls.level === 8 || cls.level === 9 || cls.name.startsWith('8') || cls.name.startsWith('9'))) {
          return false;
        }
        if (s.classId?.includes('8') || s.classId?.includes('9')) {
          return false;
        }
      }
      if (filterMode === 'halaqah' && currentTeacher) {
        return s.teacherId === currentTeacher.id;
      }
      if (filterMode === 'all') {
        return true;
      }
      return !selectedClassId || s.classId === selectedClassId;
    });
  }, [students, activeTab, classes, filterMode, currentTeacher, selectedClassId]);

  const selectedStudent = students.find(s => s.id === selectedStudentId) || filteredStudents[0] || students[0];
  const selectedClass = classes.find(c => c.id === selectedClassId) || availableClasses[0] || classes[0];

  const handleSwitchTab = (tab: 'quran' | 'ummi') => {
    setActiveTab(tab);
    if (tab === 'ummi') {
      const cls = classes.find(c => c.id === selectedClassId);
      const isGrade8Or9 = (cls && (cls.level === 8 || cls.level === 9 || cls.name.startsWith('8') || cls.name.startsWith('9'))) ||
        selectedClassId.includes('8') || selectedClassId.includes('9');
      if (isGrade8Or9 || !selectedClassId) {
        const firstGrade7Class = classes.find(c => c.level === 7 || c.name.startsWith('7')) || classes[0];
        if (firstGrade7Class) {
          setSelectedClassId(firstGrade7Class.id);
          const firstInClass = students.find(s => s.classId === firstGrade7Class.id);
          if (firstInClass) {
            setSelectedStudentId(firstInClass.id);
            if (firstInClass.currentUmmiJilid && firstInClass.currentUmmiJilid !== '-') {
              setUmmiJilid(firstInClass.currentUmmiJilid);
            }
          }
        }
      }
    }
  };

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
  const totalAyahCalculated = calculateMultiSurahAyahCount(
    selectedStartSurahNumber, 
    startAyah, 
    selectedEndSurahNumber, 
    endAyah
  );

  const handleStartSurahChange = (num: number) => {
    setSelectedStartSurahNumber(num);
    const surah = SURAH_LIST.find(s => s.number === num);
    if (surah) {
      setStartAyah(1);
      // Auto adjust end surah if it was on same surah or prior
      if (selectedEndSurahNumber === selectedStartSurahNumber || selectedEndSurahNumber < num) {
        setSelectedEndSurahNumber(num);
        setEndAyah(Math.min(surah.totalAyahs, 10));
      }
    }
  };

  const handleEndSurahChange = (num: number) => {
    setSelectedEndSurahNumber(num);
    const surah = SURAH_LIST.find(s => s.number === num);
    if (surah) {
      if (num === selectedStartSurahNumber) {
        setEndAyah(Math.min(surah.totalAyahs, Math.max(startAyah, endAyah)));
      } else {
        setEndAyah(surah.totalAyahs);
      }
    }
  };

  const handleSetSameSurah = () => {
    setSelectedEndSurahNumber(selectedStartSurahNumber);
    setEndAyah(Math.min(startSurah.totalAyahs, 10));
  };

  const handleSetFullSurah = () => {
    setSelectedEndSurahNumber(selectedStartSurahNumber);
    setStartAyah(1);
    setEndAyah(startSurah.totalAyahs);
  };

  const handleSetNextSurah = () => {
    const nextNum = Math.min(114, selectedStartSurahNumber + 1);
    setSelectedEndSurahNumber(nextNum);
    const nxt = SURAH_LIST.find(s => s.number === nextNum);
    if (nxt) {
      setEndAyah(nxt.totalAyahs);
    }
  };

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
      const validation = validateMultiSurahRange(
        selectedStartSurahNumber, 
        startAyah, 
        selectedEndSurahNumber, 
        endAyah
      );
      if (!validation.valid) {
        setValidationError(validation.error || 'Rentang surat dan ayat tidak valid.');
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
      if (editRecord && onUpdateMemorization) {
        const updatedRecord: MemorizationRecord = {
          ...editRecord,
          studentId: selectedStudent.id,
          date: recordDate,
          juz: startSurah.juzNumber,
          surahNumber: startSurah.number,
          surahName: startSurah.name,
          startAyah: Number(startAyah),
          endSurahNumber: endSurah.number,
          endSurahName: endSurah.name,
          endAyah: Number(endAyah),
          totalAyah: totalAyahCalculated,
          type: setoranType,
          scores: { ...scores },
          finalScore: finalQuranScore,
          category: scoreCategory,
          notes: notes.trim(),
          tasmiHalamanCount: setoranType === 'Tasmi\'' ? tasmiHalaman : undefined
        };
        onUpdateMemorization(updatedRecord);
      } else if (onSaveMemorization) {
        const newRecord: MemorizationRecord = {
          id: 'rec-' + Date.now(),
          studentId: selectedStudent.id,
          teacherId: teacherId,
          date: recordDate,
          juz: startSurah.juzNumber,
          surahNumber: startSurah.number,
          surahName: startSurah.name,
          startAyah: Number(startAyah),
          endSurahNumber: endSurah.number,
          endSurahName: endSurah.name,
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
        onSaveMemorization(newRecord);
      }
    } else {
      if (editUmmiRecord && onUpdateUmmi) {
        const updatedUmmiRecord: UmmiRecord = {
          ...editUmmiRecord,
          studentId: selectedStudent.id,
          date: recordDate,
          jilid: ummiJilid,
          page: Number(ummiPage),
          materialName: ummiMaterial.trim(),
          score: Number(ummiScore),
          status: ummiStatus,
          notes: ummiNotes.trim()
        };
        onUpdateUmmi(updatedUmmiRecord);
      } else if (onSaveUmmi) {
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <span className="flex items-center gap-1.5 font-bold text-slate-700 uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-[#D4AF37]" />
                1. Pilih Sasaran & Siswa
              </span>

              {/* Mode Filter Toggle */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setFilterMode('class')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                    filterMode === 'class' ? 'bg-[#1E293B] text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Per Kelas
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('halaqah')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                    filterMode === 'halaqah' ? 'bg-[#1E293B] text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Halaqah Saya ({students.filter(s => s.teacherId === currentTeacher?.id).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                    filterMode === 'all' ? 'bg-[#1E293B] text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Semua Siswa
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Class Selector (Active when filterMode === 'class') */}
              {filterMode === 'class' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Rombel Kelas {activeTab === 'ummi' && <span className="text-amber-700 font-bold">(Khusus Kelas 7)</span>}
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      const firstInClass = students.find(s => s.classId === e.target.value);
                      if (firstInClass) setSelectedStudentId(firstInClass.id);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    {availableClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
                    ))}
                  </select>
                </div>
              ) : filterMode === 'halaqah' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kelompok Halaqah</label>
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 truncate">
                    Binaan: {currentTeacher?.name || 'Ustadz Pengampu'}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cakupan Penilaian</label>
                  <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 truncate">
                    Semua Siswa / Lintas Kelas
                  </div>
                </div>
              )}

              {/* Student Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Santri ({filteredStudents.length})
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    const std = students.find(s => s.id === e.target.value);
                    if (std?.currentUmmiJilid && std.currentUmmiJilid !== '-') setUmmiJilid(std.currentUmmiJilid);
                    if (std?.currentUmmiPage) setUmmiPage(std.currentUmmiPage);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  {filteredStudents.map(s => {
                    const cls = classes.find(c => c.id === s.classId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({cls?.name || 'Rombel'})
                      </option>
                    );
                  })}
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
                  <AvatarBadge
                    name={selectedStudent.name}
                    photoUrl={selectedStudent.photo}
                    gender={selectedStudent.gender}
                    role="santri"
                    size="sm"
                    className="shrink-0"
                  />
                  <span className="font-bold text-slate-900">{selectedStudent.name}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">
                    {selectedStudent.program}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <span>Capaian: <strong className="text-[#8C7015]">{selectedStudent.totalJuzHafal} Juz</strong></span>
                  <span>
                    Ummi: {selectedStudent.currentUmmiJilid && selectedStudent.currentUmmiJilid !== '-' ? (
                      <strong className="text-slate-800">{selectedStudent.currentUmmiJilid} Hal. {selectedStudent.currentUmmiPage}</strong>
                    ) : (
                      <strong className="text-slate-500 font-normal italic">Tidak Ikut (Kls 8/9 Fokus Tahfizh)</strong>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Tab Switcher (Quran vs Ummi) */}
          <div className="flex items-center border-b border-slate-200">
            <button
              type="button"
              onClick={() => handleSwitchTab('quran')}
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
              type="button"
              onClick={() => handleSwitchTab('ummi')}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
                activeTab === 'ummi'
                  ? 'border-[#1E293B] text-slate-900 bg-slate-100'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookMarked className="w-4 h-4 text-[#1E293B]" />
              <span>Pembelajaran Metode Ummi</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.2 rounded">
                Khusus Kelas 7
              </span>
            </button>
          </div>

          {/* Ummi Notice */}
          {activeTab === 'ummi' && (
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
              <span>
                <strong>Ketentuan Tahun Ini:</strong> Kelas 8 dan 9 tidak mengikuti pembelajaran UMMI dan dialihkan fokus penuh pada Tahfizh Al-Qur'an. Pilihan rombel di atas hanya menampilkan Kelas 7.
              </span>
            </div>
          )}

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

              {/* Surah Awal & Surah Akhir Selection Container */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
                
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                    Pilihan Rentang Surat & Ayat Setoran
                  </span>
                  
                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSetSameSurah}
                      className={`px-2 py-0.5 rounded font-semibold transition cursor-pointer border ${
                        !isMultiSurah 
                          ? 'bg-amber-100 text-amber-900 border-amber-300' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      title="Setoran dalam satu surat yang sama"
                    >
                      Surat Sama
                    </button>
                    <button
                      type="button"
                      onClick={handleSetFullSurah}
                      className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 transition cursor-pointer"
                      title="Setor 1 surat penuh dari ayat pertama sampai akhir"
                    >
                      1 Surat Penuh
                    </button>
                    <button
                      type="button"
                      onClick={handleSetNextSurah}
                      className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-blue-700 font-semibold border border-slate-200 transition cursor-pointer flex items-center gap-1"
                      title="Lanjut ke surat berikutnya (Setoran lintas surat)"
                    >
                      <ArrowRight className="w-3 h-3" />
                      +1 Surat Lanjut
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  
                  {/* CARD 1: SURAT & AYAT AWAL */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Surat & Ayat Awal (Mulai)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Juz {startSurah.juzNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Surat Awal ({startSurah.totalAyahs} ayat)
                        </label>
                        <select
                          value={selectedStartSurahNumber}
                          onChange={(e) => handleStartSurahChange(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                        >
                          {SURAH_LIST.map((s) => (
                            <option key={`start-${s.number}`} value={s.number}>
                              {s.number}. {s.name} ({s.arabicName}) - Juz {s.juzNumber}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-700">Ayat Mulai</label>
                          <button
                            type="button"
                            onClick={() => setStartAyah(1)}
                            className="text-[10px] text-emerald-700 hover:underline font-semibold"
                          >
                            Ayat 1
                          </button>
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={startSurah.totalAyahs}
                          value={startAyah}
                          onChange={(e) => setStartAyah(Math.max(1, Number(e.target.value)))}
                          className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: SURAT & AYAT AKHIR */}
                  <div className={`p-3.5 rounded-lg border space-y-2.5 shadow-2xs transition ${
                    isMultiSurah ? 'bg-amber-50/40 border-amber-300' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Surat & Ayat Akhir (Selesai)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Juz {endSurah.juzNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Surat Akhir ({endSurah.totalAyahs} ayat)
                        </label>
                        <select
                          value={selectedEndSurahNumber}
                          onChange={(e) => handleEndSurahChange(Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                        >
                          {SURAH_LIST.map((s) => (
                            <option key={`end-${s.number}`} value={s.number}>
                              {s.number}. {s.name} ({s.arabicName}) - Juz {s.juzNumber}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-700">Ayat Selesai</label>
                          <button
                            type="button"
                            onClick={() => setEndAyah(endSurah.totalAyahs)}
                            className="text-[10px] text-[#8C7015] hover:underline font-semibold"
                          >
                            Penuh ({endSurah.totalAyahs})
                          </button>
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={endSurah.totalAyahs}
                          value={endAyah}
                          onChange={(e) => setEndAyah(Math.min(endSurah.totalAyahs, Number(e.target.value)))}
                          className="w-full bg-slate-50 focus:bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Real-time Calculation Badge */}
                <div className="flex flex-wrap items-center justify-between p-3 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-xs gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#8C7015] shrink-0" />
                    {!isMultiSurah ? (
                      <span className="font-bold text-slate-900">
                        {startSurah.name} ({startSurah.arabicName}) • Ayat {startAyah} – {endAyah}
                      </span>
                    ) : (
                      <span className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                        <span>QS. {startSurah.name} (Ayat {startAyah})</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#8C7015]" />
                        <span>QS. {endSurah.name} (Ayat {endAyah})</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-slate-700 font-semibold text-[11px]">
                      {startSurah.juzNumber === endSurah.juzNumber 
                        ? `Juz ${startSurah.juzNumber}` 
                        : `Juz ${startSurah.juzNumber} – ${endSurah.juzNumber}`}
                    </span>
                    <span className="px-3 py-1 bg-[#D4AF37] text-slate-950 rounded-full font-extrabold text-xs shadow-xs">
                      Total: {totalAyahCalculated} Ayat
                    </span>
                  </div>
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

                {/* Penilaian Huruf (A, B, C, D) Standar Ummi & Tahfizh */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-bold text-slate-800">Skala Penilaian Huruf (A, B, C, D) Standar Ummi</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGradeGuide(!showGradeGuide)}
                      className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 underline flex items-center gap-1 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5" />
                      {showGradeGuide ? 'Tutup Pedoman' : 'Lihat Pedoman Standar'}
                    </button>
                  </div>

                  {/* Quick Grade Buttons */}
                  <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
                    {GRADE_CONVERSION_TABLE.map((item) => {
                      const isSelected = getGradeFromScore(finalQuranScore).letter === item.letter;
                      return (
                        <button
                          key={item.letter}
                          type="button"
                          onClick={() => handleScorePreset(item.scoreStandard)}
                          className={`p-2 rounded-lg text-center border transition cursor-pointer flex flex-col items-center justify-center ${
                            isSelected
                              ? 'bg-[#1E293B] text-[#D4AF37] border-slate-900 ring-2 ring-[#D4AF37]/50 shadow-xs'
                              : 'bg-white hover:bg-amber-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          <span className="text-sm font-black">{item.letter}</span>
                          <span className="text-[10px] font-mono opacity-80">{item.scoreStandard}</span>
                          <span className={`text-[9px] font-bold px-1 rounded mt-0.5 ${
                            item.canAdvance ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.canAdvance ? 'Lanjut' : 'Ulangi'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Grade Rule Details */}
                  {(() => {
                    const currentGrade = getGradeFromScore(finalQuranScore);
                    return (
                      <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-xs text-slate-700 flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-[#1E293B] text-[#D4AF37] flex items-center justify-center font-black shrink-0 text-sm">
                          {currentGrade.letter}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              Grade {currentGrade.letter} (Nilai: {finalQuranScore}) • {currentGrade.errors}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              currentGrade.canAdvance ? 'bg-blue-600 text-white' : 'bg-amber-500 text-slate-900'
                            }`}>
                              {currentGrade.actionDescription}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                            {currentGrade.ruleDescription}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Expandable Grade Guide Table */}
                  {showGradeGuide && (
                    <div className="mt-2 p-3 bg-white rounded-xl border border-slate-300 shadow-xs overflow-x-auto">
                      <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-emerald-700" />
                        Daftar Konversi Nilai Pengajaran Al-Qur'an Standar Ummi
                      </h4>
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                            <th className="p-1.5 font-bold">Huruf</th>
                            <th className="p-1.5 font-bold">Nilai</th>
                            <th className="p-1.5 font-bold">Salah</th>
                            <th className="p-1.5 font-bold">Keterangan / Kaidah Penilaian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {GRADE_CONVERSION_TABLE.map((row) => (
                            <tr key={row.letter} className="hover:bg-slate-50">
                              <td className="p-1.5 font-bold text-slate-900">{row.letter}</td>
                              <td className="p-1.5 font-mono">{row.scoreRange} ({row.scoreStandard})</td>
                              <td className="p-1.5">{row.errors}</td>
                              <td className="p-1.5 text-slate-600">{row.ruleDescription}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="text-[10px] text-slate-500 mt-2 italic bg-slate-50 p-2 rounded border border-slate-200">
                        *) Catatan: Jika siswa salah dalam membaca namun belum bisa memperbaiki atau tetap salah, maka belum bisa dinaikkan (ulangi halaman).
                      </p>
                    </div>
                  )}
                </div>

                {/* Score Summary Output */}
                <div className="mt-2 p-3 bg-[#1E293B] text-white rounded-xl flex items-center justify-between border border-slate-700">
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium">Nilai Akhir & Predikat Huruf</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#D4AF37] font-serif">{finalQuranScore}</span>
                      <span className="text-xs text-slate-400">/ 100</span>
                      <span className="ml-2 px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-black">
                        Grade {getGradeFromScore(finalQuranScore).letter}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400 font-medium">Status Kategori</p>
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">Materi / Pokok Bahasan</label>
                  <span className="text-[10px] text-slate-400 font-medium">Klik modul di bawah untuk mengisi cepat</span>
                </div>
                
                {/* Syllabus Modules Quick Selector */}
                {(() => {
                  const currSyllabus = UMMI_SYLLABUS.find(s => s.jilid === ummiJilid);
                  if (!currSyllabus || !currSyllabus.modules) return null;
                  return (
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-amber-50/60 rounded-lg border border-amber-200/80">
                      <span className="text-[10px] font-bold text-amber-900 w-full mb-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                        Modul Kurikulum {ummiJilid}:
                      </span>
                      {currSyllabus.modules.map((m, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setUmmiMaterial(`${m.topicTitle} (${m.pageRange})`);
                            const pageMatch = m.pageRange.match(/\d+/);
                            if (pageMatch) {
                              setUmmiPage(Number(pageMatch[0]));
                            }
                          }}
                          className="text-[11px] text-left px-2.5 py-1 rounded bg-white hover:bg-amber-100 text-slate-800 font-semibold border border-amber-300 transition cursor-pointer shadow-2xs"
                        >
                          <span className="font-bold text-amber-800 mr-1">{m.pageRange}:</span>
                          {m.topicTitle}
                        </button>
                      ))}
                    </div>
                  );
                })()}

                <input
                  type="text"
                  value={ummiMaterial}
                  onChange={(e) => setUmmiMaterial(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  placeholder="Contoh: Mad Thabi'i Alif & Wawu Sukun, Tanwin & Qalqalah"
                />
              </div>

              {/* Ummi Score */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-bold text-slate-800">Nilai Evaluasi Ummi (0–100)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#8C7015]">{ummiScore}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-black">
                      Grade {getGradeFromScore(ummiScore).letter}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={ummiScore}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setUmmiScore(val);
                    const grade = getGradeFromScore(val);
                    setUmmiStatus(grade.canAdvance ? 'Lulus' : 'Perlu Mengulang');
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>50 (Kurang)</span>
                  <span>75 (Cukup)</span>
                  <span>85 (Baik)</span>
                  <span>100 (Mumtaz)</span>
                </div>
              </div>

              {/* Penilaian Huruf (A, B, C, D) Standar Ummi */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-slate-800">Skala Penilaian Huruf Metode Ummi (Buku Panduan)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGradeGuide(!showGradeGuide)}
                    className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 underline flex items-center gap-1 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                    {showGradeGuide ? 'Tutup Pedoman' : 'Lihat Pedoman Standar'}
                  </button>
                </div>

                {/* Quick Grade Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
                  {GRADE_CONVERSION_TABLE.map((item) => {
                    const isSelected = getGradeFromScore(ummiScore).letter === item.letter;
                    return (
                      <button
                        key={item.letter}
                        type="button"
                        onClick={() => {
                          setUmmiScore(item.scoreStandard);
                          setUmmiStatus(item.canAdvance ? 'Lulus' : 'Perlu Mengulang');
                        }}
                        className={`p-2 rounded-lg text-center border transition cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-[#1E293B] text-[#D4AF37] border-slate-900 ring-2 ring-[#D4AF37]/50 shadow-xs'
                            : 'bg-white hover:bg-amber-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span className="text-sm font-black">{item.letter}</span>
                        <span className="text-[10px] font-mono opacity-80">{item.scoreStandard}</span>
                        <span className={`text-[9px] font-bold px-1 rounded mt-0.5 ${
                          item.canAdvance ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.canAdvance ? 'Lanjut' : 'Ulangi'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Grade Rule Details */}
                {(() => {
                  const currentGrade = getGradeFromScore(ummiScore);
                  return (
                    <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-xs text-slate-700 flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-[#1E293B] text-[#D4AF37] flex items-center justify-center font-black shrink-0 text-sm">
                        {currentGrade.letter}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            Grade {currentGrade.letter} (Nilai: {ummiScore}) • {currentGrade.errors}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            currentGrade.canAdvance ? 'bg-blue-600 text-white' : 'bg-amber-500 text-slate-900'
                          }`}>
                            {currentGrade.actionDescription}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          {currentGrade.ruleDescription}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Expandable Grade Guide Table */}
                {showGradeGuide && (
                  <div className="mt-2 p-3 bg-white rounded-xl border border-slate-300 shadow-xs overflow-x-auto">
                    <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-700" />
                      Daftar Konversi Nilai Pengajaran Al-Qur'an Standar Ummi
                    </h4>
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                          <th className="p-1.5 font-bold">Huruf</th>
                          <th className="p-1.5 font-bold">Nilai</th>
                          <th className="p-1.5 font-bold">Salah</th>
                          <th className="p-1.5 font-bold">Keterangan / Kaidah Penilaian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {GRADE_CONVERSION_TABLE.map((row) => (
                          <tr key={row.letter} className="hover:bg-slate-50">
                            <td className="p-1.5 font-bold text-slate-900">{row.letter}</td>
                            <td className="p-1.5 font-mono">{row.scoreRange} ({row.scoreStandard})</td>
                            <td className="p-1.5">{row.errors}</td>
                            <td className="p-1.5 text-slate-600">{row.ruleDescription}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-[10px] text-slate-500 mt-2 italic bg-slate-50 p-2 rounded border border-slate-200">
                      *) Catatan: Jika siswa salah dalam membaca namun belum bisa memperbaiki atau tetap salah, maka belum bisa dinaikkan (ulangi halaman).
                    </p>
                  </div>
                )}
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
              <span>{editRecord || editUmmiRecord ? 'Simpan Perubahan Data' : 'Verifikasi & Simpan Data'}</span>
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
                    <span className="font-bold text-slate-900 text-right">
                      {!isMultiSurah 
                        ? `${startSurah.name} : Ayat ${startAyah} – ${endAyah} (${totalAyahCalculated} Ayat)`
                        : `QS. ${startSurah.name} (${startAyah}) s.d. QS. ${endSurah.name} (${endAyah}) - ${totalAyahCalculated} Ayat`}
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
