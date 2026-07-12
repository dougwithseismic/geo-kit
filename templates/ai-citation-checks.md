# AI Citation Spot-Checks — {{BRAND_NAME}}

Most AI exposure is zero-click, so referral analytics undercount it. This manual
check is the ground truth: ask each engine the canonical prompts and record
whether {{SITE_URL}} is cited.

**Cadence:** monthly (1st), plus one run ~2 weeks after any crawler-access
change. Run in the target locale — engines localise.

## How to run

For each prompt: ask **ChatGPT** (search on), **Perplexity**, **Claude** (web
search on), and **Google AI Mode**. Record `C`=cited (linked) / `M`=mentioned
(no link) / `–`=absent.

## Canonical prompts (edit for your intents)

1. {{PROMPT_1 — e.g. "best things to do in {{PLACE}}"}}
2. {{PROMPT_2 — e.g. "how do I {{CORE_JOB_TO_BE_DONE}} in {{PLACE}}"}}
3. {{PROMPT_3}}
4. {{PROMPT_4}}
5. {{PROMPT_5}}
6. {{PROMPT_6}}
7. {{PROMPT_7}}
8. {{PROMPT_8}}
9. {{PROMPT_9}}
10. {{PROMPT_10}}

## Complementary signals (same day)

- GSC generative-AI report (Google AI impressions).
- Bing Webmaster Tools → AI Performance (citations + grounding queries).
- Analytics: `ai_referral` events; server/middleware `ai_bot_fetch` events.
- `node src/measurement/gsc-pull.mjs` for classic-search deltas.

## Results log

| Date | Engine | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | P9 | P10 | Notes |
| ---- | ------ | -- | -- | -- | -- | -- | -- | -- | -- | -- | --- | ----- |
| {{DATE}} | (baseline) | – | – | – | – | – | – | – | – | – | – | {{starting state}} |
