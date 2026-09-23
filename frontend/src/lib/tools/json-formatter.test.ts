import { describe, expect, it } from "vitest";
import { formatJson, minifyJson, parseJson, validateJson } from "./json-formatter";

describe("parseJson", () => {
  it("parses valid JSON", () => {
    expect(parseJson('{"a":1}')).toEqual({ ok: true, value: { a: 1 } });
  });

  it("reports line and column for syntax errors", () => {
    const result = parseJson('{\n  "a": 1,\n  "b": \n}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.line).toBeGreaterThan(1);
      expect(result.column).toBeGreaterThan(0);
      expect(result.message).toContain("JSON 语法错误");
    }
  });

  it("reports a friendly message for completely invalid input", () => {
    const result = parseJson("not json at all");
    expect(result.ok).toBe(false);
  });
});

describe("formatJson", () => {
  it("formats with 2-space indent and preserves unicode", () => {
    const result = formatJson('{"名字":"工具箱","n":1}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('{\n  "名字": "工具箱",\n  "n": 1\n}');
    }
  });

  it("supports indent=0 (compact lines)", () => {
    const result = formatJson("[1,2]", 0);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("[1,2]");
  });

  it("propagates errors", () => {
    expect(formatJson("{").ok).toBe(false);
  });
});

describe("minifyJson", () => {
  it("strips all insignificant whitespace", () => {
    const result = minifyJson('{ "a" : [ 1 , 2 ] }');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('{"a":[1,2]}');
  });
});

describe("validateJson", () => {
  it("accepts valid input", () => {
    expect(validateJson("[]")).toEqual({ valid: true });
  });

  it("rejects invalid input with message", () => {
    const result = validateJson('{"a":}');
    expect(result.valid).toBe(false);
    expect(result.message).toBeTruthy();
  });
});
