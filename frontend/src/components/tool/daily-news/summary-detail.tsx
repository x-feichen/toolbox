"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { Check, Copy, FileText } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/primitives";
import type { DailySummary } from "@/features/daily-news/types";
import { parseSummarySections } from "@/features/daily-news/sections";
import { copyToClipboard } from "@/lib/clipboard";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface SummaryDetailProps {
  summary: DailySummary | null;
}

// 只允许 Markdown 渲染所需的白名单标签/属性；
// rehype-raw 会把源里的内联 HTML 转为节点，消毒是防 XSS 的必要环节。
const SANITIZE_SCHEMA = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "details",
    "summary",
  ],
};

/** 统一 Markdown 渲染管线（GFM + 内联 HTML + 消毒）。 */
function DailyMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, SANITIZE_SCHEMA]]}
    >
      {children}
    </ReactMarkdown>
  );
}

export function SummaryDetail({ summary }: SummaryDetailProps) {
  const { showToast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"preview" | "select">("preview");
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  const items = useMemo(
    () => (summary ? parseSummarySections(summary.markdown) : []),
    [summary],
  );

  const handleContentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      e.preventDefault();
      const id = href.slice(1);
      const el = containerRef.current?.querySelector(`[id="${CSS.escape(id)}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [],
  );

  const toggleIndex = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
    setCopied(false);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIndices(new Set(items.map((_, i) => i)));
    setCopied(false);
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedIndices(new Set());
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    const text = [...selectedIndices]
      .sort((a, b) => a - b)
      .map((i) => items[i])
      .join("\n---\n");
    try {
      await copyToClipboard(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast("复制失败，请手动复制");
    }
  }, [selectedIndices, items, showToast]);

  if (!summary) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-text">
        <FileText className="size-10 opacity-40" />
        <p className="text-sm">选择一条资讯查看详情</p>
      </div>
    );
  }

  const allSelected = items.length > 0 && selectedIndices.size === items.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-border px-6 py-2">
        <div className="flex rounded-md bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={cn(
              "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
              viewMode === "preview"
                ? "bg-panel text-foreground"
                : "text-muted-text hover:text-foreground",
            )}
          >
            预览
          </button>
          <button
            type="button"
            onClick={() => setViewMode("select")}
            className={cn(
              "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
              viewMode === "select"
                ? "bg-panel text-foreground"
                : "text-muted-text hover:text-foreground",
            )}
          >
            选择
          </button>
        </div>

        {viewMode === "select" && (
          <>
            <span className="ml-auto text-xs text-muted-text">
              已选 {selectedIndices.size} 条
            </span>
            <Button
              variant="ghost"
              disabled={selectedIndices.size === 0}
              className="gap-1.5 text-xs"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "已复制" : "复制"}
            </Button>
          </>
        )}
      </div>

      {/* Content */}
      {viewMode === "preview" ? (
        <div
          ref={containerRef}
          className="min-w-0 flex-1 overflow-y-auto px-6 py-4"
        >
          <article
            className="prose prose-sm dark:prose-invert max-w-none"
            onClick={handleContentClick}
          >
            <DailyMarkdown>{summary.markdown}</DailyMarkdown>
          </article>
        </div>
      ) : (
        <div className="min-w-0 flex-1 overflow-y-auto px-6 py-4">
          {/* Select all / Deselect all */}
          <div className="mb-3 flex gap-3">
            <button
              type="button"
              onClick={allSelected ? deselectAll : selectAll}
              className="text-xs text-muted-text hover:text-foreground"
            >
              {allSelected ? "取消全选" : "全选"}
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-xs text-muted-text">无可选条目</p>
          ) : (
            items.map((item, index) => (
              <label
                key={index}
                className={cn(
                  "mb-2 flex w-full cursor-pointer gap-3 rounded-md border p-3 transition-colors",
                  selectedIndices.has(index)
                    ? "border-accent/40 bg-accent/5"
                    : "hover:bg-muted/30",
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedIndices.has(index)}
                  onChange={() => toggleIndex(index)}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                />
                <div className="prose prose-sm dark:prose-invert min-w-0 max-h-40 max-w-none flex-1 overflow-y-auto">
                  <DailyMarkdown>{item}</DailyMarkdown>
                </div>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}
