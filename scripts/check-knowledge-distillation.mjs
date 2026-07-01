import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { conceptClusters, learningModules } = require("../education-concept-clusters.js");
const { distillationCandidates } = require("../education-distillation-candidates.js");
const { knowledgeNodesV2 } = require("../education-knowledge-nodes-v2.js");
const { knowledgeQualityReport } = require("../education-knowledge-quality-report.js");
const { conceptCandidates } = require("../education-concept-candidates.js");
const { patternTaxonomy } = require("../education-pattern-taxonomy.js");
const { mistakeTags } = require("../education-mistake-tags.js");
const { rubrics } = require("../education-rubrics.js");
const { trainingScenarios } = require("../education-training-scenarios.js");
const { distillationRules } = require("../education-distillation-rules.js");

const forbidden = ["推荐买入", "推荐卖出", "保证收益", "胜率承诺", "实盘信号", "自动下单", "接入券商", "真实资金建议"];

function fail(message) {
  throw new Error(message);
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return typeof value === "string" ? value.trim().length > 0 : value != null;
}

function requireCount(label, items, minimum) {
  if (!Array.isArray(items) || items.length < minimum) fail(`${label} expected >= ${minimum}, got ${items?.length ?? "not-array"}`);
}

function requireFields(label, item, fields) {
  const missing = fields.filter((field) => !hasValue(item[field]));
  if (missing.length) fail(`${label} ${item.id || item.title} missing fields: ${missing.join(", ")}`);
}

function requireNoForbidden(label, value) {
  const text = JSON.stringify(value);
  const found = forbidden.filter((word) => text.includes(word));
  if (found.length) fail(`${label} contains forbidden terms: ${found.join(", ")}`);
}

const nodeFields = [
  "id", "title", "module", "topic", "difficulty", "difficultyStage", "sourceClusterIds", "conceptCandidateIds",
  "patternTaxonomyIds", "definition", "principle", "whyItMatters", "howToRead", "multiTimeframeView",
  "commonMistakes", "antiExamples", "practicePrompt", "rubricDraft", "mistakeTagIds", "rubricIds",
  "trainingScenarioDraftIds", "nextNodeIds", "prerequisiteNodeIds", "sourceBoundary", "licenseBoundary",
  "learnerFacingAllowed", "qualityScore", "reviewStatus", "boundaryNote",
];

requireNoForbidden("knowledge distillation", { conceptClusters, distillationCandidates, knowledgeNodesV2, knowledgeQualityReport, distillationRules });
requireCount("ConceptCluster", conceptClusters, 3000);
requireCount("DistillationCandidate", distillationCandidates, 5000);
requireCount("KnowledgeNodeV2", knowledgeNodesV2, 1500);
requireCount("DistillationRule", distillationRules, 5);

const clusterIds = new Set(conceptClusters.map((item) => item.id));
const conceptIds = new Set(conceptCandidates.map((item) => item.id));
const patternIds = new Set(patternTaxonomy.map((item) => item.id));
const mistakeIds = new Set(mistakeTags.map((item) => item.id));
const rubricIds = new Set(rubrics.map((item) => item.id));
const scenarioIds = new Set(trainingScenarios.map((item) => item.id));
const nodeIds = new Set(knowledgeNodesV2.map((item) => item.id));

for (const module of learningModules) {
  if (!knowledgeNodesV2.some((item) => item.module === module)) fail(`missing module coverage: ${module}`);
}

for (const cluster of conceptClusters) {
  requireFields("ConceptCluster", cluster, ["id", "module", "topic", "title", "conceptCandidateIds", "patternTaxonomyIds", "teachingIntent", "riskBoundary", "learnerFacingAllowed"]);
  if (!cluster.conceptCandidateIds.some((id) => conceptIds.has(id))) fail(`ConceptCluster ${cluster.id} has no valid ConceptCandidate`);
}

for (const candidate of distillationCandidates) {
  requireFields("DistillationCandidate", candidate, ["id", "clusterId", "module", "topic", "conceptCandidateIds", "patternTaxonomyIds", "distillationUse", "sourceRisk", "originalExpressionRequired", "learnerFacingAllowed", "licenseBoundary", "qualitySignals", "boundaryNote"]);
  if (!clusterIds.has(candidate.clusterId)) fail(`DistillationCandidate ${candidate.id} invalid clusterId`);
}

for (const node of knowledgeNodesV2) {
  requireFields("KnowledgeNodeV2", node, nodeFields);
  if (!node.sourceClusterIds.some((id) => clusterIds.has(id))) fail(`KnowledgeNodeV2 ${node.id} has no valid ConceptCluster`);
  if (node.conceptCandidateIds.filter((id) => conceptIds.has(id)).length < 2) fail(`KnowledgeNodeV2 ${node.id} needs at least two valid ConceptCandidate links`);
  if (!node.patternTaxonomyIds.some((id) => patternIds.has(id))) fail(`KnowledgeNodeV2 ${node.id} has no valid PatternTaxonomy`);
  if (!node.mistakeTagIds.some((id) => mistakeIds.has(id))) fail(`KnowledgeNodeV2 ${node.id} has no valid MistakeTag`);
  if (!node.rubricIds.some((id) => rubricIds.has(id))) fail(`KnowledgeNodeV2 ${node.id} has no valid Rubric`);
  if (!node.trainingScenarioDraftIds.some((id) => scenarioIds.has(id))) fail(`KnowledgeNodeV2 ${node.id} has no valid TrainingScenario draft`);
  if (!node.nextNodeIds.some((id) => nodeIds.has(id))) fail(`KnowledgeNodeV2 ${node.id} has no valid nextNodeIds`);
  if (!node.prerequisiteNodeIds.some((id) => nodeIds.has(id))) fail(`KnowledgeNodeV2 ${node.id} has no valid prerequisiteNodeIds`);
  if (node.qualityScore < 80) fail(`KnowledgeNodeV2 ${node.id} low qualityScore ${node.qualityScore}`);
  if (node.learnerFacingAllowed && !/original|low-risk/i.test(`${node.sourceBoundary} ${node.licenseBoundary}`)) {
    fail(`KnowledgeNodeV2 ${node.id} learnerFacingAllowed without low-risk or original marker`);
  }
}

if (knowledgeQualityReport.knowledgeNodesV2 !== knowledgeNodesV2.length) fail("quality report node count mismatch");
if (knowledgeQualityReport.lowQualityNodes !== 0) fail("quality report has low quality nodes");

console.log(JSON.stringify({
  ok: true,
  productionReady: false,
  educationOnly: true,
  conceptClusters: conceptClusters.length,
  distillationCandidates: distillationCandidates.length,
  knowledgeNodesV2: knowledgeNodesV2.length,
  learnerFacingNodes: knowledgeQualityReport.learnerFacingNodes,
  draftNodes: knowledgeQualityReport.draftNodes,
  reviewNeededNodes: knowledgeQualityReport.reviewNeededNodes,
  lowQualityNodes: knowledgeQualityReport.lowQualityNodes,
  modules: learningModules.length,
  minQualityScore: knowledgeQualityReport.minQualityScore,
}, null, 2));
