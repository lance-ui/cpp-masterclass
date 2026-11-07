import { useState } from "react";
import type { CourseModule, User } from "@/types";
import { getCurriculumLevels } from "@/utils/curriculumLevels";

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

interface ModuleProgressMapProps {
  modules: CourseModule[];
  currentUser: User;
  onSelectModule: (moduleId: string) => void;
}

export function ModuleProgressMap({
  modules,
  currentUser,
  onSelectModule,
}: ModuleProgressMapProps) {
  const [expanded, setExpanded] = useState(false);
  const levels = getCurriculumLevels(modules);
  const hasAnyActive = modules.some(
    (m) => moduleState(m, currentUser) !== "todo",
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[0.9375rem] font-medium text-[var(--app-ink)]">
          Your progress
        </h3>
        <button
          type="button"
          className="min-h-11 text-xs font-medium text-[var(--app-muted)] hover:text-[var(--app-ink)]"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? "Hide module list" : "Show all modules"}
        </button>
      </div>

      <ul className="space-y-4">
        {levels.map((level) => {
          const done = level.modules.filter(
            (m) => moduleState(m, currentUser) === "done",
          ).length;
          return (
            <li key={level.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-[var(--app-ink)]">
                  {level.label}
                </span>
                <span className="font-mono text-xs text-[var(--app-tertiary)]">
                  {done}/{level.modules.length}
                </span>
              </div>
              <div
                className="flex gap-1"
                role="list"
                aria-label={`${level.label} modules`}
              >
                {level.modules.map((mod) => {
                  const state = moduleState(mod, currentUser);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      role="listitem"
                      title={`Module ${mod.moduleNumber}: ${mod.title}`}
                      aria-label={`Module ${mod.moduleNumber}: ${mod.title}, ${state === "done" ? "completed" : state === "progress" ? "in progress" : "not started"}`}
                      onClick={() => onSelectModule(mod.id)}
                      className={`h-2.5 min-h-0 min-w-0 flex-1 rounded-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-accent)] ${
                        state === "done"
                          ? "bg-brand-300"
                          : state === "progress"
                            ? "bg-[color-mix(in_srgb,var(--app-accent-bright)_35%,transparent)] ring-1 ring-inset ring-[var(--app-accent-text)]"
                            : "bg-[color-mix(in_srgb,var(--app-border)_80%,transparent)]"
                      }`}
                    />
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      {hasAnyActive ? (
        <div className="flex gap-4 text-[11px] text-[var(--app-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <i className="size-2 rounded-sm bg-brand-300" aria-hidden /> Done
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i
              className="size-2 rounded-sm bg-[color-mix(in_srgb,var(--app-accent-bright)_35%,transparent)] ring-1 ring-inset ring-[var(--app-accent-text)]"
              aria-hidden
            />{" "}
            In progress
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i
              className="size-2 rounded-sm bg-[color-mix(in_srgb,var(--app-border)_80%,transparent)]"
              aria-hidden
            />{" "}
            Todo
          </span>
        </div>
      ) : null}

      {expanded ? (
        <div className="flex flex-wrap gap-1.5 border-t border-[var(--app-border)] pt-4">
          {modules.map((mod) => {
            const state = moduleState(mod, currentUser);
            return (
              <button
                key={mod.id}
                type="button"
                title={`Module ${mod.moduleNumber}: ${mod.title}`}
                onClick={() => onSelectModule(mod.id)}
                className={`grid size-8 place-items-center rounded-[var(--radius-control)] border font-mono text-[11px] font-medium sm:size-8 ${
                  state === "done"
                    ? "border-transparent bg-brand-300 text-[var(--app-accent-fg)]"
                    : state === "progress"
                      ? "border-[var(--app-accent-text)] text-[var(--app-accent-text)]"
                      : "border-[var(--app-border)] text-[var(--app-muted)] hover:border-[var(--app-border-strong)]"
                }`}
              >
                {mod.moduleNumber}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
