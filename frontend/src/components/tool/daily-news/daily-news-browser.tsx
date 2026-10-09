"use client";

import { useEffect, useState } from "react";
import { Newspaper, RefreshCw } from "lucide-react";

import { SummaryDetail } from "@/components/tool/daily-news/summary-detail";
import { SummaryList } from "@/components/tool/daily-news/summary-list";
import { useDailyNews } from "@/features/daily-news/use-daily-news";
import type { DailySummary } from "@/features/daily-news/types";
import { cn } from "@/lib/utils";

/**
 * 每日资讯浏览视图：左列表 + 右详情。
 * Markdown 预览 / 目录锚点跳转 / 逐条勾选复制；数据只读。
 */
export function DailyNewsBrowser() {
  const { summaries, loading, loadingMore, hasMore, error, refresh, loadMore } =
    useDailyNews();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedSummary: DailySummary | undefined = summaries.find(
    (s) => s.id === selectedId,
  );

  // 自动选中第一条
  useEffect(() => {
    if (selectedId === null && summaries.length > 0) {
      setSelectedId(summaries[0].id);
    }
  }, [selectedId, summaries]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b border-border px-4 py-2.5">
        <Newspaper className="size-4 text-secondary-text" aria-hidden />
        <h1 className="text-[15px] font-semibold text-foreground">每日资讯</h1>
        <p className="hidden text-[13px] text-secondary-text md:block">
          由 Horizon 流水线自动生成，只读浏览
        </p>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          title="刷新"
          aria-label="刷新"
          className="ml-auto inline-flex size-8 items-center justify-center rounded-sm text-secondary-text hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <SummaryList
          summaries={summaries}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          error={error}
          onLoadMore={loadMore}
        />
        <SummaryDetail summary={selectedSummary ?? null} />
      </div>
    </div>
  );
}
