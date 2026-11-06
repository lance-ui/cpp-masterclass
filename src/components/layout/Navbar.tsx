import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Search, 
  Moon, 
  Sun, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  BookOpen,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  ListTree,
  ExternalLink,
  ChevronRight,
  Code2,
  CheckCircle2
} from 'lucide-react';
import { User, AppView } from '@/types';
import { ProgressBar, Badge } from '@/components/ui';

interface NavbarProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenOutline: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser: User;
  onOpenSearchModal: () => void;
  onLogout: () => void;
  isOnline: boolean;
  progressPercentage: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  onOpenOutline,
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  onOpenSearchModal,
  onLogout,
  isOnline,
  progressPercentage
}) => {
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const navDrawerRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        accountMenuRef.current && 
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
      if (
        navDrawerRef.current &&
        !navDrawerRef.current.contains(event.target as Node)
      ) {
        setIsNavDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Close menus on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNavDrawerOpen(false);
        setIsAccountMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavClick = (view: AppView) => {
    onSelectView(view);
    setIsNavDrawerOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md pt-[env(safe-area-inset-top)] shadow-xs dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
      {/* Top Banner - Fluid edge-to-edge layout */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* BUTTON 1 (FAR TOP LEFT): Navigation Menu & Useful Actions */}
          <div className="flex items-center space-x-3">
            <div className="relative" ref={navDrawerRef}>
              <button
                type="button"
                onClick={() => setIsNavDrawerOpen(!isNavDrawerOpen)}
                className="grid size-11 place-items-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors"
                aria-label="Toggle navigation menu and quick actions"
                aria-expanded={isNavDrawerOpen}
              >
                {isNavDrawerOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>

              {/* Navigation & Quick Actions Dropdown / Slide Panel */}
              {isNavDrawerOpen && (
                <div 
                  className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  role="menu"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Platform Navigation
                    </span>
                  </div>

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleNavClick('learn')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        currentView === 'learn'
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        <span>Curriculum & Lessons</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavClick('playground')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        currentView === 'playground'
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Terminal className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        <span>C++ IDE Playground</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavClick('dashboard')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        currentView === 'dashboard'
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <LayoutDashboard className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        <span>Learning Dashboard</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 font-bold">
                        {progressPercentage}%
                      </span>
                    </button>

                    {currentUser.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => handleNavClick('admin')}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                          currentView === 'admin'
                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                          <span>Course Administration</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    )}
                  </div>

                  {/* Useful Quick Action Tools */}
                  <div className="px-3 pt-3 pb-1 border-t border-slate-100 dark:border-slate-800 mt-2">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Quick Actions
                    </span>
                  </div>

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenOutline();
                        setIsNavDrawerOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <ListTree className="w-4 h-4 text-slate-500" />
                        <span>Course Outline Drawer</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">27 Topics</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenSearchModal();
                        setIsNavDrawerOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4 text-slate-500" />
                        <span>Search Topics & Code</span>
                      </div>
                      <kbd className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                        ⌘K
                      </kbd>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Brand Logo & Title */}
            <button
              onClick={() => onSelectView('learn')}
              className="flex items-center space-x-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-700 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <span className="font-extrabold text-sm font-mono tracking-tight">C++</span>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  C++ MasterClass
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5">
                  Professional Curriculum
                </div>
              </div>
            </button>
          </div>

          {/* Center Context / Quick Tab Segment Bar */}
          <nav aria-label="Quick navigation" className="hidden md:flex items-center space-x-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => onSelectView('learn')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'learn'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lessons</span>
            </button>

            <button
              onClick={() => onSelectView('playground')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'playground'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>IDE Sandbox</span>
            </button>

            <button
              onClick={() => onSelectView('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'dashboard'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
              <span className="text-[10px] px-1 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 font-bold ml-0.5">
                {progressPercentage}%
              </span>
            </button>
          </nav>

          {/* RIGHT BUTTONS (FAR TOP RIGHT): BUTTON 2 (Theme) & BUTTON 3 (Account Menu) */}
          <div className="flex items-center space-x-2">
            
            {/* Search Quick Button */}
            <button
              onClick={onOpenSearchModal}
              className="hidden lg:flex min-h-11 items-center space-x-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors mr-1"
              aria-label="Search curriculum"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded shadow-2xs font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Offline status pill */}
            {!isOnline && (
              <div 
                role="status"
                aria-label="Offline Mode"
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-900/40"
              >
                <WifiOff className="w-3 h-3" />
                <span className="hidden sm:inline">Offline</span>
              </div>
            )}

            {/* BUTTON 2 (FAR TOP RIGHT): Theme Toggle */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="grid size-11 place-items-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors shadow-2xs"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
              ) : (
                <Moon className="w-4 h-4 animate-in spin-in-180 duration-300" />
              )}
            </button>

            {/* BUTTON 3 (FAR TOP RIGHT): Account Menu */}
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="flex min-h-11 items-center space-x-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors shadow-2xs"
                aria-label="User account menu"
                aria-expanded={isAccountMenuOpen}
              >
                <div className="w-7 h-7 rounded-lg bg-brand-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="block leading-tight font-bold">{currentUser.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">
                    {currentUser.role}
                  </span>
                </div>
              </button>

              {/* Account Dropdown Menu */}
              {isAccountMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  role="menu"
                >
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl space-y-1 mb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {currentUser.name}
                      </span>
                      <Badge tone={currentUser.role === 'admin' ? 'brand' : 'neutral'}>
                        {currentUser.role}
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block truncate font-mono">
                      {currentUser.email}
                    </span>
                  </div>

                  {/* Course Progress Summary */}
                  <div className="px-2 py-2 mb-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Curriculum Completed</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{progressPercentage}%</span>
                    </div>
                    <ProgressBar value={progressPercentage} label="Curriculum completion" className="h-1.5" />
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectView('dashboard');
                        setIsAccountMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-500" />
                      <span>My Progress Dashboard</span>
                    </button>

                    {currentUser.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectView('admin');
                          setIsAccountMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-500" />
                        <span>Admin Panel</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Thin Accent Progress Bar at the base of the top header */}
      <ProgressBar value={progressPercentage} label="Course completion" className="h-0.5 rounded-none" />
    </header>
  );
};
