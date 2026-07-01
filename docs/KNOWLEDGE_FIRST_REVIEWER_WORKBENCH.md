# Knowledge First Reviewer Workbench

- Workbench status: first_reviewer_workbench_ready_blocked_on_real_input
- Action cards: 20
- Ready work items: 0/257
- Blocked work items: 257
- High-risk reviewer notes: 0/72
- Direct-source decisions: 0/5
- Source-fit rows: 0/180
- Real human input entries: 0
- Write allowed now: false

## Phase Rows

| Phase | Actions | Required | Ready | Blocked | Next gate |
| --- | ---: | ---: | ---: | ---: | --- |
| phase_1_fill_high_risk_reviewer_notes | 12 | 72 | 0 | 72 | high_risk_reviewer_notes |
| phase_2_resolve_direct_source_candidates | 5 | 5 | 0 | 5 | direct_source_decisions |
| phase_3_fill_source_fit_packet_rows | 3 | 180 | 0 | 180 | source_fit_packets_001_003 |

## Action Cards

| Card | Phase | Type | Module | Target | Fields | Input | JSON path | Gate |
| ---: | --- | --- | --- | --- | ---: | --- | --- | --- |
| 1 | phase_1_fill_high_risk_reviewer_notes | high_risk_lesson_reviewer_notes | 突破 | local_course_rewrite_batch_04_10 | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | lessonRows[0] | high_risk_reviewer_notes |
| 2 | phase_1_fill_high_risk_reviewer_notes | high_risk_lesson_reviewer_notes | 突破 | local_course_rewrite_batch_05_10 | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | lessonRows[1] | high_risk_reviewer_notes |
| 3 | phase_1_fill_high_risk_reviewer_notes | high_risk_lesson_reviewer_notes | 市场结构 | local_course_rewrite_batch_01_03 | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | lessonRows[2] | high_risk_reviewer_notes |
| 4 | phase_1_fill_high_risk_reviewer_notes | high_risk_lesson_reviewer_notes | 市场结构 | local_course_rewrite_batch_01_04 | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | lessonRows[3] | high_risk_reviewer_notes |
| 5 | phase_1_fill_high_risk_reviewer_notes | high_risk_lesson_reviewer_notes | 趋势 | local_course_rewrite_batch_01_07 | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | lessonRows[4] | high_risk_reviewer_notes |
| 6 | phase_1_fill_high_risk_reviewer_notes | high_risk_lesson_reviewer_notes | 趋势 | local_course_rewrite_batch_01_08 | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | lessonRows[5] | high_risk_reviewer_notes |
| 7 | phase_1_fill_high_risk_reviewer_notes | high_risk_lesson_reviewer_notes | 突破 | local_course_rewrite_batch_01_09 | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | lessonRows[6] | high_risk_reviewer_notes |
| 8 | phase_1_fill_high_risk_reviewer_notes | high_risk_lesson_reviewer_notes | 突破 | local_course_rewrite_batch_01_10 | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | lessonRows[7] | high_risk_reviewer_notes |
| 9 | phase_1_fill_high_risk_reviewer_notes | high_risk_lesson_reviewer_notes | 反转 | local_course_rewrite_batch_01_13 | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | lessonRows[8] | high_risk_reviewer_notes |
| 10 | phase_1_fill_high_risk_reviewer_notes | high_risk_lesson_reviewer_notes | 反转 | local_course_rewrite_batch_01_14 | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | lessonRows[9] | high_risk_reviewer_notes |
| 11 | phase_1_fill_high_risk_reviewer_notes | high_risk_lesson_reviewer_notes | 市场结构 | local_course_rewrite_batch_02_03 | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | lessonRows[10] | high_risk_reviewer_notes |
| 12 | phase_1_fill_high_risk_reviewer_notes | high_risk_lesson_reviewer_notes | 市场结构 | local_course_rewrite_batch_02_04 | 6 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | lessonRows[11] | high_risk_reviewer_notes |
| 13 | phase_2_resolve_direct_source_candidates | direct_source_candidate_decision | 突破 | direct_source_candidate_resolution_01 | 1 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | directSourceDecisionRows[0] | direct_source_decisions |
| 14 | phase_2_resolve_direct_source_candidates | direct_source_candidate_decision | 突破 | direct_source_candidate_resolution_02 | 1 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | directSourceDecisionRows[1] | direct_source_decisions |
| 15 | phase_2_resolve_direct_source_candidates | direct_source_candidate_decision | 市场结构 | direct_source_candidate_resolution_03 | 1 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | directSourceDecisionRows[2] | direct_source_decisions |
| 16 | phase_2_resolve_direct_source_candidates | direct_source_candidate_decision | 市场结构 | direct_source_candidate_resolution_04 | 1 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | directSourceDecisionRows[3] | direct_source_decisions |
| 17 | phase_2_resolve_direct_source_candidates | direct_source_candidate_decision | 趋势 | direct_source_candidate_resolution_05 | 1 | docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json | directSourceDecisionRows[4] | direct_source_decisions |
| 18 | phase_3_fill_source_fit_packet_rows | source_fit_packet_rows | K线与价格行为 | node-public-source-fit-batch-001 | 60 | docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_001_INPUT_COPY_TEMPLATE.json | reviewRows[*] | source_fit_packets_001_003 |
| 19 | phase_3_fill_source_fit_packet_rows | source_fit_packet_rows | K线与价格行为 | node-public-source-fit-batch-002 | 60 | docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE.json | reviewRows[*] | source_fit_packets_001_003 |
| 20 | phase_3_fill_source_fit_packet_rows | source_fit_packet_rows | K线与价格行为 | node-public-source-fit-batch-003 | 60 | docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_003_INPUT_COPY_TEMPLATE.json | reviewRows[*] | source_fit_packets_001_003 |

## Reviewer Guardrails

- Use the workbench as navigation only; write real input only into reviewer-owned input copies.
- Do not copy Codex self-review, private PDF prose, Wikipedia prose, or public source prose into reviewer notes.
- Every card must preserve education-only wording and avoid setup, signal, return, broker, automation, or real-money guidance.
- After filling input copies, rerun validation and completion gate before requesting separate approval.
- This workbench never unlocks learner release or write authorization by itself.

## Completion Rule

This first reviewer workbench is complete when all first 20 reviewer actions are represented as action cards with execution phase, gate, input path, JSON path, mapped field count, evidence samples, validation command, and reviewer task for the 257 first-handoff work items. It does not complete review, generate reviewer notes, approve copied text, approve learner-facing citations, or unlock learner release.

## Boundary

Knowledge first reviewer workbench is reviewer-facing education-only operations material for absorbed local course material and public/Wikipedia/official source-fit review rows. It organizes 20 first reviewer actions, 257 first-handoff work items, 72 high-risk reviewer notes, 5 direct-source decisions, and 180 source-fit packet rows into human-owned work cards; it does not generate reviewer notes, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.
