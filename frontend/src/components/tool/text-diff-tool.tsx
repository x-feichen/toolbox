"use client";

import { useState } from "react";
import { diffLines, MAX_DIFF_LINES } from "@/lib/tools/text-diff";
import type { DiffRow, DiffRowType } from "@/lib/tools/text-diff";
import { Button } from "@/components/ui/primitives";
import { ToolActionsBar, ToolBody, ToolFeedback, ToolPane } from "@/components/tool/tool-shell";

const ROW_STYLES: Record<DiffRow["type"], string> = {
  equal: "text-muted-text",
  added: "bg-success/10 text-success",
  removed: "bg-error/10 text-error",
};

const ROW_PREFIX: Record<DiffRowType, string> = {
  equal: " ",
  added: "+",
  removed: "-",
};

/** Text Diff — line-level compare, rendered locally (spec §16 MVP). */
export function TextDiffTool() {
  const [original, setOriginal] = useState("");
  const [changed, setChanged] = useState("");
  const [rows, setRows] = useState<DiffRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compare = () => {
    try {
      setRows(diffLines(original, changed));
      setError(null);
    } catch (err) {
      setRows(null);
      setError(err instanceof Error ? err.message : "比较失败");
    }
  };

  const summary = rows
    ? {
        added: rows.filter((r) => r.type === "added").length,
        removed: rows.filter((r) => r.type === "removed").length,
        equal: rows.filter((r) => r.type === "equal").length,
      }
    : null;

  return (
    <ToolBody>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <ToolPane label="原始文本 (Original)" className="min-h-[200px]">
          <textarea
            value={original}
            onChange={(event) => {
              setOriginal(event.target.value);
              setError(null);
            }}
            spellCheck={false}
            placeholder="左侧：原始内容"
            className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-[13px] leading-[1.7] text-foreground outline-none placeholder:text-muted-text"
          />
        </ToolPane>
        <ToolPane label="修改后 (Changed)" className="min-h-[200px]">
          <textarea
            value={changed}
            onChange={(event) => {
              setChanged(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") compare();
            }}
            spellCheck={false}
            placeholder="右侧：修改后的内容"
            className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-[13px] leading-[1.7] text-foreground outline-none placeholder:text-muted-text"
          />
        </ToolPane>
      </div>

      <ToolFeedback text={error} tone="error" />

      {/* Diff result */}
      <div className="min-h-[160px] flex-1 overflow-y-auto rounded-md border border-border bg-panel" aria-label="差异结果">
        {rows === null ? (
          <p className="p-6 text-center text-[13px] text-muted-text">点击「比较」查看差异</p>
        ) : (
          <ul className="p-2 font-mono text-[13px] leading-[1.7]">
            {rows.map((row, index) => (
              <li
                key={index}
                className={`flex gap-2 rounded-sm px-2 ${ROW_STYLES[row.type]}`}
              >
                <span className="w-4 shrink-0 select-none font-medium">{ROW_PREFIX[row.type]}</span>
                <span className="min-w-0 flex-1 whitespace-pre-wrap break-all">{row.text || " "}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ToolActionsBar>
        <Button variant="primary" onClick={compare}>
          比较
        </Button>
        <Button variant="ghost" onClick={() => { setOriginal(""); setChanged(""); setRows(null); setError(null); }}>
          清空
        </Button>
        {summary && (
          <span className="ml-auto text-[12px] text-secondary-text">
            新增 {summary.added} · 删除 {summary.removed} · 保留 {summary.equal}（上限 {MAX_DIFF_LINES} 行）
          </span>
        )}
      </ToolActionsBar>
    </ToolBody>
  );
}
