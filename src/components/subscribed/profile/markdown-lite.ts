const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

// Only these schemes (or a scheme-less/relative URL) render as a clickable
// link — blocks javascript: and other script-executing schemes from a
// pasted or AI-suggested link surviving into dangerouslySetInnerHTML.
const isSafeUrl = (url: string): boolean =>
  /^(https?:|mailto:|tel:|\/|#)/i.test(url);

const applyInlineFormatting = (text: string): string =>
  text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\+\+(.+?)\+\+/g, "<u>$1</u>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // The URL group allows one level of nested parens (`\([^()]*\)`) so
    // real-world URLs like a Wikipedia "(programming_language)" segment
    // don't get truncated at the first closing paren, while still stopping
    // at the boundary between two separate links on the same line.
    .replace(
      /\[(.+?)\]\(((?:[^()]|\([^()]*\))+)\)/g,
      (match, label: string, url: string) =>
        isSafeUrl(url) ? `<a href="${url}">${label}</a>` : label,
    );

export const renderMarkdownLite = (text: string): string => {
  const lines = escapeHtml(text).split("\n");
  const html: string[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    const items = bulletBuffer
      .map((item) => `<li>${applyInlineFormatting(item)}</li>`)
      .join("");
    html.push(`<ul>${items}</ul>`);
    bulletBuffer = [];
  };

  for (const line of lines) {
    if (line.startsWith("- ")) {
      bulletBuffer.push(line.slice(2));
      continue;
    }

    flushBullets();
    if (line.length > 0) {
      html.push(`<p>${applyInlineFormatting(line)}</p>`);
    }
  }
  flushBullets();

  return html.join("");
};
