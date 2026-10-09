"use client";

import { DailyNewsBrowser } from "@/components/tool/daily-news/daily-news-browser";

/** /daily-news：侧边栏「每日资讯」页（只读内容，不属工具体系）。 */
export default function DailyNewsPage() {
  return (
    <div className="flex h-[calc(100vh-48px)] flex-col md:h-screen">
      <DailyNewsBrowser />
    </div>
  );
}
