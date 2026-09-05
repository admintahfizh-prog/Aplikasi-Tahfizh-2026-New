import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Eye, 
  Phone, 
  Award, 
  BookOpen, 
  BookMarked, 
  CheckCircle2, 
  AlertCircle, 
  X,
  FileText,
  UserPlus,
  KeyRound,
  Sparkles,
  Share2,
  Save,
  EyeOff
} from 'lucide-react';
import { Student, Teacher, ClassItem, Role, User } from '../types';
import { storageService } from '../services/storageService';
import { UMMI_JILIDS } from '../data/ummiData';
import { AvatarBadge } from './AvatarBadge';

interface StudentsViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassItem[];
  userRole: Role;
  onOpenStudentDetail: (studentId: string) => void;
  onRefreshData: () => void;
  onOpenDailyInputWithStudent: (studentId: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  teachers,
  classes,
  userRole,
  onOpenStudentDetail,
  onRefreshData,
  onOpenDailyInputWithStudent
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('');

  // Modal States
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Student | null>(null);

  // Student Password Modal State
  const [passwordModalStudent, setPasswordModalStudent] = useState<Student | null>(null);
  const [studentUserAccount, setStudentUserAccount] = useState<User | null>(null);
  const [studentPasswordInput, setStudentPasswordInput] = useState('');
  const [studentUsernameInput, setStudentUsernameInput] = useState('');
  const [showStudentPassEye, setShowStudentPassEye] = useState(false);

  const handleOpenStudentPasswordModal = (student: Student) => {
    let u = storageService.getUserByStudentId(student.id);
    if (!u) {
      u = {
        id: `usr-s-${student.id}`,
        name: `${student.name} (${student.nickname || 'Santri'})`,
        username: student.nis,
        password: 'santri21',
        email: student.parentEmail || `${student.nis}@santri.smpialazhar21.sch.id`,
        role: 'wali',
        avatar: student.photo,
        title: `Wali Santri / Siswa (${student.parentName || student.name})`,
        phone: student.parentPhone,
        studentId: student.id
      };
      storageService.saveUser(u);
    }
    setPasswordModalStudent(student);
    setStudentUserAccount(u);
    setStudentUsernameInput(u.username || student.nis);
    setStudentPasswordInput(u.password || 'santri21');
  };

  const handleSaveStudentPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalStudent || !studentUserAccount) return;
    const updated: User = {
      ...studentUserAccount,
      username: studentUsernameInput.trim().toLowerCase(),
      password: studentPasswordInput.trim()
    };
    storageService.saveUser(updated);
    setPasswordModalStudent(null);
    onRefreshData();
    alert(`Kata sandi akun santri/wali ${passwordModalStudent.name} berhasil diperbarui!`);
  };

  // Helper for halaqah normalization (Akselerasi, Reguler, Khusus)
  const normalizeHalaqah = (prog?: string): string => {
    if (!prog) return 'Reguler';
    const p = prog.toLowerCase();
    if (p.includes('aksel') || p.includes('unggul')) return 'Akselerasi';
    if (p.includes('khusus') || p.includes('takhassus')) return 'Khusus';
    return 'Reguler';
  };

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    nis: '',
    nisn: '',
    name: '',
    nickname: '',
    gender: 'L',
    classId: classes[0]?.id || '',
    teacherId: teachers[0]?.id || '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    program: 'Akselerasi',
    targetJuz: 4.0,
    currentUmmiJilid: 'Jilid 1',
    currentUmmiPage: 1,
    photo: '',
    entryYear: '2026',
    totalJuzHafal: 0,
    totalSurahHafal: 0,
    totalAyahHafal: 0,
    lastHafalan: '-',
    lastHafalanDate: '-',
    avgScore: 0
  });

  // CSV Import State
  const [csvContent, setCsvContent] = useState('');
  const [importResult, setImportResult] = useState<{ successCount: number; errors: string[] } | null>(null);

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchClass = !selectedClassFilter || s.classId === selectedClassFilter;
    const matchTeacher = !selectedTeacherFilter || s.teacherId === selectedTeacherFilter;
    const matchProgram = !selectedProgramFilter || normalizeHalaqah(s.program) === selectedProgramFilter;

    return matchSearch && matchClass && matchTeacher && matchProgram;
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      nis: `26070${Math.floor(10 + Math.random() * 90)}`,
      nisn: `01123456${Math.floor(10 + Math.random() * 90)}`,
      name: '',
      nickname: '',
      gender: 'L',
      classId: classes[0]?.id || '',
      teacherId: teachers[0]?.id || '',
      parentName: '',
      parentPhone: '0812',
      parentEmail: '',
      program: 'Akselerasi',
      targetJuz: 4.0,
      currentUmmiJilid: 'Jilid 1',
      currentUmmiPage: 1,
      photo: '',
      entryYear: '2026',
      totalJuzHafal: 0,
      totalSurahHafal: 0,
      totalAyahHafal: 0,
      lastHafalan: '-',
      lastHafalanDate: '-',
      avgScore: 0
    });
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({ ...student });
    setShowAddEditModal(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nis) {
      alert('Nama dan NIS wajib diisi.');
      return;
    }

    const studentToSave: Student = {
      ...(editingStudent || {
        id: 'std-' + Date.now(),
        totalJuzHafal: 0,
        totalSurahHafal: 0,
        totalAyahHafal: 0,
        lastHafalan: '-',
        lastHafalanDate: '-',
        avgScore: 0
      }),
      ...formData,
      targetJuz: Number(formData.targetJuz) || 4.0,
      currentUmmiPage: Number(formData.currentUmmiPage) || 1
    } as Student;

    storageService.saveStudent(studentToSave);
    setShowAddEditModal(false);
    onRefreshData();
  };

  const handleDeleteStudent = () => {
    if (showDeleteConfirm) {
      storageService.deleteStudent(showDeleteConfirm.id);
      setShowDeleteConfirm(null);
      onRefreshData();
    }
  };

  const handleDownloadTemplate = () => {
    const template = storageService.generateStudentCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_import_siswa_tahfizh.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const csv = storageService.exportStudentsToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `data_siswa_tahfizh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvContent(text);
      };
      reader.readAsText(file);
    }
  };

  const handleProcessImport = () => {
    if (!csvContent.trim()) {
      alert('Silakan upload file CSV atau tempelkan data CSV.');
      return;
    }
    const result = storageService.importStudentsCSV(csvContent);
    setImportResult(result);
    if (result.successCount > 0) {
      onRefreshData();
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#D4AF37]" />
            Data Santri / Siswa Tahfizh
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen profil, target hafalan, pembagian kelas, dan jilid Metode Ummi ({students.length} santri)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {userRole !== 'wali' && (
            <>
              <button
                id="btn-import-csv"
                onClick={() => {
                  setImportResult(null);
                  setCsvContent('');
                  setShowImportModal(true);
                }}
                className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Import CSV</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                id="btn-add-student"
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-[#D4AF37]" />
                <span>+ Tambah Siswa</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama siswa, NIS, NISN..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            />
          </div>

          {/* Filter Kelas */}
          <div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="">Semua Kelas ({classes.length})</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Guru */}
          <div>
            <select
              value={selectedTeacherFilter}
              onChange={(e) => setSelectedTeacherFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="">Semua Guru Tahfizh ({teachers.length})</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Program / Halaqah */}
          <div>
            <select
              value={selectedProgramFilter}
              onChange={(e) => setSelectedProgramFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            >
              <option value="">Semua Pilihan Halaqah</option>
              <option value="Akselerasi">Akselerasi</option>
              <option value="Reguler">Reguler</option>
              <option value="Khusus">Khusus</option>
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Menampilkan <strong>{filteredStudents.length}</strong> dari <strong>{students.length}</strong> siswa</span>
          {(searchTerm || selectedClassFilter || selectedTeacherFilter || selectedProgramFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedClassFilter('');
                setSelectedTeacherFilter('');
                setSelectedProgramFilter('');
              }}
              className="text-[#8C7015] font-semibold hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredStudents.map((std) => {
          const cls = classes.find(c => c.id === std.classId);
          const teacher = teachers.find(t => t.id === std.teacherId);
          const progressPercent = Math.min(100, Math.round((std.totalJuzHafal / std.targetJuz) * 100));

          return (
            <div
              key={std.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition p-4 flex flex-col justify-between space-y-3 relative group"
            >
              {/* Top Row: Avatar & Basic Info */}
              <div className="flex items-start gap-3">
                <AvatarBadge
                  name={std.name}
                  photoUrl={std.photo}
                  gender={std.gender}
                  role="santri"
                  size="md"
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">NIS: {std.nis}</span>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        normalizeHalaqah(std.program) === 'Akselerasi'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : normalizeHalaqah(std.program) === 'Khusus'
                          ? 'bg-purple-50 text-purple-900 border-purple-300'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {normalizeHalaqah(std.program)}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {cls?.name || '7A'}
                      </span>
                    </div>
                  </div>
                  <h3 
                    onClick={() => onOpenStudentDetail(std.id)}
                    className="text-sm font-bold text-slate-800 truncate hover:text-[#D4AF37] transition cursor-pointer mt-0.5"
                  >
                    {std.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    Guru: {teacher?.name || 'Ustadz Ahmad Fauzan, Lc.'}
                  </p>
                </div>
              </div>

              {/* Progress & Stats Box */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2 text-xs">
                
                {/* Visual Progress Bar */}
                <div>
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Target: {std.targetJuz} Juz</span>
                    <span className="text-[#8C7015] font-bold">{std.totalJuzHafal} Juz ({progressPercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progressPercent >= 75 ? 'bg-[#D4AF37]' :
                        progressPercent >= 40 ? 'bg-blue-600' : 'bg-slate-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Sub Stats */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Jilid Ummi:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <BookMarked className="w-3 h-3 text-[#1E293B]" />
                      {std.currentUmmiJilid} (Hal. {std.currentUmmiPage})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Rata-rata Nilai:</span>
                    <span className="font-bold text-[#8C7015] flex items-center gap-1">
                      <Award className="w-3 h-3 text-[#D4AF37]" />
                      {std.avgScore || 85} / 100
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400">Hafalan Terakhir: </span>
                  <strong className="text-slate-800">{std.lastHafalan}</strong>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 gap-2">
                <button
                  onClick={() => onOpenDailyInputWithStudent(std.id)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="text-[#D4AF37] font-bold">+</span>
                  <span>Setoran</span>
                </button>

                <button
                  onClick={() => onOpenStudentDetail(std.id)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="Lihat Detail Profil"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {userRole !== 'wali' && (
                  <>
                    <button
                      onClick={() => handleOpenEdit(std)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                      title="Edit Data Siswa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {userRole === 'admin' && (
                      <>
                        <button
                          onClick={() => handleOpenStudentPasswordModal(std)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition cursor-pointer"
                          title="Kelola Username & Password Santri"
                        >
                          <KeyRound className="w-4 h-4 text-amber-700" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(std)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-red-600 transition cursor-pointer"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {filteredStudents.length === 0 && (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-700">Tidak ada santri yang cocok dengan filter pencarian.</p>
          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci atau reset filter.</p>
        </div>
      )}

      {/* MODAL: ADD / EDIT STUDENT */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <h2 className="text-base font-bold">
                {editingStudent ? 'Edit Data Santri' : 'Tambah Santri Baru'}
              </h2>
              <button onClick={() => setShowAddEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Photo & Avatar Section */}
              <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <AvatarBadge
                  name={formData.name || 'Santri'}
                  photoUrl={formData.photo}
                  gender={formData.gender}
                  role="santri"
                  size="xl"
                  editable={true}
                  onPhotoChange={(base64) => setFormData({ ...formData, photo: base64 })}
                  onPhotoRemove={() => setFormData({ ...formData, photo: '' })}
                />
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-xs">Foto / Avatar Profil Santri</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Otomatis menggunakan avatar islami ({formData.gender === 'P' ? '🧕 Santriwati / Jilbab' : '👳 Santriwan / Peci'}). Klik tombol kamera untuk mengunggah foto custom.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIS (Nomor Induk Siswa) *</label>
                  <input
                    type="text"
                    required
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NISN</label>
                  <input
                    type="text"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Santri *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                    placeholder="Contoh: Muhammad Fatih Al-Ayyubi"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Panggilan</label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                    placeholder="Contoh: Fatih"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    <option value="L">Laki-laki (Ikhwan)</option>
                    <option value="P">Perempuan (Akhawat)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Guru Tahfizh</label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilihan Halaqah Santri</label>
                  <select
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    <option value="Akselerasi">Akselerasi</option>
                    <option value="Reguler">Reguler</option>
                    <option value="Khusus">Khusus</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Hafalan (Juz)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="30"
                    value={formData.targetJuz}
                    onChange={(e) => setFormData({ ...formData, targetJuz: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jilid Ummi Saat Ini</label>
                  <select
                    value={formData.currentUmmiJilid}
                    onChange={(e) => setFormData({ ...formData, currentUmmiJilid: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    {UMMI_JILIDS.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Parent Details */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800">Informasi Orang Tua / Wali</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Nama Orang Tua / Wali</label>
                    <input
                      type="text"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      placeholder="Contoh: Bpk. H. Iskandar"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Nomor WhatsApp Orang Tua</label>
                    <input
                      type="text"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                      placeholder="Contoh: 081234567890"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Simpan Data Santri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CSV / EXCEL IMPORT */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#D4AF37]" />
                <h2 className="text-base font-bold">Import Data Siswa dari CSV / Excel</h2>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              
              <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">Format Template CSV:</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Gunakan format kolom: NIS, NISN, Nama Lengkap, Nama Panggilan, Jenis Kelamin, Kelas, Program, Target Juz, Nama Orang Tua, No HP WA, Jilid Ummi.
                  </p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c49f2c] text-slate-900 font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Upload Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih File CSV:</label>
                <input
                  type="file"
                  accept=".csv, .txt"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#1E293B] file:text-white hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              {/* Raw CSV Text area */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Atau Tempelkan Teks CSV Langsung:</label>
                <textarea
                  rows={6}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="NIS,NISN,Nama Lengkap,Nama Panggilan,Jenis Kelamin,Kelas,Program,Target Juz,Nama Orang Tua,No HP WA,Jilid Ummi..."
                  className="w-full bg-slate-50 font-mono text-[11px] p-3 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Results Preview */}
              {importResult && (
                <div className={`p-4 rounded-xl border ${importResult.successCount > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                  <p className="font-bold">
                    {importResult.successCount > 0 
                      ? `✅ Berhasil mengimpor ${importResult.successCount} siswa baru!` 
                      : '❌ Gagal mengimpor siswa.'}
                  </p>
                  {importResult.errors.length > 0 && (
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-[11px] text-red-700">
                      {importResult.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

            </div>

            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 font-bold text-xs"
              >
                Tutup
              </button>
              <button
                onClick={handleProcessImport}
                className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Proses & Simpan ke Database</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: STUDENT PASSWORD MANAGEMENT */}
      {passwordModalStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#1E293B] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-bold text-sm">
                  Kelola Sandi Santri: {passwordModalStudent.name}
                </h3>
              </div>
              <button
                onClick={() => setPasswordModalStudent(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudentPassword} className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <AvatarBadge
                  name={passwordModalStudent.name}
                  photoUrl={passwordModalStudent.photo}
                  gender={passwordModalStudent.gender}
                  role="santri"
                  size="md"
                  className="shrink-0"
                />
                <div>
                  <p className="font-bold text-slate-900">{passwordModalStudent.name}</p>
                  <p className="text-[11px] text-slate-500">NIS: {passwordModalStudent.nis} • Wali: {passwordModalStudent.parentName || 'Orang Tua'}</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Username / NIS Login Santri</label>
                <input
                  type="text"
                  required
                  value={studentUsernameInput}
                  onChange={(e) => setStudentUsernameInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Disarankan menggunakan NIS santri agar mudah diingat.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    Kata Sandi (Password) Akun
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      setStudentPasswordInput(`santri${rand}`);
                    }}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    Sandi Acak
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showStudentPassEye ? 'text' : 'password'}
                    required
                    value={studentPasswordInput}
                    onChange={(e) => setStudentPasswordInput(e.target.value)}
                    placeholder="Masukkan kata sandi santri"
                    className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPassEye(!showStudentPassEye)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    {showStudentPassEye ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const text = `*AKUN LOGIN SANTRI/WALI TAHFIZH SMPI AL AZHAR 21*\nNama Santri: ${passwordModalStudent.name}\nUsername / NIS: ${studentUsernameInput}\nKata Sandi: ${studentPasswordInput}\nLink Website: ${window.location.origin}`;
                    navigator.clipboard.writeText(text);
                    alert('Format pesan WhatsApp login santri berhasil disalin!');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Salin ke WA</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPasswordModalStudent(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1E293B] hover:bg-slate-800 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Simpan Sandi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRM */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900">Hapus Data Santri?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus <strong>{showDeleteConfirm.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteStudent}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
