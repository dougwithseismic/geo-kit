# GEO Execution Plan — {{BRAND_NAME}}

A phased plan template for making {{SITE_URL}} citable by AI search engines.
Fill the `{{placeholders}}`, delete what doesn't apply, and drive it with the
`autonomous-loop` (or by hand). Grounded in [`../playbook/README.md`](./README.md).

**Status legend:** `[ ]` todo · `[~]` built-to-seam (human ask recorded) · `[x]` done

## Baseline (capture before you start)

- Classic search: **{{CLICKS}} clicks / {{IMPRESSIONS}} impressions / pos {{AVG_POS}}** (last 28d)
- Google generative-AI features: **{{AI_IMPRESSIONS}} impressions / 28d**
- Target intents & current position: {{TARGET_INTENTS_WITH_POSITIONS}}
- Crawler access verified (expect 200): {{CRAWLER_CHECK_RESULT}}

## Seam register (human-only asks)

Track the things the build cannot do itself (edge/CDN toggles, account
verifications, listings, entity publishing). Keep this list concrete.

1. Edge/CDN AI-crawler access (e.g. Cloudflare "Block AI Scrapers" OFF).
2. Bing Webmaster Tools verification + sitemap submit.
3. Google Business Profile (+ Bing Places / Yelp / Foursquare) — local only.
4. Wikidata entity publish.
5. Cron/scheduler env for automated IndexNow.

---

## Phase 1 — Unblock & technical hygiene (highest leverage)

1. `[ ]` Reconcile `robots.txt` → one file, AI-crawler allow-list, correct sitemap URL.
2. `[ ]` Purge dead-domain / stale references sitewide.
3. `[ ]` Default OG image exists; wire dynamic OG cards into page metadata.
4. `[ ]` Sitemap covers every citable route (blog, locations, key pages).
5. `[ ]` Automate IndexNow (daily ping from sitemap).
6. `[ ]` RSS feed for the blog.

## Phase 2 — Retrieval-optimised content structure

1. `[ ]` Add answer-first / FAQ / stat components to the content system.
2. `[ ]` Retrofit the top {{N}} pages (by traffic + AI impressions): KeyAnswer,
   FAQ (FAQPage schema), sourced stats, updated date.
3. `[ ]` Strengthen EEAT: real author bios + `sameAs`; cite primary sources.
4. `[ ]` Bake the GEO rules into your content-generation workflow.

## Phase 3 — Own the target intents (new content)

1. `[ ]` Pillar page per priority intent: {{TARGET_INTENTS}}.
2. `[ ]` Statistics-dense authority resource for the brand's core theme.
3. `[ ]` Interlink pillars ↔ supporting content ↔ conversion pages.

## Phase 4 — Entity depth

1. `[ ]` Enrich Organization schema (`founder`, `areaServed`, `knowsAbout`, `sameAs`).
2. `[~]` Prepare + publish a Wikidata entity.
3. `[ ]` Audit domain-specific schema (Event/Product/LocalBusiness) for completeness.

## Phase 5 — Measurement loop

1. `[ ]` AI-referral tracking (analytics event on AI-assistant referrers).
2. `[ ]` AI-bot fetch telemetry (middleware).
3. `[ ]` Scheduled search-console pull with baseline deltas.
4. `[ ]` Monthly AI citation spot-check runbook.

## Phase 6 — Off-site & listings (seam-heavy; build the packs in-repo)

1. `[~]` Listings data pack (GBP/Bing/Yelp/Foursquare).
2. `[ ]` Press page (boilerplate, founder, story angles, assets).
3. `[~]` Digital-PR target kit + outreach.
4. `[~]` Partnership prep (authority-linking targets in your theme).

---

## Deliberately NOT doing

- llms.txt, speakable schema, mass programmatic thin pages, Reddit-seeding,
  Copilot-specific work — see [`../playbook/evidence.md`](./evidence.md) §8.
