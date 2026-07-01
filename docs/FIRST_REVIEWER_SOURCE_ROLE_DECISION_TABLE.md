# First Reviewer Source Role Decision Table

This table pre-sorts source-family roles for the first reviewer batches.
It is a reviewer aid only; every source role still needs human confirmation before notes or rewrites.

## Summary

- Target batches: rewrite_batch_01, rewrite_batch_05
- Lesson rows: 12
- Source-family decisions: 45
- High-risk lessons: 2
- Direct candidates needing confirmation: 5
- Real status overlay present: false
- Approval status: not_approved
- Learner-facing release: false
- educationOnly: true
- productionReady: false

## Role Legend

- direct_candidate_needs_human_confirmation: Potentially direct evidence, but a human must confirm source-topic fit before use.
- filing_or_data_boundary: SEC filing/data/disclosure literacy boundary, not copied prose.
- investor_protection_boundary: Investor-protection or fraud-warning boundary, not chart authority.
- fraud_or_market_boundary: CFTC fraud/system/market-risk boundary, not trading advice.
- macro_data_context: BLS/BEA macro data definition or release-reading context.
- macro_rates_context: Rates/macro context without directional claims.
- historical_context: Public-domain historical language only, with advice/profit wording removed.
- metadata_only_until_confirmed: Metadata or boundary-only until human confirmation.

## Decision Rows

