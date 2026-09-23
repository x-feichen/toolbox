import { describe, expect, it } from "vitest";
import { diffLines } from "./text-diff";

describe("diffLines", () => {
  it("marks equal lines between an insertion", () => {
    const rows = diffLines("a\nb\nc", "a\nx\nb\nc");
    expect(rows[0]).toEqual({ type: "equal", text: "a", lineA: 1, lineB: 1 });
    expect(rows[1]).toMatchObject({ type: "added", text: "x", lineB: 2 });
    expect(rows[2]).toEqual({ type: "equal", text: "b", lineA: 2, lineB: 3 });
    expect(rows[3]).toEqual({ type: "equal", text: "c", lineA: 3, lineB: 4 });
  });

  it("identifies all-added and all-removed", () => {
    const added = diffLines("", "a\nb");
    expect(added).toHaveLength(2);
    expect(added.every((r) => r.type === "added")).toBe(true);

    const removed = diffLines("a\nb", "");
    expect(removed.every((r) => r.type === "removed")).toBe(true);
  });

  it("returns equal rows for identical input", () => {
    const rows = diffLines("a\nb", "a\nb");
    expect(rows.every((r) => r.type === "equal")).toBe(true);
  });

  it("provides 1-based line numbers", () => {
    const rows = diffLines("keep\nold", "keep\nnew");
    const removed = rows.find((r) => r.type === "removed")!;
    const added = rows.find((r) => r.type === "added")!;
    expect(removed.lineA).toBe(2);
    expect(added.lineB).toBe(2);
  });

  it("throws for oversized input", () => {
    const big = Array.from({ length: 6000 }, (_, i) => String(i)).join("\n");
    expect(() => diffLines(big, "x")).toThrow("5000");
  });
});
