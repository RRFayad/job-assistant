"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TagsSection } from "@/lib/backend/profile";
import { tw } from "@/lib/utils";

type Category = TagsSection["categories"][number];

type TagsSectionEditorProps = {
  section: TagsSection;
  onChange: (section: TagsSection) => void;
};

const styles = {
  list: tw("space-y-4"),
  category: tw("space-y-2 rounded-lg border border-dashed p-3"),
  categoryHeader: tw("flex items-center gap-2"),
  categoryLabel: tw("flex-1"),
  tags: tw("flex flex-wrap items-center gap-2"),
  tagRow: tw("flex items-center gap-1"),
  tagInput: tw("h-7 w-32"),
};

const createCategory = (): Category => ({
  id: crypto.randomUUID(),
  label: "New Category",
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

  const addTag = (categoryId: string) => {
    const category = section.categories.find((c) => c.id === categoryId);
    if (!category) return;
    updateCategory(categoryId, { items: [...category.items, ""] });
  };

  const updateTag = (categoryId: string, index: number, value: string) => {
    const category = section.categories.find((c) => c.id === categoryId);
    if (!category) return;
    updateCategory(categoryId, {
      items: category.items.map((item, i) => (i === index ? value : item)),
    });
  };

  const removeTag = (categoryId: string, index: number) => {
    const category = section.categories.find((c) => c.id === categoryId);
    if (!category) return;
    updateCategory(categoryId, {
      items: category.items.filter((_, i) => i !== index),
    });
  };

  return (
    <div className={styles.list}>
      {section.categories.map((category) => (
        <div key={category.id} className={styles.category}>
          <div className={styles.categoryHeader}>
            <Input
              className={styles.categoryLabel}
              value={category.label}
              onChange={(e) =>
                updateCategory(category.id, { label: e.target.value })
              }
              aria-label="Category name"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove category"
              onClick={() => removeCategory(category.id)}
            >
              <Trash2Icon />
            </Button>
          </div>
          <div className={styles.tags}>
            {category.items.map((item, index) => (
              <div key={index} className={styles.tagRow}>
                <Input
                  aria-label="Tag"
                  className={styles.tagInput}
                  value={item}
                  placeholder="Tag"
                  onChange={(e) =>
                    updateTag(category.id, index, e.target.value)
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove tag"
                  onClick={() => removeTag(category.id, index)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => addTag(category.id)}
            >
              <PlusIcon />
              Add tag
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addCategory}>
        Add category
      </Button>
    </div>
  );
};
