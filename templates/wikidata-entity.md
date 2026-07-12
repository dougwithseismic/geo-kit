# Wikidata Entity — {{BRAND_NAME}}

Wikipedia/Wikidata is the single most-cited domain in AI answers, and
knowledge-graph presence feeds every major engine's entity understanding.
Creating the item takes ~10 minutes at
https://www.wikidata.org/wiki/Special:NewItem (needs a Wikidata account — a human
step).

> **Notability:** Wikidata's bar is far lower than Wikipedia's — a structured
> item for an operating business with verifiable references is generally fine. Do
> NOT attempt a Wikipedia *article* until you have significant independent press
> coverage (see `pr-targets.md`).

## Item

- **Label (en):** {{BRAND_NAME}}
- **Description (en):** {{SHORT_NEUTRAL_DESCRIPTION}}
- **Aliases:** {{ALIASES}}

## Statements

| Property | ID | Value |
| --- | --- | --- |
| instance of | P31 | {{business/organisation type, e.g. business (Q4830453)}} |
| official website | P856 | {{SITE_URL}} |
| country | P17 | {{COUNTRY}} |
| headquarters location | P159 | {{CITY}} |
| inception | P571 | {{FOUNDING_YEAR}} |
| founded by | P112 | {{FOUNDER (optional person item)}} |
| industry | P452 | {{INDUSTRY}} |
| social handles | P2003/P2013/P4264 | {{INSTAGRAM / FACEBOOK / LINKEDIN}} |

## References to attach

- Official About page: {{SITE_URL}}/about
- Any press coverage once it lands (see `pr-targets.md`) — add as a reference URL.

## After publishing

1. Record the Q-ID: **Q________**
2. Add the Wikidata URL to your Organization schema `sameAs`
   (see `src/seo/json-ld.ts` → `organizationSchema`, `config.sameAs`).
