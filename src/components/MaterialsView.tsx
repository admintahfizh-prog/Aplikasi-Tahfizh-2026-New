import React, { useState } from 'react';
import { 
  BookMarked, 
  Search, 
  Plus, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  Bookmark, 
  X,
  FileText
} from 'lucide-react';
import { LearningMaterial, Role } from '../types';
import { storageService } from '../services/storageService';

interface MaterialsViewProps {
  materials: LearningMaterial[];
  userRole: Role;
  onRefreshData: () => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  materials,
  userRole,
  onRefreshData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Ummi' | 'Tajwid' | 'Gharib' | 'Tahsin'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState<Partial<LearningMaterial>>({
    title: '',
    category: 'Ummi',
    level: 'Jilid 4',
    description: '',
    content: '',
    audioExampleUrl: ''
  });

  const filteredMaterials = materials.filter(m => {
    const matchSearch = 
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = categoryFilter === 'all' || m.category === categoryFilter;

    return matchSearch && matchCategory;
  });

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const item: LearningMaterial = {
      id: 'mat-' + Date.now(),
      title: formData.title,
      category: formData.category as any,
      level: formData.level || 'Jilid 1',
      description: formData.description || '',
      content: formData.content || '',
      audioExampleUrl: formData.audioExampleUrl
    };

    storageService.saveMaterial(item);
    setShowAddModal(false);
    onRefreshData();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-[#D4AF37]" />
            Silabus & Bank Materi Pembelajaran
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Panduan kurikulum tajwid, gharib musykilat, makharijul huruf, dan kaidah Metode Ummi
          </p>
        </div>

        {userRole === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>+ Tambah Materi Pembelajaran</span>
          </button>
        )}
      </div>

      {/* Toolbar & Category Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'Ummi', 'Tajwid', 'Gharib', 'Tahsin'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#1E293B] text-white shadow-xs font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat === 'all' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari materi pembelajaran..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
          />
        </div>
      </div>

      {/* Materials Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((m) => (
          <div
            key={m.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  m.category === 'Ummi' ? 'bg-emerald-100 text-emerald-800' :
                  m.category === 'Tajwid' ? 'bg-blue-100 text-blue-800' :
                  m.category === 'Gharib' ? 'bg-amber-100 text-amber-900' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {m.category} • {m.level}
                </span>
                <Bookmark className="w-4 h-4 text-slate-300" />
              </div>

              <h3 className="font-bold text-sm text-slate-900">{m.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kaidah Pokok:</span>
              <p className="text-slate-700 font-mono text-[11px] whitespace-pre-line">{m.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ADD MATERIAL MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Tambah Materi Pembelajaran Baru</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Materi *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  placeholder="Contoh: Hukum Nun Sukun dan Tanwin (Idzhar Halqi)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    <option value="Ummi">Metode Ummi</option>
                    <option value="Tajwid">Ilmu Tajwid</option>
                    <option value="Gharib">Gharib Al-Qur'an</option>
                    <option value="Tahsin">Tahsin & Fashahah</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenjang / Level</label>
                  <input
                    type="text"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                    placeholder="Jilid 4 / Dasar / Lanjutan"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  placeholder="Penjelasan ringkas materi dan tujuan pembelajaran"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Isi Kaidah & Contoh Bacaan</label>
                <textarea
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  placeholder="Tuliskan huruf, contoh lafadz dalam Al-Qur'an, dan cara membaca..."
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E293B] hover:bg-slate-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Simpan Materi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
