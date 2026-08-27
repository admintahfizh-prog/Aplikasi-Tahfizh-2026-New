import { 
  Student, 
  Teacher, 
  ClassItem, 
  MemorizationRecord, 
  UmmiRecord, 
  LearningMaterial, 
  TargetProgress, 
  NotificationItem, 
  TahfizhViolation,
  MatrikulasiStudent,
  MatrikulasiRecord,
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
  INITIAL_USERS,
  INITIAL_VIOLATIONS 
} from '../data/initialData';
import { INITIAL_MATERIALS } from '../data/ummiData';
import { calculateCategory } from '../data/quranData';
import { INITIAL_MATRIKULASI_STUDENTS, INITIAL_MATRIKULASI_RECORDS } from '../data/iqroData';
import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  onSnapshot 
} from './firebase';

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
  CURRENT_USER: 'tahfizh_smpia21_current_user',
  VIOLATIONS: 'tahfizh_smpia21_violations',
  MATRIKULASI_STUDENTS: 'tahfizh_smpia21_matrikulasi_students',
  MATRIKULASI_RECORDS: 'tahfizh_smpia21_matrikulasi_records',
  CLOUD_SYNCED: 'tahfizh_smpia21_cloud_synced'
};

// Local storage helpers
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

function rEndSurah(r: MemorizationRecord): string {
  if (r.endSurahName && r.endSurahName !== r.surahName) {
    return `${r.surahName}:${r.startAyah} - ${r.endSurahName}:${r.endAyah}`;
  }
  return `${r.surahName}: ${r.startAyah}-${r.endAyah}`;
}

