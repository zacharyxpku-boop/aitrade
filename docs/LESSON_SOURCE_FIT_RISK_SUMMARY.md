# Lesson Source-Fit Risk Summary

This report helps reviewers prioritize source-to-topic fit checks for the lesson rewrite workbench.
It is not content approval, learner-facing release, production readiness, or trading guidance.

## Summary

- Workbench items: 48
- Rewrite batches: 8
- Source-fit rows: 48
- Blocked rows: 0
- High-risk rows: 2
- Medium-risk rows: 21
- Low-risk rows: 25
- Green source leaks: 0
- educationOnly: true
- productionReady: false

## Batch Risk

| Batch | Items | Blocked | High | Medium | Low | First review focus |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| rewrite_batch_01 | 6 | 0 | 1 | 5 | 0 | Confirm whether the attached source families really support chart_price_action; expected context: historical language, observation training, term boundary, and non-action chart-reading context. |
| rewrite_batch_02 | 6 | 0 | 0 | 2 | 4 | Check whether chart-language claims need public-domain historical context or should be rewritten as pure observation training. |
| rewrite_batch_03 | 6 | 0 | 0 | 3 | 3 | Narrow the rewrite to source-boundary context only; do not blend unrelated authority into a stronger learner-facing claim. |
| rewrite_batch_04 | 6 | 0 | 0 | 1 | 5 | Check whether chart-language claims need public-domain historical context or should be rewritten as pure observation training. |
| rewrite_batch_05 | 6 | 0 | 1 | 2 | 3 | Check whether chart-language claims need public-domain historical context or should be rewritten as pure observation training. |
| rewrite_batch_06 | 6 | 0 | 0 | 2 | 4 | Check whether chart-language claims need public-domain historical context or should be rewritten as pure observation training. |
| rewrite_batch_07 | 6 | 0 | 0 | 1 | 5 | Narrow the rewrite to source-boundary context only; do not blend unrelated authority into a stronger learner-facing claim. |
| rewrite_batch_08 | 6 | 0 | 0 | 5 | 1 | Narrow the rewrite to source-boundary context only; do not blend unrelated authority into a stronger learner-facing claim. |

## Highest Review Priority Rows

| Lesson | Batch | Module | Topic | Risk | Reasons |
| --- | --- | --- | --- | --- | --- |
| lesson_knv2_0037 | rewrite_batch_08 | 图表阅读基础 | 影线含义 | medium | broad_source_family_mix, fraud_source_attached_to_chart_context |
| lesson_knv2_0049 | rewrite_batch_08 | 图表阅读基础 | 波动变化 | medium | broad_source_family_mix, fraud_source_attached_to_chart_context |
| lesson_knv2_0061 | rewrite_batch_08 | 图表阅读基础 | 结构先行 | medium | chart_lesson_without_public_domain_historical_context |
| lesson_knv2_0086 | rewrite_batch_04 | 市场结构 | 结构破坏 | medium | chart_lesson_without_public_domain_historical_context, fraud_source_attached_to_chart_context |
| lesson_knv2_0075 | rewrite_batch_05 | K线与价格行为 | 组合K线 | medium | broad_source_family_mix, fraud_source_attached_to_chart_context |
| lesson_knv2_0087 | rewrite_batch_05 | K线与价格行为 | 流动性扫过 | high | chart_lesson_without_public_domain_historical_context, broad_source_family_mix, fraud_source_attached_to_chart_context |
| lesson_knv2_0159 | rewrite_batch_05 | K线与价格行为 | 形态语境 | medium | chart_lesson_without_public_domain_historical_context, fraud_source_attached_to_chart_context |
| lesson_knv2_0004 | rewrite_batch_03 | 趋势 | 趋势定义 | medium | broad_source_family_mix |
| lesson_knv2_0052 | rewrite_batch_03 | 趋势 | 趋势中继 | medium | chart_lesson_without_public_domain_historical_context, fraud_source_attached_to_chart_context |
| lesson_knv2_0088 | rewrite_batch_03 | 趋势 | 趋势加速 | medium | broad_source_family_mix, fraud_source_attached_to_chart_context |
| lesson_knv2_0041 | rewrite_batch_08 | 突破 | 突破回踩 | medium | broad_source_family_mix, fraud_source_attached_to_chart_context |
| lesson_knv2_0054 | rewrite_batch_01 | 交易区间 | 区间突破 | medium | broad_source_family_mix |
| lesson_knv2_0006 | rewrite_batch_02 | 交易区间 | 区间上沿 | medium | chart_lesson_without_public_domain_historical_context |
| lesson_knv2_0018 | rewrite_batch_02 | 交易区间 | 区间下沿 | medium | broad_source_family_mix, fraud_source_attached_to_chart_context |
| lesson_knv2_0019 | rewrite_batch_01 | 反转 | 衰竭证据 | medium | broad_source_family_mix |
| lesson_knv2_0007 | rewrite_batch_06 | 反转 | 反转定义 | medium | chart_lesson_without_public_domain_historical_context, broad_source_family_mix |
| lesson_knv2_0044 | rewrite_batch_01 | 多周期分析 | M15细节 | medium | chart_lesson_without_public_domain_historical_context, fraud_source_attached_to_chart_context |
| lesson_knv2_0068 | rewrite_batch_01 | 多周期分析 | D1背景 | high | no_expected_family_for_module_domain, chart_lesson_without_public_domain_historical_context, fraud_source_attached_to_chart_context |
| lesson_knv2_0128 | rewrite_batch_01 | 多周期分析 | D1背景 | medium | chart_lesson_without_public_domain_historical_context |
| lesson_knv2_0140 | rewrite_batch_01 | 多周期分析 | H4结构 | medium | chart_lesson_without_public_domain_historical_context |
| lesson_knv2_0009 | rewrite_batch_08 | 新闻/情绪/事件偏见 | 标题偏见 | medium | broad_source_family_mix |
| lesson_knv2_0034 | rewrite_batch_06 | 回测误区 | 过拟合 | medium | broad_source_family_mix |
| lesson_knv2_0046 | rewrite_batch_07 | 回测误区 | 成本忽略 | medium | broad_source_family_mix |

## Boundary

This report prioritizes human source-fit review only. It does not reject green sources, approve final wording, publish learner-facing content, change lesson grades, or provide trading advice.
