import { useState, useRef, useEffect } from "react";
import {
  Search,
  Moon,
  Sun,
  ShieldCheck,
  WifiOff,
  BookOpen,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  ListTree,
  Terminal,
  Palette,
} from "lucide-react";
import type { User, AppView } from "@/types";
import { ProgressBar, Badge } from "@/components/ui";

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

const primaryNav: { id: AppView; label: string; icon: typeof BookOpen }[] = [
  { id: "learn", label: "Lessons", icon: BookOpen },
  { id: "playground", label: "Sandbox", icon: Terminal },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function Navbar({
  currentView,
  onSelectView,
  onOpenOutline,
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  onOpenSearchModal,
  onLogout,
  isOnline,
  progressPercentage,
}: NavbarProps) {
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const navDrawerRef = useRef<HTMLDivElement>(null);

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
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsNavDrawerOpen(false);
        setIsAccountMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNavClick = (view: AppView) => {
    onSelectView(view);
    setIsNavDrawerOpen(false);
  };

  const navBtn = (view: AppView, label: string, Icon: typeof BookOpen) => {
    const active = currentView === view;
    return (
      <button
        key={view}
        type="button"
        onClick={() => onSelectView(view)}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-control)] px-3 text-sm font-medium transition-colors duration-[var(--duration-fast)] ${
          active
            ? "bg-[var(--app-surface)] text-[var(--app-accent-text)] shadow-[var(--shadow-card)] ring-1 ring-[var(--app-border)]"
            : "text-[var(--app-muted)] hover:text-[var(--app-ink)]"
        }`}
      >
        <Icon className="size-3.5" aria-hidden />
        {label}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--app-border)] bg-[var(--app-surface)] pt-[env(safe-area-inset-top)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-[var(--app-surface)] focus:px-3 focus:py-2 focus:text-sm focus:shadow-[var(--shadow-raised)]"
      >
        Skip to content
      </a>

      <div className="page-container">
        <div className="flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative md:hidden" ref={navDrawerRef}>
              <button
                type="button"
                onClick={() => setIsNavDrawerOpen(!isNavDrawerOpen)}
                className="grid size-10 place-items-center rounded-[var(--radius-control)] border border-[var(--app-border)] text-[var(--app-ink)]"
                aria-label="Open navigation"
                aria-expanded={isNavDrawerOpen}
              >
                {isNavDrawerOpen ? (
                  <X className="size-4" />
                ) : (
                  <Menu className="size-4" />
                )}
              </button>

              {isNavDrawerOpen && (
                <div
                  className="absolute left-0 z-50 mt-2 w-72 rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-2 shadow-[var(--shadow-raised)]"
                  role="menu"
                >
                  <p className="px-2 py-1.5 text-xs font-medium text-[var(--app-tertiary)]">
                    Navigation
                  </p>
                  {primaryNav.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      role="menuitem"
                      onClick={() => handleNavClick(id)}
                      className={`flex w-full items-center gap-2 rounded-[var(--radius-control)] px-2 py-2.5 text-sm ${
                        currentView === id
                          ? "bg-brand-100 text-[var(--app-accent-text)] dark:bg-brand-950"
                          : "text-[var(--app-ink)] hover:bg-[var(--app-canvas)]"
                      }`}
                    >
                      <Icon className="size-4" aria-hidden />
                      {label}
                    </button>
                  ))}
                  {currentUser.role === "admin" && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleNavClick("admin")}
                      className="flex w-full items-center gap-2 rounded-[var(--radius-control)] px-2 py-2.5 text-sm text-[var(--app-ink)] hover:bg-[var(--app-canvas)]"
                    >
                      <ShieldCheck className="size-4" aria-hidden />
                      Admin
                    </button>
                  )}
                  <div className="my-1 border-t border-[var(--app-border)]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onOpenOutline();
                      setIsNavDrawerOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-[var(--radius-control)] px-2 py-2.5 text-sm text-[var(--app-muted)] hover:bg-[var(--app-canvas)]"
                  >
                    <ListTree className="size-4" aria-hidden />
                    Course outline
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onOpenSearchModal();
                      setIsNavDrawerOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-[var(--radius-control)] px-2 py-2.5 text-sm text-[var(--app-muted)] hover:bg-[var(--app-canvas)]"
                  >
                    <Search className="size-4" aria-hidden />
                    Search
                    <kbd className="ml-auto rounded border border-[var(--app-border)] px-1.5 py-0.5 font-mono text-[10px]">
                      ⌘K
                    </kbd>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onSelectView("learn")}
              className="flex items-center gap-2 text-left"
            >
              <span className="grid size-8 place-items-center rounded-[var(--radius-control)] bg-brand-300 font-mono text-xs font-semibold text-[var(--app-accent-fg)]">
                C++
              </span>
              <span className="hidden sm:block">
                <span className="block text-sm font-semibold text-[var(--app-ink)]">
                  C++ MasterClass
                </span>
                <span className="block text-xs text-[var(--app-tertiary)]">
                  Beginner to advance
                </span>
              </span>
            </button>
          </div>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-0.5 rounded-[var(--radius-control)] bg-[var(--app-canvas)] p-1 md:flex"
          >
            {primaryNav.map(({ id, label, icon }) => navBtn(id, label, icon))}
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenSearchModal}
              className="hidden min-h-9 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--app-border)] bg-[var(--app-canvas)] px-2.5 text-xs text-[var(--app-muted)] transition-colors hover:text-[var(--app-ink)] lg:inline-flex"
              aria-label="Search curriculum"
            >
              <Search className="size-3.5" aria-hidden />
              <span>Search</span>
              <kbd className="rounded border border-[var(--app-border)] bg-[var(--app-surface)] px-1.5 py-0.5 font-mono text-[10px]">
                /
              </kbd>
            </button>

            {!isOnline && (
              <div
                role="status"
                aria-label="Offline"
                className="inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-[var(--app-warning)] bg-[var(--app-warning-bg)] px-2 py-1 text-xs text-[var(--app-warning)]"
              >
                <WifiOff className="size-3" aria-hidden />
                <span className="hidden sm:inline">Offline</span>
              </div>
            )}

            <button
              type="button"
              onClick={onToggleDarkMode}
              className="grid size-9 place-items-center rounded-[var(--radius-control)] border border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-ink)]"
              aria-label={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDarkMode ? (
                <Sun className="size-4" aria-hidden />
              ) : (
                <Moon className="size-4" aria-hidden />
              )}
            </button>

            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--app-border)] px-2 text-sm"
                aria-label="User menu"
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt=""
                    className="size-6 rounded-[var(--radius-control)] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="grid size-6 place-items-center rounded-[var(--radius-control)] bg-brand-300 text-xs font-semibold text-[var(--app-accent-fg)]">
                    {currentUser.name.charAt(0)}
                  </span>
                )}
                <span className="hidden max-w-[7rem] truncate sm:inline">
                  {currentUser.name.split(" ")[0]}
                </span>
              </button>

              {isAccountMenuOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-64 rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-2 shadow-[var(--shadow-raised)]"
                  role="menu"
                >
                  <div className="mb-2 rounded-[var(--radius-control)] bg-[var(--app-canvas)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">
                        {currentUser.name}
                      </span>
                      <Badge
                        tone={
                          currentUser.role === "admin" ? "brand" : "neutral"
                        }
                      >
                        {currentUser.role}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[var(--app-muted)]">
                      {currentUser.email}
                    </p>
                  </div>

                  <div className="mb-2 px-1">
                    <div className="mb-1 flex justify-between text-xs text-[var(--app-muted)]">
                      <span>Progress</span>
                      <span className="font-medium text-[var(--app-ink)]">
                        {progressPercentage}%
                      </span>
                    </div>
                    <ProgressBar
                      value={progressPercentage}
                      label="Curriculum completion"
                      className="h-1.5"
                    />
                  </div>

                  <div className="border-t border-[var(--app-border)] pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onSelectView("dashboard");
                        setIsAccountMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-[var(--radius-control)] px-2 py-2 text-sm hover:bg-[var(--app-canvas)]"
                    >
                      <LayoutDashboard className="size-4 text-[var(--app-tertiary)]" />
                      Profile and progress
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onSelectView("design");
                        setIsAccountMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-[var(--radius-control)] px-2 py-2 text-sm hover:bg-[var(--app-canvas)]"
                    >
                      <Palette className="size-4 text-[var(--app-tertiary)]" />
                      Design system
                    </button>
                    {currentUser.role === "admin" && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onSelectView("admin");
                          setIsAccountMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-[var(--radius-control)] px-2 py-2 text-sm hover:bg-[var(--app-canvas)]"
                      >
                        <ShieldCheck className="size-4 text-[var(--app-tertiary)]" />
                        Admin
                      </button>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-[var(--radius-control)] px-2 py-2 text-sm text-[var(--app-danger)] hover:bg-[var(--app-danger-bg)]"
                    >
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label="Course completion"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercentage}
        className="h-0.5 w-full bg-[color-mix(in_srgb,var(--app-border)_80%,transparent)]"
      >
        <div
          className="h-full bg-brand-300 transition-[width] duration-[var(--duration-normal)]"
          style={{
            width: `${Math.min(100, Math.max(0, progressPercentage))}%`,
          }}
        />
      </div>
    </header>
  );
}
