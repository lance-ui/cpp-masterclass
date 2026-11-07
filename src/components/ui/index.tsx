import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import type {
  ButtonHTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  HTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode
} from 'react';
import { Check, Copy, X } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'border border-transparent bg-brand-300 text-[var(--app-accent-fg)] hover:bg-brand-200 pressable disabled:bg-brand-100',
  secondary:
    'border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-ink)] hover:bg-[var(--app-canvas)] pressable',
  ghost:
    'border border-transparent text-[var(--app-muted)] hover:bg-[var(--app-canvas)] hover:text-[var(--app-ink)]',
  danger:
    'border border-transparent bg-[var(--app-danger)] text-white hover:opacity-90 pressable disabled:opacity-50',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-sm',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  className = '',
  type = 'button',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium transition-[background-color,opacity,border-color] duration-[var(--duration-fast)] disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  );
}

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--shadow-card)] ${className}`}
      {...props}
    />
  );
}

export interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  subValue?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function StatCard({ icon, label, value, subValue, children, className = '' }: StatCardProps) {
  return (
    <Card className={`flex items-start gap-3 p-4 ${className}`}>
      <div className="shrink-0 rounded-[var(--radius-control)] bg-brand-100 p-2.5 text-[var(--app-accent-text)] dark:bg-brand-950 dark:text-[var(--app-accent-text)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-[var(--app-muted)]">{label}</span>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-xl font-semibold tracking-tight text-[var(--app-ink)]">{value}</span>
          {subValue && <span className="text-xs font-normal text-[var(--app-tertiary)]">{subValue}</span>}
        </div>
        {children}
      </div>
    </Card>
  );
}

const badgeTones = {
  brand:
    'bg-brand-100 text-[var(--app-accent-text)] dark:bg-brand-950 dark:text-[var(--app-accent-text)]',
  neutral:
    'bg-[var(--app-canvas)] text-[var(--app-muted)] border border-[var(--app-border)]',
  success: 'bg-[var(--app-success-bg)] text-[var(--app-success)]',
  warning: 'bg-[var(--app-warning-bg)] text-[var(--app-warning)]',
  danger: 'bg-[var(--app-danger-bg)] text-[var(--app-danger)]',
  info: 'bg-[var(--app-info-bg)] text-[var(--app-info)]',
} as const;

interface BadgePropsExtended extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof badgeTones;
}

export function Badge({
  tone = 'neutral',
  className = '',
  ...props
}: BadgePropsExtended) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-control)] px-2 py-0.5 text-xs font-medium ${badgeTones[tone]} ${className}`}
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
      className={`min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-ink)] placeholder:text-[var(--app-disabled)] focus:border-[var(--app-accent)] focus:outline-none ${className}`}
      {...props}
    />
  );

  return label ? (
    <label htmlFor={inputId} className="grid gap-1.5 text-sm font-medium text-[var(--app-ink)]">
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
  const hasHeight = /\bh-/.test(className);
  return (
    <div
      className={`overflow-hidden rounded-none bg-[color-mix(in_srgb,var(--app-border)_70%,transparent)] ${hasHeight ? '' : 'h-2'} ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={progress}
    >
      <div
        className="h-full bg-brand-300 transition-[width] duration-300"
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
    <div role="tablist" aria-label={label} className={`flex gap-1 overflow-x-auto border-b border-[var(--app-border)] ${className}`}>
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
          className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm transition-colors duration-[var(--duration-fast)] ${
            value === item.value
              ? 'border-[var(--app-accent)] font-semibold text-[var(--app-accent-text)]'
              : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-ink)]'
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
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-control)] bg-[var(--app-ink)] px-2 py-1 text-xs text-[var(--app-canvas)] shadow-[var(--shadow-raised)] group-hover:block group-focus-within:block"
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
        <div key={index} className="h-4 animate-pulse rounded-[var(--radius-control)] bg-[var(--app-border)] last:w-2/3" />
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
      className="fixed inset-0 z-50 grid place-items-center bg-[var(--app-overlay)] p-4"
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
        className={`max-h-[min(90dvh,48rem)] w-full max-w-xl overflow-auto rounded-[var(--radius-card)] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--shadow-raised)] ${className}`}
      >
        <header className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-4">
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
  if (/^\/\//.test(token)) return <span style={{ color: 'var(--cm-comment)' }} className="italic">{token}</span>;
  if (/^["']/.test(token)) return <span style={{ color: 'var(--cm-string)' }}>{token}</span>;
  if (/^#/.test(token)) return <span style={{ color: 'var(--cm-meta)' }} className="font-semibold">{token}</span>;
  if (/^\d/.test(token)) return <span style={{ color: 'var(--cm-number)' }}>{token}</span>;
  if (/^(int|float|double|char|bool|void|auto|long|short|size_t|string|vector)$/.test(token)) {
    return <span style={{ color: 'var(--cm-type)' }} className="font-medium">{token}</span>;
  }
  if (/^(class|struct|namespace|template|typename|public|private|protected|virtual)$/.test(token)) {
    return <span style={{ color: 'var(--cm-def)' }} className="font-semibold">{token}</span>;
  }
  if (/^(if|else|for|while|do|switch|case|break|continue|return|new|delete|nullptr|true|false|using|std|cout|cin|endl)$/.test(token)) {
    return <span style={{ color: 'var(--cm-keyword)' }} className="font-semibold">{token}</span>;
  }
  if (/^(<<|>>|::|->|&|\*|\+|-|=)$/.test(token)) {
    return <span style={{ color: 'var(--cm-operator)' }}>{token}</span>;
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
    <Card className="overflow-hidden border-[var(--app-border)] bg-[var(--app-code-bg)] text-[var(--app-code-fg)]">
      <div className="flex min-h-11 items-center justify-between border-b border-[var(--app-border)] px-4">
        <span className="font-mono text-xs font-medium text-[var(--app-tertiary)]">
          {title}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          aria-label={copied ? 'Code copied' : 'Copy code'}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
      {copyError && (
        <p role="status" className="px-4 pt-2 text-xs text-[var(--app-warning)]">
          {copyError}
        </p>
      )}
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-6">
        <code>
          {lines.map((line, lineIndex) => (
            <span key={lineIndex} className="grid min-w-max grid-cols-[2.5rem_1fr]">
              <span className="select-none pr-3 text-right text-[var(--app-disabled)]">
                {lineIndex + 1}
              </span>
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

/* —— Additional enterprise primitives —— */

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, id, className = '', children, ...props }, ref) {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const chevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23667085' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E")`;
    const { style: selectStyle, ...selectRest } = props;
    const select = (
      <select
        ref={ref}
        id={selectId}
        className={`min-h-11 w-full appearance-none rounded-[var(--radius-control)] border border-[var(--app-border)] bg-[var(--app-surface)] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat px-3 pr-9 text-sm text-[var(--app-ink)] focus:border-[var(--app-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        style={{ backgroundImage: chevron, ...selectStyle }}
        {...selectRest}
      >
        {children}
      </select>
    );
    return label ? (
      <label
        htmlFor={selectId}
        className="grid gap-1.5 text-sm font-medium text-[var(--app-ink)]"
      >
        {label}
        {select}
      </label>
    ) : (
      select
    );
  },
);

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] p-6">
      {icon ? (
        <div className="text-[var(--app-tertiary)]" aria-hidden>
          {icon}
        </div>
      ) : null}
      <div>
        <h3 className="text-sm font-semibold text-[var(--app-ink)]">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-[var(--app-muted)]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: { label: string; onClick?: () => void }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--app-tertiary)]">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1.5">
          {i > 0 ? <span aria-hidden>/</span> : null}
          {item.onClick ? (
            <button
              type="button"
              onClick={item.onClick}
              className="hover:text-[var(--app-ink)]"
            >
              {item.label}
            </button>
          ) : (
            <span
              className={
                i === items.length - 1
                  ? 'font-medium text-[var(--app-ink)]'
                  : undefined
              }
              aria-current={i === items.length - 1 ? 'page' : undefined}
            >
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-[var(--app-border)] pb-4">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-[var(--app-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Fluid page shell shared by Lessons, Dashboard, and other full-width views. */
export function PageContainer({
  children,
  className = '',
  narrow = false,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  /** Reading-focused pages (~48rem) */
  narrow?: boolean;
  as?: 'div' | 'section' | 'main';
}) {
  return (
    <Tag
      className={`page-container py-6 ${narrow ? 'page-container--narrow' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
}

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export function ToastBanner({
  message,
  tone = 'info',
  onDismiss,
}: {
  message: string;
  tone?: ToastTone;
  onDismiss?: () => void;
}) {
  const tones: Record<ToastTone, string> = {
    info: 'border-[var(--app-info)] bg-[var(--app-info-bg)] text-[var(--app-info)]',
    success:
      'border-[var(--app-success)] bg-[var(--app-success-bg)] text-[var(--app-success)]',
    warning:
      'border-[var(--app-warning)] bg-[var(--app-warning-bg)] text-[var(--app-warning)]',
    danger:
      'border-[var(--app-danger)] bg-[var(--app-danger-bg)] text-[var(--app-danger)]',
  };
  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-2 text-sm ${tones[tone]}`}
    >
      <span>{message}</span>
      {onDismiss ? (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="shrink-0 opacity-70 hover:opacity-100"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: { key: string; header: string; sortable?: boolean }[];
  rows: Record<string, ReactNode>[];
  empty?: ReactNode;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [asc, setAsc] = useState(true);

  const sorted = [...rows];
  if (sortKey) {
    sorted.sort((a, b) => {
      const av = String(a[sortKey] ?? '');
      const bv = String(b[sortKey] ?? '');
      return asc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="overflow-auto rounded-[var(--radius-card)] border border-[var(--app-border)]">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-[var(--app-canvas)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="border-b border-[var(--app-border)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--app-tertiary)]"
              >
                {col.sortable ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-[var(--app-ink)]"
                    onClick={() => {
                      if (sortKey === col.key) setAsc(!asc);
                      else {
                        setSortKey(col.key);
                        setAsc(true);
                      }
                    }}
                  >
                    {col.header}
                    {sortKey === col.key ? (asc ? ' ↑' : ' ↓') : ''}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[var(--app-border)] last:border-0 hover:bg-[var(--app-canvas)]"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2.5 text-[var(--app-ink)]">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
