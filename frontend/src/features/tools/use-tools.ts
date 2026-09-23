"use client";

import { api } from "@/lib/api";
import type { Favorite, Tool } from "@toolbox/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getLocalRecent } from "@/lib/recent";
import { useAuth } from "@/features/auth/auth-provider";

export function useTools() {
  return useQuery({
    queryKey: ["tools"],
    queryFn: () => api().tools.list(),
    staleTime: 5 * 60_000,
  });
}

export function useTool(slug: string | undefined) {
  return useQuery({
    queryKey: ["tools", slug],
    queryFn: () => api().tools.get(slug!),
    enabled: slug !== undefined,
    staleTime: 5 * 60_000,
  });
}

export function useFavorites() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["favorites"],
    queryFn: () => api().favorites.list(),
    enabled: user !== null,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, favorited }: { slug: string; favorited: boolean }) =>
      favorited ? api().favorites.remove(slug) : api().favorites.add(slug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });
}

export function favoriteSlugs(favorites: Favorite[] | undefined): Set<string> {
  return new Set((favorites ?? []).map((f) => f.tool_slug));
}

/**
 * Recent tools: server history for logged-in users, localStorage otherwise.
 * `localStorageDone` avoids hydration mismatch — local recent only reads
 * after mount.
 */
export function useRecentSlugs(localStorageDone: boolean): { slugs: string[]; isLoading: boolean } {
  const { user } = useAuth();
  const [localSlugs, setLocalSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (localStorageDone) setLocalSlugs(getLocalRecent());
  }, [localStorageDone]);

  const { data, isLoading } = useQuery({
    queryKey: ["history", "recent"],
    queryFn: () => api().history.recent(8),
    enabled: user !== null,
  });

  if (user) return { slugs: data ?? [], isLoading };
  return { slugs: localSlugs, isLoading: !localStorageDone };
}
