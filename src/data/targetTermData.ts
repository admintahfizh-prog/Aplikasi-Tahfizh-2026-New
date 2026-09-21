import { TermName, Student } from '../types';

export interface TermDefinition {
  term: TermName;
  label: string;
  months: string;
  monthsRange: string;
  defaultDeadline: string;
  description: string;
  quarterIndex: number;
}

export const TERM_DEFINITIONS: TermDefinition[] = [
  {
    term: 'Term 1',
    label: 'Term 1 (Triwulan 1)',
    months: 'Juli - September',
    monthsRange: 'Bulan 1 - 3',
    defaultDeadline: '2026-09-30',
    description: 'Awal Tahun Pelajaran: Orientasi makhraj, pemantapan jilid dasar Ummi, dan akselerasi ziyadah surat-surat awal.',
    quarterIndex: 1
  },
  {
    term: 'Term 2',
    label: 'Term 2 (Triwulan 2)',
    months: 'Oktober - Desember',
    monthsRange: 'Bulan 4 - 6',
    defaultDeadline: '2026-12-31',
    description: 'Tengah Semester s/d Akhir Semester Ganjil: Pemantapan hukum bacaan, evaluasi semester ganjil, dan penuntasan target juz pertama.',
    quarterIndex: 2
  },
  {
    term: 'Term 3',
    label: 'Term 3 (Triwulan 3)',
    months: 'Januari - Maret',
    monthsRange: 'Bulan 7 - 9',
    defaultDeadline: '2027-03-31',
    description: 'Awal Semester Genap: Peningkatan ritme hafalan, transisi Ummi Al-Qur\'an/Gharib/Tajwid, dan pembinaan intensif pra-munaqosyah.',
    quarterIndex: 3
  },
  {
    term: 'Term 4',
    label: 'Term 4 (Triwulan 4)',
    months: 'April - Juni',
    monthsRange: 'Bulan 10 - 12',
    defaultDeadline: '2027-06-30',
    description: 'Puncak Akhir Tahun Pelajaran: Ujian Munaqosyah Ummi, Ujian Khotmil Qur\'an, Tasmi\' Akbar, dan Penilaian Akhir Tahun (PAT).',
    quarterIndex: 4
  }
];

export interface TermCurriculumStandard {
  program: string;
  category: 'Hafalan' | 'Ummi';
  level: string; // 'Semua Kelas' | 'Kelas 7' | 'Kelas 8' | 'Kelas 9'
  annualTarget: string;
  terms: {
    term: TermName;
    targetValue: string;
    targetNumber: number; // juz or page count
    materialSummary: string;
    competencyIndicator: string;
  }[];
}

