"use client";

import { useToast } from "@/components/ui/toast";
import { formatJson, minifyJson, validateJson } from "@/lib/tools/json-formatter";
import type { Tool } from "@toolbox/api-client";
import { useState } from "react";
import { Button } from "@/components/ui/primitives";

const EXAMPLE = `{"name":"ToolBox","version":"0.1.0","tags":["fast","simple"],"nested":{"ok":true}}`;

/**
 * JSON Formatter — public + client execution (spec §30):
 * 50/50 split on desktop, stacked on mobile; ⌘/Ctrl+Enter executes.
 * Nothing leaves the browser.
 */
export function JsonFormatterTool({ tool }: { tool: Tool }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  const { showToast } = useToast();

  const apply = (action: "format" | "minify" | "validate") => {
    setError(null);
    if (action === "validate") {
      const result = validateJson(input);
      setValid(result.valid);
      setError(result.valid ? null : (result.message ?? null));
      if (result.valid) showToast("JSON 校验通过");
      return;
    }
    const result = action === "format" ? formatJson(input) : minifyJson(input);
    if (result.ok) {
      setOutput(result.value);
      setValid(true);
    } else {
      setError(result.message);
      setValid(false);
    }
  };

  const copyOutput = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    showToast("已复制到剪贴板");
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-120px)] flex-col gap-3 p-3 md:p-4">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Input */}
        <div className="flex min-h-[240px] flex-col overflow-hidden rounded-md border border-border bg-panel">
          <div className="border-b border-border px-3 py-2 text-[12px] text-secondary-text">输入</div>
          <textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setValid(null);
            }}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                apply("format");
              }
            }}
            spellCheck={false}
            placeholder={`在此粘贴 JSON…\n⌘/Ctrl + Enter 快速格式化`}
            className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-[14px] leading-[1.6] text-foreground outline-none placeholder:text-muted-text"
          />
        </div>

        {/* Output */}
        <div className="flex min-h-[240px] flex-col overflow-hidden rounded-md border border-border bg-panel">
          <div className="border-b border-border px-3 py-2 text-[12px] text-secondary-text">输出</div>
          <textarea
            value={output}
            readOnly
            spellCheck={false}
            placeholder="格式化结果会显示在这里"
            className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-[14px] leading-[1.6] text-foreground outline-none placeholder:text-muted-text"
          />
        </div>
      </div>

      {/* Error / validation feedback — only occupies space when there is
          something to say, keeping the divider close to the panels */}
      {(error || valid === true) && (
        <div aria-live="polite" className="text-[13px]">
          {error && <p className="text-error">{error}</p>}
          {!error && valid === true && <p className="text-success">✓ JSON 有效</p>}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button variant="primary" onClick={() => apply("format")}>
          格式化
        </Button>
        <Button onClick={() => apply("minify")}>压缩</Button>
        <Button onClick={() => apply("validate")}>校验</Button>
        <div className="ml-auto flex gap-2">
          <Button onClick={copyOutput}>复制</Button>
          <Button
            variant="ghost"
            onClick={() => {
              setInput("");
              setOutput("");
              setError(null);
              setValid(null);
            }}
          >
            清空
          </Button>
          <Button variant="ghost" onClick={() => setInput(EXAMPLE)}>
            示例
          </Button>
        </div>
      </div>
      <span className="sr-only">{tool.name}</span>
    </div>
  );
}
