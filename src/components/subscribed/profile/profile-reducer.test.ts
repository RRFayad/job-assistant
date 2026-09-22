import { describe, expect, it } from "vitest";

import type { Profile } from "@/lib/backend/profile";

import { profileReducer } from "./profile-reducer";

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

describe("profileReducer", () => {
  it("UPDATE_HEADER replaces the header", () => {
    const nextHeader = { ...profile.header, fullName: "New Name" };

    const result = profileReducer(profile, {
      type: "UPDATE_HEADER",
      header: nextHeader,
    });

    expect(result.header).toEqual(nextHeader);
  });

  it("UPDATE_HEADER leaves the rest of the Profile untouched", () => {
    const nextHeader = { ...profile.header, fullName: "New Name" };

    const result = profileReducer(profile, {
      type: "UPDATE_HEADER",
      header: nextHeader,
    });

    expect(result.id).toBe(profile.id);
    expect(result.name).toBe(profile.name);
    expect(result.sections).toBe(profile.sections);
  });

  it("does not mutate the previous state", () => {
    const nextHeader = { ...profile.header, fullName: "New Name" };

    profileReducer(profile, { type: "UPDATE_HEADER", header: nextHeader });

    expect(profile.header.fullName).toBe("Jane Doe");
  });
});
