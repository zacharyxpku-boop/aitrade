import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { corpusChunks } = require("../education-corpus-index.js");

// Systematic coverage matrix: domains -> subtopics -> chunk counts.
// This is the "is the knowledge base complete" instrument. Each subtopic has
// keyword probes; a chunk counts toward a subtopic when any probe matches.
// Output: per-cell counts, hole list (below threshold), and a coverage score.
// Education-only instrumentation; not a production-readiness claim.

const MIN_CHUNKS_PER_SUBTOPIC = Number(process.env.COVERAGE_MIN_CHUNKS || 30);

const TAXONOMY = {
  chart_price_action: {
    candlestick_basics: ["candlestick", "doji", "hammer", "engulfing", "wick", "shadow", "real body"],
    chart_patterns: ["head and shoulders", "double top", "double bottom", "triangle", "flag", "wedge", "chart pattern"],
    support_resistance: ["support", "resistance", "key level", "price level"],
    trend_structure: ["trend line", "higher high", "lower low", "swing high", "swing low", "uptrend", "downtrend", "market structure"],
    volume_price: ["volume", "on-balance", "accumulation", "distribution"],
    breakouts_failures: ["breakout", "false breakout", "retest", "failed break"],
    tape_reading_classics: ["tape reading", "ticker", "tape"],
  },
  indicator_pattern_taxonomy: {
    moving_averages: ["moving average", "ema", "sma", "crossover"],
    oscillators: ["rsi", "stochastic", "oscillator", "overbought", "oversold", "macd"],
    volatility_indicators: ["bollinger", "atr", "average true range", "volatility index"],
    indicator_pitfalls: ["lagging", "whipsaw", "divergence", "curve fitting indicator", "indicator limitation"],
  },
  backtesting_research_hygiene: {
    bias_types: ["look-ahead", "survivorship", "data snooping", "selection bias", "p-hacking"],
    overfitting_validation: ["overfitting", "out-of-sample", "walk-forward", "cross-validation", "deflated"],
    performance_metrics: ["sharpe ratio", "sortino", "max drawdown", "information ratio", "profit factor"],
    costs_and_frictions: ["transaction cost", "slippage", "commission", "market impact", "execution cost"],
    data_quality: ["data quality", "missing data", "corporate action", "adjusted price", "point-in-time"],
  },
  risk_portfolio: {
    position_sizing: ["position sizing", "kelly", "bet size", "fixed fraction", "risk per trade"],
    drawdown_recovery: ["drawdown", "recovery", "underwater"],
    risk_measures: ["value at risk", "expected shortfall", "cvar", "tail risk", "risk measure"],
    diversification_mpt: ["diversification", "modern portfolio theory", "efficient frontier", "correlation", "asset allocation"],
    leverage_margin: ["leverage", "margin", "liquidation", "margin call"],
    hedging: ["hedge", "hedging", "protective"],
  },
  psychology_behavior: {
    cognitive_biases: ["confirmation bias", "overconfidence", "anchoring", "recency", "hindsight"],
    loss_emotion: ["loss aversion", "fear", "greed", "regret", "panic", "disposition effect"],
    herd_social: ["herding", "herd behavior", "crowd", "social proof", "fomo"],
    fraud_protection: ["fraud", "scam", "ponzi", "pump and dump", "manipulation"],
    behavioral_theory: ["prospect theory", "behavioral finance", "bounded rationality", "heuristic"],
  },
  news_sentiment_events: {
    sentiment_measurement: ["sentiment analysis", "sentiment index", "investor sentiment", "news sentiment"],
    event_studies: ["event study", "announcement", "abnormal return"],
    emh_anomalies: ["efficient market", "anomaly", "random walk", "predictability"],
    media_effects: ["media", "headline", "social media", "news coverage", "attention"],
  },
  macro_economic_data: {
    inflation_prices: ["inflation", "cpi", "ppi", "deflation", "price index"],
    employment: ["unemployment", "payroll", "jobless", "labor market"],
    monetary_policy: ["monetary policy", "federal reserve", "fomc", "quantitative easing", "central bank"],
    rates_yield_curve: ["interest rate", "yield curve", "treasury yield", "term structure"],
    growth_cycle: ["gdp", "recession", "business cycle", "leading indicator", "pmi"],
  },
  market_data_api_boundary: {
    licensing_terms: ["terms of use", "license", "data license", "agreement"],
    api_access: ["api", "endpoint", "rate limit", "api key"],
    redistribution_rights: ["redistribution", "redistribute", "display data", "non-display"],
    vendors_products: ["data vendor", "data product", "subscription", "data provider", "market data"],
  },
  exchange_microstructure: {
    orders_books: ["order book", "limit order", "market order", "order type", "queue"],
    liquidity_spreads: ["liquidity", "bid-ask", "spread", "depth", "market impact"],
    market_making_hft: ["market maker", "high-frequency", "hft", "latency", "quote"],
    exchanges_clearing: ["exchange", "clearing", "settlement", "listing", "circuit breaker"],
    futures_mechanics: ["futures", "contract", "expiration", "roll", "contango", "backwardation"],
    options_greeks: ["option", "greeks", "delta", "gamma", "theta", "vega", "strike"],
    volatility_products: ["implied volatility", "vix", "variance swap", "volatility surface"],
  },
  open_source_tooling: {
    backtesting_frameworks: ["backtesting framework", "backtrader", "zipline", "vectorbt", "backtesting library"],
    data_libraries: ["pandas", "data pipeline", "data library", "yfinance", "api wrapper"],
    indicator_libraries: ["ta-lib", "technical indicator library", "indicator calculation"],
    ml_quant_tooling: ["machine learning", "deep learning", "neural network", "reinforcement learning", "feature"],
  },
};

