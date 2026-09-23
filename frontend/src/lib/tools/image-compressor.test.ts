import { describe, expect, it } from "vitest";
import { formatBytes, isSupportedImageType } from "./image-compressor";

describe("formatBytes", () => {
  it("formats bytes and larger units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1.00 KB");
    expect(formatBytes(1536)).toBe("1.50 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.00 MB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.00 MB");
  });

  it("handles invalid values", () => {
    expect(formatBytes(-1)).toBe("0 B");
    expect(formatBytes(Number.NaN)).toBe("0 B");
  });
});

describe("isSupportedImageType", () => {
  it("accepts jpg/png/webp", () => {
    expect(isSupportedImageType("image/jpeg")).toBe(true);
    expect(isSupportedImageType("image/png")).toBe(true);
    expect(isSupportedImageType("image/webp")).toBe(true);
  });

  it("rejects other types", () => {
    expect(isSupportedImageType("image/gif")).toBe(false);
    expect(isSupportedImageType("application/pdf")).toBe(false);
  });
});
