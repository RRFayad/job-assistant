"use client";

import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PairsSection } from "@/lib/backend/profile";
import { tw } from "@/lib/utils";

type Pair = PairsSection["pairs"][number];

type PairsSectionEditorProps = {
  section: PairsSection;
  onChange: (section: PairsSection) => void;
};

const styles = {
  list: tw("space-y-2"),
  row: tw("grid gap-2 sm:grid-cols-[1fr_1fr_auto]"),
};

const createPair = (): Pair => ({
  id: crypto.randomUUID(),
  left: "",
  right: "",
});

export const PairsSectionEditor = ({
  section,
  onChange,
}: PairsSectionEditorProps) => {
  const updatePair = (id: string, patch: Partial<Pair>) => {
    onChange({
      ...section,
      pairs: section.pairs.map((pair) =>
        pair.id === id ? { ...pair, ...patch } : pair,
      ),
    });
  };

  const addPair = () => {
    onChange({ ...section, pairs: [...section.pairs, createPair()] });
  };

  const removePair = (id: string) => {
    onChange({
      ...section,
      pairs: section.pairs.filter((pair) => pair.id !== id),
    });
  };

  return (
    <div className={styles.list}>
      {section.pairs.map((pair) => (
        <div key={pair.id} className={styles.row}>
          <Input
            aria-label="Label"
            placeholder="Label (e.g. Portuguese)"
            value={pair.left}
            onChange={(e) => updatePair(pair.id, { left: e.target.value })}
          />
          <Input
            aria-label="Value"
            placeholder="Value (e.g. Native)"
            value={pair.right}
            onChange={(e) => updatePair(pair.id, { right: e.target.value })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove pair"
            onClick={() => removePair(pair.id)}
          >
            <Trash2Icon />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addPair}>
        Add pair
      </Button>
    </div>
  );
};
