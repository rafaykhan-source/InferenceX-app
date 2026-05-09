import { describe, expect, it } from 'vitest';

import { normalizeComparisonGpuList } from './normalize-comparison-gpus';

describe('normalizeComparisonGpuList', () => {
  it('returns empty for empty input', () => {
    expect(normalizeComparisonGpuList([])).toEqual([]);
  });

  it('dedupes and preserves order', () => {
    expect(normalizeComparisonGpuList(['a', 'a', 'b'])).toEqual(['a', 'b']);
  });

  it('caps at two distinct keys', () => {
    expect(normalizeComparisonGpuList(['x', 'y', 'z'])).toEqual(['x', 'y']);
  });

  it('skips empty strings', () => {
    expect(normalizeComparisonGpuList(['', 'h100', ''])).toEqual(['h100']);
  });
});
