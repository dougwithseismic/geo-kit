/**
 * Fan-out harvesting — what AI agents actually search for.
 *
 * When an agent answers "best SEO agency in London for FMCG" it does not run
 * that query. It fans out into its own sub-queries (award winners, case
 * studies, "X appointed Y", competitor OR-lists…), opens a handful of pages
 * and cites a few. Those sub-queries are the real targets for GEO.
 *
 * This module is pure: it parses the event logs the agent CLIs already emit
 * and aggregates them. Running the CLIs lives in `cli.ts`.
 *
 * - Claude Code: `claude -p … --output-format stream-json --verbose`
 *   (also parses subagent transcripts, which share the message shape).
 * - Codex: `codex --search exec --json …` (`web_search` items carry
 *   `action.queries[]`, `open_page`, `find_in_page` and result domains).
 */

export type Engine = "claude" | "codex";

export interface SearchCall {
  /** One tool call; Codex batches several queries per call. */
  id: string;
  queries: string[];
}

export interface RunTrace {
  engine: Engine;
  term: string;
  model?: string;
  searchCalls: SearchCall[];
  /** Pages the agent opened (WebFetch / open_page). */
  fetches: string[];
  /** In-page searches (Codex find_in_page): what it went looking for. */
  pageSearches: { url: string; pattern: string }[];
  /** Domains that came back in search results (seen, not necessarily read). */
  resultDomains: string[];
  finalText: string;
  error?: string;
  usage?: Record<string, unknown>;
  costUsd?: number;
}

type Json = Record<string, any>;

function parseLines(raw: string): Json[] {
  const out: Json[] = [];
  for (const line of raw.split("\n")) {
    const s = line.trim();
    if (!s.startsWith("{")) continue;
    try {
      out.push(JSON.parse(s));
    } catch {
      /* partial line from an interrupted run */
    }
  }
  return out;
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

const URL_RE = /https?:\/\/[^\s"'<>)\]\\,]+/g;

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content
      .map((c) => (typeof c === "string" ? c : (c?.text ?? "")))
      .join(" ");
  return "";
}

/** Claude Code stream-json, or a subagent JSONL transcript. */
export function parseClaudeTrace(raw: string, term: string): RunTrace {
  const trace: RunTrace = {
    engine: "claude",
    term,
    searchCalls: [],
    fetches: [],
    pageSearches: [],
    resultDomains: [],
    finalText: "",
  };
  const searchIds = new Set<string>();
  let lastText = "";
  for (const e of parseLines(raw)) {
    if (e.type === "system" && e.subtype === "init" && e.model)
      trace.model = e.model;
    if (e.type === "result") {
      if (typeof e.result === "string") trace.finalText = e.result;
      if (e.is_error) trace.error = String(e.result ?? "error");
      trace.usage = e.usage;
      if (typeof e.total_cost_usd === "number") trace.costUsd = e.total_cost_usd;
      const models = Object.keys(e.modelUsage ?? {});
      if (models.length && !trace.model) trace.model = models.join(",");
    }
    const content = e.message?.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (e.type === "assistant" && c?.type === "text" && c.text)
        lastText = c.text;
      if (e.type === "assistant" && c?.type === "tool_use") {
        if (c.name === "WebSearch" && c.input?.query) {
          searchIds.add(c.id);
          trace.searchCalls.push({ id: c.id, queries: [String(c.input.query)] });
        } else if (c.name === "WebFetch" && c.input?.url) {
          trace.fetches.push(String(c.input.url));
        } else if (c.name === "SubagentHandback" && c.input?.message) {
          // Subagents deliver their answer through this tool, not as text.
          lastText = String(c.input.message);
        }
      }
      if (e.type === "user" && c?.type === "tool_result" && searchIds.has(c.tool_use_id)) {
        for (const u of textOf(c.content).match(URL_RE) ?? []) {
          const d = domainOf(u);
          if (d) trace.resultDomains.push(d);
        }
      }
    }
  }
  if (!trace.finalText) trace.finalText = lastText;
  return trace;
}

