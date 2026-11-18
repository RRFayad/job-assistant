// A narrow, resume-template-specific replacement for the handful of
// python-docx primitives docx-export.ts needs — this is not a general OOXML
// library. Ported from the Python docx-service sidecar's lxml-based helpers
// (see ADR-0010), using jszip for the package and @xmldom/xmldom for the
// XML tree. Word's XML always uses the same literal namespace prefixes
// ("w:", "wp:", "a:", "r:"), so plain (non-namespace-aware) DOM calls on the
// literal "w:xyz" tag/attribute names are enough — no need to resolve
// namespace URIs.
import { readFile } from "node:fs/promises";

import JSZip from "jszip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import type { Document, Element } from "@xmldom/xmldom";

const DOCUMENT_XML_PATH = "word/document.xml";
const RELS_PATH = "word/_rels/document.xml.rels";
const CONTENT_TYPES_PATH = "[Content_Types].xml";

const IMAGE_RELATIONSHIP_TYPE =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image";
export const HYPERLINK_RELATIONSHIP_TYPE =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink";

export interface DocxPackage {
  zip: JSZip;
  documentDoc: Document;
  relsDoc: Document;
  body: Element;
  sectPr: Element;
  nextMediaIndex: number;
}

export const elementChildren = (node: Element | Document): Element[] =>
  Array.from(node.childNodes).filter(
    (n): n is Element => n.nodeType === 1,
  ) as Element[];

export const topLevelParagraphs = (body: Element): Element[] =>
  elementChildren(body).filter((n) => n.tagName === "w:p");

export const topLevelTables = (body: Element): Element[] =>
  elementChildren(body).filter((n) => n.tagName === "w:tbl");

// Mirrors lxml's Element.find(tag): the first direct child with that tag,
// not a descendant search.
export const firstChildByTag = (
  element: Element,
  tagName: string,
): Element | null =>
  elementChildren(element).find((n) => n.tagName === tagName) ?? null;

// Mirrors lxml's Element.findall(tag): every direct child with that tag.
export const childrenByTag = (element: Element, tagName: string): Element[] =>
  elementChildren(element).filter((n) => n.tagName === tagName);

const removeAllByTagName = (element: Element, tagName: string): void => {
  for (const node of Array.from(element.getElementsByTagName(tagName))) {
    node.parentNode?.removeChild(node);
  }
};

// Mirrors _cloned_snippet: deep-copy + strip w:divId (a leftover HTML-paste
// border linked via word/webSettings.xml, not this paragraph's own w:pBdr)
// + strip native Word comment anchors (meant for a human editing the
// template, never for a generated export).
export const clonedSnippet = (sourceElement: Element): Element => {
  const clone = sourceElement.cloneNode(true) as Element;
  removeAllByTagName(clone, "w:divId");
  removeAllByTagName(clone, "w:commentRangeStart");
  removeAllByTagName(clone, "w:commentRangeEnd");
  for (const run of Array.from(clone.getElementsByTagName("w:r"))) {
    if (
      (run as Element).getElementsByTagName("w:commentReference").length > 0
    ) {
      run.parentNode?.removeChild(run);
    }
  }
  return clone;
};

// Mirrors _clear_runs: drops a cloned paragraph's placeholder runs/
// hyperlinks, keeping pPr (spacing, indent, bullet numbering) intact.
export const clearRuns = (paragraphElement: Element): void => {
  for (const child of elementChildren(paragraphElement)) {
    if (child.tagName === "w:r" || child.tagName === "w:hyperlink") {
      paragraphElement.removeChild(child);
    }
  }
};

// Mirrors _text_run: the first run that actually carries text, as opposed
// to, say, the picture template's name paragraph, whose *first* run anchors
// the headshot image and has no w:t of its own.
export const textRun = (paragraphElement: Element): Element | null => {
  for (const run of Array.from(paragraphElement.getElementsByTagName("w:r"))) {
    if ((run as Element).getElementsByTagName("w:t").length > 0) {
      return run as Element;
    }
  }
  return null;
};

