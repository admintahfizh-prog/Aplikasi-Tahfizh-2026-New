import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  PlusCircle, 
  Download, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  Flame, 
  Award,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { MemorizationRecord, Student, Teacher, SetoranType, Role } from '../types';
import { storageService } from '../services/storageService';
import { SURAH_LIST } from '../data/quranData';

interface HafalanViewProps {
  records: MemorizationRecord[];
  students: Student[];
  teachers: Teacher[];
  userRole: Role;
  onOpenDailyInput: () => void;
  onRefreshData: () => void;
  onOpenStudentDetail: (studentId: string) => void;
}

export const HafalanView: React.FC<HafalanViewProps> = ({
  records,
  students,
  teachers,
  userRole,
  onOpenDailyInput,
  onRefreshData,
  onOpenStudentDetail
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJuzFilter, setSelectedJuzFilter] = useState('');
  const [selectedSurahFilter, setSelectedSurahFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('');
  const [selectedScoreCategoryFilter, setSelectedScoreCategoryFilter] = useState('');

  // Filter records
  const filteredRecords = records.filter(r => {
    const std = students.find(s => s.id === r.studentId);
    const matchSearch = 
      (std?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.surahName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.notes.toLowerCase().includes(searchTerm.toLowerCase());

    const matchJuz = !selectedJuzFilter || r.juz.toString() === selectedJuzFilter;
    const matchSurah = !selectedSurahFilter || r.surahNumber.toString() === selectedSurahFilter;
    const matchType = !selectedTypeFilter || r.type === selectedTypeFilter;
    const matchTeacher = !selectedTeacherFilter || r.teacherId === selectedTeacherFilter;
    const matchScore = !selectedScoreCategoryFilter || r.category === selectedScoreCategoryFilter;

    return matchSearch && matchJuz && matchSurah && matchType && matchTeacher && matchScore;
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus riwayat setoran ini?')) {
      storageService.deleteMemorizationRecord(id);
      onRefreshData();
    }
  };

  const handleExportCSV = () => {
    const csv = storageService.exportHafalanToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap_hafalan_quran_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats
  const totalAyahs = filteredRecords.reduce((acc, r) => acc + r.totalAyah, 0);
  const tasmiCount = filteredRecords.filter(r => r.type === 'Tasmi\'').length;
  const avgScore = filteredRecords.length > 0 
    ? Math.round(filteredRecords.reduce((acc, r) => acc + r.finalScore, 0) / filteredRecords.length)
    : 0;

  return (
    <div className="space-y-5 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#D4AF37]" />
            Modul Hafalan Al-Qur'an
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekapitulasi setoran Ziyadah (Hafalan Baru), Murojaah berkala, dan Ujian Tasmi' sekali duduk
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {userRole !== 'wali' && (
            <button
              onClick={onOpenDailyInput}
              className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
              <span>+ Catat Setoran</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Setoran</span>
          <p className="text-xl font-bold text-slate-800 mt-1">{filteredRecords.length} Kali</p>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Ayat Disetor</span>
          <p className="text-xl font-bold text-[#8C7015] mt-1">{totalAyahs} Ayat</p>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Rata-rata Nilai</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">{avgScore} / 100</p>
        </div>
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Ujian Tasmi'</span>
          <p className="text-xl font-bold text-[#1E293B] mt-1">{tasmiCount} Sesi</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari santri, surat, catatan..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            />
          </div>

          {/* Filter Juz */}
          <div>
            <select
              value={selectedJuzFilter}
              onChange={(e) => setSelectedJuzFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="">Semua Juz (1-30)</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                <option key={j} value={j.toString()}>Juz {j}</option>
              ))}
            </select>
          </div>

          {/* Filter Surat */}
          <div>
            <select
              value={selectedSurahFilter}
              onChange={(e) => setSelectedSurahFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="">Semua Surat ({SURAH_LIST.length})</option>
              {SURAH_LIST.map(s => (
                <option key={s.number} value={s.number.toString()}>{s.number}. {s.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Jenis Setoran */}
          <div>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="">Semua Jenis Setoran</option>
              <option value="Hafalan Baru">Hafalan Baru (Ziyadah)</option>
              <option value="Murojaah">Murojaah</option>
              <option value="Tasmi'">Tasmi' (Ujian Sekali Duduk)</option>
            </select>
          </div>

          {/* Filter Nilai Predikat */}
          <div>
            <select
              value={selectedScoreCategoryFilter}
              onChange={(e) => setSelectedScoreCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="">Semua Predikat Nilai</option>
              <option value="Sangat Baik">Sangat Baik (90–100)</option>
              <option value="Baik">Baik (80–89)</option>
              <option value="Cukup">Cukup (70–79)</option>
              <option value="Perlu Bimbingan">Perlu Bimbingan (&lt;70)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-3 px-3.5">Tanggal</th>
                <th className="py-3 px-3.5">Nama Santri</th>
                <th className="py-3 px-3.5">Juz</th>
                <th className="py-3 px-3.5">Surat & Ayat</th>
                <th className="py-3 px-3.5">Total Ayat</th>
                <th className="py-3 px-3.5">Jenis</th>
                <th className="py-3 px-3.5">Nilai & Predikat</th>
                <th className="py-3 px-3.5">Guru Penguji</th>
                <th className="py-3 px-3.5">Catatan Perkembangan</th>
                {userRole === 'admin' && <th className="py-3 px-3.5 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r) => {
                const std = students.find(s => s.id === r.studentId);
                const teacher = teachers.find(t => t.id === r.teacherId);

                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-500 font-mono">{r.date}</td>
                    <td className="py-3 px-3.5">
                      <div 
                        onClick={() => std && onOpenStudentDetail(std.id)}
                        className="flex items-center gap-2 cursor-pointer hover:text-[#D4AF37] transition"
                      >
                        <img 
                          src={std?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                          alt="" 
                          className="w-6 h-6 rounded-full object-cover border" 
                        />
                        <span className="font-bold text-slate-800">{std?.name || 'Siswa'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-800">Juz {r.juz}</td>
                    <td className="py-3 px-3.5">
                      {r.endSurahName && r.endSurahName !== r.surahName ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs">
                            {r.surahName} <span className="font-mono font-normal text-slate-500 text-[11px]">(Ayat {r.startAyah})</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">s.d.</span>
                          <span className="font-bold text-slate-900 text-xs">
                            {r.endSurahName} <span className="font-mono font-normal text-slate-500 text-[11px]">(Ayat {r.endAyah})</span>
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-bold text-slate-900">{r.surahName}</span>
                          <span className="text-slate-500 ml-1 font-mono">({r.startAyah}–{r.endAyah})</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-slate-800">{r.totalAyah} Ayat</td>
                    <td className="py-3 px-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.type === 'Tasmi\'' 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                          : r.type === 'Murojaah'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {r.type === 'Tasmi\'' && <Flame className="w-3 h-3 text-[#D4AF37]" />}
                        {r.type}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{r.finalScore}</span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                          r.finalScore >= 90 ? 'bg-emerald-100 text-emerald-800' :
                          r.finalScore >= 80 ? 'bg-blue-100 text-blue-800' :
                          r.finalScore >= 70 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {r.category}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 text-[11px] whitespace-nowrap">{teacher?.name || '-'}</td>
                    <td className="py-3 px-3.5 text-slate-600 max-w-xs truncate text-[11px]" title={r.notes}>
                      {r.notes || '-'}
                    </td>
                    {userRole === 'admin' && (
                      <td className="py-3 px-3.5 text-center">
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                          title="Hapus Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <p className="text-center py-12 text-slate-400 text-xs">Tidak ada riwayat setoran yang sesuai filter.</p>
        )}
      </div>

    </div>
  );
};
