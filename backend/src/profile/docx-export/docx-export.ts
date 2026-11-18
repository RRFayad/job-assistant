// Ported from the Python docx-service sidecar's docx_export.py (see
// ADR-0010) — see ADR-0009 for why the template is cloned piece-by-piece
// instead of filled in place: the flexible, variable-length Profile
// sections model doesn't fit a fixed layout.
import { existsSync } from "node:fs";
import { join } from "node:path";

import type {
  EntriesSection,
  ListSection,
  PairsSection,
  Profile,
  ProfileHeader,
  ProfileLink,
  ProfileSection,
  TagsSection,
  TextSection,
} from "@app/shared/schemas";
import type { Document, Element } from "@xmldom/xmldom";

import { cropAndResizePicture, decodePictureDataUrl } from "./images";
import { isSafeUrl, parseBlocks, parseInline } from "./markdown-lite";
import type { InlineSegment } from "./markdown-lite";
import {
  type DocxPackage,
  addImageRelationship,
  appendElement,
  childrenByTag,
  clearBody,
  clearRuns,
  clonedSnippet,
  dropOrphanedRelationships,
  firstChildByTag,
  loadDocxPackage,
  relateExternalHyperlink,
  recolorTableFill,
  serializePackage,
  setBottomBorder,
  setRunColor,
  setRunText,
  textRun,
  topLevelParagraphs,
  topLevelTables,
} from "./ooxml";

// Not import.meta.url-based — it doesn't resolve to a real file: URL under
// this repo's Vitest transform (see profile.controller.ts's DEV_SEED_PATH
// note). process.cwd() is backend/ for the real dev/build scripts, but the
// repo-root-level `vitest run` that runs every workspace's tests together
// leaves cwd at the repo root — so both are tried.
const resolveTemplatePath = (): string => {
  const fromBackend = join(process.cwd(), "templates", "resume_template.docx");
  if (existsSync(fromBackend)) return fromBackend;
  return join(process.cwd(), "backend", "templates", "resume_template.docx");
};

const TEMPLATE_PATH = resolveTemplatePath();

const BODY_LINK_COLOR = "0563C1";
const HEADER_TEXT_COLOR = "E8E8E8";

// A reusable run-formatting recipe, so freshly-generated runs (for
// variable-shape content like Markdown-lite text or a variable number of
// header links) match the template's typography without re-deriving it.
interface TextStyle {
  font?: string;
  color: string;
  bold?: boolean;
}

const BODY_STYLE: TextStyle = { font: "Calibri", color: "333333" };
const HEADER_TEXT_STYLE: TextStyle = {
  font: "Calibri",
  color: HEADER_TEXT_COLOR,
};

// Deep copies of representative elements from the template, extracted once
// per export so each piece's formatting can be cloned per occurrence (e.g.
// one section can have any number of bullet items) instead of being limited
// to however many the template's own example content happens to have.
interface Snippets {
  headerTableWithPicture: Element;
  headerTableNoPicture: Element;
  sectionHeading: Element;
  bodyParagraph: Element;
  jobTitle: Element;
  jobDates: Element;
  bulletItem: Element;
  tagsLine: Element;
}

const runProperties = (
  doc: Document,
  style: TextStyle,
  { bold = false, italic = false, underline = false } = {},
): Element => {
  const rPr = doc.createElement("w:rPr");

  if (style.font) {
    const rFonts = doc.createElement("w:rFonts");
    rFonts.setAttribute("w:ascii", style.font);
    rFonts.setAttribute("w:hAnsi", style.font);
    rFonts.setAttribute("w:cs", style.font);
    rPr.appendChild(rFonts);
  }
  if (bold || style.bold) rPr.appendChild(doc.createElement("w:b"));
  if (italic) rPr.appendChild(doc.createElement("w:i"));
  if (underline) {
    const u = doc.createElement("w:u");
    u.setAttribute("w:val", "single");
    rPr.appendChild(u);
  }

  const colorEl = doc.createElement("w:color");
  colorEl.setAttribute("w:val", style.color);
  rPr.appendChild(colorEl);

  return rPr;
};

