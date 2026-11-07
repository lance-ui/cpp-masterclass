import type { AppView } from "@/types";

const VERSION = "0.1.0";

interface SiteFooterProps {
  onNavigate: (view: AppView) => void;
  compact?: boolean;
  /** Public marketing footer — only links that work signed-out */
  publicMode?: boolean;
}

export function SiteFooter({
  onNavigate,
  compact = false,
  publicMode = false,
}: SiteFooterProps) {
  return (
    <footer
      className={`border-t border-[var(--app-border)] bg-[var(--app-surface)] ${
        compact ? "mt-8" : "mt-auto"
      }`}
    >
      <div
        className={`page-container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4 ${
          publicMode ? "page-container--marketing" : ""
        }`}
      >
        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
          <p className="text-sm font-semibold text-[var(--app-ink)]">
            C++ MasterClass
          </p>
          <p className="text-sm text-[var(--app-muted)]">
            Structured C++ curriculum with a real g++ sandbox, quizzes, and
            progress tracking.
          </p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-[var(--app-ink)]">
            Product
          </p>
          <ul className="space-y-1.5 text-sm text-[var(--app-muted)]">
            {publicMode ? (
              <>
                <li>
                  <button
                    type="button"
                    className="hover:text-[var(--app-ink)]"
                    onClick={() => onNavigate("login")}
                  >
                    Sign in
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="hover:text-[var(--app-ink)]"
                    onClick={() => onNavigate("signup")}
                  >
                    Get started
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <button
                    type="button"
                    className="hover:text-[var(--app-ink)]"
                    onClick={() => onNavigate("learn")}
                  >
                    Lessons
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="hover:text-[var(--app-ink)]"
                    onClick={() => onNavigate("playground")}
                  >
                    Sandbox
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="hover:text-[var(--app-ink)]"
                    onClick={() => onNavigate("dashboard")}
                  >
                    Dashboard
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-[var(--app-ink)]">
            Resources
          </p>
          <ul className="space-y-1.5 text-sm text-[var(--app-muted)]">
            <li>
              <a
                href="https://isocpp.org/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[var(--app-ink)]"
              >
                ISO C++
              </a>
            </li>
            {!publicMode ? (
              <li>
                <button
                  type="button"
                  className="hover:text-[var(--app-ink)]"
                  onClick={() => onNavigate("community")}
                >
                  Community
                </button>
              </li>
            ) : null}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-[var(--app-ink)]">
            Legal
          </p>
          <ul className="space-y-1.5 text-sm text-[var(--app-muted)]">
            <li>
              <button
                type="button"
                className="hover:text-[var(--app-ink)]"
                onClick={() => onNavigate("terms")}
              >
                Terms
              </button>
            </li>
            <li>
              <button
                type="button"
                className="hover:text-[var(--app-ink)]"
                onClick={() => onNavigate("privacy")}
              >
                Privacy
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--app-border)] py-3 text-xs text-[var(--app-tertiary)]">
        <div
          className={`page-container flex flex-col items-center justify-between gap-1 sm:flex-row ${
            publicMode ? "page-container--marketing" : ""
          }`}
        >
          <span>© {new Date().getFullYear()} C++ MasterClass</span>
          <span>v{VERSION}</span>
        </div>
      </div>
    </footer>
  );
}
