"use client";

import { ToolAccessGuard } from "@/components/tool/tool-access-guard";
import { ToolRenderer } from "@/components/tool/tool-renderer";
import { ToolCategoryIcon } from "@/components/layout/app-shell";
import { useAuth } from "@/features/auth/auth-provider";
import { favoriteSlugs, useFavorites, useToggleFavorite, useTools } from "@/features/tools/use-tools";
import { cn } from "@/lib/utils";
import type { Tool } from "@toolbox/api-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Badge, Spinner } from "@/components/ui/primitives";
import { Star } from "lucide-react";

/**
 * /tools 直接渲染选中工具的工作区；导航由侧边栏「工具」树承担。
 * URL (?category=&slug=) 是唯一数据源，客户端导航与深链接天然一致。
 */
export default function ToolsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <ToolsWorkspace />
    </Suspense>
  );
}

function ToolsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: tools = [], isLoading } = useTools();
  const { user } = useAuth();
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const favSet = favoriteSlugs(favorites);

  const slugParam = searchParams.get("slug") ?? "";
  const categoryParam = searchParams.get("category");
  const selectedTool = tools.find((tool) => tool.slug === slugParam) ?? null;

  // Canonicalize: missing/invalid slug → first tool of ?category= (or overall).
  useEffect(() => {
    if (isLoading || tools.length === 0 || selectedTool) return;
    const candidates = categoryParam
      ? tools.filter((tool) => tool.category === categoryParam)
      : tools;
    const first = candidates[0] ?? tools[0];
    router.replace(`/tools?category=${first.category}&slug=${first.slug}`);
  }, [isLoading, tools, selectedTool, categoryParam, router]);

  if (isLoading || !selectedTool) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-48px)] flex-col md:h-screen md:flex-row">
      <div className="min-w-0 flex-1 md:h-screen md:overflow-hidden">
        <ToolWorkspacePane
          tool={selectedTool}
          user={user}
          favSet={favSet}
          onToggleFavorite={(s) => toggleFavorite.mutate({ slug: s, favorited: favSet.has(s) })}
        />
      </div>
    </div>
  );
}

interface PaneProps {
  tool: Tool;
  user: { id: string } | null;
  favSet: Set<string>;
  onToggleFavorite: (slug: string) => void;
}

function ToolWorkspacePane({ tool, user, favSet, onToggleFavorite }: PaneProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Tool header */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <ToolCategoryIcon category={tool.category} className="size-4 text-secondary-text" />
        <h1 className="text-[16px] font-semibold text-foreground">{tool.name}</h1>
        <span className="hidden text-[13px] text-secondary-text md:inline">{tool.description}</span>
        {tool.requires_auth && !user && <Badge tone="accent">需要登录</Badge>}
        {tool.status === "beta" && <Badge>Beta</Badge>}
        {user && (
          <button
            aria-label={favSet.has(tool.slug) ? "取消收藏" : "收藏"}
            onClick={() => onToggleFavorite(tool.slug)}
            className={cn(
              "ml-auto text-[18px] leading-none",
              favSet.has(tool.slug) ? "text-warning" : "text-muted-text hover:text-foreground",
            )}
          >
            {favSet.has(tool.slug) ? "★" : "☆"}
          </button>
        )}
      </header>

      {/* Workspace: max-width none (spec §8) */}
      <div className="min-h-0 flex-1 md:overflow-y-auto">
        <ToolAccessGuard tool={tool}>
          <ToolRenderer tool={tool} />
        </ToolAccessGuard>
      </div>
    </div>
  );
}
