import { useEffect, useState } from "react";
import { highlightCpp } from "@/components/ui";

const SNIPPET = `#include <iostream>
using namespace std;

int main() {
  cout << "hello, stack" << endl;
  int* p = new int(42);
  cout << *p << endl;
  delete p;
  return 0;
}`;

interface TypewriterCodeProps {
  className?: string;
}

export function TypewriterCode({ className = "" }: TypewriterCodeProps) {
  const [visibleChars, setVisibleChars] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setVisibleChars(SNIPPET.length);
      return;
    }

    let cancelled = false;
    let i = 0;
    let timer: number;

    const step = () => {
      if (cancelled) return;
      if (i < SNIPPET.length) {
        i += 1;
        setVisibleChars(i);
        timer = window.setTimeout(step, 28);
      } else {
        timer = window.setTimeout(() => {
          if (cancelled) return;
          i = 0;
          setVisibleChars(0);
          timer = window.setTimeout(step, 400);
        }, 2400);
      }
    };

    timer = window.setTimeout(step, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reducedMotion]);

  const shown = SNIPPET.slice(0, visibleChars);

  return (
    <div
      className={`overflow-hidden rounded-card border border-[var(--app-border-strong)] bg-[var(--app-code-bg)] text-left shadow-[var(--shadow-raised)] ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2 font-mono text-[11px] text-slate-500">
        <span className="size-2 rounded-full bg-rose-400" />
        <span className="size-2 rounded-full bg-amber-300" />
        <span className="size-2 rounded-full bg-brand-300" />
        <span className="ml-2 text-brand-300">main.cpp</span>
      </div>
      <pre className="max-h-56 overflow-hidden p-4 font-mono text-[12px] leading-5 text-[var(--app-code-fg)] sm:text-[13px] sm:leading-6">
        <code>
          {highlightCpp(shown)}
          {!reducedMotion && visibleChars < SNIPPET.length && (
            <span className="animate-[type-caret_1s_step-end_infinite] text-brand-300">
              ▌
            </span>
          )}
        </code>
      </pre>
    </div>
  );
}
