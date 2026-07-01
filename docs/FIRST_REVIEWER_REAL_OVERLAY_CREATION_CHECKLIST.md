# First Reviewer Real Overlay Creation Checklist

This checklist defines the safe conditions for creating the real reviewer status overlay.
It does not create the overlay, fill reviewer notes, approve lessons, publish content, or certify production readiness.

## Summary

- Creation allowed now: false
- Real status overlay present: false
- Target path: docs/LESSON_BATCH_REVIEW_STATUS.json
- Target batches: rewrite_batch_01, rewrite_batch_05
- Lesson cards: 12
- Blank note fields: 72
- Dry-run passed: true
- Overwrite protection passed: true
- Real ready batches: 0
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Creation Commands

- Dry run: `npm.cmd run init:first-reviewer-status-overlay:dry-run`
- Allowed creation command after explicit human note-taking decision: `npm.cmd run init:first-reviewer-status-overlay:write`

## Preconditions

- Human reviewer explicitly ready to record real notes: manual_required - No repo artifact can prove this; it must be an explicit human decision before running the write command.
- Dry run passed: pass - Initializer is in dry_run mode, wroteStatusOverlay:false, notesFilled:0.
- Overwrite protection passed: pass - 3/3 protection cases passed and real overlay untouched.
- Starter blank fields ready: pass - 12 lesson cards and 72 blank note fields are present.
- Existing real overlay absent: pass - docs/LESSON_BATCH_REVIEW_STATUS.json does not exist.
- Handoff packet available: pass - Handoff and dry-run packet both include this checklist before real overlay creation; packet covers rewrite_batch_01, rewrite_batch_05 with 12 worksheet lessons.
- No approval, release, or production flags: pass - All checked artifacts keep approvalStatus:not_approved, learnerFacingRelease:false, and productionReady:false.

## Pre-Creation Commands

1. `npm.cmd run init:first-reviewer-status-overlay:dry-run`
2. `npm.cmd run check:first-reviewer-status-init-protection`
3. `npm.cmd run check:first-reviewer-dry-run-packet`
4. `npm.cmd run check:first-reviewer-human-note-starter-template`
5. `npm.cmd run check:first-reviewer-real-overlay-creation-checklist`

## Post-Creation Commands

1. `npm.cmd run check:lesson-batch-completion`
2. `npm.cmd run check:reviewer-note-quality-lint`
3. `npm.cmd run check:curriculum-review`

## Stop Conditions

- Stop if docs/LESSON_BATCH_REVIEW_STATUS.json exists before the creation command; preserve existing notes before any force path.
- Stop if any note field is prefilled before real review work starts.
- Stop if any artifact asks to approve, publish, mark commercial_ready, or set productionReady:true.
- Stop if any note or rewrite requests buy/sell/hold advice, trading signals, broker/order workflow, automation, performance claims, or real-money guidance.
- Stop if any external source body text is proposed for copying into lesson prose or notes.
- Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.

## Boundary

This checklist is reviewer-facing gate scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.
