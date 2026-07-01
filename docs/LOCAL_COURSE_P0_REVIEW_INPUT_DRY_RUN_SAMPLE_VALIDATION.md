# Local Course Absorption P0 Review Input Validation

Dry-run validation report for reviewer-filled P0 input.

- Validation status: blocked_missing_reviewer_input
- Input path: docs\LOCAL_COURSE_P0_REVIEW_INPUT_DRY_RUN_SAMPLE.json
- Total entries: 22
- Ready entries: 2
- Blocked entries: 20
- Forbidden-hit entries: 0

## First Rows

| Entry | Category | Page | Status | Missing fields | Forbidden hits |
| --- | --- | ---: | --- | --- | --- |
| input_absorb_manual_transcription_01 | manual_transcription | 1 | ready_for_overlay_apply |  |  |
| input_absorb_manual_transcription_02 | manual_transcription | 2 | ready_for_overlay_apply |  |  |
| input_absorb_manual_transcription_03 | manual_transcription | 3 | blocked_missing_reviewer_input | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |  |
| input_absorb_manual_transcription_04 | manual_transcription | 4 | blocked_missing_reviewer_input | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |  |
| input_absorb_manual_transcription_05 | manual_transcription | 5 | blocked_missing_reviewer_input | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |  |
| input_absorb_manual_transcription_06 | manual_transcription | 6 | blocked_missing_reviewer_input | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |  |
| input_absorb_manual_transcription_07 | manual_transcription | 7 | blocked_missing_reviewer_input | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |  |
| input_absorb_manual_transcription_08 | manual_transcription | 8 | blocked_missing_reviewer_input | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |  |
| input_absorb_manual_transcription_09 | manual_transcription | 1 | blocked_missing_reviewer_input | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |  |
| input_absorb_manual_transcription_10 | manual_transcription | 2 | blocked_missing_reviewer_input | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |  |
| input_absorb_manual_transcription_11 | manual_transcription | 3 | blocked_missing_reviewer_input | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |  |
| input_absorb_manual_transcription_12 | manual_transcription | 4 | blocked_missing_reviewer_input | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |  |

## Next Step

Fill missing reviewer fields in a copied input file, then rerun this dry-run validator.

## Boundary

P0 review input validation is a dry-run gate. It does not write overlay changes, approve learner-facing release, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.
