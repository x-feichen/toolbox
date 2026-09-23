import { describe, expect, it } from "vitest";
import { fillPromptVariables, parsePromptVariables } from "./prompt-variables";

describe("parsePromptVariables", () => {
  it("extracts variables in order of first appearance", () => {
    expect(parsePromptVariables("分析 {{topic}}，读者是 {{audience}}")).toEqual([
      "topic",
      "audience",
    ]);
  });

  it("deduplicates repeated variables", () => {
    expect(parsePromptVariables("{{a}} 和 {{a}} 以及 {{b}}")).toEqual(["a", "b"]);
  });

  it("supports CJK, digits, underscore and hyphen in names", () => {
    expect(parsePromptVariables("{{需求描述_1}} {{user-name}}")).toEqual([
      "需求描述_1",
      "user-name",
    ]);
  });

  it("tolerates inner whitespace", () => {
    expect(parsePromptVariables("{{  topic  }}")).toEqual(["topic"]);
  });

  it("returns empty for content without variables", () => {
    expect(parsePromptVariables("没有变量的提示词")).toEqual([]);
  });
});

describe("fillPromptVariables", () => {
  it("replaces filled variables", () => {
    expect(fillPromptVariables("分析 {{topic}}", { topic: "登录页改版" })).toBe(
      "分析 登录页改版",
    );
  });

  it("keeps the placeholder for unfilled variables", () => {
    expect(fillPromptVariables("{{a}} 与 {{b}}", { a: "1" })).toBe("1 与 {{b}}");
  });

  it("treats empty string as unfilled", () => {
    expect(fillPromptVariables("{{a}}", { a: "" })).toBe("{{a}}");
  });
});
