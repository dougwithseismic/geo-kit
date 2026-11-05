---
name: geo-audit
description: Audit a website's readiness to be cited by AI search engines (ChatGPT search, Google AI Overviews/AI Mode, Perplexity, Claude). Use when asked to "audit our AI SEO / GEO", "why aren't we cited by ChatGPT", "check our AI-crawler access", or before starting GEO work. Produces a prioritized gap report.
---

# GEO Audit

Inventory a site's Generative-Engine-Optimization surface and emit a
**prioritized gap report**. Work top-to-bottom; report findings with concrete
file paths / URLs and a fix for each. Grounded in the geo-kit playbook (embedded
below so this skill is self-contained).

## Step 1 — Crawler access (do this FIRST; it gates everything)

The #1 failure mode is an edge/CDN silently blocking AI crawlers. Verify from
outside the app:

```bash
for ua in GPTBot OAI-SearchBot ChatGPT-User ClaudeBot Claude-SearchBot Claude-User PerplexityBot CCBot; do
  echo "$ua -> $(curl -s -o /dev/null -w '%{http_code}' -A "$ua" https://TARGET/)"
done
```

- `403`/`503` on the retrieval/user agents (`OAI-SearchBot`, `Claude-SearchBot`,
  `PerplexityBot`, `ChatGPT-User`, `Claude-User`, `Perplexity-User`) = **critical
  blocker** — the site cannot be cited by that engine. Usual cause: Cloudflare
  "Block AI Scrapers / AI Crawl Control", or a `robots.txt` `Disallow` for those
  agents. Flag it as blocker #1.
- On Cloudflare, check the zone-wide policy (Security → Settings → "AI Crawler
  and Agent access policies"), not just the per-crawler toggles in AI Crawl
  Control → Security, which the policy locks. "Training: Disallow" has blocked
  `Claude-User` (live in-answer fetches), because Cloudflare files it under
  Training. "Bot Preference Sync" is what injects the managed robots.txt block.
- A faked user-agent only tests the rule. CDNs verify real bots by IP, so
  confirm with real bot hits in server logs after any change.
- Fetch `robots.txt` and check: is there ONE coherent file? Correct sitemap URL?
  Are the retrieval agents allowed? Any managed/injected block (e.g. Cloudflare
  "Content-Signal ai-train=no")?

## Step 2 — Indexability & hygiene

- **SSR check:** fetch a key page and strip `<script>` — is the primary content
  in the raw HTML? AI crawlers don't run JS; client-only content is invisible.
- **Sitemap:** does `/sitemap.xml` exist and cover every citable route (blog,
  location pages, key routes)? Any orphan pages absent from it?
- **Bing:** is the site in Bing Webmaster Tools? (ChatGPT grounds via Bing.)
  Is IndexNow set up?
- **OG image / canonical:** default OG image resolves (not 404)? Canonicals set?

## Step 3 — Structured data

Grep the rendered HTML for `application/ld+json`. Inventory schema types present
and missing:

- Expected where relevant: `Organization` + `WebSite` (home), `BreadcrumbList`,
  `FAQPage`, `Article`/`NewsArticle` (blog), plus domain schema
  (`Event`/`Product`/`LocalBusiness`).
- Check `Organization` for `sameAs`, `founder`, `areaServed`, `knowsAbout`.
- Flag fabricated/invalid data (e.g. an Event with a made-up `startDate`).

## Step 4 — On-page structure (sample the top pages)

For each sampled page, does it have:

- An **answer-first** summary in the first screen (40–70 words)?
- **Question-styled headings**?
- **Sourced statistics**?
- An **FAQ** section emitting FAQPage JSON-LD?
- Visible **EEAT** (author, credentials, primary sources) and an **updated date**?

## Step 5 — Off-site & entity (report, don't fix)

- Wikidata/Wikipedia entity present? Google Business Profile (for local)?
  Branded mentions in local/niche press? YouTube presence?
- Search the brand name unscoped in an AI engine's own search tool (Claude's
  WebSearch, standard mode). If an aggregator (Eventbrite, Meetup, a directory)
  takes the results instead of the homepage, the engine doesn't know the brand.

## Step 6 — Each engine's view (if time allows)

Whether agents find, open and cite the site depends on their own search index,
not Google's. Check it directly with Claude's WebSearch tool:

- `allowed_domains: ["TARGET"]` with a broad word → indexed at all?
- 3–5 terms where the site is top 10 on Google, unscoped → does it rank there?
- The same terms in `extended` mode → a ranking-depth problem? Agents almost
  always use `standard`.

"Indexed but never ranks" is an entity/authority gap, not a content gap. For a
full measurement, use the `geo-fanout` skill.

## Output — the gap report

Rank findings by leverage, not order found:

1. **Blockers** (crawler 403s, client-only rendering) — nothing else matters until fixed.
2. **High** (missing schema, no answer-first structure, sitemap gaps, no IndexNow/Bing,
   brand unknown to an engine's index).
3. **Medium** (EEAT, freshness, OG, entity signals).
4. **Explicitly skip** — call out any `llms.txt`/speakable/mass-thin-page work as
   folklore (no engine consumes llms.txt; page count barely correlates with AI
   visibility). Don't recommend them.

For each finding: what, where (path/URL), the fix, and the expected impact. If
geo-kit's `playbook/` is available, cite the relevant section; otherwise the
rules above are self-sufficient.
