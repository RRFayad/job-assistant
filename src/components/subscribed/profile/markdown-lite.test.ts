import { describe, expect, it } from "vitest";

import { renderMarkdownLite } from "./markdown-lite";

describe("renderMarkdownLite", () => {
  it("renders bold text", () => {
    expect(renderMarkdownLite("**bold**")).toBe("<p><strong>bold</strong></p>");
  });

  it("renders italic text", () => {
    expect(renderMarkdownLite("*italic*")).toBe("<p><em>italic</em></p>");
  });

  it("renders underline text", () => {
    expect(renderMarkdownLite("++underline++")).toBe("<p><u>underline</u></p>");
  });

  it("renders links", () => {
    expect(renderMarkdownLite("[Google](https://google.com)")).toBe(
      '<p><a href="https://google.com">Google</a></p>',
    );
  });

  it("renders bold and italic in the same line without cross-matching markers", () => {
    expect(renderMarkdownLite("**bold** and *italic*")).toBe(
      "<p><strong>bold</strong> and <em>italic</em></p>",
    );
  });

  it("groups consecutive bullet lines into a single list", () => {
    expect(renderMarkdownLite("- one\n- two")).toBe(
      "<ul><li>one</li><li>two</li></ul>",
    );
  });

  it("separates bullet groups from surrounding paragraphs", () => {
    expect(renderMarkdownLite("intro\n- one\n- two\noutro")).toBe(
      "<p>intro</p><ul><li>one</li><li>two</li></ul><p>outro</p>",
    );
  });

  it("HTML-escapes raw input before applying formatting markers", () => {
    expect(renderMarkdownLite("<script>alert(1)</script>")).toBe(
      "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>",
    );
  });

  it("escapes HTML inside link text and URLs so markers can't be used to break out", () => {
    expect(renderMarkdownLite('[a"b](http://x?y="z)')).toBe(
      '<p><a href="http://x?y=&quot;z">a&quot;b</a></p>',
    );
  });

  it("skips blank lines", () => {
    expect(renderMarkdownLite("one\n\ntwo")).toBe("<p>one</p><p>two</p>");
  });

  it("preserves a URL containing a nested parenthesis", () => {
    expect(
      renderMarkdownLite(
        "[Wiki](https://en.wikipedia.org/wiki/C_(programming_language))",
      ),
    ).toBe(
      '<p><a href="https://en.wikipedia.org/wiki/C_(programming_language)">Wiki</a></p>',
    );
  });

  it("does not merge two separate links on the same line", () => {
    expect(
      renderMarkdownLite("[A](https://a.com) and [B](https://b.com)"),
    ).toBe(
      '<p><a href="https://a.com">A</a> and <a href="https://b.com">B</a></p>',
    );
  });

  it("does not render a javascript: link as clickable", () => {
    expect(renderMarkdownLite("[Click here](javascript:alert(1))")).toBe(
      "<p>Click here</p>",
    );
  });

  it("allows relative and hash links", () => {
    expect(renderMarkdownLite("[Home](/home)")).toBe(
      '<p><a href="/home">Home</a></p>',
    );
  });
});
