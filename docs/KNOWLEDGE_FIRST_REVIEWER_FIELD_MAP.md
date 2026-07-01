# Knowledge First Reviewer Field Map

- Field map status: first_reviewer_field_map_ready_blocked_on_real_input
- Handoff actions mapped: 20/20
- High-risk reviewer note fields: 72
- Direct-source decision fields: 5
- Source-fit review rows: 180
- Blocked work items: 257
- Real human input entries: 0
- Write allowed now: false

## Field Rows

| Handoff | Queue | Type | Module | Target | JSON path | Fields | Input |
| ---: | ---: | --- | --- | --- | --- | ---: | --- |
| 1 | 1 | high_risk_lesson_reviewer_notes | 突破 | local_course_rewrite_batch_04_10 | lessonRows[0] | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 2 | 2 | high_risk_lesson_reviewer_notes | 突破 | local_course_rewrite_batch_05_10 | lessonRows[1] | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 3 | 3 | high_risk_lesson_reviewer_notes | 市场结构 | local_course_rewrite_batch_01_03 | lessonRows[2] | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 4 | 4 | high_risk_lesson_reviewer_notes | 市场结构 | local_course_rewrite_batch_01_04 | lessonRows[3] | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 5 | 5 | high_risk_lesson_reviewer_notes | 趋势 | local_course_rewrite_batch_01_07 | lessonRows[4] | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 6 | 6 | high_risk_lesson_reviewer_notes | 趋势 | local_course_rewrite_batch_01_08 | lessonRows[5] | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 7 | 7 | high_risk_lesson_reviewer_notes | 突破 | local_course_rewrite_batch_01_09 | lessonRows[6] | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 8 | 8 | high_risk_lesson_reviewer_notes | 突破 | local_course_rewrite_batch_01_10 | lessonRows[7] | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 9 | 9 | high_risk_lesson_reviewer_notes | 反转 | local_course_rewrite_batch_01_13 | lessonRows[8] | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 10 | 10 | high_risk_lesson_reviewer_notes | 反转 | local_course_rewrite_batch_01_14 | lessonRows[9] | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 11 | 11 | high_risk_lesson_reviewer_notes | 市场结构 | local_course_rewrite_batch_02_03 | lessonRows[10] | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 12 | 12 | high_risk_lesson_reviewer_notes | 市场结构 | local_course_rewrite_batch_02_04 | lessonRows[11] | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 13 | 13 | direct_source_candidate_decision | 突破 | direct_source_candidate_resolution_01 | directSourceDecisionRows[0] | 1 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 14 | 14 | direct_source_candidate_decision | 突破 | direct_source_candidate_resolution_02 | directSourceDecisionRows[1] | 1 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 15 | 15 | direct_source_candidate_decision | 市场结构 | direct_source_candidate_resolution_03 | directSourceDecisionRows[2] | 1 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 16 | 16 | direct_source_candidate_decision | 市场结构 | direct_source_candidate_resolution_04 | directSourceDecisionRows[3] | 1 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 17 | 17 | direct_source_candidate_decision | 趋势 | direct_source_candidate_resolution_05 | directSourceDecisionRows[4] | 1 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json |
| 18 | 18 | source_fit_packet_rows | K线与价格行为 | node-public-source-fit-batch-001 | reviewRows[*] | 60 | docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_001_INPUT_COPY_TEMPLATE.json |
| 19 | 19 | source_fit_packet_rows | K线与价格行为 | node-public-source-fit-batch-002 | reviewRows[*] | 60 | docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE.json |
| 20 | 20 | source_fit_packet_rows | K线与价格行为 | node-public-source-fit-batch-003 | reviewRows[*] | 60 | docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_003_INPUT_COPY_TEMPLATE.json |

## Reviewer Checklist

- Open the mapped draftPath before editing; use jsonPath to find the exact field group.
- For high-risk lesson rows, fill all six notePaths and keep every readyForApprovalGate value false until separate approval.
- For direct-source rows, decide private/direct-source handling without approving learner citations.
- For source-fit packet rows, use the packet input copy template and do not edit generated packet source files.
- Every reviewer note must preserve no setup, no signal, no future outcome, no strategy edge, and no real-money action boundaries.
- Do not copy Codex self-review text, private PDF prose, Wikipedia prose, or public source prose into the real reviewer note.

## Completion Rule

This field map is complete when the first 20 handoff actions are mapped to concrete human-owned input fields: 72 high-risk reviewer note fields, 5 direct-source decision fields, and 180 source-fit packet rows. It does not fill, generate, approve, or write real reviewer input.

## Boundary

Knowledge first reviewer field map is reviewer-facing education-only operations material. It maps absorbed local course evidence, public/Wikipedia/official context, high-risk lesson note slots, direct-source decision rows, and source-fit packet review rows to human-owned input fields; it does not generate reviewer notes, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.
