import { describe, expect, it } from 'vitest';

import { diffLines, diffLinesToPlainText } from './diff-lines';

describe('diffLines', () => {
  it('returns one same line for identical single-line strings', () => {
    expect(diffLines('a', 'a')).toEqual([{ type: 'same', text: 'a' }]);
  });

  it('treats empty strings as a single empty line', () => {
    expect(diffLines('', '')).toEqual([{ type: 'same', text: '' }]);
  });

  it('detects pure additions', () => {
    expect(diffLines('a', 'a\nb')).toEqual([
      { type: 'same', text: 'a' },
      { type: 'added', text: 'b' },
    ]);
  });

  it('detects pure removals', () => {
    expect(diffLines('a\nb', 'a')).toEqual([
      { type: 'same', text: 'a' },
      { type: 'removed', text: 'b' },
    ]);
  });

  it('interleaves changes around a shared middle', () => {
    expect(diffLines('a\nb\nc', 'a\nx\nc')).toEqual([
      { type: 'same', text: 'a' },
      { type: 'removed', text: 'b' },
      { type: 'added', text: 'x' },
      { type: 'same', text: 'c' },
    ]);
  });
});

describe('diffLinesToPlainText', () => {
  it('prefixes lines with unified-diff markers', () => {
    const lines = diffLines('old', 'new');
    const text = diffLinesToPlainText(lines);
    expect(text).toContain('- old');
    expect(text).toContain('+ new');
  });
});
