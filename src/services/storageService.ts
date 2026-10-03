import { 
  Student, 
  Teacher, 
  ClassItem, 
  HalaqahGroup,
  MemorizationRecord, 
  UmmiRecord, 
  LearningMaterial, 
  TargetProgress, 
  NotificationItem, 
  TahfizhViolation,
  MatrikulasiStudent,
  MatrikulasiRecord,
  AttendanceRecord,
  ExamSubmission,
  AppSettings, 
  User 
} from '../types';
import { 
  DEFAULT_SETTINGS, 
  INITIAL_CLASSES, 
  INITIAL_HALAQAH_GROUPS,
  INITIAL_MEMORIZATION_RECORDS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_STUDENTS, 
  INITIAL_TARGETS, 
  INITIAL_TEACHERS, 
  INITIAL_UMMI_RECORDS, 
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_USERS,
  INITIAL_VIOLATIONS 
} from '../data/initialData';
import { INITIAL_MATERIALS } from '../data/ummiData';
import { calculateCategory } from '../data/quranData';
import { INITIAL_MATRIKULASI_STUDENTS, INITIAL_MATRIKULASI_RECORDS } from '../data/iqroData';
import { isGrade8or9Student, isUmmiEnrolledStudent, isClass7Bto7E, isLegacyDefaultRaportTarget } from '../utils/gradeHelper';
import { getGradeFromScore } from '../utils/gradeConversion';
import { TermName } from '../types';
import { getStudentStandardTermTarget, evaluateHafalanTerm, evaluateUmmiTerm } from '../data/targetTermData';
import { 
  KaldikData, 
  KaldikCategory,
  ProsemSheet, 
  INITIAL_KALDIK_DATA, 
  INITIAL_KALDIK_REGULER_DATA,
  INITIAL_PROSEM_SHEETS 
} from '../data/kaldikProsemData';
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
  onSnapshot,
  isFirestoreQuotaError,
  disableFirestoreNetwork,
  enableFirestoreNetwork
} from './firebase';

const STORAGE_KEYS = {
  SETTINGS: 'tahfizh_smpia21_settings',
  USERS: 'tahfizh_smpia21_users',
  CLASSES: 'tahfizh_smpia21_classes',
  HALAQAH_GROUPS: 'tahfizh_smpia21_halaqah_groups',
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
  ATTENDANCE: 'tahfizh_smpia21_attendance',
  EXAM_SUBMISSIONS: 'tahfizh_smpia21_exam_submissions',
  KALDIK: 'tahfizh_smpia21_kaldik_v1',
  KALDIK_REGULER: 'tahfizh_smpia21_kaldik_reguler_v1',
  PROSEM: 'tahfizh_smpia21_prosem_v1',
  CLOUD_SYNCED: 'tahfizh_smpia21_cloud_synced',
  QUOTA_EXCEEDED: 'tahfizh_smpia21_quota_exceeded',
  QUOTA_EXCEEDED_DATE: 'tahfizh_smpia21_quota_exceeded_date',
  DELETED_IDS: 'tahfizh_smpia21_deleted_ids'
};

let activeSnapshotUnsubscribers: Array<() => void> = [];

function getTodayUtcDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function checkQuotaExceeded(): boolean {
  try {
    const flag = localStorage.getItem(STORAGE_KEYS.QUOTA_EXCEEDED) === 'true';
    if (!flag) return false;
    const savedDate = localStorage.getItem(STORAGE_KEYS.QUOTA_EXCEEDED_DATE);
    const today = getTodayUtcDateStr();
    // If a new UTC day has started, automatically reset the daily quota flag
    if (savedDate && savedDate !== today) {
      localStorage.removeItem(STORAGE_KEYS.QUOTA_EXCEEDED);
      localStorage.removeItem(STORAGE_KEYS.QUOTA_EXCEEDED_DATE);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function stopRealtimeListeners(): void {
  if (activeSnapshotUnsubscribers.length > 0) {
    activeSnapshotUnsubscribers.forEach(unsub => {
      try {
        unsub();
      } catch {
        // Ignore unsubscribe error
      }
    });
    activeSnapshotUnsubscribers = [];
  }
  isCloudListenerAttached = false;
}

function markQuotaExceeded(exceeded: boolean): void {
  try {
    if (exceeded) {
      localStorage.setItem(STORAGE_KEYS.QUOTA_EXCEEDED, 'true');
      localStorage.setItem(STORAGE_KEYS.QUOTA_EXCEEDED_DATE, getTodayUtcDateStr());
      stopRealtimeListeners();
      disableFirestoreNetwork();
    } else {
      localStorage.removeItem(STORAGE_KEYS.QUOTA_EXCEEDED);
      localStorage.removeItem(STORAGE_KEYS.QUOTA_EXCEEDED_DATE);
    }
  } catch {
    // Ignore storage error
  }
}

// Immediately disable Firestore network on startup if daily quota was already marked exceeded today
if (checkQuotaExceeded()) {
  disableFirestoreNetwork();
}

function withWriteTimeout<T>(promise: Promise<T>, ms = 3500): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('resource-exhausted: Firestore write stream timeout'));
    }, ms);
    promise
      .then(val => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function getDeletedIdsSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_IDS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function markDeletedId(id: string): void {
  if (!id) return;
  try {
    const set = getDeletedIdsSet();
    set.add(String(id));
    localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Error saving deleted ID:', e);
  }
}

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
    if (!items || items.length === 0 || checkQuotaExceeded()) return;
    // Chunk items into batches of 300 (Firestore limit is 500)
    for (let i = 0; i < items.length; i += 300) {
      if (checkQuotaExceeded()) return;
      const chunk = items.slice(i, i + 300);
      const batch = writeBatch(db);
      for (const item of chunk) {
        if (!item || !item.id) continue;
        const ref = doc(db, collectionName, String(item.id));
        const sanitized = JSON.parse(JSON.stringify(item));
        batch.set(ref, sanitized, { merge: true });
      }
      await withWriteTimeout(batch.commit(), 4000);
    }
    console.log(`[Cloud Sync] Synced ${items.length} docs to collection '${collectionName}'`);
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      markQuotaExceeded(true);
      return;
    }
    console.warn(`[Cloud Sync] Batch write warning for ${collectionName}:`, err);
  }
}

async function syncDocToCloud(collectionName: string, id: string, data: any): Promise<void> {
  try {
    if (!id || !data || checkQuotaExceeded()) return;
    const ref = doc(db, collectionName, String(id));
    const sanitized = JSON.parse(JSON.stringify(data));
    await withWriteTimeout(setDoc(ref, sanitized, { merge: true }), 3500);
    console.log(`[Cloud Sync] Synced doc '${collectionName}/${id}'`);
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      markQuotaExceeded(true);
      return;
    }
    console.warn(`[Cloud Sync] Doc write warning for ${collectionName}/${id}:`, err);
  }
}

async function deleteDocFromCloud(collectionName: string, id: string): Promise<void> {
  try {
    if (!id || checkQuotaExceeded()) return;
    const ref = doc(db, collectionName, String(id));
    await withWriteTimeout(deleteDoc(ref), 3500);
    console.log(`[Cloud Sync] Deleted doc '${collectionName}/${id}'`);
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      markQuotaExceeded(true);
      return;
    }
    console.warn(`[Cloud Sync] Delete warning for ${collectionName}/${id}:`, err);
  }
}

// Global Cloud Sync Listener
let isCloudListenerAttached = false;
type SyncCallback = () => void;
const syncListeners: SyncCallback[] = [];

// Deterministic comparator for Memorization & Ummi records: newest date first, then newest _updatedAt, then newest ID
function compareRecordsDesc(
  a: { id?: string; date?: string; _updatedAt?: number },
  b: { id?: string; date?: string; _updatedAt?: number }
): number {
  const timeA = a?.date ? new Date(a.date).getTime() : 0;
  const timeB = b?.date ? new Date(b.date).getTime() : 0;
  if (timeB !== timeA) return timeB - timeA;
  const updA = (a as any)?._updatedAt || 0;
  const updB = (b as any)?._updatedAt || 0;
  if (updB !== updA) return updB - updA;
  return String(b?.id || '').localeCompare(String(a?.id || ''), undefined, { numeric: true });
}

