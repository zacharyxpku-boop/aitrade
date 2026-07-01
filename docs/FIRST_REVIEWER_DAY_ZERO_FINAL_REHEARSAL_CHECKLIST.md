# First Reviewer Day-Zero Final Rehearsal Checklist

This is the final rehearsal checklist before any future human-created review overlay for rewrite_batch_01 and rewrite_batch_05.
It is checklist scaffolding only: it does not authorize write mode, create real notes, approve lessons, or make learner-facing claims.

## Summary

- Checklist ready: true
- Checklist mode: day_zero_final_rehearsal_pre_write_only
- Target batches: rewrite_batch_01, rewrite_batch_05
- Lesson cards: 12
- Blank note fields: 72
- Direct candidate decisions: 5
- Confirmed decisions: 0
- Real status overlay present: false
- Write allowed now: false
- Manual decision required: true
- Human authorization recorded: false
- Approval review candidates: 0
- Internal trial ready: false
- Launch ready: false
- educationOnly: true
- productionReady: false

## Checklist

| Order | Item | Status | Evidence | Human box | Hard stop |
| --- | --- | --- | --- | --- | --- |
| 1 | Broad operator index opened | machine_ready_human_must_read | 48-lesson index ready; writeAllowedNow:false. | Human has opened broad index. | Stop if broad index implies approval, release, launch, or production readiness. |
| 2 | First-reviewer scope accepted | manual_required | targetBatches: rewrite_batch_01, rewrite_batch_05. | Human accepts scope exactly. | Stop if scope expands to all 48 lessons for write mode. |
| 3 | Direct candidates rehearsed | manual_required | 5 blank decisions, 8 green refs, 0 confirmed decisions. | Human can explain confirm/downgrade/block criteria. | Stop if generated output confirms any direct source role. |
| 3.5 | Source-fit summary read | manual_required | One-page summary covers 5 decision rows and keeps writeAllowedNow:false. | Human reads summary before future sourceFitNotes. | Stop if the summary is treated as a decision or write authorization. |
| 4 | Blank notes confirmed | machine_checked_blank | 12 lesson cards, 72 note fields rehearsed, 0 complete note cards. | Human confirms real notes will start blank. | Stop if generated prompts or examples are copied as notes. |
| 5 | Write lock understood | write_blocked_manual_required | writeAllowedNow:false; manualDecisionRequired:true. | Human understands generated checks do not authorize write mode. | Stop if any script grants write permission automatically. |
| 6 | Authorization blockers visible | manual_required | Reviewer identity and direct-candidate decisions remain blockers. | Human can name reviewer and unresolved candidate process. | Stop if no real human reviewer is identified. |
| 7 | Post-write validation rehearsed | future_only | 12 future post-write commands; executionAllowedNow:false. | Human understands post-write order and failure routes. | Stop if post-write pack is run as evidence before overlay exists. |
| 8 | Launch/readiness blocked | not_ready | internalTrialReady:false; launchReady:false; productionReady:false. | Human confirms no readiness claim follows rehearsal. | Stop if any readiness flag or learner-facing release is asserted. |

## Command Order

1. `npm.cmd run check:lesson-batch-review-operator-index`
2. `npm.cmd run check:first-reviewer-operator-index`
3. `npm.cmd run check:first-reviewer-rehearsal-checklist`
4. `npm.cmd run check:first-reviewer-direct-candidate-decision-worksheet`
5. `npm.cmd run check:first-reviewer-source-fit-decision-summary`
6. `npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock`
7. `npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview`
8. `npm.cmd run check:first-reviewer-day-zero-write-handoff`
9. `npm.cmd run check:first-reviewer-day-zero-final-rehearsal-checklist`
10. `npm.cmd run init:first-reviewer-status-overlay:dry-run`
11. `npm.cmd run check:first-reviewer-status-init-protection`

## Forbidden Actions

- Do not run write mode from this final rehearsal checklist alone.
- Do not create or overwrite docs/LESSON_BATCH_REVIEW_STATUS.json without explicit human note-taking intent.
- Do not copy generated checklist, prompt, sample, drill, or packet wording into real reviewer notes.
- Do not confirm direct-candidate sources without original human sourceFitNotes.
- Do not approve lessons, publish learner-facing content, promote generated drafts to commercial_ready, mark internalTrialReady, mark launchReady, or set productionReady true.
- Do not add buy/sell/hold advice, trading signals, performance claims, broker/order workflow, automation, copied source prose, or real-money guidance.
- Do not use yellow, red, or research_only sources as learner-facing evidence.

## Boundary

This day-zero final rehearsal checklist is reviewer-facing operations scaffolding only. It does not authorize write mode, create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, promote grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, launch the course, or make the product production-ready.
