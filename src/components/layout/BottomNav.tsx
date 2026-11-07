import { BookOpen, Terminal, LayoutDashboard } from "lucide-react";
import type { AppView } from "@/types";

interface BottomNavProps {
  currentView: AppView;
  onSelectView: (view: AppView) => void;
}

const items = [
  { id: "learn" as const, label: "Lessons", icon: BookOpen },
  { id: "playground" as const, label: "Sandbox", icon: Terminal },
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
];

export function BottomNav({ currentView, onSelectView }: BottomNavProps) {
  return (
    <nav
      aria-label="Primary"
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-[var(--app-border)] bg-[var(--app-surface)] pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-3">
        {items.map(({ id, label, icon: Icon }) => {
          const active = currentView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectView(id)}
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-[var(--duration-fast)] ${
                active
                  ? "text-[var(--app-accent-text)]"
                  : "text-[var(--app-muted)]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={`size-4 ${active ? "stroke-[2.25]" : ""}`}
                aria-hidden
              />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
