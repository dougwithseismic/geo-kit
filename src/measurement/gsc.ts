/**
 * Google Search Console math — the testable core behind `gsc-pull.mjs`.
 * Framework-free; used to compute totals and baseline deltas.
 */

export interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr?: number;
  position?: number;
}

export interface Totals {
  clicks: number;
  impressions: number;
}

/**
 * Sum clicks + impressions over rows. Use the `date`-dimension rows for accurate
 * totals — the `query` dimension omits privacy-filtered queries and undercounts.
 */
export function sumTotals(rows: GscRow[]): Totals {
  return rows.reduce<Totals>(
    (acc, row) => {
      acc.clicks += row.clicks;
      acc.impressions += row.impressions;
      return acc;
    },
    { clicks: 0, impressions: 0 },
  );
}

/** Percentage change from a baseline. Returns 0 when the baseline is 0. */
export function pctChange(now: number, base: number): number {
  if (base === 0) return 0;
  return ((now - base) / base) * 100;
}

/** Signed, 1-dp percentage string, e.g. "+12.3%" / "-4.0%". */
export function formatPct(now: number, base: number): string {
  const pct = pctChange(now, base);
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

/** Find a query row by exact match on its first key. */
export function findQuery(rows: GscRow[], query: string): GscRow | undefined {
  return rows.find((r) => r.keys[0] === query);
}
