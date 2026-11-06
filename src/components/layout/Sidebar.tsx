import React, { useState } from 'react';
import { 
  CheckCircle, 
  Circle, 
  Bookmark, 
  BookmarkCheck, 
  Search, 
  Video, 
  FileText, 
  ChevronDown, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { CourseModule, User } from '@/types';

interface SidebarProps {
  modules: CourseModule[];
  selectedModuleId: string;
  onSelectModule: (moduleId: string) => void;
  currentUser: User;
  onToggleBookmark: (moduleId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  modules,
  selectedModuleId,
  onSelectModule,
  currentUser,
  onToggleBookmark,
  isOpen,
  onClose
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const categories = ['All', 'Beginner', 'Core Concepts', 'Object Oriented (OOP)', 'Advanced C++ & STL', 'Projects & Deep Dives'];

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const filtered = modules.filter(m => {
    if (selectedCategory !== 'All' && m.category !== selectedCategory) return false;
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.moduleNumber.toString().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  });

  // Group by category
  const groupedCategories = ['Beginner', 'Core Concepts', 'Object Oriented (OOP)', 'Advanced C++ & STL', 'Projects & Deep Dives'];

  return (
    <>
    {isOpen && (
      <button
        type="button"
        aria-label="Close course outline"
        onClick={onClose}
        className="fixed inset-0 top-[calc(4rem_+_env(safe-area-inset-top))] z-40 bg-slate-950/40 lg:hidden"
      />
    )}
    <aside
      className={`fixed inset-y-0 left-0 top-[calc(4rem_+_env(safe-area-inset-top))] z-50 flex h-[calc(100dvh_-_4rem_-_env(safe-area-inset-top))] w-[min(88vw,20rem)] shrink-0 flex-col border-r border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] transition-transform dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-[calc(4rem_+_env(safe-area-inset-top))] lg:z-auto lg:h-[calc(100dvh_-_4rem_-_env(safe-area-inset-top))] lg:w-80 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      aria-label="C++ Curriculum Navigation"
    >
      {/* Sidebar Header / Filter */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            C++ Topics ({modules.length})
          </span>
          <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold font-mono">
            {currentUser.completedModuleIds.length}/{modules.length} Done
          </span>
        </div>

        {/* Filter Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            aria-label="Filter course topics"
            placeholder="Filter C++ topics..."
            className="min-h-11 w-full pl-8 pr-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex overflow-x-auto space-x-1 py-1 no-scrollbar text-[11px]">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-11 shrink-0 px-3 rounded-full transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white font-medium shadow-2xs'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat === 'Object Oriented (OOP)' ? 'OOP' : cat === 'Advanced C++ & STL' ? 'Advanced' : cat === 'Projects & Deep Dives' ? 'Projects' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Module List */}
      <nav className="overflow-y-auto flex-1 p-2 space-y-4">
        {selectedCategory === 'All' && !filterQuery ? (
          // Grouped view
          groupedCategories.map(catName => {
            const catModules = modules.filter(m => m.category === catName);
            if (catModules.length === 0) return null;
            const isCollapsed = !!collapsedCategories[catName];

            return (
              <div key={catName} className="space-y-1">
                <button
                  onClick={() => toggleCategory(catName)}
                  className="w-full min-h-11 flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 tracking-wide rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/50"
                >
                  <span className="flex items-center space-x-1.5">
                    <span>{catName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({catModules.length})</span>
                  </span>
                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {catModules.map(mod => {
                      const isSelected = mod.id === selectedModuleId;
                      const isCompleted = currentUser.completedModuleIds.includes(mod.id);
                      const isBookmarked = currentUser.bookmarkedModuleIds.includes(mod.id);

                      return (
                        <div
                          key={mod.id}
                          className={`group flex items-center justify-between rounded-lg px-2.5 py-1 text-xs transition-colors ${
                            isSelected
                              ? 'bg-brand-500/15 text-brand-900 dark:text-brand-300 font-semibold border-l-4 border-brand-600 pl-2'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectModule(mod.id)}
                            aria-current={isSelected ? 'page' : undefined}
                            className="flex min-h-11 min-w-0 flex-1 items-center space-x-2 text-left"
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                            )}
                            <span className="truncate">
                              <span className="font-mono text-[11px] text-slate-400 mr-1.5">
                                {mod.moduleNumber}.
                              </span>
                              {mod.title}
                            </span>
                          </button>

                          <div className="flex items-center space-x-1 shrink-0 ml-2">
                            {mod.videos.length > 0 && (
                              <span 
                                className="flex items-center text-[10px] text-slate-400 font-mono"
                                title={`${mod.videos.length} Video Lessons`}
                              >
                                <Video className="w-2.5 h-2.5 mr-0.5" />
                                {mod.videos.length}
                              </span>
                            )}
                            {mod.documents.length > 0 && (
                              <span 
                                className="flex items-center text-[10px] text-blue-500 font-mono ml-1"
                                title={`${mod.documents.length} PDF Reference Notes`}
                              >
                                <FileText className="w-2.5 h-2.5 mr-0.5" />
                                {mod.documents.length}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleBookmark(mod.id);
                              }}
                              className={`grid size-11 shrink-0 place-items-center rounded transition-opacity ${
                                isBookmarked ? '!opacity-100 text-amber-500' : 'text-slate-400 hover:text-amber-500'
                              }`}
                              aria-label={`${isBookmarked ? 'Remove bookmark for' : 'Bookmark'} ${mod.title}`}
                            >
                              {isBookmarked ? (
                                <BookmarkCheck className="w-3.5 h-3.5" />
                              ) : (
                                <Bookmark className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // Flat filtered list
          <div className="space-y-0.5">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No topics found matching "{filterQuery}"
              </div>
            ) : (
              filtered.map(mod => {
                const isSelected = mod.id === selectedModuleId;
                const isCompleted = currentUser.completedModuleIds.includes(mod.id);
                const isBookmarked = currentUser.bookmarkedModuleIds.includes(mod.id);

                return (
                  <div
                    key={mod.id}
                    className={`group flex items-center justify-between rounded-lg px-2.5 py-1 text-xs transition-colors ${
                      isSelected
                        ? 'bg-brand-500/15 text-brand-900 dark:text-brand-300 font-semibold border-l-4 border-brand-600 pl-2'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectModule(mod.id)}
                      aria-current={isSelected ? 'page' : undefined}
                      className="flex min-h-11 min-w-0 flex-1 items-center space-x-2 text-left"
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                      )}
                      <span className="truncate">
                        <span className="font-mono text-[11px] text-slate-400 mr-1.5">
                          {mod.moduleNumber}.
                        </span>
                        {mod.title}
                      </span>
                    </button>

                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {mod.videos.length}v
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(mod.id);
                        }}
                        aria-label={`${isBookmarked ? 'Remove bookmark for' : 'Bookmark'} ${mod.title}`}
                        className={`grid size-11 shrink-0 place-items-center rounded ${isBookmarked ? 'text-amber-500' : 'text-slate-400'}`}
                      >
                        {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </nav>
    </aside>
    </>
  );
};
