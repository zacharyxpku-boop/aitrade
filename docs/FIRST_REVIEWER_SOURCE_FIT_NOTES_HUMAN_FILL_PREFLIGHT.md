# First Reviewer SourceFitNotes Human-Fill Preflight

This preflight lists the manual requirements before a human fills real `sourceFitNotes` for the 5 direct candidates.
It does not create the real overlay, fill notes, choose decisions, confirm sources, approve lessons, or publish learner-facing content.

## Summary

- Preflight ready: true
- Human fill allowed now: false
- Start allowed now: false
- Write allowed now: false
- Direct candidates: 5
- Source refs to inspect: 8
- Required fields per candidate: 7
- Positive samples: 3/3
- Negative cases: 15/15
- Real status overlay present: false
- Confirmed decisions: 0
- Approval review candidates: 0
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Candidate Preflight Rows

| Lesson | Family | Refs | Required fields | Current status |
| --- | --- | ---: | ---: | --- |
| lesson_knv2_0068 | CFTC | 4 | 7 | blocked_until_human_fills_sourceFitNotes |
| lesson_knv2_0087 | BEA | 1 | 7 | blocked_until_human_fills_sourceFitNotes |
| lesson_knv2_0087 | BLS | 1 | 7 | blocked_until_human_fills_sourceFitNotes |
| lesson_knv2_0087 | CFTC | 1 | 7 | blocked_until_human_fills_sourceFitNotes |
| lesson_knv2_0087 | SEC | 1 | 7 | blocked_until_human_fills_sourceFitNotes |

## Manual Requirements

- [ ] Name the human reviewer outside generated scaffolding.
- [ ] Confirm the scope is rewrite_batch_01 and rewrite_batch_05 only.
- [ ] For each of the 5 direct candidates, choose exactly one allowed decision value.
- [ ] For each candidate, record source role, claim supported or narrowed, rewrite action, source identity basis, no-copy originality check, and reviewer initials.
- [ ] Keep every lesson structural_draft until separate human approval review is complete.
- [ ] Do not copy sample notes, source body text, or external page prose into the real overlay.

## Stop Conditions

- Stop if a reviewer identity is missing.
- Stop if any direct candidate has no explicit confirm/downgrade/block decision.
- Stop if source identity basis or no-copy originality check is missing.
- Stop if a macro, filing, oversight, or fraud source is used as chart-pattern proof.
- Stop if any note contains advice, signals, performance, broker/order, automation, production, launch, commercial-ready, or real-money wording.
- Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.

## Boundary

This human-fill preflight is reviewer-facing scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill notes, choose decisions, confirm source use, approve lessons, publish learner-facing content, promote grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or make the product production-ready.
