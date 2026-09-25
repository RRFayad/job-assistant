"use server";

import { getEnvVar } from "@/lib/utils";
import type { Profile, SuggestionTarget } from "@/types/profile";

import {
  fetchBackendBlob,
  fetchBackendData,
  getBackendAuthToken,
  postBackendData,
  saveBackendData,
  type BackendBlob,
} from "./client";

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
