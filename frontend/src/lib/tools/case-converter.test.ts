import { describe, expect, it } from "vitest";
import { convertCase } from "./case-converter";

describe("convertCase", () => {
  const input = "hello world";

  it("converts basic cases", () => {
    expect(convertCase(input, "upper")).toBe("HELLO WORLD");
    expect(convertCase(input, "lower")).toBe("hello world");
    expect(convertCase(input, "title")).toBe("Hello World");
    expect(convertCase(input, "camel")).toBe("helloWorld");
    expect(convertCase(input, "pascal")).toBe("HelloWorld");
    expect(convertCase(input, "snake")).toBe("hello_world");
    expect(convertCase(input, "kebab")).toBe("hello-world");
  });

  it("normalizes any separator before converting", () => {
    expect(convertCase("Hello_World-v2", "camel")).toBe("helloWorldV2");
    expect(convertCase("Hello_World-v2", "snake")).toBe("hello_world_v2");
    expect(convertCase("tool-box v2", "title")).toBe("Tool Box V2");
  });

  it("returns empty for empty input", () => {
    expect(convertCase("", "upper")).toBe("");
    expect(convertCase("   ", "snake")).toBe("");
  });
});
