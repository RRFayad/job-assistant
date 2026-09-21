"use client";

// PROTOTYPE ONLY — switches between the Candidate's Profiles (up to
// MAX_PROFILES). Lives on the Profile page itself, not the sidebar —
// nothing else in the app (Applications, etc.) depends on "which Profile is
// active," so a global sidebar-level switcher would be the wrong model.

import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { cn, tw } from "@/lib/utils";

import { MAX_PROFILES, type Profile } from "./mock-data";

type ProfileSwitcherProps = {
  profiles: Profile[];
  selectedProfileId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRequestNew: () => void;
};

const styles = {
  wrap: tw("flex flex-wrap items-center gap-2"),
  chip: tw(
    "flex items-center overflow-hidden rounded-full border bg-card text-sm",
  ),
  chipActive: tw("border-primary bg-primary/5"),
  chipSelect: tw("px-3 py-1.5 font-medium"),
  deleteButton: tw(
    "flex size-7 items-center justify-center border-l text-muted-foreground hover:bg-muted hover:text-foreground",
  ),
  addButton: tw(
    "flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/60 hover:text-foreground",
  ),
};

export const ProfileSwitcher = ({
  profiles,
  selectedProfileId,
  onSelect,
  onDelete,
  onRequestNew,
}: ProfileSwitcherProps) => {
  const handleNew = () => {
    if (profiles.length >= MAX_PROFILES) {
      toast.error(`You can have up to ${MAX_PROFILES} Profiles.`, {
        description: "Delete one to create a new one.",
      });
      return;
    }
    onRequestNew();
  };

  const handleDelete = (id: string, name: string) => {
    if (profiles.length <= 1) {
      toast.error("You need at least one Profile.");
      return;
    }
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    onDelete(id);
  };

  return (
    <div className={styles.wrap}>
      {profiles.map((profile) => (
        <div
          className={cn(
            styles.chip,
            profile.id === selectedProfileId && styles.chipActive,
          )}
          key={profile.id}
        >
          <button
            className={styles.chipSelect}
            onClick={() => onSelect(profile.id)}
            type="button"
          >
            {profile.name}
          </button>
          <button
            aria-label={`Delete ${profile.name}`}
            className={styles.deleteButton}
            onClick={() => handleDelete(profile.id, profile.name)}
            type="button"
          >
            <Trash2Icon className="size-3.5" />
          </button>
        </div>
      ))}
      <button className={styles.addButton} onClick={handleNew} type="button">
        <PlusIcon className="size-3.5" />
        New Profile
      </button>
    </div>
  );
};
