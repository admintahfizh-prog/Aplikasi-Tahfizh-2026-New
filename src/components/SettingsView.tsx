import React, { useState } from 'react';
import { 
  Settings, 
  School, 
  Calendar, 
  Award, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  Sparkles,
  Download,
  Upload,
  ShieldCheck,
  Building
} from 'lucide-react';
import { AppSettings, Role } from '../types';
import { storageService } from '../services/storageService';

interface SettingsViewProps {
  settings: AppSettings;
  userRole: Role;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  userRole,
  onRefreshData
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onRefreshData();
  };

  const handleResetData = () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh data aplikasi ke data contoh awal?')) {
      storageService.resetToInitial();
      onRefreshData();
      alert('Data berhasil direset ke pengaturan awal.');
    }
  };

  const handleExportBackup = () => {
    const data = {
      students: storageService.getStudents(),
      teachers: storageService.getTeachers(),
      classes: storageService.getClasses(),
      records: storageService.getMemorizationRecords(),
      ummiRecords: storageService.getUmmiRecords(),
      targets: storageService.getTargets(),
      settings: storageService.getSettings(),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_tahfizh_smpia21_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#D4AF37]" />
            Pengaturan Sistem & Profil Sekolah
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi identitas lembaga, tahun ajaran aktif, KKM penilaian, dan cadangan data
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Identitas Sekolah & Kop Raport */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <School className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="font-bold text-sm text-slate-800">1. Identitas Sekolah & Kop Raport Resmi</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Lembaga / Sekolah *</label>
              <input
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Sub-judul / Jenjang</label>
              <input
                type="text"
                value={formData.schoolSubtitle}
                onChange={(e) => setFormData({ ...formData, schoolSubtitle: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap & Kontak Sekolah</label>
            <input
              type="text"
              value={formData.schoolAddress}
              onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>

        {/* Section 2: Tahun Ajaran & Akademik */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800">2. Periode Akademik Aktif</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran Aktif</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                placeholder="2026/2027"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Semester Aktif</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value as any })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Standar KKM & Target Minimal */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Award className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-800">3. Standar KKM & Target Kurikulum</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nilai KKM Minimal (Kelulusan)</label>
              <input
                type="number"
                value={formData.minScoreKKM}
                onChange={(e) => setFormData({ ...formData, minScoreKKM: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Nilai di bawah ini akan ditandai sebagai Perlu Bimbingan.</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Minimal Hafalan per Tahun (Juz)</label>
              <input
                type="number"
                step="0.5"
                value={formData.defaultTargetJuz}
                onChange={(e) => setFormData({ ...formData, defaultTargetJuz: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Standar target default bagi santri baru.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#D4AF37]" />
            <span>Simpan Perubahan Pengaturan</span>
          </button>
        </div>

      </form>

      {/* Backup & Danger Zone */}
      {userRole === 'admin' && (
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-xs">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            Cadangan Data & Reset Sistem
          </h4>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900">Backup Seluruh Database</p>
              <p className="text-slate-500 text-[11px]">Unduh file JSON berisi semua data siswa, guru, setoran, dan rekap.</p>
            </div>
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-[#D4AF37]" />
              <span>Unduh Backup JSON</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-red-700">Reset ke Data Awal (Demo Reset)</p>
              <p className="text-slate-500 text-[11px]">Kembalikan semua tabel ke kondisi data awal simulasi.</p>
            </div>
            <button
              type="button"
              onClick={handleResetData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Data Aplikasi</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
