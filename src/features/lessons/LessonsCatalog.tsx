import { useMemo, useState } from "react";
import {
  LayoutGrid,
  List,
  Search,
  Clock,
  ArrowRight,
  Play,
} from "lucide-react";
import type { CourseModule, User } from "@/types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageContainer,
  PageHeader,
  ProgressBar,
  Select,
} from "@/components/ui";

type StatusFilter = "all" | "todo" | "progress" | "done";
type LevelFilter = "all" | string;
type SortKey = "number" | "title" | "duration" | "status";
type ViewMode = "grid" | "list";

function statusOf(mod: CourseModule, user: User): "todo" | "progress" | "done" {
  if (user.completedModuleIds.includes(mod.id)) return "done";
  if (
    user.recentModuleIds.includes(mod.id) ||
    user.quizScores[mod.id] != null
  ) {
    return "progress";
  }
  return "todo";
}

function progressOf(mod: CourseModule, user: User): number {
  if (user.completedModuleIds.includes(mod.id)) return 100;
  if (user.quizScores[mod.id] != null) return 70;
  if (user.recentModuleIds.includes(mod.id)) return 35;
  return 0;
}

const statusLabel = {
  todo: "Not started",
  progress: "In progress",
  done: "Done",
} as const;

const statusTone = {
  todo: "neutral",
  progress: "warning",
  done: "success",
} as const;

const CATEGORY_ORDER = [
  "Beginner",
  "Core Concepts",
  "Object Oriented (OOP)",
  "Advanced C++ & STL",
  "Projects & Deep Dives",
];

interface LessonsCatalogProps {
  modules: CourseModule[];
  currentUser: User;
  onSelectModule: (moduleId: string) => void;
}

