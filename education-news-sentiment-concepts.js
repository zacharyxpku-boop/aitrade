const newsCategories = ["event_timing", "headline_bias", "sentiment_extreme", "volatility_context", "source_quality", "narrative_risk", "macro_context", "earnings_context"];
const labels = [
  "headline as explanation", "event before price move", "event after price move", "sentiment spike", "fear extreme",
  "greed extreme", "single source bias", "macro release timing", "earnings surprise framing", "central bank wording",
  "inflation data context", "employment data context", "risk-on narrative", "risk-off narrative", "post-event reversal",
  "pre-event volatility", "rumor versus confirmed event", "social sentiment drift", "news lag", "narrative hindsight",
];

const newsSentimentConcepts = Array.from({ length: 1000 }, (_, index) => {
  const label = labels[index % labels.length];
  const category = newsCategories[index % newsCategories.length];
  return {
    id: `nsc_${String(index + 1).padStart(3, "0")}`,
    label: `${label} ${Math.floor(index / labels.length) + 1}`,
    category,
    description: `This concept uses ${label} as historical context for education review.`,
    educationUse: "Help learners separate background information from chart-reading evidence and cognitive bias.",
    biasRisk: "Learners may retrofit a story after the move or treat a headline as sufficient explanation.",
    boundaryNote: "News and sentiment concepts are background and bias checks only; they are not action reasons.",
  };
});

module.exports = {
  newsSentimentConcepts,
};
