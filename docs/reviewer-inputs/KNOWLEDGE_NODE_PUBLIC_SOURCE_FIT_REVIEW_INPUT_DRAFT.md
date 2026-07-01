# Knowledge Node Public Source-Fit Review Input Draft

- Input status: blank_node_public_source_fit_review_input_ready_for_human
- Candidate target nodes: 273
- Review rows: 1638
- Ready rows: 0
- Blocked rows: 1638
- Real human input entries: 0
- Write allowed now: false

## Reviewer Instructions

- Fill `reviewerDecision` with one of: `accept_for_node_source_fit`, `reject_for_node_source_fit`, `background_only`.
- Fill `sourceFitNotes`, `citationUse`, `reviewerName`, and `reviewedAt` for every row.
- Keep `learnerCitationApproved:false` unless a separate release approval gate explicitly allows it.
- Keep `copiedTextApproved:false`; accepted sources support original rewriting, not copied text.

## Sample Rows

- knv2_0003::corpus_1584: K线与价格行为 / 单根K线误区 -> Wikipedia: Candlestick chart
- knv2_0003::corpus_0301: K线与价格行为 / 单根K线误区 -> Do VLMs Truly "Read" Candlesticks? A Multi-Scale Benchmark for Visual Stock Price Forecasting
- knv2_0003::corpus_0406: K线与价格行为 / 单根K线误区 -> Wikipedia: Candlestick pattern
- knv2_0003::corpus_0409: K线与价格行为 / 单根K线误区 -> Wikipedia: Chart pattern
- knv2_0003::corpus_0407: K线与价格行为 / 单根K线误区 -> Wikipedia: Doji
- knv2_0003::corpus_1115: K线与价格行为 / 单根K线误区 -> Wikipedia: Gap (chart pattern)
- knv2_0015::corpus_1584: K线与价格行为 / 组合K线 -> Wikipedia: Candlestick chart
- knv2_0015::corpus_0301: K线与价格行为 / 组合K线 -> Do VLMs Truly "Read" Candlesticks? A Multi-Scale Benchmark for Visual Stock Price Forecasting
- knv2_0015::corpus_0406: K线与价格行为 / 组合K线 -> Wikipedia: Candlestick pattern
- knv2_0015::corpus_0409: K线与价格行为 / 组合K线 -> Wikipedia: Chart pattern
- knv2_0015::corpus_0407: K线与价格行为 / 组合K线 -> Wikipedia: Doji
- knv2_0015::corpus_1115: K线与价格行为 / 组合K线 -> Wikipedia: Gap (chart pattern)
- knv2_0027::corpus_1584: K线与价格行为 / 流动性扫过 -> Wikipedia: Candlestick chart
- knv2_0027::corpus_0301: K线与价格行为 / 流动性扫过 -> Do VLMs Truly "Read" Candlesticks? A Multi-Scale Benchmark for Visual Stock Price Forecasting
- knv2_0027::corpus_0406: K线与价格行为 / 流动性扫过 -> Wikipedia: Candlestick pattern
- knv2_0027::corpus_0409: K线与价格行为 / 流动性扫过 -> Wikipedia: Chart pattern
- knv2_0027::corpus_0407: K线与价格行为 / 流动性扫过 -> Wikipedia: Doji
- knv2_0027::corpus_1115: K线与价格行为 / 流动性扫过 -> Wikipedia: Gap (chart pattern)
- knv2_0039::corpus_1584: K线与价格行为 / 形态语境 -> Wikipedia: Candlestick chart
- knv2_0039::corpus_0301: K线与价格行为 / 形态语境 -> Do VLMs Truly "Read" Candlesticks? A Multi-Scale Benchmark for Visual Stock Price Forecasting

## Boundary

Node public source-fit review input is reviewer-facing education-only governance. It does not approve copied text, learner-facing citations, stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.
