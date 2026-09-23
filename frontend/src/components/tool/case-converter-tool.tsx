"use client";

import { CASE_TARGETS, convertCase } from "@/lib/tools/case-converter";
import { TextTransformTool } from "@/components/tool/text-transform-tool";

export function CaseConverterTool() {
  return (
    <TextTransformTool
      inputPlaceholder="输入文本，例如：hello world"
      outputPlaceholder="点击下方格式按钮，转换结果会显示在这里"
      actions={CASE_TARGETS.map((item) => ({
        label: item.label,
        run: (input: string) => convertCase(input, item.target),
      }))}
    />
  );
}
