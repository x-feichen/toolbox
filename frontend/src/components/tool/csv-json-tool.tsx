"use client";

import { useState } from "react";
import { csvToJson, jsonToCsv } from "@/lib/tools/csv-json";
import { Button } from "@/components/ui/primitives";
import { CopyButton, ToolActionsBar, ToolBody, ToolFeedback, ToolPane } from "@/components/tool/tool-shell";

type Direction = "csvToJson" | "jsonToCsv";

/** CSV ↔ JSON bidirectional conversion with a proper RFC-4180 parser. */
export function CsvJsonTool() {
  const [direction, setDirection] = useState<Direction>("csvToJson");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const convert = () => {
    try {
      const result =
        direction === "csvToJson"
          ? JSON.stringify(csvToJson(input), null, 2)
          : jsonToCsv(input);
      setOutput(result);
      setError(null);
    } catch (err) {
      setOutput("");
      setError(err instanceof Error ? err.message : "转换失败");
    }
  };

  const switchDirection = (next: Direction) => {
    setDirection(next);
    setInput("");
    setOutput("");
    setError(null);
  };

  const inputLabel = direction === "csvToJson" ? "CSV 输入" : "JSON 输入";
  const outputLabel = direction === "csvToJson" ? "JSON 输出" : "CSV 输出";

  return (
    <ToolBody>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <ToolPane label={inputLabel} className="min-h-[240px]">
          <textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") convert();
            }}
            spellCheck={false}
            placeholder={
              direction === "csvToJson"
                ? "name,age\nTom,18\nJack,20"
                : '[{"name":"Tom","age":18}]'
            }
            className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-[13px] leading-[1.6] text-foreground outline-none placeholder:text-muted-text"
          />
        </ToolPane>
        <ToolPane label={outputLabel} className="min-h-[240px]">
          <textarea
            value={output}
            readOnly
            spellCheck={false}
            placeholder="转换结果会显示在这里"
            className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-[13px] leading-[1.6] text-foreground outline-none placeholder:text-muted-text"
          />
        </ToolPane>
      </div>

      <ToolFeedback text={error} tone="error" />

      <ToolActionsBar>
        <Button
          variant={direction === "csvToJson" ? "primary" : "secondary"}
          onClick={() => switchDirection("csvToJson")}
        >
          CSV → JSON
        </Button>
        <Button
          variant={direction === "jsonToCsv" ? "primary" : "secondary"}
          onClick={() => switchDirection("jsonToCsv")}
        >
          JSON → CSV
        </Button>
        <Button variant="primary" onClick={convert}>
          转换
        </Button>
        <div className="ml-auto flex gap-2">
          <CopyButton value={output} />
          <Button variant="ghost" onClick={() => { setInput(""); setOutput(""); setError(null); }}>
            清空
          </Button>
        </div>
      </ToolActionsBar>
    </ToolBody>
  );
}
