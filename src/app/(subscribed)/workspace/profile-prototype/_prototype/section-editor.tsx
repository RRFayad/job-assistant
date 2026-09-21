"use client";

// PROTOTYPE ONLY — a generic, editable renderer for one Profile section.
// Every section (built-in or user-added) goes through this same shell:
// an editable title, reorder/remove controls, and a type-specific body.

import { useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, tw } from "@/lib/utils";

import { AskAIPanel, type AskAIResponse } from "./ask-ai-panel";
import type { ProfileSection } from "./mock-data";
import { RichTextField } from "./rich-text-field";

type SectionEditorProps = {
  section: ProfileSection;
  onChange: (next: ProfileSection) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  accentColor?: string;
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
    "flex size-7 items-center justify-center rounded-md hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30",
  ),
  body: tw("mt-4"),
  bareInput: tw(
    "w-full border-0 border-b bg-transparent py-1 pr-0 pl-1 text-sm focus-visible:ring-0",
  ),
  categoryBlock: tw("mt-4 space-y-2 first:mt-0"),
  categoryHeadRow: tw("flex items-center gap-2"),
  tagRow: tw("flex flex-wrap items-center gap-2"),
  tag: tw("flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"),
  tagRemove: tw("text-muted-foreground hover:text-foreground"),
  tagInput: tw("h-7 w-32 text-xs"),
  entryBlock: tw("mt-4 space-y-2 border-l-2 pl-4 first:mt-0"),
  entryHeadRow: tw("flex items-start gap-2"),
  listItemRow: tw("mt-3 flex items-start gap-2 first:mt-0"),
  pairRow: tw("mt-2 flex items-center gap-2 first:mt-0"),
  askAIButtonActive: tw("bg-muted text-foreground"),
};

const buildAskAIResponse = (
  section: ProfileSection,
  onChange: (next: ProfileSection) => void,
): AskAIResponse => {
  switch (section.type) {
    case "entries": {
      const target = section.entries[0];
      if (!target) {
        return { text: "Add an entry first and I can help strengthen it." };
      }
      const addition =
        "This directly contributed to measurable business impact — consider quantifying it further if you have a number.";
      return {
        text: `Here's a stronger closing line for your most recent entry (${target.heading || "untitled"}):`,
        proposedChange: {
          preview: addition,
          onAccept: () =>
            onChange({
              ...section,
              entries: section.entries.map((e) =>
                e.id === target.id
                  ? { ...e, body: `${e.body}\n- ${addition}` }
                  : e,
              ),
            }),
        },
      };
    }
    case "text": {
      const addition =
        "Comfortable operating across the full stack, from interface to infrastructure.";
      return {
        text: "Consider adding a line that ties your specializations together:",
        proposedChange: {
          preview: addition,
          onAccept: () =>
            onChange({ ...section, body: `${section.body}\n\n${addition}` }),
        },
      };
    }
    case "tags": {
      const target = section.categories[0];
      if (!target) {
        return {
          text: "Add a category first and I can suggest skills for it.",
        };
      }
      const addition = "Testing";
      return {
        text: `A lot of roles like this also list "${addition}" under ${target.label || "your first category"} — want to add it?`,
        proposedChange: {
          preview: addition,
          onAccept: () =>
            onChange({
              ...section,
              categories: section.categories.map((c) =>
                c.id === target.id
                  ? { ...c, items: [...c.items, addition] }
                  : c,
              ),
            }),
        },
      };
    }
    case "list": {
      const index = 0;
      const target = section.items[index];
      if (!target) {
        return {
          text: "Add an item first and I can help tighten the wording.",
        };
      }
      const addition = `${target} Recognized for measurable impact.`;
      return {
        text: "Here's a slightly tightened version of your first item:",
        proposedChange: {
          preview: addition,
          onAccept: () =>
            onChange({
              ...section,
              items: section.items.map((it, i) =>
                i === index ? addition : it,
              ),
            }),
        },
      };
    }
    case "pairs": {
      const addition = {
        id: crypto.randomUUID(),
        left: "French",
        right: "Basic",
      };
      return {
        text: "Want me to add another commonly-listed language?",
        proposedChange: {
          preview: `${addition.left}: ${addition.right}`,
          onAccept: () =>
            onChange({ ...section, pairs: [...section.pairs, addition] }),
        },
      };
    }
  }
};

