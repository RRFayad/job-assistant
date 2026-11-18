// Ported from the Python docx-service sidecar's markdown_lite.py (see
// ADR-0010). Mirrors src/components/subscribed/profile/markdown-lite.ts —
// but targets structured segments/blocks for real Word runs instead of an
// HTML string. A syntax change here needs the same change made there.

export interface InlineSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  url?: string;
}

export interface TextBlock {
  kind: "paragraph" | "bullet_list";
  lines: string[];
}

// Alternation order matters: at a given position, the regex engine tries
// each branch left to right and uses the first that matches. A lone "*" only
// reaches the italic branch once the "**" bold branch has already failed to
// match there, which is what correctly disambiguates "**bold**" from
// "*italic*" without extra bookkeeping.
const INLINE_PATTERN =
  /\[(?<linkText>.+?)\]\((?<linkUrl>(?:[^()]|\([^()]*\))+)\)|\*\*(?<bold>.+?)\*\*|\+\+(?<underline>.+?)\+\+|\*(?<italic>.+?)\*/g;

// Only these schemes (or a relative/hash URL) become a real hyperlink in the
// exported document — mirrors the frontend renderer's isSafeUrl.
const SAFE_URL_SCHEMES = /^(https?:|mailto:|tel:|\/|#)/i;

export const isSafeUrl = (url: string): boolean => SAFE_URL_SCHEMES.test(url);

export const parseInline = (line: string): InlineSegment[] => {
  // Recurses so a marker nested inside another (e.g. a link inside
  // "**...**", which the toolbar's wrap-entire-selection behavior can
  // produce) is still recognized, not treated as inert literal text.
  const applyOuterFormat = (
    text: string,
    format: { bold?: boolean; italic?: boolean; underline?: boolean },
  ): InlineSegment[] =>
    parseInline(text).map((inner) => {
      const segment: InlineSegment = { text: inner.text };
      if (inner.bold || format.bold) segment.bold = true;
      if (inner.italic || format.italic) segment.italic = true;
      if (inner.underline || format.underline) segment.underline = true;
      if (inner.url) segment.url = inner.url;
      return segment;
    });

  const segments: InlineSegment[] = [];
  let lastEnd = 0;

  for (const match of line.matchAll(INLINE_PATTERN)) {
    const start = match.index;
    const groups = match.groups as Record<string, string | undefined>;

    if (start > lastEnd) {
      segments.push({ text: line.slice(lastEnd, start) });
    }

    if (groups.linkText !== undefined) {
      const url = groups.linkUrl as string;
      segments.push(
        isSafeUrl(url)
          ? { text: groups.linkText, url }
          : { text: groups.linkText },
      );
    } else if (groups.bold !== undefined) {
      segments.push(...applyOuterFormat(groups.bold, { bold: true }));
    } else if (groups.underline !== undefined) {
      segments.push(...applyOuterFormat(groups.underline, { underline: true }));
    } else if (groups.italic !== undefined) {
      segments.push(...applyOuterFormat(groups.italic, { italic: true }));
    }

    lastEnd = start + match[0].length;
  }

  if (lastEnd < line.length || segments.length === 0) {
    segments.push({ text: line.slice(lastEnd) });
  }

  return segments;
};

export const parseBlocks = (text: string): TextBlock[] => {
  const blocks: TextBlock[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    blocks.push({ kind: "bullet_list", lines: bulletBuffer });
    bulletBuffer = [];
  };

  for (const line of text.split("\n")) {
    if (line.startsWith("- ")) {
      bulletBuffer.push(line.slice(2));
      continue;
    }

    flushBullets();
    if (line.trim().length > 0) {
      blocks.push({ kind: "paragraph", lines: [line] });
    }
  }
  flushBullets();

  return blocks;
};
