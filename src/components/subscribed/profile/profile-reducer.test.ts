import { describe, expect, it } from "vitest";

import type { Profile, TextSection } from "@/lib/backend/profile";

import { profileReducer } from "./profile-reducer";

const textSection = (id: string, title: string): TextSection => ({
  id,
  type: "text",
  title,
  body: `body ${id}`,
});

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
  sections: [textSection("s1", "One"), textSection("s2", "Two")],
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

  it("ADD_SECTION appends a new Text section with a placeholder title", () => {
    const result = profileReducer(profile, { type: "ADD_SECTION" });

    expect(result.sections).toHaveLength(3);
    const added = result.sections[2];
    expect(added.type).toBe("text");
    expect(added.title.length).toBeGreaterThan(0);
    expect(added.id).not.toBe("s1");
    expect(added.id).not.toBe("s2");
  });

  it("ADD_SECTION gives each new section a unique id", () => {
    const once = profileReducer(profile, { type: "ADD_SECTION" });
    const twice = profileReducer(once, { type: "ADD_SECTION" });

    expect(twice.sections[2].id).not.toBe(twice.sections[3].id);
  });

  it("REMOVE_SECTION removes the matching section", () => {
    const result = profileReducer(profile, {
      type: "REMOVE_SECTION",
      sectionId: "s1",
    });

    expect(result.sections.map((s) => s.id)).toEqual(["s2"]);
  });

  it("RENAME_SECTION updates only the matching section's title", () => {
    const result = profileReducer(profile, {
      type: "RENAME_SECTION",
      sectionId: "s1",
      title: "Renamed",
    });

    expect(result.sections[0].title).toBe("Renamed");
    expect(result.sections[1].title).toBe("Two");
  });

  it("UPDATE_SECTION replaces the matching section by id", () => {
    const nextSection = textSection("s1", "One (edited)");

    const result = profileReducer(profile, {
      type: "UPDATE_SECTION",
      section: nextSection,
    });

    expect(result.sections[0]).toEqual(nextSection);
    expect(result.sections[1]).toBe(profile.sections[1]);
  });

  it("MOVE_SECTION up swaps with the previous section", () => {
    const result = profileReducer(profile, {
      type: "MOVE_SECTION",
      sectionId: "s2",
      direction: "up",
    });

    expect(result.sections.map((s) => s.id)).toEqual(["s2", "s1"]);
  });

  it("MOVE_SECTION down swaps with the next section", () => {
    const result = profileReducer(profile, {
      type: "MOVE_SECTION",
      sectionId: "s1",
      direction: "down",
    });

    expect(result.sections.map((s) => s.id)).toEqual(["s2", "s1"]);
  });

  it("MOVE_SECTION up on the first section is a no-op, preserving the Profile reference", () => {
    const result = profileReducer(profile, {
      type: "MOVE_SECTION",
      sectionId: "s1",
      direction: "up",
    });

    expect(result.sections).toBe(profile.sections);
    expect(result).toBe(profile);
  });

  it("MOVE_SECTION down on the last section is a no-op, preserving the Profile reference", () => {
    const result = profileReducer(profile, {
      type: "MOVE_SECTION",
      sectionId: "s2",
      direction: "down",
    });

    expect(result.sections).toBe(profile.sections);
    expect(result).toBe(profile);
  });
});
