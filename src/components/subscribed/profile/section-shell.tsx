"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { cn, tw } from "@/lib/utils";

type SectionShellProps = {
  title: string;
  accentColor: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRename: (title: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  renderAiPanel: (props: { onClose: () => void }) => ReactNode;
  children: ReactNode;
};

const styles = {
  card: tw("rounded-xl border bg-card p-5 shadow-sm"),
  accentStrip: tw("-mx-5 -mt-5 mb-4 h-2 rounded-t-xl"),
  head: tw("flex items-center gap-2"),
  titleInput: tw(
    "w-full border-0 border-b bg-transparent py-1 pr-0 pl-1 text-sm font-semibold tracking-wide uppercase focus-visible:ring-0",
  ),
  controls: tw("flex shrink-0 items-center gap-0.5 text-muted-foreground"),
  iconButton: tw(
    "flex size-7 cursor-pointer items-center justify-center rounded-md hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-30",
  ),
  iconButtonActive: tw("bg-muted text-foreground"),
  body: tw("mt-4"),
};

export const SectionShell = ({
  title,
  accentColor,
  canMoveUp,
  canMoveDown,
  onRename,
  onMoveUp,
  onMoveDown,
  onRemove,
  renderAiPanel,
  children,
}: SectionShellProps) => {
  const [askAiOpen, setAskAiOpen] = useState(false);

  return (
    <div className={styles.card}>
      <div
        className={styles.accentStrip}
        style={{ backgroundColor: accentColor }}
      />
      <div className={styles.head}>
        <Input
          className={styles.titleInput}
          value={title}
          onChange={(e) => onRename(e.target.value)}
          aria-label="Section title"
        />
        <div className={styles.controls}>
          <button
            type="button"
            className={cn(
              styles.iconButton,
              askAiOpen && styles.iconButtonActive,
            )}
            aria-label="Ask AI about this section"
            title="Ask AI about this section"
            onClick={() => setAskAiOpen((current) => !current)}
          >
            <SparklesIcon className="size-3.5 text-primary" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Move section up"
            disabled={!canMoveUp}
            onClick={onMoveUp}
          >
            <ArrowUpIcon className="size-3.5" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Move section down"
            disabled={!canMoveDown}
            onClick={onMoveDown}
          >
            <ArrowDownIcon className="size-3.5" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Remove section"
            onClick={onRemove}
          >
            <Trash2Icon className="size-3.5" />
          </button>
        </div>
      </div>

      {askAiOpen && renderAiPanel({ onClose: () => setAskAiOpen(false) })}

      <div className={styles.body}>{children}</div>
    </div>
  );
};