| Batch | Lesson | Risk | Family | Suggested role | Confidence | Reviewer decision |
| --- | --- | --- | --- | --- | --- | --- |
| rewrite_batch_01 | lesson_knv2_0044 | medium | CFTC | fraud_or_market_boundary | medium | Use for commodity, fraud, system-risk, or market-oversight boundaries; do not use as chart-pattern authority unless source title directly fits. |
| rewrite_batch_01 | lesson_knv2_0044 | medium | SEC | filing_or_data_boundary | medium | Use for filing/data-access/disclosure-literacy boundaries; direct prose support needs human confirmation. |
| rewrite_batch_01 | lesson_knv2_0068 | high | CFTC | direct_candidate_needs_human_confirmation | medium | Inspect source title and metadata. If it directly supports the lesson topic, keep as direct evidence; otherwise downgrade to boundary-only context. |
| rewrite_batch_01 | lesson_knv2_0068 | high | Investor.gov | investor_protection_boundary | medium | Use for investor-protection, glossary, and fraud-warning boundaries; do not use to define chart structures. |
| rewrite_batch_01 | lesson_knv2_0128 | medium | CFTC | fraud_or_market_boundary | medium | Use for commodity, fraud, system-risk, or market-oversight boundaries; do not use as chart-pattern authority unless source title directly fits. |
| rewrite_batch_01 | lesson_knv2_0128 | medium | Federal Reserve | macro_rates_context | medium | Use for macro/rates context or data-boundary notes; do not convert into directional market claims. |
| rewrite_batch_01 | lesson_knv2_0128 | medium | Investor.gov | investor_protection_boundary | medium | Use for investor-protection, glossary, and fraud-warning boundaries; do not use to define chart structures. |
| rewrite_batch_01 | lesson_knv2_0140 | medium | BEA | macro_data_context | medium | Use for data-definition and release-reading boundaries; do not use as chart-pattern proof. |
| rewrite_batch_01 | lesson_knv2_0140 | medium | CFTC | fraud_or_market_boundary | medium | Use for commodity, fraud, system-risk, or market-oversight boundaries; do not use as chart-pattern authority unless source title directly fits. |
| rewrite_batch_01 | lesson_knv2_0140 | medium | Investor.gov | investor_protection_boundary | medium | Use for investor-protection, glossary, and fraud-warning boundaries; do not use to define chart structures. |
| rewrite_batch_01 | lesson_knv2_0140 | medium | Treasury | macro_rates_context | medium | Use for macro/rates context or data-boundary notes; do not convert into directional market claims. |
| rewrite_batch_01 | lesson_knv2_0054 | medium | BEA | macro_data_context | medium | Use for data-definition and release-reading boundaries; do not use as chart-pattern proof. |
| rewrite_batch_01 | lesson_knv2_0054 | medium | CFTC | fraud_or_market_boundary | medium | Use for commodity, fraud, system-risk, or market-oversight boundaries; do not use as chart-pattern authority unless source title directly fits. |
| rewrite_batch_01 | lesson_knv2_0054 | medium | Federal Reserve | macro_rates_context | medium | Use for macro/rates context or data-boundary notes; do not convert into directional market claims. |
| rewrite_batch_01 | lesson_knv2_0054 | medium | Project Gutenberg | historical_context | medium | Use only for historical language, terminology evolution, and observation framing; remove any buy/sell or profit wording. |
| rewrite_batch_01 | lesson_knv2_0054 | medium | Treasury | macro_rates_context | medium | Use for macro/rates context or data-boundary notes; do not convert into directional market claims. |
| rewrite_batch_01 | lesson_knv2_0019 | medium | BLS | macro_data_context | medium | Use for data-definition and release-reading boundaries; do not use as chart-pattern proof. |
| rewrite_batch_01 | lesson_knv2_0019 | medium | Federal Reserve | macro_rates_context | medium | Use for macro/rates context or data-boundary notes; do not convert into directional market claims. |
| rewrite_batch_01 | lesson_knv2_0019 | medium | Project Gutenberg | historical_context | medium | Use only for historical language, terminology evolution, and observation framing; remove any buy/sell or profit wording. |
| rewrite_batch_01 | lesson_knv2_0019 | medium | Treasury | macro_rates_context | medium | Use for macro/rates context or data-boundary notes; do not convert into directional market claims. |
| rewrite_batch_01 | lesson_knv2_0019 | medium | federalregister.gov | metadata_only_until_confirmed | low | Keep as metadata or source-boundary context until a human confirms direct lesson fit. |
| rewrite_batch_05 | lesson_knv2_0075 | medium | BEA | macro_data_context | medium | Use for data-definition and release-reading boundaries; do not use as chart-pattern proof. |
| rewrite_batch_05 | lesson_knv2_0075 | medium | Investor.gov | investor_protection_boundary | medium | Use for investor-protection, glossary, and fraud-warning boundaries; do not use to define chart structures. |
| rewrite_batch_05 | lesson_knv2_0075 | medium | Project Gutenberg | historical_context | medium | Use only for historical language, terminology evolution, and observation framing; remove any buy/sell or profit wording. |
| rewrite_batch_05 | lesson_knv2_0075 | medium | SEC | filing_or_data_boundary | medium | Use for filing/data-access/disclosure-literacy boundaries; direct prose support needs human confirmation. |
| rewrite_batch_05 | lesson_knv2_0075 | medium | Treasury | macro_rates_context | medium | Use for macro/rates context or data-boundary notes; do not convert into directional market claims. |
| rewrite_batch_05 | lesson_knv2_0087 | high | BEA | direct_candidate_needs_human_confirmation | medium | Inspect source title and metadata. If it directly supports the lesson topic, keep as direct evidence; otherwise downgrade to boundary-only context. |
| rewrite_batch_05 | lesson_knv2_0087 | high | BLS | direct_candidate_needs_human_confirmation | medium | Inspect source title and metadata. If it directly supports the lesson topic, keep as direct evidence; otherwise downgrade to boundary-only context. |
| rewrite_batch_05 | lesson_knv2_0087 | high | CFTC | direct_candidate_needs_human_confirmation | medium | Inspect source title and metadata. If it directly supports the lesson topic, keep as direct evidence; otherwise downgrade to boundary-only context. |
| rewrite_batch_05 | lesson_knv2_0087 | high | SEC | direct_candidate_needs_human_confirmation | medium | Inspect source title and metadata. If it directly supports the lesson topic, keep as direct evidence; otherwise downgrade to boundary-only context. |
| rewrite_batch_05 | lesson_knv2_0087 | high | Treasury | macro_rates_context | medium | Use for macro/rates context or data-boundary notes; do not convert into directional market claims. |
| rewrite_batch_05 | lesson_knv2_0159 | medium | BEA | macro_data_context | medium | Use for data-definition and release-reading boundaries; do not use as chart-pattern proof. |
| rewrite_batch_05 | lesson_knv2_0159 | medium | Investor.gov | investor_protection_boundary | medium | Use for investor-protection, glossary, and fraud-warning boundaries; do not use to define chart structures. |
| rewrite_batch_05 | lesson_knv2_0159 | medium | SEC | filing_or_data_boundary | medium | Use for filing/data-access/disclosure-literacy boundaries; direct prose support needs human confirmation. |
| rewrite_batch_05 | lesson_knv2_0159 | medium | Treasury | macro_rates_context | medium | Use for macro/rates context or data-boundary notes; do not convert into directional market claims. |
| rewrite_batch_05 | lesson_knv2_0011 | low | CFTC | fraud_or_market_boundary | medium | Use for commodity, fraud, system-risk, or market-oversight boundaries; do not use as chart-pattern authority unless source title directly fits. |
| rewrite_batch_05 | lesson_knv2_0011 | low | Federal Reserve | macro_rates_context | medium | Use for macro/rates context or data-boundary notes; do not convert into directional market claims. |
| rewrite_batch_05 | lesson_knv2_0011 | low | SEC | filing_or_data_boundary | medium | Use for filing/data-access/disclosure-literacy boundaries; direct prose support needs human confirmation. |
| rewrite_batch_05 | lesson_knv2_0011 | low | nist.gov | technical_data_integrity_boundary | medium | Use for data-integrity or technical boundary notes only. |
| rewrite_batch_05 | lesson_knv2_0059 | low | CFTC | fraud_or_market_boundary | medium | Use for commodity, fraud, system-risk, or market-oversight boundaries; do not use as chart-pattern authority unless source title directly fits. |
| rewrite_batch_05 | lesson_knv2_0059 | low | Investor.gov | investor_protection_boundary | medium | Use for investor-protection, glossary, and fraud-warning boundaries; do not use to define chart structures. |
| rewrite_batch_05 | lesson_knv2_0059 | low | SEC | filing_or_data_boundary | medium | Use for filing/data-access/disclosure-literacy boundaries; direct prose support needs human confirmation. |
| rewrite_batch_05 | lesson_knv2_0167 | low | CFTC | fraud_or_market_boundary | medium | Use for commodity, fraud, system-risk, or market-oversight boundaries; do not use as chart-pattern authority unless source title directly fits. |
| rewrite_batch_05 | lesson_knv2_0167 | low | Investor.gov | investor_protection_boundary | medium | Use for investor-protection, glossary, and fraud-warning boundaries; do not use to define chart structures. |
| rewrite_batch_05 | lesson_knv2_0167 | low | SEC | filing_or_data_boundary | medium | Use for filing/data-access/disclosure-literacy boundaries; direct prose support needs human confirmation. |

## Boundary

This source-role table is reviewer-facing scaffolding only. It does not approve sources, create real reviewer notes, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.
