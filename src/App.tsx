/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect, useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { COURSE_MODULES } from "@/data/curriculumData";
import type { AppView, ActiveTab } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LessonViewer } from "@/features/lessons/LessonViewer";
import { SearchModal } from "@/components/common/SearchModal";
import { DocumentMeta } from "@/components/common/DocumentMeta";
import { LandingPage } from "@/features/marketing/LandingPage";
import { AuthPage } from "@/features/auth/AuthPage";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { useTheme } from "@/hooks/useTheme";
import { PageContainer, PageHeader, Skeleton } from "@/components/ui";
import { ShortcutsDialog } from "@/components/common/ShortcutsDialog";
import { readNextFromSearch, safeNextPath } from "@/utils/safeNextPath";

const CodePlayground = lazy(() =>
  import("@/features/playground/CodePlayground").then((module) => ({
    default: module.CodePlayground,
  })),
);
const StudentDashboard = lazy(() =>
  import("@/features/dashboard/StudentDashboard").then((module) => ({
    default: module.StudentDashboard,
  })),
);
const AdminDashboard = lazy(() =>
  import("@/features/admin/AdminDashboard").then((module) => ({
    default: module.AdminDashboard,
  })),
);
const CommunityView = lazy(() =>
  import("@/features/community/CommunityView").then((module) => ({
    default: module.CommunityView,
  })),
);
const DesignSystemView = lazy(() =>
  import("@/features/design/DesignSystemView").then((module) => ({
    default: module.DesignSystemView,
  })),
);
const LessonsCatalog = lazy(() =>
  import("@/features/lessons/LessonsCatalog").then((module) => ({
    default: module.LessonsCatalog,
  })),
);
const TermsPage = lazy(() =>
  import("@/features/legal/LegalPages").then((module) => ({
    default: module.TermsPage,
  })),
);
const PrivacyPage = lazy(() =>
  import("@/features/legal/LegalPages").then((module) => ({
    default: module.PrivacyPage,
  })),
);

const VIEW_PATHS: Record<AppView, string> = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  learn: "/lessons",
  playground: "/sandbox",
  dashboard: "/dashboard",
  admin: "/admin",
  community: "/community",
  design: "/design",
  terms: "/terms",
  privacy: "/privacy",
};

const PROTECTED_VIEWS = new Set<AppView>([
  "learn",
  "playground",
  "dashboard",
  "admin",
  "community",
  "design",
]);

const PUBLIC_VIEWS = new Set<AppView>([
  "landing",
  "login",
  "signup",
  "terms",
  "privacy",
]);

function pathToView(pathname: string): AppView | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  // Legacy: signed-in home used to be "/"
  if (normalized === "/") return "landing";
  const entry = Object.entries(VIEW_PATHS).find(([, path]) => path === normalized);
  return entry ? (entry[0] as AppView) : null;
}

function ViewLoadingState() {
  return (
    <div
      className="w-full flex-1 space-y-4 p-6"
      role="status"
      aria-label="Loading view"
    >
      <Skeleton lines={1} className="max-w-sm" />
      <Skeleton lines={6} />
    </div>
  );
}

function readAuthErrorFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("authError");
    if (err) {
      params.delete("authError");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", next);
    }
    return err;
  } catch {
    return null;
  }
}

function pushPath(path: string, view: AppView) {
  if (window.location.pathname !== path) {
    window.history.pushState({ view }, "", path);
  }
}

