export type Role = 'admin' | 'guru' | 'wali';

export interface User {
  id: string;
  name: string;
  username?: string;
  password?: string;
  email: string;
  role: Role;
  avatar: string;
  title?: string;
  phone?: string;
  teacherId?: string;
  studentId?: string;
}

export type UserProfile = User;

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  email: string;
  phone: string;
  gender?: 'L' | 'P';
  specialization: string;
  classIds?: string[];
  ummiCertified?: boolean;
  photo?: string;
  assignedStudentsCount?: number;
}

export interface ClassItem {
  id: string;
  name: string;
  grade?: string;
  level?: number;
  academicYear: string;
  homeroomTeacherId?: string;
  studentCount?: number;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  nickname: string;
  gender: 'L' | 'P';
  classId: string;
  teacherId: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  program: 'Reguler Tahfizh' | 'Tahfizh Unggulan' | 'Takhassus 30 Juz';
  targetJuz: number; // e.g. 4.0
  photo: string;
  entryYear: string;
  currentUmmiJilid: string; // e.g. 'Jilid 4'
  currentUmmiPage: number;
  totalJuzHafal: number; // e.g. 2.5
  totalSurahHafal: number;
  totalAyahHafal: number;
  lastHafalan: string; // e.g. 'An-Naba: 1-20'
  lastHafalanDate: string;
  avgScore: number;
}

export interface SurahInfo {
  number: number;
  name: string;
  arabicName: string;
  totalAyahs: number;
  juzNumber: number;
  revelationPlace: 'Makkah' | 'Madinah';
}

export type SetoranType = 'Hafalan Baru' | 'Murojaah' | 'Tasmi\'';

export interface ScoreBreakdown {
  kelancaran: number;
  tajwid: number;
  makhraj: number;
  fashahah: number;
  adab: number;
  hafalan: number;
}

export type ScoreCategory = 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';

export interface MemorizationRecord {
  id: string;
  studentId: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  juz: number;
  surahNumber: number;
  surahName: string;
  startAyah: number;
  endAyah: number;
  totalAyah: number;
  type: SetoranType;
  scores: ScoreBreakdown;
  finalScore: number;
  category: ScoreCategory;
  notes: string;
  verified: boolean;
  tasmiHalamanCount?: number;
}

export type UmmiStatus = 'Belum' | 'Sedang Dipelajari' | 'Lancar' | 'Lulus' | 'Perlu Mengulang';

export interface UmmiRecord {
  id: string;
  studentId: string;
  teacherId: string;
  date: string;
  jilid: string; // 'Jilid 1' | 'Jilid 2' | 'Jilid 3' | 'Jilid 4' | 'Jilid 5' | 'Jilid 6' | 'Al-Qur\'an' | 'Gharib' | 'Tajwid'
  page: number;
  materialId?: string;
  materialName: string;
  score: number;
  status: UmmiStatus;
  notes: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  name?: string;
  category: 'Ummi' | 'Tajwid' | 'Gharib' | 'Tahsin' | 'Metode Ummi';
  jilid?: string;
  level?: string;
  page?: string;
  description: string;
  content?: string;
  targetCompetence?: string;
  audioExampleUrl?: string;
}

export type TargetPeriod = 'Bulanan' | 'Semester' | 'Tahunan';
export type TargetStatus = 'Sesuai Target' | 'Perlu Ditingkatkan' | 'Tertinggal' | 'on-track' | 'needs-attention' | 'behind';

export interface TargetProgress {
  id: string;
  studentId: string;
  targetType: TargetPeriod;
  targetJuz: number;
  period?: string;
  achievedJuz?: number;
  currentAchievement?: number;
  remainingJuz: number;
  percentage: number;
  deadline?: string;
  status: TargetStatus;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'success' | 'warning' | 'info';
  read: boolean;
  studentId?: string;
}

export interface AppSettings {
  schoolName: string;
  schoolSubtitle: string;
  schoolAddress: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  headmasterName?: string;
  tahfizhCoordinator?: string;
  minScoreKKM?: number;
  defaultTargetJuz?: number;
}
