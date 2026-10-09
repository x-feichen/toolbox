/**
 * Avatar client-side compression (browser-first: the image never touches the
 * network before it is resized). The pure helpers are unit-testable; the
 * canvas step requires a DOM and runs only in the browser.
 */

export const MAX_AVATAR_EDGE = 512;
export const WEBP_QUALITY = 0.85;
export const JPEG_QUALITY = 0.85;
export const SUPPORTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Target size preserving aspect ratio; never upscales small images. */
export function computeTargetSize(
  width: number,
  height: number,
  maxEdge = MAX_AVATAR_EDGE,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: maxEdge, height: maxEdge };
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function isSupportedAvatarType(type: string): boolean {
  return (SUPPORTED_AVATAR_TYPES as readonly string[]).includes(type);
}

/**
 * Compress an image file in the browser. Prefers WebP (smaller), falls back
 * to JPEG when the browser cannot encode WebP. Returns the original file when
 * it is already small enough.
 */
export async function compressAvatarImage(
  file: File,
  maxEdge = MAX_AVATAR_EDGE,
): Promise<Blob> {
  if (!isSupportedAvatarType(file.type)) {
    throw new Error("仅支持 JPG / PNG / WebP 图片");
  }
  if (file.size <= 100 * 1024 && file.type === "image/webp") {
    // already tiny and webp — no need to re-encode
    return file;
  }

  const image = await loadImage(file);
  const { width, height } = computeTargetSize(image.naturalWidth, image.naturalHeight, maxEdge);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持 Canvas");
  ctx.drawImage(image, 0, 0, width, height);

  // WebP first (smallest), JPEG fallback; keep the original when neither
  // encoding helps (e.g. tiny PNG with transparency).
  const webp = await canvasToBlob(canvas, "image/webp", WEBP_QUALITY);
  if (webp && webp.size < file.size) return webp;
  const jpeg = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
  if (jpeg && jpeg.size < file.size) return jpeg;
  return file;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片读取失败"));
    };
    image.src = url;
  });
}
