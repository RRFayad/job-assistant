"use client";

import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PairsSection } from "@/lib/backend/profile";
import { tw } from "@/lib/utils";

import { bareInputClass, iconButtonClass } from "./editor-field-styles";

type Pair = PairsSection["pairs"][number];

type PairsSectionEditorProps = {
  section: PairsSection;
  onChange: (section: PairsSection) => void;
};

const styles = {
  pairRow: tw("mt-2 flex items-center gap-2 first:mt-0"),
  bareInput: bareInputClass,
  iconButton: iconButtonClass,
  addButton: tw("mt-3"),
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
    <>
      {section.pairs.map((pair) => (
        <div key={pair.id} className={styles.pairRow}>
          <Input
            aria-label="Label"
            className={styles.bareInput}
            placeholder="Label"
            value={pair.left}
            onChange={(e) => updatePair(pair.id, { left: e.target.value })}
          />
          <Input
            aria-label="Value"
            className={styles.bareInput}
            placeholder="Value"
            value={pair.right}
            onChange={(e) => updatePair(pair.id, { right: e.target.value })}
          />
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Remove pair"
            onClick={() => removePair(pair.id)}
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
        onClick={addPair}
      >
        Add
      </Button>
    </>
  );
};
