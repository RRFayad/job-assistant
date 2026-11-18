"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { saveProfile } from "@/lib/backend/profile";
import type { Profile } from "@/types/profile";

const SAVE_DELAY_MS = 2000;

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export const useAutosaveProfile = (profile: Profile): SaveStatus => {
  const [status, setStatus] = useState<SaveStatus>("idle");
  // Starts equal to the initial profile, so the very first effect run is a
  // no-op — including under Strict Mode's dev-only double-invoke, since
  // that replays the same (unchanged) profile rather than a real edit.
  const previousProfile = useRef(profile);
  const isMounted = useRef(true);
  const latestRequestId = useRef(0);
  // An edit still waiting out its debounce window. Cleared once the timeout
  // fires, or once a flush (see below) sends it early.
  const pendingProfile = useRef<Profile | null>(null);

  const runSave = (profileToSave: Profile) => {
    const requestId = ++latestRequestId.current;
    setStatus("saving");
    saveProfile(profileToSave).then((ok) => {
      if (!isMounted.current || requestId !== latestRequestId.current) {
        return;
      }
      setStatus(ok ? "saved" : "error");
      if (!ok) {
        toast.error("Failed to save your Profile.");
      }
    });
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (previousProfile.current === profile) {
      return;
    }
    previousProfile.current = profile;
    pendingProfile.current = profile;

    const timeout = setTimeout(() => {
      pendingProfile.current = null;
      runSave(profile);
    }, SAVE_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [profile]);

  // Empty deps: this cleanup only ever runs on true unmount, never on a
  // dependency-triggered re-run of the effect above. Switching Profiles
  // remounts (and thus unmounts) this hook via key={profile.id} — without
  // this, an edit still inside its debounce window at that moment would be
  // silently dropped instead of saved.
  useEffect(() => {
    return () => {
      if (pendingProfile.current) {
        runSave(pendingProfile.current);
      }
    };
  }, []);

  return status;
};