export const setRunText = (
  doc: Document,
  runElement: Element,
  text: string,
): void => {
  let t = runElement.getElementsByTagName("w:t")[0] as Element | undefined;
  if (!t) {
    t = doc.createElement("w:t");
    runElement.appendChild(t);
  }
  t.setAttribute("xml:space", "preserve");
  while (t.firstChild) t.removeChild(t.firstChild);
  t.appendChild(doc.createTextNode(text));
};

export const setRunColor = (runElement: Element, hexValue: string): void => {
  const rPr = runElement.getElementsByTagName("w:rPr")[0] as
    Element | undefined;
  if (!rPr) return;

  let colorEl = rPr.getElementsByTagName("w:color")[0] as Element | undefined;
  if (!colorEl) {
    colorEl = runElement.ownerDocument!.createElement("w:color");
    rPr.appendChild(colorEl);
  }
  colorEl.setAttribute("w:val", hexValue.replace("#", "").toUpperCase());
  if (colorEl.getAttribute("w:themeColor")) {
    colorEl.removeAttribute("w:themeColor");
  }
};

// A thin rule under a section heading, colored to match its text — the
// divider line under "Profile & Career", "Skills", etc.
export const setBottomBorder = (
  paragraphElement: Element,
  hexValue: string,
): void => {
  const doc = paragraphElement.ownerDocument!;

  let pPr = paragraphElement.getElementsByTagName("w:pPr")[0] as
    Element | undefined;
  if (!pPr) {
    pPr = doc.createElement("w:pPr");
    paragraphElement.insertBefore(pPr, paragraphElement.firstChild);
  }

  let pBdr = pPr.getElementsByTagName("w:pBdr")[0] as Element | undefined;
  if (!pBdr) {
    pBdr = doc.createElement("w:pBdr");
    // w:pBdr must precede w:spacing/w:jc/etc. in CT_PPrBase's schema order,
    // so it goes first among pPr's children, not appended last.
    pPr.insertBefore(pBdr, pPr.firstChild);
  }

  const bottom = doc.createElement("w:bottom");
  bottom.setAttribute("w:val", "single");
  // Matches the thickness/spacing of the template's own (now-removed,
  // fixed-color) divId-linked border — see clonedSnippet.
  bottom.setAttribute("w:sz", "8");
  bottom.setAttribute("w:space", "3");
  bottom.setAttribute("w:color", hexValue.replace("#", "").toUpperCase());
  pBdr.appendChild(bottom);
};

export const recolorTableFill = (
  tableElement: Element,
  hexValue: string,
): void => {
  const fill = hexValue.replace("#", "").toUpperCase();
  for (const shd of Array.from(tableElement.getElementsByTagName("w:shd"))) {
    (shd as Element).setAttribute("w:fill", fill);
  }
};

// Mirrors _append_element: inserts before the body's trailing sectPr.
export const appendElement = (pkg: DocxPackage, element: Element): void => {
  pkg.body.insertBefore(element, pkg.sectPr);
};

const parseXml = (xml: string): Document =>
  new DOMParser().parseFromString(xml, "text/xml");

export const loadDocxPackage = async (
  templatePath: string,
): Promise<DocxPackage> => {
  const zip = await JSZip.loadAsync(await readFile(templatePath));

  const documentXml = await zip.file(DOCUMENT_XML_PATH)?.async("string");
  const relsXml = await zip.file(RELS_PATH)?.async("string");
  if (!documentXml || !relsXml) {
    throw new Error("Malformed .docx template: missing document.xml or rels");
  }

  const documentDoc = parseXml(documentXml);
  const relsDoc = parseXml(relsXml);

  const body = documentDoc.getElementsByTagName("w:body")[0] as Element;
  const sectPr = elementChildren(body).find(
    (n) => n.tagName === "w:sectPr",
  ) as Element;

  return { zip, documentDoc, relsDoc, body, sectPr, nextMediaIndex: 1 };
};

