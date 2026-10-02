import React, { useState, useRef } from 'react';
import {
  Award,
  CheckCircle2,
  Download,
  Edit3,
  FileCheck,
  Loader2,
  MessageCircle,
  Printer,
  Save,
  Sparkles,
  UserCheck,
  X,
  Upload,
  Image as ImageIcon,
  Sliders,
  Trash2
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import {
  AppSettings,
  ExamCategory,
  ExamParticipantItem,
  ExamScoreDetails,
  ExamSubmission,
  Student,
  Teacher
} from '../types';
import { storageService } from '../services/storageService';
import { UMMI_JILIDS } from '../data/ummiData';
import {
  AlAzhar21CircularEmblem,
  DirektoratAlAzharSoloBaruEmblem,
  DirekturAlAzharSignatureSvg,
  MudirYktnSignatureSvg,
  Syahadah2025WaveBackground,
  YktnCircularEmblem,
  YpiAlAzharShieldEmblem,
  buildDefaultSyahadahNumber,
  compressUploadedImage,
  formatHijriDateArabic,
  formatHijriDateIndo,
  formatJuzForSyahadah
} from './OfficialLetterheadEmblems';

export interface AspectDefinition {
  key: keyof ExamScoreDetails;
  label: string;
  shortLabel: string;
  description: string;
}

export const EXAM_ASPECTS_CONFIG: Record<ExamCategory, AspectDefinition[]> = {
  kenaikan_jilid: [
    {
      key: 'aspect1',
      label: 'Fashahah & Makharijul Huruf',
      shortLabel: 'Fashahah & Makhraj',
      description: 'Ketepatan makhraj huruf, sifat huruf, dan kejelasan harakat'
    },
    {
      key: 'aspect2',
      label: 'Tajwid & Kaidah Bacaan',
      shortLabel: 'Tajwid & Kaidah',
      description: 'Ketepatan hukum bacaan, panjang pendek (mad), dan dengung'
    },
    {
      key: 'aspect3',
      label: 'Kelancaran, Tartil & Mizan (Irama)',
      shortLabel: 'Kelancaran & Mizan',
      description: 'Kelancaran membaca tanpa terbata-bata serta kestabilan tempo mizan Ummi'
    }
  ],
  munaqosyah: [
    {
      key: 'aspect1',
      label: "Tartil & Fashahah Al-Qur'an",
      shortLabel: 'Tartil & Fashahah',
      description: 'Kefasihan makhraj, sifat huruf, waqaf ibtida, dan irama tartil'
    },
    {
      key: 'aspect2',
      label: "Gharibul Qur'an & Komentar",
      shortLabel: "Gharibul Qur'an",
      description: 'Ketepatan bacaan gharib dan penguasaan komentar gharib Metode Ummi'
    },
    {
      key: 'aspect3',
      label: 'Teori & Praktik Ilmu Tajwid',
      shortLabel: 'Ilmu Tajwid',
      description: 'Penguraian hukum tajwid dan ketepatan penerapan dalam bacaan'
    },
    {
      key: 'aspect4',
      label: "Tahfizh Al-Qur'an Wajib",
      shortLabel: "Tahfizh Al-Qur'an",
      description: 'Kelancaran dan ketepatan ayat pada materi hafalan wajib Munaqosyah'
    }
  ],
  juziyyah: [
    {
      key: 'aspect1',
      label: 'Kelancaran Hafalan (Itqan)',
      shortLabel: 'Kelancaran (Itqan)',
      description: "Kelancaran tasmi' sekali duduk tanpa bantuan/teguran ayat"
    },
    {
      key: 'aspect2',
      label: 'Ahkamut Tajwid & Sifatul Huruf',
      shortLabel: 'Ahkamut Tajwid',
      description: 'Ketepatan hukum ghunnah, mad, idgham, ikhfa, dan sifatul huruf'
    },
    {
      key: 'aspect3',
      label: "Fashahah, Makhraj & Waqaf Ibtida'",
      shortLabel: 'Fashahah & Waqaf',
      description: 'Kejelasan makharijul huruf dan ketepatan tempat berhenti/memulai ayat'
    },
    {
      key: 'aspect4',
      label: "Adab & Ketahanan Tasmi' Sekali Duduk",
      shortLabel: "Adab & Ketahanan",
      description: "Sikap adab bersama Al-Qur'an, ketenangan, dan kestabilan suara"
    }
  ]
};

export function suggestNextUmmiJilid(currentJilid: string): string {
  const order = ['Pra-TK', 'Jilid 1', 'Jilid 2', 'Jilid 3', "Al-Qur'an", 'Gharib', 'Tajwid', 'Munaqosyah', 'Tahfizh'];
  const idx = order.findIndex(j => j.toLowerCase() === (currentJilid || '').trim().toLowerCase());
  if (idx >= 0 && idx < order.length - 1) {
    return order[idx + 1];
  }
  return "Al-Qur'an";
}

export function computeExamGradeAndPredicate(avgScore: number, kkm = 75): {
  gradeLetter: string;
  predicate: string;
  resultStatus: 'Lulus' | 'Belum Lulus';
} {
  const rounded = Math.round(avgScore);
  if (rounded >= 90) {
    return { gradeLetter: 'A', predicate: 'MUMTAZ (Istimewa)', resultStatus: 'Lulus' };
  }
  if (rounded >= 85) {
    return { gradeLetter: 'A-', predicate: 'JAYYID JIDDAN (Sangat Baik)', resultStatus: 'Lulus' };
  }
  if (rounded >= 80) {
    return { gradeLetter: 'B+', predicate: 'JAYYID JIDDAN (Sangat Baik)', resultStatus: 'Lulus' };
  }
  if (rounded >= kkm) {
    return { gradeLetter: 'B', predicate: 'JAYYID (Baik)', resultStatus: 'Lulus' };
  }
  if (rounded >= 65) {
    return { gradeLetter: 'C', predicate: 'MAQBUL / MENGULANG', resultStatus: 'Belum Lulus' };
  }
  return { gradeLetter: 'D', predicate: 'BELUM LULUS (Mengulang)', resultStatus: 'Belum Lulus' };
}

export function buildDefaultCertificateNumber(
  category: ExamCategory,
  index: number,
  dateStr?: string
): string {
  if (category === 'juziyyah') {
    return buildDefaultSyahadahNumber(category, index, dateStr);
  }
  const code = category === 'kenaikan_jilid' ? 'SYH-UMMI' : 'SYH-MNQ';
  const year = dateStr ? dateStr.slice(0, 4) : new Date().getFullYear().toString();
  const num = String(index + 1).padStart(3, '0');
  return `${num}/${code}/SMPIA21/X/${year}`;
}

function formatIndoDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function normalizePhoneWA(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('62')) return digits;
  return '62' + digits;
}

interface ExamScoringAndCertificateProps {
  mode: 'penilaian_penguji' | 'sertifikat';
  category: ExamCategory;
  submission: ExamSubmission;
  students: Student[];
  teachers: Teacher[];
  settings: AppSettings;
  coordinatorName: string;
  coordinatorNik: string;
  isWali: boolean;
  selectedParticipantIndex: number;
  onSelectParticipantIndex: (idx: number) => void;
  onSubmissionUpdated: () => void;
  onSwitchToCertificateTab: (participantIdx: number) => void;
  onShowToast: (msg: string) => void;
}

