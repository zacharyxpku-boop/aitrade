# First Reviewer Direct Candidate Confirmation Checklist

This checklist isolates the source refs that could be mistaken for direct lesson evidence.
Every row still requires human confirmation and may need to be downgraded to boundary-only context.

## Summary

- Target batches: rewrite_batch_01, rewrite_batch_05
- Direct candidates: 5
- Source refs to inspect: 8
- Green source leaks: 0
- Real status overlay present: false
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Candidate Rows

- rewrite_batch_01 / lesson_knv2_0068 / CFTC: needs_human_confirmation_or_downgrade
  - Topic: 多周期分析 / D1背景
  - Default role: fraud_or_market_boundary_until_confirmed
  - Allowed use: Use as fraud, market-risk, commodity-product, AI-bot-risk, or oversight boundary context after human confirmation.
  - Disallowed use: Do not use as chart-pattern authority, trading-signal support, system endorsement, or performance evidence.
  - Confirm if: The lesson claim is specifically about fraud red flags, phony systems, AI trading bot risks, commodity-product risk, or market-surveillance literacy. | The source title and metadata directly match the lesson claim without needing copied source body text. | The rewrite frames the source as investor-protection or market-oversight education, not a trade rule.
  - Downgrade if: The lesson claim is about chart prediction, timeframe reading, liquidity sweeps, entries, exits, or profitability. | The CFTC source only supports a safety boundary and not the lesson's explanatory claim. | The reviewer would need to turn a fraud/oversight warning into tactical trading advice.
  - Source refs: src_real_11201 CFTC AI Trading Bots Advisory; src_real_11211 CFTC Commodity ETP Risks; src_real_10571 CFTC Large Trader Reporting; src_real_10297 CFTC Market Surveillance
- rewrite_batch_05 / lesson_knv2_0087 / BEA: needs_human_confirmation_or_downgrade
  - Topic: K线与价格行为 / 流动性扫过
  - Default role: macro_data_boundary_until_confirmed
  - Allowed use: Use as macro-data definition, release-reading, API/data-boundary, or source-literacy context after human confirmation.
  - Disallowed use: Do not use as proof of chart patterns, liquidity sweeps, entries/exits, signals, or market direction.
  - Confirm if: The lesson claim is specifically about reading BEA data definitions, release timing, or macro-data interpretation. | The source title and metadata directly match the lesson claim without needing copied source body text. | The rewritten lesson keeps the source as data-context education, not chart-pattern proof.
  - Downgrade if: The lesson claim is about price-action mechanics, liquidity sweeps, entries, exits, or chart prediction. | The BEA source only provides API/data access context rather than direct support for the lesson topic. | The reviewer would need to infer a market direction or trading rule from the source.
  - Source refs: src_real_10310 BEA Data Application Programming Interface
- rewrite_batch_05 / lesson_knv2_0087 / BLS: needs_human_confirmation_or_downgrade
  - Topic: K线与价格行为 / 流动性扫过
  - Default role: macro_data_boundary_until_confirmed
  - Allowed use: Use as macro-data definition, release-reading, and economic-source literacy context after human confirmation.
  - Disallowed use: Do not use as chart-pattern authority, signal support, return implication, or real-money decision input.
  - Confirm if: The lesson claim is specifically about BLS data definitions, release interpretation, or economic-data literacy. | The source title and metadata directly support the lesson context without copied source body text. | The rewritten lesson keeps the source as macro-data context, not a trading setup validator.
  - Downgrade if: The lesson claim is about chart behavior, liquidity sweeps, prediction, or tactical entries/exits. | The BLS source only offers macro-data context and not direct support for the chart lesson. | The proposed note converts economic data into a directional or performance implication.
  - Source refs: src_real_10152 BLS PPI
- rewrite_batch_05 / lesson_knv2_0087 / CFTC: needs_human_confirmation_or_downgrade
  - Topic: K线与价格行为 / 流动性扫过
  - Default role: fraud_or_market_boundary_until_confirmed
  - Allowed use: Use as fraud, market-risk, commodity-product, AI-bot-risk, or oversight boundary context after human confirmation.
  - Disallowed use: Do not use as chart-pattern authority, trading-signal support, system endorsement, or performance evidence.
  - Confirm if: The lesson claim is specifically about fraud red flags, phony systems, AI trading bot risks, commodity-product risk, or market-surveillance literacy. | The source title and metadata directly match the lesson claim without needing copied source body text. | The rewrite frames the source as investor-protection or market-oversight education, not a trade rule.
  - Downgrade if: The lesson claim is about chart prediction, timeframe reading, liquidity sweeps, entries, exits, or profitability. | The CFTC source only supports a safety boundary and not the lesson's explanatory claim. | The reviewer would need to turn a fraud/oversight warning into tactical trading advice.
  - Source refs: src_real_11209 CFTC Phony Trading Websites
- rewrite_batch_05 / lesson_knv2_0087 / SEC: needs_human_confirmation_or_downgrade
  - Topic: K线与价格行为 / 流动性扫过
  - Default role: filing_or_data_boundary_until_confirmed
  - Allowed use: Use as filing literacy, official-data access, disclosure-boundary, or source-boundary context after human confirmation.
  - Disallowed use: Do not use as chart-pattern authority, signal support, performance proof, or trade-decision guidance.
  - Confirm if: The lesson claim is specifically about SEC data access, filing literacy, disclosure source boundaries, or official metadata use. | The source title and metadata directly match the source-literacy claim without copied source body text. | The rewrite keeps the source as filing/data-access context rather than price-action proof.
  - Downgrade if: The lesson claim is about chart mechanics, liquidity sweeps, entries/exits, prediction, or outcome expectations. | The SEC source only proves official data access exists and not the lesson's price-action claim. | The proposed note uses SEC developer resources as trading evidence.
  - Source refs: src_real_11186 SEC Developer Resources

## Stop Conditions

- Stop if a reviewer treats a direct candidate as approved without filling sourceFitNotes from real review work.
- Stop if any candidate requires copied external source body text to support the lesson claim.
- Stop if any source is used for buy/sell/hold advice, trading signals, broker/order workflow, automation, performance claims, or real-money guidance.
- Stop if macro-data, filing, fraud, or oversight sources are used as chart-pattern proof.
- Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.
- Stop if any row changes lesson grade, approvalStatus, learnerFacingRelease, or productionReady.

## Boundary

This checklist is reviewer-facing source-fit scaffolding only. It does not approve direct source use, fill human notes, create docs/LESSON_BATCH_REVIEW_STATUS.json, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.
