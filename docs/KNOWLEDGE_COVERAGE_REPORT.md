# Knowledge Coverage Report

This report tracks the real-source layer for the AI trading education knowledge base.
It is source metadata only. It does not authorize market-data redistribution, copy third-party content, or make the product production-ready.

## Current Real Source Snapshot

Source file: `docs/REAL_SOURCE_HARVEST.json`

- Real URLs: 10,549
- GitHub repositories: 802
- npm package pages: 4,571
- npm linked URLs: 4,851
- Official/public document URLs: 325
- Search URLs counted as final sources: 0
- Taxonomy candidates after relevance review: 2,860
- Research-only sources after relevance review: 7,689
- Off-topic review-only sources: 99
- Weak-relevance review-only sources: 4,283
- Failed GitHub queries in latest run: 0
- Failed npm queries in latest run: 0
- Public document HEAD health sample: 200 checked, 42 reachable by HEAD, 158 need manual review.
- Authority tiers: S=188, A=133, B=2,670, C=4,851, R=2,707.

## Progress Against Long-Run Targets

- Target real project/document URLs: 3,000. Current: 10,549. Gap: 0.
- Target SourceInventory scale: 10,000. Current real-source pool: 10,549. Gap: 0.
- Search-entry reliance: current real-source snapshot counts 0 search URLs as final sources.

## Important Caveats

The raw real-source count now meets the numeric source-pool target, but this is not a completed professional knowledge base.

- A large share of the new breadth comes from npm package metadata and linked project URLs.
- Official and authoritative education/API/documentation sources are still thin at 325 URLs.
- Tier S+A sources total 321; this is better than raw metadata, but still not a full expert-reviewed curriculum base.
- Relevance filtering intentionally moved weak or off-topic metadata into `research_only`; this makes the usable pool smaller but safer.
- URL health is advisory: many public sites reject HEAD requests, so failed HEAD probes are kept as manual-review items rather than promoted or deleted automatically.
- Many package/repository sources are `research_only` until license and terms review is complete.
- Real source metadata has not yet been fully backfilled into `ConceptCandidate`, `ConceptCluster`, or `KnowledgeNodeV2`.
- Learner-facing nodes still require original education wording, boundary checks, and human review.

## Next Coverage Priorities

1. Expand official and exchange/data-provider documentation beyond the current 325 URLs.
2. Separate npm package pages, linked repositories, and linked homepages into quality tiers.
3. Backfill reviewed source references into concept candidates and knowledge nodes.
4. Keep `research_only` isolated from learner-facing course content.
5. Record failed npm queries and retry them later if the registry response changes.
