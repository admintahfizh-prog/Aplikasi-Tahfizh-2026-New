import React, { useState } from 'react';
import { 
  BookMarked, 
  Search, 
  Filter, 
  PlusCircle, 
  CheckCircle2, 
  Award, 
  Clock, 
  AlertCircle, 
  Sparkles,
  BookOpen,
  ChevronRight,
  UserCheck,
  ArrowUpDown,
  GraduationCap,
  Layers,
  HelpCircle,
  X,
  FileText,
  ChevronDown,
  Info
} from 'lucide-react';
import { UmmiRecord, Student, Teacher, ClassItem, Role } from '../types';
import { UMMI_SYLLABUS, UMMI_JILIDS, UmmiTopicDetail } from '../data/ummiData';
import { storageService } from '../services/storageService';
import { AvatarBadge } from './AvatarBadge';

interface UmmiViewProps {
  ummiRecords: UmmiRecord[];
  students: Student[];
  teachers: Teacher[];
  classes?: ClassItem[];
  userRole: Role;
  onOpenDailyInput: () => void;
  onRefreshData: () => void;
  onOpenStudentDetail: (studentId: string) => void;
}

export const UmmiView: React.FC<UmmiViewProps> = ({
  ummiRecords,
  students,
  teachers,
  classes = [],
  userRole,
  onOpenDailyInput,
  onRefreshData,
  onOpenStudentDetail
}) => {
  const [selectedJilidTab, setSelectedJilidTab] = useState<string>('Jilid 1');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'class-asc' | 'class-desc' | 'date-desc' | 'date-asc' | 'name-asc' | 'jilid-asc' | 'score-desc'>('class-asc');
  
  // Active selected module for modal detail popup
  const [selectedModuleDetail, setSelectedModuleDetail] = useState<{
    jilid: string;
    module: UmmiTopicDetail;
  } | null>(null);

  // Calculate students count per jilid
  const studentDistribution = UMMI_JILIDS.map(j => ({
    jilid: j,
    count: students.filter(s => s.currentUmmiJilid === j).length
  }));

  // Filter records
  const filteredRecords = ummiRecords.filter(r => {
    const std = students.find(s => s.id === r.studentId);
    const matchSearch = 
      (std?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.notes.toLowerCase().includes(searchTerm.toLowerCase());

    const matchClass = !selectedClassFilter || std?.classId === selectedClassFilter;
    const matchJilid = selectedJilidTab === 'Semua Jilid' || r.jilid === selectedJilidTab;
    const matchStatus = !statusFilter || r.status === statusFilter;

    return matchSearch && matchClass && matchJilid && matchStatus;
  });

  // Sort records
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const stdA = students.find(s => s.id === a.studentId);
    const stdB = students.find(s => s.id === b.studentId);
    const clsA = classes.find(c => c.id === stdA?.classId);
    const clsB = classes.find(c => c.id === stdB?.classId);

    if (sortBy === 'class-asc') {
      const clsCompare = (clsA?.name || '').localeCompare(clsB?.name || '');
      if (clsCompare !== 0) return clsCompare;
      const nameCompare = (stdA?.name || '').localeCompare(stdB?.name || '');
      if (nameCompare !== 0) return nameCompare;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'class-desc') {
      const clsCompare = (clsB?.name || '').localeCompare(clsA?.name || '');
      if (clsCompare !== 0) return clsCompare;
      return (stdA?.name || '').localeCompare(stdB?.name || '');
    }
    if (sortBy === 'date-desc') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'date-asc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    if (sortBy === 'name-asc') {
      return (stdA?.name || '').localeCompare(stdB?.name || '');
    }
    if (sortBy === 'jilid-asc') {
      return (a.jilid || '').localeCompare(b.jilid || '');
    }
    if (sortBy === 'score-desc') {
      return b.score - a.score;
    }
    return 0;
  });

  const selectedSyllabusList = UMMI_SYLLABUS.filter(
    s => selectedJilidTab === 'Semua Jilid' || s.jilid === selectedJilidTab
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-[#D4AF37]" />
            Kurikulum & Pembelajaran Metode Ummi Dewasa (Jilid 1–3)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Katalog materi resmi Buku Ummi Dewasa Jilid 1 sampai 3, Tilawah Mushaf Al-Qur'an, Ayat Gharib, dan Teori Kaidah Tajwid Ummi Foundation
          </p>
        </div>

        {userRole !== 'wali' && (
          <button
            onClick={onOpenDailyInput}
            className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
            <span>+ Catat Evaluasi Ummi</span>
          </button>
        )}
      </div>

      {/* Jilid Navigation Tabs with Student Distribution */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#D4AF37]" />
            Pilih Jenjang / Jilid Pembelajaran
          </h3>
          <button
            onClick={() => setSelectedJilidTab('Semua Jilid')}
            className={`text-xs px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedJilidTab === 'Semua Jilid'
                ? 'bg-[#1E293B] text-white shadow-xs'
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            Tampilkan Semua Jilid
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {studentDistribution.map((item) => (
            <button
              key={item.jilid}
              onClick={() => setSelectedJilidTab(item.jilid)}
              className={`p-2.5 rounded-lg border text-center transition cursor-pointer ${
                selectedJilidTab === item.jilid
                  ? 'bg-[#1E293B] text-white border-slate-800 shadow-xs ring-2 ring-[#D4AF37]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              <span className="text-[11px] font-bold block truncate">{item.jilid}</span>
              <span className="text-base font-extrabold mt-0.5 block">{item.count}</span>
              <span className="text-[9px] opacity-75">Santri Aktif</span>
            </button>
          ))}
        </div>
      </div>

      {/* KOMPREHENSIF: MODUL & MATERI DETAIL JILID 1 - 6 */}
      <div className="space-y-4">
        {selectedSyllabusList.map((syllabus) => (
          <div 
            key={syllabus.jilid}
            className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
          >
            {/* Header Jilid */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-slate-950 font-extrabold text-xs">
                    {syllabus.jilid}
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    Total {syllabus.totalPages} Halaman
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {syllabus.title}
                </h3>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  {syllabus.description}
                </p>
              </div>

              {userRole !== 'wali' && (
                <button
                  onClick={onOpenDailyInput}
                  className="shrink-0 px-3.5 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c49f2e] text-slate-950 font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Input Setoran {syllabus.jilid}</span>
                </button>
              )}
            </div>

            {/* Key Topics Badges */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                Pokok Bahasan Utama:
              </span>
              {syllabus.keyTopics.map((topic, i) => (
                <span 
                  key={i}
                  className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium shadow-2xs"
                >
                  • {topic}
                </span>
              ))}
            </div>

            {/* Modules Grid (Breakdown Per Halaman) */}
            <div className="p-5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                Rincian Materi & Modul Per Rentang Halaman:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {syllabus.modules.map((mod, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-300 hover:shadow-xs transition space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs font-mono">
                          {mod.pageRange}
                        </span>
                        <button
                          onClick={() => setSelectedModuleDetail({ jilid: syllabus.jilid, module: mod })}
                          className="text-[11px] text-[#8C7015] hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Lihat Panduan Talaqqi</span>
                        </button>
                      </div>

                      <h5 className="font-bold text-slate-900 text-sm">
                        {mod.topicTitle}
                      </h5>

                      {/* Arabic Example Box */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200 text-center shadow-2xs">
                        <span className="text-[10px] text-slate-400 font-semibold block mb-1 uppercase tracking-wider">
                          Contoh Lafadz / Bacaan:
                        </span>
                        <p className="font-arabic text-xl text-slate-900 leading-relaxed font-bold dir-rtl">
                          {mod.arabicExample}
                        </p>
                      </div>

                      {/* Kaidah & Target */}
                      <div className="space-y-1.5 text-xs">
                        <p className="text-slate-700 leading-relaxed">
                          <strong className="text-slate-900">Kaidah:</strong> {mod.rules}
                        </p>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          <strong className="text-slate-800">Target Kelulusan:</strong> {mod.competency}
                        </p>
                      </div>
                    </div>

                    {/* Teaching Tips Footer */}
                    <div className="pt-2 border-t border-slate-200/80 flex items-start gap-1.5 text-[11px] text-slate-500 bg-amber-50/50 p-2 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-700">Tips Pengajaran Guru:</strong> {mod.teachingTips}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ummi Records Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Log Evaluasi & Setoran Pembelajaran Ummi Santri
            </h3>
            <p className="text-xs text-slate-500">Catatan perkembangan jilid, halaman, dan status kelulusan diurutkan per kelas</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari santri, materi..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              />
            </div>

            {/* Filter Kelas */}
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>Kelas {c.name}</option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="class-asc">Sort: Berdasarkan Kelas (A → Z)</option>
              <option value="class-desc">Sort: Berdasarkan Kelas (Z → A)</option>
              <option value="date-desc">Sort: Tanggal Terbaru</option>
              <option value="date-asc">Sort: Tanggal Terlama</option>
              <option value="name-asc">Sort: Nama Santri (A → Z)</option>
              <option value="jilid-asc">Sort: Urutan Jilid</option>
              <option value="score-desc">Sort: Nilai Tertinggi</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="">Semua Status</option>
              <option value="Lulus">Lulus</option>
              <option value="Lancar">Lancar</option>
              <option value="Sedang Dipelajari">Sedang Dipelajari</option>
              <option value="Perlu Mengulang">Perlu Mengulang</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <th 
                  onClick={() => setSortBy(sortBy === 'class-asc' ? 'class-desc' : 'class-asc')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition select-none"
                  title="Klik untuk mengurutkan berdasarkan Kelas"
                >
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <GraduationCap className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Kelas</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Nama Santri</th>
                <th 
                  onClick={() => setSortBy(sortBy === 'date-desc' ? 'date-asc' : 'date-desc')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition select-none"
                  title="Klik untuk urutkan tanggal"
                >
                  <div className="flex items-center gap-1">
                    <span>Tanggal</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Jilid</th>
                <th className="py-3 px-3">Halaman</th>
                <th className="py-3 px-3">Materi Pokok</th>
                <th className="py-3 px-3">Status</th>
                <th 
                  onClick={() => setSortBy('score-desc')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition select-none"
                  title="Klik untuk urutkan nilai"
                >
                  <div className="flex items-center gap-1">
                    <span>Nilai</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Guru Penguji</th>
                <th className="py-3 px-3">Catatan Pembinaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRecords.map((r) => {
                const std = students.find(s => s.id === r.studentId);
                const teacher = teachers.find(t => t.id === r.teacherId);
                const cls = std ? classes.find(c => c.id === std.classId) : null;

                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200">
                        {cls?.name || '7A'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div 
                        onClick={() => std && onOpenStudentDetail(std.id)}
                        className="flex items-center gap-2 cursor-pointer hover:text-[#D4AF37] transition"
                      >
                        <AvatarBadge
                          name={std?.name || 'Siswa'}
                          photoUrl={std?.photo}
                          gender={std?.gender}
                          role="santri"
                          size="sm"
                          className="shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">{std?.name || 'Siswa'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">NIS: {std?.nis || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">{r.date}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{r.jilid}</td>
                    <td className="py-3 px-3 font-semibold">Hal. {r.page}</td>
                    <td className="py-3 px-3 text-slate-800 font-medium">{r.materialName}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'Lulus' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        r.status === 'Lancar' ? 'bg-blue-50 text-blue-800' :
                        r.status === 'Sedang Dipelajari' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{r.score}</td>
                    <td className="py-3 px-3 text-slate-600 text-[11px] whitespace-nowrap">{teacher?.name || '-'}</td>
                    <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs truncate" title={r.notes}>
                      {r.notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sortedRecords.length === 0 && (
          <p className="text-center py-10 text-slate-400 text-xs">Belum ada catatan evaluasi Ummi yang cocok.</p>
        )}
      </div>

      {/* MODAL DETAIL MATERI TALAQQI */}
      {selectedModuleDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-200">
              <div>
                <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white font-extrabold text-[11px]">
                  {selectedModuleDetail.jilid} • {selectedModuleDetail.module.pageRange}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  {selectedModuleDetail.module.topicTitle}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedModuleDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Arabic Big Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Contoh Lafadz & Praktik Bacaan:
              </span>
              <p className="font-arabic text-2xl text-slate-950 font-bold py-2 dir-rtl leading-loose">
                {selectedModuleDetail.module.arabicExample}
              </p>
            </div>

            {/* Rules & Competencies */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 text-[11px] block flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Kaidah Pokok Pembelajaran:
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {selectedModuleDetail.module.rules}
                </p>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-900 text-[11px] block flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Target Capaian & Standar Kelulusan Santri:
                </span>
                <p className="text-emerald-800 leading-relaxed">
                  {selectedModuleDetail.module.competency}
                </p>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 space-y-1">
                <span className="font-bold text-amber-950 text-[11px] block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Panduan Talaqqi & Petunjuk Mengajar Guru:
                </span>
                <p className="text-amber-900 leading-relaxed">
                  {selectedModuleDetail.module.teachingTips}
                </p>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedModuleDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
              >
                Tutup
              </button>
              {userRole !== 'wali' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedModuleDetail(null);
                    onOpenDailyInput();
                  }}
                  className="px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Catat Setoran Sekarang</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