const newRun = (
  doc: Document,
  text: string,
  style: TextStyle,
  options: { bold?: boolean; italic?: boolean; underline?: boolean } = {},
): Element => {
  const run = doc.createElement("w:r");
  run.appendChild(runProperties(doc, style, options));

  const t = doc.createElement("w:t");
  t.setAttribute("xml:space", "preserve");
  t.appendChild(doc.createTextNode(text));
  run.appendChild(t);
  return run;
};

const newLineBreak = (doc: Document, style: TextStyle): Element => {
  const run = doc.createElement("w:r");
  run.appendChild(runProperties(doc, style));
  run.appendChild(doc.createElement("w:br"));
  return run;
};

// @xmldom/xmldom has no native hyperlink support; this builds the
// w:hyperlink element directly, mirroring the Word-documented low-level
// approach python-docx itself uses.
//
// Checked here (not just by callers) so every hyperlink in the document —
// header links included — goes through the same scheme allowlist as
// Markdown-lite body links, rather than relying on each call site to
// remember the check.
const newHyperlink = (
  pkg: DocxPackage,
  text: string,
  url: string,
  style: TextStyle,
  options: { bold?: boolean; italic?: boolean } = {},
): Element => {
  if (!isSafeUrl(url)) {
    return newRun(pkg.documentDoc, text, style, options);
  }

  const rId = relateExternalHyperlink(pkg, url);
  const hyperlink = pkg.documentDoc.createElement("w:hyperlink");
  hyperlink.setAttribute("r:id", rId);
  hyperlink.appendChild(
    newRun(pkg.documentDoc, text, style, { ...options, underline: true }),
  );
  return hyperlink;
};

const appendSegment = (
  pkg: DocxPackage,
  paragraphElement: Element,
  segment: InlineSegment,
  style: TextStyle,
): void => {
  if (segment.url) {
    const linkStyle: TextStyle = { font: style.font, color: BODY_LINK_COLOR };
    paragraphElement.appendChild(
      newHyperlink(pkg, segment.text, segment.url, linkStyle, {
        bold: segment.bold,
        italic: segment.italic,
      }),
    );
    return;
  }

  paragraphElement.appendChild(
    newRun(pkg.documentDoc, segment.text, style, {
      bold: segment.bold,
      italic: segment.italic,
      underline: segment.underline,
    }),
  );
};

const renderMarkdownLite = (
  pkg: DocxPackage,
  snippets: Snippets,
  text: string,
): void => {
  for (const block of parseBlocks(text)) {
    if (block.kind === "bullet_list") {
      for (const line of block.lines) {
        const el = snippets.bulletItem.cloneNode(true) as Element;
        clearRuns(el);
        for (const segment of parseInline(line)) {
          appendSegment(pkg, el, segment, BODY_STYLE);
        }
        appendElement(pkg, el);
      }
    } else {
      const el = snippets.bodyParagraph.cloneNode(true) as Element;
      clearRuns(el);
      for (const segment of parseInline(block.lines[0])) {
        appendSegment(pkg, el, segment, BODY_STYLE);
      }
      appendElement(pkg, el);
    }
  }
};

const renderEntries = (
  pkg: DocxPackage,
  snippets: Snippets,
  section: EntriesSection,
): void => {
  for (const entry of section.entries) {
    if (entry.heading) {
      const titleEl = snippets.jobTitle.cloneNode(true) as Element;
      const titleRun = firstChildByTag(titleEl, "w:r");
      if (titleRun) setRunText(pkg.documentDoc, titleRun, entry.heading);
      appendElement(pkg, titleEl);
    }

    if (entry.dates) {
      const datesEl = snippets.jobDates.cloneNode(true) as Element;
      const datesRun = firstChildByTag(datesEl, "w:r");
      if (datesRun) setRunText(pkg.documentDoc, datesRun, entry.dates);
      appendElement(pkg, datesEl);
    }

    renderMarkdownLite(pkg, snippets, entry.body);
  }
};

const renderList = (
  pkg: DocxPackage,
  snippets: Snippets,
  section: ListSection,
): void => {
  for (const item of section.items) {
    renderMarkdownLite(pkg, snippets, item);
  }
};

