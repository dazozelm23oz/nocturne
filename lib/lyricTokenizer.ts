export interface LyricToken {
  text: string;
  isWord: boolean;
  isSpace: boolean;
  isNewline: boolean;
  isBacking: boolean;
  startFrac: number;
  endFrac: number;
  weight?: number;
}

export interface TokenizedLyricLine {
  tokens: LyricToken[];
  wordTokens: LyricToken[];
  totalWords: number;
  isCJK: boolean;
}

/**
 * Tokenizes a lyric line into sequential character-weighted word and space tokens.
 * This guarantees that when a lyric spans multiple lines or wraps across 2-3 visual lines,
 * the karaoke sweep illuminates sequentially line-by-line (Line 1 first, then Line 2, then Line 3)
 * rather than highlighting all lines simultaneously.
 */
export function tokenizeLyric(text: string): TokenizedLyricLine {
  if (!text || typeof text !== "string") {
    return { tokens: [], wordTokens: [], totalWords: 0, isCJK: false };
  }

  const isCJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text);
  const tokens: LyricToken[] = [];
  const regex = /(\([^)]+\))|(\r?\n)|([^\s]+)|(\s+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const isBacking = !!match[1];
    const isNewline = !!match[2];
    const isSpace = !!match[4];

    if (isBacking) {
      // Sub-tokenize backing vocal groups: e.g. "(backing vocals)"
      tokens.push({
        text: "(",
        isWord: false,
        isSpace: false,
        isNewline: false,
        isBacking: true,
        startFrac: 0,
        endFrac: 0,
      });

      const innerRegex = /([^\s()]+)|(\s+)/g;
      let innerMatch: RegExpExecArray | null;
      const innerContent = raw.slice(1, -1);

      while ((innerMatch = innerRegex.exec(innerContent)) !== null) {
        if (innerMatch[1]) {
          tokens.push({
            text: innerMatch[1],
            isWord: true,
            isSpace: false,
            isNewline: false,
            isBacking: true,
            startFrac: 0,
            endFrac: 0,
          });
        } else if (innerMatch[2]) {
          tokens.push({
            text: innerMatch[2],
            isWord: false,
            isSpace: true,
            isNewline: false,
            isBacking: true,
            startFrac: 0,
            endFrac: 0,
          });
        }
      }

      tokens.push({
        text: ")",
        isWord: false,
        isSpace: false,
        isNewline: false,
        isBacking: true,
        startFrac: 0,
        endFrac: 0,
      });
    } else if (isNewline) {
      tokens.push({
        text: raw,
        isWord: false,
        isSpace: false,
        isNewline: true,
        isBacking: false,
        startFrac: 0,
        endFrac: 0,
      });
    } else if (isSpace) {
      tokens.push({
        text: raw,
        isWord: false,
        isSpace: true,
        isNewline: false,
        isBacking: false,
        startFrac: 0,
        endFrac: 0,
      });
    } else if (isCJK && !/\s/.test(text)) {
      // For continuous CJK text without spaces, break into individual character tokens
      for (const char of raw) {
        tokens.push({
          text: char,
          isWord: true,
          isSpace: false,
          isNewline: false,
          isBacking: false,
          startFrac: 0,
          endFrac: 0,
        });
      }
    } else {
      tokens.push({
        text: raw,
        isWord: true,
        isSpace: false,
        isNewline: false,
        isBacking: false,
        startFrac: 0,
        endFrac: 0,
      });
    }
  }

  // Calculate character length weights for each word token
  let totalWeight = 0;
  for (const t of tokens) {
    if (t.isWord) {
      t.weight = Math.max(1, t.text.length);
      totalWeight += t.weight;
    }
  }

  if (totalWeight === 0) totalWeight = 1;

  // Assign proportional progress fractions [startFrac, endFrac] in range [0, 1]
  let accum = 0;
  const wordTokens: LyricToken[] = [];
  for (const t of tokens) {
    if (t.isWord) {
      t.startFrac = accum / totalWeight;
      accum += t.weight!;
      t.endFrac = accum / totalWeight;
      wordTokens.push(t);
    } else {
      t.startFrac = accum / totalWeight;
      t.endFrac = accum / totalWeight;
    }
  }

  return {
    tokens,
    wordTokens,
    totalWords: wordTokens.length,
    isCJK,
  };
}
