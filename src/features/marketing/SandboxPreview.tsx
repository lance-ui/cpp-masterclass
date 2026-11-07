/** Static, truthful depiction of the sandbox editor + interactive console. No CodeMirror/xterm. */

export function SandboxPreview({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--shadow-card)] ${className}`}
      role="img"
      aria-label="Sandbox preview: C++ editor on the left and interactive console on the right"
    >
      <div className="flex items-center gap-2 border-b border-[var(--app-border)] bg-[var(--app-canvas)] px-3 py-2">
        <span className="size-2.5 rounded-full bg-[var(--app-border-strong)]" />
        <span className="size-2.5 rounded-full bg-[var(--app-border-strong)]" />
        <span className="size-2.5 rounded-full bg-[var(--app-border-strong)]" />
        <span className="ml-2 font-mono text-[11px] text-[var(--app-tertiary)]">
          sandbox · main.cpp
        </span>
        <span className="ml-auto rounded-[var(--radius-control)] bg-brand-300 px-2 py-0.5 text-[10px] font-semibold text-[var(--app-accent-fg)]">
          Run
        </span>
      </div>
      <div
        className={`grid ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}
      >
        <pre
          className={`overflow-x-auto border-b border-[var(--app-border)] bg-[var(--app-code-bg)] p-3 font-mono text-[11px] leading-relaxed text-[var(--app-code-fg)] sm:border-b-0 sm:border-r ${compact ? "max-h-40" : "max-h-56"}`}
        >
          <code>{`#include <iostream>
using namespace std;

int main() {
  int n;
  cout << "Enter an integer value: ";
  cin >> n;
  cout << "You entered: " << n << "\\n";
  return 0;
}`}</code>
        </pre>
        <div
          className={`bg-[var(--app-canvas)] p-3 font-mono text-[11px] leading-relaxed ${compact ? "min-h-28" : "min-h-40"}`}
        >
          <p className="text-[var(--app-tertiary)]">Console</p>
          <p className="mt-2 text-[var(--app-ink)]">
            Enter an integer value:{" "}
            <span className="text-[var(--app-accent-text)]">42</span>
          </p>
          <p className="text-[var(--app-ink)]">You entered: 42</p>
          <p className="mt-3 text-[var(--app-tertiary)]">
            Process finished · exit 0
          </p>
        </div>
      </div>
    </div>
  );
}
