import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Printer, 
  Share2, 
  Download, 
  Edit3, 
  CheckCircle2, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Calendar,
  Layers,
  Award,
  BookOpen,
  BookMarked,
  Save,
  RotateCcw
} from 'lucide-react';
import { Student, Teacher, ClassItem, MemorizationRecord, UmmiRecord, AppSettings } from '../types';
import { storageService } from '../services/storageService';
import { LogoAlAzhar } from './LogoAlAzhar';
import { LogoMakarima } from './LogoMakarima';

interface StudentRaportCardProps {
  student: Student;
  teacher?: Teacher;
  studentClass?: ClassItem;
  records: MemorizationRecord[];
  ummiRecords: UmmiRecord[];
  settings: AppSettings;
  allStudents?: Student[];
  classes?: ClassItem[];
  onSelectStudent?: (studentId: string) => void;
  onClose?: () => void;
}

export const StudentRaportCard: React.FC<StudentRaportCardProps> = ({
  student,
  teacher,
  studentClass,
  records,
  ummiRecords,
  settings,
  allStudents = [],
  classes = [],
  onSelectStudent,
  onClose
}) => {
  // Class Filter & Sort for Quick Student Navigation
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(student.classId || '');
  const [sortBy, setSortBy] = useState<'class-asc' | 'name-asc' | 'nis-asc'>('class-asc');

  // Sorted and filtered students list for switcher
  const sortedNavStudents = useMemo(() => {
    const list = selectedClassFilter 
      ? allStudents.filter(s => s.classId === selectedClassFilter) 
      : allStudents;

    return [...list].sort((a, b) => {
      if (sortBy === 'class-asc') {
        const clsA = classes.find(c => c.id === a.classId)?.name || '';
        const clsB = classes.find(c => c.id === b.classId)?.name || '';
        const clsComp = clsA.localeCompare(clsB);
        if (clsComp !== 0) return clsComp;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'nis-asc') {
        return (a.nis || '').localeCompare(b.nis || '');
      }
      return 0;
    });
  }, [allStudents, selectedClassFilter, sortBy, classes]);
  // Period state
  const [periodTitle, setPeriodTitle] = useState<string>('TENGAH SEMESTER 1');
  const [academicYear, setAcademicYear] = useState<string>(settings.academicYear || '2026/2027');
  
  // Halaqah / Category (Akselerasi, Reguler, Khusus)
  const normalizeHalaqah = (prog?: string): string => {
    if (!prog) return 'Reguler';
    const p = prog.toLowerCase();
    if (p.includes('aksel') || p.includes('unggul')) return 'Akselerasi';
    if (p.includes('khusus') || p.includes('takhassus')) return 'Khusus';
    return 'Reguler';
  };

  const [halaqahType, setHalaqahType] = useState<string>(
    normalizeHalaqah(student.program)
  );

  // Tahfizh Progress
  const [suratAyatCapaian, setSuratAyatCapaian] = useState<string>(
    student.lastHafalan || 'Al-Muzzammil : 9'
  );
  const [targetSuratAyat, setTargetSuratAyat] = useState<string>('Al-A\'raf : 2');
  const [keteranganTahfizh, setKeteranganTahfizh] = useState<string>('Tercapai / Sesuai Target');

  // Attendance / Disiplin
  const [alphaCount, setAlphaCount] = useState<number>(0);
  const [izinCount, setIzinCount] = useState<number>(0);
  const [sakitCount, setSakitCount] = useState<number>(0);
  
  const studentViolations = storageService.getViolationsByStudent(student.id);
  const violationSummaryText = () => {
    if (!studentViolations || studentViolations.length === 0) {
      return '-';
    }
    const grouped: { [key: string]: number } = {};
    studentViolations.forEach(v => {
      grouped[v.typeName] = (grouped[v.typeName] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, count]) => `${name} (${count}x)`)
      .join(', ');
  };

  const [pelanggaranNotes, setPelanggaranNotes] = useState<string>(violationSummaryText());

  // Query all Ummi records for this student (sorted by date descending)
  const studentUmmiRecords = useMemo(() => {
    const rawList = ummiRecords && ummiRecords.length > 0
      ? ummiRecords.filter(r => r.studentId === student.id)
      : storageService.getUmmiRecords().filter(r => r.studentId === student.id);
    
    return [...rawList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ummiRecords, student.id]);

  const latestUmmiRecord = studentUmmiRecords[0];

  // Derive initial values based on latest Ummi input or student record
  const computeUmmiCapaian = (std: Student, rec?: UmmiRecord) => {
    if (rec && rec.jilid && rec.page) {
      return `${rec.jilid} halaman ${rec.page}`;
    }
    if (std.currentUmmiJilid) {
      return `${std.currentUmmiJilid} halaman ${std.currentUmmiPage || 1}`;
    }
    return 'Jilid 1 halaman 1';
  };

  const computeUmmiNilai = (std: Student, rec?: UmmiRecord) => {
    if (rec && rec.score !== undefined && rec.score !== null) {
      return String(rec.score);
    }
    if (std.avgScore) {
      return String(Math.round(std.avgScore));
    }
    return '88';
  };

  // Capaian UMMI (Format tabel: Capaian UMMI -> Jilid/Tilawah/Gharib/Tajwid & Nilai)
  const [ummiCapaianDescription, setUmmiCapaianDescription] = useState<string>(
    computeUmmiCapaian(student, latestUmmiRecord)
  );
  const [ummiNilaiScore, setUmmiNilaiScore] = useState<string>(
    computeUmmiNilai(student, latestUmmiRecord)
  );

  // Sync state when student or Ummi records change
  useEffect(() => {
    setUmmiCapaianDescription(computeUmmiCapaian(student, latestUmmiRecord));
    setUmmiNilaiScore(computeUmmiNilai(student, latestUmmiRecord));
    setSuratAyatCapaian(student.lastHafalan || 'Al-Muzzammil : 9');
    setHalaqahType(normalizeHalaqah(student.program));
  }, [student.id, student.currentUmmiJilid, student.currentUmmiPage, latestUmmiRecord]);

  // Teacher Notes
  const [teacherNotes, setTeacherNotes] = useState<string>(
    `Alhamdulillah ananda ${student.nickname || student.name.split(' ')[0]} menunjukkan kedisiplinan dan semangat yang sangat baik dalam halaqah tahfizh dan pembiasaan tartil metode Ummi. Pertahankan kelancaran muraja'ah di rumah dan tingkatkan pengulangan ayat baru.`
  );

  // Signatures
  const [headmasterName, setHeadmasterName] = useState<string>(settings.headmasterName || 'H. M. Ridwan, M.Pd.I');
  const [headmasterNik, setHeadmasterNik] = useState<string>('01.0125');
  const [waliKelasName, setWaliKelasName] = useState<string>(
    teacher?.name || 'Sekar Ningtyas Dewi Pratiwi, S.Pd'
  );
  const [waliKelasNik, setWaliKelasNik] = useState<string>(
    teacher?.nip || '02.0367'
  );
  const [cityDate, setCityDate] = useState<string>(
    `Sukoharjo, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
  );

  // Edit Mode toggle in UI
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const phone = student.parentPhone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const msg = encodeURIComponent(
      `*LAPORAN PERKEMBANGAN TAHFIZH & METODE UMMI*\n` +
      `*SMP ISLAM AL AZHAR 21 SUKOHARJO*\n` +
      `Periode: ${periodTitle} (${academicYear})\n\n` +
      `*Nama Santri:* ${student.name}\n` +
      `*NIS/NISN:* ${student.nis} / ${student.nisn}\n` +
      `*Kelas:* ${studentClass?.name || '8 E'}\n` +
      `*Halaqah:* ${halaqahType}\n\n` +
      `*I. Ketercapaian Tahfizh:* ${suratAyatCapaian} (Target: ${targetSuratAyat})\n` +
      `*II. Kedisiplinan:* A: ${alphaCount}, I: ${izinCount}, S: ${sakitCount}\n` +
      `*III. Capaian UMMI:* ${ummiCapaianDescription} (Nilai: ${ummiNilaiScore || '-'})\n\n` +
      `*Catatan Guru Pembimbing:* "${teacherNotes}"\n\n` +
      `_Laporan lengkap dapat diunduh di Portal Wali Santri SMPI Al Azhar 21._`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  // Find next and prev student index within sortedNavStudents
  const currentIndex = sortedNavStudents.findIndex(s => s.id === student.id);
  const prevStudent = currentIndex > 0 ? sortedNavStudents[currentIndex - 1] : null;
  const nextStudent = currentIndex >= 0 && currentIndex < sortedNavStudents.length - 1 ? sortedNavStudents[currentIndex + 1] : null;

  return (
    <div className="space-y-6">
      
      {/* SCREEN CONTROLS BAR (Hidden during print) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer text-xs font-bold"
            >
              ← Kembali
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold">
                Format Resmi Sekolah
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Raport Individu: {student.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              NIS: <strong className="text-slate-700">{student.nis}</strong> • Kelas: <strong className="text-slate-700">{studentClass?.name || 'Kelas'}</strong> • Wali: {student.parentName}
            </p>
          </div>
        </div>

        {/* Student Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {allStudents.length > 1 && onSelectStudent && (
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1.5 border border-slate-200">
              {/* Filter Rombel Kelas */}
              {classes.length > 0 && (
                <select
                  value={selectedClassFilter}
                  onChange={(e) => {
                    const newClassId = e.target.value;
                    setSelectedClassFilter(newClassId);
                    const firstInClass = allStudents.find(s => !newClassId || s.classId === newClassId);
                    if (firstInClass) onSelectStudent(firstInClass.id);
                  }}
                  className="bg-white text-[11px] font-bold text-slate-800 px-2 py-1 rounded-lg border border-slate-200 focus:outline-none max-w-[130px]"
                >
                  <option value="">Semua Kelas</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>Kelas {c.name}</option>
                  ))}
                </select>
              )}

              {/* Prev / Next & Student Select */}
              <div className="flex items-center bg-white rounded-lg border border-slate-200">
                <button
                  disabled={!prevStudent}
                  onClick={() => prevStudent && onSelectStudent(prevStudent.id)}
                  className="p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  title="Siswa Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <select
                  value={student.id}
                  onChange={(e) => onSelectStudent(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 px-2 py-1 focus:outline-none max-w-[170px] truncate"
                >
                  {sortedNavStudents.map(s => {
                    const cls = classes.find(c => c.id === s.classId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} {cls ? `(${cls.name})` : ''}
                      </option>
                    );
                  })}
                </select>

                <button
                  disabled={!nextStudent}
                  onClick={() => nextStudent && onSelectStudent(nextStudent.id)}
                  className="p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  title="Siswa Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              isCustomizing 
                ? 'bg-amber-500 text-slate-950 border-amber-600' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isCustomizing ? 'Tutup Editor' : 'Sesuaikan Nilai'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Kirim Ringkasan ke WhatsApp Wali"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Kirim ke WA</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#D4AF37]" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* CUSTOMIZATION DRAWER / FORM (If teacher wants to customize values before printing) */}
      {isCustomizing && (
        <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-2xl text-xs space-y-4 no-print animate-in fade-in">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
            <h3 className="font-bold text-amber-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Editor Data Raport (Otomatis Disimpan Saat Dicetak)
            </h3>
            <span className="text-[11px] text-amber-800">Ubah nilai / catatan langsung di sini</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Periode Semester:</label>
              <select
                value={periodTitle}
                onChange={(e) => setPeriodTitle(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              >
                <option value="TENGAH SEMESTER 1">TENGAH SEMESTER 1 (PTS 1)</option>
                <option value="AKHIR SEMESTER 1">AKHIR SEMESTER 1 (PAS 1)</option>
                <option value="TENGAH SEMESTER 2">TENGAH SEMESTER 2 (PTS 2)</option>
                <option value="AKHIR SEMESTER 2">AKHIR SEMESTER 2 (PAS 2)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran:</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Halaqah Tahfizh:</label>
              <select
                value={halaqahType}
                onChange={(e) => setHalaqahType(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Akselerasi">Akselerasi</option>
                <option value="Reguler">Reguler</option>
                <option value="Khusus">Khusus</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Capaian Surat / Ayat:</label>
              <input
                type="text"
                value={suratAyatCapaian}
                onChange={(e) => setSuratAyatCapaian(e.target.value)}
                placeholder="Contoh: Al-Muzzammil : 9"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>
          </div>

          {/* Row 2: Target & Ketidakhadiran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Hafalan:</label>
              <input
                type="text"
                value={targetSuratAyat}
                onChange={(e) => setTargetSuratAyat(e.target.value)}
                placeholder="Contoh: Al-A'raf : 2"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alpha (A):</label>
              <input
                type="number"
                min="0"
                value={alphaCount}
                onChange={(e) => setAlphaCount(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Izin (I):</label>
              <input
                type="number"
                min="0"
                value={izinCount}
                onChange={(e) => setIzinCount(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Sakit (S):</label>
              <input
                type="number"
                min="0"
                value={sakitCount}
                onChange={(e) => setSakitCount(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>
          </div>

          {/* Row 3: Capaian UMMI (Jilid/Tilawah/Gharib/Tajwid & Nilai) */}
          <div className="bg-white p-3 rounded-lg border border-amber-300 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 text-[#D4AF37]" />
                Capaian Metode Ummi Santri
              </span>
              {latestUmmiRecord && (
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                  ✓ Otomatis dari input terakhir: {latestUmmiRecord.jilid} hal. {latestUmmiRecord.page} (Nilai: {latestUmmiRecord.score})
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Capaian UMMI (Jilid/Tilawah/Gharib/Tajwid):
                </label>
                <input
                  type="text"
                  value={ummiCapaianDescription}
                  onChange={(e) => setUmmiCapaianDescription(e.target.value)}
                  placeholder="Contoh: Jilid 1 halaman 13"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nilai Capaian UMMI:
                </label>
                <input
                  type="text"
                  value={ummiNilaiScore}
                  onChange={(e) => setUmmiNilaiScore(e.target.value)}
                  placeholder="Nilai (contoh: 88 atau kosong)"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-xs text-center"
                />
              </div>
            </div>

            {/* Quick selector from Ummi input history */}
            {studentUmmiRecords.length > 0 && (
              <div className="pt-1 border-t border-slate-100">
                <span className="text-[10px] text-slate-500 font-semibold block mb-1">
                  Pilih dari riwayat input pembelajaran Ummi ananda:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {studentUmmiRecords.slice(0, 5).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setUmmiCapaianDescription(`${r.jilid} halaman ${r.page}`);
                        setUmmiNilaiScore(String(r.score));
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                        ummiCapaianDescription === `${r.jilid} halaman ${r.page}`
                          ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold'
                          : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200'
                      }`}
                      title={`Klik untuk mengisi raport dengan data setoran tanggal ${r.date}`}
                    >
                      <span>{r.jilid} hal. {r.page}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-amber-900 font-bold">Nilai: {r.score}</span>
                      <span className="text-[10px] text-slate-400">({r.date})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Row 4: Catatan Pembimbing */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan Pembimbing / Evaluasi:</label>
            <textarea
              rows={2}
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-normal text-xs"
            />
          </div>

          {/* Row 5: Tanda Tangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Wali Kelas / Guru Pengampu:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={waliKelasName}
                  onChange={(e) => setWaliKelasName(e.target.value)}
                  className="w-2/3 p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                />
                <input
                  type="text"
                  value={waliKelasNik}
                  onChange={(e) => setWaliKelasNik(e.target.value)}
                  placeholder="NIK Guru"
                  className="w-1/3 p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Kepala Sekolah & NIK:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={headmasterName}
                  onChange={(e) => setHeadmasterName(e.target.value)}
                  className="w-2/3 p-2 bg-white border border-slate-300 rounded-lg font-semibold"
                />
                <input
                  type="text"
                  value={headmasterNik}
                  onChange={(e) => setHeadmasterNik(e.target.value)}
                  placeholder="NIK Kepala"
                  className="w-1/3 p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINTABLE OFFICIAL RAPORT CONTAINER (EXACT 1:1 REPLICA OF REQUESTED PDF)  */}
      {/* ========================================================================= */}
      <div className="flex justify-center">
        <div 
          ref={printAreaRef}
          className="raport-sheet bg-white text-slate-900 w-full max-w-[800px] min-h-[1130px] p-8 sm:p-12 border border-slate-300 shadow-md relative print:shadow-none print:border-none print:p-8 print:m-0 print:w-full print:max-w-none"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          {/* ORNATE CERTIFICATE BORDER (Classic Guilloche Decorative Frame) */}
          <div className="absolute inset-3.5 sm:inset-5 pointer-events-none border-[3px] border-slate-800 rounded-xs">
            {/* Inner Thin Border */}
            <div className="absolute inset-1.5 border border-slate-700"></div>
            
            {/* Corner Arabesque Embellishments (Top-Left) */}
            <svg className="absolute -top-1 -left-1 w-8 h-8 text-slate-800" viewBox="0 0 100 100" fill="currentColor">
              <path d="M0,0 L40,0 C30,10 20,20 15,35 C10,20 0,10 0,0 Z M0,0 L0,40 C10,30 20,20 35,15 C20,10 10,0 0,0 Z" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            {/* Top-Right */}
            <svg className="absolute -top-1 -right-1 w-8 h-8 text-slate-800 rotate-90" viewBox="0 0 100 100" fill="currentColor">
              <path d="M0,0 L40,0 C30,10 20,20 15,35 C10,20 0,10 0,0 Z M0,0 L0,40 C10,30 20,20 35,15 C20,10 10,0 0,0 Z" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            {/* Bottom-Left */}
            <svg className="absolute -bottom-1 -left-1 w-8 h-8 text-slate-800 -rotate-90" viewBox="0 0 100 100" fill="currentColor">
              <path d="M0,0 L40,0 C30,10 20,20 15,35 C10,20 0,10 0,0 Z M0,0 L0,40 C10,30 20,20 35,15 C20,10 10,0 0,0 Z" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            {/* Bottom-Right */}
            <svg className="absolute -bottom-1 -right-1 w-8 h-8 text-slate-800 rotate-180" viewBox="0 0 100 100" fill="currentColor">
              <path d="M0,0 L40,0 C30,10 20,20 15,35 C10,20 0,10 0,0 Z M0,0 L0,40 C10,30 20,20 35,15 C20,10 10,0 0,0 Z" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>

          {/* INNER REPORT CONTENT */}
          <div className="relative z-10 px-4 sm:px-6 py-2 space-y-4 text-[13px] leading-relaxed">
            
            {/* HEADER: LOGO AL AZHAR (LEFT) - BISMILLAH (CENTER) - LOGO MAKARIMA (RIGHT) */}
            <div className="flex items-center justify-between gap-2 border-b border-transparent pb-1">
              {/* Left Logo: SMPI Al Azhar 21 */}
              <div className="w-18 flex justify-start">
                <LogoAlAzhar size={68} className="w-16 h-16" />
              </div>

              {/* Center Arabic Calligraphy: Bismillah */}
              <div className="text-center flex-1 px-2">
                <div 
                  className="text-2xl sm:text-3xl text-slate-900 font-serif leading-none tracking-wide select-none"
                  style={{ fontFamily: "'Traditional Arabic', 'Amiri', 'Scheherazade New', serif" }}
                >
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
              </div>

              {/* Right Logo: Makarima */}
              <div className="w-18 flex justify-end">
                <LogoMakarima size={68} className="w-16 h-16" />
              </div>
            </div>

            {/* DOCUMENT TITLE */}
            <div className="text-center space-y-0.5 pt-1">
              <h1 className="text-[14px] sm:text-[15px] font-black uppercase tracking-tight text-slate-950">
                LAPORAN PROGRAM TAHFIZHUL QUR'AN DAN PERKEMBANGAN METODE UMMI
              </h1>
              <h2 className="text-[13px] sm:text-[14px] font-bold uppercase text-slate-900">
                SMP ISLAM AL AZHAR 21 SUKOHARJO
              </h2>
              <div className="inline-block border-b-2 border-slate-900 pb-0.5">
                <p className="text-[12px] sm:text-[13px] font-extrabold uppercase text-slate-900">
                  {periodTitle}
                </p>
              </div>
              <p className="text-[12px] font-bold text-slate-800">
                Tahun Ajaran {academicYear}
              </p>
            </div>

            {/* IDENTITAS SANTRI (Aligned key-value format) */}
            <div className="pt-2 text-[12.5px]">
              <table className="w-full border-none">
                <tbody>
                  <tr>
                    <td className="w-36 py-0.5 font-bold text-slate-900">Nama</td>
                    <td className="w-4 text-center font-bold">:</td>
                    <td className="py-0.5 font-bold text-slate-900 uppercase">{student.name}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-bold text-slate-900">No. Induk / NISN</td>
                    <td className="text-center font-bold">:</td>
                    <td className="py-0.5 font-bold text-slate-800 font-mono text-[12px]">
                      {student.nis} / {student.nisn || '0128437712'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-bold text-slate-900">Kelas</td>
                    <td className="text-center font-bold">:</td>
                    <td className="py-0.5 font-bold text-slate-900">{studentClass?.name || '8 E'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 font-bold text-slate-900">Halaqah Tahfizh</td>
                    <td className="text-center font-bold">:</td>
                    <td className="py-0.5 font-bold text-slate-900">{halaqahType}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========================================================================= */}
            {/* I. KETERCAPAIAN TAHFIZH                                                    */}
            {/* ========================================================================= */}
            <div className="space-y-1 pt-1">
              <h3 className="font-bold text-[13px] text-slate-950">
                I. &nbsp; Ketercapaian Tahfizh
              </h3>

              <table className="w-full text-center text-[12px] border border-slate-900 border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-900">
                    <th colSpan={3} className="py-1 px-2 font-bold text-slate-900">
                      Capaian Tahfizhul Qur'an
                    </th>
                  </tr>
                  <tr className="bg-white border-b border-slate-900 text-slate-900 font-bold">
                    <th className="py-1 px-2 border-r border-slate-900 w-1/3">Surat / Ayat</th>
                    <th className="py-1 px-2 border-r border-slate-900 w-1/3">Target</th>
                    <th className="py-1 px-2 w-1/3">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-900">
                    <td className="py-1.5 px-2 border-r border-slate-900 font-semibold">{suratAyatCapaian}</td>
                    <td className="py-1.5 px-2 border-r border-slate-900 font-semibold">{targetSuratAyat}</td>
                    <td className="py-1.5 px-2 font-semibold text-slate-800">{keteranganTahfizh}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========================================================================= */}
            {/* II. KEDISIPLINAN                                                          */}
            {/* ========================================================================= */}
            <div className="space-y-1 pt-1">
              <h3 className="font-bold text-[13px] text-slate-950">
                II. &nbsp; Kedisiplinan
              </h3>

              <table className="w-full text-[12px] border border-slate-900 border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-900 text-slate-900 font-bold">
                    <th className="py-1 px-3 border-r border-slate-900 w-1/2 text-center">Ketidakhadiran</th>
                    <th className="py-1 px-3 w-1/2 text-center">Pelanggaran</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {/* Left: Ketidakhadiran list */}
                    <td className="p-2 border-r border-slate-900 align-top">
                      <div className="space-y-0.5 px-4 font-mono text-[12px]">
                        <div className="flex">
                          <span className="w-8 font-bold font-sans">A</span>
                          <span className="w-4 text-center">:</span>
                          <span className="font-bold">{alphaCount}</span>
                          <span className="ml-2 font-sans text-slate-700">kali</span>
                        </div>
                        <div className="flex">
                          <span className="w-8 font-bold font-sans">I</span>
                          <span className="w-4 text-center">:</span>
                          <span className="font-bold">{izinCount}</span>
                          <span className="ml-2 font-sans text-slate-700">kali</span>
                        </div>
                        <div className="flex">
                          <span className="w-8 font-bold font-sans">S</span>
                          <span className="w-4 text-center">:</span>
                          <span className="font-bold">{sakitCount}</span>
                          <span className="ml-2 font-sans text-slate-700">kali</span>
                        </div>
                      </div>
                    </td>

                    {/* Right: Pelanggaran */}
                    <td className="p-2 text-center align-middle font-medium text-slate-800">
                      {pelanggaranNotes}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========================================================================= */}
            {/* III. PERKEMBANGAN INDIVIDU METODE UMMI (SESUAI FORMAT GAMBAR)             */}
            {/* ========================================================================= */}
            <div className="space-y-1 pt-1">
              <h3 className="font-bold text-[13px] text-slate-950">
                III. &nbsp; Perkembangan Individu Metode Ummi
              </h3>

              <table className="w-full text-[12px] border border-slate-900 border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-900 text-slate-900">
                    <th colSpan={2} className="py-1.5 px-3 text-center font-bold text-[12px]">
                      Capaian UMMI
                    </th>
                  </tr>
                  <tr className="bg-white border-b border-slate-900 text-slate-900 font-bold">
                    <th className="py-1 px-3 border-r border-slate-900 text-left w-8/12 font-bold">
                      Jilid/Tilawah/Gharib/Tajwid
                    </th>
                    <th className="py-1 px-3 text-center w-4/12 font-bold">
                      Nilai
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-900 font-normal text-slate-900">
                      {ummiCapaianDescription}
                    </td>
                    <td className="py-2 px-3 text-center font-bold font-mono text-slate-900">
                      {ummiNilaiScore}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========================================================================= */}
            {/* IV. CATATAN                                                               */}
            {/* ========================================================================= */}
            <div className="space-y-1 pt-1">
              <h3 className="font-bold text-[13px] text-slate-950">
                IV. &nbsp; Catatan
              </h3>

              <div className="border border-slate-900 p-2.5 min-h-[56px] text-[12px] text-slate-900 leading-normal">
                {teacherNotes || '-'}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* TANDA TANGAN (SIGNATURES)                                                 */}
            {/* ========================================================================= */}
            <div className="pt-6 grid grid-cols-2 text-center text-[12px]">
              {/* Left Signature: Kepala Sekolah */}
              <div className="flex flex-col items-center justify-between min-h-[100px]">
                <div>
                  <p className="text-slate-800">Mengetahui,</p>
                  <p className="font-bold text-slate-950 uppercase">
                    Kepala SMP ISLAM AL AZHAR 21 SUKOHARJO
                  </p>
                </div>
                
                {/* Signature space / line */}
                <div className="pt-14">
                  <p className="font-bold text-slate-950 underline underline-offset-2">
                    {headmasterName}
                  </p>
                  <p className="text-[11px] font-mono text-slate-800 mt-0.5">
                    NIK. {headmasterNik}
                  </p>
                </div>
              </div>

              {/* Right Signature: Wali Kelas / Guru Pengampu */}
              <div className="flex flex-col items-center justify-between min-h-[100px]">
                <div>
                  <p className="text-slate-800">{cityDate}</p>
                  <p className="font-bold text-slate-950">
                    Wali Kelas / Guru Pengampu
                  </p>
                </div>
                
                {/* Signature space / line */}
                <div className="pt-14">
                  <p className="font-bold text-slate-950 underline underline-offset-2">
                    {waliKelasName}
                  </p>
                  <p className="text-[11px] font-mono text-slate-800 mt-0.5">
                    NIK. {waliKelasNik}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};
