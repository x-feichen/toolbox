"use client";

import { useState } from "react";
import { decodeJwt } from "@/lib/tools/jwt-decoder";
import type { DecodedJwt } from "@/lib/tools/jwt-decoder";
import { Button } from "@/components/ui/primitives";
import { CopyButton, ToolActionsBar, ToolBody, ToolFeedback, ToolPane } from "@/components/tool/tool-shell";

/** JWT Decoder — decode only; signature is never verified (spec §9). */
export function JwtDecoderTool() {
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decode = () => {
    try {
      setDecoded(decodeJwt(token));
      setError(null);
    } catch (err) {
      setDecoded(null);
      setError(err instanceof Error ? err.message : "无法解码");
    }
  };

  const pretty = (value: Record<string, unknown>) => JSON.stringify(value, null, 2);

  return (
    <ToolBody>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <ToolPane label="JWT Token" className="min-h-[240px]">
          <textarea
            value={token}
            onChange={(event) => {
              setToken(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") decode();
            }}
            spellCheck={false}
            placeholder="粘贴 JWT（header.payload.signature）"
            className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-[13px] leading-[1.6] text-foreground outline-none placeholder:text-muted-text"
          />
        </ToolPane>

        <div className="grid min-h-[240px] grid-rows-2 gap-3 lg:row-span-1">
          <ToolPane label="Header">
            <pre className="min-h-0 flex-1 overflow-auto p-3 font-mono text-[13px] leading-[1.6] text-foreground">
              {decoded ? JSON.stringify(decoded.header, null, 2) : <span className="text-muted-text">—</span>}
            </pre>
          </ToolPane>
          <ToolPane label="Payload">
            <pre className="min-h-0 flex-1 overflow-auto p-3 font-mono text-[13px] leading-[1.6] text-foreground">
              {decoded ? JSON.stringify(decoded.payload, null, 2) : <span className="text-muted-text">—</span>}
            </pre>
          </ToolPane>
        </div>
      </div>

      <ToolFeedback text={error} tone="error" />

      <ToolActionsBar>
        <Button variant="primary" onClick={decode}>
          解码
        </Button>
        {decoded && (
          <>
            <CopyButton value={JSON.stringify(decoded.header)} label="复制 Header" />
            <CopyButton value={JSON.stringify(decoded.payload)} label="复制 Payload" />
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" onClick={() => { setToken(""); setDecoded(null); setError(null); }}>
            清空
          </Button>
        </div>
      </ToolActionsBar>
      {decoded && (
        <p className="text-[12px] text-muted-text">仅解码显示内容，不验证签名（解码 ≠ 校验）。</p>
      )}
    </ToolBody>
  );
}
