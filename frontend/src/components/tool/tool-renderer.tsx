"use client";

import { useAuth } from "@/features/auth/auth-provider";
import { recordLocalRecent } from "@/lib/recent";
import { api } from "@/lib/api";
import type { Tool } from "@toolbox/api-client";
import { useEffect } from "react";
import { JsonFormatterTool } from "@/components/tool/json-formatter-tool";
import { PromptManagerTool } from "@/components/tool/prompt-manager-tool";
import { Spinner } from "@/components/ui/primitives";

interface ToolRendererProps {
  tool: Tool;
}

/**
 * Unified tool workspace mount point. Custom tools own their entire
 * workspace; standard UI types get shared layouts. New tools must NOT
 * require changes here unless they introduce a genuinely new UI type.
 */
export function ToolRenderer({ tool }: ToolRendererProps) {
  const { user } = useAuth();

  // Usage history: server-side for logged-in users, localStorage otherwise.
  // Records who used which tool when — never tool input (design doc §23).
  useEffect(() => {
    if (user) {
      api().history.record(tool.slug).catch(() => {});
    } else {
      recordLocalRecent(tool.slug);
    }
  }, [tool.slug, user]);

  if (tool.slug === "prompt-manager") {
    return <PromptManagerTool />;
  }

  if (tool.slug === "json-formatter") {
    return <JsonFormatterTool tool={tool} />;
  }

  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <Spinner />
    </div>
  );
}
