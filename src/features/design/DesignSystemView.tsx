import { useState } from "react";
import {
  Button,
  Card,
  Badge,
  Input,
  Select,
  Tabs,
  Tooltip,
  Skeleton,
  Modal,
  EmptyState,
  Breadcrumbs,
  PageContainer,
  PageHeader,
  ProgressBar,
  ToastBanner,
  DataTable,
  CodeBlock,
} from "@/components/ui";
import { AlertCircle, BookOpen } from "lucide-react";

/**
 * Internal Storybook-lite gallery for design tokens and primitives.
 * Open via Dashboard → or set view to "design".
 */
export function DesignSystemView({
  isDarkMode,
  onToggleDarkMode,
}: {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}) {
  const [tab, setTab] = useState<"one" | "two">("one");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>("Saved successfully");

  return (
    <PageContainer className="space-y-10">
      <PageHeader
        title="Design system"
        description="Internal gallery of tokens and shared components. Use this to spot regressions in light and dark themes."
        action={
          <Button variant="secondary" onClick={onToggleDarkMode}>
            {isDarkMode ? "Light theme" : "Dark theme"}
          </Button>
        }
      />

      <Breadcrumbs
        items={[
          { label: "App" },
          { label: "Design system" },
        ]}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Color tokens</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["Canvas", "var(--app-canvas)"],
              ["Surface", "var(--app-surface)"],
              ["Border", "var(--app-border)"],
              ["Accent", "var(--app-accent-bright)"],
              ["Success", "var(--app-success)"],
              ["Warning", "var(--app-warning)"],
              ["Danger", "var(--app-danger)"],
              ["Info", "var(--app-info)"],
            ] as const
          ).map(([label, color]) => (
            <div
              key={label}
              className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--app-border)]"
            >
              <div className="h-12" style={{ background: color }} />
              <p className="px-2 py-1.5 text-xs text-[var(--app-muted)]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Typography</h2>
        <Card className="space-y-2 p-4">
          <p className="text-[32px] font-semibold leading-tight">Display 32</p>
          <p className="text-2xl font-semibold">Heading 24</p>
          <p className="text-xl font-semibold">Heading 20</p>
          <p className="text-base">Body 16 — IBM Plex Sans</p>
          <p className="text-sm text-[var(--app-muted)]">Secondary 14</p>
          <p className="text-xs text-[var(--app-tertiary)]">Caption 12</p>
          <p className="font-mono text-sm">Mono 14 — code only</p>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" loading>
            Loading
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Inputs</h2>
        <div className="grid max-w-md gap-3">
          <Input label="Email" placeholder="you@example.com" />
          <Select label="Level" defaultValue="beginner">
            <option value="beginner">Beginner</option>
            <option value="core">Core concepts</option>
          </Select>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">Brand</Badge>
          <Badge tone="neutral">Neutral</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="danger">Danger</Badge>
          <Badge tone="info">Info</Badge>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Tabs</h2>
        <Tabs
          label="Demo tabs"
          value={tab}
          onChange={setTab}
          items={[
            { value: "one", label: "Overview" },
            { value: "two", label: "Details" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Progress</h2>
        <ProgressBar value={42} label="Demo progress" className="h-1.5" />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Feedback</h2>
        <div className="space-y-2">
          {toast ? (
            <ToastBanner
              message={toast}
              tone="success"
              onDismiss={() => setToast(null)}
            />
          ) : (
            <Button size="sm" onClick={() => setToast("Saved successfully")}>
              Show toast
            </Button>
          )}
          <Tooltip content="Helpful hint">
            <Button size="sm" variant="ghost">
              Hover for tooltip
            </Button>
          </Tooltip>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            Open dialog
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Empty / loading / error</h2>
        <EmptyState
          icon={<BookOpen className="size-5" />}
          title="No modules yet"
          description="Start the curriculum to see progress here."
          action={<Button variant="primary" size="sm">Browse lessons</Button>}
        />
        <Skeleton lines={3} />
        <ToastBanner
          tone="danger"
          message="Could not load modules. Check your connection."
        />
        <Button variant="secondary" size="sm">
          <AlertCircle className="size-3.5" />
          Retry
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Table</h2>
        <DataTable
          columns={[
            { key: "name", header: "Module", sortable: true },
            { key: "status", header: "Status", sortable: true },
            { key: "score", header: "Quiz" },
          ]}
          rows={[
            { name: "Introduction", status: "Done", score: "90%" },
            { name: "Pointers", status: "In progress", score: "—" },
            { name: "STL", status: "Not started", score: "—" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Code block</h2>
        <CodeBlock
          title="main.cpp"
          code={`#include <iostream>
int main() {
  std::cout << "hello\\n";
  return 0;
}`}
        />
      </section>

      <Modal
        open={modalOpen}
        title="Confirm action"
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4 p-5">
          <p className="text-sm text-[var(--app-muted)]">
            Destructive actions should confirm. Everything else should not.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setModalOpen(false)}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
