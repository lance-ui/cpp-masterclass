import React, { lazy, Suspense, useState } from 'react';
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
  Edit3, 
  Save, 
  Check, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { CourseModule, ActiveTab, User, VideoLesson, PDFDocument } from '@/types';
import { Quiz } from '@/features/quiz/Quiz';
import { Badge, Card, CodeBlock, Skeleton, Tabs } from '@/components/ui';
import type { TabItem } from '@/components/ui';
import { buildDrivePreviewUrl } from '@/utils/courseLogic';

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
  onChangeTab
}) => {
  const [currentTab, setCurrentTab] = useState<ActiveTab>(activeTab);
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(
    module.videos[0] || null
  );
  const [selectedDoc, setSelectedDoc] = useState<PDFDocument | null>(
    module.documents[0] || null
  );
  const [userNote, setUserNote] = useState<string>(
    currentUser.notes[module.id] || ''
  );
  const [noteSaved, setNoteSaved] = useState<boolean>(false);

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
    setUserNote(currentUser.notes[module.id] || '');
  }, [module.id]);

  const isCompleted = currentUser.completedModuleIds.includes(module.id);
  const isBookmarked = currentUser.bookmarkedModuleIds.includes(module.id);
  const userQuizScore = currentUser.quizScores[module.id];

  const handleSaveNote = () => {
    onSaveUserNote(module.id, userNote);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const lessonTabs: TabItem<ActiveTab>[] = [
    { value: 'overview', label: 'Overview', icon: <BookOpen className="size-4" /> },
    { value: 'video', label: `Video (${module.videos.length})`, icon: <Play className="size-4" /> },
    { value: 'pdf', label: `PDF (${module.documents.length})`, icon: <FileText className="size-4" /> },
    { value: 'code', label: 'Code', icon: <Code2 className="size-4" /> },
    { value: 'quiz', label: `Quiz (${module.quiz.length})`, icon: <HelpCircle className="size-4" /> },
    { value: 'notes', label: 'Notes', icon: <Edit3 className="size-4" /> }
  ];

  return (
    <main className="w-full min-w-0 flex-1 space-y-8 px-4 py-6 sm:px-8 lg:px-10">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-slate-500">
          <span>C++ MasterClass</span>
          <span>/</span>
          <span className="font-semibold text-brand-600 dark:text-brand-400">
            {module.category}
          </span>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px] sm:max-w-none">
            Module {module.moduleNumber}: {module.title}
          </span>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Bookmark Button */}
          <button
            onClick={() => onToggleBookmark(module.id)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isBookmarked
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
            title="Bookmark module for quick review"
          >
            {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>

          {/* Mark Complete Button */}
          <button
            onClick={() => onToggleComplete(module.id)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isCompleted
                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600'
            }`}
            title="Mark module as completed"
          >
            {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
            <span>{isCompleted ? 'Completed' : 'Mark Complete'}</span>
          </button>
        </div>
      </div>

      <header className="max-w-3xl space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Badge tone="neutral">{module.category}</Badge>
          <span>Module {module.moduleNumber}</span>
          <span aria-hidden="true">·</span>
          <span>{module.readingTime} read</span>
          {userQuizScore !== undefined && <Badge tone="brand">Quiz {userQuizScore}%</Badge>}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {module.title}
        </h1>
        <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
          {module.description}
        </p>
      </header>

      <Tabs items={lessonTabs} value={tab} onChange={setTab} label="Lesson content" />

      {/* Tab Panels */}
      {/* 1. OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <Card className="max-w-3xl space-y-4 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              About this lesson
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {module.description}
            </p>

            <p className="text-sm text-slate-500">
              {module.videos.length} videos · {module.documents.length} PDFs · {module.quiz.length} quiz questions
            </p>
          </Card>

          {/* Code snippet quick preview */}
          {module.codeSnippets.length > 0 && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Core C++ Syntax Example: {module.codeSnippets[0].title}
              </h3>
              <CodeBlock
                code={module.codeSnippets[0].code}
                title={module.codeSnippets[0].title}
              />
            </div>
          )}
        </div>
      )}

      {/* 2. VIDEO STREAM TAB */}
      {tab === 'video' && (
        <div className="space-y-4">
          {module.videos.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
              <Play className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p>No video files directly in this module folder.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Player */}
              <div className="lg:col-span-2 space-y-3">
                <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-800">
                  {selectedVideo && (
                    <iframe
                      src={buildDrivePreviewUrl(selectedVideo.driveId)}
                      title={selectedVideo.title}
                      className="w-full h-full border-0"
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                    />
                  )}
                </div>

                {selectedVideo && (
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedVideo.title}
                      </h4>
                      <span className="text-xs text-slate-500">
                        File: {selectedVideo.fileName} • Streaming
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Playlist Sidebar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Course Lectures ({module.videos.length})
                </span>
                <div className="space-y-1.5 max-h-[460px] overflow-y-auto">
                  {module.videos.map((vid, idx) => {
                    const isPlaying = selectedVideo?.id === vid.id;
                    return (
                      <button
                        key={vid.id}
                        onClick={() => setSelectedVideo(vid)}
                        className={`w-full flex items-center space-x-2.5 p-2.5 rounded-xl text-left text-xs transition-colors ${
                          isPlaying
                            ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-800 dark:text-brand-300 font-bold border-l-4 border-brand-600'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-mono ${
                            isPlaying
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span className="truncate flex-1">{vid.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
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
                <CodePlayground initialCode={snippet.code} initialTitle={snippet.title} />
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

      {/* 6. MY NOTES TAB */}
      {tab === 'notes' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-brand-600" />
                Personal Study Notes
              </h3>
              <p className="text-xs text-slate-500">
                Notes for "{module.title}" are saved locally and synced to your profile.
              </p>
            </div>
            <button
              onClick={handleSaveNote}
              className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              {noteSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{noteSaved ? 'Saved!' : 'Save Notes'}</span>
            </button>
          </div>

          <textarea
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            rows={10}
            aria-label="Personal study notes for this module"
            placeholder="Write key syntax reminders, algorithm steps, questions for the instructor, or personal insights here..."
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans leading-relaxed"
          />
        </div>
      )}

      {/* Lesson navigation */}
      <div className="mobile-next-action fixed inset-x-0 bottom-[calc(4.5rem_+_env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-2 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:static lg:z-auto lg:mt-8 lg:bg-transparent lg:px-0 lg:py-6 lg:shadow-none lg:dark:bg-transparent">
        <button
          onClick={onNavigatePrev}
          disabled={!hasPrev}
          className="flex min-h-11 items-center space-x-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous lesson</span>
        </button>

        <button
          onClick={onNavigateNext}
          disabled={!hasNext}
          className="flex min-h-11 items-center space-x-2 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>{hasNext ? 'Next lesson' : 'Course complete'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
};
