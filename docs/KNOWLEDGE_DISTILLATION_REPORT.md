# Knowledge Distillation Report

This report tracks the first distillation layer from source metadata and taxonomy candidates into education knowledge nodes.

## Current Distillation Layer

- `ConceptCluster`: groups concept candidates into teachable topics.
- `DistillationCandidate`: marks candidate clusters, source risk, license boundary, and original-expression requirements.
- `KnowledgeNodeV2`: draft education nodes with definition, principle, multi-timeframe reading, common mistakes, anti-examples, practice prompts, AI grading drafts, and boundaries.
- `KnowledgeQualityReport`: counts learner-facing, draft, review-needed, and low-quality nodes.
- `DistillationRule`: keeps copying, source use, news use, backtesting use, and pattern misuse inside education-only boundaries.

## Current Status

The source pool is now broad enough for the next distillation pass, but the curriculum is not complete.

- Real source pool: 11,032 URLs.
- Official/public document URLs: 803.
- Relevance review keeps 99 off-topic and 4,284 weak-relevance sources in review-only status.
- Concept clusters: 3,000.
- Distillation candidates: 5,000.
- KnowledgeNodeV2 drafts: 1,500.
- Learner-facing candidates: 360.
- Draft nodes: 1,200.
- Review-needed nodes: 1,500.
- Learner-facing node candidates still require strict source review and original writing.
- `research_only` sources must not be promoted into learner-facing content.
- Package/repository metadata can help taxonomy, but it is not authority for education claims by itself.

## Minimum Bar Before Knowledge-Browser UI

Each learner-visible node should have:

1. Clear definition.
2. Underlying principle.
3. Multi-timeframe reading guidance.
4. Common mistakes.
5. Anti-examples.
6. Practice prompt.
7. AI grading draft.
8. Source boundary.
9. License boundary.
10. Boundary note that prevents trading advice, signals, or real-money interpretation.

## Distillation Priorities

1. Trend vs trading range.
2. Breakout vs false breakout.
3. Reversal vs failed reversal.
4. Multi-timeframe reading.
5. Volume and volatility.
6. News/event context.
7. Backtesting traps.
8. Win rate vs expectancy.
9. Risk management.
10. Trading psychology.

## Next Step

Backfill reviewed source IDs into `ConceptCandidate`, `ConceptCluster`, and `KnowledgeNodeV2`, then increase learner-facing candidates only where the source boundary is low-risk and the expression is original.

`education-knowledge-browser-index.js` now provides a UI-ready index for the first knowledge-browser scaffold. It exposes 12 modules and 360 learner-facing candidate nodes while keeping review tracking and education-only boundaries visible. All 360 current browser candidates have reviewed source refs, matched concept evidence, relevance signals, and separate Tier S/A authority context refs. After the official-grounding backfill, every learner-facing node carries at least one Tier S official-source reviewed ref (517 of 807 reviewed refs are Tier S), and reviewed refs are ordered by authority tier.

`education-knowledge-lessons.js` now turns those 360 learner-facing candidates into curriculum draft lesson cards. Each lesson has a learning goal, unique plain-language intro, teacher script, observation checklist, multi-timeframe walkthrough, mistakes, anti-examples, practice prompt, case discussion prompt, AI review prompts, rubric draft, closing review prompt, and source-evidence summary.

`education-curriculum-paths.js` now groups the 360 lesson drafts into 12 module paths and 36 learning units. Each unit has a checkpoint, pass criteria, pacing estimate, prerequisite relation, and review loop so the UI can guide a learner through a sequence instead of showing isolated cards. The current path graph has 11 path prerequisite edges and 24 unit prerequisite edges.

Official-source grounding is now category-aware: each distillation candidate carries two concepts grounded in distinct reviewed official/exchange/education sources, matched to the module's concept category, so 722 of 982 reviewed source refs topically match their module domain and 816 of 982 are Tier S.

`education-curriculum-review-queue.js` now adds the quality-control layer for this curriculum. It creates review items for path pacing, path source strategy, unit sequencing, unit checkpoints, lesson wording, lesson source evidence, lesson safety boundary, and lesson teaching quality. The queue is intentionally conservative: every item starts as `needs_review`, keeps `educationOnly:true`, keeps `productionReady:false`, and cannot be treated as final approval.

The next distillation goal is not just a larger source count. The next goal is to keep increasing official/public source depth, link those sources into concepts, and use the review queue to decide which lessons are strong enough for the knowledge-browser UI.
