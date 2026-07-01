# First Reviewer Release Readiness Negative Cases

This report proves release/readiness drift is rejected after evidence intake and separate approval review gates.
It is not approval, release, production readiness, grade promotion, or learner-facing content.

## Summary

- Negative cases: 8
- Passed cases: 8
- Failed cases: 0
- Real approval-review candidates: 0
- Auto-approved lessons: 0
- Learner-facing release candidates: 0
- Commercial-ready promotions: 0
- Production-ready claims: 0
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Cases

| Case | Passed | Error message |
| --- | --- | --- |
| approval_status_rejected | true | release readiness gate candidate must stay not_approved |
| learner_facing_release_rejected | true | release readiness gate candidate cannot be learner-facing release |
| production_ready_rejected | true | release readiness gate candidate must keep productionReady false |
| auto_approved_lessons_rejected | true | autoApprovedLessons must stay 0 |
| learner_facing_candidate_rejected | true | learnerFacingReleaseCandidates must stay 0 |
| commercial_ready_promotion_rejected | true | commercialReadyPromotions must stay 0 |
| production_ready_claim_rejected | true | productionReadyClaims must stay 0 |
| candidate_row_approval_wording_rejected | true | lesson_knv2_0068 contains release/approval wording |

## Boundary

These negative cases only guard against release/readiness drift. They do not approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.
