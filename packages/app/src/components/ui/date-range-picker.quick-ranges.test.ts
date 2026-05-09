import { describe, expect, it, vi } from 'vitest';

import { getQuickDateRanges } from '@/components/ui/date-range-picker';

describe('getQuickDateRanges', () => {
  it('returns empty when fewer than 2 dates', () => {
    expect(getQuickDateRanges([])).toEqual([]);
    expect(getQuickDateRanges(['2026-01-01'])).toEqual([]);
  });

  it('returns All Time spanning first and last date', () => {
    const dates = ['2025-10-01', '2025-11-01', '2026-01-15'];
    const ranges = getQuickDateRanges(dates);
    expect(ranges[0]).toEqual({
      label: 'All Time',
      range: { startDate: '2025-10-01', endDate: '2026-01-15' },
    });
  });

  it('includes Last 90 Days and Last 30 Days when enough data in window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-09T12:00:00Z'));
    const dates: string[] = [];
    for (
      const d = new Date('2026-01-01');
      d <= new Date('2026-05-09');
      d.setDate(d.getDate() + 7)
    ) {
      dates.push(d.toISOString().slice(0, 10));
    }
    const ranges = getQuickDateRanges(dates);
    const labels = ranges.map((r) => r.label);
    expect(labels).toContain('All Time');
    expect(labels).toContain('Last 90 Days');
    expect(labels).toContain('Last 30 Days');
    for (const { range } of ranges) {
      expect(range.startDate <= range.endDate).toBe(true);
      expect(dates.includes(range.startDate)).toBe(true);
      expect(dates.includes(range.endDate)).toBe(true);
    }
    vi.useRealTimers();
  });
});
