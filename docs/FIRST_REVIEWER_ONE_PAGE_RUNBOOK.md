# First Reviewer One-Page Runbook

This runbook compresses the first-reviewer workflow into a printable operator page.
It is not real review evidence, approval, learner-facing release, commercial readiness, or production readiness.

## Status

- Runbook ready: true
- Runbook mode: printable_pre_write_operator_runbook
- Real status overlay present: false
- Write allowed now: false
- Post-write execution allowed now: false
- Lesson checklists: 12
- Required note fields: 72
- Direct candidates to resolve: 5
- Source-fit decision rows: 5
- SourceFitNotes cards: 5
- SourceFitNotes card negative cases: 15
- SourceFitNotes positive samples: 3
- SourceFitNotes human-fill preflight rows: 5
- Complete note cards: 0
- Approval review candidates: 0
- Internal trial ready: false
- Launch ready: false
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Before You Start

- [ ] I am using this as reviewer-facing scaffolding, not final course material.
- [ ] I have not created or overwritten docs/LESSON_BATCH_REVIEW_STATUS.json.
- [ ] I will keep all generated prompts, examples, and source excerpts out of real notes unless actual human review supports original wording.
- [ ] I will keep every lesson structural_draft until separate human rewrite and factual review are complete.

## One-Page Sequence

1. Open operator index
   - File: `docs/FIRST_REVIEWER_OPERATOR_INDEX.md`
   - Check: `npm.cmd run check:first-reviewer-operator-index`
   - Do: Confirm this is the active entrypoint and all readiness flags remain false.
   - Stop if: Any readiness, release, approval, or production flag turns true.
2. Read the one-page execution order
   - File: `docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.md`
   - Check: `npm.cmd run check:first-reviewer-human-execution-bundle`
   - Do: Use the bundle to confirm the longer file order after this page.
   - Stop if: The bundle stops being pre_write_manual_review_index.
3. Use the printable lesson pack
   - File: `docs/FIRST_REVIEWER_PRINTABLE_CHECKLIST_PACK.md`
   - Check: `npm.cmd run check:first-reviewer-printable-checklist-pack`
   - Do: Work through 12 lesson cards, 72 note fields, and 5 direct candidates on paper or manually.
   - Stop if: Any note field is prefilled by generated scaffolding.
4. Resolve direct candidates
   - File: `docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.md`
   - Check: `npm.cmd run check:first-reviewer-direct-candidate-decision-worksheet`
   - Do: Choose confirm after review, downgrade, or block for every direct-candidate source role.
   - Stop if: A generated row is treated as confirmed source evidence.
5. Read source-fit summary
   - File: `docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md`
   - Check: `npm.cmd run check:first-reviewer-source-fit-decision-summary`
   - Do: Compare confirm, downgrade, and block criteria before any future sourceFitNotes are written.
   - Stop if: The summary is treated as a decision, confirmation, approval, or write authorization.
6. Use blank sourceFitNotes cards
   - File: `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md`
   - Check: `npm.cmd run check:first-reviewer-source-fit-notes-card-pack`
   - Do: Prepare the 5 blank cards and leave all 35 required fields empty until real review.
   - Stop if: Any card field is prefilled or treated as a real note.
7. Check card misuse guards
   - File: `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md`
   - Check: `npm.cmd run check:first-reviewer-source-fit-notes-card-negative-cases`
   - Do: Confirm simulated card prefill, unsafe wording, source misuse, and yellow/red drift are rejected.
   - Stop if: A polluted card state is treated as a valid note or source confirmation.
8. Read positive note shapes
   - File: `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md`
   - Check: `npm.cmd run check:first-reviewer-source-fit-notes-positive-matrix`
   - Do: Use sample-only confirm, downgrade, and block note shapes as writing guidance.
   - Stop if: Sample text is copied as real reviewer evidence or treated as source confirmation.
9. Run sourceFitNotes fill preflight
   - File: `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md`
   - Check: `npm.cmd run check:first-reviewer-source-fit-notes-human-fill-preflight`
   - Do: Check reviewer identity, 5 candidate decisions, source identity basis, and no-copy requirements before real note entry.
   - Stop if: Preflight output is treated as write permission or real source confirmation.
10. Check note wording before write
   - File: `docs/FIRST_REVIEWER_SAFE_NOTE_EXAMPLES.md`
   - Check: `npm.cmd run check:first-reviewer-safe-note-examples`
   - Do: Use examples only for safe shape; write original notes only after real review.
   - Stop if: Examples, prompts, or source body text are copied into notes.
11. Run preflight before any overlay write
   - File: `docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.md`
   - Check: `npm.cmd run check:first-reviewer-real-overlay-preflight-summary`
   - Do: Confirm writeAllowedNow remains false until explicit human note-taking starts.
   - Stop if: The real overlay appears without deliberate human start.
12. Audit dry-run bundle consistency
   - File: `docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md`
   - Check: `npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit`
   - Do: Confirm dry-run, overwrite protection, day-zero handoff, final rehearsal, and write locks still agree.
   - Stop if: The audit grants write permission or finds command-order drift.
10. After future write, run command pack
   - File: `docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.md`
   - Check: `npm.cmd run check:first-reviewer-post-write-command-pack`
   - Do: Use the strict post-write command order only after a human-created overlay exists.
   - Stop if: Execution is treated as proof while the overlay is absent.
11. Intake complete notes only
   - File: `docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.md`
   - Check: `npm.cmd run check:first-reviewer-evidence-intake-summary`
   - Do: Use intake as triage after real notes pass lint and completion.
   - Stop if: Incomplete notes become approval candidates.
12. Keep separate approval separate
   - File: `docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.md`
   - Check: `npm.cmd run check:first-reviewer-separate-approval-review-gate`
   - Do: Send only complete intake candidates to a later separate human approval review.
   - Stop if: Any auto-approval, release, grade promotion, or production claim appears.
13. Read launch blockers
   - File: `docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.md`
   - Check: `npm.cmd run check:first-reviewer-launch-readiness-dashboard`
   - Do: Treat the dashboard as a blocker map, not readiness.
   - Stop if: internalTrialReady, launchReady, or productionReady becomes true.

## Hard Stops

- Stop if any artifact claims approval, learner-facing release, commercial readiness, internal-trial readiness, launch readiness, or production readiness.
- Stop if any note contains buy/sell/hold advice, trading signals, performance claims, broker/order workflow, automation, copied source prose, or real-money guidance.
- Stop if any yellow, red, or research_only source is proposed as learner-facing evidence.
- Stop if real reviewer notes are created by generated scaffolding rather than deliberate human review.

## Boundary

This one-page runbook is reviewer-facing manual scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, or make the product production-ready.
