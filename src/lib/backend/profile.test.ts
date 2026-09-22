import { describe, expect, it, vi } from "vitest";

import { fetchBackendData, saveBackendData } from "./client";
import { fetchProfiles, saveProfile, type Profile } from "./profile";

vi.mock("./client", () => ({
  fetchBackendData: vi.fn(),
  saveBackendData: vi.fn(),
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

describe("fetchProfiles", () => {
  it("requests the /profile/ endpoint and returns its data", async () => {
    vi.mocked(fetchBackendData).mockResolvedValue([profile]);

    const result = await fetchProfiles();

    expect(fetchBackendData).toHaveBeenCalledWith("/profile/");
    expect(result).toEqual([profile]);
  });

  it("returns null when the backend call fails", async () => {
    vi.mocked(fetchBackendData).mockResolvedValue(null);

    const result = await fetchProfiles();

    expect(result).toBeNull();
  });
});

describe("saveProfile", () => {
  it("saves to /profile/{id} and reports success", async () => {
    vi.mocked(saveBackendData).mockResolvedValue(true);

    const result = await saveProfile(profile);

    expect(saveBackendData).toHaveBeenCalledWith("/profile/1", profile);
    expect(result).toBe(true);
  });

  it("reports failure when the backend call fails", async () => {
    vi.mocked(saveBackendData).mockResolvedValue(false);

    const result = await saveProfile(profile);

    expect(result).toBe(false);
  });
});
