import React, { useState } from 'react';
import { 
  HeartHandshake, 
  BookOpen, 
  BookMarked, 
  Award, 
  Phone, 
  Printer, 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  TrendingUp, 
  BellRing,
  User,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Student, Teacher, ClassItem, MemorizationRecord, UmmiRecord, AppSettings } from '../types';

interface ParentPortalViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassItem[];
  records: MemorizationRecord[];
  ummiRecords: UmmiRecord[];
  settings: AppSettings;
  onOpenStudentDetail: (studentId: string) => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  students,
  teachers,
  classes,
  records,
  ummiRecords,
  settings,
  onOpenStudentDetail
}) => {
  // In parent mode, allow selecting child (default to first student)
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');

  const student = students.find(s => s.id === selectedStudentId) || students[0];
  const teacher = teachers.find(t => t.id === student?.teacherId);
  const studentClass = classes.find(c => c.id === student?.classId);

  const studentRecords = records.filter(r => r.studentId === student?.id);
  const studentUmmiRecords = ummiRecords.filter(r => r.studentId === student?.id);

  if (!student) {
    return <div className="p-8 text-center bg-white rounded-2xl">Data santri belum tersedia.</div>;
  }

  const progressPercent = Math.min(100, Math.round((student.totalJuzHafal / student.targetJuz) * 100));

  const handleWhatsAppTeacher = () => {
    if (!teacher) return;
    const phone = teacher.phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const msg = encodeURIComponent(
      `Assalamu'alaikum Warahmatullahi Wabarakatuh Ustadz/Ustadzah ${teacher.name}.\n\nSaya orang tua dari ${student.name} (Kelas ${studentClass?.name}).\nMohon izin berkonsultasi mengenai perkembangan hafalan dan pembelajaran Metode Ummi ananda. Jazaakumullah khairan.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      
      {/* Header Banner */}
      <div className="bg-[#1E293B] text-white rounded-xl p-6 sm:p-7 shadow-xs border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold border border-[#D4AF37]/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Portal Khusus Orang Tua / Wali Santri
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Pantau Hafalan & Pembelajaran Ananda
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Laporan real-time mutaba'ah Yaumiyah hafalan Al-Qur'an dan kenaikan jilid Metode Ummi putra-putri Anda di {settings.schoolName}.
            </p>
          </div>

          {/* Child Selector if multiple children */}
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-1.5">
            <label className="block text-[11px] font-bold text-[#D4AF37]">Pilih Putra/Putri:</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full py-1.5 px-3 bg-white text-slate-900 font-semibold rounded-lg text-xs focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} (Kelas {classes.find(c => c.id === s.classId)?.name})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Child Profile & Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/70 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <img
              src={student.photo}
              alt={student.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover ring-2 ring-[#D4AF37] shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Kelas {studentClass?.name}
                </span>
                <span className="text-xs font-mono text-slate-400">NIS: {student.nis}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                {student.name}
              </h2>
              <p className="text-xs text-slate-500">
                Guru Pembimbing: <strong className="text-slate-800">{teacher?.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleWhatsAppTeacher}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Chat WA Guru Pembimbing</span>
            </button>

            <button
              onClick={() => onOpenStudentDetail(student.id)}
              className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Lihat Raport Lengkap</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Capaian Hafalan */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Target Hafalan Semester Ini</span>
              <span className="font-bold text-[#8C7015] text-sm">{student.totalJuzHafal} Juz / {student.targetJuz} Juz ({progressPercent}%)</span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  progressPercent >= 75 ? 'bg-emerald-500' :
                  progressPercent >= 40 ? 'bg-[#D4AF37]' : 'bg-[#1E293B]'
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            
            <p className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Sisa target: <strong>{(student.targetJuz - student.totalJuzHafal).toFixed(1)} Juz</strong></span>
              <span className="text-emerald-700 font-bold">🟢 Status: On-Track</span>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Juz Hafal</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{student.totalJuzHafal} Juz</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Jilid Metode Ummi</span>
              <p className="text-xs font-bold text-emerald-800 mt-1">{student.currentUmmiJilid} (Hal. {student.currentUmmiPage})</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Rata-rata Nilai</span>
              <p className="text-lg font-bold text-emerald-700 mt-0.5">{student.avgScore}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Hafalan Terakhir</span>
              <p className="text-xs font-bold text-[#1E293B] truncate mt-1">{student.lastHafalan}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Columns: Riwayat Setoran Terakhir & Catatan Evaluasi Guru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Setoran Hafalan Terakhir */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#D4AF37]" />
              Riwayat Setoran Hafalan Terbaru
            </h3>
            <span className="text-xs text-slate-400">{studentRecords.length} Setoran</span>
          </div>

          <div className="divide-y divide-slate-100">
            {studentRecords.slice(0, 4).map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-900">{r.surahName} (Ayat {r.startAyah}–{r.endAyah})</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{r.date} • {r.type} • Juz {r.juz}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    r.finalScore >= 90 ? 'bg-emerald-100 text-emerald-800' :
                    r.finalScore >= 80 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Nilai: {r.finalScore}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{r.category}</p>
                </div>
              </div>
            ))}
          </div>

          {studentRecords.length === 0 && (
            <p className="text-center py-6 text-slate-400 text-xs">Belum ada riwayat setoran.</p>
          )}
        </div>

        {/* Catatan Pembinaan & Evaluasi Metode Ummi */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <BookMarked className="w-4 h-4 text-emerald-600" />
              Catatan Evaluasi Guru Pembimbing
            </h3>
            <span className="text-xs text-slate-400">Metode Ummi</span>
          </div>

          <div className="divide-y divide-slate-100">
            {studentUmmiRecords.slice(0, 4).map((u) => (
              <div key={u.id} className="py-3 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-800">{u.jilid} — Halaman {u.page}</span>
                  <span className="text-[11px] text-slate-400">{u.date}</span>
                </div>
                <p className="text-slate-700 text-[11px] italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                  "{u.notes || 'Ananda membaca dengan tartil dan memahami kaidah bacaan dengan baik.'}"
                </p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Materi: {u.materialName}</span>
                  <span className="font-semibold text-emerald-700">Status: {u.status}</span>
                </div>
              </div>
            ))}
          </div>

          {studentUmmiRecords.length === 0 && (
            <p className="text-center py-6 text-slate-400 text-xs">Belum ada catatan evaluasi Ummi.</p>
          )}
        </div>

      </div>

    </div>
  );
};
