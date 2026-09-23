/** URL component encoding helpers with user-friendly errors. */

export function encodeUrlComponent(text: string): string {
  return encodeURIComponent(text);
}

export function decodeUrlComponent(encoded: string): string {
  try {
    return decodeURIComponent(encoded);
  } catch {
    throw new Error("无法解码该 URL 编码字符串");
  }
}
