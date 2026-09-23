"use client";

import { useState } from "react";
import { removeDuplicateLines } from "@/lib/tools/duplicate-lines";
import { TextTransformTool } from "@/components/tool/text-transform-tool";

export function DuplicateLinesTool() {
  const [ignoreEmptyLines, setIgnoreEmptyLines] = useState(false);
  const [caseInsensitive, setCaseInsensitive] = useState(false);

  return (
    <TextTransformTool
      inputPlaceholder={"apple\nbanana\napple\norange\nbanana"}
      outputPlaceholder="去重结果会显示在这里"
      actions={[
        {
          label: "去重",
          primary: true,
          run: (input) => removeDuplicateLines(input, { ignoreEmptyLines, caseInsensitive }).lines.join("\n"),
        },
      ]}
      controls={
        <div className="flex items-center gap-3 text-[13px] text-secondary-text">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={ignoreEmptyLines}
              onChange={(event) => setIgnoreEmptyLines(event.target.checked)}
            />
            忽略空行
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={caseInsensitive}
              onChange={(event) => setCaseInsensitive(event.target.checked)}
            />
            忽略大小写
          </label>
        </div>
      }
    />
  );
}
