# Source-Fit Real Reviewer Launch Dashboard

- Status: source_fit_real_reviewer_launch_ready_blocked_on_real_input
- Mode: first_packet_real_reviewer_execution_start
- Packet handoffs: 35/35
- Review rows: ready 0/1638, blocked 1638
- Real human input entries: 0
- Start packet: node-public-source-fit-batch-001-packet
- Start input: docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_001_INPUT_COPY_TEMPLATE.json
- Start packet rows: ready 0/60, blocked 60
- Write allowed now: false

## Day-One Checklist

1. Open the packet 001 input copy template.
2. Review all 60 packet rows against the node and source evidence.
3. Fill only reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt, and realHumanInput.
4. Keep learnerCitationApproved, copiedTextApproved, write flags, learner release flags, and production flags locked false.
5. Run packet input validation and stop until all 60 rows are ready.
6. Run merge preview and confirm 60 mapped rows, 0 missing target rows, and no write.
7. Run dry-run merge apply and confirm writtenRows stays 0 unless a separate exact-path write authorization exists.
8. Rebuild the handoff index and progress matrix after authorized review changes.

## Editable Reviewer Fields

- reviewerDecision: Fill only after personally checking whether the source supports the node. Gate: required_for_ready_row.
- sourceFitNotes: Write a concise reviewer note explaining the decision. Gate: required_for_ready_row.
- citationUse: Describe how the source can be used internally for education planning. Gate: required_for_ready_row.
- reviewerName: Identify the real reviewer who inspected the source. Gate: required_for_ready_row.
- reviewedAt: Use the actual review timestamp. Gate: required_for_ready_row.
- realHumanInput: Set true only for rows personally reviewed by a real human. Gate: never_generated_by_codex.

## Hard Stops

- Stop if the reviewer did not personally inspect the node and source.
- Stop if any row uses generated, copied, fixture, or unreviewed text as realHumanInput.
- Stop if learner-facing citation approval or copied-text approval appears in this launch path.
- Stop if merge preview is not packet 001, not 60 mapped rows, or has any missing target row.
- Stop if dry-run merge apply reports writtenRows above 0 without separate exact-path write authorization.
- Stop if any artifact claims production readiness, live signals, stock recommendations, return promises, broker workflows, automation, or real-money guidance.

## Commands

- `npm.cmd run validate:knowledge-node-public-source-fit-review-packet-input-copy-template`
- `npm.cmd run check:knowledge-node-public-source-fit-review-packet-input-copy-template`
- `npm.cmd run build:knowledge-node-public-source-fit-review-packet-merge-preview`
- `npm.cmd run check:knowledge-node-public-source-fit-review-packet-merge-preview`
- `npm.cmd run apply:knowledge-node-public-source-fit-review-packet-merge`
- `npm.cmd run check:knowledge-node-public-source-fit-review-packet-merge-apply-report`
- `npm.cmd run build:knowledge-node-public-source-fit-review-packet-handoff-index`
- `npm.cmd run check:knowledge-node-public-source-fit-review-packet-handoff-index`

## Boundary

Source-fit real reviewer launch dashboard is reviewer-facing education-only operations material. It starts the first packet's human review loop for all 35 source-fit packet handoffs; it does not generate human decisions, approve copied text, approve learner-facing citations, authorize writes, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.
