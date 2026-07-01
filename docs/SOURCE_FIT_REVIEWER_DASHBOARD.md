# Source-Fit Reviewer Dashboard

This dashboard merges the high, medium, and low source-fit reports into one reviewer-facing queue.
It is not final approval, learner-facing release, production readiness, or trading guidance.

## Summary

- Source-fit lessons: 48
- Rewrite batches: 8
- High-risk rows: 2
- Medium-risk rows: 21
- Low-risk rows: 25
- Green source leaks: 0
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Review Order

1. Resolve high-risk source-fit rows before any prose rewrite.
2. Complete medium-risk checklist notes before batching those lessons for rewrite.
3. Use low-risk fast-pass rows only after green-only, no-copy, no-advice, and structural-draft notes are recorded.
4. Keep every generated lesson structural_draft until separate human rewrite and factual review are complete.

## Batch Dashboard

| Batch | Items | Risk mix | Modules | Source families | First action |
| --- | ---: | --- | --- | --- | --- |
| rewrite_batch_01 | 6 | H:1 M:5 L:0 | 交易区间, 反转, 多周期分析 | BEA, BLS, CFTC, Federal Reserve, Investor.gov, Project Gutenberg, SEC, Treasury, federalregister.gov | resolve_high_risk_source_fit_before_batch_rewrite |
| rewrite_batch_02 | 6 | H:0 M:2 L:4 | 交易区间, 交易心理, 反转 | BEA, BLS, CFTC, Census, Federal Reserve, Internet Archive, Investor.gov, Project Gutenberg, SEC, Treasury, consumerfinance.gov, federalregister.gov, financialresearch.gov | complete_medium_checklists_then_queue_low_risk_rows |
| rewrite_batch_03 | 6 | H:0 M:3 L:3 | 交易心理, 趋势 | BEA, BLS, CFTC, EIA, Federal Reserve, Internet Archive, Investor.gov, Project Gutenberg, SEC, Treasury, consumerfinance.gov | complete_medium_checklists_then_queue_low_risk_rows |
| rewrite_batch_04 | 6 | H:0 M:1 L:5 | K线与价格行为, 市场结构, 新闻/情绪/事件偏见 | BEA, BLS, CFTC, Federal Reserve, Internet Archive, Investor.gov, Project Gutenberg, SEC, Treasury, dol.gov | complete_medium_checklists_then_queue_low_risk_rows |
| rewrite_batch_05 | 6 | H:1 M:2 L:3 | K线与价格行为, 风险管理 | BEA, BLS, CFTC, Federal Reserve, Investor.gov, Project Gutenberg, SEC, Treasury, nist.gov | resolve_high_risk_source_fit_before_batch_rewrite |
| rewrite_batch_06 | 6 | H:0 M:2 L:4 | 反转, 回测误区, 风险管理 | BEA, BLS, CFTC, EIA, Investor.gov, Project Gutenberg, SEC, Treasury, financialresearch.gov, treasurydirect.gov | complete_medium_checklists_then_queue_low_risk_rows |
| rewrite_batch_07 | 6 | H:0 M:1 L:5 | 回测误区, 市场结构, 突破 | BEA, BLS, CFTC, EIA, Federal Reserve, Internet Archive, Investor.gov, Project Gutenberg, SEC, Treasury, nist.gov | complete_medium_checklists_then_queue_low_risk_rows |
| rewrite_batch_08 | 6 | H:0 M:5 L:1 | 图表阅读基础, 新闻/情绪/事件偏见, 突破 | BEA, BLS, CFTC, Federal Reserve, Investor.gov, Project Gutenberg, SEC, Treasury, consumer.ftc.gov, nass.usda.gov | complete_medium_checklists_then_queue_low_risk_rows |

## Lesson Queue

