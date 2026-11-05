# What AI agents search for before they recommend you

*5 November 2026*

This started with a blog post about apples.

LaBonne's Markets is a small Connecticut grocer. Its blog has 18 posts and has been quiet since August. One of them, a guide to apple varieties, was sitting at #1 on Google for "apples" when I searched from Prague. My theory was that Google and AI tools are rewarding recent, time-sensitive content, and that this page was an example.

I sent research agents to look into it. They came back saying the page-one claim didn't hold up, because they couldn't reach Google and the post was missing from Yahoo. So I had them check Google in my own browser. It was #1 by default and #1 with US settings and personalisation off, and #2 with UK settings. That was one session in a signed-in browser, but it settled the point: the agents had trusted a substitute check too far.

The Wayback Machine then showed what had changed. On 16 October the post gained about 215 words. No existing copy was reworded. Almost none of the new material was time-sensitive. It was a tart-to-sweet scale, "Quick picks", "Best for" labels and store links, plus a few lines like "Hosting this fall?".

So the page can't prove my theory. The new date and the new format arrived together, and nobody outside LaBonne's can see when the ranking moved. It did change my question, though. Rather than guess what agents reward, I could look at what they actually do.

## The method

When an agent researches a question, it breaks it into searches of its own. That's query fan-out, and two coding agents write those searches to their logs: Claude Code and OpenAI's Codex CLI. I added a parser and report to [geo-kit](https://github.com/dougwithseismic/geo-kit) to read them.

The first test was one term, "best seo agency in london for fmcg", with six Claude runs and one Codex run. The two engines disagreed. Claude ranked Rise at Seven top in four of its six runs. Codex picked NOVOS and never mentioned Rise at Seven. Claude's searches were about proof: case studies, awards and account wins. The plain "best agency" wording barely appeared.

One term proves little, so I ran 100 UK commercial terms across 10 verticals, once per engine. That's 200 runs, none of which failed.

## What they did

| | Claude | Codex |
|---|---|---|
| Queries per run (median) | 5.5 (5) | 10.6 (10) |
| Search calls per run | 5.5 | 3.9 |
| Pages opened per run (median) | 7.1 (6) | 1.4 (1) |
| Queries containing a year | 63% | 19% |
| Runs with a year in any query | 100 | 74 |
| Runs with a year in the first call | 82 | 59 |
| Runs scoping a search to one domain | 2 | 96 |

**Claude reads.** It sends one query at a time and opens about seven pages. It usually starts near your wording: `{term} {year}` was its most common template, in 39 runs. The sites it opened in the most runs were Which? (20) and GOV.UK (14).

**Codex searches and rarely opens anything.** It sends batches of short queries and answers largely from what the search returns. Its signature move is to go straight to a candidate's own domain, as in `site.bradford.ac.uk distance learning mba fees 2026 2027` or `site.squarespace.com pricing website basic core`. Across the 100 terms it made 742 of these domain-scoped searches, spread over 411 domains. By a rough keyword split, about 86% went to domains that aren't regulators or review sites, mostly vendors. Pricing was the clearest intent, with about 35% of them mentioning price, fees or cost.

The rest went to places that can vouch for a business: GOV.UK, Chambers, Which? Trusted Traders, the CQC, Ofsted, Ofcom, MoneyHelper and the NHS.

**They rarely land in the same place.** On the same term, the two engines shared an average of 7% of the domains they opened and 5% of the entities named in their queries. That second figure comes from a rough name extractor, so treat it as a direction rather than a measurement.

**Depth varies by vertical.**

| Vertical | Claude queries | Claude with year | Codex queries | Codex with year | Codex domain-scoped |
|---|---|---|---|---|---|
| Automotive, energy & telecom | 7.9 | 73% | 11.1 | 29% | 65% |
| Legal & professional | 7.1 | 49% | 9.9 | 24% | 59% |
| Education & careers | 6.4 | 63% | 11.7 | 39% | 65% |
| Health & wellness | 6.0 | 45% | 13.1 | 6% | 79% |
| Home services & property | 5.6 | 57% | 10.7 | 20% | 51% |
| Money & finance | 5.3 | 77% | 10.6 | 16% | 88% |
| Agencies & B2B services | 5.2 | 46% | 7.8 | 4% | 63% |
| Consumer products | 4.7 | 74% | 11.7 | 12% | 65% |
| Software / SaaS | 3.7 | 86% | 9.4 | 18% | 80% |
| Travel | 3.4 | 74% | 10.4 | 15% | 81% |

In legal, Claude opened Chambers and Legal 500 in 5 of 10 runs each. In health and home services, Which? led.

## Back to the recency theory

The numbers look like a clean win: every Claude run used a year. But Claude's search tool description, as loaded in this session, tells it the current month and to use it when searching for recent information. So I can't read Claude's year rate as a preference. The harness is asking for it.

Codex is the better signal, though I can't see what date context it receives. It put a year in its first call in 59 runs, then moved on to domain checks where years mostly drop away, so only 19% of its queries carry one. Years are also uneven. Agencies and health get few, software and finance get many.

The FMCG test is a warning about generalising. Claude used a year in 17 of 76 searches on that term, and 2 of 13 in the 100-term run. Had I stopped there, I'd have concluded that Claude rarely uses years.

A year in a query also doesn't show that a search engine prefers new pages. What it does show is that the agent is asking a dated question, and a page with a current date and current facts answers it more directly.

The more useful evidence is what agents did with stale pages. Their answers repeatedly noted that older lists still recommended things that had changed. Runs reported that Cargiant had closed to retail in April 2026, that a widely repeated Doro recommendation traced to a 2022 guide, and that unfair dismissal time limits changed on 1 October 2026. I didn't check each of these independently, but the behaviour is the point: the agents compared what pages said against newer sources.

So my theory survives in a narrower form. Being current helps a page hold up when an agent checks it. This data doesn't show that being recent gets a page chosen, and LaBonne's doesn't show it either.

## Top of the funnel is a different game

Nearly all of those terms were "best X", so I ran 30 informational terms on the same 10 verticals, such as "how does a heat pump work" and "what counts as unfair dismissal". That's 60 more runs, once per engine, and none failed.

| | Claude commercial | Claude informational | Codex commercial | Codex informational |
|---|---|---|---|---|
| Queries per run (median) | 5.5 (5) | 2.9 (3) | 10.6 (10) | 3.2 (2.5) |
| Search calls per run | 5.5 | 2.9 | 3.9 | 1.6 |
| Pages opened per run (median) | 7.1 (6) | 4.8 (3) | 1.4 (1) | 0.8 (1) |
| Queries containing a year | 63% | 32% | 19% | 11% |
| Runs with a year in any query | 100% | 43% | 74% | 27% |
| Runs with a year in the first call | 82% | 23% | 59% | 23% |
| Runs scoping a search to one domain | 2% | 0% | 96% | 97% |

**Each engine keeps its habits, but the work shrinks.** Claude still reads and Codex still goes straight to a domain. Codex drops the most, from about 11 queries to about 3. Half of its informational runs, and nearly half of Claude's, used two queries or fewer. The 9 commercial terms without "best" sit in between, at 3.7 queries for Claude and 6.6 for Codex. That fits the idea that choosing between candidates is what drives the depth, though 9 terms can't settle it.

Same-topic examples show the size of it. "Best heat pump installers near Bristol" took Codex 15 queries, most of them checking named firms. "How does a heat pump work" took 2. Claude went from 6 queries and 6 pages to 2 queries and none.

**The exception is complicated, regulated topics.** Private health insurance went the other way on Claude, at 11 queries and 18 pages against 8 and 7 for the commercial version. Other deeper runs included ISAs, unfair dismissal and no win, no fee agreements.

**Vetting disappears.** Claude searched for reviews in 51 of 100 commercial runs and 1 of 30 informational ones. Awards went from 16 runs to none. Trustpilot went from 11 runs to none, and Which? from 20% of runs to 7%.

**Official sources take over.** GOV.UK was opened in 30% of Claude's informational runs against 14% of its commercial ones, and the NHS in 13% against 1%. Codex changes its target most clearly. I sorted its 93 informational domain-scoped queries by hand: 63 went to government, regulators, public bodies and professional or trade bodies, and 30 went to companies. A rough keyword list that counts the same way on both batches goes from 19% official or review sites to 57%. With both engines heading for the same places, their overlap in opened domains rises from 7% to 18%.

**Companies still get in, in two ways.** One is explaining what they make, as in Codex's `site.salesforce.com crm what is CRM`, and its searches of Bose, Sony, Philips, Bupa and Worcester Bosch. The other is publishing data nobody else has. Answers leaned on Klaviyo's email benchmarks, LocaliQ's Google Ads benchmarks and Geotab's and Recurrent's battery data, even while noting that those companies have something to sell.

**Years follow the topic.** This is the best evidence yet on my original theory, and it cuts it down further. Claude used a year on Making Tax Digital (3 of 3 queries), unfair dismissal (4 of 4), ISAs (4 of 5) and PPC costs (3 of 4). It used none on air fryers, heat pumps, noise cancelling, CRMs, T Levels or damp. Codex shows the same pattern at a lower rate. Agents appear to ask a dated question when the answer can change, not as a general taste for new pages.

Where the facts had moved, freshness mattered. The ISA run reported that 2027 reforms still described on many pages had been cancelled in the October 2026 Budget. The ETIAS run reported that a launch target had been removed in July. The unfair dismissal run found an Acas page still giving the old tribunal deadline and sided with newer law firm notes. I didn't check these independently, but the behaviour is what matters. An evergreen explainer has nothing like this to be caught out on.

**So for informational pages I'd change the advice:**

1. **Aim to be the source, not a summary of it.** With about three searches per run and official bodies taking many of the slots, a rewrite of what GOV.UK says has little reason to be opened. Original data and first-hand product explanation have one.
2. **Refresh when the facts change.** Keep dates and rules exact on anything regulated or priced. Re-dating a page on how noise cancelling works looks pointless on this evidence.
3. **Answer in the opening lines.** Half of Claude's informational answers said they relied on search summaries for at least some claims, up from 21% on commercial terms, by keyword match. Codex opened no page in 6 of 30 runs. A clear statement near the top is what's likely to survive that.
4. **Check that agents can read you.** 53% of Claude's informational answers mentioned a page that failed or was blocked, including NIH, MoneyHelper and the Energy Saving Trust. The agent then used secondary sources. Some of that may come from Claude's fetch tool rather than the sites, so test your own pages before changing anything.
5. **Say which country you mean.** Claude opened the US BLS for the bookkeeper and project manager questions and the FDA for laser eye recovery. Codex searched energy.gov for heat pumps. A UK page competes with these whenever the question doesn't name a country.

## What I'd do differently now

1. **Publish specifics on your own domain.** Codex looks for prices, fees and details on your site. If they're missing or vague, there's nothing for it to pick up from a search result, and it may never open the page.
2. **Keep third-party proof current.** Claude read Which?, Trustpilot, Chambers and Legal 500, and Codex searched regulators and registers directly. Which sources matter depends on the vertical.
3. **Don't lean on self-ranking listicles.** By a keyword match, 63 of 100 Claude answers flagged a source as affiliate, vendor-run or self-ranking, and 31 said they found no independent ranking. Only 1 Codex answer matched. Codex's answers are about half the length, so this may be partly about how much each one explains.
4. **Date pages honestly and change them for real.** Update facts and structure ahead of the demand peak, not just the date on the page.
5. **Measure more than one engine.** With this little overlap, a result from one tells you little about the other.

## What this can't tell you

- **Coding agents aren't consumer products.** ChatGPT, Gemini and Google's AI Mode may behave differently, and I didn't test them.
- **Fan-out isn't ranking.** This shows what agents look for. It doesn't show which pages win, or why.
- **One run per term.** Vertical and term-level figures are indicative. The FMCG test showed Claude's picks vary between runs.
- **The two batches aren't matched pairs.** 91 of the 100 commercial terms start with "best". I picked all the terms myself, on the same verticals but not as exact pairs, and there are only 30 informational ones, so a few long runs move the averages. 57 of the commercial terms name the UK and only 4 of the informational ones do, which affects where agents look. The query labels were built for commercial searches, so they say little about informational ones beyond the drop in proof-seeking.
- **The two engines weren't set up identically.** Codex ran from its CLI. Claude ran as subagents inside a working session, which can shape how it writes answers. Three of those runs (Heathrow parking, SIM-only deals, phones for older people) called [Vouchernaut](https://vouchernaut.com)'s MCP tools, which were connected to my session. That's a site I run, so those answers aren't neutral, and the report's query counts don't include those calls.
- **Location.** The machine was in Prague, and Claude's search tool describes itself as US-only. Terms without "uk" tended to get US-leaning answers, and some vendor pages showed local prices.
- **Prompt wording matters.** In 10 extra runs I accidentally asked for answers under 150 words. Claude dropped to 2 queries per run. Instructions that seem unrelated change the behaviour you're measuring.
- **Syntax.** Codex mostly wrote `site.example.com` rather than the `site:` operator. I counted both as domain-scoped. In about 80% of cases, the batch containing such a query returned results from the named domain, so it appears to work as a filter, but I can't see how Codex handles it.

## What's next

The real test is on my own site. Dinners With Friends already logs changes and tracks Search Console positions, so I can split matched seasonal pages into three groups before a demand peak: date and seasonal copy only, format only, and no change. That's the comparison LaBonne's couldn't give me.

The data is in [`research/2026-11-fanout`](.), with the informational runs in [`informational`](informational), and the tooling is in `src/fanout`.
