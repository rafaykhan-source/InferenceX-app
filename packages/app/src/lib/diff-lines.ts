export type DiffLineType = 'same' | 'added' | 'removed';

export interface DiffLine {
  type: DiffLineType;
  text: string;
}

/**
 * Line-oriented diff (LCS) between two multiline strings. Intended for small
 * CLI snippets (launch commands), not huge files.
 */
export function diffLines(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const m = oldLines.length;
  const n = newLines.length;

  const lens = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => 0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      lens[i][j] =
        oldLines[i - 1] === newLines[j - 1]
          ? lens[i - 1][j - 1] + 1
          : Math.max(lens[i - 1][j], lens[i][j - 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      out.push({ type: 'same', text: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lens[i][j - 1] >= lens[i - 1][j])) {
      out.push({ type: 'added', text: newLines[j - 1] });
      j--;
    } else if (i > 0) {
      out.push({ type: 'removed', text: oldLines[i - 1] });
      i--;
    }
  }
  out.reverse();
  return out;
}

/** Plain unified-diff style string for clipboard export. */
export function diffLinesToPlainText(lines: DiffLine[]): string {
  return lines
    .map((l) => {
      const p = l.type === 'removed' ? '-' : l.type === 'added' ? '+' : ' ';
      return `${p} ${l.text}`;
    })
    .join('\n');
}
