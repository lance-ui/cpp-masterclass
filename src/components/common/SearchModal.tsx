import { useState, useEffect, useRef } from "react";
import {
  Search,
  Video,
  FileText,
  Code2,
  ArrowRight,
  Terminal,
  LayoutDashboard,
  BookOpen,
  Moon,
} from "lucide-react";
import type { CourseModule, ActiveTab } from "@/types";
import { Input, Modal, Badge } from "@/components/ui";

export type SearchQuickAction =
  | "sandbox"
  | "dashboard"
  | "lessons"
  | "theme";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: CourseModule[];
  onSelectModule: (moduleId: string, tab?: ActiveTab) => void;
  onQuickAction?: (action: SearchQuickAction) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  modules,
  onSelectModule,
  onQuickAction,
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const matchingModules = trimmed
    ? modules.filter(
        (m) =>
          m.title.toLowerCase().includes(trimmed) ||
          m.description.toLowerCase().includes(trimmed) ||
          m.category.toLowerCase().includes(trimmed),
      )
    : [];

  const matchingVideos: {
    module: CourseModule;
    videoTitle: string;
  }[] = [];
  const matchingDocs: { module: CourseModule; docTitle: string }[] = [];
  const matchingSnippets: { module: CourseModule; snippetTitle: string }[] = [];

  if (trimmed) {
    modules.forEach((m) => {
      m.videos.forEach((v) => {
        if (v.title.toLowerCase().includes(trimmed)) {
          matchingVideos.push({ module: m, videoTitle: v.title });
        }
      });
      m.documents.forEach((d) => {
        if (d.title.toLowerCase().includes(trimmed)) {
          matchingDocs.push({ module: m, docTitle: d.title });
        }
      });
      m.codeSnippets.forEach((c) => {
        if (
          c.title.toLowerCase().includes(trimmed) ||
          c.code.toLowerCase().includes(trimmed)
        ) {
          matchingSnippets.push({ module: m, snippetTitle: c.title });
        }
      });
    });
  }

  const totalResults =
    matchingModules.length +
    matchingVideos.length +
    matchingDocs.length +
    matchingSnippets.length;

  const quickActions: {
    id: SearchQuickAction;
    label: string;
    icon: typeof Terminal;
  }[] = [
    { id: "lessons", label: "Go to lessons", icon: BookOpen },
    { id: "sandbox", label: "Open sandbox", icon: Terminal },
    { id: "dashboard", label: "Open dashboard", icon: LayoutDashboard },
    { id: "theme", label: "Toggle theme", icon: Moon },
  ];

  const filteredActions = trimmed
    ? quickActions.filter((a) => a.label.toLowerCase().includes(trimmed))
    : quickActions;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Search"
      className="flex max-h-[80dvh] max-w-2xl flex-col overflow-hidden"
    >
      <div className="flex items-center gap-3 border-b border-[var(--app-border)] bg-[var(--app-canvas)] px-4 py-3">
        <Search className="size-4 shrink-0 text-[var(--app-tertiary)]" aria-hidden />
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search modules, topics, or quick actions"
          aria-label="Search lessons, videos, PDFs, and code"
          className="min-h-10 border-0 bg-transparent px-0 shadow-none"
        />
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        {filteredActions.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--app-tertiary)]">
              Quick actions
            </p>
            <div className="space-y-1">
              {filteredActions.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onQuickAction?.(id)}
                  className="flex w-full items-center gap-3 rounded-[var(--radius-control)] px-2.5 py-2 text-left text-sm hover:bg-[var(--app-canvas)]"
                >
                  <Icon className="size-4 text-[var(--app-tertiary)]" aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!trimmed && (
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--app-tertiary)]">
              Suggested topics
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Pointers",
                "OOP Classes",
                "Inheritance",
                "STL Vector",
                "Exception Handling",
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQuery(tag)}
                  className="rounded-[var(--radius-control)] border border-[var(--app-border)] px-2.5 py-1.5 text-xs text-[var(--app-muted)] hover:text-[var(--app-ink)]"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {trimmed && totalResults === 0 && filteredActions.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--app-muted)]">
            No results for “{query}”. Try “pointers”, “vector”, or “classes”.
          </p>
        )}

        {matchingModules.length > 0 && (
          <ResultGroup title={`Modules (${matchingModules.length})`}>
            {matchingModules.slice(0, 5).map((mod) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  onSelectModule(mod.id, "overview");
                  onClose();
                }}
                className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-control)] px-2.5 py-2 text-left hover:bg-[var(--app-canvas)]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-[var(--app-accent-text)]">
                      #{mod.moduleNumber}
                    </span>
                    <span className="truncate text-sm font-medium">
                      {mod.title}
                    </span>
                    <Badge tone="neutral">{mod.category}</Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-[var(--app-muted)]">
                    {mod.description}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-[var(--app-tertiary)]" />
              </button>
            ))}
          </ResultGroup>
        )}

        {matchingVideos.length > 0 && (
          <ResultGroup title={`Videos (${matchingVideos.length})`}>
            {matchingVideos.slice(0, 5).map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelectModule(item.module.id, "video");
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-[var(--radius-control)] px-2.5 py-2 text-left hover:bg-[var(--app-canvas)]"
              >
                <Video className="size-4 text-[var(--app-danger)]" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.videoTitle}
                  </span>
                  <span className="text-xs text-[var(--app-muted)]">
                    {item.module.title}
                  </span>
                </span>
              </button>
            ))}
          </ResultGroup>
        )}

        {matchingDocs.length > 0 && (
          <ResultGroup title={`Documents (${matchingDocs.length})`}>
            {matchingDocs.slice(0, 5).map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelectModule(item.module.id, "pdf");
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-[var(--radius-control)] px-2.5 py-2 text-left hover:bg-[var(--app-canvas)]"
              >
                <FileText className="size-4 text-[var(--app-info)]" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.docTitle}
                  </span>
                  <span className="text-xs text-[var(--app-muted)]">
                    {item.module.title}
                  </span>
                </span>
              </button>
            ))}
          </ResultGroup>
        )}

        {matchingSnippets.length > 0 && (
          <ResultGroup title={`Code (${matchingSnippets.length})`}>
            {matchingSnippets.slice(0, 4).map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onSelectModule(item.module.id, "code");
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-[var(--radius-control)] px-2.5 py-2 text-left hover:bg-[var(--app-canvas)]"
              >
                <Code2
                  className="size-4 text-[var(--app-accent-text)]"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.snippetTitle}
                  </span>
                  <span className="text-xs text-[var(--app-muted)]">
                    {item.module.title}
                  </span>
                </span>
              </button>
            ))}
          </ResultGroup>
        )}
      </div>
    </Modal>
  );
}

function ResultGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-[var(--app-tertiary)]">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
