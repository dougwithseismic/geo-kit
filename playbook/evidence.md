# The GEO Evidence Base

What *measurably* drives citations in AI answers (ChatGPT search, Google AI
Overviews / AI Mode, Perplexity, Claude), distilled from empirical studies as of
mid-2026. This is the grounding for every tactic in the kit — cite it, and flag
folklore as folklore.

> **How to read this.** Each claim notes its strength. **[evidence]** = backed by
> a study with a real sample. **[vendor]** = vendor-run study (directionally
> useful, watch for incentive). **[folklore]** = widely repeated, not supported —
> do not spend on it.

---

## 1. Crawler access is binary and per-user-agent

AI engines use *different* crawlers for different purposes, and blocking the
wrong one silently removes you from answers. **[evidence — provider docs]**

- **Retrieval / citation crawlers** decide whether you can appear in cited
  answers: `OAI-SearchBot` (ChatGPT search), `Claude-SearchBot`,
  `PerplexityBot`, `DuckAssistBot`. Block any and you vanish from that engine's
  cited answers.
- **Live user-fetch agents** fetch a page for a specific user's question:
  `ChatGPT-User`, `Claude-User`, `Perplexity-User`. Their hits are the closest
  observable proxy for "you were used in a live answer."
- **Training crawlers** collect model-training data only: `GPTBot`, `ClaudeBot`,
  `CCBot`. **Blocking these does NOT affect citations** — it only opts you out of
  training.
- **Opt-out tokens** (not crawlers): `Google-Extended` gates Gemini *training*
  only — blocking it has no effect on Google Search or AI Overviews.
  `Applebot-Extended` likewise for Apple Intelligence training.
- Robots changes propagate to ChatGPT search inclusion in ~24h. `robots.txt` is
  not honoured by every actor (Perplexity has been observed using undeclared
  crawlers), so genuine *blocking* needs edge/CDN rules — but for a business that
  *wants* citations, the action is simply: **allow the retrieval + user-fetch
  agents.**

**Action:** allow `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`,
`Claude-User`, `PerplexityBot`, `Perplexity-User`, `Bingbot`, `DuckAssistBot`.
Training crawlers are an optional, separate rights decision.

## 2. AI crawlers do not execute JavaScript

