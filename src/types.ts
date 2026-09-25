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

export interface HalaqahGroup {
  id: string;
  name: string; // e.g. "Halaqah 1 (Umar bin Khattab)", "Halaqah 2 (Abu Bakar)", etc.
  teacherId: string;
  teacherName?: string;
  description?: string;
  schedule?: string;
  room?: string;
  studentIds?: string[];
  maxCapacity?: number;
  createdAt?: string;
}

export type HalaqahType = 'Akselerasi' | 'Reguler' | 'Khusus';

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  nickname: string;
  gender: 'L' | 'P';
  classId: string;
  teacherId: string;
  halaqahGroupId?: string;
  halaqahGroupName?: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  program: HalaqahType | 'Reguler Tahfizh' | 'Tahfizh Unggulan' | 'Takhassus 30 Juz' | string;
  targetJuz: number; // e.g. 4.0
  raportNotes?: string;
  raportTargetHafalan?: string;
  raportHalaqahType?: string;
  raportUmmiCapaian?: string;
  raportUmmiNilai?: string;
  raportSakit?: number;
  raportIzin?: number;
  raportAlpha?: number;
  targetSuratAyat?: string;
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
  endSurahNumber?: number;
  endSurahName?: string;
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
  jilid: string; // 'Jilid 1' | 'Jilid 2' | 'Jilid 3' | 'Jilid 4' | 'Jilid 5' | 'Jilid 6' | 'Al-Qur\'an' | 'Gharib' | 'Tajwid' | 'Munaqosyah' | 'Tahfizh'
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
  category: 'Ummi' | 'Tajwid' | 'Gharib' | 'Tahsin' | 'Metode Ummi' | 'Munaqosyah' | 'Tahfizh';
  jilid?: string;
  level?: string;
  page?: string;
  description: string;
  content?: string;
  targetCompetence?: string;
  audioExampleUrl?: string;
}

// ===================================================
// PROGRAM MATRIKULASI METODE IQRO (KELAS 8 & 9)
// Jadwal: Setiap Hari Selasa, Rabu, dan Kamis
// Catatan: Non-Raport (Khusus Laporan Perkembangan & Monitoring)
// ===================================================
export type IqroJilid = 'Iqro 1' | 'Iqro 2' | 'Iqro 3' | 'Iqro 4' | 'Iqro 5' | 'Iqro 6';
export type MatrikulasiDay = 'Selasa' | 'Rabu' | 'Kamis';
export type MatrikulasiStatus = 'Aktif' | 'Lulus / Selesai' | 'Nonaktif';
export type MatrikulasiSessionStatus = 'Lulus' | 'Ulang';

export interface MatrikulasiStudent {
  id: string;
  studentId: string;
  enrolledDate: string; // YYYY-MM-DD
  status: MatrikulasiStatus;
  currentIqroJilid: IqroJilid;
  currentIqroPage: number;
  assignedTeacherId: string;
  scheduleDays: MatrikulasiDay[]; // Default: ['Selasa', 'Rabu', 'Kamis']
  initialReason?: string; // Alasan penempatan: misal perbaikan kelancaran / makhraj
  notes?: string;
  completedDate?: string;
}

export interface MatrikulasiRecord {
  id: string;
  matrikulasiStudentId: string;
  studentId: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  day: MatrikulasiDay; // 'Selasa' | 'Rabu' | 'Kamis'
  jilid: IqroJilid;
  page: number;
  materialFocus: string;
  score: number; // 0 - 100 (Nilai tunggal)
  status: MatrikulasiSessionStatus; // 'Lulus' | 'Ulang'
  notes: string;
}

export interface IqroSyllabusItem {
  jilid: IqroJilid;
  title: string;
  totalPages: number;
  description: string;
  keyTopics: string[];
  guidanceTips: string[];
  arabicExample: string;
}

export type TargetPeriod = 'Bulanan' | 'Term' | 'Semester' | 'Tahunan';
export type TargetCategory = 'Hafalan' | 'Ummi';
export type TermName = 'Term 1' | 'Term 2' | 'Term 3' | 'Term 4';
export type TargetStatus = 'Sesuai Target' | 'Perlu Ditingkatkan' | 'Tertinggal' | 'on-track' | 'needs-attention' | 'behind';

export interface TargetProgress {
  id: string;
  studentId: string;
  category?: TargetCategory; // 'Hafalan' | 'Ummi'
  targetType: TargetPeriod; // 'Term' | 'Bulanan' | 'Semester' | 'Tahunan'
  term?: TermName; // 'Term 1' | 'Term 2' | 'Term 3' | 'Term 4'
  academicYear?: string; // e.g. '2026/2027'
  period?: string; // e.g. 'Term 1 (Juli - September 2026)'
  
  // Spesifikasi Hafalan Al-Qur'an
  targetJuz: number;
  achievedJuz?: number;
  currentAchievement?: number;
  remainingJuz: number;
  
  // Spesifikasi Metode UMMI
  targetUmmiJilid?: string; // e.g. 'Jilid 1', 'Jilid 2', 'Jilid 3', 'Al-Qur\'an', 'Munaqosyah'
  targetUmmiPage?: number; // e.g. 40
  achievedUmmiJilid?: string;
  achievedUmmiPage?: number;
  ummiStatus?: TargetStatus;
  ummiPercentage?: number;

  percentage: number;
  deadline?: string;
  status: TargetStatus;
  notes?: string;
  updatedAt?: string;
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

export type ViolationType = 
  | 'tidak_setoran' 
  | 'kurang_baris_ayat' 
  | 'tidak_bawa_mutabaah' 
  | 'tidak_bawa_ummi' 
  | 'lainnya';

export interface TahfizhViolation {
  id: string;
  studentId: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  type: ViolationType;
  typeName: string; // e.g. 'Tidak Setoran', 'Kurang Baris/Ayat', 'Tidak Membawa Buku Mutaba\'ah', 'Tidak Membawa Buku Ummi'
  point: number; // Nilai poin pelanggaran
  details?: string; // Penjelasan spesifik
  actionTaken: string; // Tindakan pembinaan
  status: 'Tercatat' | 'Dalam Pembinaan' | 'Selesai / Dituntaskan';
  resolvedDate?: string;
  notes?: string;
}

export interface AppSettings {
  schoolName: string;
  schoolSubtitle: string;
  schoolAddress: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  activeSemester?: 'Ganjil' | 'Genap';
  headmasterName?: string;
  headmasterNik?: string;
  principalName?: string;
  tahfizhCoordinator?: string;
  tahfizhCoordinatorNik?: string;
  raportDate?: string;
  minScoreKKM?: number;
  defaultTargetJuz?: number;
  customLogoUrl?: string;
  yayasanLogoUrl?: string;
  raportFrameUrl?: string;
  bismillahImgUrl?: string;
  headmasterSignatureUrl?: string;
  tahfizhCoordinatorSignatureUrl?: string;
}

export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string;
}
