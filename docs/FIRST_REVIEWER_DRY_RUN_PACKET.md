# First Reviewer Dry-Run Packet

This packet gives a human reviewer a single dry-run operating map for the first two lesson-review batches.
It does not create real reviewer notes, approve lessons, publish learner-facing content, or certify production readiness.

## Summary

- Target batches: rewrite_batch_01, rewrite_batch_05
- Worksheet lessons: 12
- High-risk lessons: 2
- Required files: 44
- Required commands: 46
- Real status overlay present: false
- Real ready batches: 0
- Real note issues: 0
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## File Order

1. `docs/FIRST_REVIEWER_OPERATOR_INDEX.md` - single operator entrypoint across pre-write, post-write, evidence intake, approval, and launch-readiness gates
2. `docs/FIRST_REVIEWER_ONE_PAGE_RUNBOOK.md` - printable one-page operator runbook for the first reviewer, with pre-write gates and hard stops
3. `docs/FIRST_REVIEWER_RUNBOOK_NEGATIVE_CASES.md` - prove the one-page runbook cannot be treated as real notes, approval, release, grade promotion, or readiness evidence
4. `docs/FIRST_REVIEWER_PREWRITE_SAMPLE_DOSSIER.md` - read-only human handoff packet for the first 12 lesson cards, note fields, source decisions, negative cases, and future post-write commands
5. `docs/FIRST_REVIEWER_FILLED_NOTES_POSITIVE_CONTROL_V2.md` - temporary-file positive control proving complete notes can become separate-approval candidates without auto-approval or real overlay writes
6. `docs/FIRST_REVIEWER_POST_WRITE_APPROVAL_DRILL.md` - temporary post-write drill proving approval-review candidates stay blocked from release, grade promotion, launch, and production readiness
7. `docs/FIRST_REVIEWER_DIRECT_CANDIDATE_POST_WRITE_DRILL.md` - temporary direct-candidate drill proving BEA/BLS/CFTC/SEC sourceFitNotes stay boundary-only unless separately human-confirmed
8. `docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_SIMULATOR.md` - temporary full post-write validation simulator chaining completion, intake, separate approval, and release-drift guards without touching the real overlay
9. `docs/FIRST_REVIEWER_SEQUENCE_CONSISTENCY.md` - pre-write order-integrity gate checking first-reviewer execution steps, operator phases, post-write commands, dry-run commands, and cross-links
10. `docs/FIRST_REVIEWER_DAY_OF_REVIEW_PACKET_FREEZE.md` - frozen day-of-review packet with explicit input, output, failure route, and forbidden actions for each first-reviewer step
11. `docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.md` - single-page first reviewer execution index and manual sign-off map
12. `docs/FIRST_REVIEWER_PRINTABLE_CHECKLIST_PACK.md` - printable per-lesson checklist pack with 72 blank note-field boxes
13. `docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.md` - summarize future real reviewer-note completeness, blockers, and separate-approval candidates
14. `docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.md` - keep intake candidates behind a separate manual approval review without auto-approval or release
15. `docs/FIRST_REVIEWER_RELEASE_READINESS_NEGATIVE_CASES.md` - prove approval, release, production, and commercial-ready drift is rejected
16. `docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.md` - roll up reviewer evidence, approval gates, release drift guards, green grounding, and current launch blockers
17. `docs/FIRST_REVIEWER_REHEARSAL_CHECKLIST.md` - rehearse the 12 lesson cards, 72 note fields, and 5 direct-candidate decisions before any real overlay is written
18. `docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.md` - record blank confirm, downgrade, or blocked decision templates for the 5 direct-candidate source roles
19. `docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md` - one-page reviewer summary compressing confirm, downgrade, and block criteria for the 5 direct-candidate source roles
20. `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md` - printable blank sourceFitNotes cards for the 5 direct-candidate source roles, with required fields left empty
21. `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md` - prove simulated card-pack pollution is rejected before any future real sourceFitNotes are written
22. `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md` - sample-only matrix showing acceptable future sourceFitNotes shapes for confirm, downgrade, and block decisions
23. `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md` - manual preflight before any human fills real sourceFitNotes, checking reviewer identity, 5 candidate decisions, source identity basis, and no-copy checks
24. `docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.md` - define acceptance criteria and negative cases for future real sourceFitNotes on direct-candidate rows
25. `docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.md` - summarize the final manual and machine gates before any real status overlay write command
26. `docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.md` - generated write-readiness lock proving real overlay creation remains blocked until explicit human note-taking decision
27. `docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.md` - generated authorization preview separating machine-checked gates from the still-required human write decision
28. `docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.md` - one-page day-zero handoff compressing pre-write checks, human authorization blockers, write-command preview, and future post-write validation order
29. `docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md` - pre-write consistency audit tying dry-run, overwrite protection, day-zero handoff, final rehearsal, authorization preview, and write locks together
30. `docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.md` - define the strict future post-write validation command order and failure routes after a real overlay exists
31. `docs/FIRST_REVIEWER_HANDOFF.md` - one-page reviewer SOP and file/command index
32. `docs/FIRST_REVIEWER_WORKSHEET.md` - review lesson order, high-risk rows, source refs, and safe rewrite directions
33. `docs/FIRST_REVIEWER_NOTES_PROMPT.md` - prepare real reviewer notes without creating them automatically
34. `docs/FIRST_REVIEWER_SOURCE_ROLE_DECISION_TABLE.md` - pre-sort source families into reviewer-confirmed roles before notes are written
35. `docs/FIRST_REVIEWER_DIRECT_CANDIDATE_CONFIRMATION_CHECKLIST.md` - resolve the 5 direct-candidate source roles before filling sourceFitNotes
36. `docs/FIRST_REVIEWER_HUMAN_NOTE_STARTER_TEMPLATE.md` - map role hints into blank required note fields for later human-only note-taking
37. `docs/FIRST_REVIEWER_SAFE_NOTE_EXAMPLES.md` - compare safe sample-only reviewer notes with rejected note categories before real notes are written
38. `docs/FIRST_REVIEWER_HUMAN_REVIEW_START_CHECKLIST.md` - printable final human checklist before creating the real reviewer status overlay
39. `docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.md` - confirm creation preconditions before any real reviewer status overlay is written
40. `docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_PLAYBOOK.md` - define the validation sequence and failure handling after a human-created real overlay exists
41. `docs/FIRST_REVIEWER_REAL_OVERLAY_DIFF_AUDIT.md` - compare any future real overlay with the blank first-reviewer template without creating or overwriting notes
42. `docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json` - blank status overlay draft for later human note-taking only
43. `docs/REVIEWER_NOTE_QUALITY_LINT.md` - quality gate for future filled notes
44. `docs/REVIEW_STATUS_GATE_SUMMARY.md` - summary of dry-run, protection, negative-case, positive-control, and real-status gates

