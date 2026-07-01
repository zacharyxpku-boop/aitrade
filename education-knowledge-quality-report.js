const { knowledgeNodesV2 } = require("./education-knowledge-nodes-v2");
const { conceptClusters, learningModules } = require("./education-concept-clusters");
const { distillationCandidates } = require("./education-distillation-candidates");

const lowQualityNodes = knowledgeNodesV2.filter((item) => item.qualityScore < 80);
const learnerFacingNodes = knowledgeNodesV2.filter((item) => item.learnerFacingAllowed);
const draftNodes = knowledgeNodesV2.filter((item) => item.reviewStatus === "draft");
const reviewNeededNodes = knowledgeNodesV2.filter((item) => item.reviewStatus !== "approved");

const moduleCoverage = learningModules.map((module) => ({
  module,
  clusters: conceptClusters.filter((item) => item.module === module).length,
  nodes: knowledgeNodesV2.filter((item) => item.module === module).length,
  learnerFacingNodes: learnerFacingNodes.filter((item) => item.module === module).length,
}));

const knowledgeQualityReport = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  conceptClusters: conceptClusters.length,
  distillationCandidates: distillationCandidates.length,
  knowledgeNodesV2: knowledgeNodesV2.length,
  learnerFacingNodes: learnerFacingNodes.length,
  draftNodes: draftNodes.length,
  lowQualityNodes: lowQualityNodes.length,
  reviewNeededNodes: reviewNeededNodes.length,
  moduleCoverage,
  minQualityScore: Math.min(...knowledgeNodesV2.map((item) => item.qualityScore)),
  boundary: "Quality report describes education knowledge readiness only. It is not commercial release approval and not market-data authorization.",
};

module.exports = {
  knowledgeQualityReport,
};
