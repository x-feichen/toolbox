export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export const CATEGORY_LABELS: Record<string, string> = {
  developer: "开发工具",
  text: "文本工具",
  data: "数据工具",
  image: "图片工具",
  ai: "AI 工具",
  other: "其他",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? "其他";
}