// Mirrors _clear_body's removal of every body child except sectPr.
export const clearBody = (pkg: DocxPackage): void => {
  for (const child of elementChildren(pkg.body)) {
    if (child !== pkg.sectPr) pkg.body.removeChild(child);
  }
};

const maxRelationshipId = (relsDoc: Document): number => {
  let max = 0;
  for (const rel of Array.from(relsDoc.getElementsByTagName("Relationship"))) {
    const match = /^rId(\d+)$/.exec((rel as Element).getAttribute("Id") ?? "");
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max;
};

const addRelationship = (
  relsDoc: Document,
  type: string,
  target: string,
  externalTarget = false,
): string => {
  const rId = `rId${maxRelationshipId(relsDoc) + 1}`;
  const relationships = relsDoc.getElementsByTagName("Relationships")[0];

  const rel = relsDoc.createElement("Relationship");
  rel.setAttribute("Id", rId);
  rel.setAttribute("Type", type);
  rel.setAttribute("Target", target);
  if (externalTarget) rel.setAttribute("TargetMode", "External");
  relationships.appendChild(rel);

  return rId;
};

// Mirrors _clear_body's unconditional drop of the template's own example
// hyperlink/image/comments relationships: the body content that referenced
// them was just removed above, and every snippet clone already stripped its
// own comment anchors, so nothing in a generated export references these
// again.
export const dropOrphanedRelationships = (pkg: DocxPackage): void => {
  const relationships = pkg.relsDoc.getElementsByTagName("Relationships")[0];
  for (const rel of Array.from(
    pkg.relsDoc.getElementsByTagName("Relationship"),
  )) {
    const type = (rel as Element).getAttribute("Type") ?? "";
    if (
      type.includes("hyperlink") ||
      type.includes("image") ||
      type.includes("comments")
    ) {
      relationships.removeChild(rel);
    }
  }
};

export const relateExternalHyperlink = (
  pkg: DocxPackage,
  url: string,
): string =>
  addRelationship(pkg.relsDoc, HYPERLINK_RELATIONSHIP_TYPE, url, true);

// Mirrors document.part.get_or_add_image: registers a new media part and
// its relationship. Always PNG (see images.ts), and the template already
// registers the "png" Default content type via its own placeholder photo,
// so [Content_Types].xml needs no change for the common case — guarded
// below in case a future template drops that placeholder.
export const addImageRelationship = (
  pkg: DocxPackage,
  pngBytes: Buffer,
): string => {
  const filename = `image${pkg.nextMediaIndex}.png`;
  pkg.nextMediaIndex += 1;

  pkg.zip.file(`word/media/${filename}`, pngBytes);
  return addRelationship(
    pkg.relsDoc,
    IMAGE_RELATIONSHIP_TYPE,
    `media/${filename}`,
  );
};

const ensurePngContentType = async (zip: JSZip): Promise<void> => {
  const xml = await zip.file(CONTENT_TYPES_PATH)?.async("string");
  if (!xml) return;
  if (xml.includes('Extension="png"')) return;

  const doc = parseXml(xml);
  const types = doc.getElementsByTagName("Types")[0];
  const defaultEl = doc.createElement("Default");
  defaultEl.setAttribute("Extension", "png");
  defaultEl.setAttribute("ContentType", "image/png");
  types.appendChild(defaultEl);
  zip.file(CONTENT_TYPES_PATH, new XMLSerializer().serializeToString(doc));
};

export const serializePackage = async (pkg: DocxPackage): Promise<Buffer> => {
  await ensurePngContentType(pkg.zip);

  pkg.zip.file(
    DOCUMENT_XML_PATH,
    new XMLSerializer().serializeToString(pkg.documentDoc),
  );
  pkg.zip.file(RELS_PATH, new XMLSerializer().serializeToString(pkg.relsDoc));

  return pkg.zip.generateAsync({ type: "nodebuffer" });
};
