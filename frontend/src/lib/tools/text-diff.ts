/** Line-level diff via LCS (dynamic programming). */

export type DiffRowType = "equal" | "added" | "removed";

export interface DiffRow {
  type: DiffRowType;
  text: string;
  /** 1-based line number in the original (left) input, for equal/removed. */
  lineA: number | null;
  /** 1-based line number in the changed (right) input, for equal/added. */
  lineB: number | null;
}

export const MAX_DIFF_LINES = 5000;

export function diffLines(original: string, changed: string): DiffRow[] {
  const a = original.length === 0 ? [] : original.replace(/\r/g, "").split("\n");
  const b = changed.length === 0 ? [] : changed.replace(/\r/g, "").split("\n");

  if (a.length > MAX_DIFF_LINES || b.length > MAX_DIFF_LINES) {
    throw new Error(`文本超过 ${MAX_DIFF_LINES} 行，请缩短后重试`);
  }

  // LCS table
  const m = a.length;
  const n = b.length;
  const dp: Uint32Array[] = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      rows.push({ type: "equal", text: a[i], lineA: i + 1, lineB: j + 1 });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: "removed", text: a[i], lineA: i + 1, lineB: null });
      i++;
    } else {
      rows.push({ type: "added", text: b[j], lineA: null, lineB: j + 1 });
      j++;
    }
  }
  while (i < m) {
    rows.push({ type: "removed", text: a[i], lineA: i + 1, lineB: null });
    i++;
  }
  while (j < n) {
    rows.push({ type: "added", text: b[j], lineA: null, lineB: j + 1 });
    j++;
  }
  return rows;
}
