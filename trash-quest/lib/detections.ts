import type { DetectionLevel } from "./player.ts";

export type Detection = {
  name: string;
  box_2d: [number, number, number, number];
  level: DetectionLevel;
};

// Leave room for the multipart envelope below Vercel's 4.5 MB request limit.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_DETECTIONS = 100;

export function parseDetections(value: unknown): Detection[] {
  if (!Array.isArray(value) || value.length > MAX_DETECTIONS) {
    throw new Error("Invalid detections");
  }

  return value.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new Error("Invalid detection");
    const { name, box_2d: box, level } = item as Record<string, unknown>;
    if (
      typeof name !== "string" || !name.trim() || name.trim().length > 80 ||
      !Array.isArray(box) || box.length !== 4 ||
      !box.every((n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1000) ||
      box[0] >= box[2] || box[1] >= box[3] ||
      (level !== "lv1" && level !== "lv2" && level !== "lv3" && level !== "lv4")
    ) {
      // Reject the entire result: silently dropping invalid items changes rewards.
      throw new Error("Invalid detection");
    }
    return { name: name.trim(), box_2d: [...box] as Detection["box_2d"], level };
  });
}
