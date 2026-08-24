import React, { useState } from 'react';
import { 
  ShieldCheck, 
  GraduationCap, 
  HeartHandshake, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { Role, UserProfile } from '../types';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
  onClose?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<Role>('guru');
  const [username, setUsername] = useState('ustadz.fauzan@smpia21.sch.id');
  const [password, setPassword] = useState('••••••••');

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    if (role === 'admin') {
      setUsername('admin.tahfizh@smpia21.sch.id');
    } else if (role === 'guru') {
      setUsername('ustadz.fauzan@smpia21.sch.id');
    } else {
      setUsername('wali.fatih@gmail.com');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let user: UserProfile;
    if (selectedRole === 'admin') {
      user = {
        id: 'usr-admin',
        name: 'Ustadz Ahmad Fauzan, Lc., M.Ag.',
        email: username,
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        title: 'Koordinator Tahfizh & Admin Sistem'
      };
    } else if (selectedRole === 'guru') {
      user = {
        id: 'usr-guru',
        name: 'Ustadzah Siti Maryam, S.Pd.I.',
        email: username,
        role: 'guru',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        title: 'Guru Pengampu Halaqah Tahfizh'
      };
    } else {
      user = {
        id: 'usr-wali',
        name: 'Bpk. H. Iskandar Zulkarnain',
        email: username,
        role: 'wali',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        title: 'Orang Tua / Wali Santri'
      };
    }

    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4">
      
      <div className="w-full max-w-md bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-[#1E293B] p-6 text-center text-white relative">
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37] text-slate-900 flex items-center justify-center mx-auto shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold mt-3 tracking-tight">
            TAHFIZH SMPIA21
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Sistem Monitoring Tahfizh Al-Qur'an & Metode Ummi
          </p>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Role Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Pilih Role Akses Masuk:</label>
            <div className="grid grid-cols-3 gap-2">
              
              {/* Admin */}
              <button
                type="button"
                onClick={() => handleSelectRole('admin')}
                className={`p-2.5 rounded-lg border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedRole === 'admin'
                    ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-semibold">Admin</span>
              </button>

              {/* Guru */}
              <button
                type="button"
                onClick={() => handleSelectRole('guru')}
                className={`p-2.5 rounded-lg border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedRole === 'guru'
                    ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span className="text-xs font-semibold">Guru</span>
              </button>

              {/* Wali Santri */}
              <button
                type="button"
                onClick={() => handleSelectRole('wali')}
                className={`p-2.5 rounded-lg border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedRole === 'wali'
                    ? 'bg-[#1E293B] text-white border-[#1E293B] shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <HeartHandshake className="w-4 h-4" />
                <span className="text-xs font-semibold">Wali Santri</span>
              </button>

            </div>
          </div>

          {/* Role Explanatory Card */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
            {selectedRole === 'admin' && (
              <p>🔐 <strong>Hak Akses Admin:</strong> Kelola seluruh guru, santri, rombel kelas, target hafalan, import data CSV, dan pengaturan sekolah.</p>
            )}
            {selectedRole === 'guru' && (
              <p>📖 <strong>Hak Akses Guru:</strong> Catat setoran hafalan harian, evaluasi jilid Metode Ummi, nilai tajwid, dan input catatan perkembangan.</p>
            )}
            {selectedRole === 'wali' && (
              <p>🌟 <strong>Hak Akses Wali Santri:</strong> Pantau live mutaba'ah hafalan putra/putri, kenaikan jilid Ummi, dan hubungi guru via WhatsApp.</p>
            )}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email / Akun Pengguna</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kata Sandi</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Masuk sebagai {selectedRole === 'admin' ? 'Administrator' : selectedRole === 'guru' ? 'Guru Tahfizh' : 'Wali Santri'}</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </form>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center text-[11px] text-slate-400">
          SMP Islam Al Azhar 21 • Aplikasi Tahfizh & Metode Ummi v2.6
        </div>

      </div>

    </div>
  );
};
