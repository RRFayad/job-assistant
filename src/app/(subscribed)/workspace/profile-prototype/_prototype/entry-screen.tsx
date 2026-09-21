// PROTOTYPE ONLY — the entry screen for creating a Profile: shown on true
// cold-start (no Profiles yet) and reused whenever "+ New Profile" is
// clicked from the switcher. Upload / Start blank are always available;
// Duplicate an existing Profile only shows once at least one exists.

import {
  ArrowLeftIcon,
  CopyIcon,
  PencilLineIcon,
  UploadIcon,
} from "lucide-react";

import { PageHeader } from "@/components/subscribed/page-header";
import { tw } from "@/lib/utils";

import type { Profile } from "./mock-data";

type ProfileEntryScreenProps = {
  existingProfiles: Profile[];
  onUpload: () => void;
  onStartBlank: () => void;
  onDuplicate: (sourceId: string) => void;
  onCancel?: () => void;
};

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
};

export const ProfileEntryScreen = ({
  existingProfiles,
  onUpload,
  onStartBlank,
  onDuplicate,
  onCancel,
}: ProfileEntryScreenProps) => {
  return (
    <div className={styles.page}>
      {onCancel && (
        <button className={styles.backLink} onClick={onCancel} type="button">
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

      <div className="space-y-3">
        {existingProfiles.length > 0 && (
          <p className={styles.sectionLabel}>Start fresh</p>
        )}
        <div className={styles.grid}>
          <button className={styles.option} onClick={onUpload} type="button">
            <span className={styles.optionIcon}>
              <UploadIcon className="size-4" />
            </span>
            <span className={styles.optionTitle}>Upload your resume</span>
            <span className={styles.optionHint}>
              We&apos;ll extract your experience, education, and skills — you
              review before anything is saved.
            </span>
          </button>

          <button
            className={styles.option}
            onClick={onStartBlank}
            type="button"
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
        <div className="space-y-3">
          <p className={styles.sectionLabel}>
            Or duplicate an existing Profile
          </p>
          <div className={styles.grid}>
            {existingProfiles.map((profile) => (
              <button
                className={styles.option}
                key={profile.id}
                onClick={() => onDuplicate(profile.id)}
                type="button"
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
