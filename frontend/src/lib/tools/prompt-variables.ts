/**
 * Prompt variable support: `{{var}}` placeholders inside prompt content.
 * Variable names may contain letters, digits, underscores, hyphens and CJK.
 */

const VARIABLE_RE = /\{\{\s*([^{}]+?)\s*\}\}/g;

/** Extract unique variable names in order of first appearance. */
export function parsePromptVariables(content: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of content.matchAll(VARIABLE_RE)) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      out.push(name);
    }
  }
  return out;
}

/**
 * Fill variables with provided values. Unfilled variables keep their
 * `{{var}}` placeholder so nothing is silently lost when copying.
 */
export function fillPromptVariables(
  content: string,
  values: Record<string, string>,
): string {
  return content.replace(VARIABLE_RE, (placeholder, name: string) => {
    const value = values[name];
    return value !== undefined && value !== "" ? value : placeholder;
  });
}