## Command Order

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
11. `npm.cmd run check:first-reviewer-human-execution-bundle`
12. `npm.cmd run check:first-reviewer-printable-checklist-pack`
13. `npm.cmd run check:first-reviewer-evidence-intake-summary`
14. `npm.cmd run check:first-reviewer-separate-approval-review-gate`
15. `npm.cmd run check:first-reviewer-release-readiness-negative-cases`
16. `npm.cmd run check:first-reviewer-launch-readiness-dashboard`
17. `npm.cmd run check:first-reviewer-rehearsal-checklist`
18. `npm.cmd run check:first-reviewer-direct-candidate-decision-worksheet`
19. `npm.cmd run check:first-reviewer-source-fit-decision-summary`
20. `npm.cmd run check:first-reviewer-source-fit-notes-card-pack`
21. `npm.cmd run check:first-reviewer-source-fit-notes-card-negative-cases`
22. `npm.cmd run check:first-reviewer-source-fit-notes-positive-matrix`
23. `npm.cmd run check:first-reviewer-source-fit-notes-human-fill-preflight`
24. `npm.cmd run check:first-reviewer-source-fit-notes-acceptance`
25. `npm.cmd run check:first-reviewer-real-overlay-preflight-summary`
26. `npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock`
27. `npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview`
28. `npm.cmd run check:first-reviewer-day-zero-write-handoff`
29. `npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit`
30. `npm.cmd run check:first-reviewer-post-write-command-pack`
31. `npm.cmd run init:first-reviewer-status-overlay:dry-run`
32. `npm.cmd run check:first-reviewer-status-init-protection`
33. `npm.cmd run check:first-reviewer-worksheet`
34. `npm.cmd run check:first-reviewer-status-draft-template`
35. `npm.cmd run check:first-reviewer-notes-prompt`
36. `npm.cmd run check:first-reviewer-source-role-decision-table`
37. `npm.cmd run check:first-reviewer-direct-candidate-confirmation-checklist`
38. `npm.cmd run check:first-reviewer-human-note-starter-template`
39. `npm.cmd run check:first-reviewer-safe-note-examples`
40. `npm.cmd run check:first-reviewer-human-review-start-checklist`
41. `npm.cmd run check:first-reviewer-real-overlay-creation-checklist`
42. `npm.cmd run check:first-reviewer-post-write-validation-playbook`
43. `npm.cmd run check:first-reviewer-real-overlay-diff-audit`
44. `npm.cmd run check:reviewer-note-quality-lint`
45. `npm.cmd run check:lesson-batch-completion`
46. `npm.cmd run check:curriculum-review`

