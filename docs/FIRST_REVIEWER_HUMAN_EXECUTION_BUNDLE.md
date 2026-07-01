# First Reviewer Human Execution Bundle

This is the single-page execution index for the first human reviewer.
It does not create reviewer notes, approve lessons, publish learner-facing content, or change lesson grades.

## Summary

- Bundle ready: true
- Execution mode: pre_write_manual_review_index
- Real status overlay present: false
- Target batches: rewrite_batch_01, rewrite_batch_05
- Worksheet lessons: 12
- High-risk lessons: 2
- Source-family decisions: 45
- Direct candidates to confirm: 5
- Blank note fields: 72
- Real ready batches: 0
- Real note issues: 0
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Execution Steps

1. Operator index - File: `docs/FIRST_REVIEWER_OPERATOR_INDEX.md` - Command: `npm.cmd run check:first-reviewer-operator-index` - Human action: Start from the operator index before opening other first-reviewer files. - Gate: Index is not write permission, approval, release, or readiness.
2. One-page runbook - File: `docs/FIRST_REVIEWER_ONE_PAGE_RUNBOOK.md` - Command: `npm.cmd run check:first-reviewer-one-page-runbook` - Human action: Use this as the printable day-of-review sequence and hard-stop checklist. - Gate: Runbook is not real notes, write permission, approval, release, or readiness.
3. Runbook misuse guard - File: `docs/FIRST_REVIEWER_RUNBOOK_NEGATIVE_CASES.md` - Command: `npm.cmd run check:first-reviewer-runbook-negative-cases` - Human action: Keep the runbook misuse negative cases passing before using the runbook in review preparation. - Gate: Runbook cannot become notes, approval, release, grade promotion, launch readiness, or production readiness.
4. Pre-write sample dossier - File: `docs/FIRST_REVIEWER_PREWRITE_SAMPLE_DOSSIER.md` - Command: `npm.cmd run check:first-reviewer-prewrite-sample-dossier` - Human action: Use the dossier as a read-only handoff packet for the first 12 lesson cards and gate sequence. - Gate: Dossier cannot create notes, approvals, release candidates, or readiness claims.
5. Filled-notes positive control v2 - File: `docs/FIRST_REVIEWER_FILLED_NOTES_POSITIVE_CONTROL_V2.md` - Command: `npm.cmd run check:first-reviewer-filled-notes-positive-control-v2` - Human action: Use the temporary-file control to verify complete notes can become separate-approval candidates only. - Gate: Positive control is not real reviewer evidence and cannot auto-approve or publish lessons.
6. Post-write approval drill - File: `docs/FIRST_REVIEWER_POST_WRITE_APPROVAL_DRILL.md` - Command: `npm.cmd run check:first-reviewer-post-write-approval-drill` - Human action: Use the temporary drill to verify approval-review candidates remain blocked from release, launch, grade promotion, and production readiness. - Gate: Drill is not real reviewer evidence, approval, release, or readiness.
7. Direct-candidate post-write drill - File: `docs/FIRST_REVIEWER_DIRECT_CANDIDATE_POST_WRITE_DRILL.md` - Command: `npm.cmd run check:first-reviewer-direct-candidate-post-write-drill` - Human action: Use the temporary drill to validate sourceFitNotes boundaries for BEA, BLS, CFTC, and SEC candidate rows. - Gate: Drill is not real source confirmation, approval, release, or readiness.
8. Post-write validation simulator - File: `docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_SIMULATOR.md` - Command: `npm.cmd run check:first-reviewer-post-write-validation-simulator` - Human action: Use the temporary simulator to rehearse completion, evidence intake, separate approval, and release-drift guards after a future overlay exists. - Gate: Simulator is not real reviewer evidence, approval, release, grade promotion, launch readiness, or production readiness.
9. Sequence consistency gate - File: `docs/FIRST_REVIEWER_SEQUENCE_CONSISTENCY.md` - Command: `npm.cmd run check:first-reviewer-sequence-consistency` - Human action: Use the sequence gate to confirm execution steps, operator phases, post-write commands, and packet order remain contiguous. - Gate: Sequence gate is not real reviewer evidence, approval, release, grade promotion, launch readiness, or production readiness.
10. Day-of-review packet freeze - File: `docs/FIRST_REVIEWER_DAY_OF_REVIEW_PACKET_FREEZE.md` - Command: `npm.cmd run check:first-reviewer-day-of-review-packet-freeze` - Human action: Use the frozen packet to confirm every first-reviewer step has input, expected output, failure route, and forbidden actions. - Gate: Freeze packet is not real reviewer evidence, approval, release, grade promotion, launch readiness, or production readiness.
11. Orient - File: `docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.md` - Command: `npm.cmd run check:first-reviewer-human-execution-bundle` - Human action: Use this page as the reviewer execution order after the operator index. - Gate: No approval, release, or grade change.
12. Printable checklist - File: `docs/FIRST_REVIEWER_PRINTABLE_CHECKLIST_PACK.md` - Command: `npm.cmd run check:first-reviewer-printable-checklist-pack` - Human action: Print or open the per-lesson checklist pack for manual tracking. - Gate: Checklist boxes are not real review notes.
13. Handoff - File: `docs/FIRST_REVIEWER_HANDOFF.md` - Command: `npm.cmd run check:first-reviewer-handoff` - Human action: Confirm scope, commands, and disallowed status language. - Gate: Keep approvalStatus:not_approved.
14. Worksheet - File: `docs/FIRST_REVIEWER_WORKSHEET.md` - Command: `npm.cmd run check:first-reviewer-worksheet` - Human action: Review 12 lessons, starting with the 2 high-risk rows. - Gate: Do not rewrite learner-facing prose here.
15. Source roles - File: `docs/FIRST_REVIEWER_SOURCE_ROLE_DECISION_TABLE.md` - Command: `npm.cmd run check:first-reviewer-source-role-decision-table` - Human action: Classify source families before note-taking. - Gate: Do not treat candidate sources as approved direct evidence.
16. Direct candidates - File: `docs/FIRST_REVIEWER_DIRECT_CANDIDATE_CONFIRMATION_CHECKLIST.md` - Command: `npm.cmd run check:first-reviewer-direct-candidate-confirmation-checklist` - Human action: Confirm or downgrade the 5 direct candidates. - Gate: Use green sources only; no yellow/red/research-only learner-facing evidence.
17. Blank notes - File: `docs/FIRST_REVIEWER_HUMAN_NOTE_STARTER_TEMPLATE.md` - Command: `npm.cmd run check:first-reviewer-human-note-starter-template` - Human action: Use the 72 blank fields as the note map. - Gate: Do not paste generated text as real notes.
18. Safe examples - File: `docs/FIRST_REVIEWER_SAFE_NOTE_EXAMPLES.md` - Command: `npm.cmd run check:first-reviewer-safe-note-examples` - Human action: Read examples for style only. - Gate: Sample-only examples are not review evidence.
19. Start gate - File: `docs/FIRST_REVIEWER_HUMAN_REVIEW_START_CHECKLIST.md` - Command: `npm.cmd run check:first-reviewer-human-review-start-checklist` - Human action: Complete manual boxes before any real overlay write. - Gate: Generated state keeps startAllowedNow:false.
20. Creation gate - File: `docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.md` - Command: `npm.cmd run check:first-reviewer-real-overlay-creation-checklist` - Human action: Preview and intentionally decide whether a human will start note-taking. - Gate: No automatic creation; no overwrite.
21. Post-write route - File: `docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_PLAYBOOK.md` - Command: `npm.cmd run check:first-reviewer-post-write-validation-playbook` - Human action: After real overlay creation, run the validation sequence. - Gate: Still no approval or learner-facing release.
22. Diff audit - File: `docs/FIRST_REVIEWER_REAL_OVERLAY_DIFF_AUDIT.md` - Command: `npm.cmd run check:first-reviewer-real-overlay-diff-audit` - Human action: Compare any real overlay with the blank template. - Gate: Reject missing rows, unsafe wording, copy-risk wording, and status drift.
23. Evidence intake - File: `docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.md` - Command: `npm.cmd run check:first-reviewer-evidence-intake-summary` - Human action: Summarize complete notes, blockers, direct-candidate status, and candidates for separate approval review. - Gate: Intake is triage only, not approval or release.
24. Separate approval gate - File: `docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.md` - Command: `npm.cmd run check:first-reviewer-separate-approval-review-gate` - Human action: Keep complete-note candidates behind a separate manual approval review. - Gate: Candidate status is not approval, release, production readiness, or grade promotion.
25. Release drift guard - File: `docs/FIRST_REVIEWER_RELEASE_READINESS_NEGATIVE_CASES.md` - Command: `npm.cmd run check:first-reviewer-release-readiness-negative-cases` - Human action: Prove approval/release/production/commercial-ready drift is rejected. - Gate: Passing negative cases are required before any future release review.
26. Launch readiness dashboard - File: `docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.md` - Command: `npm.cmd run check:first-reviewer-launch-readiness-dashboard` - Human action: Review current blockers to internal trial, launch, and production readiness. - Gate: Dashboard readiness is not approval, release, commercial readiness, or production readiness.
27. Rehearsal checklist - File: `docs/FIRST_REVIEWER_REHEARSAL_CHECKLIST.md` - Command: `npm.cmd run check:first-reviewer-rehearsal-checklist` - Human action: Practice the 12 lesson cards, 72 note fields, and 5 direct-candidate decisions before real note-taking. - Gate: Rehearsal is not real reviewer evidence, approval, release, or readiness.
28. Direct candidate decisions - File: `docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.md` - Command: `npm.cmd run check:first-reviewer-direct-candidate-decision-worksheet` - Human action: Use the blank worksheet to decide confirm, downgrade, or blocked for each direct-candidate source role. - Gate: Generated worksheet rows are not confirmation; real sourceFitNotes are required.
29. Source-fit decision summary - File: `docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md` - Command: `npm.cmd run check:first-reviewer-source-fit-decision-summary` - Human action: Use the one-page summary to compare confirm, downgrade, and block criteria before writing sourceFitNotes. - Gate: Summary is not a decision, source confirmation, approval, release, or readiness.
30. SourceFitNotes card pack - File: `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md` - Command: `npm.cmd run check:first-reviewer-source-fit-notes-card-pack` - Human action: Print or copy the blank sourceFitNotes cards for the 5 direct candidates and leave all fields empty until real review. - Gate: Card pack is not filled notes, source confirmation, approval, release, or readiness.
31. SourceFitNotes card misuse guard - File: `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md` - Command: `npm.cmd run check:first-reviewer-source-fit-notes-card-negative-cases` - Human action: Run simulated pollution cases before any future sourceFitNotes are written. - Gate: Negative cases are not real notes, source confirmation, approval, release, or readiness.
32. SourceFitNotes positive matrix - File: `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md` - Command: `npm.cmd run check:first-reviewer-source-fit-notes-positive-matrix` - Human action: Read sample-only confirm, downgrade, and block note shapes before future human note writing. - Gate: Positive samples are not real notes, source confirmation, approval, release, or readiness.
33. SourceFitNotes human-fill preflight - File: `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md` - Command: `npm.cmd run check:first-reviewer-source-fit-notes-human-fill-preflight` - Human action: Confirm manual prerequisites before any real sourceFitNotes entry. - Gate: Preflight is not real notes, source confirmation, write permission, approval, release, or readiness.
34. Source fit notes acceptance - File: `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.md` - Command: `npm.cmd run check:first-reviewer-source-fit-notes-acceptance` - Human action: After future real sourceFitNotes are written, check that each note has a valid decision, source role, claim, rewrite action, and no unsafe wording. - Gate: Acceptance controls are not real notes, approval, release, or readiness.
35. Real overlay preflight - File: `docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.md` - Command: `npm.cmd run check:first-reviewer-real-overlay-preflight-summary` - Human action: Before any explicit write initializer, review the final manual and machine gates across start, creation, direct-candidate, sourceFitNotes, diff-audit, intake, and launch-readiness checks. - Gate: Preflight does not create the overlay and must keep writeAllowedNow:false until a human decision exists.
36. Write readiness lock - File: `docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.md` - Command: `npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock` - Human action: Use the generated lock as the final hard stop before any real overlay write command. - Gate: Lock remains writeAllowedNow:false and cannot replace explicit human note-taking intent.
37. Write authorization preview - File: `docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.md` - Command: `npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview` - Human action: Use the generated preview to separate machine-checked gates from missing human authorization before any write command. - Gate: Preview remains writeAllowedNow:false and cannot authorize or create the real overlay.
38. Day-zero write handoff - File: `docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.md` - Command: `npm.cmd run check:first-reviewer-day-zero-write-handoff` - Human action: Use the one-page handoff to review pre-write commands, human authorization blockers, write-command preview, and future post-write validation order. - Gate: Handoff remains writeAllowedNow:false and cannot authorize or create the real overlay.
39. Dry-run bundle audit - File: `docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md` - Command: `npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit` - Human action: Run the consistency audit tying dry-run, overwrite protection, day-zero handoff, final rehearsal, authorization preview, and write locks together. - Gate: Audit remains writeAllowedNow:false and cannot authorize or create the real overlay.
40. Post-write command pack - File: `docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.md` - Command: `npm.cmd run check:first-reviewer-post-write-command-pack` - Human action: After a future real overlay exists, run the strict validation order and failure routes without skipping gates. - Gate: Command pack is future-only now and cannot prove review evidence while the real overlay is absent.
41. Final gates - File: `docs/REVIEWER_NOTE_QUALITY_LINT.md` - Command: `npm.cmd run check:curriculum-review` - Human action: Run note lint, completion audit, curriculum review, knowledge checks, browser checks, and full verify. - Gate: Only a separate later approval review can consider readiness.

## Manual Sign-Off Boxes

- [ ] A human reviewer is identified before any real notes are written.
- [ ] Scope is limited to rewrite_batch_01 and rewrite_batch_05.
- [ ] The 5 direct-candidate source roles are confirmed or downgraded before sourceFitNotes.
- [ ] All 72 note fields start blank; generated prompts and examples are not copied as real notes.
- [ ] Reviewer accepts education-only, non-production, no-advice, no-signal, no-performance, no-broker, no-automation, and no-real-money boundaries.
- [ ] Real overlay write mode is intentional, and existing notes will not be overwritten.
- [ ] After write mode, completion, diff audit, note lint, curriculum, knowledge, browser, and full verify gates all run before any separate approval review.

## Stop Conditions

- Stop if docs/LESSON_BATCH_REVIEW_STATUS.json appears without explicit human note-taking.
- Stop if any generated prompt or sample is copied into real notes as evidence.
- Stop if any note or status claims approval, learner-facing readiness, commercial readiness, or production readiness.
- Stop if any note contains buy/sell/hold advice, trading signals, performance claims, broker/order workflow, automation, or real-money guidance.
- Stop if any external source body text is copied into notes or lesson prose.
- Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.

## Boundary

This bundle is a human reviewer execution index only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.
