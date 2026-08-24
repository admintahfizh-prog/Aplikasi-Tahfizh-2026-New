import { 
  Student, 
  Teacher, 
  ClassItem, 
  MemorizationRecord, 
  UmmiRecord, 
  LearningMaterial, 
  TargetProgress, 
  NotificationItem, 
  AppSettings, 
  User 
} from '../types';
import { 
  DEFAULT_SETTINGS, 
  INITIAL_CLASSES, 
  INITIAL_MEMORIZATION_RECORDS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_STUDENTS, 
  INITIAL_TARGETS, 
  INITIAL_TEACHERS, 
  INITIAL_UMMI_RECORDS, 
  INITIAL_USERS 
} from '../data/initialData';
import { INITIAL_MATERIALS } from '../data/ummiData';
import { calculateCategory } from '../data/quranData';

const STORAGE_KEYS = {
  SETTINGS: 'tahfizh_smpia21_settings',
  USERS: 'tahfizh_smpia21_users',
  CLASSES: 'tahfizh_smpia21_classes',
  TEACHERS: 'tahfizh_smpia21_teachers',
  STUDENTS: 'tahfizh_smpia21_students',
  MEMORIZATION: 'tahfizh_smpia21_memorization',
  UMMI: 'tahfizh_smpia21_ummi',
  MATERIALS: 'tahfizh_smpia21_materials',
  TARGETS: 'tahfizh_smpia21_targets',
  NOTIFICATIONS: 'tahfizh_smpia21_notifications',
  CURRENT_USER: 'tahfizh_smpia21_current_user'
};

function getItem<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultVal;
  }
}

function setItem<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

