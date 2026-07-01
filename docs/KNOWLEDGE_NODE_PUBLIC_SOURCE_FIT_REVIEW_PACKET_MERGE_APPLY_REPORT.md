# Knowledge Node Public Source-Fit Review Packet Merge Apply Report

- Apply mode: dry_run
- Apply status: blocked_no_ready_merge_rows
- Packet: node-public-source-fit-batch-001-packet
- Total rows: 60
- Ready to merge rows: 0
- Blocked rows: 60
- Written rows: 0
- Merge allowed now: false
- Write allowed now: false

## First Rows

| Review ID | Packet row | Full draft row | Apply status | Will write | Missing fields |
| --- | ---: | ---: | --- | --- | --- |
| knv2_0003::corpus_1584 | 0 | 0 | blocked_not_ready | false | reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt |
| knv2_0003::corpus_0301 | 1 | 1 | blocked_not_ready | false | reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt |
| knv2_0003::corpus_0406 | 2 | 2 | blocked_not_ready | false | reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt |
| knv2_0003::corpus_0409 | 3 | 3 | blocked_not_ready | false | reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt |
| knv2_0003::corpus_0407 | 4 | 4 | blocked_not_ready | false | reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt |
| knv2_0003::corpus_1115 | 5 | 5 | blocked_not_ready | false | reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt |
| knv2_0015::corpus_1584 | 6 | 6 | blocked_not_ready | false | reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt |
| knv2_0015::corpus_0301 | 7 | 7 | blocked_not_ready | false | reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt |
| knv2_0015::corpus_0406 | 8 | 8 | blocked_not_ready | false | reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt |
| knv2_0015::corpus_0409 | 9 | 9 | blocked_not_ready | false | reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt |
| knv2_0015::corpus_0407 | 10 | 10 | blocked_not_ready | false | reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt |
| knv2_0015::corpus_1115 | 11 | 11 | blocked_not_ready | false | reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt |

## Next Step

Fill packet input copy with real reviewer decisions, validate the packet input, rebuild merge preview, then rerun this dry-run.

## Boundary

Packet merge apply is a guarded reviewer-input merge pipeline. Dry-run mode writes no full draft changes. It does not create human judgments, approve copied text, approve learner-facing citations, write lessons, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.