// Standar Kurikulum Target Hafalan Al-Qur'an per Term
export const HAFALAN_TERM_STANDARDS: TermCurriculumStandard[] = [
  {
    program: 'Reguler Tahfizh / Bilingual',
    category: 'Hafalan',
    level: 'Semua Kelas',
    annualTarget: '2.0 Juz / Tahun',
    terms: [
      {
        term: 'Term 1',
        targetValue: '0.5 Juz',
        targetNumber: 0.5,
        materialSummary: 'An-Nas s/d Al-A\'la (atau 10 lembar awal juz berjalan)',
        competencyIndicator: 'Mampu melafalkan surat pendek dengan makhraj fasih, tajwid dasar tepat, dan hafal lancar tanpa terputus.'
      },
      {
        term: 'Term 2',
        targetValue: '1.0 Juz (Kumulatif)',
        targetNumber: 1.0,
        materialSummary: 'Ath-Thariq s/d An-Naba (Tuntas 1 Juz penuh misal Juz 30)',
        competencyIndicator: 'Tuntas tasmi\' 1 juz sekali duduk dengan predikat minimal Jayyid (Baik).'
      },
      {
        term: 'Term 3',
        targetValue: '1.5 Juz (Kumulatif)',
        targetNumber: 1.5,
        materialSummary: 'Al-Mursalat s/d Al-Ma\'arij (atau 10 lembar juz berikutnya)',
        competencyIndicator: 'Murojaah juz lama terjaga stabil, ziyadah juz baru berjalan teratur minimal 2 baris/hari.'
      },
      {
        term: 'Term 4',
        targetValue: '2.0 Juz (Kumulatif)',
        targetNumber: 2.0,
        materialSummary: 'Al-Haqqah s/d Al-Mulk (Tuntas 2 Juz penuh)',
        competencyIndicator: 'Lulus Ujian Tasmi\' 2 Juz Akhir Tahun dan siap mengikuti wisuda tahfizh tingkat sekolah.'
      }
    ]
  },
  {
    program: 'Tahfizh Unggulan',
    category: 'Hafalan',
    level: 'Semua Kelas',
    annualTarget: '4.0 Juz / Tahun',
    terms: [
      {
        term: 'Term 1',
        targetValue: '1.0 Juz',
        targetNumber: 1.0,
        materialSummary: 'Ziyadah 1 Juz penuh pertama (misal Juz 29 / Juz 1)',
        competencyIndicator: 'Setoran ziyadah konsisten 1 halaman/hari, murojaah 1/4 juz harian tanpa salah makhraj berat.'
      },
      {
        term: 'Term 2',
        targetValue: '2.0 Juz (Kumulatif)',
        targetNumber: 2.0,
        materialSummary: 'Ziyadah 1 Juz kedua (Total 2 Juz tuntas)',
        competencyIndicator: 'Tasmi\' kelipatan 2 Juz sekali duduk dengan nilai minimal Jayyid Jiddan (Sangat Baik).'
      },
      {
        term: 'Term 3',
        targetValue: '3.0 Juz (Kumulatif)',
        targetNumber: 3.0,
        materialSummary: 'Ziyadah 1 Juz ketiga (Total 3 Juz tuntas)',
        competencyIndicator: 'Murojaah mandiri bersama kelompok halaqah, tasmi\' antar teman sebaya, persiapan munaqosyah tahfizh.'
      },
      {
        term: 'Term 4',
        targetValue: '4.0 Juz (Kumulatif)',
        targetNumber: 4.0,
        materialSummary: 'Ziyadah 1 Juz keempat (Total 4 Juz tuntas penuh)',
        competencyIndicator: 'Lulus Munaqosyah Tahfizh Al-Azhar dengan predikat Mumtaz/Jayyid Jiddan, sertifikasi resmi.'
      }
    ]
  },
  {
    program: 'Akselerasi Tahfizh',
    category: 'Hafalan',
    level: 'Semua Kelas',
    annualTarget: '6.0 Juz / Tahun',
    terms: [
      {
        term: 'Term 1',
        targetValue: '1.5 Juz',
        targetNumber: 1.5,
        materialSummary: 'Ziyadah 1.5 Juz (Ritme intensif 1 - 2 halaman/hari)',
        competencyIndicator: 'Tasmi\' per 5 lembar tanpa jeda, pembiasaan tilawah 1 juz/hari.'
      },
      {
        term: 'Term 2',
        targetValue: '3.0 Juz (Kumulatif)',
        targetNumber: 3.0,
        materialSummary: 'Ziyadah 1.5 Juz (Total 3 Juz tuntas)',
        competencyIndicator: 'Tasmi\' 3 Juz sekali duduk di depan tim penguji halaqah tahfizh.'
      },
      {
        term: 'Term 3',
        targetValue: '4.5 Juz (Kumulatif)',
        targetNumber: 4.5,
        materialSummary: 'Ziyadah 1.5 Juz (Total 4.5 Juz tuntas)',
        competencyIndicator: 'Mutqin 4 Juz pertama, stabil dalam muraja\'ah sholat lail dan kegiatan tahfizh camp.'
      },
      {
        term: 'Term 4',
        targetValue: '6.0 Juz (Kumulatif)',
        targetNumber: 6.0,
        materialSummary: 'Ziyadah 1.5 Juz (Total 6 Juz tuntas penuh)',
        competencyIndicator: 'Sertifikasi Khotmil Qur\'an 6 Juz Al-Azhar, predikat Istimewa.'
      }
    ]
  }
];

