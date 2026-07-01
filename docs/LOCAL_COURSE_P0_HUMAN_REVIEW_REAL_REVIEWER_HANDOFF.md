# Local Course P0 Real Reviewer Handoff

- Status: p0_real_reviewer_handoff_ready_write_blocked
- Mode: unified_22_entry_real_reviewer_fill_only
- Total entries: 22
- Manual transcription entries: 19
- Source replacement entries: 3
- Blank input: 0 ready / 22 blocked
- Positive fixture: 22 ready / 0 blocked / fixtureOnly:true
- Real human input entries: 0
- Write allowed now: false

## Files

| File | Use | Current state |
| --- | --- | --- |
| docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_TEMPLATE.json | copy this file before a real reviewer fills 22 P0 entries | 22 entries; filled 0; validation blocked 22 |
| docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_VALIDATION.json | prove the unfilled template is blocked | 0 ready / 22 blocked |
| docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_POSITIVE_FIXTURE.json | prove validator mechanics only; never use as real review evidence | 22 fixture entries; fixtureOnly:true |
| docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_POSITIVE_FIXTURE_VALIDATION.json | prove the validator can pass 22 filled fixture entries | 22 ready / 0 blocked |
| docs/LOCAL_COURSE_P0_WRITE_AUTHORIZATION_PREVIEW.json | confirm this handoff still does not authorize overlay writes | writeAllowedNow:false; manualAuthorizationRequired:true |

## Commands

| Order | Command | Expected state | Hard stop |
| ---: | --- | --- | --- |
| 1 | `npm.cmd run check:local-course-p0-human-review-bundle` | 22 review entries covered; writeAllowedNow:false | Stop if totalReviewEntries is not 22 or approval/release becomes true. |
| 2 | `npm.cmd run check:local-course-p0-human-review-bundle-input-copy-template` | blank unified input remains 0 ready / 22 blocked | Stop if the blank input validates as ready. |
| 3 | `npm.cmd run check:local-course-p0-human-review-bundle-positive-fixture` | fixture-only positive path remains 22 ready / 0 blocked | Stop if the fixture is treated as real reviewer input or approval. |
| 4 | `copy docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_TEMPLATE.json to a reviewer-owned filled input path` | new copied file exists outside the generated template | Do not edit generated template in place. |
| 5 | `npm.cmd run validate:local-course-p0-human-review-bundle-input-copy -- --input <reviewer-filled-copy>.json --output-json <reviewer-validation>.json --output-md <reviewer-validation>.md` | only real reviewer-filled entries may become ready_for_overlay_apply | Stop if reviewer identity, reviewedAt, transcription/decision notes, or checklists are missing. |
| 6 | `npm.cmd run check:local-course-p0-write-authorization-preview` | writeAllowedNow:false until explicit manual authorization and post-validation gates | Stop if preview is interpreted as write authorization. |

## Reviewer Rules

- Use the unified input template copy, not the generated template in place.
- Fill all 22 entries with real reviewerName and reviewedAt values.
- Manual transcription entries require humanTranscription, humanSummary, public/source-fit notes, rewrite-boundary notes, and completed checklist.
- Source replacement entries require selected decision, replacement path or unrecoverable marker, replacement note, rerun evidence, and completed checklist.
- Do not paste private-course prose into learner-facing text.
- Do not add stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.
- Do not treat fixture-only positive controls as real review evidence.
- Do not write overlay changes until separate write authorization is explicit and machine gates pass.

## Boundary

P0 real reviewer handoff is reviewer-facing operations scaffolding only. It does not perform OCR, replace real reviewer judgment, approve learner-facing release, write overlay changes, provide stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.