## Dry-Run Steps

1. Start from the operator index before opening other first-reviewer files.
2. Use the one-page runbook as the printable day-of-review checklist.
3. Keep the runbook negative cases passing before treating the runbook as usable reviewer scaffolding.
4. Use the pre-write sample dossier as a read-only human handoff packet; do not create real notes from it.
5. Use the filled-notes positive control only as temporary-file validation of the post-write evidence chain.
6. Use the post-write approval drill only as temporary-file validation that candidates remain blocked from approval, release, launch, and production readiness.
7. Use the direct-candidate post-write drill only to validate sourceFitNotes decision boundaries for BEA, BLS, CFTC, and SEC candidate rows.
8. Use the post-write validation simulator only to rehearse the full temporary completion, intake, separate approval, and release-drift sequence; it is not real reviewer evidence.
9. Use the sequence consistency gate to confirm first-reviewer file order, execution steps, and command order remain contiguous after new gates are added.
10. Use the day-of-review packet freeze to confirm every first-reviewer step has explicit inputs, outputs, failure routes, and forbidden actions.
11. Open the handoff first, then worksheet, then notes prompt.
12. Review the high-risk lesson in each target batch before medium or low rows.
13. Classify source families as direct evidence, boundary-only metadata, historical-language context, macro/data context, or unsuitable for prose.
14. Use the source-role decision table as a starting point, then record only human-confirmed decisions in real notes.
15. Resolve the direct-candidate confirmation checklist before filling sourceFitNotes for any candidate source.
16. Use the human note starter only as a blank field map; do not treat prompts or hints as filled notes.
17. Read safe note examples as sample-only guidance; do not copy them into real notes without actual review work.
18. Complete the human review start checklist before any explicit write initializer is run.
19. Open the real overlay creation checklist before any write command; creation stays blocked until explicit human note-taking begins.
20. Use the blank status draft only as a later manual-note scaffold; do not treat it as review evidence.
21. Run the lint and completion checks before any batch can move to a separate approval review.
22. Use the launch readiness dashboard as a blocker map only; do not treat it as internal-trial, release, commercial, or production approval.
23. Run the rehearsal checklist before real note-taking to practice the 12 lesson cards, 72 note fields, and 5 direct-candidate decisions without creating evidence.
24. Use the direct-candidate decision worksheet as a blank human decision template; generated output must not confirm direct evidence.
25. Use the source-fit decision summary to compare confirm, downgrade, and block criteria before writing any future sourceFitNotes; generated output must not choose a decision.
26. Use the sourceFitNotes card pack as blank printable cards only; generated output must not fill the decision, source role, claim, rewrite action, source identity, originality check, or reviewer initials.
27. Use the sourceFitNotes card negative cases before real notes; simulated card pollution, unsafe wording, chart-proof misuse, and yellow/red source drift must be rejected.
28. Use the sourceFitNotes positive matrix as sample-only shape guidance for confirm, downgrade, and block notes; do not copy it as real reviewer evidence.
29. Use the sourceFitNotes human-fill preflight before any real sourceFitNotes entry; generated output cannot prove reviewer identity or choose decisions.
30. Use the sourceFitNotes acceptance gate after any future real sourceFitNotes are written; do not treat passing generated controls as real evidence.
31. Use the real overlay preflight summary as the final generated gate before any explicit write command; it must still require a human decision.
32. Use the write readiness lock as the generated hard stop before write mode; it does not replace explicit human note-taking intent.
33. Use the write authorization preview to distinguish machine-checked preconditions from missing human authorization; it still keeps writeAllowedNow:false.
34. Use the day-zero write handoff as a one-page operations route only; it previews write and post-write commands without authorizing or creating the real overlay.
35. Use the dry-run bundle audit to confirm dry-run, overwrite protection, day-zero handoff, final rehearsal, authorization preview, and write locks still agree before any future real overlay write.
36. After a future real overlay exists, use the post-write command pack to run validation in order; current generated state must keep executionAllowedNow:false.

## Stop Conditions

- Stop if any command reports productionReady:true, learnerFacingRelease:true, or approvalStatus other than not_approved.
- Stop if docs/LESSON_BATCH_REVIEW_STATUS.json appears without an explicit human-review note-taking decision.
- Stop if a note asks for buy/sell/hold, signals, broker/order workflow, automation, performance, or real-money guidance.
- Stop if a reviewer wants to copy external source body text into lesson prose.
- Stop if any yellow/red/research-only source is proposed for learner-facing evidence.

## Boundary

This packet is dry-run reviewer scaffolding only. It does not create real reviewer notes, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.
