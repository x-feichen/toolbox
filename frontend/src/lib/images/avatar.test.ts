import { describe, expect, it } from "vitest";
import { computeTargetSize, isSupportedAvatarType } from "./avatar";

describe("computeTargetSize", () => {
  it("scales the longest edge down to maxEdge", () => {
    expect(computeTargetSize(2048, 1024, 512)).toEqual({ width: 512, height: 256 });
    expect(computeTargetSize(1024, 2048, 512)).toEqual({ width: 256, height: 512 });
  });

  it("never upscales small images", () => {
    expect(computeTargetSize(100, 80, 512)).toEqual({ width: 100, height: 80 });
    expect(computeTargetSize(512, 512, 512)).toEqual({ width: 512, height: 512 });
  });

  it("keeps at least one pixel", () => {
    const result = computeTargetSize(5000, 10, 512);
    expect(result.width).toBe(512);
    expect(result.height).toBe(1);
  });

  it("falls back to a square for invalid dimensions", () => {
    expect(computeTargetSize(0, 0, 512)).toEqual({ width: 512, height: 512 });
  });
});

describe("isSupportedAvatarType", () => {
  it("accepts jpg/png/webp", () => {
    expect(isSupportedAvatarType("image/jpeg")).toBe(true);
    expect(isSupportedAvatarType("image/png")).toBe(true);
    expect(isSupportedAvatarType("image/webp")).toBe(true);
  });

  it("rejects other formats", () => {
    expect(isSupportedAvatarType("image/gif")).toBe(false);
    expect(isSupportedAvatarType("image/svg+xml")).toBe(false);
  });
});
