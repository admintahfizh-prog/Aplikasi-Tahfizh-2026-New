import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Printer, 
  Share2, 
  Download, 
  Edit3, 
  CheckCircle2, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Calendar,
  Layers,
  Award,
  BookOpen,
  BookMarked,
  Save,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Square,
  X,
  Trash2,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Student, Teacher, ClassItem, MemorizationRecord, UmmiRecord, AppSettings } from '../types';
import { storageService } from '../services/storageService';
import { LogoAlAzhar } from './LogoAlAzhar';
import html2pdf from 'html2pdf.js';

interface StudentRaportCardProps {
  student: Student;
  teacher?: Teacher;
  studentClass?: ClassItem;
  records: MemorizationRecord[];
  ummiRecords: UmmiRecord[];
  settings: AppSettings;
  allStudents?: Student[];
  classes?: ClassItem[];
  onSelectStudent?: (studentId: string) => void;
  onClose?: () => void;
}

export const StudentRaportCard: React.FC<StudentRaportCardProps> = ({
  student,
  teacher,
  studentClass,
  records,
  ummiRecords,
  settings,
  allStudents = [],
  classes = [],
  onSelectStudent,
  onClose
}) => {
  // Class Filter & Sort for Quick Student Navigation
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(student.classId || '');
  const [sortBy, setSortBy] = useState<'class-asc' | 'name-asc' | 'nis-asc'>('class-asc');

  // Sorted and filtered students list for switcher
  const sortedNavStudents = useMemo(() => {
    const list = selectedClassFilter 
      ? allStudents.filter(s => s.classId === selectedClassFilter) 
      : allStudents;

    return [...list].sort((a, b) => {
      if (sortBy === 'class-asc') {
        const clsA = classes.find(c => c.id === a.classId)?.name || '';
        const clsB = classes.find(c => c.id === b.classId)?.name || '';
        const clsComp = clsA.localeCompare(clsB);
        if (clsComp !== 0) return clsComp;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'nis-asc') {
        return (a.nis || '').localeCompare(b.nis || '');
      }
      return 0;
    });
  }, [allStudents, selectedClassFilter, sortBy, classes]);
  // Period state
  const [periodTitle, setPeriodTitle] = useState<string>('TENGAH SEMESTER 1');
  const [academicYear, setAcademicYear] = useState<string>(settings.academicYear || '2026/2027');
  
  // Halaqah / Category (Akselerasi, Reguler, Khusus)
  const normalizeHalaqah = (prog?: string): string => {
    if (!prog) return 'Reguler';
    const p = prog.toLowerCase();
    if (p.includes('aksel') || p.includes('unggul')) return 'Akselerasi';
    if (p.includes('khusus') || p.includes('takhassus')) return 'Khusus';
    return 'Reguler';
  };

  const [halaqahType, setHalaqahType] = useState<string>(
    normalizeHalaqah(student.program)
  );

  // Tahfizh Progress
  const [suratAyatCapaian, setSuratAyatCapaian] = useState<string>(
    student.lastHafalan || 'Al-Muzzammil : 9'
  );
  const [targetSuratAyat, setTargetSuratAyat] = useState<string>('Al-A\'raf : 2');
  const [keteranganTahfizh, setKeteranganTahfizh] = useState<string>('Tercapai / Sesuai Target');

  // Attendance / Disiplin
  const [alphaCount, setAlphaCount] = useState<number>(0);
  const [izinCount, setIzinCount] = useState<number>(0);
  const [sakitCount, setSakitCount] = useState<number>(0);
  
  const studentViolations = storageService.getViolationsByStudent(student.id);
  const violationSummaryText = () => {
    if (!studentViolations || studentViolations.length === 0) {
      return '-';
    }
    const grouped: { [key: string]: number } = {};
    studentViolations.forEach(v => {
      grouped[v.typeName] = (grouped[v.typeName] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, count]) => `${name} (${count}x)`)
      .join(', ');
  };

  const [pelanggaranNotes, setPelanggaranNotes] = useState<string>(violationSummaryText());

  // Query all Ummi records for this student (sorted by date descending)
  const studentUmmiRecords = useMemo(() => {
    const rawList = ummiRecords && ummiRecords.length > 0
      ? ummiRecords.filter(r => r.studentId === student.id)
      : storageService.getUmmiRecords().filter(r => r.studentId === student.id);
    
    return [...rawList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ummiRecords, student.id]);

  const latestUmmiRecord = studentUmmiRecords[0];

  // Derive initial values based on latest Ummi input or student record
  const computeUmmiCapaian = (std: Student, rec?: UmmiRecord) => {
    if (rec && rec.jilid && rec.page) {
      return `${rec.jilid} halaman ${rec.page}`;
    }
    if (std.currentUmmiJilid) {
      return `${std.currentUmmiJilid} halaman ${std.currentUmmiPage || 1}`;
    }
    return 'Jilid 1 halaman 1';
  };

  const computeUmmiNilai = (std: Student, rec?: UmmiRecord) => {
    if (rec && rec.score !== undefined && rec.score !== null) {
      return String(rec.score);
    }
    if (std.avgScore) {
      return String(Math.round(std.avgScore));
    }
    return '88';
  };

  // Capaian UMMI (Format tabel: Capaian UMMI -> Jilid/Tilawah/Gharib/Tajwid & Nilai)
  const [ummiCapaianDescription, setUmmiCapaianDescription] = useState<string>(
    computeUmmiCapaian(student, latestUmmiRecord)
  );
  const [ummiNilaiScore, setUmmiNilaiScore] = useState<string>(
    computeUmmiNilai(student, latestUmmiRecord)
  );

  // Sync state when student or Ummi records change
  useEffect(() => {
    setUmmiCapaianDescription(computeUmmiCapaian(student, latestUmmiRecord));
    setUmmiNilaiScore(computeUmmiNilai(student, latestUmmiRecord));
    setSuratAyatCapaian(student.lastHafalan || 'Al-Muzzammil : 9');
    setHalaqahType(normalizeHalaqah(student.program));
  }, [student.id, student.currentUmmiJilid, student.currentUmmiPage, latestUmmiRecord]);

  // Teacher Notes
  const [teacherNotes, setTeacherNotes] = useState<string>(
    `Alhamdulillah ananda ${student.nickname || student.name.split(' ')[0]} menunjukkan kedisiplinan dan semangat yang sangat baik dalam halaqah tahfizh dan pembiasaan tartil metode Ummi. Pertahankan kelancaran muraja'ah di rumah dan tingkatkan pengulangan ayat baru.`
  );

  // Signatures & Settings (Synced with Admin Settings)
  const [headmasterName, setHeadmasterName] = useState<string>(
    settings.headmasterName || settings.principalName || 'H. M. Ridwan, M.Pd.I'
  );
  const [headmasterNik, setHeadmasterNik] = useState<string>(
    settings.headmasterNik || '01.0125'
  );
  const [tahfizhCoordinatorName, setTahfizhCoordinatorName] = useState<string>(
    settings.tahfizhCoordinator || teacher?.name || 'Sekar Ningtyas Dewi Pratiwi, S.Pd'
  );
  const [tahfizhCoordinatorNik, setTahfizhCoordinatorNik] = useState<string>(
    settings.tahfizhCoordinatorNik || teacher?.nip || '02.0367'
  );
  const [cityDate, setCityDate] = useState<string>(
    settings.raportDate || `Sukoharjo, 20 Desember 2026`
  );
  const [yayasanLogoUrl, setYayasanLogoUrl] = useState<string>(
    settings.yayasanLogoUrl || ''
  );
  const [raportFrameUrl, setRaportFrameUrl] = useState<string>(
    settings.raportFrameUrl || ''
  );
  const [bismillahImgUrl, setBismillahImgUrl] = useState<string>(
    settings.bismillahImgUrl || ''
  );
  const [headmasterSignatureUrl, setHeadmasterSignatureUrl] = useState<string>(
    settings.headmasterSignatureUrl || ''
  );
  const [tahfizhCoordinatorSignatureUrl, setTahfizhCoordinatorSignatureUrl] = useState<string>(
    settings.tahfizhCoordinatorSignatureUrl || ''
  );

  // Sync when settings change from outside
  useEffect(() => {
    if (settings.headmasterName || settings.principalName) {
      setHeadmasterName(settings.headmasterName || settings.principalName || '');
    }
    if (settings.headmasterNik) {
      setHeadmasterNik(settings.headmasterNik);
    }
    if (settings.tahfizhCoordinator) {
      setTahfizhCoordinatorName(settings.tahfizhCoordinator);
    }
    if (settings.tahfizhCoordinatorNik) {
      setTahfizhCoordinatorNik(settings.tahfizhCoordinatorNik);
    }
    if (settings.raportDate) {
      setCityDate(settings.raportDate);
    }
    if (settings.yayasanLogoUrl !== undefined) {
      setYayasanLogoUrl(settings.yayasanLogoUrl || '');
    }
    if (settings.raportFrameUrl !== undefined) {
      setRaportFrameUrl(settings.raportFrameUrl || '');
    }
    if (settings.bismillahImgUrl !== undefined) {
      setBismillahImgUrl(settings.bismillahImgUrl || '');
    }
    if (settings.headmasterSignatureUrl !== undefined) {
      setHeadmasterSignatureUrl(settings.headmasterSignatureUrl || '');
    }
    if (settings.tahfizhCoordinatorSignatureUrl !== undefined) {
      setTahfizhCoordinatorSignatureUrl(settings.tahfizhCoordinatorSignatureUrl || '');
    }
  }, [settings]);

  const handleYayasanLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png', 0.9);
          setYayasanLogoUrl(compressed);
          const current = storageService.getSettings();
          storageService.saveSettings({ ...current, yayasanLogoUrl: compressed });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveYayasanLogo = () => {
    setYayasanLogoUrl('');
    const current = storageService.getSettings();
    storageService.saveSettings({ ...current, yayasanLogoUrl: '' });
  };

  const handleRaportFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 1200;
        const maxHeight = 1800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png');
          setRaportFrameUrl(compressed);
          const current = storageService.getSettings();
          storageService.saveSettings({ ...current, raportFrameUrl: compressed });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveRaportFrame = () => {
    setRaportFrameUrl('');
    const current = storageService.getSettings();
    storageService.saveSettings({ ...current, raportFrameUrl: '' });
  };

  const handleBismillahUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 700;
        const maxH = 250;
        let width = img.width;
        let height = img.height;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png', 0.95);
          setBismillahImgUrl(compressed);
          const current = storageService.getSettings();
          storageService.saveSettings({ ...current, bismillahImgUrl: compressed });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBismillah = () => {
    setBismillahImgUrl('');
    const current = storageService.getSettings();
    storageService.saveSettings({ ...current, bismillahImgUrl: '' });
  };

  const handleHeadmasterSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 500;
        const maxH = 250;
        let width = img.width;
        let height = img.height;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png', 0.95);
          setHeadmasterSignatureUrl(compressed);
          const current = storageService.getSettings();
          storageService.saveSettings({ ...current, headmasterSignatureUrl: compressed });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveHeadmasterSignature = () => {
    setHeadmasterSignatureUrl('');
    const current = storageService.getSettings();
    storageService.saveSettings({ ...current, headmasterSignatureUrl: '' });
  };

  const handleTahfizhCoordinatorSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 500;
        const maxH = 250;
        let width = img.width;
        let height = img.height;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png', 0.95);
          setTahfizhCoordinatorSignatureUrl(compressed);
          const current = storageService.getSettings();
          storageService.saveSettings({ ...current, tahfizhCoordinatorSignatureUrl: compressed });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveTahfizhCoordinatorSignature = () => {
    setTahfizhCoordinatorSignatureUrl('');
    const current = storageService.getSettings();
    storageService.saveSettings({ ...current, tahfizhCoordinatorSignatureUrl: '' });
  };

  const handleSaveRaportConfig = () => {
    const current = storageService.getSettings();
    storageService.saveSettings({
      ...current,
      headmasterName,
      principalName: headmasterName,
      headmasterNik,
      tahfizhCoordinator: tahfizhCoordinatorName,
      tahfizhCoordinatorNik,
      raportDate: cityDate,
      yayasanLogoUrl,
      raportFrameUrl,
      bismillahImgUrl,
      headmasterSignatureUrl,
      tahfizhCoordinatorSignatureUrl
    });
  };

  // Edit Mode toggle in UI
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);

  // PDF & Print States
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string>('');
  const [printStatusMessage, setPrintStatusMessage] = useState<string>('');

  const printAreaRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPdf(true);
    setPdfSuccessMessage('');
    setPrintStatusMessage('');

    try {
      const element = printAreaRef.current;
      const cleanStudentName = (student.name || 'Siswa')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 40);
      const cleanNis = (student.nis || 'NIS').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Raport_Tahfizh_${cleanStudentName}_${cleanNis}.pdf`;

      const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc: Document) => {
            const noPrintEls = clonedDoc.querySelectorAll('.no-print');
            noPrintEls.forEach((el) => {
              (el as HTMLElement).style.display = 'none';
            });
          }
        },
        jsPDF: {
          unit: 'mm',
          format: [215, 330] as [number, number],
          orientation: 'portrait' as const
        }
      };

      // @ts-ignore
      await html2pdf().set(opt).from(element).save();

      setPdfSuccessMessage(`Alhamdulillah! Berkas PDF ${filename} berhasil diunduh.`);
      setTimeout(() => setPdfSuccessMessage(''), 6000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setPrintStatusMessage('Gagal membuat PDF otomatis. Mengalihkan ke jendela cetak browser...');
      setTimeout(() => setPrintStatusMessage(''), 6000);
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const openPrintWindow = () => {
    if (!printAreaRef.current) {
      window.print();
      return;
    }

    const content = printAreaRef.current.outerHTML;
    const printWin = window.open('', '_blank', 'width=950,height=900');

    if (!printWin) {
      // Browser popup blocked! Fallback to direct PDF download
      setPrintStatusMessage('Pop-up cetak diblokir browser. Mengalihkan ke unduhan file PDF langsung...');
      setTimeout(() => setPrintStatusMessage(''), 6000);
      handleDownloadPdf();
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>Raport Tahfizh - ${student.name}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          ${styles}
          <style>
            @page {
              size: 215mm 330mm;
              margin: 4mm 5mm 4mm 5mm;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: 'Times New Roman', Times, serif;
            }
            .raport-sheet {
              margin: 0 auto !important;
              box-shadow: none !important;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div style="display:flex;justify-content:center;padding:0;margin:0;">
            ${content}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handlePrint = () => {
    try {
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        openPrintWindow();
      } else {
        window.print();
      }
    } catch (err) {
      console.warn('Direct print failed, attempting popup window...', err);
      openPrintWindow();
    }
  };

  const handleShareWhatsApp = () => {
    const phone = student.parentPhone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const msg = encodeURIComponent(
      `*LAPORAN PERKEMBANGAN TAHFIZH & METODE UMMI*\n` +
      `*SMP ISLAM AL AZHAR 21 SUKOHARJO*\n` +
      `Periode: ${periodTitle} (${academicYear})\n\n` +
      `*Nama Santri:* ${student.name}\n` +
      `*NIS/NISN:* ${student.nis} / ${student.nisn}\n` +
      `*Kelas:* ${studentClass?.name || '8 E'}\n` +
      `*Halaqah:* ${halaqahType}\n\n` +
      `*I. Ketercapaian Tahfizh:* ${suratAyatCapaian} (Target: ${targetSuratAyat})\n` +
      `*II. Kedisiplinan:* A: ${alphaCount}, I: ${izinCount}, S: ${sakitCount}\n` +
      `*III. Capaian UMMI:* ${ummiCapaianDescription} (Nilai: ${ummiNilaiScore || '-'})\n\n` +
      `*Catatan Guru Pembimbing:* "${teacherNotes}"\n\n` +
      `_Laporan lengkap dapat diunduh di Portal Wali Santri SMPI Al Azhar 21._`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  // Find next and prev student index within sortedNavStudents
  const currentIndex = sortedNavStudents.findIndex(s => s.id === student.id);
  const prevStudent = currentIndex > 0 ? sortedNavStudents[currentIndex - 1] : null;
  const nextStudent = currentIndex >= 0 && currentIndex < sortedNavStudents.length - 1 ? sortedNavStudents[currentIndex + 1] : null;

  return (
    <div className="space-y-6">
      
      {/* SCREEN CONTROLS BAR (Hidden during print) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer text-xs font-bold"
            >
              ← Kembali
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold">
                Format Resmi Sekolah
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Raport Individu: {student.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              NIS: <strong className="text-slate-700">{student.nis}</strong> • Kelas: <strong className="text-slate-700">{studentClass?.name || 'Kelas'}</strong> • Wali: {student.parentName}
            </p>
          </div>
        </div>

        {/* Student Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {allStudents.length > 1 && onSelectStudent && (
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1.5 border border-slate-200">
              {/* Filter Rombel Kelas */}
              {classes.length > 0 && (
                <select
                  value={selectedClassFilter}
                  onChange={(e) => {
                    const newClassId = e.target.value;
                    setSelectedClassFilter(newClassId);
                    const firstInClass = allStudents.find(s => !newClassId || s.classId === newClassId);
                    if (firstInClass) onSelectStudent(firstInClass.id);
                  }}
                  className="bg-white text-[11px] font-bold text-slate-800 px-2 py-1 rounded-lg border border-slate-200 focus:outline-none max-w-[130px]"
                >
                  <option value="">Semua Kelas</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>Kelas {c.name}</option>
                  ))}
                </select>
              )}

              {/* Prev / Next & Student Select */}
              <div className="flex items-center bg-white rounded-lg border border-slate-200">
                <button
                  disabled={!prevStudent}
                  onClick={() => prevStudent && onSelectStudent(prevStudent.id)}
                  className="p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  title="Siswa Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <select
                  value={student.id}
                  onChange={(e) => onSelectStudent(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 px-2 py-1 focus:outline-none max-w-[170px] truncate"
                >
                  {sortedNavStudents.map(s => {
                    const cls = classes.find(c => c.id === s.classId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} {cls ? `(${cls.name})` : ''}
                      </option>
                    );
                  })}
                </select>

                <button
                  disabled={!nextStudent}
                  onClick={() => nextStudent && onSelectStudent(nextStudent.id)}
                  className="p-1 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  title="Siswa Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              isCustomizing 
                ? 'bg-amber-500 text-slate-950 border-amber-600' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isCustomizing ? 'Tutup Editor' : 'Sesuaikan Nilai'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Kirim Ringkasan ke WhatsApp Wali"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Kirim ke WA</span>
          </button>

          {/* Tombol Cetak & Simpan PDF Terpisah & Handal */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-slate-800 disabled:bg-slate-600 text-white text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              title="Unduh file raport dalam format PDF Folio/F4 langsung ke perangkat"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-[#D4AF37]" />
              )}
              <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Simpan PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Buka dialog pencetakan printer dokumen raport"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Cetak Raport</span>
            </button>
          </div>
        </div>
      </div>

      {/* NOTIFIKASI STATUS PROSES PDF / CETAK */}
      {(isGeneratingPdf || pdfSuccessMessage || printStatusMessage) && (
        <div className="no-print space-y-2 animate-in fade-in transition-all">
          {isGeneratingPdf && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2.5 shadow-xs">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              <div>
                <p className="font-bold">Sedang Merender Raport ke Dokumen PDF Folio/F4...</p>
                <p className="text-[11px] text-blue-700">Menyiapkan layout 215 × 330 mm, menyematkan bingkai, dan data santri {student.name}. File akan otomatis terunduh.</p>
              </div>
            </div>
          )}

          {pdfSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pdfSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setPdfSuccessMessage('')}
                className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {printStatusMessage && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{printStatusMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setPrintStatusMessage('')}
                className="text-amber-800 hover:text-amber-950 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* CUSTOMIZATION DRAWER / FORM (If teacher wants to customize values before printing) */}
      {isCustomizing && (
        <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-2xl text-xs space-y-4 no-print animate-in fade-in">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
            <h3 className="font-bold text-amber-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Editor Data Raport (Otomatis Disimpan Saat Dicetak)
            </h3>
            <span className="text-[11px] text-amber-800">Ubah nilai / catatan langsung di sini</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Periode Semester:</label>
              <select
                value={periodTitle}
                onChange={(e) => setPeriodTitle(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              >
                <option value="TENGAH SEMESTER 1">TENGAH SEMESTER 1 (PTS 1)</option>
                <option value="AKHIR SEMESTER 1">AKHIR SEMESTER 1 (PAS 1)</option>
                <option value="TENGAH SEMESTER 2">TENGAH SEMESTER 2 (PTS 2)</option>
                <option value="AKHIR SEMESTER 2">AKHIR SEMESTER 2 (PAS 2)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran:</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Halaqah Tahfizh:</label>
              <select
                value={halaqahType}
                onChange={(e) => setHalaqahType(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Akselerasi">Akselerasi</option>
                <option value="Reguler">Reguler</option>
                <option value="Khusus">Khusus</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Capaian Surat / Ayat:</label>
              <input
                type="text"
                value={suratAyatCapaian}
                onChange={(e) => setSuratAyatCapaian(e.target.value)}
                placeholder="Contoh: Al-Muzzammil : 9"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>
          </div>

          {/* Row 2: Target & Ketidakhadiran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Hafalan:</label>
              <input
                type="text"
                value={targetSuratAyat}
                onChange={(e) => setTargetSuratAyat(e.target.value)}
                placeholder="Contoh: Al-A'raf : 2"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alpha (A):</label>
              <input
                type="number"
                min="0"
                value={alphaCount}
                onChange={(e) => setAlphaCount(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Izin (I):</label>
              <input
                type="number"
                min="0"
                value={izinCount}
                onChange={(e) => setIzinCount(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Sakit (S):</label>
              <input
                type="number"
                min="0"
                value={sakitCount}
                onChange={(e) => setSakitCount(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>
          </div>

          {/* Row 3: Capaian UMMI (Jilid/Tilawah/Gharib/Tajwid & Nilai) */}
          <div className="bg-white p-3 rounded-lg border border-amber-300 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5 text-[#D4AF37]" />
                Capaian Metode Ummi Santri
              </span>
              {latestUmmiRecord && (
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                  ✓ Otomatis dari input terakhir: {latestUmmiRecord.jilid} hal. {latestUmmiRecord.page} (Nilai: {latestUmmiRecord.score})
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Capaian UMMI (Jilid/Tilawah/Gharib/Tajwid):
                </label>
                <input
                  type="text"
                  value={ummiCapaianDescription}
                  onChange={(e) => setUmmiCapaianDescription(e.target.value)}
                  placeholder="Contoh: Jilid 1 halaman 13"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nilai Capaian UMMI:
                </label>
                <input
                  type="text"
                  value={ummiNilaiScore}
                  onChange={(e) => setUmmiNilaiScore(e.target.value)}
                  placeholder="Nilai (contoh: 88 atau kosong)"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-xs text-center"
                />
              </div>
            </div>

            {/* Quick selector from Ummi input history */}
            {studentUmmiRecords.length > 0 && (
              <div className="pt-1 border-t border-slate-100">
                <span className="text-[10px] text-slate-500 font-semibold block mb-1">
                  Pilih dari riwayat input pembelajaran Ummi ananda:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {studentUmmiRecords.slice(0, 5).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setUmmiCapaianDescription(`${r.jilid} halaman ${r.page}`);
                        setUmmiNilaiScore(String(r.score));
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                        ummiCapaianDescription === `${r.jilid} halaman ${r.page}`
                          ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold'
                          : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200'
                      }`}
                      title={`Klik untuk mengisi raport dengan data setoran tanggal ${r.date}`}
                    >
                      <span>{r.jilid} hal. {r.page}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-amber-900 font-bold">Nilai: {r.score}</span>
                      <span className="text-[10px] text-slate-400">({r.date})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Row 4: Catatan Pembimbing */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan Pembimbing / Evaluasi:</label>
            <textarea
              rows={2}
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-normal text-xs"
            />
          </div>

          {/* Row 5: Pengaturan Tanggal & Tanda Tangan */}
          <div className="border-t border-amber-200/80 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 text-xs">Pengaturan Tanda Tangan & Format Raport:</span>
              <button
                type="button"
                onClick={handleSaveRaportConfig}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
              >
                <Save className="w-3 h-3" />
                <span>Simpan ke Pengaturan Admin</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Terbit Raport:</label>
                <input
                  type="text"
                  value={cityDate}
                  onChange={(e) => setCityDate(e.target.value)}
                  placeholder="Sukoharjo, 20 Desember 2026"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-medium text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kepala Sekolah & NIK:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={headmasterName}
                    onChange={(e) => setHeadmasterName(e.target.value)}
                    placeholder="Nama Kepala Sekolah"
                    className="w-2/3 p-2 bg-white border border-slate-300 rounded-lg font-semibold text-xs"
                  />
                  <input
                    type="text"
                    value={headmasterNik}
                    onChange={(e) => setHeadmasterNik(e.target.value)}
                    placeholder="NIK"
                    className="w-1/3 p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Koordinator Tahfizh & NIK:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tahfizhCoordinatorName}
                    onChange={(e) => setTahfizhCoordinatorName(e.target.value)}
                    placeholder="Nama Koordinator"
                    className="w-2/3 p-2 bg-white border border-slate-300 rounded-lg font-semibold text-xs"
                  />
                  <input
                    type="text"
                    value={tahfizhCoordinatorNik}
                    onChange={(e) => setTahfizhCoordinatorNik(e.target.value)}
                    placeholder="NIK"
                    className="w-1/3 p-2 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Row 6: Quick Upload Logo Yayasan, Kaligrafi Bismillah, & Bingkai Raport */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/60">
              {/* Logo Yayasan Kanan */}
              <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                    {yayasanLogoUrl ? (
                      <img src={yayasanLogoUrl} alt="Logo Yayasan" className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-slate-400 opacity-60" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 text-[11px] block truncate">Logo Yayasan</span>
                    <span className="text-[10px] text-slate-500">
                      {yayasanLogoUrl ? 'Terpasang' : 'Kosong'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <label className="px-2 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-[10px] font-bold transition cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3 text-[#D4AF37]" />
                    <span>{yayasanLogoUrl ? 'Ganti' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleYayasanLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {yayasanLogoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveYayasanLogo}
                      className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition cursor-pointer"
                      title="Hapus Logo Yayasan"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Kaligrafi Bismillah PNG */}
              <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                    {bismillahImgUrl ? (
                      <img src={bismillahImgUrl} alt="Bismillah PNG" className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-slate-400 opacity-60" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 text-[11px] block truncate">Bismillah (PNG)</span>
                    <span className="text-[10px] text-slate-500">
                      {bismillahImgUrl ? 'Terpasang' : 'Belum upload'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <label className="px-2 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-[10px] font-bold transition cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3 text-[#D4AF37]" />
                    <span>{bismillahImgUrl ? 'Ganti' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/png"
                      onChange={handleBismillahUpload}
                      className="hidden"
                    />
                  </label>
                  {bismillahImgUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveBismillah}
                      className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition cursor-pointer"
                      title="Hapus Bismillah PNG"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Bingkai Raport PNG */}
              <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                    {raportFrameUrl ? (
                      <img src={raportFrameUrl} alt="Bingkai Raport PNG" className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 opacity-60" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 text-[11px] block truncate">Bingkai (PNG)</span>
                    <span className="text-[10px] text-slate-500">
                      {raportFrameUrl ? 'Aktif' : 'Tanpa bingkai'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <label className="px-2 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-[10px] font-bold transition cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3 text-[#D4AF37]" />
                    <span>{raportFrameUrl ? 'Ganti' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/png"
                      onChange={handleRaportFrameUpload}
                      className="hidden"
                    />
                  </label>
                  {raportFrameUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveRaportFrame}
                      className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition cursor-pointer"
                      title="Hapus Bingkai PNG"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Row 7: Tanda Tangan Online Kepala Sekolah & Koordinator Tahfizh */}
            <div className="pt-2 border-t border-amber-200/60">
              <span className="text-[11px] font-bold text-amber-950 block mb-2">
                Tanda Tangan Online / Digital (Format PNG Disarankan Transparan):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* TTD Kepala Sekolah */}
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-16 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                      {headmasterSignatureUrl ? (
                        <img
                          src={headmasterSignatureUrl}
                          alt="TTD Kepsek"
                          className="w-full h-full object-contain p-0.5"
                        />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-400 opacity-60" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 text-[11px] block truncate">TTD Kepala Sekolah</span>
                      <span className="text-[10px] text-slate-500">
                        {headmasterSignatureUrl ? 'Sudah Diunggah' : 'Belum Ada TTD'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <label className="px-2.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs">
                      <Upload className="w-3 h-3 text-[#D4AF37]" />
                      <span>{headmasterSignatureUrl ? 'Ganti' : 'Upload TTD'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleHeadmasterSignatureUpload}
                        className="hidden"
                      />
                    </label>
                    {headmasterSignatureUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveHeadmasterSignature}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition cursor-pointer"
                        title="Hapus TTD Kepala Sekolah"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* TTD Koordinator Tahfizh */}
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-16 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                      {tahfizhCoordinatorSignatureUrl ? (
                        <img
                          src={tahfizhCoordinatorSignatureUrl}
                          alt="TTD Koordinator"
                          className="w-full h-full object-contain p-0.5"
                        />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-400 opacity-60" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 text-[11px] block truncate">TTD Koordinator Tahfizh</span>
                      <span className="text-[10px] text-slate-500">
                        {tahfizhCoordinatorSignatureUrl ? 'Sudah Diunggah' : 'Belum Ada TTD'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <label className="px-2.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs">
                      <Upload className="w-3 h-3 text-[#D4AF37]" />
                      <span>{tahfizhCoordinatorSignatureUrl ? 'Ganti' : 'Upload TTD'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleTahfizhCoordinatorSignatureUpload}
                        className="hidden"
                      />
                    </label>
                    {tahfizhCoordinatorSignatureUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveTahfizhCoordinatorSignature}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition cursor-pointer"
                        title="Hapus TTD Koordinator"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINTABLE OFFICIAL RAPORT CONTAINER - STRICT FOLIO / F4 (215 x 330 mm)    */}
      {/* ========================================================================= */}
      <div className="flex justify-center overflow-x-auto py-2">
        <div 
          ref={printAreaRef}
          className="raport-sheet bg-white text-slate-900 relative shadow-xl print:shadow-none print:m-0"
          style={{ 
            width: '215mm', 
            minHeight: '330mm',
            maxHeight: '330mm',
            padding: '16mm 18mm 14mm 18mm',
            fontFamily: "'Times New Roman', Times, serif" 
          }}
        >
          {/* BINGKAI RAPORT (UPLOAD MANUAL FORMAT PNG, MENGGANTIKAN LINE BINGKAI LAMA) */}
          {raportFrameUrl && (
            <img
              src={raportFrameUrl}
              alt="Bingkai Raport PNG"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0 select-none"
            />
          )}

          {/* INNER REPORT CONTENT - SAFELY BUFFERED FROM BINGKAI */}
          <div className="relative z-10 space-y-3.5 text-[12.5px] leading-snug">
            
            {/* HEADER: LOGO SEKOLAH (KIRI BESAR) - BISMILLAH PNG (TENGAH) - LOGO YAYASAN (KANAN BESAR) */}
            <div className="flex items-center justify-between gap-3 border-b border-transparent pb-1">
              {/* Left Logo: Sekolah (Al Azhar 21) */}
              <div className="w-24 sm:w-28 flex justify-start items-center shrink-0">
                <LogoAlAzhar size={88} customLogoUrl={settings.customLogoUrl} className="w-22 h-22 object-contain" />
              </div>

              {/* Center Bismillah PNG (Ganti Tulisan Arab) */}
              <div className="flex-1 px-2 flex flex-col items-center justify-center min-h-[72px]">
                {bismillahImgUrl ? (
                  <img
                    src={bismillahImgUrl}
                    alt="Kaligrafi Bismillah"
                    className="h-14 sm:h-16 max-w-[290px] object-contain mx-auto select-none"
                  />
                ) : (
                  <div className="no-print flex flex-col items-center justify-center p-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 text-slate-400 text-center w-full max-w-[240px]">
                    <span className="text-[10px] font-bold text-slate-600">Kaligrafi Bismillah (PNG)</span>
                    <label className="text-[9px] text-[#D4AF37] font-bold underline cursor-pointer mt-0.5">
                      + Upload Bismillah PNG
                      <input
                        type="file"
                        accept="image/png"
                        onChange={handleBismillahUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Right Logo: Yayasan (Upload Manual Besar Proporsional) */}
              <div className="w-24 sm:w-28 flex justify-end items-center shrink-0">
                {yayasanLogoUrl ? (
                  <img 
                    src={yayasanLogoUrl} 
                    alt="Logo Yayasan" 
                    className="w-22 h-22 object-contain" 
                  />
                ) : (
                  <div className="no-print w-22 h-22 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-[9px] text-slate-400 text-center p-1 bg-slate-50/70">
                    <span className="font-semibold text-slate-500">Logo Yayasan</span>
                    <label className="text-[#D4AF37] font-bold underline cursor-pointer text-[8px] mt-0.5">
                      + Upload
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleYayasanLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* DOCUMENT TITLE (PERBAIKAN FORMAT SESUAI PERMINTAAN) */}
            <div className="text-center space-y-0.5 pt-0.5">
              <h1 className="text-[15px] sm:text-[16px] font-black uppercase tracking-tight text-slate-950">
                LAPORAN PROGRAM TAHFIZHUL QUR'AN
              </h1>
              <h2 className="text-[13.5px] sm:text-[14.5px] font-bold uppercase tracking-tight text-slate-900">
                SMP ISLAM AL AZHAR 21 SUKOHARJO
              </h2>
              <div className="inline-block border-b-2 border-slate-900 pb-0.5 mt-0.5">
                <p className="text-[12px] sm:text-[12.5px] font-extrabold uppercase text-slate-900">
                  {periodTitle}
                </p>
              </div>
              <p className="text-[11.5px] font-bold text-slate-800">
                Tahun Ajaran {academicYear}
              </p>
            </div>

            {/* IDENTITAS SANTRI */}
            <div className="pt-1 text-[12.5px]">
              <table className="w-full border-none">
                <tbody>
                  <tr>
                    <td className="w-36 py-1 font-bold text-slate-900">Nama</td>
                    <td className="w-4 text-center font-bold">:</td>
                    <td className="py-1 font-bold text-slate-900 uppercase">{student.name}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold text-slate-900">No. Induk / NISN</td>
                    <td className="text-center font-bold">:</td>
                    <td className="py-1 font-bold text-slate-800 font-mono text-[12px]">
                      {student.nis} / {student.nisn || '0128437712'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold text-slate-900">Kelas</td>
                    <td className="text-center font-bold">:</td>
                    <td className="py-1 font-bold text-slate-900">{studentClass?.name || '8 E'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold text-slate-900">Halaqah Tahfizh</td>
                    <td className="text-center font-bold">:</td>
                    <td className="py-1 font-bold text-slate-900">{halaqahType}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========================================================================= */}
            {/* I. KETERCAPAIAN TAHFIZH (PROPORSI PENUH & RAPI)                            */}
            {/* ========================================================================= */}
            <div className="space-y-1 pt-0.5">
              <h3 className="font-bold text-[13px] text-slate-950">
                I. &nbsp; Ketercapaian Tahfizh
              </h3>

              <table className="w-full text-center text-[12.5px] border border-slate-900 border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-900">
                    <th colSpan={3} className="py-2 px-3 font-bold text-slate-900">
                      Capaian Tahfizhul Qur'an
                    </th>
                  </tr>
                  <tr className="bg-white border-b border-slate-900 text-slate-900 font-bold">
                    <th className="py-2 px-3 border-r border-slate-900 w-1/3">Surat / Ayat</th>
                    <th className="py-2 px-3 border-r border-slate-900 w-1/3">Target</th>
                    <th className="py-2 px-3 w-1/3">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-900">
                    <td className="py-2.5 px-3 border-r border-slate-900 font-semibold">{suratAyatCapaian}</td>
                    <td className="py-2.5 px-3 border-r border-slate-900 font-semibold">{targetSuratAyat}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{keteranganTahfizh}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========================================================================= */}
            {/* II. KEDISIPLINAN (PROPORSI PENUH & RAPI)                                   */}
            {/* ========================================================================= */}
            <div className="space-y-1 pt-0.5">
              <h3 className="font-bold text-[13px] text-slate-950">
                II. &nbsp; Kedisiplinan
              </h3>

              <table className="w-full text-[12.5px] border border-slate-900 border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-900 text-slate-900 font-bold">
                    <th className="py-2 px-3 border-r border-slate-900 w-1/2 text-center">Ketidakhadiran</th>
                    <th className="py-2 px-3 w-1/2 text-center">Pelanggaran</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {/* Left: Ketidakhadiran list */}
                    <td className="p-3 border-r border-slate-900 align-top">
                      <div className="space-y-1 px-4 font-mono text-[12.5px]">
                        <div className="flex">
                          <span className="w-8 font-bold font-sans">A</span>
                          <span className="w-4 text-center">:</span>
                          <span className="font-bold">{alphaCount}</span>
                          <span className="ml-2 font-sans text-slate-700">kali</span>
                        </div>
                        <div className="flex">
                          <span className="w-8 font-bold font-sans">I</span>
                          <span className="w-4 text-center">:</span>
                          <span className="font-bold">{izinCount}</span>
                          <span className="ml-2 font-sans text-slate-700">kali</span>
                        </div>
                        <div className="flex">
                          <span className="w-8 font-bold font-sans">S</span>
                          <span className="w-4 text-center">:</span>
                          <span className="font-bold">{sakitCount}</span>
                          <span className="ml-2 font-sans text-slate-700">kali</span>
                        </div>
                      </div>
                    </td>

                    {/* Right: Pelanggaran */}
                    <td className="p-3 text-center align-middle font-medium text-slate-800">
                      {pelanggaranNotes}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========================================================================= */}
            {/* III. PERKEMBANGAN INDIVIDU METODE UMMI (PROPORSI PENUH & RAPI)            */}
            {/* ========================================================================= */}
            <div className="space-y-1 pt-0.5">
              <h3 className="font-bold text-[13px] text-slate-950">
                III. &nbsp; Perkembangan Individu Metode Ummi
              </h3>

              <table className="w-full text-[12.5px] border border-slate-900 border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-900 text-slate-900">
                    <th colSpan={2} className="py-2 px-3 text-center font-bold text-[12.5px]">
                      Capaian UMMI
                    </th>
                  </tr>
                  <tr className="bg-white border-b border-slate-900 text-slate-900 font-bold">
                    <th className="py-2 px-3 border-r border-slate-900 text-left w-8/12 font-bold">
                      Jilid/Tilawah/Gharib/Tajwid
                    </th>
                    <th className="py-2 px-3 text-center w-4/12 font-bold">
                      Nilai
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2.5 px-3 border-r border-slate-900 font-normal text-slate-900">
                      {ummiCapaianDescription}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-900 text-[13px]">
                      {ummiNilaiScore}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ========================================================================= */}
            {/* IV. CATATAN                                                               */}
            {/* ========================================================================= */}
            <div className="space-y-1 pt-0.5">
              <h3 className="font-bold text-[13px] text-slate-950">
                IV. &nbsp; Catatan
              </h3>

              <div className="border border-slate-900 p-3 min-h-[72px] sm:min-h-[78px] text-[12px] text-slate-900 leading-relaxed">
                {teacherNotes || '-'}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* TANDA TANGAN (SIGNATURES) - SAMPAI SEBELUM BINGKAI BAWAH                   */}
            {/* ========================================================================= */}
            <div className="pt-5 grid grid-cols-2 text-center text-[12.5px]">
              {/* Left Signature: Kepala Sekolah (Sinkron Admin) */}
              <div className="flex flex-col items-center justify-between min-h-[112px]">
                <div>
                  <p className="text-slate-800">Mengetahui,</p>
                  <p className="font-bold text-slate-950 uppercase">
                    Kepala {settings.schoolName || 'SMP ISLAM AL AZHAR 21 SUKOHARJO'}
                  </p>
                </div>
                
                {/* Online Digital Signature Kepala Sekolah */}
                <div className="relative w-full flex flex-col items-center justify-center my-0.5">
                  {headmasterSignatureUrl ? (
                    <div className="relative group flex items-center justify-center">
                      <img
                        src={headmasterSignatureUrl}
                        alt="Tanda Tangan Kepala Sekolah"
                        className="h-14 sm:h-16 max-w-[140px] object-contain select-none -mb-3 relative z-10"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveHeadmasterSignature}
                        title="Hapus Tanda Tangan"
                        className="no-print absolute -top-1 -right-5 p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer z-20"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-14 flex items-center justify-center">
                      <label className="no-print text-[10.5px] text-[#D4AF37] hover:text-amber-700 font-bold cursor-pointer border border-dashed border-amber-300 hover:border-amber-500 rounded-lg px-2.5 py-1 bg-amber-50/60 transition flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>+ Upload TTD Kepsek</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleHeadmasterSignatureUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-bold text-slate-950 underline underline-offset-2">
                    {headmasterName}
                  </p>
                  <p className="text-[11.5px] font-mono text-slate-800 mt-0.5">
                    NIK. {headmasterNik}
                  </p>
                </div>
              </div>

              {/* Right Signature: Koordinator Tahfizh (Sinkron Admin) */}
              <div className="flex flex-col items-center justify-between min-h-[112px]">
                <div>
                  <p className="text-slate-800">{cityDate}</p>
                  <p className="font-bold text-slate-950">
                    Koordinator Tahfizh
                  </p>
                </div>
                
                {/* Online Digital Signature Koordinator Tahfizh */}
                <div className="relative w-full flex flex-col items-center justify-center my-0.5">
                  {tahfizhCoordinatorSignatureUrl ? (
                    <div className="relative group flex items-center justify-center">
                      <img
                        src={tahfizhCoordinatorSignatureUrl}
                        alt="Tanda Tangan Koordinator Tahfizh"
                        className="h-14 sm:h-16 max-w-[140px] object-contain select-none -mb-3 relative z-10"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveTahfizhCoordinatorSignature}
                        title="Hapus Tanda Tangan"
                        className="no-print absolute -top-1 -right-5 p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer z-20"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-14 flex items-center justify-center">
                      <label className="no-print text-[10.5px] text-[#D4AF37] hover:text-amber-700 font-bold cursor-pointer border border-dashed border-amber-300 hover:border-amber-500 rounded-lg px-2.5 py-1 bg-amber-50/60 transition flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>+ Upload TTD Koordinator</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleTahfizhCoordinatorSignatureUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-bold text-slate-950 underline underline-offset-2">
                    {tahfizhCoordinatorName}
                  </p>
                  <p className="text-[11.5px] font-mono text-slate-800 mt-0.5">
                    NIK. {tahfizhCoordinatorNik}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};
