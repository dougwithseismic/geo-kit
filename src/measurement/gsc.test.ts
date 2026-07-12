import { describe, it, expect } from "vitest";
import { sumTotals, pctChange, formatPct, findQuery } from "./gsc";

const rows = [
  { keys: ["2026-06-01"], clicks: 10, impressions: 100 },
  { keys: ["2026-06-02"], clicks: 5, impressions: 50 },
];

describe("sumTotals", () => {
  it("sums clicks and impressions", () => {
    expect(sumTotals(rows)).toEqual({ clicks: 15, impressions: 150 });
  });
  it("handles empty input", () => {
    expect(sumTotals([])).toEqual({ clicks: 0, impressions: 0 });
  });
});

describe("pctChange / formatPct", () => {
  it("computes signed percentage change", () => {
    expect(pctChange(150, 100)).toBeCloseTo(50);
    expect(pctChange(80, 100)).toBeCloseTo(-20);
  });
  it("guards a zero baseline", () => {
    expect(pctChange(10, 0)).toBe(0);
  });
  it("formats with a sign and one decimal", () => {
    expect(formatPct(150, 100)).toBe("+50.0%");
    expect(formatPct(96, 100)).toBe("-4.0%");
  });
});

describe("findQuery", () => {
  it("matches a row by its first key", () => {
    const qRows = [
      { keys: ["social groups exeter"], clicks: 1, impressions: 11, position: 11.6 },
    ];
    expect(findQuery(qRows, "social groups exeter")?.position).toBe(11.6);
    expect(findQuery(qRows, "missing")).toBeUndefined();
  });
});
