import React, { useEffect, useRef } from "react";
import {
  BookOpen,
  Play,
  FileText,
  Code2,
  HelpCircle,
  Check,
} from "lucide-react";
import type { ActiveTab, CourseModule, User } from "@/types";

interface LessonTabBarProps {
  module: CourseModule;
  currentUser: User;
  value: ActiveTab;
  onChange: (tab: ActiveTab) => void;
}

const ALL_TABS: {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  count?: (m: CourseModule) => number;
}[] = [
  { id: "overview", label: "Overview", icon: <BookOpen className="size-3.5" /> },
  {
    id: "video",
    label: "Video",
    icon: <Play className="size-3.5" />,
    count: (m) => m.videos.length,
  },
  {
    id: "pdf",
    label: "PDF",
    icon: <FileText className="size-3.5" />,
    count: (m) => m.documents.length,
  },
  { id: "code", label: "Code", icon: <Code2 className="size-3.5" /> },
  {
    id: "quiz",
    label: "Quiz",
    icon: <HelpCircle className="size-3.5" />,
    count: (m) => m.quiz.length,
  },
];

const HASH_TABS = new Set<ActiveTab>([
  "overview",
  "video",
  "pdf",
  "code",
  "quiz",
]);

export function tabFromHash(): ActiveTab | null {
  const h = window.location.hash.replace(/^#/, "");
  if (HASH_TABS.has(h as ActiveTab)) return h as ActiveTab;
  return null;
}

export function LessonTabBar({
  module,
  currentUser,
  value,
  onChange,
}: LessonTabBarProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const quizScore = currentUser.quizScores[module.id];
  const quizDone = typeof quizScore === "number" && quizScore >= 70;

  const visible = ALL_TABS.filter((t) => {
    if (t.id === "pdf" && module.documents.length === 0) return false;
    if (t.id === "video" && module.videos.length === 0) return false;
    if (t.id === "quiz" && module.quiz.length === 0) return false;
    if (t.id === "code" && module.codeSnippets.length === 0) return false;
    return true;
  });

  // Always keep overview
  const tabs =
    visible.length > 0
      ? visible
      : ALL_TABS.filter((t) => t.id === "overview");

  useEffect(() => {
    const fromHash = tabFromHash();
    if (fromHash && fromHash !== value) {
      const allowed = tabs.some((t) => t.id === fromHash);
      if (allowed) onChange(fromHash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once from URL
  }, [module.id]);

  useEffect(() => {
    const next = `#${value}`;
    if (window.location.hash !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [value]);

  useEffect(() => {
    const onHash = () => {
      const fromHash = tabFromHash();
      if (fromHash && tabs.some((t) => t.id === fromHash)) onChange(fromHash);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [onChange, tabs]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = tabs.findIndex((t) => t.id === value);
    if (idx < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = tabs[(idx + dir + tabs.length) % tabs.length];
      if (next) onChange(next.id);
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Lesson sections"
      onKeyDown={onKeyDown}
      className="sticky top-[calc(3.5rem+2px+env(safe-area-inset-top))] z-20 -mx-4 flex snap-x snap-mandatory gap-1 overflow-x-auto rounded-[var(--radius-control)] border border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-1.5 shadow-[var(--shadow-card)] no-scrollbar sm:mx-0"
    >
      {tabs.map((t) => {
        const active = value === t.id;
        const count = t.count?.(module);
        const done = t.id === "quiz" && quizDone;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            id={`lesson-tab-${t.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={`relative flex min-h-11 shrink-0 snap-start items-center gap-1.5 px-3 font-mono text-xs font-semibold transition-colors ${
              active
                ? "text-slate-950 dark:text-brand-300"
                : "text-[var(--app-muted)] hover:text-[var(--app-ink)]"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
            {typeof count === "number" && count > 0 && (
              <span className="border border-[var(--app-border)] px-1 text-[10px]">
                {count}
              </span>
            )}
            {done && <Check className="size-3 text-emerald-600" aria-label="Done" />}
            {active && (
              <span
                className="absolute inset-x-2 bottom-0 h-0.5 bg-brand-300"
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
