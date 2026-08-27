import React, { useState } from 'react';
import { 
  Settings, 
  School, 
  Calendar, 
  Award, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  Download, 
  ShieldCheck,
  Building,
  KeyRound,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Search,
  Users,
  GraduationCap,
  UserCheck,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  Share2,
  Lock,
  Cloud,
  Database,
  UploadCloud,
  CheckCircle
} from 'lucide-react';
import { AppSettings, Role, User, Student, Teacher } from '../types';
import { storageService } from '../services/storageService';

interface SettingsViewProps {
  settings: AppSettings;
  userRole: Role;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  userRole,
  onRefreshData
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'database'>('database');
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudStatusMsg, setCloudStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // User Management state
  const [usersList, setUsersList] = useState<User[]>(() => storageService.getUsers());
  const [allStudents, setAllStudents] = useState<Student[]>(() => storageService.getStudents());
  const [allTeachers, setAllTeachers] = useState<Teacher[]>(() => storageService.getTeachers());
  
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'guru' | 'wali' | 'admin'>('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState<{
    id: string;
    name: string;
    username: string;
    password: string;
    email: string;
    role: Role;
    title: string;
    phone: string;
    teacherId?: string;
    studentId?: string;
  }>({
    id: '',
    name: '',
    username: '',
    password: '',
    email: '',
    role: 'guru',
    title: '',
    phone: '',
    teacherId: undefined,
    studentId: undefined
  });
  
