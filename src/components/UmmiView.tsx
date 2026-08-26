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
  GraduationCap
} from 'lucide-react';
import { UmmiRecord, Student, Teacher, ClassItem, Role } from '../types';
import { UMMI_SYLLABUS, UMMI_JILIDS } from '../data/ummiData';
import { storageService } from '../services/storageService';

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
  const [selectedJilidTab, setSelectedJilidTab] = useState<string>('Semua Jilid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'class-asc' | 'class-desc' | 'date-desc' | 'date-asc' | 'name-asc' | 'jilid-asc' | 'score-desc'>('class-asc');

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

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-[#D4AF37]" />
            Pembelajaran & Evaluasi Metode Ummi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem berjenjang Jilid 1–6, Al-Qur'an Dewasa, Gharib Al-Qur'an, dan Teori Kaidah Tajwid Ummi Foundation terorganisir per kelas
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

      {/* Jilid Distribution Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Distribusi Jenjang Metode Ummi Santri Saat Ini
          </h3>
          <span className="text-xs font-semibold text-slate-600">Total {students.length} Santri Terdaftar</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
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
              <span className="text-[10px] block opacity-80 truncate">{item.jilid}</span>
              <span className="text-lg font-bold mt-0.5 block">{item.count}</span>
              <span className="text-[9px] opacity-75">Santri</span>
            </button>
          ))}
        </div>
      </div>

      {/* Jilid Syllabus Cards */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
            Struktur Kurikulum & Silabus Materi Metode Ummi
          </h3>
          {selectedJilidTab !== 'Semua Jilid' && (
            <button
              onClick={() => setSelectedJilidTab('Semua Jilid')}
              className="text-xs text-[#8C7015] font-semibold hover:underline cursor-pointer"
            >
              Tampilkan Semua Jilid
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {UMMI_SYLLABUS
            .filter(s => selectedJilidTab === 'Semua Jilid' || s.jilid === selectedJilidTab)
            .map((s) => (
              <div 
                key={s.jilid}
                className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded bg-slate-200 text-slate-800 font-bold text-xs">
                    {s.jilid}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">{s.totalPages} Halaman</span>
                </div>
                <h4 className="font-bold text-xs text-slate-800">{s.title}</h4>
                <ul className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                  {s.keyTopics.slice(0, 3).map((topic, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1 shrink-0"></span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </div>

      {/* Ummi Records Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Log Evaluasi & Ujian Kenaikan Jilid Ummi
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
                        <img 
                          src={std?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'} 
                          alt="" 
                          className="w-6 h-6 rounded-full object-cover border" 
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

    </div>
  );
};
