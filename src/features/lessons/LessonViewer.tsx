import React, { lazy, Suspense, useEffect, useState } from 'react';
import { 
  Play, 
  FileText, 
  Code2, 
  HelpCircle, 
  CheckCircle, 
  Circle, 
  Bookmark, 
  BookmarkCheck, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen,
  Maximize2,
  ExternalLink,
  X,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { CourseModule, ActiveTab, User, VideoLesson, PDFDocument } from '@/types';
import { Quiz } from '@/features/quiz/Quiz';
import { Badge, Breadcrumbs, Button, Card, CodeBlock, Skeleton } from '@/components/ui';
import { LessonActionFab } from '@/components/common/LessonActionFab';
import { LessonTabBar } from '@/components/lessons/LessonTabBar';
import {
  buildDrivePreviewUrl,
  buildDriveViewUrl,
} from '@/utils/courseLogic';

const CodePlayground = lazy(() =>
  import('@/features/playground/CodePlayground').then(module => ({ default: module.CodePlayground }))
);
const PDFReader = lazy(() =>
  import('./PDFReader').then(module => ({ default: module.PDFReader }))
);

interface LessonViewerProps {
  module: CourseModule;
  currentUser: User;
  onToggleComplete: (moduleId: string) => void;
  onToggleBookmark: (moduleId: string) => void;
  onSaveQuizScore: (moduleId: string, score: number) => void;
  onSaveUserNote: (moduleId: string, note: string) => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  activeTab?: ActiveTab;
  onChangeTab?: (tab: ActiveTab) => void;
  onOpenSandbox?: () => void;
  onBackToCatalog?: () => void;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({
  module,
  currentUser,
  onToggleComplete,
  onToggleBookmark,
  onSaveQuizScore,
  onSaveUserNote,
  onNavigatePrev,
  onNavigateNext,
  hasPrev,
  hasNext,
  activeTab = 'overview',
  onChangeTab,
  onOpenSandbox,
  onBackToCatalog,
}) => {
  const [currentTab, setCurrentTab] = useState<ActiveTab>(activeTab);
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(
    module.videos[0] || null
  );
  const [selectedDoc, setSelectedDoc] = useState<PDFDocument | null>(
    module.documents[0] || null
  );
  /** Drive's embed chrome needs near-fullscreen room on phones — theater mode. */
  const [videoTheaterOpen, setVideoTheaterOpen] = useState(false);

  // Sync tab if parent passes one
  const tab = onChangeTab ? activeTab : currentTab;
  const setTab = (t: ActiveTab) => {
    if (onChangeTab) onChangeTab(t);
    else setCurrentTab(t);
  };

  // Sync selected video/doc when module changes
  React.useEffect(() => {
    setSelectedVideo(module.videos[0] || null);
    setSelectedDoc(module.documents[0] || null);
    setVideoTheaterOpen(false);
  }, [module.id]);

  useEffect(() => {
    if (!videoTheaterOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVideoTheaterOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [videoTheaterOpen]);

  const isCompleted = currentUser.completedModuleIds.includes(module.id);
  const isBookmarked = currentUser.bookmarkedModuleIds.includes(module.id);
  const userQuizScore = currentUser.quizScores[module.id];

  // onSaveUserNote kept on props so stored notes are not deleted — UI removed.
  void onSaveUserNote;

  return (
    <div className="w-full min-w-0 flex-1 space-y-6 px-4 py-6 sm:px-8 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--app-border)] pb-4">
        <Breadcrumbs
          items={[
            {
              label: 'Lessons',
              onClick: onBackToCatalog,
            },
            { label: module.category },
            { label: `Module ${module.moduleNumber}` },
          ]}
        />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggleBookmark(module.id)}
            aria-pressed={isBookmarked}
          >
            {isBookmarked ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />}
            <span className="hidden sm:inline">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </Button>
          <Button
            size="sm"
            variant={isCompleted ? 'primary' : 'secondary'}
            onClick={() => onToggleComplete(module.id)}
            aria-pressed={isCompleted}
          >
            {isCompleted ? <CheckCircle className="size-3.5" /> : <Circle className="size-3.5" />}
            {isCompleted ? 'Completed' : 'Mark complete'}
          </Button>
        </div>
      </div>

      <header className="max-w-3xl space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--app-muted)]">
          <Badge tone="brand">{module.category}</Badge>
          <Badge tone="neutral">Module {module.moduleNumber}</Badge>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {module.readingTime}
          </span>
          {userQuizScore !== undefined && (
            <Badge tone="success">Quiz {userQuizScore}%</Badge>
          )}
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {module.title}
        </h1>
        <p className="text-sm leading-relaxed text-[var(--app-muted)] sm:text-base">
          {module.description}
        </p>
      </header>

      <LessonTabBar
        module={module}
        currentUser={currentUser}
        value={tab}
        onChange={setTab}
      />

      {/* Tab Panels */}
      {/* 1. OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="min-w-0 space-y-6 lg:col-span-8">
            <section className="rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
                <BookOpen className="size-4 text-[var(--app-accent-text)]" />
                About this lesson
              </h2>
              <p className="max-w-[75ch] text-sm leading-relaxed text-[var(--app-muted)]">
                {module.description}
              </p>
            </section>

            {module.codeSnippets.length > 0 && (
              <section className="space-y-3">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Code2 className="size-4 text-[var(--app-accent-text)]" />
                    Core C++ example
                  </h3>
                  <p className="mt-1 max-w-[75ch] text-sm text-[var(--app-muted)]">
                    {module.codeSnippets[0].description || module.codeSnippets[0].title}
                  </p>
                </div>
                <CodeBlock
                  code={module.codeSnippets[0].code}
                  title={module.codeSnippets[0].title}
                />
                <Button size="sm" variant="primary" onClick={() => setTab('code')}>
                  Try this in the sandbox
                  <ArrowRight className="size-3.5" />
                </Button>
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-[calc(7rem+env(safe-area-inset-top))] lg:self-start">
            <div className="rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
              <p className="mb-3 text-xs font-medium text-[var(--app-tertiary)]">
                Lesson metadata
              </p>
              <ul className="space-y-2 text-xs text-[var(--app-muted)]">
                <li className="flex justify-between gap-2">
                  <span>Videos</span>
                  <span className="font-semibold text-[var(--app-ink)]">{module.videos.length}</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span>PDFs</span>
                  <span className="font-semibold text-[var(--app-ink)]">{module.documents.length}</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span>Quiz questions</span>
                  <span className="font-semibold text-[var(--app-ink)]">{module.quiz.length}</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" /> Time
                  </span>
                  <span className="font-semibold text-[var(--app-ink)]">{module.readingTime}</span>
                </li>
                <li className="flex justify-between gap-2 border-t border-[var(--app-border)] pt-2">
                  <span>Status</span>
                  <span className="font-semibold text-[var(--app-ink)]">
                    {isCompleted
                      ? 'Completed'
                      : userQuizScore != null
                        ? `Quiz ${userQuizScore}%`
                        : 'In progress'}
                  </span>
                </li>
              </ul>
              <div className="mt-4 flex flex-col gap-2">
                {module.videos.length > 0 && (
                  <Button size="sm" variant="primary" onClick={() => setTab('video')}>
                    <Play className="size-3.5 fill-current" />
                    Watch
                  </Button>
                )}
                {module.codeSnippets.length > 0 && (
                  <Button size="sm" variant="secondary" onClick={() => setTab('code')}>
                    <Code2 className="size-3.5" />
                    Try the code
                  </Button>
                )}
                {module.quiz.length > 0 && (
                  <Button size="sm" variant="secondary" onClick={() => setTab('quiz')}>
                    <HelpCircle className="size-3.5" />
                    Take quiz
                  </Button>
                )}
              </div>
            </div>
            {hasNext && (
              <button
                type="button"
                onClick={onNavigateNext}
                className="flex w-full items-start gap-2 rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-left hover:bg-[var(--app-canvas)]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[var(--app-tertiary)]">Up next</p>
                  <p className="mt-1 text-sm font-semibold">Next module</p>
                  <p className="mt-0.5 text-xs text-[var(--app-muted)]">Continue the curriculum</p>
                </div>
                <ArrowRight className="mt-1 size-4 shrink-0" />
              </button>
            )}
          </aside>
        </div>
      )}

      {/* 2. VIDEO STREAM TAB
          Drive's embed UI is large and does not scale into a phone-width 16:9 box.
          Mobile: poster → fullscreen theater. Desktop: inline embed + expand. */}
      {tab === 'video' && (
        <div className="space-y-4">
          {module.videos.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
              <Play className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p>No video files directly in this module folder.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-3 lg:col-span-2">
                {/* Mobile: don't embed Drive in a tiny box — open theater instead */}
                <div className="relative w-full border border-[var(--app-border-strong)] bg-slate-950 shadow-[var(--shadow-card)] [aspect-ratio:16/9] lg:hidden">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
                    <Play className="size-12 text-brand-300 opacity-90" />
                    <p className="max-w-xs font-mono text-[11px] leading-relaxed text-slate-400">
                      Drive controls need a full screen. Watch in theater mode or open
                      in Google Drive.
                    </p>
                    {selectedVideo && (
                      <div className="flex w-full max-w-xs flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setVideoTheaterOpen(true)}
                          className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-[var(--app-border-strong)] bg-brand-300 px-4 font-mono text-xs font-bold text-slate-950 shadow-[var(--shadow-card)]"
                        >
                          <Maximize2 className="size-4" />
                          Watch fullscreen
                        </button>
                        <a
                          href={buildDriveViewUrl(selectedVideo.driveId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-[var(--app-border)] bg-[var(--app-surface)] px-4 font-mono text-xs font-semibold text-[var(--app-ink)]"
                        >
                          <ExternalLink className="size-3.5" />
                          Open in Google Drive
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop: inline embed is wide enough; still offer expand + Drive */}
                <div className="relative z-0 hidden w-full border border-[var(--app-border-strong)] bg-black shadow-[var(--shadow-card)] [aspect-ratio:16/9] lg:block">
                  {selectedVideo ? (
                    <iframe
                      key={selectedVideo.driveId}
                      src={buildDrivePreviewUrl(selectedVideo.driveId)}
                      title={selectedVideo.title}
                      className="absolute inset-0 h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center bg-slate-950 text-slate-500">
                      <Play className="size-10 opacity-40" />
                    </div>
                  )}
                </div>

                {selectedVideo && (
                  <div className="flex flex-wrap items-start justify-between gap-3 border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-display text-sm font-bold text-slate-900 dark:text-white">
                        {selectedVideo.title}
                      </h4>
                      <p
                        className="mt-1 truncate font-mono text-[11px] text-slate-500"
                        title={selectedVideo.fileName}
                      >
                        File: {selectedVideo.fileName}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setVideoTheaterOpen(true)}
                        className="hidden min-h-10 items-center gap-1.5 border border-[var(--app-border)] px-3 font-mono text-[11px] font-semibold lg:inline-flex"
                      >
                        <Maximize2 className="size-3.5" />
                        Expand
                      </button>
                      <a
                        href={buildDriveViewUrl(selectedVideo.driveId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden min-h-10 items-center gap-1.5 border border-[var(--app-border)] px-3 font-mono text-[11px] font-semibold lg:inline-flex"
                      >
                        <ExternalLink className="size-3.5" />
                        Drive
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Playlist Sidebar */}
              <div className="border border-[var(--app-border)] bg-[var(--app-surface)] p-4 space-y-3">
                <span className="block text-[11px] font-medium text-[var(--app-muted)]">
                  Course Lectures ({module.videos.length})
                </span>
                <div className="max-h-[460px] space-y-1.5 overflow-y-auto">
                  {module.videos.map((vid, idx) => {
                    const isPlaying = selectedVideo?.id === vid.id;
                    return (
                      <button
                        key={vid.id}
                        type="button"
                        onClick={() => {
                          setSelectedVideo(vid);
                          // On phones, picking a lecture jumps straight into theater
                          if (
                            typeof window !== 'undefined' &&
                            window.matchMedia('(max-width: 1023px)').matches
                          ) {
                            setVideoTheaterOpen(true);
                          }
                        }}
                        className={`flex w-full items-center space-x-2.5 p-2.5 text-left text-xs transition-colors ${
                          isPlaying
                            ? 'border-l-4 border-brand-600 bg-brand-50 font-bold text-brand-800 dark:bg-brand-950/60 dark:text-brand-300'
                            : 'border-l-4 border-transparent hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center font-mono text-[10px] ${
                            isPlaying
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span className="flex-1 truncate">{vid.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full-viewport Drive theater — same idea as opening the file in Drive */}
      {videoTheaterOpen && selectedVideo && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
          aria-label={selectedVideo.title}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/15 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-white">
                {selectedVideo.title}
              </p>
              <p className="truncate font-mono text-[10px] text-white/50">
                Drive player · Esc to close
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={buildDriveViewUrl(selectedVideo.driveId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 border border-white/25 px-3 font-mono text-[11px] font-semibold text-white"
              >
                <ExternalLink className="size-3.5" />
                Drive
              </a>
              <button
                type="button"
                onClick={() => setVideoTheaterOpen(false)}
                aria-label="Close video"
                className="grid size-10 place-items-center border border-white/25 text-white"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 pb-[env(safe-area-inset-bottom)]">
            <iframe
              key={`theater-${selectedVideo.driveId}`}
              src={buildDrivePreviewUrl(selectedVideo.driveId)}
              title={selectedVideo.title}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      )}

      {/* 3. PDF DOCUMENTS TAB */}
      {tab === 'pdf' && (
        <div className="space-y-4">
          {module.documents.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p>No standalone PDF notes found for this module.</p>
              <p className="text-xs mt-1">Check the video lessons and interactive code snippets!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* PDF Selector if multiple */}
              {module.documents.length > 1 && (
                <div className="flex overflow-x-auto space-x-2 py-1">
                  {module.documents.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                        selectedDoc?.id === doc.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {doc.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Embedded Document Viewer */}
              {selectedDoc && (
                <Suspense fallback={<Skeleton lines={10} className="min-h-96" />}>
                  <PDFReader document={selectedDoc} />
                </Suspense>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. CODE EXAMPLES TAB */}
      {tab === 'code' && (
        <div className="space-y-6">
          {module.codeSnippets.map((snippet, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {snippet.title}
                  </h3>
                  <p className="text-xs text-slate-500">{snippet.description}</p>
                </div>
              </div>
              <Suspense fallback={<Skeleton lines={8} />}>
                <CodePlayground
                  initialCode={snippet.code}
                  initialTitle={snippet.title}
                  lessonExample={{ title: snippet.title, code: snippet.code }}
                />
              </Suspense>
              {snippet.explanation && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Explanation:</span>
                  {snippet.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 5. QUIZ TAB */}
      {tab === 'quiz' && (
        <Quiz
          moduleId={module.id}
          moduleTitle={module.title}
          questions={module.quiz}
          savedScore={userQuizScore}
          onSaveScore={onSaveQuizScore}
        />
      )}

      <div className="mt-8 hidden items-center justify-between gap-3 border border-[var(--app-border)] p-4 md:flex">
        <button
          onClick={onNavigatePrev}
          disabled={!hasPrev}
          className="flex min-h-11 items-center gap-2 border border-[var(--app-border)] px-4 text-xs font-bold disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
          Previous
        </button>
        <button
          onClick={() => setTab('quiz')}
          className="flex min-h-11 items-center gap-2 border border-[var(--app-border)] px-4 text-xs font-bold"
        >
          Take quiz
        </button>
        <button
          onClick={onNavigateNext}
          disabled={!hasNext}
          className="flex min-h-11 items-center gap-2 border border-[var(--app-border-strong)] bg-brand-300 px-4 text-xs font-bold text-slate-950 shadow-[var(--shadow-card)] disabled:opacity-40"
        >
          {hasNext ? 'Next module' : 'Course done'}
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="h-16 md:hidden" aria-hidden="true" />

      {/* Floating actions: phones only — desktop uses the footer row */}
      <div className="md:hidden">
        <LessonActionFab
          label="Lesson actions"
          items={[
            {
              id: 'prev',
              label: 'Previous module',
              icon: 'prev',
              onSelect: onNavigatePrev,
              disabled: !hasPrev,
            },
            {
              id: 'quiz',
              label: 'Take quiz',
              icon: 'quiz',
              onSelect: () => setTab('quiz'),
            },
            {
              id: 'next',
              label: hasNext ? 'Next module' : 'Course done',
              icon: 'next',
              onSelect: onNavigateNext,
              disabled: !hasNext,
            },
            ...(onOpenSandbox
              ? [
                  {
                    id: 'sandbox',
                    label: 'Try in sandbox',
                    icon: 'sandbox' as const,
                    onSelect: onOpenSandbox,
                  },
                ]
              : []),
          ]}
        />
      </div>
    </div>
  );
};