const renderTags = (
  pkg: DocxPackage,
  snippets: Snippets,
  section: TagsSection,
): void => {
  for (const category of section.categories) {
    const el = snippets.tagsLine.cloneNode(true) as Element;
    const runs = childrenByTag(el, "w:r");
    setRunText(pkg.documentDoc, runs[0], `${category.label}:`);
    setRunText(pkg.documentDoc, runs[1], ` ${category.items.join(", ")}`);
    appendElement(pkg, el);
  }
};

const renderPairs = (
  pkg: DocxPackage,
  snippets: Snippets,
  section: PairsSection,
): void => {
  for (const pair of section.pairs) {
    const el = snippets.bodyParagraph.cloneNode(true) as Element;
    const run = firstChildByTag(el, "w:r");
    if (run) setRunText(pkg.documentDoc, run, `${pair.left}: ${pair.right}`);
    appendElement(pkg, el);
  }
};

const renderSectionBody = (
  pkg: DocxPackage,
  snippets: Snippets,
  section: ProfileSection,
): void => {
  switch (section.type) {
    case "text":
      renderMarkdownLite(pkg, snippets, (section as TextSection).body);
      return;
    case "entries":
      renderEntries(pkg, snippets, section as EntriesSection);
      return;
    case "list":
      renderList(pkg, snippets, section as ListSection);
      return;
    case "tags":
      renderTags(pkg, snippets, section as TagsSection);
      return;
    case "pairs":
      renderPairs(pkg, snippets, section as PairsSection);
      return;
  }
};

const embedPicture = async (
  pkg: DocxPackage,
  tableElement: Element,
  dataUrl: string,
): Promise<void> => {
  const drawing = tableElement.getElementsByTagName("w:drawing")[0];
  const extent = drawing.getElementsByTagName("wp:extent")[0];
  const targetCx = Number(extent.getAttribute("cx"));
  const targetCy = Number(extent.getAttribute("cy"));

  const pngBytes = await cropAndResizePicture(
    decodePictureDataUrl(dataUrl),
    targetCx,
    targetCy,
  );
  const rId = addImageRelationship(pkg, pngBytes);

  const blip = drawing.getElementsByTagName("a:blip")[0];
  blip.setAttribute("r:embed", rId);

  const blipFill = blip.parentNode as Element;
  const srcRect = firstChildByTag(blipFill, "a:srcRect");
  // The template's crop percentages are tuned to its own placeholder photo;
  // the image above is already cropped to the right aspect ratio, so
  // re-applying them here would crop it a second time.
  if (srcRect) blipFill.removeChild(srcRect);
};

// Matches the template's own contact line: email/phone on one line, then a
// real line break, then location on its own line below — not all three run
// together on one line separated by "|".
const rebuildContactParagraph = (
  paragraphElement: Element,
  header: ProfileHeader,
): void => {
  const doc = paragraphElement.ownerDocument!;
  clearRuns(paragraphElement);
  const topLine = [header.email, header.phone].filter(Boolean).join(" | ");
  const location = header.location.trim();

  if (topLine) {
    paragraphElement.appendChild(newRun(doc, topLine, HEADER_TEXT_STYLE));
  }
  if (topLine && location) {
    paragraphElement.appendChild(newLineBreak(doc, HEADER_TEXT_STYLE));
  }
  if (location) {
    paragraphElement.appendChild(newRun(doc, location, HEADER_TEXT_STYLE));
  }
};

const rebuildLinksParagraph = (
  pkg: DocxPackage,
  paragraphElement: Element,
  links: ProfileLink[],
): void => {
  clearRuns(paragraphElement);
  links.forEach((link, index) => {
    if (index > 0) {
      paragraphElement.appendChild(
        newRun(pkg.documentDoc, " | ", HEADER_TEXT_STYLE),
      );
    }
    paragraphElement.appendChild(
      newHyperlink(pkg, link.label, link.url, HEADER_TEXT_STYLE),
    );
  });
};

