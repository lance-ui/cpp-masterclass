import { useEffect, useId, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { googleSignInUrl } from "@/utils/authApi";

function GoogleMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export type AuthMode = "signin" | "signup";

interface AuthFormProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  googleEnabled?: boolean;
  authError?: string | null;
  nextPath?: string;
  onNavigateLegal?: (page: "terms" | "privacy") => void;
}

export function AuthForm({
  mode,
  onModeChange,
  googleEnabled = false,
  authError = null,
  nextPath = "/lessons",
  onNavigateLegal,
}: AuthFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const formErrorId = useId();
  const googleHref = `${googleSignInUrl()}?next=${encodeURIComponent(nextPath)}`;

  useEffect(() => {
    if (authError) {
      setFormError(friendlyAuthError(authError));
    }
  }, [authError]);

  useEffect(() => {
    if (!googleEnabled && !authError) {
      setFormError(
        "Google sign-in is not configured on this server. Ask the host to set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      );
    } else if (googleEnabled && !authError) {
      setFormError(null);
    }
  }, [googleEnabled, authError]);

  return (
    <div className="space-y-5">
      <div
        className="grid grid-cols-2 gap-1 rounded-[var(--radius-control)] border border-[var(--app-border)] bg-[var(--app-canvas)] p-1"
        role="tablist"
        aria-label="Authentication mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          onClick={() => {
            onModeChange("signin");
            if (!authError) setFormError(null);
          }}
          className={`min-h-11 rounded-[var(--radius-control)] text-sm font-medium ${
            mode === "signin"
              ? "bg-[var(--app-surface)] text-[var(--app-ink)] shadow-[var(--shadow-card)]"
              : "text-[var(--app-muted)]"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          onClick={() => {
            onModeChange("signup");
            if (!authError) setFormError(null);
          }}
          className={`min-h-11 rounded-[var(--radius-control)] text-sm font-medium ${
            mode === "signup"
              ? "bg-[var(--app-surface)] text-[var(--app-ink)] shadow-[var(--shadow-card)]"
              : "text-[var(--app-muted)]"
          }`}
        >
          Create account
        </button>
      </div>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {mode === "signin" ? "Sign in" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-[var(--app-muted)]">
          Continue with Google to access lessons, the sandbox, quizzes, and
          progress tracking.
        </p>
      </div>

      {formError ? (
        <div
          id={formErrorId}
          role="alert"
          className="flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--app-danger)] bg-[var(--app-danger-bg)] p-3 text-sm text-[var(--app-danger)]"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1 space-y-2">
            <p>{formError}</p>
            {googleEnabled && authError ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFormError(null);
                  window.location.href = googleHref;
                }}
              >
                Try Google again
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {googleEnabled ? (
        <a
          href={googleHref}
          className="inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-[var(--radius-control)] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 text-base font-medium hover:bg-[var(--app-canvas)] sm:text-sm"
        >
          <GoogleMark className="size-5" />
          Continue with Google
        </a>
      ) : (
        <Button type="button" variant="primary" disabled className="w-full">
          Google sign-in unavailable
        </Button>
      )}

      <p className="text-xs text-[var(--app-muted)]">
        By continuing you agree to the{" "}
        <button
          type="button"
          className="text-[var(--app-accent-text)] underline-offset-2 hover:underline"
          onClick={() => onNavigateLegal?.("terms")}
        >
          Terms
        </button>{" "}
        and{" "}
        <button
          type="button"
          className="text-[var(--app-accent-text)] underline-offset-2 hover:underline"
          onClick={() => onNavigateLegal?.("privacy")}
        >
          Privacy Policy
        </button>
        .
      </p>
    </div>
  );
}

function friendlyAuthError(message: string | null | undefined): string {
  if (!message) return "Sign-in could not be completed. Please try again.";
  const lower = message.toLowerCase();
  if (lower.includes("access_denied") || lower.includes("cancelled")) {
    return "Google sign-in was cancelled. You can try again.";
  }
  if (lower.includes("not configured") || lower.includes("misconfig")) {
    return "Google sign-in is unavailable right now. Try again later.";
  }
  if (lower.includes("state") || lower.includes("redirect")) {
    return "Sign-in could not be completed. Please try again.";
  }
  return message;
}
