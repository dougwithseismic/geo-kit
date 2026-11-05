# Case study: Dinners With Friends, 5 November 2026

Do AI agents find, open and cite [dinnerswithfriends.co.uk](https://dinnerswithfriends.co.uk),
an Exeter social-dining company whose blog ranks top 10 on Google for many local
guide terms? This applies the [fan-out method](../ARTICLE.md) to one site. The
reusable method is [`playbook/engine-coverage.md`](../../../playbook/engine-coverage.md).

| File | Contents |
|---|---|
| `terms.txt` | 30 terms in four groups: local guides, seasonal, mission, informational |
| `runs.jsonl` | One record per run (60): queries, pages opened, result domains, final answer |
| `queries.jsonl`, `report.md`, `report.json` | Output of `cli.ts report` |
| `coverage.md`, `coverage.json` | Output of `cli.ts coverage --site dinnerswithfriends.co.uk --brand "Dinners With Friends"` |
| `answer-block-test.md` | Does restructuring a page (question headings, answer block) change what an agent's page reader takes from it? |

Search Console figures used for term selection and comparison aren't included.

## Result: two engines, two different gaps

| | Seen | First result | Opened | Cited |
|---|---|---|---|---|
| Claude | 0 / 30 | 0 | 0 | 0 |
| Codex | 21 / 30 | 6 | 0 | 1 |

- **Codex's index ranks the site well.** It was the 4th most common domain of
  1,250 across all runs, and the first result for breakfast, cocktail bars, fish
  and chips, locksmith, Topsham restaurants and Magdalen Road. Codex still opened
  none of those pages. It opened venues' own sites, Tripadvisor, CAMRA, Michelin,
  Meetup and club sites instead.
- **The one citation** was "what is a supper club", the one term where the site
  is the primary source.
- **Claude never saw the site.** It opened Visit Exeter in 10 of 30 runs; its
  most common result domains were Visit Exeter, North Devon Gazette, Wanderlog,
  Exeter City Council news and The Exeter Daily.
- **Gaps on terms the site should own:** it wasn't in Codex's results for
  "supper clubs in Devon", and seasonal terms went to the cathedral's own pages.
- **Year in queries:** 41% of Claude queries (93% of runs) and 32% of Codex
  queries (63% of runs).

## Why Claude never saw it

Checked the same day with Claude's WebSearch tool:

| Search | Result |
|---|---|
| "exeter", limited to the domain | 10 current DWF pages: indexed |
| "best social clubs Exeter 2026 guide", limited to the domain | 10 more current DWF pages |
| "Dinners With Friends Exeter" | Eventbrite listings for its events; the site itself absent |
| "dinnerswithfriends.co.uk" | Read as a different, defunct 2011 site |
| pub quiz exeter / magdalen road exeter (both top 5 on Google) | Absent from 25 and 24 results |
| best breakfast exeter 2026 | Absent; OpenTable pages for other Devon towns on .ca/.com.au |
| board game cafes exeter | Absent; mostly Exeter, Ontario |
| board game cafes exeter, **extended** mode | DWF's guide 4th |

The site is indexed but doesn't rank in standard mode, and 136 of the 138
Claude searches in the batch used standard mode. The index is US-first and
rewards large, well-linked local sites. That's an entity and authority gap: the
engine doesn't know the brand (an aggregator wins its name), so better content
alone won't move it.

## Crawler access, found and fixed the same day

Cloudflare's zone-wide "AI Crawler and Agent access policies" had **Training:
Disallow**, which blocked 15 crawlers including GPTBot, ClaudeBot, CCBot and
**Claude-User**, the agent Claude uses to open a page mid-answer. "Bot
Preference Sync" was prepending Cloudflare's managed block to robots.txt. The
per-crawler toggles were locked by the policy.

Changed to Training: Allow, Bot Preference Sync off. Afterwards the main AI
user-agents returned 200 instead of 403 and robots.txt was the site's own file.
This affects whether engines can fetch the site, not how they rank it, so it
doesn't explain the Claude result above.

## The plan that followed

In order of leverage:

1. **Entity (weeks 1–2):** Bing Webmaster Tools and IndexNow; Google Business
   Profile, Bing Places, Foursquare, Yelp, Tripadvisor with identical name and
   address; every Eventbrite listing linking to the site under the exact brand
   name; Wikidata. Target: the brand search returns the homepage.
2. **Placements (weeks 2–6):** a Visit Exeter listing and its what's-on events
   (the site both engines lean on most), local press pitched with the site's own
   data, partner charities.
3. **Seen → opened:** lead with topics where the site is the source; give guides
   dated, first-hand facts and say so in titles and descriptions; fix the
   "supper clubs in Devon" gap.
4. **Year refresh** of the top guides before January.
5. **Monthly re-run** of these 30 terms. Targets: Claude seen ≥ 5/30, Codex
   opened ≥ 5/30, cited ≥ 5/30.

## Rebuild

From the repo root, with the raw transcripts in `fanout-data/2026-11-05-dwf/`:

```bash
node src/fanout/cli.ts report --in fanout-data/2026-11-05-dwf
```

```bash
node src/fanout/cli.ts coverage --in fanout-data/2026-11-05-dwf --site dinnerswithfriends.co.uk --brand "Dinners With Friends"
```

```bash
node --experimental-strip-types research/2026-11-fanout/scripts/export-runs.ts fanout-data/2026-11-05-dwf research/2026-11-fanout/dwf fanout-data/2026-11-05-dwf/terms.txt
```

Codex runs used `cli.ts run --engines codex --concurrency 4 --timeout 600`.
Claude runs were subagents with the study prompt, added with `cli.ts ingest`.
One run per term per engine, so single-term results are anecdotes; the totals
are the finding.
