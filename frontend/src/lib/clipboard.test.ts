import { afterEach, describe, expect, it, vi } from "vitest";
import { ClipboardError, copyToClipboard, pickCopyStrategy } from "./clipboard";

const originalWindow = globalThis.window;

function setEnv({ secure, hasClipboard }: { secure: boolean; hasClipboard: boolean }) {
  Object.defineProperty(globalThis, "window", {
    value: { isSecureContext: secure },
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "navigator", {
    value: hasClipboard ? { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } } : {},
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true, writable: true });
  vi.unstubAllGlobals();
});

describe("pickCopyStrategy", () => {
  it("uses the Clipboard API in a secure context", () => {
    setEnv({ secure: true, hasClipboard: true });
    expect(pickCopyStrategy()).toBe("clipboard-api");
  });

  it("falls back to execCommand on plain HTTP (insecure)", () => {
    setEnv({ secure: false, hasClipboard: true });
    expect(pickCopyStrategy()).toBe("exec-command");
  });

  it("falls back when the API is missing even if secure", () => {
    setEnv({ secure: true, hasClipboard: false });
    expect(pickCopyStrategy()).toBe("exec-command");
  });
});

describe("copyToClipboard", () => {
  it("uses the Clipboard API when available", async () => {
    setEnv({ secure: true, hasClipboard: true });
    const strategy = await copyToClipboard("hello");
    expect(strategy).toBe("clipboard-api");
  });

  it("falls back to execCommand when the API rejects", async () => {
    setEnv({ secure: true, hasClipboard: true });
    (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("denied"));
    const execCommand = vi.fn().mockReturnValue(true);
    vi.stubGlobal("document", {
      createElement: () => ({
        value: "",
        style: {},
        setAttribute: () => {},
        select: () => {},
        setSelectionRange: () => {},
      }),
      body: { appendChild: () => {}, removeChild: () => {} },
      execCommand,
    });
    const strategy = await copyToClipboard("hello");
    expect(strategy).toBe("exec-command");
    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("throws when even the fallback fails", async () => {
    setEnv({ secure: false, hasClipboard: false });
    vi.stubGlobal("document", {
      createElement: () => ({
        value: "",
        style: {},
        setAttribute: () => {},
        select: () => {},
        setSelectionRange: () => {},
      }),
      body: { appendChild: () => {}, removeChild: () => {} },
      execCommand: () => false,
    });
    await expect(copyToClipboard("x")).rejects.toBeInstanceOf(ClipboardError);
  });
});
