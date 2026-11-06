import React, { useState, useEffect, useRef } from 'react';
import { Search, Video, FileText, Code2, ArrowRight } from 'lucide-react';
import { CourseModule, ActiveTab } from '../../types';
import { Input, Modal } from '../ui';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  modules: CourseModule[];
  onSelectModule: (moduleId: string, tab?: ActiveTab) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  modules,
  onSelectModule
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  // Search matches
  const matchingModules = trimmed
    ? modules.filter(
        m =>
          m.title.toLowerCase().includes(trimmed) ||
          m.description.toLowerCase().includes(trimmed) ||
          m.category.toLowerCase().includes(trimmed)
      )
    : [];

  const matchingVideos: { module: CourseModule; videoTitle: string; driveId: string }[] = [];
  const matchingDocs: { module: CourseModule; docTitle: string; driveId: string }[] = [];
  const matchingSnippets: { module: CourseModule; snippetTitle: string }[] = [];

  if (trimmed) {
    modules.forEach(m => {
      m.videos.forEach(v => {
        if (v.title.toLowerCase().includes(trimmed)) {
          matchingVideos.push({ module: m, videoTitle: v.title, driveId: v.driveId });
        }
      });
      m.documents.forEach(d => {
        if (d.title.toLowerCase().includes(trimmed)) {
          matchingDocs.push({ module: m, docTitle: d.title, driveId: d.driveId });
        }
      });
      m.codeSnippets.forEach(c => {
        if (c.title.toLowerCase().includes(trimmed) || c.code.toLowerCase().includes(trimmed)) {
          matchingSnippets.push({ module: m, snippetTitle: c.title });
        }
      });
    });
  }

  const totalResults = matchingModules.length + matchingVideos.length + matchingDocs.length + matchingSnippets.length;

  return (
    <Modal open={isOpen} onClose={onClose} title="Search the course" className="flex max-h-[80dvh] max-w-2xl flex-col overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 27 C++ topics, videos, PDFs, or code syntax (e.g. pointers, vtable, STL vector)..."
            aria-label="Search lessons, videos, PDFs, and code"
            className="min-h-11 border-0 bg-transparent px-0 text-slate-900 focus:ring-0 dark:bg-transparent dark:text-white"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="mr-2 min-h-11 px-3 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {!trimmed && (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500 mb-3">Popular Searches:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Pointers', 'OOP Classes', 'Inheritance', 'STL Vector', 'Exception Handling', 'Dynamic Memory', 'Virtual Functions'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="inline-flex min-h-11 items-center px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 rounded-full hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-600 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {trimmed && totalResults === 0 && (
            <div className="py-12 text-center text-slate-500">
              <p className="text-base font-medium">No results found for "{query}"</p>
              <p className="text-xs mt-1">Try keywords like "arrays", "functions", "constructors", or "banking project"</p>
            </div>
          )}

          {/* Modules */}
          {matchingModules.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Course Modules ({matchingModules.length})
              </span>
              <div className="space-y-1.5">
                {matchingModules.slice(0, 5).map(mod => (
                  <button
                    key={mod.id}
                    onClick={() => {
                      onSelectModule(mod.id, 'overview');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/40 text-left transition-colors group"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                          #{mod.moduleNumber}
                        </span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                          {mod.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {mod.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {mod.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transform group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Video Lessons */}
          {matchingVideos.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Google Drive Video Lessons ({matchingVideos.length})
              </span>
              <div className="space-y-1.5">
                {matchingVideos.slice(0, 5).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectModule(item.module.id, 'video');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
                          {item.videoTitle}
                        </span>
                        <span className="text-xs text-slate-500">
                          In: {item.module.title}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                      Watch Video
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PDF Documents */}
          {matchingDocs.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Reference PDFs ({matchingDocs.length})
              </span>
              <div className="space-y-1.5">
                {matchingDocs.slice(0, 5).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectModule(item.module.id, 'pdf');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
                          {item.docTitle}
                        </span>
                        <span className="text-xs text-slate-500">
                          In: {item.module.title}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Read PDF
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Code Snippets */}
          {matchingSnippets.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                C++ Code Examples ({matchingSnippets.length})
              </span>
              <div className="space-y-1.5">
                {matchingSnippets.slice(0, 4).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectModule(item.module.id, 'code');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-lg bg-brand-100 dark:bg-brand-950/50 text-brand-600">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
                          {item.snippetTitle}
                        </span>
                        <span className="text-xs text-slate-500">
                          In: {item.module.title}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                      Try It In IDE
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
    </Modal>
  );
};