// Standar Kurikulum Target Metode UMMI per Term (Khusus Jenjang Kelas 7)
export const UMMI_TERM_STANDARDS: TermCurriculumStandard[] = [
  {
    program: 'Jalur Standar Ummi (Awal Masuk Jilid 1 / Jilid 2)',
    category: 'Ummi',
    level: 'Kelas 7',
    annualTarget: 'Tuntas Jilid 1, 2, 3 & Masuk Al-Qur\'an/Gharib',
    terms: [
      {
        term: 'Term 1',
        targetValue: 'Tuntas Jilid 1 (Hal 40)',
        targetNumber: 40,
        materialSummary: 'Jilid 1 Hal 1 - 40: Huruf Tunggal & Sambung, Harakat Fathah-Kasrah-Dhammah, Mad Thabi\'i 2 Harakat',
        competencyIndicator: 'Lancar membaca huruf hijaiyyah langsung bunyi 1 ketukan tanpa mengeja, tathbiq harakat presisi.'
      },
      {
        term: 'Term 2',
        targetValue: 'Tuntas Jilid 2 (Hal 40)',
        targetNumber: 40,
        materialSummary: 'Jilid 2 Hal 1 - 40: Harakat Tanwin, Huruf Sukun/Mati, Huruf Bertasydid, Alif Lam Syamsiyah & Qamariyah',
        competencyIndicator: 'Mampu membedakan mad thabi\'i dengan tasydid, membaca ghunnah pada nun/mim bertasydid 2 harakat stabil.'
      },
      {
        term: 'Term 3',
        targetValue: 'Tuntas Jilid 3 (Hal 40)',
        targetNumber: 40,
        materialSummary: 'Jilid 3 Hal 1 - 40: Tanda Waqaf, Mad Wajib/Jaiz (4-5 Harakat), Mad Lazim (6 Harakat), Hukum Nun Sukun/Tanwin',
        competencyIndicator: 'Mampu berhenti pada tanda waqaf secara benar (sukun/mad iwadl) dan menerapkan hukum idgham/ikhfa dengan benar.'
      },
      {
        term: 'Term 4',
        targetValue: 'Tuntas Al-Qur\'an & Gharib/Tajwid',
        targetNumber: 100,
        materialSummary: 'Buku Al-Qur\'an Remaja / Mushaf Standar, Pengenalan Bacaan Gharib (Isymam, Imalah, Tashil), Kaidah Tajwid Praktis',
        competencyIndicator: 'Lulus Pra-Munaqosyah & Ujian Munaqosyah Ummi Daerah dengan nilai standar kelulusan minimal 75.'
      }
    ]
  },
  {
    program: 'Jalur Lanjutan / Akselerasi Ummi (Awal Masuk Jilid 3 / Al-Qur\'an / Munaqosyah)',
    category: 'Ummi',
    level: 'Kelas 7',
    annualTarget: 'Tuntas Al-Qur\'an, Gharib, Tajwid & Lulus Munaqosyah',
    terms: [
      {
        term: 'Term 1',
        targetValue: 'Tuntas Jilid 3 & Al-Qur\'an Hal 1-150',
        targetNumber: 150,
        materialSummary: 'Penuntasan kaidah dasar & tartil mushaf Al-Qur\'an juz awal dengan irama Ummi (Hijaz/Rost)',
        competencyIndicator: 'Kelancaran tilawah 1 juz/minggu, nafas stabil, waqaf wal ibtida\' tepat.'
      },
      {
        term: 'Term 2',
        targetValue: 'Tuntas Buku Gharib Ummi',
        targetNumber: 40,
        materialSummary: 'Hafal seluruh kaidah ayat-ayat gharib (Saktah, Isymam, Imalah, Tashil, Naql, Shifr Mustadir/Mustathil)',
        competencyIndicator: 'Mampu melafalkan ayat gharib secara refleks dan menerangkan letak surat, ayat, serta cara membacanya.'
      },
      {
        term: 'Term 3',
        targetValue: 'Tuntas Buku Tajwid Praktis Ummi',
        targetNumber: 40,
        materialSummary: 'Hafal definisi, rumus, dan contoh hukum nun sukun, mim sukun, idgham mutamatsilain/mutajanisain, makhraj & shifatul huruf',
        competencyIndicator: 'Mampu menjawab pertanyaan uji teori tajwid dan membaca contoh ayatnya secara fasih.'
      },
      {
        term: 'Term 4',
        targetValue: 'Lulus Ujian Munaqosyah & Khotmil Qur\'an',
        targetNumber: 100,
        materialSummary: 'Ujian Munaqosyah resmi oleh Trainer Ummi Foundation (Kategori: Tartil Al-Qur\'an, Fashahah, Gharib & Tajwid)',
        competencyIndicator: 'Mendapatkan Syahadah Kelulusan Ummi Resmi & tampil di Panggung Wisuda Khotmil Qur\'an.'
      }
    ]
  }
];

