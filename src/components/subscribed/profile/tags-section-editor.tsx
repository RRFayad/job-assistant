"use client";

import { Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TagsSection } from "@/lib/backend/profile";
import { tw } from "@/lib/utils";

import { bareInputClass, iconButtonClass } from "./editor-field-styles";

type Category = TagsSection["categories"][number];

type TagsSectionEditorProps = {
  section: TagsSection;
  onChange: (section: TagsSection) => void;
};

const styles = {
  categoryBlock: tw("mt-4 space-y-2 first:mt-0"),
  categoryHeadRow: tw("flex items-center gap-2"),
  bareInput: bareInputClass,
  iconButton: iconButtonClass,
  tagRow: tw("flex flex-wrap items-center gap-2"),
  tag: tw("flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"),
  tagRemove: tw("cursor-pointer text-muted-foreground hover:text-foreground"),
  tagInput: tw("h-7 w-32 text-xs"),
  addCategoryButton: tw("mt-3"),
};

const createCategory = (): Category => ({
  id: crypto.randomUUID(),
  label: "",
  items: [],
});

export const TagsSectionEditor = ({
  section,
  onChange,
}: TagsSectionEditorProps) => {
  const updateCategory = (id: string, patch: Partial<Category>) => {
    onChange({
      ...section,
      categories: section.categories.map((category) =>
        category.id === id ? { ...category, ...patch } : category,
      ),
    });
  };

  const addCategory = () => {
    onChange({
      ...section,
      categories: [...section.categories, createCategory()],
    });
  };

  const removeCategory = (id: string) => {
    onChange({
      ...section,
      categories: section.categories.filter((category) => category.id !== id),
    });
  };

  return (
    <>
      {section.categories.map((category) => (
        <div key={category.id} className={styles.categoryBlock}>
          <div className={styles.categoryHeadRow}>
            <Input
              className={styles.bareInput}
              placeholder="Category name"
              value={category.label}
              onChange={(e) =>
                updateCategory(category.id, { label: e.target.value })
              }
            />
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Remove category"
              onClick={() => removeCategory(category.id)}
            >
              <Trash2Icon className="size-3.5" />
            </button>
          </div>
          <TagEditor
            items={category.items}
            onChange={(items) => updateCategory(category.id, { items })}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={styles.addCategoryButton}
        onClick={addCategory}
      >
        Add category
      </Button>
    </>
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
        <span key={index} className={styles.tag}>
          {item}
          <button
            type="button"
            className={styles.tagRemove}
            aria-label={`Remove ${item}`}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      <Input
        className={styles.tagInput}
        placeholder="+ Add"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitDraft();
          }
        }}
      />
    </div>
  );
};
