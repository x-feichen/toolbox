/** Image compressor helpers (Canvas operations live in the component). */

export const SUPPORTED_INPUT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const OUTPUT_FORMATS = [
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/webp", label: "WebP" },
  { value: "image/png", label: "PNG" },
] as const;

export type OutputFormat = (typeof OUTPUT_FORMATS)[number]["value"];

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes;
  let unit = "B";
  for (const next of units) {
    if (value < 1024) break;
    value /= 1024;
    unit = next;
  }
  return `${value.toFixed(value < 10 ? 2 : 0)} ${unit}`;
}

export function isSupportedImageType(type: string): boolean {
  return (SUPPORTED_INPUT_TYPES as readonly string[]).includes(type);
}
