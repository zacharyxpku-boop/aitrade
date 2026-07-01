# Local Course Absorption P0 Review Input Validation

Dry-run validation report for reviewer-filled P0 input.

- Validation status: blocked_missing_reviewer_input
- Input path: docs\LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_TEMPLATE.json
- Total entries: 3
- Ready entries: 0
- Blocked entries: 3
- Forbidden-hit entries: 0

## First Rows

| Entry | Category | Page | Status | Missing fields | Forbidden hits |
| --- | --- | ---: | --- | --- | --- |
| input_copy_absorb_source_replacement_01 | source_replacement | 1 | blocked_missing_reviewer_input | reviewerName, reviewedAt, replacementSourcePath, replacementNote, rerunEvidence, replacementChecklist |  |
| input_copy_absorb_source_replacement_02 | source_replacement | 1 | blocked_missing_reviewer_input | reviewerName, reviewedAt, replacementSourcePath, replacementNote, rerunEvidence, replacementChecklist |  |
| input_copy_absorb_source_replacement_03 | source_replacement | 1 | blocked_missing_reviewer_input | reviewerName, reviewedAt, replacementSourcePath, replacementNote, rerunEvidence, replacementChecklist |  |

## Next Step

Fill missing reviewer fields in a copied input file, then rerun this dry-run validator.

## Boundary

P0 review input validation is a dry-run gate. It does not write overlay changes, approve learner-facing release, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.
