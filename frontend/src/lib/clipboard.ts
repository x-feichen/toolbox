/**
 * Clipboard helper with a non-secure-context fallback.
 *
 * `navigator.clipboard` is only available in secure contexts (HTTPS or
 * localhost). On a plain-HTTP public deployment it is undefined, so we fall
 * back to the legacy `document.execCommand("copy")` path, which still works
 * there. Strategy selection is extracted as a pure function for testing.
 */

export type CopyStrategy = "clipboard-api" | "exec-command";

/** Pick the best available strategy for the current environment. */
export function pickCopyStrategy(): CopyStrategy {
  if (typeof window === "undefined") return "exec-command";
  const isSecure = window.isSecureContext ?? false;
  const hasApi = typeof navigator !== "undefined" && Boolean(navigator.clipboard?.writeText);
  if (!isSecure || !hasApi) return "exec-command";
  // The Clipboard API requires document focus; a denied writeText consumes
  // the user activation, which would make the execCommand fallback fail too —
  // so the strategy must be decided BEFORE touching the API.
  return typeof document !== "undefined" && document.hasFocus()
    ? "clipboard-api"
    : "exec-command";
}

export class ClipboardError extends Error {}

/**
 * Copy text to the clipboard. Throws ClipboardError when every strategy
 * fails, so callers can surface a user-friendly message.
 */
export async function copyToClipboard(text: string): Promise<CopyStrategy> {
  if (pickCopyStrategy() === "clipboard-api") {
    try {
      await navigator.clipboard.writeText(text);
      return "clipboard-api";
    } catch {
      // fall through to the legacy path (e.g. permission denied)
    }
  }
  return copyViaExecCommand(text);
}

function copyViaExecCommand(text: string): CopyStrategy {
  if (typeof document === "undefined") {
    throw new ClipboardError("当前环境不支持复制");
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  // Keep it off-screen and non-disruptive, but still selectable.
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  } finally {
    document.body.removeChild(textarea);
  }
  if (!ok) {
    throw new ClipboardError("复制失败，请手动复制");
  }
  return "exec-command";
}
