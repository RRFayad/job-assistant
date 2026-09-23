"use client";

import { useReducer } from "react";
import { toast } from "sonner";

import type { Profile } from "@/lib/backend/profile";
import { tw } from "@/lib/utils";

import { ProfileEditor } from "./profile-editor";
import { ProfileSwitcher } from "./profile-switcher";
import {
  canCreateProfile,
  canDeleteProfile,
  MAX_PROFILES,
  profilesReducer,
  type ProfilesState,
} from "./profiles-reducer";

type ProfileWorkspaceProps = {
  profiles: Profile[];
};

const styles = {
  wrapper: tw("space-y-8"),
};

const CAP_MESSAGE = `You can only have up to ${MAX_PROFILES} Profiles — delete one first.`;

export const ProfileWorkspace = ({ profiles }: ProfileWorkspaceProps) => {
  const [state, dispatch] = useReducer(
    profilesReducer,
    profiles,
    (initialProfiles): ProfilesState => ({
      profiles: initialProfiles,
      selectedId: initialProfiles[0].id,
    }),
  );

  const handleCreateBlank = () => {
    if (!canCreateProfile(state)) {
      toast.error(CAP_MESSAGE);
      return;
    }
    dispatch({ type: "CREATE_BLANK" });
  };

  const handleDuplicate = (profileId: string) => {
    if (!canCreateProfile(state)) {
      toast.error(CAP_MESSAGE);
      return;
    }
    dispatch({ type: "DUPLICATE", profileId });
  };

  const handleDelete = (profileId: string) => {
    if (!canDeleteProfile(state)) {
      toast.error("You can't delete your last remaining Profile.");
      return;
    }
    dispatch({ type: "DELETE", profileId });
  };

  const selectedProfile = state.profiles.find(
    (profile) => profile.id === state.selectedId,
  );

  if (!selectedProfile) return null;

  return (
    <div className={styles.wrapper}>
      <ProfileSwitcher
        profiles={state.profiles}
        selectedId={state.selectedId}
        onSelect={(profileId) => dispatch({ type: "SELECT", profileId })}
        onDelete={handleDelete}
        onCreateBlank={handleCreateBlank}
        onDuplicate={handleDuplicate}
      />
      <ProfileEditor
        key={selectedProfile.id}
        profile={selectedProfile}
        dispatch={dispatch}
      />
    </div>
  );
};
