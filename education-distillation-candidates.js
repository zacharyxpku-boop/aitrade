const { conceptClusters } = require("./education-concept-clusters");
const { conceptCandidates } = require("./education-concept-candidates");
const { patternTaxonomy } = require("./education-pattern-taxonomy");
const { sourceInventory, sourceReviews } = require("./education-source-harvest-engine");

const sourceById = new Map(sourceInventory.map((source) => [source.id, source]));
const reviewBySourceId = new Map(sourceReviews.map((review) => [review.sourceId, review]));
const officiallyGroundedConcepts = conceptCandidates.filter((concept) => {
  const source = sourceById.get(concept.sourceId);
  const review = reviewBySourceId.get(concept.sourceId);
  return Boolean(
    source &&
    review &&
    review.allowedForLearnerFacing &&
    source.status !== "research_only" &&
    ["official-docs", "exchange-docs", "education-reference"].includes(source.sourceType)
  );
});

const officialConceptsBySource = new Map();
for (const concept of officiallyGroundedConcepts) {
  if (!officialConceptsBySource.has(concept.sourceId)) officialConceptsBySource.set(concept.sourceId, concept);
}
const uniqueSourceOfficialConcepts = [...officialConceptsBySource.values()];

// Category-aware pairing: map each curriculum module to the concept category
// that teaches the same domain, so official source refs are topically relevant
// instead of purely positional.
const moduleToConceptCategory = {
  图表阅读基础: "chart_reading",
  市场结构: "trend",
  "K线与价格行为": "chart_reading",
  趋势: "trend",
  突破: "breakout",
  交易区间: "range",
  反转: "reversal",
  多周期分析: "timeframe",
  "新闻/情绪/事件偏见": "news_sentiment",
  回测误区: "backtest",
  风险管理: "psychology_risk",
  交易心理: "psychology_risk",
};

const officialConceptsByCategory = new Map();
for (const concept of uniqueSourceOfficialConcepts) {
  if (!officialConceptsByCategory.has(concept.category)) officialConceptsByCategory.set(concept.category, []);
  officialConceptsByCategory.get(concept.category).push(concept);
}

function officialPicksFor(module, index) {
  const category = moduleToConceptCategory[module];
  const categoryPool = officialConceptsByCategory.get(category) || [];
  const pool = categoryPool.length >= 2 ? categoryPool : uniqueSourceOfficialConcepts;
  if (pool.length >= 2) {
    return [pool[index % pool.length], pool[(index + 1) % pool.length]];
  }
  return pool.slice(0, 1);
}

const distillationCandidates = Array.from({ length: 5000 }, (_, index) => {
  const cluster = conceptClusters[index % conceptClusters.length];
  const conceptA = conceptCandidates[(index * 5) % conceptCandidates.length];
  const conceptB = conceptCandidates[(index * 5 + 23) % conceptCandidates.length];
  const officialPicks = officialPicksFor(cluster.module, index);
  const pattern = patternTaxonomy[index % patternTaxonomy.length];
  const lowRisk = conceptA.learnerFacingAllowed && conceptB.learnerFacingAllowed;
  const baseIds = [conceptA.id, conceptB.id];
  const officialIds = officialPicks.map((concept) => concept.id).filter((id) => !baseIds.includes(id));
  return {
    id: `dc_${String(index + 1).padStart(5, "0")}`,
    clusterId: cluster.id,
    module: cluster.module,
    topic: cluster.topic,
    conceptCandidateIds: [...baseIds, ...officialIds],
    patternTaxonomyIds: [pattern.id],
    distillationUse: "Turn candidate labels into original education language with examples, anti-examples, and rubric draft.",
    sourceRisk: lowRisk ? "low" : "review_required",
    originalExpressionRequired: true,
    learnerFacingAllowed: lowRisk,
    licenseBoundary: lowRisk
      ? "Low-risk taxonomy cues only; learner-facing text must still be original."
      : "Draft only until source, license, and terms are reviewed.",
    qualitySignals: [
      "has cluster",
      "has two concept candidates",
      "has pattern taxonomy link",
      "requires original expression",
    ],
    boundaryNote: "Distillation candidates are internal curriculum material and do not provide action guidance.",
  };
});

module.exports = {
  distillationCandidates,
};
