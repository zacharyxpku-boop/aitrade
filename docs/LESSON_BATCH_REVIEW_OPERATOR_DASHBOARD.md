# Lesson Batch Review Operator Dashboard

This dashboard is the all-batch operator entrypoint after dedicated editor packets reached 8/8 coverage.
It coordinates human review work across all 48 workbench lessons without creating real review evidence, approval, release, grade promotion, or production readiness.

## Summary

- Dashboard ready: true
- Operator mode: all_batch_pre_write_reviewer_dashboard_only
- Rewrite batches: 8
- Lesson cards: 48
- Dedicated editor packets: 8
- Dedicated notes dry-runs: 8
- Fully covered batches: 8
- Blank note fields: 288
- Filled note fields: 0
- Real status overlay present: false
- Approval review candidates: 0
- Commercial-ready promotions: 0
- Next manual action: start_human_source_fit_notes_from_high_risk_batches_then_medium_then_low_without_approval_or_release
- educationOnly: true
- productionReady: false

## Batch Operations

| Batch | Risk mix | Lessons | Packet | Notes dry-run | Manual action | Source families |
| --- | --- | ---: | --- | --- | --- | --- |
| rewrite_batch_01 | H:1 M:5 L:0 | 6 | true | true | resolve_high_risk_source_fit_before_any_rewrite | BEA, BLS, CFTC, Federal Reserve, Investor.gov, Project Gutenberg, SEC, Treasury, federalregister.gov |
| rewrite_batch_02 | H:0 M:2 L:4 | 6 | true | true | complete_targeted_source_fit_notes_then_rewrite | BEA, BLS, CFTC, Census, Federal Reserve, Internet Archive, Investor.gov, Project Gutenberg, SEC, Treasury, consumerfinance.gov, federalregister.gov, financialresearch.gov |
| rewrite_batch_03 | H:0 M:3 L:3 | 6 | true | true | complete_targeted_source_fit_notes_then_rewrite | BEA, BLS, CFTC, EIA, Federal Reserve, Internet Archive, Investor.gov, Project Gutenberg, SEC, Treasury, consumerfinance.gov |
| rewrite_batch_04 | H:0 M:1 L:5 | 6 | true | true | complete_targeted_source_fit_notes_then_rewrite | BEA, BLS, CFTC, Federal Reserve, Internet Archive, Investor.gov, Project Gutenberg, SEC, Treasury, dol.gov |
| rewrite_batch_05 | H:1 M:2 L:3 | 6 | true | true | resolve_high_risk_source_fit_before_any_rewrite | BEA, BLS, CFTC, Federal Reserve, Investor.gov, Project Gutenberg, SEC, Treasury, nist.gov |
| rewrite_batch_06 | H:0 M:2 L:4 | 6 | true | true | complete_targeted_source_fit_notes_then_rewrite | BEA, BLS, CFTC, EIA, Investor.gov, Project Gutenberg, SEC, Treasury, financialresearch.gov, treasurydirect.gov |
| rewrite_batch_07 | H:0 M:1 L:5 | 6 | true | true | complete_targeted_source_fit_notes_then_rewrite | BEA, BLS, CFTC, EIA, Federal Reserve, Internet Archive, Investor.gov, Project Gutenberg, SEC, Treasury, nist.gov |
| rewrite_batch_08 | H:0 M:5 L:1 | 6 | true | true | complete_medium_heavy_source_fit_notes_before_rewrite | BEA, BLS, CFTC, Federal Reserve, Investor.gov, Project Gutenberg, SEC, Treasury, consumer.ftc.gov, nass.usda.gov |

## Lesson Review Queue

