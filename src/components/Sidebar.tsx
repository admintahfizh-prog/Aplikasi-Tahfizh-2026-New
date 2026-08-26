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
  ShieldAlert
} from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  activeView?: string;
  setActiveView?: (view: string) => void;
  currentView?: string;
  onViewChange?: (view: string) => void;
  userRole?: Role;
  onOpenDailyInput?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  currentView,
  onViewChange,
  userRole = 'admin',
  onOpenDailyInput
}) => {
  const current = activeView || currentView || 'dashboard';
  const handleSelectView = (view: string) => {
    if (setActiveView) setActiveView(view);
    if (onViewChange) onViewChange(view);
  };

  const getNavItems = () => {
    if (userRole === 'wali') {
      return [
        { id: 'parent-portal', label: 'Dashboard Ananda', icon: HeartHandshake },
        { id: 'hafalan', label: 'Riwayat Hafalan', icon: BookOpen },
        { id: 'ummi', label: 'Perkembangan Ummi', icon: BookMarked },
        { id: 'violations', label: 'Catatan Kedisiplinan', icon: ShieldAlert },
        { id: 'reports', label: 'Raport Tahfizh', icon: BarChart3 },
      ];
    }

    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'students', label: 'Data Siswa', icon: GraduationCap },
      { id: 'teachers', label: 'Guru & Kelas', icon: Users },
      { id: 'hafalan', label: 'Hafalan Al-Qur\'an', icon: BookOpen },
      { id: 'ummi', label: 'Pembelajaran Ummi', icon: BookMarked },
      { id: 'violations', label: 'Pelanggaran Tahfizh', icon: ShieldAlert },
      { id: 'materials', label: 'Materi & Kurikulum', icon: FileText },
      { id: 'scores', label: 'Penilaian & Nilai', icon: Star },
      { id: 'targets', label: 'Target Hafalan', icon: Target },
      { id: 'reports', label: 'Laporan & Raport', icon: BarChart3 }
    ];

    if (userRole === 'admin') {
      items.push({ id: 'settings', label: 'Pengaturan', icon: Settings });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1E293B] text-white shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-700/80">
        
        {/* Brand header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-700">
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

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = current === item.id || 
              (item.id === 'teachers' && (current === 'teachers' || current === 'teachers-classes')) ||
              (item.id === 'parent-portal' && (current === 'parent-portal' || current === 'portal-wali'));
            
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleSelectView(item.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-xs transition cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#D4AF37] text-white font-medium shadow-md shadow-[#D4AF37]/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Card at bottom of sidebar */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 border-2 border-[#D4AF37] flex items-center justify-center text-xs font-bold text-white shrink-0">
              {userRole === 'admin' ? 'AF' : userRole === 'guru' ? 'SM' : 'IZ'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                {userRole === 'admin' ? 'Ust. Ahmad Fauzan' : userRole === 'guru' ? 'Usth. Siti Maryam' : 'Bpk. Iskandar'}
              </span>
              <span className="text-[10px] text-slate-400 capitalize truncate">
                {userRole === 'admin' ? 'Koordinator Tahfizh' : userRole === 'guru' ? 'Guru Halaqah' : 'Wali Santri'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1E293B] border-t border-slate-700 px-2 py-1 flex items-center justify-around">
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

