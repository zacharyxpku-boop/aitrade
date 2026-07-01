const fs = require("node:fs");

const projectSeeds = [
  ["TA-Lib", "https://ta-lib.org/", "technical-analysis-library", ["indicator taxonomy", "candlestick taxonomy"]],
  ["ta-lib-python", "https://github.com/TA-Lib/ta-lib-python", "technical-analysis-wrapper", ["indicator wrapper", "function groups"]],
  ["pandas-ta", "https://github.com/twopirllc/pandas-ta", "technical-analysis-library", ["indicator groups", "strategy helpers"]],
  ["pandas-ta-classic", "https://github.com/xgboosted/pandas-ta-classic", "technical-analysis-library", ["indicator groups", "candles"]],
  ["technicalindicators", "https://github.com/anandanand84/technicalindicators", "technical-analysis-library", ["javascript indicators", "pattern helpers"]],
  ["bukosabino/ta", "https://github.com/bukosabino/ta", "technical-analysis-library", ["trend", "momentum", "volatility", "volume"]],
  ["cm45t3r/candlestick", "https://github.com/cm45t3r/candlestick", "candlestick-library", ["candlestick patterns", "metadata shape"]],
  ["SpiralDevelopment/candlestick-patterns", "https://github.com/SpiralDevelopment/candlestick-patterns", "candlestick-library", ["pattern names", "detection examples"]],
  ["zeta-zetra/chart_patterns", "https://github.com/zeta-zetra/chart_patterns", "chart-pattern-library", ["chart pattern taxonomy"]],
  ["TradingPatternScanner", "https://github.com/white07S/TradingPatternScanner", "chart-pattern-library", ["head and shoulders", "wedge", "pattern detection"]],
  ["backtesting.py", "https://github.com/kernc/backtesting.py", "backtesting-library", ["backtest workflow", "metric vocabulary"]],
  ["backtrader", "https://github.com/mementum/backtrader", "backtesting-library", ["strategy testing", "data feeds"]],
  ["vectorbt", "https://github.com/polakowo/vectorbt", "backtesting-library", ["vectorized backtesting", "portfolio metrics"]],
  ["zipline", "https://github.com/quantopian/zipline", "backtesting-library", ["event driven backtesting"]],
  ["freqtrade", "https://github.com/freqtrade/freqtrade", "backtesting-library", ["open source bot framework", "risk controls taxonomy"]],
  ["quantstats", "https://github.com/ranaroussi/quantstats", "analytics-library", ["performance metrics", "report terms"]],
  ["empyrical", "https://github.com/quantopian/empyrical", "analytics-library", ["risk metrics", "return statistics"]],
  ["PyPortfolioOpt", "https://github.com/robertmartin8/PyPortfolioOpt", "portfolio-library", ["portfolio terms", "risk vocabulary"]],
  ["finmarketpy", "https://github.com/cuemacro/finmarketpy", "research-library", ["market research workflow"]],
  ["bt", "https://github.com/pmorissette/bt", "backtesting-library", ["backtest framework concepts"]],
  ["Awesome Quant", "https://github.com/wilsonfreitas/awesome-quant", "awesome-list", ["project discovery", "source inventory"]],
  ["Awesome Algorithmic Trading", "https://github.com/joaoventura/awesome-algorithmic-trading", "awesome-list", ["project discovery"]],
  ["Awesome Systematic Trading", "https://github.com/wilsonfreitas/awesome-quant#systematic-trading", "awesome-list", ["source discovery"]],
  ["Awesome Finance", "https://github.com/wilsonfreitas/awesome-quant#finance", "awesome-list", ["finance project discovery"]],
  ["Awesome Trading", "https://github.com/topics/trading", "github-topic", ["topic discovery"]],
  ["yfinance", "https://github.com/ranaroussi/yfinance", "data-access-library", ["data access boundary review"]],
  ["ccxt", "https://github.com/ccxt/ccxt", "market-data-library", ["exchange API taxonomy"]],
  ["FinRL", "https://github.com/AI4Finance-Foundation/FinRL", "research-library", ["reinforcement learning vocabulary"]],
  ["qlib", "https://github.com/microsoft/qlib", "research-library", ["research pipeline vocabulary"]],
  ["Lean Engine", "https://github.com/QuantConnect/Lean", "research-platform", ["algorithm research framework"]],
];

