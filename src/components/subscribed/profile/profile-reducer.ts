import type { Profile, ProfileHeader } from "@/lib/backend/profile";

export type ProfileAction = {
  type: "UPDATE_HEADER";
  header: ProfileHeader;
};

export const profileReducer = (
  state: Profile,
  action: ProfileAction,
): Profile => {
  switch (action.type) {
    case "UPDATE_HEADER":
      return { ...state, header: action.header };
    default:
      return state;
  }
};
