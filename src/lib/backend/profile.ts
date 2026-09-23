"use server";

import {
  fetchBackendBlob,
  fetchBackendData,
  saveBackendData,
  type BackendBlob,
} from "./client";

export type ProfileLink = {
  id: string;
  label: string;
  url: string;
};

export type ProfileHeader = {
  fullName: string;
  careerTitle: string;
  email: string;
  phone: string;
  location: string;
  links: ProfileLink[];
  primaryColor: string;
  secondaryColor: string;
};

export type TextSection = {
  id: string;
  type: "text";
  title: string;
  body: string;
};

export type TagsSection = {
  id: string;
  type: "tags";
  title: string;
  categories: { id: string; label: string; items: string[] }[];
};

export type EntriesSection = {
  id: string;
  type: "entries";
  title: string;
  entries: { id: string; heading: string; dates: string; body: string }[];
};

export type ListSection = {
  id: string;
  type: "list";
  title: string;
  items: string[];
};

export type PairsSection = {
  id: string;
  type: "pairs";
  title: string;
  pairs: { id: string; left: string; right: string }[];
};

export type ProfileSection =
  TextSection | TagsSection | EntriesSection | ListSection | PairsSection;

export type Profile = {
  id: string;
  name: string;
  header: ProfileHeader;
  sections: ProfileSection[];
};

export const fetchProfiles = async (): Promise<Profile[] | null> => {
  return fetchBackendData<Profile[]>("/profile/");
};

export const saveProfile = async (profile: Profile): Promise<boolean> => {
  return saveBackendData(`/profile/${profile.id}`, profile);
};

// Called server-side only (from the /api/profile/export route handler), not
// invoked directly as a Server Action — a raw binary Blob isn't a value the
// Server Actions RSC boundary can serialize back to the client.
export const exportProfileDocx = async (
  profile: Profile,
): Promise<BackendBlob | null> => {
  return fetchBackendBlob("/profile/export", profile);
};
