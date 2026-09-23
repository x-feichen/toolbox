"use client";

import { generateUuids } from "@/lib/tools/uuid-generator";
import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { CopyButton, ToolActionsBar, ToolBody, ToolFeedback } from "@/components/tool/tool-shell";

const COUNTS = [1, 5, 10] as const;

export function UuidGeneratorTool() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState<number>(1);

  return (
    <ToolBody>
      <ToolActionsBar>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-secondary-text">生成数量</span>
          {COUNTS.map((c) => (
            <Button
              key={c}
              variant={c === count ? "primary" : "secondary"}
              onClick={() => setCount(c)}
            >
              {c}
            </Button>
          ))}
        </div>
        <Button variant="primary" onClick={() => setUuids(generateUuids(count))}>
          生成
        </Button>
        {uuids.length > 0 && (
          <Button variant="ghost" onClick={() => setUuids([])}>
            清空
          </Button>
        )}
      </ToolActionsBar>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border bg-panel p-3">
        {uuids.length === 0 ? (
          <p className="p-8 text-center text-[13px] text-muted-text">点击生成，UUID 不会离开浏览器</p>
        ) : (
          <ul className="flex flex-col gap-1 font-mono text-[13px]">
            {uuids.map((uuid, index) => (
              <li key={uuid} className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-right text-muted-text">{index + 1}</span>
                <code className="min-w-0 flex-1 truncate text-foreground">{uuid}</code>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ToolFeedback text={null} tone="success" />
      {uuids.length > 0 && (
        <ToolActionsBar>
          <CopyButton value={uuids.join("\n")} />
        </ToolActionsBar>
      )}
    </ToolBody>
  );
}
