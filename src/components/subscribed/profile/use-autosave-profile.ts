"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { saveProfile, type Profile } from "@/lib/backend/profile";

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

    const timeout = setTimeout(() => {
      const requestId = ++latestRequestId.current;
      setStatus("saving");
      saveProfile(profile).then((ok) => {
        if (!isMounted.current || requestId !== latestRequestId.current) {
          return;
        }
        setStatus(ok ? "saved" : "error");
        if (!ok) {
          toast.error("Failed to save your Profile.");
        }
      });
    }, SAVE_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [profile]);

  return status;
};
