"use client";

import { PlusIcon, UploadIcon } from "lucide-react";
import { useRef, useState, type ChangeEvent, type Dispatch } from "react";
import { toast } from "sonner";

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
import { cn, tw } from "@/lib/utils";

import { ProfileHeaderForm } from "./profile-header-form";
import type { ProfileAction } from "./profile-reducer";
import { profileReducer } from "./profile-reducer";
import { SectionList } from "./section-list";

type CreateProfileDialogProps = {
  profiles: Profile[];
  onCreateBlank: () => void;
  onDuplicate: (profileId: string) => void;
  onImport: (profile: Profile) => void;
};

type Step = "choose" | "uploading" | "reviewing";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

const styles = {
  content: tw("space-y-4"),
  wideContent: tw("sm:max-w-2xl"),
  startBlank: tw("w-full"),
  duplicateLabel: tw("text-sm font-medium"),
  duplicateList: tw("space-y-2"),
  duplicateRow: tw(
    "flex items-center justify-between gap-2 rounded-lg border p-2",
  ),
  uploading: tw("py-8 text-center text-sm text-muted-foreground"),
  reviewBody: tw("max-h-[60vh] space-y-6 overflow-y-auto pr-1"),
  hiddenInput: tw("hidden"),
};

export const CreateProfileDialog = ({
  profiles,
  onCreateBlank,
  onDuplicate,
  onImport,
}: CreateProfileDialogProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const [reviewProfile, setReviewProfile] = useState<Profile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Bumped on every reset and every new upload, so a stale response from an
  // abandoned or superseded upload can't overwrite newer/closed state.
  const uploadToken = useRef(0);

  const reviewDispatch: Dispatch<ProfileAction> = (action) => {
    setReviewProfile((prev) => (prev ? profileReducer(prev, action) : prev));
  };

  const reset = () => {
    uploadToken.current += 1;
    setStep("choose");
    setReviewProfile(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  };

  const handleCreateBlank = () => {
    onCreateBlank();
    handleOpenChange(false);
  };

  const handleDuplicate = (profileId: string) => {
    onDuplicate(profileId);
    handleOpenChange(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("That file is too large (max 10MB).");
      return;
    }

    const thisUpload = (uploadToken.current += 1);
    setStep("uploading");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/profile/extract", {
        method: "POST",
        body: formData,
      });

      if (thisUpload !== uploadToken.current) return; // superseded or closed

      if (!response.ok) {
        toast.error("Failed to extract a Profile from that file.");
        setStep("choose");
        return;
      }

      const extracted: Profile = await response.json();
      if (thisUpload !== uploadToken.current) return; // superseded or closed

      setReviewProfile(extracted);
      setStep("reviewing");
    } catch {
      if (thisUpload === uploadToken.current) {
        toast.error("Failed to extract a Profile from that file.");
        setStep("choose");
      }
    }
  };

  const handleConfirmImport = () => {
    if (!reviewProfile) return;
    onImport(reviewProfile);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm">
            <PlusIcon />
            New Profile
          </Button>
        }
      />
      <DialogContent className={cn(step === "reviewing" && styles.wideContent)}>
        {step === "choose" && (
          <>
            <DialogHeader>
              <DialogTitle>Create a new Profile</DialogTitle>
              <DialogDescription>
                Start from scratch, duplicate an existing Profile, or upload a
                resume to extract a starting point.
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

              <Button
                type="button"
                variant="outline"
                className={styles.startBlank}
                onClick={handleUploadClick}
              >
                <UploadIcon />
                Upload a resume
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className={styles.hiddenInput}
                onChange={handleFileSelected}
              />

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
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "uploading" && (
          <>
            <DialogHeader>
              <DialogTitle>Extracting your resume…</DialogTitle>
            </DialogHeader>
            <p className={styles.uploading}>This will just take a moment.</p>
          </>
        )}

        {step === "reviewing" && reviewProfile && (
          <>
            <DialogHeader>
              <DialogTitle>Review the extracted Profile</DialogTitle>
              <DialogDescription>
                Check what was extracted before saving it as a new Profile —
                nothing is saved yet.
              </DialogDescription>
            </DialogHeader>

            <div className={styles.reviewBody}>
              <ProfileHeaderForm
                header={reviewProfile.header}
                saveStatus="idle"
                dispatch={reviewDispatch}
              />
              <SectionList
                sections={reviewProfile.sections}
                accentColor={reviewProfile.header.secondaryColor}
                dispatch={reviewDispatch}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={reset}>
                Discard
              </Button>
              <Button type="button" onClick={handleConfirmImport}>
                Save this Profile
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