export const SectionEditor = ({
  section,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  accentColor,
}: SectionEditorProps) => {
  const [askAIOpen, setAskAIOpen] = useState(false);

  return (
    <div className={styles.card}>
      {accentColor && (
        <div
          className={styles.accentStrip}
          style={{ backgroundColor: accentColor }}
        />
      )}
      <div className={styles.head}>
        <Input
          className={styles.titleInput}
          onChange={(event) =>
            onChange({ ...section, title: event.target.value })
          }
          value={section.title}
        />
        <div className={styles.controls}>
          <button
            className={cn(
              styles.iconButton,
              askAIOpen && styles.askAIButtonActive,
            )}
            onClick={() => setAskAIOpen((current) => !current)}
            title="Ask AI about this section"
            type="button"
          >
            <SparklesIcon className="size-3.5 text-primary" />
          </button>
          <button
            className={styles.iconButton}
            disabled={isFirst}
            onClick={onMoveUp}
            type="button"
          >
            <ArrowUpIcon className="size-3.5" />
          </button>
          <button
            className={styles.iconButton}
            disabled={isLast}
            onClick={onMoveDown}
            type="button"
          >
            <ArrowDownIcon className="size-3.5" />
          </button>
          <button
            className={styles.iconButton}
            onClick={onRemove}
            type="button"
          >
            <Trash2Icon className="size-3.5" />
          </button>
        </div>
      </div>

      {askAIOpen && (
        <AskAIPanel
          onAsk={() => buildAskAIResponse(section, onChange)}
          sectionLabel={section.title || "this"}
        />
      )}

      <div className={styles.body}>
        {section.type === "text" && (
          <RichTextField
            onChange={(value) => onChange({ ...section, body: value })}
            rows={4}
            value={section.body}
          />
        )}

        {section.type === "tags" && (
          <>
            {section.categories.map((category) => (
              <div className={styles.categoryBlock} key={category.id}>
                <div className={styles.categoryHeadRow}>
                  <Input
                    className={styles.bareInput}
                    onChange={(event) =>
                      onChange({
                        ...section,
                        categories: section.categories.map((c) =>
                          c.id === category.id
                            ? { ...c, label: event.target.value }
                            : c,
                        ),
                      })
                    }
                    placeholder="Category name"
                    value={category.label}
                  />
                  <button
                    className={styles.iconButton}
                    onClick={() =>
                      onChange({
                        ...section,
                        categories: section.categories.filter(
                          (c) => c.id !== category.id,
                        ),
                      })
                    }
                    type="button"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
                <TagEditor
                  items={category.items}
                  onChange={(items) =>
                    onChange({
                      ...section,
                      categories: section.categories.map((c) =>
                        c.id === category.id ? { ...c, items } : c,
                      ),
                    })
                  }
                />
              </div>
            ))}
            <Button
              className="mt-3"
              onClick={() =>
                onChange({
                  ...section,
                  categories: [
                    ...section.categories,
                    { id: crypto.randomUUID(), label: "", items: [] },
                  ],
                })
              }
              size="sm"
              variant="outline"
            >
              <PlusIcon />
              Add category
            </Button>
          </>
        )}

        {section.type === "entries" && (
          <>
            {section.entries.map((entry) => (
              <div className={styles.entryBlock} key={entry.id}>
                <div className={styles.entryHeadRow}>
                  <Input
                    className={styles.bareInput}
                    onChange={(event) =>
                      onChange({
                        ...section,
                        entries: section.entries.map((e) =>
                          e.id === entry.id
                            ? { ...e, heading: event.target.value }
                            : e,
                        ),
                      })
                    }
                    placeholder="Title, Company (descriptor), Location"
                    value={entry.heading}
                  />
                  <button
                    className={styles.iconButton}
                    onClick={() =>
                      onChange({
                        ...section,
                        entries: section.entries.filter(
                          (e) => e.id !== entry.id,
                        ),
                      })
                    }
                    type="button"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
                <Input
                  className={cn(styles.bareInput, "italic")}
                  onChange={(event) =>
                    onChange({
                      ...section,
                      entries: section.entries.map((e) =>
                        e.id === entry.id
                          ? { ...e, dates: event.target.value }
                          : e,
                      ),
                    })
                  }
                  placeholder="Start Date — End Date"
                  value={entry.dates}
                />
                <RichTextField
                  onChange={(value) =>
                    onChange({
                      ...section,
                      entries: section.entries.map((e) =>
                        e.id === entry.id ? { ...e, body: value } : e,
                      ),
                    })
                  }
                  placeholder="Core responsibility, then add bullet lines as you like"
                  rows={3}
                  value={entry.body}
                />
              </div>
            ))}
            <Button
              className="mt-3"
              onClick={() =>
                onChange({
                  ...section,
                  entries: [
                    ...section.entries,
                    {
                      id: crypto.randomUUID(),
                      heading: "",
                      dates: "",
                      body: "",
                    },
                  ],
                })
              }
              size="sm"
              variant="outline"
            >
              <PlusIcon />
              Add entry
            </Button>
          </>
        )}

        {section.type === "list" && (
          <>
            {section.items.map((item, index) => (
              <div className={styles.listItemRow} key={index}>
                <div className="flex-1">
                  <RichTextField
                    onChange={(value) =>
                      onChange({
                        ...section,
                        items: section.items.map((it, i) =>
                          i === index ? value : it,
                        ),
                      })
                    }
                    rows={2}
                    value={item}
                  />
                </div>
                <button
                  className={styles.iconButton}
                  onClick={() =>
                    onChange({
                      ...section,
                      items: section.items.filter((_, i) => i !== index),
                    })
                  }
                  type="button"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ))}
            <Button
              className="mt-3"
              onClick={() =>
                onChange({ ...section, items: [...section.items, ""] })
              }
              size="sm"
              variant="outline"
            >
              <PlusIcon />
              Add item
            </Button>
          </>
        )}

        {section.type === "pairs" && (
          <>
            {section.pairs.map((pair) => (
              <div className={styles.pairRow} key={pair.id}>
                <Input
                  className={styles.bareInput}
                  onChange={(event) =>
                    onChange({
                      ...section,
                      pairs: section.pairs.map((p) =>
                        p.id === pair.id
                          ? { ...p, left: event.target.value }
                          : p,
                      ),
                    })
                  }
                  placeholder="Label"
                  value={pair.left}
                />
                <Input
                  className={styles.bareInput}
                  onChange={(event) =>
                    onChange({
                      ...section,
                      pairs: section.pairs.map((p) =>
                        p.id === pair.id
                          ? { ...p, right: event.target.value }
                          : p,
                      ),
                    })
                  }
                  placeholder="Value"
                  value={pair.right}
                />
                <button
                  className={styles.iconButton}
                  onClick={() =>
                    onChange({
                      ...section,
                      pairs: section.pairs.filter((p) => p.id !== pair.id),
                    })
                  }
                  type="button"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ))}
            <Button
              className="mt-3"
              onClick={() =>
                onChange({
                  ...section,
                  pairs: [
                    ...section.pairs,
                    { id: crypto.randomUUID(), left: "", right: "" },
                  ],
                })
              }
              size="sm"
              variant="outline"
            >
              <PlusIcon />
              Add
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

const TagEditor = ({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) => {
  const [draft, setDraft] = useState("");

  const commitDraft = () => {
    const value = draft.trim();
    if (value) onChange([...items, value]);
    setDraft("");
  };

  return (
    <div className={styles.tagRow}>
      {items.map((item, index) => (
        <span className={styles.tag} key={item}>
          {item}
          <button
            className={styles.tagRemove}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            type="button"
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      <Input
        className={styles.tagInput}
        onBlur={commitDraft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitDraft();
          }
        }}
        placeholder="+ Add"
        value={draft}
      />
    </div>
  );
};
