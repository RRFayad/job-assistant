import { describe, expect, it, vi } from "vitest";

import { fetchBackendData } from "./client";
import { fetchProfiles, type Profile } from "./profile";

vi.mock("./client", () => ({
  fetchBackendData: vi.fn(),
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
