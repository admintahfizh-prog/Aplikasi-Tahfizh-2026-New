import React, { useState } from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  BookMarked, 
  Award, 
  Phone, 
  Printer, 
  Share2, 
  PlusCircle, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Sparkles,
  TrendingUp,
  FileCheck,
  Check,
  ChevronRight,
  User,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Student, Teacher, ClassItem, MemorizationRecord, UmmiRecord, AppSettings, TahfizhViolation } from '../types';
import { StudentRaportCard } from './StudentRaportCard';
import { JUZ_MAPPINGS } from '../data/quranData';
import { storageService } from '../services/storageService';
import { VIOLATION_PRESETS } from './ViolationsView';

interface StudentDetailViewProps {
  studentId: string;
  students: Student[];
  teachers: Teacher[];
  classes: ClassItem[];
  records: MemorizationRecord[];
  ummiRecords: UmmiRecord[];
  settings: AppSettings;
  onBack: () => void;
  onOpenDailyInput: (studentId: string) => void;
}

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({
  studentId,
  students,
  teachers,
  classes,
  records,
  ummiRecords,
  settings,
  onBack,
  onOpenDailyInput
}) => {
  const [activeTab, setActiveTab] = useState<'hafalan' | 'ummi' | 'kedisiplinan' | 'grafik' | 'raport'>('hafalan');

  const student = students.find(s => s.id === studentId);
  if (!student) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border">
        <p className="text-slate-500">Data siswa tidak ditemukan.</p>
        <button onClick={onBack} className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs">
          Kembali ke Data Siswa
        </button>
      </div>
    );
  }

  const teacher = teachers.find(t => t.id === student.teacherId);
  const studentClass = classes.find(c => c.id === student.classId);

  const studentRecords = records.filter(r => r.studentId === student.id);
  const studentUmmiRecords = ummiRecords.filter(r => r.studentId === student.id);
  const studentViolations = storageService.getViolationsByStudent(student.id);

  const progressPercent = Math.min(100, Math.round((student.totalJuzHafal / student.targetJuz) * 100));

  // 30 Juz completion matrix
  // If student has 2.5 juz, mark juz 30, 29 as completed and juz 28 as in-progress
  const getJuzStatus = (juzNum: number) => {
    const isRecorded = studentRecords.some(r => r.juz === juzNum);
    if (juzNum === 30 && student.totalJuzHafal >= 1.0) return 'completed';
    if (juzNum === 29 && student.totalJuzHafal >= 2.0) return 'completed';
    if (juzNum === 28 && student.totalJuzHafal >= 3.0) return 'completed';
    if (juzNum === 1 && student.totalJuzHafal >= 4.0) return 'completed';
    if (isRecorded) return 'in-progress';
    return 'not-started';
  };

  // Score trend for chart
  const scoreTrendData = studentRecords.map((r, idx) => ({
    name: `Setoran ${idx + 1}`,
    date: r.date.slice(5),
    nilai: r.finalScore,
    surah: r.surahName
  })).reverse();

  const handlePrintRaport = () => {
    window.print();
  };

  const handleWhatsAppParent = () => {
    const phone = student.parentPhone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const msg = encodeURIComponent(
      `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nYth. ${student.parentName},\nKami dari Tim Tahfizh ${settings.schoolName} menyampaikan perkembangan hafalan ananda ${student.name}:\n- Capaian Hafalan: ${student.totalJuzHafal} Juz dari Target ${student.targetJuz} Juz (${progressPercent}%)\n- Pembelajaran Ummi: ${student.currentUmmiJilid} (Halaman ${student.currentUmmiPage})\n- Rata-rata Nilai: ${student.avgScore}/100\n- Hafalan Terakhir: ${student.lastHafalan}\n\nJazaakumullah khairan atas kerjasamanya.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      
      {/* Top Back Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs shadow-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Santri</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleWhatsAppParent}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>Kirim Laporan WA ke Orang Tua</span>
          </button>

          <button
            onClick={() => onOpenDailyInput(student.id)}
            className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
            <span>+ Setoran Siswa Ini</span>
          </button>
        </div>
      </div>

      {/* Profile & Main Stats Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="bg-[#1E293B] p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <img
              src={student.photo}
              alt={student.name}
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl object-cover ring-2 ring-[#D4AF37] shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#D4AF37] text-slate-950">
                  {student.program}
                </span>
                <span className="text-xs text-slate-300 font-mono">NIS: {student.nis}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mt-1 text-white">
                {student.name} ({student.nickname})
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Kelas: <strong className="text-white">{studentClass?.name}</strong> • Guru Penguji: <strong className="text-[#D4AF37]">{teacher?.name}</strong>
              </p>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700 text-right space-y-1 self-stretch md:self-auto min-w-[200px]">
            <p className="text-[11px] text-slate-400 font-medium">Orang Tua / Wali:</p>
            <p className="text-xs font-bold text-white truncate">{student.parentName}</p>
            <p className="text-[11px] text-[#D4AF37] font-mono flex items-center justify-end gap-1">
              <Phone className="w-3 h-3" /> {student.parentPhone}
            </p>
          </div>
        </div>

        {/* Ringkasan Capaian & Progress Bar */}
        <div className="p-6 bg-slate-50/70 border-b border-slate-200">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ringkasan Capaian Hafalan Santri</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-slate-900 font-serif">{student.totalJuzHafal} Juz</span>
                  <span className="text-xs text-slate-500">dari target {student.targetJuz} Juz</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#8C7015] bg-[#D4AF37]/15 px-3 py-1 rounded-full">
                  Tercapai {progressPercent}%
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Sisa Target: {(student.targetJuz - student.totalJuzHafal).toFixed(1)} Juz</p>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  progressPercent >= 75 ? 'bg-[#D4AF37]' :
                  progressPercent >= 40 ? 'bg-blue-600' :
                  'bg-slate-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 6 Key Student Statistics Cards */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-center">
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Juz</span>
            <p className="text-xl font-bold text-slate-800 mt-1">{student.totalJuzHafal}</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Surat</span>
            <p className="text-xl font-bold text-slate-800 mt-1">{student.totalSurahHafal}</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Ayat</span>
            <p className="text-xl font-bold text-slate-800 mt-1">{student.totalAyahHafal}</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Hafalan Terakhir</span>
            <p className="text-xs font-bold text-[#1E293B] truncate mt-2">{student.lastHafalan}</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Rata-rata Nilai</span>
            <p className="text-xl font-bold text-[#8C7015] mt-1">{student.avgScore}</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Jilid Ummi</span>
            <p className="text-xs font-bold text-slate-800 truncate mt-2">
              {student.currentUmmiJilid} (Hal. {student.currentUmmiPage})
            </p>
          </div>
        </div>

      </div>

      {/* 30 Juz Visual Matrix */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs no-print">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#D4AF37]" />
              Matriks Capaian 30 Juz Al-Qur'an
            </h3>
            <p className="text-xs text-slate-500">Peta visual kelulusan dan setoran juz per santri</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-[#D4AF37]"></span> Tuntas (Mumtaz)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-500"></span> Sedang Berjalan
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300"></span> Belum
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {JUZ_MAPPINGS.map((j) => {
            const status = getJuzStatus(j.juz);
            return (
              <div
                key={j.juz}
                className={`p-2 rounded-lg text-center border transition ${
                  status === 'completed'
                    ? 'bg-[#D4AF37] text-slate-950 border-[#c49f2c] shadow-2xs font-bold'
                    : status === 'in-progress'
                    ? 'bg-blue-50 text-blue-900 border-blue-200 font-bold'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
                title={`Juz ${j.juz}: ${j.startSurah} s/d ${j.endSurah}`}
              >
                <span className="text-[10px] block opacity-80">Juz</span>
                <span className="text-sm font-bold">{j.juz}</span>
                {status === 'completed' && <Check className="w-3 h-3 mx-auto mt-0.5" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center border-b border-slate-200 no-print overflow-x-auto">
        {[
          { id: 'hafalan', label: 'Riwayat Hafalan Al-Qur\'an', icon: BookOpen, count: studentRecords.length },
          { id: 'ummi', label: 'Riwayat Metode Ummi', icon: BookMarked, count: studentUmmiRecords.length },
          { id: 'kedisiplinan', label: 'Pelanggaran & Kedisiplinan', icon: ShieldAlert, count: studentViolations.length },
          { id: 'grafik', label: 'Grafik Perkembangan Nilai', icon: TrendingUp },
          { id: 'raport', label: 'Cetak Raport & Sertifikat', icon: Printer },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-[#D4AF37] text-slate-900 bg-amber-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                  tab.id === 'kedisiplinan' && tab.count > 0
                    ? 'bg-rose-100 text-rose-800 font-bold'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: RIWAYAT HAFALAN AL-QURAN */}
      {activeTab === 'hafalan' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">
              Daftar Log Setoran Hafalan Siswa ({studentRecords.length} Setoran)
            </h3>
            <button
              onClick={() => onOpenDailyInput(student.id)}
              className="text-xs text-[#8C7015] font-bold hover:underline cursor-pointer"
            >
              + Catat Setoran Baru
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Juz</th>
                  <th className="py-2.5 px-3">Surat & Ayat</th>
                  <th className="py-2.5 px-3">Jumlah</th>
                  <th className="py-2.5 px-3">Jenis</th>
                  <th className="py-2.5 px-3">Nilai</th>
                  <th className="py-2.5 px-3">Predikat</th>
                  <th className="py-2.5 px-3">Catatan Guru</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 whitespace-nowrap text-slate-500 font-mono">{r.date}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">Juz {r.juz}</td>
                    <td className="py-3 px-3">
                      {r.endSurahName && r.endSurahName !== r.surahName ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{r.surahName} <span className="font-normal text-slate-500">({r.startAyah})</span></span>
                          <span className="text-[10px] text-slate-400 font-semibold">s.d.</span>
                          <span className="font-bold text-slate-900">{r.endSurahName} <span className="font-normal text-slate-500">({r.endAyah})</span></span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-bold text-slate-900">{r.surahName}</span>
                          <span className="text-slate-500 ml-1">({r.startAyah}–{r.endAyah})</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold">{r.totalAyah} Ayat</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {r.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{r.finalScore}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.finalScore >= 90 ? 'bg-emerald-100 text-emerald-800' :
                        r.finalScore >= 80 ? 'bg-blue-100 text-blue-800' :
                        r.finalScore >= 70 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={r.notes}>
                      {r.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {studentRecords.length === 0 && (
            <p className="text-center py-8 text-slate-400 text-xs">Belum ada riwayat hafalan Al-Qur'an.</p>
          )}
        </div>
      )}

      {/* TAB 2: RIWAYAT METODE UMMI */}
      {activeTab === 'ummi' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">
            Riwayat Pembelajaran & Evaluasi Metode Ummi
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Jilid</th>
                  <th className="py-2.5 px-3">Halaman</th>
                  <th className="py-2.5 px-3">Materi Pokok</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Nilai</th>
                  <th className="py-2.5 px-3">Catatan Pembimbing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentUmmiRecords.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono text-slate-500">{u.date}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{u.jilid}</td>
                    <td className="py-3 px-3 font-semibold">Hal. {u.page}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{u.materialName}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'Lulus' ? 'bg-emerald-100 text-emerald-800' :
                        u.status === 'Lancar' ? 'bg-blue-100 text-blue-800' :
                        u.status === 'Sedang Dipelajari' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{u.score}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={u.notes}>
                      {u.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {studentUmmiRecords.length === 0 && (
            <p className="text-center py-8 text-slate-400 text-xs">Belum ada evaluasi jilid Ummi.</p>
          )}
        </div>
      )}

      {/* TAB: PELANGGARAN & KEDISIPLINAN TAHFIZH */}
      {activeTab === 'kedisiplinan' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Catatan Kedisiplinan & Pelanggaran Santri ({studentViolations.length} Catatan)
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan pelanggaran setoran hafalan, ketuntasan baris/ayat, dan kelengkapan buku mutaba'ah/Ummi
              </p>
            </div>
          </div>

          {studentViolations.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-emerald-900">Alhamdulillah, Tidak Ada Catatan Pelanggaran</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Ananda {student.name} senantiasa tertib dan disiplin dalam mengikuti halaqah tahfizh.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Jenis Pelanggaran</th>
                    <th className="py-2.5 px-3">Kronologi / Catatan</th>
                    <th className="py-2.5 px-3">Tindakan Pembinaan</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentViolations.map((v) => {
                    const preset = VIOLATION_PRESETS.find(p => p.type === v.type) || VIOLATION_PRESETS[0];
                    return (
                      <tr key={v.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 whitespace-nowrap text-slate-500 font-mono align-top">{v.date}</td>
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${preset.badgeBg} ${preset.badgeText} ${preset.badgeBorder}`}>
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            {v.typeName}
                          </span>
                        </td>
                        <td className="py-3 px-3 align-top text-slate-700 font-medium max-w-xs">
                          {v.details || '-'}
                        </td>
                        <td className="py-3 px-3 align-top text-slate-600 max-w-xs">
                          <span className="bg-slate-50 p-1.5 rounded border border-slate-200 block text-[11px]">
                            {v.actionTaken || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.status === 'Selesai / Dituntaskan'
                              ? 'bg-emerald-100 text-emerald-800'
                              : v.status === 'Dalam Pembinaan'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GRAFIK PERKEMBANGAN NILAI */}
      {activeTab === 'grafik' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
            Grafik Perkembangan Nilai Setoran Santri
          </h3>
          <p className="text-xs text-slate-500">
            Tren skor hasil penilaian kelancaran, tajwid, makhraj, dan fashahah dari waktu ke waktu
          </p>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', fontSize: '12px', border: 'none' }}
                />
                <Line type="monotone" dataKey="nilai" stroke="#D4AF37" strokeWidth={3} dot={{ r: 4, fill: '#D4AF37' }} name="Nilai Setoran" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 4: OFFICIAL PRINTABLE RAPORT CARD (TAHFIZH & METODE UMMI) */}
      {activeTab === 'raport' && (
        <div className="space-y-4">
          <StudentRaportCard
            student={student}
            teacher={teacher}
            studentClass={studentClass}
            records={studentRecords}
            ummiRecords={studentUmmiRecords}
            settings={settings}
            allStudents={students}
          />
        </div>
      )}

    </div>
  );
};
