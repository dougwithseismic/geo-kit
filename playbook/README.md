# The GEO Playbook

The decision rules for getting a site cited by AI search engines, distilled from
[`evidence.md`](./evidence.md). This is the file a human or coding agent reads
*before* touching any GEO work. Every rule links back to the evidence so tactics
stay grounded, not folklore.

## The one-page mental model

1. **Get in the index** — AI engines can only cite what they can crawl and read.
2. **Be the clearest answer** — structure content so the answer is extractable.
3. **Be a known entity** — earned mentions + knowledge-graph presence.
4. **Measure the right thing** — most citations are zero-click; triangulate.
5. **Check each engine's view** — run the fan-out and score the site:
   is it seen, opened and cited? See [`engine-coverage.md`](./engine-coverage.md).

Work them in that order. Skipping #1 makes #2–4 worthless. Do #5 at the start
too: it's the baseline, and it shows which of #1–3 is the real gap.

## Crawler-access matrix (evidence §1)

Allow these — they gate whether you can be **cited**:

| User-agent | Engine | Controls |
| --- | --- | --- |
| `OAI-SearchBot` | ChatGPT | Search/citation retrieval |
| `ChatGPT-User` | ChatGPT | Live user-triggered fetch |
| `Claude-SearchBot` | Claude | Search/citation retrieval |
| `Claude-User` | Claude | Live user-triggered fetch |
| `PerplexityBot` | Perplexity | Search/citation retrieval |
| `Perplexity-User` | Perplexity | Live user-triggered fetch |
| `Bingbot` | Bing → grounds ChatGPT | Search index |
| `DuckAssistBot` | DuckDuckGo | Retrieval |

Optional (training only — blocking does **not** affect citations): `GPTBot`,
`ClaudeBot`, `CCBot`, `Google-Extended`, `Applebot-Extended`. Default the kit to
**allow all** for maximum exposure; flip to disallow-training if rights concerns
win.

> **Training blocks can block live answers too.** Cloudflare's "AI Crawler and
> Agent access policies" (Security → Settings) group crawlers into Search,
> Training and Agents, and in November 2026 it filed `Claude-User` under
> Training. "Training: Disallow" therefore blocked Claude from opening pages
> mid-answer. Per-crawler toggles in AI Crawl Control → Security are locked
> while a policy covers them; change the policy itself. "Bot Preference Sync" is
> the setting that prepends Cloudflare's managed block to `robots.txt`.

> **Check first.** The #1 failure mode is an edge/CDN (e.g. Cloudflare "Block AI
> Scrapers") silently 403-ing these agents. Verify from outside:
> `for ua in GPTBot OAI-SearchBot ClaudeBot Claude-User Claude-SearchBot PerplexityBot; do curl -s -o /dev/null -w "$ua %{http_code}\n" -A "$ua" https://YOURSITE/; done`
> — expect `200`, not `403`. This fakes the user-agent only; CDNs verify real
> bots by IP, so confirm with real bot hits in your logs a few days later.

## Technical-hygiene checklist (evidence §2, §3)

- [ ] Server-render anything you want cited (AI crawlers don't run JS).
- [ ] One coherent `robots.txt` with the allow-list above; correct sitemap URL.
- [ ] Sitemap covers every citable page (blog, locations, key routes).
- [ ] Verify Bing Webmaster Tools; automate IndexNow pings (ChatGPT ← Bing).
- [ ] Default OG image exists; canonical URLs set; clean redirects (no 404 churn).

## On-page structure checklist (evidence §4)

For every page you want cited:

- [ ] **Answer-first**: a 40–70 word direct answer at the very top
      (`<KeyAnswer>`). Clarity/summarisation is the single strongest factor.
- [ ] **Question-styled headings** ("Where to eat in X?", "Is Y worth it?").
- [ ] **Sourced statistics** with named sources (`<StatCallout>`).
- [ ] **FAQ block** emitting FAQPage JSON-LD (`<Faq>` / `<FaqItem>`), mirroring
      real search-query phrasing.
- [ ] **EEAT in visible text**: real author bios/credentials, primary sources.
- [ ] **Freshness**: an updated date; keep year markers current. Agents add the
      year to most searches on their own (93% of Claude runs in one batch).
- [ ] **Something only you have**: agents open the primary source over a guide
      about it. Dated prices, verified hours, first-hand notes, your own data.

## Off-site priority order (evidence §5, §6)

Higher leverage than publishing more pages:

1. **Earned mentions** — local/niche press, YouTube mentions, digital PR.
   (A press page + a target list makes each pitch cheap.)
2. **Knowledge-graph entity** — Wikidata item; Wikipedia only once notability is
   met.
3. **Listings (for local)** — Google Business Profile, Bing Places, Yelp,
   Foursquare, with byte-identical NAP.
4. **Quality per-geography/topic pages** — not thousands of thin ones.

Pick press and listing targets from the fan-out, not from a generic list: the
domains agents open for your terms (`coverage.md` → "Opened instead") are where a
mention reaches them. If an aggregator wins your brand search (Eventbrite did for
Dinners With Friends), every listing there should link to your site under the
exact brand name.

## Measurement (evidence §7)

Triangulate — never rely on referrals alone:

- GSC generative-AI report (Google AI impressions).
- Bing WMT AI Performance (citations + grounding queries).
- Referrer channel (`chatgpt.com`, `perplexity.ai`, `claude.ai`, `gemini…`).
- Server/middleware AI-bot hits (`ChatGPT-User` ≈ used in a live answer).
- Monthly manual citation spot-checks on canonical prompts.
- Monthly fan-out coverage: the seen → opened → cited funnel per engine on a
  fixed term list ([`engine-coverage.md`](./engine-coverage.md)).

## Deliberately NOT doing (evidence §8)

- ❌ `llms.txt` / `llms-full.txt` — no engine consumes it.
- ❌ `speakable` schema — no consumer.
- ❌ Mass programmatic thin pages — page count barely correlates.
- ❌ Reddit-seeding / astroturf — Reddit <2% of UK citations; organic only.
- ❌ Bing Copilot-specific work — collapsed; covered via Bing indexing anyway.