function chunkMatches(textLower, probes) {
  return probes.some((probe) => textLower.includes(probe));
}

const matrix = {};
let totalSubtopics = 0;
for (const [domain, subtopics] of Object.entries(TAXONOMY)) {
  matrix[domain] = {};
  for (const subtopic of Object.keys(subtopics)) {
    matrix[domain][subtopic] = 0;
    totalSubtopics += 1;
  }
}

for (const chunk of corpusChunks) {
  if (chunk.qualityTier === "low_noise") continue;
  const lower = chunk.text.toLowerCase();
  for (const [domain, subtopics] of Object.entries(TAXONOMY)) {
    for (const [subtopic, probes] of Object.entries(subtopics)) {
      if (chunkMatches(lower, probes)) matrix[domain][subtopic] += 1;
    }
  }
}

const holes = [];
const cells = [];
for (const [domain, subtopics] of Object.entries(matrix)) {
  for (const [subtopic, count] of Object.entries(subtopics)) {
    cells.push({ domain, subtopic, count });
    if (count < MIN_CHUNKS_PER_SUBTOPIC) holes.push({ domain, subtopic, count, gap: MIN_CHUNKS_PER_SUBTOPIC - count });
  }
}

const covered = cells.filter((cell) => cell.count >= MIN_CHUNKS_PER_SUBTOPIC).length;
const coverageRate = covered / totalSubtopics;

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  subtopics: totalSubtopics,
  minChunksPerSubtopic: MIN_CHUNKS_PER_SUBTOPIC,
  coveredSubtopics: covered,
  coverageRate: Number(coverageRate.toFixed(4)),
  holes: holes.sort((left, right) => left.count - right.count),
  matrix,
  boundary: "Coverage matrix measures evidence breadth for education review. Not a production-readiness or correctness claim.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync("docs/KNOWLEDGE_COVERAGE_MATRIX.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");

const md = [
  "# Knowledge Coverage Matrix",
  "",
  `Systematic completeness instrument: ${totalSubtopics} subtopics across 10 domains; a subtopic counts as covered at >= ${MIN_CHUNKS_PER_SUBTOPIC} quality chunks.`,
  "",
  `- Covered: ${covered}/${totalSubtopics} (${(coverageRate * 100).toFixed(1)}%)`,
  `- Holes: ${holes.length}`,
  "",
  "## Holes (below threshold)",
  "",
  ...(holes.length ? holes.map((hole) => `- ${hole.domain} / ${hole.subtopic}: ${hole.count} chunks (need ${hole.gap} more)`) : ["(none)"]),
  "",
  "## Full Matrix",
  "",
  ...Object.entries(matrix).flatMap(([domain, subtopics]) => [
    `### ${domain}`,
    ...Object.entries(subtopics).map(([subtopic, count]) => `- ${subtopic}: ${count}`),
    "",
  ]),
  "## Boundary",
  "",
  report.boundary,
  "",
].join("\n");
fs.writeFileSync("docs/KNOWLEDGE_COVERAGE_MATRIX.md", md, "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  subtopics: totalSubtopics,
  coveredSubtopics: covered,
  coverageRate: report.coverageRate,
  holeCount: holes.length,
  worstHoles: holes.slice(0, 10),
  outputJson: "docs/KNOWLEDGE_COVERAGE_MATRIX.json",
  outputMd: "docs/KNOWLEDGE_COVERAGE_MATRIX.md",
}, null, 2));