// Background Cloud Sync Helpers
async function syncCollectionToCloud(collectionName: string, items: any[]): Promise<void> {
  try {
    if (!items || items.length === 0) return;
    const batch = writeBatch(db);
    // Firestore batch limit is 500
    const slice = items.slice(0, 450);
    for (const item of slice) {
      if (!item.id) continue;
      const ref = doc(db, collectionName, String(item.id));
      batch.set(ref, JSON.parse(JSON.stringify(item)), { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.warn(`[Cloud Sync] Batch write error for ${collectionName}:`, err);
  }
}

async function syncDocToCloud(collectionName: string, id: string, data: any): Promise<void> {
  try {
    const ref = doc(db, collectionName, String(id));
    await setDoc(ref, JSON.parse(JSON.stringify(data)), { merge: true });
  } catch (err) {
    console.warn(`[Cloud Sync] Doc write error for ${collectionName}/${id}:`, err);
  }
}

async function deleteDocFromCloud(collectionName: string, id: string): Promise<void> {
  try {
    const ref = doc(db, collectionName, String(id));
    await deleteDoc(ref);
  } catch (err) {
    console.warn(`[Cloud Sync] Delete error for ${collectionName}/${id}:`, err);
  }
}

// Global Cloud Sync Listener
let isCloudListenerAttached = false;
type SyncCallback = () => void;
const syncListeners: SyncCallback[] = [];

export const storageService = {
  // Subscribe to realtime cloud updates
  onSyncChange(cb: SyncCallback) {
    syncListeners.push(cb);
    return () => {
      const idx = syncListeners.indexOf(cb);
      if (idx >= 0) syncListeners.splice(idx, 1);
    };
  },

  notifyListeners() {
    syncListeners.forEach(cb => {
      try { cb(); } catch (e) { console.error(e); }
    });
  },

  // Initialize Realtime Cloud Sync & Download from Firebase
  async initCloudSync(): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Fetch Students from Firestore
      const stdSnap = await getDocs(collection(db, 'students'));
      if (!stdSnap.empty) {
        const cloudStudents: Student[] = [];
        stdSnap.forEach(d => cloudStudents.push(d.data() as Student));
        setItem(STORAGE_KEYS.STUDENTS, cloudStudents);
      } else {
        // Seed initial data to cloud
        const localStudents = this.getStudents();
        syncCollectionToCloud('students', localStudents);
      }

      // 2. Fetch Teachers
      const tchSnap = await getDocs(collection(db, 'teachers'));
      if (!tchSnap.empty) {
        const cloudTeachers: Teacher[] = [];
        tchSnap.forEach(d => cloudTeachers.push(d.data() as Teacher));
        setItem(STORAGE_KEYS.TEACHERS, cloudTeachers);
      } else {
        const localTeachers = this.getTeachers();
        syncCollectionToCloud('teachers', localTeachers);
      }

      // 3. Fetch Classes
      const clsSnap = await getDocs(collection(db, 'classes'));
      if (!clsSnap.empty) {
        const cloudClasses: ClassItem[] = [];
        clsSnap.forEach(d => cloudClasses.push(d.data() as ClassItem));
        setItem(STORAGE_KEYS.CLASSES, cloudClasses);
      } else {
        const localClasses = this.getClasses();
        syncCollectionToCloud('classes', localClasses);
      }

      // 4. Fetch Memorization Records
      const memSnap = await getDocs(collection(db, 'memorization_records'));
      if (!memSnap.empty) {
        const cloudMem: MemorizationRecord[] = [];
        memSnap.forEach(d => cloudMem.push(d.data() as MemorizationRecord));
        // Sort descending by date
        cloudMem.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setItem(STORAGE_KEYS.MEMORIZATION, cloudMem);
      } else {
        const localMem = this.getMemorizationRecords();
        syncCollectionToCloud('memorization_records', localMem);
      }

      // 5. Fetch Ummi Records
      const ummiSnap = await getDocs(collection(db, 'ummi_records'));
      if (!ummiSnap.empty) {
        const cloudUmmi: UmmiRecord[] = [];
        ummiSnap.forEach(d => cloudUmmi.push(d.data() as UmmiRecord));
        cloudUmmi.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setItem(STORAGE_KEYS.UMMI, cloudUmmi);
      } else {
        const localUmmi = this.getUmmiRecords();
        syncCollectionToCloud('ummi_records', localUmmi);
      }

      // 6. Fetch Violations
      const vioSnap = await getDocs(collection(db, 'violations'));
      if (!vioSnap.empty) {
        const cloudVio: TahfizhViolation[] = [];
        vioSnap.forEach(d => cloudVio.push(d.data() as TahfizhViolation));
        cloudVio.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setItem(STORAGE_KEYS.VIOLATIONS, cloudVio);
      } else {
        const localVio = this.getViolations();
        syncCollectionToCloud('violations', localVio);
      }

      // 7. Fetch Matrikulasi
      const matStdSnap = await getDocs(collection(db, 'matrikulasi_students'));
      if (!matStdSnap.empty) {
        const cloudMatStd: MatrikulasiStudent[] = [];
        matStdSnap.forEach(d => cloudMatStd.push(d.data() as MatrikulasiStudent));
        setItem(STORAGE_KEYS.MATRIKULASI_STUDENTS, cloudMatStd);
      } else {
        const localMatStd = this.getMatrikulasiStudents();
        syncCollectionToCloud('matrikulasi_students', localMatStd);
      }

      const matRecSnap = await getDocs(collection(db, 'matrikulasi_records'));
      if (!matRecSnap.empty) {
        const cloudMatRec: MatrikulasiRecord[] = [];
        matRecSnap.forEach(d => cloudMatRec.push(d.data() as MatrikulasiRecord));
        cloudMatRec.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setItem(STORAGE_KEYS.MATRIKULASI_RECORDS, cloudMatRec);
      } else {
        const localMatRec = this.getMatrikulasiRecords();
        syncCollectionToCloud('matrikulasi_records', localMatRec);
      }

      // 8. Fetch Settings
      const setDocSnap = await getDoc(doc(db, 'app_settings', 'config'));
      if (setDocSnap.exists()) {
        setItem(STORAGE_KEYS.SETTINGS, setDocSnap.data() as AppSettings);
      } else {
        const localSet = this.getSettings();
        syncDocToCloud('app_settings', 'config', localSet);
      }

      // 9. Fetch Users
      const usrSnap = await getDocs(collection(db, 'users'));
      if (!usrSnap.empty) {
        const cloudUsers: User[] = [];
        usrSnap.forEach(d => cloudUsers.push(d.data() as User));
        setItem(STORAGE_KEYS.USERS, cloudUsers);
      } else {
        const localUsers = this.getUsers();
        syncCollectionToCloud('users', localUsers);
      }

      // Attach Real-time listener for multi-device sync
      if (!isCloudListenerAttached) {
        isCloudListenerAttached = true;
        
        // Listen for remote setoran hafalan
        onSnapshot(collection(db, 'memorization_records'), (snap) => {
          const remoteRecords: MemorizationRecord[] = [];
          snap.forEach(d => remoteRecords.push(d.data() as MemorizationRecord));
          remoteRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setItem(STORAGE_KEYS.MEMORIZATION, remoteRecords);
          this.notifyListeners();
        });

        // Listen for remote ummi records
        onSnapshot(collection(db, 'ummi_records'), (snap) => {
          const remoteRecords: UmmiRecord[] = [];
          snap.forEach(d => remoteRecords.push(d.data() as UmmiRecord));
          remoteRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setItem(STORAGE_KEYS.UMMI, remoteRecords);
          this.notifyListeners();
        });

        // Listen for remote students
        onSnapshot(collection(db, 'students'), (snap) => {
          const remoteStudents: Student[] = [];
          snap.forEach(d => remoteStudents.push(d.data() as Student));
          if (remoteStudents.length > 0) {
            setItem(STORAGE_KEYS.STUDENTS, remoteStudents);
            this.notifyListeners();
          }
        });
      }

      localStorage.setItem(STORAGE_KEYS.CLOUD_SYNCED, 'true');
      this.notifyListeners();
      return { success: true, message: 'Cloud database Firestore berhasil disinkronkan!' };
    } catch (e: any) {
      console.error('[Cloud Sync] Failed to initialize cloud storage:', e);
      return { success: false, message: e?.message || 'Gagal menyambung ke Cloud database.' };
    }
  },

  // Push all local data to Cloud database explicitly
  async uploadAllToCloud(): Promise<{ success: boolean; message: string }> {
    try {
      await syncCollectionToCloud('students', this.getStudents());
      await syncCollectionToCloud('teachers', this.getTeachers());
      await syncCollectionToCloud('classes', this.getClasses());
      await syncCollectionToCloud('memorization_records', this.getMemorizationRecords());
      await syncCollectionToCloud('ummi_records', this.getUmmiRecords());
      await syncCollectionToCloud('violations', this.getViolations());
      await syncCollectionToCloud('matrikulasi_students', this.getMatrikulasiStudents());
      await syncCollectionToCloud('matrikulasi_records', this.getMatrikulasiRecords());
      await syncCollectionToCloud('users', this.getUsers());
      await syncDocToCloud('app_settings', 'config', this.getSettings());
      return { success: true, message: 'Seluruh data lokal berhasil diunggah ke Firebase Cloud!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal mengunggah data ke Cloud.' };
    }
  },

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
    setItem(STORAGE_KEYS.VIOLATIONS, INITIAL_VIOLATIONS);

    // Sync reset to Cloud
    this.uploadAllToCloud();
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
    syncDocToCloud('app_settings', 'config', settings);
  },

  // Current User / Auth
  getCurrentUser(): User | null {
    return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
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
    let users = getItem<User[]>(STORAGE_KEYS.USERS, []);
    if (!users || users.length === 0) {
      users = [...INITIAL_USERS];
      setItem(STORAGE_KEYS.USERS, users);
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
    syncDocToCloud('users', user.id, user);
  },
  deleteUser(id: string): void {
    const list = this.getUsers().filter(u => u.id !== id);
    setItem(STORAGE_KEYS.USERS, list);
    deleteDocFromCloud('users', id);
  },
  getUserByTeacherId(teacherId: string): User | undefined {
    return this.getUsers().find(u => u.teacherId === teacherId);
  },
  getUserByStudentId(studentId: string): User | undefined {
    return this.getUsers().find(u => u.studentId === studentId);
  },
  updateUserPassword(userId: string, newPassword: string): boolean {
    const list = this.getUsers();
    const user = list.find(u => u.id === userId);
    if (!user) return false;
    user.password = newPassword.trim();
    setItem(STORAGE_KEYS.USERS, list);
    syncDocToCloud('users', user.id, user);
    return true;
  },
  syncAllAccounts(): { totalCreated: number; totalUsers: number } {
    const users = this.getUsers();
    const teachers = this.getTeachers();
    const students = this.getStudents();
    let createdCount = 0;

    // Ensure all Teachers have accounts
    teachers.forEach(t => {
      const existing = users.find(u => u.teacherId === t.id || (u.email && u.email.toLowerCase() === t.email.toLowerCase()));
      if (!existing) {
        const username = t.email ? t.email.split('@')[0].toLowerCase() : `guru.${t.nip.slice(-4)}`;
        users.push({
          id: `usr-t-${t.id}`,
          name: t.name,
          username,
          password: 'guru21',
          email: t.email || `${username}@smpialazhar21.sch.id`,
          role: 'guru',
          avatar: t.photo || (t.gender === 'P'
            ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
          title: `Guru Pengampu Tahfizh (${t.specialization})`,
          phone: t.phone,
          teacherId: t.id
        });
        createdCount++;
      } else if (!existing.teacherId) {
        existing.teacherId = t.id;
      }
    });

    // Ensure all Students have accounts
    students.forEach(s => {
      const existing = users.find(u => u.studentId === s.id || (u.username && u.username.toLowerCase() === s.nis.toLowerCase()));
      if (!existing) {
        users.push({
          id: `usr-s-${s.id}`,
          name: `${s.name} (${s.nickname || 'Santri'})`,
          username: s.nis,
          password: 'santri21',
          email: s.parentEmail || `${s.nis}@santri.smpialazhar21.sch.id`,
          role: 'wali',
          avatar: s.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          title: `Wali Santri / Siswa (${s.parentName || s.name})`,
          phone: s.parentPhone,
          studentId: s.id
        });
        createdCount++;
      } else if (!existing.studentId) {
        existing.studentId = s.id;
      }
    });

    setItem(STORAGE_KEYS.USERS, users);
    syncCollectionToCloud('users', users);
    return { totalCreated: createdCount, totalUsers: users.length };
  },
  authenticate(identifier: string, passwordInput: string): { success: boolean; user?: User; message?: string } {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (passwordInput || '').trim();

    if (!cleanId || !cleanPass) {
      return { success: false, message: 'Username dan kata sandi wajib diisi.' };
    }

    const users = this.getUsers();
    let user = users.find(u => 
      (u.username && u.username.toLowerCase() === cleanId) ||
      (u.email && u.email.toLowerCase() === cleanId) ||
      (u.phone && u.phone.replace(/[\s-]/g, '') === cleanId.replace(/[\s-]/g, '')) ||
      (u.id && u.id.toLowerCase() === cleanId)
    );

    // If not found in users list, check if identifier is student NIS or teacher NIP
    if (!user) {
      const students = this.getStudents();
      const studentMatch = students.find(s => s.nis.toLowerCase() === cleanId || s.nisn === cleanId);
      if (studentMatch) {
        // Auto-create user for this student
        user = {
          id: `usr-s-${studentMatch.id}`,
          name: `${studentMatch.name} (${studentMatch.nickname || 'Santri'})`,
          username: studentMatch.nis,
          password: 'santri21',
          email: studentMatch.parentEmail || `${studentMatch.nis}@santri.smpialazhar21.sch.id`,
          role: 'wali',
          avatar: studentMatch.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          title: `Wali Santri (${studentMatch.parentName || studentMatch.name})`,
          phone: studentMatch.parentPhone,
          studentId: studentMatch.id
        };
        this.saveUser(user);
      }
    }

    if (!user) {
      return { 
        success: false, 
        message: 'Akun dengan username / NIS / email tersebut tidak ditemukan dalam sistem.' 
      };
    }

    // Default fallback passwords for demo accounts if password not set
    const expectedPass = user.password || (
      user.role === 'admin' ? 'admin21' : user.role === 'guru' ? 'guru21' : 'santri21'
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
      message: 'Kata sandi tidak sesuai. Silakan periksa kembali atau hubungi Admin untuk reset kata sandi.' 
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
    syncDocToCloud('classes', cls.id, cls);
  },
  deleteClass(id: string): void {
    const list = this.getClasses().filter(c => c.id !== id);
    setItem(STORAGE_KEYS.CLASSES, list);
    deleteDocFromCloud('classes', id);
  },

  // Auto-distribute students into halaqah groups (1 guru 1-12 anak)
  autoDistributeStudentsToTeachers(maxPerTeacher: number = 12): { totalDistributed: number; groups: { teacherName: string; count: number }[] } {
    const students = this.getStudents();
    const teachers = this.getTeachers();
    if (teachers.length === 0 || students.length === 0) {
      return { totalDistributed: 0, groups: [] };
    }

    // Sort students (e.g., by class, then by name) for balanced grouping
    const sorted = [...students].sort((a, b) => {
      const clsComp = (a.classId || '').localeCompare(b.classId || '');
      if (clsComp !== 0) return clsComp;
      return a.name.localeCompare(b.name);
    });

    const teacherCount = teachers.length;
    const updatedStudents = sorted.map((student, index) => {
      const assignedTeacher = teachers[index % teacherCount];
      return {
        ...student,
        teacherId: assignedTeacher.id
      };
    });

    setItem(STORAGE_KEYS.STUDENTS, updatedStudents);
    syncCollectionToCloud('students', updatedStudents);

    const groups = teachers.map(t => {
      const count = updatedStudents.filter(s => s.teacherId === t.id).length;
      return {
        teacherName: t.name,
        count
      };
    });

    return {
      totalDistributed: updatedStudents.length,
      groups
    };
  },

  // Assign list of student IDs to a specific teacher
  assignStudentsToTeacher(studentIds: string[], teacherId: string): void {
    const students = this.getStudents();
    const updated = students.map(s => {
      if (studentIds.includes(s.id)) {
        return { ...s, teacherId };
      }
      return s;
    });
    setItem(STORAGE_KEYS.STUDENTS, updated);
    syncCollectionToCloud('students', updated);
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
    syncDocToCloud('teachers', teacher.id, teacher);
  },
  deleteTeacher(id: string): void {
    const list = this.getTeachers().filter(t => t.id !== id);
    setItem(STORAGE_KEYS.TEACHERS, list);
    deleteDocFromCloud('teachers', id);
  },

  // Students
  getStudents(): Student[] {
    const list = getItem(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    let modified = false;
    const sanitized = list.map(s => {
      let updatedJilid = s.currentUmmiJilid;
      if (s.currentUmmiJilid === 'Jilid 4') updatedJilid = 'Jilid 2';
      else if (s.currentUmmiJilid === 'Jilid 5') updatedJilid = 'Jilid 2';
      else if (s.currentUmmiJilid === 'Jilid 6') updatedJilid = 'Jilid 3';
      if (updatedJilid !== s.currentUmmiJilid) {
        modified = true;
        return { ...s, currentUmmiJilid: updatedJilid };
      }
      return s;
    });
    if (modified) {
      setItem(STORAGE_KEYS.STUDENTS, sanitized);
    }
    return sanitized;
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
    syncDocToCloud('students', student.id, student);
  },
  deleteStudent(id: string): void {
    const list = this.getStudents().filter(s => s.id !== id);
    setItem(STORAGE_KEYS.STUDENTS, list);
    deleteDocFromCloud('students', id);
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
        currentUmmiJilid: cols[ummiJilidIdx] || 'Jilid 1',
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
      syncCollectionToCloud('students', existing);
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
    syncDocToCloud('memorization_records', record.id, record);

    // Update Student stats
    const student = this.getStudentById(record.studentId);
    if (student) {
      const studentRecords = list.filter(r => r.studentId === student.id);
      const totalScore = studentRecords.reduce((acc, r) => acc + r.finalScore, 0);
      const avgScore = Math.round(totalScore / studentRecords.length);

      const totalAyahs = studentRecords.reduce((acc, r) => acc + r.totalAyah, 0);
      const uniqueSurahs = new Set(studentRecords.map(r => r.surahNumber)).size;
      const approxJuz = Number(Math.min(30, (totalAyahs / 200)).toFixed(1));
      const lastSurahText = rEndSurah(record);

      const updatedStudent: Student = {
        ...student,
        totalAyahHafal: totalAyahs,
        totalSurahHafal: Math.max(student.totalSurahHafal, uniqueSurahs),
        totalJuzHafal: Math.max(student.totalJuzHafal, approxJuz),
        lastHafalan: lastSurahText,
        lastHafalanDate: record.date,
        avgScore: avgScore
      };
      this.saveStudent(updatedStudent);
      this.updateStudentTargetProgress(student.id, updatedStudent.totalJuzHafal);

      this.addNotification({
        id: 'notif-' + Date.now(),
        title: `Setoran ${record.type}: ${student.name}`,
        message: `Ananda ${student.nickname || student.name} berhasil menyetorkan ${lastSurahText} dengan nilai ${record.finalScore} (${record.category}).`,
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
    deleteDocFromCloud('memorization_records', id);
  },

  // Ummi Records
  getUmmiRecords(): UmmiRecord[] {
    const list = getItem(STORAGE_KEYS.UMMI, INITIAL_UMMI_RECORDS);
    let modified = false;
    const sanitized = list.map(r => {
      let updatedJilid = r.jilid;
      if (r.jilid === 'Jilid 4') updatedJilid = 'Jilid 2';
      else if (r.jilid === 'Jilid 5') updatedJilid = 'Jilid 2';
      else if (r.jilid === 'Jilid 6') updatedJilid = 'Jilid 3';
      if (updatedJilid !== r.jilid) {
        modified = true;
        return { ...r, jilid: updatedJilid };
      }
      return r;
    });
    if (modified) {
      setItem(STORAGE_KEYS.UMMI, sanitized);
    }
    return sanitized;
  },
  addUmmiRecord(record: UmmiRecord): void {
    const list = this.getUmmiRecords();
    list.unshift(record);
    setItem(STORAGE_KEYS.UMMI, list);
    syncDocToCloud('ummi_records', record.id, record);

    const student = this.getStudentById(record.studentId);
    if (student) {
      const updatedStudent: Student = {
        ...student,
        currentUmmiJilid: record.jilid,
        currentUmmiPage: record.page
      };
      this.saveStudent(updatedStudent);
    }
  },
  deleteUmmiRecord(id: string): void {
    const list = this.getUmmiRecords().filter(r => r.id !== id);
    setItem(STORAGE_KEYS.UMMI, list);
    deleteDocFromCloud('ummi_records', id);
  },

  // Targets & Capaian
  getTargets(): TargetProgress[] {
    return getItem(STORAGE_KEYS.TARGETS, INITIAL_TARGETS);
  },
  updateStudentTargetProgress(studentId: string, currentJuz: number): void {
    const targets = this.getTargets();
    const idx = targets.findIndex(t => t.studentId === studentId);
    if (idx >= 0) {
      const t = targets[idx];
      t.achievedJuz = currentJuz;
      t.percentage = Math.min(100, Math.round((currentJuz / t.targetJuz) * 100));
      t.status = t.percentage >= 100 ? 'ahead' : t.percentage >= 70 ? 'on-track' : 'behind';
      setItem(STORAGE_KEYS.TARGETS, targets);
      syncCollectionToCloud('targets', targets);
    }
  },

  // Notifications
  getNotifications(): NotificationItem[] {
    return getItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },
  addNotification(notif: NotificationItem): void {
    const list = this.getNotifications();
    list.unshift(notif);
    setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    syncDocToCloud('notifications', notif.id, notif);
  },
  markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const n = list.find(x => x.id === id);
    if (n) {
      n.read = true;
      setItem(STORAGE_KEYS.NOTIFICATIONS, list);
      syncDocToCloud('notifications', n.id, n);
    }
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
    syncDocToCloud('materials', mat.id, mat);
  },
  deleteMaterial(id: string): void {
    const list = this.getMaterials().filter(m => m.id !== id);
    setItem(STORAGE_KEYS.MATERIALS, list);
    deleteDocFromCloud('materials', id);
  },

  // Violations & Kedisiplinan
  getViolations(): TahfizhViolation[] {
    return getItem(STORAGE_KEYS.VIOLATIONS, INITIAL_VIOLATIONS);
  },

  getViolationsByStudent(studentId: string): TahfizhViolation[] {
    return this.getViolations().filter(v => v.studentId === studentId);
  },

  addViolation(violation: Omit<TahfizhViolation, 'id'> | TahfizhViolation): TahfizhViolation {
    const violations = this.getViolations();
    const newViolation: TahfizhViolation = {
      ...violation,
      id: 'id' in violation && violation.id ? violation.id : `vio-${Date.now()}`
    };
    violations.unshift(newViolation);
    setItem(STORAGE_KEYS.VIOLATIONS, violations);
    syncDocToCloud('violations', newViolation.id, newViolation);
    return newViolation;
  },

  updateViolation(violation: TahfizhViolation): void {
    const violations = this.getViolations();
    const idx = violations.findIndex(v => v.id === violation.id);
    if (idx >= 0) {
      violations[idx] = violation;
      setItem(STORAGE_KEYS.VIOLATIONS, violations);
      syncDocToCloud('violations', violation.id, violation);
    }
  },

  deleteViolation(id: string): void {
    const violations = this.getViolations().filter(v => v.id !== id);
    setItem(STORAGE_KEYS.VIOLATIONS, violations);
    deleteDocFromCloud('violations', id);
  },

  exportViolationsToCSV(): string {
    const violations = this.getViolations();
    const students = this.getStudents();
    const teachers = this.getTeachers();

    const headers = ['Tanggal', 'NIS', 'Nama Siswa', 'Jenis Pelanggaran', 'Poin', 'Detail/Kronologi', 'Tindakan Pembinaan', 'Status', 'Guru Pencatat', 'Catatan'];
    const rows = violations.map(v => {
      const std = students.find(s => s.id === v.studentId);
      const tch = teachers.find(t => t.id === v.teacherId)?.name || '-';
      return [
        `"${v.date}"`,
        `"${std?.nis || '-'}"`,
        `"${std?.name || '-'}"`,
        `"${v.typeName}"`,
        v.point,
        `"${(v.details || '').replace(/"/g, '""')}"`,
        `"${(v.actionTaken || '').replace(/"/g, '""')}"`,
        `"${v.status}"`,
        `"${tch}"`,
        `"${(v.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  // Matrikulasi Iqro
  getMatrikulasiStudents(): MatrikulasiStudent[] {
    let list = getItem<MatrikulasiStudent[]>(STORAGE_KEYS.MATRIKULASI_STUDENTS, []);
    if (!list || list.length === 0) {
      list = [...INITIAL_MATRIKULASI_STUDENTS];
      setItem(STORAGE_KEYS.MATRIKULASI_STUDENTS, list);
    }
    return list;
  },

  saveMatrikulasiStudents(list: MatrikulasiStudent[]): void {
    setItem(STORAGE_KEYS.MATRIKULASI_STUDENTS, list);
    syncCollectionToCloud('matrikulasi_students', list);
  },

  addMatrikulasiStudent(item: Omit<MatrikulasiStudent, 'id'> | MatrikulasiStudent): MatrikulasiStudent {
    const list = this.getMatrikulasiStudents();
    const newStudent: MatrikulasiStudent = {
      ...item,
      id: 'id' in item && item.id ? item.id : `mat-std-${Date.now()}`
    };
    list.unshift(newStudent);
    this.saveMatrikulasiStudents(list);
    return newStudent;
  },

  updateMatrikulasiStudent(item: MatrikulasiStudent): void {
    const list = this.getMatrikulasiStudents();
    const idx = list.findIndex(s => s.id === item.id);
    if (idx >= 0) {
      list[idx] = item;
      this.saveMatrikulasiStudents(list);
    }
  },

  deleteMatrikulasiStudent(id: string): void {
    const list = this.getMatrikulasiStudents().filter(s => s.id !== id);
    this.saveMatrikulasiStudents(list);
    deleteDocFromCloud('matrikulasi_students', id);
  },

  getMatrikulasiRecords(): MatrikulasiRecord[] {
    let list = getItem<MatrikulasiRecord[]>(STORAGE_KEYS.MATRIKULASI_RECORDS, []);
    if (!list || list.length === 0) {
      list = [...INITIAL_MATRIKULASI_RECORDS];
      setItem(STORAGE_KEYS.MATRIKULASI_RECORDS, list);
    }
    return list;
  },

  saveMatrikulasiRecords(list: MatrikulasiRecord[]): void {
    setItem(STORAGE_KEYS.MATRIKULASI_RECORDS, list);
    syncCollectionToCloud('matrikulasi_records', list);
  },

  addMatrikulasiRecord(record: Omit<MatrikulasiRecord, 'id'> | MatrikulasiRecord): MatrikulasiRecord {
    const list = this.getMatrikulasiRecords();
    const newRec: MatrikulasiRecord = {
      ...record,
      id: 'id' in record && record.id ? record.id : `mat-rec-${Date.now()}`
    };
    list.unshift(newRec);
    this.saveMatrikulasiRecords(list);

    const matStudents = this.getMatrikulasiStudents();
    const targetMatStudent = matStudents.find(ms => ms.id === newRec.matrikulasiStudentId || ms.studentId === newRec.studentId);
    if (targetMatStudent) {
      targetMatStudent.currentIqroJilid = newRec.jilid;
      targetMatStudent.currentIqroPage = newRec.page;
      this.updateMatrikulasiStudent(targetMatStudent);
    }

    return newRec;
  },

  updateMatrikulasiRecord(record: MatrikulasiRecord): void {
    const list = this.getMatrikulasiRecords();
    const idx = list.findIndex(r => r.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
      this.saveMatrikulasiRecords(list);
    }
  },

  deleteMatrikulasiRecord(id: string): void {
    const list = this.getMatrikulasiRecords().filter(r => r.id !== id);
    this.saveMatrikulasiRecords(list);
    deleteDocFromCloud('matrikulasi_records', id);
  },

  exportMatrikulasiToCSV(): string {
    const records = this.getMatrikulasiRecords();
    const students = this.getStudents();
    const teachers = this.getTeachers();
    const classes = this.getClasses();

    const headers = [
      'Tanggal',
      'Hari',
      'NIS',
      'Nama Santri',
      'Kelas',
      'Jilid Iqro',
      'Halaman',
      'Fokus Materi',
      'Nilai (0-100)',
      'Keterangan (Lulus/Ulang)',
      'Guru Pembimbing',
      'Catatan Evaluasi'
    ];

    const rows = records.map(r => {
      const std = students.find(s => s.id === r.studentId);
      const cls = classes.find(c => c.id === std?.classId)?.name || '-';
      const tch = teachers.find(t => t.id === r.teacherId)?.name || '-';
      return [
        `"${r.date}"`,
        `"${r.day}"`,
        `"${std?.nis || '-'}"`,
        `"${std?.name || '-'}"`,
        `"${cls}"`,
        `"${r.jilid}"`,
        r.page,
        `"${(r.materialFocus || '').replace(/"/g, '""')}"`,
        r.score,
        `"${r.status}"`,
        `"${tch}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
};
