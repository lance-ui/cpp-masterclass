import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  MoreHorizontal,
  Terminal,
  X,
} from "lucide-react";

export interface LessonActionItem {
  id: string;
  label: string;
  icon?: "prev" | "next" | "quiz" | "sandbox";
  onSelect: () => void;
  disabled?: boolean;
}

interface LessonActionFabProps {
  items: LessonActionItem[];
  label?: string;
  className?: string;
}

const ICONS = {
  prev: ChevronLeft,
  next: ChevronRight,
  quiz: HelpCircle,
  sandbox: Terminal,
} as const;

export function LessonActionFab({
  items,
  label = "Lesson actions",
  className = "",
}: LessonActionFabProps) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const lastScrollY = useRef(0);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, close]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastScrollY.current;
        if (y < 48) setHidden(false);
        else if (delta > 8) {
          setHidden(true);
          setOpen(false);
        } else if (delta < -8) setHidden(false);
        lastScrollY.current = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`pointer-events-none fixed z-40 flex flex-col items-end gap-2 ${className}`}
      style={{
        right: "max(0.75rem, env(safe-area-inset-right))",
        bottom:
          "calc(4.75rem + env(safe-area-inset-bottom) + 0.5rem)",
      }}
    >
      <div
        id={menuId}
        role="menu"
        aria-hidden={!open}
        className={`pointer-events-auto flex flex-col items-end gap-2 ${
          open ? "visible" : "invisible pointer-events-none"
        }`}
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(8px)",
          transition: reducedMotion
            ? "none"
            : "opacity 160ms ease, transform 160ms ease",
        }}
      >
        {items.map((item) => {
          const Icon = item.icon ? ICONS[item.icon] : MoreHorizontal;
          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                item.onSelect();
                close();
              }}
              className="inline-flex min-h-11 items-center gap-2 border border-[var(--app-border-strong)] bg-[var(--app-surface)] px-3 font-mono text-xs font-semibold text-[var(--app-ink)] shadow-[var(--shadow-card)] pressable disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </div>

      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto grid size-12 place-items-center border border-[var(--app-border-strong)] bg-brand-300 text-slate-950 shadow-[var(--shadow-raised)] pressable sm:size-[3.25rem]"
        style={{
          opacity: hidden && !open ? 0 : 1,
          transform:
            hidden && !open ? "translateY(12px) scale(0.92)" : "none",
          pointerEvents: hidden && !open ? "none" : "auto",
          transition: reducedMotion
            ? "none"
            : "opacity 180ms ease, transform 180ms ease",
        }}
      >
        {open ? <X className="size-5" /> : <MoreHorizontal className="size-5" />}
      </button>
    </div>
  );
}
