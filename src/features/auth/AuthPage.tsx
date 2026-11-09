import { PublicHeader } from "@/features/marketing/PublicHeader";
import { HeroDemo } from "@/features/marketing/HeroDemo";
import { AuthForm, type AuthMode } from "@/features/auth/AuthForm";

interface AuthPageProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  googleEnabled?: boolean;
  authError?: string | null;
  nextPath: string;
  onNavigateHome: () => void;
  onNavigateLegal: (page: "terms" | "privacy") => void;
}

export function AuthPage({
  mode,
  onModeChange,
  isDarkMode,
  onToggleDarkMode,
  googleEnabled = false,
  authError = null,
  nextPath,
  onNavigateHome,
  onNavigateLegal,
}: AuthPageProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--app-canvas)] text-[var(--app-ink)]">
      <PublicHeader
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
        onSignIn={() => onModeChange("signin")}
        onGetStarted={() => onModeChange("signup")}
        enableSectionSpy={false}
        authContext={mode === "signup" ? "signup" : "login"}
      />

      <main id="main-content" className="flex flex-1">
        <div className="page-container page-container--marketing flex w-full flex-1 items-center py-6 lg:py-10">
          <div className="grid w-full items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <aside className="hidden lg:col-span-7 lg:block">
              <h2 className="max-w-lg font-display text-3xl font-semibold tracking-tight xl:text-[2.5rem] xl:leading-tight">
                Learn by writing and running real code
              </h2>
              <p className="mt-3 max-w-lg text-sm text-[var(--app-muted)] sm:text-base">
                Lessons, a live sandbox with an interactive console, quizzes, and
                progress that stays with your account.
              </p>
              <div className="mt-8">
                <HeroDemo />
              </div>
            </aside>

            <div className="flex justify-center lg:col-span-5 lg:justify-end">
              <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6">
                <AuthForm
                  mode={mode}
                  onModeChange={onModeChange}
                  googleEnabled={googleEnabled}
                  authError={authError}
                  nextPath={nextPath}
                  onNavigateLegal={onNavigateLegal}
                />
                <p className="mt-6 text-center text-xs text-[var(--app-tertiary)]">
                  <button
                    type="button"
                    className="min-h-11 hover:text-[var(--app-ink)]"
                    onClick={onNavigateHome}
                  >
                    Back to home
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
