import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronDown,
  ShieldCheck,
  UserPlus,
  Clock,
  MapPin,
  FileText
} from 'lucide-react';
import { Teacher, ClassItem, Student, Role, User, HalaqahGroup } from '../types';
import { storageService } from '../services/storageService';
import { AvatarBadge } from './AvatarBadge';

interface TeachersClassesViewProps {
  teachers: Teacher[];
  classes: ClassItem[];
  students: Student[];
  userRole: Role;
  currentUser?: User;
  onOpenProfile?: () => void;
  onRefreshData: () => void;
}

export const TeachersClassesView: React.FC<TeachersClassesViewProps> = ({
  teachers,
  classes,
  students,
  userRole,
  currentUser,
  onOpenProfile,
  onRefreshData
}) => {
  // Resolve current teacher for logged in teacher account
  const myTeacher = useMemo(() => {
    return teachers.find(t => 
      (currentUser?.teacherId && t.id === currentUser.teacherId) ||
      t.id === currentUser?.id ||
      (currentUser?.email && t.email && t.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser?.name && t.name && (t.name.toLowerCase().includes(currentUser.name.toLowerCase()) || currentUser.name.toLowerCase().includes(t.name.toLowerCase())))
    ) || (userRole === 'guru' ? teachers[0] : undefined);
  }, [teachers, currentUser, userRole]);

  const [activeTab, setActiveTab] = useState<'teachers' | 'classes' | 'halaqah'>(userRole === 'guru' ? 'halaqah' : 'teachers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHalaqahTeacherId, setSelectedHalaqahTeacherId] = useState<string>(() => (userRole === 'guru' && myTeacher ? myTeacher.id : 'all'));
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  // When myTeacher resolves on load, sync selectedHalaqahTeacherId for guru
  useEffect(() => {
    if (userRole === 'guru' && myTeacher && selectedHalaqahTeacherId === 'all') {
      setSelectedHalaqahTeacherId(myTeacher.id);
    }
  }, [userRole, myTeacher]);

  const canManageTeacherHalaqah = (teacherId: string) => {
    if (userRole === 'admin') return true;
    if (userRole === 'guru' && myTeacher) {
      return teacherId === myTeacher.id;
    }
    return false;
  };

  const canManageGroup = (group: HalaqahGroup) => {
    if (userRole === 'admin') return true;
    if (userRole === 'guru' && myTeacher) {
      return group.teacherId === myTeacher.id;
    }
    return false;
  };

  // Halaqah Groups State
  const [halaqahGroups, setHalaqahGroups] = useState<HalaqahGroup[]>(() => storageService.getHalaqahGroups());

  useEffect(() => {
    setHalaqahGroups(storageService.getHalaqahGroups());
  }, [teachers, students]);

  // Halaqah Manual Input Modal State
  const [showHalaqahModal, setShowHalaqahModal] = useState(false);
  const [editingHalaqah, setEditingHalaqah] = useState<HalaqahGroup | null>(null);
  const [halaqahFormData, setHalaqahFormData] = useState<{
    id?: string;
    name: string;
    teacherId: string;
    description: string;
    schedule: string;
    room: string;
    maxCapacity: number;
    studentIds: string[];
  }>({
    name: '',
    teacherId: teachers[0]?.id || '',
    description: 'Tahsin Ummi & Tahfizh Juz 30',
    schedule: 'Senin - Kamis, 07.00 - 08.15',
    room: 'Masjid Utama Al Azhar',
    maxCapacity: 12,
    studentIds: []
  });
  const [halaqahStudentSearch, setHalaqahStudentSearch] = useState('');
  const [halaqahClassFilter, setHalaqahClassFilter] = useState('');

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
  const [assignTargetHalaqahId, setAssignTargetHalaqahId] = useState<string>('');
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

  // Halaqah Handlers
  const handleOpenAddHalaqah = (teacherId?: string) => {
    const defaultTid = (userRole === 'guru' && myTeacher) 
      ? myTeacher.id 
      : (teacherId || (teachers[0]?.id || ''));
    const teacherExistingGroups = halaqahGroups.filter(g => g.teacherId === defaultTid);
    if (teacherExistingGroups.length >= 5) {
      alert('Guru ini sudah memiliki 5 kelompok halaqah (batas maksimal 2–5 kelompok). Silakan edit kelompok yang ada atau pilih guru lain.');
      return;
    }
    const nextGroupNum = teacherExistingGroups.length + 1;
    setEditingHalaqah(null);
    setHalaqahFormData({
      name: `Halaqah ${nextGroupNum}`,
      teacherId: defaultTid,
      description: 'Tahsin Ummi & Tahfizh Al-Qur\'an',
      schedule: 'Senin - Kamis, 07.00 - 08.15',
      room: 'Masjid Utama Lt. 1',
      maxCapacity: 12,
      studentIds: []
    });
    setHalaqahStudentSearch('');
    setHalaqahClassFilter('');
    setShowHalaqahModal(true);
  };

  const handleQuickRemoveStudentFromGroup = (groupId: string, studentId: string) => {
    const group = halaqahGroups.find(g => g.id === groupId);
    if (!group) return;
    const remainingStudentIds = (group.studentIds || []).filter(id => id !== studentId);
    storageService.assignStudentsToHalaqahGroup(remainingStudentIds, group.id, group.teacherId);
    setHalaqahGroups(storageService.getHalaqahGroups());
    onRefreshData();
  };

  const handleOpenEditHalaqah = (group: HalaqahGroup) => {
    setEditingHalaqah(group);
    setHalaqahFormData({
      id: group.id,
      name: group.name,
      teacherId: group.teacherId,
      description: group.description || '',
      schedule: group.schedule || 'Senin - Kamis, 07.00 - 08.15',
      room: group.room || 'Masjid Utama Lt. 1',
      maxCapacity: group.maxCapacity || 12,
      studentIds: [...(group.studentIds || [])]
    });
    setHalaqahStudentSearch('');
    setHalaqahClassFilter('');
    setShowHalaqahModal(true);
  };

  const handleSaveHalaqah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!halaqahFormData.name.trim() || !halaqahFormData.teacherId) {
      alert('Nama kelompok dan Guru pengampu wajib diisi.');
      return;
    }

    // If new, check max 5 groups per teacher
    if (!editingHalaqah) {
      const existing = halaqahGroups.filter(g => g.teacherId === halaqahFormData.teacherId);
      if (existing.length >= 5) {
        alert('Guru ini sudah memiliki 5 kelompok halaqah. Maksimal per guru adalah 5 kelompok.');
        return;
      }
    }

    const saved = storageService.saveHalaqahGroup({
      id: halaqahFormData.id,
      name: halaqahFormData.name.trim(),
      teacherId: halaqahFormData.teacherId,
      description: halaqahFormData.description.trim(),
      schedule: halaqahFormData.schedule.trim(),
      room: halaqahFormData.room.trim(),
      maxCapacity: Number(halaqahFormData.maxCapacity) || 12,
      studentIds: halaqahFormData.studentIds
    });

    // Also sync the students' halaqahGroupId & halaqahGroupName
    storageService.assignStudentsToHalaqahGroup(halaqahFormData.studentIds, saved.id);

    setShowHalaqahModal(false);
    setHalaqahGroups(storageService.getHalaqahGroups());
    onRefreshData();
    alert(`Kelompok ${saved.name} berhasil disimpan dengan ${halaqahFormData.studentIds.length} santri.`);
  };

  const handleDeleteHalaqah = (group: HalaqahGroup) => {
    if (window.confirm(`Hapus kelompok "${group.name}"? Santri di kelompok ini akan dilepas status halaqahnya.`)) {
      storageService.deleteHalaqahGroup(group.id);
      setHalaqahGroups(storageService.getHalaqahGroups());
      onRefreshData();
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort classes naturally: 7A, 7B, 7C, 8A, 8B, 8C, etc.
  const filteredClasses = [...classes]
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'id', { numeric: true, sensitivity: 'base' }));

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

        <div className="flex flex-wrap items-center gap-2">
          {userRole === 'guru' && onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Ganti Password, Upload Foto Profil & Ubah Data Akun Guru"
            >
              <KeyRound className="w-4 h-4 text-amber-700" />
              <span>Ganti Password & Foto Guru</span>
            </button>
          )}

          {userRole === 'guru' && (
            <button
              onClick={() => handleOpenAddHalaqah(myTeacher?.id)}
              className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>+ Tambah Kelompok Halaqah Saya</span>
            </button>
          )}

          {userRole === 'admin' && (
            <>
              {activeTab === 'teachers' ? (
                <button
                  onClick={handleOpenAddTeacher}
                  className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  <span>+ Tambah Guru Tahfizh</span>
                </button>
              ) : activeTab === 'classes' ? (
                <button
                  onClick={handleOpenAddClass}
                  className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  <span>+ Tambah Kelas Baru</span>
                </button>
              ) : (
                <button
                  onClick={() => handleOpenAddHalaqah()}
                  className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  <span>+ Tambah Halaqah Manual</span>
                </button>
              )}
            </>
          )}
        </div>
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
            <span>Kelompok Halaqah (2-5 per Guru)</span>
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
                    <AvatarBadge
                      name={t.name}
                      photoUrl={t.photo}
                      role="guru"
                      size="lg"
                      className="shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {t.ummiCertified && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✓ Bersertifikasi Ummi
                          </span>
                        )}
                        {userRole === 'guru' && myTeacher?.id === t.id && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                            Akun Anda
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

                  {userRole === 'guru' && myTeacher?.id === t.id && onOpenProfile && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={onOpenProfile}
                        className="w-full px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                        <span>Edit Profil, Sandi & Upload Foto</span>
                      </button>
                    </div>
                  )}

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
              const classStudents = students
                .filter(s => s.classId === c.id)
                .sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }));
              const isExpanded = expandedClassId === c.id;

              return (
                <div
                  key={c.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-slate-900 text-[#D4AF37] font-bold text-sm">
                        Kelas {c.name}
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
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Total Santri:</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {classStudents.length} Siswa Terdaftar
                        </span>
                      </div>
                    </div>

                    {/* Toggle Show Students Alphabetically A-Z */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setExpandedClassId(isExpanded ? null : c.id)}
                        className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>Daftar Santri Kelas ({classStudents.length} Siswa A-Z)</span>
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5 max-h-60 overflow-y-auto pr-1 animate-in fade-in">
                          {classStudents.length > 0 ? (
                            classStudents.map((std, idx) => {
                              const tch = teachers.find(t => t.id === std.teacherId);
                              const halaqah = halaqahGroups.find(g => g.id === std.halaqahGroupId);
                              return (
                                <div
                                  key={std.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-white text-xs transition"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                      {idx + 1}
                                    </span>
                                    <AvatarBadge
                                      name={std.name}
                                      photoUrl={std.photo}
                                      gender={std.gender}
                                      role="santri"
                                      size="xs"
                                      className="shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <p className="font-semibold text-slate-800 truncate">{std.name}</p>
                                      <p className="text-[10px] text-slate-400">
                                        NIS: {std.nis} • {std.gender === 'P' ? 'Perempuan' : 'Laki-laki'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">
                                      {std.totalJuzHafal || 0} Juz
                                    </span>
                                    <p className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[110px]">
                                      {halaqah?.name || (tch ? `Binaan ${tch.name}` : '-')}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-center py-4 text-[11px] text-slate-400">Belum ada santri di kelas ini.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {userRole === 'admin' && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1 mt-2">
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

      {/* TAB 3: HALAQAH & KELOMPOK GURU (1 GURU 2-5 KELOMPOK HALAQAH DENGAN INPUT MANUAL) */}
      {activeTab === 'halaqah' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Banner Info & Action */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Sistem Halaqah Multi-Kelompok
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Rekomendasi: <strong>1 Guru mengampu 2 sampai 5 Kelompok Halaqah</strong>
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Distribusi & Manajemen Kelompok Halaqah Guru Tahfizh
              </h3>
              <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
                Setiap Ustadz/Ustadzah dapat mengelola 2 hingga 5 kelompok halaqah mandiri secara terstruktur. Anda dapat menginput nama kelompok halaqah secara manual, menentukan jadwal, ruangan, serta memilih santri binaan berurutan abjad A-Z lengkap dengan foto profil gender santri.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {userRole === 'guru' && onOpenProfile && (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition"
                  title="Ganti Password, Upload Foto Profil & Ubah Data"
                >
                  <KeyRound className="w-4 h-4 text-amber-700" />
                  <span>Ganti Password & Foto Guru</span>
                </button>
              )}
              {userRole === 'guru' && (
                <button
                  type="button"
                  onClick={() => handleOpenAddHalaqah(myTeacher?.id)}
                  className="px-4 py-2.5 bg-[#1E293B] hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition"
                >
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  <span>+ Tambah Kelompok Halaqah Saya</span>
                </button>
              )}
              {userRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleOpenAddHalaqah()}
                  className="px-4 py-2.5 bg-[#1E293B] hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition"
                >
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  <span>+ Tambah Kelompok Halaqah Manual</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Guru Halaqah */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Filter Guru Pengampu:</span>
              <select
                value={selectedHalaqahTeacherId}
                onChange={(e) => setSelectedHalaqahTeacherId(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              >
                <option value="all">Semua Guru Tahfizh ({teachers.length} Guru)</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="text-slate-500 font-medium">
              Total Kelompok Terdaftar: <strong className="text-slate-900">{halaqahGroups.length} Halaqah</strong>
            </div>
          </div>

          {/* Teacher Groups Container */}
          <div className="space-y-6">
            {teachers
              .filter(t => selectedHalaqahTeacherId === 'all' || t.id === selectedHalaqahTeacherId)
              .filter(t => 
                t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.nip.includes(searchTerm)
              )
              .map((teacher) => {
                const teacherHalaqahs = halaqahGroups.filter(g => g.teacherId === teacher.id);
                const teacherGroupCount = teacherHalaqahs.length;
                const isIdealGroupCount = teacherGroupCount >= 2 && teacherGroupCount <= 5;
                const isBelowMin = teacherGroupCount < 2;
                const isAtMax = teacherGroupCount >= 5;

                // Total students across all halaqahs of this teacher
                const allTeacherStudentIds = new Set(teacherHalaqahs.flatMap(g => g.studentIds || []));
                // Also add legacy assigned students if any
                students.filter(s => s.teacherId === teacher.id).forEach(s => allTeacherStudentIds.add(s.id));
                const totalStudentsForTeacher = allTeacherStudentIds.size;

                return (
                  <div
                    key={teacher.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                  >
                    {/* Teacher Header Bar */}
                    <div className="p-4 sm:p-5 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <AvatarBadge
                          name={teacher.name}
                          photoUrl={teacher.photo}
                          role="guru"
                          size="md"
                          className="shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                              {teacher.name}
                            </h4>
                            {teacher.ummiCertified && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                                Ummi Certified
                              </span>
                            )}
                            {userRole === 'guru' && myTeacher?.id === teacher.id && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold shrink-0">
                                Akun Anda
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                            {teacher.specialization || 'Guru Tahfizh'} • NIP: {teacher.nip || '-'} • WA: {teacher.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status Badge 2-5 Kelompok */}
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                              isIdealGroupCount
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isBelowMin
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}>
                              {teacherGroupCount} / 5 Kelompok Halaqah
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {isIdealGroupCount 
                              ? '✓ Sesuai target (2–5 kelompok)' 
                              : isBelowMin 
                              ? '⚠️ Disarankan tambah hingga 2–5 kelompok' 
                              : 'Batas maksimal 5 kelompok'}
                          </span>
                        </div>

                        {canManageTeacherHalaqah(teacher.id) && !isAtMax && (
                          <button
                            type="button"
                            onClick={() => handleOpenAddHalaqah(teacher.id)}
                            className="px-3 py-1.5 bg-[#1E293B] hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                            title="Tambah kelompok halaqah untuk guru ini"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>+ Kelompok</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Halaqah Groups Grid for this Teacher */}
                    <div className="p-4 sm:p-5">
                      {teacherHalaqahs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {teacherHalaqahs.map((group, gIdx) => {
                            const groupStudents = students
                              .filter(s => (group.studentIds || []).includes(s.id))
                              .sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }));

                            return (
                              <div
                                key={group.id}
                                className="bg-slate-50/60 rounded-xl border border-slate-200 hover:border-slate-300 transition p-4 flex flex-col justify-between space-y-3"
                              >
                                <div className="space-y-2.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                                        Kelompok {gIdx + 1}
                                      </span>
                                      <h5 className="font-extrabold text-slate-900 text-sm mt-1 truncate">
                                        {group.name}
                                      </h5>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                                      groupStudents.length > (group.maxCapacity || 12)
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {groupStudents.length} Santri
                                    </span>
                                  </div>

                                  {/* Details */}
                                  <div className="text-[11px] text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-slate-100">
                                    {group.description && (
                                      <p className="flex items-center gap-1.5 text-slate-700 font-semibold truncate">
                                        <FileText className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                                        <span className="truncate">{group.description}</span>
                                      </p>
                                    )}
                                    {group.schedule && (
                                      <p className="flex items-center gap-1.5 text-slate-500 truncate">
                                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate">{group.schedule}</span>
                                      </p>
                                    )}
                                    {group.room && (
                                      <p className="flex items-center gap-1.5 text-slate-500 truncate">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate">{group.room}</span>
                                      </p>
                                    )}
                                  </div>

                                  {/* Student List in Group (Sorted A-Z) */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                                      <span>Santri Anggota (A-Z)</span>
                                      <span className="text-[10px] text-slate-400">{groupStudents.length} Santri</span>
                                    </div>

                                    {groupStudents.length > 0 ? (
                                      <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                                        {groupStudents.map((std, sIdx) => {
                                          const cls = classes.find(c => c.id === std.classId);
                                          return (
                                            <div
                                              key={std.id}
                                              className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-100 text-xs hover:border-slate-300 transition"
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold flex items-center justify-center shrink-0">
                                                  {sIdx + 1}
                                                </span>
                                                <AvatarBadge
                                                  name={std.name}
                                                  photoUrl={std.photo}
                                                  gender={std.gender}
                                                  role="santri"
                                                  size="xs"
                                                  className="shrink-0"
                                                />
                                                <div className="min-w-0 truncate">
                                                  <p className="font-semibold text-slate-800 text-[11px] truncate">{std.name}</p>
                                                  <p className="text-[9px] text-slate-400 truncate">
                                                    NIS: {std.nis} • {cls?.name || 'Rombel'}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">
                                                  {std.totalJuzHafal || 0} Juz
                                                </span>
                                                {canManageGroup(group) && (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleQuickRemoveStudentFromGroup(group.id, std.id);
                                                    }}
                                                    className="p-1 text-slate-300 hover:text-red-600 rounded transition cursor-pointer"
                                                    title={`Keluarkan ${std.name} dari ${group.name}`}
                                                  >
                                                    <X className="w-3 h-3" />
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="py-4 text-center bg-white rounded-lg border border-dashed border-slate-200 text-slate-400 text-[11px]">
                                        <p>Belum ada santri di kelompok ini</p>
                                        {canManageGroup(group) && (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEditHalaqah(group)}
                                            className="text-blue-600 font-bold hover:underline mt-1 block mx-auto text-[10px] cursor-pointer"
                                          >
                                            + Pilih Santri Sekarang
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Card Actions */}
                                {canManageGroup(group) && (
                                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditHalaqah(group)}
                                      className="text-[11px] font-bold text-[#1E293B] hover:text-[#D4AF37] flex items-center gap-1 cursor-pointer"
                                    >
                                      <Edit className="w-3 h-3" />
                                      <span>Edit / Atur Santri</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteHalaqah(group)}
                                      className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                                      title="Hapus kelompok halaqah ini"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Hapus</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                          <p className="text-xs font-semibold">
                            Ustadz/Ustadzah {teacher.name} belum memiliki kelompok halaqah.
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Setiap guru dianjurkan memiliki 2 hingga 5 kelompok halaqah santri.
                          </p>
                          {canManageTeacherHalaqah(teacher.id) && (
                            <button
                              type="button"
                              onClick={() => handleOpenAddHalaqah(teacher.id)}
                              className="mt-3 px-4 py-2 bg-[#1E293B] text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-800 transition"
                            >
                              + Buat Kelompok Halaqah 1
                            </button>
                          )}
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
                <AvatarBadge
                  name={passwordModalTeacher.name}
                  photoUrl={passwordModalTeacher.photo}
                  role="guru"
                  size="md"
                  className="shrink-0"
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

      {/* MODAL: INPUT & EDIT HALAQAH MANUAL (1 GURU 2-5 KELOMPOK) */}
      {showHalaqahModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-[#1E293B] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-slate-800 text-[#D4AF37]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {editingHalaqah ? 'Edit Kelompok Halaqah' : 'Input Kelompok Halaqah Manual'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Konfigurasi nama kelompok, jadwal, ruangan, dan santri binaan (1 Guru bisa 2–5 kelompok)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHalaqahModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveHalaqah} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                
                {/* Guru Pembina */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">
                    Guru / Ustadz Pembina Halaqah *
                  </label>
                  {userRole === 'guru' && myTeacher ? (
                    <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AvatarBadge name={myTeacher.name} photoUrl={myTeacher.photo} role="guru" size="xs" />
                        <span>{myTeacher.name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Kelompok Anda
                      </span>
                    </div>
                  ) : (
                    <select
                      required
                      value={halaqahFormData.teacherId}
                      onChange={(e) => setHalaqahFormData({ ...halaqahFormData, teacherId: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                    >
                      {teachers.map(t => {
                        const tGroups = halaqahGroups.filter(g => g.teacherId === t.id && g.id !== editingHalaqah?.id);
                        return (
                          <option key={t.id} value={t.id}>
                            {t.name} (Saat ini: {tGroups.length} kelompok terdaftar)
                          </option>
                        );
                      })}
                    </select>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Setiap guru pengampu dapat mengelola 2 hingga 5 kelompok halaqah.
                  </p>
                </div>

                {/* Nama Kelompok & Kapasitas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block font-bold text-slate-800">
                      Nama Kelompok Halaqah *
                    </label>
                    <input
                      type="text"
                      required
                      value={halaqahFormData.name}
                      onChange={(e) => setHalaqahFormData({ ...halaqahFormData, name: e.target.value })}
                      placeholder="Contoh: Halaqah 1 (Abu Bakar Ash-Shiddiq)"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800">
                      Kapasitas Maksimal
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={halaqahFormData.maxCapacity}
                      onChange={(e) => setHalaqahFormData({ ...halaqahFormData, maxCapacity: Number(e.target.value) || 12 })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Fokus Program & Jadwal & Ruang */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800">
                      Fokus / Program Materi
                    </label>
                    <input
                      type="text"
                      value={halaqahFormData.description}
                      onChange={(e) => setHalaqahFormData({ ...halaqahFormData, description: e.target.value })}
                      placeholder="Contoh: Tahsin Ummi & Juz 30"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800">
                      Jadwal Rutin
                    </label>
                    <input
                      type="text"
                      value={halaqahFormData.schedule}
                      onChange={(e) => setHalaqahFormData({ ...halaqahFormData, schedule: e.target.value })}
                      placeholder="Senin - Kamis, 07.00 - 08.15"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800">
                      Ruang / Tempat
                    </label>
                    <input
                      type="text"
                      value={halaqahFormData.room}
                      onChange={(e) => setHalaqahFormData({ ...halaqahFormData, room: e.target.value })}
                      placeholder="Masjid Utama Lt. 1"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Section Pemilihan Santri Manual */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">
                        Pilih Santri Anggota Kelompok (Urut Abjad A-Z)
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Santri ditampilkan dengan foto profil sesuai gender dan informasi kelas
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        halaqahFormData.studentIds.length > halaqahFormData.maxCapacity
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {halaqahFormData.studentIds.length} Santri Terpilih
                      </span>
                    </div>
                  </div>

                  {/* Filter Search & Rombel Kelas */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={halaqahStudentSearch}
                        onChange={(e) => setHalaqahStudentSearch(e.target.value)}
                        placeholder="Cari nama santri atau NIS..."
                        className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                      />
                    </div>

                    <select
                      value={halaqahClassFilter}
                      onChange={(e) => setHalaqahClassFilter(e.target.value)}
                      className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
                    >
                      <option value="">Semua Rombel Kelas</option>
                      {filteredClasses.map(c => (
                        <option key={c.id} value={c.id}>Kelas {c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Checklist Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-3 py-2 text-slate-700 font-bold flex items-center justify-between text-[11px] border-b border-slate-200">
                      <span>Daftar Santri Tersedia (A-Z)</span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => {
                            const matchingIds = students
                              .filter(s => !halaqahClassFilter || s.classId === halaqahClassFilter)
                              .filter(s => !halaqahStudentSearch || s.name.toLowerCase().includes(halaqahStudentSearch.toLowerCase()) || s.nis.includes(halaqahStudentSearch))
                              .map(s => s.id);
                            setHalaqahFormData(prev => ({
                              ...prev,
                              studentIds: Array.from(new Set([...prev.studentIds, ...matchingIds]))
                            }));
                          }}
                          className="text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                          Pilih Sesuai Filter
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setHalaqahFormData(prev => ({ ...prev, studentIds: [] }))}
                          className="text-slate-500 font-bold hover:underline cursor-pointer"
                        >
                          Kosongkan Pilihan
                        </button>
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
                      {students
                        .filter(s => !halaqahClassFilter || s.classId === halaqahClassFilter)
                        .filter(s => 
                          !halaqahStudentSearch || 
                          s.name.toLowerCase().includes(halaqahStudentSearch.toLowerCase()) || 
                          s.nis.includes(halaqahStudentSearch)
                        )
                        .sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }))
                        .map((s, idx) => {
                          const isChecked = halaqahFormData.studentIds.includes(s.id);
                          const cls = classes.find(c => c.id === s.classId);
                          const currentHalaqah = halaqahGroups.find(g => g.id === s.halaqahGroupId && g.id !== editingHalaqah?.id);

                          return (
                            <label
                              key={s.id}
                              className={`flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition ${
                                isChecked ? 'bg-amber-50/70 font-semibold' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setHalaqahFormData(prev => ({
                                        ...prev,
                                        studentIds: [...prev.studentIds, s.id]
                                      }));
                                    } else {
                                      setHalaqahFormData(prev => ({
                                        ...prev,
                                        studentIds: prev.studentIds.filter(id => id !== s.id)
                                      }));
                                    }
                                  }}
                                  className="w-4 h-4 rounded text-[#D4AF37] focus:ring-[#D4AF37]"
                                />
                                <AvatarBadge
                                  name={s.name}
                                  photoUrl={s.photo}
                                  gender={s.gender}
                                  role="santri"
                                  size="xs"
                                  className="shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="text-slate-900 truncate text-[11px]">{s.name}</p>
                                  <p className="text-[9px] text-slate-400 font-normal">
                                    NIS: {s.nis} • {cls?.name ? `Kelas ${cls.name}` : 'Rombel'} • {s.gender === 'P' ? 'Perempuan' : 'Laki-laki'}
                                    {currentHalaqah ? ` • (Halaqah lain: ${currentHalaqah.name})` : ''}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                                {s.totalJuzHafal || 0} Juz
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowHalaqahModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E293B] hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Simpan Kelompok Halaqah</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
