# First Reviewer Safe Note Examples

This sample-only table shows the shape of acceptable reviewer notes and the categories of notes that must be rejected.
It does not fill real reviewer notes, approve lessons, publish content, or create a status overlay.

## Summary

- Safe examples: 4
- Rejected example categories: 5
- Covered fields: sourceFitNotes, boundaryCheckNotes
- Real status overlay present: false
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Safe Examples

- safe_source_fit_direct_candidate_downgrade / `sourceFitNotes`
  - Use when: A green official source is relevant to source literacy or risk context but does not directly prove the lesson's chart concept.
  - Sample note: Source fit: classify this source as boundary-only metadata for education context; do not treat it as direct chart evidence, and keep any unsupported claim marked for removal.
- safe_source_fit_confirmed_context / `sourceFitNotes`
  - Use when: A reviewer confirms the source supports data, filing, fraud, or source-boundary literacy without becoming trading evidence.
  - Sample note: Source fit: confirm this source only for official source-boundary context; it may support metadata literacy, while unsuitable chart or signal claims remain excluded.
- safe_boundary_check / `boundaryCheckNotes`
  - Use when: A reviewer finishes safety-boundary review for a lesson card.
  - Sample note: Education-only boundary checked: non-production, no advice, no signal, no performance claim, no broker workflow, no automation, and no real-money guidance.
- safe_boundary_check_after_rewrite / `boundaryCheckNotes`
  - Use when: A reviewer checks rewritten prose before any separate approval review.
  - Sample note: Boundary after rewrite: keep the lesson as observation practice only; no advice, no signal, no performance wording, no broker/order flow, and no real-money instruction.

## Rejected Example Categories

- approval_or_release_claim: Any note claiming final approval, learner-facing release, commercial readiness, or production readiness is not a reviewer note.
- trading_action_or_signal: Any note that names tactical actions, signals, entries, exits, or position instructions violates the education-only boundary.
- performance_or_real_money_claim: Any note implying returns, win rates, backtest profit, or real-money readiness is rejected.
- copied_source_body: Any note that copies external source body text instead of summarizing reviewer decisions is rejected.
- generic_placeholder: One-word notes, placeholders, or generated-example initials do not prove real human review work.

## Stop Conditions

- Stop if a sample note is copied into the real status overlay without actual human review.
- Stop if any example is treated as approval, learner-facing release, commercial readiness, or production readiness.
- Stop if any note contains tactical trading actions, signals, broker/order workflow, automation, performance claims, or real-money guidance.
- Stop if any note copies external source body text.
- Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.

## Boundary

This table is sample-only reviewer guidance. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.
