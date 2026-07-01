const { sourceInventory } = require("./education-source-inventory");
const { sourceReviews } = require("./education-source-harvest-engine");

const reviewBySourceId = new Map(sourceReviews.map((review) => [review.sourceId, review]));

const TOPIC_DOMAINS = [
  {
    id: "chart_price_action",
    label: "Chart and price-action reading",
    terms: ["price action", "chart", "candlestick", "candle", "support", "resistance", "trendline", "breakout", "reversal", "ohlc", "ohlcv", "tape reading", "wyckoff", "historical_market_context"],
    minimumSources: 250,
    minimumLearnerFacing: 60,
  },
  {
    id: "indicator_pattern_taxonomy",
    label: "Indicator and pattern taxonomy",
    terms: ["indicator", "technical analysis", "momentum", "volatility", "volume", "moving average", "rsi", "macd", "bollinger", "fibonacci"],
    minimumSources: 250,
    minimumLearnerFacing: 60,
  },
  {
    id: "backtesting_research_hygiene",
    label: "Backtesting and research hygiene",
    terms: ["backtest", "walk forward", "overfitting", "lookahead", "survivorship", "data snooping", "slippage", "transaction cost", "monte carlo"],
    minimumSources: 180,
    minimumLearnerFacing: 40,
  },
  {
    id: "risk_portfolio",
    label: "Risk, drawdown, and portfolio concepts",
    terms: ["risk", "drawdown", "portfolio", "sharpe", "sortino", "position sizing", "allocation", "margin", "exposure", "hedging"],
    minimumSources: 220,
    minimumLearnerFacing: 50,
  },
  {
    id: "psychology_behavior",
    label: "Trading psychology and cognitive bias",
    terms: ["psychology", "behavioral", "bias", "overconfidence", "confirmation", "fomo", "discipline", "emotion", "emotions", "cognitive", "fraud", "scam", "scams", "social media", "gamification", "risk tolerance", "herding", "crowd", "investor behavior", "financial literacy", "financial well-being", "investor education", "investor warnings", "investor alerts", "senior investor", "youth investing", "consumer tools", "investment warnings", "goals"],
    minimumSources: 120,
    minimumLearnerFacing: 20,
  },
  {
    id: "news_sentiment_events",
    label: "News, sentiment, and event context",
    terms: ["news", "sentiment", "event", "headline", "calendar", "filing", "edgar", "gdelt", "earnings", "economic calendar"],
    minimumSources: 180,
    minimumLearnerFacing: 35,
  },
  {
    id: "macro_economic_data",
    label: "Macro and economic data",
    terms: ["fred", "federal reserve", "treasury", "bls", "bea", "cpi", "ppi", "gdp", "employment", "rates", "yield", "world bank", "imf", "oecd", "ecb"],
    minimumSources: 120,
    minimumLearnerFacing: 30,
  },
  {
    id: "market_data_api_boundary",
    label: "Market-data APIs and data-use boundaries",
    terms: ["api", "market data", "data provider", "polygon", "alpha vantage", "tiingo", "finnhub", "twelve data", "nasdaq data", "iex", "redistribution", "terms"],
    minimumSources: 180,
    minimumLearnerFacing: 30,
  },
  {
    id: "exchange_microstructure",
    label: "Exchange, futures, options, and market microstructure",
    terms: ["exchange", "cme", "cboe", "nyse", "nasdaq", "ice", "lme", "futures", "options", "open interest", "order book", "auction", "microstructure"],
    minimumSources: 160,
    minimumLearnerFacing: 30,
  },
  {
    id: "open_source_tooling",
    label: "Open-source tooling and implementation references",
    terms: ["github", "npm", "python", "javascript", "typescript", "library", "framework", "package", "repository", "awesome"],
    minimumSources: 2000,
    minimumLearnerFacing: 300,
  },
];

function sourceText(source) {
  return [
    source.name,
    source.url,
    source.sourceType,
    source.domain,
    source.extractionTarget,
    source.notes,
  ].join(" ").toLowerCase();
}

function normalizedUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/+$/, "")}`;
  } catch {
    return String(url || "").trim().toLowerCase();
  }
}

function hostFor(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function classifySource(source) {
  const text = sourceText(source);
  const matched = TOPIC_DOMAINS
    .filter((domain) => domain.terms.some((term) => text.includes(term)))
    .map((domain) => domain.id);
  if (matched.length) return matched;
  if (["official-docs", "exchange-docs", "data-provider-docs", "education-reference"].includes(source.sourceType)) {
    return ["market_data_api_boundary"];
  }
  return ["unclassified_review_needed"];
}

const normalizedUrlCounts = new Map();
for (const source of sourceInventory) {
  const key = normalizedUrl(source.url);
  normalizedUrlCounts.set(key, (normalizedUrlCounts.get(key) || 0) + 1);
}

const sourceTopicAssignments = sourceInventory.map((source) => {
  const review = reviewBySourceId.get(source.id);
  const topics = classifySource(source);
  return {
    sourceId: source.id,
    name: source.name,
    url: source.url,
    host: hostFor(source.url),
    sourceType: source.sourceType,
    reliabilityGrade: source.reliabilityGrade,
    status: source.status,
    allowedForTaxonomy: Boolean(review?.allowedForTaxonomy),
    allowedForLearnerFacing: Boolean(review?.allowedForLearnerFacing),
    topics,
    duplicateNormalizedUrlCount: normalizedUrlCounts.get(normalizedUrl(source.url)) || 1,
  };
});

function summarizeDomain(domain) {
  const matching = sourceTopicAssignments.filter((assignment) => assignment.topics.includes(domain.id));
  const hosts = new Set(matching.map((assignment) => assignment.host));
  const learnerFacing = matching.filter((assignment) => assignment.allowedForLearnerFacing);
  const taxonomyAllowed = matching.filter((assignment) => assignment.allowedForTaxonomy);
  const researchOnly = matching.filter((assignment) => assignment.status === "research_only");
  const tierSOrA = matching.filter((assignment) => ["S", "A"].includes(assignment.reliabilityGrade));
  return {
    id: domain.id,
    label: domain.label,
    totalSources: matching.length,
    uniqueHosts: hosts.size,
    taxonomyAllowedSources: taxonomyAllowed.length,
    learnerFacingAllowedSources: learnerFacing.length,
    researchOnlySources: researchOnly.length,
    tierSOrASources: tierSOrA.length,
    minimumSources: domain.minimumSources,
    minimumLearnerFacing: domain.minimumLearnerFacing,
    sourceGap: Math.max(0, domain.minimumSources - matching.length),
    learnerFacingGap: Math.max(0, domain.minimumLearnerFacing - learnerFacing.length),
    sampleSourceIds: matching.slice(0, 8).map((assignment) => assignment.sourceId),
  };
}

const topicCoverage = TOPIC_DOMAINS.map(summarizeDomain);
const unclassifiedAssignments = sourceTopicAssignments.filter((assignment) => assignment.topics.includes("unclassified_review_needed"));
const duplicateUrlAssignments = sourceTopicAssignments.filter((assignment) => assignment.duplicateNormalizedUrlCount > 1);
const duplicatePromotedAssignments = duplicateUrlAssignments.filter((assignment) => assignment.allowedForLearnerFacing);
const learnerFacingCountsByNormalizedUrl = new Map();
for (const assignment of sourceTopicAssignments) {
  if (!assignment.allowedForLearnerFacing) continue;
  const key = normalizedUrl(assignment.url);
  learnerFacingCountsByNormalizedUrl.set(key, (learnerFacingCountsByNormalizedUrl.get(key) || 0) + 1);
}
const learnerFacingDuplicateGroups = [...learnerFacingCountsByNormalizedUrl.values()].filter((count) => count > 1);

const sourceTopicCoverageReport = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  totalSources: sourceInventory.length,
  reviewedSources: sourceReviews.length,
  domains: topicCoverage.length,
  domainsMeetingSourceMinimum: topicCoverage.filter((domain) => domain.sourceGap === 0).length,
  domainsMeetingLearnerFacingMinimum: topicCoverage.filter((domain) => domain.learnerFacingGap === 0).length,
  unclassifiedSources: unclassifiedAssignments.length,
  duplicateNormalizedUrls: duplicateUrlAssignments.length,
  duplicateLearnerFacingUrls: duplicatePromotedAssignments.length,
  duplicateLearnerFacingGroups: learnerFacingDuplicateGroups.length,
  topicCoverage,
  weakestDomains: topicCoverage
    .filter((domain) => domain.sourceGap > 0 || domain.learnerFacingGap > 0)
    .sort((a, b) => (b.sourceGap + b.learnerFacingGap) - (a.sourceGap + a.learnerFacingGap))
    .slice(0, 5)
    .map((domain) => ({
      id: domain.id,
      sourceGap: domain.sourceGap,
      learnerFacingGap: domain.learnerFacingGap,
    })),
  boundary: "Topic coverage is source metadata review only. It does not approve content reuse, trading advice, signals, broker workflows, auto-trading, performance claims, or real-money guidance.",
};

module.exports = {
  TOPIC_DOMAINS,
  sourceTopicAssignments,
  sourceTopicCoverageReport,
};
