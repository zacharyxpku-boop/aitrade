# Lesson Batch Review Status Example

This file shows how a human reviewer status overlay should be filled.
It is sample-only scaffolding, not a real review, approval, learner-facing release, production readiness, or trading guidance.

## Summary

- Sample only: true
- Example batch: rewrite_batch_02
- Example lesson cards: 6
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## How To Use

- Use this file only to understand the expected shape of a manually filled status overlay.
- Create or edit docs/LESSON_BATCH_REVIEW_STATUS.json only after a real human reviewer performs the work.
- Keep approvalStatus:not_approved and learnerFacingRelease:false even when a batch is ready for a separate approval review.
- Do not use example notes as real reviewer evidence.

## Example Lesson Rows

| Lesson | Risk | Tracking status | Source-fit action | Required note fields filled |
| --- | --- | --- | --- | ---: |
| lesson_knv2_0187 | low | example_ready_for_separate_human_approval_review | queue_for_human_rewrite_after_fast_pass_notes | 6/6 |
| lesson_knv2_0006 | medium | example_ready_for_separate_human_approval_review | complete_targeted_source_fit_checklist | 6/6 |
| lesson_knv2_0018 | medium | example_ready_for_separate_human_approval_review | complete_targeted_source_fit_checklist | 6/6 |
| lesson_knv2_0030 | low | example_ready_for_separate_human_approval_review | queue_for_human_rewrite_after_fast_pass_notes | 6/6 |
| lesson_knv2_0024 | low | example_ready_for_separate_human_approval_review | queue_for_human_rewrite_after_fast_pass_notes | 6/6 |
| lesson_knv2_0132 | low | example_ready_for_separate_human_approval_review | queue_for_human_rewrite_after_fast_pass_notes | 6/6 |

## Boundary

This example is sample-only reviewer scaffolding. It does not approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.
