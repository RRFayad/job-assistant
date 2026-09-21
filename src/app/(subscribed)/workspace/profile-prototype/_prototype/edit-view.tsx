"use client";

// PROTOTYPE ONLY — the permanent edit view for one selected Profile
// (controlled: header/sections live in ProfileFlow so switching Profiles
// never loses edits). Header is fixed at the top; everything else is an
// ORDERED LIST of sections the candidate can rename, reorder, remove, and
// add to freely (built-in or fully custom). AI help lives on each section
// (including Header) via "Ask AI" — there is no separate chat screen or mode.
//
// Autosave feedback is mocked here (debounced status only, no real request)
// per the decision to finish the frontend against mock data before wiring
// FastAPI — see the "Saving… / All changes saved" indicator below.

import { useEffect, useRef, useState } from "react";
import {
  CheckIcon,
  DownloadIcon,
  ListIcon,
  Loader2Icon,
  PlusIcon,
  Rows3Icon,
  SparklesIcon,
  TagsIcon,
  TypeIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/subscribed/page-header";
import { cn, tw } from "@/lib/utils";

import { AskAIPanel } from "./ask-ai-panel";
import type { Profile, ProfileHeader, ProfileSection } from "./mock-data";
import { ProfileSwitcher } from "./profile-switcher";
import { SectionEditor } from "./section-editor";

type ProfileEditViewProps = {
  profile: Profile;
  profiles: Profile[];
  onHeaderChange: (header: ProfileHeader) => void;
  onSectionsChange: (sections: ProfileSection[]) => void;
  onSelectProfile: (id: string) => void;
  onDeleteProfile: (id: string) => void;
  onRequestNewProfile: () => void;
};

const SAVE_DELAY_MS = 2000;

const sectionTypes: {
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

const blankSection = (type: ProfileSection["type"]): ProfileSection => {
  const id = crypto.randomUUID();
  switch (type) {
    case "text":
      return { id, type, title: "New section", body: "" };
    case "tags":
      return { id, type, title: "New section", categories: [] };
    case "entries":
      return { id, type, title: "New section", entries: [] };
    case "list":
      return { id, type, title: "New section", items: [] };
    case "pairs":
      return { id, type, title: "New section", pairs: [] };
  }
};

const styles = {
  page: tw("mx-auto w-full max-w-4xl space-y-6"),
  headerActions: tw("flex items-center gap-3"),
  saveStatus: tw("flex items-center gap-1.5 text-xs text-muted-foreground"),
  saveStatusDone: tw("text-emerald-600 dark:text-emerald-400"),
  section: tw("rounded-xl border bg-card p-5 shadow-sm"),
  sectionHead: tw("flex items-center justify-between gap-2 border-b pb-2"),
  sectionTitle: tw(
    "text-xs font-semibold tracking-wide text-muted-foreground uppercase",
  ),
  iconButtonMuted: tw(
    "flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground",
  ),
  askAIButtonActive: tw("bg-muted text-foreground"),
  fieldLabel: tw("text-xs font-medium text-muted-foreground"),
  fieldGroup: tw("space-y-1"),
  headerGrid: tw("mt-4 grid gap-3 sm:grid-cols-2"),
  bareInput: tw(
    "w-full border-0 border-b bg-transparent py-1 pr-0 pl-1 text-sm focus-visible:ring-0",
  ),
  linksBlock: tw("mt-4 space-y-2"),
  linkRow: tw("flex items-center gap-2"),
  linkLabelInput: tw("w-32 shrink-0"),
  themeBlock: tw("mt-4 flex flex-wrap gap-6 border-t pt-4"),
  themeField: tw("flex items-center gap-2"),
  colorSwatch: tw("size-8 shrink-0 cursor-pointer rounded-md border p-0"),
  colorLabelGroup: tw("flex flex-col"),
  colorLabel: tw("text-xs font-medium text-muted-foreground"),
  colorValue: tw("text-xs text-muted-foreground/70"),
  headerAccent: tw("-mx-5 -mt-5 mb-4 h-2 rounded-t-xl"),
  addSectionBar: tw(
    "flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-4",
  ),
  addSectionHint: tw("mr-1 text-sm text-muted-foreground"),
};

export const ProfileEditView = ({
  profile,
  profiles,
  onHeaderChange,
  onSectionsChange,
  onSelectProfile,
  onDeleteProfile,
  onRequestNewProfile,
}: ProfileEditViewProps) => {
  // ProfileFlow mounts this with key={profile.id}, so switching Profiles
  // remounts the component fresh — saveStatus/headerAskAIOpen reset on
  // their own, no effect needed to sync them to the prop change.
  const [headerAskAIOpen, setHeaderAskAIOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { header, sections } = profile;

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const markDirty = () => {
    setSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(
      () => setSaveStatus("saved"),
      SAVE_DELAY_MS,
    );
  };

  const handleHeaderChange = (next: ProfileHeader) => {
    onHeaderChange(next);
    markDirty();
  };

  const handleSectionsChange = (next: ProfileSection[]) => {
    onSectionsChange(next);
    markDirty();
  };

  const updateSection = (id: string, next: ProfileSection) => {
    handleSectionsChange(sections.map((s) => (s.id === id ? next : s)));
  };

  const removeSection = (id: string) => {
    handleSectionsChange(sections.filter((s) => s.id !== id));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const next = [...sections];
    const target = index + direction;
    [next[index], next[target]] = [next[target], next[index]];
    handleSectionsChange(next);
  };

  return (
    <div className={styles.page}>
      <PageHeader
        action={
          <div className={styles.headerActions}>
            <span className={styles.saveStatus}>
              {saveStatus === "saving" ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <CheckIcon
                    className={cn("size-3.5", styles.saveStatusDone)}
                  />
                  All changes saved
                </>
              )}
            </span>
            <Button size="sm" variant="outline">
              <DownloadIcon />
              .docx
            </Button>
            <Button size="sm" variant="outline">
              <DownloadIcon />
              .pdf
            </Button>
          </div>
        }
        description="Up to three independent Profiles — switch below, or create a new one."
        title="Your Profile"
      />

      <ProfileSwitcher
        onDelete={onDeleteProfile}
        onRequestNew={onRequestNewProfile}
        onSelect={onSelectProfile}
        profiles={profiles}
        selectedProfileId={profile.id}
      />

      <div className="space-y-4">
        <div className={styles.section}>
          <div
            className={styles.headerAccent}
            style={{ backgroundColor: header.primaryColor }}
          />
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Header</h2>
            <button
              className={cn(
                styles.iconButtonMuted,
                headerAskAIOpen && styles.askAIButtonActive,
              )}
              onClick={() => setHeaderAskAIOpen((current) => !current)}
              title="Ask AI about your Header"
              type="button"
            >
              <SparklesIcon className="size-3.5 text-primary" />
            </button>
          </div>
          <div className={styles.headerGrid}>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Full name</span>
              <Input
                className={styles.bareInput}
                onChange={(event) =>
                  handleHeaderChange({
                    ...header,
                    fullName: event.target.value,
                  })
                }
                placeholder="[Full Name]"
                value={header.fullName}
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>
                Career title (include your key skills here if you want them
                shown)
              </span>
              <Input
                className={styles.bareInput}
                onChange={(event) =>
                  handleHeaderChange({
                    ...header,
                    careerTitle: event.target.value,
                  })
                }
                placeholder="Full Stack Engineer | React, Node.js, PostgreSQL"
                value={header.careerTitle}
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Email</span>
              <Input
                className={styles.bareInput}
                onChange={(event) =>
                  handleHeaderChange({ ...header, email: event.target.value })
                }
                placeholder="email@example.com"
                value={header.email}
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Phone</span>
              <Input
                className={styles.bareInput}
                onChange={(event) =>
                  handleHeaderChange({ ...header, phone: event.target.value })
                }
                placeholder="+1 (000) 000-0000"
                value={header.phone}
              />
            </div>
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Location</span>
              <Input
                className={styles.bareInput}
                onChange={(event) =>
                  handleHeaderChange({
                    ...header,
                    location: event.target.value,
                  })
                }
                placeholder="Country, City"
                value={header.location}
              />
            </div>
          </div>

          <div className={styles.linksBlock}>
            <span className={styles.fieldLabel}>
              Websites (LinkedIn, GitHub, portfolio — up to 5)
            </span>
            {header.links.map((link) => (
              <div className={styles.linkRow} key={link.id}>
                <Input
                  className={cn(styles.bareInput, styles.linkLabelInput)}
                  onChange={(event) =>
                    handleHeaderChange({
                      ...header,
                      links: header.links.map((l) =>
                        l.id === link.id
                          ? { ...l, label: event.target.value }
                          : l,
                      ),
                    })
                  }
                  placeholder="Label"
                  value={link.label}
                />
                <Input
                  className={styles.bareInput}
                  onChange={(event) =>
                    handleHeaderChange({
                      ...header,
                      links: header.links.map((l) =>
                        l.id === link.id
                          ? { ...l, url: event.target.value }
                          : l,
                      ),
                    })
                  }
                  placeholder="https://…"
                  value={link.url}
                />
                <button
                  className={styles.iconButtonMuted}
                  onClick={() =>
                    handleHeaderChange({
                      ...header,
                      links: header.links.filter((l) => l.id !== link.id),
                    })
                  }
                  type="button"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ))}
            {header.links.length < 5 && (
              <Button
                onClick={() =>
                  handleHeaderChange({
                    ...header,
                    links: [
                      ...header.links,
                      { id: crypto.randomUUID(), label: "", url: "" },
                    ],
                  })
                }
                size="sm"
                variant="outline"
              >
                <PlusIcon />
                Add website
              </Button>
            )}
          </div>

          <div className={styles.themeBlock}>
            <div className={styles.themeField}>
              <input
                className={styles.colorSwatch}
                onChange={(event) =>
                  handleHeaderChange({
                    ...header,
                    primaryColor: event.target.value,
                  })
                }
                type="color"
                value={header.primaryColor}
              />
              <div className={styles.colorLabelGroup}>
                <span className={styles.colorLabel}>Resume primary color</span>
                <span className={styles.colorValue}>
                  Header block · {header.primaryColor}
                </span>
              </div>
            </div>
            <div className={styles.themeField}>
              <input
                className={styles.colorSwatch}
                onChange={(event) =>
                  handleHeaderChange({
                    ...header,
                    secondaryColor: event.target.value,
                  })
                }
                type="color"
                value={header.secondaryColor}
              />
              <div className={styles.colorLabelGroup}>
                <span className={styles.colorLabel}>2nd color</span>
                <span className={styles.colorValue}>
                  Section titles · {header.secondaryColor}
                </span>
              </div>
            </div>
          </div>

          {headerAskAIOpen && (
            <AskAIPanel
              onAsk={() => {
                const addition = header.careerTitle
                  ? `${header.careerTitle} — open to remote & hybrid roles`
                  : "Full Stack Engineer, open to remote & hybrid roles";
                return {
                  text: "Here's a version that also signals your location flexibility:",
                  proposedChange: {
                    preview: addition,
                    onAccept: () =>
                      handleHeaderChange({ ...header, careerTitle: addition }),
                  },
                };
              }}
              sectionLabel="Header"
            />
          )}
        </div>

        {sections.map((section, index) => (
          <SectionEditor
            accentColor={header.secondaryColor}
            isFirst={index === 0}
            isLast={index === sections.length - 1}
            key={section.id}
            onChange={(next) => updateSection(section.id, next)}
            onMoveDown={() => moveSection(index, 1)}
            onMoveUp={() => moveSection(index, -1)}
            onRemove={() => removeSection(section.id)}
            section={section}
          />
        ))}

        <div className={styles.addSectionBar}>
          <span className={styles.addSectionHint}>Add a section:</span>
          {sectionTypes.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              onClick={() =>
                handleSectionsChange([...sections, blankSection(type)])
              }
              size="sm"
              variant="outline"
            >
              <Icon />
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
