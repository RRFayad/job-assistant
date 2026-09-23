"use client";

import { Trash2Icon } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/backend/profile";
import { cn, tw } from "@/lib/utils";

import { CreateProfileDialog } from "./create-profile-dialog";

type ProfileSwitcherProps = {
  profiles: Profile[];
  selectedId: string;
  onSelect: (profileId: string) => void;
  onDelete: (profileId: string) => void;
  onCreateBlank: () => void;
  onDuplicate: (profileId: string) => void;
  onImport: (profile: Profile) => void;
};

const styles = {
  row: tw("flex flex-wrap items-center gap-2"),
  tab: tw("flex items-center gap-0.5 rounded-lg border p-0.5"),
  tabButton: tw(
    "rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground",
  ),
  tabButtonActive: tw("bg-muted font-medium text-foreground"),
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
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Delete ${profile.name}`}
          >
            <Trash2Icon />
          </Button>
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
  onCreateBlank,
  onDuplicate,
  onImport,
}: ProfileSwitcherProps) => {
  return (
    <div className={styles.row}>
      {profiles.map((profile) => (
        <div key={profile.id} className={styles.tab}>
          <button
            type="button"
            className={cn(
              styles.tabButton,
              profile.id === selectedId && styles.tabButtonActive,
            )}
            onClick={() => onSelect(profile.id)}
          >
            {profile.name}
          </button>
          <DeleteProfileButton profile={profile} onDelete={onDelete} />
        </div>
      ))}
      <CreateProfileDialog
        profiles={profiles}
        onCreateBlank={onCreateBlank}
        onDuplicate={onDuplicate}
        onImport={onImport}
      />
    </div>
  );
};
