const { sourceInventory } = require("./education-source-inventory");
const { conceptCandidates } = require("./education-concept-candidates");
const { patternTaxonomy } = require("./education-pattern-taxonomy");
const { openSourceProjectReviews } = require("./education-open-source-projects");
const { backtestMistakeCandidates } = require("./education-backtest-mistakes");
const { newsSentimentConcepts } = require("./education-news-sentiment-concepts");
const { dataBoundaryRules } = require("./education-data-boundary-rules");
const { educationGlossaryCandidates } = require("./education-glossary-candidates");
const { riskPsychologyCandidates } = require("./education-risk-psychology-candidates");

function hasReviewedLowRiskUse(source) {
  if (source.status === "research_only") return false;
  if (["green_official_public_domain", "green_public_domain_classic"].includes(source.sourceUseTier)) return true;
  return /public[-_]domain|us-federal-public-domain|CC0|Unlicense|MIT|Apache|BSD|ISC|MPL/i.test(source.license || "");
}

const sourceReviews = sourceInventory.map((source, index) => {
  const clearLicense = hasReviewedLowRiskUse(source);
  const allowedForTaxonomy = ["S", "A", "B"].includes(source.reliabilityGrade) && source.status !== "research_only";
  const allowedForLearnerFacing = allowedForTaxonomy && clearLicense;
  return {
    id: `sr_${String(index + 1).padStart(3, "0")}`,
    sourceId: source.id,
    licenseStatus: clearLicense ? "reviewed-for-taxonomy" : "requires-human-review",
    termsRisk: source.sourceType.includes("terms") || source.sourceType.includes("search") ? "high" : "medium",
    contentUseRisk: allowedForLearnerFacing ? "low-after-original-rewrite" : "medium-to-high",
    dataUseRisk: source.sourceType.includes("data") || source.sourceType.includes("exchange") ? "high" : "medium",
    commercialUseRisk: allowedForLearnerFacing ? "medium" : "high",
    allowedForTaxonomy,
    allowedForLearnerFacing,
    requiresHumanReview: true,
    whatCanBeUsed: source.allowedUse,
    whatCannotBeUsed: source.disallowedUse,
  };
});

const sourceHarvest = {
  meta: {
    name: "TradeGym公开素材采集与蒸馏底座",
    educationOnly: true,
    productionReady: false,
    boundary: "This harvest layer stores source inventory and taxonomy candidates only. It is not learner-facing course content and not market data authorization.",
  },
  sourceInventory,
  sourceReviews,
  conceptCandidates,
  patternTaxonomy,
  openSourceProjectReviews,
  backtestMistakeCandidates,
  newsSentimentConcepts,
  dataBoundaryRules,
  educationGlossaryCandidates,
  riskPsychologyCandidates,
};

module.exports = {
  sourceHarvest,
  sourceInventory,
  sourceReviews,
  conceptCandidates,
  patternTaxonomy,
  openSourceProjectReviews,
  backtestMistakeCandidates,
  newsSentimentConcepts,
  dataBoundaryRules,
  educationGlossaryCandidates,
  riskPsychologyCandidates,
};
