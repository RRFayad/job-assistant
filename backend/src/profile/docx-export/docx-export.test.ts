import type { Profile } from "@app/shared/schemas";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { buildExportFilename, buildResumeDocument } from "./docx-export";

// A small solid-color PNG (400x300), inlined rather than read from a fixture
// file — avoids path resolution relative to a cwd that differs between test
// runs and the real server (see profile.controller.ts's DEV_SEED_PATH note).
const TEST_PICTURE_BASE64 =
  "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";

const testPictureDataUrl = `data:image/png;base64,${TEST_PICTURE_BASE64}`;

const fullProfile: Profile = {
  id: "1",
  name: "Draft A",
  header: {
    fullName: "Jane Doe",
    careerTitle: "Senior Frontend Engineer",
    email: "jane@example.com",
    phone: "+1 555-0100",
    location: "Remote",
    links: [
      { id: "l1", label: "LinkedIn", url: "https://linkedin.com/in/janedoe" },
      { id: "l2", label: "Bad Link", url: "javascript:alert(1)" },
    ],
    primaryColor: "#059669",
    secondaryColor: "#d97706",
    picture: testPictureDataUrl,
  },
  sections: [
    {
      id: "s1",
      type: "text",
      title: "Summary",
      body: "A **great** engineer with *strong* ++focus++.\n- Leads teams\n- [Ships fast](https://example.com)",
    },
    {
      id: "s2",
      type: "entries",
      title: "Experience",
      entries: [
        {
          id: "e1",
          heading: "Staff Engineer, Acme",
          dates: "2022 - Present",
          body: "Owned the platform roadmap.",
        },
      ],
    },
    {
      id: "s3",
      type: "list",
      title: "Projects",
      items: ["Built a thing", "Shipped another thing"],
    },
    {
      id: "s4",
      type: "tags",
      title: "Skills",
      categories: [{ id: "c1", label: "Languages", items: ["TS", "Python"] }],
    },
    {
      id: "s5",
      type: "pairs",
      title: "Education",
      pairs: [{ id: "p1", left: "BSc CS", right: "2018" }],
    },
  ],
};

describe("buildResumeDocument", () => {
  it("produces a valid .docx with the Profile's content and no template editor metadata", async () => {
    const buffer = await buildResumeDocument(fullProfile);
    expect(buffer.length).toBeGreaterThan(0);

    const zip = await JSZip.loadAsync(buffer);
    const documentXml = await zip.file("word/document.xml")!.async("string");
    const relsXml = await zip
      .file("word/_rels/document.xml.rels")!
      .async("string");

    // Refilled content made it in.
    for (const text of [
      "Jane Doe",
      "Senior Frontend Engineer",
      "jane@example.com",
      "Remote",
      "Summary",
      "great",
      "strong",
      "focus",
      "Leads teams",
      "Ships fast",
      "Staff Engineer, Acme",
      "2022 - Present",
      "Owned the platform roadmap.",
      "Built a thing",
      "Languages:",
      "TS, Python",
      "BSc CS: 2018",
    ]) {
      expect(documentXml).toContain(text);
    }

    // The unsafe link's label survived as plain text, not a hyperlink.
    expect(documentXml).not.toContain("javascript:alert");

    // Template editor metadata is gone from every cloned snippet.
    expect(documentXml).not.toContain("w:divId");
    expect(documentXml).not.toContain("commentRangeStart");
    expect(documentXml).not.toContain("commentReference");

    // The template's own sample hyperlink/comments relationships are gone,
    // replaced by freshly added ones for this Profile's real links.
    expect(relsXml).not.toContain("yourusername");
    expect(relsXml).not.toContain("comments.xml");
    expect(relsXml).toContain("linkedin.com/in/janedoe");

    // A new image part was embedded for the header picture.
    expect(zip.file("word/media/image1.png")).toBeTruthy();
  });

  it("omits the picture column entirely when no picture is set", async () => {
    const profile: Profile = {
      ...fullProfile,
      header: { ...fullProfile.header, picture: null },
    };
    const buffer = await buildResumeDocument(profile);

    const zip = await JSZip.loadAsync(buffer);
    const relsXml = await zip
      .file("word/_rels/document.xml.rels")!
      .async("string");

    // No new image relationship was added, and the template's own sample
    // one was dropped — word/media/image1.png may still physically exist in
    // the zip (nothing deletes parts, only relationships — see
    // dropOrphanedRelationships), but nothing in the document references it.
    expect(relsXml).not.toContain("relationships/image");
  });
});

describe("buildExportFilename", () => {
  it("builds a recruiter-friendly filename from the name and profile", () => {
    expect(buildExportFilename(fullProfile)).toBe("Jane-Doe_Draft-A_CV.docx");
  });

  it("falls back to a generic name when both parts are empty", () => {
    const profile: Profile = {
      ...fullProfile,
      name: "",
      header: { ...fullProfile.header, fullName: "" },
    };
    expect(buildExportFilename(profile)).toBe("resume.docx");
  });
});
