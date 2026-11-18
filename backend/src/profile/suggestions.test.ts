import type {
  EntriesSection,
  ListSection,
  PairsSection,
  ProfileHeader,
  TagsSection,
  TextSection,
} from "@app/shared/schemas";
import { describe, expect, it } from "vitest";

import { suggest } from "./suggestions";

const header = (overrides: Partial<ProfileHeader> = {}): ProfileHeader => ({
  fullName: "Jane Doe",
  careerTitle: "AI Engineer",
  email: "jane@example.com",
  phone: "",
  location: "",
  links: [],
  primaryColor: "#000000",
  secondaryColor: "#000000",
  ...overrides,
});

describe("suggest", () => {
  it("suggests a header change without mutating the input", () => {
    const original = header();

    const result = suggest({ kind: "header", header: original });

    expect(result.kind).toBe("header");
    if (result.kind !== "header") throw new Error("unreachable");
    expect(result.header.careerTitle).not.toBe(original.careerTitle);
    expect(result.header.careerTitle.startsWith("AI Engineer")).toBe(true);
    expect(result.header).not.toBe(original);
    expect(original.careerTitle).toBe("AI Engineer"); // original untouched
  });

  it("suggests appending to a text section body", () => {
    const section: TextSection = {
      id: "s1",
      type: "text",
      title: "Summary",
      body: "Original.",
    };

    const result = suggest({ kind: "section", section });

    expect(result.kind).toBe("section");
    if (result.kind !== "section" || result.section.type !== "text") {
      throw new Error("unreachable");
    }
    expect(result.section.body.startsWith("Original.")).toBe(true);
    expect(result.section.body).not.toBe(section.body);
    expect(section.body).toBe("Original."); // original untouched
  });

  it("suggests appending to the last entry of an entries section", () => {
    const section: EntriesSection = {
      id: "s1",
      type: "entries",
      title: "Experience",
      entries: [
        {
          id: "e1",
          heading: "Old role",
          dates: "2019",
          body: "Did old things.",
        },
        {
          id: "e2",
          heading: "New role",
          dates: "2023",
          body: "Did new things.",
        },
      ],
    };

    const result = suggest({ kind: "section", section });
    if (result.kind !== "section" || result.section.type !== "entries") {
      throw new Error("unreachable");
    }

    expect(result.section.entries[0]?.body).toBe("Did old things.");
    expect(result.section.entries[1]?.body).not.toBe("Did new things.");
    expect(result.section.entries[1]?.body.startsWith("Did new things.")).toBe(
      true,
    );
  });

  it("leaves an entries section with no entries unchanged", () => {
    const section: EntriesSection = {
      id: "s1",
      type: "entries",
      title: "Experience",
      entries: [],
    };

    const result = suggest({ kind: "section", section });
    if (result.kind !== "section" || result.section.type !== "entries") {
      throw new Error("unreachable");
    }

    expect(result.section.entries).toEqual([]);
  });

  it("suggests a new list item", () => {
    const section: ListSection = {
      id: "s1",
      type: "list",
      title: "Projects",
      items: ["A"],
    };

    const result = suggest({ kind: "section", section });
    if (result.kind !== "section" || result.section.type !== "list") {
      throw new Error("unreachable");
    }

    expect(result.section.items).toEqual(["A", "AI-suggested addition"]);
  });

  it("suggests a new tag in the first category", () => {
    const section: TagsSection = {
      id: "s1",
      type: "tags",
      title: "Skills",
      categories: [{ id: "c1", label: "Languages", items: ["Python"] }],
    };

    const result = suggest({ kind: "section", section });
    if (result.kind !== "section" || result.section.type !== "tags") {
      throw new Error("unreachable");
    }

    expect(result.section.categories[0]?.items).toEqual([
      "Python",
      "AI-suggested skill",
    ]);
  });

  it("leaves a tags section with no categories unchanged", () => {
    const section: TagsSection = {
      id: "s1",
      type: "tags",
      title: "Skills",
      categories: [],
    };

    const result = suggest({ kind: "section", section });
    if (result.kind !== "section" || result.section.type !== "tags") {
      throw new Error("unreachable");
    }

    expect(result.section.categories).toEqual([]);
  });

  it("suggests a new pair", () => {
    const section: PairsSection = {
      id: "s1",
      type: "pairs",
      title: "Languages",
      pairs: [{ id: "p1", left: "English", right: "Fluent" }],
    };

    const result = suggest({ kind: "section", section });
    if (result.kind !== "section" || result.section.type !== "pairs") {
      throw new Error("unreachable");
    }

    expect(result.section.pairs).toHaveLength(2);
    expect(result.section.pairs[0]).toEqual(section.pairs[0]);
    expect(result.section.pairs[1]?.left).toBe("AI Suggested");
  });
});
