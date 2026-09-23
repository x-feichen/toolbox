/**
 * JSON Formatter client logic — runs entirely in the browser (privacy-first,
 * design doc §62: no API, no database, no persistence).
 *
 * `JSON.parse` handles all valid input; a small recursive-descent scanner
 * provides precise line/column errors for invalid input (modern JS engines
 * no longer expose positions in their error messages).
 */

export interface JsonParseSuccess<T = unknown> {
  ok: true;
  value: T;
}

export interface JsonParseFailure {
  ok: false;
  message: string;
  line?: number;
  column?: number;
}

export type JsonParseResult<T = unknown> = JsonParseSuccess<T> | JsonParseFailure;

function lineColumnOf(input: string, index: number): { line: number; column: number } {
  const before = input.slice(0, index);
  const lines = before.split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

interface ScanFailure {
  message: string;
  index: number;
}

const CONTROL_CHARS: Record<string, string> = { '"': '"', "\\": "\\", "/": "/" };

class JsonScanner {
  private i = 0;

  constructor(private readonly src: string) {}

  /** True when the cursor has consumed the entire input. */
  get atEnd(): boolean {
    this.skipWhitespace();
    return this.i >= this.src.length;
  }

  /** Current cursor position (after skipping trailing whitespace). */
  get endPosition(): number {
    this.skipWhitespace();
    return this.i;
  }

  private fail(message: string, index = this.i): never {
    const failure: ScanFailure = { message, index };
    throw failure;
  }

  private skipWhitespace(): void {
    while (this.i < this.src.length) {
      const c = this.src[this.i];
      if (c === " " || c === "\t" || c === "\n" || c === "\r") this.i += 1;
      else break;
    }
  }

  private expect(literal: string): void {
    if (this.src.startsWith(literal, this.i)) {
      this.i += literal.length;
    } else {
      this.fail(`Expected '${literal}'`);
    }
  }

  parseValue(): unknown {
    this.skipWhitespace();
    if (this.i >= this.src.length) this.fail("Unexpected end of input");
    const c = this.src[this.i];
    if (c === "{") return this.parseObject();
    if (c === "[") return this.parseArray();
    if (c === '"') return this.parseString();
    if (c === "-" || (c >= "0" && c <= "9")) return this.parseNumber();
    if (this.src.startsWith("true", this.i)) { this.i += 4; return true; }
    if (this.src.startsWith("false", this.i)) { this.i += 5; return false; }
    if (this.src.startsWith("null", this.i)) { this.i += 4; return null; }
    this.fail(`Unexpected token '${c}'`);
  }

  private parseObject(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    this.i += 1; // '{'
    this.skipWhitespace();
    if (this.src[this.i] === "}") { this.i += 1; return result; }
    for (;;) {
      this.skipWhitespace();
      if (this.src[this.i] !== '"') this.fail("Expected property name string");
      const key = this.parseString();
      this.skipWhitespace();
      if (this.src[this.i] !== ":") this.fail("Expected ':'");
      this.i += 1;
      result[key] = this.parseValue();
      this.skipWhitespace();
      if (this.src[this.i] === ",") { this.i += 1; continue; }
      if (this.src[this.i] === "}") { this.i += 1; return result; }
      this.fail("Expected ',' or '}'");
    }
  }

  private parseArray(): unknown[] {
    const result: unknown[] = [];
    this.i += 1; // '['
    this.skipWhitespace();
    if (this.src[this.i] === "]") { this.i += 1; return result; }
    for (;;) {
      result.push(this.parseValue());
      this.skipWhitespace();
      if (this.src[this.i] === ",") { this.i += 1; continue; }
      if (this.src[this.i] === "]") { this.i += 1; return result; }
      this.fail("Expected ',' or ']'");
    }
  }

  private parseString(): string {
    this.i += 1; // opening quote
    let out = "";
    for (;;) {
      if (this.i >= this.src.length) this.fail("Unterminated string");
      const c = this.src[this.i];
      if (c === '"') { this.i += 1; return out; }
      if (c === "\\") {
        const next = this.src[this.i + 1];
        if (next === undefined) this.fail("Unterminated escape sequence");
        if (CONTROL_CHARS[next] !== undefined) {
          out += CONTROL_CHARS[next];
          this.i += 2;
        } else if (next === "n") { out += "\n"; this.i += 2; }
        else if (next === "t") { out += "\t"; this.i += 2; }
        else if (next === "r") { out += "\r"; this.i += 2; }
        else if (next === "b") { out += "\b"; this.i += 2; }
        else if (next === "f") { out += "\f"; this.i += 2; }
        else if (next === "u") {
          const hex = this.src.slice(this.i + 2, this.i + 6);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) this.fail("Invalid unicode escape");
          out += String.fromCharCode(parseInt(hex, 16));
          this.i += 6;
        } else {
          this.fail(`Invalid escape '\\${next}'`);
        }
        continue;
      }
      if (c < " ") this.fail("Control character in string");
      out += c;
      this.i += 1;
    }
  }

  private parseNumber(): number {
    const start = this.i;
    if (this.src[this.i] === "-") this.i += 1;
    if (this.src.startsWith("Infinity", this.i) || this.src[this.i] === "N") {
      this.fail("Invalid number");
    }
    while (this.i < this.src.length && /[0-9eE+\-.]/.test(this.src[this.i])) this.i += 1;
    const raw = this.src.slice(start, this.i);
    const value = Number(raw);
    if (raw === "" || Number.isNaN(value)) this.fail(`Invalid number '${raw || this.src[this.i]}'`);
    return value;
  }
}

/** Parse with precise failure positions. Valid JSON fast-path via JSON.parse. */
export function parseJson(input: string): JsonParseResult {
  if (input.trim() === "") {
    return { ok: false, message: "输入为空，请提供 JSON 内容" };
  }
  try {
    return { ok: true, value: JSON.parse(input) as unknown };
  } catch {
    const scanner = new JsonScanner(input);
    try {
      const value = scanner.parseValue();
      if (!scanner.atEnd) {
        const { line, column } = lineColumnOf(input, scanner.endPosition);
        return {
          ok: false,
          message: `JSON 语法错误（第 ${line} 行, 第 ${column} 列）: 存在多余的输入内容`,
          line,
          column,
        };
      }
      // Scanner accepted but JSON.parse rejected (e.g. NaN semantics): treat
      // the input as invalid without a precise position.
      return { ok: false, message: "JSON 语法错误: 输入不是有效的 JSON" };
    } catch (failure) {
      const scan = failure as ScanFailure;
      if (typeof scan?.index !== "number") throw failure;
      const { line, column } = lineColumnOf(input, scan.index);
      return {
        ok: false,
        message: `JSON 语法错误（第 ${line} 行, 第 ${column} 列）: ${scan.message}`,
        line,
        column,
      };
    }
  }
}

export function formatJson(input: string, indent = 2): JsonParseResult<string> {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  return {
    ok: true,
    value: JSON.stringify(parsed.value, null, indent === 0 ? undefined : indent),
  };
}

export function minifyJson(input: string): JsonParseResult<string> {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  return { ok: true, value: JSON.stringify(parsed.value) };
}

export function validateJson(input: string): { valid: boolean; message?: string } {
  const parsed = parseJson(input);
  return parsed.ok ? { valid: true } : { valid: false, message: parsed.message };
}
