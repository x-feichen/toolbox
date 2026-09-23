"use client";

import { api } from "@/lib/api";
import { fillPromptVariables, parsePromptVariables } from "@/lib/tools/prompt-variables";
import type { Prompt } from "@toolbox/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Button, Input, Spinner } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ClipboardCopy, Plus, Search, Star, Trash2 } from "lucide-react";

/**
 * 提示词工具 — authenticated + server + custom workspace:
 * left column = search + full list + [新建] pinned at the bottom;
 * right column = editor with a fixed bottom action bar. `{{var}}`
 * placeholders are detected, fillable, and copyable as a complete prompt.
 */
export function PromptManagerTool() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ title: string; content: string; category: string }>({
    title: "",
    content: "",
    category: "",
  });
  const [fillValues, setFillValues] = useState<Record<string, string>>({});
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ["prompts"],
    queryFn: () => api().prompts.list(),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return prompts;
    return prompts.filter((p) => p.title.toLowerCase().includes(q));
  }, [prompts, search]);

  const selected = prompts.find((p) => p.id === selectedId) ?? null;

  // Keep a valid selection as the list/filter changes.
  useEffect(() => {
    if (selectedId && filtered.some((p) => p.id === selectedId)) return;
    setSelectedId(filtered[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompts, search]);

  useEffect(() => {
    if (selected) {
      setDraft({
        title: selected.title,
        content: selected.content,
        category: selected.category,
      });
    }
    setFillValues({});
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["prompts"] });
  };

  const createMutation = useMutation({
    mutationFn: () => api().prompts.create({ title: "未命名提示词", content: "" }),
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
        title: draft.title.trim() || "未命名提示词",
        content: draft.content,
        category: draft.category.trim(),
      },
    });
  };

  const toggleFavorite = (prompt: Prompt) =>
    updateMutation.mutate({ id: prompt.id, patch: { is_favorite: !prompt.is_favorite } });

  // Variables come from the saved content (what the user would copy/share).
  const variables = useMemo(
    () => parsePromptVariables(selected?.content ?? ""),
    [selected?.content],
  );

  const fullPrompt = selected ? fillPromptVariables(selected.content, fillValues) : "";

  const copyFullPrompt = async () => {
    if (!selected) return;
    await navigator.clipboard.writeText(fullPrompt);
    showToast("已复制完整提示词");
  };

  const listPane = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-text" aria-hidden />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索提示词…"
            aria-label="搜索提示词"
            className="pl-8"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2" aria-label="提示词列表">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-[13px] text-muted-text">
            {search ? "没有匹配的提示词" : "这里还没有提示词"}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {filtered.map((prompt) => (
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
                  {prompt.category && (
                    <span className="mt-0.5 block truncate text-[12px] text-muted-text">
                      {prompt.category}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <Button variant="primary" className="w-full" onClick={() => createMutation.mutate()}>
          <Plus className="size-4" aria-hidden />
          新建
        </Button>
      </div>
    </div>
  );

  const variablesPane =
    selected && variables.length > 0 ? (
      <div className="shrink-0 border-t border-border bg-secondary/60 p-3">
        <p className="mb-2 text-[12px] font-medium text-secondary-text">
          变量填充（共 {variables.length} 个，未填写的保留占位符）
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {variables.map((name) => (
            <label key={name} className="flex items-center gap-2">
              <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[11px] text-secondary-text">
                {name}
              </span>
              <Input
                value={fillValues[name] ?? ""}
                onChange={(event) =>
                  setFillValues((prev) => ({ ...prev, [name]: event.target.value }))
                }
                placeholder={`填充 ${name}`}
                aria-label={`填充变量 ${name}`}
                className="h-8"
              />
            </label>
          ))}
        </div>
      </div>
    ) : null;

  const editorPane = selected ? (
    <div className="flex h-full min-h-0 flex-col">
      {/* Title row */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2">
        <Input
          value={draft.title}
          onChange={(event) => setDraft((d) => ({ ...d, title: event.target.value }))}
          placeholder="提示词标题"
          aria-label="提示词标题"
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
            aria-label="删除提示词"
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

      {/* Scrollable editor body — the action bar below never moves */}
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
          placeholder="写下你的提示词，用 {{变量}} 标记可填充的部分，例如：你是一名产品经理，请分析 {{需求}}"
          spellCheck={false}
          className="min-h-[160px] flex-1 resize-none rounded-sm border border-border bg-panel p-3 font-mono text-[13px] leading-[1.7] text-foreground outline-none placeholder:text-muted-text"
        />
      </div>

      {/* Variable fill area (fixed above the action bar) */}
      {variablesPane}

      {/* Fixed action bar — pinned at the bottom edge */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border px-4 py-3">
        <Button
          onClick={async () => {
            if (!selected) return;
            await navigator.clipboard.writeText(fullPrompt);
            showToast("已复制完整提示词");
          }}
        >
          <ClipboardCopy className="size-4" aria-hidden />
          复制完整提示词
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="primary" loading={updateMutation.isPending} onClick={save}>
            保存
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              selected &&
              setDraft({ title: selected.title, content: selected.content, category: selected.category })
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
        <p className="mt-1 text-[13px] text-muted-text">创建你的第一个提示词开始使用。</p>
        <Button variant="primary" className="mt-4" onClick={() => createMutation.mutate()}>
          创建提示词
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-[calc(100vh-140px)]">
      {/* List */}
      <aside
        className={cn(
          "w-full shrink-0 border-r border-border bg-secondary md:flex md:h-full md:w-[300px]",
          mobileView === "editor" && "hidden",
        )}
      >
        {listPane}
      </aside>

      {/* Editor */}
      <section className={cn("min-w-0 flex-1", mobileView === "list" && "hidden md:block")} aria-label="提示词编辑器">
        {editorPane}
      </section>

      {mobileView === "editor" && (
        <Button variant="ghost" className="fixed bottom-4 left-4 z-10 md:hidden" onClick={() => setMobileView("list")}>
          ← 返回列表
        </Button>
      )}
    </div>
  );
}
