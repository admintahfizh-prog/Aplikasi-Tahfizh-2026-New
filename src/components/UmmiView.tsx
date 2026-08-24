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
  UserCheck
} from 'lucide-react';
import { UmmiRecord, Student, Teacher, Role } from '../types';
import { UMMI_SYLLABUS, UMMI_JILIDS } from '../data/ummiData';
import { storageService } from '../services/storageService';

interface UmmiViewProps {
  ummiRecords: UmmiRecord[];
  students: Student[];
  teachers: Teacher[];
  userRole: Role;
  onOpenDailyInput: () => void;
  onRefreshData: () => void;
  onOpenStudentDetail: (studentId: string) => void;
}

export const UmmiView: React.FC<UmmiViewProps> = ({
  ummiRecords,
  students,
  teachers,
  userRole,
  onOpenDailyInput,
  onRefreshData,
  onOpenStudentDetail
}) => {
  const [selectedJilidTab, setSelectedJilidTab] = useState<string>('Semua Jilid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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

    const matchJilid = selectedJilidTab === 'Semua Jilid' || r.jilid === selectedJilidTab;
    const matchStatus = !statusFilter || r.status === statusFilter;

    return matchSearch && matchJilid && matchStatus;
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
            Sistem berjenjang Jilid 1–6, Al-Qur'an Dewasa, Gharib Al-Qur'an, dan Teori Kaidah Tajwid Ummi Foundation
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
            <p className="text-xs text-slate-500">Catatan perkembangan jilid, halaman, dan status kelulusan</p>
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
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Nama Santri</th>
                <th className="py-3 px-3">Jilid</th>
                <th className="py-3 px-3">Halaman</th>
                <th className="py-3 px-3">Materi Pokok</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Nilai</th>
                <th className="py-3 px-3">Guru Penguji</th>
                <th className="py-3 px-3">Catatan Pembinaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r) => {
                const std = students.find(s => s.id === r.studentId);
                const teacher = teachers.find(t => t.id === r.teacherId);

                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">{r.date}</td>
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
                        <span className="font-bold text-slate-800">{std?.name || 'Siswa'}</span>
                      </div>
                    </td>
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

        {filteredRecords.length === 0 && (
          <p className="text-center py-10 text-slate-400 text-xs">Belum ada catatan evaluasi Ummi yang cocok.</p>
        )}
      </div>

    </div>
  );
};