// Safe merge helper: merges incoming cloud snapshots into local storage WITHOUT triggering write-backs inside onSnapshot
function mergeCloudSnapshotWithLocal<T extends { id: string }>(
  key: string,
  cloudList: T[],
  _collectionName: string,
  sortCompare?: (a: T, b: T) => number
): T[] {
  const deletedSet = getDeletedIdsSet();
  const localList = getItem<T[]>(key, []).filter(item => item && item.id && !deletedSet.has(String(item.id)));
  const cloudMap = new Map<string, T>();
  
  cloudList.forEach(item => {
    if (item && item.id) {
      const idStr = String(item.id);
      if (deletedSet.has(idStr)) {
        return;
      }
      const existing = cloudMap.get(idStr);
      if (!existing || ((item as any)._updatedAt || 0) >= ((existing as any)._updatedAt || 0)) {
        cloudMap.set(idStr, item);
      }
    }
  });

  localList.forEach(localItem => {
    if (localItem && localItem.id) {
      const idStr = String(localItem.id);
      const cloudItem = cloudMap.get(idStr);
      if (!cloudItem) {
        // Keep local item that hasn't arrived in cloud yet
        cloudMap.set(idStr, localItem);
      } else {
        const localUpdated = (localItem as any)._updatedAt || 0;
        const cloudUpdated = (cloudItem as any)._updatedAt || 0;
        if (localUpdated > cloudUpdated) {
          cloudMap.set(idStr, localItem);
        }
      }
    }
  });

  const merged = Array.from(cloudMap.values());
  if (sortCompare) {
    merged.sort(sortCompare);
  }

  setItem(key, merged);
  return merged;
}

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

  // Attach Realtime Multi-Device Listeners
  startRealtimeSync() {
    if (isCloudListenerAttached || checkQuotaExceeded()) return;
    isCloudListenerAttached = true;
    console.log('[Cloud Sync] Starting realtime multi-device listeners...');

    const onListenerError = (label: string) => (err: unknown) => {
      if (isFirestoreQuotaError(err)) {
        markQuotaExceeded(true);
        this.notifyListeners();
        return;
      }
      console.warn(`[Cloud Sync] ${label} listener warning:`, err);
    };

    try {
      // 1. Memorization Records
      activeSnapshotUnsubscribers.push(
        onSnapshot(collection(db, 'memorization_records'), (snap) => {
          const list: MemorizationRecord[] = [];
          snap.forEach(d => {
            const item = d.data() as MemorizationRecord;
            if (item) list.push({ ...item, id: item.id || d.id });
          });
          mergeCloudSnapshotWithLocal(
            STORAGE_KEYS.MEMORIZATION,
            list,
            'memorization_records',
            compareRecordsDesc
          );
          this.notifyListeners();
        }, onListenerError('Memorization'))
      );

      // 2. Ummi Records
      activeSnapshotUnsubscribers.push(
        onSnapshot(collection(db, 'ummi_records'), (snap) => {
          const list: UmmiRecord[] = [];
          snap.forEach(d => {
            const item = d.data() as UmmiRecord;
            if (item) list.push({ ...item, id: item.id || d.id });
          });
          mergeCloudSnapshotWithLocal(
            STORAGE_KEYS.UMMI,
            list,
            'ummi_records',
            compareRecordsDesc
          );
          this.notifyListeners();
        }, onListenerError('Ummi'))
      );

      // 3. Students
      activeSnapshotUnsubscribers.push(
        onSnapshot(collection(db, 'students'), (snap) => {
          const list: Student[] = [];
          snap.forEach(d => {
            const item = d.data() as Student;
            if (item) list.push({ ...item, id: item.id || d.id });
          });
          mergeCloudSnapshotWithLocal(STORAGE_KEYS.STUDENTS, list, 'students');
          this.notifyListeners();
        }, onListenerError('Students'))
      );

      // 4. Teachers
      activeSnapshotUnsubscribers.push(
        onSnapshot(collection(db, 'teachers'), (snap) => {
          const list: Teacher[] = [];
          snap.forEach(d => {
            const item = d.data() as Teacher;
            if (item) list.push({ ...item, id: item.id || d.id });
          });
          mergeCloudSnapshotWithLocal(STORAGE_KEYS.TEACHERS, list, 'teachers');
          this.notifyListeners();
        }, onListenerError('Teachers'))
      );

      // 5. Classes
      activeSnapshotUnsubscribers.push(
        onSnapshot(collection(db, 'classes'), (snap) => {
          const list: ClassItem[] = [];
          snap.forEach(d => {
            const item = d.data() as ClassItem;
            if (item) list.push({ ...item, id: item.id || d.id });
          });
          mergeCloudSnapshotWithLocal(STORAGE_KEYS.CLASSES, list, 'classes');
          this.notifyListeners();
        }, onListenerError('Classes'))
      );

      // 5b. Halaqah Groups (Intelligent Realtime Sync)
      activeSnapshotUnsubscribers.push(
        onSnapshot(collection(db, 'halaqah_groups'), (snap) => {
          const list: HalaqahGroup[] = [];
          snap.forEach(d => {
            const item = d.data() as HalaqahGroup;
            if (item) list.push({ ...item, id: item.id || d.id });
          });
          mergeCloudSnapshotWithLocal(
            STORAGE_KEYS.HALAQAH_GROUPS,
            list,
            'halaqah_groups',
            (a, b) => (a.name || '').localeCompare(b.name || '', 'id', { numeric: true, sensitivity: 'base' })
          );
          this.notifyListeners();
        }, onListenerError('Halaqah Groups'))
      );

      // 6. Targets
      activeSnapshotUnsubscribers.push(
        onSnapshot(collection(db, 'targets'), (snap) => {
          const list: TargetProgress[] = [];
          snap.forEach(d => {
            const item = d.data() as TargetProgress;
            if (item) list.push({ ...item, id: item.id || d.id });
          });
          mergeCloudSnapshotWithLocal(STORAGE_KEYS.TARGETS, list, 'targets');
          this.notifyListeners();
        }, onListenerError('Targets'))
      );

      // 7. Materials
      activeSnapshotUnsubscribers.push(
        onSnapshot(collection(db, 'materials'), (snap) => {
          const list: LearningMaterial[] = [];
          snap.forEach(d => {
            const item = d.data() as LearningMaterial;
            if (item) list.push({ ...item, id: item.id || d.id });
          });
          mergeCloudSnapshotWithLocal(STORAGE_KEYS.MATERIALS, list, 'materials');
          this.notifyListeners();
        }, onListenerError('Materials'))
      );

      // 8. Violations
      activeSnapshotUnsubscribers.push(
        onSnapshot(collection(db, 'violations'), (snap) => {
          const list: TahfizhViolation[] = [];
          snap.forEach(d => {
            const item = d.data() as TahfizhViolation;
            if (item) list.push({ ...item, id: item.id || d.id });
          });
          mergeCloudSnapshotWithLocal(
            STORAGE_KEYS.VIOLATIONS,
            list,
            'violations',
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          this.notifyListeners();
        }, onListenerError('Violations'))
      );

      // 9. Matrikulasi Students
      activeSnapshotUnsubscribers.push(
        onSnapshot(collection(db, 'matrikulasi_students'), (snap) => {
          const list: MatrikulasiStudent[] = [];
          snap.forEach(d => {
            const item = d.data() as MatrikulasiStudent;
            if (item) list.push({ ...item, id: item.id || d.id });
          });
          mergeCloudSnapshotWithLocal(STORAGE_KEYS.MATRIKULASI_STUDENTS, list, 'matrikulasi_students');
          this.notifyListeners();
        }, onListenerError('Matrikulasi students'))
      );

      // 10. Matrikulasi Records
      activeSnapshotUnsubscribers.push(
        onSnapshot(collection(db, 'matrikulasi_records'), (snap) => {
          const list: MatrikulasiRecord[] = [];
          snap.forEach(d => {
            const item = d.data() as MatrikulasiRecord;
            if (item) list.push({ ...item, id: item.id || d.id });
          });
          mergeCloudSnapshotWithLocal(
            STORAGE_KEYS.MATRIKULASI_RECORDS, 
            list, 
            'matrikulasi_records',
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          this.notifyListeners();
        }, onListenerError('Matrikulasi records'))
      );

      // 10b. Attendance Records
      activeSnapshotUnsubscribers.push(
        onSnapshot(collection(db, 'attendance_records'), (snap) => {
          const list: AttendanceRecord[] = [];
          snap.forEach(d => {
            const item = d.data() as AttendanceRecord;
            if (item) list.push({ ...item, id: item.id || d.id });
          });
          mergeCloudSnapshotWithLocal(
            STORAGE_KEYS.ATTENDANCE,
            list,
            'attendance_records',
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          this.notifyListeners();
        }, onListenerError('Attendance records'))
      );

      // 10c. Exam Submissions (Ujian Kenaikan Jilid, Munaqosyah, Juziyyah)
      activeSnapshotUnsubscribers.push(
        onSnapshot(collection(db, 'exam_submissions'), (snap) => {
          const list: ExamSubmission[] = [];
          snap.forEach(d => {
            const item = d.data() as ExamSubmission;
            if (item) list.push({ ...item, id: item.id || d.id });
          });
          mergeCloudSnapshotWithLocal(
            STORAGE_KEYS.EXAM_SUBMISSIONS,
            list,
            'exam_submissions',
            (a, b) => new Date(b.submissionDate || b.createdAt).getTime() - new Date(a.submissionDate || a.createdAt).getTime()
          );
          this.notifyListeners();
        }, onListenerError('Exam submissions'))
      );

      // 11. Users
      activeSnapshotUnsubscribers.push(
        onSnapshot(collection(db, 'users'), (snap) => {
          const list: User[] = [];
          snap.forEach(d => list.push(d.data() as User));
          if (list.length > 0 || !localStorage.getItem(STORAGE_KEYS.USERS)) {
            setItem(STORAGE_KEYS.USERS, list);
            this.notifyListeners();
          }
        }, onListenerError('Users'))
      );

      // 12. App Settings
      activeSnapshotUnsubscribers.push(
        onSnapshot(doc(db, 'app_settings', 'config'), (snap) => {
          if (snap.exists()) {
            setItem(STORAGE_KEYS.SETTINGS, snap.data() as AppSettings);
            this.notifyListeners();
          }
        }, onListenerError('Settings'))
      );
    } catch (err) {
      if (isFirestoreQuotaError(err)) {
        markQuotaExceeded(true);
      }
      console.warn('[Cloud Sync] Realtime listener error:', err);
    }
  },

  // Quota Management for Firebase Spark Tier
  isQuotaExceeded(): boolean {
    return checkQuotaExceeded();
  },

  setQuotaExceeded(exceeded: boolean): void {
    markQuotaExceeded(exceeded);
  },

  clearQuotaStatus(): void {
    markQuotaExceeded(false);
    enableFirestoreNetwork();
  },

  getQuotaInfo(): { exceeded: boolean; message: string; upgradeUrl: string } {
    const exceeded = this.isQuotaExceeded();
    return {
      exceeded,
      message: exceeded
        ? 'Batas kuota harian Firebase Firestore (Spark Free Tier) tercapai. Data tersimpan aman secara offline/lokal.'
        : 'Kuota Firebase Firestore dalam batas normal.',
      upgradeUrl: 'https://console.firebase.google.com'
    };
  },

  // Initialize Realtime Cloud Sync & Download / Seed to Firebase
  async initCloudSync(force: boolean = false): Promise<{ success: boolean; message: string; isQuotaExceeded?: boolean }> {
    try {
      if (force) {
        this.clearQuotaStatus();
      } else if (this.isQuotaExceeded()) {
        await disableFirestoreNetwork();
        return {
          success: false,
          isQuotaExceeded: true,
          message: 'Batas kuota harian Firebase Firestore telah tercapai. Aplikasi beroperasi normal dalam Mode Penyimpanan Lokal (Offline).'
        };
      }

      console.log('[Cloud Sync] Initializing Firestore Sync across devices...', { force });

      const isAlreadySeeded = localStorage.getItem(STORAGE_KEYS.CLOUD_SYNCED) === 'true';
      const deletedSet = getDeletedIdsSet();

      // Helper for intelligent 2-way sync without burning write quota on every reload
      const mergeTwoWay = async <T extends { id: string }>(col: string, local: T[], cloud: T[]): Promise<T[]> => {
        const cleanLocal = local.filter(item => item && item.id && !deletedSet.has(String(item.id)));
        const cleanCloud: T[] = [];
        cloud.forEach(c => {
          if (!c || !c.id) return;
          if (!deletedSet.has(String(c.id))) {
            cleanCloud.push(c);
          }
        });

        if (cleanCloud.length === 0) {
          if (cleanLocal.length > 0 && (!isAlreadySeeded || force) && !checkQuotaExceeded()) {
            await syncCollectionToCloud(col, cleanLocal);
          }
          return cleanLocal;
        }
        const map = new Map<string, T>();
        cleanCloud.forEach(c => map.set(c.id, c));
        const missingInCloud: T[] = [];
        cleanLocal.forEach(l => {
          const existingCloud = map.get(l.id);
          if (!existingCloud) {
            map.set(l.id, l);
            missingInCloud.push(l);
          } else {
            const localUpdated = (l as any)._updatedAt || 0;
            const cloudUpdated = (existingCloud as any)._updatedAt || 0;
            if (localUpdated > cloudUpdated) {
              map.set(l.id, l);
              missingInCloud.push(l);
            }
          }
        });
        if (force && missingInCloud.length > 0 && !checkQuotaExceeded()) {
          await syncCollectionToCloud(col, missingInCloud);
        }
        return Array.from(map.values());
      };

      // 1. Fetch & Merge Students
      const stdSnap = await getDocs(collection(db, 'students'));
      const cloudStudents: Student[] = [];
      stdSnap.forEach(d => {
        const item = d.data() as Student;
        if (item) cloudStudents.push({ ...item, id: item.id || d.id });
      });
      const mergedStudents = await mergeTwoWay('students', this.getStudents(), cloudStudents);
      setItem(STORAGE_KEYS.STUDENTS, mergedStudents);

      // 2. Fetch & Merge Teachers
      const tchSnap = await getDocs(collection(db, 'teachers'));
      const cloudTeachers: Teacher[] = [];
      tchSnap.forEach(d => {
        const item = d.data() as Teacher;
        if (item) cloudTeachers.push({ ...item, id: item.id || d.id });
      });
      const mergedTeachers = await mergeTwoWay('teachers', this.getTeachers(), cloudTeachers);
      setItem(STORAGE_KEYS.TEACHERS, mergedTeachers);

      // 3. Fetch & Merge Classes
      const clsSnap = await getDocs(collection(db, 'classes'));
      const cloudClasses: ClassItem[] = [];
      clsSnap.forEach(d => {
        const item = d.data() as ClassItem;
        if (item) cloudClasses.push({ ...item, id: item.id || d.id });
      });
      const mergedClasses = await mergeTwoWay('classes', this.getClasses(), cloudClasses);
      setItem(STORAGE_KEYS.CLASSES, mergedClasses);

      // 3b. Fetch & Merge Halaqah Groups
      const hlqSnap = await getDocs(collection(db, 'halaqah_groups'));
      const cloudHalaqah: HalaqahGroup[] = [];
      hlqSnap.forEach(d => {
        const item = d.data() as HalaqahGroup;
        if (item) {
          cloudHalaqah.push({ ...item, id: item.id || d.id });
        }
      });
      const mergedHalaqah = await mergeTwoWay('halaqah_groups', this.getHalaqahGroups(), cloudHalaqah);
      setItem(STORAGE_KEYS.HALAQAH_GROUPS, mergedHalaqah);

      // 4. Fetch & Merge Memorization Records
      const memSnap = await getDocs(collection(db, 'memorization_records'));
      const cloudMem: MemorizationRecord[] = [];
      memSnap.forEach(d => {
        const item = d.data() as MemorizationRecord;
        if (item) cloudMem.push({ ...item, id: item.id || d.id });
      });
      const mergedMem = await mergeTwoWay('memorization_records', this.getMemorizationRecords(), cloudMem);
      mergedMem.sort(compareRecordsDesc);
      setItem(STORAGE_KEYS.MEMORIZATION, mergedMem);

      // 5. Fetch & Merge Ummi Records
      const ummiSnap = await getDocs(collection(db, 'ummi_records'));
      const cloudUmmi: UmmiRecord[] = [];
      ummiSnap.forEach(d => {
        const item = d.data() as UmmiRecord;
        if (item) cloudUmmi.push({ ...item, id: item.id || d.id });
      });
      const mergedUmmi = await mergeTwoWay('ummi_records', this.getUmmiRecords(), cloudUmmi);
      mergedUmmi.sort(compareRecordsDesc);
      setItem(STORAGE_KEYS.UMMI, mergedUmmi);

      // Sinkronisasi otomatis data santri dengan setoran evaluasi Ummi & Hafalan terkini (secara lokal)
      try {
        let studentsChanged = false;
        let ummiChanged = false;

        const latestUmmiMap = new Map<string, UmmiRecord>();
        mergedUmmi.forEach(u => {
          if (!latestUmmiMap.has(u.studentId)) {
            latestUmmiMap.set(u.studentId, u);
          }
        });

        const latestMemMap = new Map<string, MemorizationRecord>();
        mergedMem.forEach(m => {
          if (!latestMemMap.has(m.studentId)) {
            latestMemMap.set(m.studentId, m);
          }
        });

        const synchronizedStudents = mergedStudents.map(s => {
          let updated = false;
          let newJilid = s.currentUmmiJilid;
          let newPage = s.currentUmmiPage;
          let newRaportCapaian = s.raportUmmiCapaian;
          let newLastHafalan = s.lastHafalan;
          let newLastHafalanDate = s.lastHafalanDate;
          const newAvgScore = s.avgScore;

          const isGrade89 = isGrade8or9Student(s, mergedClasses);
          if (isGrade89) {
            if (s.currentUmmiJilid !== '-' || (s.currentUmmiPage && s.currentUmmiPage > 0)) {
              newJilid = '-';
              newPage = 0;
              updated = true;
            }
          } else {
            if (s.currentUmmiJilid === 'Munaqasyah') {
              newJilid = 'Munaqosyah';
              updated = true;
            } else if (s.currentUmmiJilid === 'Tahfidz') {
              newJilid = 'Tahfizh';
              updated = true;
            }

            const latestUmmi = latestUmmiMap.get(s.id) || mergedUmmi.find(u => 
              u.studentId === s.id ||
              (s.nis && u.studentId === s.nis) || 
              (s.name && (u as any).studentName && (u as any).studentName.toLowerCase().trim() === s.name.toLowerCase().trim())
            );
            if (latestUmmi) {
              const studentUpdatedAt = (s as any)._updatedAt || 0;
              const ummiUpdatedAt = (latestUmmi as any)._updatedAt || 0;
              const shouldSyncFromUmmi = (!newJilid || newJilid === '-') || (ummiUpdatedAt > studentUpdatedAt) || (studentUpdatedAt === 0 && latestUmmi.jilid && latestUmmi.jilid !== '-');
              if (shouldSyncFromUmmi) {
                if (newJilid !== latestUmmi.jilid) {
                  newJilid = latestUmmi.jilid;
                  updated = true;
                }
                if (newPage !== latestUmmi.page) {
                  newPage = latestUmmi.page;
                  updated = true;
                }
                const expectedCapaian = `${latestUmmi.jilid} halaman ${latestUmmi.page || 1}`;
                if (newRaportCapaian !== expectedCapaian) {
                  newRaportCapaian = expectedCapaian;
                  updated = true;
                }
              } else if (studentUpdatedAt > ummiUpdatedAt && newJilid && newJilid !== '-') {
                if (latestUmmi.jilid !== newJilid || latestUmmi.page !== (newPage || 1) || latestUmmi.studentId !== s.id) {
                  const uIdx = mergedUmmi.findIndex(u => u.id === latestUmmi.id);
                  if (uIdx >= 0) {
                    mergedUmmi[uIdx] = {
                      ...mergedUmmi[uIdx],
                      studentId: s.id,
                      jilid: newJilid,
                      page: newPage || 1,
                      _updatedAt: studentUpdatedAt
                    } as any;
                    ummiChanged = true;
                  }
                }
              }
            }
          }

          const latestMem = latestMemMap.get(s.id);
          if (latestMem) {
            const hafalanStr = `${latestMem.surahName || (latestMem as any).surah || ''}: ${latestMem.startAyah}-${latestMem.endAyah}`;
            if (s.lastHafalan !== hafalanStr) {
              newLastHafalan = hafalanStr;
              updated = true;
            }
            if (s.lastHafalanDate !== latestMem.date) {
              newLastHafalanDate = latestMem.date;
              updated = true;
            }
          }

          let newRaportTarget = s.raportTargetHafalan;
          let newTargetSuratAyat = s.targetSuratAyat;
          if (isClass7Bto7E(s, mergedClasses)) {
            const curTarget = (s.raportTargetHafalan || s.targetSuratAyat || '').trim();
            if (!curTarget || isLegacyDefaultRaportTarget(curTarget)) {
              newRaportTarget = 'Al-Kautsar : 3';
              newTargetSuratAyat = 'Al-Kautsar : 3';
              updated = true;
            }
          }

          if (updated) {
            studentsChanged = true;
            return {
              ...s,
              currentUmmiJilid: newJilid,
              currentUmmiPage: newPage,
              raportUmmiCapaian: newRaportCapaian,
              raportTargetHafalan: newRaportTarget,
              targetSuratAyat: newTargetSuratAyat,
              lastHafalan: newLastHafalan,
              lastHafalanDate: newLastHafalanDate,
              avgScore: newAvgScore
            };
          }
          return s;
        });

        if (ummiChanged) {
          setItem(STORAGE_KEYS.UMMI, mergedUmmi);
        }

        if (studentsChanged) {
          setItem(STORAGE_KEYS.STUDENTS, synchronizedStudents);
        }
      } catch (err) {
        console.warn('[Cloud Sync] Student progress auto-sync warning:', err);
      }

      // 6. Fetch & Merge Targets
      const tgtSnap = await getDocs(collection(db, 'targets'));
      const cloudTargets: TargetProgress[] = [];
      tgtSnap.forEach(d => cloudTargets.push(d.data() as TargetProgress));
      const mergedTargets = await mergeTwoWay('targets', this.getTargets(), cloudTargets);
      setItem(STORAGE_KEYS.TARGETS, mergedTargets);

      // 7. Fetch & Merge Materials
      const matSnap = await getDocs(collection(db, 'materials'));
      const cloudMat: LearningMaterial[] = [];
      matSnap.forEach(d => cloudMat.push(d.data() as LearningMaterial));
      const mergedMat = await mergeTwoWay('materials', this.getMaterials(), cloudMat);
      setItem(STORAGE_KEYS.MATERIALS, mergedMat);

      // 8. Fetch & Merge Violations
      const vioSnap = await getDocs(collection(db, 'violations'));
      const cloudVio: TahfizhViolation[] = [];
      vioSnap.forEach(d => {
        const item = d.data() as TahfizhViolation;
        if (item) cloudVio.push({ ...item, id: item.id || d.id });
      });
      const mergedVio = await mergeTwoWay('violations', this.getViolations(), cloudVio);
      mergedVio.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItem(STORAGE_KEYS.VIOLATIONS, mergedVio);

      // 9. Fetch & Merge Matrikulasi
      const matStdSnap = await getDocs(collection(db, 'matrikulasi_students'));
      const cloudMatStd: MatrikulasiStudent[] = [];
      matStdSnap.forEach(d => {
        const item = d.data() as MatrikulasiStudent;
        if (item) cloudMatStd.push({ ...item, id: item.id || d.id });
      });
      const mergedMatStd = await mergeTwoWay('matrikulasi_students', this.getMatrikulasiStudents(), cloudMatStd);
      setItem(STORAGE_KEYS.MATRIKULASI_STUDENTS, mergedMatStd);

      const matRecSnap = await getDocs(collection(db, 'matrikulasi_records'));
      const cloudMatRec: MatrikulasiRecord[] = [];
      matRecSnap.forEach(d => {
        const item = d.data() as MatrikulasiRecord;
        if (item) cloudMatRec.push({ ...item, id: item.id || d.id });
      });
      const mergedMatRec = await mergeTwoWay('matrikulasi_records', this.getMatrikulasiRecords(), cloudMatRec);
      mergedMatRec.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItem(STORAGE_KEYS.MATRIKULASI_RECORDS, mergedMatRec);

      // 9b. Fetch & Merge Attendance Records
      const attSnap = await getDocs(collection(db, 'attendance_records'));
      const cloudAtt: AttendanceRecord[] = [];
      attSnap.forEach(d => cloudAtt.push(d.data() as AttendanceRecord));
      const mergedAtt = await mergeTwoWay('attendance_records', this.getAttendanceRecords(), cloudAtt);
      mergedAtt.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItem(STORAGE_KEYS.ATTENDANCE, mergedAtt);

      // 10. Fetch & Merge Settings
      const setDocSnap = await getDoc(doc(db, 'app_settings', 'config'));
      if (setDocSnap.exists()) {
        setItem(STORAGE_KEYS.SETTINGS, setDocSnap.data() as AppSettings);
      } else if (!isAlreadySeeded || force) {
        const localSet = this.getSettings();
        await syncDocToCloud('app_settings', 'config', localSet);
      }

      // 11. Fetch & Merge Users
      const usrSnap = await getDocs(collection(db, 'users'));
      const cloudUsers: User[] = [];
      usrSnap.forEach(d => cloudUsers.push(d.data() as User));
      const mergedUsers = await mergeTwoWay('users', this.getUsers(), cloudUsers);
      setItem(STORAGE_KEYS.USERS, mergedUsers);

      localStorage.setItem(STORAGE_KEYS.CLOUD_SYNCED, 'true');
      this.setQuotaExceeded(false);

      // Attach Real-time snapshot listeners after initial sync succeeds
      this.startRealtimeSync();

      this.notifyListeners();
      return { success: true, message: 'Database Firebase Firestore aktif & tersinkronisasi realtime!', isQuotaExceeded: false };
    } catch (e: any) {
      const isQuota = isFirestoreQuotaError(e);

      if (isQuota) {
        this.setQuotaExceeded(true);
        this.notifyListeners();
        return {
          success: false,
          isQuotaExceeded: true,
          message: 'Batas kuota harian Firebase Firestore telah tercapai. Aplikasi beroperasi normal dalam Mode Penyimpanan Lokal (Offline).'
        };
      }
      console.warn('[Cloud Sync] Cloud storage init warning:', e);
      return { success: false, message: e?.message || 'Gagal menyambung ke database Firestore.', isQuotaExceeded: false };
    }
  },

  // Push all local data to Cloud database explicitly
  async uploadAllToCloud(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('[Cloud Sync] Uploading all records to Firebase...');
      await syncCollectionToCloud('students', this.getStudents());
      await syncCollectionToCloud('teachers', this.getTeachers());
      await syncCollectionToCloud('classes', this.getClasses());
      await syncCollectionToCloud('halaqah_groups', this.getHalaqahGroups());
      await syncCollectionToCloud('memorization_records', this.getMemorizationRecords());
      await syncCollectionToCloud('ummi_records', this.getUmmiRecords());
      await syncCollectionToCloud('violations', this.getViolations());
      await syncCollectionToCloud('matrikulasi_students', this.getMatrikulasiStudents());
      await syncCollectionToCloud('matrikulasi_records', this.getMatrikulasiRecords());
      await syncCollectionToCloud('attendance_records', this.getAttendanceRecords());
      await syncCollectionToCloud('users', this.getUsers());
      await syncCollectionToCloud('targets', this.getTargets());
      await syncCollectionToCloud('materials', this.getMaterials());
      await syncDocToCloud('app_settings', 'config', this.getSettings());
      localStorage.setItem(STORAGE_KEYS.CLOUD_SYNCED, 'true');
      return { success: true, message: 'Seluruh data berhasil tersimpan di database Firebase Cloud!' };
    } catch (err: any) {
      console.error('[Cloud Sync] Upload failed:', err);
      return { success: false, message: err?.message || 'Gagal mengunggah data ke Cloud.' };
    }
  },

  // Reset all data to default
  resetToDefaults(): void {
    setItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    setItem(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    setItem(STORAGE_KEYS.HALAQAH_GROUPS, INITIAL_HALAQAH_GROUPS);
    setItem(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    setItem(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    setItem(STORAGE_KEYS.MEMORIZATION, INITIAL_MEMORIZATION_RECORDS);
    setItem(STORAGE_KEYS.UMMI, INITIAL_UMMI_RECORDS);
    setItem(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    setItem(STORAGE_KEYS.TARGETS, INITIAL_TARGETS);
    setItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    setItem(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
    setItem(STORAGE_KEYS.VIOLATIONS, INITIAL_VIOLATIONS);
    setItem(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE_RECORDS);

    // Sync reset to Cloud
    this.uploadAllToCloud();
  },

  resetToInitial(): void {
    this.resetToDefaults();
  },

  // Settings
  getSettings(): AppSettings {
    const settings = getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    const teachers = getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    const yusrieTeacher = teachers.find(t => (t.name || '').toLowerCase().includes('yusrie'));
    const coordLower = (settings.tahfizhCoordinator || '').toLowerCase();
    if (!settings.tahfizhCoordinator || coordLower.includes('fauzan') || coordLower.includes('sekar')) {
      settings.tahfizhCoordinator = yusrieTeacher?.name || 'Ustadz Muhammad Yusrie Alfian, S.Ag.';
      settings.tahfizhCoordinatorNik = yusrieTeacher?.nip || '04.0413';
      setItem(STORAGE_KEYS.SETTINGS, settings);
    }
    return settings;
  },
  saveSettings(settings: AppSettings): void {
    setItem(STORAGE_KEYS.SETTINGS, settings);
    syncDocToCloud('app_settings', 'config', settings);
  },

  // Current User / Auth
  getCurrentUser(): User | null {
    const user = getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (!user) return null;

    // Sync current user with latest teacher data if guru
    if (user.role === 'guru') {
      const teachers = this.getTeachers();
      const teacher = teachers.find(t => 
        (user.teacherId && t.id === user.teacherId) ||
        (user.email && t.email && t.email.toLowerCase() === user.email.toLowerCase()) ||
        (user.id === `usr-t-${t.id}`)
      );
      if (teacher && (user.name !== teacher.name || user.teacherId !== teacher.id || (teacher.photo && user.avatar !== teacher.photo))) {
        const synced: User = {
          ...user,
          name: teacher.name,
          teacherId: teacher.id,
          avatar: user.avatar || teacher.photo || '',
          email: user.email || teacher.email,
          phone: user.phone || teacher.phone
        };
        setItem(STORAGE_KEYS.CURRENT_USER, synced);
        return synced;
      }
    }
    return user;
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

    // Self-healing synchronization with teachers to prevent name discrepancies with halaqah
    const teachers = getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, INITIAL_TEACHERS);
    let changed = false;
    users = users.map(u => {
      // Fix old mismatched user usr-guru-3 if still named Zulkifli
      if (u.id === 'usr-guru-3' && (u.name.includes('Zulkifli') || u.username === 'zulkifli')) {
        const t3 = teachers.find(t => t.id === 't-3');
        if (t3) {
          changed = true;
          return {
            ...u,
            name: t3.name,
            email: t3.email,
            phone: t3.phone,
            teacherId: 't-3',
            title: `Pengampu Halaqah (${t3.specialization})`
          };
        }
      }

      if (u.role === 'guru' && u.teacherId) {
        const tch = teachers.find(t => t.id === u.teacherId);
        if (tch && tch.name !== u.name) {
          changed = true;
          return {
            ...u,
            name: tch.name,
            email: tch.email || u.email,
            phone: tch.phone || u.phone,
            avatar: tch.photo || u.avatar
          };
        }
      }
      return u;
    });

    if (changed) {
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

    // If teacher account, keep Teacher model & Halaqah groups completely in sync
    if (user.role === 'guru' && user.teacherId) {
      const teachers = this.getTeachers();
      const tIdx = teachers.findIndex(t => t.id === user.teacherId);
      if (tIdx >= 0) {
        teachers[tIdx] = {
          ...teachers[tIdx],
          name: user.name,
          email: user.email || teachers[tIdx].email,
          phone: user.phone || teachers[tIdx].phone,
          photo: user.avatar || teachers[tIdx].photo
        };
        setItem(STORAGE_KEYS.TEACHERS, teachers);
        syncDocToCloud('teachers', user.teacherId, teachers[tIdx]);
      }

      // Sync Halaqah group teacher names
      const halaqahs = getItem<HalaqahGroup[]>(STORAGE_KEYS.HALAQAH_GROUPS, INITIAL_HALAQAH_GROUPS);
      let hlqChanged = false;
      const updatedHlq = halaqahs.map(g => {
        if (g.teacherId === user.teacherId && g.teacherName !== user.name) {
          hlqChanged = true;
          return { ...g, teacherName: user.name };
        }
        return g;
      });
      if (hlqChanged) {
        setItem(STORAGE_KEYS.HALAQAH_GROUPS, updatedHlq);
        syncCollectionToCloud('halaqah_groups', updatedHlq);
      }
    }
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
          avatar: t.photo || '',
          title: `Guru Pengampu Tahfizh (${t.specialization})`,
          phone: t.phone,
          teacherId: t.id
        });
        createdCount++;
      } else {
        if (!existing.teacherId) {
          existing.teacherId = t.id;
        }
        if (existing.name !== t.name) {
          existing.name = t.name;
        }
        if (t.photo && !existing.avatar) {
          existing.avatar = t.photo;
        }
      }
    });

    // Ensure all Halaqah Groups have synchronized teacherName
    const halaqahs = this.getHalaqahGroups();
    let hlqSynced = false;
    const updatedHalaqahs = halaqahs.map(h => {
      const tch = teachers.find(t => t.id === h.teacherId);
      if (tch && tch.name !== h.teacherName) {
        hlqSynced = true;
        return { ...h, teacherName: tch.name };
      }
      return h;
    });
    if (hlqSynced) {
      setItem(STORAGE_KEYS.HALAQAH_GROUPS, updatedHalaqahs);
      syncCollectionToCloud('halaqah_groups', updatedHalaqahs);
    }

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
          avatar: s.photo || '',
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
          avatar: studentMatch.photo || '',
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

  async authenticateAsync(identifier: string, passwordInput: string): Promise<{ success: boolean; user?: User; message?: string }> {
    // 1. Try local authentication
    let res = this.authenticate(identifier, passwordInput);
    if (res.success) return res;

    // 2. Fallback: Fetch fresh users and students from Firestore in case created/modified on another device
    try {
      const usrSnap = await getDocs(collection(db, 'users'));
      if (!usrSnap.empty) {
        const cloudUsers: User[] = [];
        usrSnap.forEach(d => cloudUsers.push(d.data() as User));
        setItem(STORAGE_KEYS.USERS, cloudUsers);
      }

      const stdSnap = await getDocs(collection(db, 'students'));
      if (!stdSnap.empty) {
        const cloudStudents: Student[] = [];
        stdSnap.forEach(d => cloudStudents.push(d.data() as Student));
        setItem(STORAGE_KEYS.STUDENTS, cloudStudents);
      }

      res = this.authenticate(identifier, passwordInput);
    } catch (err) {
      console.warn('[Auth] Remote check fallback warning:', err);
    }
    return res;
  },

  /**
   * Filter accessible students for privacy.
   * If user is 'wali', strictly returns only the student(s) belonging to this parent/student.
   * Other students are completely hidden for privacy.
   */
  getAccessibleStudents(user: User | null, customStudents?: Student[]): Student[] {
    const all = customStudents || this.getStudents();
    if (!user) return [];
    if (user.role !== 'wali') return all;

    const cleanPhone = user.phone ? user.phone.replace(/\D/g, '') : '';
    const cleanUsername = user.username ? user.username.trim().toLowerCase() : '';
    const cleanEmail = user.email ? user.email.trim().toLowerCase() : '';

    const matched = all.filter(s => {
      // 1. Direct match by studentId
      if (user.studentId && s.id === user.studentId) return true;
      // 2. Match by NIS or NISN
      if (cleanUsername && (s.nis?.toLowerCase() === cleanUsername || s.nisn === cleanUsername)) return true;
      // 3. Match by Parent Phone
      if (cleanPhone && s.parentPhone && s.parentPhone.replace(/\D/g, '') === cleanPhone) return true;
      // 4. Match by Parent Email
      if (cleanEmail && s.parentEmail && s.parentEmail.trim().toLowerCase() === cleanEmail) return true;
      return false;
    });

    if (matched.length > 0) return matched;

    // Fallback if not matched by attributes
    if (user.studentId) {
      const byId = all.find(s => s.id === user.studentId);
      if (byId) return [byId];
    }
    return all.length > 0 ? [all[0]] : [];
  },

  // Classes
  getClasses(): ClassItem[] {
    const deletedSet = getDeletedIdsSet();
    const list = getItem(STORAGE_KEYS.CLASSES, INITIAL_CLASSES).filter(
      c => c && c.id && !deletedSet.has(String(c.id))
    );
    // Sort classes naturally/alphabetically: 7A, 7B, 7C, 8A, 8B, 8C, 9A, 9B, etc.
    return [...list].sort((a, b) => 
      a.name.localeCompare(b.name, 'id', { numeric: true, sensitivity: 'base' })
    );
  },
  saveClass(cls: ClassItem): void {
    const deletedSet = getDeletedIdsSet();
    if (deletedSet.has(String(cls.id))) {
      deletedSet.delete(String(cls.id));
      try {
        localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(Array.from(deletedSet)));
      } catch (e) {
        console.error(e);
      }
    }
    const list = this.getClasses();
    const idx = list.findIndex(c => c.id === cls.id);
    if (idx >= 0) {
      list[idx] = cls;
    } else {
      list.push(cls);
    }
    setItem(STORAGE_KEYS.CLASSES, list);
    syncDocToCloud('classes', cls.id, cls);
    this.notifyListeners();
  },
  deleteClass(id: string): void {
    if (!id) return;
    const idStr = String(id).trim();
    markDeletedId(idStr);
    markDeletedId(id);
    const rawList = getItem<ClassItem[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const deletedSet = getDeletedIdsSet();
    const updatedList = (rawList || []).filter(
      c => c && c.id && String(c.id).trim() !== idStr && c.id !== id && !deletedSet.has(String(c.id).trim())
    );
    setItem(STORAGE_KEYS.CLASSES, updatedList);
    deleteDocFromCloud('classes', idStr);
    this.notifyListeners();
  },

  // Halaqah Groups (1 guru bisa 2 sampai 7 kelompok halaqah, input manual)
  getHalaqahGroups(): HalaqahGroup[] {
    const list = getItem<HalaqahGroup[]>(STORAGE_KEYS.HALAQAH_GROUPS, INITIAL_HALAQAH_GROUPS);
    let healed = false;
    const sanitized = list.map((g, index) => {
      const gId = g.id ? String(g.id).trim() : '';
      if (!gId || gId === 'undefined' || gId === 'null') {
        healed = true;
        return {
          ...g,
          id: `hlq-legacy-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`
        };
      }
      return g;
    });

    if (healed) {
      setItem(STORAGE_KEYS.HALAQAH_GROUPS, sanitized);
      syncCollectionToCloud('halaqah_groups', sanitized).catch(e => console.warn(e));
    }

    return [...sanitized].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'id', { numeric: true, sensitivity: 'base' })
    );
  },
  getHalaqahGroupsByTeacher(teacherId: string): HalaqahGroup[] {
    return this.getHalaqahGroups().filter(g => g.teacherId === teacherId);
  },
  saveHalaqahGroup(group: Partial<HalaqahGroup> & { name: string; teacherId: string }): HalaqahGroup {
    const list = this.getHalaqahGroups();
    const rawId = group.id ? String(group.id).trim() : '';
    const validId = (rawId && rawId !== 'undefined' && rawId !== 'null')
      ? rawId
      : `hlq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const teacher = this.getTeachers().find(t => t.id === group.teacherId);

    const resolvedGroup: HalaqahGroup = {
      id: validId,
      name: (group.name || '').trim(),
      teacherId: group.teacherId,
      teacherName: group.teacherName || teacher?.name || 'Ustadz / Ustadzah',
      description: (group.description || '').trim(),
      schedule: (group.schedule || 'Senin - Kamis, 07.00 - 08.15').trim(),
      room: (group.room || 'Masjid Utama Lt. 1').trim(),
      maxCapacity: Number(group.maxCapacity) || 12,
      studentIds: Array.isArray(group.studentIds) ? group.studentIds : [],
      createdAt: group.createdAt || new Date().toISOString()
    };

    const idx = list.findIndex(g => g.id === validId);
    if (idx >= 0) {
      list[idx] = resolvedGroup;
    } else {
      list.push(resolvedGroup);
    }
    setItem(STORAGE_KEYS.HALAQAH_GROUPS, list);
    
    // Immediate Cloud Sync & notification
    syncDocToCloud('halaqah_groups', resolvedGroup.id, resolvedGroup).catch(e =>
      console.warn('[Cloud Sync] Error syncing halaqah group:', e)
    );
    this.notifyListeners();
    return resolvedGroup;
  },
  deleteHalaqahGroup(id: string): void {
    markDeletedId(id);
    const list = this.getHalaqahGroups().filter(g => g.id !== id);
    setItem(STORAGE_KEYS.HALAQAH_GROUPS, list);
    deleteDocFromCloud('halaqah_groups', id);
    this.notifyListeners();

    // Unassign halaqah group reference from students
    const students = this.getStudents();
    let hasChanged = false;
    const updatedStudents = students.map(s => {
      if (s.halaqahGroupId === id) {
        hasChanged = true;
        return {
          ...s,
          halaqahGroupId: undefined,
          halaqahGroupName: undefined
        };
      }
      return s;
    });
    if (hasChanged) {
      setItem(STORAGE_KEYS.STUDENTS, updatedStudents);
      syncCollectionToCloud('students', updatedStudents);
    }
  },
  assignStudentsToHalaqahGroup(studentIds: string[], halaqahGroupId: string, teacherId?: string): void {
    const halaqah = this.getHalaqahGroups().find(h => h.id === halaqahGroupId);
    const resolvedTeacherId = teacherId || halaqah?.teacherId || '';
    const teacher = this.getTeachers().find(t => t.id === resolvedTeacherId);
    const students = this.getStudents();

    const updated = students.map(s => {
      if (studentIds.includes(s.id)) {
        return {
          ...s,
          teacherId: resolvedTeacherId || s.teacherId,
          halaqahGroupId,
          halaqahGroupName: halaqah?.name || s.halaqahGroupName
        };
      } else if (s.halaqahGroupId === halaqahGroupId) {
        // Was previously in this halaqah group and is now deselected
        return {
          ...s,
          halaqahGroupId: undefined,
          halaqahGroupName: undefined
        };
      }
      return s;
    });
    setItem(STORAGE_KEYS.STUDENTS, updated);
    syncCollectionToCloud('students', updated);

    // Also update halaqah group model studentIds list
    if (halaqah) {
      const updatedGroup: HalaqahGroup = {
        ...halaqah,
        teacherId: resolvedTeacherId || halaqah.teacherId,
        teacherName: teacher?.name || halaqah.teacherName,
        studentIds
      };
      this.saveHalaqahGroup(updatedGroup);
    }
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

    // Sync all halaqah groups for this teacher
    const halaqahs = this.getHalaqahGroups();
    let hlqChanged = false;
    const updatedHalaqahs = halaqahs.map(g => {
      if (g.teacherId === teacher.id && g.teacherName !== teacher.name) {
        hlqChanged = true;
        return { ...g, teacherName: teacher.name };
      }
      return g;
    });
    if (hlqChanged) {
      setItem(STORAGE_KEYS.HALAQAH_GROUPS, updatedHalaqahs);
      syncCollectionToCloud('halaqah_groups', updatedHalaqahs);
    }

    // Sync user accounts for this teacher
    const users = this.getUsers();
    let userChanged = false;
    const updatedUsers = users.map(u => {
      if (u.teacherId === teacher.id || (u.email && teacher.email && u.email.toLowerCase() === teacher.email.toLowerCase())) {
        userChanged = true;
        return {
          ...u,
          name: teacher.name,
          email: teacher.email || u.email,
          phone: teacher.phone || u.phone,
          avatar: teacher.photo || u.avatar,
          teacherId: teacher.id
        };
      }
      return u;
    });
    if (userChanged) {
      setItem(STORAGE_KEYS.USERS, updatedUsers);
      syncCollectionToCloud('users', updatedUsers);
    }

    // Sync currentUser if logged in as this teacher
    const curr = getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (curr && (curr.teacherId === teacher.id || (curr.email && teacher.email && curr.email.toLowerCase() === teacher.email.toLowerCase()))) {
      this.setCurrentUser({
        ...curr,
        name: teacher.name,
        email: teacher.email || curr.email,
        phone: teacher.phone || curr.phone,
        avatar: teacher.photo || curr.avatar,
        teacherId: teacher.id
      });
    }
  },
  deleteTeacher(id: string): void {
    markDeletedId(id);
    const list = this.getTeachers().filter(t => t.id !== id);
    setItem(STORAGE_KEYS.TEACHERS, list);
    deleteDocFromCloud('teachers', id);
    this.notifyListeners();
  },

  // Students
  getStudents(): Student[] {
    const list = getItem(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const classes = getItem(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
    const MIGRATION_KEY_7B_7E = 'tahfizh_smpia21_migrated_7b_7e_alkautsar3_v1';
    let needsInitial7Bto7EMigration = false;
    try {
      needsInitial7Bto7EMigration = localStorage.getItem(MIGRATION_KEY_7B_7E) !== 'true';
    } catch {
      needsInitial7Bto7EMigration = false;
    }

    let modified = false;
    const sanitized = list.map(s => {
      let updatedJilid = s.currentUmmiJilid;
      let updatedPage = s.currentUmmiPage;
      let updatedPhoto = s.photo;
      let updatedRaportTarget = s.raportTargetHafalan;
      let updatedTargetSuratAyat = s.targetSuratAyat;

      if (updatedPhoto && updatedPhoto.includes('unsplash')) {
        updatedPhoto = '';
        modified = true;
      }

      // Target Hafalan Term 1 Kelas 7B-7E = "Al-Kautsar : 3"
      if (isClass7Bto7E(s, classes)) {
        const currentTarget = (s.raportTargetHafalan || s.targetSuratAyat || '').trim();
        if (needsInitial7Bto7EMigration || !currentTarget || isLegacyDefaultRaportTarget(currentTarget)) {
          if (updatedRaportTarget !== 'Al-Kautsar : 3' || updatedTargetSuratAyat !== 'Al-Kautsar : 3') {
            updatedRaportTarget = 'Al-Kautsar : 3';
            updatedTargetSuratAyat = 'Al-Kautsar : 3';
            modified = true;
          }
        }
      }

      // Kebijakan Tahun Ajaran Ini:
      // Seluruh Kelas 8 dan 9 TIDAK mengikuti pembelajaran UMMI dan TIDAK masuk jilid Ummi.
      // Kelas 7 tetap tidak berubah.
      const isGrade89 = isGrade8or9Student(s, classes);
      if (isGrade89) {
        if (s.currentUmmiJilid !== '-' || (s.currentUmmiPage && s.currentUmmiPage > 0)) {
          updatedJilid = '-';
          updatedPage = 0;
          modified = true;
        }
      } else {
        // Kelas 7 atau lainnya yang mengikuti Ummi: normalisasi ejaan tanpa menimpa pilihan jilid manual
        if (s.currentUmmiJilid === 'Munaqasyah') { updatedJilid = 'Munaqosyah'; modified = true; }
        else if (s.currentUmmiJilid === 'Tahfidz') { updatedJilid = 'Tahfizh'; modified = true; }
        else if (s.currentUmmiJilid && (s.currentUmmiJilid.startsWith('08') || ['M.Si', 'M.H', 'MAP', 'S.Kom.', 'SE', 'ST'].includes(s.currentUmmiJilid))) {
          let phone = s.parentPhone;
          if (s.currentUmmiJilid.startsWith('08')) {
            phone = s.currentUmmiJilid;
          }
          updatedJilid = 'Tahfizh';
          updatedPage = 1;
          modified = true;
          return {
            ...s,
            currentUmmiJilid: updatedJilid,
            currentUmmiPage: updatedPage,
            raportTargetHafalan: updatedRaportTarget,
            targetSuratAyat: updatedTargetSuratAyat,
            parentPhone: phone,
            photo: updatedPhoto || ''
          };
        }
      }

      if (
        updatedJilid !== s.currentUmmiJilid ||
        updatedPage !== s.currentUmmiPage ||
        updatedPhoto !== s.photo ||
        updatedRaportTarget !== s.raportTargetHafalan ||
        updatedTargetSuratAyat !== s.targetSuratAyat
      ) {
        modified = true;
        return { 
          ...s, 
          currentUmmiJilid: updatedJilid, 
          currentUmmiPage: updatedPage !== undefined ? updatedPage : (isGrade89 ? 0 : 1), 
          raportTargetHafalan: updatedRaportTarget,
          targetSuratAyat: updatedTargetSuratAyat,
          photo: updatedPhoto || '' 
        };
      }
      return s;
    });
    if (needsInitial7Bto7EMigration) {
      try {
        localStorage.setItem(MIGRATION_KEY_7B_7E, 'true');
      } catch {
        // Ignore storage error
      }
    }
    if (modified) {
      setItem(STORAGE_KEYS.STUDENTS, sanitized);
    }
    // Urutkan seluruh santri berdasarkan abjad nama A-Z
    return [...sanitized].sort((a, b) =>
      a.name.localeCompare(b.name, 'id', { sensitivity: 'base' })
    );
  },
  applyTargetHafalan7Bto7E(targetText: string = 'Al-Kautsar : 3'): number {
    const classes = this.getClasses();
    const list = this.getStudents();
    let count = 0;
    const updated = list.map(s => {
      if (isClass7Bto7E(s, classes)) {
        count++;
        return {
          ...s,
          raportTargetHafalan: targetText,
          targetSuratAyat: targetText,
          _updatedAt: Date.now()
        };
      }
      return s;
    });
    if (count > 0) {
      setItem(STORAGE_KEYS.STUDENTS, updated);
      syncCollectionToCloud('students', updated.filter(s => isClass7Bto7E(s, classes))).catch(() => {});
      this.notifyListeners();
    }
    return count;
  },
  saveStudentsBulk(studentsToUpdate: Student[]): void {
    if (!studentsToUpdate || studentsToUpdate.length === 0) return;
    const list = this.getStudents();
    const now = Date.now();
    const updateMap = new Map<string, Student>();
    studentsToUpdate.forEach(s => {
      updateMap.set(s.id, { ...s, _updatedAt: now } as Student);
    });
    const merged = list.map(s => updateMap.get(s.id) || s);
    setItem(STORAGE_KEYS.STUDENTS, merged);
    syncCollectionToCloud('students', Array.from(updateMap.values())).catch(e =>
      console.warn('[Cloud Sync] Failed bulk syncing students to cloud:', e)
    );
    this.notifyListeners();
  },
  getStudentById(id: string): Student | undefined {
    return this.getStudents().find(s => s.id === id);
  },
  saveStudent(student: Student): void {
    const list = this.getStudents();
    const classes = this.getClasses();
    const now = Date.now();
    const prevStudent = list.find(s => s.id === student.id);

    const parseCapaian = (raw?: string): { jilid?: string; page?: number } => {
      if (!raw || !raw.trim()) return {};
      const text = raw.trim();
      const jilidPatterns: Array<{ regex: RegExp; canonical: string }> = [
        { regex: /\bpra[\s-]*tk\b/i, canonical: 'Pra-TK' },
        { regex: /\bjilid\s*1\b/i, canonical: 'Jilid 1' },
        { regex: /\bjilid\s*2\b/i, canonical: 'Jilid 2' },
        { regex: /\bjilid\s*3\b/i, canonical: 'Jilid 3' },
        { regex: /\bjilid\s*4\b/i, canonical: 'Jilid 4' },
        { regex: /\bjilid\s*5\b/i, canonical: 'Jilid 5' },
        { regex: /\bjilid\s*6\b/i, canonical: 'Jilid 6' },
        { regex: /\bal[\s-]*qur['’`]?an\b/i, canonical: "Al-Qur'an" },
        { regex: /\bgharib\b/i, canonical: 'Gharib' },
        { regex: /\btajwid\b/i, canonical: 'Tajwid' },
        { regex: /\bturjuman\b/i, canonical: 'Turjuman' },
        { regex: /\btahfi[dz]h?\b/i, canonical: 'Tahfizh' },
        { regex: /\bmunaq[ao]syah\b/i, canonical: 'Munaqosyah' }
      ];
      let matchedJilid: string | undefined;
      for (const p of jilidPatterns) {
        if (p.regex.test(text)) {
          matchedJilid = p.canonical;
          break;
        }
      }
      const pageMatch = text.match(/(?:halaman|hal\.?)\s*(\d+)/i) || text.match(/\b(?:jilid\s*\d+|al[\s-]*qur['’`]?an|gharib|tajwid|turjuman|tahfi[dz]h?|munaq[ao]syah)\s+(\d+)\b/i);
      const matchedPage = pageMatch ? parseInt(pageMatch[1], 10) : undefined;
      return { jilid: matchedJilid, page: matchedPage && matchedPage > 0 ? matchedPage : undefined };
    };
    
    // Pastikan jika santri kelas 8 atau 9 tidak masuk jilid Ummi
    let sanitizedStudent: Student & { _updatedAt?: number } = { 
      ...student,
      _updatedAt: now
    };
    if (isGrade8or9Student(student, classes)) {
      sanitizedStudent.currentUmmiJilid = '-';
      sanitizedStudent.currentUmmiPage = 0;
    } else {
      const jilidOrPageChanged = !prevStudent || 
        prevStudent.currentUmmiJilid !== sanitizedStudent.currentUmmiJilid || 
        prevStudent.currentUmmiPage !== sanitizedStudent.currentUmmiPage;
      const raportCapaianChanged = Boolean(prevStudent && prevStudent.raportUmmiCapaian !== sanitizedStudent.raportUmmiCapaian);

      if (raportCapaianChanged && !jilidOrPageChanged) {
        const parsed = parseCapaian(sanitizedStudent.raportUmmiCapaian);
        if (parsed.jilid) {
          sanitizedStudent.currentUmmiJilid = parsed.jilid;
        }
        if (parsed.page) {
          sanitizedStudent.currentUmmiPage = parsed.page;
        }
      } else if (sanitizedStudent.currentUmmiJilid && sanitizedStudent.currentUmmiJilid !== '-') {
        const parsedFromCapaian = parseCapaian(sanitizedStudent.raportUmmiCapaian);
        if (jilidOrPageChanged || !sanitizedStudent.raportUmmiCapaian || (parsedFromCapaian.jilid && parsedFromCapaian.jilid !== sanitizedStudent.currentUmmiJilid)) {
          sanitizedStudent.raportUmmiCapaian = `${sanitizedStudent.currentUmmiJilid} halaman ${sanitizedStudent.currentUmmiPage || 1}`;
        }
      }

      if (sanitizedStudent.currentUmmiJilid && sanitizedStudent.currentUmmiJilid !== '-') {
        // Sinkronkan juga ke record Ummi santri ini agar di semua menu (Data Santri, Metode Ummi, Raport) 100% sinkron
        const ummiList = getItem<UmmiRecord[]>(STORAGE_KEYS.UMMI, INITIAL_UMMI_RECORDS);
        const matchingIndices: number[] = [];
        ummiList.forEach((r, i) => {
          if (!r) return;
          const matchId = r.studentId === sanitizedStudent.id || (sanitizedStudent.nis && r.studentId === sanitizedStudent.nis);
          const matchName = sanitizedStudent.name && (r as any).studentName && 
            (r as any).studentName.toLowerCase().trim() === sanitizedStudent.name.toLowerCase().trim();
          if (matchId || matchName) {
            matchingIndices.push(i);
          }
        });

        if (matchingIndices.length > 0) {
          matchingIndices.sort((iA, iB) => compareRecordsDesc(ummiList[iA], ummiList[iB]));
          const latestIdx = matchingIndices[0];
          const latestDate = ummiList[latestIdx].date;
          let ummiModified = false;

          matchingIndices.forEach((idxToCheck, pos) => {
            const rec = ummiList[idxToCheck];
            const isTopOrSameLatestDate = pos === 0 || rec.date === latestDate;
            if (isTopOrSameLatestDate) {
              if (
                rec.jilid !== sanitizedStudent.currentUmmiJilid ||
                rec.page !== (sanitizedStudent.currentUmmiPage || 1) ||
                rec.studentId !== sanitizedStudent.id
              ) {
                const updatedRec: UmmiRecord & { _updatedAt?: number } = {
                  ...rec,
                  studentId: sanitizedStudent.id,
                  jilid: sanitizedStudent.currentUmmiJilid,
                  page: sanitizedStudent.currentUmmiPage || 1,
                  _updatedAt: now
                };
                ummiList[idxToCheck] = updatedRec;
                ummiModified = true;
                syncDocToCloud('ummi_records', updatedRec.id, updatedRec);
              }
            } else if (rec.studentId !== sanitizedStudent.id) {
              const normalizedRec: UmmiRecord = {
                ...rec,
                studentId: sanitizedStudent.id
              };
              ummiList[idxToCheck] = normalizedRec;
              ummiModified = true;
              syncDocToCloud('ummi_records', normalizedRec.id, normalizedRec);
            }
          });

          if (ummiModified) {
            ummiList.sort(compareRecordsDesc);
            setItem(STORAGE_KEYS.UMMI, ummiList);
          }
        } else if (jilidOrPageChanged || raportCapaianChanged) {
          // Jika santri belum punya record di ummi_records sama sekali, buat record sinkronisasi agar tampil konsisten di Metode Ummi
          const newSyncRec: UmmiRecord & { _updatedAt?: number } = {
            id: `ummi-sync-${sanitizedStudent.id}`,
            studentId: sanitizedStudent.id,
            teacherId: sanitizedStudent.teacherId || 't-1',
            date: new Date().toISOString().split('T')[0],
            jilid: sanitizedStudent.currentUmmiJilid as any,
            page: sanitizedStudent.currentUmmiPage || 1,
            materialName: `${sanitizedStudent.currentUmmiJilid} Hal. ${sanitizedStudent.currentUmmiPage || 1}`,
            score: 86,
            status: 'Lulus',
            notes: 'Alhamdulillah lancar dan sesuai kaidah.',
            _updatedAt: now
          };
          ummiList.unshift(newSyncRec);
          setItem(STORAGE_KEYS.UMMI, ummiList);
          syncDocToCloud('ummi_records', newSyncRec.id, newSyncRec);
        }
      }
    }

    const idx = list.findIndex(s => s.id === sanitizedStudent.id);
    if (idx >= 0) {
      list[idx] = sanitizedStudent;
    } else {
      list.unshift(sanitizedStudent);
    }
    setItem(STORAGE_KEYS.STUDENTS, list);
    syncDocToCloud('students', sanitizedStudent.id, sanitizedStudent);
    this.notifyListeners();
  },
  deleteStudent(id: string): void {
    const list = this.getStudents().filter(s => s.id !== id);
    setItem(STORAGE_KEYS.STUDENTS, list);
    deleteDocFromCloud('students', id);
    this.notifyListeners();
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
        photo: '',
        entryYear: '2026',
        currentUmmiJilid: (() => {
          const raw = (cols[ummiJilidIdx] || '').trim();
          if (!raw) return 'Jilid 1';
          const l = raw.toLowerCase();
          if (l === 'munaqasyah' || l === 'munaqosyah') return 'Munaqosyah';
          if (l === 'tahfidz' || l === 'tahfizh') return 'Tahfizh';
          return raw;
        })(),
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

  // Generate CSV template for student import
  generateStudentCSVTemplate(): string {
    const headers = ['nis', 'nisn', 'name', 'nickname', 'gender', 'class', 'program', 'target', 'parentName', 'parentPhone', 'ummiJilid'];
    const sampleRows = [
      '2026001,0198273645,Ahmad Fauzan Pratama,Fauzan,L,7A,Tahfizh Unggulan,4.0,Bambang Pratama,081234567890,Jilid 2',
      '2026002,0198273646,Siti Aisyah Rahma,Aisyah,P,7B,Takhassus 30 Juz,6.0,Hendra Gunawan,081298765432,Jilid 3'
    ];
    return [headers.join(','), ...sampleRows].join('\n');
  },

  // Export all students to CSV
  exportStudentsToCSV(): string {
    const students = this.getStudents();
    const classes = this.getClasses();
    const teachers = this.getTeachers();

    const headers = ['NIS', 'NISN', 'Nama Lengkap', 'Panggilan', 'Gender', 'Kelas', 'Guru Pembimbing', 'Program', 'Target Juz', 'Juz Hafal', 'Surah Hafal', 'Ayat Hafal', 'Jilid Ummi', 'Halaman Ummi', 'Nama Wali', 'No HP Wali'];
    const rows = students.map(s => {
      const cls = classes.find(c => c.id === s.classId)?.name || '-';
      const tch = teachers.find(t => t.id === s.teacherId)?.name || '-';
      return [
        `"${s.nis}"`,
        `"${s.nisn || '-'}"`,
        `"${s.name}"`,
        `"${s.nickname || '-'}"`,
        `"${s.gender}"`,
        `"${cls}"`,
        `"${tch}"`,
        `"${s.program}"`,
        s.targetJuz,
        s.totalJuzHafal,
        s.totalSurahHafal,
        s.totalAyahHafal,
        `"${s.currentUmmiJilid || '-'}"`,
        s.currentUmmiPage || 1,
        `"${s.parentName || '-'}"`,
        `"${s.parentPhone || '-'}"`
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  },

  // Export all memorization records to CSV
  exportHafalanToCSV(): string {
    const records = this.getMemorizationRecords();
    const students = this.getStudents();
    const teachers = this.getTeachers();
    const classes = this.getClasses();

    const headers = ['Tanggal', 'NIS', 'Nama Santri', 'Kelas', 'Guru Pengampu', 'Jenis Setoran', 'Juz', 'Surah', 'Ayat Mulai', 'Ayat Selesai', 'Total Ayat', 'Nilai Kelancaran', 'Nilai Tajwid', 'Nilai Makhraj', 'Nilai Fashahah', 'Nilai Adab', 'Nilai Akhir', 'Kategori', 'Catatan'];
    const rows = records.map(r => {
      const std = students.find(s => s.id === r.studentId);
      const cls = classes.find(c => c.id === std?.classId)?.name || '-';
      const tch = teachers.find(t => t.id === r.teacherId)?.name || '-';
      return [
        `"${r.date || '-'}"`,
        `"${std?.nis || '-'}"`,
        `"${std?.name || '-'}"`,
        `"${cls}"`,
        `"${tch}"`,
        `"${r.type || 'Hafalan Baru'}"`,
        r.juz || 30,
        `"${r.surahName || '-'}"`,
        r.startAyah || 1,
        r.endAyah || 1,
        r.totalAyah || 1,
        r.scores?.kelancaran ?? r.finalScore ?? 0,
        r.scores?.tajwid ?? r.finalScore ?? 0,
        r.scores?.makhraj ?? r.finalScore ?? 0,
        r.scores?.fashahah ?? r.finalScore ?? 0,
        r.scores?.adab ?? r.finalScore ?? 0,
        r.finalScore ?? 0,
        `"${r.category || '-'}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });
    return '\uFEFF' + [headers.join(','), ...rows].join('\n');
  },

  // Export all Ummi records to CSV
  exportUmmiToCSV(): string {
    const records = this.getUmmiRecords();
    const students = this.getStudents();
    const teachers = this.getTeachers();
    const classes = this.getClasses();

    const headers = ['Tanggal', 'NIS', 'Nama Santri', 'Kelas', 'Guru Pengampu', 'Jilid Ummi', 'Halaman', 'Materi Pokok', 'Nilai Angka', 'Nilai Huruf', 'Status Kelulusan', 'Catatan'];
    const rows = records.map(r => {
      const std = students.find(s => s.id === r.studentId);
      const cls = classes.find(c => c.id === std?.classId)?.name || '-';
      const tch = teachers.find(t => t.id === r.teacherId)?.name || '-';
      const gradeLetter = getGradeFromScore(r.score || 85).letter;
      return [
        `"${r.date || '-'}"`,
        `"${std?.nis || '-'}"`,
        `"${std?.name || '-'}"`,
        `"${cls}"`,
        `"${tch}"`,
        `"${r.jilid || '-'}"`,
        r.page || 1,
        `"${(r.materialName || '-').replace(/"/g, '""')}"`,
        r.score || 0,
        `"${gradeLetter}"`,
        `"${r.status || 'Lulus'}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });
    return '\uFEFF' + [headers.join(','), ...rows].join('\n');
  },

  // Memorization Records
  getMemorizationRecords(): MemorizationRecord[] {
    const deletedSet = getDeletedIdsSet();
    return getItem(STORAGE_KEYS.MEMORIZATION, INITIAL_MEMORIZATION_RECORDS).filter(
      r => r && r.id && !deletedSet.has(String(r.id))
    );
  },
  addMemorizationRecord(record: MemorizationRecord): void {
    const list = this.getMemorizationRecords();
    list.unshift(record);
    setItem(STORAGE_KEYS.MEMORIZATION, list);
    syncDocToCloud('memorization_records', record.id, record);

    // Update Student stats
    this.recalculateStudentMemorizationStats(record.studentId, record);
    this.notifyListeners();
  },
  updateMemorizationRecord(record: MemorizationRecord): void {
    const list = this.getMemorizationRecords();
    const idx = list.findIndex(r => r.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    setItem(STORAGE_KEYS.MEMORIZATION, list);
    syncDocToCloud('memorization_records', record.id, record);

    // Recalculate stats for this student
    this.recalculateStudentMemorizationStats(record.studentId);
    this.notifyListeners();
  },
  deleteMemorizationRecord(id: string): void {
    markDeletedId(id);
    const list = this.getMemorizationRecords();
    const record = list.find(r => r.id === id);
    const studentId = record?.studentId;

    const filtered = list.filter(r => r.id !== id);
    setItem(STORAGE_KEYS.MEMORIZATION, filtered);
    deleteDocFromCloud('memorization_records', id);

    if (studentId) {
      this.recalculateStudentMemorizationStats(studentId);
    }
    this.notifyListeners();
  },

  recalculateStudentMemorizationStats(studentId: string, latestRecordForNotif?: MemorizationRecord): void {
    const student = this.getStudentById(studentId);
    if (!student) return;

    const allRecords = this.getMemorizationRecords();
    const studentRecords = allRecords
      .filter(r => r.studentId === student.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (studentRecords.length === 0) {
      const updatedStudent: Student = {
        ...student,
        totalAyahHafal: 0,
        totalSurahHafal: 0,
        totalJuzHafal: 0,
        lastHafalan: '-',
        lastHafalanDate: '-',
        avgScore: 0
      };
      this.saveStudent(updatedStudent);
      return;
    }

    const totalScore = studentRecords.reduce((acc, r) => acc + r.finalScore, 0);
    const avgScore = Math.round(totalScore / studentRecords.length);
    const totalAyahs = studentRecords.reduce((acc, r) => acc + r.totalAyah, 0);
    const uniqueSurahs = new Set(studentRecords.map(r => r.surahNumber)).size;
    const approxJuz = Number(Math.min(30, (totalAyahs / 200)).toFixed(1));
    const latestRec = studentRecords[0];
    const lastSurahText = rEndSurah(latestRec);

    const updatedStudent: Student = {
      ...student,
      totalAyahHafal: totalAyahs,
      totalSurahHafal: Math.max(student.totalSurahHafal, uniqueSurahs),
      totalJuzHafal: Math.max(student.totalJuzHafal, approxJuz),
      lastHafalan: lastSurahText,
      lastHafalanDate: latestRec.date,
      avgScore: avgScore
    };
    this.saveStudent(updatedStudent);
    this.updateStudentTargetProgress(student.id, updatedStudent.totalJuzHafal);

    if (latestRecordForNotif) {
      this.addNotification({
        id: 'notif-' + Date.now(),
        title: `Setoran ${latestRecordForNotif.type}: ${student.name}`,
        message: `Ananda ${student.nickname || student.name} berhasil menyetorkan ${lastSurahText} dengan nilai ${latestRecordForNotif.finalScore} (${latestRecordForNotif.category}).`,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        type: latestRecordForNotif.finalScore >= 80 ? 'success' : 'warning',
        read: false,
        studentId: student.id
      });
    }
  },

  // Ummi Records
  getUmmiRecords(): UmmiRecord[] {
    const deletedSet = getDeletedIdsSet();
    const list = getItem(STORAGE_KEYS.UMMI, INITIAL_UMMI_RECORDS).filter(
      r => r && r.id && !deletedSet.has(String(r.id))
    );
    let modified = false;
    const sanitized = list.map(r => {
      let updatedJilid = r.jilid;
      if (r.jilid === 'Munaqasyah') updatedJilid = 'Munaqosyah';
      else if (r.jilid === 'Tahfidz') updatedJilid = 'Tahfizh';
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
    const now = Date.now();
    const allStudents = this.getStudents();
    const student = allStudents.find(s => 
      s.id === record.studentId || 
      (s.nis && s.nis === record.studentId) ||
      (s.name && (record as any).studentName && s.name.toLowerCase().trim() === (record as any).studentName.toLowerCase().trim()) ||
      (s.name.toLowerCase().includes('afiya') && (record.studentId?.includes('1788551716146') || ((record as any).studentName || '').toLowerCase().includes('afiya')))
    ) || this.getStudentById(record.studentId);

    const stampedRecord: UmmiRecord & { _updatedAt?: number } = {
      ...record,
      studentId: student ? student.id : record.studentId,
      _updatedAt: now
    };
    const list = this.getUmmiRecords();
    list.unshift(stampedRecord);
    list.sort(compareRecordsDesc);
    setItem(STORAGE_KEYS.UMMI, list);
    syncDocToCloud('ummi_records', stampedRecord.id, stampedRecord);

    if (student) {
      const classes = this.getClasses();
      if (!isGrade8or9Student(student, classes)) {
        const gradeLetter = getGradeFromScore(stampedRecord.score).letter;
        const updatedStudent: Student = {
          ...student,
          currentUmmiJilid: stampedRecord.jilid,
          currentUmmiPage: stampedRecord.page,
          raportUmmiCapaian: `${stampedRecord.jilid} halaman ${stampedRecord.page}`,
          raportUmmiNilai: gradeLetter
        };
        this.saveStudent(updatedStudent);
      }
    }
    this.notifyListeners();
  },
  updateUmmiRecord(record: UmmiRecord): void {
    const now = Date.now();
    const allStudents = this.getStudents();
    const student = allStudents.find(s => 
      s.id === record.studentId || 
      (s.nis && s.nis === record.studentId) ||
      (s.name && (record as any).studentName && s.name.toLowerCase().trim() === (record as any).studentName.toLowerCase().trim()) ||
      (s.name.toLowerCase().includes('afiya') && (record.studentId?.includes('1788551716146') || ((record as any).studentName || '').toLowerCase().includes('afiya')))
    ) || this.getStudentById(record.studentId);

    const stampedRecord: UmmiRecord & { _updatedAt?: number } = {
      ...record,
      studentId: student ? student.id : record.studentId,
      _updatedAt: now
    };
    const list = this.getUmmiRecords();
    const idx = list.findIndex(r => r.id === stampedRecord.id);
    if (idx >= 0) {
      list[idx] = stampedRecord;
    } else {
      list.unshift(stampedRecord);
    }
    list.sort(compareRecordsDesc);
    setItem(STORAGE_KEYS.UMMI, list);
    syncDocToCloud('ummi_records', stampedRecord.id, stampedRecord);

    if (student) {
      const classes = this.getClasses();
      if (!isGrade8or9Student(student, classes)) {
        const gradeLetter = getGradeFromScore(stampedRecord.score).letter;
        this.saveStudent({
          ...student,
          currentUmmiJilid: stampedRecord.jilid,
          currentUmmiPage: stampedRecord.page,
          raportUmmiCapaian: `${stampedRecord.jilid} halaman ${stampedRecord.page}`,
          raportUmmiNilai: gradeLetter
        });
      }
    }
    this.notifyListeners();
  },
  deleteUmmiRecord(id: string): void {
    markDeletedId(id);
    const list = this.getUmmiRecords();
    const record = list.find(r => r.id === id);
    const studentId = record?.studentId;

    const filtered = list.filter(r => r.id !== id);
    setItem(STORAGE_KEYS.UMMI, filtered);
    deleteDocFromCloud('ummi_records', id);

    if (studentId) {
      const allStudents = this.getStudents();
      const student = allStudents.find(s => s.id === studentId || s.nis === studentId) || this.getStudentById(studentId);
      if (student) {
        const remaining = filtered
          .filter(r => r.studentId === student.id || r.studentId === student.nis)
          .sort(compareRecordsDesc);
        if (remaining.length > 0) {
          this.saveStudent({
            ...student,
            currentUmmiJilid: remaining[0].jilid,
            currentUmmiPage: remaining[0].page,
            raportUmmiCapaian: `${remaining[0].jilid} halaman ${remaining[0].page}`
          });
        } else {
          this.saveStudent({
            ...student,
            currentUmmiJilid: 'Jilid 1',
            currentUmmiPage: 1,
            raportUmmiCapaian: 'Jilid 1 halaman 1'
          });
        }
      }
    }
    this.notifyListeners();
  },

  // Attendance / Presensi (Hadir, Sakit, Izin, Alfa)
  getAttendanceRecords(): AttendanceRecord[] {
    return getItem(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE_RECORDS);
  },
  addAttendanceRecord(record: AttendanceRecord): void {
    const list = this.getAttendanceRecords();
    list.unshift(record);
    setItem(STORAGE_KEYS.ATTENDANCE, list);
    syncDocToCloud('attendance_records', record.id, record);
    this.notifyListeners();
  },
  updateAttendanceRecord(record: AttendanceRecord): void {
    const list = this.getAttendanceRecords();
    const idx = list.findIndex(r => r.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    setItem(STORAGE_KEYS.ATTENDANCE, list);
    syncDocToCloud('attendance_records', record.id, record);
    this.notifyListeners();
  },
  deleteAttendanceRecord(id: string): void {
    const list = this.getAttendanceRecords().filter(r => r.id !== id);
    setItem(STORAGE_KEYS.ATTENDANCE, list);
    deleteDocFromCloud('attendance_records', id);
    this.notifyListeners();
  },
  getAttendanceByStudent(studentId: string): AttendanceRecord[] {
    return this.getAttendanceRecords().filter(r => r.studentId === studentId);
  },
  getAttendanceCounts(studentId: string): { sakit: number; izin: number; alfa: number; hadir: number } {
    const records = this.getAttendanceByStudent(studentId);
    let sakit = 0;
    let izin = 0;
    let alfa = 0;
    let hadir = 0;
    records.forEach(r => {
      if (r.status === 'Sakit') sakit++;
      else if (r.status === 'Izin') izin++;
      else if (r.status === 'Alfa') alfa++;
      else if (r.status === 'Hadir') hadir++;
    });
    return { sakit, izin, alfa, hadir };
  },

  // Targets & Capaian (Hafalan & Ummi per Term / Tahunan)
  getTargets(): TargetProgress[] {
    return getItem(STORAGE_KEYS.TARGETS, INITIAL_TARGETS);
  },
  saveTarget(target: TargetProgress): void {
    const targets = this.getTargets();
    const idx = targets.findIndex(t => 
      t.id === target.id || 
      (t.studentId === target.studentId && 
       t.targetType === target.targetType && 
       (t.term || '') === (target.term || '') && 
       (t.category || 'Hafalan') === (target.category || 'Hafalan'))
    );
    const enrichedTarget: TargetProgress = {
      ...target,
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) {
      targets[idx] = enrichedTarget;
    } else {
      targets.push(enrichedTarget);
    }
    setItem(STORAGE_KEYS.TARGETS, targets);
    syncDocToCloud('targets', enrichedTarget.id, enrichedTarget);
    this.notifyListeners();
  },
  saveTargetsBulk(newTargets: TargetProgress[]): void {
    const targets = this.getTargets();
    const targetMap = new Map<string, TargetProgress>();
    
    for (const t of targets) {
      targetMap.set(t.id, t);
      const key = `${t.studentId}_${t.targetType}_${t.term || ''}_${t.category || 'Hafalan'}`;
      targetMap.set(key, t);
    }

    const itemsToCloud: TargetProgress[] = [];
    for (const item of newTargets) {
      const key = `${item.studentId}_${item.targetType}_${item.term || ''}_${item.category || 'Hafalan'}`;
      const existing = targetMap.get(item.id) || targetMap.get(key);
      const enriched: TargetProgress = {
        ...(existing || {}),
        ...item,
        updatedAt: new Date().toISOString()
      };
      if (existing) {
        Object.assign(existing, enriched);
      } else {
        targets.push(enriched);
        targetMap.set(item.id, enriched);
        targetMap.set(key, enriched);
      }
      itemsToCloud.push(enriched);
    }

    setItem(STORAGE_KEYS.TARGETS, targets);
    syncCollectionToCloud('targets', itemsToCloud).catch(e =>
      console.warn('[Cloud Sync] Failed bulk syncing targets to cloud:', e)
    );
    this.notifyListeners();
  },
  deleteTarget(id: string): void {
    const list = this.getTargets().filter(t => t.id !== id);
    setItem(STORAGE_KEYS.TARGETS, list);
    deleteDocFromCloud('targets', id);
    this.notifyListeners();
  },
  updateStudentTargetProgress(studentId: string, currentJuz: number): void {
    const targets = this.getTargets();
    let hasChanges = false;
    targets.forEach(t => {
      if (t.studentId === studentId && (t.category === 'Hafalan' || !t.category)) {
        t.achievedJuz = currentJuz;
        t.currentAchievement = currentJuz;
        t.remainingJuz = Math.max(0, Number(((t.targetJuz || 0) - currentJuz).toFixed(1)));
        t.percentage = Math.min(100, Math.round((currentJuz / (t.targetJuz || 1)) * 100));
        t.status = t.percentage >= 70 ? 'on-track' : t.percentage >= 40 ? 'needs-attention' : 'behind';
        t.updatedAt = new Date().toISOString();
        hasChanges = true;
        syncDocToCloud('targets', t.id, t);
      }
    });
    if (hasChanges) {
      setItem(STORAGE_KEYS.TARGETS, targets);
      this.notifyListeners();
    }
  },
  generateDefaultTermTargets(): { count: number; message: string } {
    const students = this.getStudents();
    const classes = this.getClasses();
    const classMap = new Map<string, ClassItem>();
    classes.forEach(c => classMap.set(c.id, c));

    const terms: TermName[] = ['Term 1', 'Term 2', 'Term 3', 'Term 4'];
    const generated: TargetProgress[] = [];

    for (const std of students) {
      const cls = classMap.get(std.classId);
      const isLevel7 = cls ? cls.level === 7 : (std.entryYear === '2026' || (std.nis || '').startsWith('4321-26'));

      // 1. Target Hafalan untuk 4 Term (Semua Jenjang)
      for (const term of terms) {
        const stdHafalan = getStudentStandardTermTarget(std, term, 'Hafalan');
        const evalHafalan = evaluateHafalanTerm(std.totalJuzHafal || 0, stdHafalan.targetNumber);
        
        generated.push({
          id: `tgt-hfl-${std.id}-${term.toLowerCase().replace(' ', '')}`,
          studentId: std.id,
          category: 'Hafalan',
          targetType: 'Term',
          term,
          academicYear: '2026/2027',
          period: `${term} (${term === 'Term 1' ? 'Juli - Sep' : term === 'Term 2' ? 'Okt - Des' : term === 'Term 3' ? 'Jan - Mar' : 'Apr - Jun'} 2026)`,
          targetJuz: stdHafalan.targetNumber,
          achievedJuz: std.totalJuzHafal || 0,
          currentAchievement: std.totalJuzHafal || 0,
          remainingJuz: evalHafalan.remainingJuz,
          percentage: evalHafalan.percentage,
          status: evalHafalan.status,
          deadline: stdHafalan.deadline,
          notes: stdHafalan.notes
        });
      }

      // 2. Target UMMI untuk 4 Term (Khusus Siswa Level 7 / yang mengikuti pembelajaran Ummi)
      if (isUmmiEnrolledStudent(std, classes)) {
        for (const term of terms) {
          const stdUmmi = getStudentStandardTermTarget(std, term, 'Ummi');
          const evalUmmi = evaluateUmmiTerm(
            std.currentUmmiJilid || 'Jilid 1',
            std.currentUmmiPage || 1,
            stdUmmi.targetJilid || 'Jilid 1',
            stdUmmi.targetPage || 40
          );

          generated.push({
            id: `tgt-ummi-${std.id}-${term.toLowerCase().replace(' ', '')}`,
            studentId: std.id,
            category: 'Ummi',
            targetType: 'Term',
            term,
            academicYear: '2026/2027',
            period: `${term} (${term === 'Term 1' ? 'Juli - Sep' : term === 'Term 2' ? 'Okt - Des' : term === 'Term 3' ? 'Jan - Mar' : 'Apr - Jun'} 2026)`,
            targetJuz: 0,
            targetUmmiJilid: stdUmmi.targetJilid,
            targetUmmiPage: stdUmmi.targetPage,
            achievedUmmiJilid: std.currentUmmiJilid || 'Jilid 1',
            achievedUmmiPage: std.currentUmmiPage || 1,
            remainingJuz: 0,
            percentage: evalUmmi.percentage,
            status: evalUmmi.status,
            ummiStatus: evalUmmi.status,
            ummiPercentage: evalUmmi.percentage,
            deadline: stdUmmi.deadline,
            notes: `${stdUmmi.notes} (${evalUmmi.summary})`
          });
        }
      }
    }

    this.saveTargetsBulk(generated);
    return {
      count: generated.length,
      message: `Berhasil membuat & menyinkronkan ${generated.length} target term (Hafalan & Ummi) untuk ${students.length} santri!`
    };
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

  // Kalender Pendidikan (Kaldik) & Program Semester (Prosem)
  getKaldikData(category: 'tahfizh' | 'reguler' = 'tahfizh'): KaldikData {
    const defaultData = category === 'reguler' ? INITIAL_KALDIK_REGULER_DATA : INITIAL_KALDIK_DATA;
    const rawData = category === 'reguler'
      ? getItem<KaldikData>(STORAGE_KEYS.KALDIK_REGULER, defaultData)
      : getItem<KaldikData>(STORAGE_KEYS.KALDIK, defaultData);

    const settings = this.getSettings();
    const correctHeadmasterName = settings.headmasterName || 'Muh Saifuddin, S.Si.';
    const correctCoordinatorName = settings.tahfizhCoordinator || 'Ustadz Muhammad Yusrie Alfian, S.Ag.';
    let modified = false;

    // Synchronize headmaster signature
    if (
      !rawData.signHeadmasterName ||
      rawData.signHeadmasterName.includes('Djauhari') ||
      rawData.signHeadmasterName.includes('Ridwan')
    ) {
      rawData.signHeadmasterName = correctHeadmasterName;
      modified = true;
    }
    if (!rawData.signHeadmasterTitle) {
      rawData.signHeadmasterTitle = 'Kepala SMP Islam Al Azhar 21';
      modified = true;
    }

    // Synchronize Koordinator Tahfizh signature
    if (
      !rawData.signRoleTitle ||
      rawData.signRoleTitle === "Koordinator Al Qur'an" ||
      rawData.signRoleTitle === 'Waka Kurikulum'
    ) {
      rawData.signRoleTitle = 'Koordinator Tahfizh';
      modified = true;
    }
    if (
      !rawData.signCoordinatorName ||
      rawData.signCoordinatorName.includes('Sri Lestari') ||
      rawData.signCoordinatorName.includes('Yusrie Alfian, S.Ag)')
    ) {
      rawData.signCoordinatorName = correctCoordinatorName;
      modified = true;
    }

    // Synchronize 2 TM/pekan for Kaldik Reguler (replace legacy 35 jam values)
    if (category === 'reguler') {
      const hasOld35Jam = rawData.semester1Effective?.some(m => m.jamWeeks?.includes(35)) ||
                          rawData.semester2Effective?.some(m => m.jamWeeks?.includes(35));
      if (hasOld35Jam) {
        rawData.semester1Effective = JSON.parse(JSON.stringify(INITIAL_KALDIK_REGULER_DATA.semester1Effective));
        rawData.semester2Effective = JSON.parse(JSON.stringify(INITIAL_KALDIK_REGULER_DATA.semester2Effective));
        modified = true;
      }
    }

    if (modified) {
      const key = category === 'reguler' ? STORAGE_KEYS.KALDIK_REGULER : STORAGE_KEYS.KALDIK;
      setItem(key, rawData);
    }

    return rawData;
  },
  saveKaldikData(data: KaldikData, category?: 'tahfizh' | 'reguler'): void {
    const cat = category || data.category || 'tahfizh';
    const updated: KaldikData = {
      ...data,
      category: cat,
      updatedAt: new Date().toISOString()
    };
    const key = cat === 'reguler' ? STORAGE_KEYS.KALDIK_REGULER : STORAGE_KEYS.KALDIK;
    const cloudDoc = cat === 'reguler' ? 'kaldik_reguler_config' : 'kaldik_config';
    setItem(key, updated);
    syncDocToCloud('app_settings', cloudDoc, updated);
    this.notifyListeners();
  },
  resetKaldikData(category: 'tahfizh' | 'reguler' = 'tahfizh'): KaldikData {
    const fresh = category === 'reguler'
      ? JSON.parse(JSON.stringify(INITIAL_KALDIK_REGULER_DATA)) as KaldikData
      : JSON.parse(JSON.stringify(INITIAL_KALDIK_DATA)) as KaldikData;
    const key = category === 'reguler' ? STORAGE_KEYS.KALDIK_REGULER : STORAGE_KEYS.KALDIK;
    const cloudDoc = category === 'reguler' ? 'kaldik_reguler_config' : 'kaldik_config';
    setItem(key, fresh);
    syncDocToCloud('app_settings', cloudDoc, fresh);
    this.notifyListeners();
    return fresh;
  },

  getProsemSheets(): ProsemSheet[] {
    const raw = getItem<ProsemSheet[]>(STORAGE_KEYS.PROSEM, INITIAL_PROSEM_SHEETS);
    const list = raw && raw.length > 0 ? raw : INITIAL_PROSEM_SHEETS;
    let modified = false;
    const enriched = list.map((s, idx) => {
      let hName = s.halaqahName;
      let hId = s.halaqahId;
      let mName = s.musyrifName;
      let mId = s.musyrifId;
      let sTitle = s.signMusyrifTitle || 'Guru / Musyrif Halaqah';
      let sName = s.signMusyrifName || (mName ? `(${mName})` : '(Ustadz / Ustadzah)');

      if (!hName) {
        modified = true;
        if (idx === 0 || s.id.includes('sem1-jilid1')) {
          hId = 'hlq-1';
          hName = 'Halaqah 1 (Umar bin Khattab)';
          mId = 't-1';
          mName = 'Ustadz Ahmad Fauzan, Lc.';
          sName = '(Ustadz Ahmad Fauzan, Lc.)';
        } else if (idx === 1 || s.id.includes('sem2-jilid2')) {
          hId = 'hlq-2';
          hName = 'Halaqah 2 (Abu Bakar)';
          mId = 't-2';
          mName = 'Ustadz Ridwan Kamil, S.Pd.I';
          sName = '(Ustadz Ridwan Kamil, S.Pd.I)';
        } else {
          hId = 'hlq-1';
          hName = 'Halaqah 1';
          mName = 'Ustadz / Musyrif';
        }
      }

      return {
        ...s,
        halaqahId: hId || s.halaqahId,
        halaqahName: hName || s.halaqahName,
        musyrifId: mId || s.musyrifId,
        musyrifName: mName || s.musyrifName,
        signMusyrifTitle: sTitle,
        signMusyrifName: sName
      };
    });

    if (modified) {
      setItem(STORAGE_KEYS.PROSEM, enriched);
    }
    return enriched;
  },
  saveProsemSheets(sheets: ProsemSheet[]): void {
    setItem(STORAGE_KEYS.PROSEM, sheets);
    syncDocToCloud('app_settings', 'prosem_config', { sheets, updatedAt: new Date().toISOString() });
    this.notifyListeners();
  },
  saveProsemSheet(sheet: ProsemSheet): void {
    const sheets = this.getProsemSheets();
    const idx = sheets.findIndex(s => s.id === sheet.id);
    const updatedSheet: ProsemSheet = {
      ...sheet,
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) {
      sheets[idx] = updatedSheet;
    } else {
      sheets.push(updatedSheet);
    }
    this.saveProsemSheets(sheets);
  },
  resetProsemSheets(): ProsemSheet[] {
    const fresh = JSON.parse(JSON.stringify(INITIAL_PROSEM_SHEETS)) as ProsemSheet[];
    this.saveProsemSheets(fresh);
    return fresh;
  },

  // Violations & Kedisiplinan
  getViolations(): TahfizhViolation[] {
    const deletedSet = getDeletedIdsSet();
    return getItem(STORAGE_KEYS.VIOLATIONS, INITIAL_VIOLATIONS).filter(
      v => v && v.id && !deletedSet.has(String(v.id))
    );
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
    this.notifyListeners();
    return newViolation;
  },

  updateViolation(violation: TahfizhViolation): void {
    const violations = this.getViolations();
    const idx = violations.findIndex(v => v.id === violation.id);
    if (idx >= 0) {
      violations[idx] = violation;
      setItem(STORAGE_KEYS.VIOLATIONS, violations);
      syncDocToCloud('violations', violation.id, violation);
      this.notifyListeners();
    }
  },

  deleteViolation(id: string): void {
    markDeletedId(id);
    const violations = this.getViolations().filter(v => v.id !== id);
    setItem(STORAGE_KEYS.VIOLATIONS, violations);
    deleteDocFromCloud('violations', id);
    this.notifyListeners();
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
    const deletedSet = getDeletedIdsSet();
    if (localStorage.getItem(STORAGE_KEYS.MATRIKULASI_STUDENTS) === null) {
      const seeded = INITIAL_MATRIKULASI_STUDENTS.filter(s => s && s.id && !deletedSet.has(String(s.id)));
      setItem(STORAGE_KEYS.MATRIKULASI_STUDENTS, seeded);
      return seeded;
    }
    const list = getItem<MatrikulasiStudent[]>(STORAGE_KEYS.MATRIKULASI_STUDENTS, []);
    return (list || []).filter(s => s && s.id && !deletedSet.has(String(s.id)));
  },

  saveMatrikulasiStudents(list: MatrikulasiStudent[]): void {
    setItem(STORAGE_KEYS.MATRIKULASI_STUDENTS, list);
    syncCollectionToCloud('matrikulasi_students', list);
    this.notifyListeners();
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
    markDeletedId(id);
    const list = this.getMatrikulasiStudents().filter(s => s.id !== id);
    setItem(STORAGE_KEYS.MATRIKULASI_STUDENTS, list);
    deleteDocFromCloud('matrikulasi_students', id);
    this.notifyListeners();
  },

  getMatrikulasiRecords(): MatrikulasiRecord[] {
    const deletedSet = getDeletedIdsSet();
    if (localStorage.getItem(STORAGE_KEYS.MATRIKULASI_RECORDS) === null) {
      const seeded = INITIAL_MATRIKULASI_RECORDS.filter(r => r && r.id && !deletedSet.has(String(r.id)));
      setItem(STORAGE_KEYS.MATRIKULASI_RECORDS, seeded);
      return seeded;
    }
    const list = getItem<MatrikulasiRecord[]>(STORAGE_KEYS.MATRIKULASI_RECORDS, []);
    return (list || []).filter(r => r && r.id && !deletedSet.has(String(r.id)));
  },

  saveMatrikulasiRecords(list: MatrikulasiRecord[]): void {
    setItem(STORAGE_KEYS.MATRIKULASI_RECORDS, list);
    syncCollectionToCloud('matrikulasi_records', list);
    this.notifyListeners();
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
    markDeletedId(id);
    const allRecords = this.getMatrikulasiRecords();
    const deletedRecord = allRecords.find(r => r.id === id);
    const list = allRecords.filter(r => r.id !== id);
    setItem(STORAGE_KEYS.MATRIKULASI_RECORDS, list);
    deleteDocFromCloud('matrikulasi_records', id);

    if (deletedRecord) {
      const matStudents = this.getMatrikulasiStudents();
      const targetMatStudent = matStudents.find(
        ms => ms.id === deletedRecord.matrikulasiStudentId || ms.studentId === deletedRecord.studentId
      );
      if (targetMatStudent) {
        const remaining = list
          .filter(r => r.matrikulasiStudentId === targetMatStudent.id || r.studentId === targetMatStudent.studentId)
          .sort(compareRecordsDesc);
        if (remaining.length > 0) {
          targetMatStudent.currentIqroJilid = remaining[0].jilid;
          targetMatStudent.currentIqroPage = remaining[0].page;
          this.updateMatrikulasiStudent(targetMatStudent);
        }
      }
    }
    this.notifyListeners();
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
  },

  // Exam Submissions (Ujian Kenaikan Jilid UMMI, Ujian Munaqosyah, Ujian Juziyyah)
  getExamSubmissions(): ExamSubmission[] {
    const deletedSet = getDeletedIdsSet();
    const raw = localStorage.getItem(STORAGE_KEYS.EXAM_SUBMISSIONS);
    if (raw === null) {
      const students = this.getStudents();
      const classes = this.getClasses();
      const teachers = this.getTeachers();
      const g7Students = students.filter(s => {
        const cls = classes.find(c => c.id === s.classId);
        return cls ? String(cls.name).startsWith('7') : true;
      });
      const sampleS1 = g7Students[0] || students[0];
      const sampleS2 = g7Students[1] || students[1] || sampleS1;
      const sampleS3 = students[2] || sampleS1;
      const cls1 = classes.find(c => c.id === sampleS1?.classId)?.name || '7A';
      const cls2 = classes.find(c => c.id === sampleS2?.classId)?.name || '7A';
      const cls3 = classes.find(c => c.id === sampleS3?.classId)?.name || '8A';
      const musyrif = teachers[0];

      const initialExams: ExamSubmission[] = sampleS1 ? [
        {
          id: 'exm-kenaikan-1',
          category: 'kenaikan_jilid',
          submissionDate: '2026-09-25',
          proposedDateText: 'Senin, 28 September 2026',
          teacherId: musyrif?.id || 't-1',
          teacherName: musyrif?.name || 'Ustadz Ahmad Fauzan, Lc.',
          halaqahName: 'Halaqah 1',
          participants: [
            {
              studentId: sampleS1.id,
              studentName: sampleS1.name,
              studentNis: sampleS1.nis,
              classId: sampleS1.classId,
              className: cls1,
              jilidOrJuz: sampleS1.currentUmmiJilid && sampleS1.currentUmmiJilid !== '-' ? sampleS1.currentUmmiJilid : 'Jilid 2',
              promotedToJilid: 'Jilid 3',
              parentName: sampleS1.parentName,
              parentPhone: sampleS1.parentPhone,
              resultStatus: 'Lulus',
              scoreDetails: { aspect1: 92, aspect2: 90, aspect3: 94 },
              score: 92,
              gradeLetter: 'A',
              predicate: 'MUMTAZ (Istimewa)',
              examinerName: 'Ustadz Muhammad Yusrie Alfian, S.Ag.',
              examinerNotes: 'Bacaan tartil, makhraj dan sifat huruf sangat baik, siap naik ke jilid berikutnya.',
              certificateNumber: '001/SYH-UMMI/SMPIA21/X/2026',
              evaluatedAt: '2026-10-01'
            },
            ...(sampleS2 && sampleS2.id !== sampleS1.id ? [{
              studentId: sampleS2.id,
              studentName: sampleS2.name,
              studentNis: sampleS2.nis,
              classId: sampleS2.classId,
              className: cls2,
              jilidOrJuz: sampleS2.currentUmmiJilid && sampleS2.currentUmmiJilid !== '-' ? sampleS2.currentUmmiJilid : 'Jilid 2',
              promotedToJilid: 'Jilid 3',
              parentName: sampleS2.parentName,
              parentPhone: sampleS2.parentPhone,
              resultStatus: 'Lulus' as const,
              scoreDetails: { aspect1: 88, aspect2: 86, aspect3: 87 },
              score: 87,
              gradeLetter: 'A-',
              predicate: 'JAYYID JIDDAN (Sangat Baik)',
              examinerName: 'Ustadz Muhammad Yusrie Alfian, S.Ag.',
              examinerNotes: 'Kelancaran dan mizan stabil, pertahankan ketepatan panjang pendek mad.',
              certificateNumber: '002/SYH-UMMI/SMPIA21/X/2026',
              evaluatedAt: '2026-10-01'
            }] : [])
          ],
          status: 'Terjadwal',
          scheduledDay: 'Kamis',
          scheduledDate: '2026-10-01',
          scheduledTime: '07.30 - 09.00 WIB',
          scheduledRoom: 'Masjid Lt. 1 SMPI Al Azhar 21',
          examinerName: 'Ustadz Muhammad Yusrie Alfian, S.Ag.',
          coordinatorName: 'Ustadz Muhammad Yusrie Alfian, S.Ag.',
          coordinatorNotes: 'Mohon membawa buku Ummi dan kartu prestasi.',
          createdAt: '2026-09-25T08:00:00.000Z',
          _updatedAt: Date.now()
        },
        {
          id: 'exm-munaqosyah-1',
          category: 'munaqosyah',
          submissionDate: '2026-09-26',
          proposedDateText: 'Rabu, 30 September 2026',
          teacherId: musyrif?.id || 't-1',
          teacherName: musyrif?.name || 'Ustadz Ahmad Fauzan, Lc.',
          halaqahName: 'Halaqah Munaqosyah',
          participants: [
            {
              studentId: sampleS1.id,
              studentName: sampleS1.name,
              studentNis: sampleS1.nis,
              classId: sampleS1.classId,
              className: cls1,
              jilidOrJuz: 'Munaqosyah Tartil Al-Qur\'an (Gharib & Tajwid)',
              parentName: sampleS1.parentName,
              parentPhone: sampleS1.parentPhone,
              resultStatus: 'Lulus',
              scoreDetails: { aspect1: 93, aspect2: 91, aspect3: 90, aspect4: 94 },
              score: 92,
              gradeLetter: 'A',
              predicate: 'MUMTAZ (Istimewa)',
              examinerName: 'Ustadz Muhammad Yusrie Alfian, S.Ag.',
              examinerNotes: 'Penguasaan Gharibul Qur\'an dan penguraian hukum tajwid sangat baik dan lancar.',
              certificateNumber: '001/SYH-MNQ/SMPIA21/X/2026',
              evaluatedAt: '2026-10-03'
            }
          ],
          status: 'Terjadwal',
          scheduledDay: 'Sabtu',
          scheduledDate: '2026-10-03',
          scheduledTime: '08.00 - 11.00 WIB',
          scheduledRoom: 'Aula Utama SMPI Al Azhar 21',
          examinerName: 'Ustadz Muhammad Yusrie Alfian, S.Ag.',
          coordinatorName: 'Ustadz Muhammad Yusrie Alfian, S.Ag.',
          coordinatorNotes: 'Ujian Munaqosyah Metode Ummi (Tartil, Fashahah, Gharib, Tajwid).',
          createdAt: '2026-09-26T08:00:00.000Z',
          _updatedAt: Date.now()
        },
        {
          id: 'exm-juziyyah-1',
          category: 'juziyyah',
          submissionDate: '2026-09-26',
          proposedDateText: 'Kamis, 1 Oktober 2026',
          teacherId: musyrif?.id || 't-1',
          teacherName: musyrif?.name || 'Ustadz Ahmad Fauzan, Lc.',
          halaqahName: 'Halaqah Tahfizh',
          participants: [
            {
              studentId: (sampleS3 || sampleS1).id,
              studentName: (sampleS3 || sampleS1).name,
              studentNis: (sampleS3 || sampleS1).nis,
              classId: (sampleS3 || sampleS1).classId,
              className: cls3,
              jilidOrJuz: 'Juz 30 (Sekali Duduk)',
              parentName: (sampleS3 || sampleS1).parentName,
              parentPhone: (sampleS3 || sampleS1).parentPhone,
              resultStatus: 'Lulus',
              scoreDetails: { aspect1: 95, aspect2: 92, aspect3: 93, aspect4: 96 },
              score: 94,
              gradeLetter: 'A',
              predicate: 'MUMTAZ (Istimewa)',
              examinerName: 'Ustadz Muhammad Yusrie Alfian, S.Ag.',
              examinerNotes: 'Alhamdulillah tasmi\' Juz 30 sekali duduk lancar, mutqin, dan makhraj terjaga.',
              certificateNumber: '001/SYH-JZY/SMPIA21/X/2026',
              evaluatedAt: '2026-10-02'
            }
          ],
          status: 'Terjadwal',
          scheduledDay: 'Jumat',
          scheduledDate: '2026-10-02',
          scheduledTime: '07.30 - 09.30 WIB',
          scheduledRoom: 'Serambi Utama Masjid Al Azhar 21',
          examinerName: 'Ustadz Muhammad Yusrie Alfian, S.Ag.',
          coordinatorName: 'Ustadz Muhammad Yusrie Alfian, S.Ag.',
          coordinatorNotes: 'Tasmi\' Ujian Juziyyah 1 Juz sekali duduk.',
          createdAt: '2026-09-26T09:00:00.000Z',
          _updatedAt: Date.now()
        }
      ] : [];

      const filteredInitial = initialExams.filter(x => !deletedSet.has(x.id));
      setItem(STORAGE_KEYS.EXAM_SUBMISSIONS, filteredInitial);
      return filteredInitial;
    }

    const list = getItem<ExamSubmission[]>(STORAGE_KEYS.EXAM_SUBMISSIONS, []);
    let changed = false;
    const enriched = (list || [])
      .filter(item => item && item.id && !deletedSet.has(String(item.id)))
      .map(item => {
        if (
          (item.id === 'exm-kenaikan-1' || item.id === 'exm-munaqosyah-1' || item.id === 'exm-juziyyah-1') &&
          item.participants.length > 0 &&
          item.participants.every(p => p.score === undefined)
        ) {
          changed = true;
          return {
            ...item,
            participants: item.participants.map((p, idx) => {
              if (item.category === 'kenaikan_jilid') {
                return {
                  ...p,
                  promotedToJilid: p.promotedToJilid || 'Jilid 3',
                  resultStatus: 'Lulus' as const,
                  scoreDetails: { aspect1: 92 - idx * 4, aspect2: 90 - idx * 4, aspect3: 94 - idx * 5 },
                  score: 92 - idx * 4,
                  gradeLetter: idx === 0 ? 'A' : 'A-',
                  predicate: idx === 0 ? 'MUMTAZ (Istimewa)' : 'JAYYID JIDDAN (Sangat Baik)',
                  examinerName: item.examinerName || 'Ustadz Muhammad Yusrie Alfian, S.Ag.',
                  examinerNotes: 'Bacaan tartil, makhraj dan sifat huruf sangat baik, lulus naik ke jilid berikutnya.',
                  certificateNumber: `00${idx + 1}/SYH-UMMI/SMPIA21/X/2026`,
                  evaluatedAt: item.scheduledDate || '2026-10-01'
                };
              }
              if (item.category === 'munaqosyah') {
                return {
                  ...p,
                  resultStatus: 'Lulus' as const,
                  scoreDetails: { aspect1: 93, aspect2: 91, aspect3: 90, aspect4: 94 },
                  score: 92,
                  gradeLetter: 'A',
                  predicate: 'MUMTAZ (Istimewa)',
                  examinerName: item.examinerName || 'Ustadz Muhammad Yusrie Alfian, S.Ag.',
                  examinerNotes: 'Penguasaan Gharibul Qur\'an dan penguraian hukum tajwid sangat baik dan lancar.',
                  certificateNumber: `00${idx + 1}/SYH-MNQ/SMPIA21/X/2026`,
                  evaluatedAt: item.scheduledDate || '2026-10-03'
                };
              }
              return {
                ...p,
                resultStatus: 'Lulus' as const,
                scoreDetails: { aspect1: 95, aspect2: 92, aspect3: 93, aspect4: 96 },
                score: 94,
                gradeLetter: 'A',
                predicate: 'MUMTAZ (Istimewa)',
                examinerName: item.examinerName || 'Ustadz Muhammad Yusrie Alfian, S.Ag.',
                examinerNotes: 'Alhamdulillah tasmi\' sekali duduk lancar, mutqin, dan makhraj terjaga.',
                certificateNumber: `00${idx + 1}/SYH-JZY/SMPIA21/X/2026`,
                evaluatedAt: item.scheduledDate || '2026-10-02'
              };
            })
          };
        }
        return item;
      });
    if (changed) {
      setItem(STORAGE_KEYS.EXAM_SUBMISSIONS, enriched);
    }
    return enriched;
  },

  saveExamSubmission(submission: ExamSubmission): void {
    const list = this.getExamSubmissions();
    const stamped: ExamSubmission = {
      ...submission,
      _updatedAt: Date.now()
    };
    const idx = list.findIndex(x => x.id === stamped.id);
    if (idx >= 0) {
      list[idx] = stamped;
    } else {
      list.unshift(stamped);
    }
    setItem(STORAGE_KEYS.EXAM_SUBMISSIONS, list);
    syncDocToCloud('exam_submissions', stamped.id, stamped);
    this.notifyListeners();
  },

  deleteExamSubmission(id: string): void {
    markDeletedId(id);
    const list = this.getExamSubmissions().filter(x => x.id !== id);
    setItem(STORAGE_KEYS.EXAM_SUBMISSIONS, list);
    deleteDocFromCloud('exam_submissions', id);
    this.notifyListeners();
  }
};
