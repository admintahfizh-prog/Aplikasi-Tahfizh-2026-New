import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  GraduationCap, 
  Users, 
  BookOpen, 
  BookMarked, 
  FileText, 
  Star, 
  Target, 
  BarChart3, 
  Settings, 
  School,
  HeartHandshake,
  ShieldAlert,
  Sparkles,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Award,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Role, User, Teacher } from '../types';
import { AvatarBadge } from './AvatarBadge';

interface SidebarProps {
  activeView?: string;
  setActiveView?: (view: string) => void;
  currentView?: string;
  onViewChange?: (view: string) => void;
  userRole?: Role;
  currentUser?: User;
  currentTeacher?: Teacher;
  onOpenDailyInput?: () => void;
  onOpenProfile?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItemConfig {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  children?: { id: string; label: string }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  currentView,
  onViewChange,
  userRole = 'admin',
  currentUser,
  currentTeacher,
  onOpenDailyInput,
  onOpenProfile,
  isOpen = true,
  onToggle,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const current = activeView || currentView || 'dashboard';
  const isExamViewActive =
    current === 'ujian' ||
    current === 'ujian-kenaikan-jilid' ||
    current === 'ujian-munaqosyah' ||
    current === 'ujian-juziyyah';

  const [isExamDropdownOpen, setIsExamDropdownOpen] = React.useState<boolean>(() => isExamViewActive);

  React.useEffect(() => {
    if (isExamViewActive) {
      setIsExamDropdownOpen(true);
    }
  }, [isExamViewActive]);

  const handleSelectView = (view: string) => {
    if (setActiveView) setActiveView(view);
    if (onViewChange) onViewChange(view);
    if (onCloseMobile) onCloseMobile();
  };

  const examSubItems = [
    { id: 'ujian-kenaikan-jilid', label: 'Ujian Kenaikan Jilid UMMI' },
    { id: 'ujian-munaqosyah', label: 'Ujian Munaqosyah' },
    { id: 'ujian-juziyyah', label: 'Ujian Juziyyah' }
  ];

  const getNavItems = (): NavItemConfig[] => {
    if (userRole === 'wali') {
      return [
        { id: 'parent-portal', label: 'Dashboard Ananda', icon: HeartHandshake },
        { id: 'hafalan', label: 'Riwayat Hafalan', icon: BookOpen },
        { id: 'ummi', label: 'Perkembangan Ummi', icon: BookMarked },
        { id: 'ujian', label: 'Ujian & Undangan', icon: Award, children: examSubItems },
        { id: 'matrikulasi', label: 'Matrikulasi Iqro', icon: Sparkles, badge: 'Sel-Kam' },
        { id: 'violations', label: 'Catatan Kedisiplinan', icon: ShieldAlert },
        { id: 'reports', label: 'Raport Tahfizh', icon: BarChart3 },
      ];
    }

    const items: NavItemConfig[] = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'students', label: 'Data Siswa', icon: GraduationCap },
      { id: 'teachers', label: 'Guru & Kelas', icon: Users },
      { id: 'hafalan', label: 'Hafalan Al-Qur\'an', icon: BookOpen },
      { id: 'ummi', label: 'Pembelajaran Ummi', icon: BookMarked },
      { id: 'ujian', label: 'Menu Ujian', icon: Award, badge: '3 Ujian', children: examSubItems },
      { id: 'matrikulasi', label: 'Matrikulasi Iqro', icon: Sparkles, badge: 'Kls 8-9' },
      { id: 'violations', label: 'Pelanggaran Tahfizh', icon: ShieldAlert },
      { id: 'materials', label: 'Materi & Kurikulum', icon: FileText },
      { id: 'scores', label: 'Penilaian & Nilai', icon: Star },
      { id: 'targets', label: 'Target UMMI & Hafalan', icon: Target },
      { id: 'reports', label: 'Laporan & Raport', icon: BarChart3 }
    ];

    if (userRole === 'admin') {
      items.push({ id: 'settings', label: 'Pengaturan', icon: Settings });
    }

