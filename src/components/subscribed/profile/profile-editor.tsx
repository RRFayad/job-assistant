"use client";

import { useReducer } from "react";

import type { Profile } from "@/lib/backend/profile";
import { tw } from "@/lib/utils";

import { ProfileHeaderForm } from "./profile-header-form";
import { profileReducer } from "./profile-reducer";
import { SectionList } from "./section-list";
import { useAutosaveProfile } from "./use-autosave-profile";

type ProfileEditorProps = {
  profile: Profile;
};

const styles = {
  wrapper: tw("space-y-8"),
};

export const ProfileEditor = ({
  profile: initialProfile,
}: ProfileEditorProps) => {
  const [profile, dispatch] = useReducer(profileReducer, initialProfile);
  const saveStatus = useAutosaveProfile(profile);

  return (
    <div className={styles.wrapper}>
      <ProfileHeaderForm
        header={profile.header}
        saveStatus={saveStatus}
        dispatch={dispatch}
      />
      <SectionList
        sections={profile.sections}
        accentColor={profile.header.secondaryColor}
        dispatch={dispatch}
      />
    </div>
  );
};
