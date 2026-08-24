import React, { useState } from 'react';
import { 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Sparkles, 
  HelpCircle, 
  ArrowUpRight,
  BookOpen
} from 'lucide-react';
import { Student, MemorizationRecord, Teacher } from '../types';

interface ScoresViewProps {
  students: Student[];
  records: MemorizationRecord[];
  teachers: Teacher[];
  onOpenStudentDetail: (studentId: string) => void;
  onOpenDailyInputWithStudent: (studentId: string) => void;
}

export const ScoresView: React.FC<ScoresViewProps> = ({
  students,
  records,
  teachers,
  onOpenStudentDetail,
  onOpenDailyInputWithStudent
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'top' | 'remedial'>('all');

  // Sorted students by avg score
  const sortedStudents = [...students].sort((a, b) => b.avgScore - a.avgScore);

  const topStudents = sortedStudents.filter(s => s.avgScore >= 85);
  const remedialStudents = sortedStudents.filter(s => s.avgScore < 75);

  const displayList = 
    selectedFilter === 'top' ? topStudents :
    selectedFilter === 'remedial' ? remedialStudents :
    sortedStudents;

  const filteredList = displayList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D4AF37]" />
            Evaluasi & Rubrik Nilai Tahfizh
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Penilaian 6 parameter tajwid: Kelancaran, Tajwid, Makhorijul Huruf, Fashahah, Adab, dan Ketepatan Ayat
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                selectedFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              Semua ({students.length})
            </button>
            <button
              onClick={() => setSelectedFilter('top')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                selectedFilter === 'top' ? 'bg-[#1E293B] text-[#D4AF37] shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              🏆 Mumtaz ({topStudents.length})
            </button>
            <button
              onClick={() => setSelectedFilter('remedial')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                selectedFilter === 'remedial' ? 'bg-red-600 text-white shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              ⚠️ Perlu Bimbingan ({remedialStudents.length})
            </button>
          </div>
        </div>
      </div>

      {/* Rubrik Penilaian Guide Box */}
      <div className="bg-[#1E293B] text-white p-5 rounded-xl border border-slate-800 shadow-xs">
        <h3 className="text-sm font-bold flex items-center gap-2 text-[#D4AF37] mb-3">
          <Sparkles className="w-4 h-4" />
          Standar Rubrik & Bobot Penilaian Tahfizh SMPIA21 (100 Poin)
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[#D4AF37] font-bold block">1. Kelancaran (25%)</span>
            <p className="text-[11px] text-slate-300 mt-1">Tanpa jeda panjang atau terbata-bata.</p>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[#D4AF37] font-bold block">2. Tajwid (20%)</span>
            <p className="text-[11px] text-slate-300 mt-1">Hukum nun sukun, mim, mad, ghunnah.</p>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[#D4AF37] font-bold block">3. Makhorijul Huruf (20%)</span>
            <p className="text-[11px] text-slate-300 mt-1">Ketepatan artikulasi huruf hijaiyyah.</p>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[#D4AF37] font-bold block">4. Fashahah (15%)</span>
            <p className="text-[11px] text-slate-300 mt-1">Waqaf, ibtida', dan keindahan tartil.</p>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[#D4AF37] font-bold block">5. Adab & Khusyu' (10%)</span>
            <p className="text-[11px] text-slate-300 mt-1">Sikap duduk tegak, busana, & sopan.</p>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[#D4AF37] font-bold block">6. Hafalan (10%)</span>
            <p className="text-[11px] text-slate-300 mt-1">Ketepatan awal & akhir ayat tanpa salah.</p>
          </div>
        </div>
      </div>

      {/* Student Ranking & Score Cards */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Daftar Skor Rata-rata & Peringkat Capaian Santri
          </h3>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari santri..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredList.map((std, index) => {
            const rankNumber = index + 1;
            const teacher = teachers.find(t => t.id === std.teacherId);

            return (
              <div 
                key={std.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 rounded-lg px-2 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    rankNumber === 1 ? 'bg-[#D4AF37] text-slate-950 shadow-2xs font-bold' :
                    rankNumber === 2 ? 'bg-slate-300 text-slate-800' :
                    rankNumber === 3 ? 'bg-amber-700 text-white' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {rankNumber}
                  </div>

                  <img
                    src={std.photo}
                    alt={std.name}
                    className="w-10 h-10 rounded-lg object-cover border shrink-0"
                  />

                  <div>
                    <h4 
                      onClick={() => onOpenStudentDetail(std.id)}
                      className="font-bold text-xs text-slate-900 hover:text-[#D4AF37] cursor-pointer"
                    >
                      {std.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      NIS: {std.nis} • Hafal: <strong className="text-slate-800">{std.totalJuzHafal} Juz</strong> • {std.currentUmmiJilid}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900">{std.avgScore}</span>
                    <span className="text-xs text-slate-400 font-semibold"> / 100</span>
                    <span className={`block text-[10px] font-bold ${
                      std.avgScore >= 90 ? 'text-emerald-700' :
                      std.avgScore >= 80 ? 'text-blue-700' :
                      std.avgScore >= 70 ? 'text-[#8C7015]' : 'text-red-600'
                    }`}>
                      {std.avgScore >= 90 ? 'MUMTAZ (Sangat Baik)' :
                       std.avgScore >= 80 ? 'JAYYID JIDDAN (Baik)' :
                       std.avgScore >= 70 ? 'JAYYID (Cukup)' : 'PERLU BIMBINGAN'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenDailyInputWithStudent(std.id)}
                      className="px-3 py-1.5 bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition cursor-pointer"
                    >
                      + Nilai
                    </button>
                    <button
                      onClick={() => onOpenStudentDetail(std.id)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
