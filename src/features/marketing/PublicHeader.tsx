import { useEffect, useId, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui";

const ANCHORS = [
  { id: "how-it-works", label: "How it works" },
  { id: "curriculum", label: "Curriculum" },
  { id: "faq", label: "FAQ" },
] as const;

interface PublicHeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSignIn: () => void;
  onGetStarted: () => void;
  /** When true, show Continue learning instead of auth CTAs */
  signedIn?: boolean;
  onContinue?: () => void;
  /** Highlight matching section id while scrolling the landing page */
  enableSectionSpy?: boolean;
  /**
   * On auth routes, show only the other action (no duplicate Sign in / Get started).
   * - login → Create account
   * - signup → Sign in
   */
  authContext?: "login" | "signup";
}

export function PublicHeader({
  isDarkMode,
  onToggleDarkMode,
  onSignIn,
  onGetStarted,
  signedIn = false,
  onContinue,
  enableSectionSpy = true,
  authContext,
}: PublicHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<string>("");
  const menuId = useId();

  useEffect(() => {
    if (!enableSectionSpy) return;
    const ids = ANCHORS.map((a) => a.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.35, 0.6] },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [enableSectionSpy]);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.location.hash = id;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_92%,transparent)] pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-[var(--app-surface)] focus:px-3 focus:py-2 focus:text-sm focus:shadow-[var(--shadow-raised)]"
      >
        Skip to content
      </a>
      <div className="page-container page-container--marketing">
        <div className="flex h-14 items-center gap-3">
          <button
            type="button"
            className="flex min-h-11 items-center gap-2 text-left"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              if (window.location.pathname !== "/") {
                window.history.pushState({}, "", "/");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }
            }}
            aria-label="C++ MasterClass home"
          >
            <span className="grid size-8 place-items-center rounded-[var(--radius-control)] bg-brand-300 font-mono text-xs font-semibold text-[var(--app-accent-fg)]">
              C++
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-semibold leading-tight">
                C++ MasterClass
              </span>
              <span className="block text-xs text-[var(--app-tertiary)]">
                Beginner to advance
              </span>
            </span>
          </button>

          {enableSectionSpy ? (
            <nav
              aria-label="Page sections"
              className="mx-auto hidden items-center gap-1 md:flex"
            >
              {ANCHORS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  className={`min-h-11 rounded-[var(--radius-control)] px-3 text-sm font-medium transition-colors ${
                    active === item.id
                      ? "text-[var(--app-accent-text)]"
                      : "text-[var(--app-muted)] hover:text-[var(--app-ink)]"
                  }`}
                  aria-current={active === item.id ? "true" : undefined}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          ) : (
            <div className="mx-auto hidden md:block" />
          )}

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="grid size-11 place-items-center rounded-[var(--radius-control)] border border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-ink)]"
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

            {signedIn ? (
              <Button variant="primary" onClick={onContinue}>
                Continue learning
              </Button>
            ) : authContext === "login" ? (
              <Button variant="primary" onClick={onGetStarted}>
                Create account
              </Button>
            ) : authContext === "signup" ? (
              <Button variant="secondary" onClick={onSignIn}>
                Sign in
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="hidden min-h-11 sm:inline-flex"
                  onClick={onSignIn}
                >
                  Sign in
                </Button>
                <Button variant="primary" onClick={onGetStarted}>
                  Get started
                </Button>
              </>
            )}

            {enableSectionSpy ? (
              <button
                type="button"
                className="grid size-11 place-items-center rounded-[var(--radius-control)] border border-[var(--app-border)] text-[var(--app-ink)] md:hidden"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls={menuId}
                onClick={() => setMenuOpen((v) => !v)}
              >
                {menuOpen ? (
                  <X className="size-4" aria-hidden />
                ) : (
                  <Menu className="size-4" aria-hidden />
                )}
              </button>
            ) : null}
          </div>
        </div>

        {menuOpen && enableSectionSpy ? (
          <div
            id={menuId}
            className="border-t border-[var(--app-border)] py-2 md:hidden"
          >
            <nav aria-label="Mobile sections" className="flex flex-col gap-1 pb-2">
              {ANCHORS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  className="min-h-11 rounded-[var(--radius-control)] px-3 text-left text-sm font-medium text-[var(--app-ink)] hover:bg-[var(--app-canvas)]"
                >
                  {item.label}
                </button>
              ))}
              {!signedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onSignIn();
                  }}
                  className="min-h-11 rounded-[var(--radius-control)] px-3 text-left text-sm font-medium text-[var(--app-muted)] hover:bg-[var(--app-canvas)] sm:hidden"
                >
                  Sign in
                </button>
              ) : null}
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
