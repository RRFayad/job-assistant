"use client";

import type { Dispatch } from "react";
import { ListIcon, Rows3Icon, TagsIcon, TypeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ProfileSection } from "@/lib/backend/profile";
import { tw } from "@/lib/utils";

import { AskAiPanel } from "./ask-ai-panel";
import { EntriesSectionEditor } from "./entries-section-editor";
import { ListSectionEditor } from "./list-section-editor";
import { PairsSectionEditor } from "./pairs-section-editor";
import type { ProfileAction } from "./profile-reducer";
import { RichTextField } from "./rich-text-field";
import { SectionShell } from "./section-shell";
import { TagsSectionEditor } from "./tags-section-editor";

type SectionListProps = {
  sections: ProfileSection[];
  accentColor: string;
  dispatch: Dispatch<ProfileAction>;
};

const styles = {
  list: tw("space-y-4"),
  addSectionBar: tw(
    "flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-4",
  ),
  addSectionHint: tw("mr-1 text-sm text-muted-foreground"),
};

// A plain array (matching the prototype's own sectionTypes list) rather than
// a Record keyed by ProfileSection["type"] — that would force compile-time
// exhaustiveness, but it's traded away here for exact structural parity with
// the prototype. A 6th ProfileSection variant will NOT fail to compile if
// this array isn't updated for it too.
const SECTION_TYPES: {
  type: ProfileSection["type"];
  label: string;
  icon: typeof TypeIcon;
}[] = [
  { type: "text", label: "Text", icon: TypeIcon },
  { type: "tags", label: "Tag groups", icon: TagsIcon },
  { type: "entries", label: "Entries", icon: Rows3Icon },
  { type: "list", label: "List", icon: ListIcon },
  { type: "pairs", label: "Pairs", icon: Rows3Icon },
];

export const SectionList = ({
  sections,
  accentColor,
  dispatch,
}: SectionListProps) => {
  return (
    <div className={styles.list}>
      {sections.map((section, index) => (
        <SectionShell
          key={section.id}
          title={section.title}
          accentColor={accentColor}
          canMoveUp={index > 0}
          canMoveDown={index < sections.length - 1}
          onRename={(title) =>
            dispatch({ type: "RENAME_SECTION", sectionId: section.id, title })
          }
          onMoveUp={() =>
            dispatch({
              type: "MOVE_SECTION",
              sectionId: section.id,
              direction: "up",
            })
          }
          onMoveDown={() =>
            dispatch({
              type: "MOVE_SECTION",
              sectionId: section.id,
              direction: "down",
            })
          }
          onRemove={() =>
            dispatch({ type: "REMOVE_SECTION", sectionId: section.id })
          }
          renderAiPanel={({ onClose }) => (
            <AskAiPanel
              target={{ kind: "section", section }}
              onClose={onClose}
              onAccept={(suggestion) =>
                suggestion.kind === "section" &&
                dispatch({
                  type: "UPDATE_SECTION",
                  section: suggestion.section,
                })
              }
            />
          )}
        >
          {section.type === "text" && (
            <RichTextField
              value={section.body}
              onChange={(body) =>
                dispatch({
                  type: "UPDATE_SECTION",
                  section: { ...section, body },
                })
              }
            />
          )}
          {section.type === "entries" && (
            <EntriesSectionEditor
              section={section}
              onChange={(next) =>
                dispatch({ type: "UPDATE_SECTION", section: next })
              }
            />
          )}
          {section.type === "list" && (
            <ListSectionEditor
              section={section}
              onChange={(next) =>
                dispatch({ type: "UPDATE_SECTION", section: next })
              }
            />
          )}
          {section.type === "tags" && (
            <TagsSectionEditor
              section={section}
              onChange={(next) =>
                dispatch({ type: "UPDATE_SECTION", section: next })
              }
            />
          )}
          {section.type === "pairs" && (
            <PairsSectionEditor
              section={section}
              onChange={(next) =>
                dispatch({ type: "UPDATE_SECTION", section: next })
              }
            />
          )}
        </SectionShell>
      ))}

      <div className={styles.addSectionBar}>
        <span className={styles.addSectionHint}>Add a section:</span>
        {SECTION_TYPES.map(({ type, label, icon: Icon }) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: "ADD_SECTION", sectionType: type })}
          >
            <Icon />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};
