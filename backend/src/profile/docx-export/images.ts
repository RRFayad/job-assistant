// Ported from the Python docx-service sidecar's _decode_picture_data_url and
// _crop_and_resize_picture (see ADR-0010) — sharp replaces Pillow for the
// crop/resize/encode.
import sharp from "sharp";

const PICTURE_DATA_URL_RE = /^data:image\/[^;]+;base64,(?<data>[\s\S]+)$/;
const PICTURE_EXPORT_DPI = 300;
const EMU_PER_INCH = 914400;

export const decodePictureDataUrl = (dataUrl: string): Buffer => {
  const match = PICTURE_DATA_URL_RE.exec(dataUrl);
  if (!match?.groups?.data) {
    throw new Error("Unsupported picture data URL");
  }
  return Buffer.from(match.groups.data, "base64");
};

// Center-crops to the picture frame's exact aspect ratio, then resizes to it
// at print resolution — so the frame in the generated document is filled
// edge to edge with no stretching or distortion, regardless of the
// uploaded photo's own dimensions.
export const cropAndResizePicture = async (
  imageBytes: Buffer,
  targetCx: number,
  targetCy: number,
): Promise<Buffer> => {
  const targetRatio = targetCx / targetCy;

  const { width, height } = await sharp(imageBytes).metadata();
  if (!width || !height) {
    throw new Error("Unable to read image dimensions");
  }
  const currentRatio = width / height;

  let pipeline = sharp(imageBytes).removeAlpha();

  if (currentRatio > targetRatio) {
    const croppedWidth = Math.round(height * targetRatio);
    const left = Math.floor((width - croppedWidth) / 2);
    pipeline = pipeline.extract({ left, top: 0, width: croppedWidth, height });
  } else if (currentRatio < targetRatio) {
    const croppedHeight = Math.round(width / targetRatio);
    const top = Math.floor((height - croppedHeight) / 2);
    pipeline = pipeline.extract({ left: 0, top, width, height: croppedHeight });
  }

  const outWidth = Math.round((targetCx / EMU_PER_INCH) * PICTURE_EXPORT_DPI);
  const outHeight = Math.round((targetCy / EMU_PER_INCH) * PICTURE_EXPORT_DPI);

  return pipeline
    .resize(outWidth, outHeight, { kernel: "lanczos3" })
    .png()
    .toBuffer();
};
