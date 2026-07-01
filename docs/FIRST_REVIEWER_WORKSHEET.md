# First Reviewer Worksheet

This worksheet packages the first high-risk source-fit batches for human review.
It is not completed review, final approval, learner-facing release, production readiness, or trading guidance.

## Summary

- Target batches: rewrite_batch_01, rewrite_batch_05
- Worksheet lessons: 12
- High-risk lessons: 2
- Medium-risk lessons: 7
- Low-risk lessons: 3
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Review Order

1. Start with the high-risk lesson in each batch before rewriting any adjacent medium or low rows.
2. Record source-fit notes that separate direct evidence, boundary-only metadata, and sources to keep out of explanatory prose.
3. Rewrite only original education prose; do not copy external source body text.
4. Run the batch completion audit before any batch is marked ready for a separate human approval review.

## Batch Worksheets

### rewrite_batch_01

- First action: resolve_high_risk_source_fit_before_batch_rewrite
- Risk mix: high 1, medium 5, low 0
- Source families: BEA, BLS, CFTC, Federal Reserve, Investor.gov, Project Gutenberg, SEC, Treasury, federalregister.gov

| Lesson | Risk | Module | Topic | Next action | Required notes |
| --- | --- | --- | --- | --- | --- |
| lesson_knv2_0044 | medium | 多周期分析 | M15细节 | complete_targeted_source_fit_checklist | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0068 | high | 多周期分析 | D1背景 | resolve_high_risk_source_fit_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0128 | medium | 多周期分析 | D1背景 | complete_targeted_source_fit_checklist | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0140 | medium | 多周期分析 | H4结构 | complete_targeted_source_fit_checklist | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0054 | medium | 交易区间 | 区间突破 | complete_targeted_source_fit_checklist | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0019 | medium | 反转 | 衰竭证据 | complete_targeted_source_fit_checklist | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |

### rewrite_batch_05

- First action: resolve_high_risk_source_fit_before_batch_rewrite
- Risk mix: high 1, medium 2, low 3
- Source families: BEA, BLS, CFTC, Federal Reserve, Investor.gov, Project Gutenberg, SEC, Treasury, nist.gov

| Lesson | Risk | Module | Topic | Next action | Required notes |
| --- | --- | --- | --- | --- | --- |
| lesson_knv2_0075 | medium | K线与价格行为 | 组合K线 | complete_targeted_source_fit_checklist | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0087 | high | K线与价格行为 | 流动性扫过 | resolve_high_risk_source_fit_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0159 | medium | K线与价格行为 | 形态语境 | complete_targeted_source_fit_checklist | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0011 | low | 风险管理 | 失效条件 | queue_for_human_rewrite_after_fast_pass_notes | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0059 | low | 风险管理 | 边界语言 | queue_for_human_rewrite_after_fast_pass_notes | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0167 | low | 风险管理 | 可复盘计划 | queue_for_human_rewrite_after_fast_pass_notes | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |

## High-Risk Source Inspection

### lesson_knv2_0068

- Batch: rewrite_batch_01
- Module/topic: 多周期分析 / D1背景
- Review focus: Decide whether each attached source supports the topic directly or must be kept as boundary-only metadata before any prose rewrite.

Reviewer questions:
- Does each source family support the lesson topic directly, or only a boundary warning?
- Which source should be removed from explanatory prose and kept only as a reviewer citation?
- Does the rewritten lesson still work as original observation training without source-body copying?
- Are no-action, invalidation, and uncertainty visible before any practice prompt?

Rewrite directions:
- Rewrite as observation training: visible evidence first, interpretation limits second, no-action / invalidation / uncertainty third.
- Keep all sources as reviewer-facing boundary evidence only; do not copy source body text into lesson prose.
- Do not add buy/sell/hold, real-time signal, return/win-rate/backtest-profit, broker/order, auto-trading, or real-money guidance.
- If no public-domain historical source is semantically fit, remove historical-language claims and keep the lesson as pure chart-observation practice.
- Move Investor.gov/CFTC fraud context into boundary warnings only; do not use fraud pages to define chart structures.
- Before rewriting, either attach a better chart/historical/context source or explicitly mark the current source mix as boundary-only.

