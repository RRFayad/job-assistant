"use client";

import { SparklesIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  fetchProfileSuggestion,
  type SuggestionTarget,
} from "@/lib/backend/profile";
import { tw } from "@/lib/utils";

import { renderMarkdownLite } from "./markdown-lite";

type AskAiPanelProps = {
  target: SuggestionTarget;
  onAccept: (suggestion: SuggestionTarget) => void;
};

type Status = "idle" | "loading" | "ready" | "error";

const styles = {
  wrapper: tw("space-y-2"),
  toggle: tw("text-muted-foreground"),
  card: tw("space-y-3 rounded-lg border border-dashed p-3"),
  label: tw("text-xs font-medium text-muted-foreground uppercase"),
  preview: tw("text-sm [&_ul]:list-disc [&_ul]:pl-5"),
  actions: tw("flex items-center gap-2"),
  error: tw("text-sm text-destructive"),
};

const SuggestionPreview = ({ target }: { target: SuggestionTarget }) => {
  if (target.kind === "header") {
    return <p className={styles.preview}>{target.header.careerTitle}</p>;
  }

  const { section } = target;

  switch (section.type) {
    case "text":
      return (
        <div
          className={styles.preview}
          dangerouslySetInnerHTML={{ __html: renderMarkdownLite(section.body) }}
        />
      );
    case "entries":
      return (
        <div className={styles.preview}>
          {section.entries.map((entry) => (
            <p key={entry.id}>
              <strong>{entry.heading}</strong> ({entry.dates}) — {entry.body}
            </p>
          ))}
        </div>
      );
    case "list":
      return (
        <ul className={styles.preview}>
          {section.items.map((item, index) => (
            // Items have no stable id in the data model — index is the only key.
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    case "tags":
      return (
        <div className={styles.preview}>
          {section.categories.map((category) => (
            <p key={category.id}>
              <strong>{category.label}:</strong> {category.items.join(", ")}
            </p>
          ))}
        </div>
      );
    case "pairs":
      return (
        <div className={styles.preview}>
          {section.pairs.map((pair) => (
            <p key={pair.id}>
              {pair.left}: {pair.right}
            </p>
          ))}
        </div>
      );
  }
};

export const AskAiPanel = ({ target, onAccept }: AskAiPanelProps) => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [suggestion, setSuggestion] = useState<SuggestionTarget | null>(null);
  const isMounted = useRef(true);
  // Bumped on every fetch, so a response from a superseded/abandoned request
  // (panel closed and reopened, or unmounted mid-flight) can't apply itself.
  const requestId = useRef(0);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const runFetch = async () => {
    const thisRequest = (requestId.current += 1);
    setStatus("loading");
    setSuggestion(null);

    const result = await fetchProfileSuggestion(target);
    if (!isMounted.current || thisRequest !== requestId.current) return;

    if (result) {
      setSuggestion(result);
      setStatus("ready");
    } else {
      setStatus("error");
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);

    // Always fetch fresh on open — target reflects the current header/section,
    // so a suggestion cached from before an intervening edit could otherwise
    // be Accepted and silently overwrite that edit (ADR-0006).
    if (next) {
      runFetch();
    } else {
      requestId.current += 1; // invalidate any fetch in flight
    }
  };

  const handleAccept = () => {
    if (!suggestion) return;
    onAccept(suggestion);
    setSuggestion(null);
    setStatus("idle");
    setOpen(false);
  };

  const handleDismiss = () => {
    setSuggestion(null);
    setStatus("idle");
    setOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={styles.toggle}
        onClick={handleToggle}
      >
        <SparklesIcon />
        Ask AI
      </Button>

      {open && (
        <div className={styles.card}>
          {status === "loading" && <p className={styles.preview}>Thinking…</p>}
          {status === "error" && (
            <>
              <p className={styles.error}>Failed to get a suggestion.</p>
              <Button type="button" size="sm" onClick={runFetch}>
                Try again
              </Button>
            </>
          )}
          {status === "ready" && suggestion && (
            <>
              <p className={styles.label}>Suggested</p>
              <SuggestionPreview target={suggestion} />
              <div className={styles.actions}>
                <Button type="button" size="sm" onClick={handleAccept}>
                  Accept
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                >
                  Dismiss
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
