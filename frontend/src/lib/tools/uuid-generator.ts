/** UUID generation via the Web Crypto API. */

/** Generate `count` random v4 UUIDs. `count` is clamped to 1..100. */
export function generateUuids(count: number): string[] {
  const clamped = Math.max(1, Math.min(Math.floor(count) || 1, 100));
  return Array.from({ length: clamped }, () => crypto.randomUUID());
}
