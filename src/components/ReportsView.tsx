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
import { Student, Teacher, ClassItem, MemorizationRecord, UmmiRecord, AppSettings, Role, User, TermName, TargetProgress } from '../types';
import { storageService } from '../services/storageService';
import { StudentRaportCard } from './StudentRaportCard';
import { isGrade8or9Student, isClass7Bto7E, resolveRaportTargetHafalan } from '../utils/gradeHelper';
import { getGradeFromScore } from '../utils/gradeConversion';
import { getStudentStandardTermTarget, evaluateUmmiTerm, TERM_DEFINITIONS } from '../data/targetTermData';

interface ReportsViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassItem[];
  records: MemorizationRecord[];
  ummiRecords: UmmiRecord[];
  settings: AppSettings;
  userRole?: Role;
  currentUser?: User | null;
  onOpenStudentDetail: (studentId: string) => void;
  onRefreshData?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  teachers,
  classes,
  records,
  ummiRecords,
  settings,
  userRole,
  currentUser,
  onOpenStudentDetail,
  onRefreshData
}) => {
  const isWali = userRole === 'wali';
  const [reportType, setReportType] = useState<'raport_individu' | 'hafalan' | 'ummi' | 'rekap_nilai' | 'raport_kelas'>('raport_individu');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedUmmiTerm, setSelectedUmmiTerm] = useState<TermName>('Term 1');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'class-asc' | 'class-desc' | 'name-asc' | 'score-desc' | 'juz-desc'>('class-asc');
  const [selectedIndividualStudentId, setSelectedIndividualStudentId] = useState<string>(students[0]?.id || '');

  const allTargets = React.useMemo(() => storageService.getTargets(), [students, ummiRecords, records]);

  const getStudentUmmiTargetInfo = (std: Student, termKey: TermName = selectedUmmiTerm) => {
    const storedTarget = allTargets.find(t =>
      t.studentId === std.id &&
      (t.category === 'Ummi' || Boolean(t.targetUmmiJilid)) &&
      (t.term === termKey || (!t.term && termKey === 'Term 1') || (t.period && t.period.includes(termKey)))
    );
    const standard = getStudentStandardTermTarget(std, termKey, 'Ummi');
    const curJilid = std.currentUmmiJilid && std.currentUmmiJilid !== '-' ? std.currentUmmiJilid : 'Jilid 1';
    const curPage = std.currentUmmiPage || 1;
    const isOldAutoJilid3 = termKey === 'Term 1' && curJilid === 'Jilid 3' && storedTarget?.targetUmmiJilid === 'Al-Qur\'an' && (storedTarget?.notes || '').startsWith('Target Term 1: Pemantapan tilawah');
    const targetJilid = (isOldAutoJilid3 ? standard.targetJilid : storedTarget?.targetUmmiJilid) || standard.targetJilid || 'Jilid 1';
    const targetPage = (isOldAutoJilid3 ? standard.targetPage : storedTarget?.targetUmmiPage) || standard.targetPage || 40;
    const evalRes = evaluateUmmiTerm(curJilid, curPage, targetJilid, targetPage);

    return {
      targetJilid,
      targetPage,
      curJilid,
      curPage,
      percentage: evalRes.percentage,
      status: evalRes.status,
      summary: evalRes.summary
    };
  };

  const yusrieTeacher = teachers.find(t => (t.name || '').toLowerCase().includes('yusrie'));
  const coordinatorName = (settings.tahfizhCoordinator && !settings.tahfizhCoordinator.toLowerCase().includes('fauzan') && !settings.tahfizhCoordinator.toLowerCase().includes('sekar'))
    ? settings.tahfizhCoordinator
    : (yusrieTeacher?.name || 'Ustadz Muhammad Yusrie Alfian, S.Ag.');
  const coordinatorNik = (settings.tahfizhCoordinatorNik && settings.tahfizhCoordinatorNik !== '02.0367')
    ? settings.tahfizhCoordinatorNik
    : (yusrieTeacher?.nip || '04.0413');
  const headmasterName = settings.headmasterName || settings.principalName || 'Muh Saifuddin,S.Si';
  const headmasterNik = settings.headmasterNik || '01.0125';

  // If user is wali, always lock to raport_individu
  React.useEffect(() => {
    if (isWali && reportType !== 'raport_individu') {
      setReportType('raport_individu');
    }
  }, [isWali, reportType]);

  // Keep selectedIndividualStudentId updated
  React.useEffect(() => {
    if (students.length > 0 && (!selectedIndividualStudentId || !students.some(s => s.id === selectedIndividualStudentId))) {
      setSelectedIndividualStudentId(students[0].id);
    }
  }, [students, selectedIndividualStudentId]);

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

  const reportStudents = reportType === 'ummi'
    ? sortedStudents.filter(std => !isGrade8or9Student(std, classes))
    : sortedStudents;

  const currentIndividualStudent = students.find(s => s.id === selectedIndividualStudentId) || students[0];
  const currentStudentTeacher = teachers.find(t => t.id === currentIndividualStudent?.teacherId);
  const currentStudentClass = classes.find(c => c.id === currentIndividualStudent?.classId);

  const handlePrint = () => {
    try {
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        const printableArea = document.querySelector('.raport-sheet') || document.querySelector('.printable-report-area');
        if (printableArea) {
          const content = printableArea.outerHTML;
          const printWin = window.open('', '_blank', 'width=950,height=900');
          if (printWin) {
            const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
              .map(el => el.outerHTML)
              .join('\n');
            printWin.document.open();
            printWin.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8" />
                  <title>Laporan Tahfizh SMPI Al Azhar 21</title>
                  ${styles}
                  <style>
                    @page { size: auto; margin: 6mm; }
                    body { margin: 0; padding: 10px; background: #fff; font-family: sans-serif; }
                    .no-print { display: none !important; }
                  </style>
                </head>
                <body>
                  ${content}
                  <script>
                    window.onload = function() {
                      setTimeout(function() { window.focus(); window.print(); }, 400);
                    };
                  </script>
                </body>
              </html>
            `);
            printWin.document.close();
            return;
          }
        }
      }
      window.print();
    } catch (e) {
      window.print();
    }
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
        {!isWali ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
            {[
              { id: 'raport_individu', label: '1. Raport Individu Santri (Format Resmi)', icon: FileCheck2, highlight: true },
              { id: 'hafalan', label: '2. Rekap Capaian Hafalan Al-Qur\'an', icon: BookOpen },
              { id: 'ummi', label: '3. Rekap Pembelajaran Metode Ummi (Kelas 7)', icon: BookMarked },
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
        ) : (
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <FileCheck2 className="w-4 h-4 text-[#D4AF37]" />
              <span>Raport Resmi Santri: <span className="text-[#8C7015]">{currentIndividualStudent?.name || 'Pribadi'}</span></span>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Privasi Santri Terjaga
            </span>
          </div>
        )}

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

            {reportType === 'ummi' && (
              <div className="sm:col-span-2 lg:col-span-4 pt-1 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Periode Target Evaluasi Metode Ummi:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {TERM_DEFINITIONS.map(td => (
                    <button
                      key={td.term}
                      type="button"
                      onClick={() => setSelectedUmmiTerm(td.term)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        selectedUmmiTerm === td.term
                          ? 'bg-[#1E293B] text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {td.label} ({td.months})
                    </button>
                  ))}
                </div>
              </div>
            )}
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
          userRole={userRole}
          onSelectStudent={(id) => setSelectedIndividualStudentId(id)}
          onUpdateStudent={(updated) => {
            storageService.saveStudent(updated);
            onRefreshData?.();
          }}
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
              {reportType === 'ummi' && `REKAPITULASI PEMBELAJARAN & CAPAIAN TARGET METODE UMMI (KELAS 7 - ${selectedUmmiTerm.toUpperCase()})`}
              {reportType === 'rekap_nilai' && 'REKAPITULASI NILAI & EVALUASI TAJWID'}
              {reportType === 'raport_kelas' && 'BUKU INDUK MONITORING TAHFIZH & UMMI'}
            </h3>
            <p className="text-xs text-slate-600">
              Kelas: <strong>{selectedClass ? classes.find(c => c.id === selectedClass)?.name : 'Semua Kelas'}</strong> • Periode: {settings.academicYear} ({settings.semester})
            </p>
          </div>

          {reportType === 'ummi' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5 no-print">
              <BookMarked className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Kebijakan TP Ini: Pembelajaran UMMI Khusus Jenjang Kelas 7</p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Sesuai kebijakan kurikulum, seluruh santri Kelas 8 dan 9 tidak mengikuti pembelajaran UMMI dan tidak masuk jilid Ummi. Rekapitulasi di bawah ini menampilkan santri Kelas 7 beserta target Ummi ({selectedUmmiTerm}) dan status ketercapaian targetnya.
                </p>
              </div>
            </div>
          )}

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
                      <th className="p-2 text-center border-r border-slate-200">Target Ummi</th>
                      <th className="p-2 text-center border-r border-slate-200">Capaian Riil</th>
                      <th className="p-2 text-center border-r border-slate-200">% Capaian</th>
                      <th className="p-2 text-center border-r border-slate-200">Nilai Rata-rata</th>
                      <th className="p-2 text-center">Status</th>
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
                {reportStudents.map((std, idx) => {
                  const cls = classes.find(c => c.id === std.classId);
                  const teacher = teachers.find(t => t.id === std.teacherId);
                  const percent = Math.min(100, Math.round((std.totalJuzHafal / std.targetJuz) * 100));
                  const ummiTargetInfo = reportType === 'ummi' ? getStudentUmmiTargetInfo(std, selectedUmmiTerm) : null;

                  return (
                    <tr key={std.id} className="hover:bg-slate-50">
                      <td className="p-2 text-center border-r border-slate-200 font-mono text-[11px]">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono text-[11px]">{std.nis}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{std.name}</td>
                      <td className="p-2 border-r border-slate-200">{cls?.name || '7A'}</td>

                      {reportType === 'hafalan' && (
                        <>
                          <td className="p-2 text-center border-r border-slate-200 font-semibold text-slate-800">
                            {isClass7Bto7E(std, classes, cls)
                              ? resolveRaportTargetHafalan(std, classes, cls, 'TENGAH SEMESTER 1')
                              : `${std.targetJuz} Juz`}
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-[#8C7015]">{std.totalJuzHafal} Juz</td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-emerald-700">{percent}%</td>
                          <td className="p-2 border-r border-slate-200">{std.lastHafalan}</td>
                          <td className="p-2 text-center font-bold text-[10px]">
                            {percent >= 70 ? '🟢 Sesuai Target' : percent >= 40 ? '🟡 Perlu Ditingkatkan' : '🔴 Tertinggal'}
                          </td>
                        </>
                      )}

                      {reportType === 'ummi' && ummiTargetInfo && (
                        <>
                          <td className="p-2 text-center border-r border-slate-200 font-semibold text-slate-800">
                            {ummiTargetInfo.targetJilid} <span className="text-slate-500 text-[11px]">(Hal. {ummiTargetInfo.targetPage})</span>
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-[#8C7015]">
                            {ummiTargetInfo.curJilid} <span className="text-slate-600 font-semibold text-[11px]">(Hal. {ummiTargetInfo.curPage})</span>
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-emerald-700">
                            {ummiTargetInfo.percentage}%
                          </td>
                          <td className="p-2 text-center border-r border-slate-200 font-black text-slate-800">
                            Grade {std.raportUmmiNilai || getGradeFromScore(std.avgScore || 85).letter}
                          </td>
                          <td className="p-2 text-center font-bold text-[10px]">
                            {ummiTargetInfo.status === 'on-track'
                              ? '🟢 Sesuai Target'
                              : ummiTargetInfo.status === 'needs-attention'
                              ? '🟡 Perlu Ditingkatkan'
                              : '🔴 Tertinggal'}
                          </td>
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
                          <td className="p-2 text-center border-r border-slate-200 font-bold text-slate-800">
                            {isGrade8or9Student(std, classes) ? (
                              <span className="text-slate-400 font-normal italic">- (Non-Ummi)</span>
                            ) : (
                              <span className="text-emerald-800">{std.currentUmmiJilid || '-'}</span>
                            )}
                          </td>
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

          {reportStudents.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="font-semibold text-slate-600">Tidak ada santri yang sesuai dengan kriteria / filter laporan ini.</p>
              {reportType === 'ummi' && selectedClass && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Catatan: Kelas 8 dan 9 tidak mengikuti pembelajaran UMMI. Pilih kelas 7 untuk melihat data Ummi.
                </p>
              )}
            </div>
          )}

          {/* Lembar Tanda Tangan */}
          <div className="pt-8 grid grid-cols-2 text-center text-xs">
            <div className="flex flex-col items-center justify-between">
              <div>
                <p className="text-slate-500">Mengetahui,</p>
                <p className="font-bold text-slate-800">Kepala SMP Islam Al Azhar 21</p>
              </div>
              {settings.headmasterSignatureUrl ? (
                <div className="h-16 flex items-center justify-center my-1">
                  <img
                    src={settings.headmasterSignatureUrl}
                    alt="TTD Kepala Sekolah"
                    className="h-14 max-w-[140px] object-contain select-none"
                  />
                </div>
              ) : (
                <div className="h-16"></div>
              )}
              <div>
                <p className="font-bold text-slate-900 underline">{headmasterName}</p>
                <p className="text-[10px] text-slate-500 font-mono">NIK. {headmasterNik}</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-between">
              <div>
                <p className="text-slate-500">Sukoharjo, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold text-slate-800">Koordinator Tahfizh & Metode Ummi</p>
              </div>
              {settings.tahfizhCoordinatorSignatureUrl ? (
                <div className="h-16 flex items-center justify-center my-1">
                  <img
                    src={settings.tahfizhCoordinatorSignatureUrl}
                    alt="TTD Koordinator Tahfizh"
                    className="h-14 max-w-[140px] object-contain select-none"
                  />
                </div>
              ) : (
                <div className="h-16"></div>
              )}
              <div>
                <p className="font-bold text-slate-900 underline">{coordinatorName}</p>
                <p className="text-[10px] text-slate-500 font-mono">NIK. {coordinatorNik}</p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
