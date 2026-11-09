import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  LineChart,
  Moon,
  Play,
  Terminal,
} from "lucide-react";
import { COURSE_MODULES } from "@/data/curriculumData";
import {
  getCurriculumLevels,
  moduleCountLabel,
} from "@/utils/curriculumLevels";
import { Button } from "@/components/ui";
import { RevealSection } from "@/components/common/RevealSection";
import { PublicHeader } from "@/features/marketing/PublicHeader";
import { HeroDemo } from "@/features/marketing/HeroDemo";
import { SandboxPreview } from "@/features/marketing/SandboxPreview";
import { CountUp } from "@/features/marketing/CountUp";
import { SiteFooter } from "@/components/layout/SiteFooter";
import type { AppView } from "@/types";

interface LandingPageProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSignIn: () => void;
  onGetStarted: () => void;
  onNavigate: (view: AppView) => void;
}

const HOW_STEPS = [
  {
    icon: BookOpen,
    title: "Watch or read a lesson",
    body: "Work through short videos and notes at your own pace.",
    visual: "lesson" as const,
  },
  {
    icon: Terminal,
    title: "Write and run code in the sandbox",
    body: "Compile with real g++ (C++20) and type input when the program asks.",
    visual: "terminal" as const,
  },
  {
    icon: CheckCircle2,
    title: "Check yourself with a quiz",
    body: "Confirm what stuck before you move to the next module.",
    visual: "quiz" as const,
  },
] as const;

const FEATURES = [
  {
    icon: Code2,
    title: "Real compiler",
    body: "Runs on a real g++ compiler (C++20), securely isolated.",
  },
  {
    icon: Terminal,
    title: "Interactive console",
    body: "Programs that use cin wait for your input, like a real terminal.",
  },
  {
    icon: LineChart,
    title: "Progress tracking",
    body: "Completion, bookmarks, and quiz scores stay with your account.",
  },
  {
    icon: Moon,
    title: "Light and dark themes",
    body: "Comfortable reading and coding in either theme.",
  },
] as const;

const FAQ = [
  {
    q: "Is it free?",
    a: "Yes. Creating an account gives you access to the lessons, sandbox, and quizzes.",
  },
  {
    q: "How does the compiler work?",
    a: "Your code is compiled and run with a real g++ toolchain (C++20) in a securely isolated environment. It is not a simulated interpreter.",
  },
  {
    q: "Where is my progress stored?",
    a: "Completion, bookmarks, and quiz scores are saved on your account on the server, so they stay with you across sessions and devices when you sign in.",
  },
  {
    q: "How do I sign in?",
    a: "Sign-in uses Google only. Use Continue with Google on the sign-in page — email and password accounts are not supported.",
  },
  {
    q: "Does it work on a phone?",
    a: "Yes. The lessons, quizzes, and sandbox layout adapt to smaller screens. A keyboard makes coding more comfortable.",
  },
  {
    q: "Can I use my own code?",
    a: "Yes. Paste or type any C++ program into the sandbox and run it. Interactive programs can read input from the console.",
  },
  {
    q: "Which C++ standard?",
    a: "The sandbox compiles with C++20.",
  },
] as const;

const SHOWCASE = [
  "Live compile and run with g++",
  "Interactive console for cin prompts",
  "Output streams as the program runs",
] as const;

