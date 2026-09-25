import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { StudentDetailView } from './components/StudentDetailView';
import { HafalanView } from './components/HafalanView';
import { UmmiView } from './components/UmmiView';
import { ScoresView } from './components/ScoresView';
import { TargetsView } from './components/TargetsView';
import { ReportsView } from './components/ReportsView';
import { ParentPortalView } from './components/ParentPortalView';
import { TeachersClassesView } from './components/TeachersClassesView';
import { MaterialsView } from './components/MaterialsView';
import { ViolationsView } from './components/ViolationsView';
import { MatrikulasiView } from './components/MatrikulasiView';
import { SettingsView } from './components/SettingsView';
import { DailyInputModal } from './components/DailyInputModal';
import { UserProfileModal } from './components/UserProfileModal';
import { LoginView } from './components/LoginView';
import { Database, AlertTriangle, ExternalLink, RefreshCw, X, ShieldAlert } from 'lucide-react';

import { storageService } from './services/storageService';
import { 
  Student, 
  Teacher, 
  ClassItem, 
  MemorizationRecord, 
  UmmiRecord, 
  TargetProgress, 
  LearningMaterial, 
  TahfizhViolation,
  MatrikulasiStudent,
  MatrikulasiRecord,
  HalaqahGroup,
  AppSettings, 
  UserProfile, 
  Role 
} from './types';

