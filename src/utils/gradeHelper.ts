import { Student, ClassItem } from '../types';

/**
 * Memeriksa apakah suatu kelas adalah Kelas 7
 */
export function isGrade7Class(classItem?: ClassItem | null): boolean {
  if (!classItem) return false;
  const gradeStr = String(classItem.grade || '').trim();
  const levelNum = Number(classItem.level);
  const nameStr = String(classItem.name || '').trim();
  return (
    gradeStr === '7' ||
    levelNum === 7 ||
    nameStr.startsWith('7') ||
    nameStr.startsWith('VII') ||
    classItem.id.startsWith('cls-7') ||
    classItem.id.startsWith('c-7')
  );
}

/**
 * Memeriksa apakah suatu kelas adalah Kelas 8 atau Kelas 9
 */
export function isGrade8or9Class(classItem?: ClassItem | null): boolean {
  if (!classItem) return false;
  const gradeStr = String(classItem.grade || '').trim();
  const levelNum = Number(classItem.level);
  const nameStr = String(classItem.name || '').trim();
  return (
    gradeStr === '8' ||
    gradeStr === '9' ||
    levelNum === 8 ||
    levelNum === 9 ||
    nameStr.startsWith('8') ||
    nameStr.startsWith('9') ||
    nameStr.startsWith('VIII') ||
    nameStr.startsWith('IX') ||
    classItem.id.startsWith('cls-8') ||
    classItem.id.startsWith('cls-9') ||
    classItem.id.startsWith('c-8') ||
    classItem.id.startsWith('c-9')
  );
}

/**
 * Memeriksa apakah seorang santri berada di Kelas 8 atau Kelas 9
 */
export function isGrade8or9Student(student?: Student | null, classes?: ClassItem[]): boolean {
  if (!student) return false;
  
  if (student.classId) {
    if (
      student.classId.startsWith('cls-8') ||
      student.classId.startsWith('cls-9') ||
      student.classId.startsWith('c-8') ||
      student.classId.startsWith('c-9')
    ) {
      return true;
    }
  }

  if (classes && classes.length > 0) {
    const cls = classes.find(c => c.id === student.classId);
    if (cls) {
      return isGrade8or9Class(cls);
    }
  }

  return false;
}

/**
 * Memeriksa apakah santri berhak/mengikuti pembelajaran Metode Ummi
 * Kebijakan Tahun Ajaran Ini:
 * - Kelas 8 dan 9 TIDAK mengikuti pembelajaran UMMI dan TIDAK masuk jilid Ummi.
 * - Pembelajaran Metode UMMI dan jilid Ummi dikhususkan untuk Kelas 7 (tetap/tidak berubah).
 */
export function isUmmiEnrolledStudent(student?: Student | null, classes?: ClassItem[]): boolean {
  if (!student) return false;
  return !isGrade8or9Student(student, classes);
}

/**
 * Memeriksa apakah suatu kelas atau santri berada di Kelas 7B s/d 7E (7B, 7C, 7D, 7E)
 */
export function isClass7Bto7E(
  student?: Student | null,
  classes?: ClassItem[],
  studentClass?: ClassItem | null
): boolean {
  const cls =
    studentClass ||
    (student && classes ? classes.find(c => c.id === student.classId) : null);

  const candidates = [
    cls?.name || '',
    cls?.id || '',
    student?.classId || ''
  ];

  // Cocokkan kelas 7B, 7C, 7D, 7E atau VII B, VII C, VII D, VII E
  const regex7Bto7E = /(?:^|[^0-9a-z])(?:7|vii)\s*[-.]?\s*[bcde](?:$|[^a-z0-9])/i;
  return candidates.some(str => regex7Bto7E.test(String(str || '').trim()));
}

/**
 * Mengecek apakah nilai target hafalan raport masih berupa nilai default lama
 * yang perlu disesuaikan ke target standar Term 1 Kelas 7B-7E ("Al-Kautsar : 3")
 */
export function isLegacyDefaultRaportTarget(val?: string): boolean {
  if (!val || !val.trim()) return true;
  const v = val.trim().toLowerCase();
  if (v === "al-a'raf : 2" || v === "al-a'raf: 2" || v === 'al-araf : 2' || v === 'al-araf: 2') return true;
  if (/^target\s+\d+(\.\d+)?\s*juz$/i.test(v)) return true;
  if (/^\d+(\.\d+)?\s*juz$/i.test(v)) return true;
  return false;
}

/**
 * Mendapatkan target hafalan raport untuk santri berdasarkan kelas dan periode/term.
 * Untuk Term 1 (Tengah Semester 1) Kelas 7B-7E, target hafalan adalah "Al-Kautsar : 3".
 */
export function resolveRaportTargetHafalan(
  student?: Student | null,
  classes?: ClassItem[],
  studentClass?: ClassItem | null,
  periodTitle?: string
): string {
  if (!student) return "Al-A'raf : 2";

  const isTerm1 =
    !periodTitle ||
    periodTitle.toUpperCase().includes('TENGAH SEMESTER 1') ||
    periodTitle.toUpperCase().includes('TERM 1') ||
    periodTitle.toUpperCase().includes('PTS 1');

  const in7Bto7E = isClass7Bto7E(student, classes, studentClass);

  if (in7Bto7E && isTerm1) {
    const saved = (student.raportTargetHafalan || student.targetSuratAyat || '').trim();
    if (!saved || isLegacyDefaultRaportTarget(saved)) {
      return 'Al-Kautsar : 3';
    }
    return saved;
  }

  return (
    student.raportTargetHafalan ||
    student.targetSuratAyat ||
    (student.targetJuz ? `Target ${student.targetJuz} Juz` : "Al-A'raf : 2")
  );
}

