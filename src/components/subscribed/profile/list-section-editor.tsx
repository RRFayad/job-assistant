"use client";

import { Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ListSection } from "@/lib/backend/profile";
import { tw } from "@/lib/utils";

import { RichTextField } from "./rich-text-field";

type ListSectionEditorProps = {
  section: ListSection;
  onChange: (section: ListSection) => void;
};

const styles = {
  list: tw("space-y-3"),
  item: tw("flex items-start gap-2"),
  field: tw("flex-1"),
};

export const ListSectionEditor = ({
  section,
  onChange,
}: ListSectionEditorProps) => {
  // Items have no stable id in the data model, but a plain array index as a
  // React key lets a RichTextField's internal state (manual-resize height,
  // preview toggle) get reused by the wrong item once a removal shifts
  // indices. This tracks a client-side-only id per item, kept in sync by
  // addItem/removeItem (the only places this component changes length).
  const [keys, setKeys] = useState<string[]>(() =>
    section.items.map(() => crypto.randomUUID()),
  );

  const updateItem = (index: number, value: string) => {
    onChange({
      ...section,
      items: section.items.map((item, i) => (i === index ? value : item)),
    });
  };

  const addItem = () => {
    setKeys((prev) => [...prev, crypto.randomUUID()]);
    onChange({ ...section, items: [...section.items, ""] });
  };

  const removeItem = (index: number) => {
    setKeys((prev) => prev.filter((_, i) => i !== index));
    onChange({
      ...section,
      items: section.items.filter((_, i) => i !== index),
    });
  };

  return (
    <div className={styles.list}>
      {section.items.map((item, index) => (
        <div key={keys[index] ?? index} className={styles.item}>
          <div className={styles.field}>
            <RichTextField
              value={item}
              onChange={(value) => updateItem(index, value)}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove item"
            onClick={() => removeItem(index)}
          >
            <Trash2Icon />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        Add item
      </Button>
    </div>
  );
};
