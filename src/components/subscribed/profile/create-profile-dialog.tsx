"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Profile } from "@/lib/backend/profile";
import { tw } from "@/lib/utils";

type CreateProfileDialogProps = {
  profiles: Profile[];
  onCreateBlank: () => void;
  onDuplicate: (profileId: string) => void;
};

const styles = {
  content: tw("space-y-4"),
  startBlank: tw("w-full"),
  duplicateLabel: tw("text-sm font-medium"),
  duplicateList: tw("space-y-2"),
  duplicateRow: tw(
    "flex items-center justify-between gap-2 rounded-lg border p-2",
  ),
};

export const CreateProfileDialog = ({
  profiles,
  onCreateBlank,
  onDuplicate,
}: CreateProfileDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleCreateBlank = () => {
    onCreateBlank();
    setOpen(false);
  };

  const handleDuplicate = (profileId: string) => {
    onDuplicate(profileId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <PlusIcon />
            New Profile
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new Profile</DialogTitle>
          <DialogDescription>
            Start from scratch, or duplicate an existing Profile as a starting
            point.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.content}>
          <Button
            type="button"
            variant="outline"
            className={styles.startBlank}
            onClick={handleCreateBlank}
          >
            Start blank
          </Button>

          {profiles.length > 0 && (
            <div className={styles.duplicateList}>
              <p className={styles.duplicateLabel}>
                Duplicate an existing Profile
              </p>
              {profiles.map((profile) => (
                <div key={profile.id} className={styles.duplicateRow}>
                  <span>{profile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicate(profile.id)}
                  >
                    Duplicate
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
