"use client";

import { Loader2, Newspaper } from "lucide-react";

import { Button, Spinner } from "@/components/ui/primitives";
import type { DailySummary } from "@/features/daily-news/types";
import { cn } from "@/lib/utils";

interface SummaryListProps {
  summaries: DailySummary[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function SummaryList({
  summaries,
  selectedId,
  onSelect,
  loading,
  loadingMore,
  hasMore,
  error,
  onLoadMore,
}: SummaryListProps) {
  if (loading) {
    return (
      <div className="flex w-72 shrink-0 items-center justify-center border-r border-border bg-secondary">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-72 shrink-0 flex-col items-center justify-center gap-2 border-r border-border bg-secondary px-4">
        <p className="text-center text-xs text-error">{error}</p>
        <Button variant="ghost" onClick={onLoadMore}>
          重试
        </Button>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="flex w-72 shrink-0 flex-col items-center justify-center gap-2 border-r border-border bg-secondary px-4">
        <Newspaper className="size-8 text-muted-text/50" />
        <p className="text-center text-xs text-muted-text">暂无资讯</p>
      </div>
    );
  }

  return (
    <div className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-border bg-secondary">
      {summaries.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s.id)}
          className={cn(
            "w-full px-4 py-3 text-left transition-colors",
            s.id === selectedId
              ? "bg-muted text-foreground"
              : "text-foreground hover:bg-muted/50",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium leading-tight">{formatDate(s.date)}</span>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-text">
              {s.language}
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-text">{s.item_count} 条</div>
        </button>
      ))}
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="w-full py-2.5 text-center text-xs text-muted-text hover:bg-muted/30 disabled:opacity-50"
        >
          {loadingMore ? (
            <Loader2 className="mx-auto size-3.5 animate-spin" />
          ) : (
            "加载更多"
          )}
        </button>
      )}
    </div>
  );
}
