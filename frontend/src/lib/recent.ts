/** Anonymous users keep "recent tools" in localStorage (design doc §66). */

const KEY = "toolbox:recent-tools";
const MAX = 8;

export function getLocalRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function recordLocalRecent(slug: string): void {
  if (typeof window === "undefined") return;
  const next = [slug, ...getLocalRecent().filter((s) => s !== slug)].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode) — silently ignore
  }
}

export function clearLocalRecent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