| Lesson | Batch | Risk | Module | Topic | Manual action | Required blank notes |
| --- | --- | --- | --- | --- | --- | --- |
| lesson_knv2_0068 | rewrite_batch_01 | high | 多周期分析 | D1背景 | inspect_source_family_mismatch_and_block_or_downgrade | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0087 | rewrite_batch_05 | high | K线与价格行为 | 流动性扫过 | inspect_source_family_mismatch_and_block_or_downgrade | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0019 | rewrite_batch_01 | medium | 反转 | 衰竭证据 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0044 | rewrite_batch_01 | medium | 多周期分析 | M15细节 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0054 | rewrite_batch_01 | medium | 交易区间 | 区间突破 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0128 | rewrite_batch_01 | medium | 多周期分析 | D1背景 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0140 | rewrite_batch_01 | medium | 多周期分析 | H4结构 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0006 | rewrite_batch_02 | medium | 交易区间 | 区间上沿 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0018 | rewrite_batch_02 | medium | 交易区间 | 区间下沿 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0004 | rewrite_batch_03 | medium | 趋势 | 趋势定义 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0052 | rewrite_batch_03 | medium | 趋势 | 趋势中继 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0088 | rewrite_batch_03 | medium | 趋势 | 趋势加速 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0086 | rewrite_batch_04 | medium | 市场结构 | 结构破坏 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0075 | rewrite_batch_05 | medium | K线与价格行为 | 组合K线 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0159 | rewrite_batch_05 | medium | K线与价格行为 | 形态语境 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0007 | rewrite_batch_06 | medium | 反转 | 反转定义 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0034 | rewrite_batch_06 | medium | 回测误区 | 过拟合 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0046 | rewrite_batch_07 | medium | 回测误区 | 成本忽略 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0009 | rewrite_batch_08 | medium | 新闻/情绪/事件偏见 | 标题偏见 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0037 | rewrite_batch_08 | medium | 图表阅读基础 | 影线含义 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0041 | rewrite_batch_08 | medium | 突破 | 突破回踩 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0049 | rewrite_batch_08 | medium | 图表阅读基础 | 波动变化 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0061 | rewrite_batch_08 | medium | 图表阅读基础 | 结构先行 | write_source_fit_downgrade_or_boundary_note | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0024 | rewrite_batch_02 | low | 交易心理 | 确认偏误 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0030 | rewrite_batch_02 | low | 交易区间 | 区间中部 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0132 | rewrite_batch_02 | low | 交易心理 | 害怕错过 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0187 | rewrite_batch_02 | low | 反转 | 反转定义 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0040 | rewrite_batch_03 | low | 趋势 | 趋势衰竭 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0156 | rewrite_batch_03 | low | 交易心理 | 过度自信 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0240 | rewrite_batch_03 | low | 交易心理 | 结果导向 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0003 | rewrite_batch_04 | low | K线与价格行为 | 单根K线误区 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0014 | rewrite_batch_04 | low | 市场结构 | 结构延续 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0057 | rewrite_batch_04 | low | 新闻/情绪/事件偏见 | 单源偏差 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0189 | rewrite_batch_04 | low | 新闻/情绪/事件偏见 | 标题偏见 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0321 | rewrite_batch_04 | low | 新闻/情绪/事件偏见 | 事件时间 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0011 | rewrite_batch_05 | low | 风险管理 | 失效条件 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0059 | rewrite_batch_05 | low | 风险管理 | 边界语言 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0167 | rewrite_batch_05 | low | 风险管理 | 可复盘计划 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0010 | rewrite_batch_06 | low | 回测误区 | 偷看未来 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0022 | rewrite_batch_06 | low | 回测误区 | 样本太少 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0031 | rewrite_batch_06 | low | 反转 | 双顶双底 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0275 | rewrite_batch_06 | low | 风险管理 | 不确定性 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0002 | rewrite_batch_07 | low | 市场结构 | 高低点 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0005 | rewrite_batch_07 | low | 突破 | 突破前压缩 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0017 | rewrite_batch_07 | low | 突破 | 有效突破 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0026 | rewrite_batch_07 | low | 市场结构 | 结构破坏 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0029 | rewrite_batch_07 | low | 突破 | 假突破 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |
| lesson_knv2_0073 | rewrite_batch_08 | low | 图表阅读基础 | 价格位置 | confirm_green_only_no_copy_no_advice_before_rewrite | originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, humanReviewerInitials |

## Source Family Roles

| Source family | Reviewer use |
| --- | --- |
| BEA | macro/data/event-timing literacy only; no market-direction, chart, or candle proof |
| BLS | macro/data/event-timing literacy only; no market-direction, chart, or candle proof |
| CFTC | investor/consumer/fraud-risk boundary only; never chart, signal, forecast, or performance proof |
| Census | macro/data/event-timing literacy only; no market-direction, chart, or candle proof |
| EIA | macro/data/event-timing literacy only; no market-direction, chart, or candle proof |
| Federal Reserve | macro/data/event-timing literacy only; no market-direction, chart, or candle proof |
| Internet Archive | public-domain historical language/observation context only; strip buy/sell rules and profit voice |
| Investor.gov | investor/consumer/fraud-risk boundary only; never chart, signal, forecast, or performance proof |
| Project Gutenberg | public-domain historical language/observation context only; strip buy/sell rules and profit voice |
| SEC | regulatory/disclosure/systemic-risk context only; no trading-system validation |
| Treasury | macro/data/event-timing literacy only; no market-direction, chart, or candle proof |
| consumer.ftc.gov | boundary-only until a human reviewer confirms direct, safe, licensed use |
| consumerfinance.gov | investor/consumer/fraud-risk boundary only; never chart, signal, forecast, or performance proof |
| dol.gov | macro/data/event-timing literacy only; no market-direction, chart, or candle proof |
| federalregister.gov | regulatory/disclosure/systemic-risk context only; no trading-system validation |
| financialresearch.gov | regulatory/disclosure/systemic-risk context only; no trading-system validation |
| nass.usda.gov | boundary-only until a human reviewer confirms direct, safe, licensed use |
| nist.gov | process/model-risk boundary only; no trading-system certification |
| treasurydirect.gov | macro/data/event-timing literacy only; no market-direction, chart, or candle proof |

## Operator Rules

- Use this dashboard as an all-batch orientation map after packet coverage reaches 8/8.
- Record real notes only in a deliberately created human-review overlay; generated dry-runs must stay blank.
- Resolve high-risk rows before medium and low rows.
- Use editor packets for source-fit, license, rewrite, and checklist guidance; do not copy packet text into learner-facing prose.
- Keep every generated lesson structural_draft and not_approved until separate human rewrite, fact-check, and approval review exist.
- Do not treat this dashboard as internal-trial readiness, launch readiness, commercial readiness, or production readiness.

## Boundary

This all-batch operator dashboard is reviewer-facing operations scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, or make the product production-ready.
