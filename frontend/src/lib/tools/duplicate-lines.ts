/** Remove duplicate lines while preserving first-appearance order. */

export interface DedupeOptions {
  /** Drop empty lines entirely from the result. */
  ignoreEmptyLines: boolean;
  /** Treat lines differing only in case as duplicates. */
  caseInsensitive: boolean;
}

export interface DedupeResult {
  lines: string[];
  removedCount: number;
}

export function removeDuplicateLines(
  input: string,
  options: DedupeOptions = { ignoreEmptyLines: false, caseInsensitive: false },
): DedupeResult {
  const seen = new Set<string>();
  const lines: string[] = [];
  const raw = input.length === 0 ? [] : input.replace(/\n$/, "").split("\n");

  for (const rawLine of raw) {
    const line = rawLine.replace(/\r$/, "");
    if (options.ignoreEmptyLines && line.trim() === "") continue;
    const key = options.caseInsensitive ? line.toLowerCase() : line;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(line);
  }

  return { lines, removedCount: raw.length - lines.length };
}
