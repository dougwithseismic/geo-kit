#!/usr/bin/env node
/**
 * Pull Google Search Console data and print totals (and deltas vs a baseline).
 * Framework-free runnable script; the pure math it mirrors lives in `gsc.ts`
 * (unit-tested).
 *
 * Auth: Application Default Credentials with the webmasters scope:
 *   gcloud auth application-default login \
 *     --scopes=https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform
 *
 * Usage:
 *   GEO_GSC_SITE="sc-domain:example.com" \
 *   GEO_GSC_QUOTA_PROJECT="my-gcp-project" \
 *   node src/measurement/gsc-pull.mjs [days=28]
 *
 * Writes raw rows to gitignored `data/<end>-{query,page,date}.json`.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = process.env.GEO_GSC_SITE;
const QUOTA_PROJECT = process.env.GEO_GSC_QUOTA_PROJECT;
if (!SITE) {
  console.error("Set GEO_GSC_SITE (e.g. sc-domain:example.com).");
  process.exit(1);
}

const days = Number(process.argv[2] ?? 28);
const end = new Date(Date.now() - 2 * 86400_000); // GSC lags ~2 days
const start = new Date(end.getTime() - (days - 1) * 86400_000);
const fmt = (d) => d.toISOString().slice(0, 10);

const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
  SITE,
)}/searchAnalytics/query`;

const token = execFileSync(
  "gcloud",
  ["auth", "application-default", "print-access-token"],
  { encoding: "utf8" },
).trim();

async function query(dimensions) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(QUOTA_PROJECT ? { "x-goog-user-project": QUOTA_PROJECT } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate: fmt(start),
      endDate: fmt(end),
      dimensions,
      rowLimit: 5000,
    }),
  });
  if (!res.ok) throw new Error(`GSC API ${res.status}: ${await res.text()}`);
  return (await res.json()).rows ?? [];
}

const [queryRows, pageRows, dateRows] = await Promise.all([
  query(["query"]),
  query(["page"]),
  query(["date"]),
]);

// Sum the DATE dimension for accurate totals — the query dimension omits
// privacy-filtered queries and undercounts heavily.
const totals = dateRows.reduce(
  (acc, r) => ({
    clicks: acc.clicks + r.clicks,
    impressions: acc.impressions + r.impressions,
  }),
  { clicks: 0, impressions: 0 },
);

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "data");
mkdirSync(dataDir, { recursive: true });
for (const [name, rows] of [
  ["query", queryRows],
  ["page", pageRows],
  ["date", dateRows],
]) {
  writeFileSync(
    join(dataDir, `${fmt(end)}-${name}.json`),
    JSON.stringify(rows, null, 1),
  );
}

console.log(`\nGSC ${days}d ${fmt(start)}..${fmt(end)}  (${SITE})`);
console.log(`  clicks:      ${totals.clicks}`);
console.log(`  impressions: ${totals.impressions}`);
console.log(`\nRaw rows: src/measurement/data/${fmt(end)}-{query,page,date}.json`);
console.log(
  "Tip: record a baseline and diff future runs (see gsc.ts pctChange/formatPct).\n",
);
