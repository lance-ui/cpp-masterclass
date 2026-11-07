import { useEffect, useState } from "react";
import {
  CheckCircle,
  Circle,
  Bookmark,
  BookmarkCheck,
  Search,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { CourseModule, User } from "@/types";
import { Badge } from "@/components/ui";

const COLLAPSE_KEY = "cpp-masterclass:v1:sidebar-collapsed";
const CATEGORY_KEY = "cpp-masterclass:v1:sidebar-categories";

interface SidebarProps {
  modules: CourseModule[];
  selectedModuleId: string;
  onSelectModule: (moduleId: string) => void;
  currentUser: User;
  onToggleBookmark: (moduleId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const groupedCategories = [
  "Beginner",
  "Core Concepts",
  "Object Oriented (OOP)",
  "Advanced C++ & STL",
  "Projects & Deep Dives",
];

function readCollapsedCategories(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(CATEGORY_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function Sidebar({
  modules,
  selectedModuleId,
  onSelectModule,
  currentUser,
  onToggleBookmark,
  isOpen,
  onClose,
}: SidebarProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >(readCollapsedCategories);
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, String(desktopCollapsed));
    } catch {
      /* ignore */
    }
  }, [desktopCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(CATEGORY_KEY, JSON.stringify(collapsedCategories));
    } catch {
      /* ignore */
    }
  }, [collapsedCategories]);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const filtered = modules.filter((m) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.moduleNumber.toString().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  });

  const doneCount = currentUser.completedModuleIds.length;

  const renderModuleRow = (mod: CourseModule) => {
    const isSelected = mod.id === selectedModuleId;
    const isCompleted = currentUser.completedModuleIds.includes(mod.id);
    const isBookmarked = currentUser.bookmarkedModuleIds.includes(mod.id);
    const inProgress =
      !isCompleted &&
      (currentUser.recentModuleIds.includes(mod.id) ||
        currentUser.quizScores[mod.id] != null);

    return (
      <div
        key={mod.id}
        className={`group flex items-center gap-1 rounded-[var(--radius-control)] px-1.5 ${
          isSelected
            ? "bg-brand-100 text-[var(--app-accent-text)] dark:bg-brand-950"
            : "text-[var(--app-ink)] hover:bg-[var(--app-canvas)]"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            onSelectModule(mod.id);
            onClose();
          }}
          aria-current={isSelected ? "page" : undefined}
          className="flex min-h-10 min-w-0 flex-1 items-center gap-2 text-left text-sm"
        >
          {isCompleted ? (
            <CheckCircle className="size-3.5 shrink-0 text-[var(--app-success)]" />
          ) : inProgress ? (
            <Circle className="size-3.5 shrink-0 fill-[var(--app-accent-bright)] text-[var(--app-accent-text)]" />
          ) : (
            <Circle className="size-3.5 shrink-0 text-[var(--app-border-strong)]" />
          )}
          <span className="truncate">
            <span className="mr-1.5 font-mono text-[11px] text-[var(--app-tertiary)]">
              {mod.moduleNumber}.
            </span>
            {mod.title}
          </span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(mod.id);
          }}
          className={`grid size-9 shrink-0 place-items-center rounded-[var(--radius-control)] ${
            isBookmarked
              ? "text-[var(--app-warning)]"
              : "text-[var(--app-disabled)] opacity-0 group-hover:opacity-100 focus:opacity-100"
          }`}
          aria-label={`${isBookmarked ? "Remove bookmark for" : "Bookmark"} ${mod.title}`}
        >
          {isBookmarked ? (
            <BookmarkCheck className="size-3.5" />
          ) : (
            <Bookmark className="size-3.5" />
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close course outline"
          onClick={onClose}
          className="fixed inset-0 top-[calc(3.5rem_+_env(safe-area-inset-top))] z-40 bg-[var(--app-overlay)] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 top-[calc(3.5rem_+_env(safe-area-inset-top))] z-50 flex h-[calc(100dvh_-_3.5rem_-_env(safe-area-inset-top))] shrink-0 flex-col border-r border-[var(--app-border)] bg-[var(--app-surface)] pb-[env(safe-area-inset-bottom)] transition-[transform,width] duration-[var(--duration-normal)] lg:sticky lg:top-[calc(3.5rem_+_env(safe-area-inset-top))] lg:z-auto lg:h-[calc(100dvh_-_3.5rem_-_env(safe-area-inset-top))] ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${
          desktopCollapsed
            ? "w-[min(88vw,20rem)] lg:w-14"
            : "w-[min(88vw,20rem)] lg:w-72"
        }`}
        aria-label="Course outline"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--app-border)] p-3">
          {!desktopCollapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--app-ink)]">
                Modules
              </p>
              <p className="text-xs text-[var(--app-muted)]">
                {doneCount}/{modules.length} complete
              </p>
            </div>
          )}
          <button
            type="button"
            className="ml-auto hidden size-9 place-items-center rounded-[var(--radius-control)] border border-[var(--app-border)] text-[var(--app-muted)] lg:grid"
            onClick={() => setDesktopCollapsed((v) => !v)}
            aria-label={
              desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            aria-pressed={desktopCollapsed}
          >
            {desktopCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        {!desktopCollapsed && (
          <>
            <div className="border-b border-[var(--app-border)] p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--app-tertiary)]" />
                <input
                  type="search"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  aria-label="Filter course topics"
                  placeholder="Filter modules"
                  className="min-h-10 w-full rounded-[var(--radius-control)] border border-[var(--app-border)] bg-[var(--app-canvas)] py-1.5 pl-8 pr-2.5 text-sm focus:border-[var(--app-accent)] focus:outline-none"
                />
              </div>
            </div>

            <nav className="flex-1 space-y-3 overflow-y-auto p-2">
              {!filterQuery
                ? groupedCategories.map((catName) => {
                    const catModules = modules.filter(
                      (m) => m.category === catName,
                    );
                    if (catModules.length === 0) return null;
                    const isCollapsed = !!collapsedCategories[catName];
                    const doneInCat = catModules.filter((m) =>
                      currentUser.completedModuleIds.includes(m.id),
                    ).length;

                    return (
                      <div key={catName} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => toggleCategory(catName)}
                          className="flex min-h-9 w-full items-center justify-between rounded-[var(--radius-control)] px-2 text-xs font-medium text-[var(--app-muted)] hover:bg-[var(--app-canvas)] hover:text-[var(--app-ink)]"
                        >
                          <span className="flex items-center gap-2">
                            <span>{catName}</span>
                            <Badge tone="neutral">
                              {doneInCat}/{catModules.length}
                            </Badge>
                          </span>
                          {isCollapsed ? (
                            <ChevronRight className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                        </button>
                        {!isCollapsed && (
                          <div className="space-y-0.5">
                            {catModules.map(renderModuleRow)}
                          </div>
                        )}
                      </div>
                    );
                  })
                : (
                  <div className="space-y-0.5">
                    {filtered.length === 0 ? (
                      <p className="p-3 text-center text-xs text-[var(--app-muted)]">
                        No modules match “{filterQuery}”.
                      </p>
                    ) : (
                      filtered.map(renderModuleRow)
                    )}
                  </div>
                )}
            </nav>
          </>
        )}

        {desktopCollapsed && (
          <div className="hidden flex-1 flex-col items-center gap-2 p-2 lg:flex">
            <span className="font-mono text-[10px] text-[var(--app-tertiary)]">
              {doneCount}/{modules.length}
            </span>
          </div>
        )}
      </aside>
    </>
  );
}
