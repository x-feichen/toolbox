"use client";

import { useAuth } from "@/features/auth/auth-provider";
import type { Tool } from "@toolbox/api-client";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button, Spinner } from "@/components/ui/primitives";

interface ToolAccessGuardProps {
  tool: Tool;
  children: React.ReactNode;
}

/**
 * Frontend access check is UX only (principle 6). Shows the friendly login
 * prompt instead of the workspace; the backend independently re-verifies
 * every protected API call.
 */
export function ToolAccessGuard({ tool, children }: ToolAccessGuardProps) {
  const { user, isLoading } = useAuth();

  if (!tool.requires_auth) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-md border border-border bg-panel p-8 text-center">
        <span className="mx-auto flex size-10 items-center justify-center rounded-sm bg-muted text-secondary-text">
          <Lock className="size-5" aria-hidden />
        </span>
        <h2 className="mt-4 text-[18px] font-semibold text-foreground">{tool.name}</h2>
        <p className="mt-1 text-[13px] text-secondary-text">{tool.description}</p>
        <p className="mt-4 text-[13px] text-secondary-text">此工具需要登录后使用，登录后才能访问你的个人数据。</p>
        <div className="mt-5 flex flex-col items-center gap-2">
          <Link
            href={`/login?next=${encodeURIComponent(`/tools?slug=${tool.slug}`)}`}
            className="w-full"
          >
            <Button variant="primary" className="w-full">
              登录
            </Button>
          </Link>
          <Link href="/register" className="text-[12px] text-muted-text hover:text-foreground">
            没有账号？立即注册
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
