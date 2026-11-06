import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import type {
  ButtonHTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode
} from 'react';
import { Check, Copy, X } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
  ghost: 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800',
  danger: 'bg-red-700 text-white hover:bg-red-800 disabled:bg-red-300'
};

export function Button({
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-card border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900 ${className}`}
      {...props}
    />
  );
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'brand' | 'neutral' | 'success' | 'warning';
}

const badgeTones = {
  brand: 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200',
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  warning: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
} as const;

export function Badge({ tone = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badgeTones[tone]} ${className}`}
      {...props}
    />
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, id, className = '', ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const input = (
    <input
      ref={ref}
      id={inputId}
      className={`min-h-11 w-full rounded-control border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-brand-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 ${className}`}
      {...props}
    />
  );

  return label ? (
    <label htmlFor={inputId} className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      {input}
    </label>
  ) : input;
});

interface ProgressBarProps {
  value: number;
  max?: number;
  label: string;
  className?: string;
}

export function ProgressBar({ value, max = 100, label, className = '' }: ProgressBarProps) {
  const progress = max > 0 ? Math.min(Math.max(value, 0), max) : 0;
  const percentage = max > 0 ? (progress / max) * 100 : 0;
  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={progress}
    >
      <div
        className="h-full rounded-full bg-brand-600 transition-[width] duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className = ''
}: TabsProps<T>) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const currentIndex = items.findIndex(item => item.value === value);
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + direction + items.length) % items.length;
    onChange(items[nextIndex].value);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className={`flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 ${className}`}>
      {items.map((item, index) => (
        <button
          key={item.value}
          ref={element => { tabRefs.current[index] = element; }}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          tabIndex={value === item.value ? 0 : -1}
          onKeyDown={handleKeyDown}
          onClick={() => onChange(item.value)}
          className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm transition-colors ${
            value === item.value
              ? 'border-brand-600 font-semibold text-brand-700 dark:text-brand-300'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const id = useId();
  return (
    <span className="group relative inline-flex" aria-describedby={id}>
      {children}
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white group-hover:block group-focus-within:block"
      >
        {content}
      </span>
    </span>
  );
}

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export function Skeleton({ lines = 1, className = '', ...props }: SkeletonProps) {
  return (
    <div className={`grid gap-3 ${className}`} aria-hidden="true" {...props}>
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className="h-4 animate-pulse rounded bg-slate-200 last:w-2/3 dark:bg-slate-800" />
      ))}
    </div>
  );
}

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, title, onClose, children, className = '' }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`max-h-[min(90dvh,48rem)] w-full max-w-xl overflow-auto rounded-card border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-900 ${className}`}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 id={titleId} className="text-base font-semibold">{title}</h2>
          <Button variant="ghost" aria-label="Close dialog" onClick={onClose} className="size-11 p-0">
            <X className="size-5" />
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}

function highlightCppToken(token: string): ReactNode {
  if (/^\/\//.test(token)) return <span className="text-slate-500 italic">{token}</span>;
  if (/^["']/.test(token)) return <span className="text-emerald-400 dark:text-emerald-300">{token}</span>;
  if (/^#/.test(token)) return <span className="text-purple-400 dark:text-purple-300 font-semibold">{token}</span>;
  if (/^\d/.test(token)) return <span className="text-amber-400 dark:text-amber-300">{token}</span>;
  if (/^(int|float|double|char|bool|void|auto|long|short|size_t|string|vector)$/.test(token)) {
    return <span className="text-cyan-400 dark:text-cyan-300 font-medium">{token}</span>;
  }
  if (/^(class|struct|namespace|template|typename|public|private|protected|virtual)$/.test(token)) {
    return <span className="text-blue-400 dark:text-blue-300 font-semibold">{token}</span>;
  }
  if (/^(if|else|for|while|do|switch|case|break|continue|return|new|delete|nullptr|true|false|using|std|cout|cin|endl)$/.test(token)) {
    return <span className="text-rose-400 dark:text-rose-300 font-semibold">{token}</span>;
  }
  if (/^(<<|>>|::|->|&|\*|\+|-|=)$/.test(token)) {
    return <span className="text-slate-400 dark:text-slate-300">{token}</span>;
  }
  return token;
}

const cppTokenPattern = /(\/\/.*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#\s*\w+|\b(?:int|float|double|char|bool|void|auto|long|short|size_t|string|vector|class|struct|namespace|template|typename|public|private|protected|virtual|if|else|for|while|do|switch|case|break|continue|return|new|delete|nullptr|true|false|using|std|cout|cin|endl)\b|\b\d+(?:\.\d+)?f?\b|<<|>>|::|->)/g;

export function highlightCpp(code: string): ReactNode {
  return code.split(cppTokenPattern).map((token, index) => (
    <span key={index}>{highlightCppToken(token)}</span>
  ));
}

interface CodeBlockProps {
  code: string;
  title?: string;
}

export function CodeBlock({ code, title = 'C++' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const lines = code.split('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setCopyError('');
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
      setCopyError('Clipboard is unavailable. Select the code to copy it.');
    }
  };

  return (
    <Card className="overflow-hidden border-slate-800 bg-slate-950 text-slate-100 dark:bg-slate-950">
      <div className="flex min-h-11 items-center justify-between border-b border-slate-800 px-4">
        <span className="text-xs font-medium text-slate-300">{title}</span>
        <Button
          variant="ghost"
          onClick={handleCopy}
          aria-label={copied ? 'Code copied' : 'Copy code'}
          className="min-h-11 gap-2 px-2 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
      {copyError && <p role="status" className="px-4 pt-2 text-xs text-amber-300">{copyError}</p>}
      <pre className="overflow-x-auto p-4 text-sm leading-6">
        <code>
          {lines.map((line, lineIndex) => (
            <span key={lineIndex} className="grid min-w-max grid-cols-[2rem_1fr]">
              <span className="select-none pr-3 text-right text-slate-500">{lineIndex + 1}</span>
              <span>
                {highlightCpp(line)}
                {'\n'}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </Card>
  );
}
