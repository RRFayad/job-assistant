"use client";

import { useReducer, useState } from "react";
import { toast } from "sonner";

import type { Profile } from "@/lib/backend/profile";

import { ProfileEditor } from "./profile-editor";
import { ProfileEntryScreen } from "./profile-entry-screen";
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

type ViewMode = "editing" | "creating";

const CAP_MESSAGE = `You can only have up to ${MAX_PROFILES} Profiles — delete one first.`;

export const ProfileWorkspace = ({ profiles }: ProfileWorkspaceProps) => {
  const [state, dispatch] = useReducer(
    profilesReducer,
    profiles,
    (initialProfiles): ProfilesState => ({
      profiles: initialProfiles,
      selectedId: initialProfiles[0]?.id ?? "",
    }),
  );
  // Brand-new users start with 0 Profiles — go straight to the entry screen
  // rather than a dead-end "editing" view with no Profile to render.
  const [viewMode, setViewMode] = useState<ViewMode>(
    profiles.length === 0 ? "creating" : "editing",
  );

  const handleStartBlank = () => {
    if (!canCreateProfile(state)) {
      toast.error(CAP_MESSAGE);
      return;
    }
    dispatch({ type: "CREATE_BLANK" });
    setViewMode("editing");
  };

  const handleDuplicate = (profileId: string) => {
    if (!canCreateProfile(state)) {
      toast.error(CAP_MESSAGE);
      return;
    }
    dispatch({ type: "DUPLICATE", profileId });
    setViewMode("editing");
  };

  const handleImport = (profile: Profile) => {
    if (!canCreateProfile(state)) {
      toast.error(CAP_MESSAGE);
      return;
    }
    dispatch({ type: "IMPORT_PROFILE", profile });
    setViewMode("editing");
  };

  const handleDelete = (profileId: string) => {
    if (!canDeleteProfile(state)) {
      toast.error("You can't delete your last remaining Profile.");
      return;
    }
    dispatch({ type: "DELETE", profileId });
  };

  if (viewMode === "creating") {
    return (
      <ProfileEntryScreen
        existingProfiles={state.profiles}
        onStartBlank={handleStartBlank}
        onDuplicate={handleDuplicate}
        onImport={handleImport}
        onCancel={
          state.profiles.length > 0 ? () => setViewMode("editing") : undefined
        }
      />
    );
  }

  const selectedProfile = state.profiles.find(
    (profile) => profile.id === state.selectedId,
  );

  if (!selectedProfile) return null;

  return (
    <ProfileEditor
      key={selectedProfile.id}
      profile={selectedProfile}
      profiles={state.profiles}
      dispatch={dispatch}
      onSelect={(profileId) => dispatch({ type: "SELECT", profileId })}
      onDelete={handleDelete}
      onRequestNew={() => setViewMode("creating")}
    />
  );
};
