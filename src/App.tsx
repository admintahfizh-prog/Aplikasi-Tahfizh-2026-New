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
import { SettingsView } from './components/SettingsView';
import { DailyInputModal } from './components/DailyInputModal';
import { LoginView } from './components/LoginView';

import { storageService } from './services/storageService';
import { 
  Student, 
  Teacher, 
  ClassItem, 
  MemorizationRecord, 
  UmmiRecord, 
  TargetProgress, 
  LearningMaterial, 
  AppSettings, 
  UserProfile, 
  Role 
} from './types';

export default function App() {
  // Authentication & Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return storageService.getCurrentUser();
  });

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Modal State
  const [isDailyInputOpen, setIsDailyInputOpen] = useState(false);
  const [prefilledStudentId, setPrefilledStudentId] = useState<string | undefined>(undefined);

  // Data Store States
  const [students, setStudents] = useState<Student[]>(() => storageService.getStudents());
  const [teachers, setTeachers] = useState<Teacher[]>(() => storageService.getTeachers());
  const [classes, setClasses] = useState<ClassItem[]>(() => storageService.getClasses());
  const [records, setRecords] = useState<MemorizationRecord[]>(() => storageService.getMemorizationRecords());
  const [ummiRecords, setUmmiRecords] = useState<UmmiRecord[]>(() => storageService.getUmmiRecords());
  const [targets, setTargets] = useState<TargetProgress[]>(() => storageService.getTargets());
  const [materials, setMaterials] = useState<LearningMaterial[]>(() => storageService.getMaterials());
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());

  // Load / Reload all data from storageService
  const loadAllData = useCallback(() => {
    setStudents(storageService.getStudents());
    setTeachers(storageService.getTeachers());
    setClasses(storageService.getClasses());
    setRecords(storageService.getMemorizationRecords());
    setUmmiRecords(storageService.getUmmiRecords());
    setTargets(storageService.getTargets());
    setMaterials(storageService.getMaterials());
    setSettings(storageService.getSettings());
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle Role Change
  const handleRoleChange = (role: Role) => {
    const updatedUser: UserProfile = {
      id: `usr-${role}`,
      name: role === 'admin' 
        ? 'Ustadz Ahmad Fauzan, Lc., M.Ag.' 
        : role === 'guru' 
        ? 'Ustadzah Siti Maryam, S.Pd.I.' 
        : 'Bpk. H. Iskandar Zulkarnain',
      email: `${role}@smpia21.sch.id`,
      role,
      avatar: role === 'admin'
        ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
        : role === 'guru'
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      title: role === 'admin' 
        ? 'Koordinator Tahfizh & Admin' 
        : role === 'guru' 
        ? 'Guru Pengampu Halaqah' 
        : 'Orang Tua / Wali Santri'
    };
    storageService.setCurrentUser(updatedUser);
    setCurrentUser(updatedUser);

    if (role === 'wali') {
      setCurrentView('parent-portal');
    }
  };

  const handleLogin = (user: UserProfile) => {
    storageService.setCurrentUser(user);
    setCurrentUser(user);
    if (user.role === 'wali') {
      setCurrentView('parent-portal');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    storageService.setCurrentUser(null as any);
    setCurrentUser(null);
  };

  const handleOpenDailyInput = (studentId?: string) => {
    setPrefilledStudentId(studentId);
    setIsDailyInputOpen(true);
  };

  const handleOpenStudentDetail = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentView('student-detail');
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col antialiased text-slate-900 font-sans selection:bg-[#D4AF37] selection:text-slate-950">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onOpenDailyInput={() => handleOpenDailyInput()}
        onLogout={handleLogout}
        schoolName={settings.schoolName}
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
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          
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
              students={students}
              teachers={teachers}
              classes={classes}
              records={records}
              ummiRecords={ummiRecords}
              settings={settings}
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
              records={records}
              students={students}
              teachers={teachers}
              userRole={currentUser.role}
              onOpenDailyInput={() => handleOpenDailyInput()}
              onRefreshData={loadAllData}
              onOpenStudentDetail={handleOpenStudentDetail}
            />
          )}

          {/* VIEW: METODE UMMI */}
          {currentView === 'ummi' && (
            <UmmiView
              ummiRecords={ummiRecords}
              students={students}
              teachers={teachers}
              userRole={currentUser.role}
              onOpenDailyInput={() => handleOpenDailyInput()}
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
              targets={targets}
              students={students}
              classes={classes}
              userRole={currentUser.role}
              onRefreshData={loadAllData}
              onOpenStudentDetail={handleOpenStudentDetail}
            />
          )}

          {/* VIEW: REPORTS & REKAP */}
          {currentView === 'reports' && (
            <ReportsView
              students={students}
              teachers={teachers}
              classes={classes}
              records={records}
              ummiRecords={ummiRecords}
              settings={settings}
              onOpenStudentDetail={handleOpenStudentDetail}
            />
          )}

          {/* VIEW: PORTAL WALI SANTRI */}
          {currentView === 'parent-portal' && (
            <ParentPortalView
              students={students}
              teachers={teachers}
              classes={classes}
              records={records}
              ummiRecords={ummiRecords}
              settings={settings}
              onOpenStudentDetail={handleOpenStudentDetail}
            />
          )}

          {/* VIEW: GURU & KELAS */}
          {(currentView === 'teachers' || currentView === 'teachers-classes') && (
            <TeachersClassesView
              teachers={teachers}
              classes={classes}
              students={students}
              userRole={currentUser.role}
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
        }}
        students={students}
        classes={classes}
        allTeachers={teachers}
        currentTeacher={teachers.find(t => t.id === currentUser?.id) || teachers[0]}
        onSaveMemorization={(record) => {
          storageService.addMemorizationRecord(record);
          loadAllData();
        }}
        onSaveUmmi={(record) => {
          storageService.addUmmiRecord(record);
          loadAllData();
        }}
        preSelectedStudentId={prefilledStudentId}
        initialStudentId={prefilledStudentId}
        onSaveSuccess={() => {
          loadAllData();
        }}
      />

    </div>
  );
}
