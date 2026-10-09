"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DailySummary } from "@/features/daily-news/types";

const PAGE_SIZE = 20;

/**
 * 每日资讯数据 hook（移植自 nanobot useDailyNews）：
 * refresh + loadMore 分页语义保持不变；token 上下文替换为同源 cookie。
 */
export function useDailyNews() {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api().dailyNews.list({ limit: PAGE_SIZE });
      setSummaries(res.summaries);
      setHasMore(res.has_more);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await api().dailyNews.list({ limit: PAGE_SIZE, offset: summaries.length });
      setSummaries((prev) => [...prev, ...res.summaries]);
      setHasMore(res.has_more);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载更多失败");
    } finally {
      setLoadingMore(false);
    }
  }, [summaries.length, loadingMore, hasMore]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summaries, loading, loadingMore, hasMore, error, refresh, loadMore };
}
