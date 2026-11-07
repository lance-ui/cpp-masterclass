import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Pause, Play } from "lucide-react";
import {
  HERO_SNIPPETS,
  tokenizeCpp,
  type HeroSnippet,
} from "@/features/marketing/heroDemoSnippets";

type ConsoleLine = { text: string; tone?: "meta" | "out" | "in" };

interface DemoState {
  code: string;
  showCaret: boolean;
  runHover: boolean;
  runPressed: boolean;
  pointer: { x: number; y: number; visible: boolean } | null;
  consoleLines: ConsoleLine[];
  waiting: boolean;
  inputBuf: string;
}

function finalState(snippet: HeroSnippet): DemoState {
  return {
    code: snippet.code,
    showCaret: false,
    runHover: false,
    runPressed: false,
    pointer: null,
    consoleLines: snippet.finalConsole,
    waiting: false,
    inputBuf: "",
  };
}

function emptyState(): DemoState {
  return {
    code: "",
    showCaret: true,
    runHover: false,
    runPressed: false,
    pointer: null,
    consoleLines: [],
    waiting: false,
    inputBuf: "",
  };
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function charDelay(ch: string, atLineEnd: boolean) {
  if (atLineEnd) return 180 + Math.random() * 120;
  if (ch === " " || ch === "\t") return 20 + Math.random() * 15;
  return 28 + Math.random() * 18;
}

export function HeroDemo({ className = "" }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const runRef = useRef<HTMLSpanElement>(null);
  const timers = useRef<number[]>([]);
  const waitResolvers = useRef<Array<() => void>>([]);
  const genRef = useRef(0);
  const playingRef = useRef(true);
  const visibleRef = useRef(true);
  const tabVisibleRef = useRef(true);
  const indexRef = useRef(0);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [state, setState] = useState<DemoState>(() =>
    finalState(HERO_SNIPPETS[0]!),
  );
  const summaryId = useId();

  const clearTimers = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
    const resolvers = waitResolvers.current.splice(0);
    for (const r of resolvers) r();
  }, []);

  const wait = useCallback((ms: number, gen: number) => {
    return new Promise<void>((resolve) => {
      if (gen !== genRef.current) {
        resolve();
        return;
      }
      const finish = () => {
        waitResolvers.current = waitResolvers.current.filter((r) => r !== finish);
        resolve();
      };
      waitResolvers.current.push(finish);
      const id = window.setTimeout(finish, ms);
      timers.current.push(id);
    });
  }, []);

  const canRun = () =>
    playingRef.current && visibleRef.current && tabVisibleRef.current;

  const waitWhilePaused = async (gen: number) => {
    while (gen === genRef.current && !canRun()) {
      await wait(200, gen);
    }
  };

  const playSnippet = async (snippet: HeroSnippet, gen: number) => {
    if (prefersReducedMotion()) {
      setState(finalState(snippet));
      return;
    }

    setState(emptyState());
    await waitWhilePaused(gen);
    if (gen !== genRef.current) return;

    let built = "";
    for (let i = 0; i < snippet.code.length; i++) {
      await waitWhilePaused(gen);
      if (gen !== genRef.current) return;
      const ch = snippet.code[i]!;
      built += ch;
      setState((s) => ({ ...s, code: built, showCaret: true }));
      await wait(charDelay(ch, ch === "\n"), gen);
      if (gen !== genRef.current) return;
    }
    setState((s) => ({ ...s, showCaret: false }));
    await wait(400, gen);
    if (gen !== genRef.current) return;

    const root = rootRef.current;
    const run = runRef.current;
    if (root && run) {
      const rb = root.getBoundingClientRect();
      const btn = run.getBoundingClientRect();
      const target = {
        x: btn.left - rb.left + btn.width * 0.55,
        y: btn.top - rb.top + btn.height * 0.55,
      };
      setState((s) => ({
        ...s,
        pointer: { x: target.x - 40, y: target.y + 28, visible: true },
      }));
      await wait(60, gen);
      setState((s) => ({
        ...s,
        pointer: { x: target.x, y: target.y, visible: true },
        runHover: true,
      }));
      await wait(340, gen);
      if (gen !== genRef.current) return;
      setState((s) => ({ ...s, runPressed: true }));
      await wait(150, gen);
      setState((s) => ({
        ...s,
        runPressed: false,
        runHover: false,
        pointer: { ...target, visible: false },
      }));
    }

    await waitWhilePaused(gen);
    if (gen !== genRef.current) return;

    setState((s) => ({
      ...s,
      consoleLines: [{ text: "Compiling...", tone: "meta" }],
    }));
    await wait(500, gen);
    setState((s) => ({
      ...s,
      consoleLines: [
        { text: "Compiling...", tone: "meta" },
        { text: "Running...", tone: "meta" },
      ],
    }));
    await wait(360, gen);
    if (gen !== genRef.current) return;

    if (snippet.prompt) {
      setState((s) => ({
        ...s,
        waiting: true,
        consoleLines: [
          { text: "Compiling...", tone: "meta" },
          { text: "Running...", tone: "meta" },
          { text: snippet.prompt!, tone: "out" },
        ],
        inputBuf: "",
        showCaret: true,
      }));
      await wait(480, gen);
      const typed = snippet.input ?? "";
      for (let i = 0; i < typed.length; i++) {
        await waitWhilePaused(gen);
        if (gen !== genRef.current) return;
        setState((s) => ({ ...s, inputBuf: typed.slice(0, i + 1) }));
        await wait(90 + Math.random() * 50, gen);
      }
      await wait(200, gen);
      if (gen !== genRef.current) return;
      setState((s) => ({
        ...s,
        waiting: false,
        showCaret: false,
        inputBuf: "",
        consoleLines: [
          { text: "Compiling...", tone: "meta" },
          { text: "Running...", tone: "meta" },
          { text: `${snippet.prompt}${typed}`, tone: "out" },
        ],
      }));
      await wait(180, gen);
      const outLine = snippet.finalConsole.find(
        (l) => l.tone === "out" && !l.text.startsWith(snippet.prompt!),
      );
      if (outLine) {
        setState((s) => ({
          ...s,
          consoleLines: [...s.consoleLines, outLine],
        }));
      }
    } else {
      const outs = snippet.finalConsole.filter((l) => l.tone === "out");
      for (const line of outs) {
        await waitWhilePaused(gen);
        if (gen !== genRef.current) return;
        setState((s) => ({
          ...s,
          consoleLines: [...s.consoleLines, line],
        }));
        await wait(260, gen);
      }
    }

    const exit = snippet.finalConsole.find((l) =>
      l.text.startsWith("Process finished"),
    );
    if (exit) {
      await wait(220, gen);
      if (gen !== genRef.current) return;
      setState((s) => ({
        ...s,
        consoleLines: [...s.consoleLines, exit],
      }));
    }

    await wait(2500, gen);
  };

  const startLoop = useCallback(() => {
    const gen = ++genRef.current;
    clearTimers();

    const loop = async () => {
      while (gen === genRef.current) {
        if (prefersReducedMotion()) {
          setState(finalState(HERO_SNIPPETS[indexRef.current]!));
          return;
        }
        const i = indexRef.current;
        await playSnippet(HERO_SNIPPETS[i]!, gen);
        if (gen !== genRef.current) return;
        const next = (i + 1) % HERO_SNIPPETS.length;
        indexRef.current = next;
        setIndex(next);
        await wait(450, gen);
      }
    };

    void loop();
  }, [clearTimers, wait]);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => {
      setReduced(mq.matches);
      if (mq.matches) {
        genRef.current++;
        clearTimers();
        setState(finalState(HERO_SNIPPETS[indexRef.current]!));
      } else {
        startLoop();
      }
    };
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, [clearTimers, startLoop]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = Boolean(entry?.isIntersecting);
      },
      { threshold: 0.2 },
    );
    io.observe(el);

    const onVis = () => {
      tabVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);

    if (!prefersReducedMotion()) startLoop();
    else setState(finalState(HERO_SNIPPETS[0]!));

    return () => {
      genRef.current++;
      clearTimers();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [startLoop, clearTimers]);

  const jumpTo = (i: number) => {
    indexRef.current = i;
    setIndex(i);
    if (reduced) {
      setState(finalState(HERO_SNIPPETS[i]!));
      return;
    }
    startLoop();
  };

  const togglePlay = () => {
    const next = !playingRef.current;
    playingRef.current = next;
    setPlaying(next);
  };

  const lineCount = Math.max(1, state.code.split("\n").length);
  const tokens = tokenizeCpp(state.code);

  return (
    <div className={className}>
      <p id={summaryId} className="sr-only">
        Example: a C++ program asks for a number and prints it back in the
        sandbox console.
      </p>
      <div
        ref={rootRef}
        className="hero-demo"
        data-hero-demo
        aria-hidden="true"
      >
        <div className="hero-demo__chrome">
          <span className="size-2.5 rounded-full bg-[var(--app-border-strong)]" />
          <span className="size-2.5 rounded-full bg-[var(--app-border-strong)]" />
          <span className="size-2.5 rounded-full bg-[var(--app-border-strong)]" />
          <span className="ml-2 font-mono text-[11px] text-[var(--app-tertiary)]">
            sandbox · main.cpp
          </span>
          <span
            ref={runRef}
            className={`hero-demo__run ${state.runHover ? "is-hover" : ""} ${state.runPressed ? "is-pressed" : ""}`}
          >
            Run
          </span>
        </div>

        {state.pointer?.visible ? (
          <span
            className="hero-demo__pointer is-visible"
            style={{
              left: state.pointer.x,
              top: state.pointer.y,
              transition:
                "left 320ms cubic-bezier(0.16,1,0.3,1), top 320ms cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        ) : null}

        <div className="hero-demo__body">
          <div className="hero-demo__editor">
            <div className="hero-demo__lines" aria-hidden>
              {Array.from({ length: lineCount }, (_, n) => (
                <div key={n}>{n + 1}</div>
              ))}
            </div>
            <pre className="hero-demo__code">
              <code>
                {tokens.map((tok, i) =>
                  tok.c ? (
                    <span key={i} className={`hero-demo__tok-${tok.c}`}>
                      {tok.t}
                    </span>
                  ) : (
                    <span key={i}>{tok.t}</span>
                  ),
                )}
                {state.showCaret && !state.waiting ? (
                  <span className="hero-demo__caret" />
                ) : null}
              </code>
            </pre>
          </div>

          <div className="hero-demo__console">
            <div className="hero-demo__console-label">Console</div>
            {state.consoleLines.map((line, i) => (
              <div
                key={`${i}-${line.text.slice(0, 16)}`}
                className={
                  line.tone === "meta"
                    ? "hero-demo__meta"
                    : line.tone === "in"
                      ? "hero-demo__in"
                      : undefined
                }
              >
                {renderConsoleLine(line)}
              </div>
            ))}
            {state.waiting ? (
              <div>
                <span className="hero-demo__in">{state.inputBuf}</span>
                {state.showCaret ? <span className="hero-demo__caret" /> : null}
                <div className="hero-demo__waiting">waiting for input</div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <p className="text-xs text-[var(--app-tertiary)]">Example</p>
        <div
          className="flex items-center gap-1.5"
          role="tablist"
          aria-label="Example programs"
        >
          {HERO_SNIPPETS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={index === i}
              aria-label={s.label}
              onClick={() => jumpTo(i)}
              className="grid size-11 place-items-center rounded-[var(--radius-control)] text-[var(--app-muted)] hover:text-[var(--app-ink)]"
            >
              <span
                className={`block size-2.5 rounded-full transition-colors ${
                  index === i
                    ? "bg-[var(--app-accent-text)]"
                    : "bg-[var(--app-border-strong)]"
                }`}
              />
            </button>
          ))}
        </div>
        {!reduced ? (
          <button
            type="button"
            onClick={togglePlay}
            className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--app-border)] px-2.5 text-xs text-[var(--app-muted)] hover:text-[var(--app-ink)]"
            aria-label={playing ? "Pause demo" : "Play demo"}
          >
            {playing ? (
              <Pause className="size-3.5" aria-hidden />
            ) : (
              <Play className="size-3.5" aria-hidden />
            )}
            {playing ? "Pause" : "Play"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function renderConsoleLine(line: ConsoleLine): ReactNode {
  const m = /^(Enter an integer value: )(.+)$/.exec(line.text);
  if (m) {
    return (
      <>
        {m[1]}
        <span className="hero-demo__in">{m[2]}</span>
      </>
    );
  }
  return line.text;
}
