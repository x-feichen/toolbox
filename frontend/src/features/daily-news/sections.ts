/**
 * 每日资讯切条解析（移植自 nanobot SummaryDetail 的 useMemo 逻辑），
 * 抽为纯函数以便单元测试。
 */

export const SECTION_SEPARATOR = /\n---\n/;

/** 标题与目录固定占据前两段，跳过后即正文条目。 */
const PREAMBLE_SECTIONS = 2;

/** 将整篇 Markdown 按 `\n---\n` 切为可选条目（去空段、跳过标题目录）。 */
export function parseSummarySections(markdown: string): string[] {
  return markdown
    .split(SECTION_SEPARATOR)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(PREAMBLE_SECTIONS);
}