export function LandingPage({
  isDarkMode,
  onToggleDarkMode,
  onSignIn,
  onGetStarted,
  onNavigate,
}: LandingPageProps) {
  const levels = getCurriculumLevels(COURSE_MODULES);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="marketing-canvas flex min-h-dvh flex-col bg-[var(--app-canvas)] text-[var(--app-ink)]">
      <PublicHeader
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
        onSignIn={onSignIn}
        onGetStarted={onGetStarted}
      />

      <main id="main-content">
        {/* Hero */}
        <section className="marketing-hero">
          <div className="page-container page-container--marketing marketing-hero__grid">
            <div className="marketing-hero__copy hero-rise space-y-5 lg:space-y-6">
              <p className="comment-label">
                <CountUp to={27} /> modules · Real g++ · C++20
              </p>
              <h1 className="max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl xl:text-[2.85rem] xl:leading-[1.12]">
                Learn C++ by writing and running real code
              </h1>
              <p className="max-w-lg text-base text-[var(--app-muted)] sm:text-[1.05rem]">
                A structured path from beginner syntax to OOP and the STL, with a
                live sandbox and quizzes that check what you learned.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full min-h-11 sm:w-auto"
                  onClick={onGetStarted}
                >
                  Start learning free
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full min-h-11 sm:w-auto"
                  onClick={onSignIn}
                >
                  Sign in
                </Button>
              </div>
            </div>
            <div className="marketing-hero__demo">
              <HeroDemo />
            </div>
          </div>
        </section>

        {/* How it works */}
        <RevealSection
          id="how-it-works"
          className="scroll-mt-20 border-y border-[var(--app-border)] bg-[var(--app-surface)] py-16 sm:py-20 lg:py-24"
          aria-labelledby="how-heading"
        >
          <div className="page-container page-container--marketing">
            <SectionIntro
              eyebrow="How it works"
              titleId="how-heading"
              title="Three steps from lesson to practice"
              description="Read or watch, run code, then confirm with a quiz."
            />
            <ol className="relative mt-12 grid gap-6 lg:grid-cols-3 lg:gap-8">
              {HOW_STEPS.map(({ icon: Icon, title, body, visual }, index) => (
                <li key={title} className="relative">
                  {index < HOW_STEPS.length - 1 ? (
                    <ChevronRight
                      className="pointer-events-none absolute -right-5 top-16 z-10 hidden size-5 text-[var(--app-border-strong)] lg:block xl:-right-6"
                      aria-hidden
                    />
                  ) : null}
                  <div className="marketing-card-lift flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-canvas)] p-5 sm:p-6">
                    <HowVisual kind={visual} />
                    <div className="mt-4 flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-[var(--radius-control)] border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-accent-text)]">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="font-mono text-xs text-[var(--app-tertiary)]">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold sm:text-lg">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--app-muted)]">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </RevealSection>

        {/* Product showcase */}
        <RevealSection
          id="product"
          className="scroll-mt-20 py-16 sm:py-20 lg:py-24"
          aria-labelledby="product-heading"
        >
          <div className="page-container page-container--marketing grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <SandboxPreview />
            </div>
            <div className="lg:col-span-5">
              <SectionIntro
                eyebrow="Sandbox"
                titleId="product-heading"
                title="A console that waits for your input"
                description="See prompts as they print, type answers, and read the transcript like a terminal."
              />
              <ul className="mt-8 space-y-4">
                {SHOWCASE.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <Play
                      className="mt-0.5 size-4 shrink-0 text-[var(--app-accent-text)]"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </RevealSection>

        {/* Curriculum roadmap */}
        <RevealSection
          id="curriculum"
          className="scroll-mt-20 border-y border-[var(--app-border)] bg-[var(--app-surface)] py-16 sm:py-20 lg:py-24"
          aria-labelledby="curriculum-heading"
        >
          <div className="page-container page-container--marketing">
            <SectionIntro
              eyebrow="Curriculum"
              titleId="curriculum-heading"
              title="Five levels from beginner to projects"
              description="Each level lists real modules from the course."
              wide
            />
            <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {levels.map((level, index) => (
                <li
                  key={level.id}
                  className="marketing-card-lift relative rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-canvas)] p-4 sm:p-5"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-full bg-brand-300 text-xs font-semibold text-[var(--app-accent-fg)]">
                      {index + 1}
                    </span>
                    <h3 className="text-sm font-semibold">{level.label}</h3>
                  </div>
                  <p className="mt-2 text-xs text-[var(--app-tertiary)]">
                    {moduleCountLabel(level.modules)}
                  </p>
                  <ul className="mt-3 space-y-1.5 text-xs text-[var(--app-muted)]">
                    {level.modules.slice(0, 3).map((m) => (
                      <li key={m.id} className="truncate">
                        {m.title}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="mt-4 text-xs font-medium text-[var(--app-accent-text)] hover:underline"
                    onClick={onGetStarted}
                  >
                    Start this level
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </RevealSection>

        {/* Features */}
        <RevealSection
          id="features"
          className="scroll-mt-20 py-16 sm:py-20 lg:py-24"
          aria-labelledby="features-heading"
        >
          <div className="page-container page-container--marketing">
            <SectionIntro
              eyebrow="Why it works"
              titleId="features-heading"
              title="Built for practice, not just slides"
              description="Everything you need to write, run, and remember C++."
              wide
            />
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="marketing-card-lift rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5"
                >
                  <Icon
                    className="size-5 text-[var(--app-accent-text)]"
                    aria-hidden
                  />
                  <h3 className="mt-3 text-sm font-semibold sm:text-base">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-sm text-[var(--app-muted)]">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </RevealSection>

        {/* FAQ — split layout */}
        <RevealSection
          id="faq"
          className="scroll-mt-20 border-y border-[var(--app-border)] bg-[var(--app-surface)] py-16 sm:py-20 lg:py-24"
          aria-labelledby="faq-heading"
        >
          <div className="page-container page-container--marketing grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-4">
              <SectionIntro
                eyebrow="FAQ"
                titleId="faq-heading"
                title="Common questions"
                description="Straight answers about the course and the sandbox."
              />
            </div>
            <div className="lg:col-span-8">
              <div className="divide-y divide-[var(--app-border)] rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-canvas)]">
                {FAQ.map((item, index) => {
                  const open = openFaq === index;
                  const panelId = `faq-panel-${index}`;
                  const buttonId = `faq-button-${index}`;
                  return (
                    <div key={item.q}>
                      <h3>
                        <button
                          type="button"
                          id={buttonId}
                          className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium sm:px-5"
                          aria-expanded={open}
                          aria-controls={panelId}
                          onClick={() => setOpenFaq(open ? null : index)}
                        >
                          {item.q}
                          <ChevronDown
                            className={`size-4 shrink-0 text-[var(--app-tertiary)] transition-transform ${open ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                        </button>
                      </h3>
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        hidden={!open}
                        className="px-4 pb-4 text-sm text-[var(--app-muted)] sm:px-5"
                      >
                        {open ? <p>{item.a}</p> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </RevealSection>

        {/* Final CTA */}
        <RevealSection
          className="py-16 sm:py-20 lg:py-24"
          aria-labelledby="cta-heading"
        >
          <div className="page-container page-container--marketing">
            <div className="flex flex-col items-start justify-between gap-6 rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] px-6 py-8 sm:flex-row sm:items-center sm:px-10 sm:py-10">
              <div className="max-w-xl">
                <h2
                  id="cta-heading"
                  className="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
                >
                  Ready to write your first program
                </h2>
                <p className="mt-2 text-sm text-[var(--app-muted)]">
                  Create a free account and open the first beginner lesson.
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                className="min-h-11 shrink-0"
                onClick={onGetStarted}
              >
                Start learning free
              </Button>
            </div>
          </div>
        </RevealSection>
      </main>

      <SiteFooter onNavigate={onNavigate} publicMode />
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  titleId,
  description,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  titleId: string;
  description: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "max-w-3xl" : "max-w-2xl"}>
      <p className="comment-label">{eyebrow}</p>
      <h2
        id={titleId}
        className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl"
      >
        {title}
      </h2>
      <p className="mt-2 text-sm text-[var(--app-muted)] sm:text-base">
        {description}
      </p>
    </div>
  );
}

function HowVisual({ kind }: { kind: "lesson" | "terminal" | "quiz" }) {
  if (kind === "lesson") {
    return (
      <div
        className="rounded-[var(--radius-control)] border border-[var(--app-border)] bg-[var(--app-surface)] p-3"
        aria-hidden
      >
        <div className="h-2 w-16 rounded bg-brand-300/80" />
        <div className="mt-3 space-y-1.5">
          <div className="h-1.5 w-full rounded bg-[var(--app-border)]" />
          <div className="h-1.5 w-5/6 rounded bg-[var(--app-border)]" />
          <div className="h-1.5 w-4/6 rounded bg-[var(--app-border)]" />
        </div>
        <div className="mt-3 aspect-video rounded-[var(--radius-control)] bg-[var(--app-code-bg)]" />
      </div>
    );
  }
  if (kind === "terminal") {
    return (
      <div
        className="rounded-[var(--radius-control)] border border-[var(--app-border)] bg-[var(--app-code-bg)] p-3 font-mono text-[10px] leading-relaxed text-[var(--app-code-fg)]"
        aria-hidden
      >
        <div className="text-[var(--app-tertiary)]">$ g++ -std=c++20 main.cpp</div>
        <div className="mt-1">Enter an integer value:{" "}
          <span className="text-[var(--app-accent-text)]">42</span>
        </div>
        <div>You entered: 42</div>
      </div>
    );
  }
  return (
    <div
      className="rounded-[var(--radius-control)] border border-[var(--app-border)] bg-[var(--app-surface)] p-3"
      aria-hidden
    >
      <div className="text-xs font-medium">Quiz · 4/5</div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--app-border)]">
        <div className="h-full w-4/5 bg-brand-300" />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-[var(--app-success)]">
        <CheckCircle2 className="size-3.5" />
        Nice work
      </div>
    </div>
  );
}
