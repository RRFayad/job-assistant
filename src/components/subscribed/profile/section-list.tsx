"use client";

import type { Dispatch } from "react";
import { ListIcon, Rows3Icon, TagsIcon, TypeIcon } from "lucide-react";

import type { ProfileSection } from "@/types/profile";
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
  addSectionEyebrow: tw(
    "mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase",
  ),
  addSectionGrid: tw("flex flex-wrap gap-3"),
  addSectionCard: tw(
    "w-40 flex-1 cursor-pointer rounded-xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md",
  ),
  addSectionIcon: tw(
    "mb-3 flex size-8.5 items-center justify-center rounded-[10px] bg-primary/10 text-primary",
  ),
  addSectionLabel: tw("text-sm font-semibold"),
  addSectionHint: tw("mt-1 text-xs text-muted-foreground"),
};

// A plain array (matching the prototype's own sectionTypes list) rather than
// a Record keyed by ProfileSection["type"] — that would force compile-time
// exhaustiveness, but it's traded away here for exact structural parity with
// the prototype. A 6th ProfileSection variant will NOT fail to compile if
// this array isn't updated for it too.
const SECTION_TYPES: {
  type: ProfileSection["type"];
  label: string;
  hint: string;
  icon: typeof TypeIcon;
}[] = [
  {
    type: "text",
    label: "Text",
    hint: "A free-form paragraph, like a summary.",
    icon: TypeIcon,
  },
  {
    type: "entries",
    label: "Entries",
    hint: "Roles, degrees — heading, dates, body.",
    icon: Rows3Icon,
  },
  {
    type: "tags",
    label: "Tag groups",
    hint: "Skills, grouped into labeled rows.",
    icon: TagsIcon,
  },
  {
    type: "list",
    label: "List",
    hint: "A simple bullet-style list of items.",
    icon: ListIcon,
  },
  {
    type: "pairs",
    label: "Pairs",
    hint: "Label/value rows — languages, certs.",
    icon: Rows3Icon,
  },
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
          number={index + 1}
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
              accentColor={accentColor}
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

      <div>
        <div className={styles.addSectionEyebrow}>Add a section</div>
        <div className={styles.addSectionGrid}>
          {SECTION_TYPES.map(({ type, label, hint, icon: Icon }) => (
            <button
              key={type}
              type="button"
              className={styles.addSectionCard}
              onClick={() =>
                dispatch({ type: "ADD_SECTION", sectionType: type })
              }
            >
              <span className={styles.addSectionIcon}>
                <Icon className="size-4" />
              </span>
              <div className={styles.addSectionLabel}>{label}</div>
              <div className={styles.addSectionHint}>{hint}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