export function LessonsCatalog({
  modules,
  currentUser,
  onSelectModule,
}: LessonsCatalogProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [sort, setSort] = useState<SortKey>("number");
  const [view, setView] = useState<ViewMode>("grid");

  const levels = useMemo(
    () =>
      CATEGORY_ORDER.filter((c) => modules.some((m) => m.category === c)).concat(
        Array.from(new Set(modules.map((m) => m.category))).filter(
          (c) => !CATEGORY_ORDER.includes(c),
        ),
      ),
    [modules],
  );

  const filtersActive =
    query.trim() !== "" || status !== "all" || level !== "all";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = modules.filter((m) => {
      const st = statusOf(m, currentUser);
      if (status !== "all" && st !== status) return false;
      if (level !== "all" && m.category !== level) return false;
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        String(m.moduleNumber).includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "duration")
        return a.readingTime.localeCompare(b.readingTime);
      if (sort === "status") {
        return statusOf(a, currentUser).localeCompare(statusOf(b, currentUser));
      }
      return a.moduleNumber - b.moduleNumber;
    });
    return list;
  }, [modules, currentUser, query, status, level, sort]);

  const groupByLevel =
    sort === "number" && !query.trim() && level === "all";

  const grouped = useMemo(() => {
    if (!groupByLevel) return null;
    return levels
      .map((cat) => ({
        category: cat,
        items: rows.filter((m) => m.category === cat),
      }))
      .filter((g) => g.items.length > 0);
  }, [groupByLevel, levels, rows]);

  const doneCount = currentUser.completedModuleIds.length;
  const continueModule =
    currentUser.recentModuleIds
      .map((id) => modules.find((m) => m.id === id))
      .find((m): m is CourseModule => !!m) ??
    modules.find((m) => !currentUser.completedModuleIds.includes(m.id)) ??
    modules[0];
  const nextModule =
    modules.find(
      (m) =>
        !currentUser.completedModuleIds.includes(m.id) &&
        m.id !== continueModule?.id,
    ) ?? null;

  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setLevel("all");
  };

  const resultsLabel = filtersActive
    ? `${rows.length} of ${modules.length} match`
    : `${modules.length} modules`;

  const renderCard = (mod: CourseModule) => {
    const st = statusOf(mod, currentUser);
    const quiz = currentUser.quizScores[mod.id];
    return (
      <Card key={mod.id} className="flex h-full flex-col p-4">
        <div className="mb-2 flex min-h-6 items-start justify-between gap-2">
          <Badge tone="brand" className="shrink-0">
            {mod.category}
          </Badge>
          {st !== "todo" ? (
            <Badge tone={statusTone[st]} className="shrink-0">
              {statusLabel[st]}
            </Badge>
          ) : null}
        </div>
        <h2 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">
          <span className="text-[var(--app-tertiary)]">{mod.moduleNumber}. </span>
          {mod.title}
        </h2>
        <p className="mt-1 line-clamp-2 min-h-[2.5rem] flex-1 text-sm text-[var(--app-muted)]">
          {mod.description}
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-[var(--app-tertiary)]">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {mod.readingTime}
          </span>
          {quiz != null ? <span>Quiz {quiz}%</span> : null}
        </div>
        <ProgressBar
          value={progressOf(mod, currentUser)}
          label={`${mod.title} progress`}
          className="mt-3 h-1"
        />
        <Button
          size="sm"
          variant="secondary"
          className="mt-3 w-full"
          onClick={() => onSelectModule(mod.id)}
        >
          Open module
          <ArrowRight className="size-3.5" />
        </Button>
      </Card>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        title="Lessons"
        description="Browse the curriculum by level, status, or search."
        action={
          <div className="inline-flex rounded-[var(--radius-control)] border border-[var(--app-border)] p-0.5">
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={`grid size-9 place-items-center rounded-[var(--radius-control)] ${
                view === "grid"
                  ? "bg-[var(--app-canvas)] text-[var(--app-ink)]"
                  : "text-[var(--app-muted)]"
              }`}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={`grid size-9 place-items-center rounded-[var(--radius-control)] ${
                view === "list"
                  ? "bg-[var(--app-canvas)] text-[var(--app-ink)]"
                  : "text-[var(--app-muted)]"
              }`}
            >
              <List className="size-4" />
            </button>
          </div>
        }
      />

      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--app-tertiary)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules"
            aria-label="Search modules"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:shrink-0 lg:items-center">
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="lg:w-40"
          >
            <option value="all">All statuses</option>
            <option value="todo">Not started</option>
            <option value="progress">In progress</option>
            <option value="done">Done</option>
          </Select>
          <Select
            aria-label="Filter by level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="lg:w-44"
          >
            <option value="all">All levels</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Sort modules"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="lg:w-40"
          >
            <option value="number">Module number</option>
            <option value="title">Title</option>
            <option value="duration">Duration</option>
            <option value="status">Status</option>
          </Select>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--app-muted)]" aria-live="polite">
          {resultsLabel}
        </p>
        {filtersActive ? (
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 min-[1440px]:grid-cols-[minmax(0,1fr)_17.5rem]">
        <div className="min-w-0">
          {rows.length === 0 ? (
            <EmptyState
              title="No modules match"
              description="Clear filters or try a different search term."
              action={
                <Button size="sm" variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : view === "grid" ? (
            grouped ? (
              <div className="space-y-8">
                {grouped.map((group) => (
                  <section key={group.category}>
                    <h2 className="sticky top-[calc(3.5rem+2px+env(safe-area-inset-top))] z-10 -mx-1 mb-3 flex items-center gap-2 border-b border-[var(--app-border)] bg-[var(--app-canvas)]/95 px-1 py-2 text-sm font-semibold backdrop-blur-sm">
                      {group.category}
                      <Badge tone="neutral">{group.items.length}</Badge>
                    </h2>
                    <div className="module-grid">
                      {group.items.map(renderCard)}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="module-grid">{rows.map(renderCard)}</div>
            )
          ) : (
            <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--app-border)]">
              <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-[var(--app-canvas)]">
                  <tr>
                    <th
                      scope="col"
                      className="border-b border-[var(--app-border)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--app-tertiary)]"
                    >
                      Module
                    </th>
                    <th
                      scope="col"
                      className="border-b border-[var(--app-border)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--app-tertiary)]"
                    >
                      Level
                    </th>
                    <th
                      scope="col"
                      className="border-b border-[var(--app-border)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--app-tertiary)]"
                    >
                      Duration
                    </th>
                    <th
                      scope="col"
                      className="border-b border-[var(--app-border)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--app-tertiary)]"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="border-b border-[var(--app-border)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--app-tertiary)]"
                    >
                      Progress
                    </th>
                    <th
                      scope="col"
                      className="border-b border-[var(--app-border)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--app-tertiary)]"
                    >
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((mod) => {
                    const st = statusOf(mod, currentUser);
                    return (
                      <tr
                        key={mod.id}
                        className="border-b border-[var(--app-border)] last:border-0 hover:bg-[var(--app-canvas)]"
                      >
                        <td className="px-3 py-2.5">
                          <span className="font-medium text-[var(--app-ink)]">
                            <span className="mr-1.5 font-mono text-xs text-[var(--app-tertiary)]">
                              {mod.moduleNumber}.
                            </span>
                            {mod.title}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone="neutral">{mod.category}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[var(--app-muted)]">
                          {mod.readingTime}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge tone={statusTone[st]}>{statusLabel[st]}</Badge>
                        </td>
                        <td className="w-36 px-3 py-2.5">
                          <ProgressBar
                            value={progressOf(mod, currentUser)}
                            label={`${mod.title} progress`}
                            className="h-1.5"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onSelectModule(mod.id)}
                          >
                            Open
                            <ArrowRight className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sticky summary rail — 1440px+ only */}
        <aside className="hidden min-[1440px]:block">
          <div className="sticky top-[calc(3.5rem+1rem+env(safe-area-inset-top))] space-y-3">
            <Card className="p-4">
              <p className="text-xs font-medium text-[var(--app-tertiary)]">
                Overall progress
              </p>
              <p className="mt-1 text-sm font-semibold">
                {doneCount} of {modules.length} complete
              </p>
              <ProgressBar
                value={(doneCount / Math.max(modules.length, 1)) * 100}
                label="Curriculum completion"
                className="mt-3 h-1.5"
              />
            </Card>

            {continueModule ? (
              <Card className="p-4">
                <p className="text-xs font-medium text-[var(--app-tertiary)]">
                  Continue
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold">
                  {continueModule.moduleNumber}. {continueModule.title}
                </p>
                <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                  {continueModule.category} · {continueModule.readingTime}
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  className="mt-3 w-full"
                  onClick={() => onSelectModule(continueModule.id)}
                >
                  <Play className="size-3.5 fill-current" />
                  Resume
                </Button>
              </Card>
            ) : null}

            {nextModule ? (
              <Card className="p-4">
                <p className="text-xs font-medium text-[var(--app-tertiary)]">
                  Recommended next
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold">
                  {nextModule.moduleNumber}. {nextModule.title}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={() => onSelectModule(nextModule.id)}
                >
                  Open
                  <ArrowRight className="size-3.5" />
                </Button>
              </Card>
            ) : null}
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
