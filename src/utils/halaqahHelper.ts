import { Student, Teacher, HalaqahGroup, User, UserProfile } from '../types';

/**
 * Mencari data Guru dari user yang sedang login
 */
export function resolveCurrentTeacher(
  currentUser: User | UserProfile | null | undefined,
  teachers: Teacher[]
): Teacher | undefined {
  if (!currentUser || !teachers || teachers.length === 0) return undefined;

  // 1. Cek dari field teacherId pada User
  if (currentUser.teacherId) {
    const found = teachers.find(t => t.id === currentUser.teacherId);
    if (found) return found;
  }

  // 2. Cek kesamaan ID
  const directId = teachers.find(t => t.id === currentUser.id || currentUser.id === `usr-t-${t.id}` || currentUser.id === `usr-guru-${t.id.replace('t-', '')}`);
  if (directId) return directId;

  // 3. Cek kesamaan email
  if (currentUser.email) {
    const byEmail = teachers.find(t => t.email && t.email.toLowerCase() === currentUser.email.toLowerCase());
    if (byEmail) return byEmail;
  }

  // 4. Cek kesamaan nama
  if (currentUser.name) {
    const cName = currentUser.name.toLowerCase().replace(/ustadz|ustadzah|lc\.|s\.pd|s\.pd\.i|m\.ag/g, '').trim();
    const byName = teachers.find(t => {
      const tName = t.name.toLowerCase().replace(/ustadz|ustadzah|lc\.|s\.pd|s\.pd\.i|m\.ag/g, '').trim();
      return tName.includes(cName) || cName.includes(tName);
    });
    if (byName) return byName;
  }

  return undefined;
}

export interface StudentHalaqahInfo {
  groupId?: string;
  groupName: string;
  teacherId?: string;
  teacherName: string;
  schedule?: string;
  room?: string;
}

/**
 * Mendapatkan informasi Halaqah untuk seorang Santri
 */
export function getStudentHalaqahInfo(
  student: Student,
  halaqahGroups: HalaqahGroup[],
  teachers: Teacher[]
): StudentHalaqahInfo {
  // 1. Cek kecocokan di halaqahGroups berdasarkan studentIds atau halaqahGroupId
  const group = halaqahGroups.find(g => 
    (g.studentIds && g.studentIds.includes(student.id)) ||
    (student.halaqahGroupId && g.id === student.halaqahGroupId)
  );

  if (group) {
    const teacher = teachers.find(t => t.id === group.teacherId);
    return {
      groupId: group.id,
      groupName: group.name,
      teacherId: group.teacherId,
      teacherName: group.teacherName || teacher?.name || 'Ustadz Pembimbing',
      schedule: group.schedule,
      room: group.room
    };
  }

  // 2. Fallback: jika student punya halaqahGroupName tapi belum ada di studentIds
  if (student.halaqahGroupName) {
    const matchingByName = halaqahGroups.find(g => g.name.toLowerCase() === student.halaqahGroupName?.toLowerCase());
    if (matchingByName) {
      const teacher = teachers.find(t => t.id === matchingByName.teacherId);
      return {
        groupId: matchingByName.id,
        groupName: matchingByName.name,
        teacherId: matchingByName.teacherId,
        teacherName: matchingByName.teacherName || teacher?.name || 'Ustadz Pembimbing',
        schedule: matchingByName.schedule,
        room: matchingByName.room
      };
    }
  }

  // 3. Fallback: cek jika student punya teacherId
  if (student.teacherId) {
    const teacher = teachers.find(t => t.id === student.teacherId);
    const teacherGroup = halaqahGroups.find(g => g.teacherId === student.teacherId);
    if (teacherGroup) {
      return {
        groupId: teacherGroup.id,
        groupName: teacherGroup.name,
        teacherId: teacherGroup.teacherId,
        teacherName: teacherGroup.teacherName || teacher?.name || 'Ustadz Pembimbing',
        schedule: teacherGroup.schedule,
        room: teacherGroup.room
      };
    }
    if (teacher) {
      return {
        groupName: `Halaqah ${teacher.name}`,
        teacherId: teacher.id,
        teacherName: teacher.name
      };
    }
  }

  return {
    groupName: student.halaqahGroupName || 'Belum Ditentukan',
    teacherName: 'Belum Ditentukan'
  };
}

/**
 * Memeriksa apakah santri terdaftar di Halaqah guru tertentu
 */
