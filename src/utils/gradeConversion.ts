// ===================================================
// KONVERSI NILAI STANDAR METODE UMMI & HAFALAN AL-QUR'AN
// Sesuai Buku Pedoman Pengajaran Al-Qur'an Metode Ummi
// ===================================================

export type GradeLetter = 'A+' | 'A' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D';
export type ProgressAction = 'lanjut' | 'ulangi';

export interface GradeConversionInfo {
  grade: GradeLetter;
  letter: GradeLetter;
  scoreRange: string;
  standardScore: number;
  scoreStandard: number;
  minScore: number;
  maxScore: number;
  errors: string; // e.g. "0", "-1", "-2", etc.
  errorCount: number;
  action: ProgressAction;
  canAdvance: boolean;
  actionLabel: string; // "Naik ke halaman berikutnya" | "Naik, tapi diulangi dulu halaman tsb" | "Belum boleh dinaikkan/diulangi lagi"
  actionDescription: string;
  description: string;
  ruleDescription: string;
}

export const GRADE_CONVERSION_TABLE: GradeConversionInfo[] = [
  {
    grade: 'A+',
    letter: 'A+',
    scoreRange: '95 - 100',
    standardScore: 98,
    scoreStandard: 98,
    minScore: 95,
    maxScore: 100,
    errors: '0',
    errorCount: 0,
    action: 'lanjut',
    canAdvance: true,
    actionLabel: 'Naik ke halaman berikutnya',
    actionDescription: 'Naik ke halaman berikutnya',
    description: 'Jika siswa dalam membaca satu halaman benar semua dan kualitasnya bagus sekali',
    ruleDescription: 'Jika siswa dalam membaca satu halaman benar semua dan kualitasnya bagus sekali'
  },
  {
    grade: 'A',
    letter: 'A',
    scoreRange: '90 - 94',
    standardScore: 92,
    scoreStandard: 92,
    minScore: 90,
    maxScore: 94,
    errors: '0',
    errorCount: 0,
    action: 'lanjut',
    canAdvance: true,
    actionLabel: 'Naik ke halaman berikutnya',
    actionDescription: 'Naik ke halaman berikutnya',
    description: 'Jika siswa dalam membaca satu halaman benar semua dan kualitas bacanya biasa-biasa',
    ruleDescription: 'Jika siswa dalam membaca satu halaman benar semua dan kualitas bacanya biasa-biasa'
  },
  {
    grade: 'B+',
    letter: 'B+',
    scoreRange: '85',
    standardScore: 85,
    scoreStandard: 85,
    minScore: 85,
    maxScore: 89,
    errors: '-1',
    errorCount: 1,
    action: 'lanjut',
    canAdvance: true,
    actionLabel: 'Naik ke halaman berikutnya',
    actionDescription: 'Naik ke halaman berikutnya',
    description: 'Jika siswa dalam membaca satu halaman salah satu kali dan bisa membetulkan sendiri',
    ruleDescription: 'Jika siswa dalam membaca satu halaman salah satu kali dan bisa membetulkan sendiri'
  },
  {
    grade: 'B',
    letter: 'B',
    scoreRange: '80',
    standardScore: 80,
    scoreStandard: 80,
    minScore: 80,
    maxScore: 84,
    errors: '-2',
    errorCount: 2,
    action: 'lanjut',
    canAdvance: true,
    actionLabel: 'Naik ke halaman berikutnya',
    actionDescription: 'Naik ke halaman berikutnya',
    description: 'Jika siswa dalam membaca satu halaman salah dua kali dan bisa membetulkan sendiri',
    ruleDescription: 'Jika siswa dalam membaca satu halaman salah dua kali dan bisa membetulkan sendiri'
  },
  {
    grade: 'B-',
    letter: 'B-',
    scoreRange: '75',
    standardScore: 75,
    scoreStandard: 75,
    minScore: 75,
    maxScore: 79,
    errors: '-3',
    errorCount: 3,
    action: 'ulangi',
    canAdvance: false,
    actionLabel: 'Naik, tapi diulangi dulu halaman tsb',
    actionDescription: 'Naik, tapi diulangi dulu halaman tsb',
    description: 'Jika siswa dalam membaca satu halaman salah tiga kali dan bisa membetulkan sendiri',
    ruleDescription: 'Jika siswa dalam membaca satu halaman salah tiga kali dan bisa membetulkan sendiri'
  },
  {
    grade: 'C+',
    letter: 'C+',
    scoreRange: '70',
    standardScore: 70,
    scoreStandard: 70,
    minScore: 70,
    maxScore: 74,
    errors: '-4',
    errorCount: 4,
    action: 'ulangi',
    canAdvance: false,
    actionLabel: 'Belum boleh dinaikkan/diulangi lagi',
    actionDescription: 'Belum boleh dinaikkan/diulangi lagi',
    description: 'Jika siswa dalam membaca satu halaman salah empat kali dan bisa membetulkan sendiri',
    ruleDescription: 'Jika siswa dalam membaca satu halaman salah empat kali dan bisa membetulkan sendiri'
  },
  {
    grade: 'C',
    letter: 'C',
    scoreRange: '65',
    standardScore: 65,
    scoreStandard: 65,
    minScore: 65,
    maxScore: 69,
    errors: '-5',
    errorCount: 5,
    action: 'ulangi',
    canAdvance: false,
    actionLabel: 'Belum boleh dinaikkan/diulangi lagi',
    actionDescription: 'Belum boleh dinaikkan/diulangi lagi',
    description: 'Jika siswa dalam membaca satu halaman salah lima kali dan bisa membetulkan sendiri',
    ruleDescription: 'Jika siswa dalam membaca satu halaman salah lima kali dan bisa membetulkan sendiri'
  },
  {
    grade: 'C-',
    letter: 'C-',
    scoreRange: '60',
    standardScore: 60,
    scoreStandard: 60,
    minScore: 60,
    maxScore: 64,
    errors: '-6',
    errorCount: 6,
    action: 'ulangi',
    canAdvance: false,
    actionLabel: 'Belum boleh dinaikkan/diulangi lagi',
    actionDescription: 'Belum boleh dinaikkan/diulangi lagi',
    description: 'Jika siswa dalam membaca satu halaman salah enam kali dan bisa membetulkan sendiri',
    ruleDescription: 'Jika siswa dalam membaca satu halaman salah enam kali dan bisa membetulkan sendiri'
  },
  {
    grade: 'D',
    letter: 'D',
    scoreRange: '< 60',
    standardScore: 50,
    scoreStandard: 50,
    minScore: 0,
    maxScore: 59,
    errors: '-7',
    errorCount: 7,
    action: 'ulangi',
    canAdvance: false,
    actionLabel: 'Belum boleh dinaikkan/diulangi lagi',
    actionDescription: 'Belum boleh dinaikkan/diulangi lagi',
    description: 'Jika siswa salah lebih dari enam kali atau belum bisa memperbaiki/tetap salah',
    ruleDescription: 'Jika siswa salah lebih dari enam kali atau belum bisa memperbaiki/tetap salah'
  }
];

