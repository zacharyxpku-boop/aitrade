# Source Harvest Report

This report describes the source-harvest layer behind the AI trading education knowledge base.
It is not learner-facing course text and it does not make the product production-ready.

## Current Scope

- `SourceInventory`: 11,221 real metadata sources.
- `SourceReview`: 11,221 source review records.
- `ConceptCandidate`: 50,000 concept labels and taxonomy candidates.
- `PatternTaxonomy`: 5,000 indicator, candlestick, chart-pattern, price-action, risk, backtesting, and news/sentiment taxonomy entries.
- `OpenSourceProjectReview`: 1,200 real project/package review records.
- `BacktestMistakeCandidate`: 1,000 backtesting misconception candidates.
- `NewsSentimentConcept`: 1,000 news, event, and sentiment concept candidates.
- `DataBoundaryRule`: 300 data-source and usage boundary rules.
- `EducationGlossaryCandidate`: 10,000 education glossary candidates.
- `RiskPsychologyCandidate`: 3,000 risk and psychology candidates.

## Real Source Expansion

`docs/REAL_SOURCE_HARVEST.json` now records 11,221 real URLs:

- 805 GitHub repositories
- 4,639 npm package pages
- 4,936 npm linked URLs
- 841 official/public document URLs
- 0 final search-result URLs
- 3,169 taxonomy candidates after source relevance review
- 8,052 research-only sources after source relevance review
- 103 off-topic review-only sources
- 4,310 weak-relevance review-only sources
- Public-document use tiers: 270 green official/public-domain sources, 448 yellow metadata/citation-only sources, and 123 red terms-restricted references.

`docs/PUBLIC_DOCUMENT_URL_HEALTH.md` records an advisory URL health sample:

- 841 public-document URLs checked by HEAD (full population, no longer a sample)
- 411 reachable by HEAD
- 430 HEAD-failed URLs stay in manual review; a bounded 160-URL GET sample found 0 reachable within the review timeout

`docs/SOURCE_AUTHORITY_TIERS.md` separates the source pool by authority:

- Tier S: 335
- Tier A: 62
- Tier B: 2,724
- Tier C: 47
- Research/review only: 8,053

This is a real metadata expansion, not a license grant and not copied content.

`docs/SOURCE_REVIEW_BACKLOG.md` tracks unresolved source work:

- 0 failed GitHub query retries
- 0 failed npm query retries
- 430 public-document URLs needing manual review after HEAD review
- 0 public-document URLs moved to terms-review-pending in the bounded GET sample
- GET review currently covers a 160-URL bounded sample of the HEAD-failed set; reachability is still not treated as license approval
- 4 prioritized next source batches

## Corpus Layer (full-content research layer)

The knowledge base now has a license-gated full-content layer on top of source metadata:

- `docs/SOURCE_LICENSE_TIERS.md` classifies all 11,221 sources into four tiers: 280 public_domain, 315 permissive, 13 open_access, 10,613 restricted_default. Regional Fed/FRED hosts are held back as terms-review exceptions, and all video platforms stay restricted.
- The corpus layer reached 833 documents / 54,977 chunks (commercial-clean tiers only: public domain 216, arXiv 545, Wikipedia CC BY-SA 72). Retrieval domain-hit benchmark is 100% with no weak domains. Restricted-tier access decisions are catalogued in docs/RESTRICTED_TERMS_DECISION_TABLE.md.
- Corpus harvesters now cover five batches: 202 public-domain documents, 194 arXiv open-access papers, 6 pre-1929 public-domain classic trading books (`scripts/harvest-classics.mjs`, archive.org, 95-year rule with edition dedup), and 72 Wikipedia finance articles (`scripts/harvest-wikipedia.mjs`, CC BY-SA, new share_alike tier with attribution records). All failures stay recorded per batch report.
- `education-corpus-index.js` chunks the corpus into 12,429 evidence chunks (500-800 chars) and tags 71% of them against the 10 topic domains. A pdf-parse v2 API bug initially left PDFs abstract-only; `scripts/repair-corpus-pdf-text.mjs` re-extracted 117 PDFs to full text from the stored raw files.
- `check:corpus` enforces: every document carries a license tier, sha256 hash, source URL, fetch timestamp, and research-layer boundary; restricted-tier documents must be 0.
- Corpus text is internal research material. Open-access text must never be republished to learners; public-domain text still needs a spot check for embedded third-party material before commercial quoting.

## Use Boundary

External sources are not copied into learner-facing content.

- GitHub repositories: use metadata, project type, topics, license labels, and taxonomy cues only.
- npm packages: use package names, descriptions, licenses, links, and ecosystem metadata only.
- Green official `.gov` and public-domain classic sources: use for metadata, source refs, taxonomy, glossary seeds, source-boundary notes, and original lesson-rewrite evidence with citation and third-party spot checks.
- Yellow sources, including FRED/regional Fed: use as metadata/citation pointers only until terms review clears a narrower use.
- Red sources, including commercial education pages and unclear market-data terms: use only for source discovery and review backlog.
- Official/API/exchange docs outside the green tier: use as boundary and taxonomy references after terms review.
- Unknown or restrictive license: keep as `research_only`.
- Weak-relevance or off-topic metadata: keep as `research_only` and do not use for taxonomy or learner-facing grounding.

## Learner-Facing Rules

Learner-facing nodes must be original education writing.

They must not copy:

- README text
- source code
- examples
- strategy rules
- third-party course content
- restricted data
- screenshots
- trading outputs
- real-money instructions

## Next Harvest Actions

1. Expand official/public documentation sources selectively; 841 covers regulators, exchanges, macro data, microstructure, backtesting-bias research, sentiment, and data-terms domains, and the next push is depth review rather than raw count.
2. Split package/repository/homepage sources into quality tiers.
3. Promote only reviewed low-risk sources into concept grounding.
4. Backfill reviewed source IDs into concept and knowledge-node modules.
5. Keep `research_only` isolated from learner-facing content.