export function isStudentInTeacherHalaqah(
  student: Student,
  teacherId: string | undefined,
  halaqahGroups: HalaqahGroup[],
  teachers: Teacher[]
): boolean {
  if (!teacherId) return false;

  // 1. Direct teacherId match
  if (student.teacherId === teacherId) return true;

  // 2. Group teacherId match
  const halaqah = getStudentHalaqahInfo(student, halaqahGroups, teachers);
  if (halaqah.teacherId === teacherId) return true;

  // 3. Cek halaqah groups milik guru ini
  const teacherGroups = halaqahGroups.filter(g => g.teacherId === teacherId);
  return teacherGroups.some(g => 
    (g.studentIds && g.studentIds.includes(student.id)) ||
    student.halaqahGroupId === g.id
  );
}

/**
 * Filter santri berdasarkan filter halaqah:
 * - 'all': semua santri
 * - 'my-halaqah': hanya santri di halaqah guru aktif
 * - halaqahGroupId: hanya santri di halaqah group spesifik
 */
export function filterStudentsByHalaqah(
  students: Student[],
  filterValue: string, // 'all' | 'my-halaqah' | group.id
  currentTeacherId: string | undefined,
  halaqahGroups: HalaqahGroup[],
  teachers: Teacher[]
): Student[] {
  if (!filterValue || filterValue === 'all') {
    return students;
  }

  if (filterValue === 'my-halaqah') {
    if (!currentTeacherId) return students;
    return students.filter(s => isStudentInTeacherHalaqah(s, currentTeacherId, halaqahGroups, teachers));
  }

  // Filter ke halaqah spesifik (id halaqah)
  return students.filter(s => {
    const info = getStudentHalaqahInfo(s, halaqahGroups, teachers);
    return info.groupId === filterValue;
  });
}

export interface GroupedHalaqahData {
  id: string;
  name: string;
  teacherId?: string;
  teacherName: string;
  schedule?: string;
  room?: string;
  description?: string;
  students: Student[];
}

/**
 * Mengelompokkan santri PER HALAQAH beserta anggota halaqahnya
 */
export function groupStudentsByHalaqah(
  students: Student[],
  halaqahGroups: HalaqahGroup[],
  teachers: Teacher[],
  filterValue: string = 'all', // 'all' | 'my-halaqah' | halaqahGroupId
  currentTeacherId?: string
): GroupedHalaqahData[] {
  // 1. Filter halaqah groups yang akan ditampilkan
  let relevantGroups = halaqahGroups;
  if (filterValue === 'my-halaqah' && currentTeacherId) {
    relevantGroups = halaqahGroups.filter(g => g.teacherId === currentTeacherId);
  } else if (filterValue !== 'all' && filterValue !== 'my-halaqah') {
    relevantGroups = halaqahGroups.filter(g => g.id === filterValue);
  }

  const result: GroupedHalaqahData[] = [];
  const assignedStudentIds = new Set<string>();

  // 2. Buat grup untuk setiap Halaqah
  for (const group of relevantGroups) {
    const teacher = teachers.find(t => t.id === group.teacherId);
    // Cari santri yang termasuk di halaqah ini
    const memberStudents = students.filter(s => {
      const isMember = (group.studentIds && group.studentIds.includes(s.id)) ||
        s.halaqahGroupId === group.id ||
        (s.teacherId === group.teacherId && (!s.halaqahGroupId || s.halaqahGroupId === group.id));
      return isMember;
    });

    memberStudents.forEach(s => assignedStudentIds.add(s.id));

    result.push({
      id: group.id,
      name: group.name,
      teacherId: group.teacherId,
      teacherName: group.teacherName || teacher?.name || 'Ustadz Pengampu',
      schedule: group.schedule,
      room: group.room,
      description: group.description,
      students: memberStudents
    });
  }

  // 3. Jika filter 'all', tambahkan santri yang belum memiliki halaqah jika ada
  if (filterValue === 'all') {
    const unassignedStudents = students.filter(s => !assignedStudentIds.has(s.id));
    if (unassignedStudents.length > 0) {
      result.push({
        id: 'unassigned',
        name: 'Santri Belum Masuk Halaqah',
        teacherName: 'Belum Ditentukan',
        description: 'Santri ini belum dialokasikan ke kelompok halaqah manapun',
        students: unassignedStudents
      });
    }
  }

  return result;
}