export default function App() {
  const modules = COURSE_MODULES;
  const [pathname, setPathname] = useState(window.location.pathname);
  const initialView = pathToView(window.location.pathname) ?? "landing";
  const [currentView, setCurrentView] = useState<AppView>(initialView);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [showLessonsCatalog, setShowLessonsCatalog] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [authError] = useState(() => readAuthErrorFromUrl());
  const [pendingNext] = useState(() =>
    readNextFromSearch(window.location.search),
  );

  const {
    currentUser,
    setCurrentUser,
    allUsers,
    login,
    signup,
    logout,
    updateUserRole,
    authReady,
    authConfig,
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
    progressPercentage,
  } = useProgress(modules, currentUser, setCurrentUser);

  const navigate = (view: AppView, opts?: { next?: string }) => {
    let path = VIEW_PATHS[view];
    if ((view === "login" || view === "signup") && opts?.next) {
      const safe = safeNextPath(opts.next);
      path = `${path}?next=${encodeURIComponent(safe)}`;
    }
    setCurrentView(view);
    if (view === "learn") setShowLessonsCatalog(true);
    const targetPath = path.split("?")[0];
    if (
      window.location.pathname !== targetPath ||
      (path.includes("?") && window.location.search !== `?${path.split("?")[1]}`)
    ) {
      window.history.pushState({ view }, "", path);
      setPathname(targetPath);
    }
  };

  const goLogin = (mode: "signin" | "signup", next = pendingNext) => {
    navigate(mode === "signup" ? "signup" : "login", { next });
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      setPathname(path);
      const view = pathToView(path);
      if (view) setCurrentView(view);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Auth-aware redirects
  useEffect(() => {
    if (!authReady) return;
    const view = pathToView(window.location.pathname) ?? "landing";
    const searchNext = readNextFromSearch(window.location.search);

    if (!currentUser) {
      if (PROTECTED_VIEWS.has(view)) {
        const next = safeNextPath(VIEW_PATHS[view]);
        const target: AppView = "login";
        const path = `/login?next=${encodeURIComponent(next)}`;
        setCurrentView(target);
        if (
          window.location.pathname !== "/login" ||
          !window.location.search.includes("next=")
        ) {
          window.history.replaceState({ view: target }, "", path);
          setPathname("/login");
        }
        return;
      }
      // Legacy "/" was the old auth+landing combo; keep landing public
      if (view === "login" || view === "signup" || PUBLIC_VIEWS.has(view)) {
        setCurrentView(view);
      }
      return;
    }

    // Signed in: leave marketing/auth for lessons (honor next)
    if (view === "landing" || view === "login" || view === "signup") {
      const destPath = safeNextPath(
        view === "landing" ? "/lessons" : searchNext,
      );
      const destView = pathToView(destPath.split("?")[0]) ?? "learn";
      setCurrentView(destView);
      pushPath(destPath.split("?")[0], destView);
      setPathname(destPath.split("?")[0]);
      if (destView === "learn") setShowLessonsCatalog(true);
      return;
    }

    setCurrentView(view);
  }, [authReady, currentUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentUser) return;
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }
      if (!typing && e.key === "/") {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }
      if (!typing && e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentUser]);

  const handleSelectModule = (
    moduleId: string,
    tab: ActiveTab = "overview",
  ) => {
    selectModule(moduleId, tab);
    setShowLessonsCatalog(false);
    setCurrentView("learn");
    const path = VIEW_PATHS.learn;
    if (window.location.pathname !== path) {
      window.history.pushState({ view: "learn" }, "", path);
      setPathname(path);
    }
    setIsOutlineOpen(false);
  };

  if (!authReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--app-canvas)] text-[var(--app-ink)]">
        <div className="w-48 space-y-3" role="status" aria-label="Loading session">
          <Skeleton lines={1} />
          <Skeleton lines={2} />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (currentView === "terms" || currentView === "privacy") {
      return (
        <div className="flex min-h-dvh flex-col bg-[var(--app-canvas)] text-[var(--app-ink)]">
          <DocumentMeta pathname={pathname} />
          <Suspense fallback={<ViewLoadingState />}>
            {currentView === "terms" ? (
              <TermsPage onBack={() => navigate("landing")} />
            ) : (
              <PrivacyPage onBack={() => navigate("landing")} />
            )}
          </Suspense>
          <SiteFooter onNavigate={navigate} publicMode />
        </div>
      );
    }

    const authModeView =
      currentView === "signup"
        ? "signup"
        : currentView === "login" || PROTECTED_VIEWS.has(currentView)
          ? "login"
          : null;

    if (authModeView) {
      const nextPath = PROTECTED_VIEWS.has(currentView)
        ? safeNextPath(VIEW_PATHS[currentView])
        : readNextFromSearch(window.location.search);
      return (
        <>
          <DocumentMeta pathname={authModeView === "signup" ? "/signup" : "/login"} />
          <AuthPage
            mode={authModeView === "signup" ? "signup" : "signin"}
            onModeChange={(mode) => goLogin(mode, nextPath)}
            onLogin={login}
            onSignup={signup}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            googleEnabled={authConfig.googleEnabled}
            authError={authError}
            nextPath={nextPath}
            onNavigateHome={() => navigate("landing")}
            onNavigateLegal={(page) => navigate(page)}
          />
        </>
      );
    }

    return (
      <>
        <DocumentMeta pathname="/" />
        <LandingPage
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onSignIn={() => goLogin("signin")}
          onGetStarted={() => goLogin("signup")}
          onNavigate={navigate}
        />
      </>
    );
  }

  const showFooter =
    currentView === "dashboard" ||
    currentView === "design" ||
    currentView === "terms" ||
    currentView === "privacy" ||
    currentView === "community";

  return (
    <MotionConfig reducedMotion="user">
      <DocumentMeta pathname={pathname} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.16 }}
        className={`app-with-bottom-nav flex flex-col bg-[var(--app-canvas)] font-sans text-[var(--app-ink)] transition-colors ${
          currentView === "playground"
            ? "h-dvh overflow-hidden"
            : "min-h-dvh"
        }`}
      >
        <Navbar
          currentView={currentView}
          onSelectView={navigate}
          onOpenOutline={() => setIsOutlineOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          currentUser={currentUser}
          onOpenSearchModal={() => setIsSearchOpen(true)}
          onLogout={() => {
            void logout().then(() => {
              navigate("landing");
            });
          }}
          isOnline={isOnline}
          progressPercentage={progressPercentage}
        />

        <main
          id="main-content"
          className={`flex w-full flex-1 flex-col ${
            currentView === "playground" ? "min-h-0 overflow-hidden" : ""
          }`}
        >
          {currentView === "learn" && showLessonsCatalog && (
            <Suspense fallback={<ViewLoadingState />}>
              <LessonsCatalog
                modules={modules}
                currentUser={currentUser}
                onSelectModule={(id) => handleSelectModule(id, "overview")}
              />
            </Suspense>
          )}

          {currentView === "learn" && !showLessonsCatalog && (
            <div className="flex w-full flex-1 flex-col lg:flex-row">
              <Sidebar
                modules={modules}
                selectedModuleId={selectedModuleId}
                onSelectModule={(id) => handleSelectModule(id, "overview")}
                currentUser={currentUser}
                onToggleBookmark={toggleBookmark}
                isOpen={isOutlineOpen}
                onClose={() => setIsOutlineOpen(false)}
              />
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
                onOpenSandbox={() => navigate("playground")}
                onBackToCatalog={() => setShowLessonsCatalog(true)}
              />
            </div>
          )}

          {currentView === "playground" && (
            <PageContainer className="flex min-h-0 w-full flex-1 flex-col overflow-hidden !py-3 lg:!py-4">
              <PageHeader
                title="Sandbox"
                description="Compile and run C++20 with a real sandboxed g++ toolchain."
              />
              <div className="min-h-0 flex-1 overflow-hidden">
                <Suspense fallback={<ViewLoadingState />}>
                  <CodePlayground />
                </Suspense>
              </div>
            </PageContainer>
          )}

          {currentView === "dashboard" && (
            <Suspense fallback={<ViewLoadingState />}>
              <StudentDashboard
                currentUser={currentUser}
                modules={modules}
                onSelectModule={handleSelectModule}
                onBrowseLessons={() => {
                  setShowLessonsCatalog(true);
                  navigate("learn");
                }}
                onOpenSandbox={() => navigate("playground")}
              />
            </Suspense>
          )}

          {currentView === "admin" && (
            <Suspense fallback={<ViewLoadingState />}>
              <AdminDashboard
                modules={modules}
                allUsers={allUsers}
                onUpdateUserRole={updateUserRole}
              />
            </Suspense>
          )}

          {currentView === "community" && (
            <Suspense fallback={<ViewLoadingState />}>
              <CommunityView />
            </Suspense>
          )}

          {currentView === "design" && (
            <Suspense fallback={<ViewLoadingState />}>
              <DesignSystemView
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
              />
            </Suspense>
          )}

          {currentView === "terms" && (
            <Suspense fallback={<ViewLoadingState />}>
              <TermsPage onBack={() => navigate("learn")} />
            </Suspense>
          )}

          {currentView === "privacy" && (
            <Suspense fallback={<ViewLoadingState />}>
              <PrivacyPage onBack={() => navigate("learn")} />
            </Suspense>
          )}
        </main>

        {showFooter ? <SiteFooter onNavigate={navigate} /> : null}

        <BottomNav currentView={currentView} onSelectView={navigate} />

        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          modules={modules}
          onSelectModule={handleSelectModule}
          onQuickAction={(action) => {
            setIsSearchOpen(false);
            if (action === "sandbox") navigate("playground");
            if (action === "dashboard") navigate("dashboard");
            if (action === "lessons") navigate("learn");
            if (action === "theme") toggleDarkMode();
          }}
        />

        <ShortcutsDialog
          open={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />
      </motion.div>
    </MotionConfig>
  );
}
