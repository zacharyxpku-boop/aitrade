# Lesson Batch Status Negative Cases

This report proves the manual status overlay gate rejects unsafe or incomplete reviewer-status states.
It is not approval, learner-facing release, production readiness, or trading guidance.

## Summary

- Negative cases: 12
- Passed cases: 12
- Failed cases: 0
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Cases

| Case | Passed | Error message |
| --- | --- | --- |
| sample_overlay_rejected | true | manual status overlay cannot be sampleOnly |
| approval_status_rejected | true | manual status overlay must stay not_approved |
| learner_facing_release_rejected | true | manual status overlay cannot set learnerFacingRelease true |
| production_ready_rejected | true | manual status overlay must keep productionReady false |
| unknown_batch_rejected | true | manual status overlay references unknown batch rewrite_batch_UNKNOWN |
| duplicate_batch_rejected | true | manual status overlay has duplicate batch rewrite_batch_01 |
| unknown_lesson_rejected | true | rewrite_batch_01 manual status overlay references unknown lesson lesson_UNKNOWN |
| duplicate_lesson_rejected | true | rewrite_batch_01 manual status overlay has duplicate lesson lesson_knv2_0044 |
| ready_missing_notes_rejected | true | ready batch/card is missing required reviewer notes: lesson_knv2_0044.sourceFitNotes |
| grade_override_rejected | true | lesson_knv2_0044 cannot override currentGrade |
| trading_signal_status_rejected | true | lesson_knv2_0044 has disallowed manual status claim |
| sample_card_rejected | true | lesson_knv2_0044 cannot be sampleOnly in manual status overlay |

## Boundary

These negative cases are synthetic safety checks for reviewer-status overlays. They do not approve lessons, publish learner-facing content, change lesson grades, or certify commercial readiness.
