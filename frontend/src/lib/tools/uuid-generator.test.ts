import { describe, expect, it } from "vitest";
import { generateUuids } from "./uuid-generator";

describe("generateUuids", () => {
  it("generates the requested count of v4 UUIDs", () => {
    const uuids = generateUuids(5);
    expect(uuids).toHaveLength(5);
    for (const uuid of uuids) {
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
  });

  it("returns unique values", () => {
    expect(new Set(generateUuids(50)).size).toBe(50);
  });

  it("clamps invalid counts to at least 1", () => {
    expect(generateUuids(0)).toHaveLength(1);
    expect(generateUuids(-5)).toHaveLength(1);
    expect(generateUuids(1000)).toHaveLength(100);
  });
});
