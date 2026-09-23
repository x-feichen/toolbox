import { describe, expect, it } from "vitest";
import { decodeBase64, encodeBase64 } from "./base64";

describe("base64", () => {
  it("round-trips ASCII", () => {
    expect(encodeBase64("Hello")).toBe("SGVsbG8=");
    expect(decodeBase64("SGVsbG8=")).toBe("Hello");
  });

  it("round-trips Unicode (UTF-8 safe)", () => {
    const text = "你好，ToolBox！🎉";
    expect(decodeBase64(encodeBase64(text))).toBe(text);
  });

  it("encodes empty string to empty", () => {
    expect(encodeBase64("")).toBe("");
    expect(decodeBase64("")).toBe("");
  });

  it("rejects invalid base64", () => {
    expect(() => decodeBase64("!!!")).toThrow("Base64");
  });

  it("rejects binary garbage that maps to invalid UTF-8", () => {
    // 0xFF 0xFE is not valid UTF-8
    expect(() => decodeBase64("//4=")).toThrow("无法解码");
  });
});