| Lesson | Batch | Risk | Module | Topic | Next action | Required notes |
| --- | --- | --- | --- | --- | --- | --- |
| lesson_knv2_0068 | rewrite_batch_01 | high | 多周期分析 | D1背景 | inspect_source_fit_before_rewrite | sourceFamilyMismatchNotes, safeRewriteDirectionNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0087 | rewrite_batch_05 | high | K线与价格行为 | 流动性扫过 | inspect_source_fit_before_rewrite | sourceFamilyMismatchNotes, safeRewriteDirectionNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0019 | rewrite_batch_01 | medium | 反转 | 衰竭证据 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0044 | rewrite_batch_01 | medium | 多周期分析 | M15细节 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0054 | rewrite_batch_01 | medium | 交易区间 | 区间突破 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0128 | rewrite_batch_01 | medium | 多周期分析 | D1背景 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0140 | rewrite_batch_01 | medium | 多周期分析 | H4结构 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0006 | rewrite_batch_02 | medium | 交易区间 | 区间上沿 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0018 | rewrite_batch_02 | medium | 交易区间 | 区间下沿 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0004 | rewrite_batch_03 | medium | 趋势 | 趋势定义 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0052 | rewrite_batch_03 | medium | 趋势 | 趋势中继 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0088 | rewrite_batch_03 | medium | 趋势 | 趋势加速 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0086 | rewrite_batch_04 | medium | 市场结构 | 结构破坏 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0075 | rewrite_batch_05 | medium | K线与价格行为 | 组合K线 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0159 | rewrite_batch_05 | medium | K线与价格行为 | 形态语境 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0007 | rewrite_batch_06 | medium | 反转 | 反转定义 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0034 | rewrite_batch_06 | medium | 回测误区 | 过拟合 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0046 | rewrite_batch_07 | medium | 回测误区 | 成本忽略 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0009 | rewrite_batch_08 | medium | 新闻/情绪/事件偏见 | 标题偏见 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0037 | rewrite_batch_08 | medium | 图表阅读基础 | 影线含义 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0041 | rewrite_batch_08 | medium | 突破 | 突破回踩 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0049 | rewrite_batch_08 | medium | 图表阅读基础 | 波动变化 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0061 | rewrite_batch_08 | medium | 图表阅读基础 | 结构先行 | complete_targeted_source_fit_checklist | sourceRoleNarrowingNotes, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0024 | rewrite_batch_02 | low | 交易心理 | 确认偏误 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0030 | rewrite_batch_02 | low | 交易区间 | 区间中部 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0132 | rewrite_batch_02 | low | 交易心理 | 害怕错过 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0187 | rewrite_batch_02 | low | 反转 | 反转定义 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0040 | rewrite_batch_03 | low | 趋势 | 趋势衰竭 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0156 | rewrite_batch_03 | low | 交易心理 | 过度自信 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0240 | rewrite_batch_03 | low | 交易心理 | 结果导向 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0003 | rewrite_batch_04 | low | K线与价格行为 | 单根K线误区 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0014 | rewrite_batch_04 | low | 市场结构 | 结构延续 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0057 | rewrite_batch_04 | low | 新闻/情绪/事件偏见 | 单源偏差 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0189 | rewrite_batch_04 | low | 新闻/情绪/事件偏见 | 标题偏见 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0321 | rewrite_batch_04 | low | 新闻/情绪/事件偏见 | 事件时间 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0011 | rewrite_batch_05 | low | 风险管理 | 失效条件 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0059 | rewrite_batch_05 | low | 风险管理 | 边界语言 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0167 | rewrite_batch_05 | low | 风险管理 | 可复盘计划 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0010 | rewrite_batch_06 | low | 回测误区 | 偷看未来 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0022 | rewrite_batch_06 | low | 回测误区 | 样本太少 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0031 | rewrite_batch_06 | low | 反转 | 双顶双底 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0275 | rewrite_batch_06 | low | 风险管理 | 不确定性 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0002 | rewrite_batch_07 | low | 市场结构 | 高低点 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0005 | rewrite_batch_07 | low | 突破 | 突破前压缩 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0017 | rewrite_batch_07 | low | 突破 | 有效突破 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0026 | rewrite_batch_07 | low | 市场结构 | 结构破坏 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0029 | rewrite_batch_07 | low | 突破 | 假突破 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |
| lesson_knv2_0073 | rewrite_batch_08 | low | 图表阅读基础 | 价格位置 | queue_for_human_rewrite_after_fast_pass_notes | greenOnlyConfirmed, copyingRiskNotes, boundaryCheckNotes, structuralDraftConfirmed |

## Boundary

This reviewer dashboard coordinates source-fit review only. It does not approve lessons, publish learner-facing content, change grades, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.
