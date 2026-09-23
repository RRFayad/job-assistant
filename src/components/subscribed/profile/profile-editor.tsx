"use client";

import { CheckIcon, Loader2Icon } from "lucide-react";
import type { Dispatch } from "react";

import { PageHeader } from "@/components/subscribed/page-header";
import type { Profile } from "@/lib/backend/profile";
import { cn, tw } from "@/lib/utils";

import { ExportProfileButton } from "./export-profile-button";
import { ProfileHeaderForm } from "./profile-header-form";
import { ProfileSwitcher } from "./profile-switcher";
import type { ProfilesAction } from "./profiles-reducer";
import { SectionList } from "./section-list";
import { useAutosaveProfile } from "./use-autosave-profile";

type ProfileEditorProps = {
  profile: Profile;
  profiles: Profile[];
  dispatch: Dispatch<ProfilesAction>;
  onSelect: (profileId: string) => void;
  onDelete: (profileId: string) => void;
  onRequestNew: () => void;
};

const styles = {
  wrapper: tw("space-y-6"),
  headerActions: tw("flex items-center gap-3"),
  saveStatus: tw("flex items-center gap-1.5 text-xs text-muted-foreground"),
  saveStatusDone: tw("text-emerald-600 dark:text-emerald-400"),
};

// Keyed by profile.id in ProfileWorkspace, so switching Profiles remounts
// this component (and its useAutosaveProfile instance) fresh — see
// use-autosave-profile.ts's own comments for why that reset matters.
// PageHeader/ProfileSwitcher live inside this remount boundary (matching the
// prototype's edit-view.tsx structure) rather than being lifted to a parent,
// so saveStatus never needs to cross a component boundary via an effect.
export const ProfileEditor = ({
  profile,
  profiles,
  dispatch,
  onSelect,
  onDelete,
  onRequestNew,
}: ProfileEditorProps) => {
  const saveStatus = useAutosaveProfile(profile);

  return (
    <div className={styles.wrapper}>
      <PageHeader
        title="Your Profile"
        description="Up to three independent Profiles — switch below, or create a new one."
        action={
          <div className={styles.headerActions}>
            <span className={styles.saveStatus}>
              {saveStatus === "saving" && (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Saving…
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <CheckIcon
                    className={cn("size-3.5", styles.saveStatusDone)}
                  />
                  All changes saved
                </>
              )}
            </span>
            <ExportProfileButton profile={profile} />
          </div>
        }
      />
      <ProfileSwitcher
        profiles={profiles}
        selectedId={profile.id}
        onSelect={onSelect}
        onDelete={onDelete}
        onRequestNew={onRequestNew}
      />
      <ProfileHeaderForm header={profile.header} dispatch={dispatch} />
      <SectionList
        sections={profile.sections}
        accentColor={profile.header.secondaryColor}
        dispatch={dispatch}
      />
    </div>
  );
};
