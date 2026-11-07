import { useMemo } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  Play,
  Terminal,
} from "lucide-react";
import type { CourseModule, User } from "@/types";
import { calculateOverallProgress } from "@/utils/courseLogic";
import { Button, PageContainer, ProgressBar } from "@/components/ui";
import {
  getActivityStreak,
  getLast7DaysActivity,
} from "@/utils/activity";
import { ModuleProgressMap } from "@/features/dashboard/ModuleProgressMap";

interface StudentDashboardProps {
  currentUser: User;
  modules: CourseModule[];
  onSelectModule: (
    moduleId: string,
    tab?: "video" | "pdf" | "code" | "quiz" | "overview",
  ) => void;
  onBrowseLessons: () => void;
  onOpenSandbox: () => void;
}

function moduleState(
  mod: CourseModule,
  user: User,
): "done" | "progress" | "todo" {
  if (user.completedModuleIds.includes(mod.id)) return "done";
  if (
    user.recentModuleIds.includes(mod.id) ||
    user.quizScores[mod.id] != null ||
    Boolean(user.notes[mod.id])
  ) {
    return "progress";
  }
  return "todo";
}

export function StudentDashboard({
  currentUser,
  modules,
  onSelectModule,
  onBrowseLessons,
  onOpenSandbox,
}: StudentDashboardProps) {
  const quizEntries = useMemo(
    () =>
      Object.entries(currentUser.quizScores)
        .map(([moduleId, score]) => ({
          moduleId,
          score,
          title:
            modules.find((m) => m.id === moduleId)?.title ??
            moduleId.slice(0, 8),
          number:
            modules.find((m) => m.id === moduleId)?.moduleNumber ?? 0,
        }))
        .sort((a, b) => a.number - b.number)
        .slice(-10),
    [currentUser.quizScores, modules],
  );

  const quizScores = Object.values(currentUser.quizScores);
  const avgQuizScore =
    quizScores.length > 0
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : null;
  const completion = calculateOverallProgress(
    currentUser.completedModuleIds,
    modules.length,
  );

  const bookmarkedModules = modules.filter((m) =>
    currentUser.bookmarkedModuleIds.includes(m.id),
  );
  const recentModules = currentUser.recentModuleIds
    .map((id) => modules.find((m) => m.id === id))
    .filter((m): m is CourseModule => !!m);

  const firstModule = modules[0];
  const continueModule =
    recentModules[0] ??
    modules.find((m) => !currentUser.completedModuleIds.includes(m.id)) ??
    firstModule;

  const isNewUser =
    currentUser.completedModuleIds.length === 0 &&
    currentUser.recentModuleIds.length === 0 &&
    quizScores.length === 0 &&
    currentUser.bookmarkedModuleIds.length === 0;

  const activityDays = getLast7DaysActivity(currentUser.id);
  const streak = getActivityStreak(currentUser.id);
  const maxActivity = Math.max(1, ...activityDays.map((d) => d.count));

  const continueProgress = continueModule
    ? currentUser.completedModuleIds.includes(continueModule.id)
      ? 100
      : currentUser.quizScores[continueModule.id] != null
        ? 70
        : currentUser.recentModuleIds.includes(continueModule.id)
          ? 35
          : 0
    : 0;

  if (isNewUser && firstModule) {
    return (
      <PageContainer>
        <div data-dashboard-state="new">
        <header className="mb-6">
          <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Dashboard
          </h1>
        </header>

        <div className="space-y-6">
          <section className="rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6 lg:max-w-3xl">
            <p className="text-xs text-[var(--app-tertiary)]">
              {firstModule.category} · {firstModule.readingTime}
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight sm:text-xl">
              Start with Module {firstModule.moduleNumber}: {firstModule.title}
            </h2>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                onClick={() => onSelectModule(firstModule.id, "overview")}
              >
                <Play className="size-3.5 fill-current" aria-hidden />
                Start module
              </Button>
              <button
                type="button"
                onClick={onBrowseLessons}
                className="min-h-11 text-sm text-[var(--app-muted)] underline-offset-2 hover:text-[var(--app-ink)] hover:underline"
              >
                Browse all lessons
              </button>
            </div>
          </section>

          <p className="text-sm text-[var(--app-muted)]">
            0 of {modules.length} modules complete
          </p>

          <ul className="grid gap-4 sm:grid-cols-3 lg:max-w-3xl">
            <li>
              <button
                type="button"
                onClick={() => onSelectModule(firstModule.id, "overview")}
                className="flex min-h-11 w-full items-start gap-3 text-left"
              >
                <BookOpen
                  className="mt-0.5 size-4 shrink-0 text-[var(--app-muted)]"
                  aria-hidden
                />
                <span>
                  <span className="block text-sm font-medium">Learn</span>
                  <span className="mt-0.5 block text-xs text-[var(--app-muted)]">
                    Watch or read a lesson
                  </span>
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={onOpenSandbox}
                className="flex min-h-11 w-full items-start gap-3 text-left"
              >
                <Terminal
                  className="mt-0.5 size-4 shrink-0 text-[var(--app-muted)]"
                  aria-hidden
                />
                <span>
                  <span className="block text-sm font-medium">Practice</span>
                  <span className="mt-0.5 block text-xs text-[var(--app-muted)]">
                    Run code in the sandbox
                  </span>
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectModule(firstModule.id, "quiz")}
                className="flex min-h-11 w-full items-start gap-3 text-left"
              >
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-[var(--app-muted)]"
                  aria-hidden
                />
                <span>
                  <span className="block text-sm font-medium">Take a quiz</span>
                  <span className="mt-0.5 block text-xs text-[var(--app-muted)]">
                    Check what stuck
                  </span>
                </span>
              </button>
            </li>
          </ul>

          <p className="pt-2 text-xs text-[var(--app-tertiary)]">
            Your stats appear here once you start learning.
          </p>
        </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div data-dashboard-state="active">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          Dashboard
        </h1>
        <p className="text-sm text-[var(--app-muted)]">
          {currentUser.completedModuleIds.length} of {modules.length} complete
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Primary row */}
        {continueModule ? (
          <section className="flex flex-col rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 md:col-span-12 lg:col-span-8">
            <p className="text-xs text-[var(--app-tertiary)]">Continue learning</p>
            <h2 className="mt-1 text-[0.9375rem] font-medium sm:text-base">
              {continueModule.title}
            </h2>
            <p className="mt-1 text-xs text-[var(--app-muted)]">
              Module {continueModule.moduleNumber} · {continueModule.category} ·{" "}
              {continueModule.readingTime}
            </p>
            <div className="mt-4 max-w-md flex-1">
              <ProgressBar
                value={continueProgress}
                label="Module progress"
                className="h-1.5"
              />
            </div>
            <div className="mt-5">
              <Button
                variant="primary"
                onClick={() => onSelectModule(continueModule.id, "overview")}
              >
                <Play className="size-3.5 fill-current" aria-hidden />
                Resume
              </Button>
            </div>
          </section>
        ) : null}

        <section className="flex flex-col rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 md:col-span-12 lg:col-span-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[0.9375rem] font-medium">This week</h2>
            {streak > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--app-muted)]">
                <Flame className="size-3.5" aria-hidden />
                {streak}-day streak
              </span>
            ) : (
              <span className="text-xs text-[var(--app-tertiary)]">No streak yet</span>
            )}
          </div>
          <div className="mt-4 flex flex-1 items-end justify-between gap-1.5">
            {activityDays.map((day) => {
              const h =
                day.count === 0 ? 6 : 10 + (day.count / maxActivity) * 48;
              return (
                <div
                  key={day.date}
                  className="flex flex-1 flex-col items-center gap-1"
                  title={`${day.date}: ${day.count}`}
                >
                  <div
                    className={`w-full max-w-7 rounded-sm ${
                      day.count > 0
                        ? "bg-brand-300"
                        : "bg-[color-mix(in_srgb,var(--app-border)_70%,transparent)]"
                    }`}
                    style={{ height: `${h}px` }}
                  />
                  <span className="font-mono text-[10px] text-[var(--app-tertiary)]">
                    {day.label.slice(0, 1)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Stats row — three compact tiles, no streak, no icon boxes */}
        <div className="grid grid-cols-3 gap-3 md:col-span-12">
          <div className="rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
            <p className="text-xs text-[var(--app-muted)]">Completed</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {currentUser.completedModuleIds.length}
              <span className="text-sm font-normal text-[var(--app-tertiary)]">
                {" "}
                / {modules.length}
              </span>
            </p>
            <ProgressBar
              value={completion}
              label="Course completion"
              className="mt-2 h-1"
            />
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
            <p className="text-xs text-[var(--app-muted)]">Quiz average</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {avgQuizScore != null ? `${avgQuizScore}%` : "–"}
            </p>
          </div>
          <div className="rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
            <p className="text-xs text-[var(--app-muted)]">Bookmarks</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {bookmarkedModules.length}
            </p>
          </div>
        </div>

        {/* Progress + quiz */}
        <section className="rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 md:col-span-12 lg:col-span-7">
          <ModuleProgressMap
            modules={modules}
            currentUser={currentUser}
            onSelectModule={(id) => onSelectModule(id)}
          />
          {quizEntries.length === 0 && continueModule ? (
            <p className="mt-4 border-t border-[var(--app-border)] pt-4 text-sm text-[var(--app-muted)]">
              <button
                type="button"
                className="font-medium text-[var(--app-accent-text)] hover:underline"
                onClick={() => onSelectModule(continueModule.id, "quiz")}
              >
                Take a quiz
              </button>{" "}
              to see scores here.
            </p>
          ) : null}
        </section>

        {quizEntries.length > 0 ? (
          <section className="rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 md:col-span-12 lg:col-span-5">
            <h3 className="text-[0.9375rem] font-medium">Quiz scores</h3>
            <svg
              viewBox="0 0 320 120"
              className="mt-3 h-28 w-full"
              role="img"
              aria-label="Recent quiz scores"
            >
              <line
                x1="0"
                y1="100"
                x2="320"
                y2="100"
                stroke="var(--app-border)"
                strokeWidth="1"
              />
              <polyline
                fill="none"
                stroke="var(--app-accent-bright)"
                strokeWidth="2"
                points={quizEntries
                  .map((e, i) => {
                    const x =
                      quizEntries.length === 1
                        ? 160
                        : (i / (quizEntries.length - 1)) * 300 + 10;
                    const y = 100 - (e.score / 100) * 90;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
              {quizEntries.map((e, i) => {
                const x =
                  quizEntries.length === 1
                    ? 160
                    : (i / (quizEntries.length - 1)) * 300 + 10;
                const y = 100 - (e.score / 100) * 90;
                return (
                  <g key={e.moduleId}>
                    <circle
                      cx={x}
                      cy={y}
                      r="3.5"
                      fill="var(--app-accent-bright)"
                    />
                    <text
                      x={x}
                      y={y - 8}
                      textAnchor="middle"
                      fontSize="9"
                      fill="var(--app-muted)"
                      fontFamily="var(--font-mono)"
                    >
                      {e.score}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </section>
        ) : null}

        {/* Bottom lists */}
        {recentModules.length > 0 ? (
          <section className="rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 md:col-span-12 lg:col-span-7">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-[0.9375rem] font-medium">Recent activity</h3>
              <button
                type="button"
                onClick={onBrowseLessons}
                className="min-h-11 text-xs font-medium text-[var(--app-muted)] hover:text-[var(--app-ink)]"
              >
                View all
              </button>
            </div>
            <ul className="divide-y divide-[var(--app-border)]">
              {recentModules.slice(0, 5).map((mod) => {
                const state = moduleState(mod, currentUser);
                return (
                  <li key={mod.id}>
                    <button
                      type="button"
                      onClick={() => onSelectModule(mod.id)}
                      className="flex min-h-11 w-full items-center justify-between gap-3 py-2.5 text-left"
                    >
                      <span className="min-w-0 truncate text-sm">
                        <span className="text-[var(--app-tertiary)]">
                          M{mod.moduleNumber}
                        </span>{" "}
                        {mod.title}
                      </span>
                      <span className="shrink-0 text-xs text-[var(--app-muted)]">
                        {state === "done"
                          ? "Done"
                          : state === "progress"
                            ? "In progress"
                            : "Opened"}
                        {currentUser.quizScores[mod.id] != null
                          ? ` · ${currentUser.quizScores[mod.id]}%`
                          : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {bookmarkedModules.length > 0 ? (
          <section
            className={`rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 md:col-span-12 ${
              recentModules.length > 0 ? "lg:col-span-5" : "lg:col-span-12"
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-[0.9375rem] font-medium">Bookmarks</h3>
              <button
                type="button"
                onClick={onBrowseLessons}
                className="min-h-11 text-xs font-medium text-[var(--app-muted)] hover:text-[var(--app-ink)]"
              >
                View all
              </button>
            </div>
            <ul className="divide-y divide-[var(--app-border)]">
              {bookmarkedModules.slice(0, 5).map((mod) => (
                <li key={mod.id}>
                  <button
                    type="button"
                    onClick={() => onSelectModule(mod.id)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 py-2.5 text-left"
                  >
                    <span className="min-w-0 truncate text-sm">
                      M{mod.moduleNumber}: {mod.title}
                    </span>
                    <ArrowRight
                      className="size-3.5 shrink-0 text-[var(--app-tertiary)]"
                      aria-hidden
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      </div>
    </PageContainer>
  );
}
