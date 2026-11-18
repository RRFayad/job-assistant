import { describe, expect, it } from "vitest";

import { parseContentDispositionFilename } from "./utils";

describe("parseContentDispositionFilename", () => {
  it("returns null for a missing header", () => {
    expect(parseContentDispositionFilename(null)).toBeNull();
    expect(parseContentDispositionFilename(undefined)).toBeNull();
  });

  it("reads the plain filename parameter when it's the only one present", () => {
    const header = 'attachment; filename="Jane_Doe.docx"';
    expect(parseContentDispositionFilename(header)).toBe("Jane_Doe.docx");
  });

  it("prefers the UTF-8 parameter over the ASCII fallback for a non-Latin1 name", () => {
    // Matches backend's _content_disposition: an ASCII-safe fallback plus
    // the real (percent-encoded) name in filename*=UTF-8''...
    const header =
      "attachment; filename=\"Jos-A.docx\"; filename*=UTF-8''Jos%C3%A9%20%C3%81.docx";
    expect(parseContentDispositionFilename(header)).toBe("José Á.docx");
  });

  it("falls back to the plain filename parameter if UTF-8 decoding fails", () => {
    const header =
      "attachment; filename=\"fallback.docx\"; filename*=UTF-8''%E0%A4%A";
    expect(parseContentDispositionFilename(header)).toBe("fallback.docx");
  });
});