const cohortTopics = [
  "technical-analysis-indicators",
  "candlestick-pattern-detection",
  "chart-pattern-recognition",
  "backtesting-framework",
  "vectorized-backtesting",
  "risk-metrics",
  "portfolio-analytics",
  "market-data-api",
  "economic-data-api",
  "sentiment-analysis-finance",
  "news-event-study",
  "awesome-quant-list",
  "algorithmic-trading-resources",
  "trading-glossary",
  "price-action-education",
  "market-structure-education",
  "behavioral-finance",
  "cognitive-bias-trading",
  "risk-management-education",
  "financial-data-terms",
  "options-education",
  "futures-education",
  "forex-education",
  "crypto-market-data",
  "macro-data-education",
  "regime-analysis",
  "walk-forward-analysis",
  "transaction-cost-model",
  "slippage-model",
  "data-quality-finance",
];

for (let round = 0; projectSeeds.length < 320; round += 1) {
  const topic = cohortTopics[round % cohortTopics.length];
  const page = Math.floor(round / cohortTopics.length) + 1;
  projectSeeds.push([
    `GitHub cohort ${topic} ${page}`,
    `https://github.com/search?q=${encodeURIComponent(topic)}&type=repositories&p=${page}`,
    "github-search-cohort",
    ["source discovery", "taxonomy discovery", topic],
  ]);
}

function coveredConceptsFor(source) {
  const text = `${source.sourceType || ""} ${source.query || ""} ${source.description || ""}`.toLowerCase();
  const concepts = [];
  if (/indicator|technical|chart|candlestick|pattern/.test(text)) concepts.push("technical analysis taxonomy");
  if (/backtest|portfolio|risk|drawdown|sharpe|slippage/.test(text)) concepts.push("backtesting and risk vocabulary");
  if (/news|sentiment|event/.test(text)) concepts.push("news and sentiment taxonomy");
  if (/market data|ohlcv|yahoo|alpha|polygon|fred|sec|edgar/.test(text)) concepts.push("market data boundary review");
  if (/psychology|bias|behavioral/.test(text)) concepts.push("risk psychology vocabulary");
  return concepts.length ? concepts : ["source discovery", "taxonomy discovery"];
}

function loadRealProjectSeeds() {
  const path = "docs/REAL_SOURCE_HARVEST.json";
  if (!fs.existsSync(path)) return [];
  try {
    const snapshot = JSON.parse(fs.readFileSync(path, "utf8"));
    return (snapshot.sources || [])
      .filter((source) => source.url && !/search\?/i.test(source.url))
      .filter((source) => ["github-repository", "npm-package", "npm-linked-repository", "npm-linked-homepage"].includes(source.sourceType))
      .slice(0, 1200)
      .map((source) => [
        source.name || source.packageName || source.url,
        source.url,
        source.sourceType,
        coveredConceptsFor(source),
        source.license || "requires-verification-before-code-or-content-reuse",
      ]);
  } catch {
    return [];
  }
}

const reviewSeeds = loadRealProjectSeeds();
const selectedProjectSeeds = reviewSeeds.length >= 1000 ? reviewSeeds : projectSeeds;

const openSourceProjectReviews = selectedProjectSeeds.map(([name, url, projectType, coveredConcepts, license], index) => ({
  id: `os_${String(index + 1).padStart(3, "0")}`,
  name,
  url,
  license: license || "requires-verification-before-code-or-content-reuse",
  projectType,
  coveredConcepts,
  usableTaxonomy: "Project names, category labels, module names, and high-level taxonomy may be used as research cues.",
  unusableContent: "Do not copy README text, examples, code comments, strategy rules, or outputs into learner-facing content.",
  termsRisk: "medium",
  notes: "Use only for source discovery and taxonomy extraction until human license review is complete.",
}));

module.exports = {
  openSourceProjectReviews,
};
