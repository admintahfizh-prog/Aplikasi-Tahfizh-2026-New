import React, { useState, useMemo, useRef } from 'react';
import {
  Award,
  FileText,
  Calendar,
  Plus,
  Trash2,
  Printer,
  Download,
  Send,
  Copy,
  CheckCircle2,
  Clock,
  Users,
  Search,
  Sparkles,
  BookOpen,
  BookMarked,
  ChevronDown,
  ChevronRight,
  Edit3,
  MessageCircle,
  X,
  UserCheck,
  AlertCircle,
  Loader2,
  Check,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import {
  Student,
  Teacher,
  ClassItem,
  AppSettings,
  Role,
  User,
  ExamCategory,
  ExamSubmission,
  ExamParticipantItem
} from '../types';
import { storageService } from '../services/storageService';
import { UMMI_JILIDS } from '../data/ummiData';
import { ExamScoringAndCertificate } from './ExamScoringAndCertificate';
import {
  buildDefaultParentLetterNumber,
  compressUploadedImage,
  formatHijriDateIndo
} from './OfficialLetterheadEmblems';

interface ExamManagementViewProps {
  activeExamCategory?: ExamCategory;
  onChangeExamCategory?: (cat: ExamCategory) => void;
  students: Student[];
  teachers: Teacher[];
  classes: ClassItem[];
  settings: AppSettings;
  userRole: Role;
  currentUser?: User | null;
  onRefreshData: () => void;
}

const EXAM_CATEGORY_CONFIG: Record<
  ExamCategory,
  {
    title: string;
    shortTitle: string;
    subtitle: string;
    formHeaderTitle: string;
    letterExamName: string;
    columnLabel: string;
    options: string[];
    badgeColor: string;
  }
> = {
  kenaikan_jilid: {
    title: 'Ujian Kenaikan Jilid UMMI',
    shortTitle: 'Kenaikan Jilid UMMI',
    subtitle: 'Pengajuan tes kenaikan jilid Metode Ummi dari Musyrif Halaqah ke Koordinator Tahfizh & Surat Undangan Wali Murid',
    formHeaderTitle: 'FORMULIR PENGAJUAN TES KENAIKAN JILID',
    letterExamName: 'ujian kenaikan jilid',
    columnLabel: 'Jilid',
    options: ['Pra-TK', ...UMMI_JILIDS],
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  munaqosyah: {
    title: 'Ujian Munaqosyah',
    shortTitle: 'Ujian Munaqosyah',
    subtitle: 'Pengajuan ujian Munaqosyah Tartil / Tahfizh dari Musyrif Halaqah ke Koordinator Tahfizh & Surat Undangan Wali Murid',
    formHeaderTitle: 'FORMULIR PENGAJUAN UJIAN MUNAQOSYAH',
    letterExamName: 'ujian munaqosyah',
    columnLabel: 'Jilid / Materi',
    options: [
      'Pra-Munaqosyah Tartil & Gharib',
      'Munaqosyah Tartil Al-Qur\'an (Gharib & Tajwid)',
      'Munaqosyah Tahfizh Juz 30',
      'Munaqosyah Tahfizh Juz 29',
      'Munaqosyah Tahfizh Juz 1',
      'Munaqosyah Khotmil Qur\'an'
    ],
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-200'
  },
  juziyyah: {
    title: 'Ujian Juziyyah',
    shortTitle: 'Ujian Juziyyah',
    subtitle: 'Pengajuan ujian tasmi\' Juziyyah sekali duduk dari Musyrif Halaqah ke Koordinator Tahfizh & Surat Undangan Wali Murid',
    formHeaderTitle: 'FORMULIR PENGAJUAN UJIAN JUZIYYAH',
    letterExamName: 'ujian juziyyah',
    columnLabel: 'Juz / Jilid',
    options: [
      'Juz 30 (Sekali Duduk)',
      'Juz 29 (Sekali Duduk)',
      'Juz 28 (Sekali Duduk)',
      'Juz 1 (Sekali Duduk)',
      'Juz 2 (Sekali Duduk)',
      'Juz 3 (Sekali Duduk)',
      'Juz 4 (Sekali Duduk)',
      'Juz 5 (Sekali Duduk)',
      '2 Juz Sekali Duduk',
      '3 Juz Sekali Duduk',
      '5 Juz Sekali Duduk'
    ],
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200'
  }
};

function getIndonesianDayName(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('id-ID', { weekday: 'long' });
  } catch {
    return '';
  }
}

function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '';
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

function formatDayAndDate(dateStr: string): string {
  if (!dateStr) return '...............................................................';
  const day = getIndonesianDayName(dateStr);
  const formatted = formatIndonesianDate(dateStr);
  return day ? `${day}, ${formatted}` : formatted;
}

function normalizePhoneForWA(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('62')) return digits;
  return '62' + digits;
}

