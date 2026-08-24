import React, { useState } from 'react';
import { 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { UserProfile } from '../types';
import { storageService } from '../services/storageService';
import { LogoAlAzhar } from './LogoAlAzhar';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
  onClose?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin21');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAccountGuide, setShowAccountGuide] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = storageService.authenticate(username, password);
      setIsLoading(false);

      if (result.success && result.user) {
        onLogin(result.user);
      } else {
        setErrorMessage(result.message || 'Username atau kata sandi tidak valid.');
      }
    }, 250);
  };

  const handleFillDemo = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header with Al Azhar 21 Emblem */}
        <div className="bg-[#1E293B] p-6 text-center text-white relative">
          <div className="flex justify-center mb-3">
            <div className="p-1.5 bg-white rounded-full shadow-md inline-block">
              <LogoAlAzhar size={72} />
            </div>
          </div>

          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
            TAHFIZH SMPIA 21
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Sistem Monitoring Tahfizh Al-Qur'an & Metode Ummi
          </p>
          <p className="text-[11px] text-[#D4AF37] font-semibold mt-0.5">
            SMP Islam Al Azhar 21
          </p>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Security Notice */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Silakan masuk menggunakan <strong>Username</strong> dan <strong>Kata Sandi</strong> resmi yang telah diberikan oleh Administrator.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Direct Credential Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Username / Email Akun
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Contoh: admin, fauzan, maryam, dll."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Masukkan kata sandi akun"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#1E293B] hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-70"
            >
              {isLoading ? (
                <span>Memverifikasi akun...</span>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </>
              )}
            </button>
          </form>

          {/* Collapsible Helper for Default System Credentials */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => setShowAccountGuide(!showAccountGuide)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-4 cursor-pointer"
            >
              {showAccountGuide ? 'Sembunyikan Info Akun Bawaan' : 'Lihat Akun & Kata Sandi Bawaan Sistem'}
            </button>

            {showAccountGuide && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-[11px] space-y-2 animate-in fade-in">
                <p className="font-bold text-slate-700">Daftar Akun Bawaan Terdaftar:</p>
                <div className="grid grid-cols-1 gap-1.5 font-mono">
                  <div 
                    onClick={() => handleFillDemo('admin', 'admin21')}
                    className="p-1.5 bg-white rounded border border-slate-200 flex justify-between items-center cursor-pointer hover:border-[#D4AF37] transition"
                  >
                    <span><strong>Admin:</strong> admin</span>
                    <span className="text-slate-500 font-sans text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">Pass: admin21</span>
                  </div>
                  <div 
                    onClick={() => handleFillDemo('fauzan', 'fauzan21')}
                    className="p-1.5 bg-white rounded border border-slate-200 flex justify-between items-center cursor-pointer hover:border-[#D4AF37] transition"
                  >
                    <span><strong>Guru:</strong> fauzan</span>
                    <span className="text-slate-500 font-sans text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">Pass: fauzan21</span>
                  </div>
                  <div 
                    onClick={() => handleFillDemo('wali.rayhan', 'wali21')}
                    className="p-1.5 bg-white rounded border border-slate-200 flex justify-between items-center cursor-pointer hover:border-[#D4AF37] transition"
                  >
                    <span><strong>Wali:</strong> wali.rayhan</span>
                    <span className="text-slate-500 font-sans text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">Pass: wali21</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-sans">
                  * Klik salah satu baris di atas untuk otomatis mengisi form. Admin dapat mengubah kata sandi di menu Pengaturan.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 text-center text-[11px] text-slate-500 font-medium">
          SMP Islam Al Azhar 21 • Aplikasi Tahfizh & Metode Ummi
        </div>

      </div>
    </div>
  );
};
