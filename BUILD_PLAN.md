# geo-kit — Build Plan

**What this repo is:** a portable **AI-citation / GEO (Generative Engine
Optimization) user-acquisition kit**. It packages the reusable assets for
getting a website cited by AI search engines (ChatGPT search, Google AI
Overviews/AI Mode, Perplexity, Claude): a framework-agnostic **playbook**
(evidence base + plan template), **agent skills**, **Next.js/MDX reference
components**, portable **infra** (in-process cron scheduler, IndexNow), a
**measurement toolkit**, and **go-to-market templates**. Everything brand- and
domain-specific is isolated in one `geo.config` file.

**Status legend:** `[ ]` todo · `[~]` built-to-seam (in-repo done, human ask recorded) · `[x]` done

**Quality gates:** `pnpm typecheck` (tsc --noEmit) · `pnpm test` (vitest). Every
code feature must pass both; content/markdown features are verified by a real
read-through for internal-link and placeholder correctness.

**Design rules:**

- **One config to parameterize.** `src/config.ts` defines `GeoConfig`
  (domain, brand, locale, target intents, AI-referrer sources, cron jobs, etc.).
  Every code asset takes config or a typed input — no hard-coded brand/domain.
- **Framework honesty.** Pure-logic utilities are fully importable. React/Next
  pieces are typed reference implementations (web-standard `Response`/`Request`
  types, plain object shapes) with comments marking where `next/*` types slot in
  — so the kit typechecks without a `next` dependency and copies cleanly into a
  Next App Router app.
- **Evidence-linked.** Content/skills cite the playbook so tactics stay grounded,
  not folklore. Flag folklore explicitly (e.g. llms.txt).
- **Tested where it matters.** Pure logic (schema builders, matchers, parsers,
  job tables) has unit tests; components are typechecked reference impls.

---

## Phase 0 — Repo scaffold & gates

1. `[x]` **Toolchain** — git init, `package.json` (pnpm; typecheck + test
   scripts), `tsconfig.json` (strict, react-jsx, bundler), `vitest.config.ts`,
   `.gitignore`. Gates verified green on empty `src/`.
2. `[x]` **Config layer** — `src/config.ts`: the `GeoConfig` type (site url,
   brand name/description, founder, locale, `areaServed`, `knowsAbout`, target
   query intents, AI-referrer source patterns, AI-bot UA patterns, IndexNow key,
   cron job table type) + `defineGeoConfig()` identity helper + a fully-worked
   `geo.config.example.ts` at repo root. Unit test: example config satisfies the
   type and required fields are present.

## Phase 1 — Playbook (framework-agnostic knowledge)

1. `[x]` **`playbook/evidence.md`** — the distilled, cited evidence base: what
   measurably drives AI citations (crawler-access rules; answer-first / Q&A /
   stats content structure; off-site mentions > page volume; ChatGPT↔Bing
   grounding; measurement realities; folklore flags incl. llms.txt). Sourced,
   product-agnostic.
2. `[x]` **`playbook/README.md`** — the decision rules a human or agent applies:
   the crawler-access matrix (which UAs gate citations vs training), the on-page
   structure checklist, the off-site priority order, and the "deliberately NOT
   doing" list. Links to evidence.md.
3. `[x]` **`playbook/plan-template.md`** — the phased GEO execution-plan template
   (unblock/hygiene → content structure → own-the-intents → entity → measure →
   off-site), with `{{placeholders}}` for brand/domain/locale.

## Phase 2 — Agent skills (drop into `.claude/skills/`)

1. `[ ]` **`skills/geo-audit/SKILL.md`** — audit an existing site's GEO surface
   (metadata, JSON-LD types, robots + AI-crawler access, sitemap coverage,
   SSR/crawlability, content structure) and emit a prioritized gap report keyed
   to the playbook.
2. `[ ]` **`skills/geo-content/SKILL.md`** — generate AI-citable content
   (answer-first, question headings, sourced stats, FAQ schema, freshness),
   parameterized by `geo.config`; references the MDX components and playbook.
3. `[ ]` **`skills/geo-measure/SKILL.md`** — run the measurement toolkit (GSC
   pull, AI-referral + bot telemetry, citation spot-checks) and report deltas
   vs a baseline.

