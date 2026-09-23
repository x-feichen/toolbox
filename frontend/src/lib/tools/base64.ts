/** Base64 encoding with proper UTF-8 support (btoa/atob are Latin-1 only). */

export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function decodeBase64(base64: string): string {
  const trimmed = base64.trim();
  if (trimmed === "") return "";
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(trimmed.replace(/\s/g, ""))) {
    throw new Error("不是有效的 Base64 字符串");
  }
  const binary = atob(trimmed.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const decoded = new TextDecoder("utf-8").decode(bytes);
  if (decoded.includes("\uFFFD")) {
    throw new Error("无法解码该 Base64 值（可能不是 UTF-8 文本）");
  }
  return decoded;
}
