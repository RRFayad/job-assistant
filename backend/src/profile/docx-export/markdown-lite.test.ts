import { describe, expect, it } from "vitest";

import { parseBlocks, parseInline } from "./markdown-lite";

describe("parseInline", () => {
  it("parses bold", () => {
    expect(parseInline("**bold**")).toEqual([{ text: "bold", bold: true }]);
  });

  it("parses italic", () => {
    expect(parseInline("*italic*")).toEqual([{ text: "italic", italic: true }]);
  });

  it("parses underline", () => {
    expect(parseInline("++underline++")).toEqual([
      { text: "underline", underline: true },
    ]);
  });

  it("parses a link", () => {
    expect(parseInline("[Google](https://google.com)")).toEqual([
      { text: "Google", url: "https://google.com" },
    ]);
  });

  it("does not cross-match bold and italic on the same line", () => {
    expect(parseInline("**bold** and *italic*")).toEqual([
      { text: "bold", bold: true },
      { text: " and " },
      { text: "italic", italic: true },
    ]);
  });

  it("keeps a link nested inside bold a real link", () => {
    expect(parseInline("**[Bold Link](https://a.com)**")).toEqual([
      { text: "Bold Link", bold: true, url: "https://a.com" },
    ]);
  });

  it("keeps a link nested inside italic a real link", () => {
    expect(parseInline("*[Italic Link](https://a.com)*")).toEqual([
      { text: "Italic Link", italic: true, url: "https://a.com" },
    ]);
  });

  it("preserves plain text around formatted segments", () => {
    expect(parseInline("Hello **world**!")).toEqual([
      { text: "Hello " },
      { text: "world", bold: true },
      { text: "!" },
    ]);
  });

  it("preserves a url with a nested parenthesis", () => {
    expect(
      parseInline(
        "[Wiki](https://en.wikipedia.org/wiki/C_(programming_language))",
      ),
    ).toEqual([
      {
        text: "Wiki",
        url: "https://en.wikipedia.org/wiki/C_(programming_language)",
      },
    ]);
  });

  it("does not merge two separate links on the same line", () => {
    expect(parseInline("[A](https://a.com) and [B](https://b.com)")).toEqual([
      { text: "A", url: "https://a.com" },
      { text: " and " },
      { text: "B", url: "https://b.com" },
    ]);
  });

  it("does not treat a javascript link as a hyperlink", () => {
    expect(parseInline("[Click here](javascript:alert(1))")).toEqual([
      { text: "Click here" },
    ]);
  });

  it("allows relative and hash links", () => {
    expect(parseInline("[Home](/home)")).toEqual([
      { text: "Home", url: "/home" },
    ]);
  });
});

describe("parseBlocks", () => {
  it("groups consecutive bullet lines into one block", () => {
    expect(parseBlocks("- one\n- two")).toEqual([
      { kind: "bullet_list", lines: ["one", "two"] },
    ]);
  });

  it("separates bullet groups from surrounding paragraphs", () => {
    expect(parseBlocks("intro\n- one\n- two\noutro")).toEqual([
      { kind: "paragraph", lines: ["intro"] },
      { kind: "bullet_list", lines: ["one", "two"] },
      { kind: "paragraph", lines: ["outro"] },
    ]);
  });

  it("skips blank lines", () => {
    expect(parseBlocks("one\n\ntwo")).toEqual([
      { kind: "paragraph", lines: ["one"] },
      { kind: "paragraph", lines: ["two"] },
    ]);
  });
});
