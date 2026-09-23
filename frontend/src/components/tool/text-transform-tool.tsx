"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { CopyButton, ToolActionsBar, ToolBody, ToolFeedback, ToolPane } from "@/components/tool/tool-shell";

export interface TransformAction {
  label: string;
  primary?: boolean;
  /** Throwing shows the message as error feedback (spec §33). */
  run: (input: string) => string;
}

interface TextTransformToolProps {
  inputPlaceholder: string;
  outputPlaceholder: string;
  actions: TransformAction[];
  /** Optional custom controls rendered after the action buttons. */
  controls?: React.ReactNode;
}

/**
 * Generic "text in → transform → text out" workspace shared by the Base64,
 * URL, Case and Duplicate-Lines tools. Everything runs in the browser.
 */
export function TextTransformTool({
  inputPlaceholder,
  outputPlaceholder,
  actions,
  controls,
}: TextTransformToolProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (action: TransformAction) => {
    try {
      setOutput(action.run(input));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "处理失败");
    }
  };

  return (
    <ToolBody>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <ToolPane label="输入" className="min-h-[240px]">
          <textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError(null);
            }}
            spellCheck={false}
            placeholder={inputPlaceholder}
            className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-[14px] leading-[1.6] text-foreground outline-none placeholder:text-muted-text"
          />
        </ToolPane>
        <ToolPane label="输出" className="min-h-[240px]">
          <textarea
            value={output}
            readOnly
            spellCheck={false}
            placeholder={outputPlaceholder}
            className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-[14px] leading-[1.6] text-foreground outline-none placeholder:text-muted-text"
          />
        </ToolPane>
      </div>

      <ToolFeedback text={error} tone="error" />

      <ToolActionsBar>
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.primary ? "primary" : "secondary"}
            onClick={() => run(action)}
          >
            {action.label}
          </Button>
        ))}
        {controls}
        <div className="ml-auto flex gap-2">
          <CopyButton value={output} />
          <Button
            variant="ghost"
            onClick={() => {
              setInput("");
              setOutput("");
              setError(null);
            }}
          >
            清空
          </Button>
        </div>
      </ToolActionsBar>
    </ToolBody>
  );
}
