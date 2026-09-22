"use client";

import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EntriesSection } from "@/lib/backend/profile";
import { tw } from "@/lib/utils";

import { RichTextField } from "./rich-text-field";

type Entry = EntriesSection["entries"][number];

type EntriesSectionEditorProps = {
  section: EntriesSection;
  onChange: (section: EntriesSection) => void;
};

const styles = {
  list: tw("space-y-4"),
  entry: tw("space-y-2 rounded-lg border border-dashed p-3"),
  row: tw("grid gap-2 sm:grid-cols-[1fr_auto_auto]"),
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
    <div className={styles.list}>
      {section.entries.map((entry) => (
        <div key={entry.id} className={styles.entry}>
          <div className={styles.row}>
            <Input
              aria-label="Entry heading"
              placeholder="Heading (e.g. Senior Engineer, Acme Corp)"
              value={entry.heading}
              onChange={(e) =>
                updateEntry(entry.id, { heading: e.target.value })
              }
            />
            <Input
              aria-label="Entry dates"
              placeholder="Dates (e.g. 2023 - Present)"
              value={entry.dates}
              onChange={(e) => updateEntry(entry.id, { dates: e.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove entry"
              onClick={() => removeEntry(entry.id)}
            >
              <Trash2Icon />
            </Button>
          </div>
          <RichTextField
            value={entry.body}
            onChange={(body) => updateEntry(entry.id, { body })}
          />
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addEntry}>
        Add entry
      </Button>
    </div>
  );
};
