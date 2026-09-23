"use client";

import { ToolAccessGuard } from "@/components/tool/tool-access-guard";
import { ToolRenderer } from "@/components/tool/tool-renderer";
import { ToolCategoryIcon } from "@/components/layout/app-shell";
import { useAuth } from "@/features/auth/auth-provider";
import { favoriteSlugs, useFavorites, useToggleFavorite, useTools } from "@/features/tools/use-tools";
import { categoryLabel, cn } from "@/lib/utils";
import type { Tool } from "@toolbox/api-client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge, Spinner } from "@/components/ui/primitives";
import { Star } from "lucide-react";

/**
 * Tools Workbench (product decision):
 * left = cascading selects (category → tool), right = the selected tool's
 * workspace. Prompt 管理 lives here as a regular AI-category tool.
 */
export default function ToolsPage() {
  const router = useRouter();
  const { data: tools = [], isLoading } = useTools();

  const [ready, setReady] = useState(false);
  const [category, setCategory] = useState("all");
  const [slug, setSlug] = useState("");

  // Initialize once from the URL (synchronous read; the search-params hook
  // resolves asynchronously and would lose the deep link).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCategory(params.get("category") || "all");
    setSlug(params.get("slug") || "");
    setReady(true);
  }, []);

  const { user } = useAuth();
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const favSet = favoriteSlugs(favorites);

  const categories = useMemo(
    () => [...new Set(tools.map((tool) => tool.category))],
    [tools],
  );

  const visibleTools = useMemo(
    () => (category === "all" ? tools : tools.filter((tool) => tool.category === category)),
    [tools, category],
  );

  const selectedTool = tools.find((tool) => tool.slug === slug) ?? null;

  // Keep the workspace non-empty: auto-select the first visible tool.
  useEffect(() => {
    if (!isLoading && visibleTools.length > 0 && !visibleTools.some((tool) => tool.slug === slug)) {
      setSlug(visibleTools[0].slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, category, tools.length]);

  // Reflect the selection in the URL for shareable/bookmarkable deep links.
  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (slug) params.set("slug", slug);
    const qs = params.toString();
    router.replace(qs ? `/tools?${qs}` : "/tools");
  }, [ready, category, slug, router]);

  const onCategoryChange = (next: string) => {
    setCategory(next);
    const list = next === "all" ? tools : tools.filter((tool) => tool.category === next);
    setSlug(list[0]?.slug ?? "");
  };

  const onToolChange = (next: string) => {
    setSlug(next);
    const tool = tools.find((t) => t.slug === next);
    if (tool) setCategory(tool.category);
  };

  return (
    <div className="flex min-h-[calc(100vh-48px)] flex-col md:h-screen md:flex-row md:overflow-hidden">
      {/* Left: cascading selects */}
      <aside className="shrink-0 border-b border-border bg-secondary p-4 md:w-[300px] md:border-b-0 md:border-r">
        <p className="text-[13px] font-medium text-foreground">工具</p>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-[12px] text-secondary-text">工具分类</span>
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            aria-label="选择工具分类"
            className="h-9 w-full rounded-sm border border-border bg-panel px-2 text-[13px] text-foreground outline-none"
          >
            <option value="all">全部分类</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 flex flex-col gap-1.5">
          <span className="text-[12px] text-secondary-text">选择工具</span>
          <select
            value={slug}
            onChange={(event) => onToolChange(event.target.value)}
            aria-label="选择工具"
            className="h-9 w-full rounded-sm border border-border bg-panel px-2 text-[13px] text-foreground outline-none"
          >
            {visibleTools.length === 0 && <option value="">（该分类暂无工具）</option>}
            {visibleTools.map((tool) => (
              <option key={tool.slug} value={tool.slug}>
                {tool.name}
                {tool.requires_auth ? " 🔒" : ""}
              </option>
            ))}
          </select>
        </label>

        {/* Quick overview of the current category */}
        <div className="mt-4 hidden md:block">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-text">
            {category === "all" ? "全部工具" : categoryLabel(category)}
          </p>
          <ul className="mt-2 flex flex-col gap-0.5">
            {visibleTools.map((tool) => (
              <li key={tool.slug}>
                <button
                  onClick={() => onToolChange(tool.slug)}
                  className={cn(
                    "flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-[13px]",
                    tool.slug === slug
                      ? "bg-muted font-medium text-foreground"
                      : "text-secondary-text hover:bg-muted hover:text-foreground",
                  )}
                >
                  <ToolCategoryIcon category={tool.category} className="size-3.5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{tool.name}</span>
                  {favSet.has(tool.slug) && (
                    <Star className="size-3 shrink-0 text-warning" fill="currentColor" aria-hidden />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Right: the selected tool's workspace */}
      <section className="min-w-0 flex-1 md:h-screen md:overflow-hidden">
        {isLoading ? (
          <div className="flex h-[60vh] items-center justify-center">
            <Spinner />
          </div>
        ) : selectedTool ? (
          <ToolWorkspacePane tool={selectedTool} user={user} favSet={favSet} onToggleFavorite={(s) => toggleFavorite.mutate({ slug: s, favorited: favSet.has(s) })} />
        ) : (
          <div className="flex h-[60vh] items-center justify-center text-[13px] text-muted-text">
            该分类暂无工具
          </div>
        )}
      </section>
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
