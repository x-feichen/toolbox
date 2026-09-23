"use client";

import { api } from "@/lib/api";
import { fillPromptVariables, parsePromptVariables } from "@/lib/tools/prompt-variables";
import type { Prompt } from "@toolbox/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Button, Input, Spinner } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ArrowUpToLine, ClipboardCopy, Pin, Plus, Search, Trash2 } from "lucide-react";

/** Draft tracks which prompt it belongs to, so switching selection (create /
 * delete / navigate) always resets the editor instead of leaking old content. */
interface Draft {
  id: string;
  title: string;
  content: string;
}

/**
 * 提示词工具 — authenticated + server + custom workspace:
 * left = search + list + [新建] pinned at the bottom; right = editor with a
 * fixed action bar. Pinned prompts come first (server-side ordering).
 */
export function PromptManagerTool() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ id: "", title: "", content: "" });
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

  // Reset the draft whenever the editor target actually changes (different
  // prompt id, or the prompt's saved data arrives after a refetch).
  useEffect(() => {
    if (!selected) {
      setFillValues({});
      return;
    }
    if (draft.id === selected.id) return; // user is editing; do not clobber
    setDraft({ id: selected.id, title: selected.title, content: selected.content });
    setFillValues({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.title, selected?.content]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["prompts"] });
  };

  const createMutation = useMutation({
    mutationFn: () => api().prompts.create({ title: "未命名提示词", content: "" }),
    onSuccess: (prompt) => {
      invalidate();
      setSelectedId(prompt.id);
      // Draft resets the moment the new prompt appears in the list.
      setMobileView("editor");
      showToast("已创建");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Prompt> }) =>
      api().prompts.update(id, patch),
    onSuccess: (updated) => {
      invalidate();
      // Keep the editor in sync with saved content immediately.
      setDraft({ id: updated.id, title: updated.title, content: updated.content });
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
    if (!selected || draft.id !== selected.id) return;
    updateMutation.mutate({
      id: selected.id,
      patch: {
        title: draft.title.trim() || "未命名提示词",
        content: draft.content,
      },
    });
  };

  const togglePin = (prompt: Prompt) =>
    updateMutation.mutate({ id: prompt.id, patch: { is_pinned: !prompt.is_pinned } });

  // Variables come from the saved content (what the user would copy/share).
  const variables = useMemo(
    () => parsePromptVariables(selected?.content ?? ""),
    [selected?.content],
  );

  const fullPrompt = selected ? fillPromptVariables(selected.content, fillValues) : "";

  const listPane = (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
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

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2" aria-label="提示词列表">
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
                    "flex w-full items-center gap-1.5 rounded-sm px-3 py-2 text-left",
                    selectedId === prompt.id ? "bg-muted" : "hover:bg-muted/60",
                  )}
                >
                  {prompt.is_pinned && (
                    <Pin
                      className="size-3 shrink-0 text-accent"
                      fill="currentColor"
                      aria-label="已置顶"
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                    {prompt.title}
                  </span>
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
            aria-label={selected.is_pinned ? "取消置顶" : "置顶"}
            title={selected.is_pinned ? "取消置顶" : "置顶"}
            onClick={() => togglePin(selected)}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-sm hover:bg-muted",
              selected.is_pinned ? "text-accent" : "text-muted-text",
            )}
          >
            <ArrowUpToLine className="size-4" />
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
      <div className="flex min-h-0 flex-1 flex-col p-4">
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
            await navigator.clipboard.writeText(fillPromptVariables(selected.content, fillValues));
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
              selected && setDraft({ id: selected.id, title: selected.title, content: selected.content })
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
