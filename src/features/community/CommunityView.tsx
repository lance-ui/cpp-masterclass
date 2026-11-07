import React, { useState } from "react";
import {
  Github,
  Star,
  UserPlus,
  ExternalLink,
  Copy,
  Check,
  Share2,
} from "lucide-react";
import { Button, Card, Badge, PageContainer } from "@/components/ui";

export const CommunityView: React.FC = () => {
  const [copiedClone, setCopiedClone] = useState(false);
  const [shared, setShared] = useState(false);

  const githubUser = "lance-ui";
  const githubRepo = "cpp-masterclass";
  const userUrl = `https://github.com/${githubUser}`;
  const repoUrl = `https://github.com/${githubUser}/${githubRepo}`;
  const cloneCmd = `git clone https://github.com/${githubUser}/${githubRepo}.git`;

  const handleCopyClone = async () => {
    try {
      await navigator.clipboard.writeText(cloneCmd);
      setCopiedClone(true);
      setTimeout(() => setCopiedClone(false), 2000);
    } catch {
      setCopiedClone(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "C++ MasterClass",
          text: "Phone-first C++ lab with a live sandbox.",
          url: window.location.origin,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // dismissed
      }
    } else {
      await navigator.clipboard.writeText(window.location.origin);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <PageContainer narrow className="!py-8 space-y-8">
      <div className="space-y-4">
        <p className="text-xs font-medium text-[var(--app-tertiary)]">Open source</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Star it if it helped.
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-[var(--app-muted)]">
          Built by @{githubUser}. Follow on GitHub or clone the repo — no pitch
          deck required.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={userUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 border border-[var(--app-border-strong)] bg-slate-900 px-4 font-mono text-xs font-bold text-brand-300 shadow-[var(--shadow-card)]"
          >
            <UserPlus className="size-4" />
            Follow @{githubUser}
            <ExternalLink className="size-3.5 opacity-70" />
          </a>
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 border border-[var(--app-border-strong)] bg-brand-300 px-4 font-mono text-xs font-bold text-slate-950 shadow-[var(--shadow-card)]"
          >
            <Star className="size-4" />
            Star repo
          </a>
          <Button variant="secondary" onClick={handleShare} className="min-h-11">
            <Share2 className="size-4" />
            {shared ? "Copied" : "Share"}
          </Button>
        </div>
      </div>

      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center border border-[var(--app-border-strong)] bg-brand-300 font-display text-lg font-bold text-slate-950">
            L
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold">{githubUser}</h3>
              <Badge tone="brand">author</Badge>
            </div>
            <span className="font-mono text-xs text-[var(--app-muted)]">
              github.com/{githubUser}
            </span>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Github className="size-5" />
          <h3 className="font-display font-bold">{githubRepo}</h3>
        </div>
        <div className="flex items-center gap-2 border border-[var(--app-border)] bg-[var(--app-code-bg)] p-3 font-mono text-xs text-brand-300">
          <code className="min-w-0 flex-1 truncate">{cloneCmd}</code>
          <button
            type="button"
            onClick={handleCopyClone}
            className="grid size-10 shrink-0 place-items-center border border-slate-700 text-slate-300"
            aria-label="Copy clone command"
          >
            {copiedClone ? (
              <Check className="size-4 text-brand-300" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>
      </Card>
    </PageContainer>
  );
};
