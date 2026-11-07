import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  Copy,
  Check,
  Download,
  Terminal,
  AlertTriangle,
  AlignLeft,
  Code2,
  CheckCircle2,
} from "lucide-react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter,
  indentOnInput,
  indentUnit,
} from "@codemirror/language";
import { cpp } from "@codemirror/lang-cpp";
import { formatCppCode } from "@/utils/courseLogic";
import { Button } from "@/components/ui";
import { readStoredValue, writeStoredValue } from "@/utils/storage";
import {
  cppEditorTheme,
  cppSyntaxHighlighting,
} from "@/features/playground/cppEditorTheme";
import {
  runCppOnServer,
  signalLabel,
  type CompileDiagnostic,
  type RunApiResponse,
} from "@/utils/runApi";
import {
  InteractiveRunSession,
  type ConsoleChunk,
} from "@/utils/runSession";

interface CodePlaygroundProps {
  initialCode?: string;
  initialTitle?: string;
  /** When set (lesson Code tab), becomes the default template. */
  lessonExample?: { title: string; code: string };
  onCodeRun?: () => void;
}

type RunPhase = "idle" | "compiling" | "running";

const TEMPLATES: {
  name: string;
  title: string;
  code: string;
}[] = [
  {
    name: "pointers",
    title: "Pointers & Dynamic Memory",
    code: `#include <iostream>
using namespace std;

int main() {
    int val = 42;
    int* ptr = &val;

    cout << "Value directly: " << val << endl;
    cout << "Value via pointer: " << *ptr << endl;

    int* heapVal = new int(100);
    cout << "Heap Value: " << *heapVal << endl;

    delete heapVal;
    heapVal = nullptr;

    return 0;
}`,
  },
  {
    name: "stdin",
    title: "Interactive User Input (cin >>)",
    code: `#include <iostream>
using namespace std;

int main() {
    int age;
    cout << "Enter your age: ";
    cin >> age;

    cout << "You entered age: " << age << endl;
    if (age >= 18) {
        cout << "Status: Adult programmer ready for C++!" << endl;
    } else {
        cout << "Status: Young prodigy mastering algorithms!" << endl;
    }

    return 0;
}`,
  },
  {
    name: "hello",
    title: "Hello World (Basics)",
    code: `#include <iostream>
using namespace std;

int main() {
    cout << "Welcome to C++ MasterClass IDE!" << endl;
    cout << "Compiler: real g++ C++20 (sandboxed)" << endl;
    return 0;
}`,
  },
  {
    name: "triangle",
    title: "Area of a Triangle (Expressions)",
    code: `#include <iostream>
using namespace std;

int main() {
    float base = 12.5f;
    float height = 8.0f;
    float area = 0.5f * base * height;

    cout << "Base: " << base << " | Height: " << height << endl;
    cout << "Area of Triangle = " << area << " sq units" << endl;
    return 0;
}`,
  },
  {
    name: "loops",
    title: "Sum of N Numbers (Loops)",
    code: `#include <iostream>
using namespace std;

int main() {
    int n = 10;
    int sum = 0;

    for (int i = 1; i <= n; i++) {
        sum += i;
    }

    cout << "Sum of numbers 1 to " << n << " is: " << sum << endl;
    return 0;
}`,
  },
  {
    name: "oop",
    title: "Class & Encapsulation (OOP)",
    code: `#include <iostream>
#include <string>
using namespace std;

class Student {
private:
    string name;
    int score;
public:
    Student(string n, int s) : name(n), score(s) {}

    void display() {
        cout << "Student: " << name << " | Score: " << score << "/100" << endl;
    }
};

int main() {
    Student s1("Example Student", 94);
    s1.display();
    return 0;
}`,
  },
  {
    name: "stl",
    title: "STL Vector & Sorting",
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> nums = {42, 17, 88, 9, 63};
    sort(nums.begin(), nums.end());

    cout << "Sorted STL Vector: ";
    for (int n : nums) {
        cout << n << " ";
    }
    cout << endl;
    return 0;
}`,
  },
  {
    name: "banking",
    title: "Banking System Project",
    code: `#include <iostream>
#include <string>
using namespace std;

class BankAccount {
private:
    string owner;
    double balance;
public:
    BankAccount(string o, double init) : owner(o), balance(init) {}

    void deposit(double amount) {
        balance += amount;
        cout << "Deposited: $" << amount << " | Balance: $" << balance << endl;
    }

    void withdraw(double amount) {
        if (amount > balance) {
            cout << "Error: Insufficient funds!" << endl;
            return;
        }
        balance -= amount;
        cout << "Withdrew: $" << amount << " | Balance: $" << balance << endl;
    }
};

int main() {
    BankAccount acc("Example Account Holder", 500.0);
    acc.deposit(150.0);
    acc.withdraw(80.0);
    return 0;
}`,
  },
];

const SYMBOLS = ["{", "}", "(", ")", ";", "*", "&", "#", "<", ">"] as const;
const isNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

export const CodePlayground: React.FC<CodePlaygroundProps> = ({
  initialCode,
  initialTitle,
  lessonExample,
  onCodeRun,
}) => {
  const defaultCode =
    lessonExample?.code || initialCode || TEMPLATES[0].code;
  const [code, setCode] = useState(defaultCode);
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [apiResult, setApiResult] = useState<RunApiResponse | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<CompileDiagnostic[]>([]);
  const [consoleChunks, setConsoleChunks] = useState<ConsoleChunk[]>([]);
  const [liveExit, setLiveExit] = useState<{
    code: number | null;
    signal: string | null;
    timedOut: boolean;
    durationMs: number;
    truncated?: boolean;
  } | null>(null);
  const [stdinLine, setStdinLine] = useState("");
  const [memoryChecks, setMemoryChecks] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formattedNotice, setFormattedNotice] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(
    lessonExample ? "lesson" : "hello",
  );
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [mobilePane, setMobilePane] = useState<"code" | "output">("code");
  const [splitPct, setSplitPct] = useState(() =>
    readStoredValue("sandbox-split", 55, isNumber),
  );

  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const stdinRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef(code);
  const runRef = useRef<() => void>(() => undefined);
  const formatRef = useRef<() => void>(() => undefined);
  const dragging = useRef(false);
  const splitRef = useRef(splitPct);
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef<InteractiveRunSession | null>(null);
  const baselineRef = useRef(defaultCode);

  codeRef.current = code;
  splitRef.current = splitPct;
  const isRunning = phase !== "idle";

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ block: "end" });
  }, [consoleChunks, phase]);

  useEffect(() => {
    if (phase === "running") {
      stdinRef.current?.focus();
    }
  }, [phase]);

  const jumpToDiagnostic = useCallback((d: CompileDiagnostic) => {
    const view = viewRef.current;
    if (!view) return;
    const lineNo = Math.max(1, Math.min(d.line, view.state.doc.lines));
    const line = view.state.doc.line(lineNo);
    const col = Math.max(1, d.col);
    const pos = Math.min(line.from + col - 1, line.to);
    view.dispatch({
      selection: { anchor: pos },
      effects: EditorView.scrollIntoView(pos, { y: "center" }),
    });
    view.focus();
    setMobilePane("code");
  }, []);

  const handleRunCode = useCallback(() => {
    abortRef.current?.abort();
    sessionRef.current?.kill();
    sessionRef.current = null;

    setPhase("compiling");
    setApiResult(null);
    setLiveExit(null);
    setRunError(null);
    setDiagnostics([]);
    setConsoleChunks([]);
    setStdinLine("");
    setMobilePane("output");

    const session = new InteractiveRunSession({
      onCompile: (msg) => {
        setDiagnostics(msg.diagnostics || []);
        if (msg.ok) {
          setPhase("running");
          setConsoleChunks((prev) => [
            ...prev,
            { kind: "system", text: "Compiled. Running…\n" },
          ]);
        } else {
          setPhase("idle");
          setDiagnostics(msg.diagnostics || []);
        }
      },
      onChunk: (chunk) => {
        setConsoleChunks((prev) => [...prev, chunk]);
      },
      onExit: (msg) => {
        setLiveExit({
          code: msg.code,
          signal: msg.signal,
          timedOut: msg.timedOut,
          durationMs: msg.durationMs,
          truncated: msg.truncated,
        });
        setPhase("idle");
        sessionRef.current = null;
        onCodeRun?.();
      },
      onError: (message) => {
        setRunError(message);
        setPhase("idle");
        sessionRef.current = null;
      },
    });
    sessionRef.current = session;

    void (async () => {
      try {
        await session.start(codeRef.current, { memoryChecks });
      } catch {
        // WebSocket unavailable — fall back to non-interactive POST
        const ac = new AbortController();
        abortRef.current = ac;
        setConsoleChunks((prev) => [
          ...prev,
          {
            kind: "system",
            text: "Live console unavailable — using one-shot run (no interactive cin).\n",
          },
        ]);
        try {
          const res = await runCppOnServer(
            { code: codeRef.current, stdin: "", memoryChecks },
            { signal: ac.signal },
          );
          if (ac.signal.aborted) return;
          setApiResult(res);
          setDiagnostics(res.compile.diagnostics);
          if (res.compile.ok && res.run) {
            const chunks: ConsoleChunk[] = [];
            if (res.run.stdout)
              chunks.push({ kind: "stdout", text: res.run.stdout });
            if (res.run.stderr)
              chunks.push({ kind: "stderr", text: res.run.stderr });
            setConsoleChunks((prev) => [...prev, ...chunks]);
            setLiveExit({
              code: res.run.exitCode,
              signal: res.run.signal,
              timedOut: res.run.timedOut,
              durationMs: res.run.durationMs,
              truncated: res.run.truncated,
            });
          }
          setPhase("idle");
          onCodeRun?.();
        } catch (err) {
          if (ac.signal.aborted) return;
          const msg =
            err && typeof err === "object" && "error" in err
              ? String((err as { error: string }).error)
              : "Network error — is the API running?";
          setRunError(msg);
          setPhase("idle");
        }
      }
    })();
  }, [memoryChecks, onCodeRun]);

  const handleCancelRun = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    sessionRef.current?.kill();
    sessionRef.current = null;
    setPhase("idle");
    setConsoleChunks((prev) => [
      ...prev,
      { kind: "system", text: "\n[cancelled]\n" },
    ]);
  }, []);

  const handleStdinSubmit = useCallback(() => {
    if (phase !== "running" || !sessionRef.current) return;
    const line = stdinLine;
    setStdinLine("");
    sessionRef.current.sendStdin(line);
  }, [phase, stdinLine]);

  const handleFormatCode = useCallback(() => {
    const formatted = formatCppCode(codeRef.current);
    setCode(formatted);
    setFormattedNotice(true);
    window.setTimeout(() => setFormattedNotice(false), 1600);
  }, []);

  runRef.current = handleRunCode;
  formatRef.current = handleFormatCode;

  useEffect(() => {
    if (!hostRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const next = update.state.doc.toString();
        codeRef.current = next;
        setCode(next);
      }
      if (update.selectionSet || update.docChanged) {
        const head = update.state.selection.main.head;
        const line = update.state.doc.lineAt(head);
        setCursorPos({
          line: line.number,
          col: head - line.from + 1,
        });
      }
    });

    const runKeymap = keymap.of([
      {
        key: "Mod-Enter",
        run: () => {
          runRef.current();
          return true;
        },
      },
      {
        key: "Shift-Alt-f",
        run: () => {
          formatRef.current();
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: codeRef.current,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        foldGutter(),
        history(),
        bracketMatching(),
        indentOnInput(),
        indentUnit.of("    "),
        cpp(),
        cppEditorTheme,
        cppSyntaxHighlighting,
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        runKeymap,
        updateListener,
      ],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Sync external code changes (templates / format) into the editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === code) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: code },
    });
  }, [code]);

  // Reconfigure theme when light/dark class toggles
  useEffect(() => {
    const root = document.documentElement;
    const obs = new MutationObserver(() => {
      viewRef.current?.dispatch({});
    });
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const insertSymbol = (symbol: string) => {
    const view = viewRef.current;
    if (!view) {
      setCode((c) => c + symbol);
      return;
    }
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: symbol },
      selection: { anchor: from + symbol.length },
    });
    view.focus();
    setMobilePane("code");
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const nextCode =
      val === "lesson" && lessonExample
        ? lessonExample.code
        : TEMPLATES.find((t) => t.name === val)?.code;
    if (!nextCode) return;

    if (code !== baselineRef.current) {
      const ok = window.confirm(
        "Replace the editor with this template? Unsaved edits will be lost.",
      );
      if (!ok) {
        e.target.value = selectedTemplate;
        return;
      }
    }

    setSelectedTemplate(val);
    setCode(nextCode);
    baselineRef.current = nextCode;
    setApiResult(null);
    setLiveExit(null);
    setConsoleChunks([]);
    setDiagnostics([]);
    setRunError(null);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/x-c++src" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "main.cpp";
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const shell = document.getElementById("sandbox-split-shell");
      if (!shell) return;
      const clientX =
        "touches" in e ? e.touches[0]?.clientX : e.clientX;
      if (clientX == null) return;
      const rect = shell.getBoundingClientRect();
      const next = Math.min(
        75,
        Math.max(30, ((clientX - rect.left) / rect.width) * 100),
      );
      splitRef.current = next;
      setSplitPct(next);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      writeStoredValue("sandbox-split", splitRef.current);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  const lines = code.split("\n").length;

  const exitMeta = liveExit;
  const consolePanel = (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--app-code-bg)] text-[var(--app-code-fg)]">
      <div className="flex items-center justify-between border-b border-[var(--app-border)] px-3 py-2">
        <span className="flex items-center gap-1.5 font-mono text-[11px]">
          <Terminal className="size-3.5 text-[var(--app-accent)]" />
          console
        </span>
        {exitMeta && (
          <span
            className={`border px-2 py-0.5 font-mono text-[10px] ${
              !exitMeta.timedOut && exitMeta.code === 0
                ? "border-emerald-700 text-emerald-600 dark:text-emerald-400"
                : "border-red-700 text-red-600 dark:text-red-400"
            }`}
          >
            exit {exitMeta.code ?? "—"}
            {exitMeta.signal ? ` · ${exitMeta.signal}` : ""} ·{" "}
            {exitMeta.durationMs}ms
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-sm leading-relaxed">
        {phase === "compiling" && (
          <p className="animate-pulse text-[var(--app-accent)]">
            Compiling… g++ -std=c++20
            {memoryChecks ? " -fsanitize=address,undefined" : ""}
          </p>
        )}
        {runError && (
          <div className="mb-2 border border-amber-700 bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-200">
            {runError}
          </div>
        )}
        {!isRunning && consoleChunks.length === 0 && !runError && (
          <p className="text-xs text-[var(--app-muted)]">
            Live terminal: run a program, then type when it prompts for{" "}
            <code className="text-[var(--app-accent)]">cin</code> input.
          </p>
        )}
        {diagnostics.length > 0 && (
          <div className="mb-2 space-y-1 border border-red-700/60 bg-red-950/15 p-2 text-xs">
            <div className="mb-1 flex items-center gap-1.5 font-bold text-red-600 dark:text-red-300">
              <AlertTriangle className="size-3.5" />
              diagnostics
            </div>
            {diagnostics.map((d, i) => (
              <button
                key={`${d.line}-${d.col}-${i}`}
                type="button"
                onClick={() => jumpToDiagnostic(d)}
                className={`block w-full truncate text-left hover:underline ${
                  d.severity === "warning"
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-red-600 dark:text-red-300"
                }`}
              >
                L{d.line}:{d.col} {d.severity}: {d.message}
              </button>
            ))}
          </div>
        )}
        <pre className="whitespace-pre-wrap break-words">
          {consoleChunks.map((chunk, i) => (
            <span
              key={i}
              className={
                chunk.kind === "stdin"
                  ? "text-cyan-700 dark:text-cyan-400"
                  : chunk.kind === "stderr"
                    ? "text-red-600 dark:text-red-400"
                    : chunk.kind === "system"
                      ? "text-[var(--app-tertiary)]"
                      : "text-[var(--cm-string)]"
              }
            >
              {chunk.text}
            </span>
          ))}
        </pre>
        {exitMeta?.timedOut && (
          <p className="mt-2 border border-amber-700 p-2 text-xs text-amber-800 dark:text-amber-200">
            Timed out (wall-clock or idle waiting for input).
          </p>
        )}
        {exitMeta && signalLabel(exitMeta.signal) && (
          <p className="mt-2 border border-red-700 p-2 text-xs text-red-600 dark:text-red-300">
            {signalLabel(exitMeta.signal)}
          </p>
        )}
        {exitMeta?.truncated && (
          <p className="mt-2 text-xs text-[var(--app-muted)]">Output truncated.</p>
        )}
        <div ref={consoleEndRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-code-bg)_90%,black)] px-3 py-2">
        <span
          className={`shrink-0 font-mono text-xs font-bold ${
            phase === "running"
              ? "text-cyan-700 dark:text-cyan-400"
              : "text-[var(--app-disabled)]"
          }`}
        >
          {">"}
        </span>
        <input
          ref={stdinRef}
          type="text"
          value={stdinLine}
          disabled={phase !== "running"}
          onChange={(e) => setStdinLine(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleStdinSubmit();
            }
            if (e.key === "d" && e.ctrlKey) {
              e.preventDefault();
              sessionRef.current?.sendEof();
            }
          }}
          placeholder={
            phase === "running"
              ? "Type input and press Enter"
              : "Run a program to type input"
          }
          aria-label="Program standard input"
          className="min-h-10 min-w-0 flex-1 border-0 bg-transparent font-mono text-sm text-[var(--app-ink)] placeholder:text-[var(--app-disabled)] focus:outline-none disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--shadow-card)]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--app-border)] px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-9 place-items-center border border-[var(--app-border-strong)] bg-brand-300 text-slate-950">
            <Code2 className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-display text-sm font-bold">
              {initialTitle || "C++ sandbox"}
            </h3>
            <span className="font-mono text-[11px] text-[var(--app-muted)]">
              Real g++ · C++20 · sandboxed
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedTemplate}
            onChange={handleTemplateChange}
            aria-label="Choose a C++ code template"
            className="min-h-10 max-w-[11rem] border border-[var(--app-border)] bg-[var(--app-surface)] px-2 font-mono text-[11px] sm:max-w-none sm:text-xs"
          >
            {lessonExample && (
              <option value="lesson">
                This lesson&apos;s example
                {lessonExample.title ? ` — ${lessonExample.title}` : ""}
              </option>
            )}
            {TEMPLATES.map((t) => (
              <option key={t.name} value={t.name}>
                {t.title}
              </option>
            ))}
          </select>

          <label className="flex min-h-10 cursor-pointer items-center gap-1.5 border border-[var(--app-border)] px-2 font-mono text-[10px] sm:text-[11px]">
            <input
              type="checkbox"
              checked={memoryChecks}
              onChange={(e) => setMemoryChecks(e.target.checked)}
              className="accent-[var(--app-accent)]"
            />
            ASan
          </label>

          <button
            type="button"
            onClick={handleFormatCode}
            aria-label="Format C++ code"
            className="flex min-h-10 items-center gap-1.5 border border-[var(--app-border)] px-3 font-mono text-xs font-semibold"
          >
            {formattedNotice ? (
              <CheckCircle2 className="size-3.5 text-emerald-500" />
            ) : (
              <AlignLeft className="size-3.5" />
            )}
            {formattedNotice ? "Ok" : "Format"}
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            aria-label={copied ? "Code copied" : "Copy C++ code"}
            className="grid size-10 place-items-center border border-[var(--app-border)]"
          >
            {copied ? (
              <Check className="size-4 text-emerald-500" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            aria-label="Download main.cpp"
            className="grid size-10 place-items-center border border-[var(--app-border)]"
          >
            <Download className="size-4" />
          </button>

          {isRunning ? (
            <Button
              onClick={handleCancelRun}
              variant="secondary"
              className="min-h-10 px-4 text-xs font-bold"
            >
              Cancel
            </Button>
          ) : (
            <Button
              onClick={handleRunCode}
              variant="primary"
              className="min-h-10 px-4 text-xs font-bold"
            >
              <Play className="size-3.5 fill-current" />
              Run
            </Button>
          )}
        </div>
      </div>

      {/* Mobile tabs */}
      <div
        role="tablist"
        aria-label="Sandbox panels"
        className="grid shrink-0 grid-cols-2 border-b border-[var(--app-border)] lg:hidden"
      >
        {(
          [
            ["code", "Code"],
            ["output", "Console"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mobilePane === id}
            onClick={() => setMobilePane(id)}
            className={`min-h-11 font-mono text-xs font-semibold ${
              mobilePane === id
                ? "bg-slate-900 text-brand-300 dark:bg-slate-950"
                : "text-[var(--app-muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        id="sandbox-split-shell"
        className="sandbox-split flex min-h-0 flex-1 flex-col lg:flex-row"
        style={
          {
            ["--sandbox-split" as string]: `${splitPct}%`,
          } as React.CSSProperties
        }
      >
        {/* Editor */}
        <div
          className={`sandbox-editor min-h-0 w-full flex-col lg:border-r lg:border-[var(--app-border)] ${
            mobilePane === "code" ? "flex" : "hidden"
          } lg:flex`}
        >
          <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-[var(--app-border)] px-2 py-1.5 lg:hidden">
            {SYMBOLS.map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => insertSymbol(sym)}
                className="grid size-10 shrink-0 place-items-center border border-[var(--app-border)] bg-[var(--app-surface)] font-mono text-sm font-bold"
                aria-label={`Insert ${sym}`}
              >
                {sym}
              </button>
            ))}
          </div>
          <div ref={hostRef} className="min-h-0 flex-1 overflow-hidden" />
          <div className="flex shrink-0 items-center justify-between border-t border-[var(--app-border)] px-3 py-1.5 font-mono text-[11px] text-[var(--app-muted)]">
            <span>
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
            <span>
              {lines} lines · {code.length} chars
            </span>
          </div>
        </div>

        {/* Resize handle — desktop */}
        <button
          type="button"
          aria-label="Resize editor and console"
          className="hidden w-1.5 shrink-0 cursor-col-resize bg-[var(--app-border)] hover:bg-brand-300 lg:block"
          onMouseDown={() => {
            dragging.current = true;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
        />

        {/* Console */}
        <div
          className={`sandbox-console min-h-0 w-full flex-1 flex-col ${
            mobilePane === "output" ? "flex" : "hidden"
          } lg:flex`}
        >
          {consolePanel}
        </div>
      </div>
    </div>
  );
};