// Helper to determine standard target for a student in a specific term
export function getStudentStandardTermTarget(
  student: Student,
  term: TermName,
  category: 'Hafalan' | 'Ummi'
): {
  targetValue: string;
  targetNumber: number;
  targetJilid?: string;
  targetPage?: number;
  deadline: string;
  notes: string;
} {
  const termDef = TERM_DEFINITIONS.find(t => t.term === term) || TERM_DEFINITIONS[0];
  const qIndex = termDef.quarterIndex; // 1, 2, 3, 4

  if (category === 'Hafalan') {
    const isUnggulan = student.program === 'Tahfizh Unggulan';
    const isAkselerasi = student.program === 'Akselerasi';
    const annualTarget = student.targetJuz || (isAkselerasi ? 6.0 : isUnggulan ? 4.0 : 2.0);
    
    // Pecah target tahunan ke dalam 4 term kumulatif
    const targetNumber = Number(((annualTarget / 4) * qIndex).toFixed(1));
    return {
      targetValue: `${targetNumber} Juz`,
      targetNumber,
      deadline: termDef.defaultDeadline,
      notes: `Target ${term} hafalan Al-Qur'an program ${student.program || 'Reguler'}.`
    };
  } else {
    // Ummi Target (Khusus Kelas 7)
    // Berdasarkan currentUmmiJilid awal atau posisi masuk
    const currentJilid = (student.currentUmmiJilid || 'Jilid 1').trim();
    const isAdvanced = ['Jilid 3', 'Al-Qur\'an', 'Gharib', 'Tajwid', 'Munaqosyah'].includes(currentJilid);

    if (!isAdvanced) {
      // Standar: T1 -> Jilid 1 Hal 40, T2 -> Jilid 2 Hal 40, T3 -> Jilid 3 Hal 40, T4 -> Al-Qur'an & Munaqosyah
      if (qIndex === 1) {
        return {
          targetValue: 'Tuntas Jilid 1',
          targetNumber: 40,
          targetJilid: 'Jilid 1',
          targetPage: 40,
          deadline: termDef.defaultDeadline,
          notes: 'Target Term 1: Menuntaskan Jilid 1 (Hal 1-40) dengan makhraj dan harakat tepat.'
        };
      } else if (qIndex === 2) {
        return {
          targetValue: 'Tuntas Jilid 2',
          targetNumber: 40,
          targetJilid: 'Jilid 2',
          targetPage: 40,
          deadline: termDef.defaultDeadline,
          notes: 'Target Term 2: Menuntaskan Jilid 2 (Hal 1-40) mengenai tanwin, sukun, dan tasydid.'
        };
      } else if (qIndex === 3) {
        return {
          targetValue: 'Tuntas Jilid 3',
          targetNumber: 40,
          targetJilid: 'Jilid 3',
          targetPage: 40,
          deadline: termDef.defaultDeadline,
          notes: 'Target Term 3: Menuntaskan Jilid 3 (Hal 1-40) mengenai waqaf dan mad far\'i.'
        };
      } else {
        return {
          targetValue: 'Al-Qur\'an & Munaqosyah',
          targetNumber: 100,
          targetJilid: 'Munaqosyah',
          targetPage: 1,
          deadline: termDef.defaultDeadline,
          notes: 'Target Term 4: Transisi Al-Qur\'an dan persiapan Ujian Munaqosyah Ummi.'
        };
      }
    } else {
      // Jalur Lanjutan:
      if (qIndex === 1) {
        return {
          targetValue: 'Tuntas Jilid 3 / Al-Qur\'an',
          targetNumber: 100,
          targetJilid: 'Al-Qur\'an',
          targetPage: 50,
          deadline: termDef.defaultDeadline,
          notes: 'Target Term 1: Pemantapan tilawah Al-Qur\'an Juz 1 - 2 tartil Ummi.'
        };
      } else if (qIndex === 2) {
        return {
          targetValue: 'Tuntas Gharibul Qur\'an',
          targetNumber: 40,
          targetJilid: 'Gharib',
          targetPage: 40,
          deadline: termDef.defaultDeadline,
          notes: 'Target Term 2: Tuntas menghafal kaidah ayat-ayat gharib Ummi.'
        };
      } else if (qIndex === 3) {
        return {
          targetValue: 'Tuntas Tajwid Praktis',
          targetNumber: 40,
          targetJilid: 'Tajwid',
          targetPage: 40,
          deadline: termDef.defaultDeadline,
          notes: 'Target Term 3: Tuntas kaidah tajwid praktis dan latihan soal munaqosyah.'
        };
      } else {
        return {
          targetValue: 'Lulus Munaqosyah',
          targetNumber: 100,
          targetJilid: 'Munaqosyah',
          targetPage: 1,
          deadline: termDef.defaultDeadline,
          notes: 'Target Term 4: Lulus Ujian Munaqosyah Ummi dan siap Wisuda Khotmil Qur\'an.'
        };
      }
    }
  }
}

