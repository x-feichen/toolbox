"use client";

import { useEffect, useState } from "react";
import { Newspaper, RefreshCw } from "lucide-react";

import { SummaryDetail } from "@/components/tool/daily-news/summary-detail";
import { SummaryList } from "@/components/tool/daily-news/summary-list";
import { useDailyNews } from "@/features/daily-news/use-daily-news";
import type { DailySummary } from "@/features/daily-news/types";
import { cn, categoryLabel } from "@/lib/utils";
import { formatDate } from "@/components/tool/daily-news/summary-list-helpers";

const PREVIEW_MAX_HEIGHT = 480;

/**
 * 首页「每日资讯」区块。
 *
 * 折叠态：横向日期卡片流（默认展示前 7 天，可展开）；
 * 展开态：左列表 + 右详情的全功能浏览界面（与原工具视图一致）。
 */
export function DailyNewsSection() {
  const { summaries, loading, loadingMore, hasMore, error, refresh, loadMore } =
    useDailyNews();
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedSummary: DailySummary | undefined = summaries.find(
    (s) => s.id === selectedId,
  );

  // 展开时自动选中第一条
  useEffect(() => {
    if (expanded && selectedId === null && summaries.length > 0) {
      setSelectedId(summaries[0].id);
    }
  }, [expanded, selectedId, summaries]);

  const pick = (item: DailySummary) => {
    setSelectedId(item.id);
    setExpanded(true);
  };

  return (
    <section className="mt-16">
      <header className="flex items-center gap-3">
        <h2 className="flex items-center gap-2 text-[13px] font-medium text-secondary-text">
          <Newspaper className="size-3.5" aria-hidden />
          每日资讯
        </h2>
        <span className="text-[12px] text-muted-text">
          由 Horizon 流水线自动生成，只读浏览
        </span>
        <span className="ml-auto text-[12px] text-muted-text">
          {summaries.length > 0 && `${summaries.length} 天`}
        </span>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          aria-label="刷新"
          className="inline-flex size-7 items-center justify-center rounded-sm text-muted-text hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        </button>
      </header>

      {/* 折叠态：横向日期卡片 */}
      {!expanded && (
        <>
          {loading ? (
            <div className="mt-3 flex h-[72px] items-center rounded-md border border-border bg-panel px-4">
              <p className="text-[13px] text-muted-text">加载中…</p>
            </div>
          ) : error ? (
            <div className="mt-3 flex h-[72px] items-center justify-between rounded-md border border-border bg-panel px-4">
              <p className="text-[13px] text-error">{error}</p>
              <button
                type="button"
                onClick={refresh}
                className="text-[13px] text-accent hover:underline"
              >
                重试
              </button>
            </div>
          ) : summaries.length === 0 ? (
            <div className="mt-3 flex h-[72px] items-center rounded-md border border-border bg-panel px-4 text-[13px] text-muted-text">
              暂无资讯
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {summaries.slice(0, 6).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pick(s)}
                  className="group flex items-center justify-between rounded-md border border-border bg-panel px-4 py-3 text-left transition-colors hover:border-accent/40 hover:bg-secondary"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-foreground">
                      {formatDate(s.date)}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-muted-text">
                      {s.item_count} 条 · {categoryLabel("data")}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[11px] text-muted-text">
                    {s.language}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* 展开态：全功能双栏浏览 */}
      {expanded && (
        <div
          className="mt-3 flex min-h-[320px] flex-col overflow-hidden rounded-md border border-border bg-panel"
          style={{ maxHeight: PREVIEW_MAX_HEIGHT }}
        >
          <div className="flex items-center gap-3 border-b border-border px-3 py-2">
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setSelectedId(null);
              }}
              className="text-[13px] text-muted-text hover:text-foreground"
            >
              ← 返回
            </button>
            <span className="text-[13px] text-secondary-text">每日资讯</span>
          </div>
          <div className="flex min-h-0 flex-1">
            <SummaryList
              summaries={summaries}
              selectedId={selectedId}
              onSelect={setSelectedId}
              loading={false}
              loadingMore={loadingMore}
              hasMore={hasMore}
              error={null}
              onLoadMore={loadMore}
            />
            <SummaryDetail summary={selectedSummary ?? null} />
          </div>
        </div>
      )}
    </section>
  );
}
