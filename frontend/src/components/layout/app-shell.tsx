"use client";

import { useAuth } from "@/features/auth/auth-provider";
import { useTools } from "@/features/tools/use-tools";
import { api } from "@/lib/api";
import { cn, categoryLabel } from "@/lib/utils";
import type { Tool } from "@toolbox/api-client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  BookMarked,
  ChevronDown,
  ChevronRight,
  Code2,
  Database,
  Home,
  Image as ImageIcon,
  Lock,
  Search,
  Shapes,
  Sparkles,
  Type,
  Wrench,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme";
import { useCommandPalette } from "@/components/command/command-palette";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  developer: Code2,
  text: Type,
  data: Database,
  image: ImageIcon,
  ai: Sparkles,
  other: Shapes,
};

export function ToolCategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICONS[category] ?? Shapes;
  return <Icon className={className} />;
}

/** 固定分类清单（产品确定，见设计文档信息架构）。 */
const FIXED_CATEGORIES = ["developer", "text", "data", "image", "ai", "other"] as const;

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon?: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-8 items-center gap-2 rounded-sm px-2 text-[13px]",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-secondary-text hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

/**
 * 侧边栏「工具」可折叠树：工具 → 固定分类 → 分类下的工具。
 * 选中工具的分类自动展开；空分类显示占位说明。
 */
function ToolsTree({ tools, onNavigate }: { tools: Tool[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("slug") ?? "";
  const activeTool = tools.find((tool) => tool.slug === activeSlug);

  const [toolsOpen, setToolsOpen] = useState(true);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  // Auto-expand the category of the currently selected tool.
  useEffect(() => {
    if (activeTool && !openCats.has(activeTool.category)) {
      setOpenCats((prev) => new Set(prev).add(activeTool.category));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool?.category, activeSlug]);

  const toggleCat = (category: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={() => setToolsOpen((v) => !v)}
        aria-expanded={toolsOpen}
        className={cn(
          "flex h-8 items-center gap-2 rounded-sm px-2 text-[13px]",
          pathname === "/tools"
            ? "font-medium text-foreground"
            : "text-secondary-text hover:bg-muted hover:text-foreground",
        )}
      >
        <Wrench className="size-4" />
        工具
        <ChevronDown
          className={cn(
            "ml-auto size-3.5 text-muted-text transition-transform duration-150",
            !toolsOpen && "-rotate-90",
          )}
          aria-hidden
        />
      </button>

      {toolsOpen &&
        FIXED_CATEGORIES.map((category) => {
          const categoryTools = tools.filter((tool) => tool.category === category);
          const isOpen = openCats.has(category);
          return (
            <div key={category}>
              <button
                onClick={() => toggleCat(category)}
                aria-expanded={isOpen}
                className="flex h-8 w-full items-center gap-2 rounded-sm py-0 pl-6 pr-2 text-[13px] text-secondary-text hover:bg-muted hover:text-foreground"
              >
                <ToolCategoryIcon category={category} className="size-3.5" />
                <span className="truncate">{categoryLabel(category)}</span>
                {categoryTools.length > 0 && (
                  <ChevronRight
                    className={cn(
                      "ml-auto size-3 text-muted-text transition-transform duration-150",
                      isOpen && "rotate-90",
                    )}
                    aria-hidden
                  />
                )}
              </button>

              {isOpen &&
                (categoryTools.length > 0 ? (
                  categoryTools.map((tool) => {
                    const href = `/tools?category=${tool.category}&slug=${tool.slug}`;
                    const active = tool.slug === activeSlug && pathname === "/tools";
                    return (
                      <Link
                        key={tool.slug}
                        href={href}
                        onClick={onNavigate}
                        className={cn(
                          "flex h-8 items-center gap-2 rounded-sm py-0 pl-10 pr-2 text-[13px]",
                          active
                            ? "bg-muted font-medium text-foreground"
                            : "text-secondary-text hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">{tool.name}</span>
                        {tool.requires_auth && (
                          <Lock className="size-3 shrink-0 text-muted-text" aria-label="需要登录" />
                        )}
                      </Link>
                    );
                  })
                ) : (
                  <p className="py-1 pl-10 pr-2 text-[12px] text-muted-text">暂无工具</p>
                ))}
            </div>
          );
        })}
    </div>
  );
}

function SidebarContent({ tools, onNavigate }: { tools: Tool[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { open: openPalette } = useCommandPalette();

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-full flex-col" onClick={onNavigate}>
      <Link href="/" className="flex h-12 items-center px-4 text-[15px] font-semibold text-foreground">
        ToolBox
      </Link>

      <div className="px-3 pb-2">
        <button
          onClick={() => {
            onNavigate?.();
            openPalette();
          }}
          className="flex h-8 w-full items-center gap-2 rounded-sm border border-border bg-secondary px-2 text-[13px] text-muted-text hover:border-accent/40"
        >
          <Search className="size-3.5" aria-hidden />
          Search
          <kbd className="ml-auto text-[11px]">⌘K</kbd>
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 overflow-y-auto px-3" aria-label="主导航">
        <NavLink href="/" icon={<Home className="size-4" />} label="首页" active={isActive("/")} />
        <Suspense fallback={null}>
          <ToolsTree tools={tools} onNavigate={onNavigate} />
        </Suspense>
        <NavLink
          href="/favorites"
          icon={<BookMarked className="size-4" />}
          label="收藏"
          active={isActive("/favorites")}
        />
      </nav>

      <div className="mt-auto border-t border-border p-3">
        {isLoading ? null : user ? (
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-accent/15 text-[12px] font-medium text-accent">
              {(user.display_name ?? user.email).slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
              {user.display_name ?? user.email}
            </span>
            <button
              onClick={async () => {
                await api().auth.logout();
                router.push("/");
                router.refresh();
              }}
              className="text-[12px] text-muted-text hover:text-foreground"
            >
              退出
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex h-8 items-center justify-center rounded-sm bg-accent text-[13px] font-medium text-accent-fg hover:bg-accent-hover"
          >
            登录
          </Link>
        )}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: tools = [] } = useTools();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { open: openPalette } = useCommandPalette();

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar (≥768px): 232px per spec §5 */}
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 border-r border-border bg-secondary md:block">
        <SidebarContent tools={tools} />
      </aside>

      {/* Mobile top header */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-border bg-panel px-4 md:hidden">
          <button
            aria-label="打开菜单"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex size-8 items-center justify-center rounded-sm text-secondary-text hover:bg-muted"
          >
            ☰
          </button>
          <Link href="/" className="text-[15px] font-semibold text-foreground">
            ToolBox
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <button
              aria-label="搜索工具"
              onClick={openPalette}
              className="inline-flex size-8 items-center justify-center rounded-sm text-secondary-text hover:bg-muted"
            >
              <Search className="size-4" />
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="presentation" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute inset-y-0 left-0 w-[280px] border-r border-border bg-secondary"
            onClick={(event) => event.stopPropagation()}
          >
            <SidebarContent tools={tools} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