/** Codex `exec --json` events. */
export function parseCodexTrace(raw: string, term: string): RunTrace {
  const trace: RunTrace = {
    engine: "codex",
    term,
    searchCalls: [],
    fetches: [],
    pageSearches: [],
    resultDomains: [],
    finalText: "",
  };
  for (const e of parseLines(raw)) {
    if (e.type === "turn.completed") trace.usage = e.usage;
    if (e.type === "turn.failed" || e.type === "error")
      trace.error = String(e.error?.message ?? e.message ?? "error");
    if (e.type !== "item.completed") continue;
    const item = e.item ?? {};
    if (item.type === "agent_message" && item.text) trace.finalText = item.text;
    if (item.type !== "web_search") continue;
    const a = item.action ?? {};
    if (a.type === "search") {
      const qs: string[] = Array.isArray(a.queries) && a.queries.length
        ? a.queries.map(String)
        : a.query
          ? [String(a.query)]
          : item.query
            ? [String(item.query)]
            : [];
      if (qs.length) trace.searchCalls.push({ id: String(item.id), queries: qs });
    } else if (a.type === "open_page" && a.url) {
      trace.fetches.push(String(a.url));
    } else if (a.type === "find_in_page" && a.url) {
      trace.pageSearches.push({ url: String(a.url), pattern: String(a.pattern ?? "") });
    }
    for (const r of item.results ?? []) {
      const d = r?.domain ? String(r.domain).replace(/^www\./, "").toLowerCase() : domainOf(r?.url ?? "");
      if (d && d !== "null") trace.resultDomains.push(d);
    }
  }
  return trace;
}

export function parseTrace(engine: Engine, raw: string, term: string): RunTrace {
  return engine === "codex" ? parseCodexTrace(raw, term) : parseClaudeTrace(raw, term);
}

export function queriesOf(trace: RunTrace): string[] {
  return trace.searchCalls.flatMap((c) => c.queries);
}

// ── Classification ──────────────────────────────────────────────────────────

export type QueryLabel =
  | "head"
  | "proof:awards"
  | "proof:case-study"
  | "proof:account-win"
  | "proof:reviews"
  | "pricing"
  | "comparison"
  | "location-check"
  | "site-scoped"
  | "or-list"
  | "spec/feature"
  | "other";

const LABEL_RULES: [QueryLabel, RegExp][] = [
  ["proof:awards", /\b(awards?|winners?|shortlist(ed)?|finalists?)\b/i],
  ["proof:account-win", /\b(appoint(s|ed|ment)?|account win|wins .* account|hires|hired|selects|chooses|retained)\b/i],
  ["proof:case-study", /\b(case stud(y|ies)|results|clients?|portfolio|success stor(y|ies))\b/i],
  ["proof:reviews", /\b(reviews?|rating|ratings|trustpilot|clutch|g2|capterra|reddit|complaints?|which\?)\b/i],
  ["pricing", /(\b(price|prices|pricing|cost|costs|cheap(est)?|fees?|per month|quote|budget|deal|deals|discount)\b|£|\$)/i],
  ["comparison", /(\bvs\.?\b|\bversus\b|\bcompar(e|ison|ed)\b|\balternatives?\b)/i],
  ["location-check", /\b(address|office|offices|contact|headquarter(s|ed)?|based in|located)\b/i],
  ["site-scoped", /\bsite[:.][a-z0-9-]+\./i],
  ["spec/feature", /\b(features?|specs?|specifications?|integrations?|warranty|battery|range|size|sizes|ingredients|how (to|does))\b/i],
  ["head", /\b(best|top|leading|recommended|recommend|most popular)\b/i],
];

export function classifyQuery(q: string): QueryLabel[] {
  const labels = LABEL_RULES.filter(([, re]) => re.test(q)).map(([l]) => l);
  if ((q.match(/\bOR\b/g) ?? []).length >= 2) labels.push("or-list");
  return labels.length ? labels : ["other"];
}

export const YEAR_RE = /\b20[1-3]\d\b/;
const RECENCY_RE = /\b(latest|newest|current(ly)?|this year|updated|recent(ly)?|new)\b/i;

export function hasRecencySignal(q: string): { year: boolean; word: boolean } {
  return { year: YEAR_RE.test(q), word: RECENCY_RE.test(q) };
}

const tokens = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9£$&' ]+/g, " ").split(/\s+/).filter(Boolean);

/** Share of the query's words that come from the user's term (1 = restatement). */
export function termOverlap(q: string, term: string): number {
  const t = new Set(tokens(term));
  const qt = tokens(q).filter((w) => w !== "or");
  if (!qt.length) return 0;
  return qt.filter((w) => t.has(w)).length / qt.length;
}

/**
 * Reduce a query to a reusable pattern: words from the term become `{term}`,
 * years become `{year}`, quoted strings and capitalised names become `{name}`.
 */
