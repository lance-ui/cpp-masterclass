import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui";
import { googleSignInUrl } from "@/utils/authApi";
import type { UserRole } from "@/types";

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordChecks(password: string) {
  return {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
  };
}

export type AuthMode = "signin" | "signup";

interface AuthFormProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onLogin: (
    email: string,
    password?: string,
  ) =>
    | Promise<{ success: boolean; error?: string }>
    | { success: boolean; error?: string };
  onSignup: (
    name: string,
    email: string,
    role: UserRole,
    password?: string,
  ) =>
    | Promise<{ success: boolean; error?: string }>
    | { success: boolean; error?: string };
  googleEnabled?: boolean;
  authError?: string | null;
  nextPath?: string;
  onNavigateLegal?: (page: "terms" | "privacy") => void;
}

type FieldKey = "name" | "email" | "password";

export function AuthForm({
  mode,
  onModeChange,
  onLogin,
  onSignup,
  googleEnabled = false,
  authError = null,
  nextPath = "/lessons",
  onNavigateLegal,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldKey, string>>
  >({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>(
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const formErrorId = useId();

  useEffect(() => {
    if (authError) {
      setFormError(friendlyAuthError(authError));
    }
  }, [authError]);

  useEffect(() => {
    const el = mode === "signup" ? nameRef.current : emailRef.current;
    el?.focus();
  }, [mode]);

  /** Sync React state from the live DOM (autofill often skips onChange). */
  const syncFromDom = () => {
    const form = formRef.current;
    if (!form) return { name: name, email: email, password: password };
    const data = new FormData(form);
    const nextName = String(data.get("name") ?? nameRef.current?.value ?? "");
    const nextEmail = String(data.get("email") ?? emailRef.current?.value ?? "");
    const nextPassword = String(
      data.get("password") ?? passwordRef.current?.value ?? "",
    );
    if (nextName !== name) setName(nextName);
    if (nextEmail !== email) setEmail(nextEmail);
    if (nextPassword !== password) setPassword(nextPassword);
    return { name: nextName, email: nextEmail, password: nextPassword };
  };

  // Chrome autofill fires animationstart on the filled control
  useEffect(() => {
    const inputs = [emailRef.current, passwordRef.current, nameRef.current].filter(
      Boolean,
    ) as HTMLInputElement[];

    const onAutoFill = (e: AnimationEvent) => {
      if (!/auto-fill|onAutoFill/i.test(e.animationName)) return;
      syncFromDom();
    };
    const onInput = () => syncFromDom();

    for (const el of inputs) {
      el.addEventListener("animationstart", onAutoFill as EventListener);
      el.addEventListener("input", onInput);
      el.addEventListener("change", onInput);
    }
    return () => {
      for (const el of inputs) {
        el.removeEventListener("animationstart", onAutoFill as EventListener);
        el.removeEventListener("input", onInput);
        el.removeEventListener("change", onInput);
      }
    };
    // Re-bind when mode toggles name field in/out of the DOM
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const checks = passwordChecks(password);
  const passwordOk = checks.length && checks.letter && checks.number;

  const validateField = (
    field: FieldKey,
    value: string,
    currentMode = mode,
  ) => {
    if (field === "name") {
      if (currentMode === "signup" && !value.trim()) return "Enter your name.";
      return undefined;
    }
    if (field === "email") {
      if (!value.trim()) return "Enter your email.";
      if (!EMAIL_RE.test(value.trim())) return "Enter a valid email address.";
      return undefined;
    }
    if (field === "password") {
      if (!value) return "Enter a password.";
      if (currentMode === "signup") {
        const c = passwordChecks(value);
        if (!(c.length && c.letter && c.number)) {
          return "Password does not meet the requirements.";
        }
      }
      return undefined;
    }
    return undefined;
  };

  const setFieldValue = (field: FieldKey, value: string) => {
    if (field === "name") setName(value);
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);

    setFieldErrors((prev) => {
      if (!touched[field] && !prev[field]) return prev;
      const nextErr = validateField(field, value);
      if (prev[field] === nextErr) return prev;
      return { ...prev, [field]: nextErr };
    });
  };

  const blurField = (field: FieldKey) => {
    const live = syncFromDom();
    const value = live[field];
    setTouched((t) => ({ ...t, [field]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [field]: validateField(field, value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    const live = syncFromDom();
    const nextErrors = {
      name: validateField("name", live.name),
      email: validateField("email", live.email),
      password: validateField("password", live.password),
    };
    setFieldErrors(nextErrors);
    setTouched({ name: true, email: true, password: true });
    if (nextErrors.name || nextErrors.email || nextErrors.password) {
      return;
    }

    setBusy(true);
    try {
      if (mode === "signin") {
        const res = await onLogin(live.email.trim(), live.password);
        if (!res.success) {
          setFormError(
            friendlyAuthError(res.error) || "Incorrect email or password.",
          );
        }
      } else {
        const res = await onSignup(
          live.name.trim(),
          live.email.trim(),
          "student",
          live.password,
        );
        if (!res.success) {
          setFormError(res.error || "Could not create the account.");
        } else {
          setSuccessMsg("Account created. Loading your workspace.");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const googleHref = `${googleSignInUrl()}?next=${encodeURIComponent(nextPath)}`;

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
            setFormError(null);
            setSuccessMsg(null);
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
            setFormError(null);
            setSuccessMsg(null);
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
          Access lessons, the sandbox, quizzes, and progress tracking.
        </p>
      </div>

      {googleEnabled ? (
        <>
          <a
            href={googleHref}
            className="inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-[var(--radius-control)] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 text-base font-medium hover:bg-[var(--app-canvas)] sm:text-sm"
          >
            <GoogleMark className="size-5" />
            Continue with Google
          </a>
          <div className="flex items-center gap-3 text-xs text-[var(--app-tertiary)]">
            <span className="h-px flex-1 bg-[var(--app-border)]" />
            or
            <span className="h-px flex-1 bg-[var(--app-border)]" />
          </div>
        </>
      ) : null}

      {formError ? (
        <div
          id={formErrorId}
          role="alert"
          className="flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--app-danger)] bg-[var(--app-danger-bg)] p-3 text-sm text-[var(--app-danger)]"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1 space-y-2">
            <p>{formError}</p>
            {authError ? (
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

      {successMsg ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--app-success)] bg-[var(--app-success-bg)] p-3 text-sm text-[var(--app-success)]"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{successMsg}</span>
        </div>
      ) : null}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
        aria-describedby={formError ? formErrorId : undefined}
      >
        {mode === "signup" ? (
          <Field
            id={nameId}
            label="Name"
            error={touched.name ? fieldErrors.name : undefined}
          >
            <input
              ref={nameRef}
              id={nameId}
              type="text"
              name="name"
              autoComplete="name"
              autoFocus={mode === "signup"}
              value={name}
              onChange={(e) => setFieldValue("name", e.target.value)}
              onBlur={() => blurField("name")}
              className={inputClass(Boolean(touched.name && fieldErrors.name))}
              placeholder="Ada"
              aria-invalid={Boolean(touched.name && fieldErrors.name) || undefined}
              aria-describedby={
                touched.name && fieldErrors.name ? `${nameId}-error` : undefined
              }
            />
          </Field>
        ) : null}

        <Field
          id={emailId}
          label="Email"
          error={touched.email ? fieldErrors.email : undefined}
        >
          <input
            ref={emailRef}
            id={emailId}
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            autoFocus={mode === "signin"}
            value={email}
            onChange={(e) => setFieldValue("email", e.target.value)}
            onBlur={() => blurField("email")}
            onFocus={(e) =>
              e.currentTarget.scrollIntoView({
                block: "center",
                behavior: "smooth",
              })
            }
            className={inputClass(Boolean(touched.email && fieldErrors.email))}
            placeholder="you@example.com"
            aria-invalid={
              Boolean(touched.email && fieldErrors.email) || undefined
            }
            aria-describedby={
              touched.email && fieldErrors.email
                ? `${emailId}-error`
                : undefined
            }
          />
        </Field>

        <Field
          id={passwordId}
          label="Password"
          error={touched.password ? fieldErrors.password : undefined}
        >
          <div className="relative">
            <input
              ref={passwordRef}
              id={passwordId}
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setFieldValue("password", e.target.value)}
              onBlur={() => blurField("password")}
              onFocus={(e) =>
                e.currentTarget.scrollIntoView({
                  block: "center",
                  behavior: "smooth",
                })
              }
              className={`${inputClass(Boolean(touched.password && fieldErrors.password))} pr-12`}
              placeholder="••••••••"
              aria-invalid={
                Boolean(touched.password && fieldErrors.password) || undefined
              }
              aria-describedby={
                touched.password && fieldErrors.password
                  ? `${passwordId}-error`
                  : undefined
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center text-[var(--app-tertiary)]"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </Field>

        {mode === "signup" ? (
          <ul
            className="space-y-1 text-xs text-[var(--app-muted)]"
            aria-label="Account password rules"
          >
            <CheckItem ok={checks.length} label="At least 8 characters" />
            <CheckItem ok={checks.letter} label="Contains a letter" />
            <CheckItem ok={checks.number} label="Contains a number" />
          </ul>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          loading={busy}
          className="w-full text-base sm:text-sm"
        >
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      {mode === "signup" ? (
        <p className="text-xs text-[var(--app-muted)]">
          By creating an account you agree to the{" "}
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
      ) : null}
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[var(--app-ink)]">
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className="text-xs text-[var(--app-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`size-1.5 rounded-full ${ok ? "bg-[var(--app-success)]" : "bg-[var(--app-border-strong)]"}`}
        aria-hidden
      />
      <span className={ok ? "text-[var(--app-success)]" : undefined}>
        {label}
      </span>
    </li>
  );
}

/** Single border + matching focus ring — never stack global outline on top. */
function inputClass(invalid: boolean) {
  const base =
    "auth-input min-h-11 w-full rounded-[var(--radius-control)] border bg-[var(--app-surface)] px-3 py-2 text-base text-[var(--app-ink)] placeholder:text-[var(--app-disabled)] outline-none sm:text-sm";
  if (invalid) {
    return `${base} border-[var(--app-danger)] focus:border-[var(--app-danger)] focus-visible:border-[var(--app-danger)] focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--app-danger)_35%,transparent)]`;
  }
  return `${base} border-[var(--app-border)] focus:border-[var(--app-accent)] focus-visible:border-[var(--app-accent)] focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--app-accent)_28%,transparent)]`;
}

function friendlyAuthError(message: string | null | undefined): string {
  if (!message) return "Incorrect email or password.";
  const lower = message.toLowerCase();
  if (
    lower.includes("invalid email or password") ||
    lower.includes("sign-in failed") ||
    lower.includes("incorrect")
  ) {
    return "Incorrect email or password.";
  }
  if (lower.includes("access_denied") || lower.includes("cancelled")) {
    return "Google sign-in was cancelled. You can try again or use email.";
  }
  if (lower.includes("not configured") || lower.includes("misconfig")) {
    return "Google sign-in is unavailable right now. Use email, or try again later.";
  }
  if (lower.includes("state") || lower.includes("redirect")) {
    return "Sign-in could not be completed. Please try again.";
  }
  return message;
}
