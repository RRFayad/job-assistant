import type { Profile } from "@/types/profile";

import { profileReducer, type ProfileAction } from "./profile-reducer";

export const MAX_PROFILES = 3;

export type ProfilesState = {
  profiles: Profile[];
  selectedId: string;
};

export type MultiProfileAction =
  | { type: "CREATE_BLANK" }
  | { type: "DUPLICATE"; profileId: string }
  | { type: "IMPORT_PROFILE"; profile: Profile }
  | { type: "DELETE"; profileId: string }
  | { type: "SELECT"; profileId: string }
  | { type: "RENAME_PROFILE"; profileId: string; name: string };

export type ProfilesAction = ProfileAction | MultiProfileAction;

// Shared with the pre-dispatch checks in ProfileWorkspace (which show the
// toast) so the actual business rule lives in exactly one place.
export const canCreateProfile = (state: ProfilesState): boolean =>
  state.profiles.length < MAX_PROFILES;

export const canDeleteProfile = (state: ProfilesState): boolean =>
  state.profiles.length > 1;

const uniqueName = (base: string, existingNames: string[]): string => {
  if (!existingNames.includes(base)) return base;

  let suffix = 2;
  while (existingNames.includes(`${base} ${suffix}`)) {
    suffix += 1;
  }
  return `${base} ${suffix}`;
};

const createBlankProfile = (existingNames: string[]): Profile => ({
  id: crypto.randomUUID(),
  name: uniqueName("New Profile", existingNames),
  header: {
    fullName: "",
    careerTitle: "",
    email: "",
    phone: "",
    location: "",
    links: [],
    primaryColor: "#000000",
    secondaryColor: "#000000",
  },
  sections: [],
});

export const profilesReducer = (
  state: ProfilesState,
  action: ProfilesAction,
): ProfilesState => {
  switch (action.type) {
    case "CREATE_BLANK": {
      if (!canCreateProfile(state)) return state;

      const created = createBlankProfile(state.profiles.map((p) => p.name));
      return {
        profiles: [...state.profiles, created],
        selectedId: created.id,
      };
    }

    case "DUPLICATE": {
      if (!canCreateProfile(state)) return state;

      const source = state.profiles.find((p) => p.id === action.profileId);
      if (!source) return state;

      const existingNames = state.profiles.map((p) => p.name);
      const duplicate: Profile = {
        ...structuredClone(source),
        id: crypto.randomUUID(),
        name: uniqueName(`${source.name} copy`, existingNames),
      };
      return {
        profiles: [...state.profiles, duplicate],
        selectedId: duplicate.id,
      };
    }

    case "IMPORT_PROFILE": {
      if (!canCreateProfile(state)) return state;

      const existingNames = state.profiles.map((p) => p.name);
      const imported: Profile = {
        ...structuredClone(action.profile),
        id: crypto.randomUUID(),
        name: uniqueName(action.profile.name, existingNames),
      };
      return {
        profiles: [...state.profiles, imported],
        selectedId: imported.id,
      };
    }

    case "DELETE": {
      if (!canDeleteProfile(state)) return state;

      const profiles = state.profiles.filter((p) => p.id !== action.profileId);
      const selectedId =
        state.selectedId === action.profileId
          ? profiles[0].id
          : state.selectedId;
      return { profiles, selectedId };
    }

    case "SELECT":
      if (action.profileId === state.selectedId) return state;
      return { ...state, selectedId: action.profileId };

    case "RENAME_PROFILE": {
      const profiles = state.profiles.map((profile) =>
        profile.id === action.profileId
          ? { ...profile, name: action.name }
          : profile,
      );
      return { ...state, profiles };
    }

    default: {
      let changed = false;
      const profiles = state.profiles.map((profile) => {
        if (profile.id !== state.selectedId) return profile;
        const next = profileReducer(profile, action);
        if (next !== profile) changed = true;
        return next;
      });
      return changed ? { ...state, profiles } : state;
    }
  }
};
