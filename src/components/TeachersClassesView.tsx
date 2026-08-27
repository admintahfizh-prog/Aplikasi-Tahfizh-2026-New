import React, { useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Phone, 
  Mail, 
  Award, 
  X, 
  BookOpen,
  CheckCircle2,
  Layers,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  Share2,
  UserCheck,
  Shuffle,
  ChevronRight,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { Teacher, ClassItem, Student, Role, User } from '../types';
import { storageService } from '../services/storageService';

interface TeachersClassesViewProps {
  teachers: Teacher[];
  classes: ClassItem[];
  students: Student[];
  userRole: Role;
  onRefreshData: () => void;
}

export const TeachersClassesView: React.FC<TeachersClassesViewProps> = ({
  teachers,
  classes,
  students,
  userRole,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'teachers' | 'classes' | 'halaqah'>('teachers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHalaqahTeacherId, setSelectedHalaqahTeacherId] = useState<string>(teachers[0]?.id || '');

  // Modals
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherFormData, setTeacherFormData] = useState<Partial<Teacher>>({
    nip: '',
    name: '',
    phone: '0812',
    email: '',
    ummiCertified: true,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    specialization: 'Tahfizh 30 Juz & Ummi Dewasa'
  });

  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [classFormData, setClassFormData] = useState<Partial<ClassItem>>({
    name: '',
    level: 7,
    academicYear: '2026/2027',
    homeroomTeacherId: teachers[0]?.id || ''
  });

  // Assign Student Modal State
  const [showAssignStudentModal, setShowAssignStudentModal] = useState(false);
  const [assignTargetTeacherId, setAssignTargetTeacherId] = useState<string>(teachers[0]?.id || '');
  const [selectedStudentIdsToAssign, setSelectedStudentIdsToAssign] = useState<string[]>([]);
  const [assignClassFilter, setAssignClassFilter] = useState<string>('');

  // Teacher Password Management Modal State
  const [passwordModalTeacher, setPasswordModalTeacher] = useState<Teacher | null>(null);
  const [teacherUserAccount, setTeacherUserAccount] = useState<User | null>(null);
  const [teacherPasswordInput, setTeacherPasswordInput] = useState('');
  const [teacherUsernameInput, setTeacherUsernameInput] = useState('');
  const [showPassModalEye, setShowPassModalEye] = useState(false);

  const handleOpenTeacherPasswordModal = (teacher: Teacher) => {
    let u = storageService.getUserByTeacherId(teacher.id);
    if (!u) {
      const cleanUsername = teacher.email ? teacher.email.split('@')[0].toLowerCase() : `guru.${teacher.nip.slice(-4)}`;
      u = {
        id: `usr-t-${teacher.id}`,
        name: teacher.name,
        username: cleanUsername,
        password: 'guru21',
        email: teacher.email || `${cleanUsername}@smpialazhar21.sch.id`,
        role: 'guru',
        avatar: teacher.photo,
        title: `Guru Pengampu (${teacher.specialization})`,
        phone: teacher.phone,
        teacherId: teacher.id
      };
      storageService.saveUser(u);
    }
    setPasswordModalTeacher(teacher);
    setTeacherUserAccount(u);
    setTeacherUsernameInput(u.username || u.id);
    setTeacherPasswordInput(u.password || 'guru21');
  };

  const handleSaveTeacherPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalTeacher || !teacherUserAccount) return;
    const updated: User = {
      ...teacherUserAccount,
      username: teacherUsernameInput.trim().toLowerCase(),
      password: teacherPasswordInput.trim()
    };
    storageService.saveUser(updated);
    setPasswordModalTeacher(null);
    onRefreshData();
    alert(`Kata sandi akun guru ${passwordModalTeacher.name} berhasil diperbarui!`);
  };

  // Teacher Handlers
  const handleOpenAddTeacher = () => {
    setEditingTeacher(null);
    setTeacherFormData({
      nip: `198${Math.floor(10000000 + Math.random() * 90000000)}`,
      name: '',
      phone: '0812',
      email: '',
      ummiCertified: true,
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      specialization: 'Tahfizh Al-Qur\'an & Metode Ummi'
    });
    setShowTeacherModal(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherFormData.name) return;

    const teacherToSave: Teacher = {
      ...(editingTeacher || { id: 'tch-' + Date.now(), assignedStudentsCount: 0 }),
      ...teacherFormData
    } as Teacher;

    storageService.saveTeacher(teacherToSave);
    setShowTeacherModal(false);
    onRefreshData();
  };

  const handleDeleteTeacher = (id: string) => {
    if (window.confirm('Hapus data guru pembimbing ini?')) {
      storageService.deleteTeacher(id);
      onRefreshData();
    }
  };

  // Class Handlers
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setClassFormData({
      name: '',
      level: 7,
      academicYear: '2026/2027',
      homeroomTeacherId: teachers[0]?.id || ''
    });
    setShowClassModal(true);
  };

  const handleOpenEditClass = (cls: ClassItem) => {
    setEditingClass(cls);
    setClassFormData({
      name: cls.name,
      level: cls.level || 7,
      academicYear: cls.academicYear || '2026/2027',
      homeroomTeacherId: cls.homeroomTeacherId || teachers[0]?.id || ''
    });
    setShowClassModal(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormData.name?.trim()) return;

    const classToSave: ClassItem = {
      id: editingClass ? editingClass.id : 'cls-' + Date.now(),
      name: classFormData.name.trim(),
      level: Number(classFormData.level) || 7,
      academicYear: classFormData.academicYear?.trim() || '2026/2027',
      homeroomTeacherId: classFormData.homeroomTeacherId || teachers[0]?.id || '',
      studentCount: editingClass ? (editingClass.studentCount ?? 0) : 0
    };

    storageService.saveClass(classToSave);
    setShowClassModal(false);
    setEditingClass(null);
    onRefreshData();
  };

  const handleDeleteClass = (cls: ClassItem) => {
    const countInClass = students.filter(s => s.classId === cls.id).length;
    const msg = countInClass > 0 
      ? `Perhatian: Ada ${countInClass} santri/siswa yang terdaftar di rombel kelas "${cls.name}".\n\nApakah Anda yakin ingin menghapus kelas ini?`
      : `Apakah Anda yakin ingin menghapus rombel kelas "${cls.name}"?`;
    
    if (window.confirm(msg)) {
      storageService.deleteClass(cls.id);
      onRefreshData();
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4AF37]" />
            Manajemen Guru & Rombel Kelas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data Ustadz/Ustadzah pengampu tahfizh, sertifikasi Ummi, pembagian halaqah, dan data kelas
          </p>
        </div>

        {userRole === 'admin' && (
          <div className="flex items-center gap-2">
            {activeTab === 'teachers' ? (
              <button
                onClick={handleOpenAddTeacher}
                className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>+ Tambah Guru Tahfizh</span>
              </button>
            ) : (
              <button
                onClick={handleOpenAddClass}
                className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>+ Tambah Kelas Baru</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs flex-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'teachers'
                ? 'bg-[#1E293B] text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Data Guru ({teachers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'classes'
                ? 'bg-[#1E293B] text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Rombel Kelas ({classes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('halaqah')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'halaqah'
                ? 'bg-[#1E293B] text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Kelompok Halaqah (1-12 Anak)</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'teachers' 
                ? 'Cari nama guru atau NIP...' 
                : activeTab === 'classes' 
                ? 'Cari nama rombel kelas...' 
                : 'Cari santri / ustadz halaqah...'
            }
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-xs"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: TEACHERS VIEW */}
      {activeTab === 'teachers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((t) => {
              const assignedCount = students.filter(s => s.teacherId === t.id).length;

              return (
                <div
                  key={t.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition space-y-4"
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={t.photo}
                      alt={t.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {t.ummiCertified && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✓ Bersertifikasi Ummi
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 truncate mt-1">{t.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">NIP: {t.nip}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Spesialisasi:</span>
                      <span className="font-semibold text-slate-800 text-right">{t.specialization}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jumlah Santri:</span>
                      <span className="font-bold text-[#1E293B]">{assignedCount} Santri</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">WhatsApp:</span>
                      <span className="font-mono text-emerald-700 font-semibold">{t.phone}</span>
                    </div>
                  </div>

                  {userRole === 'admin' && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <button
                        onClick={() => handleOpenTeacherPasswordModal(t)}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                        title="Kelola Username & Password Guru"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                        <span>Sandi Akun</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTeacher(t);
                            setTeacherFormData(t);
                            setShowTeacherModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-[#1E293B] rounded-lg hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(t.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredTeachers.length === 0 && (
            <div className="p-10 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
              <p className="text-sm font-semibold">Tidak ada data guru yang sesuai dengan pencarian "{searchTerm}".</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLASSES VIEW */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((c) => {
              const homeroom = teachers.find(t => t.id === c.homeroomTeacherId);
              const countInClass = students.filter(s => s.classId === c.id).length;

              return (
                <div
                  key={c.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-900 font-bold text-sm">
                      {c.name}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                      Tingkat {c.level || 7} SMP
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Wali Kelas:</span>
                      <span className="font-semibold text-slate-800">{homeroom?.name || 'Belum Ditentukan'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tahun Ajaran:</span>
                      <span className="font-semibold text-slate-700">{c.academicYear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Santri:</span>
                      <span className="font-bold text-emerald-700">{countInClass} Siswa</span>
                    </div>
                  </div>

                  {userRole === 'admin' && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEditClass(c)}
                        className="px-2.5 py-1.5 text-slate-600 hover:text-[#1E293B] rounded-lg hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                        title="Edit data rombel kelas"
                      >
                        <Edit className="w-3.5 h-3.5" /> <span>Edit Kelas</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClass(c)}
                        className="px-2.5 py-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                        title="Hapus rombel kelas"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredClasses.length === 0 && (
            <div className="p-10 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
              <p className="text-sm font-semibold">Tidak ada rombel kelas yang sesuai dengan pencarian "{searchTerm}".</p>
              {userRole === 'admin' && (
                <button
                  onClick={handleOpenAddClass}
                  className="mt-3 px-4 py-2 bg-[#1E293B] text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-700"
                >
                  + Tambah Kelas Baru
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HALAQAH & KELOMPOK GURU (1 GURU 1-12 ANAK / LINTAS KELAS) */}
      {activeTab === 'halaqah' && (
        <div className="space-y-5 animate-in fade-in">
          
          {/* Banner Info & Action */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  Sistem Halaqah Fleksibel
                </span>
                <span className="text-xs text-slate-500">Kapasitas Ideal: 1 Guru membina 1–12 Santri</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Distribusi Kelompok Halaqah & Guru Pengampu
              </h3>
              <p className="text-xs text-slate-500 max-w-2xl">
                Semua guru dapat menguji seluruh kelas, atau difokuskan membina kelompok halaqah tetap (1 Guru memegang 1–12 anak lintas kelas maupun per kelas).
              </p>
            </div>

            {userRole === 'admin' && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    if (window.confirm('Bagi rata seluruh santri ke seluruh guru yang ada (1 guru rata-rata memegang 8-12 anak)?')) {
                      const result = storageService.autoDistributeStudentsToTeachers(12);
                      onRefreshData();
                      alert(`Berhasil membagi ${result.totalDistributed} santri secara seimbang ke ${result.groups.length} guru pengampu.`);
                    }
                  }}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                  title="Otomatis bagi rata santri 1 guru 1-12 anak"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Bagi Rata Otomatis (1-12 Anak)</span>
                </button>

                <button
                  onClick={() => {
                    setAssignTargetTeacherId(teachers[0]?.id || '');
                    setSelectedStudentIdsToAssign([]);
                    setShowAssignStudentModal(true);
                  }}
                  className="px-3.5 py-2 bg-[#1E293B] hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Atur Anggota Halaqah</span>
                </button>
              </div>
            )}
          </div>

          {/* Teacher Halaqah Group Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher) => {
              const teacherStudents = students.filter(s => s.teacherId === teacher.id);
              const count = teacherStudents.length;
              const isOverLimit = count > 12;
              const isIdeal = count >= 1 && count <= 12;

              return (
                <div
                  key={teacher.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition"
                >
                  {/* Card Header */}
                  <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-start gap-3">
                    <img
                      src={teacher.photo}
                      alt={teacher.name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{teacher.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          count === 0 
                            ? 'bg-slate-100 text-slate-600'
                            : isOverLimit
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {count} / 12 Santri
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                        {teacher.specialization || 'Guru Tahfizh'}
                      </p>
                    </div>
                  </div>

                  {/* Student List in Group */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    {teacherStudents.length > 0 ? (
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {teacherStudents.map((std, idx) => {
                          const cls = classes.find(c => c.id === std.classId);
                          return (
                            <div
                              key={std.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 text-xs transition"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <div className="truncate">
                                  <p className="font-semibold text-slate-800 truncate">{std.name}</p>
                                  <p className="text-[10px] text-slate-400">
                                    {cls?.name || 'Rombel'} • {std.currentUmmiJilid || 'Jilid 1'}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                                {std.totalJuzHafal || 0} Juz
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        <p className="font-medium">Belum ada santri di halaqah ini</p>
                        <p className="text-[10px]">Klik "Atur Anggota" untuk memasukkan santri</p>
                      </div>
                    )}

                    {/* Quick Move Action */}
                    {userRole === 'admin' && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {isOverLimit ? '⚠️ Melebihi rasio 12 anak' : '✓ Rasio pembinaan ideal'}
                        </span>
                        <button
                          onClick={() => {
                            setAssignTargetTeacherId(teacher.id);
                            setSelectedStudentIdsToAssign(teacherStudents.map(s => s.id));
                            setShowAssignStudentModal(true);
                          }}
                          className="text-[11px] font-bold text-[#1E293B] hover:text-[#D4AF37] flex items-center gap-1 cursor-pointer"
                        >
                          <span>Kelola Santri</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* MODAL TEACHER */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">
                {editingTeacher ? 'Edit Guru Tahfizh' : 'Tambah Guru Tahfizh'}
              </h3>
              <button onClick={() => setShowTeacherModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={teacherFormData.name}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  placeholder="Contoh: Ustadz Muhammad Fauzi, Lc."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NIP / Nomor Pegawai</label>
                <input
                  type="text"
                  value={teacherFormData.nip}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, nip: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={teacherFormData.phone}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, phone: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  placeholder="08123456789"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Spesialisasi / Keahlian</label>
                <input
                  type="text"
                  value={teacherFormData.specialization}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, specialization: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  placeholder="Tahfizh 30 Juz & Ummi Dewasa"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ummiCert"
                  checked={teacherFormData.ummiCertified}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, ummiCertified: e.target.checked })}
                  className="w-4 h-4 rounded text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <label htmlFor="ummiCert" className="font-semibold text-slate-700">Bersertifikasi Metode Ummi Foundation</label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E293B] hover:bg-slate-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Simpan Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CLASS */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">
                {editingClass ? 'Edit Rombel Kelas' : 'Tambah Rombel Kelas Baru'}
              </h3>
              <button onClick={() => { setShowClassModal(false); setEditingClass(null); }}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600 cursor-pointer" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Rombel Kelas *</label>
                <input
                  type="text"
                  required
                  value={classFormData.name || ''}
                  onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  placeholder="Contoh: 7A Tahfizh, 8B Putri, dll."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat Kelas</label>
                  <select
                    value={classFormData.level || 7}
                    onChange={(e) => setClassFormData({ ...classFormData, level: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    <option value={7}>Kelas 7</option>
                    <option value={8}>Kelas 8</option>
                    <option value={9}>Kelas 9</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={classFormData.academicYear || '2026/2027'}
                    onChange={(e) => setClassFormData({ ...classFormData, academicYear: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                    placeholder="2026/2027"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Wali Kelas / Guru Pembimbing</label>
                <select
                  value={classFormData.homeroomTeacherId || ''}
                  onChange={(e) => setClassFormData({ ...classFormData, homeroomTeacherId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  <option value="">-- Pilih Wali Kelas --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.nip})</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setShowClassModal(false); setEditingClass(null); }}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E293B] hover:bg-slate-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{editingClass ? 'Simpan Perubahan' : 'Tambah Kelas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TEACHER PASSWORD MANAGEMENT */}
      {passwordModalTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#1E293B] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-bold text-sm">
                  Kelola Sandi Akun Guru: {passwordModalTeacher.name}
                </h3>
              </div>
              <button
                onClick={() => setPasswordModalTeacher(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeacherPassword} className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={passwordModalTeacher.photo}
                  alt={passwordModalTeacher.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <p className="font-bold text-slate-900">{passwordModalTeacher.name}</p>
                  <p className="text-[11px] text-slate-500">NIP: {passwordModalTeacher.nip} • {passwordModalTeacher.specialization}</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Username Login Guru</label>
                <input
                  type="text"
                  required
                  value={teacherUsernameInput}
                  onChange={(e) => setTeacherUsernameInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none font-mono"
                />
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
                      setTeacherPasswordInput(`guru${rand}`);
                    }}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    Sandi Acak
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassModalEye ? 'text' : 'password'}
                    required
                    value={teacherPasswordInput}
                    onChange={(e) => setTeacherPasswordInput(e.target.value)}
                    placeholder="Masukkan kata sandi guru"
                    className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassModalEye(!showPassModalEye)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    {showPassModalEye ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const text = `*AKUN LOGIN GURU TAHFIZH SMPI AL AZHAR 21*\nNama: ${passwordModalTeacher.name}\nUsername: ${teacherUsernameInput}\nKata Sandi: ${teacherPasswordInput}\nLink Website: ${window.location.origin}`;
                    navigator.clipboard.writeText(text);
                    alert('Format pesan WhatsApp login guru berhasil disalin!');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Salin ke WA</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPasswordModalTeacher(null)}
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

      {/* MODAL: ASSIGN STUDENTS TO HALAQAH GROUP */}
      {showAssignStudentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#1E293B] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <h3 className="font-bold text-sm">
                    Atur Anggota Halaqah (1 Guru 1–12 Santri)
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Pilih santri yang akan dibina oleh ustadz/ustadzah pengampu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignStudentModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Target Teacher Selection */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-800">
                  Pilih Guru Pembina Halaqah:
                </label>
                <select
                  value={assignTargetTeacherId}
                  onChange={(e) => {
                    const newTid = e.target.value;
                    setAssignTargetTeacherId(newTid);
                    // Preselect students belonging to this teacher
                    setSelectedStudentIdsToAssign(students.filter(s => s.teacherId === newTid).map(s => s.id));
                  }}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  {teachers.map(t => {
                    const count = students.filter(s => s.teacherId === t.id).length;
                    return (
                      <option key={t.id} value={t.id}>
                        {t.name} (Saat ini: {count} santri)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Filter Class */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block font-semibold text-slate-600 mb-1">Filter Rombel Kelas:</label>
                  <select
                    value={assignClassFilter}
                    onChange={(e) => setAssignClassFilter(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="">Semua Rombel Kelas (Lintas Kelas)</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-5 text-right">
                  <span className="font-bold text-slate-800">
                    Terpilih: <strong className={`${selectedStudentIdsToAssign.length > 12 ? 'text-red-600' : 'text-emerald-700'}`}>{selectedStudentIdsToAssign.length}</strong> / 12 Santri
                  </span>
                </div>
              </div>

              {/* Student Checklist */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 p-2.5 font-bold text-slate-700 flex items-center justify-between border-b border-slate-200 text-xs">
                  <span>Daftar Santri</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const matching = students
                          .filter(s => !assignClassFilter || s.classId === assignClassFilter)
                          .map(s => s.id);
                        setSelectedStudentIdsToAssign(Array.from(new Set([...selectedStudentIdsToAssign, ...matching])));
                      }}
                      className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIdsToAssign([])}
                      className="text-[11px] text-slate-500 hover:underline font-semibold cursor-pointer"
                    >
                      Batal Pilih
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 p-1">
                  {students
                    .filter(s => !assignClassFilter || s.classId === assignClassFilter)
                    .map((s) => {
                      const isChecked = selectedStudentIdsToAssign.includes(s.id);
                      const currentTeacherObj = teachers.find(t => t.id === s.teacherId);
                      const cls = classes.find(c => c.id === s.classId);

                      return (
                        <label
                          key={s.id}
                          className={`flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition ${
                            isChecked ? 'bg-amber-50/60 font-semibold' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudentIdsToAssign([...selectedStudentIdsToAssign, s.id]);
                                } else {
                                  setSelectedStudentIdsToAssign(selectedStudentIdsToAssign.filter(id => id !== s.id));
                                }
                              }}
                              className="w-4 h-4 rounded text-[#D4AF37] focus:ring-[#D4AF37]"
                            />
                            <div className="min-w-0">
                              <p className="text-slate-900 truncate">{s.name}</p>
                              <p className="text-[10px] text-slate-400 font-normal">
                                NIS: {s.nis} • {cls?.name || 'Kelas'} • Saat ini dibina: {currentTeacherObj?.name || 'Belum ada'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {s.totalJuzHafal || 0} Juz
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {selectedStudentIdsToAssign.length > 12 && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                  ⚠️ <strong>Catatan:</strong> Kelompok berisi {selectedStudentIdsToAssign.length} santri (lebih dari kuota ideal 12 anak per ustadz).
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowAssignStudentModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!assignTargetTeacherId) return;
                  storageService.assignStudentsToTeacher(selectedStudentIdsToAssign, assignTargetTeacherId);
                  setShowAssignStudentModal(false);
                  onRefreshData();
                  const tObj = teachers.find(t => t.id === assignTargetTeacherId);
                  alert(`Berhasil memperbarui anggota halaqah ${tObj?.name || 'Guru'}: ${selectedStudentIdsToAssign.length} santri.`);
                }}
                className="px-5 py-2 bg-[#1E293B] hover:bg-slate-800 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Simpan Anggota Halaqah</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
