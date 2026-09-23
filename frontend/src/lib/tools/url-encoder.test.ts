import { describe, expect, it } from "vitest";
import { decodeUrlComponent, encodeUrlComponent } from "./url-encoder";

describe("url encoder", () => {
  it("encodes spaces and special characters", () => {
    expect(encodeUrlComponent("hello world")).toBe("hello%20world");
    expect(encodeUrlComponent("a=1&b=2")).toBe("a%3D1%26b%3D2");
    expect(encodeUrlComponent("中文")).toBe("%E4%B8%AD%E6%96%87");
  });

  it("round-trips", () => {
    const text = "q=搜索 term&lang=zh";
    expect(decodeUrlComponent(encodeUrlComponent(text))).toBe(text);
  });

  it("throws a friendly error on malformed input", () => {
    expect(() => decodeUrlComponent("%E0%A4%A")).toThrow("无法解码");
  });
});
