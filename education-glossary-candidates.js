const glossaryDomains = [
  "price_action", "market_structure", "indicator", "candlestick", "chart_pattern", "multi_timeframe",
  "market_data", "news_event", "macro_context", "risk", "backtest", "portfolio", "behavioral_finance",
  "execution_assumption", "data_quality", "learning_process", "case_review", "source_rights", "sentiment",
  "volatility",
];

const glossaryTerms = [
  "support zone", "resistance zone", "trend", "range", "breakout", "false breakout", "retest", "pullback",
  "reversal", "exhaustion", "compression", "expansion", "volatility", "liquidity sweep", "close confirmation",
  "higher high", "higher low", "lower high", "lower low", "structure shift", "event context", "headline bias",
  "sentiment extreme", "future leakage", "sample size", "drawdown", "transaction cost", "slippage", "spread",
  "data license", "display right", "delayed data", "source attribution", "human review", "learning rubric",
  "mistake tag", "case narrative", "boundary disclosure", "taxonomy cue", "research only",
];

const educationGlossaryCandidates = Array.from({ length: 10000 }, (_, index) => {
  const domain = glossaryDomains[index % glossaryDomains.length];
  const term = glossaryTerms[Math.floor(index / glossaryDomains.length) % glossaryTerms.length];
  return {
    id: `egc_${String(index + 1).padStart(5, "0")}`,
    term: `${term} ${Math.floor(index / (glossaryDomains.length * glossaryTerms.length)) + 1}`,
    normalizedTerm: `${domain}.${term.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    domain,
    sourceClass: index % 4 === 0 ? "official_or_terms" : index % 4 === 1 ? "github_taxonomy" : index % 4 === 2 ? "public_education" : "original_framework",
    educationUse: "Candidate glossary entry for original education explanation after source and license review.",
    learnerFacingAllowed: false,
    licenseBoundary: "Candidate only; do not publish until source review and original rewrite are complete.",
    boundaryNote: "Glossary candidates are not action guidance and not market data authorization.",
  };
});

module.exports = {
  educationGlossaryCandidates,
};
