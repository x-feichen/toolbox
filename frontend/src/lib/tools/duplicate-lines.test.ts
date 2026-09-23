import { describe, expect, it } from "vitest";
import { removeDuplicateLines } from "./duplicate-lines";

describe("removeDuplicateLines", () => {
  const input = "apple\nbanana\napple\norange\nbanana";

  it("removes duplicates preserving order", () => {
    const result = removeDuplicateLines(input);
    expect(result.lines).toEqual(["apple", "banana", "orange"]);
    expect(result.removedCount).toBe(2);
  });

  it("can ignore empty lines", () => {
    const result = removeDuplicateLines("a\n\n\nb", { ignoreEmptyLines: true, caseInsensitive: false });
    expect(result.lines).toEqual(["a", "b"]);
  });

  it("can be case-insensitive", () => {
    const result = removeDuplicateLines("Apple\napple\nAPPLE", {
      ignoreEmptyLines: false,
      caseInsensitive: true,
    });
    expect(result.lines).toEqual(["Apple"]);
  });

  it("handles trailing newline without a phantom line", () => {
    const result = removeDuplicateLines("a\nb\n");
    expect(result.lines).toEqual(["a", "b"]);
  });
});
