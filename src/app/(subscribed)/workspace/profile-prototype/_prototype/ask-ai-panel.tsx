"use client";

// PROTOTYPE ONLY — a section-scoped "Ask AI" panel. Expands inline within
// the section card that opened it (no separate screen, no mode switch).
// Per ADR-0006: a proposed change is never applied automatically — the
// candidate must explicitly Accept it before it touches real data.

import { useState } from "react";
import { CheckIcon, SendIcon, SparklesIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, tw } from "@/lib/utils";

export type AskAIProposedChange = {
  preview: string;
  onAccept: () => void;
};

export type AskAIResponse = {
  text: string;
  proposedChange?: AskAIProposedChange;
};

type AskAIMessage = {
  from: "ai" | "candidate";
  text: string;
  proposedChange?: AskAIProposedChange;
  status?: "accepted" | "dismissed";
};

type AskAIPanelProps = {
  sectionLabel: string;
  onAsk: (question: string) => AskAIResponse;
};

const styles = {
  wrap: tw(
    "mt-4 rounded-lg border border-primary/25 bg-primary/4 p-3 dark:bg-primary/10",
  ),
  head: tw("flex items-center gap-1.5 text-xs font-semibold text-primary"),
  scroll: tw("mt-2 max-h-64 space-y-2 overflow-y-auto"),
  bubbleRow: tw("flex gap-2"),
  bubbleRowCandidate: tw("flex-row-reverse"),
  avatar: tw(
    "flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary",
  ),
  bubble: tw("max-w-sm rounded-2xl px-3 py-2 text-sm"),
  bubbleAi: tw("rounded-tl-sm bg-background"),
  bubbleCandidate: tw("rounded-tr-sm bg-primary text-primary-foreground"),
  proposedCard: tw(
    "mt-2 max-w-sm rounded-lg border border-primary/30 bg-primary/5 p-2.5 text-sm",
  ),
  proposedLabel: tw(
    "mb-1 text-[10px] font-semibold tracking-wide text-primary uppercase",
  ),
  proposedActions: tw("mt-2 flex items-center gap-2"),
  statusLine: tw(
    "mt-2 flex items-center gap-1.5 text-xs text-muted-foreground",
  ),
  composer: tw("mt-2 flex items-center gap-2"),
};

export const AskAIPanel = ({ sectionLabel, onAsk }: AskAIPanelProps) => {
  const [messages, setMessages] = useState<AskAIMessage[]>([
    {
      from: "ai",
      text: `Ask me anything about your ${sectionLabel} section — I can suggest edits, but I'll never change it without you accepting first.`,
    },
  ]);
  const [draft, setDraft] = useState("");

  const send = () => {
    const question = draft.trim();
    if (!question) return;

    const response = onAsk(question);
    setMessages((current) => [
      ...current,
      { from: "candidate", text: question },
      {
        from: "ai",
        text: response.text,
        proposedChange: response.proposedChange,
      },
    ]);
    setDraft("");
  };

  const resolveProposal = (index: number, status: "accepted" | "dismissed") => {
    setMessages((current) =>
      current.map((message, i) => {
        if (i !== index) return message;
        if (status === "accepted") message.proposedChange?.onAccept();
        return { ...message, status };
      }),
    );
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <SparklesIcon className="size-3.5" />
        Ask AI
      </div>

      <div className={styles.scroll}>
        {messages.map((message, index) => (
          <div key={index}>
            <div
              className={cn(
                styles.bubbleRow,
                message.from === "candidate" && styles.bubbleRowCandidate,
              )}
            >
              <span className={styles.avatar}>
                {message.from === "ai" ? (
                  <SparklesIcon className="size-3.5" />
                ) : (
                  "R"
                )}
              </span>
              <div
                className={cn(
                  styles.bubble,
                  message.from === "ai"
                    ? styles.bubbleAi
                    : styles.bubbleCandidate,
                )}
              >
                {message.text}
              </div>
            </div>

            {message.proposedChange && (
              <div className={styles.proposedCard}>
                <p className={styles.proposedLabel}>Suggested change</p>
                <p>{message.proposedChange.preview}</p>
                {message.status ? (
                  <p className={styles.statusLine}>
                    {message.status === "accepted" ? (
                      <>
                        <CheckIcon className="size-3.5" />
                        Applied to your Profile
                      </>
                    ) : (
                      <>
                        <XIcon className="size-3.5" />
                        Dismissed
                      </>
                    )}
                  </p>
                ) : (
                  <div className={styles.proposedActions}>
                    <Button
                      onClick={() => resolveProposal(index, "accepted")}
                      size="sm"
                    >
                      <CheckIcon />
                      Accept
                    </Button>
                    <Button
                      onClick={() => resolveProposal(index, "dismissed")}
                      size="sm"
                      variant="ghost"
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.composer}>
        <Input
          className="flex-1"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              send();
            }
          }}
          placeholder="Ask a question, or paste something to add…"
          value={draft}
        />
        <Button onClick={send} size="icon">
          <SendIcon />
        </Button>
      </div>
    </div>
  );
};
