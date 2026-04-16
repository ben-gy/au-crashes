import { describe, expect, it } from 'vitest';
import {
  formatNumber,
  formatPercent,
  sortedEntries,
  parseRecords,
  maxValue,
  heatColor,
  STATE_COLORS,
  ROAD_USER_COLORS,
  CRASH_TYPE_COLORS,
} from '../src/utils';
import type { RecordsData } from '../src/types';

describe('formatNumber', () => {
  it('formats thousands with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
  it('handles negative numbers', () => {
    expect(formatNumber(-1234)).toBe('-1,234');
  });
  it('handles decimals', () => {
    expect(formatNumber(1234.56, 2)).toBe('1,234.56');
  });
  it('handles small numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });
  it('handles very large numbers', () => {
    expect(formatNumber(999999999)).toBe('999,999,999');
  });
});

describe('formatPercent', () => {
  it('adds + sign for positive values', () => {
    expect(formatPercent(5.3)).toBe('+5.3%');
  });
  it('keeps - sign for negative values', () => {
    expect(formatPercent(-11.7)).toBe('-11.7%');
  });
  it('handles zero', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });
  it('rounds to one decimal', () => {
    expect(formatPercent(3.456)).toBe('+3.5%');
  });
  it('handles large values', () => {
    expect(formatPercent(100)).toBe('+100.0%');
  });
});

describe('sortedEntries', () => {
  it('sorts by value descending', () => {
    const result = sortedEntries({ a: 10, b: 30, c: 20 });
    expect(result).toEqual([['b', 30], ['c', 20], ['a', 10]]);
  });
  it('handles empty object', () => {
    expect(sortedEntries({})).toEqual([]);
  });
  it('handles single entry', () => {
    expect(sortedEntries({ x: 5 })).toEqual([['x', 5]]);
  });
  it('handles equal values', () => {
    const result = sortedEntries({ a: 10, b: 10 });
    expect(result).toHaveLength(2);
    expect(result[0][1]).toBe(10);
    expect(result[1][1]).toBe(10);
  });
});

describe('parseRecords', () => {
  it('converts column-oriented data to typed objects', () => {
    const raw: RecordsData = {
      columns: ['id', 'st', 'yr', 'mo'],
      data: [
        ['ABC123', 'NSW', 2023, 5],
        ['DEF456', 'VIC', 2022, 12],
      ],
    };
    const records = parseRecords(raw);
    expect(records).toHaveLength(2);
    expect(records[0].id).toBe('ABC123');
    expect(records[0].st).toBe('NSW');
    expect(records[0].yr).toBe(2023);
    expect(records[0].mo).toBe(5);
    expect(records[1].id).toBe('DEF456');
    expect(records[1].st).toBe('VIC');
  });
  it('handles empty data', () => {
    const raw: RecordsData = { columns: ['id'], data: [] };
    expect(parseRecords(raw)).toEqual([]);
  });
  it('preserves all column types', () => {
    const raw: RecordsData = {
      columns: ['id', 'st', 'yr', 'age', 'bus'],
      data: [['X', 'QLD', 2020, 45, 1]],
    };
    const records = parseRecords(raw);
    expect(typeof records[0].id).toBe('string');
    expect(typeof records[0].yr).toBe('number');
    expect(typeof records[0].bus).toBe('number');
  });
});

describe('maxValue', () => {
  it('returns the max value from a record', () => {
    expect(maxValue({ a: 10, b: 30, c: 20 })).toBe(30);
  });
  it('handles single value', () => {
    expect(maxValue({ x: 42 })).toBe(42);
  });
  it('handles empty record', () => {
    expect(maxValue({})).toBe(0);
  });
  it('handles negative values', () => {
    expect(maxValue({ a: -5, b: -1, c: -10 })).toBe(-1);
  });
});

describe('heatColor', () => {
  it('returns low opacity for zero value', () => {
    const color = heatColor(0, 100);
    expect(color).toContain('rgba');
    expect(color).toContain('0.1');
  });
  it('returns high opacity for max value', () => {
    const color = heatColor(100, 100);
    expect(color).toContain('rgba');
    expect(color).toContain('0.95');
  });
  it('handles max of zero', () => {
    const color = heatColor(0, 0);
    expect(color).toContain('0.05');
  });
  it('clamps values above max', () => {
    const color = heatColor(200, 100);
    // Should not exceed max intensity
    expect(color).toContain('rgba');
  });
});

describe('colour constants', () => {
  it('STATE_COLORS has all 8 states', () => {
    const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
    for (const st of states) {
      expect(STATE_COLORS[st]).toBeDefined();
      expect(STATE_COLORS[st]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
  it('ROAD_USER_COLORS has driver and pedestrian', () => {
    expect(ROAD_USER_COLORS['Driver']).toBeDefined();
    expect(ROAD_USER_COLORS['Pedestrian']).toBeDefined();
  });
  it('CRASH_TYPE_COLORS has all types', () => {
    expect(CRASH_TYPE_COLORS['Single']).toBeDefined();
    expect(CRASH_TYPE_COLORS['Multiple']).toBeDefined();
    expect(CRASH_TYPE_COLORS['Pedestrian']).toBeDefined();
  });
});
