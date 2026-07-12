---
name: geo-measure
description: Measure AI-search visibility and citations — pull Google Search Console data, check AI-referral and AI-bot telemetry, and run manual citation spot-checks against a baseline. Use when asked "are we getting cited by AI", "track our GEO/AI-search performance", or to report progress after GEO work.
---

# GEO Measure

Report AI-search visibility. Most AI exposure is **zero-click**, so no single
metric is enough — triangulate the five signals below and compare to a baseline.

## The five signals

1. **Google generative-AI report (impressions).**
   `https://search.google.com/search-console/performance/search-analytics/ai?resource_id=<PROPERTY>`
   — impressions in AI Overviews / AI Mode (no click data). Eligibility is gated
   by AI-impression volume, so small sites may not see it yet.

2. **Classic Search Console deltas.** Run the kit's pull script and compare to the
   recorded baseline:
   ```bash
   node src/measurement/gsc-pull.mjs      # writes dated JSON to data/, prints deltas
   ```
   Auth: Application Default Credentials with the `webmasters.readonly` scope
   (`gcloud auth application-default login --scopes=…/auth/webmasters.readonly,…/auth/cloud-platform`).
   Watch the **target-intent positions** (page-2 → page-1 movement) and the new
   pillar pages appearing.

3. **AI-referral events (analytics).** In GA4/PostHog, count sessions/events from
   AI-assistant referrers (`chatgpt.com`, `perplexity.ai`, `claude.ai`,
   `gemini.google.com`, …). The kit's `AiReferralTracker` emits an `ai_referral`
   event; segment by `ai_source`. Caveat: misses app traffic and noreferrer AI Mode.

4. **AI-bot fetch telemetry (server/middleware).** Count requests whose UA matches
   the AI bots (kit's `matchAiBot`). `ChatGPT-User` / `Perplexity-User` hits are
   the closest proxy for **being used in a live answer** (vs `GPTBot` = training).
   Bing Webmaster Tools' AI Performance report adds real citation counts +
   grounding queries — check it if the site is verified there.

5. **Manual citation spot-checks (ground truth).** Monthly, ask each engine the
   canonical prompts and record `C`=cited / `M`=mentioned / `–`=absent. Use the
   `templates/ai-citation-checks.md` runbook. Run in the target locale (location
   matters — engines localise).

## Report format

- **Headline:** direction of travel vs baseline (impressions, target-intent
  positions, AI-referral count, bot-fetch count, citation spot-check score).
- **What moved and why** (tie changes to shipped work).
- **Realistic framing:** LLM referrals are ~0.1% of organic sessions even for top
  publishers today — report the *trend* and the *citation presence*, not just raw
  referral volume.
- **Next actions**, ranked by leverage.

## Baseline

If no baseline exists, capture one now (today's date) and note that future runs
compare against it. Store baselines in the plan doc or `templates/ai-citation-checks.md`.