export function getGradeFromScore(score: number): GradeConversionInfo {
  if (score >= 95) return GRADE_CONVERSION_TABLE[0]; // A+
  if (score >= 90) return GRADE_CONVERSION_TABLE[1]; // A
  if (score >= 85) return GRADE_CONVERSION_TABLE[2]; // B+
  if (score >= 80) return GRADE_CONVERSION_TABLE[3]; // B
  if (score >= 75) return GRADE_CONVERSION_TABLE[4]; // B-
  if (score >= 70) return GRADE_CONVERSION_TABLE[5]; // C+
  if (score >= 65) return GRADE_CONVERSION_TABLE[6]; // C
  if (score >= 60) return GRADE_CONVERSION_TABLE[7]; // C-
  return GRADE_CONVERSION_TABLE[8]; // D
}

export function getGradeFromLetter(letter: string): GradeConversionInfo {
  const found = GRADE_CONVERSION_TABLE.find(g => g.grade.toUpperCase() === letter.toUpperCase().trim());
  return found || GRADE_CONVERSION_TABLE[1]; // default to A
}

export function getGradeFromErrors(errors: number, exceptionalQuality: boolean = false): GradeConversionInfo {
  if (errors <= 0) {
    return exceptionalQuality ? GRADE_CONVERSION_TABLE[0] : GRADE_CONVERSION_TABLE[1];
  }
  if (errors === 1) return GRADE_CONVERSION_TABLE[2]; // B+
  if (errors === 2) return GRADE_CONVERSION_TABLE[3]; // B
  if (errors === 3) return GRADE_CONVERSION_TABLE[4]; // B-
  if (errors === 4) return GRADE_CONVERSION_TABLE[5]; // C+
  if (errors === 5) return GRADE_CONVERSION_TABLE[6]; // C
  if (errors === 6) return GRADE_CONVERSION_TABLE[7]; // C-
  return GRADE_CONVERSION_TABLE[8]; // D
}

export function getGradeBadgeClass(grade: GradeLetter | string): string {
  switch (grade) {
    case 'A+':
      return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold';
    case 'A':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
    case 'B+':
      return 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
    case 'B':
      return 'bg-blue-50 text-blue-800 border-blue-200 font-bold';
    case 'B-':
      return 'bg-cyan-50 text-cyan-800 border-cyan-200 font-semibold';
    case 'C+':
      return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    case 'C':
      return 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
    case 'C-':
      return 'bg-orange-50 text-orange-800 border-orange-200 font-semibold';
    case 'D':
      return 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}