export function queryTemplate(q: string, term: string): string {
  const termWords = new Set(tokens(term));
  const cleaned = q
    .replace(/"[^"]+"/g, " {name} ")
    .replace(YEAR_RE, " {year} ")
    .replace(/\bsite[:.]\S+/gi, " {site} ");
  const words = cleaned.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (const w of words) {
    const lw = w.toLowerCase().replace(/[^a-z0-9£$&']/g, "");
    let tok: string;
    if (w.startsWith("{")) tok = w;
    else if (lw && termWords.has(lw)) tok = "{term}";
    else if (w === "OR") tok = "OR";
    else if (/^[A-Z][a-zA-Z0-9&'.-]+$/.test(w)) tok = "{name}";
    else tok = lw;
    if (!tok) continue;
    if (tok === out[out.length - 1] && tok.startsWith("{")) continue;
    out.push(tok);
  }
  return out.join(" ").replace(/\{name\}( OR \{name\})+/g, "{name-list}");
}

const FILLER = new Set(["a","an","the","of","for","in","on","to","and","or","with","by","at","from","uk","london","best","top","agency","agencies","company","companies","official"]);

/** Light singularisation so "case studies" and "case study" count together. */
function singular(w: string): string {
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us")) return w.slice(0, -1);
  return w;
}

/**
 * What the query adds beyond the term and any names: the intent words
 * ("case study", "winners", "pricing", "office contact"). Lowercase, in order.
 */
export function queryModifier(q: string, term: string): string {
  const termWords = new Set(tokens(term));
  const words = q
    .replace(/"[^"]+"/g, " ")
    .replace(/\bsite[:.]\S+/gi, " ")
    .replace(YEAR_RE, " ")
    .split(/\s+/)
    .filter((w) => w && w !== "OR" && !/^[A-Z][a-zA-Z0-9&'.-]*$/.test(w))
    .map((w) => w.toLowerCase().replace(/[^a-z0-9£$&']/g, ""))
    .filter((w) => w && !termWords.has(w) && !FILLER.has(w))
    .map(singular);
  return words.join(" ");
}

/** Domains the agent scoped a search to (site:example.com) — candidates it was checking. */
export function siteScopedDomains(q: string): string[] {
  return [...q.matchAll(/\bsite[:.]((?:[a-z0-9-]+\.)+[a-z]{2,})/gi)].map((m) => m[1].toLowerCase().replace(/^www\./, ""));
}

/** Capitalised names in a query that are not in the term — entities the agent brought. */
export function namedEntities(q: string, term: string): string[] {
  const termWords = new Set(tokens(term));
  const quoted = [...q.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const stripped = q.replace(/"[^"]+"/g, " | ").replace(/\b(OR|AND)\b/g, " | ");
  const caps = stripped.match(/\b[A-Z][a-zA-Z0-9&'.-]*(?:\s+[A-Z][a-zA-Z0-9&'.-]*)*/g) ?? [];
  const STOP = new Set(["OR", "AND", "UK", "US", "USA", "EU", "SEO", "B2B", "B2C", "DTC", "FMCG", "CPG", "AI", "I"]);
  return [...quoted, ...caps]
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && !STOP.has(s) && !tokens(s).every((w) => termWords.has(w)));
}

// ── Aggregation ─────────────────────────────────────────────────────────────

export interface EngineSummary {
  engine: Engine;
  runs: number;
  failedRuns: number;
  runsWithSearch: number;
  queries: number;
  searchCalls: number;
  avgQueriesPerRun: number;
  avgFetchesPerRun: number;
  /** Share of queries carrying each label. */
  labelShare: Record<string, number>;
  /** Share of runs using each label at least once. */
  labelRunShare: Record<string, number>;
  yearShare: number;
  recencyWordShare: number;
  runsWithYearShare: number;
  restatementShare: number;
  topTemplates: [string, number][];
  topFetchedDomains: [string, number][];
  topResultDomains: [string, number][];
  topEntities: [string, number][];
  /** Intent words added beyond the term (runs). */
  topModifiers: [string, number][];
  /** Domains searched with site: (runs). */
  topSiteScoped: [string, number][];
  /** Entities named in the first search call — before any results came back. */
  topFirstCallEntities: [string, number][];
  costUsd: number;
}

function top(counter: Map<string, number>, n: number): [string, number][] {
  return [...counter.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
}

function bump(m: Map<string, number>, k: string, by = 1) {
  if (k) m.set(k, (m.get(k) ?? 0) + by);
}

export function summarise(engine: Engine, traces: RunTrace[], topN = 25): EngineSummary {
  const ok = traces.filter((t) => !t.error);
  const labelQ = new Map<string, number>();
  const labelRuns = new Map<string, number>();
  const templates = new Map<string, number>();
  const fetched = new Map<string, number>();
  const results = new Map<string, number>();
  const entities = new Map<string, number>();
  const firstEntities = new Map<string, number>();
  const modifiers = new Map<string, number>();
  const siteScoped = new Map<string, number>();
  let nq = 0, calls = 0, years = 0, recency = 0, restate = 0, runsWithYear = 0, fetches = 0, withSearch = 0, cost = 0;

  for (const t of ok) {
    const qs = queriesOf(t);
    if (qs.length) withSearch++;
    calls += t.searchCalls.length;
    fetches += t.fetches.length;
    cost += t.costUsd ?? 0;
    const runLabels = new Set<string>();
    let runYear = false;
    // Count each distinct template/domain/entity once per run so one chatty run can't dominate.
    const runTemplates = new Set<string>();
    const runEntities = new Set<string>();
    const runModifiers = new Set<string>();
    const runSites = new Set<string>();
    for (const q of qs) {
      const mod = queryModifier(q, t.term);
      if (mod) runModifiers.add(mod);
      for (const d of siteScopedDomains(q)) runSites.add(d);
      nq++;
      for (const l of classifyQuery(q)) {
        bump(labelQ, l);
        runLabels.add(l);
      }
      const r = hasRecencySignal(q);
      if (r.year) { years++; runYear = true; }
      if (r.word) recency++;
      if (termOverlap(q, t.term) >= 0.75) restate++;
      runTemplates.add(queryTemplate(q, t.term));
      for (const en of namedEntities(q, t.term)) runEntities.add(en);
    }
    if (runYear) runsWithYear++;
    for (const l of runLabels) bump(labelRuns, l);
    for (const tp of runTemplates) bump(templates, tp);
    for (const en of runEntities) bump(entities, en);
    for (const m of runModifiers) bump(modifiers, m);
    for (const d of runSites) bump(siteScoped, d);
    for (const en of new Set(t.searchCalls[0]?.queries.flatMap((q) => namedEntities(q, t.term)) ?? [])) bump(firstEntities, en);
    for (const d of new Set(t.fetches.map(domainOf))) bump(fetched, d);
    for (const d of new Set(t.resultDomains)) bump(results, d);
  }
  const share = (m: Map<string, number>, denom: number) =>
    Object.fromEntries(top(m, 50).map(([k, v]) => [k, denom ? +(v / denom).toFixed(3) : 0]));
  return {
    engine,
    runs: traces.length,
    failedRuns: traces.length - ok.length,
    runsWithSearch: withSearch,
    queries: nq,
    searchCalls: calls,
    avgQueriesPerRun: ok.length ? +(nq / ok.length).toFixed(1) : 0,
    avgFetchesPerRun: ok.length ? +(fetches / ok.length).toFixed(1) : 0,
    labelShare: share(labelQ, nq),
    labelRunShare: share(labelRuns, ok.length),
    yearShare: nq ? +(years / nq).toFixed(3) : 0,
    recencyWordShare: nq ? +(recency / nq).toFixed(3) : 0,
    runsWithYearShare: ok.length ? +(runsWithYear / ok.length).toFixed(3) : 0,
    restatementShare: nq ? +(restate / nq).toFixed(3) : 0,
    topTemplates: top(templates, topN),
    topFetchedDomains: top(fetched, topN),
    topResultDomains: top(results, topN),
    topEntities: top(entities, topN),
    topModifiers: top(modifiers, topN),
    topSiteScoped: top(siteScoped, topN),
    topFirstCallEntities: top(firstEntities, topN),
    costUsd: +cost.toFixed(2),
  };
}

// ── Site coverage ───────────────────────────────────────────────────────────

/** One run, seen from one site's point of view: found → opened → cited. */
export interface SiteRun {
  engine: Engine;
  term: string;
  queries: number;
  /** The site's domain came back in search results. */
  seen: boolean;
  /** 1-based position among the run's distinct result domains, in the order they came back. */
  seenAt?: number;
  /** The agent opened a page on the site. */
  opened: boolean;
  /** The final answer names the brand or domain. */
  cited: boolean;
  /** The agent searched for the brand or domain itself. */
  queried: boolean;
  /** Domain-scoped searches (site:example.com) in this run. */
  scoped: string[];
}

export interface SiteEngineCoverage {
  engine: Engine;
  runs: number;
  seen: number;
  opened: number;
  cited: number;
  queried: number;
  /** Runs where the site was the first result domain. */
  seenFirst: number;
  /** Domains opened instead (runs), excluding the site. */
  topOpened: [string, number][];
  /** Domains seen in results (runs), excluding the site. */
  topSeen: [string, number][];
  /** Domains the agent scoped searches to (runs). */
  topScoped: [string, number][];
}

export interface SiteCoverage {
  site: string;
  runs: SiteRun[];
  engines: SiteEngineCoverage[];
  /** Rank of the site among every domain seen or opened across all runs (by runs). 0 if absent. */
  overallRank: number;
  distinctDomains: number;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A case-insensitive pattern for a brand name or domain that tolerates spacing ("Dinners With Friends" ~ "dinnerswithfriends"). */
export function brandPattern(site: string, brand?: string): RegExp {
  const label = site.replace(/^www\./, "").split(".")[0];
  const parts = [escapeRe(site), escapeRe(label)];
  if (brand) parts.push(brand.trim().split(/\s+/).map(escapeRe).join("\\s*"));
  return new RegExp(parts.join("|"), "i");
}

const onSite = (domain: string, site: string) => domain === site || domain.endsWith(`.${site}`);

/**
 * Where does one site show up across a batch of runs, and who takes its place?
 * The funnel is seen (in results) → opened (page read) → cited (named in the answer).
 */
export function siteCoverage(traces: RunTrace[], site: string, opts: { brand?: string; topN?: number } = {}): SiteCoverage {
  const s = site.replace(/^www\./, "").toLowerCase();
  const re = brandPattern(s, opts.brand);
  const topN = opts.topN ?? 15;
  const runs: SiteRun[] = [];
  const all = new Map<string, number>();
  const per = new Map<Engine, { opened: Map<string, number>; seen: Map<string, number>; scoped: Map<string, number> }>();

  for (const t of traces.filter((t) => !t.error)) {
    const qs = queriesOf(t);
    const results = [...new Set(t.resultDomains)];
    const opened = [...new Set(t.fetches.map(domainOf).filter(Boolean))];
    const scoped = [...new Set(qs.flatMap(siteScopedDomains))];
    const idx = results.findIndex((d) => onSite(d, s));
    runs.push({
      engine: t.engine,
      term: t.term,
      queries: qs.length,
      seen: idx >= 0,
      seenAt: idx >= 0 ? idx + 1 : undefined,
      opened: opened.some((d) => onSite(d, s)),
      cited: re.test(t.finalText),
      queried: qs.some((q) => re.test(q)),
      scoped,
    });
    const e = per.get(t.engine) ?? { opened: new Map(), seen: new Map(), scoped: new Map() };
    per.set(t.engine, e);
    for (const d of opened) if (!onSite(d, s)) bump(e.opened, d);
    for (const d of results) if (!onSite(d, s)) bump(e.seen, d);
    for (const d of scoped) bump(e.scoped, d);
    for (const d of new Set([...results, ...opened])) bump(all, onSite(d, s) ? s : d);
  }

  const engines: SiteEngineCoverage[] = [...per.entries()].map(([engine, m]) => {
    const r = runs.filter((x) => x.engine === engine);
    return {
      engine,
      runs: r.length,
      seen: r.filter((x) => x.seen).length,
      opened: r.filter((x) => x.opened).length,
      cited: r.filter((x) => x.cited).length,
      queried: r.filter((x) => x.queried).length,
      seenFirst: r.filter((x) => x.seenAt === 1).length,
      topOpened: top(m.opened, topN),
      topSeen: top(m.seen, topN),
      topScoped: top(m.scoped, topN),
    };
  });
  const ranked = top(all, Infinity);
  return { site: s, runs, engines, overallRank: ranked.findIndex(([d]) => d === s) + 1, distinctDomains: ranked.length };
}

/** Per-term agreement between engines: Jaccard overlap of fetched domains. */
export function engineAgreement(byTerm: Map<string, Partial<Record<Engine, RunTrace>>>): {
  terms: number;
  meanFetchedDomainJaccard: number;
  meanEntityJaccard: number;
} {
  const jac = (a: Set<string>, b: Set<string>) => {
    if (!a.size && !b.size) return null;
    const inter = [...a].filter((x) => b.has(x)).length;
    return inter / (a.size + b.size - inter);
  };
  const fj: number[] = [], ej: number[] = [];
  for (const [term, runs] of byTerm) {
    const c = runs.claude, x = runs.codex;
    if (!c || !x || c.error || x.error) continue;
    const f = jac(new Set(c.fetches.map(domainOf)), new Set(x.fetches.map(domainOf)));
    if (f !== null) fj.push(f);
    const ent = (t: RunTrace) => new Set(queriesOf(t).flatMap((q) => namedEntities(q, term).map((s) => s.toLowerCase())));
    const e = jac(ent(c), ent(x));
    if (e !== null) ej.push(e);
  }
  const mean = (xs: number[]) => (xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(3) : 0);
  return { terms: fj.length, meanFetchedDomainJaccard: mean(fj), meanEntityJaccard: mean(ej) };
}
