"use client";

import type { Dispatch } from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
};

// A Record (not a plain array) so adding a 6th ProfileSection variant fails
// to compile here until the "Add section" menu is updated for it too.
const SECTION_TYPE_LABELS: Record<ProfileSection["type"], string> = {
  text: "Text",
  tags: "Tags",
  entries: "Entries",
  list: "List",
  pairs: "Pairs",
};

const SECTION_TYPE_ENTRIES = Object.entries(SECTION_TYPE_LABELS) as [
  ProfileSection["type"],
  string,
][];

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
          aiPanel={
            <AskAiPanel
              target={{ kind: "section", section }}
              onAccept={(suggestion) =>
                suggestion.kind === "section" &&
                dispatch({
                  type: "UPDATE_SECTION",
                  section: suggestion.section,
                })
              }
            />
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

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="outline">
              <PlusIcon />
              Add section
            </Button>
          }
        />
        <DropdownMenuContent>
          {SECTION_TYPE_ENTRIES.map(([type, label]) => (
            <DropdownMenuItem
              key={type}
              onClick={() =>
                dispatch({ type: "ADD_SECTION", sectionType: type })
              }
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
