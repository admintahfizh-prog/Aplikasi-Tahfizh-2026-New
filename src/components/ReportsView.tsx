import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Filter, 
  Search, 
  BookOpen, 
  BookMarked, 
  Award, 
  CheckCircle2, 
  Calendar,
  Layers,
  Sparkles,
  UserCheck,
  FileCheck2
} from 'lucide-react';
import { Student, Teacher, ClassItem, MemorizationRecord, UmmiRecord, AppSettings } from '../types';
import { storageService } from '../services/storageService';
import { StudentRaportCard } from './StudentRaportCard';

interface ReportsViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassItem[];
  records: MemorizationRecord[];
  ummiRecords: UmmiRecord[];
  settings: AppSettings;
  onOpenStudentDetail: (studentId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  teachers,
  classes,
  records,
  ummiRecords,
  settings,
  onOpenStudentDetail
}) => {
  const [reportType, setReportType] = useState<'raport_individu' | 'hafalan' | 'ummi' | 'rekap_nilai' | 'raport_kelas'>('raport_individu');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'class-asc' | 'class-desc' | 'name-asc' | 'score-desc' | 'juz-desc'>('class-asc');
  const [selectedIndividualStudentId, setSelectedIndividualStudentId] = useState<string>(students[0]?.id || '');

  const filteredStudents = students.filter(s => {
    const matchClass = !selectedClass || s.classId === selectedClass;
    const matchTeacher = !selectedTeacher || s.teacherId === selectedTeacher;
    const matchSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.nis || '').includes(searchTerm);
    return matchClass && matchTeacher && matchSearch;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const clsA = classes.find(c => c.id === a.classId)?.name || '';
    const clsB = classes.find(c => c.id === b.classId)?.name || '';

    if (sortBy === 'class-asc') {
      const clsCompare = clsA.localeCompare(clsB);
      if (clsCompare !== 0) return clsCompare;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'class-desc') {
      const clsCompare = clsB.localeCompare(clsA);
      if (clsCompare !== 0) return clsCompare;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'score-desc') {
      return b.avgScore - a.avgScore;
    }
    if (sortBy === 'juz-desc') {
      return b.totalJuzHafal - a.totalJuzHafal;
    }
    return 0;
  });

  const currentIndividualStudent = students.find(s => s.id === selectedIndividualStudentId) || students[0];
  const currentStudentTeacher = teachers.find(t => t.id === currentIndividualStudent?.teacherId);
  const currentStudentClass = classes.find(c => c.id === currentIndividualStudent?.classId);

  const handlePrint = () => {
    window.print();
  };

  const handleExportHafalanCSV = () => {
    const csv = storageService.exportHafalanToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_tahfizh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportStudentsCSV = () => {
    const csv = storageService.exportStudentsToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rekap_capaian_santri_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#D4AF37]" />
            Laporan & Raport Tahfizh Al Azhar 21
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cetak raport resmi individu santri (Tahfizh & Metode Ummi) dan rekapitulasi kelas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportHafalanCSV}
            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#D4AF37]" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Selection Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          {[
            { id: 'raport_individu', label: '1. Raport Individu Santri (Format Resmi)', icon: FileCheck2, highlight: true },
            { id: 'hafalan', label: '2. Rekap Capaian Hafalan Al-Qur\'an', icon: BookOpen },
            { id: 'ummi', label: '3. Rekap Pembelajaran Metode Ummi', icon: BookMarked },
            { id: 'rekap_nilai', label: '4. Rekapitulasi Nilai & Evaluasi', icon: Award },
            { id: 'raport_kelas', label: '5. Buku Induk Tahfizh Kelas', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = reportType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  isActive
                    ? 'bg-[#1E293B] text-white shadow-xs font-bold'
                    : tab.highlight
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4AF37]' : tab.highlight ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {reportType !== 'raport_individu' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Cari Santri / NIS:</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ketik nama atau NIS..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Kelas:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              >
                <option value="">Semua Rombel Kelas</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Urutkan Data (Sort):</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full py-1.5 px-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              >
                <option value="class-asc">Urut Berdasarkan Kelas (A → Z)</option>
                <option value="class-desc">Urut Berdasarkan Kelas (Z → A)</option>
                <option value="name-asc">Urut Nama Santri (A → Z)</option>
                <option value="score-desc">Urut Nilai Tertinggi</option>
                <option value="juz-desc">Urut Capaian Juz Terbanyak</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter Guru Pengampu:</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              >
                <option value="">Semua Ustadz/Ustadzah</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* VIEW: RAPORT INDIVIDU SANTRI */}
      {reportType === 'raport_individu' && currentIndividualStudent && (
        <StudentRaportCard
          student={currentIndividualStudent}
          teacher={currentStudentTeacher}
          studentClass={currentStudentClass}
          records={records}
          ummiRecords={ummiRecords}
          settings={settings}
          allStudents={students}
          classes={classes}
          onSelectStudent={(id) => setSelectedIndividualStudentId(id)}
        />
      )}

      {/* VIEW: TABEL REKAP KELAS / MASSAL */}
      {reportType !== 'raport_individu' && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs space-y-6 print:p-0 print:border-none print:shadow-none">
          
          {/* Kop Surat Resmi Sekolah */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
              {settings.schoolName}
            </h2>
            <p className="text-xs text-slate-700 font-medium">
              {settings.schoolSubtitle}
            </p>
            <p className="text-[11px] text-slate-500 italic">
              {settings.schoolAddress}
            </p>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide text-slate-900">
              {reportType === 'hafalan' && 'REKAPITULASI CAPAIAN HAFALAN AL-QUR\'AN'}
              {reportType === 'ummi' && 'REKAPITULASI PEMBELAJARAN METODE UMMI'}
              {reportType === 'rekap_nilai' && 'REKAPITULASI NILAI & EVALUASI TAJWID'}
              {reportType === 'raport_kelas' && 'BUKU INDUK MONITORING TAHFIZH & UMMI'}
            </h3>
            <p className="text-xs text-slate-600">
              Kelas: <strong>{selectedClass ? classes.find(c => c.id === selectedClass)?.name : 'Semua Kelas'}</strong> • Periode: {settings.academicYear} ({settings.semester})
            </p>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-200 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold text-[11px]">
                  <th className="p-2 text-center border-r border-slate-200 w-10">No</th>
                  <th className="p-2 text-left border-r border-slate-200">NIS</th>
                  <th className="p-2 text-left border-r border-slate-200">Nama Lengkap Santri</th>
                  <th className="p-2 text-left border-r border-slate-200">Kelas</th>
                  
                  {reportType === 'hafalan' && (
                    <>
                      <th className="p-2 text-center border-r border-slate-200">Target</th>
                      <th className="p-2 text-center border-r border-slate-200">Capaian Riil</th>
                      <th className="p-2 text-center border-r border-slate-200">% Capaian</th>
                      <th className="p-2 text-left border-r border-slate-200">Hafalan Terakhir</th>
                      <th className="p-2 text-center">Status</th>
                    </>
                  )}

                  {reportType === 'ummi' && (
                    <>
                      <th className="p-2 text-left border-r border-slate-200">Jilid Ummi</th>
                      <th className="p-2 text-center border-r border-slate-200">Halaman</th>
                      <th className="p-2 text-center border-r border-slate-200">Nilai Rata-rata</th>
                      <th className="p-2 text-left">Status Kelulusan</th>
                    </>
                  )}

                  {reportType === 'rekap_nilai' && (
                    <>
                      <th className="p-2 text-center border-r border-slate-200">Skor Rata-rata</th>
                      <th className="p-2 text-center border-r border-slate-200">Predikat</th>
                      <th className="p-2 text-center border-r border-slate-200">Kelancaran</th>
                      <th className="p-2 text-center border-r border-slate-200">Tajwid</th>
                      <th className="p-2 text-left">Catatan Umum</th>
                    </>
                  )}

                  {reportType === 'raport_kelas' && (
                    <>
                      <th className="p-2 text-center border-r border-slate-200">Total Juz</th>
                      <th className="p-2 text-center border-r border-slate-200">Jilid Ummi</th>
                      <th className="p-2 text-center border-r border-slate-200">Nilai</th>
                      <th className="p-2 text-left">Guru Pembimbing</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedStudents.map((std, idx) => {
                  const cls = classes.find(c => c.id === std.classId);
                  const teacher = teachers.find(t => t.id === std.teacherId);
                  const percent = Math.min(100, Math.round((std.totalJuzHafal / std.targetJuz) * 100));

                  return (
                    <tr key={std.id} className="hover:bg-slate-50">
                      <td className="p-2 text-center border-r border-slate-200 font-mono text-[11px]">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono text-[11px]">{std.nis}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{std.name}</td>
                      <td className="p-2 border-r border-slate-200">{cls?.name || '7A'}</td>

                      {reportType === 'hafalan' && (
                        <>
                          <td className="p-2 text-center border-r border-slate-200">{std.targetJuz} Juz</td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-[#8C7015]">{std.totalJuzHafal} Juz</td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-emerald-700">{percent}%</td>
                          <td className="p-2 border-r border-slate-200">{std.lastHafalan}</td>
                          <td className="p-2 text-center font-bold text-[10px]">
                            {percent >= 70 ? '🟢 Sesuai Target' : percent >= 40 ? '🟡 Perlu Ditingkatkan' : '🔴 Tertinggal'}
                          </td>
                        </>
                      )}

                      {reportType === 'ummi' && (
                        <>
                          <td className="p-2 border-r border-slate-200 font-bold text-emerald-800">{std.currentUmmiJilid}</td>
                          <td className="p-2 text-center border-r border-slate-200">Hal. {std.currentUmmiPage}</td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold">{std.avgScore}</td>
                          <td className="p-2 font-semibold text-emerald-700">Lulus Uji Halaman</td>
                        </>
                      )}

                      {reportType === 'rekap_nilai' && (
                        <>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-slate-900">{std.avgScore}</td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-emerald-800">
                            {std.avgScore >= 90 ? 'MUMTAZ' : std.avgScore >= 80 ? 'JAYYID JIDDAN' : 'JAYYID'}
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 font-medium">92</td>
                          <td className="p-2 text-center border-r border-slate-200 font-medium">88</td>
                          <td className="p-2 text-slate-600 text-[11px]">Sangat disiplin dalam halaqah tahfizh</td>
                        </>
                      )}

                      {reportType === 'raport_kelas' && (
                        <>
                          <td className="p-2 text-center border-r border-slate-200 font-bold">{std.totalJuzHafal} Juz</td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-emerald-800">{std.currentUmmiJilid}</td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold">{std.avgScore}</td>
                          <td className="p-2">{teacher?.name}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Lembar Tanda Tangan */}
          <div className="pt-8 grid grid-cols-2 text-center text-xs">
            <div>
              <p className="text-slate-500">Mengetahui,</p>
              <p className="font-bold text-slate-800">Kepala SMP Islam Al Azhar 21</p>
              <div className="h-16"></div>
              <p className="font-bold text-slate-900 underline">{settings.headmasterName || 'H. M. Ridwan, M.Pd.I'}</p>
              <p className="text-[10px] text-slate-500 font-mono">NIK. 01.0125</p>
            </div>

            <div>
              <p className="text-slate-500">Sukoharjo, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-bold text-slate-800">Koordinator Tahfizh & Metode Ummi</p>
              <div className="h-16"></div>
              <p className="font-bold text-slate-900 underline">Ustadz Ahmad Fauzan, Lc., M.Ag.</p>
              <p className="text-[10px] text-slate-500 font-mono">NIK. 02.0367</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
