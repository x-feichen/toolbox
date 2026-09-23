"use client";

import { encodeUrlComponent, decodeUrlComponent } from "@/lib/tools/url-encoder";
import { TextTransformTool } from "@/components/tool/text-transform-tool";

export function UrlEncoderTool() {
  return (
    <TextTransformTool
      inputPlaceholder="输入要编码 / 解码的 URL 文本"
      outputPlaceholder="结果会显示在这里"
      actions={[
        { label: "编码", primary: true, run: encodeUrlComponent },
        { label: "解码", run: decodeUrlComponent },
      ]}
    />
  );
}
