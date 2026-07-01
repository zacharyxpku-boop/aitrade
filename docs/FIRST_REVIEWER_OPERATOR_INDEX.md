# First Reviewer Operator Index

This is the single operator entrypoint for first-reviewer work.
It connects the pre-write handoff, manual decision worksheets, post-write validation, evidence intake, separate approval gate, and launch-readiness blockers.
It does not create reviewer notes, approve lessons, publish learner-facing content, promote lesson grades, or certify production readiness.

## Summary

- Operator index ready: true
- Operator mode: single_entrypoint_pre_write_only
- Write allowed now: false
- Post-write execution allowed now: false
- Real status overlay present: false
- Complete note cards: 0
- Approval review candidates: 0
- Confirmed direct decisions: 0
- Internal trial ready: false
- Launch ready: false
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Phase Map

| Order | Phase | Status | Primary file | Command | Next action | Blocker |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Operator entrypoint | single_entrypoint_ready_pre_write_only | `docs/FIRST_REVIEWER_OPERATOR_INDEX.md` | `npm.cmd run check:first-reviewer-operator-index` | Start here before opening other first-reviewer files. | None; this index is an orientation map only. |
| 2 | One-page runbook | printable_operator_runbook_ready | `docs/FIRST_REVIEWER_ONE_PAGE_RUNBOOK.md` | `npm.cmd run check:first-reviewer-one-page-runbook` | Use the printable runbook as the day-of-review sequence and hard-stop checklist. | Runbook is not real notes, approval, release, or write permission. |
| 3 | Runbook misuse guard | runbook_misuse_guard_ready | `docs/FIRST_REVIEWER_RUNBOOK_NEGATIVE_CASES.md` | `npm.cmd run check:first-reviewer-runbook-negative-cases` | Keep misuse negative cases passing before using the runbook. | Runbook cannot become notes, approval, release, grade promotion, launch readiness, or production readiness. |
| 4 | Pre-write sample dossier | read_only_human_handoff_ready | `docs/FIRST_REVIEWER_PREWRITE_SAMPLE_DOSSIER.md` | `npm.cmd run check:first-reviewer-prewrite-sample-dossier` | Use as a read-only handoff packet for the first 12 lesson cards and gate sequence. | Dossier cannot create notes, approvals, release candidates, or readiness claims. |
| 5 | Filled-notes positive control v2 | temporary_candidate_flow_control_ready | `docs/FIRST_REVIEWER_FILLED_NOTES_POSITIVE_CONTROL_V2.md` | `npm.cmd run check:first-reviewer-filled-notes-positive-control-v2` | Use the temporary-file control to prove completed notes become candidate-only rows. | Positive control is not real notes, approval, release, grade promotion, or readiness. |
| 6 | Post-write approval drill | temporary_release_blocker_drill_ready | `docs/FIRST_REVIEWER_POST_WRITE_APPROVAL_DRILL.md` | `npm.cmd run check:first-reviewer-post-write-approval-drill` | Use the temporary drill to prove approval-review candidates stay blocked from release, launch, grade promotion, and production readiness. | Drill is not real notes, approval, release, grade promotion, launch readiness, or production readiness. |
| 7 | Direct-candidate post-write drill | temporary_source_fit_boundary_drill_ready | `docs/FIRST_REVIEWER_DIRECT_CANDIDATE_POST_WRITE_DRILL.md` | `npm.cmd run check:first-reviewer-direct-candidate-post-write-drill` | Use the temporary drill to validate sourceFitNotes boundaries for BEA, BLS, CFTC, and SEC candidate rows. | Drill is not real source confirmation, approval, release, grade promotion, launch readiness, or production readiness. |
| 8 | Post-write validation simulator | temporary_post_write_sequence_simulator_ready | `docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_SIMULATOR.md` | `npm.cmd run check:first-reviewer-post-write-validation-simulator` | Use the temporary simulator to rehearse completion, evidence intake, separate approval, and release-drift guards. | Simulator is not real reviewer evidence, approval, release, grade promotion, launch readiness, or production readiness. |
| 9 | Sequence consistency gate | pre_write_order_integrity_ready | `docs/FIRST_REVIEWER_SEQUENCE_CONSISTENCY.md` | `npm.cmd run check:first-reviewer-sequence-consistency` | Use the sequence gate to confirm first-reviewer execution steps, operator phases, command rows, and packet order remain contiguous. | Sequence gate is not real reviewer evidence, approval, release, grade promotion, launch readiness, or production readiness. |
| 10 | Day-of-review packet freeze | frozen_pre_write_packet_ready | `docs/FIRST_REVIEWER_DAY_OF_REVIEW_PACKET_FREEZE.md` | `npm.cmd run check:first-reviewer-day-of-review-packet-freeze` | Use the frozen packet to confirm every first-reviewer step has explicit input, expected output, failure route, and forbidden actions. | Freeze packet is not real reviewer evidence, approval, release, grade promotion, launch readiness, or production readiness. |
| 11 | Orient and scope | ready | `docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.md` | `npm.cmd run check:first-reviewer-human-execution-bundle` | Use the bundle for the human reviewer execution order. | Bundle is not approval, release, or write permission. |
| 12 | Dry-run packet | ready | `docs/FIRST_REVIEWER_DRY_RUN_PACKET.md` | `npm.cmd run check:first-reviewer-dry-run-packet` | Review file and command order before real note-taking. | Dry-run output is not real review evidence. |
| 13 | Source fit and direct candidates | blocked_until_human_decision | `docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.md` | `npm.cmd run check:first-reviewer-direct-candidate-decision-worksheet` | Confirm, downgrade, or block each direct-candidate source role. | Generated rows cannot confirm direct evidence. |
| 14 | Source-fit decision summary | one_page_summary_ready_no_decisions | `docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md` | `npm.cmd run check:first-reviewer-source-fit-decision-summary` | Compare confirm, downgrade, and block criteria before sourceFitNotes are written. | Summary cannot choose the decision or confirm direct evidence. |
| 15 | SourceFitNotes card pack | blank_printable_cards_ready | `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md` | `npm.cmd run check:first-reviewer-source-fit-notes-card-pack` | Use blank cards for future direct-candidate sourceFitNotes. | Cards cannot be treated as filled notes, source confirmation, or approval. |
| 16 | SourceFitNotes card misuse guard | card_misuse_guard_ready | `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md` | `npm.cmd run check:first-reviewer-source-fit-notes-card-negative-cases` | Prove simulated card pollution is rejected before future sourceFitNotes. | Negative cases are not real notes, source confirmation, approval, or write permission. |
| 17 | SourceFitNotes positive matrix | sample_only_positive_shapes_ready | `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md` | `npm.cmd run check:first-reviewer-source-fit-notes-positive-matrix` | Use sample-only confirm, downgrade, and block note shapes before future sourceFitNotes. | Samples cannot be copied as real notes or treated as source confirmation. |
| 18 | SourceFitNotes human-fill preflight | manual_fill_preflight_ready_write_blocked | `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md` | `npm.cmd run check:first-reviewer-source-fit-notes-human-fill-preflight` | Check reviewer identity, candidate decisions, source identity basis, and no-copy requirements before real note entry. | Preflight cannot choose decisions, fill notes, or grant write permission. |
| 19 | Blank notes and safe examples | ready_blank_only | `docs/FIRST_REVIEWER_HUMAN_NOTE_STARTER_TEMPLATE.md` | `npm.cmd run check:first-reviewer-human-note-starter-template` | Use blank fields and examples as reviewer scaffolding only. | Examples and prompts cannot be copied as real notes. |
| 20 | Manual start gate | manual_required | `docs/FIRST_REVIEWER_HUMAN_REVIEW_START_CHECKLIST.md` | `npm.cmd run check:first-reviewer-human-review-start-checklist` | A human reviewer must intentionally decide to begin real note-taking. | Generated state keeps start blocked. |
| 21 | Real overlay preflight | write_blocked_manual_required | `docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.md` | `npm.cmd run check:first-reviewer-real-overlay-preflight-summary` | Run before any explicit write initializer. | writeAllowedNow:false until explicit human decision. |
| 22 | Write readiness lock | write_locked_manual_decision_required | `docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.md` | `npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock` | Use as the final generated hard stop before any real overlay write command. | Lock cannot replace explicit human note-taking intent. |
| 23 | Write authorization preview | authorization_preview_ready_manual_required | `docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.md` | `npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview` | Use as the generated preview that separates machine-checked gates from the still-missing human write authorization. | Preview keeps writeAllowedNow:false and cannot authorize or create the real overlay. |
| 24 | Day-zero write handoff | day_zero_handoff_ready_write_blocked | `docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.md` | `npm.cmd run check:first-reviewer-day-zero-write-handoff` | Use as the one-page day-zero route for pre-write checks, human authorization blockers, write-command preview, and future post-write validation order. | Handoff keeps writeAllowedNow:false and cannot authorize or create the real overlay. |
| 25 | Dry-run bundle audit | dry_run_bundle_audit_ready_pre_write_only | `docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md` | `npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit` | Use as the consistency audit tying dry-run, overwrite protection, day-zero handoff, final rehearsal, and write locks together before any future real overlay write. | Audit keeps writeAllowedNow:false and cannot authorize or create the real overlay. |
| 26 | Post-write validation | future_only_overlay_absent | `docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.md` | `npm.cmd run check:first-reviewer-post-write-command-pack` | Use only after a human-created real overlay exists. | executionAllowedNow:false and overlay absent. |
| 27 | Evidence intake | blocked_no_real_notes | `docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.md` | `npm.cmd run check:first-reviewer-evidence-intake-summary` | Summarize real note completeness after post-write checks pass. | No complete note cards exist. |
| 28 | Separate approval | blocked_no_candidates | `docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.md` | `npm.cmd run check:first-reviewer-separate-approval-review-gate` | Keep completed notes behind a separate human approval review. | No approval-review candidates exist. |
| 29 | Launch readiness | not_ready_non_production | `docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.md` | `npm.cmd run check:first-reviewer-launch-readiness-dashboard` | Use as a blocker dashboard only. | internalTrialReady:false, launchReady:false, productionReady:false. |

