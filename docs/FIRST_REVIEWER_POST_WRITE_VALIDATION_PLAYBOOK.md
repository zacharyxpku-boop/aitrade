# First Reviewer Post-Write Validation Playbook

This playbook defines what to run after a human reviewer intentionally creates the real reviewer status overlay.
It is not a write command, approval, publication gate, lesson promotion, or learner-facing artifact.

## Summary

- Playbook ready: true
- Execution allowed now: false
- Real status overlay present: false
- Target batches: rewrite_batch_01, rewrite_batch_05
- Blank note fields before write: 72
- Direct candidates to resolve: 5
- Real ready batches now: 0
- Real note issues now: 0
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Pre-Write Gate

- Human review start checklist reports startAllowedNow:false until manual confirmation is performed.
- Real overlay creation checklist reports creationAllowedNow:false until an explicit human note-taking decision.
- All first-reviewer note fields remain blank before write; sample-only examples are not real notes.
- Direct-candidate source rows must be confirmed or downgraded before sourceFitNotes are filled.
- Current completion audit and gate summary show 0 real ready batches.

## Validation Sequence

1. `npm.cmd run check:first-reviewer-human-review-start-checklist` - Reconfirm the manual pre-start gate before any write path. Stop if fails: true
2. `npm.cmd run init:first-reviewer-status-overlay:dry-run` - Preview the real overlay scaffold without writing it. Stop if fails: true
3. `npm.cmd run init:first-reviewer-status-overlay:write` - Run only after explicit human review starts; creates blank real note fields. Stop if fails: true
4. `npm.cmd run check:lesson-batch-completion` - Validate real batch status shape and required-note completeness. Stop if fails: true
5. `npm.cmd run check:first-reviewer-real-overlay-diff-audit` - Compare the real overlay against the blank first-reviewer template for field-level changes and unsafe text risks. Stop if fails: true
6. `npm.cmd run check:reviewer-note-quality-lint` - Reject generic, placeholder, approving, trading, readiness, broker/order, automation, performance, or real-money wording. Stop if fails: true
7. `npm.cmd run check:first-reviewer-direct-candidate-confirmation-checklist` - Recheck direct-candidate source roles remain green-only and require human confirmation or downgrade. Stop if fails: true
8. `npm.cmd run check:first-reviewer-safe-note-examples` - Confirm sample-only examples remain separate from real reviewer notes. Stop if fails: true
9. `npm.cmd run check:curriculum-review` - Run the complete curriculum/reviewer gate chain. Stop if fails: true
10. `npm.cmd run check:knowledge-base` - Recheck knowledge-base and green grounding boundaries. Stop if fails: true
11. `npm.cmd run check:knowledge-browser` - Recheck learner-facing browser candidates remain safe and review-tracked. Stop if fails: true
12. `temporary SQLite npm.cmd run verify` - Run full repo verification with TRADEGYM_SQLITE_PATH set to a temp file and clean it afterward. Stop if fails: true

## Failure Handling

- Missing required reviewer notes: Keep the batch not_started or in_progress; fill only after actual human review work, then rerun completion and lint.
- Reviewer note quality lint fails: Edit the real notes to be specific, factual, non-approving, and safety-bound; do not mark any batch ready.
- Unsafe wording appears: Remove advice, signals, performance, broker/order, automation, or real-money wording and rerun the lint before any next gate.
- Source fit is unresolved: Downgrade the source role to boundary-only, metadata-only, historical context, macro/data context, or unsuitable in the note; do not use it as direct lesson evidence.
- Real overlay exists unexpectedly: Stop and preserve the file; do not overwrite, delete, or force-recreate it without explicit user authorization and note preservation.
- Curriculum review fails: Do not promote, publish, or approve; fix the failing gate while preserving education-only and source-boundary rules.

## Forbidden Recovery Actions

- Do not delete, overwrite, or force-recreate real reviewer notes as a shortcut.
- Do not copy sample-only notes into the real overlay as review evidence.
- Do not mark generated lessons commercial_ready.
- Do not set learnerFacingRelease:true.
- Do not set productionReady:true.
- Do not relax green/yellow/red or research_only source boundaries.
- Do not add buy/sell/hold advice, trading signals, broker/order workflows, automation, performance claims, or real-money guidance.

## Boundary

This playbook is a future post-write validation gate only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.
