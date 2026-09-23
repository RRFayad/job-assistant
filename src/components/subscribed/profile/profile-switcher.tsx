"use client";

import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import type { Profile } from "@/lib/backend/profile";
import { cn, tw } from "@/lib/utils";

type ProfileSwitcherProps = {
  profiles: Profile[];
  selectedId: string;
  onSelect: (profileId: string) => void;
  onDelete: (profileId: string) => void;
  onRename: (profileId: string, name: string) => void;
  onRequestNew: () => void;
};

const styles = {
  row: tw("flex flex-wrap items-center gap-2"),
  chip: tw(
    "flex items-center overflow-hidden rounded-full border bg-card text-sm",
  ),
  chipActive: tw("border-primary bg-primary/5"),
  chipSelect: tw("cursor-pointer px-3 py-1.5 font-medium"),
  chipInput: tw(
    "h-7 w-28 border-0 bg-transparent px-3 py-1.5 text-sm focus-visible:ring-0",
  ),
  iconButton: tw(
    "flex size-7 shrink-0 cursor-pointer items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground",
  ),
  // Deliberate, deliberate deviation from the prototype's window.confirm():
  // an accessible AlertDialog for a destructive action instead of a native
  // browser confirm — see #12's Out of Scope.
  deleteButton: tw(
    "flex size-7 shrink-0 cursor-pointer items-center justify-center border-l text-muted-foreground hover:bg-muted hover:text-foreground",
  ),
  addButton: tw(
    "flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/60 hover:text-foreground",
  ),
};

type DeleteProfileButtonProps = {
  profile: Profile;
  onDelete: (profileId: string) => void;
};

const DeleteProfileButton = ({
  profile,
  onDelete,
}: DeleteProfileButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            className={styles.deleteButton}
            aria-label={`Delete ${profile.name}`}
          >
            <Trash2Icon className="size-3.5" />
          </button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete &quot;{profile.name}&quot;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onDelete(profile.id);
              setOpen(false);
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

type ProfileChipProps = {
  profile: Profile;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
};

const ProfileChip = ({
  profile,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: ProfileChipProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(profile.name);

  const startEditing = () => {
    setDraft(profile.name);
    setIsEditing(true);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== profile.name) onRename(trimmed);
    setIsEditing(false);
  };

  const cancel = () => {
    setDraft(profile.name);
    setIsEditing(false);
  };

  return (
    <div className={cn(styles.chip, isActive && styles.chipActive)}>
      {isEditing ? (
        <Input
          autoFocus
          aria-label="Profile name"
          className={styles.chipInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
        />
      ) : (
        <button type="button" className={styles.chipSelect} onClick={onSelect}>
          {profile.name}
        </button>
      )}
      <button
        type="button"
        className={styles.iconButton}
        aria-label={`Rename ${profile.name}`}
        onClick={startEditing}
      >
        <PencilIcon className="size-3" />
      </button>
      <DeleteProfileButton profile={profile} onDelete={onDelete} />
    </div>
  );
};

export const ProfileSwitcher = ({
  profiles,
  selectedId,
  onSelect,
  onDelete,
  onRename,
  onRequestNew,
}: ProfileSwitcherProps) => {
  return (
    <div className={styles.row}>
      {profiles.map((profile) => (
        <ProfileChip
          key={profile.id}
          profile={profile}
          isActive={profile.id === selectedId}
          onSelect={() => onSelect(profile.id)}
          onDelete={() => onDelete(profile.id)}
          onRename={(name) => onRename(profile.id, name)}
        />
      ))}
      <button type="button" className={styles.addButton} onClick={onRequestNew}>
        <PlusIcon className="size-3.5" />
        New Profile
      </button>
    </div>
  );
};
