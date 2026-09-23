"use client";

import {
  ArrowLeftIcon,
  CopyIcon,
  PencilLineIcon,
  UploadIcon,
} from "lucide-react";
import { useRef, useState, type ChangeEvent, type Dispatch } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/subscribed/page-header";
import type { Profile } from "@/lib/backend/profile";
import { tw } from "@/lib/utils";

import { ProfileHeaderForm } from "./profile-header-form";
import type { ProfileAction } from "./profile-reducer";
import { profileReducer } from "./profile-reducer";
import { SectionList } from "./section-list";

type ProfileEntryScreenProps = {
  existingProfiles: Profile[];
  onStartBlank: () => void;
  onDuplicate: (sourceId: string) => void;
  onImport: (profile: Profile) => void;
  onCancel?: () => void;
};

type Step = "choose" | "uploading" | "reviewing";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

const styles = {
  page: tw("mx-auto w-full max-w-4xl space-y-6"),
  backLink: tw(
    "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground",
  ),
  grid: tw("grid gap-4 sm:grid-cols-2"),
  option: tw(
    "flex flex-col items-start gap-3 rounded-xl border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/60 hover:bg-muted/40",
  ),
  optionIcon: tw(
    "flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary",
  ),
  optionTitle: tw("text-sm font-semibold"),
  optionHint: tw("text-sm text-muted-foreground"),
  sectionLabel: tw(
    "text-xs font-semibold tracking-wide text-muted-foreground uppercase",
  ),
  hiddenInput: tw("hidden"),
  uploading: tw("py-8 text-center text-sm text-muted-foreground"),
  reviewNav: tw("flex items-center justify-between"),
  optionGroup: tw("space-y-3"),
};

export const ProfileEntryScreen = ({
  existingProfiles,
  onStartBlank,
  onDuplicate,
  onImport,
  onCancel,
}: ProfileEntryScreenProps) => {
  const [step, setStep] = useState<Step>("choose");
  const [reviewProfile, setReviewProfile] = useState<Profile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadToken = useRef(0);

  const reviewDispatch: Dispatch<ProfileAction> = (action) => {
    setReviewProfile((prev) => (prev ? profileReducer(prev, action) : prev));
  };

  const reset = () => {
    uploadToken.current += 1;
    setStep("choose");
    setReviewProfile(null);
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

      if (thisUpload !== uploadToken.current) return;

      if (!response.ok) {
        toast.error("Failed to extract a Profile from that file.");
        setStep("choose");
        return;
      }

      const extracted: Profile = await response.json();
      if (thisUpload !== uploadToken.current) return;

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
  };

  if (step === "uploading") {
    return (
      <div className={styles.page}>
        <PageHeader title="Extracting your resume…" />
        <p className={styles.uploading}>This will just take a moment.</p>
        <Button type="button" variant="ghost" onClick={reset}>
          <ArrowLeftIcon />
          Cancel
        </Button>
      </div>
    );
  }

  if (step === "reviewing" && reviewProfile) {
    return (
      <div className={styles.page}>
        <PageHeader
          title="Review the extracted Profile"
          description="Check what was extracted before saving it as a new Profile — nothing is saved yet."
        />
        <ProfileHeaderForm
          header={reviewProfile.header}
          dispatch={reviewDispatch}
        />
        <SectionList
          sections={reviewProfile.sections}
          accentColor={reviewProfile.header.secondaryColor}
          dispatch={reviewDispatch}
        />
        <div className={styles.reviewNav}>
          <Button type="button" variant="ghost" onClick={reset}>
            <ArrowLeftIcon />
            Discard
          </Button>
          <Button type="button" onClick={handleConfirmImport}>
            Save this Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {onCancel && (
        <button type="button" className={styles.backLink} onClick={onCancel}>
          <ArrowLeftIcon className="size-3.5" />
          Back to your Profiles
        </button>
      )}

      <PageHeader
        title={
          existingProfiles.length > 0
            ? "Create a new Profile"
            : "Build your Profile"
        }
        description="This is what every tailored resume and cover letter will be grounded in. Choose how you'd like to start."
      />

      <div className={styles.optionGroup}>
        {existingProfiles.length > 0 && (
          <p className={styles.sectionLabel}>Start fresh</p>
        )}
        <div className={styles.grid}>
          <button
            type="button"
            className={styles.option}
            onClick={handleUploadClick}
          >
            <span className={styles.optionIcon}>
              <UploadIcon className="size-4" />
            </span>
            <span className={styles.optionTitle}>Upload your resume</span>
            <span className={styles.optionHint}>
              We&apos;ll extract your experience, education, and skills — you
              review before anything is saved.
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className={styles.hiddenInput}
            onChange={handleFileSelected}
          />

          <button
            type="button"
            className={styles.option}
            onClick={onStartBlank}
          >
            <span className={styles.optionIcon}>
              <PencilLineIcon className="size-4" />
            </span>
            <span className={styles.optionTitle}>
              Start from a blank template
            </span>
            <span className={styles.optionHint}>
              Fill in the sections yourself — Ask AI is available on any section
              once you&apos;re in.
            </span>
          </button>
        </div>
      </div>

      {existingProfiles.length > 0 && (
        <div className={styles.optionGroup}>
          <p className={styles.sectionLabel}>
            Or duplicate an existing Profile
          </p>
          <div className={styles.grid}>
            {existingProfiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                className={styles.option}
                onClick={() => onDuplicate(profile.id)}
              >
                <span className={styles.optionIcon}>
                  <CopyIcon className="size-4" />
                </span>
                <span className={styles.optionTitle}>{profile.name}</span>
                <span className={styles.optionHint}>
                  Starts as a full copy — the two won&apos;t stay in sync
                  afterward.
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
