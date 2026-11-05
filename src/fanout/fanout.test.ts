import { describe, expect, it } from "vitest";
import {
  classifyQuery,
  engineAgreement,
  namedEntities,
  parseClaudeTrace,
  parseCodexTrace,
  queriesOf,
  queryModifier,
  queryTemplate,
  siteScopedDomains,
  summarise,
  termOverlap,
  type Engine,
  type RunTrace,
} from "./fanout";

const term = "best seo agency in london for fmcg";

const claudeRaw = [
  { type: "system", subtype: "init", model: "claude-test" },
  { type: "assistant", message: { content: [{ type: "tool_use", id: "s1", name: "WebSearch", input: { query: "UK Search Awards 2025 winners FMCG" } }] } },
  { type: "user", message: { content: [{ type: "tool_result", tool_use_id: "s1", content: 'Links: [{"title":"Winners","url":"https://www.searchawards.co.uk/2025-winners/"}]' }] } },
  { type: "assistant", message: { content: [{ type: "tool_use", id: "f1", name: "WebFetch", input: { url: "https://riseatseven.com/blog/x", prompt: "?" } }] } },
  { type: "user", message: { content: [{ type: "tool_result", tool_use_id: "f1", content: "page text https://ignored.example.com" }] } },
  { type: "result", result: "Pick Rise at Seven", total_cost_usd: 0.42, usage: { input_tokens: 10 } },
].map((e) => JSON.stringify(e)).join("\n");

const codexRaw = [
  { type: "item.started", item: { id: "w1", type: "web_search", query: "", action: { type: "other" } } },
  { type: "item.completed", item: { id: "w1", type: "web_search", query: "x ...", action: { type: "search", queries: ["London SEO agency FMCG case study", "tmwi London office contact"] }, results: [{ domain: "www.bluearray.co.uk" }, { domain: "null" }] } },
  { type: "item.completed", item: { id: "w2", type: "web_search", action: { type: "open_page", url: "https://www.goup.co.uk/case-studies/a/" } } },
  { type: "item.completed", item: { id: "w3", type: "web_search", action: { type: "find_in_page", url: "https://www.goup.co.uk/case-studies/a/", pattern: "143%" } } },
  { type: "item.completed", item: { id: "m1", type: "agent_message", text: "I'd pick NOVOS" } },
  { type: "turn.completed", usage: { input_tokens: 5 } },
].map((e) => JSON.stringify(e)).join("\n") + "\n{partial";

describe("parseClaudeTrace", () => {
  it("extracts searches, fetches, result domains, final text and cost", () => {
    const t = parseClaudeTrace(claudeRaw, term);
    expect(queriesOf(t)).toEqual(["UK Search Awards 2025 winners FMCG"]);
    expect(t.fetches).toEqual(["https://riseatseven.com/blog/x"]);
    expect(t.resultDomains).toEqual(["searchawards.co.uk"]);
    expect(t.finalText).toBe("Pick Rise at Seven");
    expect(t.model).toBe("claude-test");
    expect(t.costUsd).toBe(0.42);
    expect(t.error).toBeUndefined();
  });

  it("takes a subagent's final answer from its handback call", () => {
    const raw = JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", id: "h1", name: "SubagentHandback", input: { message: "Pick Rise at Seven" } }] } });
    expect(parseClaudeTrace(raw, term).finalText).toBe("Pick Rise at Seven");
  });

  it("flags error results", () => {
    const raw = JSON.stringify({ type: "result", is_error: true, result: "auth disabled" });
    expect(parseClaudeTrace(raw, term).error).toBe("auth disabled");
  });
});

describe("parseCodexTrace", () => {
  it("keeps batched queries together and records page actions", () => {
    const t = parseCodexTrace(codexRaw, term);
    expect(t.searchCalls).toEqual([{ id: "w1", queries: ["London SEO agency FMCG case study", "tmwi London office contact"] }]);
    expect(t.fetches).toEqual(["https://www.goup.co.uk/case-studies/a/"]);
    expect(t.pageSearches).toEqual([{ url: "https://www.goup.co.uk/case-studies/a/", pattern: "143%" }]);
    expect(t.resultDomains).toEqual(["bluearray.co.uk"]);
    expect(t.finalText).toBe("I'd pick NOVOS");
  });
});

describe("classifyQuery", () => {
  it("labels proof, location, OR-list and head queries", () => {
    expect(classifyQuery("UK Search Awards 2025 winners FMCG")).toContain("proof:awards");
    expect(classifyQuery("Red Bull appoints Rise at Seven")).toContain("proof:account-win");
    expect(classifyQuery("tmwi London office contact")).toContain("location-check");
    expect(classifyQuery("Croud OR Brainlabs OR Builtvisible case study")).toEqual(expect.arrayContaining(["or-list", "proof:case-study"]));
    expect(classifyQuery("best SEO agency London FMCG")).toEqual(["head"]);
    expect(classifyQuery("site:example.com something")).toContain("site-scoped");
    expect(classifyQuery("hubspot vs pipedrive pricing")).toEqual(expect.arrayContaining(["comparison", "pricing"]));
    expect(classifyQuery("zzz")).toEqual(["other"]);
  });
});

describe("templates and entities", () => {
  it("abstracts term words, years and names", () => {
    expect(queryTemplate("UK Search Awards 2025 winners FMCG", term)).toBe("{name} {year} winners {term}");
    expect(queryTemplate("Croud OR Brainlabs OR Builtvisible SEO FMCG case study", term)).toBe("{name-list} {term} case study");
  });

  it("finds entities the agent brought that are not in the term", () => {
    expect(namedEntities('London SEO agency Unilever OR "Verve Search" case study', term)).toEqual(["Verve Search", "Unilever"]);
  });

  it("extracts intent words and site-scoped domains", () => {
    expect(queryModifier("UK Search Awards 2025 winners FMCG", term)).toBe("winner");
    expect(queryModifier("site.tmwi.co.uk London office contact", term)).toBe("office contact");
    expect(queryModifier("Croud OR Brainlabs SEO FMCG case study", term)).toBe("case study");
    expect(siteScopedDomains("site.tmwi.co.uk London contact site:www.Example.com")).toEqual(["tmwi.co.uk", "example.com"]);
  });

  it("measures overlap with the user's term", () => {
    expect(termOverlap("best SEO agency London FMCG", term)).toBe(1);
    expect(termOverlap("Red Bull appoints Rise at Seven", term)).toBe(0);
  });
});

describe("summarise / engineAgreement", () => {
  const c = parseClaudeTrace(claudeRaw, term);
  const x = parseCodexTrace(codexRaw, term);
  it("summarises an engine", () => {
    const s = summarise("codex", [x, { ...x, error: "timeout" }]);
    expect(s.runs).toBe(2);
    expect(s.failedRuns).toBe(1);
    expect(s.queries).toBe(2);
    expect(s.labelRunShare["location-check"]).toBe(1);
    expect(s.topFetchedDomains).toEqual([["goup.co.uk", 1]]);
  });
  it("compares engines per term", () => {
    const m = new Map<string, Partial<Record<Engine, RunTrace>>>([[term, { claude: c, codex: x }]]);
    expect(engineAgreement(m).terms).toBe(1);
    expect(engineAgreement(m).meanFetchedDomainJaccard).toBe(0);
  });
});
