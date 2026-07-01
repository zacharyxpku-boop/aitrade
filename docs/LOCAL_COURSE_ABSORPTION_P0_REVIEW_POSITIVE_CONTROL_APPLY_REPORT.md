# Local Course Absorption P0 Review Apply Report

Guarded apply report for reviewer-filled P0 input.

- Apply mode: dry_run
- Apply status: ready_entries_not_written
- Total entries: 22
- Ready to apply entries: 1
- Blocked entries: 21
- Written entries: 0

## First Rows

| Entry | Category | Page | Apply status | Will write | Missing fields |
| --- | --- | ---: | --- | --- | --- |
| input_absorb_manual_transcription_01 | manual_transcription | 1 | ready_to_apply | false |  |
| input_absorb_manual_transcription_02 | manual_transcription | 2 | blocked_not_ready | false | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |
| input_absorb_manual_transcription_03 | manual_transcription | 3 | blocked_not_ready | false | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |
| input_absorb_manual_transcription_04 | manual_transcription | 4 | blocked_not_ready | false | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |
| input_absorb_manual_transcription_05 | manual_transcription | 5 | blocked_not_ready | false | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |
| input_absorb_manual_transcription_06 | manual_transcription | 6 | blocked_not_ready | false | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |
| input_absorb_manual_transcription_07 | manual_transcription | 7 | blocked_not_ready | false | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |
| input_absorb_manual_transcription_08 | manual_transcription | 8 | blocked_not_ready | false | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |
| input_absorb_manual_transcription_09 | manual_transcription | 1 | blocked_not_ready | false | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |
| input_absorb_manual_transcription_10 | manual_transcription | 2 | blocked_not_ready | false | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |
| input_absorb_manual_transcription_11 | manual_transcription | 3 | blocked_not_ready | false | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |
| input_absorb_manual_transcription_12 | manual_transcription | 4 | blocked_not_ready | false | reviewerName, reviewedAt, humanTranscription, humanSummary, manualChecklist |

## Next Step

Rerun with --write only after confirming the dry-run report.

## Boundary

P0 review input apply is a guarded overlay update pipeline. Dry-run mode writes no overlay changes. It does not approve learner-facing release, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.
