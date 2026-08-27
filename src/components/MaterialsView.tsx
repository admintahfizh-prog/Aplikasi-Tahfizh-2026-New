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
  FileText,
  Layers,
  GraduationCap
} from 'lucide-react';
import { LearningMaterial, Role } from '../types';
import { storageService } from '../services/storageService';
import { UMMI_JILIDS } from '../data/ummiData';

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
  const [jilidFilter, setJilidFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState<Partial<LearningMaterial>>({
    title: '',
    category: 'Ummi',
    level: 'Jilid 1',
    page: '1-10',
    description: '',
    content: '',
    targetCompetence: '',
    audioExampleUrl: ''
  });

  const filteredMaterials = materials.filter(m => {
    const matchSearch = 
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.targetCompetence || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = categoryFilter === 'all' || m.category === categoryFilter;
    const matchJilid = jilidFilter === 'all' || m.jilid === jilidFilter || m.level === jilidFilter;

    return matchSearch && matchCategory && matchJilid;
  });

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const item: LearningMaterial = {
      id: 'mat-' + Date.now(),
      title: formData.title,
      name: formData.title,
      category: formData.category as any,
      jilid: formData.level || 'Jilid 1',
      level: formData.level || 'Jilid 1',
      page: formData.page || '1-10',
      description: formData.description || '',
      content: formData.content || '',
      targetCompetence: formData.targetCompetence || '',
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
            Silabus & Bank Materi Pembelajaran Lengkap
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Katalog kurikulum terpadu Buku Ummi Dewasa Jilid 1–3, Kaidah Tajwid, Gharib Musykilat, dan Tahsin Fashahah
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
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Main Category */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['all', 'Ummi', 'Tajwid', 'Gharib', 'Tahsin'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat as any);
                  if (cat !== 'Ummi' && cat !== 'all') {
                    setJilidFilter('all');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#1E293B] text-white shadow-xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat === 'all' ? 'Semua Kategori' : cat === 'Ummi' ? 'Ummi Dewasa (Jilid 1–3)' : cat}
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

        {/* Jilid Sub-filter when category is all or Ummi */}
        {(categoryFilter === 'all' || categoryFilter === 'Ummi') && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-600 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
              Filter Jenjang:
            </span>
            <button
              onClick={() => setJilidFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                jilidFilter === 'all'
                  ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              Semua Jilid
            </button>
            {UMMI_JILIDS.map(j => (
              <button
                key={j}
                onClick={() => setJilidFilter(j)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                  jilidFilter === j
                    ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {j}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Materials Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((m) => (
          <div
            key={m.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-sm transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  m.category === 'Ummi' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  m.category === 'Tajwid' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  m.category === 'Gharib' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                  'bg-purple-100 text-purple-800 border border-purple-200'
                }`}>
                  {m.category} • {m.level || m.jilid} {m.page ? `(Hal. ${m.page})` : ''}
                </span>
                <Bookmark className="w-4 h-4 text-slate-300" />
              </div>

              <h3 className="font-bold text-sm text-slate-900 leading-snug">{m.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Kaidah & Contoh Bacaan:
                </span>
                <p className="text-slate-700 font-mono text-[11px] whitespace-pre-line leading-relaxed">
                  {m.content}
                </p>
              </div>

              {m.targetCompetence && (
                <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200 text-[11px] text-emerald-900">
                  <span className="font-bold block text-[10px] text-emerald-800 uppercase tracking-wider mb-0.5">
                    Target Capaian:
                  </span>
                  <p className="leading-relaxed">{m.targetCompetence}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Tidak ada materi pembelajaran yang cocok</p>
          <p className="text-xs text-slate-400">Silakan ubah filter kategori atau kata kunci pencarian Anda.</p>
        </div>
      )}

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
                  placeholder="Contoh: Jilid 3: Mad Thabi'i Alif (2 Harakat)"
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
                  <label className="block font-bold text-slate-700 mb-1">Jenjang / Jilid</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  >
                    {UMMI_JILIDS.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                    <option value="Dasar">Dasar</option>
                    <option value="Lanjutan">Lanjutan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rentang Halaman</label>
                <input
                  type="text"
                  value={formData.page}
                  onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  placeholder="Contoh: 1-10 / 21-30"
                />
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
                <label className="block font-bold text-slate-700 mb-1">Isi Kaidah & Contoh Bacaan Arab</label>
                <textarea
                  rows={3}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  placeholder="Tuliskan kaidah, contoh lafadz Arab, dan aturan ketukan..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Capaian & Standar Kelulusan</label>
                <input
                  type="text"
                  value={formData.targetCompetence}
                  onChange={(e) => setFormData({ ...formData, targetCompetence: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  placeholder="Contoh: Mampu membaca panjang 2 harakat dengan presisi 100%..."
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