const buildHeader = async (
  pkg: DocxPackage,
  snippets: Snippets,
  header: ProfileHeader,
): Promise<void> => {
  let tableEl: Element;
  let hasPicture: boolean;

  if (header.picture) {
    tableEl = snippets.headerTableWithPicture.cloneNode(true) as Element;
    await embedPicture(pkg, tableEl, header.picture);
    hasPicture = true;
  } else {
    tableEl = snippets.headerTableNoPicture.cloneNode(true) as Element;
    hasPicture = false;
  }
  recolorTableFill(tableEl, header.primaryColor);

  // The picture layout has a picture column before the text column; the
  // no-picture layout is a single full-width cell.
  const cells = childrenByTag(childrenByTag(tableEl, "w:tr")[0], "w:tc");
  const cell = hasPicture ? cells[1] : cells[0];
  const cellParagraphs = childrenByTag(cell, "w:p");

  const nameRun = textRun(cellParagraphs[0]);
  const careerTitleRun = textRun(cellParagraphs[1]);
  if (nameRun) setRunText(pkg.documentDoc, nameRun, header.fullName);
  if (careerTitleRun) {
    setRunText(pkg.documentDoc, careerTitleRun, header.careerTitle);
  }
  rebuildContactParagraph(cellParagraphs[2], header);
  rebuildLinksParagraph(pkg, cellParagraphs[3], header.links);

  appendElement(pkg, tableEl);
  appendElement(pkg, pkg.documentDoc.createElement("w:p")); // spacer, matches the template
};

const loadSnippets = (pkg: DocxPackage): Snippets => {
  const paragraphs = topLevelParagraphs(pkg.body);
  const tables = topLevelTables(pkg.body);
  return {
    headerTableWithPicture: clonedSnippet(tables[0]),
    // The alternate no-photo banner lives on this same file's last page —
    // not a separate document — so both banners always share the same
    // styles.xml/docDefaults.
    headerTableNoPicture: clonedSnippet(tables[1]),
    sectionHeading: clonedSnippet(paragraphs[1]),
    bodyParagraph: clonedSnippet(paragraphs[2]),
    jobTitle: clonedSnippet(paragraphs[8]),
    jobDates: clonedSnippet(paragraphs[9]),
    bulletItem: clonedSnippet(paragraphs[11]),
    tagsLine: clonedSnippet(paragraphs[5]),
  };
};

export const buildResumeDocument = async (
  profile: Profile,
): Promise<Buffer> => {
  const pkg = await loadDocxPackage(TEMPLATE_PATH);
  const snippets = loadSnippets(pkg);
  clearBody(pkg);
  dropOrphanedRelationships(pkg);

  await buildHeader(pkg, snippets, profile.header);

  for (const section of profile.sections) {
    const headingEl = snippets.sectionHeading.cloneNode(true) as Element;
    const headingRun = firstChildByTag(headingEl, "w:r");
    if (headingRun) {
      setRunText(pkg.documentDoc, headingRun, section.title);
      setRunColor(headingRun, profile.header.secondaryColor);
    }
    setBottomBorder(headingEl, profile.header.secondaryColor);
    appendElement(pkg, headingEl);

    renderSectionBody(pkg, snippets, section);
  }

  return serializePackage(pkg);
};

const UNSAFE_FILENAME_CHARS = /[\\/:*?"<>|]/g;

// A recruiter-friendly name, e.g. "Jane-Doe_Frontend-Engineer_CV.docx" —
// legible at a glance in a downloads folder or an inbox attachment list,
// rather than a bare name or a generic "resume.docx".
export const buildExportFilename = (profile: Profile): string => {
  const namePart = profile.header.fullName
    .split(/\s+/)
    .filter(Boolean)
    .join("-");
  const profilePart = profile.name.split(/\s+/).filter(Boolean).join("-");

  const parts = [namePart, profilePart].filter(Boolean);
  const base = parts.length > 0 ? [...parts, "CV"].join("_") : "resume";

  return `${base.replace(UNSAFE_FILENAME_CHARS, "")}.docx`;
};

// A non-ASCII filename can break a header encoder outright, so the plain
// filename= parameter always gets an ASCII-safe fallback; the RFC 6266
// filename*= parameter carries the real name for the (near-universal)
// clients that support it.
export const contentDisposition = (filename: string): string => {
  const asciiFilename = filename.replace(/[^\x00-\x7F]/g, "?");
  return (
    `attachment; filename="${asciiFilename}"; ` +
    `filename*=UTF-8''${encodeURIComponent(filename)}`
  );
};
