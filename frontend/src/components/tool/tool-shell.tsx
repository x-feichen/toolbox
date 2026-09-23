"use client";

import { Button } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Shared workspace scaffolding so every client tool follows the same
 * layout rhythm (ToolBody → content → ToolActionsBar) and the bottom
 * divider aligns with the sidebar account divider.
 */

export function ToolBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-full min-h-[calc(100vh-120px)] flex-col gap-3 p-3 md:px-4 md:pt-4", className)}>
      {children}
    </div>
  );
}

export function ToolActionsBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-3">
      {children}
    </div>
  );
}

export function ToolPane({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-h-[200px] flex-col overflow-hidden rounded-md border border-border bg-panel", className)}>
      <div className="border-b border-border px-3 py-2 text-[12px] text-secondary-text">{label}</div>
      {children}
    </div>
  );
}

export function ToolFeedback({ text, tone }: { text: string | null; tone: "success" | "error" }) {
  if (!text) return null;
  return (
    <div aria-live="polite" className={cn("text-[13px]", tone === "error" ? "text-error" : "text-success")}>
      {text}
    </div>
  );
}

export function CopyButton({ value, label = "复制" }: { value: string; label?: string }) {
  const { showToast } = useToast();
  return (
    <Button
      onClick={async () => {
        if (!value) return;
        await navigator.clipboard.writeText(value);
        showToast("已复制到剪贴板");
      }}
    >
      {label}
    </Button>
  );
}
