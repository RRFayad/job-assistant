"use client";

import type { Dispatch } from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ProfileSection } from "@/lib/backend/profile";
import { tw } from "@/lib/utils";

import { EntriesSectionEditor } from "./entries-section-editor";
import { ListSectionEditor } from "./list-section-editor";
import type { ProfileAction } from "./profile-reducer";
import { RichTextField } from "./rich-text-field";
import { SectionShell } from "./section-shell";

type SectionListProps = {
  sections: ProfileSection[];
  accentColor: string;
  dispatch: Dispatch<ProfileAction>;
};

const styles = {
  list: tw("space-y-4"),
  unsupported: tw("text-sm text-muted-foreground italic"),
};

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
          {(section.type === "tags" || section.type === "pairs") && (
            <p className={styles.unsupported}>
              This section type isn&apos;t editable yet.
            </p>
          )}
        </SectionShell>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => dispatch({ type: "ADD_SECTION" })}
      >
        <PlusIcon />
        Add section
      </Button>
    </div>
  );
};
