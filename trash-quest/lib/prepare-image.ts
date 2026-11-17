import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "./detections";

// Normalize orientation and dimensions before BOTH previewing and uploading, so
// Gemini's normalized coordinates match the image displayed by the game.
export async function prepareImage(file: File): Promise<{ file: File; preview: string }> {
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new Error("JPEG・PNG・WebP画像を選択してください。HEICはJPEGに変換してください。");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("元の画像は20 MiB以下にしてください。");
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      throw new Error("画像を読み込めませんでした。別の画像を選択してください。");
    }
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("画像を処理できませんでした。");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size > MAX_IMAGE_BYTES) {
      throw new Error("画像が大きすぎます。解像度を下げて選び直してください。");
    }
    return {
      file: new File([blob], "room.jpg", { type: "image/jpeg" }),
      preview: canvas.toDataURL("image/jpeg", 0.85),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
