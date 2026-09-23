/** Text statistics with CJK-aware word segmentation. */

export interface TextStats {
  characters: number;
  charactersWithoutSpaces: number;
  /** Latin/number runs count as one word each; CJK characters count one each. */
  words: number;
  lines: number;
  paragraphs: number;
}

const WORD_RE = /[A-Za-z0-9_]+|[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;

export function countText(text: string): TextStats {
  const words = text.match(WORD_RE)?.length ?? 0;
  const trimmed = text.trim();
  const lines = trimmed === "" ? 0 : text.split("\n").length;
  const paragraphs =
    trimmed === "" ? 0 : text.split(/\n+/).filter((block) => block.trim() !== "").length;

  return {
    characters: text.length,
    charactersWithoutSpaces: text.replace(/\s/g, "").length,
    words,
    lines,
    paragraphs,
  };
}
