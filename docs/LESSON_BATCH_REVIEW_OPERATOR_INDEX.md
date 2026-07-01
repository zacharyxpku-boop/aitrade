# Lesson Batch Review Operator Index

This is the broad reviewer entrypoint for the 48-lesson rewrite queue.
It links the all-batch dashboard, source-fit dashboard, overlay preflight, and first-reviewer handoff without creating real notes, approvals, release candidates, or readiness claims.

## Summary

- Operator index ready: true
- Operator mode: all_batch_single_entrypoint_pre_write_only
- Rewrite batches: 8
- Lesson cards: 48
- Risk mix: H:2 M:21 L:25
- Blank note fields: 288
- Filled note fields: 0
- Real status overlay present: false
- Write allowed now: false
- Manual decision required: true
- Human authorization recorded: false
- Approval review candidates: 0
- Commercial-ready promotions: 0
- Internal trial ready: false
- Launch ready: false
- educationOnly: true
- productionReady: false

## Phase Map

| Order | Phase | Status | File | Command | Purpose | Hard stop |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | All-batch orientation | ready_pre_write_only | `docs/LESSON_BATCH_REVIEW_OPERATOR_DASHBOARD.md` | `npm.cmd run check:lesson-batch-review-operator-dashboard` | See the 8-batch / 48-lesson queue and risk mix. | Dashboard is not review evidence or approval. |
| 2 | All-batch source-fit queue | ready_pre_write_only | `docs/SOURCE_FIT_REVIEWER_DASHBOARD.md` | `npm.cmd run check:source-fit-reviewer-dashboard` | Use high, medium, and low source-fit reports to choose work order. | Source-fit dashboard cannot confirm source use without human notes. |
| 3 | All-batch overlay preflight | write_blocked_manual_required | `docs/LESSON_BATCH_REVIEW_OVERLAY_PREFLIGHT.md` | `npm.cmd run check:lesson-batch-review-overlay-preflight` | Confirm the broad queue is still pre-write with real overlay absent. | writeAllowedNow must stay false until explicit human authorization. |
| 4 | First reviewer entrypoint | ready_pre_write_only | `docs/FIRST_REVIEWER_OPERATOR_INDEX.md` | `npm.cmd run check:first-reviewer-operator-index` | Start concrete note-taking workflow with the first two high-risk batches. | First-reviewer index is still scaffolding only. |
| 5 | Day-zero write handoff | write_blocked_manual_required | `docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.md` | `npm.cmd run check:first-reviewer-day-zero-write-handoff` | Use the scoped day-zero route only when a human reviewer is ready. | Generated handoff cannot authorize write mode. |
| 6 | Full curriculum gate | required_before_any_claim | `docs/CURRICULUM_REVIEW_QUEUE.md` | `npm.cmd run check:curriculum-review` | Re-run the full curriculum chain after reviewer-facing artifacts change. | Passing checks do not create approval, release, or production readiness. |

## Batch Priority

| Batch | Risk mix | Lessons | First action |
| --- | --- | ---: | --- |
| rewrite_batch_01 | H:1 M:5 L:0 | 6 | resolve_high_risk_source_fit_before_any_rewrite |
| rewrite_batch_02 | H:0 M:2 L:4 | 6 | complete_targeted_source_fit_notes_then_rewrite |
| rewrite_batch_03 | H:0 M:3 L:3 | 6 | complete_targeted_source_fit_notes_then_rewrite |
| rewrite_batch_04 | H:0 M:1 L:5 | 6 | complete_targeted_source_fit_notes_then_rewrite |
| rewrite_batch_05 | H:1 M:2 L:3 | 6 | resolve_high_risk_source_fit_before_any_rewrite |
| rewrite_batch_06 | H:0 M:2 L:4 | 6 | complete_targeted_source_fit_notes_then_rewrite |
| rewrite_batch_07 | H:0 M:1 L:5 | 6 | complete_targeted_source_fit_notes_then_rewrite |
| rewrite_batch_08 | H:0 M:5 L:1 | 6 | complete_medium_heavy_source_fit_notes_before_rewrite |

## Operator Rules

- Start broad review from this index, then use the all-batch dashboard and source-fit dashboard to choose the next human-reviewed batch.
- Handle high-risk rows before medium and low rows; the first concrete write workflow remains scoped to rewrite_batch_01 and rewrite_batch_05.
- Keep generated notes, examples, packets, dashboards, and preflights separate from real human reviewer notes.
- Use the real overlay only after explicit human authorization; current generated state keeps writeAllowedNow:false.
- Never treat completed notes as approval; separate approval review remains required after evidence intake.
- Do not infer internal trial, launch, commercial readiness, or production readiness from any reviewer scaffold.

## Stop Conditions

- Stop if docs/LESSON_BATCH_REVIEW_STATUS.json appears without explicit human note-taking authorization.
- Stop if any generated scaffold is copied as real reviewer notes.
- Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.
- Stop if any artifact claims approval, learner-facing release, commercial_ready promotion, internalTrialReady, launchReady, or productionReady.
- Stop if notes or lesson text include buy/sell/hold advice, trading signals, performance claims, broker/order workflow, automation, copied external source prose, or real-money guidance.

## Boundary

This all-batch operator index is reviewer-facing operations scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, launch the course, or make the product production-ready.
