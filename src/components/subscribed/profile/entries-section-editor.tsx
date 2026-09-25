"use client";

import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EntriesSection } from "@/types/profile";
import { tw } from "@/lib/utils";

import {
  bareInputClass,
  iconButtonClass,
  underlineFieldClass,
} from "./editor-field-styles";
import { RichTextField } from "./rich-text-field";

type Entry = EntriesSection["entries"][number];

type EntriesSectionEditorProps = {
  section: EntriesSection;
  accentColor: string;
  onChange: (section: EntriesSection) => void;
};

const styles = {
  entryBlock: tw("mt-4 space-y-2 border-l-2 pl-4 first:mt-0"),
  entryHeadRow: tw("flex items-start gap-2"),
  headingInput: tw(
    `min-w-0 flex-1 ${underlineFieldClass} pr-0 pl-1 text-sm font-semibold`,
  ),
  datesInput: tw(
    `w-full ${underlineFieldClass} pr-0 pl-1 text-xs text-muted-foreground italic`,
  ),
  bareInput: bareInputClass,
  iconButton: iconButtonClass,
  addButton: tw("mt-3"),
};

const createEntry = (): Entry => ({
  id: crypto.randomUUID(),
  heading: "",
  dates: "",
  body: "",
});

export const EntriesSectionEditor = ({
  section,
  accentColor,
  onChange,
}: EntriesSectionEditorProps) => {
  const updateEntry = (id: string, patch: Partial<Entry>) => {
    onChange({
      ...section,
      entries: section.entries.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    });
  };

  const addEntry = () => {
    onChange({ ...section, entries: [...section.entries, createEntry()] });
  };

  const removeEntry = (id: string) => {
    onChange({
      ...section,
      entries: section.entries.filter((entry) => entry.id !== id),
    });
  };

  return (
    <>
      {section.entries.map((entry) => (
        <div
          key={entry.id}
          className={styles.entryBlock}
          style={{ borderColor: accentColor }}
        >
          <div className={styles.entryHeadRow}>
            <Input
              aria-label="Entry heading"
              className={styles.headingInput}
              placeholder="Title, Company (descriptor), Location"
              value={entry.heading}
              onChange={(e) =>
                updateEntry(entry.id, { heading: e.target.value })
              }
            />
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Remove entry"
              onClick={() => removeEntry(entry.id)}
            >
              <Trash2Icon className="size-3.5" />
            </button>
          </div>
          <Input
            aria-label="Entry dates"
            className={styles.datesInput}
            placeholder="Start Date — End Date"
            value={entry.dates}
            onChange={(e) => updateEntry(entry.id, { dates: e.target.value })}
          />
          <RichTextField
            placeholder="Core responsibility, then add bullet lines as you like"
            value={entry.body}
            onChange={(body) => updateEntry(entry.id, { body })}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className={styles.addButton}
        onClick={addEntry}
      >
        Add entry
      </Button>
    </>
  );
};
