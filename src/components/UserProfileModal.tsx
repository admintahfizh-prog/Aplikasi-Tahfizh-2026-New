import React, { useState, useRef } from 'react';
import { 
  User as UserIcon, 
  X, 
  Camera, 
  Save, 
  KeyRound, 
  Phone, 
  Mail, 
  ShieldCheck, 
  GraduationCap, 
  Sparkles,
  CheckCircle2,
  Trash2,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { User, Student, Teacher } from '../types';
import { storageService } from '../services/storageService';
import { AvatarBadge } from './AvatarBadge';
import { fileToCompressedBase64 } from '../utils/imageUtils';

interface UserProfileModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdateUser
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [title, setTitle] = useState(currentUser.title || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [password, setPassword] = useState(currentUser.password || '');
  const [showPassword, setShowPassword] = useState(false);
  
  // If user is a student or wali, get student info
  const linkedStudent: Student | undefined = currentUser.studentId
    ? storageService.getStudentById(currentUser.studentId)
    : undefined;

  // If user is a teacher, get teacher info
  const linkedTeacher: Teacher | undefined = currentUser.teacherId
    ? storageService.getTeachers().find(t => t.id === currentUser.teacherId)
    : undefined;

  const [studentPhoto, setStudentPhoto] = useState(linkedStudent?.photo || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'user' | 'student') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Format file harus berupa gambar (JPG, PNG, WEBP).');
      return;
    }

    try {
      const base64 = await fileToCompressedBase64(file, 400, 400, 0.85);
      if (target === 'user') {
        setAvatar(base64);
      } else {
        setStudentPhoto(base64);
        setAvatar(base64); // also sync to user avatar
      }
    } catch (err) {
      console.error('Upload photo error:', err);
      alert('Gagal memproses foto.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Update user profile
      const updatedUser: User = {
        ...currentUser,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        title: title.trim(),
        avatar: avatar,
        password: password.trim()
      };

      storageService.saveUser(updatedUser);
      storageService.setCurrentUser(updatedUser);

      // 2. If user is linked to teacher, also update teacher photo & details
      if (currentUser.teacherId && linkedTeacher) {
        const updatedTeacher: Teacher = {
          ...linkedTeacher,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          photo: avatar
        };
        storageService.saveTeacher(updatedTeacher);
      }

      // 3. If user is linked to student, also update student photo & details
      if (currentUser.studentId && linkedStudent) {
        const updatedStudent: Student = {
          ...linkedStudent,
          photo: studentPhoto || avatar,
          parentPhone: phone.trim() || linkedStudent.parentPhone,
          parentEmail: email.trim() || linkedStudent.parentEmail
        };
        storageService.saveStudent(updatedStudent);
      }

      onUpdateUser(updatedUser);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Gagal menyimpan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-[#1E293B] p-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37]">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Profil & Foto Pengguna</h3>
              <p className="text-xs text-slate-400">
                Kelola informasi akun, kata sandi, dan foto profil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profil dan foto berhasil diperbarui & disinkronkan ke database!</span>
            </div>
          )}

          {/* Photo Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <AvatarBadge
                name={name || currentUser.name}
                photoUrl={avatar}
                role={currentUser.role}
                size="2xl"
                editable={false}
              />
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  {currentUser.role === 'guru' ? 'Foto Ustadz / Ustadzah' : currentUser.role === 'wali' ? 'Foto Profil Santri / Akun' : 'Foto Administrator'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Format JPG, PNG, atau WEBP (Maks. 5MB). Otomatis dioptimalkan.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handlePhotoUpload(e, 'user')}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{avatar ? 'Ganti Foto' : 'Unggah Foto'}</span>
                </button>

                {avatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatar('');
                      if (linkedStudent) setStudentPhoto('');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-red-50 hover:text-red-700 text-slate-700 font-semibold text-xs transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Foto</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Child Photo Section if Wali / Santri */}
          {linkedStudent && currentUser.role === 'wali' && (
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AvatarBadge
                  name={linkedStudent.name}
                  photoUrl={studentPhoto || avatar}
                  role="santri"
                  size="lg"
                  editable={false}
                />
                <div>
                  <p className="font-bold text-slate-900 text-xs">{linkedStudent.name}</p>
                  <p className="text-[11px] text-amber-900 font-medium">NIS: {linkedStudent.nis} • Santri Ananda</p>
                </div>
              </div>
              <label className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 shadow-xs transition">
                <Camera className="w-3.5 h-3.5" />
                <span>Foto Ananda</span>
                <input
                  type="file"
                  onChange={(e) => handlePhotoUpload(e, 'student')}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Kata Sandi (Password Login)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-lg font-bold font-mono focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white font-bold transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#D4AF37]" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Profil'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
