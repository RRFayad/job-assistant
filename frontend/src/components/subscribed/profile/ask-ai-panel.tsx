"use client";

import { CheckIcon, SparklesIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { fetchProfileSuggestion } from "@/lib/backend/profile";
import { tw } from "@/lib/utils";
import type { SuggestionTarget } from "@/types/profile";

import { renderMarkdownLite } from "./markdown-lite";

type AskAiPanelProps = {
  target: SuggestionTarget;
  onClose: () => void;
  onAccept: (suggestion: SuggestionTarget) => void;
};

type Status = "idle" | "loading" | "ready" | "error";

const styles = {
  wrap: tw(
    "mt-4 rounded-lg border border-primary/25 bg-primary/4 p-3 dark:bg-primary/10",
  ),
  head: tw("flex items-center gap-1.5 text-xs font-semibold text-primary"),
  proposedCard: tw(
    "mt-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5 text-sm",
  ),
  proposedLabel: tw(
    "mb-1 text-[10px] font-semibold tracking-wide text-primary uppercase",
  ),
  preview: tw("text-sm [&_ul]:list-disc [&_ul]:pl-5"),
  actions: tw("mt-2 flex items-center gap-2"),
  error: tw("text-sm text-destructive"),
  thinking: tw("text-sm text-muted-foreground"),
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

export const AskAiPanel = ({ target, onClose, onAccept }: AskAiPanelProps) => {
  const [status, setStatus] = useState<Status>("idle");
  const [suggestion, setSuggestion] = useState<SuggestionTarget | null>(null);
  const isMounted = useRef(true);
  // Bumped on every fetch, so a response from a superseded/abandoned request
  // (unmounted mid-flight) can't apply itself.
  const requestId = useRef(0);

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

  useEffect(() => {
    isMounted.current = true;
    // The parent mounts this component fresh each time the toggle opens
    // (rather than passing an `open` boolean to an always-mounted instance),
    // so "just mounted" already means "just opened" — fetch immediately.
    // This also means closing and reopening always starts from a clean
    // slate and fetches fresh, so a suggestion cached from before an
    // intervening edit can never be Accepted and silently overwrite it
    // (ADR-0006).
    //
    // Deferred to a microtask so the first setState happens in a callback,
    // not synchronously within the effect body itself — this repo's
    // react-hooks/set-state-in-effect rule flags a direct call here.
    Promise.resolve().then(() => runFetch());
    return () => {
      isMounted.current = false;
    };
    // Intentionally mount-only: the parent remounts a fresh instance per
    // open, so this must not re-fetch on a later `target` change within the
    // same mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAccept = () => {
    if (!suggestion) return;
    onAccept(suggestion);
    onClose();
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <SparklesIcon className="size-3.5" />
        Ask AI
      </div>

      {status === "loading" && <p className={styles.thinking}>Thinking…</p>}

      {status === "error" && (
        <div className={styles.actions}>
          <p className={styles.error}>Failed to get a suggestion.</p>
          <Button type="button" size="sm" onClick={runFetch}>
            Try again
          </Button>
        </div>
      )}

      {status === "ready" && suggestion && (
        <div className={styles.proposedCard}>
          <p className={styles.proposedLabel}>Suggested change</p>
          <SuggestionPreview target={suggestion} />
          <div className={styles.actions}>
            <Button type="button" size="sm" onClick={handleAccept}>
              <CheckIcon />
              Accept
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
