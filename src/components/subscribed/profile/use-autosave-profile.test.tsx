import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { saveProfile, type Profile } from "@/lib/backend/profile";

import { useAutosaveProfile } from "./use-autosave-profile";

vi.mock("@/lib/backend/profile", () => ({
  saveProfile: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

const profile: Profile = {
  id: "1",
  name: "AI Engineer",
  header: {
    fullName: "Jane Doe",
    careerTitle: "AI Engineer",
    email: "jane@example.com",
    phone: "555-0100",
    location: "Remote",
    links: [],
    primaryColor: "#2563eb",
    secondaryColor: "#7c3aed",
  },
  sections: [],
};

describe("useAutosaveProfile", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("does not save on initial mount", async () => {
    vi.mocked(saveProfile).mockResolvedValue(true);

    renderHook(() => useAutosaveProfile(profile));
    await vi.advanceTimersByTimeAsync(3000);

    expect(saveProfile).not.toHaveBeenCalled();
  });

  it("does not save on initial mount under Strict Mode's double-invoke", async () => {
    vi.mocked(saveProfile).mockResolvedValue(true);

    renderHook(() => useAutosaveProfile(profile), {
      wrapper: StrictMode,
    });
    await vi.advanceTimersByTimeAsync(3000);

    expect(saveProfile).not.toHaveBeenCalled();
  });

  it("saves after the profile changes and the debounce elapses", async () => {
    vi.mocked(saveProfile).mockResolvedValue(true);
    const { result, rerender } = renderHook(
      ({ profile }) => useAutosaveProfile(profile),
      { initialProps: { profile } },
    );

    const updated = {
      ...profile,
      header: { ...profile.header, fullName: "Updated" },
    };
    rerender({ profile: updated });

    expect(result.current).toBe("idle");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(saveProfile).toHaveBeenCalledWith(updated);
    expect(result.current).toBe("saved");
  });

  it("does not save again before the debounce elapses", async () => {
    vi.mocked(saveProfile).mockResolvedValue(true);
    const { rerender } = renderHook(
      ({ profile }) => useAutosaveProfile(profile),
      { initialProps: { profile } },
    );

    rerender({
      profile: { ...profile, header: { ...profile.header, fullName: "A" } },
    });
    await vi.advanceTimersByTimeAsync(1000);
    rerender({
      profile: { ...profile, header: { ...profile.header, fullName: "AB" } },
    });
    await vi.advanceTimersByTimeAsync(1000);

    expect(saveProfile).not.toHaveBeenCalled();
  });

  it("shows an error toast and reports error status when saving fails", async () => {
    vi.mocked(saveProfile).mockResolvedValue(false);
    const { result, rerender } = renderHook(
      ({ profile }) => useAutosaveProfile(profile),
      { initialProps: { profile } },
    );

    rerender({
      profile: {
        ...profile,
        header: { ...profile.header, fullName: "Updated" },
      },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(result.current).toBe("error");
    expect(toast.error).toHaveBeenCalled();
  });

  it("ignores a stale response from an earlier save that resolves after a newer one", async () => {
    let resolveFirst!: (ok: boolean) => void;
    let resolveSecond!: (ok: boolean) => void;

    vi.mocked(saveProfile)
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveFirst = resolve)),
      )
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveSecond = resolve)),
      );

    const { result, rerender } = renderHook(
      ({ profile }) => useAutosaveProfile(profile),
      { initialProps: { profile } },
    );

    rerender({
      profile: { ...profile, header: { ...profile.header, fullName: "A" } },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    rerender({
      profile: { ...profile, header: { ...profile.header, fullName: "AB" } },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(saveProfile).toHaveBeenCalledTimes(2);

    // The newer save resolves first.
    await act(async () => {
      resolveSecond(true);
    });
    expect(result.current).toBe("saved");

    // The older save resolves after it, with a failure — must be ignored.
    await act(async () => {
      resolveFirst(false);
    });
    expect(result.current).toBe("saved");
    expect(toast.error).not.toHaveBeenCalled();
  });
});
