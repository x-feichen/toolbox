"use client";

import { useAuth } from "@/features/auth/auth-provider";
import { ToolCard } from "@/components/tool/tool-card";
import { useFavorites, useRecentSlugs, useToggleFavorite, useTools } from "@/features/tools/use-tools";
import { useCommandPalette } from "@/components/command/command-palette";
import { favoriteSlugs } from "@/features/tools/use-tools";
import { categoryLabel } from "@/lib/utils";
import type { Tool } from "@toolbox/api-client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

export default function HomePage() {
  const { open: openPalette } = useCommandPalette();
  const { data: tools = [], isLoading } = useTools();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { slugs: recentSlugs } = useRecentSlugs(mounted);
  const { data: favorites } = useFavorites();
  const { user } = useAuth();
  const toggleFavorite = useToggleFavorite();
  const favSet = favoriteSlugs(favorites);

  const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  const recent = recentSlugs.map((slug) => bySlug.get(slug)).filter((t): t is Tool => Boolean(t));
  const categories = [...new Set(tools.map((tool) => tool.category))];

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-24">
      {/* Hero — not a marketing banner (spec §25) */}
      <section className="flex flex-col items-center text-center">
        <h1 className="text-[32px] font-semibold leading-[40px] text-foreground">
          今天想做什么？
        </h1>
        <button
          onClick={openPalette}
          className="mt-8 flex h-12 w-full max-w-[560px] items-center gap-3 rounded-md border border-border bg-panel px-4 text-left text-[14px] text-muted-text transition-colors hover:border-accent/40"
        >
          <Search className="size-4" aria-hidden />
          Search tools...
          <kbd className="ml-auto rounded-sm bg-muted px-1.5 py-0.5 text-[11px]">⌘ K</kbd>
        </button>
      </section>

      {/* Recent */}
      {!isLoading && recent.length > 0 && (
        <section className="mt-16">
          <h2 className="text-[13px] font-medium text-secondary-text">
            最近使用{!user && "（本机）"}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.map((category) => {
        const categoryTools = tools.filter((tool) => tool.category === category);
        return (
          <section key={category} className="mt-16">
            <h2 className="text-[13px] font-medium text-secondary-text">
              {categoryLabel(category)}
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categoryTools.map((tool) => (
                <ToolCard
                  key={tool.slug}
                  tool={tool}
                  favorited={favSet.has(tool.slug)}
                  onToggleFavorite={
                    user
                      ? (slug) => toggleFavorite.mutate({ slug, favorited: favSet.has(slug) })
                      : undefined
                  }
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
