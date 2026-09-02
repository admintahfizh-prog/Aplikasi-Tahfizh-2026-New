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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await storageService.authenticateAsync(username, password);
      setIsLoading(false);

      if (result.success && result.user) {
        onLogin(result.user);
      } else {
        setErrorMessage(result.message || 'Username atau kata sandi tidak valid.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Terjadi kesalahan saat masuk.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header with Brand */}
        <div className="bg-[#1E293B] p-6 text-center text-white relative">
          {storageService.getSettings()?.customLogoUrl && (
            <div className="flex justify-center mb-3">
              <div className="p-1.5 bg-white rounded-xl shadow-md inline-block">
                <img
                  src={storageService.getSettings()?.customLogoUrl}
                  alt="Logo Sekolah"
                  className="w-16 h-16 object-contain rounded-lg"
                />
              </div>
            </div>
          )}

          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
            TAHFIZH SMPIA 21
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Sistem Monitoring Tahfizh Al-Qur'an & Metode Ummi
          </p>
          <p className="text-[11px] text-[#D4AF37] font-semibold mt-0.5">
            {storageService.getSettings()?.schoolName || 'SMP Islam Al Azhar 21'}
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

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 text-center text-[11px] text-slate-500 font-medium">
          SMP Islam Al Azhar 21 • Aplikasi Tahfizh & Metode Ummi
        </div>

      </div>
    </div>
  );
};
