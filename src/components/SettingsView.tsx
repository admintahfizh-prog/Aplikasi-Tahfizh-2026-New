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
  EyeOff
} from 'lucide-react';
import { AppSettings, Role, User } from '../types';
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
  const [activeTab, setActiveTab] = useState<'general' | 'users'>('general');
  
  // User Management state
  const [usersList, setUsersList] = useState<User[]>(() => storageService.getUsers());
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
  }>({
    id: '',
    name: '',
    username: '',
    password: '',
    email: '',
    role: 'guru',
    title: '',
    phone: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [userMsg, setUserMsg] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onRefreshData();
  };

  const handleOpenAddUser = () => {
    setUserForm({
      id: `usr-${Date.now()}`,
      name: '',
      username: '',
      password: '',
      email: '',
      role: 'guru',
      title: '',
      phone: ''
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
      password: u.password || '',
      email: u.email,
      role: u.role,
      title: u.title || '',
      phone: u.phone || ''
    });
    setEditingUser(u);
    setUserModalOpen(true);
    setUserMsg(null);
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
      avatar: editingUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: userForm.title,
      phone: userForm.phone
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
    if (window.confirm(`Hapus akun pengguna "${name}"?`)) {
      storageService.deleteUser(id);
      setUsersList(storageService.getUsers());
      onRefreshData();
    }
  };

  const handleResetData = () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh data aplikasi ke data contoh awal?')) {
      storageService.resetToInitial();
      onRefreshData();
      setUsersList(storageService.getUsers());
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

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#D4AF37]" />
            Pengaturan Sistem & Manajemen Akun
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi profil sekolah, tahun ajaran aktif, KKM penilaian, dan akun login pengguna
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              activeTab === 'general' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Profil Sekolah & KKM
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-[#1E293B] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
            Akun Login & Password
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Pengaturan sistem berhasil disimpan!
        </div>
      )}

      {/* TAB 1: GENERAL SETTINGS */}
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

      {/* TAB 2: USER ACCOUNTS & PASSWORD MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                Daftar Akun & Kata Sandi Login Pengguna
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola username, kata sandi, dan hak akses untuk seluruh Admin, Guru Tahfizh, dan Wali Santri.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddUser}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              Tambah Akun Baru
            </button>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Nama & Profil</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Username Login</th>
                    <th className="p-3.5">Kata Sandi</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-800">{u.name}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-[#1E293B] text-[#D4AF37]'
                            : u.role === 'guru'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-800">
                        {u.username || u.email.split('@')[0]}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        <span className="bg-slate-100 px-2 py-1 rounded text-[11px] border border-slate-200 font-semibold">
                          {u.password || 'admin21'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Edit Username & Sandi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {u.id !== 'usr-admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT USER */}
      {userModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#1E293B] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-bold text-sm">
                  {editingUser ? 'Edit Akun & Reset Sandi' : 'Tambah Akun Pengguna Baru'}
                </h3>
              </div>
              <button
                onClick={() => setUserModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-3.5 text-xs">
              {userMsg && (
                <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium">
                  {userMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Contoh: Ustadz M. Ridwan, S.Pd.I."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Akses</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as Role })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    <option value="admin">Administrator</option>
                    <option value="guru">Guru Tahfizh</option>
                    <option value="wali">Wali Santri</option>
                  </select>
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">Username Login</label>
                <input
                  type="text"
                  required
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="Contoh: ridwan / guru.ridwan"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi Baru</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Masukkan kata sandi"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
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
