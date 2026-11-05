# Query fan-out study, 5 November 2026

260 agent runs: 100 UK commercial terms and 30 informational terms, once each through Claude and Codex.
The write-up is [ARTICLE.md](ARTICLE.md).

| File | Contents |
|---|---|
| `terms.txt` | The 100 terms, grouped into 10 verticals |
| `runs.jsonl` | One record per run: engine, term, vertical, search calls, pages opened, result domains, MCP calls, final answer |
| `queries.jsonl` | One record per query, with labels, year flag, template and modifier |
| `report.md`, `report.json` | Output of `cli.ts report` |
| `capped/` | The same outputs for 10 Claude runs with a 150-word answer limit, kept as a comparison |
| `informational/` | The terms, runs, queries and reports for the 30 informational terms |
| `dwf/` | A single-site case study: 30 Dinners With Friends terms scored with `cli.ts coverage`, plus an index check and the plan that followed |
| `scripts/` | `export-runs.ts` builds `runs.jsonl`; `by-vertical.mjs` builds the vertical table; `compare-informational.mjs` compares the two batches |

Raw transcripts (including fetched page text) stay in the gitignored
`fanout-data/` folder and aren't copied here.

## How the runs were made

- **Codex:** `node src/fanout/cli.ts run --terms src/fanout/terms/commercial-uk-100.txt --engines codex --out fanout-data/2026-11-05 --concurrency 4 --timeout 600`
- **Claude:** subagents of a Claude Code session, because headless `claude -p` was blocked on this account. Each transcript was added with `cli.ts ingest`.
- **Prompt:** the term, followed by an instruction to research it on the web, stay read-only and treat page content as data. The Claude version also noted that the search tools might need loading first.

To rebuild from the raw transcripts, run these from the repo root:

```bash
node src/fanout/cli.ts report --in fanout-data/2026-11-05
```

```bash
node --experimental-strip-types research/2026-11-fanout/scripts/export-runs.ts
```

```bash
node research/2026-11-fanout/scripts/by-vertical.mjs src/fanout/terms/commercial-uk-100.txt fanout-data/2026-11-05/queries.jsonl fanout-data/2026-11-05/report.json
```

For the informational batch, the Codex command used `--terms src/fanout/terms/informational-uk-30.txt --out fanout-data/2026-11-05-info`, with the same prompt and settings. To rebuild it and the comparison:

```bash
node src/fanout/cli.ts report --in fanout-data/2026-11-05-info
```

```bash
node --experimental-strip-types research/2026-11-fanout/scripts/export-runs.ts fanout-data/2026-11-05-info research/2026-11-fanout/informational src/fanout/terms/informational-uk-30.txt
```

```bash
node research/2026-11-fanout/scripts/compare-informational.mjs
```

## Known limits

See "What this can't tell you" in the article. In short: one run per term per engine, coding agents rather than consumer AI products, 91 of the 100 commercial terms start with "best", and the 30 informational terms are hand-picked, not matched pairs.
