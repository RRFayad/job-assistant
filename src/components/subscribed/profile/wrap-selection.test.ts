import { describe, expect, it } from "vitest";

import { wrapSelection } from "./wrap-selection";

describe("wrapSelection", () => {
  it("wraps a plain selection with the marker", () => {
    const result = wrapSelection("hello world", 0, 5, "**");
    expect(result.value).toBe("**hello** world");
    expect(result.start).toBe(2);
    expect(result.end).toBe(7);
  });

  it("unwraps when the markers sit just outside the selection", () => {
    // "**hello** world", selection covers just "hello" (indices 2-7)
    const result = wrapSelection("**hello** world", 2, 7, "**");
    expect(result.value).toBe("hello world");
    expect(result.start).toBe(0);
    expect(result.end).toBe(5);
  });

  it("unwraps when the selection includes the markers themselves", () => {
    // selection covers "**hello**" including the markers (indices 0-9)
    const result = wrapSelection("**hello** world", 0, 9, "**");
    expect(result.value).toBe("hello world");
    expect(result.start).toBe(0);
    expect(result.end).toBe(5);
  });

  it("does not nest markers when toggled twice via the outside case", () => {
    const first = wrapSelection("hello", 0, 5, "**");
    expect(first.value).toBe("**hello**");

    const second = wrapSelection(first.value, first.start, first.end, "**");
    expect(second.value).toBe("hello");
  });

  it("wraps an empty selection at the cursor position", () => {
    const result = wrapSelection("hello world", 5, 5, "**");
    expect(result.value).toBe("hello**** world");
    expect(result.start).toBe(7);
    expect(result.end).toBe(7);
  });

  it("works with multi-character markers", () => {
    const result = wrapSelection("hello", 0, 5, "++");
    expect(result.value).toBe("++hello++");
  });

  it("wraps rather than corrupting when a shorter marker's char is a prefix of a longer surrounding marker", () => {
    const result = wrapSelection("**hello** world", 2, 7, "*");
    // Must wrap ("*hello*" inside the existing bold), not strip the bold markers.
    expect(result.value).toBe(
      "**hello** world".slice(0, 2) + "*hello*" + "**hello** world".slice(7),
    );
  });

  it("does not mistake a bold marker for an italic one when the selection includes the markers (inside case)", () => {
    // Selecting "**hello**" (including markers) and toggling italic must wrap,
    // not strip, since the enclosing markers are bold ("**"), not italic ("*").
    const result = wrapSelection("**hello** world", 0, 9, "*");
    expect(result.value).toBe("*" + "**hello**" + "* world");
  });
});
