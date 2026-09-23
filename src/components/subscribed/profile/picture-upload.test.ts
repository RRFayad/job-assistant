import { beforeEach, describe, expect, it, vi } from "vitest";

import { readAndResizePicture } from "./picture-upload";

class FakeImage {
  width = 0;
  height = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

const setNaturalSize = (width: number, height: number) => {
  vi.stubGlobal(
    "Image",
    class extends FakeImage {
      constructor() {
        super();
        this.width = width;
        this.height = height;
      }
    },
  );
};

const makeFile = (): File =>
  new File(["fake-bytes"], "photo.png", { type: "image/png" });

describe("readAndResizePicture", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("downscales an oversized image to the max dimension on its longest side", async () => {
    setNaturalSize(4000, 3000);

    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/jpeg;base64,resized",
    );

    const result = await readAndResizePicture(makeFile());
    const canvas = getContextSpy.mock.contexts[0] as HTMLCanvasElement;

    expect(result).toBe("data:image/jpeg;base64,resized");
    expect(canvas.width).toBe(1000);
    expect(canvas.height).toBe(750);
  });

  it("leaves an already-small image at its original size", async () => {
    setNaturalSize(400, 300);

    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/jpeg;base64,small",
    );

    const result = await readAndResizePicture(makeFile());
    const canvas = getContextSpy.mock.contexts[0] as HTMLCanvasElement;

    expect(result).toBe("data:image/jpeg;base64,small");
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(300);
  });

  it("rejects when the canvas 2D context is unavailable", async () => {
    setNaturalSize(400, 300);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    await expect(readAndResizePicture(makeFile())).rejects.toThrow(/canvas/i);
  });
});
