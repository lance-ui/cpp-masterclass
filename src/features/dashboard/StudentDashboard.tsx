import React from 'react';
import { 
  Trophy, 
  CheckCircle, 
  Bookmark, 
  Clock, 
  ArrowRight, 
  FileText
} from 'lucide-react';
import { CourseModule, User } from '@/types';
import { calculateOverallProgress } from '@/utils/courseLogic';
import { Card, ProgressBar } from '@/components/ui';

interface StudentDashboardProps {
  currentUser: User;
  modules: CourseModule[];
  onSelectModule: (moduleId: string, tab?: 'video' | 'pdf' | 'code' | 'quiz') => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  modules,
  onSelectModule
}) => {
  // Calculate quiz average
  const quizScores = Object.values(currentUser.quizScores);
  const avgQuizScore = quizScores.length > 0
    ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
    : 0;
  const completion = calculateOverallProgress(currentUser.completedModuleIds, modules.length);

  // Bookmarked modules
  const bookmarkedModules = modules.filter(m =>
    currentUser.bookmarkedModuleIds.includes(m.id)
  );

  // Recently viewed modules
  const recentModules = currentUser.recentModuleIds
    .map(id => modules.find(m => m.id === id))
    .filter((m): m is CourseModule => !!m);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Learning dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Your progress is saved in this browser.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs text-slate-500 block">Completed Modules</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {currentUser.completedModuleIds.length} <span className="text-xs font-normal text-slate-400">/ {modules.length}</span>
            </span>
            <ProgressBar value={completion} label="Course completion" className="mt-2" />
          </div>
        </Card>

        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Average Quiz Score</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {quizScores.length > 0 ? `${avgQuizScore}%` : 'No scores'}
            </span>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Saved Bookmarks</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {bookmarkedModules.length} Topics
            </span>
          </div>
        </Card>

        <Card className="flex items-center space-x-4 p-5">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Notes Written</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {Object.keys(currentUser.notes).length} Modules
            </span>
          </div>
        </Card>
      </div>

      {/* Main Grid: Recently Viewed & Bookmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Viewed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" />
              Recently Studied Modules
            </h3>
          </div>

          <div className="space-y-2">
            {recentModules.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                You haven't opened any modules yet. Pick a lesson from the sidebar to begin!
              </p>
            ) : (
              recentModules.slice(0, 5).map(mod => (
                <div
                  key={mod.id}
                  onClick={() => onSelectModule(mod.id)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-mono text-xs font-bold flex items-center justify-center">
                      {mod.moduleNumber}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 block">
                        {mod.title}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {mod.category} • {mod.videos.length} videos
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transform group-hover:translate-x-1 transition-transform" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bookmarks */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-500" />
              Bookmarked Lessons ({bookmarkedModules.length})
            </h3>
          </div>

          <div className="space-y-2">
            {bookmarkedModules.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No bookmarked topics yet. Click the bookmark icon on any lesson to save it for quick review.
              </p>
            ) : (
              bookmarkedModules.map(mod => (
                <div
                  key={mod.id}
                  onClick={() => onSelectModule(mod.id)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 block">
                        Module {mod.moduleNumber}: {mod.title}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {mod.category}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transform group-hover:translate-x-1 transition-transform" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