export const ExamManagementView: React.FC<ExamManagementViewProps> = ({
  activeExamCategory = 'kenaikan_jilid',
  onChangeExamCategory,
  students,
  teachers,
  classes,
  settings,
  userRole,
  currentUser,
  onRefreshData
}) => {
  const isWali = userRole === 'wali';
  const [category, setCategory] = useState<ExamCategory>(activeExamCategory);

  React.useEffect(() => {
    setCategory(activeExamCategory);
  }, [activeExamCategory]);

  const handleSelectCategory = (cat: ExamCategory) => {
    setCategory(cat);
    if (onChangeExamCategory) onChangeExamCategory(cat);
  };

  const config = EXAM_CATEGORY_CONFIG[category];

  // Coordinator resolution matching data
  const yusrieTeacher = teachers.find(t => (t.name || '').toLowerCase().includes('yusrie'));
  const coordinatorName =
    settings.tahfizhCoordinator &&
    !settings.tahfizhCoordinator.toLowerCase().includes('fauzan') &&
    !settings.tahfizhCoordinator.toLowerCase().includes('sekar')
      ? settings.tahfizhCoordinator
      : yusrieTeacher?.name || 'Ustadz Muhammad Yusrie Alfian, S.Ag.';
  const coordinatorNik =
    settings.tahfizhCoordinatorNik && settings.tahfizhCoordinatorNik !== '02.0367'
      ? settings.tahfizhCoordinatorNik
      : yusrieTeacher?.nip || '04.0413';

  // Load submissions
  const [submissions, setSubmissions] = useState<ExamSubmission[]>(() =>
    storageService.getExamSubmissions()
  );

  const reloadSubmissions = () => {
    setSubmissions(storageService.getExamSubmissions());
    onRefreshData();
  };

  React.useEffect(() => {
    setSubmissions(storageService.getExamSubmissions());
  }, [students, category]);

  // Filter submissions for current category (and student filter if Wali)
  const categorySubmissions = useMemo(() => {
    const allowedIds = new Set(students.map(s => s.id));
    return submissions
      .filter(sub => sub.category === category)
      .filter(sub => {
        if (!isWali) return true;
        return sub.participants.some(p => allowedIds.has(p.studentId));
      });
  }, [submissions, category, isWali, students]);

  // Selected submission to inspect Form 1 (Formulir Pengajuan Musyrif) & Form 2 (Surat Pemberitahuan Wali)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('');
  const selectedSubmission = useMemo(() => {
    return (
      categorySubmissions.find(s => s.id === selectedSubmissionId) ||
      categorySubmissions[0] ||
      null
    );
  }, [categorySubmissions, selectedSubmissionId]);

  React.useEffect(() => {
    if (categorySubmissions.length > 0 && !categorySubmissions.some(s => s.id === selectedSubmissionId)) {
      setSelectedSubmissionId(categorySubmissions[0].id);
    }
  }, [categorySubmissions, selectedSubmissionId]);

  // Active document tab inside selected submission:
  // 'form_pengajuan' = Gambar 1 (Formulir Pengajuan Tes Kenaikan Jilid dari Musyrif)
  // 'surat_wali' = Gambar 2 (Surat Undangan Pemberitahuan Wali Murid + PDF + BC WA)
  // 'penilaian_penguji' = Format Penilaian & Input Nilai oleh Penguji
  // 'sertifikat' = Sertifikat Naik Jilid / Munaqosyah / Juziyyah
  const [activeDocTab, setActiveDocTab] = useState<
    'form_pengajuan' | 'surat_wali' | 'penilaian_penguji' | 'sertifikat'
  >('form_pengajuan');

  // Selected participant inside Surat Wali preview
  const [selectedParticipantIndex, setSelectedParticipantIndex] = useState<number>(0);

  React.useEffect(() => {
    setSelectedParticipantIndex(0);
    if (isWali) {
      setActiveDocTab('surat_wali');
    }
  }, [selectedSubmission?.id, isWali]);

  // Refs for PDF download / Print
  const form1PrintRef = useRef<HTMLDivElement>(null);
  const form2PrintRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedWaText, setCopiedWaText] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ============================================================================
  // MODAL 1: FORM PENGAJUAN DARI MUSYRIF HALAQAH (CREATE / EDIT SUBMISSION)
  // ============================================================================
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [formSubmissionDate, setFormSubmissionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [formTeacherId, setFormTeacherId] = useState<string>(
    currentUser?.teacherId || teachers[0]?.id || ''
  );
  const [formHalaqahName, setFormHalaqahName] = useState<string>('');
  const [filterClassIdForPicker, setFilterClassIdForPicker] = useState<string>('');
  const [pickerStudentId, setPickerStudentId] = useState<string>('');
  const [pickerJilidOrJuz, setPickerJilidOrJuz] = useState<string>(config.options[0] || 'Jilid 1');
  const [formParticipants, setFormParticipants] = useState<ExamParticipantItem[]>([]);

  const filteredPickerStudents = useMemo(() => {
    if (!filterClassIdForPicker) return [];
    return students
      .filter(s => s.classId === filterClassIdForPicker)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, filterClassIdForPicker]);

  const handleOpenCreateModal = (existing?: ExamSubmission) => {
    if (existing) {
      setEditingSubmissionId(existing.id);
      setFormSubmissionDate(existing.submissionDate);
      setFormTeacherId(existing.teacherId);
      setFormHalaqahName(existing.halaqahName || '');
      setFormParticipants([...existing.participants]);
      setFilterClassIdForPicker(existing.participants[0]?.classId || '');
      setPickerStudentId('');
      setPickerJilidOrJuz(existing.participants[0]?.jilidOrJuz || config.options[0] || 'Jilid 1');
    } else {
      setEditingSubmissionId(null);
      setFormSubmissionDate(new Date().toISOString().split('T')[0]);
      setFormTeacherId(currentUser?.teacherId || teachers[0]?.id || '');
      setFormHalaqahName('');
      setFormParticipants([]);
      setFilterClassIdForPicker('');
      setPickerStudentId('');
      setPickerJilidOrJuz(config.options[0] || 'Jilid 1');
    }
    setIsCreateModalOpen(true);
  };

  const handleAddParticipantToForm = () => {
    if (!pickerStudentId) return;
    const std = students.find(s => s.id === pickerStudentId);
    if (!std) return;
    if (formParticipants.some(p => p.studentId === std.id)) {
      showToast(`Ananda ${std.name} sudah ada dalam daftar pengajuan ini.`);
      return;
    }
    const clsName = classes.find(c => c.id === std.classId)?.name || '7A';
    const defaultMaterial =
      category === 'kenaikan_jilid'
        ? pickerJilidOrJuz || (std.currentUmmiJilid && std.currentUmmiJilid !== '-' ? std.currentUmmiJilid : 'Jilid 1')
        : pickerJilidOrJuz || config.options[0];

    setFormParticipants(prev => [
      ...prev,
      {
        studentId: std.id,
        studentName: std.name,
        studentNis: std.nis,
        classId: std.classId,
        className: clsName,
        jilidOrJuz: defaultMaterial,
        parentName: std.parentName,
        parentPhone: std.parentPhone,
        resultStatus: 'Belum Diuji'
      }
    ]);
    setPickerStudentId('');
  };

  const handleRemoveParticipantFromForm = (studentId: string) => {
    setFormParticipants(prev => prev.filter(p => p.studentId !== studentId));
  };

  const handleUpdateParticipantJilid = (studentId: string, newVal: string) => {
    setFormParticipants(prev =>
      prev.map(p => (p.studentId === studentId ? { ...p, jilidOrJuz: newVal } : p))
    );
  };

  const handleSaveSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (formParticipants.length === 0) {
      showToast('Pilih dan tambahkan minimal 1 santri ke dalam daftar tabel pengajuan.');
      return;
    }
    const tch = teachers.find(t => t.id === formTeacherId);
    const existing = editingSubmissionId
      ? submissions.find(s => s.id === editingSubmissionId)
      : undefined;

    const newSubmission: ExamSubmission = {
      id: existing?.id || `exm-${category}-${Date.now()}`,
      category,
      submissionDate: formSubmissionDate,
      proposedDateText: formatDayAndDate(formSubmissionDate),
      teacherId: formTeacherId,
      teacherName: tch?.name || currentUser?.name || 'Ustadz / Ustadzah Pengampu',
      halaqahName: formHalaqahName.trim() || undefined,
      participants: formParticipants,
      status: existing?.status || 'Diajukan Musyrif',
      scheduledDay: existing?.scheduledDay,
      scheduledDate: existing?.scheduledDate,
      scheduledTime: existing?.scheduledTime,
      scheduledRoom: existing?.scheduledRoom,
      examinerName: existing?.examinerName,
      coordinatorName: existing?.coordinatorName || coordinatorName,
      coordinatorNotes: existing?.coordinatorNotes,
      createdAt: existing?.createdAt || new Date().toISOString()
    };

    storageService.saveExamSubmission(newSubmission);
    reloadSubmissions();
    setSelectedSubmissionId(newSubmission.id);
    setActiveDocTab('form_pengajuan');
    setIsCreateModalOpen(false);
    showToast(
      editingSubmissionId
        ? 'Formulir pengajuan ujian berhasil diperbarui!'
        : 'Formulir pengajuan ujian berhasil dikirim ke Koordinator Tahfizh!'
    );
  };

  // ============================================================================
  // MODAL 2: KONFIRMASI UJIAN OLEH KOORDINATOR TAHFIZH (HARI, TANGGAL, WAKTU & PENGUJI)
  // ============================================================================
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleTargetSubmission, setScheduleTargetSubmission] = useState<ExamSubmission | null>(null);
  const [schedDate, setSchedDate] = useState<string>('');
  const [schedDay, setSchedDay] = useState<string>('');
  const [schedTime, setSchedTime] = useState<string>('07.30 - 09.30 WIB');
  const [schedRoom, setSchedRoom] = useState<string>('Kampus SMP Islam Al Azhar 21 Solo Baru');
  const [schedExaminer, setSchedExaminer] = useState<string>(coordinatorName);
  const [schedLetterNumber, setSchedLetterNumber] = useState<string>('');
  const [schedHijriDate, setSchedHijriDate] = useState<string>('');
  const [schedStatus, setSchedStatus] = useState<'Diajukan Musyrif' | 'Terjadwal' | 'Selesai'>('Terjadwal');
  const [schedParticipantOverrides, setSchedParticipantOverrides] = useState<
    Record<string, { scheduledTime: string; examinerName: string }>
  >({});
  const [letterSignerRole, setLetterSignerRole] = useState<'kepsek' | 'koordinator'>('kepsek');
  const [letterHeaderUrl, setLetterHeaderUrl] = useState<string>(settings.letterHeaderUrl || '');
  const [letterFooterUrl, setLetterFooterUrl] = useState<string>(settings.letterFooterUrl || '');

  React.useEffect(() => {
    setLetterHeaderUrl(settings.letterHeaderUrl || '');
    setLetterFooterUrl(settings.letterFooterUrl || '');
  }, [settings.letterHeaderUrl, settings.letterFooterUrl]);

  const handleUploadLetterHeader = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressUploadedImage(file, 1400, 420, 0.9);
      setLetterHeaderUrl(compressed);
      const current = storageService.getSettings();
      storageService.saveSettings({ ...current, letterHeaderUrl: compressed });
      onRefreshData();
      showToast('Gambar Kop Surat (Header) berhasil diunggah & disimpan!');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunggah gambar Kop Surat.');
    }
  };

  const handleRemoveLetterHeader = () => {
    setLetterHeaderUrl('');
    const current = storageService.getSettings();
    storageService.saveSettings({ ...current, letterHeaderUrl: '' });
    onRefreshData();
    showToast('Gambar Kop Surat (Header) dihapus.');
  };

  const handleUploadLetterFooter = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressUploadedImage(file, 1400, 240, 0.9);
      setLetterFooterUrl(compressed);
      const current = storageService.getSettings();
      storageService.saveSettings({ ...current, letterFooterUrl: compressed });
      onRefreshData();
      showToast('Gambar Footer Surat berhasil diunggah & disimpan!');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunggah gambar Footer Surat.');
    }
  };

  const handleRemoveLetterFooter = () => {
    setLetterFooterUrl('');
    const current = storageService.getSettings();
    storageService.saveSettings({ ...current, letterFooterUrl: '' });
    onRefreshData();
    showToast('Gambar Footer Surat dihapus.');
  };

  const headmasterName = settings.headmasterName || settings.principalName || 'Muh. Saifuddin, S.Si.';
  const headmasterNik = settings.headmasterNik || '01.0125';

  // Complete list of all Ustadz & Ustadzah for Examiner (Penguji) selection
  const allExaminerTeachers = useMemo(() => {
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

  const handleOpenScheduleModal = (sub: ExamSubmission) => {
    const defaultDate = sub.scheduledDate || sub.submissionDate || new Date().toISOString().split('T')[0];
    const defaultTime = sub.scheduledTime || '07.30 - 09.30 WIB';
    const isKenaikanJilid = sub.category === 'kenaikan_jilid';
    const defaultExaminer = isKenaikanJilid
      ? coordinatorName
      : sub.examinerName || coordinatorName;
    setScheduleTargetSubmission(sub);
    setSchedDate(defaultDate);
    setSchedDay(sub.scheduledDay || getIndonesianDayName(defaultDate) || 'Kamis');
    setSchedTime(defaultTime);
    setSchedRoom(sub.scheduledRoom || 'Kampus SMP Islam Al Azhar 21 Solo Baru');
    setSchedExaminer(defaultExaminer);
    setSchedLetterNumber(
      sub.letterNumber || buildDefaultParentLetterNumber(sub.category, defaultDate, 72)
    );
    setSchedHijriDate(sub.hijriDateText || formatHijriDateIndo(defaultDate));
    setSchedStatus(sub.status === 'Diajukan Musyrif' ? 'Terjadwal' : sub.status);

    const overrides: Record<string, { scheduledTime: string; examinerName: string }> = {};
    sub.participants.forEach(p => {
      overrides[p.studentId] = {
        scheduledTime: p.scheduledTime || defaultTime,
        examinerName: isKenaikanJilid ? coordinatorName : p.examinerName || defaultExaminer
      };
    });
    setSchedParticipantOverrides(overrides);
    setIsScheduleModalOpen(true);
  };

  const handleSaveCoordinatorSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTargetSubmission || !schedDate) return;
    const isKenaikanJilid = scheduleTargetSubmission.category === 'kenaikan_jilid';
    const computedDay = schedDay.trim() || getIndonesianDayName(schedDate) || 'Kamis';
    const cleanTime = schedTime.trim() || '07.30 - 09.30 WIB';
    const cleanExaminer = isKenaikanJilid
      ? coordinatorName
      : schedExaminer.trim() || coordinatorName;

    const updatedParticipants = scheduleTargetSubmission.participants.map(p => {
      const ov = schedParticipantOverrides[p.studentId];
      return {
        ...p,
        scheduledTime: ov?.scheduledTime?.trim() || cleanTime,
        examinerName: isKenaikanJilid
          ? coordinatorName
          : ov?.examinerName?.trim() || cleanExaminer
      };
    });

    const updated: ExamSubmission = {
      ...scheduleTargetSubmission,
      status: schedStatus,
      scheduledDate: schedDate,
      scheduledDay: computedDay,
      scheduledTime: cleanTime,
      scheduledRoom: schedRoom.trim() || 'Kampus SMP Islam Al Azhar 21 Solo Baru',
      examinerName: cleanExaminer,
      letterNumber:
        schedLetterNumber.trim() ||
        buildDefaultParentLetterNumber(scheduleTargetSubmission.category, schedDate, 72),
      hijriDateText: schedHijriDate.trim() || formatHijriDateIndo(schedDate),
      coordinatorName,
      participants: updatedParticipants
    };

    storageService.saveExamSubmission(updated);
    reloadSubmissions();
    setSelectedSubmissionId(updated.id);
    setIsScheduleModalOpen(false);
    setActiveDocTab('surat_wali');
    showToast(
      `Konfirmasi ujian ditetapkan (${computedDay}, ${formatIndonesianDate(schedDate)} · ${cleanTime} · Penguji: ${cleanExaminer}). Surat Wali Murid siap!`
    );
  };

  // ============================================================================
  // MODAL 3: KONFIRMASI HAPUS PENGAJUAN
  // ============================================================================
  const [deleteConfirmSub, setDeleteConfirmSub] = useState<ExamSubmission | null>(null);

  const handleConfirmDelete = () => {
    if (!deleteConfirmSub) return;
    storageService.deleteExamSubmission(deleteConfirmSub.id);
    reloadSubmissions();
    setDeleteConfirmSub(null);
    showToast('Data pengajuan ujian berhasil dihapus.');
  };

  // ============================================================================
  // PDF DOWNLOAD & PRINT HANDLERS + WHATSAPP BROADCAST GENERATOR
  // ============================================================================
  const currentParticipant: ExamParticipantItem | undefined =
    selectedSubmission?.participants[selectedParticipantIndex] ||
    selectedSubmission?.participants[0];

  const handleDownloadPdf = async (targetRef: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!targetRef.current) return;
    setIsDownloadingPdf(true);
    try {
      const element = targetRef.current;
      const opt = {
        margin: [8, 10, 8, 10] as [number, number, number, number],
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          onclone: (clonedDoc: Document) => {
            clonedDoc.querySelectorAll('.no-print').forEach(el => {
              (el as HTMLElement).style.display = 'none';
            });
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };
      await html2pdf().set(opt).from(element).save();
      showToast(`File PDF "${filename}" berhasil diunduh!`);
    } catch (err) {
      console.error('PDF generation error:', err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const generateShortWaBroadcast = (
    sub: ExamSubmission,
    participant?: ExamParticipantItem
  ): string => {
    const dayStr = sub.scheduledDay || getIndonesianDayName(sub.scheduledDate || sub.submissionDate) || '-';
    const dateStr = formatIndonesianDate(sub.scheduledDate || sub.submissionDate);
    const timeStr = participant?.scheduledTime || sub.scheduledTime || '07.30 - 09.30 WIB';
    const roomStr = sub.scheduledRoom || 'Kampus SMP Islam Al Azhar 21 Solo Baru';
    const examinerStr = participant?.examinerName || sub.examinerName || coordinatorName;
    const targetName = participant ? `${participant.studentName} (Kelas ${participant.className})` : 'Putra/Putri Bapak/Ibu';
    const jilidStr = participant ? participant.jilidOrJuz : sub.participants.map(p => `${p.studentName} (${p.jilidOrJuz})`).join(', ');

    return `Bismillahirrahmanirrahim
Kepada Yth. Bapak/Ibu Orang Tua / Wali Ananda *${targetName}*

*Assalamu'alaikum Warahmatullahi Wabarakatuh*

Kami beritahukan bahwa ananda telah dikonfirmasi akan melaksanakan *${config.letterExamName}* pada:
• *Hari* : ${dayStr}
• *Tanggal* : ${dateStr}
• *Waktu Ujian* : ${timeStr}
• *Tempat* : ${roomStr}
• *${config.columnLabel}* : ${jilidStr}
• *Penguji* : ${examinerStr}

Demikian pemberitahuan ini kami sampaikan. Kami memohon kepada Bapak/Ibu Orang Tua untuk:
1. Mendo'akan ananda agar diberikan kemudahan, kelancaran dalam ujian, dan hasil terbaik oleh Allah Ta'ala.
2. Mendampingi ananda muroja'ah di rumah dan memotivasinya.
3. Mengontrol ananda untuk mengurangi penggunaan gadget.

_(Surat pemberitahuan resmi ber-Kop Surat terlampir dalam format PDF)_

Jazakumullahu Khairan Katsiran.
*SMP Islam Al Azhar 21 Solo Baru*
Koordinator Tahfizh: ${coordinatorName}`;
  };

  const handleCopyWaBroadcast = () => {
    if (!selectedSubmission) return;
    const text = generateShortWaBroadcast(selectedSubmission, currentParticipant);
    navigator.clipboard.writeText(text);
    setCopiedWaText(true);
    showToast('Pesan BC WA singkat berhasil disalin! Silakan tempel di WhatsApp.');
    setTimeout(() => setCopiedWaText(false), 3000);
  };

  const getWhatsAppDirectUrl = (sub: ExamSubmission, participant?: ExamParticipantItem): string => {
    const std = students.find(s => s.id === participant?.studentId);
    const phone = normalizePhoneForWA(participant?.parentPhone || std?.parentPhone);
    const msg = encodeURIComponent(generateShortWaBroadcast(sub, participant));
    return phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
  };

  // Build rows for Form 1 (Gambar 1 always shows at least 7 numbered rows)
  const form1Rows = useMemo(() => {
    const parts = selectedSubmission?.participants || [];
    const totalRows = Math.max(7, parts.length);
    return Array.from({ length: totalRows }, (_, i) => parts[i] || null);
  }, [selectedSubmission]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1E293B] text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER & CATEGORY DROPDOWN / TABS */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded-xl bg-[#1E293B] text-[#D4AF37]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {config.title}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">{config.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dropdown Selector Kategori Ujian */}
            <div className="relative">
              <select
                value={category}
                onChange={e => handleSelectCategory(e.target.value as ExamCategory)}
                className="appearance-none pl-3.5 pr-9 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
              >
                <option value="kenaikan_jilid">1. Ujian Kenaikan Jilid UMMI</option>
                <option value="munaqosyah">2. Ujian Munaqosyah</option>
                <option value="juziyyah">3. Ujian Juziyyah</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-600 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {!isWali && (
              <button
                type="button"
                onClick={() => handleOpenCreateModal()}
                className="px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>Ajukan Peserta Ujian (Musyrif)</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Category Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
          {(
            [
              { id: 'kenaikan_jilid', label: 'Ujian Kenaikan Jilid UMMI', icon: BookMarked },
              { id: 'munaqosyah', label: 'Ujian Munaqosyah', icon: Award },
              { id: 'juziyyah', label: 'Ujian Juziyyah', icon: BookOpen }
            ] as const
          ).map(tab => {
            const Icon = tab.icon;
            const isActive = category === tab.id;
            const count = submissions.filter(s => s.category === tab.id).length;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectCategory(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  isActive
                    ? 'bg-[#1E293B] text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] ${
                    isActive ? 'bg-[#D4AF37] text-[#1E293B]' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: DAFTAR PENGAJUAN (KIRI) & DOKUMEN FORMULIR / SURAT WALI (KANAN) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Daftar Pengajuan dari Musyrif & Penjadwalan Koordinator */}
        <div className="lg:col-span-4 space-y-4 no-print">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D4AF37]" />
                Daftar Pengajuan & Jadwal
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {categorySubmissions.length} Berkas
              </span>
            </div>

            {categorySubmissions.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <Award className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">
                  Belum ada pengajuan untuk {config.title}
                </p>
                {!isWali && (
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal()}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Buat Formulir Pengajuan</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
                {categorySubmissions.map(sub => {
                  const isSelected = selectedSubmission?.id === sub.id;
                  const isScheduled = sub.status === 'Terjadwal' || sub.status === 'Selesai';
                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubmissionId(sub.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-amber-50/70 border-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-extrabold text-slate-900 block">
                            Pengajuan: {sub.teacherName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Diajukan: {formatDayAndDate(sub.submissionDate)}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                            sub.status === 'Terjadwal'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : sub.status === 'Selesai'
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          {sub.status === 'Terjadwal'
                            ? '✓ Hari Ditentukan'
                            : sub.status === 'Selesai'
                            ? '✓ Selesai Diuji'
                            : '⏳ Menunggu Jadwal'}
                        </span>
                      </div>

                      {/* Participant badges */}
                      <div className="flex flex-wrap gap-1">
                        {sub.participants.map(p => (
                          <span
                            key={p.studentId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-semibold text-slate-700"
                          >
                            <span>{p.studentName}</span>
                            <span className="text-slate-400">({p.className})</span>
                            <span className="text-[#8C7015] font-bold">• {p.jilidOrJuz}</span>
                          </span>
                        ))}
                      </div>

                      {/* Schedule info if set by Coordinator */}
                      {isScheduled && sub.scheduledDate && (
                        <div className="p-2.5 rounded-lg bg-emerald-50/90 border border-emerald-200 text-[11px] text-emerald-950 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-emerald-900">
                              ✓ Konfirmasi Ujian: {sub.scheduledDay || getIndonesianDayName(sub.scheduledDate)},{' '}
                              {formatIndonesianDate(sub.scheduledDate)}
                            </span>
                          </div>
                          <div className="text-[10.5px] text-emerald-900 flex flex-wrap gap-x-3 gap-y-0.5">
                            <span>
                              <strong>Waktu:</strong> {sub.scheduledTime || '07.30 - 09.30 WIB'}
                            </span>
                            <span>
                              <strong>Penguji:</strong> {sub.examinerName || coordinatorName}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-700 block">
                            Surat Undangan Wali Murid Aktif (Siap PDF & WA)
                          </span>
                        </div>
                      )}

                      {/* Action Buttons for Musyrif & Koordinator */}
                      {!isWali && (
                        <div
                          className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-1.5"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSubmissionId(sub.id);
                                handleOpenScheduleModal(sub);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Konfirmasi Waktu Ujian, Hari/Tanggal & Penguji oleh Koordinator Tahfizh"
                            >
                              <Calendar className="w-3 h-3 text-[#D4AF37]" />
                              <span>
                                {isScheduled ? 'Ubah Konfirmasi & Penguji' : 'Konfirmasi Ujian (Waktu & Penguji)'}
                              </span>
                            </button>

                            {isScheduled && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSubmissionId(sub.id);
                                  setActiveDocTab('surat_wali');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                              >
                                <Send className="w-3 h-3" />
                                <span>Surat Wali & WA</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSubmissionId(sub.id);
                                setActiveDocTab('penilaian_penguji');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Nilai Penguji</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSubmissionId(sub.id);
                                setActiveDocTab('sertifikat');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Award className="w-3 h-3 text-[#8C7015]" />
                              <span>Sertifikat</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenCreateModal(sub)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                              title="Edit Daftar Santri Pengajuan"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmSub(sub)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                              title="Hapus Pengajuan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DOCUMENT VIEWER (GAMBAR 1: FORMULIR PENGAJUAN & GAMBAR 2: SURAT UNDANGAN WALI + WA) */}
        <div className="lg:col-span-8 space-y-4">
          {!selectedSubmission ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                Pilih berkas pengajuan di sebelah kiri atau buat pengajuan baru
              </p>
            </div>
          ) : (
            <>
              {/* Document Switcher Toolbar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
                <div className="flex flex-wrap items-center gap-2">
                  {!isWali && (
                    <button
                      type="button"
                      onClick={() => setActiveDocTab('form_pengajuan')}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        activeDocTab === 'form_pengajuan'
                          ? 'bg-[#1E293B] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <FileText
                        className={`w-3.5 h-3.5 ${
                          activeDocTab === 'form_pengajuan' ? 'text-[#D4AF37]' : 'text-slate-500'
                        }`}
                      />
                      <span>1. Formulir Pengajuan Musyrif (Format Gambar 1)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveDocTab('surat_wali')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      activeDocTab === 'surat_wali'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>2. Surat Undangan Wali + PDF & BC WA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDocTab('penilaian_penguji')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      activeDocTab === 'penilaian_penguji'
                        ? 'bg-indigo-700 text-white shadow-xs'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>3. Format Penilaian & Input Nilai Penguji</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDocTab('sertifikat')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      activeDocTab === 'sertifikat'
                        ? 'bg-[#8C7015] text-white shadow-xs'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>4. Sertifikat ({config.shortTitle})</span>
                  </button>
                </div>

                {/* Action buttons for current document */}
                <div className="flex flex-wrap items-center gap-2">
                  {activeDocTab === 'form_pengajuan' && (
                    <>
                      <button
                        type="button"
                        disabled={isDownloadingPdf}
                        onClick={() =>
                          handleDownloadPdf(
                            form1PrintRef,
                            `Formulir_Pengajuan_${config.shortTitle.replace(/\s+/g, '_')}_${selectedSubmission.submissionDate}.pdf`
                          )
                        }
                        className="px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {isDownloadingPdf ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                        )}
                        <span>Download PDF Formulir</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak</span>
                      </button>
                    </>
                  )}
                  {activeDocTab === 'surat_wali' && (
                    <>
                      <button
                        type="button"
                        disabled={isDownloadingPdf || !selectedSubmission.scheduledDate}
                        onClick={() =>
                          handleDownloadPdf(
                            form2PrintRef,
                            `Surat_Pemberitahuan_${config.shortTitle.replace(/\s+/g, '_')}_${(
                              currentParticipant?.studentName || 'Santri'
                            ).replace(/\s+/g, '_')}.pdf`
                          )
                        }
                        className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {isDownloadingPdf ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>Download PDF Surat Wali</span>
                      </button>
                      <button
                        type="button"
                        disabled={!selectedSubmission.scheduledDate}
                        onClick={() => window.print()}
                        className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Surat</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* DOKUMEN 1: FORMULIR PENGAJUAN DARI MUSYRIF HALAQAH (PERSIS GAMBAR 1)      */}
              {/* ========================================================================= */}
              {activeDocTab === 'form_pengajuan' && (
                <div className="space-y-4">
                  {/* Banner status Koordinator */}
                  {!isWali && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
                      <div className="text-xs text-amber-950 space-y-0.5">
                        <span className="font-bold block">
                          Konfirmasi Koordinator Tahfizh ({coordinatorName}):
                        </span>
                        <span>
                          {selectedSubmission.scheduledDate
                            ? `Dikonfirmasi pada ${selectedSubmission.scheduledDay}, ${formatIndonesianDate(
                                selectedSubmission.scheduledDate
                              )} · Waktu: ${selectedSubmission.scheduledTime || '07.30 - 09.30 WIB'} · Penguji: ${
                                selectedSubmission.examinerName || coordinatorName
                              }.`
                            : 'Formulir pengajuan dari Musyrif ini menunggu Konfirmasi Waktu Ujian & Penguji oleh Koordinator Tahfizh.'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenScheduleModal(selectedSubmission)}
                        className="px-3.5 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>
                          {selectedSubmission.scheduledDate
                            ? 'Ubah Konfirmasi Waktu & Penguji'
                            : 'Konfirmasi Ujian (Waktu & Penguji)'}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Printable Sheet for Gambar 1 */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-10 flex justify-center overflow-x-auto print:p-0 print:border-none print:shadow-none">
                    <div
                      ref={form1PrintRef}
                      className="printable-report-area w-full max-w-[720px] bg-white text-slate-950 space-y-6"
                      style={{ fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif" }}
                    >
                      {/* Title & Subtitle matching Image 1 */}
                      <div className="text-center space-y-3 pt-2">
                        <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-slate-950">
                          {config.formHeaderTitle}
                        </h2>
                        <p className="text-sm sm:text-[15px] text-slate-900 leading-relaxed max-w-xl mx-auto">
                          Dengan ini kami menyampaikan permohonan kepada Koordinator untuk menguji
                          siswa yang tersebut namanya dibawah ini :
                        </p>
                      </div>

                      {/* Hari / Tanggal, Waktu & Penguji line */}
                      <div className="pt-2 text-sm sm:text-[15px] font-medium text-slate-950 space-y-1.5">
                        <div>
                          <span className="inline-block w-36">Hari / Tanggal</span>
                          <span>: </span>
                          <span className="border-b border-dotted border-slate-800 pb-0.5 px-2 font-semibold inline-block min-w-[280px]">
                            {selectedSubmission.scheduledDate
                              ? `${selectedSubmission.scheduledDay || getIndonesianDayName(selectedSubmission.scheduledDate)}, ${formatIndonesianDate(selectedSubmission.scheduledDate)}`
                              : formatDayAndDate(selectedSubmission.submissionDate)}
                          </span>
                        </div>
                        {selectedSubmission.scheduledDate && (
                          <>
                            <div>
                              <span className="inline-block w-36">Waktu Ujian</span>
                              <span>: </span>
                              <span className="border-b border-dotted border-slate-800 pb-0.5 px-2 font-semibold inline-block min-w-[280px]">
                                {selectedSubmission.scheduledTime || '07.30 - 09.30 WIB'}
                              </span>
                            </div>
                            <div>
                              <span className="inline-block w-36">Penguji Ujian</span>
                              <span>: </span>
                              <span className="border-b border-dotted border-slate-800 pb-0.5 px-2 font-semibold inline-block min-w-[280px]">
                                {selectedSubmission.examinerName || coordinatorName}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Table matching Image 1 (No | Nama | Kelas | Jilid) */}
                      <div>
                        <table className="w-full border-2 border-slate-900 border-collapse text-sm sm:text-[15px]">
                          <thead>
                            <tr className="border-b-2 border-slate-900 text-slate-950 font-bold text-center">
                              <th className="py-2.5 px-3 border-r border-slate-900 w-14">No</th>
                              <th className="py-2.5 px-4 border-r border-slate-900">Nama</th>
                              <th className="py-2.5 px-3 border-r border-slate-900 w-28">Kelas</th>
                              <th className="py-2.5 px-3 w-40">{config.columnLabel}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {form1Rows.map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-900 h-11">
                                <td className="py-2 px-3 border-r border-slate-900 text-center font-medium">
                                  {idx + 1}
                                </td>
                                <td className="py-2 px-4 border-r border-slate-900 font-semibold text-slate-900">
                                  {row ? row.studentName : ''}
                                </td>
                                <td className="py-2 px-3 border-r border-slate-900 text-center font-medium">
                                  {row ? row.className : ''}
                                </td>
                                <td className="py-2 px-3 text-center font-semibold text-slate-900">
                                  {row ? row.jilidOrJuz : ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Bottom signature matching Image 1: Ustadz / Ustadzah */}
                      <div className="pt-8 pb-4 flex flex-col items-center justify-center text-center space-y-16">
                        <p className="text-sm sm:text-[15px] font-medium text-slate-900">
                          Ustadz / Ustadzah
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm sm:text-[15px] font-bold text-slate-950">
                            {selectedSubmission.teacherName}
                          </p>
                          <p className="text-xs text-slate-600 tracking-widest">
                            .....................................................
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* DOKUMEN 2: SURAT UNDANGAN PEMBERITAHUAN WALI MURID (KOP SURAT RESMI)      */}
              {/* ========================================================================= */}
              {activeDocTab === 'surat_wali' && (
                <div className="space-y-4">
                  {!selectedSubmission.scheduledDate ? (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-6 text-center space-y-3 no-print">
                      <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                      <h3 className="text-sm font-bold text-amber-950">
                        Konfirmasi Jadwal, Waktu Ujian & Penguji Belum Ditentukan
                      </h3>
                      <p className="text-xs text-amber-900 max-w-lg mx-auto">
                        Sesuai prosedur, Surat Pemberitahuan kepada Orang Tua / Wali Murid akan muncul
                        setelah Koordinator Tahfizh mengonfirmasi Hari, Tanggal, Waktu Ujian, dan Penguji.
                      </p>
                      {!isWali && (
                        <button
                          type="button"
                          onClick={() => handleOpenScheduleModal(selectedSubmission)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1E293B] text-white text-xs font-bold cursor-pointer"
                        >
                          <Calendar className="w-4 h-4 text-[#D4AF37]" />
                          <span>Konfirmasi Ujian (Waktu & Penguji) Sekarang</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Student Selector, Confirmation Summary & Broadcast WA Box */}
                      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 no-print">
                        {/* Confirmed Schedule & Examiner Info Bar */}
                        <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="space-y-0.5 text-emerald-950">
                            <div className="font-extrabold flex items-center gap-1.5 text-emerald-900">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>
                                Konfirmasi Ujian Aktif: {selectedSubmission.scheduledDay},{' '}
                                {formatIndonesianDate(selectedSubmission.scheduledDate)}
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-800">
                              Waktu Ujian:{' '}
                              <strong>
                                {currentParticipant?.scheduledTime ||
                                  selectedSubmission.scheduledTime ||
                                  '07.30 - 09.30 WIB'}
                              </strong>{' '}
                              &nbsp;·&nbsp; Penguji:{' '}
                              <strong>
                                {currentParticipant?.examinerName ||
                                  selectedSubmission.examinerName ||
                                  coordinatorName}
                              </strong>{' '}
                              &nbsp;·&nbsp; Tempat:{' '}
                              <strong>
                                {selectedSubmission.scheduledRoom ||
                                  'Kampus SMP Islam Al Azhar 21 Solo Baru'}
                              </strong>
                            </p>
                          </div>
                          {!isWali && (
                            <div className="flex items-center gap-2 shrink-0">
                              <select
                                value={letterSignerRole}
                                onChange={e => setLetterSignerRole(e.target.value as 'kepsek' | 'koordinator')}
                                className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-[11px] font-bold text-slate-800 cursor-pointer"
                                title="Pilih Penandatangan Surat"
                              >
                                <option value="kepsek">TTD: Kepala Sekolah</option>
                                <option value="koordinator">TTD: Koordinator Tahfizh</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleOpenScheduleModal(selectedSubmission)}
                                className="px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3 text-[#D4AF37]" />
                                <span>Ubah Waktu / Penguji</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Upload Gambar Kop Surat (Header) & Footer Surat Control Bar */}
                        {!isWali && (
                          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                                <ImageIcon className="w-4 h-4 text-[#8C7015]" />
                                Pengaturan Gambar Kop Surat (Header) & Footer Surat Undangan Orang Tua:
                              </span>
                              <span className="text-[10px] text-amber-800">
                                Tersimpan otomatis untuk seluruh surat undangan
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Upload Header Kop Surat */}
                              <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-amber-200">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-16 h-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                                    {letterHeaderUrl ? (
                                      <img
                                        src={letterHeaderUrl}
                                        alt="Preview Kop Header"
                                        className="w-full h-full object-contain"
                                      />
                                    ) : (
                                      <ImageIcon className="w-4 h-4 text-slate-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-slate-800 block truncate">
                                      1. Gambar Kop Surat (Header)
                                    </span>
                                    <span className="text-[10px] text-slate-500 block">
                                      {letterHeaderUrl ? 'Sudah terpasang' : 'Belum diupload'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <label className="px-2.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                                    <Upload className="w-3 h-3 text-[#D4AF37]" />
                                    <span>{letterHeaderUrl ? 'Ganti' : 'Upload Header'}</span>
                                    <input
                                      type="file"
                                      accept="image/png,image/jpeg,image/webp"
                                      onChange={handleUploadLetterHeader}
                                      className="hidden"
                                    />
                                  </label>
                                  {letterHeaderUrl && (
                                    <button
                                      type="button"
                                      onClick={handleRemoveLetterHeader}
                                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                                      title="Hapus Kop Header"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Upload Footer Surat */}
                              <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-amber-200">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-16 h-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                                    {letterFooterUrl ? (
                                      <img
                                        src={letterFooterUrl}
                                        alt="Preview Footer"
                                        className="w-full h-full object-contain"
                                      />
                                    ) : (
                                      <ImageIcon className="w-4 h-4 text-slate-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-slate-800 block truncate">
                                      2. Gambar Footer Surat
                                    </span>
                                    <span className="text-[10px] text-slate-500 block">
                                      {letterFooterUrl ? 'Sudah terpasang' : 'Belum diupload'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <label className="px-2.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                                    <Upload className="w-3 h-3 text-[#D4AF37]" />
                                    <span>{letterFooterUrl ? 'Ganti' : 'Upload Footer'}</span>
                                    <input
                                      type="file"
                                      accept="image/png,image/jpeg,image/webp"
                                      onChange={handleUploadLetterFooter}
                                      className="hidden"
                                    />
                                  </label>
                                  {letterFooterUrl && (
                                    <button
                                      type="button"
                                      onClick={handleRemoveLetterFooter}
                                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                                      title="Hapus Footer Surat"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Pilih Santri untuk Surat Undangan & Kirim WA Wali Murid:
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedSubmission.participants.map((p, idx) => (
                                <button
                                  key={p.studentId}
                                  type="button"
                                  onClick={() => setSelectedParticipantIndex(idx)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                    selectedParticipantIndex === idx
                                      ? 'bg-[#1E293B] text-white shadow-2xs'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span>
                                    {idx + 1}. {p.studentName} ({p.className})
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 text-[#D4AF37]">
                                    {p.jilidOrJuz}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {currentParticipant && (
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <a
                                href={getWhatsAppDirectUrl(selectedSubmission, currentParticipant)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>Kirim WA ke Wali ({currentParticipant.studentName})</span>
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Short WhatsApp Broadcast Preview & Copy */}
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                              <MessageCircle className="w-4 h-4 text-emerald-700" />
                              Format Broadcast (BC) WA Singkat Pendamping File PDF:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={handleCopyWaBroadcast}
                                className="px-3 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                              >
                                {copiedWaText ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Tersalin!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>Salin Teks BC WA</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                          <pre className="text-[11px] text-slate-800 whitespace-pre-wrap font-sans bg-white p-3 rounded-lg border border-emerald-200/80 max-h-40 overflow-y-auto leading-relaxed">
                            {generateShortWaBroadcast(selectedSubmission, currentParticipant)}
                          </pre>
                        </div>
                      </div>

                      {/* PRINTABLE / PDF SURAT PEMBERITAHUAN ORANG TUA (KOP SURAT & PENATAAN RESMI) */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-8 flex justify-center overflow-x-auto print:p-0 print:border-none print:shadow-none">
                        <div
                          ref={form2PrintRef}
                          className="printable-report-area w-full max-w-[760px] bg-white text-slate-950 flex flex-col justify-between"
                          style={{
                            fontFamily: "'Times New Roman', Times, serif",
                            minHeight: '980px',
                            padding: '12px 24px 16px 24px'
                          }}
                        >
                          <div className="space-y-4">
                            {/* ============================================================= */}
                            {/* KOP SURAT HEADER (GAMBAR UPLOAD)                              */}
                            {/* ============================================================= */}
                            <div>
                              {letterHeaderUrl ? (
                                <img
                                  src={letterHeaderUrl}
                                  alt="Kop Surat Header"
                                  className="w-full h-auto object-contain block select-none"
                                />
                              ) : (
                                <div className="no-print border-2 border-dashed border-slate-300 rounded-xl p-5 bg-slate-50/70 text-center space-y-1.5">
                                  <ImageIcon className="w-6 h-6 text-slate-400 mx-auto" />
                                  <p className="text-xs font-bold text-slate-700">
                                    Area Gambar Kop Surat (Header)
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    Silakan upload gambar Kop Surat (PNG/JPG) agar tampilan header surat sama persis
                                  </p>
                                  {!isWali && (
                                    <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white text-xs font-bold cursor-pointer mt-1">
                                      <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                                      <span>+ Upload Gambar Kop Surat (Header)</span>
                                      <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={handleUploadLetterHeader}
                                        className="hidden"
                                      />
                                    </label>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* ============================================================= */}
                            {/* NOMOR SURAT, HAL, DAN TANGGAL HIJRIAH / MASEHI                */}
                            {/* ============================================================= */}
                            <div className="flex items-start justify-between gap-4 pt-1 text-[14px] leading-snug">
                              <table className="border-none">
                                <tbody>
                                  <tr>
                                    <td className="py-0.5 pr-4 w-12 align-top">No</td>
                                    <td className="py-0.5 pr-2 align-top">:</td>
                                    <td className="py-0.5 font-medium">
                                      {selectedSubmission.letterNumber ||
                                        buildDefaultParentLetterNumber(
                                          category,
                                          selectedSubmission.scheduledDate,
                                          72
                                        )}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="py-0.5 pr-4 align-top">Hal</td>
                                    <td className="py-0.5 pr-2 align-top">:</td>
                                    <td className="py-0.5 font-semibold">
                                      Pemberitahuan {config.title}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>

                              {/* Right Date: Hijriah underlined over Masehi */}
                              <div className="text-right shrink-0">
                                <div className="inline-block text-center">
                                  <p className="border-b border-slate-900 pb-0.5 px-1">
                                    Sukoharjo,{' '}
                                    {selectedSubmission.hijriDateText ||
                                      formatHijriDateIndo(selectedSubmission.scheduledDate)}
                                  </p>
                                  <p className="pt-0.5">
                                    {formatIndonesianDate(selectedSubmission.scheduledDate)} M
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* ============================================================= */}
                            {/* TUJUAN SURAT & ISI SURAT (PENATAAN SESUAI TEMPLATE SURAT)     */}
                            {/* ============================================================= */}
                            <div className="pl-0 sm:pl-[62px] space-y-3.5 text-[14.5px] leading-relaxed text-slate-950">
                              {/* Kepada Yth. */}
                              <div className="leading-snug space-y-0.5 pt-1">
                                <p>Kepada</p>
                                <p>Yth. Bapak/Ibu Orang Tua / Wali Murid</p>
                                <p className="font-bold">
                                  Ananda{' '}
                                  {currentParticipant
                                    ? `${currentParticipant.studentName} (${currentParticipant.className})`
                                    : '....................................'}
                                </p>
                                <p>Di Tempat</p>
                              </div>

                              {/* Opening Salam */}
                              <p className="font-bold italic pt-1">
                                Assalamu’alaikum Warahmatullahi Wabarakatuh
                              </p>

                              {/* Opening notification statement ("isinya tetap") */}
                              <p className="text-justify">
                                Kami beritahukan bahwa ananda akan melakukan{' '}
                                <span className="font-bold">{config.letterExamName}</span> pada :
                              </p>

                              {/* Details Table: Hari, Tanggal, Waktu, Tempat, Jilid/Juz, Penguji */}
                              <div className="pl-3 sm:pl-6">
                                <table className="border-none text-[14.5px]">
                                  <tbody>
                                    <tr>
                                      <td className="py-1 pr-6 w-36 font-medium">Nama / Kelas</td>
                                      <td className="py-1 pr-3">:</td>
                                      <td className="py-1 font-bold">
                                        {currentParticipant
                                          ? `${currentParticipant.studentName} (${currentParticipant.className})`
                                          : '-'}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="py-1 pr-6 font-medium">Hari</td>
                                      <td className="py-1 pr-3">:</td>
                                      <td className="py-1 font-semibold">
                                        {selectedSubmission.scheduledDay ||
                                          getIndonesianDayName(selectedSubmission.scheduledDate)}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="py-1 pr-6 font-medium">Tanggal</td>
                                      <td className="py-1 pr-3">:</td>
                                      <td className="py-1 font-semibold">
                                        {formatIndonesianDate(selectedSubmission.scheduledDate)}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="py-1 pr-6 font-medium">Waktu</td>
                                      <td className="py-1 pr-3">:</td>
                                      <td className="py-1 font-semibold">
                                        {currentParticipant?.scheduledTime ||
                                          selectedSubmission.scheduledTime ||
                                          '07.30 - 09.30 WIB'}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="py-1 pr-6 font-medium">Tempat</td>
                                      <td className="py-1 pr-3">:</td>
                                      <td className="py-1 font-semibold">
                                        {selectedSubmission.scheduledRoom ||
                                          'Kampus SMP Islam Al Azhar 21 Solo Baru'}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="py-1 pr-6 font-medium">{config.columnLabel}</td>
                                      <td className="py-1 pr-3">:</td>
                                      <td className="py-1 font-bold">
                                        {currentParticipant?.jilidOrJuz || '-'}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="py-1 pr-6 font-medium">Penguji</td>
                                      <td className="py-1 pr-3">:</td>
                                      <td className="py-1 font-bold">
                                        {currentParticipant?.examinerName ||
                                          selectedSubmission.examinerName ||
                                          coordinatorName}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              {/* Closing paragraph & 3 bullet points ("isinya tetap") */}
                              <div className="space-y-2 pt-1">
                                <p>
                                  Demikian pemberitahuan ini kami sampaikan. Kami memohon kepada
                                  orang tua untuk :
                                </p>
                                <ul className="space-y-1.5 pl-4">
                                  <li className="flex items-start gap-2.5">
                                    <span className="font-bold">-</span>
                                    <span className="text-justify">
                                      Mendo’akan ananda agar diberikan kemudahan kelancaran dalam
                                      ujian dan hasil terbaik oleh Alloh ta’ala,
                                    </span>
                                  </li>
                                  <li className="flex items-start gap-2.5">
                                    <span className="font-bold">-</span>
                                    <span className="text-justify">
                                      Mendampingi ananda muroja’ah di rumah dan memotivasinya,
                                    </span>
                                  </li>
                                  <li className="flex items-start gap-2.5">
                                    <span className="font-bold">-</span>
                                    <span className="text-justify">
                                      Mengontrol ananda untuk mengurangi penggunaan gadget.
                                    </span>
                                  </li>
                                </ul>
                              </div>

                              {/* Closing Salam */}
                              <p className="font-bold italic pt-1">
                                Wassalamu’alaikum Warahmatullahi Wabarakatuh
                              </p>

                              {/* Signature Block on the Right (Matching Template 072) */}
                              <div className="pt-4 flex justify-end">
                                <div className="text-left min-w-[240px] leading-snug">
                                  <p className="text-slate-900">
                                    SMP Islam Al Azhar 21 Solo Baru
                                  </p>
                                  <p className="font-semibold text-slate-950">
                                    {letterSignerRole === 'kepsek'
                                      ? 'Kepala Sekolah'
                                      : 'Koordinator Tahfizh & Metode Ummi'}
                                  </p>
                                  {letterSignerRole === 'kepsek' ? (
                                    settings.headmasterSignatureUrl ? (
                                      <div className="h-16 flex items-center justify-start my-1">
                                        <img
                                          src={settings.headmasterSignatureUrl}
                                          alt="TTD Kepala Sekolah"
                                          className="h-14 object-contain"
                                        />
                                      </div>
                                    ) : (
                                      <div className="h-16" />
                                    )
                                  ) : settings.tahfizhCoordinatorSignatureUrl ? (
                                    <div className="h-16 flex items-center justify-start my-1">
                                      <img
                                        src={settings.tahfizhCoordinatorSignatureUrl}
                                        alt="TTD Koordinator"
                                        className="h-14 object-contain"
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-16" />
                                  )}
                                  <p className="font-bold underline text-slate-950">
                                    {letterSignerRole === 'kepsek'
                                      ? headmasterName
                                      : coordinatorName}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ============================================================= */}
                          {/* BOTTOM FOOTER SURAT (GAMBAR UPLOAD)                           */}
                          {/* ============================================================= */}
                          <div className="pt-6">
                            {letterFooterUrl ? (
                              <img
                                src={letterFooterUrl}
                                alt="Footer Surat"
                                className="w-full h-auto object-contain block select-none"
                              />
                            ) : (
                              <div className="no-print border-2 border-dashed border-slate-300 rounded-xl p-3.5 bg-slate-50/70 text-center space-y-1">
                                <p className="text-[11px] font-bold text-slate-600">
                                  Area Gambar Footer Surat
                                </p>
                                {!isWali && (
                                  <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold cursor-pointer">
                                    <Upload className="w-3 h-3 text-[#D4AF37]" />
                                    <span>+ Upload Gambar Footer Surat</span>
                                    <input
                                      type="file"
                                      accept="image/png,image/jpeg,image/webp"
                                      onChange={handleUploadLetterFooter}
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* DOKUMEN 3 & 4: FORMAT PENILAIAN PENGUJI & SERTIFIKAT UJIAN                */}
              {/* ========================================================================= */}
              {(activeDocTab === 'penilaian_penguji' || activeDocTab === 'sertifikat') && (
                <ExamScoringAndCertificate
                  mode={activeDocTab}
                  category={category}
                  submission={selectedSubmission}
                  students={students}
                  teachers={teachers}
                  settings={settings}
                  coordinatorName={coordinatorName}
                  coordinatorNik={coordinatorNik}
                  isWali={isWali}
                  selectedParticipantIndex={selectedParticipantIndex}
                  onSelectParticipantIndex={setSelectedParticipantIndex}
                  onSubmissionUpdated={reloadSubmissions}
                  onSwitchToCertificateTab={idx => {
                    setSelectedParticipantIndex(idx);
                    setActiveDocTab('sertifikat');
                  }}
                  onShowToast={showToast}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: FORM PENGAJUAN UJIAN DARI MUSYRIF HALAQAH                        */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingSubmissionId ? 'Edit' : 'Buat'} {config.formHeaderTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  Pengajuan peserta ujian dari Musyrif Halaqah kepada Koordinator Tahfizh
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmission} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hari / Tanggal Pengajuan:
                  </label>
                  <input
                    type="date"
                    required
                    value={formSubmissionDate}
                    onChange={e => setFormSubmissionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Tertulis: {formatDayAndDate(formSubmissionDate)}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ustadz / Ustadzah Pengaju (Musyrif):
                  </label>
                  <select
                    value={formTeacherId}
                    onChange={e => setFormTeacherId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter Kelas & Pilih Santri */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block">
                  Tambahkan Siswa ke Tabel Pengajuan:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      1. Pilih Kelas:
                    </label>
                    <select
                      value={filterClassIdForPicker}
                      onChange={e => {
                        setFilterClassIdForPicker(e.target.value);
                        setPickerStudentId('');
                      }}
                      className="w-full px-2.5 py-2 rounded-lg bg-white border border-slate-300 font-semibold"
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>
                          Kelas {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      2. Pilih Nama Siswa:
                    </label>
                    <select
                      value={pickerStudentId}
                      disabled={!filterClassIdForPicker}
                      onChange={e => {
                        const sid = e.target.value;
                        setPickerStudentId(sid);
                        const st = students.find(x => x.id === sid);
                        if (st && category === 'kenaikan_jilid' && st.currentUmmiJilid && st.currentUmmiJilid !== '-') {
                          setPickerJilidOrJuz(st.currentUmmiJilid);
                        }
                      }}
                      className="w-full px-2.5 py-2 rounded-lg bg-white border border-slate-300 font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {filterClassIdForPicker ? '-- Pilih Siswa --' : 'Pilih kelas dulu...'}
                      </option>
                      {filteredPickerStudents.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      3. {config.columnLabel} yang Diujikan:
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        list="exam-material-options"
                        value={pickerJilidOrJuz}
                        onChange={e => setPickerJilidOrJuz(e.target.value)}
                        placeholder={config.columnLabel}
                        className="w-full px-2.5 py-2 rounded-lg bg-white border border-slate-300 font-semibold"
                      />
                      <datalist id="exam-material-options">
                        {config.options.map(opt => (
                          <option key={opt} value={opt} />
                        ))}
                      </datalist>
                      <button
                        type="button"
                        disabled={!pickerStudentId}
                        onClick={handleAddParticipantToForm}
                        className="px-3 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 disabled:opacity-40 text-white font-bold shrink-0 cursor-pointer"
                      >
                        + Tambah
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Table of Added Students */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block">
                  Daftar Siswa yang Diajukan ({formParticipants.length} Siswa):
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold">
                        <th className="p-2 text-center w-10">No</th>
                        <th className="p-2 text-left">Nama</th>
                        <th className="p-2 text-center w-20">Kelas</th>
                        <th className="p-2 text-left w-44">{config.columnLabel}</th>
                        <th className="p-2 text-center w-14">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formParticipants.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">
                            Belum ada siswa ditambahkan. Pilih Kelas & Nama Siswa di atas lalu klik "+ Tambah".
                          </td>
                        </tr>
                      ) : (
                        formParticipants.map((p, idx) => (
                          <tr key={p.studentId}>
                            <td className="p-2 text-center font-mono">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-900">{p.studentName}</td>
                            <td className="p-2 text-center">{p.className}</td>
                            <td className="p-2">
                              <input
                                type="text"
                                list="exam-material-options"
                                value={p.jilidOrJuz}
                                onChange={e =>
                                  handleUpdateParticipantJilid(p.studentId, e.target.value)
                                }
                                className="w-full px-2 py-1 rounded border border-slate-300 font-semibold text-xs"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveParticipantFromForm(p.studentId)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-800 text-white font-bold shadow-xs cursor-pointer"
                >
                  Simpan Formulir Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KONFIRMASI UJIAN (HARI, TANGGAL, WAKTU UJIAN & PENGUJI)          */}
      {/* ========================================================================= */}
      {isScheduleModalOpen && scheduleTargetSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Konfirmasi Ujian — Jadwal, Waktu Ujian & Penguji
                </h3>
                <p className="text-xs text-slate-500">
                  Koordinator Tahfizh: {coordinatorName} · Pengajuan oleh {scheduleTargetSubmission.teacherName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCoordinatorSchedule} className="space-y-4 text-xs">
              {/* Row 1: Tanggal & Hari */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    1. Tanggal Pelaksanaan Ujian:
                  </label>
                  <input
                    type="date"
                    required
                    value={schedDate}
                    onChange={e => {
                      const val = e.target.value;
                      setSchedDate(val);
                      const autoDay = getIndonesianDayName(val);
                      if (autoDay) setSchedDay(autoDay);
                      setSchedHijriDate(formatHijriDateIndo(val));
                      setSchedLetterNumber(
                        buildDefaultParentLetterNumber(scheduleTargetSubmission.category, val, 72)
                      );
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    2. Hari Pelaksanaan (Tertulis di Surat):
                  </label>
                  <input
                    type="text"
                    required
                    value={schedDay}
                    onChange={e => setSchedDay(e.target.value)}
                    placeholder="Contoh: Kamis"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              {/* Row 2: Waktu Ujian & Penguji */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    3. Waktu Pelaksanaan Ujian:
                  </label>
                  <input
                    type="text"
                    list="exam-time-presets"
                    required
                    value={schedTime}
                    onChange={e => {
                      const val = e.target.value;
                      setSchedTime(val);
                      setSchedParticipantOverrides(prev => {
                        const next = { ...prev };
                        Object.keys(next).forEach(sid => {
                          next[sid] = { ...next[sid], scheduledTime: val };
                        });
                        return next;
                      });
                    }}
                    placeholder="Contoh: 07.30 - 09.30 WIB"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-amber-300 font-bold text-slate-900"
                  />
                  <datalist id="exam-time-presets">
                    <option value="07.30 - 09.30 WIB" />
                    <option value="07.30 - 10.00 WIB" />
                    <option value="08.00 - 11.00 WIB" />
                    <option value="08.00 WIB - Selesai" />
                    <option value="09.30 - 11.30 WIB" />
                    <option value="13.00 - 14.30 WIB" />
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    4. Ustadz / Ustadzah Penguji Ujian:
                  </label>
                  {scheduleTargetSubmission.category === 'kenaikan_jilid' ? (
                    <div className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-300 font-bold text-slate-800 flex items-center justify-between gap-2">
                      <span className="truncate">{coordinatorName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold shrink-0">
                        Koordinator Tahfizh
                      </span>
                    </div>
                  ) : (
                    <select
                      required
                      value={schedExaminer}
                      onChange={e => {
                        const val = e.target.value;
                        setSchedExaminer(val);
                        setSchedParticipantOverrides(prev => {
                          const next = { ...prev };
                          Object.keys(next).forEach(sid => {
                            next[sid] = { ...next[sid], examinerName: val };
                          });
                          return next;
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-amber-300 font-bold text-slate-900 cursor-pointer"
                    >
                      {!allExaminerTeachers.includes(schedExaminer) && schedExaminer && (
                        <option value={schedExaminer}>{schedExaminer}</option>
                      )}
                      {allExaminerTeachers.map(tName => (
                        <option key={tName} value={tName}>
                          {tName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Row 3: Tempat, Nomor Surat, Tanggal Hijriah */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    5. Tempat Pelaksanaan:
                  </label>
                  <input
                    type="text"
                    value={schedRoom}
                    onChange={e => setSchedRoom(e.target.value)}
                    placeholder="Kampus SMP Islam Al Azhar 21 Solo Baru"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    6. Nomor Surat Orang Tua:
                  </label>
                  <input
                    type="text"
                    value={schedLetterNumber}
                    onChange={e => setSchedLetterNumber(e.target.value)}
                    placeholder="072/X/YPIA-SMPIA21/1446.2025"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    7. Tanggal Hijriah Surat:
                  </label>
                  <input
                    type="text"
                    value={schedHijriDate}
                    onChange={e => setSchedHijriDate(e.target.value)}
                    placeholder="17 Rabi'ul Akhir 1446 H"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              {/* Per-Student Time & Examiner Table */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">
                  Rincian Waktu Ujian & Penguji per Peserta ({scheduleTargetSubmission.participants.length} Siswa):
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold">
                        <th className="p-2 text-center w-8">No</th>
                        <th className="p-2 text-left">Nama Siswa</th>
                        <th className="p-2 text-left w-32">{config.columnLabel}</th>
                        <th className="p-2 text-left w-40">Waktu Ujian</th>
                        <th className="p-2 text-left w-48">Penguji</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scheduleTargetSubmission.participants.map((p, idx) => {
                        const ov = schedParticipantOverrides[p.studentId] || {
                          scheduledTime: schedTime,
                          examinerName: schedExaminer
                        };
                        return (
                          <tr key={p.studentId}>
                            <td className="p-2 text-center font-mono">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-900">
                              {p.studentName} ({p.className})
                            </td>
                            <td className="p-2 text-slate-700 font-semibold">{p.jilidOrJuz}</td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                list="exam-time-presets"
                                value={ov.scheduledTime}
                                onChange={e =>
                                  setSchedParticipantOverrides(prev => ({
                                    ...prev,
                                    [p.studentId]: {
                                      ...ov,
                                      scheduledTime: e.target.value
                                    }
                                  }))
                                }
                                className="w-full px-2 py-1 rounded border border-slate-300 font-semibold text-[11px]"
                              />
                            </td>
                            <td className="p-1.5">
                              {scheduleTargetSubmission.category === 'kenaikan_jilid' ? (
                                <div className="w-full px-2 py-1 rounded bg-slate-100 border border-slate-200 font-semibold text-[11px] text-slate-700 truncate">
                                  {coordinatorName}
                                </div>
                              ) : (
                                <select
                                  value={ov.examinerName}
                                  onChange={e =>
                                    setSchedParticipantOverrides(prev => ({
                                      ...prev,
                                      [p.studentId]: {
                                        ...ov,
                                        examinerName: e.target.value
                                      }
                                    }))
                                  }
                                  className="w-full px-2 py-1 rounded bg-white border border-slate-300 font-semibold text-[11px] text-slate-900 cursor-pointer"
                                >
                                  {!allExaminerTeachers.includes(ov.examinerName) &&
                                    ov.examinerName && (
                                      <option value={ov.examinerName}>{ov.examinerName}</option>
                                    )}
                                  {allExaminerTeachers.map(tName => (
                                    <option key={tName} value={tName}>
                                      {tName}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Status Konfirmasi Ujian:
                </label>
                <select
                  value={schedStatus}
                  onChange={e => setSchedStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                >
                  <option value="Terjadwal">Dikonfirmasi / Terjadwal (Aktifkan Surat Orang Tua)</option>
                  <option value="Selesai">Selesai Diuji</option>
                  <option value="Diajukan Musyrif">Diajukan Musyrif (Menunggu Konfirmasi)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs cursor-pointer"
                >
                  Simpan Konfirmasi Waktu & Penguji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: KONFIRMASI HAPUS PENGAJUAN                                       */}
      {/* ========================================================================= */}
      {deleteConfirmSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Hapus Formulir Pengajuan?
              </h3>
              <p className="text-xs text-slate-500">
                Pengajuan oleh <strong>{deleteConfirmSub.teacherName}</strong> ({deleteConfirmSub.participants.length} siswa) akan dihapus secara permanen.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmSub(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
