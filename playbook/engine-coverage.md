# Engine coverage: is the site found, opened and cited?

Crawler access and good pages only make a site *citable*. Whether an AI agent
actually uses it depends on what the agent's own search returns. This page is
the method for measuring that for one site, and what to do about each result.
It comes from the [November 2026 fan-out study](../research/2026-11-fanout/ARTICLE.md)
and the [Dinners With Friends case study](../research/2026-11-fanout/dwf/README.md).

## The funnel

Every agent run has three steps where a site can drop out:

| Step | What it means | Measured by |
|---|---|---|
| **Seen** | The site's domain came back in one of the agent's searches | `resultDomains` |
| **Opened** | The agent read a page on the site | `fetches` |
| **Cited** | The final answer names the brand or domain | `finalText` |

Each engine searches a different index, so measure them separately. In the DWF
case the same 30 terms gave:

| | Seen | Opened | Cited |
|---|---|---|---|
| Claude | 0 / 30 | 0 / 30 | 0 / 30 |
| Codex | 21 / 30 | 0 / 30 | 1 / 30 |

That is two different problems, with two different fixes.

## Run it

1. **Pick 20–40 terms** the site should win, in groups: the head "best X in
   [place]" guides, seasonal terms, mission terms ("how to meet people in X"),
   and informational terms. Use Search Console to include terms where the site is
   already top 10 on Google. Those are the control group.
2. **Run each term through each engine once** with the fan-out CLI:
   ```bash
   node src/fanout/cli.ts run --terms terms.txt --engines codex --out fanout-data/<date>-<site> --concurrency 4 --timeout 600
   ```
   For Claude, where headless `claude -p` isn't available, run each term as a
   subagent with only WebSearch and WebFetch, then add each transcript with
   `cli.ts ingest`.
3. **Report and score the site:**
   ```bash
   node src/fanout/cli.ts report --in fanout-data/<date>-<site>
   node src/fanout/cli.ts coverage --in fanout-data/<date>-<site> --site example.com --brand "Example Ltd" --gsc Queries.csv
   ```
   `coverage` writes `coverage.md` and `coverage.json`: the funnel per engine,
   a per-term table next to the Google position, the domains each engine opened
   instead, and the domains Codex scoped searches to.

Re-run monthly with the same terms. Changes are only meaningful against the
same term list.

## Check the engine's index directly

When an engine never sees the site, find out whether it isn't indexed or just
doesn't rank. With Claude's WebSearch tool:

