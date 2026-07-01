# Local Course P0 Real Reviewer Input Starter

- Status: real_reviewer_input_starter_ready_waiting_for_human_fill
- Draft input: `docs/reviewer-inputs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_REAL_INPUT_DRAFT.json`
- Validation: 0 ready / 22 blocked
- Real human input entries: 0
- Write allowed now: false

## Reviewer Steps

- Open the draft input path, not the generated template.
- Fill all 22 entries after inspecting the original preview and high-resolution preview.
- Use reviewerName and reviewedAt on every entry.
- For manual transcription rows, fill humanTranscription, humanSummary, public/source-fit notes, rewrite-boundary/originality notes, and every checklist item.
- For source replacement rows, fill selectedDecision, replacementSourcePath, replacementNote, rerunEvidence, and every checklist item.
- Run validation against the draft path and stop if any entry remains blocked.
- Keep writeAllowedNow:false until separate write authorization is explicit.

## Commands

- `npm.cmd run validate:local-course-p0-human-review-bundle-input-copy -- --input docs/reviewer-inputs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_REAL_INPUT_DRAFT.json --output-json docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER_VALIDATION.json --output-md docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER_VALIDATION.md`
- `npm.cmd run check:local-course-p0-real-reviewer-input-starter`
- `npm.cmd run check:local-course-p0-write-authorization-preview`

## Boundary

P0 real reviewer input starter is reviewer-facing education-only operations scaffolding. It does not create real reviewer judgment, approve learner-facing release, write overlay changes, provide stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.
