/**
 * JWT decoder — decode only, never verify the signature.
 * Header and payload are base64url-encoded JSON; the signature part is
 * returned as-is (it is NOT validated, and the UI must not claim it is).
 */

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string | null;
}

export class JwtDecodeError extends Error {}

function base64UrlDecode(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split(".");
  if (parts.length !== 2 && parts.length !== 3) {
    throw new Error("不是有效的 JWT（应为 header.payload.signature 三段结构）");
  }

  let headerJson: string;
  let payloadJson: string;
  try {
    headerJson = base64UrlDecode(parts[0]);
    payloadJson = base64UrlDecode(parts[1]);
  } catch {
    throw new Error("无法解码 JWT 的 Base64URL 段");
  }

  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(headerJson);
    payload = JSON.parse(payloadJson);
  } catch {
    throw new Error("JWT 的 Header/Payload 不是有效的 JSON");
  }

  if (typeof header !== "object" || header === null) {
    throw new Error("JWT Header 不是 JSON 对象");
  }

  return { header, payload, signature: parts[2] ?? null };
}
