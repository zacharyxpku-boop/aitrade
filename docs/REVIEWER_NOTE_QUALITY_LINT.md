# Reviewer Note Quality Lint

This lint defines quality gates for future real reviewer notes.
It does not create real notes, approve lessons, publish learner-facing content, or certify production readiness.

## Summary

- Real status overlay present: true
- Real note issues: 0
- Positive control passed: true
- Negative cases passing: 6/6
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Lint Rules

- Ready batches or cards must have all required note fields filled.
- Notes must be specific enough to show source-fit, fact-check, boundary, copying-risk, and original-rewrite work.
- Notes cannot use placeholders, generated example initials, or generic one-word approvals.
- Notes cannot claim final approval, learner-facing readiness, commercial readiness, production readiness, trading signals, broker/order workflows, automation readiness, performance, or real-money guidance.
- Reviewer initials must only be added after real human review work is performed.

## Negative Cases

| Case | Passed | Issues |
| --- | --- | ---: |
| blank_source_fit_note_rejected | true | 1 |
| generic_fact_check_note_rejected | true | 3 |
| placeholder_initials_rejected | true | 1 |
| unsafe_trading_note_rejected | true | 2 |
| approval_claim_rejected | true | 2 |
| copying_placeholder_rejected | true | 1 |

## Boundary

This lint is reviewer-status quality control only. It does not create real reviewer notes, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.