| Search | Tells you |
|---|---|
| `exeter` with `allowed_domains: ["example.com"]` | Is the site in the index at all? Pages listed = indexed. |
| The brand name, unscoped | Does the engine know the brand? The homepage should come first. |
| The bare domain, unscoped | Does it recognise the domain? (DWF's was misread as a different, defunct site.) |
| 3–5 terms where the site is top 10 on Google, unscoped | Does it rank where Google ranks it? |
| The same terms in `extended` mode | Is it a ranking-depth problem? Agents use `standard` almost always (136 of 138 DWF searches). |

**Indexed but not ranking** is the usual result. In the DWF case, two
domain-scoped searches listed 20 current pages, but none appeared unscoped. The brand search returned only Eventbrite listings, and "board game
cafes exeter" returned Exeter, Ontario. In extended mode the same guide ranked
fourth. Claude's standard index is US-first and rewards large, well-linked local
sites (Visit Exeter, local newspapers, OpenTable, Wanderlog). Content changes
don't fix that. Entity and link signals do.

## Diagnosis and fixes

| Result | Likely cause | Fix |
|---|---|---|
| Blocked or 403 in the run logs | Edge/CDN or robots.txt | [Crawler access](./README.md#crawler-access-matrix-evidence-1). Check the CDN's AI policy, not just per-bot toggles. |
| Not in the index | Not crawled by that engine's provider | Sitemap, Bing Webmaster Tools, IndexNow; wait a crawl cycle. |
| Indexed, never seen | Weak entity and link authority in that index | Brand/entity work and placements on the domains it *does* open (below). |
| Brand search returns an aggregator | The aggregator holds the entity | Make every aggregator listing link to the site with the exact brand name. Claim listings (GBP, Bing Places, Foursquare, Yelp, Tripadvisor). Publish Wikidata. |
| Seen, not opened | The snippet loses to primary sources | See "Seen but not opened" below. |
| Opened, not cited | The page didn't hold the deciding fact | The specific facts the query asks for (price, dates, season, booking), dated, including for your own offering. See "Opened but not cited" below. |

### Seen but not opened

Codex saw DWF in 21 runs and was the first result in 6, but opened none of
them. It opened venues' own sites, Tripadvisor, CAMRA, Michelin, Meetup and club
sites instead. The pattern: **agents skip a guide about a thing and open the
thing itself**, unless the guide holds something the source doesn't.

- **Lead with topics where the site is the primary source.** DWF's one
  citation was "what is a supper club", the one term where it is the source.
  Its own events, its category ("social dining in Devon") and its own data
  ("loneliness in Devon" statistics) are where it can win.
- **Give guides facts nobody else has**, and say so in the title and meta
  description. Prices checked on a stated date, verified opening hours, notes from
  visiting, a comparison table. A list of names other sites also list will be
  skipped.
- **Check category terms the site should own.** DWF wasn't in Codex's results
  for "supper clubs in Devon" at all. That's an indexing or titling gap on the
  page that should rank.

### Be on the pages agents open

The `topOpened` and `topSeen` lists in `coverage.md` are a placement target
list. Agents keep returning to the same few sites per place and topic. For
Exeter, Claude opened Visit Exeter in 10 of 30 runs, and it was in the results of
19 Claude and 19 Codex runs. A listing or event on that site reaches the agent
on the page it already reads. Work down the list: tourism boards, local
newspapers, listing sites, club and venue directories.

### Opened but not cited: what the agent actually reads

Claude doesn't put the opened page into its context. WebFetch passes the page and
the agent's own question ("List venues… with location, price and dates. Note the
date.") to a smaller model and returns its answer. In the DWF batch, the 85
fetches that succeeded returned a median of 881 characters, and only about a
quarter of those answers named the site they came from (matched by domain
name). So what gets used is **whichever facts survive that question**. The
publisher's name doesn't automatically go with them.

A test on DWF's supper clubs guide ([write-up](../research/2026-11-fanout/dwf/answer-block-test.md))
restructured the page: question headings, an answer block, answer-first
sections, and the brand in the third person. Twelve simulated extractions,
across three questions with each version run twice, gave the same result for
the original and the rewrite. The facts carried over equally, and DWF was named
equally often. The page fits in the reader whole, so where a fact sits on the
page didn't matter. What mattered was what the page didn't say. Every run
reported DWF's own dinners as "price not stated" and "no winter schedule".
Several flagged the self-listing as promotional. For "supper clubs near Exeter
in winter", the other two options were closed for the season or working around
fire damage, so a dated, priced, year-round DWF listing would have been the
answer.

- **Answer the questions the agent asks of the page:** price, dates, season,
  location, how to book. A reader can't report a fact the page doesn't hold.
- **List your own offering with the same facts as the others,** plus an
  absolute booking URL. Relative links come back without a domain.
- **Keep question headings and answer blocks** because they help people,
  snippets and very long pages. Don't expect them to fix a citation gap on
  their own.

## Freshness

Agents add the year to their searches even when the user didn't: 41% of Claude
queries and 93% of Claude runs in the DWF batch, 32% and 63% for Codex. Keep the
current year in the titles of guides that should rank, and refresh them with
real updates at the turn of the year, before the new year's queries start.

## What this can't tell you

- One run per term per engine. Treat single-term results as anecdotes, and the
  batch totals as the signal.
- Coding agents, not consumer apps. ChatGPT, Claude.ai and Perplexity use related
  but not identical search setups.
- "Cited" means the brand or domain appears in the answer text. A page used
  without being named isn't counted.
