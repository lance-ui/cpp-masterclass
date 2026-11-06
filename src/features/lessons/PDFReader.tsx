import { ExternalLink, FileText } from 'lucide-react';
import type { PDFDocument } from '@/types';

interface PDFReaderProps {
  document: PDFDocument;
}

export function PDFReader({ document }: PDFReaderProps) {
  return (
    <section className="overflow-hidden rounded-card border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="size-4 shrink-0 text-brand-600 dark:text-brand-400" />
          <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
            {document.title}
          </span>
        </div>
        <a
          href={`https://drive.google.com/file/d/${document.driveId}/preview`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-control border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <span>Open full screen</span>
          <ExternalLink className="size-3.5" />
        </a>
      </div>
      <iframe
        src={`https://drive.google.com/file/d/${document.driveId}/preview`}
        title={document.title}
        loading="lazy"
        className="h-[min(65dvh,650px)] min-h-[360px] w-full border-0"
      />
    </section>
  );
}
