# First Reviewer Day-Zero Write Handoff

This handoff compresses the first-reviewer day-zero write route into one page.
It is not write authorization and does not create the real reviewer status overlay.

## Summary

- Handoff ready: true
- Handoff mode: day_zero_pre_write_handoff_only
- Real status overlay present: false
- Write allowed now: false
- Manual decision required: true
- Human authorization recorded: false
- Target batches: rewrite_batch_01, rewrite_batch_05
- Pre-write commands: 8
- Future post-write commands: 12
- Authorization blockers: 2
- Complete note cards: 0
- Approval review candidates: 0
- Confirmed decisions: 0
- Internal trial ready: false
- Launch ready: false
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Day-Zero Pre-Write Route

| Order | Phase | Command | Expected state | Hard stop |
| --- | --- | --- | --- | --- |
| 1 | Open operator index | `npm.cmd run check:first-reviewer-operator-index` | single_entrypoint_pre_write_only | Stop if index grants write permission, approval, release, launch, or production readiness. |
| 2 | Confirm frozen packet | `npm.cmd run check:first-reviewer-day-of-review-packet-freeze` | freezeReady:true; frozenSteps:40 | Stop if any step lacks input, expected output, failure route, or forbidden actions. |
| 3 | Run write readiness lock | `npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock` | writeAllowedNow:false; manualDecisionRequired:true | Stop if generated checks grant write permission. |
| 4 | Run authorization preview | `npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview` | humanAuthorizationRecorded:false; writeAllowedNow:false | Stop if preview is treated as human authorization. |
| 5 | Run initializer dry-run | `npm.cmd run init:first-reviewer-status-overlay:dry-run` | mode:dry_run; wroteStatusOverlay:false; notesFilled:0 | Stop if dry-run creates or fills the real overlay. |
| 6 | Run overwrite protection | `npm.cmd run check:first-reviewer-status-init-protection` | 3/3 protection cases passing | Stop if overwrite protection touches the real overlay or fails sentinel preservation. |
| 7 | Human-only write decision | `manual human action only` | reviewer named; scope accepted; direct candidates understood; note fields blank | Stop if no human reviewer explicitly chooses to begin real note-taking. |
| 8 | Write command preview | `npm.cmd run init:first-reviewer-status-overlay:write` | shown for later human use only; not authorized by this handoff | Stop unless the human-only write decision has actually happened. |

## Authorization Blockers

- Reviewer identity: A real human reviewer must be named before write mode.
- Direct candidates: Human must confirm, downgrade, or block each direct candidate in sourceFitNotes.

## Future Post-Write Route

1. `npm.cmd run check:first-reviewer-real-overlay-preflight-summary` - Confirm write mode was intentionally reached through manual preflight.
2. `npm.cmd run check:first-reviewer-real-overlay-diff-audit` - Inspect real overlay structure, filled fields, unsafe text, and copying-risk wording.
3. `npm.cmd run check:reviewer-note-quality-lint` - Reject blank, generic, approving, readiness, trading, broker, automation, performance, or real-money notes.
4. `npm.cmd run check:first-reviewer-source-fit-notes-acceptance` - Validate direct-candidate sourceFitNotes contain decision, source role, claim, rewrite action, and no unsafe wording.
5. `npm.cmd run check:lesson-batch-completion` - Validate batch status shape and required-note completeness.
6. `npm.cmd run check:first-reviewer-evidence-intake-summary` - Summarize complete notes, blockers, direct-candidate status, and separate-approval candidates.
7. `npm.cmd run check:first-reviewer-separate-approval-review-gate` - Keep intake candidates behind a separate human approval review.
8. `npm.cmd run check:first-reviewer-release-readiness-negative-cases` - Prove release/readiness drift remains rejected.
9. `npm.cmd run check:curriculum-review` - Run the full curriculum and reviewer gate chain.
10. `npm.cmd run check:knowledge-base` - Recheck knowledge-base, self-audit, and green grounding boundaries.
11. `npm.cmd run check:knowledge-browser` - Recheck learner-facing browser candidates remain review-tracked and source-grounded.
12. `temporary SQLite npm.cmd run verify` - Run full repo verification with TRADEGYM_SQLITE_PATH set to a temp file and clean it afterward.

## Forbidden Actions

- Do not run write mode from this handoff alone.
- Do not create or overwrite docs/LESSON_BATCH_REVIEW_STATUS.json without explicit human note-taking intent.
- Do not treat generated prompts, examples, drills, checklists, freeze packets, authorization previews, or this handoff as real reviewer notes.
- Do not confirm direct-candidate sources without human sourceFitNotes.
- Do not approve lessons, publish learner-facing content, promote generated drafts to commercial_ready, mark internalTrialReady, mark launchReady, or set productionReady true.
- Do not add buy/sell/hold advice, trading signals, performance claims, broker/order workflow, automation, copied source prose, or real-money guidance.
- Do not use yellow, red, or research_only sources as learner-facing evidence.

## Boundary

This day-zero write handoff is generated reviewer-facing operations scaffolding only. It does not authorize write mode, create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, promote grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, launch the course, or make the product production-ready.
