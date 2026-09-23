"use client";

import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EntriesSection } from "@/lib/backend/profile";
import { tw } from "@/lib/utils";

import { bareInputClass, iconButtonClass } from "./editor-field-styles";
import { RichTextField } from "./rich-text-field";

type Entry = EntriesSection["entries"][number];

type EntriesSectionEditorProps = {
  section: EntriesSection;
  onChange: (section: EntriesSection) => void;
};

const styles = {
  entryBlock: tw("mt-4 space-y-2 border-l-2 pl-4 first:mt-0"),
  entryHeadRow: tw("flex items-start gap-2"),
  bareInput: bareInputClass,
  datesInput: tw(
    "w-full border-0 border-b bg-transparent py-1 pr-0 pl-1 text-sm italic focus-visible:ring-0",
  ),
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
        <div key={entry.id} className={styles.entryBlock}>
          <div className={styles.entryHeadRow}>
            <Input
              aria-label="Entry heading"
              className={styles.bareInput}
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
