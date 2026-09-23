/**
 * CSV <-> JSON conversion with a proper CSV parser:
 * quoted fields, escaped quotes (""), commas/newlines inside quotes,
 * empty values, UTF-8. Never naive split(",").
 */

export interface CsvRecord {
  [key: string]: string;
}

export interface CsvParseResult {
  headers: string[];
  records: CsvRecord[];
}

export class CsvParseError extends Error {}

/** RFC-4180 style parser. Values stay strings (no implicit typing). */
export function parseCsv(input: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const text = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"' && field === "") {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      pushField();
      i++;
      continue;
    }
    if (c === "\n") {
      // A row ends at a newline only when it has content; completely empty
      // lines are skipped, and a trailing newline never creates a phantom row.
      if (field !== "" || row.length > 0) {
        pushField();
        rows.push(row);
      }
      row = [];
      i++;
      continue;
    }
    field += c;
    i++;
  }
  // Final row at EOF only when it carries content (e.g. "a," -> ["a", ""]).
  if (field !== "" || row.length > 0) pushRow();

  if (inQuotes) throw new CsvParseError("CSV 引号未闭合");

  if (rows.length === 0) return { headers: [], rows: [] };
  const [headers, ...data] = rows;
  return { headers, rows: data };
}

export function csvToJson(input: string): Record<string, string>[] {
  const { headers, rows } = parseCsv(input);
  if (headers.length === 0) return [];
  return rows.map((row) => {
    const record: CsvRecord = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    return record;
  });
}

function escapeCsvValue(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function jsonToCsv(json: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new CsvParseError("输入不是有效的 JSON");
  }
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "object" || item === null || Array.isArray(item))) {
    throw new CsvParseError("JSON 应为对象数组，例如 [{\"name\":\"Tom\"}]");
  }

  const records = parsed as Record<string, unknown>[];
  const headers = [...new Set(records.flatMap((item) => Object.keys(item)))];
  const lines = [headers.map(escapeCsvValue).join(",")];
  for (const record of records) {
    lines.push(headers.map((header) => escapeCsvValue(stringify(record[header]))).join(","));
  }
  return lines.join("\n");
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