  const [showPass, setShowPass] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userMsg, setUserMsg] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onRefreshData();
  };

  const handleToggleVisiblePassword = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleCopyCredentials = (u: User) => {
    const text = `*AKUN LOGIN TAHFIZH SMPI AL AZHAR 21*\nNama: ${u.name}\nRole: ${u.role === 'admin' ? 'Administrator' : u.role === 'guru' ? 'Guru Pengampu' : 'Siswa / Wali Santri'}\nUsername: ${u.username || u.email}\nKata Sandi: ${u.password || 'santri21'}\nLink Website: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedId(u.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenAddUser = () => {
    setUserForm({
      id: `usr-${Date.now()}`,
      name: '',
      username: '',
      password: 'guru21',
      email: '',
      role: 'guru',
      title: '',
      phone: '',
      teacherId: undefined,
      studentId: undefined
    });
    setEditingUser(null);
    setUserModalOpen(true);
    setUserMsg(null);
  };

  const handleOpenEditUser = (u: User) => {
    setUserForm({
      id: u.id,
      name: u.name,
      username: u.username || u.id,
      password: u.password || (u.role === 'admin' ? 'admin21' : u.role === 'guru' ? 'guru21' : 'santri21'),
      email: u.email || '',
      role: u.role,
      title: u.title || '',
      phone: u.phone || '',
      teacherId: u.teacherId,
      studentId: u.studentId
    });
    setEditingUser(u);
    setUserModalOpen(true);
    setUserMsg(null);
  };

  const handleSelectStudentForAccount = (studentId: string) => {
    const st = allStudents.find(s => s.id === studentId);
    if (!st) return;
    setUserForm(prev => ({
      ...prev,
      name: `${st.name} (${st.nickname || 'Santri'})`,
      username: st.nis,
      password: prev.password || 'santri21',
      email: st.parentEmail || `${st.nis}@santri.smpialazhar21.sch.id`,
      role: 'wali',
      title: `Wali Santri / Siswa (${st.parentName || st.name})`,
      phone: st.parentPhone || '',
      studentId: st.id,
      teacherId: undefined
    }));
  };

  const handleSelectTeacherForAccount = (teacherId: string) => {
    const tch = allTeachers.find(t => t.id === teacherId);
    if (!tch) return;
    const cleanUsername = tch.email ? tch.email.split('@')[0].toLowerCase() : `guru.${tch.nip.slice(-4)}`;
    setUserForm(prev => ({
      ...prev,
      name: tch.name,
      username: cleanUsername,
      password: prev.password || 'guru21',
      email: tch.email || `${cleanUsername}@smpialazhar21.sch.id`,
      role: 'guru',
      title: `Guru Pengampu (${tch.specialization})`,
      phone: tch.phone || '',
      teacherId: tch.id,
      studentId: undefined
    }));
  };

  const handleGenerateRandomPass = (type: Role) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    let newPass = '';
    if (type === 'admin') newPass = `admin${randomSuffix}`;
    else if (type === 'guru') newPass = `guru${randomSuffix}`;
    else newPass = `santri${randomSuffix}`;
    setUserForm(prev => ({ ...prev, password: newPass }));
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username || !userForm.password || !userForm.name) {
      setUserMsg('Nama, Username, dan Kata Sandi wajib diisi.');
      return;
    }

    const updated: User = {
      id: userForm.id || `usr-${Date.now()}`,
      name: userForm.name,
      username: userForm.username.trim().toLowerCase(),
      password: userForm.password.trim(),
      email: userForm.email || `${userForm.username.toLowerCase()}@smpialazhar21.sch.id`,
      role: userForm.role,
      avatar: editingUser?.avatar || (
        userForm.role === 'admin'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : userForm.role === 'guru'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80'
      ),
      title: userForm.title,
      phone: userForm.phone,
      teacherId: userForm.teacherId,
      studentId: userForm.studentId
    };

    storageService.saveUser(updated);
    setUsersList(storageService.getUsers());
    setUserModalOpen(false);
    onRefreshData();
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (id === 'usr-admin') {
      alert('Akun Administrator Utama tidak boleh dihapus.');
      return;
    }
    if (window.confirm(`Hapus akun pengguna "${name}"? Pengguna tidak akan dapat login lagi.`)) {
      storageService.deleteUser(id);
      setUsersList(storageService.getUsers());
      onRefreshData();
    }
  };

  const handleSyncAllAccounts = () => {
    const result = storageService.syncAllAccounts();
    setUsersList(storageService.getUsers());
    setSyncNotice(`Berhasil menyinkronkan! ${result.totalCreated} akun baru dibuat. Total ${result.totalUsers} akun siap digunakan.`);
    setTimeout(() => setSyncNotice(null), 4000);
    onRefreshData();
  };

  const handleResetData = () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh data aplikasi ke data contoh awal?')) {
      storageService.resetToInitial();
      onRefreshData();
      setUsersList(storageService.getUsers());
      setAllStudents(storageService.getStudents());
      setAllTeachers(storageService.getTeachers());
      alert('Data berhasil direset ke pengaturan awal.');
    }
  };

  const handleExportBackup = () => {
    const data = {
      students: storageService.getStudents(),
      teachers: storageService.getTeachers(),
      classes: storageService.getClasses(),
      records: storageService.getMemorizationRecords(),
      ummiRecords: storageService.getUmmiRecords(),
      targets: storageService.getTargets(),
      settings: storageService.getSettings(),
      users: storageService.getUsers(),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_tahfizh_smpia21_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Filtered Users List
  const filteredUsers = usersList.filter(u => {
    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const term = userSearchTerm.toLowerCase().trim();
    const matchSearch = !term || 
      u.name.toLowerCase().includes(term) ||
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.phone && u.phone.includes(term)) ||
      (u.title && u.title.toLowerCase().includes(term));
    return matchRole && matchSearch;
  });

  const countAdmin = usersList.filter(u => u.role === 'admin').length;
  const countGuru = usersList.filter(u => u.role === 'guru').length;
  const countSiswa = usersList.filter(u => u.role === 'wali').length;

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 rounded-xl text-[#D4AF37]">
              <Settings className="w-5 h-5" />
            </div>
            Pengaturan Sistem & Manajemen Akun
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi profil sekolah, tahun ajaran aktif, KKM, serta manajemen username dan kata sandi Guru & Siswa
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'database' ? 'bg-[#1E293B] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-[#D4AF37]" />
            Cloud Database (Multi-Device)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-[#1E293B] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
            Akun Login & Password ({usersList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition cursor-pointer ${
              activeTab === 'general' ? 'bg-[#1E293B] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profil Sekolah & KKM
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Pengaturan sistem berhasil disimpan!
        </div>
      )}

      {syncNotice && (
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-2 text-xs text-sky-800 font-semibold animate-in fade-in">
          <Sparkles className="w-4 h-4 text-sky-600" />
          {syncNotice}
        </div>
      )}

      {/* TAB 0: CLOUD DATABASE MULTI-DEVICE */}
      {activeTab === 'database' && (
        <div className="space-y-5">
          {/* Cloud Database Status Card */}
          <div className="bg-gradient-to-r from-[#1E293B] to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Cloud Database Firestore Aktif & Terhubung
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-[#D4AF37]" />
                  Sinkronisasi Realtime Seluruh Perangkat
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Semua input data siswa, setoran hafalan harian, buku induk, dan nilai yang dimasukkan oleh guru di HP maupun Laptop akan langsung tersimpan di Cloud Database Online dan sinkron secara otomatis.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  disabled={isCloudSyncing}
                  onClick={async () => {
                    setIsCloudSyncing(true);
                    setCloudStatusMsg(null);
                    const res = await storageService.initCloudSync();
                    setIsCloudSyncing(false);
                    if (res.success) {
                      setCloudStatusMsg({ type: 'success', text: res.message });
                      onRefreshData();
                      setUsersList(storageService.getUsers());
                      setAllStudents(storageService.getStudents());
                      setAllTeachers(storageService.getTeachers());
                    } else {
                      setCloudStatusMsg({ type: 'error', text: res.message });
                    }
                  }}
                  className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c49f2e] text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                  <span>{isCloudSyncing ? 'Sedang Menyinkronkan...' : 'Sinkronkan Data Cloud Sekarang'}</span>
                </button>

                <button
                  type="button"
                  disabled={isCloudSyncing}
                  onClick={async () => {
                    if (window.confirm('Unggah dan timpa seluruh data Cloud dari data yang ada di perangkat ini?')) {
                      setIsCloudSyncing(true);
                      setCloudStatusMsg(null);
                      const res = await storageService.uploadAllToCloud();
                      setIsCloudSyncing(false);
                      if (res.success) {
                        setCloudStatusMsg({ type: 'success', text: res.message });
                        onRefreshData();
                      } else {
                        setCloudStatusMsg({ type: 'error', text: res.message });
                      }
                    }
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition border border-slate-700 active:scale-95 disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4 text-sky-400" />
                  <span>Unggah Data Lokal ke Cloud</span>
                </button>
              </div>
            </div>

            {cloudStatusMsg && (
              <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
                cloudStatusMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {cloudStatusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <ShieldCheck className="w-4 h-4 text-rose-400" />}
                {cloudStatusMsg.text}
              </div>
            )}
          </div>

          {/* Cloud Info Detail */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="p-2 w-fit bg-amber-50 rounded-xl text-[#8C7015]">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Penyimpanan Terpusat</h3>
              <p className="text-slate-500 leading-relaxed">
                Data disimpan di database Google Cloud Firestore berkecepatan tinggi dengan proteksi enkripsi SSL/TLS.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="p-2 w-fit bg-emerald-50 rounded-xl text-emerald-700">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Multi-User & Multi-Device</h3>
              <p className="text-slate-500 leading-relaxed">
                Guru, Wali Santri, dan Admin dapat membuka web dari HP, tablet, atau laptop kantor mana pun dengan data yang selalu sama.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="p-2 w-fit bg-sky-50 rounded-xl text-sky-700">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Real-time Listener</h3>
              <p className="text-slate-500 leading-relaxed">
                Ketika guru memasukkan setoran santri di kelas, data langsung terupdate detik itu juga di portal wali santri dan laporan admin.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: USER ACCOUNTS & PASSWORD MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">

          {/* Stat Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div 
              onClick={() => setUserRoleFilter('all')}
              className={`p-3.5 rounded-xl border cursor-pointer transition ${
                userRoleFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Total Akun</span>
                <Users className={`w-4 h-4 ${userRoleFilter === 'all' ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
              </div>
              <p className="text-2xl font-extrabold mt-1">{usersList.length}</p>
              <p className={`text-[10px] mt-0.5 ${userRoleFilter === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>Semua hak akses</p>
            </div>

            <div 
              onClick={() => setUserRoleFilter('guru')}
              className={`p-3.5 rounded-xl border cursor-pointer transition ${
                userRoleFilter === 'guru' ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Guru Tahfizh</span>
                <GraduationCap className={`w-4 h-4 ${userRoleFilter === 'guru' ? 'text-emerald-300' : 'text-emerald-600'}`} />
              </div>
              <p className="text-2xl font-extrabold mt-1">{countGuru}</p>
              <p className={`text-[10px] mt-0.5 ${userRoleFilter === 'guru' ? 'text-emerald-200' : 'text-slate-400'}`}>Pengampu Halaqah</p>
            </div>

            <div 
              onClick={() => setUserRoleFilter('wali')}
              className={`p-3.5 rounded-xl border cursor-pointer transition ${
                userRoleFilter === 'wali' ? 'bg-amber-800 text-white border-amber-800' : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Siswa / Wali</span>
                <UserCheck className={`w-4 h-4 ${userRoleFilter === 'wali' ? 'text-amber-300' : 'text-amber-600'}`} />
              </div>
              <p className="text-2xl font-extrabold mt-1">{countSiswa}</p>
              <p className={`text-[10px] mt-0.5 ${userRoleFilter === 'wali' ? 'text-amber-200' : 'text-slate-400'}`}>Portal Pantauan</p>
            </div>

            <div 
              onClick={() => setUserRoleFilter('admin')}
              className={`p-3.5 rounded-xl border cursor-pointer transition ${
                userRoleFilter === 'admin' ? 'bg-purple-900 text-white border-purple-900' : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Administrator</span>
                <ShieldCheck className={`w-4 h-4 ${userRoleFilter === 'admin' ? 'text-purple-300' : 'text-purple-600'}`} />
              </div>
              <p className="text-2xl font-extrabold mt-1">{countAdmin}</p>
              <p className={`text-[10px] mt-0.5 ${userRoleFilter === 'admin' ? 'text-purple-200' : 'text-slate-400'}`}>Akses Penuh</p>
            </div>
          </div>

          {/* Action and Search Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan nama, NIS, username, atau email..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSyncAllAccounts}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer border border-slate-200"
                title="Buat akun otomatis untuk semua guru dan siswa yang belum terdaftar"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>Otomatis Buat Akun Guru & Siswa</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAddUser}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>Tambah Akun Baru</span>
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Nama & Profil Pengguna</th>
                    <th className="p-3.5">Hak Akses (Role)</th>
                    <th className="p-3.5">Username Login</th>
                    <th className="p-3.5">Kata Sandi (Password)</th>
                    <th className="p-3.5 text-center">Salin Akun</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Tidak ada akun yang sesuai dengan pencarian atau filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isPassVisible = !!visiblePasswords[u.id];
                      const plainPass = u.password || (
                        u.role === 'admin' ? 'admin21' : u.role === 'guru' ? 'guru21' : 'santri21'
                      );

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition">
                          
                          {/* Name & Avatar */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <p className="font-bold text-slate-900">{u.name}</p>
                                <p className="text-[11px] text-slate-400 line-clamp-1">
                                  {u.title || u.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="p-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'admin'
                                ? 'bg-slate-900 text-[#D4AF37]'
                                : u.role === 'guru'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {u.role === 'admin' ? 'Admin' : u.role === 'guru' ? 'Guru' : 'Siswa / Wali'}
                            </span>
                          </td>

                          {/* Username */}
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                              {u.username || u.email.split('@')[0]}
                            </span>
                          </td>

                          {/* Password */}
                          <td className="p-3.5">
                            <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                              <span className="font-mono font-bold text-slate-700 select-all">
                                {isPassVisible ? plainPass : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleVisiblePassword(u.id)}
                                className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-0.5"
                                title={isPassVisible ? "Sembunyikan Kata Sandi" : "Lihat Kata Sandi"}
                              >
                                {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>

                          {/* Copy Credential for WA */}
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleCopyCredentials(u)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                                copiedId === u.id
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              }`}
                              title="Salin username & kata sandi untuk dikirim ke WhatsApp guru atau orang tua"
                            >
                              {copiedId === u.id ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-500" />
                                  <span>Salin</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer flex items-center gap-1 border border-slate-200"
                                title="Ubah Password & Edit Akun"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-700" />
                                <span className="text-[11px] font-bold">Ubah Sandi</span>
                              </button>
                              {u.id !== 'usr-admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer border border-transparent hover:border-red-200"
                                  title="Hapus Akun"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: GENERAL SETTINGS */}
      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* School Profile */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-bold text-slate-800 text-sm">Identitas Sekolah / Lembaga</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Sekolah</label>
                <input
                  type="text"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kepala Sekolah</label>
                <input
                  type="text"
                  value={formData.principalName}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Koordinator Program Tahfizh</label>
                <input
                  type="text"
                  value={formData.tahfizhCoordinator}
                  onChange={(e) => setFormData({ ...formData, tahfizhCoordinator: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Academic Year */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-bold text-slate-800 text-sm">Periode & Tahun Akademik Aktif</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  placeholder="2026/2027"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Semester Aktif</label>
                <select
                  value={formData.activeSemester}
                  onChange={(e) => setFormData({ ...formData, activeSemester: e.target.value as 'Ganjil' | 'Genap' })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>
            </div>
          </div>

          {/* Standards & Targets */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-bold text-slate-800 text-sm">Standar Penilaian & Target KKM</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nilai KKM Minimal Kelulusan (Skala 100)</label>
                <input
                  type="number"
                  value={formData.minScoreKKM}
                  onChange={(e) => setFormData({ ...formData, minScoreKKM: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Nilai di bawah ini akan ditandai sebagai Perlu Bimbingan.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Minimal Hafalan per Tahun (Juz)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.defaultTargetJuz}
                  onChange={(e) => setFormData({ ...formData, defaultTargetJuz: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Standar target default bagi santri baru.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#D4AF37]" />
              <span>Simpan Perubahan Pengaturan</span>
            </button>
          </div>
        </form>
      )}

      {/* MODAL: ADD / EDIT USER & PASSWORD */}
      {userModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#1E293B] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-bold text-sm">
                  {editingUser ? `Ubah Password & Akun: ${editingUser.name}` : 'Tambah Akun Pengguna Baru'}
                </h3>
              </div>
              <button
                onClick={() => setUserModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4 text-xs">
              {userMsg && (
                <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium">
                  {userMsg}
                </div>
              )}

              {/* Role Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Peran / Hak Akses</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUserForm({ ...userForm, role: 'guru' })}
                    className={`py-2 px-3 rounded-lg font-bold border text-center transition cursor-pointer ${
                      userForm.role === 'guru'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Guru Tahfizh
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserForm({ ...userForm, role: 'wali' })}
                    className={`py-2 px-3 rounded-lg font-bold border text-center transition cursor-pointer ${
                      userForm.role === 'wali'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-500'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Siswa / Wali
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserForm({ ...userForm, role: 'admin' })}
                    className={`py-2 px-3 rounded-lg font-bold border text-center transition cursor-pointer ${
                      userForm.role === 'admin'
                        ? 'bg-slate-900 border-slate-900 text-[#D4AF37]'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Quick Link from Existing Teacher/Student if creating */}
              {!editingUser && userForm.role === 'guru' && (
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-1.5">
                  <label className="block font-bold text-emerald-900">Pilih dari Daftar Guru yang Ada (Opsional):</label>
                  <select
                    onChange={(e) => handleSelectTeacherForAccount(e.target.value)}
                    className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Pilih guru untuk mengisi otomatis data --</option>
                    {allTeachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (NIP: {t.nip})</option>
                    ))}
                  </select>
                </div>
              )}

              {!editingUser && userForm.role === 'wali' && (
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 space-y-1.5">
                  <label className="block font-bold text-amber-900">Pilih dari Daftar Santri yang Ada (Opsional):</label>
                  <select
                    onChange={(e) => handleSelectStudentForAccount(e.target.value)}
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Pilih santri untuk mengisi NIS dan data login --</option>
                    {allStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (NIS: {s.nis})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Pengguna</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Contoh: Ustadz M. Ridwan, S.Pd.I."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>

              {/* Username & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {userForm.role === 'wali' ? 'Username / NIS Login' : 'Username Login'}
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder={userForm.role === 'wali' ? 'Contoh: 2607001' : 'Contoh: ridwan'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800">
                    Kata Sandi (Password) Akun
                  </label>
                  <button
                    type="button"
                    onClick={() => handleGenerateRandomPass(userForm.role)}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline decoration-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    Buat Sandi Acak
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Masukkan kata sandi baru"
                    className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title={showPass ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  * Sandi ini digunakan oleh pengguna untuk login ke sistem Tahfizh SMPIA 21.
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const text = `*AKUN LOGIN TAHFIZH SMPI AL AZHAR 21*\nNama: ${userForm.name}\nUsername / NIS: ${userForm.username}\nKata Sandi: ${userForm.password}\nLink Website: ${window.location.origin}`;
                    navigator.clipboard.writeText(text);
                    alert('Format pesan WhatsApp login berhasil disalin!');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Salin format WA</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUserModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1E293B] hover:bg-slate-800 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Simpan Akun
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backup & Danger Zone */}
      {userRole === 'admin' && activeTab === 'general' && (
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-xs">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            Cadangan Data & Reset Sistem
          </h4>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900">Backup Seluruh Database</p>
              <p className="text-slate-500 text-[11px]">Unduh file JSON berisi semua data siswa, guru, setoran, dan rekap.</p>
            </div>
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-[#D4AF37]" />
              <span>Unduh Backup JSON</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-red-700">Reset ke Data Awal (Demo Reset)</p>
              <p className="text-slate-500 text-[11px]">Kembalikan semua tabel ke kondisi data awal simulasi.</p>
            </div>
            <button
              type="button"
              onClick={handleResetData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Data Aplikasi</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
