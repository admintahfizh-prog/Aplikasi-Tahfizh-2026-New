import React from 'react';
import { storageService } from '../services/storageService';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  customLogoUrl?: string;
}

export const LogoAlAzhar: React.FC<LogoProps> = ({ 
  className = "", 
  size = 48,
  showText = false,
  customLogoUrl
}) => {
  // If customLogoUrl not provided in props, try getting from storage settings
  const logoSrc = customLogoUrl !== undefined 
    ? customLogoUrl 
    : (storageService.getSettings()?.customLogoUrl || '');

  if (!logoSrc) {
    if (showText) {
      return (
        <div className={`inline-flex flex-col ${className}`}>
          <span className="font-extrabold tracking-tight text-slate-800 leading-tight">
            SMPI AL AZHAR 21
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Tahfizh & Metode Ummi
          </span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={logoSrc}
        alt="Logo Sekolah"
        width={size}
        height={size}
        className="shrink-0 select-none object-contain rounded-lg drop-shadow-xs"
        style={{ width: size, height: size }}
      />

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold tracking-tight text-slate-800 leading-tight">
            SMPI AL AZHAR 21
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Tahfizh & Metode Ummi
          </span>
        </div>
      )}
    </div>
  );
};

