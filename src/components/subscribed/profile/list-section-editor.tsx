"use client";

import { XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ListSection } from "@/types/profile";
import { tw } from "@/lib/utils";

import { iconButtonClass } from "./editor-field-styles";
import { RichTextField } from "./rich-text-field";

type ListSectionEditorProps = {
  section: ListSection;
  onChange: (section: ListSection) => void;
};

const styles = {
  itemRow: tw("mt-3 flex items-start gap-2 first:mt-0"),
  field: tw("flex-1"),
  iconButton: iconButtonClass,
  addButton: tw("mt-3"),
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
    <>
      {section.items.map((item, index) => (
        <div key={keys[index] ?? index} className={styles.itemRow}>
          <div className={styles.field}>
            <RichTextField
              value={item}
              onChange={(value) => updateItem(index, value)}
            />
          </div>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Remove item"
            onClick={() => removeItem(index)}
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className={styles.addButton}
        onClick={addItem}
      >
        Add item
      </Button>
    </>
  );
};