Source refs to inspect:
| Source | Family | Tier | Allowed use summary |
| --- | --- | --- | --- |
| CFTC AI Trading Bots Advisory | CFTC | green_official_public_domain | Use metadata, source refs, taxonomy, glossary seeds, source-boundary notes, and original lesson-rewrite evidence. Cite the agency and access date; spot-check embedded third-party material before quoting. |
| CFTC Commodity ETP Risks | CFTC | green_official_public_domain | Use metadata, source refs, taxonomy, glossary seeds, source-boundary notes, and original lesson-rewrite evidence. Cite the agency and access date; spot-check embedded third-party material before quoting. |
| CFTC Large Trader Reporting | CFTC | green_official_public_domain | Use metadata, source refs, taxonomy, glossary seeds, source-boundary notes, and original lesson-rewrite evidence. Cite the agency and access date; spot-check embedded third-party material before quoting. |
| Investor.gov Glossary Diversification | Investor.gov | green_official_public_domain | Use metadata, source refs, taxonomy, glossary seeds, source-boundary notes, and original lesson-rewrite evidence. Cite the agency and access date; spot-check embedded third-party material before quoting. |
| CFTC Market Surveillance | CFTC | green_official_public_domain | Use metadata, source refs, taxonomy, glossary seeds, source-boundary notes, and original lesson-rewrite evidence. Cite the agency and access date; spot-check embedded third-party material before quoting. |

### lesson_knv2_0087

- Batch: rewrite_batch_05
- Module/topic: K线与价格行为 / 流动性扫过
- Review focus: Decide whether each attached source supports the topic directly or must be kept as boundary-only metadata before any prose rewrite.

Reviewer questions:
- Does each source family support the lesson topic directly, or only a boundary warning?
- Which source should be removed from explanatory prose and kept only as a reviewer citation?
- Does the rewritten lesson still work as original observation training without source-body copying?
- Are no-action, invalidation, and uncertainty visible before any practice prompt?

Rewrite directions:
- Rewrite as observation training: visible evidence first, interpretation limits second, no-action / invalidation / uncertainty third.
- Keep all sources as reviewer-facing boundary evidence only; do not copy source body text into lesson prose.
- Do not add buy/sell/hold, real-time signal, return/win-rate/backtest-profit, broker/order, auto-trading, or real-money guidance.
- If no public-domain historical source is semantically fit, remove historical-language claims and keep the lesson as pure chart-observation practice.
- Move Investor.gov/CFTC fraud context into boundary warnings only; do not use fraud pages to define chart structures.
- Narrow the lesson to one source role per paragraph: term boundary, data boundary, fraud warning, or historical context.

Source refs to inspect:
| Source | Family | Tier | Allowed use summary |
| --- | --- | --- | --- |
| SEC Developer Resources | SEC | green_official_public_domain | Use metadata, source refs, taxonomy, glossary seeds, source-boundary notes, and original lesson-rewrite evidence. Cite the agency and access date; spot-check embedded third-party material before quoting. |
| CFTC Phony Trading Websites | CFTC | green_official_public_domain | Use metadata, source refs, taxonomy, glossary seeds, source-boundary notes, and original lesson-rewrite evidence. Cite the agency and access date; spot-check embedded third-party material before quoting. |
| BLS PPI | BLS | green_official_public_domain | Use metadata, source refs, taxonomy, glossary seeds, source-boundary notes, and original lesson-rewrite evidence. Cite the agency and access date; spot-check embedded third-party material before quoting. |
| BEA Data Application Programming Interface | BEA | green_official_public_domain | Use metadata, source refs, taxonomy, glossary seeds, source-boundary notes, and original lesson-rewrite evidence. Cite the agency and access date; spot-check embedded third-party material before quoting. |
| US Treasury Daily Treasury Rates | Treasury | green_official_public_domain | Use metadata, source refs, taxonomy, glossary seeds, source-boundary notes, and original lesson-rewrite evidence. Cite the agency and access date; spot-check embedded third-party material before quoting. |

## Boundary

This worksheet is reviewer-facing scaffolding for human source-fit and rewrite work. It does not approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.
