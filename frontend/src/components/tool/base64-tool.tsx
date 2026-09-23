"use client";

import { decodeBase64, encodeBase64 } from "@/lib/tools/base64";
import { TextTransformTool } from "@/components/tool/text-transform-tool";

export function Base64Tool() {
  return (
    <TextTransformTool
      inputPlaceholder="输入要编码 / 解码的文本…"
      outputPlaceholder="Base64 或原文会显示在这里"
      actions={[
        { label: "编码", primary: true, run: encodeBase64 },
        {
          label: "解码",
          run: (input) => {
            const decoded = decodeBase64(input);
            if (decoded === undefined) throw new Error("无法解码该值");
            return decoded;
          },
        },
      ]}
    />
  );
}
