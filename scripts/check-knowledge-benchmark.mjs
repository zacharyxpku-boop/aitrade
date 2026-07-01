import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { searchChunks } = require("../education-corpus-retrieval.js");
const { corpusIndexReport } = require("../education-corpus-index.js");

// Knowledge-base retrieval benchmark: 50 standard education questions across
// the 10 topic domains. For each question we check whether top-5 retrieval
// returns at least one chunk tagged with the expected domain (hit@5).
// This measures evidence coverage quality. It is not a learner assessment,
// not trading advice, and not a production-readiness claim.

const BENCHMARK = [
  { domain: "chart_price_action", queries: [
    "how to identify support and resistance levels on a price chart",
    "what does a candlestick wick rejection mean",
    "how to read swing highs and swing lows for trend structure",
    "what is a breakout retest in price action",
    "how do chart patterns form and why do they fail",
  ]},
  { domain: "indicator_pattern_taxonomy", queries: [
    "how does a moving average smooth price data",
    "what does RSI overbought mean and what are its limits",
    "MACD signal line crossover interpretation",
    "difference between momentum and trend indicators",
    "why do volatility indicators like bollinger bands expand",
  ]},
  { domain: "backtesting_research_hygiene", queries: [
    "what is backtest overfitting and how to detect it",
    "look-ahead bias in trading strategy research",
    "survivorship bias effect on historical returns",
    "walk-forward validation for trading strategies",
    "why multiple testing inflates sharpe ratios",
  ]},
  { domain: "risk_portfolio", queries: [
    "position sizing and risk per trade",
    "maximum drawdown and recovery analysis",
    "diversification limits in a portfolio",
    "margin requirements and leverage risk",
    "value at risk limitations",
  ]},
  { domain: "psychology_behavior", queries: [
    "loss aversion in investor decisions",
    "overconfidence bias in trading",
    "herding behavior in financial markets",
    "how fraudsters exploit investor emotions",
    "confirmation bias when reviewing trades",
  ]},
  { domain: "news_sentiment_events", queries: [
    "news sentiment analysis for markets",
    "earnings announcement market reaction",
    "event study methodology for price impact",
    "social media sentiment and stock prices",
    "headline overreaction and reversal",
  ]},
  { domain: "macro_economic_data", queries: [
    "how CPI inflation data affects markets",
    "federal reserve monetary policy decisions",
    "unemployment report and payroll data",
    "treasury yield curve inversion meaning",
    "GDP growth data release impact",
  ]},
  { domain: "market_data_api_boundary", queries: [
    "market data API terms of use and redistribution",
    "rate limits on financial data feeds",
    "license requirements for market data",
    "subscription tiers for data products",
    "data vendor usage boundaries",
  ]},
  { domain: "exchange_microstructure", queries: [
    "limit order book depth and liquidity",
    "bid-ask spread and market maker role",
    "futures contract settlement and clearing",
    "opening and closing auction mechanics",
    "options exercise and assignment process",
  ]},
  { domain: "open_source_tooling", queries: [
    "python library for backtesting strategies",
    "open source technical analysis framework",
    "algorithm implementation for indicators",
    "repository structure for trading research code",
    "data pipeline code for market analysis",
  ]},
];

function fail(message) {
  throw new Error(message);
}

const results = [];
for (const group of BENCHMARK) {
  for (const query of group.queries) {
    const hits = searchChunks(query, { limit: 5 });
    const domainHit = hits.some((hit) => hit.domains.includes(group.domain));
    const anyHit = hits.length > 0;
    results.push({
      domain: group.domain,
      query,
      retrieved: hits.length,
      domainHit,
      anyHit,
      topScore: hits[0]?.score || 0,
    });
  }
}

const total = results.length;
const domainHitRate = results.filter((item) => item.domainHit).length / total;
const anyHitRate = results.filter((item) => item.anyHit).length / total;
const perDomain = {};
for (const group of BENCHMARK) {
  const rows = results.filter((item) => item.domain === group.domain);
  perDomain[group.domain] = Number((rows.filter((item) => item.domainHit).length / rows.length).toFixed(2));
}

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  questions: total,
  anyHitRate: Number(anyHitRate.toFixed(4)),
  domainHitRate: Number(domainHitRate.toFixed(4)),
  perDomainHitRate: perDomain,
  retrievalPoolChunks: corpusIndexReport.retrievalPoolChunks,
  qualityTierCounts: corpusIndexReport.qualityTierCounts,
  boundary: "Benchmark measures evidence retrieval coverage for education content review. It is not a trading-performance metric and not a production-readiness claim.",
  weakDomains: Object.entries(perDomain).filter(([, rate]) => rate < 0.8).map(([domain]) => domain),
  results,
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync("docs/KNOWLEDGE_BENCHMARK.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync("docs/KNOWLEDGE_BENCHMARK.md", [
  "# Knowledge Base Retrieval Benchmark",
  "",
  "50 standard education questions across 10 domains; hit@5 = top-5 retrieval returns at least one chunk tagged with the expected domain.",
  "",
  `- Questions: ${total}`,
  `- Any-hit rate: ${(anyHitRate * 100).toFixed(1)}%`,
  `- Domain-hit rate: ${(domainHitRate * 100).toFixed(1)}%`,
  `- Retrieval pool (after quality filter): ${corpusIndexReport.retrievalPoolChunks} chunks`,
  "",
  "## Per-Domain Hit Rate",
  "",
  ...Object.entries(perDomain).map(([domain, rate]) => `- ${domain}: ${(rate * 100).toFixed(0)}%`),
  "",
  `Weak domains (<80%): ${report.weakDomains.join(", ") || "none"}`,
  "",
  "## Boundary",
  "",
  report.boundary,
  "",
].join("\n"), "utf8");

if (anyHitRate < 0.9) fail(`benchmark any-hit rate too low: ${(anyHitRate * 100).toFixed(1)}%`);
if (domainHitRate < 0.6) fail(`benchmark domain-hit rate too low: ${(domainHitRate * 100).toFixed(1)}%`);

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  questions: total,
  anyHitRate: report.anyHitRate,
  domainHitRate: report.domainHitRate,
  weakDomains: report.weakDomains,
  outputJson: "docs/KNOWLEDGE_BENCHMARK.json",
  outputMd: "docs/KNOWLEDGE_BENCHMARK.md",
}, null, 2));