## Single Entrypoint Rules

- Start from this operator index before any other first-reviewer document.
- Do not create or write the real overlay unless preflight passes and a human reviewer explicitly decides to begin note-taking.
- Use the post-write command pack only after docs/LESSON_BATCH_REVIEW_STATUS.json exists from a deliberate human-review workflow.
- Evidence intake is triage only; separate approval review is still required.
- This index cannot approve lessons, release learner-facing content, promote grades, grant internal-trial readiness, or change productionReady.

## Critical Commands

1. `npm.cmd run check:first-reviewer-operator-index`
2. `npm.cmd run check:first-reviewer-one-page-runbook`
3. `npm.cmd run check:first-reviewer-runbook-negative-cases`
4. `npm.cmd run check:first-reviewer-prewrite-sample-dossier`
5. `npm.cmd run check:first-reviewer-filled-notes-positive-control-v2`
6. `npm.cmd run check:first-reviewer-post-write-approval-drill`
7. `npm.cmd run check:first-reviewer-direct-candidate-post-write-drill`
8. `npm.cmd run check:first-reviewer-post-write-validation-simulator`
9. `npm.cmd run check:first-reviewer-sequence-consistency`
10. `npm.cmd run check:first-reviewer-day-of-review-packet-freeze`
11. `npm.cmd run check:first-reviewer-real-overlay-preflight-summary`
12. `npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock`
13. `npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview`
14. `npm.cmd run check:first-reviewer-day-zero-write-handoff`
15. `npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit`
16. `npm.cmd run check:first-reviewer-post-write-command-pack`
17. `npm.cmd run check:curriculum-review`

## Stop Conditions

- Stop if docs/LESSON_BATCH_REVIEW_STATUS.json appears without an explicit human note-taking decision.
- Stop if any artifact sets approvalStatus other than not_approved, learnerFacingRelease:true, productionReady:true, internalTrialReady:true, or launchReady:true.
- Stop if generated prompts, examples, or worksheets are copied into real notes as review evidence.
- Stop if any yellow, red, or research_only source is proposed as learner-facing evidence.
- Stop if any note or lesson text adds buy/sell/hold advice, trading signals, performance claims, broker/order workflow, automation, copied source prose, or real-money guidance.

## Boundary

This operator index is reviewer-facing operations scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, or make the product production-ready.
