# Local Course Review Gate Dashboard

Single-screen internal review gate for local-course absorption.

- Dashboard status: local_course_review_gate_dashboard_ready_release_blocked
- Source root: C:\Users\86136\Desktop\投资
- Local docs/chunks: 298/3314
- Modules research/public/Wikipedia ready: 12/12/12
- Rewrite-ready nodes: 360/360
- High-risk lessons grounded/blocking: 12/12
- Codex self-review notes: 72/72
- High-risk real reviewer notes ready/blocked: 0/72
- High-risk direct-source decisions ready/blocked: 0/5
- Real human inputs: 0
- P0 tasks ready/blocked: 0/22
- Source-fit ready/blocked: 0/22
- Node public source-fit ready/blocked: 0/1638
- Node public source-fit packets ready/blocked/progress: 0/35/0%
- First blocked node public source-fit packet: node-public-source-fit-batch-001-packet
- Write allowed now: false

## Summary Gates

| Gate | Status | Internal ready | Learner release | Evidence | Next gate |
| --- | --- | --- | --- | --- | --- |
| source_folder_sync | source_folder_synced_to_private_research_corpus_release_blocked | true | false | 298/298 unique PDFs mapped | keep source folder sync audit green before every release review |
| research_layer_absorption | module_research_layer_absorbed_release_blocked | true | false | 360/360 nodes rewrite-ready | review rewrite drafts and preserve education-only boundary |
| public_wikipedia_grounding | wikipedia_grounding_ready_for_reviewer_not_release | true | false | 96 Wikipedia docs, 48 high-risk refs | human reviewer confirms public refs are context only or approved separately |
| high_risk_self_review | codex_self_review_complete_not_approved | true | false | 72/72 Codex self-review notes, 48 blocking notes | real reviewer fills independent notes and separate approval gate |
| high_risk_real_reviewer_overlay | blocked_missing_real_reviewer_overlay_input | true | false | 0/72 real notes ready/blocked; 0/5 direct-source decisions ready/blocked | real reviewer fills 72 notes and 5 direct-source decisions, then reruns validation |
| p0_real_reviewer_tasks | p0_real_reviewer_task_board_ready_all_tasks_blocked | true | false | 0/22 real tasks ready/blocked; 0 real inputs | fill copied reviewer input files, then validate and lint |
| source_fit_notes | blocked_missing_reviewer_input | true | false | 0/22 source-fit rows ready/blocked | complete source-fit and public-reference notes without fixtures |
| node_public_source_fit_review_input | blocked_missing_real_reviewer_source_fit_input | true | false | 0/1638 node public source-fit rows ready/blocked; 0 real inputs | real reviewer accepts/rejects public source-fit candidates before learner citations |
| node_public_source_fit_progress_matrix | node_public_source_fit_review_progress_matrix_ready_release_blocked | true | false | 0/35 packets ready/blocked; 0/12 modules ready/blocked; 0% progress; first blocked node-public-source-fit-batch-001-packet | complete packet-level source-fit review until every packet and module is ready |
| write_authorization | write_authorization_preview_ready_manual_required | true | false | writeAllowedNow:false; realHumanInputRequired:true | real_reviewer_input_then_lint_validate_apply_dry_run_then_manual_write_authorization |

## Module Gates

| Module | Path | Local ready | Public ready | Wikipedia ready | High-risk blockers | P0 blocked | Gate |
| --- | --- | --- | --- | --- | ---: | ---: | --- |
| 图表阅读基础 | path_1 | 30/30 | true | true | 0 | 0 | blocked_pending_refinement_and_release_approval |
| 市场结构 | path_2 | 30/30 | true | true | 4 | 0 | blocked_pending_real_reviewer_input |
| K线与价格行为 | path_3 | 30/30 | true | true | 0 | 0 | blocked_pending_refinement_and_release_approval |
| 趋势 | path_4 | 30/30 | true | true | 2 | 0 | blocked_pending_real_reviewer_input |
| 突破 | path_5 | 30/30 | true | true | 4 | 0 | blocked_pending_real_reviewer_input |
| 交易区间 | path_6 | 30/30 | true | true | 0 | 0 | blocked_pending_refinement_and_release_approval |
| 反转 | path_7 | 30/30 | true | true | 2 | 0 | blocked_pending_real_reviewer_input |
| 多周期分析 | path_8 | 30/30 | true | true | 0 | 0 | blocked_pending_refinement_and_release_approval |
| 新闻/情绪/事件偏见 | path_9 | 30/30 | true | true | 0 | 0 | blocked_pending_refinement_and_release_approval |
| 回测误区 | path_10 | 30/30 | true | true | 0 | 0 | blocked_pending_refinement_and_release_approval |
| 风险管理 | path_11 | 30/30 | true | true | 0 | 0 | blocked_pending_refinement_and_release_approval |
| 交易心理 | path_12 | 30/30 | true | true | 0 | 0 | blocked_pending_refinement_and_release_approval |

## Next Actions

1. freeze_source_sync: ready / npm.cmd run check:local-course-source-sync-audit
2. review_high_risk_lessons: blocked_waiting_real_reviewer / npm.cmd run check:local-course-high-risk-public-grounding-matrix
3. fill_high_risk_real_reviewer_overlay: blocked_missing_real_reviewer_input / npm.cmd run validate:local-course-high-risk-real-reviewer-overlay-input && npm.cmd run check:local-course-high-risk-real-reviewer-overlay-input-validation
4. fill_p0_source_fit_notes: blocked_missing_real_reviewer_input / npm.cmd run validate:local-course-p0-real-reviewer-source-fit-input
5. fill_node_public_source_fit_review: blocked_missing_real_reviewer_input / npm.cmd run validate:knowledge-node-public-source-fit-review-input && npm.cmd run check:knowledge-node-public-source-fit-review-input-validation
6. track_node_public_source_fit_progress: blocked_missing_real_reviewer_input / npm.cmd run build:knowledge-node-public-source-fit-review-progress-matrix && npm.cmd run check:knowledge-node-public-source-fit-review-progress-matrix
7. resolve_manual_transcription_pages: blocked_missing_real_reviewer_input / npm.cmd run check:local-course-p0-review-operator-index
8. resolve_source_replacement_pages: blocked_missing_real_reviewer_input / npm.cmd run check:local-course-p0-source-replacement-review-pack
9. rerun_write_authorization_preview: blocked_until_real_inputs_ready / npm.cmd run build:local-course-p0-write-authorization-preview && npm.cmd run check:local-course-p0-write-authorization-preview
10. separate_learner_release_approval: blocked_until_human_approval / npm.cmd run verify

## Completion Rule

This dashboard proves internal review-gate visibility for absorbed local course material and public/Wikipedia grounding. It does not prove learner-facing course readiness; real reviewer notes, source-fit input, source replacement decisions, dry-run apply, and separate approval remain required.

## Boundary

Reviewer-facing education-only review gate. It aggregates private course coverage, public/Wikipedia grounding candidates, Codex self-review, and P0 human-review blockers; it does not publish private PDFs, approve learner-facing citations, write overlays, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.
