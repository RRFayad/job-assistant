export const MAX_PICTURE_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_PICTURE_DIMENSION = 1000;

// Downscales client-side before it ever reaches component state, so a
// multi-MB phone photo doesn't turn into a multi-MB autosave payload on
// every edit. The backend crops/resizes again server-side to the export
// template's exact picture frame, so this only needs to comfortably exceed
// that target resolution, not preserve full original quality.
export const readAndResizePicture = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not read that file."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not read that image."));
      image.onload = () => {
        const scale = Math.min(
          1,
          MAX_PICTURE_DIMENSION / Math.max(image.width, image.height),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas isn't supported in this browser."));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