export const ExamScoringAndCertificate: React.FC<ExamScoringAndCertificateProps> = ({
  mode,
  category,
  submission,
  students,
  teachers,
  settings,
  coordinatorName,
  coordinatorNik,
  isWali,
  selectedParticipantIndex,
  onSelectParticipantIndex,
  onSubmissionUpdated,
  onSwitchToCertificateTab,
  onShowToast
}) => {
  const aspects = EXAM_ASPECTS_CONFIG[category];
  const kkm = settings.minScoreKKM || 75;
  const headmasterName = settings.headmasterName || 'Muh Saifuddin, S.Si';
  const headmasterNik = settings.headmasterNik || '01.0125';

  // Complete list of all Ustadz & Ustadzah for Examiner (Penguji) dropdown
  const allExaminerTeachers = React.useMemo(() => {
    const fromStorage = storageService.getTeachers();
    const map = new Map<string, string>();
    if (coordinatorName) {
      map.set(coordinatorName.trim().toLowerCase(), coordinatorName.trim());
    }
    [...teachers, ...fromStorage].forEach(t => {
      if (t.name && t.name.trim()) {
        map.set(t.name.trim().toLowerCase(), t.name.trim());
      }
    });
    return Array.from(map.values());
  }, [teachers, coordinatorName]);

  const scoringSheetRef = useRef<HTMLDivElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [syahadahTemplateStyle, setSyahadahTemplateStyle] = useState<'bilingual_syahadah' | 'score_table'>(
    category === 'juziyyah' ? 'bilingual_syahadah' : 'score_table'
  );

  // Template image & data adjustment states for Syahadah Juziyyah
  const [syahadahTemplateUrl, setSyahadahTemplateUrl] = useState<string | undefined>(
    settings.syahadahTemplateUrl
  );
  const [syahadahOverlayMode, setSyahadahOverlayMode] = useState<'full_text' | 'data_only'>(
    settings.syahadahOverlayMode || 'full_text'
  );
  const [syahadahTopOffset, setSyahadahTopOffset] = useState<number>(
    settings.syahadahTopOffset ?? 0
  );
  const [syahadahSidePadding, setSyahadahSidePadding] = useState<number>(56);
  const [hideBuiltInHeaderOnImage, setHideBuiltInHeaderOnImage] = useState<boolean>(true);
  const [isUploadingSyahadahImg, setIsUploadingSyahadahImg] = useState<boolean>(false);
  const [showDataAdjustPanel, setShowDataAdjustPanel] = useState<boolean>(false);

  // Quick inline data override inputs for adjusting Syahadah data directly
  const [customCertNo, setCustomCertNo] = useState<string>('');
  const [customStudentName, setCustomStudentName] = useState<string>('');
  const [customJuzText, setCustomJuzText] = useState<string>('');
  const [customHijriIndo, setCustomHijriIndo] = useState<string>('');
  const [customHijriArab, setCustomHijriArab] = useState<string>('');
  const [customLeftSignerName, setCustomLeftSignerName] = useState<string>(
    "Ma'mun Al Qurthubi Al Hafizh"
  );
  const [customLeftSignerRole, setCustomLeftSignerRole] = useState<string>('Mudir YKTN');
  const [customRightSignerName, setCustomRightSignerName] = useState<string>(
    'Kartika Dewi A. R., M. Psi., Psikolog'
  );
  const [customRightSignerRole, setCustomRightSignerRole] = useState<string>('Direktur');

  React.useEffect(() => {
    setSyahadahTemplateUrl(settings.syahadahTemplateUrl);
    if (settings.syahadahOverlayMode) {
      setSyahadahOverlayMode(settings.syahadahOverlayMode);
    }
    if (typeof settings.syahadahTopOffset === 'number') {
      setSyahadahTopOffset(settings.syahadahTopOffset);
    }
  }, [settings.syahadahTemplateUrl, settings.syahadahOverlayMode, settings.syahadahTopOffset]);

  React.useEffect(() => {
    setSyahadahTemplateStyle(category === 'juziyyah' ? 'bilingual_syahadah' : 'score_table');
  }, [category]);

  React.useEffect(() => {
    const p = submission.participants[selectedParticipantIndex] || submission.participants[0];
    if (!p) return;
    const rawDate = p.evaluatedAt || submission.scheduledDate || submission.submissionDate;
    setCustomCertNo(
      p.certificateNumber ||
        buildDefaultCertificateNumber(category, selectedParticipantIndex, rawDate)
    );
    setCustomStudentName(p.studentName || '');
    setCustomJuzText(p.jilidOrJuz || 'Juz 30');
    setCustomHijriIndo(submission.hijriDateText || formatHijriDateIndo(rawDate));
    setCustomHijriArab(formatHijriDateArabic(rawDate));
  }, [selectedParticipantIndex, submission, category]);

  const handleUploadSyahadahTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploadingSyahadahImg(true);
    try {
      const dataUrl = await compressUploadedImage(file, 2000, 1414, 0.88);
      setSyahadahTemplateUrl(dataUrl);
      const currentSettings = storageService.getSettings();
      await storageService.saveSettings({
        ...currentSettings,
        syahadahTemplateUrl: dataUrl
      });
      onSubmissionUpdated();
      onShowToast('Gambar template Syahadah Juziyyah berhasil diunggah & disimpan.');
    } catch (err) {
      console.error('Failed to upload syahadah template:', err);
      onShowToast('Gagal mengunggah gambar template Syahadah.');
    } finally {
      setIsUploadingSyahadahImg(false);
    }
  };

  const handleRemoveSyahadahTemplate = async () => {
    setSyahadahTemplateUrl(undefined);
    const currentSettings = storageService.getSettings();
    await storageService.saveSettings({
      ...currentSettings,
      syahadahTemplateUrl: ''
    });
    onSubmissionUpdated();
    onShowToast('Gambar template Syahadah dihapus (kembali ke desain standar).');
  };

  const handleSaveOverlaySettings = async (
    nextMode: 'full_text' | 'data_only',
    nextOffset: number
  ) => {
    setSyahadahOverlayMode(nextMode);
    setSyahadahTopOffset(nextOffset);
    const currentSettings = storageService.getSettings();
    await storageService.saveSettings({
      ...currentSettings,
      syahadahOverlayMode: nextMode,
      syahadahTopOffset: nextOffset
    });
  };

  const handleSaveQuickSyahadahData = async () => {
    const p = submission.participants[selectedParticipantIndex];
    if (!p) return;
    const updatedParticipants = submission.participants.map((item, idx) =>
      idx === selectedParticipantIndex
        ? {
            ...item,
            studentName: customStudentName.trim() || item.studentName,
            jilidOrJuz: customJuzText.trim() || item.jilidOrJuz,
            certificateNumber: customCertNo.trim() || item.certificateNumber
          }
        : item
    );
    const updatedSubmission: ExamSubmission = {
      ...submission,
      hijriDateText: customHijriIndo.trim() || submission.hijriDateText,
      participants: updatedParticipants
    };
    await storageService.saveExamSubmission(updatedSubmission);
    onSubmissionUpdated();
    onShowToast('Data Syahadah santri berhasil disesuaikan & disimpan.');
  };

  // ============================================================================
  // MODAL INPUT NILAI PENGUJI PER PESERTA
  // ============================================================================
  const [gradingModalParticipantIdx, setGradingModalParticipantIdx] = useState<number | null>(null);
  const [asp1, setAsp1] = useState<number>(90);
  const [asp2, setAsp2] = useState<number>(90);
  const [asp3, setAsp3] = useState<number>(90);
  const [asp4, setAsp4] = useState<number>(90);
  const [promotedToJilid, setPromotedToJilid] = useState<string>('Jilid 3');
  const [examinerNameInput, setExaminerNameInput] = useState<string>(
    submission.examinerName || coordinatorName
  );
  const [examinerNotesInput, setExaminerNotesInput] = useState<string>('');
  const [certNumberInput, setCertNumberInput] = useState<string>('');
  const [autoUpdateStudentJilid, setAutoUpdateStudentJilid] = useState<boolean>(true);

  const openGradingModal = (idx: number) => {
    const part = submission.participants[idx];
    if (!part) return;
    setGradingModalParticipantIdx(idx);
    setAsp1(part.scoreDetails?.aspect1 ?? 90);
    setAsp2(part.scoreDetails?.aspect2 ?? 88);
    setAsp3(part.scoreDetails?.aspect3 ?? 90);
    setAsp4(part.scoreDetails?.aspect4 ?? 92);
    setPromotedToJilid(part.promotedToJilid || suggestNextUmmiJilid(part.jilidOrJuz));
    setExaminerNameInput(
      category === 'kenaikan_jilid'
        ? coordinatorName
        : part.examinerName || submission.examinerName || coordinatorName
    );
    setExaminerNotesInput(
      part.examinerNotes ||
        (category === 'kenaikan_jilid'
          ? 'Bacaan tartil, makhraj dan sifat huruf baik, layak naik ke jilid berikutnya.'
          : category === 'munaqosyah'
          ? "Penguasaan Tartil, Gharibul Qur'an, dan Tajwid sangat baik."
          : "Alhamdulillah tasmi' hafalan sekali duduk lancar dan mutqin.")
    );
    setCertNumberInput(
      part.certificateNumber ||
        buildDefaultCertificateNumber(
          category,
          idx,
          submission.scheduledDate || submission.submissionDate
        )
    );
    setAutoUpdateStudentJilid(true);
  };

  const liveAverage =
    aspects.length === 3
      ? Math.round(((Number(asp1) || 0) + (Number(asp2) || 0) + (Number(asp3) || 0)) / 3)
      : Math.round(
          ((Number(asp1) || 0) + (Number(asp2) || 0) + (Number(asp3) || 0) + (Number(asp4) || 0)) /
            4
        );
  const liveEvaluation = computeExamGradeAndPredicate(liveAverage, kkm);

  const handleSaveParticipantScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (gradingModalParticipantIdx === null) return;
    const targetPart = submission.participants[gradingModalParticipantIdx];
    if (!targetPart) return;

    const updatedParticipants = submission.participants.map((p, idx) => {
      if (idx !== gradingModalParticipantIdx) return p;
      return {
        ...p,
        promotedToJilid: category === 'kenaikan_jilid' ? promotedToJilid : p.promotedToJilid,
        scoreDetails: {
          aspect1: Number(asp1) || 0,
          aspect2: Number(asp2) || 0,
          aspect3: Number(asp3) || 0,
          ...(aspects.length === 4 ? { aspect4: Number(asp4) || 0 } : {})
        },
        score: liveAverage,
        gradeLetter: liveEvaluation.gradeLetter,
        predicate: liveEvaluation.predicate,
        resultStatus: liveEvaluation.resultStatus,
        examinerName:
          category === 'kenaikan_jilid'
            ? coordinatorName
            : examinerNameInput.trim() || coordinatorName,
        examinerNotes: examinerNotesInput.trim(),
        certificateNumber:
          certNumberInput.trim() ||
          buildDefaultCertificateNumber(
            category,
            idx,
            submission.scheduledDate || submission.submissionDate
          ),
        evaluatedAt: submission.scheduledDate || new Date().toISOString().split('T')[0]
      };
    });

    const allEvaluated = updatedParticipants.every(
      p => p.resultStatus === 'Lulus' || p.resultStatus === 'Belum Lulus'
    );

    const updatedSubmission: ExamSubmission = {
      ...submission,
      examinerName: examinerNameInput.trim() || submission.examinerName || coordinatorName,
      status: allEvaluated ? 'Selesai' : submission.status,
      participants: updatedParticipants
    };

    storageService.saveExamSubmission(updatedSubmission);

    // If kenaikan_jilid and Lulus and autoUpdateStudentJilid is checked, update student's currentUmmiJilid
    if (
      category === 'kenaikan_jilid' &&
      liveEvaluation.resultStatus === 'Lulus' &&
      autoUpdateStudentJilid &&
      promotedToJilid
    ) {
      const std = students.find(s => s.id === targetPart.studentId);
      if (std) {
        storageService.saveStudent({
          ...std,
          currentUmmiJilid: promotedToJilid,
          currentUmmiPage: 1,
          raportUmmiNilai: liveAverage,
          raportUmmiPredikat: liveEvaluation.predicate
        });
      }
    }

    onSubmissionUpdated();
    setGradingModalParticipantIdx(null);
    onShowToast(
      `Nilai ujian ananda ${targetPart.studentName} berhasil disimpan (${liveAverage} - ${liveEvaluation.resultStatus})!`
    );
  };

  // Download PDF Helper (supports Portrait for Scoring Sheet & Landscape for Certificate)
  const handleDownloadPdf = async (
    targetRef: React.RefObject<HTMLDivElement | null>,
    filename: string,
    orientation: 'portrait' | 'landscape'
  ) => {
    if (!targetRef.current) return;
    setIsDownloadingPdf(true);
    try {
      const opt = {
        margin: orientation === 'landscape' ? ([6, 8, 6, 8] as [number, number, number, number]) : ([10, 10, 10, 10] as [number, number, number, number]),
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation }
      };
      await html2pdf().set(opt).from(targetRef.current).save();
      onShowToast(`File PDF "${filename}" berhasil diunduh!`);
    } catch (err) {
      console.error('PDF error:', err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const currentParticipant =
    submission.participants[selectedParticipantIndex] || submission.participants[0];

  const getGraduationWaUrl = (p: ExamParticipantItem): string => {
    const std = students.find(s => s.id === p.studentId);
    const phone = normalizePhoneWA(p.parentPhone || std?.parentPhone);
    const examTitle =
      category === 'kenaikan_jilid'
        ? 'Ujian Kenaikan Jilid Metode Ummi'
        : category === 'munaqosyah'
        ? "Ujian Munaqosyah Al-Qur'an & Metode Ummi"
        : "Ujian Tasmi' Juziyyah Al-Qur'an";
    const promotionLine =
      category === 'kenaikan_jilid' && p.promotedToJilid
        ? `\n• *Naik ke Tingkat* : ${p.promotedToJilid}`
        : '';

    const msg = `Bismillahirrahmanirrahim
Kepada Yth. Bapak/Ibu Orang Tua / Wali Ananda *${p.studentName} (Kelas ${p.className})*

*Assalamu'alaikum Warahmatullahi Wabarakatuh*

Alhamdulillahirabbil'alamin, kami sampaikan hasil pelaksanaan *${examTitle}* ananda:
• *Nama Santri* : ${p.studentName} (${p.className})
• *Materi Diujikan* : ${p.jilidOrJuz}${promotionLine}
• *Nilai Akhir* : ${p.score ?? '-'} (${p.gradeLetter || '-'})
• *Predikat* : ${p.predicate || '-'}
• *Status Kelulusan* : *${p.resultStatus || 'Lulus'}*
• *Catatan Penguji* : ${p.examinerNotes || 'Pertahankan semangat murojaah di rumah.'}

_(Sertifikat Kelulusan / Syahadah resmi terlampir dalam format PDF)_

Jazakumullahu Khairan Katsiran atas doa dan pendampingan Bapak/Ibu di rumah.
*Koordinator Tahfizh SMPI Al Azhar 21 Solo Baru*
${coordinatorName}`;

    const encoded = encodeURIComponent(msg);
    return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  };

  // Summary metrics
  const totalCount = submission.participants.length;
  const gradedCount = submission.participants.filter(p => p.score !== undefined).length;
  const passedCount = submission.participants.filter(p => p.resultStatus === 'Lulus').length;
  const avgAll =
    gradedCount > 0
      ? Math.round(
          submission.participants
            .filter(p => p.score !== undefined)
            .reduce((acc, p) => acc + (p.score || 0), 0) / gradedCount
        )
      : 0;

  const sheetTitle =
    category === 'kenaikan_jilid'
      ? 'FORMAT PENILAIAN UJIAN KENAIKAN JILID METODE UMMI'
      : category === 'munaqosyah'
      ? "FORMAT PENILAIAN UJIAN MUNAQOSYAH AL-QUR'AN & METODE UMMI"
      : "FORMAT PENILAIAN UJIAN TASMI' JUZIYYAH AL-QUR'AN";

  const certHeaderTitle =
    category === 'kenaikan_jilid'
      ? 'SERTIFIKAT KENAIKAN JILID METODE UMMI'
      : category === 'munaqosyah'
      ? 'SERTIFIKAT KELULUSAN UJIAN MUNAQOSYAH'
      : "SERTIFIKAT UJIAN TASMI' JUZIYYAH AL-QUR'AN";

  const certArabicTitle =
    category === 'kenaikan_jilid'
      ? 'شَهَادَةُ تَرْقِيَةِ الْمُسْتَوَى لِطَرِيْقَةِ أُمِّيْ'
      : category === 'munaqosyah'
      ? 'شَهَادَةُ الْمُنَاقَشَةِ فِي تِلَاوَةِ وَحِفْظِ الْقُرْآنِ الْكَرِيْمِ'
      : 'شَهَادَةُ اخْتِبَارِ التَّسْمِيْعِ الْجُزْئِيَّةِ لِلْقُرْآنِ الْكَرِيْمِ';

  return (
    <div className="space-y-5">
      {/* ========================================================================= */}
      {/* MODE 3: FORMAT PENILAIAN & INPUT NILAI OLEH PENGUJI                       */}
      {/* ========================================================================= */}
      {mode === 'penilaian_penguji' && (
        <div className="space-y-4">
          {/* Top Action & Summary Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>Input Nilai Penguji & Lembar Format Penilaian Resmi</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Penguji: <strong className="text-slate-800">{submission.examinerName || coordinatorName}</strong> ·
                  Total Peserta: <strong>{totalCount}</strong> · Sudah Dinilai: <strong>{gradedCount}</strong> ·
                  Lulus: <strong className="text-emerald-700">{passedCount}</strong> · Rata-rata:{' '}
                  <strong>{avgAll || '-'}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isDownloadingPdf}
                  onClick={() =>
                    handleDownloadPdf(
                      scoringSheetRef,
                      `Format_Penilaian_${category}_${submission.scheduledDate || submission.submissionDate}.pdf`,
                      'portrait'
                    )
                  }
                  className="px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                  )}
                  <span>Download PDF Format Penilaian</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Lembar Nilai</span>
                </button>
              </div>
            </div>

            {/* Interactive Participant Score Cards for Quick Input by Penguji */}
            {!isWali && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Klik tombol &ldquo;Input / Edit Nilai Penguji&rdquo; pada santri untuk mengisi nilai per aspek & menerbitkan sertifikat:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {submission.participants.map((p, idx) => {
                    const isPassed = p.resultStatus === 'Lulus';
                    const isGraded = p.score !== undefined;
                    return (
                      <div
                        key={p.studentId}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-900 truncate">
                              {idx + 1}. {p.studentName} ({p.className})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Materi: <strong className="text-slate-800">{p.jilidOrJuz}</strong>
                            {category === 'kenaikan_jilid' && p.promotedToJilid
                              ? ` → Naik ke ${p.promotedToJilid}`
                              : ''}
                          </p>
                          <p className="text-[11px] text-slate-600">
                            {isGraded ? (
                              <>
                                Nilai Akhir: <strong className="text-slate-900">{p.score}</strong> ({p.gradeLetter}) ·{' '}
                                <span
                                  className={
                                    isPassed ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'
                                  }
                                >
                                  {p.resultStatus}
                                </span>
                              </>
                            ) : (
                              <span className="text-amber-700 font-semibold">Belum diinput nilai penguji</span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => openGradingModal(idx)}
                            className="px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-[#D4AF37]" />
                            <span>{isGraded ? 'Edit Nilai' : 'Input Nilai Penguji'}</span>
                          </button>

                          {isPassed && (
                            <button
                              type="button"
                              onClick={() => onSwitchToCertificateTab(idx)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Lihat & Cetak Sertifikat"
                            >
                              <Award className="w-3.5 h-3.5 text-[#8C7015]" />
                              <span>Sertifikat</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* PRINTABLE FORMAT PENILAIAN RESMI PENGUJI (A4 PORTRAIT) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-10 flex justify-center overflow-x-auto print:p-0 print:border-none print:shadow-none">
            <div
              ref={scoringSheetRef}
              className="printable-report-area w-full max-w-[820px] bg-white text-slate-950 space-y-5"
              style={{ fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif" }}
            >
              {/* Official School Header (Kop Penilaian) */}
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    YAYASAN PESANTREN ISLAM AL AZHAR · KOORDINATOR TAHFIZH & METODE UMMI
                  </p>
                  <h2 className="text-base sm:text-lg font-black uppercase text-slate-950">
                    {settings.schoolName || 'SMP ISLAM AL AZHAR 21 SOLO BARU'}
                  </h2>
                  <p className="text-[11px] text-slate-600">
                    {settings.schoolAddress ||
                      'Jl. Raya Solo Baru - Baki, Kudu, Kec. Baki, Kab. Sukoharjo, Jawa Tengah'}
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-700 shrink-0">
                  <p className="font-bold text-slate-900">Tahun Ajaran {settings.academicYear}</p>
                  <p>Semester {settings.semester}</p>
                  <p className="font-semibold text-emerald-800">KKM Kelulusan: {kkm}</p>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-950 underline">
                  {sheetTitle}
                </h3>
                <p className="text-xs text-slate-700">
                  Berita Acara & Daftar Nilai Hasil Ujian Santri oleh Penguji
                </p>
              </div>

              {/* Exam Metadata Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-300">
                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-36 font-semibold text-slate-700">Hari / Tanggal Ujian</span>
                    <span className="mr-2">:</span>
                    <span className="font-bold text-slate-950">
                      {submission.scheduledDate
                        ? `${submission.scheduledDay || ''}, ${formatIndoDate(submission.scheduledDate)}`
                        : formatIndoDate(submission.submissionDate)}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-36 font-semibold text-slate-700">Waktu Ujian</span>
                    <span className="mr-2">:</span>
                    <span className="font-bold text-slate-950">
                      {submission.scheduledTime || '07.30 - 09.30 WIB'}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-36 font-semibold text-slate-700">Musyrif Pengaju</span>
                    <span className="mr-2">:</span>
                    <span className="font-bold text-slate-950">{submission.teacherName}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-36 font-semibold text-slate-700">Penguji Ujian</span>
                    <span className="mr-2">:</span>
                    <span className="font-bold text-slate-950">
                      {submission.examinerName || coordinatorName}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-36 font-semibold text-slate-700">Tempat Pelaksanaan</span>
                    <span className="mr-2">:</span>
                    <span className="font-bold text-slate-950">
                      {submission.scheduledRoom || 'Kampus SMP Islam Al Azhar 21 Solo Baru'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assessment Table */}
              <div>
                <table className="w-full border-2 border-slate-900 border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-900 text-slate-950 font-bold text-center">
                      <th rowSpan={2} className="py-2 px-2 border-r border-slate-900 w-9">
                        No
                      </th>
                      <th rowSpan={2} className="py-2 px-2.5 border-r border-slate-900 text-left">
                        Nama Lengkap Santri
                      </th>
                      <th rowSpan={2} className="py-2 px-2 border-r border-slate-900 w-14">
                        Kelas
                      </th>
                      <th rowSpan={2} className="py-2 px-2 border-r border-slate-900 w-28">
                        {category === 'kenaikan_jilid'
                          ? 'Jilid Diujikan'
                          : category === 'munaqosyah'
                          ? 'Materi Munaqosyah'
                          : 'Juz Diujikan'}
                      </th>
                      <th
                        colSpan={aspects.length}
                        className="py-1.5 px-2 border-b border-r border-slate-900"
                      >
                        Aspek Penilaian Penguji (Skala 0–100)
                      </th>
                      <th rowSpan={2} className="py-2 px-2 border-r border-slate-900 w-14">
                        Nilai Akhir
                      </th>
                      <th rowSpan={2} className="py-2 px-2 border-r border-slate-900 w-24">
                        Huruf & Predikat
                      </th>
                      <th rowSpan={2} className="py-2 px-2 border-r border-slate-900 w-24">
                        {category === 'kenaikan_jilid' ? 'Status & Naik Jilid' : 'Status Kelulusan'}
                      </th>
                      <th rowSpan={2} className="py-2 px-2.5 text-left">
                        Catatan Evaluasi Penguji
                      </th>
                    </tr>
                    <tr className="bg-slate-50 border-b-2 border-slate-900 text-[11px] font-bold text-center">
                      {aspects.map(asp => (
                        <th key={asp.key} className="py-1.5 px-1.5 border-r border-slate-900 w-16">
                          {asp.shortLabel}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {submission.participants.map((p, idx) => {
                      const sd = p.scoreDetails;
                      const isPassed = p.resultStatus === 'Lulus';
                      return (
                        <tr key={p.studentId} className="border-b border-slate-900">
                          <td className="py-2 px-2 border-r border-slate-900 text-center font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2.5 border-r border-slate-900 font-bold text-slate-950">
                            {p.studentName}
                            {p.studentNis && (
                              <span className="block text-[10px] font-normal text-slate-500">
                                NIS: {p.studentNis}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-900 text-center font-medium">
                            {p.className}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-900 text-center font-semibold">
                            {p.jilidOrJuz}
                          </td>
                          <td className="py-2 px-1.5 border-r border-slate-900 text-center font-mono font-semibold">
                            {sd?.aspect1 ?? '....'}
                          </td>
                          <td className="py-2 px-1.5 border-r border-slate-900 text-center font-mono font-semibold">
                            {sd?.aspect2 ?? '....'}
                          </td>
                          <td className="py-2 px-1.5 border-r border-slate-900 text-center font-mono font-semibold">
                            {sd?.aspect3 ?? '....'}
                          </td>
                          {aspects.length === 4 && (
                            <td className="py-2 px-1.5 border-r border-slate-900 text-center font-mono font-semibold">
                              {sd?.aspect4 ?? '....'}
                            </td>
                          )}
                          <td className="py-2 px-2 border-r border-slate-900 text-center font-mono font-black text-sm">
                            {p.score ?? '....'}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-900 text-center text-[11px]">
                            {p.gradeLetter ? (
                              <>
                                <span className="font-black text-slate-950 block">
                                  {p.gradeLetter}
                                </span>
                                <span className="text-[10px] text-slate-700 leading-tight block">
                                  {p.predicate}
                                </span>
                              </>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-2 px-2 border-r border-slate-900 text-center text-[11px] font-bold">
                            {p.resultStatus === 'Lulus' ? (
                              <div>
                                <span className="text-emerald-800 block">LULUS</span>
                                {category === 'kenaikan_jilid' && p.promotedToJilid && (
                                  <span className="text-[10px] font-semibold text-slate-700 block">
                                    Naik: {p.promotedToJilid}
                                  </span>
                                )}
                              </div>
                            ) : p.resultStatus === 'Belum Lulus' ? (
                              <span className="text-red-700">MENGULANG</span>
                            ) : (
                              <span className="text-slate-400">Belum Diuji</span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-[11px] text-slate-800">
                            {p.examinerNotes || '................................................'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Rubric Legend */}
              <div className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-300 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900">Pedoman Predikat Kelulusan: </span>
                  <span>90–100 = A (Mumtaz / Istimewa) · </span>
                  <span>85–89 = A- (Jayyid Jiddan) · </span>
                  <span>80–84 = B+ (Jayyid Jiddan) · </span>
                  <span>{kkm}–79 = B (Jayyid / Baik) · </span>
                  <span>&lt; {kkm} = Mengulang</span>
                </div>
              </div>

              {/* Signatures: Examiner & Tahfizh Coordinator */}
              <div className="pt-4 grid grid-cols-2 gap-6 text-xs text-center">
                <div className="space-y-14">
                  <div>
                    <p className="text-slate-600">Mengetahui,</p>
                    <p className="font-bold text-slate-900">Koordinator Tahfizh & Metode Ummi</p>
                  </div>
                  <div>
                    <p className="font-bold underline text-slate-950">{coordinatorName}</p>
                    <p className="text-[11px] font-mono text-slate-600">NIK. {coordinatorNik}</p>
                  </div>
                </div>

                <div className="space-y-14">
                  <div>
                    <p className="text-slate-600">
                      Sukoharjo,{' '}
                      {formatIndoDate(submission.scheduledDate || submission.submissionDate)}
                    </p>
                    <p className="font-bold text-slate-900">Penguji Ujian</p>
                  </div>
                  <div>
                    <p className="font-bold underline text-slate-950">
                      {submission.examinerName || coordinatorName}
                    </p>
                    <p className="text-[11px] text-slate-600">Penguji Tahfizh & Metode Ummi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 4: SERTIFIKAT UJIAN (NAIK JILID / MUNAQOSYAH / JUZIYYAH)             */}
      {/* ========================================================================= */}
      {mode === 'sertifikat' && (
        <div className="space-y-4">
          {/* Top Participant Selector & Certificate Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                  Pilih Santri Penerima Sertifikat ({certHeaderTitle}):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {submission.participants.map((p, idx) => {
                    const isSelected = selectedParticipantIndex === idx;
                    return (
                      <button
                        key={p.studentId}
                        type="button"
                        onClick={() => onSelectParticipantIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#1E293B] text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Award
                          className={`w-3.5 h-3.5 ${
                            isSelected ? 'text-[#D4AF37]' : 'text-slate-500'
                          }`}
                        />
                        <span>
                          {idx + 1}. {p.studentName} ({p.className})
                        </span>
                        {p.score !== undefined && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 text-[#D4AF37]">
                            Nilai: {p.score} ({p.gradeLetter})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {currentParticipant && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <select
                    value={syahadahTemplateStyle}
                    onChange={e =>
                      setSyahadahTemplateStyle(
                        e.target.value as 'bilingual_syahadah' | 'score_table'
                      )
                    }
                    className="px-2.5 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold cursor-pointer"
                    title="Pilih Desain Format Syahadah / Sertifikat"
                  >
                    <option value="bilingual_syahadah">
                      Format Syahadah 2 Bahasa (Sesuai Template Syahadah)
                    </option>
                    <option value="score_table">
                      Format Sertifikat + Tabel Rincian Nilai
                    </option>
                  </select>

                  {!isWali && (
                    <button
                      type="button"
                      onClick={() => openGradingModal(selectedParticipantIndex)}
                      className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Nilai / No. Syahadah</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isDownloadingPdf}
                    onClick={() =>
                      handleDownloadPdf(
                        certificateRef,
                        `Syahadah_${category}_${currentParticipant.studentName.replace(/\s+/g, '_')}.pdf`,
                        'landscape'
                      )
                    }
                    className="px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {isDownloadingPdf ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                    )}
                    <span>Download PDF Syahadah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak</span>
                  </button>

                  {!isWali && (
                    <a
                      href={getGraduationWaUrl(currentParticipant)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Kirim WA Kelulusan</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* PANEL UPLOAD GAMBAR SYAHADAH JUZIYYAH & PENYESUAIAN DATA              */}
          {/* ===================================================================== */}
          {!isWali && syahadahTemplateStyle === 'bilingual_syahadah' && (
            <div className="bg-amber-50/70 rounded-2xl border border-amber-200/90 p-4 space-y-3.5 no-print">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <ImageIcon className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                      Template Gambar Syahadah Juziyyah Tahfizh & Penyesuaian Data
                    </h4>
                    <p className="text-[11px] text-amber-800">
                      Unggah gambar desain/blangko Syahadah Juziyyah (JPG/PNG landscape), lalu sesuaikan data santri dan posisi teks di atas gambar.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all">
                    {isUploadingSyahadahImg ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {syahadahTemplateUrl
                        ? 'Ganti Gambar Syahadah'
                        : 'Upload Gambar Syahadah'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadSyahadahTemplate}
                      className="hidden"
                    />
                  </label>

                  {syahadahTemplateUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveSyahadahTemplate}
                      className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Gambar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowDataAdjustPanel(prev => !prev)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                      showDataAdjustPanel
                        ? 'bg-[#1E293B] text-[#D4AF37] border-[#1E293B]'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Sesuaikan Data & Posisi</span>
                  </button>
                </div>
              </div>

              {/* Controls when Syahadah image is uploaded or when user opens Data & Position panel */}
              {(syahadahTemplateUrl || showDataAdjustPanel) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-amber-200/80 text-xs">
                  {/* Left box: Quick Data Customization */}
                  <div className="bg-white rounded-xl border border-amber-200 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800">
                        1. Sesuaikan Data Syahadah ({currentParticipant?.studentName})
                      </span>
                      <button
                        type="button"
                        onClick={handleSaveQuickSyahadahData}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3 h-3" />
                        <span>Simpan Data</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Nama Santri di Syahadah:
                        </label>
                        <input
                          type="text"
                          value={customStudentName}
                          onChange={e => setCustomStudentName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Materi Juz (Otomatis Arab & Indo):
                        </label>
                        <input
                          type="text"
                          value={customJuzText}
                          onChange={e => setCustomJuzText(e.target.value)}
                          placeholder="Contoh: Juz 30"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Penandatangan Kiri (YKTN):
                        </label>
                        <input
                          type="text"
                          value={customLeftSignerName}
                          onChange={e => setCustomLeftSignerName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Penandatangan Kanan (Direktur Al Azhar):
                        </label>
                        <input
                          type="text"
                          value={customRightSignerName}
                          onChange={e => setCustomRightSignerName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right box: Template Overlay & Position Adjustment */}
                  <div className="bg-white rounded-xl border border-amber-200 p-3.5 space-y-2.5">
                    <span className="font-extrabold text-slate-800 block">
                      2. Pengaturan Tampilan & Posisi Data di Atas Gambar Template
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveOverlaySettings('full_text', syahadahTopOffset)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                          syahadahOverlayMode === 'full_text'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        Desain Lengkap Syahadah (2 Bahasa)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveOverlaySettings('data_only', syahadahTopOffset)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                          syahadahOverlayMode === 'data_only'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        Hanya Isi Titik-Titik Data (Jika Upload Gambar Syahadah)
                      </button>
                    </div>

                    {syahadahTemplateUrl && syahadahOverlayMode === 'full_text' && (
                      <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hideBuiltInHeaderOnImage}
                          onChange={e => setHideBuiltInHeaderOnImage(e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        <span>
                          Gunakan Kop, Logo & Bingkai dari Gambar Upload (Sembunyikan Logo/Bingkai Bawaan)
                        </span>
                      </label>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-0.5">
                          <span>Geser Posisi Data (Atas / Bawah):</span>
                          <span className="font-mono text-amber-800">{syahadahTopOffset}px</span>
                        </div>
                        <input
                          type="range"
                          min={-120}
                          max={200}
                          step={2}
                          value={syahadahTopOffset}
                          onChange={e =>
                            handleSaveOverlaySettings(syahadahOverlayMode, Number(e.target.value))
                          }
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-0.5">
                          <span>Margin Samping Kiri–Kanan:</span>
                          <span className="font-mono text-amber-800">{syahadahSidePadding}px</span>
                        </div>
                        <input
                          type="range"
                          min={24}
                          max={140}
                          step={4}
                          value={syahadahSidePadding}
                          onChange={e => setSyahadahSidePadding(Number(e.target.value))}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRINTABLE A4 LANDSCAPE CERTIFICATE (SYAHADAH JUZIYYAH 2 BAHASA / SERTIFIKAT) */}
          {currentParticipant && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-8 flex justify-center overflow-x-auto print:p-0 print:border-none print:shadow-none">
              {syahadahTemplateStyle === 'bilingual_syahadah' ? (
                /* ===================================================================== */
                /* FORMAT SYAHADAH JUZIYYAH LANDSCAPE (SESUAI GAMBAR SYAHADAH 2025 FIX)  */
                /* ===================================================================== */
                <div
                  ref={certificateRef}
                  className="printable-report-area w-full max-w-[1080px] bg-white text-slate-950 relative overflow-hidden shadow-xs"
                  style={{
                    fontFamily: "Arial, Helvetica, sans-serif",
                    aspectRatio: '297 / 210'
                  }}
                >
                  {/* Background Layer: Either Uploaded Image OR Exact Vector Wave Replica of Syahadah 2025 FIX */}
                  {syahadahTemplateUrl ? (
                    <img
                      src={syahadahTemplateUrl}
                      alt="Template Syahadah Juziyyah"
                      className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
                    />
                  ) : (
                    <Syahadah2025WaveBackground />
                  )}

                  {(() => {
                    const displayStudentName =
                      customStudentName.trim() || currentParticipant.studentName;
                    const displayJuzRaw =
                      customJuzText.trim() || currentParticipant.jilidOrJuz || 'Juz 30';
                    const juzFormatted = formatJuzForSyahadah(displayJuzRaw);
                    const targetDate =
                      currentParticipant.evaluatedAt ||
                      submission.scheduledDate ||
                      submission.submissionDate;
                    const hijriArab =
                      customHijriArab.trim() || formatHijriDateArabic(targetDate);
                    const masehiIndo = formatIndoDate(targetDate);

                    /* ================================================================= */
                    /* MODE 1: HANYA ISI TITIK-TITIK DI ATAS GAMBAR SYAHADAH 2025 FIX    */
                    /* ================================================================= */
                    if (syahadahTemplateUrl && syahadahOverlayMode === 'data_only') {
                      return (
                        <div
                          className="relative z-10 w-full h-full"
                          style={{
                            transform: syahadahTopOffset
                              ? `translateY(${syahadahTopOffset}px)`
                              : undefined
                          }}
                        >
                          {/* 1. Left Student Name (above dotted line under "menyatakan bahwasannya murid :") */}
                          <div
                            className="absolute font-extrabold text-slate-950 text-sm sm:text-base md:text-[17px] tracking-wide"
                            style={{
                              top: '55.2%',
                              left: '3.1%',
                              width: '40%'
                            }}
                          >
                            {displayStudentName}
                          </div>

                          {/* 2. Left Juz Number (on "Telah menghafalkan : Juz ..... dari Al Qur'anil Karim") */}
                          <div
                            className="absolute font-extrabold text-slate-950 text-xs sm:text-sm md:text-[15px] text-center bg-white/80 px-1 rounded-xs"
                            style={{
                              top: '59.8%',
                              left: '18.6%',
                              minWidth: '3.8%'
                            }}
                          >
                            {juzFormatted.juzNumberIndo}
                          </div>

                          {/* 3. Left Date (on "Sukoharjo, ..........................") */}
                          <div
                            className="absolute font-semibold text-slate-950 text-[11px] sm:text-xs md:text-[13px] bg-white/80 px-1"
                            style={{
                              top: '76.8%',
                              left: '9.6%'
                            }}
                          >
                            {masehiIndo}
                          </div>

                          {/* 4. Right Student Name (above dotted line under "بأن الطالب/الطالبة:") */}
                          <div
                            className="absolute font-extrabold text-slate-950 text-sm sm:text-base md:text-[17px] text-right"
                            style={{
                              top: '57.6%',
                              right: '2.6%',
                              width: '38%'
                            }}
                          >
                            {displayStudentName}
                          </div>

                          {/* 5. Right Juz Number (on "قد حفظ : الجزء ..... من القرآن الكريم") */}
                          <div
                            dir="rtl"
                            className="absolute font-extrabold text-slate-950 text-sm sm:text-base md:text-[17px] text-center bg-white/80 px-1 rounded-xs"
                            style={{
                              top: '63.8%',
                              right: '11.0%',
                              minWidth: '3.8%',
                              fontFamily: "'Traditional Arabic', 'Amiri', serif"
                            }}
                          >
                            {juzFormatted.juzNumberArabic}
                          </div>

                          {/* 6. Right Date (on "سوكاهارجو, ..........................") */}
                          <div
                            dir="rtl"
                            className="absolute font-bold text-slate-950 text-xs sm:text-sm md:text-[14px] bg-white/80 px-1"
                            style={{
                              top: '76.8%',
                              right: '7.2%',
                              fontFamily: "'Traditional Arabic', 'Amiri', serif"
                            }}
                          >
                            {hijriArab}
                          </div>
                        </div>
                      );
                    }

                    /* ================================================================= */
                    /* MODE 2: REPLIKA LENGKAP LANDSCAPE PERSIS SYAHADAH 2025 FIX        */
                    /* ================================================================= */
                    const showTopHeaderAndLogos = !(
                      syahadahTemplateUrl && hideBuiltInHeaderOnImage
                    );

                    return (
                      <div
                        className="relative z-10 w-full h-full flex flex-col justify-between py-4 sm:py-6"
                        style={{
                          paddingLeft: `${syahadahSidePadding ? Math.max(24, syahadahSidePadding - 20) : 32}px`,
                          paddingRight: `${syahadahSidePadding ? Math.max(24, syahadahSidePadding - 20) : 32}px`,
                          transform: syahadahTopOffset
                            ? `translateY(${syahadahTopOffset}px)`
                            : undefined
                        }}
                      >
                        {/* TOP SECTION: TWO LOGOS + شهادة + Tahfizhul Qur'an + AYAH & HADITH */}
                        {showTopHeaderAndLogos ? (
                          <div className="text-center space-y-1">
                            {/* Dual Circular Logos Centered at Top */}
                            <div className="flex items-center justify-center gap-3 sm:gap-4 pt-0.5">
                              <YktnCircularEmblem size={88} />
                              <DirektoratAlAzharSoloBaruEmblem
                                customUrl={settings.customLogoUrl}
                                size={88}
                              />
                            </div>

                            {/* Golden Arabic Title: شهادة */}
                            <div className="pt-1">
                              <p
                                className="text-5xl sm:text-6xl font-bold leading-none select-none"
                                style={{
                                  color: '#C9A449',
                                  fontFamily: "'Traditional Arabic', 'Amiri', 'Scheherazade New', serif",
                                  textShadow: '0 1px 1px rgba(0,0,0,0.08)'
                                }}
                              >
                                شهادة
                              </p>
                            </div>

                            {/* Subtitle: Tahfizhul Qur'an */}
                            <h1
                              className="text-2xl sm:text-[28px] italic font-normal text-slate-950 tracking-wide pt-0.5"
                              style={{
                                fontFamily:
                                  "'Lucida Calligraphy', 'Monotype Corsiva', 'Apple Chancery', 'Georgia', serif"
                              }}
                            >
                              Tahfizhul Qur&apos;an
                            </h1>

                            {/* Two Lines of Arabic Qur'an Verse & Hadith */}
                            <div
                              dir="rtl"
                              className="pt-1 space-y-0.5 text-slate-950"
                              style={{ fontFamily: "'Traditional Arabic', 'Amiri', serif" }}
                            >
                              <p className="text-base sm:text-[19px] font-bold leading-snug">
                                قال الله ﷻ : وَرَتِّلِ الْقُرْآنَ تَرْتِيلاً{' '}
                                <span className="text-xs sm:text-sm font-normal">
                                  (سورة المزّمّل: ٥)
                                </span>
                              </p>
                              <p className="text-xs sm:text-[14px] font-semibold leading-snug">
                                قال النبي ﷺ : خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ{' '}
                                <span className="text-[11px] font-normal">(رواه البخاري)</span>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="h-48 sm:h-56" />
                        )}

                        {/* MIDDLE SECTION: TWO COLUMNS (LEFT INDONESIAN | RIGHT ARABIC) */}
                        <div className="grid grid-cols-2 gap-6 sm:gap-10 items-start pt-1">
                          {/* LEFT COLUMN: INDONESIAN (Left-Aligned) */}
                          <div className="text-left text-[11.5px] sm:text-[13px] leading-[1.48] text-slate-950 space-y-1.5">
                            <div className="font-bold text-[12.5px] sm:text-[14px] leading-snug">
                              <p>Direktorat Pendidikan Sekolah Islam Al Azhar Solo Baru</p>
                              <p>menyatakan bahwasannya murid :</p>
                            </div>

                            {/* Student Name on Dotted Line */}
                            <div className="pt-2 pb-1">
                              <div className="inline-block min-w-[250px] sm:min-w-[310px] border-b-2 border-dotted border-slate-900 pb-0.5">
                                <span className="font-extrabold text-sm sm:text-[16px] text-slate-950 tracking-wide">
                                  {displayStudentName}
                                </span>
                              </div>
                            </div>

                            {/* Telah menghafalkan : Juz ..... dari Al Qur'anil Karim */}
                            <p className="font-bold text-[12.5px] sm:text-[14px] pt-0.5">
                              Telah menghafalkan : Juz{' '}
                              <span className="inline-block border-b-2 border-dotted border-slate-900 px-2 font-black text-slate-950">
                                {juzFormatted.juzNumberIndo}
                              </span>{' '}
                              dari Al Qur&apos;anil Karim
                            </p>

                            {/* Closing Indonesian Paragraph */}
                            <div className="text-[11px] sm:text-[12.5px] leading-[1.45] text-slate-900 space-y-0.5">
                              <p>
                                maka Direktorat Pendidikan Sekolah Islam Al Azhar Solo Baru
                                memutuskan
                              </p>
                              <p>dan menyerahkan syahadah ini kepada yang bersangkutan</p>
                              <p>
                                Kami berharap ananda selalu bertaqwa kepada Allah dan berkomitmen
                                kepada
                              </p>
                              <p>
                                Al Qur&apos;an untuk selalu membacanya sepanjang malam dan ujung
                                siang
                              </p>
                              <p>
                                serta mengamalkan Al Qur&apos;an dan mengajarkannya kepada yang
                                lainnya
                              </p>
                              <p>
                                hanya semata-mata mencari ridho Allah{' '}
                                <em className="italic">Subhanahu Wa Ta&apos;ala.</em>
                              </p>
                            </div>
                          </div>

                          {/* RIGHT COLUMN: ARABIC (Right-Aligned, RTL) */}
                          <div
                            dir="rtl"
                            className="text-right text-slate-950 space-y-1.5"
                            style={{
                              fontFamily: "'Traditional Arabic', 'Amiri', 'Scheherazade New', serif"
                            }}
                          >
                            <div className="leading-snug">
                              <p className="text-lg sm:text-[22px] font-semibold">
                                فتشهد مديرية التعليم الأزهر صولوبارو
                              </p>
                              <p className="text-sm sm:text-[16px] font-semibold">
                                بأنّ الطالب/الطالبة:
                              </p>
                            </div>

                            {/* Student Name on Dotted Line (Right-Aligned) */}
                            <div className="pt-2 pb-1 text-right" dir="ltr">
                              <div className="inline-block min-w-[230px] sm:min-w-[280px] border-b-2 border-dotted border-slate-900 pb-0.5 text-right">
                                <span
                                  className="font-extrabold text-sm sm:text-[16px] text-slate-950 tracking-wide"
                                  style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
                                >
                                  {displayStudentName}
                                </span>
                              </div>
                            </div>

                            {/* قد حفظ : الجزء ..... من القرآن الكريم */}
                            <p className="font-bold text-base sm:text-[19px] pt-0.5">
                              قد حفظ : الجزء{' '}
                              <span className="inline-block border-b-2 border-dotted border-slate-900 px-2 font-extrabold text-slate-950">
                                {juzFormatted.juzNumberArabic}
                              </span>{' '}
                              من القرآن الكريم
                            </p>

                            {/* Closing Arabic Paragraph */}
                            <div className="text-sm sm:text-[16px] leading-[1.55] text-slate-900 font-medium space-y-0.5">
                              <p>
                                وبناءا على ذالك قررت مديرية التعليم الأزهر صولوبارو ومنحته هذه
                                الشهادة
                              </p>
                              <p>
                                و أوصته بتقوى الله عز و جل و تعاهد القرآن الكريم بتلاوته آناء الليل
                                و أطراف النهار
                              </p>
                              <p>و عمله و تعليمه غيره ابتغاء وجه الله سبحانه وتعالى.</p>
                            </div>
                          </div>
                        </div>

                        {/* BOTTOM SECTION: DATES (LEFT & RIGHT) + SIGNATURES (YKTN & DIREKTORAT AL AZHAR) */}
                        <div className="pt-1 space-y-1">
                          {/* Date Row */}
                          <div className="flex items-center justify-between text-xs sm:text-[13px] text-slate-950 px-2">
                            <div>
                              <span>Sukoharjo, </span>
                              <span className="border-b border-dotted border-slate-800 pb-0.5 px-2 font-semibold">
                                {masehiIndo}
                              </span>
                            </div>
                            <div
                              dir="rtl"
                              style={{ fontFamily: "'Traditional Arabic', 'Amiri', serif" }}
                              className="text-sm sm:text-[15px]"
                            >
                              <span>سوكاهارجو، </span>
                              <span className="border-b border-dotted border-slate-800 pb-0.5 px-2 font-bold">
                                {hijriArab}
                              </span>
                            </div>
                          </div>

                          {/* Signatures Row */}
                          <div className="grid grid-cols-2 gap-8 text-center pt-0.5 pb-2">
                            {/* Left Signature: Yayasan Karantina Tahfizh Nasional */}
                            <div className="flex flex-col items-center">
                              <p className="font-bold text-xs sm:text-[14px] text-slate-950">
                                Yayasan Karantina Tahfizh Nasional
                              </p>
                              <div className="h-12 sm:h-14 flex items-center justify-center my-0.5">
                                <MudirYktnSignatureSvg className="h-12 sm:h-14" />
                              </div>
                              <p className="font-bold text-xs sm:text-[13px] underline text-slate-950 leading-tight">
                                {customLeftSignerName}
                              </p>
                              <p className="font-bold text-[10px] sm:text-[11px] text-slate-900 leading-tight">
                                {customLeftSignerRole}
                              </p>
                            </div>

                            {/* Right Signature: Direktorat Pendidikan Al Azhar Solo Baru */}
                            <div className="flex flex-col items-center">
                              <p className="font-bold text-xs sm:text-[14px] text-slate-950">
                                Direktorat Pendidikan Al Azhar Solo Baru
                              </p>
                              <div className="h-12 sm:h-14 flex items-center justify-center my-0.5">
                                {settings.headmasterSignatureUrl ? (
                                  <img
                                    src={settings.headmasterSignatureUrl}
                                    alt="TTD Direktur"
                                    className="h-12 sm:h-14 object-contain"
                                  />
                                ) : (
                                  <DirekturAlAzharSignatureSvg className="h-12 sm:h-14" />
                                )}
                              </div>
                              <p className="font-bold text-xs sm:text-[13px] underline text-slate-950 leading-tight">
                                {customRightSignerName}
                              </p>
                              <p className="font-bold text-[10px] sm:text-[11px] text-slate-900 leading-tight">
                                {customRightSignerRole}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* ===================================================================== */
                /* FORMAT SERTIFIKAT + TABEL RINCIAN NILAI (KENAIKAN JILID / MUNAQOSYAH) */
                /* ===================================================================== */
                <div
                  ref={certificateRef}
                  className="printable-report-area w-full max-w-[980px] bg-[#FFFDF7] text-slate-950 relative p-3 sm:p-4"
                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                >
                  {/* Outer Royal Navy & Gold Double Frame */}
                  <div className="border-[6px] border-[#1E293B] p-1.5 bg-[#FFFDF7]">
                    <div className="border-2 border-[#D4AF37] p-5 sm:p-8 relative space-y-4">
                      {/* Corner Ornaments */}
                      <div className="w-5 h-5 border-t-4 border-l-4 border-[#D4AF37] absolute top-2 left-2" />
                      <div className="w-5 h-5 border-t-4 border-r-4 border-[#D4AF37] absolute top-2 right-2" />
                      <div className="w-5 h-5 border-b-4 border-l-4 border-[#D4AF37] absolute bottom-2 left-2" />
                      <div className="w-5 h-5 border-b-4 border-r-4 border-[#D4AF37] absolute bottom-2 right-2" />

                      {/* Top Header: Institution & Bismillah */}
                      <div className="text-center space-y-1">
                        <p
                          className="text-xl sm:text-2xl font-bold text-[#1E293B]"
                          style={{ fontFamily: "'Traditional Arabic', 'Amiri', serif" }}
                        >
                          بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
                        </p>
                        <p className="text-[11px] sm:text-xs font-sans font-extrabold uppercase tracking-[0.2em] text-emerald-900">
                          YAYASAN PESANTREN ISLAM AL AZHAR · PROGRAM TAHFIZH AL-QUR&apos;AN & METODE UMMI
                        </p>
                        <h2 className="text-base sm:text-lg font-sans font-black uppercase tracking-wider text-[#1E293B]">
                          {settings.schoolName || 'SMP ISLAM AL AZHAR 21 SOLO BARU'}
                        </h2>
                      </div>

                      {/* Certificate Title Block */}
                      <div className="text-center space-y-1 pt-1">
                        <p
                          className="text-lg sm:text-xl font-bold text-[#8C7015]"
                          style={{ fontFamily: "'Traditional Arabic', 'Amiri', serif" }}
                        >
                          {certArabicTitle}
                        </p>
                        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-[#1E293B] border-b-2 border-[#D4AF37] inline-block pb-1 px-6">
                          {certHeaderTitle}
                        </h1>
                        <p className="text-xs font-sans font-semibold text-slate-600 block pt-0.5">
                          Nomor:{' '}
                          {currentParticipant.certificateNumber ||
                            buildDefaultCertificateNumber(
                              category,
                              selectedParticipantIndex,
                              submission.scheduledDate || submission.submissionDate
                            )}
                        </p>
                      </div>

                      {/* Recipient Name & Achievement Statement */}
                      <div className="text-center space-y-2 py-1">
                        <p className="text-xs sm:text-sm italic text-slate-700">
                          Alhamdulillahirabbil&apos;alamin, Sertifikat Kelulusan ini diberikan kepada ananda:
                        </p>
                        <div className="py-1">
                          <h3 className="text-2xl sm:text-3xl font-black text-[#1E293B] tracking-wide underline decoration-[#D4AF37] decoration-2 underline-offset-8">
                            {currentParticipant.studentName}
                          </h3>
                          <p className="text-xs font-sans font-bold text-slate-700 mt-2">
                            NIS: {currentParticipant.studentNis || '-'} &nbsp;·&nbsp; Kelas:{' '}
                            {currentParticipant.className} &nbsp;·&nbsp; Tahun Ajaran:{' '}
                            {settings.academicYear}
                          </p>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-800 max-w-2xl mx-auto leading-relaxed font-sans">
                          Telah mengikuti dan dinyatakan{' '}
                          <strong className="text-emerald-800 uppercase">
                            {currentParticipant.resultStatus === 'Belum Lulus'
                              ? 'TELAH MENGIKUTI'
                              : 'LULUS'}
                          </strong>{' '}
                          dalam pelaksanaan{' '}
                          <strong className="text-slate-950">
                            {category === 'kenaikan_jilid'
                              ? `Ujian Kenaikan Jilid Metode Ummi (${currentParticipant.jilidOrJuz})`
                              : category === 'munaqosyah'
                              ? `Ujian Munaqosyah Al-Qur'an & Metode Ummi (${currentParticipant.jilidOrJuz})`
                              : `Ujian Tasmi' Hafalan Al-Qur'an Juziyyah (${currentParticipant.jilidOrJuz})`}
                          </strong>
                          {category === 'kenaikan_jilid' && (
                            <>
                              {' '}
                              dan berhak naik ke tingkat{' '}
                              <strong className="text-[#8C7015] underline">
                                {currentParticipant.promotedToJilid ||
                                  suggestNextUmmiJilid(currentParticipant.jilidOrJuz)}
                              </strong>
                            </>
                          )}{' '}
                          dengan rincian perolehan nilai sebagai berikut:
                        </p>
                      </div>

                      {/* Score Breakdown Table Embedded Inside Certificate */}
                      <div className="max-w-2xl mx-auto font-sans">
                        <table className="w-full border border-[#1E293B] border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#1E293B] text-white font-bold text-center">
                              {aspects.map(asp => (
                                <th
                                  key={asp.key}
                                  className="py-1.5 px-2 border-r border-slate-600 text-[11px]"
                                >
                                  {asp.shortLabel}
                                </th>
                              ))}
                              <th className="py-1.5 px-2.5 border-r border-slate-600 text-[#D4AF37]">
                                Nilai Rata-rata
                              </th>
                              <th className="py-1.5 px-2.5 border-r border-slate-600">Nilai Huruf</th>
                              <th className="py-1.5 px-3 text-[#D4AF37]">Predikat Kelulusan</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white text-center font-bold text-slate-900 border-t border-[#1E293B]">
                              <td className="py-2 px-2 border-r border-slate-300 font-mono">
                                {currentParticipant.scoreDetails?.aspect1 ?? 90}
                              </td>
                              <td className="py-2 px-2 border-r border-slate-300 font-mono">
                                {currentParticipant.scoreDetails?.aspect2 ?? 90}
                              </td>
                              <td className="py-2 px-2 border-r border-slate-300 font-mono">
                                {currentParticipant.scoreDetails?.aspect3 ?? 90}
                              </td>
                              {aspects.length === 4 && (
                                <td className="py-2 px-2 border-r border-slate-300 font-mono">
                                  {currentParticipant.scoreDetails?.aspect4 ?? 92}
                                </td>
                              )}
                              <td className="py-2 px-2.5 border-r border-slate-300 font-mono text-sm font-black text-[#1E293B]">
                                {currentParticipant.score ?? 90}
                              </td>
                              <td className="py-2 px-2.5 border-r border-slate-300 font-black text-sm">
                                {currentParticipant.gradeLetter || 'A'}
                              </td>
                              <td className="py-2 px-3 text-emerald-900 font-extrabold">
                                {currentParticipant.predicate || 'MUMTAZ (Istimewa)'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Prayer Quote */}
                      <p className="text-center text-[11px] italic text-slate-600 pt-1">
                        &ldquo;Semoga Allah Ta&apos;ala senantiasa memberkahi ananda menjadi generasi Ahlul
                        Qur&apos;an yang berakhlak mulia.&rdquo;
                      </p>

                      {/* Two-Column Proportional Official Signature Footer (Kepala Sekolah & Koordinator) */}
                      <div className="pt-4 pb-1 max-w-3xl mx-auto grid grid-cols-2 gap-8 sm:gap-16 text-center font-sans text-xs">
                        {/* Left: Kepala Sekolah */}
                        <div className="flex flex-col items-center justify-between">
                          <div className="space-y-0.5">
                            <p className="text-[11px] text-slate-600">Mengetahui,</p>
                            <p className="font-bold text-slate-900">
                              Kepala SMPI Al Azhar 21 Solo Baru
                            </p>
                          </div>
                          <div className="h-16 flex items-center justify-center my-1.5">
                            {settings.headmasterSignatureUrl && (
                              <img
                                src={settings.headmasterSignatureUrl}
                                alt="TTD Kepala Sekolah"
                                className="h-14 w-auto max-w-[180px] object-contain mx-auto"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-bold underline text-slate-950 text-xs sm:text-[13px]">
                              {headmasterName}
                            </p>
                            <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                              NIK. {headmasterNik}
                            </p>
                          </div>
                        </div>

                        {/* Right: Koordinator Tahfizh & Metode Ummi */}
                        <div className="flex flex-col items-center justify-between">
                          <div className="space-y-0.5">
                            <p className="text-[11px] text-slate-600">
                              Sukoharjo,{' '}
                              {formatIndoDate(
                                currentParticipant.evaluatedAt ||
                                  submission.scheduledDate ||
                                  submission.submissionDate
                              )}
                            </p>
                            <p className="font-bold text-slate-900">
                              Koordinator Tahfizh & Metode Ummi
                            </p>
                          </div>
                          <div className="h-16 flex items-center justify-center my-1.5">
                            {settings.tahfizhCoordinatorSignatureUrl && (
                              <img
                                src={settings.tahfizhCoordinatorSignatureUrl}
                                alt="TTD Koordinator"
                                className="h-14 w-auto max-w-[180px] object-contain mx-auto"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-bold underline text-slate-950 text-xs sm:text-[13px]">
                              {coordinatorName}
                            </p>
                            <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                              NIK. {coordinatorNik}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INPUT / EDIT NILAI PENGUJI PER SANTRI                               */}
      {/* ========================================================================= */}
      {gradingModalParticipantIdx !== null && submission.participants[gradingModalParticipantIdx] && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Input Nilai Penguji —{' '}
                  {submission.participants[gradingModalParticipantIdx].studentName}
                </h3>
                <p className="text-xs text-slate-500">
                  Kelas {submission.participants[gradingModalParticipantIdx].className} · Materi:{' '}
                  <strong>{submission.participants[gradingModalParticipantIdx].jilidOrJuz}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGradingModalParticipantIdx(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveParticipantScore} className="space-y-3.5 text-xs">
              {/* Aspect Score Inputs */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block">
                  Komponen Nilai Penguji (Skala 0 – 100):
                </span>

                {aspects.map((asp, i) => {
                  const val = i === 0 ? asp1 : i === 1 ? asp2 : i === 2 ? asp3 : asp4;
                  const setVal =
                    i === 0 ? setAsp1 : i === 1 ? setAsp2 : i === 2 ? setAsp3 : setAsp4;
                  return (
                    <div
                      key={asp.key}
                      className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200"
                    >
                      <div className="min-w-0">
                        <label className="font-bold text-slate-800 block">
                          {i + 1}. {asp.label}
                        </label>
                        <span className="text-[10px] text-slate-500 block">{asp.description}</span>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        required
                        value={val}
                        onChange={e => setVal(Number(e.target.value))}
                        className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 text-center font-mono font-black text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                  );
                })}

                {/* Live Computed Summary */}
                <div className="p-3 rounded-lg bg-[#1E293B] text-white flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-300 block">
                      Nilai Rata-rata & Predikat Otomatis:
                    </span>
                    <span className="font-extrabold text-sm text-[#D4AF37]">
                      {liveAverage} ({liveEvaluation.gradeLetter}) — {liveEvaluation.predicate}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-extrabold ${
                      liveEvaluation.resultStatus === 'Lulus'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {liveEvaluation.resultStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Promotion Target Jilid (Specifically for Kenaikan Jilid UMMI) */}
              {category === 'kenaikan_jilid' && (
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <label className="block font-bold text-emerald-950">
                    Naik ke Jilid / Tingkat Berikutnya:
                  </label>
                  <select
                    value={promotedToJilid}
                    onChange={e => setPromotedToJilid(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-300 font-bold text-slate-900"
                  >
                    {['Pra-TK', ...UMMI_JILIDS].map(j => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-[11px] text-emerald-900 font-semibold cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={autoUpdateStudentJilid}
                      onChange={e => setAutoUpdateStudentJilid(e.target.checked)}
                      className="rounded border-emerald-400"
                    />
                    <span>
                      Otomatis perbarui status Jilid Ummi santri menjadi{' '}
                      <strong>{promotedToJilid}</strong> jika Lulus
                    </span>
                  </label>
                </div>
              )}

              {/* Examiner Name & Certificate Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Ustadz / Ustadzah Penguji:
                  </label>
                  {category === 'kenaikan_jilid' ? (
                    <div className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-300 font-bold text-slate-800 flex items-center justify-between gap-2">
                      <span className="truncate">{coordinatorName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold shrink-0">
                        Koordinator
                      </span>
                    </div>
                  ) : (
                    <select
                      required
                      value={examinerNameInput}
                      onChange={e => setExaminerNameInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 font-semibold text-slate-900 cursor-pointer"
                    >
                      {!allExaminerTeachers.includes(examinerNameInput) && examinerNameInput && (
                        <option value={examinerNameInput}>{examinerNameInput}</option>
                      )}
                      {allExaminerTeachers.map(tName => (
                        <option key={tName} value={tName}>
                          {tName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Sertifikat (Syahadah):
                  </label>
                  <input
                    type="text"
                    value={certNumberInput}
                    onChange={e => setCertNumberInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Examiner Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Evaluasi Penguji:
                </label>
                <textarea
                  rows={2}
                  value={examinerNotesInput}
                  onChange={e => setExaminerNotesInput(e.target.value)}
                  placeholder="Catatan evaluasi bacaan / hafalan oleh penguji..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setGradingModalParticipantIdx(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Simpan Nilai & Terbitkan Sertifikat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