export const storageService = {
  // Reset all data to default
  resetToDefaults(): void {
    setItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    setItem(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    setItem(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    setItem(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    setItem(STORAGE_KEYS.MEMORIZATION, INITIAL_MEMORIZATION_RECORDS);
    setItem(STORAGE_KEYS.UMMI, INITIAL_UMMI_RECORDS);
    setItem(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    setItem(STORAGE_KEYS.TARGETS, INITIAL_TARGETS);
    setItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    setItem(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  },

  resetToInitial(): void {
    this.resetToDefaults();
  },

  // Settings
  getSettings(): AppSettings {
    return getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  },
  saveSettings(settings: AppSettings): void {
    setItem(STORAGE_KEYS.SETTINGS, settings);
  },

  // Current User / Auth
  getCurrentUser(): User | null {
    return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  },
  setCurrentUser(user: User | null): void {
    if (user === null) {
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      } catch (e) {
        console.error(e);
      }
    } else {
      setItem(STORAGE_KEYS.CURRENT_USER, user);
    }
  },
  getUsers(): User[] {
    const users = getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    // Ensure all initial users exist or merge
    if (!users || users.length === 0) {
      setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
      return INITIAL_USERS;
    }
    return users;
  },
  saveUser(user: User): void {
    const list = this.getUsers();
    const idx = list.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      list[idx] = user;
    } else {
      list.push(user);
    }
    setItem(STORAGE_KEYS.USERS, list);
  },
  deleteUser(id: string): void {
    const list = this.getUsers().filter(u => u.id !== id);
    setItem(STORAGE_KEYS.USERS, list);
  },
  authenticate(identifier: string, passwordInput: string): { success: boolean; user?: User; message?: string } {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (passwordInput || '').trim();

    if (!cleanId || !cleanPass) {
      return { success: false, message: 'Username dan kata sandi wajib diisi.' };
    }

    const users = this.getUsers();
    const user = users.find(u => 
      (u.username && u.username.toLowerCase() === cleanId) ||
      (u.email && u.email.toLowerCase() === cleanId) ||
      (u.phone && u.phone.replace(/[\s-]/g, '') === cleanId.replace(/[\s-]/g, '')) ||
      (u.id && u.id.toLowerCase() === cleanId)
    );

    if (!user) {
      return { 
        success: false, 
        message: 'Akun dengan username / email tersebut tidak ditemukan dalam sistem.' 
      };
    }

    // Default fallback passwords for demo accounts if password not set
    const expectedPass = user.password || (
      user.role === 'admin' ? 'admin21' : user.role === 'guru' ? 'guru21' : 'wali21'
    );

    // Accept exact password or admin master override or fallback
    if (
      user.password === cleanPass || 
      expectedPass === cleanPass || 
      cleanPass === 'admin21' || 
      cleanPass === 'smpia21'
    ) {
      return { success: true, user };
    }

    return { 
      success: false, 
      message: 'Kata sandi tidak sesuai. Silakan hubungi Admin untuk reset kata sandi.' 
    };
  },

  // Classes
  getClasses(): ClassItem[] {
    return getItem(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  },
  saveClass(cls: ClassItem): void {
    const list = this.getClasses();
    const idx = list.findIndex(c => c.id === cls.id);
    if (idx >= 0) {
      list[idx] = cls;
    } else {
      list.push(cls);
    }
    setItem(STORAGE_KEYS.CLASSES, list);
  },
  deleteClass(id: string): void {
    const list = this.getClasses().filter(c => c.id !== id);
    setItem(STORAGE_KEYS.CLASSES, list);
  },

  // Teachers
  getTeachers(): Teacher[] {
    return getItem(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
  },
  saveTeacher(teacher: Teacher): void {
    const list = this.getTeachers();
    const idx = list.findIndex(t => t.id === teacher.id);
    if (idx >= 0) {
      list[idx] = teacher;
    } else {
      list.push(teacher);
    }
    setItem(STORAGE_KEYS.TEACHERS, list);
  },
  deleteTeacher(id: string): void {
    const list = this.getTeachers().filter(t => t.id !== id);
    setItem(STORAGE_KEYS.TEACHERS, list);
  },

  // Students
  getStudents(): Student[] {
    return getItem(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  },
  getStudentById(id: string): Student | undefined {
    return this.getStudents().find(s => s.id === id);
  },
  saveStudent(student: Student): void {
    const list = this.getStudents();
    const idx = list.findIndex(s => s.id === student.id);
    if (idx >= 0) {
      list[idx] = student;
    } else {
      list.unshift(student);
    }
    setItem(STORAGE_KEYS.STUDENTS, list);
  },
  deleteStudent(id: string): void {
    const list = this.getStudents().filter(s => s.id !== id);
    setItem(STORAGE_KEYS.STUDENTS, list);
  },

  // Batch import students from CSV
  importStudentsCSV(csvText: string): { successCount: number; errors: string[] } {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return { successCount: 0, errors: ['File CSV kosong atau tidak memiliki baris data.'] };
    }

    const headerLine = lines[0] || '';
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
    const requiredFields = ['nis', 'name'];
    for (const req of requiredFields) {
      if (!headers.some(h => h.includes(req))) {
        return { successCount: 0, errors: [`Header kolom '${req}' tidak ditemukan dalam CSV.`] };
      }
    }

    const nisIdx = headers.findIndex(h => h.includes('nis') && !h.includes('nisn'));
    const nisnIdx = headers.findIndex(h => h.includes('nisn'));
    const nameIdx = headers.findIndex(h => h.includes('nama') || h.includes('name'));
    const nicknameIdx = headers.findIndex(h => h.includes('panggilan') || h.includes('nick'));
    const genderIdx = headers.findIndex(h => h.includes('gender') || h.includes('jenis') || h.includes('kelamin'));
    const classIdx = headers.findIndex(h => h.includes('kelas') || h.includes('class'));
    const programIdx = headers.findIndex(h => h.includes('program'));
    const targetIdx = headers.findIndex(h => h.includes('target'));
    const parentNameIdx = headers.findIndex(h => h.includes('orang tua') || h.includes('wali') || h.includes('parent'));
    const parentPhoneIdx = headers.findIndex(h => h.includes('hp') || h.includes('telepon') || h.includes('phone') || h.includes('wa'));
    const ummiJilidIdx = headers.findIndex(h => h.includes('jilid') || h.includes('ummi'));

    const classes = this.getClasses();
    const teachers = this.getTeachers();
    const existing = this.getStudents();
    const errors: string[] = [];
    let successCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted commas
      const cols: string[] = [];
      let inQuote = false;
      let currentVal = '';
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          cols.push(currentVal.trim().replace(/^"|"$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      cols.push(currentVal.trim().replace(/^"|"$/g, ''));

      const nis = cols[nisIdx] || '';
      const name = cols[nameIdx] || '';
      if (!nis || !name) {
        errors.push(`Baris ${i + 1}: NIS atau Nama tidak boleh kosong.`);
        continue;
      }

      // Check existing NIS
      if (existing.some(s => s.nis === nis)) {
        errors.push(`Baris ${i + 1}: Siswa dengan NIS ${nis} sudah terdaftar.`);
        continue;
      }

      const className = cols[classIdx] || '';
      const matchedClass = classes.find(c => c.name.toLowerCase().includes(className.toLowerCase())) || classes[0] || { id: 'c-7a' };
      const matchedTeacher = teachers.find(t => (matchedClass as any).homeroomTeacherId === t.id) || teachers[0] || { id: 't-1' };

      const rawGender = (cols[genderIdx] || 'L').toUpperCase();
      const gender: 'L' | 'P' = rawGender.startsWith('P') || rawGender === 'F' ? 'P' : 'L';
      const targetVal = parseFloat(cols[targetIdx]) || 4.0;
      const programVal = (cols[programIdx] || 'Tahfizh Unggulan') as any;

      const newStudent: Student = {
        id: 'std-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        nis,
        nisn: cols[nisnIdx] || `01${Math.floor(10000000 + Math.random() * 90000000)}`,
        name,
        nickname: cols[nicknameIdx] || (name || '').split(' ')[0] || 'Santri',
        gender,
        classId: matchedClass.id,
        teacherId: matchedTeacher.id,
        parentName: cols[parentNameIdx] || 'Wali dari ' + name,
        parentPhone: cols[parentPhoneIdx] || '0812' + Math.floor(10000000 + Math.random() * 90000000),
        program: programVal.includes('Reguler') ? 'Reguler Tahfizh' : programVal.includes('Takhassus') ? 'Takhassus 30 Juz' : 'Tahfizh Unggulan',
        targetJuz: targetVal,
        photo: gender === 'L'
          ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        entryYear: '2026',
        currentUmmiJilid: cols[ummiJilidIdx] || 'Jilid 4',
        currentUmmiPage: 1,
        totalJuzHafal: 0,
        totalSurahHafal: 0,
        totalAyahHafal: 0,
        lastHafalan: '-',
        lastHafalanDate: '-',
        avgScore: 0
      };

      existing.unshift(newStudent);
      successCount++;
    }

    if (successCount > 0) {
      setItem(STORAGE_KEYS.STUDENTS, existing);
    }

    return { successCount, errors };
  },

  // Memorization Records
  getMemorizationRecords(): MemorizationRecord[] {
    return getItem(STORAGE_KEYS.MEMORIZATION, INITIAL_MEMORIZATION_RECORDS);
  },
  addMemorizationRecord(record: MemorizationRecord): void {
    const list = this.getMemorizationRecords();
    list.unshift(record);
    setItem(STORAGE_KEYS.MEMORIZATION, list);

    // Update Student stats
    const student = this.getStudentById(record.studentId);
    if (student) {
      const studentRecords = list.filter(r => r.studentId === student.id);
      const totalScore = studentRecords.reduce((acc, r) => acc + r.finalScore, 0);
      const avgScore = Math.round(totalScore / studentRecords.length);

      // Total distinct ayahs approximation
      const totalAyahs = studentRecords.reduce((acc, r) => acc + r.totalAyah, 0);
      const uniqueSurahs = new Set(studentRecords.map(r => r.surahNumber)).size;
      
      // Juz rough calculation (1 juz ~ 200 ayahs average)
      const approxJuz = Number(Math.min(30, (totalAyahs / 200)).toFixed(1));

      const updatedStudent: Student = {
        ...student,
        totalAyahHafal: totalAyahs,
        totalSurahHafal: Math.max(student.totalSurahHafal, uniqueSurahs),
        totalJuzHafal: Math.max(student.totalJuzHafal, approxJuz),
        lastHafalan: `${record.surahName}: ${record.startAyah}-${record.endAyah}`,
        lastHafalanDate: record.date,
        avgScore: avgScore
      };
      this.saveStudent(updatedStudent);

      // Update target progress if exists
      this.updateStudentTargetProgress(student.id, updatedStudent.totalJuzHafal);

      // Trigger notification
      this.addNotification({
        id: 'notif-' + Date.now(),
        title: `Setoran ${record.type}: ${student.name}`,
        message: `Ananda ${student.nickname || student.name} berhasil menyetorkan Surat ${record.surahName} ayat ${record.startAyah}–${record.endAyah} dengan nilai ${record.finalScore} (${record.category}).`,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        type: record.finalScore >= 80 ? 'success' : 'warning',
        read: false,
        studentId: student.id
      });
    }
  },
  deleteMemorizationRecord(id: string): void {
    const list = this.getMemorizationRecords().filter(r => r.id !== id);
    setItem(STORAGE_KEYS.MEMORIZATION, list);
  },

  // Ummi Records
  getUmmiRecords(): UmmiRecord[] {
    return getItem(STORAGE_KEYS.UMMI, INITIAL_UMMI_RECORDS);
  },
  addUmmiRecord(record: UmmiRecord): void {
    const list = this.getUmmiRecords();
    list.unshift(record);
    setItem(STORAGE_KEYS.UMMI, list);

    // Update Student Ummi state
    const student = this.getStudentById(record.studentId);
    if (student) {
      const updatedStudent: Student = {
        ...student,
        currentUmmiJilid: record.jilid,
        currentUmmiPage: record.page
      };
      this.saveStudent(updatedStudent);

      if (record.status === 'Perlu Mengulang') {
        this.addNotification({
          id: 'notif-' + Date.now(),
          title: `Evaluasi Ummi: ${student.name}`,
          message: `Ananda ${student.nickname} perlu mengulang ${record.jilid} halaman ${record.page} (${record.materialName}).`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          type: 'warning',
          read: false,
          studentId: student.id
        });
      }
    }
  },
  deleteUmmiRecord(id: string): void {
    const list = this.getUmmiRecords().filter(r => r.id !== id);
    setItem(STORAGE_KEYS.UMMI, list);
  },

  // Learning Materials
  getMaterials(): LearningMaterial[] {
    return getItem(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
  },
  saveMaterial(mat: LearningMaterial): void {
    const list = this.getMaterials();
    const idx = list.findIndex(m => m.id === mat.id);
    if (idx >= 0) {
      list[idx] = mat;
    } else {
      list.push(mat);
    }
    setItem(STORAGE_KEYS.MATERIALS, list);
  },
  deleteMaterial(id: string): void {
    const list = this.getMaterials().filter(m => m.id !== id);
    setItem(STORAGE_KEYS.MATERIALS, list);
  },

  // Targets
  getTargets(): TargetProgress[] {
    return getItem(STORAGE_KEYS.TARGETS, INITIAL_TARGETS);
  },
  saveTarget(target: TargetProgress): void {
    const list = this.getTargets();
    const idx = list.findIndex(t => t.id === target.id);
    if (idx >= 0) {
      list[idx] = target;
    } else {
      list.push(target);
    }
    setItem(STORAGE_KEYS.TARGETS, list);
  },
  updateStudentTargetProgress(studentId: string, currentAchievement: number): void {
    const list = this.getTargets();
    const target = list.find(t => t.studentId === studentId);
    if (target) {
      const remaining = Math.max(0, Number((target.targetJuz - currentAchievement).toFixed(1)));
      const pct = Math.min(100, Math.round((currentAchievement / target.targetJuz) * 100));
      let status: 'Sesuai Target' | 'Perlu Ditingkatkan' | 'Tertinggal' = 'Sesuai Target';
      if (pct < 35) status = 'Tertinggal';
      else if (pct < 60) status = 'Perlu Ditingkatkan';

      target.currentAchievement = currentAchievement;
      target.remainingJuz = remaining;
      target.percentage = pct;
      target.status = status;
      setItem(STORAGE_KEYS.TARGETS, list);
    }
  },

  // Notifications
  getNotifications(): NotificationItem[] {
    return getItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },
  addNotification(item: NotificationItem): void {
    const list = this.getNotifications();
    list.unshift(item);
    setItem(STORAGE_KEYS.NOTIFICATIONS, list.slice(0, 50));
  },
  markAllNotificationsRead(): void {
    const list = this.getNotifications().map(n => ({ ...n, read: true }));
    setItem(STORAGE_KEYS.NOTIFICATIONS, list);
  },
  clearNotifications(): void {
    setItem(STORAGE_KEYS.NOTIFICATIONS, []);
  },

  // CSV Generator for sample template
  generateStudentCSVTemplate(): string {
    return `NIS,NISN,Nama Lengkap,Nama Panggilan,Jenis Kelamin,Kelas,Program,Target Juz,Nama Orang Tua,No HP WA,Jilid Ummi
2607020,0112345689,Muhammad Fatih Al-Ayyubi,Fatih,L,7A Tahfizh,Tahfizh Unggulan,4.0,Bpk. H. Iskandar,081234567890,Jilid 5
2607021,0112345690,Aisyah Zahira Putri,Aisyah,P,7B Tahfizh Putri,Reguler Tahfizh,3.0,Ibu Wardatun Nisa,081298765432,Jilid 4`;
  },

  // Export data as CSV
  exportStudentsToCSV(): string {
    const students = this.getStudents();
    const classes = this.getClasses();
    const teachers = this.getTeachers();

    const headers = ['NIS', 'NISN', 'Nama Lengkap', 'Panggilan', 'Gender', 'Kelas', 'Guru', 'Program', 'Target (Juz)', 'Capaian (Juz)', 'Ummi Jilid', 'Ummi Halaman', 'Rata-rata Nilai', 'Nama Wali', 'No HP'];
    const rows = students.map(s => {
      const cls = classes.find(c => c.id === s.classId)?.name || '-';
      const tch = teachers.find(t => t.id === s.teacherId)?.name || '-';
      return [
        `"${s.nis}"`,
        `"${s.nisn}"`,
        `"${s.name}"`,
        `"${s.nickname}"`,
        `"${s.gender}"`,
        `"${cls}"`,
        `"${tch}"`,
        `"${s.program}"`,
        s.targetJuz,
        s.totalJuzHafal,
        `"${s.currentUmmiJilid}"`,
        s.currentUmmiPage,
        s.avgScore,
        `"${s.parentName}"`,
        `"${s.parentPhone}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  exportHafalanToCSV(): string {
    const records = this.getMemorizationRecords();
    const students = this.getStudents();
    const teachers = this.getTeachers();

    const headers = ['Tanggal', 'NIS', 'Nama Siswa', 'Juz', 'Surat', 'Ayat Mulai', 'Ayat Selesai', 'Jumlah Ayat', 'Jenis Setoran', 'Kelancaran', 'Tajwid', 'Makhraj', 'Fashahah', 'Adab', 'Hafalan', 'Nilai Akhir', 'Predikat', 'Guru Penguji', 'Catatan'];
    const rows = records.map(r => {
      const std = students.find(s => s.id === r.studentId);
      const tch = teachers.find(t => t.id === r.teacherId)?.name || '-';
      return [
        `"${r.date}"`,
        `"${std?.nis || '-'}"`,
        `"${std?.name || '-'}"`,
        r.juz,
        `"${r.surahName}"`,
        r.startAyah,
        r.endAyah,
        r.totalAyah,
        `"${r.type}"`,
        r.scores?.kelancaran || r.finalScore,
        r.scores?.tajwid || r.finalScore,
        r.scores?.makhraj || r.finalScore,
        r.scores?.fashahah || r.finalScore,
        r.scores?.adab || 90,
        r.scores?.hafalan || r.finalScore,
        r.finalScore,
        `"${r.category}"`,
        `"${tch}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
};
