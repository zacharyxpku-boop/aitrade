# First Reviewer Direct Candidate Decision Worksheet

This worksheet gives the first reviewer a blank human-decision table for direct-candidate source roles.
It does not confirm any source, write real notes, approve lessons, publish content, promote grades, or grant readiness.

## Summary

- Worksheet ready: true
- Decision rows: 5
- Source refs to inspect: 8
- Families: BEA, BLS, CFTC, SEC
- Real status overlay present: false
- Confirmed decisions: 0
- Downgraded decisions: 0
- Blocked decisions: 0
- Approval review candidates: 0
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Decision Rows

| Lesson | Family | Risk | Refs | Current decision | Write target |
| --- | --- | --- | --- | --- | --- |
| lesson_knv2_0068 | CFTC | high | 4 | blank_requires_human_decision | sourceFitNotes |
| lesson_knv2_0087 | BEA | high | 1 | blank_requires_human_decision | sourceFitNotes |
| lesson_knv2_0087 | BLS | high | 1 | blank_requires_human_decision | sourceFitNotes |
| lesson_knv2_0087 | CFTC | high | 1 | blank_requires_human_decision | sourceFitNotes |
| lesson_knv2_0087 | SEC | high | 1 | blank_requires_human_decision | sourceFitNotes |

## Allowed Decision Values

- confirm_direct_evidence_after_human_review
- downgrade_to_boundary_only
- blocked_needs_rewrite_or_source_replacement

## Stop Conditions

- Stop if any direct candidate is marked confirmed by generated output instead of real human review.
- Stop if any source requires copied external source body text to support the lesson claim.
- Stop if any macro-data, filing, fraud, or oversight source is used as chart-pattern proof.
- Stop if any note includes buy/sell/hold advice, signals, returns, win-rate, profitability, broker/order workflow, automation, production readiness, or real-money guidance.
- Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.
- Stop if any decision changes lesson grade, approvalStatus, learnerFacingRelease, commercial readiness, or productionReady.

## Boundary

This worksheet is a blank human decision template for direct-candidate source roles only. It does not confirm source use, create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or make the product production-ready.
