# First Reviewer SourceFitNotes Positive Matrix

This sample-only matrix shows the acceptable shape of future human `sourceFitNotes` for the three allowed decisions.
It is not real reviewer evidence, source confirmation, approval, release, commercial readiness, or production readiness.

## Summary

- Matrix ready: true
- Sample only: true
- Decision samples: 3
- Passed samples: 3
- Failed samples: 0
- Source refs checked: 8
- Real status overlay present: false
- Confirmed decisions: 0
- Approval review candidates: 0
- Write allowed now: false
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Decision Samples

| Decision | Family | Intended use | Passed | Issues |
| --- | --- | --- | --- | --- |
| confirm_direct_evidence_after_human_review | SEC | future direct filing-literacy support only after human source inspection | true | none |
| downgrade_to_boundary_only | BLS | macro-data context without direct chart proof | true | none |
| blocked_needs_rewrite_or_source_replacement | CFTC | block when fraud education is being misused as direct pattern evidence | true | none |

## Sample Notes

### confirm_direct_evidence_after_human_review / SEC

decision: confirm_direct_evidence_after_human_review. source role: SEC is treated as direct evidence for filing-literacy mechanics, not chart interpretation after a human checks the source title, metadata, and document role. claim: the lesson claim is narrowed to reading filing metadata and event context; no chart outcome or trading action is inferred. rewrite action: rewrite the source reference as filing-literacy support and remove any wording that treats the filing as market direction. Keep the lesson as structural_draft until separate human review is complete. source identity basis: source id and filing metadata are recorded from the reviewer-inspected SEC document title and metadata. no-copy originality check: write original reviewer prose only; do not copy external source body text into notes or lesson copy.

### downgrade_to_boundary_only / BLS

decision: downgrade_to_boundary_only. source role: BLS is treated as macro-data context and source-boundary evidence only after a human checks the source title, metadata, and document role. claim: the source can explain CPI or employment release context, but it does not directly support a candlestick, liquidity, or pattern claim. rewrite action: downgrade the citation to boundary-only context and rewrite the lesson claim so macro data is separated from chart observation. Keep the lesson as structural_draft until separate human review is complete. source identity basis: release table title, source id, and metadata are recorded without copying table text. no-copy originality check: write original reviewer prose only; do not copy external source body text into notes or lesson copy.

### blocked_needs_rewrite_or_source_replacement / CFTC

decision: blocked_needs_rewrite_or_source_replacement. source role: CFTC is treated as fraud-risk education, unsuitable for direct chart or execution claims after a human checks the source title, metadata, and document role. claim: the current lesson claim asks the source to support a pattern-specific market interpretation that this fraud-education source does not support. rewrite action: block the source fit until the lesson is rewritten as fraud-risk literacy or a better direct source is selected. Keep the lesson as structural_draft until separate human review is complete. source identity basis: document role, title metadata, and source id show investor-protection context rather than technical chart evidence. no-copy originality check: write original reviewer prose only; do not copy external source body text into notes or lesson copy.

## Boundary

This positive matrix is sample-only reviewer training scaffolding. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, promote grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or make the product production-ready.
