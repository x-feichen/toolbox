"use client";

import { categoryLabel } from "@/lib/utils";
import type { Tool } from "@toolbox/api-client";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search } from "lucide-react";
import { useTools } from "@/features/tools/use-tools";

const PaletteContext = createContext<{ open: () => void }>({ open: () => {} });

export function useCommandPalette() {
  return useContext(PaletteContext);
}

/**
 * Command Palette (⌘K / Ctrl K) — Search First navigation (spec §39-40).
 * Searches tool name, description, category and tags.
 */
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <PaletteContext.Provider value={{ open }}>
      {children}
      {isOpen && <PaletteOverlay onClose={close} />}
    </PaletteContext.Provider>
  );
}

function score(tool: Tool, query: string): number {
  const q = query.toLowerCase();
  if (!q) return 1;
  let s = 0;
  if (tool.name.toLowerCase().includes(q)) s += 4;
  if (tool.description.toLowerCase().includes(q)) s += 2;
  if (tool.slug.includes(q)) s += 2;
  if (categoryLabel(tool.category).includes(q)) s += 1;
  if (tool.tags.some((tag) => tag.toLowerCase().includes(q))) s += 1;
  return s;
}

function PaletteOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: tools = [], isLoading } = useTools();

  const results = useMemo(() => {
    const filtered = tools
      .map((tool) => ({ tool, s: score(tool, query) }))
      .filter((entry) => entry.s > 0)
      .sort((a, b) => b.s - a.s);
    return filtered.map((entry) => entry.tool);
  }, [tools, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const select = (tool: Tool) => {
    onClose();
    router.push(`/tools?slug=${tool.slug}`);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      select(results[active]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40"
      onClick={onClose}
      onKeyDown={onKeyDown}
      role="presentation"
    >
      <div
        role="dialog"
        aria-label="搜索工具"
        className="mx-auto mt-[max(5rem,12vh)] flex w-[min(560px,92vw)] max-h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-lg border border-border bg-panel shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-4">
          <Search className="size-4 text-muted-text" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools..."
            aria-label="搜索工具"
            className="h-12 w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-text"
          />
          <kbd className="rounded-sm bg-muted px-1.5 py-0.5 text-[11px] text-muted-text">Esc</kbd>
        </div>

        <div className="min-h-0 max-h-[360px] flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <p className="px-3 py-6 text-center text-[13px] text-muted-text">Loading...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-muted-text">没有匹配的工具</p>
          ) : (
            <ul>
              {results.map((tool, index) => (
                <li key={tool.slug}>
                  <button
                    onClick={() => select(tool)}
                    onMouseEnter={() => setActive(index)}
                    className={`flex w-full items-center justify-between rounded-sm px-3 py-2 text-left ${
                      index === active ? "bg-muted" : ""
                    }`}
                  >
                    <span>
                      <span className="block text-[13px] font-medium text-foreground">
                        {tool.name}
                      </span>
                      <span className="block text-[12px] text-secondary-text">
                        {tool.description}
                      </span>
                    </span>
                    {index === active && (
                      <kbd className="text-[11px] text-muted-text">↵</kbd>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-text">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    </div>
  );
}
