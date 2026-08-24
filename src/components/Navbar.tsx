import React, { useState } from 'react';
import { 
  BookOpen, 
  Bell, 
  Plus, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  GraduationCap, 
  Users, 
  CheckCheck,
  Sparkles,
  ChevronDown,
  Search
} from 'lucide-react';
import { User, NotificationItem } from '../types';

interface NavbarProps {
  currentUser: User;
  onRoleChange?: (role: any) => void;
  onSwitchUser?: (user: User) => void;
  allUsers?: User[];
  onOpenDailyInput: () => void;
  notifications?: NotificationItem[];
  onMarkNotificationsRead?: () => void;
  onLogout: () => void;
  onOpenSettings?: () => void;
  schoolName?: string;
  activeView?: string;
  setActiveView?: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onRoleChange,
  onSwitchUser,
  allUsers = [],
  onOpenDailyInput,
  notifications = [],
  onMarkNotificationsRead,
  onLogout,
  onOpenSettings,
  schoolName = 'SMP Islam Al Azhar 21',
  activeView,
  setActiveView
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#1E293B] text-[#D4AF37] border border-[#D4AF37]/40">
            <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
            ADMIN
          </span>
        );
      case 'guru':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <GraduationCap className="w-3 h-3 text-emerald-600" />
            GURU TAHFIZH
          </span>
        );
      case 'wali':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Users className="w-3 h-3 text-amber-600" />
            WALI SANTRI
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white text-slate-800 shadow-xs border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand Header */}
          <div 
            className="flex items-center space-x-3 cursor-pointer" 
            onClick={() => setActiveView && setActiveView(currentUser.role === 'wali' ? 'parent-portal' : 'dashboard')}
          >
            <div className="w-9 h-9 rounded bg-[#D4AF37] flex items-center justify-center font-black text-[#1E293B] text-lg shadow-sm">
              T
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-base sm:text-lg text-slate-800 font-sans">
                  TAHFIZH SMPIA21
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#D4AF37]/15 text-[#8C7015] rounded border border-[#D4AF37]/30">
                  {currentUser.role === 'admin' ? 'Admin Portal' : currentUser.role === 'guru' ? 'Guru Portal' : 'Wali Portal'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden md:block">
                {schoolName} • Monitoring Tahfizh & Metode Ummi
              </p>
            </div>
          </div>

          {/* Center Info Badge (T.A. 2026/2027) */}
          <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-[11px]">T.A. 2026/2027 • Semester Ganjil</span>
          </div>

          {/* Right Actions Toolbar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Quick Daily Input Button */}
            {currentUser.role !== 'wali' && (
              <button
                id="btn-quick-setoran"
                onClick={onOpenDailyInput}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs transition shadow-sm active:scale-95 cursor-pointer"
                title="Input Setoran Hafalan / Ummi"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span className="hidden xs:inline">Setoran Baru</span>
              </button>
            )}

            {/* Quick Role Switcher */}
            <div className="relative">
              <button
                id="btn-role-switcher"
                onClick={() => {
                  setShowRoleMenu(!showRoleMenu);
                  setShowNotifMenu(false);
                  setShowUserMenu(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-200 transition cursor-pointer"
                title="Ganti Role Demo"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="hidden sm:inline font-medium text-slate-500">Role:</span>
                <span className="font-bold text-slate-800 uppercase">{currentUser.role}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl py-2 z-50 text-slate-800 border border-slate-200 animate-in fade-in">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pilih Role Akses Demo</p>
                  </div>
                  
                  {/* Admin Option */}
                  <button
                    onClick={() => {
                      if (onRoleChange) onRoleChange('admin');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                      currentUser.role === 'admin' ? 'bg-amber-50/70 font-bold' : ''
                    }`}
                  >
                    <span className="text-xs">Administrator</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#1E293B] text-[#D4AF37] font-bold">Admin</span>
                  </button>

                  {/* Guru Option */}
                  <button
                    onClick={() => {
                      if (onRoleChange) onRoleChange('guru');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                      currentUser.role === 'guru' ? 'bg-amber-50/70 font-bold' : ''
                    }`}
                  >
                    <span className="text-xs">Guru Tahfizh</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Guru</span>
                  </button>

                  {/* Wali Option */}
                  <button
                    onClick={() => {
                      if (onRoleChange) onRoleChange('wali');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                      currentUser.role === 'wali' ? 'bg-amber-50/70 font-bold' : ''
                    }`}
                  >
                    <span className="text-xs">Wali Santri</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">Wali</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                id="btn-notifications"
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  setShowRoleMenu(false);
                  setShowUserMenu(false);
                }}
                className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                title="Notifikasi"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl z-50 text-slate-800 border border-slate-200 overflow-hidden animate-in fade-in">
                  <div className="px-4 py-2.5 bg-[#1E293B] text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="text-xs font-bold">Notifikasi & Aktivitas</span>
                    </div>
                    {unreadCount > 0 && onMarkNotificationsRead && (
                      <button
                        onClick={onMarkNotificationsRead}
                        className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3 h-3" /> Tandai Dibaca
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        Tidak ada notifikasi baru.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 hover:bg-slate-50 transition text-xs ${!n.read ? 'bg-[#D4AF37]/5' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-slate-800">{n.title}</span>
                            <span className="text-[10px] text-slate-400">{n.date}</span>
                          </div>
                          <p className="text-slate-600 mt-0.5 text-[11px]">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current User Avatar & Profile */}
            <div className="relative">
              <button
                id="btn-user-profile"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowRoleMenu(false);
                  setShowNotifMenu(false);
                }}
                className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-lg hover:bg-slate-100 transition cursor-pointer border border-slate-200"
              >
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{currentUser.name}</p>
                  <p className="text-[10px] text-[#8C7015] font-semibold uppercase">{currentUser.role}</p>
                </div>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border-2 border-[#D4AF37]"
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-50 text-slate-800 border border-slate-200 animate-in fade-in">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <div className="mt-1">{getRoleBadge(currentUser.role)}</div>
                  </div>

                  {onOpenSettings && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSettings();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      Pengaturan
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    Keluar Akun
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};