export default function App() {
  // Authentication & Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return storageService.getCurrentUser();
  });

  // Navigation State with localStorage persistence
  const [currentView, setCurrentView] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('tahfizh_active_view');
      const user = storageService.getCurrentUser();
      if (user?.role === 'wali') {
        const allowedWaliViews = ['parent-portal', 'hafalan', 'ummi', 'reports', 'matrikulasi', 'violations', 'student-detail'];
        if (saved && allowedWaliViews.includes(saved)) return saved;
        return 'parent-portal';
      }
      if (saved) return saved;
    } catch (e) {}
    return 'dashboard';
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('tahfizh_selected_student_id') || null;
    } catch (e) {
      return null;
    }
  });

  // Modal & Edit State
  const [isDailyInputOpen, setIsDailyInputOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQuotaBannerDismissed, setIsQuotaBannerDismissed] = useState(false);
  const [prefilledStudentId, setPrefilledStudentId] = useState<string | undefined>(undefined);
  const [editingMemorizationRecord, setEditingMemorizationRecord] = useState<MemorizationRecord | null>(null);
  const [editingUmmiRecord, setEditingUmmiRecord] = useState<UmmiRecord | null>(null);

  // Synchronize navigation view to localStorage
  useEffect(() => {
    try {
      if (currentView) {
        localStorage.setItem('tahfizh_active_view', currentView);
      }
    } catch (e) {}
  }, [currentView]);

  useEffect(() => {
    try {
      if (selectedStudentId) {
        localStorage.setItem('tahfizh_selected_student_id', selectedStudentId);
      } else {
        localStorage.removeItem('tahfizh_selected_student_id');
      }
    } catch (e) {}
  }, [selectedStudentId]);

  // Data Store States
  const [students, setStudents] = useState<Student[]>(() => storageService.getStudents());
  const [teachers, setTeachers] = useState<Teacher[]>(() => storageService.getTeachers());
  const [classes, setClasses] = useState<ClassItem[]>(() => storageService.getClasses());
  const [halaqahGroups, setHalaqahGroups] = useState<HalaqahGroup[]>(() => storageService.getHalaqahGroups());
  const [records, setRecords] = useState<MemorizationRecord[]>(() => storageService.getMemorizationRecords());
  const [ummiRecords, setUmmiRecords] = useState<UmmiRecord[]>(() => storageService.getUmmiRecords());
  const [violations, setViolations] = useState<TahfizhViolation[]>(() => storageService.getViolations());
  const [matrikulasiStudents, setMatrikulasiStudents] = useState<MatrikulasiStudent[]>(() => storageService.getMatrikulasiStudents());
  const [matrikulasiRecords, setMatrikulasiRecords] = useState<MatrikulasiRecord[]>(() => storageService.getMatrikulasiRecords());
  const [targets, setTargets] = useState<TargetProgress[]>(() => storageService.getTargets());
  const [materials, setMaterials] = useState<LearningMaterial[]>(() => storageService.getMaterials());
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());

  // Load / Reload all data from storageService
  const loadAllData = useCallback(() => {
    setStudents(storageService.getStudents());
    setTeachers(storageService.getTeachers());
    setClasses(storageService.getClasses());
    setHalaqahGroups(storageService.getHalaqahGroups());
    setRecords(storageService.getMemorizationRecords());
    setUmmiRecords(storageService.getUmmiRecords());
    setViolations(storageService.getViolations());
    setMatrikulasiStudents(storageService.getMatrikulasiStudents());
    setMatrikulasiRecords(storageService.getMatrikulasiRecords());
    setTargets(storageService.getTargets());
    setMaterials(storageService.getMaterials());
    setSettings(storageService.getSettings());
  }, []);

  useEffect(() => {
    loadAllData();

    // Auto-init and sync data with Firestore Cloud Database
    storageService.initCloudSync().then((res) => {
      console.log('[App] Cloud sync response:', res.message);
      loadAllData();
    });

    // Subscribe to realtime changes across devices
    const unsubscribe = storageService.onSyncChange(() => {
      loadAllData();
    });

    return () => {
      unsubscribe();
    };
  }, [loadAllData]);

  const handleLogin = (user: UserProfile) => {
    storageService.setCurrentUser(user);
    setCurrentUser(user);
    loadAllData();
    if (user.role === 'wali') {
      setCurrentView('parent-portal');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    storageService.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleOpenDailyInput = (studentId?: string) => {
    setEditingMemorizationRecord(null);
    setEditingUmmiRecord(null);
    setPrefilledStudentId(studentId);
    setIsDailyInputOpen(true);
  };

  const handleEditMemorization = (record: MemorizationRecord) => {
    setEditingMemorizationRecord(record);
    setEditingUmmiRecord(null);
    setPrefilledStudentId(record.studentId);
    setIsDailyInputOpen(true);
  };

  const handleEditUmmi = (record: UmmiRecord) => {
    setEditingUmmiRecord(record);
    setEditingMemorizationRecord(null);
    setPrefilledStudentId(record.studentId);
    setIsDailyInputOpen(true);
  };

  const handleDeleteMemorization = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data capaian hafalan ini?')) {
      storageService.deleteMemorizationRecord(id);
      loadAllData();
    }
  };

  const handleDeleteUmmi = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data capaian Ummi ini?')) {
      storageService.deleteUmmiRecord(id);
      loadAllData();
    }
  };

  // Determine accessible students for privacy:
  // If user role is 'wali', strictly restrict to only their own student/child(ren)
  const accessibleStudents = React.useMemo(() => {
    return storageService.getAccessibleStudents(currentUser, students);
  }, [currentUser, students]);

  const accessibleStudentIds = React.useMemo(() => {
    return new Set(accessibleStudents.map(s => s.id));
  }, [accessibleStudents]);

  const isWali = currentUser?.role === 'wali';

  // Scoped data arrays for privacy enforcement
  const viewStudents = isWali ? accessibleStudents : students;
  const viewRecords = isWali ? records.filter(r => accessibleStudentIds.has(r.studentId)) : records;
  const viewUmmiRecords = isWali ? ummiRecords.filter(r => accessibleStudentIds.has(r.studentId)) : ummiRecords;
  const viewViolations = isWali ? violations.filter(v => accessibleStudentIds.has(v.studentId)) : violations;
  const viewMatrikulasiStudents = isWali ? matrikulasiStudents.filter(m => accessibleStudentIds.has(m.studentId)) : matrikulasiStudents;
  const viewMatrikulasiRecords = isWali ? matrikulasiRecords.filter(m => accessibleStudentIds.has(m.studentId)) : matrikulasiRecords;
  const viewTargets = isWali ? targets.filter(t => accessibleStudentIds.has(t.studentId)) : targets;

  // Enforce view protection: Wali users can only access their allowed personal views
  useEffect(() => {
    if (isWali) {
      const allowedWaliViews = ['parent-portal', 'hafalan', 'ummi', 'matrikulasi', 'violations', 'pelanggaran', 'reports', 'targets', 'student-detail'];
      if (!allowedWaliViews.includes(currentView)) {
        setCurrentView('parent-portal');
      }
    }
  }, [isWali, currentView]);

  const handleOpenStudentDetail = (studentId: string) => {
    if (isWali && !accessibleStudentIds.has(studentId)) {
      console.warn('Akses ditolak: Privasi santri');
      return;
    }
    setSelectedStudentId(studentId);
    setCurrentView('student-detail');
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  const currentTeacher = teachers.find(t => 
    (currentUser.teacherId && t.id === currentUser.teacherId) ||
    t.id === currentUser.id ||
    (currentUser.email && t.email && t.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    (currentUser.name && t.name && (t.name.toLowerCase().includes(currentUser.name.toLowerCase()) || currentUser.name.toLowerCase().includes(t.name.toLowerCase())))
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col antialiased text-slate-900 font-sans selection:bg-[#D4AF37] selection:text-slate-950">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenDailyInput={() => handleOpenDailyInput()}
        onLogout={handleLogout}
        onOpenSettings={() => setCurrentView('settings')}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        schoolName={settings.schoolName}
        activeView={currentView}
        setActiveView={(v) => setCurrentView(v)}
      />

      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Navigation */}
        <Sidebar
          currentView={currentView}
          onViewChange={(view) => {
            if (view === 'login') {
              handleLogout();
            } else {
              setCurrentView(view);
              setSelectedStudentId(null);
            }
          }}
          userRole={currentUser.role}
          currentUser={currentUser}
          currentTeacher={currentTeacher}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          
          {/* QUOTA LIMIT EXCEEDED NOTICE BANNER */}
          {storageService.isQuotaExceeded() && !isQuotaBannerDismissed && (
            <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-4 sm:p-5 shadow-sm text-slate-800 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700 mt-0.5 shadow-xs">
                    <Database className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        Batas Kuota Harian Firebase Tercapai (Spark Free Tier)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                        Mode Penyimpanan Lokal Aktif
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 mt-1.5 leading-relaxed">
                      Kuota baca gratis Firestore harian (50.000 read units per hari) untuk basis data proyek ini telah mencapai limit. 
                      <strong className="text-slate-900 font-semibold ml-1">
                        Seluruh fitur aplikasi (input setoran hafalan, mutasi nilai Ummi, data santri, cetak laporan) tetap berjalan 100% normal dan data tersimpan aman secara offline/lokal
                      </strong> di perangkat ini. Kuota gratis harian akan di-reset otomatis esok hari oleh Google Firebase.
                    </p>
                    <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                      <a
                        href={storageService.getQuotaInfo().upgradeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-xs transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Upgrade Database di Firebase Console</span>
                      </a>
                      <button
                        onClick={async () => {
                          storageService.clearQuotaStatus();
                          const res = await storageService.initCloudSync(true);
                          if (!res.isQuotaExceeded) {
                            setIsQuotaBannerDismissed(true);
                          }
                          loadAllData();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium text-xs transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Coba Hubungkan Ulang</span>
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsQuotaBannerDismissed(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-amber-100/60 transition cursor-pointer"
                  title="Tutup pemberitahuan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* VIEW: DASHBOARD */}
          {currentView === 'dashboard' && (
            <DashboardView
              students={students}
              teachers={teachers}
              records={records}
              ummiRecords={ummiRecords}
              targets={targets}
              onOpenDailyInput={() => handleOpenDailyInput()}
              onOpenStudentDetail={handleOpenStudentDetail}
              onNavigate={(v) => setCurrentView(v)}
            />
          )}

          {/* VIEW: DATA SISWA */}
          {currentView === 'students' && (
            <StudentsView
              students={students}
              teachers={teachers}
              classes={classes}
              userRole={currentUser.role}
              onOpenStudentDetail={handleOpenStudentDetail}
              onRefreshData={loadAllData}
              onOpenDailyInputWithStudent={handleOpenDailyInput}
            />
          )}

          {/* VIEW: DETAIL SISWA */}
          {currentView === 'student-detail' && selectedStudentId && (
            <StudentDetailView
              studentId={selectedStudentId}
              students={viewStudents}
              teachers={teachers}
              classes={classes}
              records={viewRecords}
              ummiRecords={viewUmmiRecords}
              settings={settings}
              userRole={currentUser.role}
              onRefreshData={loadAllData}
              onBack={() => {
                setSelectedStudentId(null);
                setCurrentView(currentUser.role === 'wali' ? 'parent-portal' : 'students');
              }}
              onOpenDailyInput={handleOpenDailyInput}
            />
          )}

          {/* VIEW: HAFALAN AL-QURAN */}
          {currentView === 'hafalan' && (
            <HafalanView
              records={viewRecords}
              students={viewStudents}
              teachers={teachers}
              classes={classes}
              userRole={currentUser.role}
              onOpenDailyInput={(studentId) => handleOpenDailyInput(studentId)}
              onRefreshData={loadAllData}
              onOpenStudentDetail={handleOpenStudentDetail}
              onEditRecord={handleEditMemorization}
              onDeleteRecord={handleDeleteMemorization}
            />
          )}

          {/* VIEW: METODE UMMI */}
          {currentView === 'ummi' && (
            <UmmiView
              ummiRecords={viewUmmiRecords}
              students={viewStudents}
              teachers={teachers}
              classes={classes}
              userRole={currentUser.role}
              onOpenDailyInput={(studentId) => handleOpenDailyInput(studentId)}
              onRefreshData={loadAllData}
              onOpenStudentDetail={handleOpenStudentDetail}
              onEditRecord={handleEditUmmi}
              onDeleteRecord={handleDeleteUmmi}
            />
          )}

          {/* VIEW: MATRIKULASI METODE IQRO (KELAS 8 & 9 - SELASA, RABU, KAMIS) */}
          {currentView === 'matrikulasi' && (
            <MatrikulasiView
              students={viewStudents}
              teachers={teachers}
              classes={classes}
              matrikulasiStudents={viewMatrikulasiStudents}
              matrikulasiRecords={viewMatrikulasiRecords}
              userRole={currentUser.role}
              settings={settings}
              onRefreshData={loadAllData}
              onOpenStudentDetail={handleOpenStudentDetail}
            />
          )}

          {/* VIEW: PELANGGARAN TAHFIZH & KEDISIPLINAN */}
          {(currentView === 'violations' || currentView === 'pelanggaran') && (
            <ViolationsView
              students={viewStudents}
              teachers={teachers}
              classes={classes}
              violations={viewViolations}
              userRole={currentUser.role}
              onRefreshData={loadAllData}
              onOpenStudentDetail={handleOpenStudentDetail}
            />
          )}

          {/* VIEW: SCORES & EVALUATION */}
          {currentView === 'scores' && (
            <ScoresView
              students={students}
              records={records}
              teachers={teachers}
              onOpenStudentDetail={handleOpenStudentDetail}
              onOpenDailyInputWithStudent={handleOpenDailyInput}
            />
          )}

          {/* VIEW: TARGETS & CAPAIAN */}
          {currentView === 'targets' && (
            <TargetsView
              targets={viewTargets}
              students={viewStudents}
              classes={classes}
              userRole={currentUser.role}
              onRefreshData={loadAllData}
              onOpenStudentDetail={handleOpenStudentDetail}
            />
          )}

          {/* VIEW: REPORTS & REKAP */}
          {currentView === 'reports' && (
            <ReportsView
              students={viewStudents}
              teachers={teachers}
              classes={classes}
              records={viewRecords}
              ummiRecords={viewUmmiRecords}
              settings={settings}
              userRole={currentUser.role}
              currentUser={currentUser}
              onOpenStudentDetail={handleOpenStudentDetail}
            />
          )}

          {/* VIEW: PORTAL WALI SANTRI */}
          {currentView === 'parent-portal' && (
            <ParentPortalView
              students={viewStudents}
              teachers={teachers}
              classes={classes}
              records={viewRecords}
              ummiRecords={viewUmmiRecords}
              settings={settings}
              onOpenStudentDetail={handleOpenStudentDetail}
              currentUser={currentUser}
            />
          )}

          {/* VIEW: GURU & KELAS */}
          {(currentView === 'teachers' || currentView === 'teachers-classes') && (
            <TeachersClassesView
              teachers={teachers}
              classes={classes}
              students={students}
              halaqahGroups={halaqahGroups}
              userRole={currentUser.role}
              currentUser={currentUser}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onRefreshData={loadAllData}
            />
          )}

          {/* VIEW: MATERI PEMBELAJARAN */}
          {currentView === 'materials' && (
            <MaterialsView
              materials={materials}
              userRole={currentUser.role}
              onRefreshData={loadAllData}
            />
          )}

          {/* VIEW: SETTINGS */}
          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              userRole={currentUser.role}
              onRefreshData={loadAllData}
            />
          )}

        </main>
      </div>

      {/* DAILY INPUT MODAL (SETORAN TAHFIZH & UMMI) */}
      <DailyInputModal
        isOpen={isDailyInputOpen}
        onClose={() => {
          setIsDailyInputOpen(false);
          setPrefilledStudentId(undefined);
          setEditingMemorizationRecord(null);
          setEditingUmmiRecord(null);
        }}
        students={students}
        classes={classes}
        allTeachers={teachers}
        editRecord={editingMemorizationRecord}
        editUmmiRecord={editingUmmiRecord}
        currentTeacher={
          teachers.find(t => 
            (currentUser?.teacherId && t.id === currentUser.teacherId) || 
            t.id === currentUser?.id ||
            (currentUser?.email && t.email && t.email.toLowerCase() === currentUser.email.toLowerCase())
          ) || teachers[0]
        }
        onSaveMemorization={(record) => {
          storageService.addMemorizationRecord(record);
          loadAllData();
        }}
        onUpdateMemorization={(record) => {
          storageService.updateMemorizationRecord(record);
          loadAllData();
        }}
        onSaveUmmi={(record) => {
          storageService.addUmmiRecord(record);
          loadAllData();
        }}
        onUpdateUmmi={(record) => {
          storageService.updateUmmiRecord(record);
          loadAllData();
        }}
        preSelectedStudentId={prefilledStudentId}
        initialStudentId={prefilledStudentId}
        onSaveSuccess={() => {
          loadAllData();
        }}
      />

      {/* USER PROFILE & PASSWORD MODAL */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={(updatedUser) => {
          setCurrentUser(updatedUser);
          loadAllData();
        }}
      />

    </div>
  );
}