// Evaluasi status ketercapaian target hafalan untuk term tertentu
export function evaluateHafalanTerm(
  achievedJuz: number,
  targetJuz: number
): {
  percentage: number;
  remainingJuz: number;
  status: 'on-track' | 'needs-attention' | 'behind';
} {
  const percentage = Math.min(100, Math.round((achievedJuz / (targetJuz || 1)) * 100));
  const remainingJuz = Math.max(0, Number(((targetJuz || 0) - achievedJuz).toFixed(1)));
  const status = percentage >= 70 ? 'on-track' : percentage >= 40 ? 'needs-attention' : 'behind';
  return { percentage, remainingJuz, status };
}

// Peringkat jenjang Jilid Ummi untuk kalkulasi progress
const UMMI_JILID_ORDER: Record<string, number> = {
  'Jilid 1': 1,
  'Jilid 2': 2,
  'Jilid 3': 3,
  'Al-Qur\'an': 4,
  'Al-Quran': 4,
  'Gharib': 5,
  'Tajwid': 6,
  'Munaqosyah': 7,
  'Tahfizh': 8
};

// Evaluasi status ketercapaian target Ummi untuk term tertentu
export function evaluateUmmiTerm(
  currentJilid: string,
  currentPage: number,
  targetJilid: string,
  targetPage: number
): {
  percentage: number;
  status: 'on-track' | 'needs-attention' | 'behind';
  summary: string;
} {
  const currentRank = UMMI_JILID_ORDER[currentJilid] || 1;
  const targetRank = UMMI_JILID_ORDER[targetJilid] || 1;

  if (currentRank > targetRank) {
    return {
      percentage: 100,
      status: 'on-track',
      summary: `Melampaui Target (Sudah di ${currentJilid})`
    };
  }

  if (currentRank === targetRank) {
    const pct = Math.min(100, Math.round(((currentPage || 1) / (targetPage || 40)) * 100));
    const status = pct >= 75 ? 'on-track' : pct >= 40 ? 'needs-attention' : 'behind';
    return {
      percentage: pct,
      status,
      summary: `${pct}% menuju tuntas ${targetJilid}`
    };
  }

  // Jika jilid santri masih di bawah target jilid
  const gap = targetRank - currentRank;
  const basePct = Math.max(10, Math.round(((currentRank + ((currentPage || 1) / 40)) / targetRank) * 60));
  const status = gap === 1 && (currentPage || 1) >= 25 ? 'needs-attention' : 'behind';
  return {
    percentage: Math.min(65, basePct),
    status,
    summary: `Tertinggal ${gap} jilid dari target ${targetJilid}`
  };
}
