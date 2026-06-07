const { config } = require("./config");

function providerStatus() {
  return {
    provider: config.questionGenerator.provider,
    mode: config.questionGenerator.provider === "rule-based" ? "deterministic-template" : "external",
    humanReviewRequired: true,
    productionNote: config.questionGenerator.provider === "rule-based"
      ? "Rule-based generation creates draft teaching scenarios for admin review."
      : "External generation must pass compliance, copyright, difficulty, and answer-quality review before publishing.",
  };
}

function generateScenarioDraft({ chartContext, eventContext, knowledgePoint, title, tag } = {}) {
  const status = providerStatus();
  const concept = knowledgePoint?.concept || "invalidation";
  const learningObjective = knowledgePoint?.learningObjective || `Learner can explain ${concept} before making a simulated decision.`;
  const drillIntent = knowledgePoint?.drillIntent || "Ask the learner to name structure, invalidation, and waiting conditions.";
  return {
    id: `draft-${Date.now()}`,
    title: title || `Draft: ${concept} discipline drill`,
    tag: tag || knowledgePoint?.concept || "Price action / Invalidation",
    symbol: chartContext.symbol,
    timeframe: chartContext.timeframe,
    candles: chartContext.candles,
    technical: chartContext.technical,
    news: eventContext.news,
    sentiment: eventContext.sentiment,
    question: `In this teaching scenario, what should a learner practice for ${concept}?`,
    options: [
      "Keep chasing because the first breakout is always valid",
      "Name the invalidation condition and wait for a new structure",
      "Reverse aggressively without a plan",
      "Ignore risk controls because this is only training",
    ],
    answer: 1,
    feedbackTitle: `Practice ${concept} before forcing a trade`,
    feedback: `${learningObjective} ${drillIntent} This is a discipline drill, not a trading signal.`,
    tags: Array.from(new Set(["failed breakout", concept, "patience", "risk discipline"])),
    baseScores: [76, 74, 80],
    nextPath: "Continue failed-breakout drills until the learner can state invalidation, risk, and wait conditions before acting.",
    status: "draft",
    source: {
      provider: status.provider,
      mode: status.mode,
      marketData: chartContext.dataSource,
      news: eventContext.dataSource,
      knowledgePoint: knowledgePoint ? {
        id: knowledgePoint.id,
        title: knowledgePoint.title,
        concept: knowledgePoint.concept,
        provider: knowledgePoint.source?.provider,
      } : null,
      isDemo: true,
      educationOnly: true,
    },
  };
}

module.exports = {
  generateScenarioDraft,
  providerStatus,
};
