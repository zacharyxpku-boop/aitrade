# First Reviewer Post-Write Command Pack

This command pack gives the first reviewer the strict validation order after a human-created real overlay exists.
It is future-only in the current generated state and must not create, overwrite, approve, publish, or promote anything.

## Summary

- Command pack ready: true
- Execution allowed now: false
- Real status overlay present: false
- Post-write steps: 12
- Failure routes: 7
- Complete note cards: 0
- Approval review candidates: 0
- Confirmed direct decisions: 0
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Command Order

| Order | Command | Purpose | Failure route |
| --- | --- | --- | --- |
| 1 | `npm.cmd run check:first-reviewer-real-overlay-preflight-summary` | Confirm write mode was intentionally reached through manual preflight. | Stop if writeAllowedNow is false and no explicit human decision exists. |
| 2 | `npm.cmd run check:first-reviewer-real-overlay-diff-audit` | Inspect real overlay structure, filled fields, unsafe text, and copying-risk wording. | Fix structural or unsafe-note issues before any intake. |
| 3 | `npm.cmd run check:reviewer-note-quality-lint` | Reject blank, generic, approving, readiness, trading, broker, automation, performance, or real-money notes. | Edit real notes; keep batches blocked until lint passes. |
| 4 | `npm.cmd run check:first-reviewer-source-fit-notes-acceptance` | Validate direct-candidate sourceFitNotes contain decision, source role, claim, rewrite action, and no unsafe wording. | Downgrade, block, or rewrite sourceFitNotes before continuing. |
| 5 | `npm.cmd run check:lesson-batch-completion` | Validate batch status shape and required-note completeness. | Keep incomplete batches not_started or in_progress. |
| 6 | `npm.cmd run check:first-reviewer-evidence-intake-summary` | Summarize complete notes, blockers, direct-candidate status, and separate-approval candidates. | Treat intake as triage only, not approval. |
| 7 | `npm.cmd run check:first-reviewer-separate-approval-review-gate` | Keep intake candidates behind a separate human approval review. | Reject auto-approval, learner-facing release, commercial-ready promotion, and production claims. |
| 8 | `npm.cmd run check:first-reviewer-release-readiness-negative-cases` | Prove release/readiness drift remains rejected. | Fix drift before any broader curriculum checks. |
| 9 | `npm.cmd run check:curriculum-review` | Run the full curriculum and reviewer gate chain. | Fix the failing gate without relaxing boundaries. |
| 10 | `npm.cmd run check:knowledge-base` | Recheck knowledge-base, self-audit, and green grounding boundaries. | Do not promote generated drafts or weaken source boundaries. |
| 11 | `npm.cmd run check:knowledge-browser` | Recheck learner-facing browser candidates remain review-tracked and source-grounded. | Block release if learner-facing risk expands. |
| 12 | `temporary SQLite npm.cmd run verify` | Run full repo verification with TRADEGYM_SQLITE_PATH set to a temp file and clean it afterward. | Fix application verification failures before any next review phase. |

## Failure Routes

- Real overlay absent: Do not run post-write pack as evidence; return to preflight and wait for explicit human write decision.
- Missing or blank notes: Keep the lesson blocked and fill notes only after actual human review work.
- Direct candidate unresolved: Use confirm, downgrade, or blocked decision in sourceFitNotes; never infer direct evidence from generated rows.
- Unsafe wording: Remove advice, signals, performance, broker/order, automation, production, release, approval, and real-money wording.
- Copying risk: Remove copied or paste-instructed source text; notes must be original human review prose.
- Approval or readiness drift: Reset the row to not_approved and learnerFacingRelease:false; do not promote grade or production status.
- Verification failure: Fix the failing gate and rerun from the failed command forward, preserving real notes.

## Forbidden Recovery Actions

- Do not delete, overwrite, or force-recreate real reviewer notes to make checks pass.
- Do not copy generated sample notes into the real overlay.
- Do not mark generated lessons commercial_ready.
- Do not set learnerFacingRelease:true, productionReady:true, or approvalStatus other than not_approved.
- Do not relax green/yellow/red or research_only source boundaries.
- Do not add buy/sell/hold advice, trading signals, performance claims, broker/order workflows, automation, or real-money guidance.

## Boundary

This post-write command pack is a future validation order only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, or make the product production-ready.
