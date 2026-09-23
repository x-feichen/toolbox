/** Unix timestamp <-> date conversion (seconds / milliseconds). */

export type TimestampUnit = "seconds" | "milliseconds";

export function timestampToDate(input: string, unit: TimestampUnit): Date | null {
  const trimmed = input.trim();
  if (trimmed === "" || !/^-?\d+$/.test(trimmed)) return null;
  const numeric = Number(trimmed);
  const ms = unit === "seconds" ? numeric * 1000 : numeric;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local "YYYY-MM-DD HH:mm:ss" formatting. */
export function formatDateTime(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export function formatTimestampResult(input: string, unit: TimestampUnit): string | null {
  const date = timestampToDate(input, unit);
  if (date === null) return null;
  return formatDateTime(date);
}

/** Parse a datetime-local / ISO string into {seconds, milliseconds}. */
export function dateToTimestamp(input: string): { seconds: number; milliseconds: number } | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return {
    seconds: Math.floor(date.getTime() / 1000),
    milliseconds: date.getTime(),
  };
}

export function nowTimestamp(): { seconds: number; milliseconds: number } {
  const now = Date.now();
  return { seconds: Math.floor(now / 1000), milliseconds: now };
}
