"use client";

import { ToolCard } from "@/components/tool/tool-card";
import { Button } from "@/components/ui/primitives";
import { useAuth } from "@/features/auth/auth-provider";
import { favoriteSlugs, useFavorites, useToggleFavorite, useTools } from "@/features/tools/use-tools";
import Link from "next/link";

export default function FavoritesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: tools = [] } = useTools();
  const { data: favorites = [], isLoading } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const favSet = favoriteSlugs(favorites);

  if (authLoading) {
    return <p className="mt-24 text-center text-[13px] text-muted-text">Loading...</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto mt-24 max-w-md px-6 text-center">
        <h1 className="text-[18px] font-semibold text-foreground">收藏</h1>
        <p className="mt-2 text-[13px] text-secondary-text">
          收藏需要登录后使用，登录后可在所有设备同步。
        </p>
        <Link href="/login?next=/favorites" className="mt-5 inline-block">
          <Button variant="primary">登录</Button>
        </Link>
      </div>
    );
  }

  const favoritedTools = tools.filter((tool) => favSet.has(tool.slug));

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      <h1 className="text-[28px] font-semibold leading-[36px] text-foreground">收藏</h1>

      {isLoading ? (
        <p className="mt-12 text-center text-[13px] text-muted-text">Loading...</p>
      ) : favoritedTools.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-[14px] text-secondary-text">还没有收藏任何工具</p>
          <p className="mt-1 text-[13px] text-muted-text">在工具卡片上点击 ☆ 即可收藏。</p>
          <Link href="/tools" className="mt-5 inline-block">
            <Button>浏览工具</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {favoritedTools.map((tool) => (
            <ToolCard
              key={tool.slug}
              tool={tool}
              favorited
              onToggleFavorite={(slug) => toggleFavorite.mutate({ slug, favorited: true })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
