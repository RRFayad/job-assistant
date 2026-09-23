"use client";

import type { ReactNode } from "react";
import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tw } from "@/lib/utils";

type SectionShellProps = {
  title: string;
  accentColor: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRename: (title: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  aiPanel: ReactNode;
  children: ReactNode;
};

const styles = {
  card: tw("space-y-3 rounded-xl border border-l-4 p-4"),
  header: tw("flex items-center gap-2"),
  title: tw("flex-1"),
  actions: tw("flex items-center gap-1"),
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
  aiPanel,
  children,
}: SectionShellProps) => {
  return (
    <section className={styles.card} style={{ borderLeftColor: accentColor }}>
      <div className={styles.header}>
        <Input
          className={styles.title}
          value={title}
          onChange={(e) => onRename(e.target.value)}
          aria-label="Section title"
        />
        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Move section up"
            disabled={!canMoveUp}
            onClick={onMoveUp}
          >
            <ArrowUpIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Move section down"
            disabled={!canMoveDown}
            onClick={onMoveDown}
          >
            <ArrowDownIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove section"
            onClick={onRemove}
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>
      {aiPanel}
      {children}
    </section>
  );
};
