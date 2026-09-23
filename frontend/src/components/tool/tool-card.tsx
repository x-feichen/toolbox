"use client";

import { categoryLabel, cn } from "@/lib/utils";
import type { Tool } from "@toolbox/api-client";
import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import { ToolCategoryIcon } from "@/components/layout/app-shell";

interface ToolCardProps {
  tool: Tool;
  favorited?: boolean;
  onToggleFavorite?: (slug: string) => void;
}

/**
 * Tool Card (spec §22): name, one-line description, access badge — the user
 * knows the usage condition *before* clicking. Hover deepens the border and
 * reveals an arrow; no lift, no scale, no big shadow.
 */
export function ToolCard({ tool, favorited, onToggleFavorite }: ToolCardProps) {
  return (
    <Link
      href={`/tools?slug=${tool.slug}`}
      className="group relative flex flex-col rounded-md border border-border bg-panel p-4 transition-colors duration-150 hover:border-accent/40 hover:bg-secondary"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-muted text-secondary-text">
          <ToolCategoryIcon category={tool.category} className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium text-foreground">{tool.name}</p>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-[20px] text-secondary-text">
            {tool.description}
          </p>
        </div>
        <ArrowUpRight
          className="ml-auto size-4 shrink-0 text-muted-text opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          aria-hidden
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[12px] text-muted-text">{categoryLabel(tool.category)}</span>
        {tool.requires_auth && (
          <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5 text-[11px] text-secondary-text">
            <Lock className="size-3" aria-hidden />
            需要登录
          </span>
        )}
        {onToggleFavorite && (
          <button
            aria-label={favorited ? "取消收藏" : "收藏"}
            onClick={(event) => {
              event.preventDefault();
              onToggleFavorite(tool.slug);
            }}
            className={cn(
              "ml-auto text-[16px] leading-none transition-transform duration-150 hover:scale-110",
              favorited ? "text-warning" : "text-muted-text",
            )}
          >
            {favorited ? "★" : "☆"}
          </button>
        )}
      </div>
    </Link>
  );
}
