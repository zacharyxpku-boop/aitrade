# First Reviewer Human Review Start Checklist

This is the final printable checklist before a human reviewer creates the real reviewer status overlay.
It does not create the overlay, fill notes, approve lessons, publish content, or change grades.

## Summary

- Start allowed now: false
- Real status overlay present: false
- Target batches: rewrite_batch_01, rewrite_batch_05
- Lesson cards: 12
- Blank note fields: 72
- Direct candidates to resolve: 5
- Manual checklist items: 7
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Manual Checklist

- [ ] A human reviewer is identified and ready to record real notes. Evidence: No generated artifact can prove this. Action: Write reviewer identity outside this generated checklist before creating the overlay.
- [ ] The reviewer confirms the scope is only rewrite_batch_01 and rewrite_batch_05. Evidence: rewrite_batch_01, rewrite_batch_05 are the current target batches. Action: Do not expand scope during first real note-taking.
- [ ] The reviewer has read the 5 direct-candidate source rows and will confirm or downgrade them before sourceFitNotes. Evidence: 5 candidates and 8 source refs are queued. Action: Resolve source roles before filling sourceFitNotes.
- [ ] The reviewer confirms all 72 required note fields start blank. Evidence: 72 blank fields and 0 prefilled fields. Action: Do not paste generated examples into real notes.
- [ ] The reviewer understands safe examples are sample-only guidance. Evidence: 4 safe examples and 5 rejected categories are available. Action: Use examples as style guidance only, not as real review evidence.
- [ ] The reviewer accepts education-only and non-production boundaries. Evidence: All checked artifacts keep approvalStatus:not_approved, learnerFacingRelease:false, and productionReady:false. Action: Stop if any note suggests advice, signal, performance, broker/order, automation, or real-money guidance.
- [ ] The reviewer intentionally chooses whether to run the write initializer. Evidence: Preview command is npm.cmd run init:first-reviewer-status-overlay:dry-run; write command is npm.cmd run init:first-reviewer-status-overlay:write. Action: Run write mode only after all manual boxes are checked.

## Commands

- Preview only: `npm.cmd run init:first-reviewer-status-overlay:dry-run`
- Write only after all boxes above are manually checked: `npm.cmd run init:first-reviewer-status-overlay:write`
- Post-write validation: `npm.cmd run check:lesson-batch-completion && npm.cmd run check:reviewer-note-quality-lint && npm.cmd run check:curriculum-review`

## Stop Conditions

- Stop if docs/LESSON_BATCH_REVIEW_STATUS.json already exists; preserve existing notes before any force path.
- Stop if a human reviewer is not explicitly ready to record real notes.
- Stop if direct candidates have not been reviewed for confirm-or-downgrade source fit.
- Stop if any generated sample note is copied into the real overlay as evidence.
- Stop if any note proposes advice, signals, broker/order workflow, automation, performance, or real-money guidance.
- Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.

## Boundary

This checklist is a manual pre-start gate only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.
