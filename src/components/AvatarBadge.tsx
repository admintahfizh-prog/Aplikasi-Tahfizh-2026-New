import React, { useRef, useState } from 'react';
import { Camera, User as UserIcon, Loader2, Trash2 } from 'lucide-react';
import { fileToCompressedBase64, getInitials } from '../utils/imageUtils';

interface AvatarBadgeProps {
  name: string;
  photoUrl?: string;
  role?: 'admin' | 'guru' | 'wali' | 'santri' | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  editable?: boolean;
  onPhotoChange?: (newPhotoBase64: string) => void | Promise<void>;
  onPhotoRemove?: () => void | Promise<void>;
  id?: string;
}

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  name,
  photoUrl,
  role = 'santri',
  size = 'md',
  className = '',
  editable = false,
  onPhotoChange,
  onPhotoRemove,
  id
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Size mappings
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-bold',
    xl: 'w-20 h-20 text-xl font-bold',
    '2xl': 'w-24 h-24 text-2xl font-bold'
  };

  // Role color background for default empty avatars
  const getRoleBg = () => {
    switch (role) {
      case 'admin':
        return 'bg-slate-900 text-[#D4AF37] border-slate-700';
      case 'guru':
        return 'bg-emerald-800 text-emerald-100 border-emerald-600';
      case 'wali':
      case 'santri':
      default:
        return 'bg-[#1E293B] text-amber-200 border-slate-600';
    }
  };

  const hasPhoto = Boolean(photoUrl && photoUrl.trim() !== '' && !imageError);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (JPG, PNG, atau WEBP).');
      return;
    }

    // Check size < 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file gambar maksimal 10MB.');
      return;
    }

    try {
      setIsUploading(true);
      const base64 = await fileToCompressedBase64(file, 400, 400, 0.85);
      setImageError(false);
      if (onPhotoChange) {
        await onPhotoChange(base64);
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      alert('Gagal memproses gambar foto.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`relative inline-block select-none ${className}`} id={id}>
      <div
        className={`${sizeClasses[size]} rounded-xl overflow-hidden border-2 flex items-center justify-center font-bold shrink-0 shadow-xs relative transition ${
          hasPhoto ? 'border-[#D4AF37] bg-slate-100' : getRoleBg()
        }`}
      >
        {hasPhoto ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="tracking-wider uppercase">{getInitials(name)}</span>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center text-white">
            <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
          </div>
        )}
      </div>

      {/* Editable Camera Overlay Button */}
      {editable && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
          />
          <div className="absolute -bottom-1.5 -right-1.5 flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Unggah / Ganti Foto"
              className="p-1.5 bg-[#1E293B] hover:bg-slate-800 text-[#D4AF37] hover:text-white rounded-full border-2 border-white shadow-md transition cursor-pointer active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            {hasPhoto && onPhotoRemove && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Hapus foto profil dan gunakan avatar default?')) {
                    setImageError(false);
                    await onPhotoRemove();
                  }
                }}
                disabled={isUploading}
                title="Hapus Foto"
                className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full border-2 border-white shadow-md transition cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
