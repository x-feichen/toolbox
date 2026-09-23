"use client";

import { useState } from "react";
import { dateToTimestamp, formatTimestampResult, nowTimestamp } from "@/lib/tools/timestamp";
import type { TimestampUnit } from "@/lib/tools/timestamp";
import { Button } from "@/components/ui/primitives";
import { CopyButton, ToolActionsBar, ToolBody, ToolFeedback, ToolPane } from "@/components/tool/tool-shell";

type Unit = "seconds" | "milliseconds";

/** Timestamp ↔ date, both directions, no server involved. */
export function TimestampTool() {
  const [unit, setUnit] = useState<Unit>("seconds");
  const [tsInput, setTsInput] = useState("");
  const [tsResult, setTsResult] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState("");
  const [dateResult, setDateResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convertTsToDate = () => {
    const text = formatTimestampResult(tsInput, unit);
    if (text === null) {
      setError("请输入有效的整数时间戳");
      setTsResult(null);
      return;
    }
    setError(null);
    setTsResult(text);
  };

  const setNow = () => {
    const now = nowTimestamp();
    setTsInput(unit === "seconds" ? String(now.seconds) : String(now.milliseconds));
  };

  const stamp = dateToTimestamp(dateInput);

  return (
    <ToolBody>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Timestamp → Date */}
        <ToolPane label="时间戳 → 日期" className="min-h-[220px]">
          <div className="flex flex-col gap-3 p-3">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="text-secondary-text">单位</span>
              <Button variant={unit === "seconds" ? "primary" : "secondary"} onClick={() => setUnit("seconds")}>
                秒
              </Button>
              <Button
                variant={unit === "milliseconds" ? "primary" : "secondary"}
                onClick={() => setUnit("milliseconds")}
              >
                毫秒
              </Button>
            </div>
            <input
              value={tsInput}
              onChange={(event) => {
                setTsInput(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") convertTsToDate();
              }}
              placeholder={unit === "seconds" ? "例如 1710000000" : "例如 1710000000000"}
              aria-label="Unix 时间戳"
              className="h-9 w-full rounded-sm border border-border bg-panel px-3 font-mono text-[14px] text-foreground outline-none"
            />
            <div className="min-h-[36px] rounded-sm bg-muted px-3 py-2 font-mono text-[13px] text-foreground">
              {tsResult ?? <span className="text-muted-text">点击转换后显示本地时间</span>}
            </div>
          </div>
        </ToolPane>

        {/* Date → Timestamp */}
        <ToolPane label="日期 → 时间戳" className="min-h-[220px]">
          <div className="flex flex-col gap-3 p-3">
            <input
              type="datetime-local"
              value={dateInput}
              onChange={(event) => setDateInput(event.target.value)}
              aria-label="日期时间"
              className="h-9 w-full rounded-sm border border-border bg-panel px-3 text-[13px] text-foreground outline-none"
            />
            <div className="min-h-[36px] rounded-sm bg-muted px-3 py-2 font-mono text-[13px] text-foreground">
              {stamp === null ? (
                <span className="text-muted-text">选择日期后显示时间戳</span>
              ) : (
                `${unit === "seconds" ? stamp.seconds : stamp.milliseconds}`
              )}
            </div>
          </div>
        </ToolPane>
      </div>

      <ToolFeedback text={error} tone="error" />

      <ToolActionsBar>
        <Button variant="primary" onClick={convertTsToDate}>
          时间戳 → 日期
        </Button>
        <Button variant="ghost" onClick={setNow}>
          当前时间戳
        </Button>
        <div className="ml-auto flex gap-2">
          {tsResult && <CopyButton value={tsResult} label="复制转换结果" />}
          {stamp && <CopyButton value={String(unit === "seconds" ? stamp.seconds : stamp.milliseconds)} label="复制时间戳" />}
        </div>
      </ToolActionsBar>
    </ToolBody>
  );
}
