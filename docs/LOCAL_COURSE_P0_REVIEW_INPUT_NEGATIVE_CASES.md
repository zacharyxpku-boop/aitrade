# Local Course P0 Review Input Negative Cases

Fixture-only negative cases for P0 reviewer input and write gates.

- Report status: p0_review_input_negative_cases_ready
- Negative cases: 5
- Manual bad lint: blocked_quality_lint
- Manual candidate-copy issue entries: 4
- Manual forbidden-hit entries: 4
- Source bad lint: blocked_quality_lint
- Direct-candidate misuse entries: 3
- Write allowed now: false
- Fixture written entries: 0

## Cases

| Case | Category | Expected | Observed | Evidence |
| --- | --- | --- | --- | --- |
| blank_inputs_blocked | blank_input | blocked | blocked | operator blank ready 0, blocked 22 |
| fixture_ready_entries_not_authorizable | fixture_write | blocked | blocked | writeAllowedNow:false; fixture ready 22; written 0 |
| manual_candidate_copy_and_forbidden_claims | manual_transcription | blocked_quality_lint | blocked_quality_lint | candidateCopyIssueEntries:4; forbiddenHitEntries:4 |
| source_neighbor_candidate_misuse | source_replacement | blocked_quality_lint | blocked_quality_lint | directCandidateMisuseEntries:3; invalidDecisionEntries:0 |
| overlay_must_remain_untouched | overlay | blocked_before_write | p0_review_not_started | overlay ready 0; accepted 0 |

## Completion Rule

These negative cases prove bad reviewer input is blocked before overlay writes. They are not review approvals, not real reviewer notes, not course absorption, and not learner-facing release.

## Boundary

P0 review input negative cases are fixture-only reviewer-operations tests. They do not write overlay changes, approve learner-facing release, infer missing private course content, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.
