import { Modal } from "@/components/ui";

const SHORTCUTS = [
  { keys: "⌘K / Ctrl+K", action: "Open command search" },
  { keys: "/", action: "Open search" },
  { keys: "?", action: "Keyboard shortcuts" },
  { keys: "Esc", action: "Close overlay" },
];

export function ShortcutsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title="Keyboard shortcuts" onClose={onClose}>
      <ul className="divide-y divide-[var(--app-border)] p-2">
        {SHORTCUTS.map((row) => (
          <li
            key={row.keys}
            className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm"
          >
            <span className="text-[var(--app-muted)]">{row.action}</span>
            <kbd className="rounded-[var(--radius-control)] border border-[var(--app-border)] bg-[var(--app-canvas)] px-2 py-1 font-mono text-xs">
              {row.keys}
            </kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
