import { describe, expect, it } from "vitest";
import { countText } from "./word-counter";

describe("countText", () => {
  it("counts English words", () => {
    const stats = countText("hello world foo");
    expect(stats.words).toBe(3);
  });

  it("counts CJK characters as individual words", () => {
    expect(countText("你好世界").words).toBe(4);
    expect(countText("hello 你好").words).toBe(3); // "hello" + 2 CJK
  });

  it("counts mixed content", () => {
    const text = "ToolBox 工具箱 v2.0\nsecond line";
    const stats = countText(text);
    expect(stats.words).toBe(8); // ToolBox 工具箱(3) v2 0 second line
    expect(stats.lines).toBe(2);
    expect(stats.characters).toBe(text.length);
  });

  it("counts characters excluding spaces", () => {
    expect(countText("a b  c").characters).toBe(6);
    expect(countText("a b  c").charactersWithoutSpaces).toBe(3);
  });

  it("counts paragraphs separated by blank lines", () => {
    const stats = countText("第一段\n\n第二段\n\n\n第三段");
    expect(stats.paragraphs).toBe(3);
  });

  it("handles empty input", () => {
    const stats = countText("");
    expect(stats).toEqual({
      characters: 0,
      charactersWithoutSpaces: 0,
      words: 0,
      lines: 0,
      paragraphs: 0,
    });
  });
});
