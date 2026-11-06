import React from 'react';
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
  Menu
} from 'lucide-react';
import { User, AppView } from '@/types';
import { ProgressBar, Tooltip } from '@/components/ui';

interface NavbarProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenOutline: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser: User;
  onOpenAuthModal: () => void;
  onOpenSearchModal: () => void;
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
  onOpenAuthModal,
  onOpenSearchModal,
  isOnline,
  progressPercentage
}) => {
  const mobileNavItems: { view: AppView; label: string; icon: React.ReactNode }[] = [
    { view: 'learn', label: 'Learn', icon: <BookOpen className="size-5" /> },
    { view: 'playground', label: 'Playground', icon: <Terminal className="size-5" /> },
    { view: 'dashboard', label: `Progress ${progressPercentage}%`, icon: <LayoutDashboard className="size-5" /> },
    ...(currentUser.role === 'admin'
      ? [{ view: 'admin' as const, label: 'Admin', icon: <ShieldCheck className="size-5" /> }]
      : [])
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white pt-[env(safe-area-inset-top)] shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Top Banner & Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onOpenOutline}
              className="grid size-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Open course outline"
            >
              <Menu className="size-5" />
            </button>
            <button
              onClick={() => onSelectView('learn')}
              className="flex items-center space-x-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-700 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                <span className="font-extrabold text-sm tracking-tight font-mono">C++</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  C++ MasterClass
                </span>
                <span className="text-[11px] text-slate-500 block -mt-0.5">
                  Beginner to Advance • 27 Modules
                </span>
              </div>
            </button>

          </div>

          {/* Primary navigation */}
          <nav className="hidden lg:flex items-center space-x-1 text-sm font-medium">
            <button
              onClick={() => onSelectView('learn')}
              className={`flex min-h-11 items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'learn'
                  ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Tutorials</span>
            </button>

            <button
              onClick={() => onSelectView('playground')}
              className={`flex min-h-11 items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'playground'
                  ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Terminal className="w-4 h-4 text-brand-500" />
              <span>C++ Playground</span>
            </button>

            <button
              onClick={() => onSelectView('dashboard')}
              className={`flex min-h-11 items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300 font-bold">
                {progressPercentage}%
              </span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => onSelectView('admin')}
                className={`flex min-h-11 items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors ${
                  currentView === 'admin'
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Admin Panel</span>
              </button>
            )}
          </nav>

          {/* Right Controls: Search, Theme, Offline, User */}
          <div className="flex items-center space-x-2">
            {/* Search Button */}
            <button
              onClick={onOpenSearchModal}
              className="flex min-h-11 items-center space-x-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors"
              aria-label="Search curriculum"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded shadow-2xs font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Offline Badge */}
            <Tooltip content={isOnline
              ? 'Online. Drive media requires an internet connection.'
              : 'Offline. Drive media may be unavailable.'}>
              <div
              role="status"
              aria-label={isOnline ? 'Online' : 'Offline'}
              tabIndex={0}
              className={`flex min-h-11 items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-medium ${
                isOnline 
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400' 
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
              }`}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden xl:inline">{isOnline ? 'Online' : 'Offline Mode'}</span>
              </div>
            </Tooltip>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="grid size-11 place-items-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile Button */}
            <button
              onClick={onOpenAuthModal}
              className="flex min-h-11 items-center space-x-2 px-2 sm:px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors"
              aria-label="User account and role"
            >
              <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block leading-tight font-semibold">{currentUser.name.split(' ')[0]}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">
                  {currentUser.role}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <nav
        aria-label="Primary navigation"
        className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] border-t border-slate-200 bg-white/95 px-2 pt-1 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden"
      >
        {mobileNavItems.map(item => (
          <button
            key={item.view}
            type="button"
            onClick={() => onSelectView(item.view)}
            aria-current={currentView === item.view ? 'page' : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-medium ${
              currentView === item.view
                ? 'text-brand-700 dark:text-brand-300'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <ProgressBar value={progressPercentage} label="Course completion" className="h-1 rounded-none" />
    </header>
  );
};
