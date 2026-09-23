"use client";

import { useState } from "react";
import { countText } from "@/lib/tools/word-counter";
import { ToolBody, ToolPane } from "@/components/tool/tool-shell";

const STAT_CARDS = [
  { key: "characters", label: "字符数" },
  { key: "charactersWithoutSpaces", label: "不含空格" },
  { key: "words", label: "词数" },
  { key: "lines", label: "行数" },
  { key: "paragraphs", label: "段落数" },
] as const;

/** Word Counter — statistics update as the user types, fully local. */
export function WordCounterTool() {
  const [text, setText] = useState("");
  const stats = countText(text);

  return (
    <ToolBody>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className="rounded-md border border-border bg-panel p-3">
            <p className="text-[12px] text-secondary-text">{card.label}</p>
            <p className="mt-1 font-mono text-[20px] font-medium text-foreground">{stats[card.key]}</p>
          </div>
        ))}
      </div>

      <ToolPane label="输入文本" className="min-h-[240px]">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          spellCheck={false}
          placeholder="在此粘贴或输入文本…支持中英文混合统计"
          className="min-h-0 flex-1 resize-none bg-transparent p-3 text-[14px] leading-[1.7] text-foreground outline-none placeholder:text-muted-text"
        />
      </ToolPane>
    </ToolBody>
  );
}