All major AI crawlers parse raw HTML and do **not** render JS (the exception is
Gemini via Googlebot's rendering, and Applebot). Client-rendered content is
invisible to them. **[evidence — large-scale log analyses]**

- They also waste ~35% of fetches on 404s (vs Googlebot ~8%), so accurate
  sitemaps, clean URLs, and correct redirects help AI crawlers disproportionately.

**Action:** server-render anything you want cited. Keep sitemaps and redirects
clean.

## 3. ChatGPT is grounded largely via Bing's index

The bulk of ChatGPT's web-search answers are sourced through Bing's index, so
**Bing indexing (and IndexNow) matter far more than classic SEO folklore
implies.** ChatGPT is also ~87–92% of trackable AI referral traffic; Gemini is
the fastest-growing; Bing Copilot referrals collapsed (~-96% from peak) — so
Copilot-specific effort has low payoff. **[evidence / vendor]**

**Action:** verify Bing Webmaster Tools, submit the sitemap, and automate
IndexNow pings. Prioritise ChatGPT/Bing and Google AI surfaces; ignore Copilot.

## 4. On-page structure that gets cited

From a study of ~305k AI-cited URLs vs non-cited pages, cited pages scored
markedly higher on: **[vendor — large sample]**

- **Answer-first clarity / summarisation: +32.8%** (strongest factor)
- **EEAT signals in visible text: +30.6%**
- **Q&A format: +25.5%**
- **Section structure: +22.9%**
- **Lists / tables / structured elements: +21.6%**

The Princeton "GEO" paper (KDD 2024, peer-reviewed) found adding **statistics,
quotations, and source citations** lifts a source's visibility in generative
answers by up to ~40%. Effect sizes are domain-dependent — test in your vertical.
**[evidence — academic]**

**Action:** open every page with a 40–70 word direct answer; use question-styled
headings; add sourced statistics; close with an FAQ; keep an updated date.

## 5. Off-site signals beat on-site volume

In a 75k-brand study, the strongest correlates of AI brand visibility were
**YouTube mentions (ρ≈0.74)** and **branded web mentions (ρ≈0.66–0.71)**, while
raw **page count barely correlated (ρ≈0.19)**. Earned mentions / digital PR
outweigh publishing more pages. **[vendor — large sample]**

UK ChatGPT citation data (~200k citations, commercial-intent prompts): **niche/
specialist publishers ≈25%** and **brand-owned sites ≈25%** of citations;
**Wikipedia the single most-cited domain**; **Reddit under 2%** (contradicting
the "Reddit dominates" folklore, at least in the UK). A single national-press
mention is worth ~10 niche mentions, but the niche tier is collectively larger
and far more accessible. **[evidence]**

**Action:** invest in earned mentions (local/niche press, YouTube), a Wikipedia/
Wikidata entity, and consistent branded web presence — not just more pages.

## 6. Local answers pull from listings

For "best X in {place}" queries: Google AI Mode summarises **Google Business
Profile** directly; **Yelp** appears in ~33% of local AI searches; **ChatGPT
local results lean on Foursquare data** (reported 60–70%); the business's **own
site is still cited ~58%** of the time. **Dedicated per-geography pages win local
citations** — but mass programmatic page scaling does not (see §5).
**[vendor — small samples; directional]**

**Action:** claim GBP + Bing Places + Yelp + Foursquare with identical NAP; build
quality per-location pages, not thousands of thin ones.

## 7. Measurement realities

Most AI-answer exposure is **zero-click** (only ~12–18% of Perplexity citations
produce a visit), so referral analytics undercount true visibility. Triangulate:
**[evidence / vendor]**

- **GSC generative-AI report** — impressions in Google AI Overviews/AI Mode
  (impressions only, no clicks; eligibility gated by AI-impression volume).
- **Bing Webmaster Tools AI Performance** — includes citation counts and
  "grounding queries."
- **Referrer tracking** — GA4/PostHog channel on `chatgpt.com`, `perplexity.ai`,
  `claude.ai`, `gemini.google.com`, etc. (misses app traffic + noreferrer AI Mode).
- **Server-log / middleware bot hits** — `ChatGPT-User`/`Perplexity-User` ≈ used
  in a live answer.
- **Manual citation spot-checks** — the ground truth; run canonical prompts monthly.

Realistic benchmark: even top publishers see LLM referrals at ~0.1% of organic
sessions today — set expectations accordingly. AI search visits grew ~43% YoY,
so the trend, not the absolute, is the story.

## 8. Folklore — do NOT spend on these

- **`llms.txt` / `llms-full.txt` [folklore]** — 97% of ~38k files received zero
  requests (May 2026); no major engine consumes it; Google's guidance says it has
  no effect and compares it to the deprecated keywords meta tag. Skip it until an
  engine announces support.
- **`speakable` schema [folklore]** — no evidence any AI engine consumes it.
- **Mass programmatic page scaling [evidence against]** — page count barely
  correlates with AI visibility (§5). Build quality, not volume.
- **Reddit-seeding campaigns [weak]** — Reddit <2% of UK ChatGPT citations;
  genuine community presence only, not astroturf.
- **Bing Copilot-specific optimisation [evidence against]** — referrals
  collapsed; you get Copilot incidentally via Bing indexing anyway.

---

*Sources referenced across the field: Semrush 305k-URL citation study; Ahrefs
75k-brand correlation study and 137k-domain llms.txt log study; Profound
~680M-citation dataset; Princeton "GEO" (KDD 2024); BrightLocal and Yext local-AI
studies; a UK ~200k-citation ChatGPT study; provider crawler docs (OpenAI,
Anthropic, Google). Verify against current sources — the landscape moves fast.*
