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
