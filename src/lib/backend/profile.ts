"use server";

import { getEnvVar } from "@/lib/utils";

import {
  fetchBackendBlob,
  fetchBackendData,
  getBackendAuthToken,
  postBackendData,
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
  // A data URL, or undefined/null for the no-picture export layout.
  picture?: string | null;
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

export type SuggestionTarget =
  | { kind: "header"; header: ProfileHeader }
  | { kind: "section"; section: ProfileSection };

export const fetchProfiles = async (): Promise<Profile[] | null> => {
  return fetchBackendData<Profile[]>("/profile/");
};

export const saveProfile = async (profile: Profile): Promise<boolean> => {
  return saveBackendData(`/profile/${profile.id}`, profile);
};

export const fetchProfileSuggestion = async (
  target: SuggestionTarget,
): Promise<SuggestionTarget | null> => {
  return postBackendData<SuggestionTarget, SuggestionTarget>(
    "/profile/suggest",
    target,
  );
};

// Called server-side only (from the /api/profile/export route handler), not
// invoked directly as a Server Action — a raw binary Blob isn't a value the
// Server Actions RSC boundary can serialize back to the client.
export const exportProfileDocx = async (
  profile: Profile,
): Promise<BackendBlob | null> => {
  return fetchBackendBlob("/profile/export", profile);
};

// Called server-side only (from the /api/profile/extract route handler),
// not invoked directly as a Server Action — a File isn't a value the Server
// Actions RSC boundary reliably round-trips. Uses native fetch rather than
// this module's other, axios-based helpers: axios's Node FormData/File
// handling is less certain for a multipart upload than native fetch's.
//
// Throws (rather than returning null) if the Clerk token can't be
// retrieved, so the route handler can tell "not authenticated" apart from
// "reached the backend, but it failed" — the latter alone returns null.
export const extractProfile = async (
  formData: FormData,
): Promise<Profile | null> => {
  const token = await getBackendAuthToken();

  try {
    const response = await fetch(
      `${getEnvVar("BACKEND_URL")}/profile/extract`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      },
    );

    if (!response.ok) return null;

    return (await response.json()) as Profile;
  } catch (error) {
    console.error("Failed to extract Profile from upload", error);
    return null;
  }
};
