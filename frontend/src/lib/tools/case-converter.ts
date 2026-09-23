/** Case conversion: split on any non-alphanumeric separator, then re-join. */

const WORD_SPLIT_RE = /[^A-Za-z0-9]+/;

function words(text: string): string[] {
  return text.split(WORD_SPLIT_RE).filter(Boolean);
}

const lower = (word: string) => word.toLowerCase();
const upper = (word: string) => word.toUpperCase();
const capitalize = (word: string) => lower(word).replace(/^./, (c) => c.toUpperCase());

export function convertCase(text: string, target: CaseTarget): string {
  const w = words(text);
  if (w.length === 0) return "";

  switch (target) {
    case "upper":
      return w.map(upper).join(" ");
    case "lower":
      return w.map(lower).join(" ");
    case "title":
      return w.map(capitalize).join(" ");
    case "camel":
      return w[0].toLowerCase() + w.slice(1).map(capitalize).join("");
    case "pascal":
      return w.map(capitalize).join("");
    case "snake":
      return w.map(lower).join("_");
    case "kebab":
      return w.map(lower).join("-");
  }
}

export type CaseTarget =
  | "upper"
  | "lower"
  | "title"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab";

export const CASE_TARGETS: { target: CaseTarget; label: string; sample: string }[] = [
  { target: "upper", label: "UPPERCASE", sample: "HELLO WORLD" },
  { target: "lower", label: "lowercase", sample: "hello world" },
  { target: "title", label: "Title Case", sample: "Hello World" },
  { target: "camel", label: "camelCase", sample: "helloWorld" },
  { target: "pascal", label: "PascalCase", sample: "HelloWorld" },
  { target: "snake", label: "snake_case", sample: "hello_world" },
  { target: "kebab", label: "kebab-case", sample: "hello-world" },
];
