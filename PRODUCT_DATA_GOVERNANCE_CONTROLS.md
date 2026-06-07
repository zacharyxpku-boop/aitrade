# Data Governance Controls Slice

This slice makes the prototype more honest about what is demo-ready versus production-ready.

Implemented:

- `/api/admin/data-sources` now returns a `controls` array with explicit control status.
- `/api/admin/product-readiness` embeds the same data-governance controls in the `data_governance` readiness area.
- The admin UI now shows control counts and individual control rows in the data-source governance panel.
- Product readiness remains `productionReady:false`.

Current controls:

- `market_data_provider`: production-blocking, currently `gap` in demo mode.
- `news_context_provider`: production-blocking, currently `gap` in demo mode.
- `scenario_source_labels`: checks learner-facing demo/source labeling.
- `content_source_rights_review`: shows whether content sources are demo-approved or licensed-reviewed.
- `audit_tamper_evidence`: tracks local audit seal verification.
- `append_only_audit_storage`: production-blocking, currently `gap`.

Product boundary:

- Historical/demo/synthetic data can support education drills only.
- News and sentiment are context only, not buy/sell signals.
- Backtest and paper-trade metrics are learning diagnostics only, not return forecasts.
- No stock recommendations, live signals, return promises, broker connection, auto-trading, or real-money trading workflow.

Open production gaps:

- Licensed market data provider with attribution and delay/live disclosure.
- Licensed news/event provider with timestamps and source retention.
- Production-cleared content rights evidence for paid course sources.
- Append-only audit storage, retention policy, access logging, key management, and export access audit.