    return items;
  };

  const navItems = getNavItems();

  const renderNavItem = (item: NavItemConfig) => {
    const Icon = item.icon;
    if (item.children && item.children.length > 0) {
      return (
        <div key={item.id} className="space-y-1">
          <button
            type="button"
            onClick={() => setIsExamDropdownOpen(prev => !prev)}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition cursor-pointer text-left ${
              isExamViewActive
                ? 'bg-slate-800 text-[#D4AF37] font-bold border border-[#D4AF37]/40'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Icon className={`w-4 h-4 shrink-0 ${isExamViewActive ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
              <span className="whitespace-nowrap font-semibold text-xs">{item.label}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-700/80 text-amber-300">
                  {item.badge}
                </span>
              )}
              {isExamDropdownOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
          </button>

          {isExamDropdownOpen && (
            <div className="pl-6 pr-1 py-1 space-y-1 border-l border-slate-700/80 ml-4">
              {item.children.map(sub => {
                const isSubActive = current === sub.id || (current === 'ujian' && sub.id === 'ujian-kenaikan-jilid');
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSelectView(sub.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[11px] transition cursor-pointer text-left ${
                      isSubActive
                        ? 'bg-[#D4AF37] text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const isActive =
      current === item.id ||
      (item.id === 'teachers' && (current === 'teachers' || current === 'teachers-classes')) ||
      (item.id === 'parent-portal' && (current === 'parent-portal' || current === 'portal-wali'));

    return (
      <button
        key={item.id}
        id={`nav-item-${item.id}`}
        onClick={() => handleSelectView(item.id)}
        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition cursor-pointer text-left ${
          isActive
            ? 'bg-[#D4AF37] text-white font-medium shadow-md shadow-[#D4AF37]/20'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
          <span className="whitespace-nowrap font-medium text-xs">{item.label}</span>
        </div>
        {item.badge && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
              isActive ? 'bg-white/20 text-white' : 'bg-slate-700/80 text-amber-300'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Quick Floating Open Button on Desktop when Sidebar is Hidden */}
      {!isOpen && onToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="no-print hidden md:flex fixed left-0 top-20 z-30 items-center gap-1.5 pl-2.5 pr-3 py-2 bg-[#1E293B] hover:bg-slate-800 text-white rounded-r-xl border border-l-0 border-slate-700 shadow-lg transition cursor-pointer group"
          title="Klik untuk menampilkan Sidebar Menu"
        >
          <PanelLeftOpen className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition" />
          <span className="text-[11px] font-bold tracking-tight">Menu</span>
        </button>
      )}

      {/* Mobile Sidebar Backdrop & Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="no-print md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 flex flex-col w-64 max-w-[80vw] bg-[#1E293B] text-white h-full shadow-2xl border-r border-slate-700/80">
            <div className="p-4 flex items-center justify-between gap-2 border-b border-slate-700">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 bg-[#D4AF37] rounded flex items-center justify-center font-bold text-[#1E293B] text-base shrink-0">
                  T
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold tracking-tight text-white truncate">TAHFIZH SMPIA21</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest truncate">
                    {userRole === 'admin' ? 'Admin Portal' : userRole === 'guru' ? 'Guru Portal' : 'Wali Portal'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer shrink-0"
                title="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map(item => renderNavItem(item))}
            </nav>
          </aside>
        </div>
      )}

      {/* Desktop / Tablet Sidebar */}
      {isOpen && (
        <aside className="no-print hidden md:flex flex-col w-64 bg-[#1E293B] text-white shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-700/80 transition-all duration-200">
          
          {/* Brand header with Hide Sidebar button */}
          <div className="p-4 flex items-center justify-between gap-2 border-b border-slate-700">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-[#D4AF37] rounded flex items-center justify-center font-bold text-[#1E293B] text-base shrink-0">
                T
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold tracking-tight text-white truncate">TAHFIZH SMPIA21</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest truncate">
                  {userRole === 'admin' ? 'Admin Portal' : userRole === 'guru' ? 'Guru Portal' : 'Wali Portal'}
                </span>
              </div>
            </div>

            {onToggle && (
              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-[#D4AF37] border border-slate-700 transition cursor-pointer shrink-0"
                title="Sembunyikan Sidebar Kiri (Tampilan Lebih Full)"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map(item => renderNavItem(item))}
          </nav>

          {/* Dynamic User Card at bottom of sidebar */}
          <div className="p-3 border-t border-slate-700/80 bg-slate-900/70">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition cursor-pointer flex-1 group"
                title="Klik untuk membuka Pengaturan Profil, Ganti Kata Sandi & Upload Foto"
              >
                <div className="relative shrink-0">
                  <AvatarBadge
                    name={currentUser?.name || (userRole === 'admin' ? 'Administrator' : currentTeacher?.name || 'Pengguna')}
                    photoUrl={currentUser?.avatar || currentTeacher?.photo}
                    role={currentUser?.role || userRole}
                    gender={currentUser?.role === 'guru' ? (currentTeacher?.gender || 'L') : undefined}
                    size="sm"
                    className="ring-2 ring-[#D4AF37]/60 group-hover:ring-[#D4AF37] transition"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#1E293B]" title="Status Online"></span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-white truncate group-hover:text-[#D4AF37] transition">
                    {currentUser?.name || (userRole === 'admin' ? 'Administrator Tahfizh' : currentTeacher?.name || 'Guru Tahfizh')}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize truncate">
                    {currentUser?.title || (
                      userRole === 'admin' 
                        ? 'Koordinator Tahfizh' 
                        : userRole === 'guru' 
                        ? (currentTeacher?.specialization || 'Guru Halaqah')
                        : 'Wali Santri'
                    )}
                  </span>
                </div>
              </button>

              {onOpenProfile && (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-[#D4AF37] border border-slate-700 transition cursor-pointer shrink-0"
                  title="Pengaturan Akun (Ganti Password & Foto)"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1E293B] border-t border-slate-700 px-2 py-1 flex items-center justify-around">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = current === item.id || (item.id === 'parent-portal' && current === 'portal-wali');
          return (
            <button
              key={item.id}
              onClick={() => handleSelectView(item.id)}
              className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition text-[10px] cursor-pointer ${
                isActive ? 'text-[#D4AF37] font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="truncate max-w-[60px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

