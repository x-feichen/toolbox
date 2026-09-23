"use client";

import { useAuth } from "@/features/auth/auth-provider";
import { recordLocalRecent } from "@/lib/recent";
import { api } from "@/lib/api";
import type { Tool } from "@toolbox/api-client";
import { ComponentType, useEffect } from "react";
import { JsonFormatterTool } from "@/components/tool/json-formatter-tool";
import { PromptManagerTool } from "@/components/tool/prompt-manager-tool";
import { UuidGeneratorTool } from "@/components/tool/uuid-generator-tool";
import { Base64Tool } from "@/components/tool/base64-tool";
import { UrlEncoderTool } from "@/components/tool/url-encoder-tool";
import { TimestampTool } from "@/components/tool/timestamp-tool";
import { WordCounterTool } from "@/components/tool/word-counter-tool";
import { CaseConverterTool } from "@/components/tool/case-converter-tool";
import { DuplicateLinesTool } from "@/components/tool/duplicate-lines-tool";
import { JwtDecoderTool } from "@/components/tool/jwt-decoder-tool";
import { TextDiffTool } from "@/components/tool/text-diff-tool";
import { CsvJsonTool } from "@/components/tool/csv-json-tool";
import { ImageCompressorTool } from "@/components/tool/image-compressor-tool";

/**
 * Client-tool component registry, keyed by tool slug. Adding a new client
 * tool = a manifest on the backend + one entry here; platform code (nav,
 * search, guards) stays untouched.
 */
const TOOL_COMPONENTS: Record<string, ComponentType<{ tool: Tool }>> = {
  "json-formatter": JsonFormatterTool,
  "uuid-generator": UuidGeneratorTool,
  "base64-tool": Base64Tool,
  "url-encoder": UrlEncoderTool,
  "timestamp-converter": TimestampTool,
  "word-counter": WordCounterTool,
  "case-converter": CaseConverterTool,
  "duplicate-lines": DuplicateLinesTool,
  "jwt-decoder": JwtDecoderTool,
  "text-diff": TextDiffTool,
  "csv-json": CsvJsonTool,
  "image-compressor": ImageCompressorTool,
  // authenticated + custom workspace
  "prompt-manager": PromptManagerTool,
};

interface ToolRendererProps {
  tool: Tool;
}

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

  const Component = TOOL_COMPONENTS[tool.slug];

  if (tool.slug === "prompt-manager") {
    return <PromptManagerTool />;
  }

  if (Component) {
    return <Component tool={tool} />;
  }

  return (
    <div className="flex min-h-[320px] items-center justify-center p-8 text-center">
      <p className="text-[13px] text-muted-text">该工具的工作区即将上线</p>
    </div>
  );
}
