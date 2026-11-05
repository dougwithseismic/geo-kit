# Test: does restructuring a page change what an agent takes from it?

5 November 2026. Page: [Best Cooking Classes and Supper Clubs Near Exeter, Devon](https://dinnerswithfriends.co.uk/blog/best-cooking-classes-supper-clubs-exeter-devon-guide)
(about 2,400 words, reviewed 28 July 2026). It was chosen because it covers
"supper clubs in Devon", a term where DWF never showed up in Codex's results, and
because it had none of the answer-first structure that 75 of DWF's 291 posts
already use.

## What WebFetch returns

In the 60 study runs, Claude's 113 WebFetch calls each sent a URL plus a
question, for example "List venues in or near Exeter recommended for Sunday roast
with details. Note the date." What came back was a smaller model's answer to that
question:

- **Successful fetches:** 85, with a median answer of 881 characters
- **Answers naming their source:** 24 of 85, matched by domain name

The agent writes its answer from those extracts, not from the pages.

## Method

- **Two versions of the page:**
  - The original.
  - A rewrite. It changes structure only and adds no new facts:
    - a `KeyAnswer` block naming the brand and the review date
    - question headings, with each section answering in its first sentence
    - the deciding fact in each school's heading
    - DWF's own entry in the third person
    - a closing FAQ
- **Page text:** both versions were reduced to the text WebFetch would see, with
  the same title and byline: "| Dinners With Friends", "Reviewed 28 July 2026".
- **Questions,** written in the style of the study's WebFetch prompts:
  - **A:** List every supper club mentioned for Devon or near Exeter, with location, format, price, season/dates and how to book. Note the article's publish/update date.
  - **B:** Is there a cookery school in Exeter? List cooking classes near Exeter with location, distance, price and class types.
  - **C:** Which supper clubs near Exeter run in winter? Details.
- **Runs:** each question on each version twice, 12 runs in all. Each run was a
  fresh Haiku subagent instructed to act as the extraction step, with WebFetch's
  125-character quote rule.

This simulates the extraction step. The real WebFetch call on the live page
returned the whole page as markdown, not an extract, so the step couldn't be
observed directly on the day.

## Result

| | Original | Rewrite |
|---|---|---|
| A: DWF listed as a supper club | 2 / 2 | 2 / 2 |
| B: DWF mentioned | 2 / 2 (once as its events, once as a bias note) | 1 / 2 (as a bias note) |
| C: DWF listed | 2 / 2 | 2 / 2 |
| Requested facts carried (closed cookery school, River Cottage price, The Turf's season, Nobody Inn fire damage) | Every run that asked | Every run that asked |
| DWF's own entry reported as missing price, dates or winter schedule | Every A and C run | Every A and C run |
| DWF's entry noted as the publisher's own, promotional or not independent | 3 runs | 3 runs |

**No measurable difference.** The page fits in the reader whole, so moving facts
to the top didn't change which ones it picked out. Naming the brand inside the
answer block added nothing, because the title and byline already carried it.

**What would change the result is facts the page doesn't have.** Question C is
the clearest case. The Turf is closed in winter, and The Nobody Inn's kitchen is
working around fire damage. DWF runs regular dinners in Exeter, but the page
gives no price, frequency or winter dates. So every run answered "no winter
schedule given", when a dated, priced, year-round listing would have made DWF
the answer. The booking link `/events` also came back as "a relative /events
link, no domain given".

## Changes that followed

- **geo-kit `skills/geo-content`:** if the site is one of the options, it gets
  the same facts as the others (price, schedule, season) and an absolute booking
  URL. Self-praise gets flagged; facts get repeated.
- **geo-kit `playbook/engine-coverage.md`:** new section, "Opened but not cited:
  what the agent actually reads".
- **For the DWF page:**
  - Add the price per dinner, how often dinners run, and that they run through
    winter (if true).
  - Use `https://dinnerswithfriends.co.uk/events` as the booking link.
  - Put "supper clubs in Devon" in the title.

## Limits

- **Sample:** 12 runs, one page, one model standing in for the extractor.
- **Page length:** long pages may be cut before extraction. There, position can
  matter in a way this 2,400-word page couldn't show.
- **Codex** wasn't tested. Its page reading isn't exposed in the transcripts in
  the same way.
