import React from 'react';
import { Users, Star, Layers, Filter, Check, Sparkles } from 'lucide-react';
import { HalaqahGroup, Teacher, User, UserProfile } from '../types';
import { resolveCurrentTeacher } from '../utils/halaqahHelper';

interface HalaqahFilterBarProps {
  halaqahGroups: HalaqahGroup[];
  teachers: Teacher[];
  currentUser?: User | UserProfile | null;
  selectedHalaqahFilter: string; // 'all' | 'my-halaqah' | halaqahGroupId
  onHalaqahFilterChange: (filterValue: string) => void;
  // Optional view mode switch (e.g. 'halaqah' vs 'class')
  viewGroupingMode?: 'halaqah' | 'class';
  onViewGroupingModeChange?: (mode: 'halaqah' | 'class') => void;
  // Optional counter badge
  totalFilteredCount?: number;
  className?: string;
  showGroupingToggle?: boolean;
}

export const HalaqahFilterBar: React.FC<HalaqahFilterBarProps> = ({
  halaqahGroups,
  teachers,
  currentUser,
  selectedHalaqahFilter,
  onHalaqahFilterChange,
  viewGroupingMode,
  onViewGroupingModeChange,
  totalFilteredCount,
  className = '',
  showGroupingToggle = false
}) => {
  const currentTeacher = resolveCurrentTeacher(currentUser, teachers) || (currentUser?.role === 'admin' ? teachers[0] : undefined);
  const isGuru = currentUser?.role === 'guru' || !!currentUser?.teacherId;
  const myGroups = currentTeacher ? halaqahGroups.filter(g => g.teacherId === currentTeacher.id) : [];

  const isMyHalaqahSelected = selectedHalaqahFilter === 'my-halaqah';

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2.5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Left side: Label & Fast Toggle "Halaqah Saya" */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-lg shrink-0">
            <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Filter Halaqah:</span>
          </div>

          {/* Quick Filter: Halaqah Saya */}
          <button
            type="button"
            onClick={() => {
              if (isMyHalaqahSelected) {
                onHalaqahFilterChange('all');
              } else {
                onHalaqahFilterChange('my-halaqah');
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              isMyHalaqahSelected
                ? 'bg-[#1E293B] text-[#D4AF37] ring-2 ring-[#D4AF37]/50 shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
            }`}
            title={currentTeacher ? `Halaqah binaan ${currentTeacher.name}` : 'Tampilkan hanya halaqah saya'}
          >
            <Star className={`w-3.5 h-3.5 ${isMyHalaqahSelected ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-amber-600'}`} />
            <span>Halaqah Saya</span>
            {currentTeacher && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${isMyHalaqahSelected ? 'bg-slate-800 text-slate-200' : 'bg-amber-200 text-amber-900'}`}>
                {currentTeacher.name.split(',')[0].replace('Ustadz ', 'Ust. ').replace('Ustadzah ', 'Usth. ')}
              </span>
            )}
          </button>

          {/* Dropdown Select Halaqah */}
          <div className="relative shrink-0">
            <select
              value={selectedHalaqahFilter}
              onChange={(e) => onHalaqahFilterChange(e.target.value)}
              className="py-1.5 pl-3 pr-7 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none cursor-pointer transition max-w-[280px] truncate"
            >
              <option value="all">Semua Halaqah ({halaqahGroups.length} Kelompok)</option>
              {currentTeacher && (
                <option value="my-halaqah">
                  ⭐ Halaqah Saya ({currentTeacher.name.split(',')[0]} - {myGroups.length} Kelompok)
                </option>
              )}
              <optgroup label="Daftar Kelompok Halaqah">
                {halaqahGroups.map((group) => {
                  const teacher = teachers.find(t => t.id === group.teacherId);
                  const isMine = currentTeacher && group.teacherId === currentTeacher.id;
                  return (
                    <option key={group.id} value={group.id}>
                      {isMine ? '⭐ ' : ''}{group.name} — {group.teacherName || teacher?.name || 'Guru'} ({group.studentIds?.length || 0} santri)
                    </option>
                  );
                })}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Right side: Grouping view toggle (Per Halaqah vs Per Kelas) & Info Count */}
        <div className="flex items-center gap-2 ml-auto">
          {showGroupingToggle && onViewGroupingModeChange && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => onViewGroupingModeChange('halaqah')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  viewGroupingMode === 'halaqah'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3 h-3 text-[#D4AF37]" />
                <span>Per Halaqah</span>
              </button>
              <button
                type="button"
                onClick={() => onViewGroupingModeChange('class')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  viewGroupingMode === 'class'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3 h-3 text-slate-500" />
                <span>Per Kelas</span>
              </button>
            </div>
          )}

          {typeof totalFilteredCount === 'number' && (
            <span className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md font-medium shrink-0">
              {totalFilteredCount} santri aktif
            </span>
          )}
        </div>

      </div>

      {/* Active Halaqah Info Banner if specific halaqah or my-halaqah is selected */}
      {selectedHalaqahFilter !== 'all' && (
        <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200/80 rounded-lg px-3 py-1.5 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span>
              {selectedHalaqahFilter === 'my-halaqah' ? (
                <>
                  Menampilkan <strong>Halaqah Saya</strong>: Bimbingan <strong>{currentTeacher?.name || 'Ustadz Pengampu'}</strong> ({myGroups.map(g => g.name).join(', ')})
                </>
              ) : (
                (() => {
                  const grp = halaqahGroups.find(g => g.id === selectedHalaqahFilter);
                  return (
                    <>
                      Menampilkan: <strong>{grp?.name}</strong> • Pengampu: <strong>{grp?.teacherName}</strong> {grp?.room ? `• ${grp.room}` : ''}
                    </>
                  );
                })()
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onHalaqahFilterChange('all')}
            className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer ml-2 shrink-0"
          >
            Tampilkan Semua
          </button>
        </div>
      )}
    </div>
  );
};
