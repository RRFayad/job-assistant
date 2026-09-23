"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
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
import type { Profile } from "@/lib/backend/profile";
import { cn, tw } from "@/lib/utils";

type ProfileSwitcherProps = {
  profiles: Profile[];
  selectedId: string;
  onSelect: (profileId: string) => void;
  onDelete: (profileId: string) => void;
  onRequestNew: () => void;
};

const styles = {
  row: tw("flex flex-wrap items-center gap-2"),
  chip: tw(
    "flex items-center overflow-hidden rounded-full border bg-card text-sm",
  ),
  chipActive: tw("border-primary bg-primary/5"),
  chipSelect: tw("px-3 py-1.5 font-medium"),
  // Deliberate, deliberate deviation from the prototype's window.confirm():
  // an accessible AlertDialog for a destructive action instead of a native
  // browser confirm — see #12's Out of Scope.
  deleteButton: tw(
    "flex size-7 items-center justify-center border-l text-muted-foreground hover:bg-muted hover:text-foreground",
  ),
  addButton: tw(
    "flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-sm text-muted-foreground hover:border-primary/60 hover:text-foreground",
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

export const ProfileSwitcher = ({
  profiles,
  selectedId,
  onSelect,
  onDelete,
  onRequestNew,
}: ProfileSwitcherProps) => {
  return (
    <div className={styles.row}>
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className={cn(
            styles.chip,
            profile.id === selectedId && styles.chipActive,
          )}
        >
          <button
            type="button"
            className={styles.chipSelect}
            onClick={() => onSelect(profile.id)}
          >
            {profile.name}
          </button>
          <DeleteProfileButton profile={profile} onDelete={onDelete} />
        </div>
      ))}
      <button type="button" className={styles.addButton} onClick={onRequestNew}>
        <PlusIcon className="size-3.5" />
        New Profile
      </button>
    </div>
  );
};
