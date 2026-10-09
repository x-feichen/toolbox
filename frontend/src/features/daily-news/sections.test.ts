import { describe, expect, it } from "vitest";
import { parseSummarySections } from "./sections";

// Horizon 摘要布局：标题段 / 目录段 / 正文条目段们（各自以 \n---\n 分隔）
const DOC = [
  "# 每日资讯 2026-09-24",
  "---",
  "## 目录",
  "",
  "- [条目一](#条目一)",
  "- [条目二](#条目二)",
  "---",
  "### 条目一 {#条目一}",
  "",
  "正文内容 A",
  "---",
  "### 条目二 {#条目二}",
  "",
  "正文内容 B",
].join("\n");

describe("parseSummarySections", () => {
  it("splits by \\n---\\n and skips the title + TOC preamble", () => {
    const items = parseSummarySections(DOC);
    expect(items).toHaveLength(2);
    expect(items[0]).toContain("条目一");
    expect(items[1]).toContain("条目二");
  });

  it("drops empty sections", () => {
    // 中段全空时，切条后少于三段 → 无可选条目
    const result = parseSummarySections("T\n\n--TOC--\n\n---\n\n\n---\nA");
    expect(result).toEqual([]);
  });

  it("returns empty when there are fewer than three sections", () => {
    expect(parseSummarySections("only title")).toEqual([]);
    expect(parseSummarySections("title\n---\nonly toc")).toEqual([]);
  });
});