## Phase 3 — Portable components (Next.js App Router + MDX reference impls)

1. `[ ]` **MDX GEO components** — `src/components/mdx/key-answer.tsx`,
   `faq.tsx` (`Faq` + `FaqItem`, collects children into FAQPage JSON-LD),
   `stat-callout.tsx`. Typed, styleable via className props. Test: FAQ child →
   schema extraction.
2. `[ ]` **JSON-LD builders** — `src/seo/json-ld.ts`: config-driven
   `organizationSchema`, `articleSchema`, `faqPageSchema`, `breadcrumbSchema`,
   `eventSchema`, `websiteSchema`. Pure functions. Unit-tested shapes.
3. `[ ]` **OG image URL builder** — `src/seo/og-image-url.ts` (config base +
   typed params → absolute `/api/og?...` URL). Unit-tested.
4. `[ ]` **robots + sitemap helpers** — `src/seo/robots.ts` (AI-crawler
   allow-list builder returning a plain rules shape; comment maps to Next
   `MetadataRoute.Robots`), `src/seo/sitemap.ts` (entry builder). Unit-tested.
5. `[ ]` **RSS feed** — `src/feed/rss.ts`: pure `renderRssFeed(items, config)`
   returning an XML string (web-standard, no framework). Unit-tested (escaping,
   item count).

## Phase 4 — Portable infra

1. `[ ]` **In-process cron scheduler** — `src/infra/scheduler.ts`: croner-based,
   config-driven job table (schedule + endpoint path), localhost-trigger with a
   shared secret, `protect`/UTC, `ENABLE_IN_PROCESS_CRON` gate,
   `startScheduler`/`stopScheduler`. Unit-tested (registration count, schedule
   validity, disabled no-op) + README on wiring into any Node server.
2. `[ ]` **IndexNow** — `src/infra/indexnow.ts`: `submitUrls(urls, config)` +
   `pingFromSitemap(config)` (fetch sitemap → parse `<loc>` → submit). Pure,
   injectable fetch. Unit-tested (parse, submit body, 202-as-success, dry run).

## Phase 5 — Measurement toolkit

1. `[ ]` **GSC pull** — `src/measurement/gsc-pull.mjs`: config-driven Search
   Console pull (ADC auth) with baseline-delta reporting; write dated JSON to
   gitignored `data/`. Extract the sitemap/`<loc>`-free query logic into a
   testable helper; unit-test the totals/delta math.
2. `[ ]` **AI-referral tracker** — `src/measurement/ai-referral.ts`: pure
   `matchAiReferrer(referrer, sources)` matcher + a React `AiReferralTracker`
   reference component that fires a `track(event, props)` injected callback once
   per session. Unit-test the matcher across ChatGPT/Perplexity/Claude/Gemini.
3. `[ ]` **AI-bot telemetry** — `src/measurement/ai-bot-telemetry.ts`: pure
   `matchAiBot(userAgent, patterns)` + a framework-neutral `trackAiBotFetch`
   helper (fire-and-forget). Unit-test the UA matcher (ChatGPT-User, GPTBot,
   PerplexityBot, ClaudeBot, etc.).

## Phase 6 — Templates, barrel & quickstart

1. `[ ]` **GTM templates** — `templates/`: `listings-pack.md`, `pr-targets.md`,
   `ai-citation-checks.md`, `wikidata-entity.md` — placeholder-driven, generic.
2. `[ ]` **Barrel + entry** — `src/index.ts` re-exporting the importable
   utilities (config, seo, infra, measurement); typecheck confirms the surface.
3. `[ ]` **Root `README.md`** — what it is, the two usage modes (copy assets /
   import utilities), per-directory guide, the `geo.config` quickstart, framework
   caveats, and a link to the playbook. Verified: every referenced path exists.

## Notes / seams

- Not published to npm (no bundling pipeline) — it's a starter kit + reference
  impls. A `tsup` build + publish is a documented future step, not in scope.
- No GitHub remote is created by the loop (creating/pushing a public repo is a
  human step). Commits stay local.
