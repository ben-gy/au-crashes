import type { FatalityRecord, RecordsData } from './types';

/** Format a number with locale separators */
export function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString('en-AU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format a percentage with sign */
export function formatPercent(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

/** Sorted entries from a count map, descending by value */
export function sortedEntries(obj: Record<string, number>): [string, number][] {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]);
}

/** Convert column-oriented records to typed objects */
export function parseRecords(raw: RecordsData): FatalityRecord[] {
  const { columns, data } = raw;
  return data.map(row => {
    const obj: Record<string, string | number> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as unknown as FatalityRecord;
  });
}

/** Debounce a function */
export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

/** Get max value from a record */
export function maxValue(obj: Record<string, number>): number {
  const vals = Object.values(obj);
  return vals.length ? Math.max(...vals) : 0;
}

/** Create an HTML element with attributes and children */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  ...children: (string | Node)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  }
  return el;
}

/** State colour palette — consistent across all views */
export const STATE_COLORS: Record<string, string> = {
  NSW: '#2563eb',
  VIC: '#1e3a5f',
  QLD: '#9333ea',
  WA: '#dc2626',
  SA: '#d97706',
  TAS: '#059669',
  ACT: '#0891b2',
  NT: '#c2410c',
};

/** Road user colours */
export const ROAD_USER_COLORS: Record<string, string> = {
  Driver: '#2563eb',
  Passenger: '#7c3aed',
  Pedestrian: '#dc2626',
  'Motorcycle rider': '#d97706',
  'Motorcycle passenger': '#ea580c',
  'Pedal cyclist': '#059669',
  Other: '#6b7280',
};

/** Crash type colours */
export const CRASH_TYPE_COLORS: Record<string, string> = {
  Single: '#2563eb',
  Multiple: '#d97706',
  Pedestrian: '#dc2626',
};

/** Interpolate colour intensity for heatmaps */
export function heatColor(value: number, max: number): string {
  if (max === 0) return 'rgba(30, 58, 95, 0.05)';
  const t = Math.min(value / max, 1);
  const r = Math.round(30 + t * (220 - 30));
  const g = Math.round(58 + t * (38 - 58));
  const b = Math.round(95 + t * (38 - 95));
  const a = 0.1 + t * 0.85;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
