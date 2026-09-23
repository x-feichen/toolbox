import { describe, expect, it } from "vitest";
import { dateToTimestamp, formatTimestampResult, nowTimestamp, timestampToDate } from "./timestamp";

describe("timestamp converter", () => {
  it("converts seconds timestamp to date", () => {
    // 1710000000 = 2024-03-09 16:00:00 UTC
    const date = timestampToDate("1710000000", "seconds");
    expect(date).not.toBeNull();
    expect(date!.getTime()).toBe(1710000000000);
  });

  it("supports milliseconds", () => {
    const date = timestampToDate("1710000000000", "milliseconds");
    expect(date!.getTime()).toBe(1710000000000);
  });

  it("returns null for invalid input", () => {
    expect(timestampToDate("", "seconds")).toBeNull();
    expect(timestampToDate("abc", "seconds")).toBeNull();
    expect(timestampToDate("1.5", "seconds")).toBeNull();
  });

  it("formats local date-time", () => {
    // 1970-01-01 08:00:00 in UTC+8
    const text = formatTimestampResult("0", "seconds");
    expect(text).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it("converts date string to timestamp pair", () => {
    const result = dateToTimestamp("1970-01-01T00:00:01Z");
    expect(result!.seconds).toBe(1);
    expect(result!.milliseconds).toBe(1000);
    expect(dateToTimestamp("not-a-date")).toBeNull();
  });

  it("now returns consistent pair", () => {
    const now = nowTimestamp();
    expect(now.milliseconds).toBeGreaterThanOrEqual(now.seconds * 1000);
    expect(now.milliseconds - now.seconds * 1000).toBeLessThan(1000);
  });
});
