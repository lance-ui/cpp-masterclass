/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect, useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import { COURSE_MODULES } from '@/data/curriculumData';
import type { AppView, ActiveTab } from '@/types';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { LessonViewer } from '@/features/lessons/LessonViewer';
import { SearchModal } from '@/components/common/SearchModal';
import { AuthView } from '@/features/auth/AuthView';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { useTheme } from '@/hooks/useTheme';
import { Skeleton } from '@/components/ui';

const CodePlayground = lazy(() =>
  import('@/features/playground/CodePlayground').then(module => ({ default: module.CodePlayground }))
);
const StudentDashboard = lazy(() =>
  import('@/features/dashboard/StudentDashboard').then(module => ({ default: module.StudentDashboard }))
);
const AdminDashboard = lazy(() =>
  import('@/features/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard }))
);

function ViewLoadingState() {
  return (
    <div className="w-full flex-1 space-y-4 p-6" role="status" aria-label="Loading view">
      <Skeleton lines={1} className="max-w-sm" />
      <Skeleton lines={6} />
    </div>
  );
}

export default function App() {
  const modules = COURSE_MODULES;
  const [currentView, setCurrentView] = useState<AppView>('learn');
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  const { 
    currentUser, 
    setCurrentUser, 
    allUsers, 
    login, 
    signup, 
    logout, 
    updateUserRole 
  } = useAuth();
  
  const { isDarkMode, toggleDarkMode } = useTheme();

  const {
    selectedModuleId,
    activeTab,
    setActiveTab,
    selectModule,
    toggleComplete,
    toggleBookmark,
    saveQuizScore,
    saveUserNote,
    activeModule,
    hasPrev,
    hasNext,
    navigatePrev,
    navigateNext,
    progressPercentage
  } = useProgress(modules, currentUser, setCurrentUser);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectModule = (moduleId: string, tab: ActiveTab = 'overview') => {
    selectModule(moduleId, tab);
    setCurrentView('learn');
    setIsOutlineOpen(false);
  };

  // Enforce authentication gate: if unauthenticated, redirect to AuthView
  if (!currentUser) {
    return (
      <AuthView
        onLogin={login}
        onSignup={signup}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="min-h-dvh bg-canvas dark:bg-canvas-dark text-ink dark:text-ink-dark flex flex-col font-sans transition-colors"
      >
        {/* Top Navigation Bar */}
        <Navbar
          currentView={currentView}
          onSelectView={setCurrentView}
          onOpenOutline={() => setIsOutlineOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          currentUser={currentUser}
          onOpenSearchModal={() => setIsSearchOpen(true)}
          onLogout={logout}
          isOnline={isOnline}
          progressPercentage={progressPercentage}
        />

        {/* Main Display Area (Full Width Fluid Layout) */}
        <main className="flex-1 w-full flex flex-col">
          {currentView === 'learn' && (
            <div className="flex-1 w-full flex flex-col lg:flex-row pb-20 lg:pb-0">
              {/* Sidebar Navigation */}
              <Sidebar
                modules={modules}
                selectedModuleId={selectedModuleId}
                onSelectModule={(id) => handleSelectModule(id, 'overview')}
                currentUser={currentUser}
                onToggleBookmark={toggleBookmark}
                isOpen={isOutlineOpen}
                onClose={() => setIsOutlineOpen(false)}
              />

              {/* Main Content Viewer */}
              <LessonViewer
                module={activeModule}
                currentUser={currentUser}
                onToggleComplete={toggleComplete}
                onToggleBookmark={toggleBookmark}
                onSaveQuizScore={saveQuizScore}
                onSaveUserNote={saveUserNote}
                onNavigatePrev={navigatePrev}
                onNavigateNext={navigateNext}
                hasPrev={hasPrev}
                hasNext={hasNext}
                activeTab={activeTab}
                onChangeTab={setActiveTab}
              />
            </div>
          )}

          {currentView === 'playground' && (
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 animate-fade-in">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  C++ Interactive Playground & Compiler
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Write, edit, compile, and execute modern C++ code directly in your browser. Choose templates or write custom algorithms.
                </p>
              </div>
              <Suspense fallback={<ViewLoadingState />}>
                <CodePlayground />
              </Suspense>
            </div>
          )}

          {currentView === 'dashboard' && (
            <Suspense fallback={<ViewLoadingState />}>
              <StudentDashboard
                currentUser={currentUser}
                modules={modules}
                onSelectModule={handleSelectModule}
              />
            </Suspense>
          )}

          {currentView === 'admin' && (
            <Suspense fallback={<ViewLoadingState />}>
              <AdminDashboard
                modules={modules}
                allUsers={allUsers}
                onUpdateUserRole={updateUserRole}
              />
            </Suspense>
          )}
        </main>

        {/* Global Modals */}
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          modules={modules}
          onSelectModule={handleSelectModule}
        />
      </motion.div>
    </MotionConfig>
  );
}
