"use client";

import { useAuth } from "@/features/auth/auth-provider";
import { useTools } from "@/features/tools/use-tools";
import { api } from "@/lib/api";
import { cn, categoryLabel } from "@/lib/utils";
import type { Tool } from "@toolbox/api-client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookMarked,
  Code2,
  Database,
  Home,
  Image as ImageIcon,
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

function SidebarContent({ tools, onNavigate }: { tools: Tool[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { open: openPalette } = useCommandPalette();

  const categories = [...new Set(tools.map((tool) => tool.category))];

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

      <nav className="flex flex-col gap-0.5 px-3" aria-label="主导航">
        <NavLink href="/" icon={<Home className="size-4" />} label="首页" active={isActive("/")} />
        <NavLink
          href="/tools"
          icon={<Wrench className="size-4" />}
          label="工具"
          active={isActive("/tools")}
        />
        <NavLink
          href="/favorites"
          icon={<BookMarked className="size-4" />}
          label="收藏"
          active={isActive("/favorites")}
        />
      </nav>

      <div className="mt-6 px-3">
        <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-text">
          分类
        </p>
        <nav className="flex flex-col gap-0.5" aria-label="工具分类">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/tools?category=${category}`}
              className="flex h-8 items-center gap-2 rounded-sm px-2 text-[13px] text-secondary-text hover:bg-muted hover:text-foreground"
            >
              <ToolCategoryIcon category={category} className="size-4" />
              {categoryLabel(category)}
            </Link>
          ))}
        </nav>
      </div>

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
