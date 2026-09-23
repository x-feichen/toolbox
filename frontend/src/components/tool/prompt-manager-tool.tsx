"use client";

import { useAuth } from "@/features/auth/auth-provider";
import { api } from "@/lib/api";
import type { Prompt } from "@toolbox/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button, Input, Spinner } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Plus, Star, Trash2 } from "lucide-react";

type Folder = { key: string; label: string };

/**
 * Prompt Manager — authenticated + server + custom workspace (spec §32):
 * three-pane on desktop; folders → list → editor on mobile (spec §33).
 */
export function PromptManagerTool() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [folder, setFolder] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ title: string; content: string; category: string }>({
    title: "",
    content: "",
    category: "",
  });
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ["prompts"],
    queryFn: () => api().prompts.list(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["prompts", "categories"],
    queryFn: () => api().prompts.categories(),
  });

  const folders: Folder[] = [
    { key: "all", label: "全部" },
    { key: "favorites", label: "收藏" },
    ...categories.map((c) => ({ key: `cat:${c}`, label: c })),
  ];

  const visible = prompts.filter((p) => {
    if (folder === "all") return true;
    if (folder === "favorites") return p.is_favorite;
    if (folder.startsWith("cat:")) return p.category === folder.slice(4);
    return true;
  });

  const selected = prompts.find((p) => p.id === selectedId) ?? null;

  // Select the first prompt once the list loads (or after filtering).
  useEffect(() => {
    if (selectedId && prompts.some((p) => p.id === selectedId)) return;
    setSelectedId(visible[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompts, folder]);

  useEffect(() => {
    if (selected) {
      setDraft({
        title: selected.title,
        content: selected.content,
        category: selected.category,
      });
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["prompts"] });
  };

  const createMutation = useMutation({
    mutationFn: () => api().prompts.create({ title: "未命名 Prompt", content: "" }),
    onSuccess: (prompt) => {
      invalidate();
      setSelectedId(prompt.id);
      setMobileView("editor");
      showToast("已创建");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Prompt> }) =>
      api().prompts.update(id, patch),
    onSuccess: () => {
      invalidate();
      showToast("已保存");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api().prompts.remove(id),
    onSuccess: (_data, id) => {
      invalidate();
      if (selectedId === id) setSelectedId(null);
      setMobileView("list");
      showToast("已删除");
    },
  });

  const save = () => {
    if (!selected) return;
    updateMutation.mutate({
      id: selected.id,
      patch: {
        title: draft.title.trim() || "未命名 Prompt",
        content: draft.content,
        category: draft.category.trim(),
      },
    });
  };

  const toggleFavorite = (prompt: Prompt) =>
    updateMutation.mutate({ id: prompt.id, patch: { is_favorite: !prompt.is_favorite } });

  const editorPane = selected ? (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <Input
          value={draft.title}
          onChange={(event) => setDraft((d) => ({ ...d, title: event.target.value }))}
          placeholder="Prompt 标题"
          aria-label="Prompt 标题"
          className="border-0 bg-transparent px-0 text-[15px] font-medium focus-visible:outline-none"
        />
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <button
            aria-label={selected.is_favorite ? "取消收藏" : "收藏"}
            onClick={() => toggleFavorite(selected)}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-sm hover:bg-muted",
              selected.is_favorite ? "text-warning" : "text-muted-text",
            )}
          >
            <Star className="size-4" fill={selected.is_favorite ? "currentColor" : "none"} />
          </button>
          <button
            aria-label="删除 Prompt"
            onClick={() => {
              if (window.confirm(`确定删除「${selected.title}」？此操作不可恢复。`)) {
                deleteMutation.mutate(selected.id);
              }
            }}
            className="inline-flex size-8 items-center justify-center rounded-sm text-muted-text hover:bg-muted hover:text-error"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <Input
          value={draft.category}
          onChange={(event) => setDraft((d) => ({ ...d, category: event.target.value }))}
          placeholder="分类（可选，如：写作 / 编码）"
          aria-label="分类"
        />
        <textarea
          value={draft.content}
          onChange={(event) => setDraft((d) => ({ ...d, content: event.target.value }))}
          placeholder="写下你的 Prompt…"
          spellCheck={false}
          className="min-h-0 flex-1 resize-none rounded-sm border border-border bg-panel p-3 font-mono text-[13px] leading-[1.7] text-foreground outline-none placeholder:text-muted-text"
        />
        <div className="flex items-center gap-2">
          <Button variant="primary" loading={updateMutation.isPending} onClick={save}>
            保存
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              selected && setDraft({ title: selected.title, content: selected.content, category: selected.category })
            }
          >
            放弃更改
          </Button>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex h-full items-center justify-center p-8 text-center">
      <div>
        <p className="text-[14px] text-secondary-text">No prompts yet</p>
        <p className="mt-1 text-[13px] text-muted-text">创建你的第一个 Prompt 开始使用。</p>
        <Button variant="primary" className="mt-4" onClick={() => createMutation.mutate()}>
          创建 Prompt
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-48px)] md:h-[calc(100vh-0px)]">
      {/* Folders (220px) — hidden on mobile list view */}
      <aside
        className={cn(
          "w-[220px] shrink-0 border-r border-border bg-secondary p-3",
          mobileView === "editor" && "hidden md:block",
        )}
      >
        <Button variant="primary" className="w-full" onClick={() => createMutation.mutate()}>
          <Plus className="size-4" aria-hidden />
          新建
        </Button>
        <nav className="mt-3 flex flex-col gap-0.5" aria-label="Prompt 分组">
          {folders.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFolder(f.key);
                setMobileView("list");
              }}
              className={cn(
                "flex h-8 items-center rounded-sm px-2 text-left text-[13px]",
                folder === f.key
                  ? "bg-muted font-medium text-foreground"
                  : "text-secondary-text hover:bg-muted hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Prompt list (280px) */}
      <section
        className={cn(
          "w-full shrink-0 overflow-y-auto border-r border-border md:w-[280px]",
          mobileView === "editor" && "hidden md:block",
        )}
        aria-label="Prompt 列表"
      >
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : visible.length === 0 ? (
          <p className="p-6 text-center text-[13px] text-muted-text">这里还没有 Prompt</p>
        ) : (
          <ul className="p-2">
            {visible.map((prompt) => (
              <li key={prompt.id}>
                <button
                  onClick={() => {
                    setSelectedId(prompt.id);
                    setMobileView("editor");
                  }}
                  className={cn(
                    "w-full rounded-sm px-3 py-2 text-left",
                    selectedId === prompt.id ? "bg-muted" : "hover:bg-muted/60",
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                      {prompt.title}
                    </span>
                    {prompt.is_favorite && (
                      <Star className="size-3 shrink-0 text-warning" fill="currentColor" aria-hidden />
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-muted-text">
                    {prompt.category || "未分类"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Editor (flex) */}
      <section className="min-w-0 flex-1" aria-label="Prompt 编辑器">
        {mobileView === "list" ? (
          <div className="hidden md:block">{editorPane}</div>
        ) : (
          <div className="h-full">{editorPane}</div>
        )}
        {mobileView === "editor" && (
          <Button variant="ghost" className="m-3 md:hidden" onClick={() => setMobileView("list")}>
            ← 返回列表
          </Button>
        )}
      </section>
    </div>
  );
}
