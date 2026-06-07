const crypto = require("node:crypto");
const { config } = require("./config");

function providerStatus() {
  return {
    provider: config.knowledgeDistiller.provider,
    mode: config.knowledgeDistiller.provider === "rule-based" ? "deterministic-template" : "external",
    humanReviewRequired: true,
    productionNote: config.knowledgeDistiller.provider === "rule-based"
      ? "Rule-based distillation extracts draft knowledge points for curriculum review."
      : "External distillation must be checked for copyright, hallucination, pedagogy, and compliance.",
  };
}

function classifyText(text) {
  const source = String(text || "").toLowerCase();
  if (/risk|stop|loss|invalidation|止损|失效|仓位|风控/.test(source)) return "risk-discipline";
  if (/news|sentiment|event|情绪|消息|事件|热点/.test(source)) return "context-awareness";
  if (/range|breakout|pullback|trend|突破|回踩|区间|趋势/.test(source)) return "price-action";
  return "trading-foundation";
}

function distillKnowledgePoint({ title, sourceText, module = "Price Action" } = {}) {
  const text = String(sourceText || "").trim();
  if (text.length < 24) {
    throw new Error("Course note must be at least 24 characters for distillation");
  }
  const status = providerStatus();
  const concept = classifyText(text);
  const cleanTitle = String(title || "").trim() || `Knowledge: ${concept}`;
  return {
    id: `kp_${crypto.randomUUID()}`,
    title: cleanTitle,
    module,
    concept,
    summary: text.slice(0, 260),
    learningObjective: `Learner can explain ${concept} in their own words before making a simulated decision.`,
    commonMistakes: [
      "Treating a classroom example as a live trading signal",
      "Skipping invalidation conditions",
      "Ignoring risk and position sizing in the written plan",
    ],
    drillIntent: concept === "context-awareness"
      ? "Ask the learner to separate event context from buy/sell decisions."
      : "Ask the learner to name structure, invalidation, and waiting conditions.",
    complianceNote: "Education-only knowledge point. It must not recommend a specific live trade.",
    source: {
      provider: status.provider,
      mode: status.mode,
      isDemo: true,
      humanReviewRequired: true,
    },
    createdAt: new Date().toISOString(),
    status: "draft",
  };
}

module.exports = {
  distillKnowledgePoint,
  providerStatus,
};
