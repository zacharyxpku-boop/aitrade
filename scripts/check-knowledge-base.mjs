import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  knowledgeEngine,
  domains,
  knowledgeNodes,
  marketCases,
  trainingScenarios,
  mistakeTags,
  rubrics,
  sourceReviews,
  learningPathEdges,
} = require("../education-knowledge-engine.js");

const requiredDomains = [
  "图表阅读基础",
  "市场结构",
  "K线与价格行为",
  "趋势",
  "突破",
  "交易区间",
  "反转",
  "多周期分析",
  "新闻/情绪/事件偏见",
  "回测与交易心理误区",
];

const nodeFields = [
  "id",
  "title",
  "module",
  "topic",
  "difficulty",
  "difficultyStage",
  "definition",
  "principle",
  "whyItMatters",
  "whenItAppears",
  "howToRead",
  "multiTimeframeView",
  "commonMistakes",
  "antiExamples",
  "relatedCaseIds",
  "practiceTaskIds",
  "rubricIds",
  "mistakeTagIds",
  "prerequisiteNodeIds",
  "nextNodeIds",
  "sourceRefs",
  "sourceReliability",
  "licenseNote",
  "controversyNote",
  "boundaryNote",
  "qualityScore",
  "reviewStatus",
];

const caseFields = [
  "id",
  "title",
  "patternType",
  "marketType",
  "timeframeSet",
  "sourceType",
  "dataBoundary",
  "chartNarrative",
  "beforeContext",
  "duringContext",
  "afterContext",
  "keyObservations",
  "commonTrap",
  "whatUserShouldNotice",
  "whatUserShouldNotConclude",
  "linkedKnowledgeNodeIds",
  "trainingScenarioIds",
  "boundaryNote",
  "qualityScore",
  "reviewStatus",
];

const scenarioFields = [
  "id",
  "title",
  "knowledgeNodeId",
  "marketCaseId",
  "question",
  "choices",
  "shortAnswerPrompt",
  "expectedObservation",
  "coachRubric",
  "mistakeTagIds",
  "nextPracticeSuggestion",
  "boundaryNote",
  "qualityScore",
  "reviewStatus",
];

const sourceFields = [
  "id",
  "name",
  "url",
  "license",
  "sourceType",
  "reliabilityGrade",
  "whatCanBeUsed",
  "whatCannotBeUsed",
  "productUse",
  "notes",
];

const forbidden = [
  "推荐买入",
  "推荐卖出",
  "保证收益",
  "胜率承诺",
  "实盘信号",
  "自动下单",
  "接入券商",
  "真实资金建议",
];

function fail(message) {
  throw new Error(message);
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return typeof value === "string" ? value.trim().length > 0 : value != null;
}

function requireCount(label, items, minimum) {
  if (!Array.isArray(items) || items.length < minimum) {
    fail(`${label} expected >= ${minimum}, got ${items?.length ?? "not-array"}`);
  }
}

function requireFields(label, item, fields) {
  const missing = fields.filter((field) => !hasValue(item[field]));
  if (missing.length) fail(`${label} ${item.id || item.name} missing fields: ${missing.join(", ")}`);
}

function requireNoForbidden(label, value) {
  const text = JSON.stringify(value);
  const found = forbidden.filter((word) => text.includes(word));
  if (found.length) fail(`${label} contains forbidden terms: ${found.join(", ")}`);
}

requireNoForbidden("knowledgeEngine", knowledgeEngine);
requireCount("KnowledgeNode", knowledgeNodes, 80);
requireCount("MarketCase", marketCases, 30);
requireCount("TrainingScenario", trainingScenarios, 40);
requireCount("MistakeTag", mistakeTags, 40);
requireCount("Rubric", rubrics, 40);
requireCount("LearningPathEdge", learningPathEdges, 100);
requireCount("SourceReview", sourceReviews, 8);

const domainLabels = new Set(domains.map((item) => item.label));
for (const domain of requiredDomains) {
  if (!domainLabels.has(domain)) fail(`missing L0 domain: ${domain}`);
}

const caseIds = new Set(marketCases.map((item) => item.id));
const scenarioIds = new Set(trainingScenarios.map((item) => item.id));
const rubricIds = new Set(rubrics.map((item) => item.id));
const mistakeIds = new Set(mistakeTags.map((item) => item.id));
const nodeIds = new Set(knowledgeNodes.map((item) => item.id));

for (const node of knowledgeNodes) {
  requireFields("KnowledgeNode", node, nodeFields);
  if (!["draft", "reviewed", "approved", "deprecated"].includes(node.reviewStatus)) fail(`KnowledgeNode ${node.id} invalid reviewStatus`);
  if (node.qualityScore < 70) fail(`KnowledgeNode ${node.id} low qualityScore ${node.qualityScore}`);
  if (!node.relatedCaseIds.some((id) => caseIds.has(id))) fail(`KnowledgeNode ${node.id} has no valid MarketCase`);
  if (!node.practiceTaskIds.some((id) => scenarioIds.has(id))) fail(`KnowledgeNode ${node.id} has no valid TrainingScenario`);
  if (!node.rubricIds.some((id) => rubricIds.has(id))) fail(`KnowledgeNode ${node.id} has no valid Rubric`);
  if (!node.mistakeTagIds.some((id) => mistakeIds.has(id))) fail(`KnowledgeNode ${node.id} has no valid MistakeTag`);
}

for (const item of marketCases) {
  requireFields("MarketCase", item, caseFields);
  if (item.sourceType !== "demo") fail(`MarketCase ${item.id} must remain demo in this version`);
  if (!item.dataBoundary.includes("教育演示")) fail(`MarketCase ${item.id} missing education data boundary`);
  if (item.qualityScore < 70) fail(`MarketCase ${item.id} low qualityScore ${item.qualityScore}`);
  if (!item.linkedKnowledgeNodeIds.some((id) => nodeIds.has(id))) fail(`MarketCase ${item.id} has no valid KnowledgeNode`);
}

for (const item of trainingScenarios) {
  requireFields("TrainingScenario", item, scenarioFields);
  if (!nodeIds.has(item.knowledgeNodeId)) fail(`TrainingScenario ${item.id} invalid knowledgeNodeId`);
  if (!caseIds.has(item.marketCaseId)) fail(`TrainingScenario ${item.id} invalid marketCaseId`);
  if (item.qualityScore < 70) fail(`TrainingScenario ${item.id} low qualityScore ${item.qualityScore}`);
  if (!item.mistakeTagIds.some((id) => mistakeIds.has(id))) fail(`TrainingScenario ${item.id} has no valid MistakeTag`);
}

for (const item of sourceReviews) {
  requireFields("SourceReview", item, sourceFields);
  if (!["S", "A", "B", "C", "D"].includes(item.reliabilityGrade)) fail(`SourceReview ${item.id} invalid reliabilityGrade`);
}

const tagCategories = new Set(mistakeTags.map((item) => item.category));
for (const category of ["chart", "timeframe", "breakout_range_reversal", "news_sentiment", "backtest", "psychology_risk"]) {
  if (!tagCategories.has(category)) fail(`missing MistakeTag category: ${category}`);
}

const summary = {
  ok: true,
  productionReady: false,
  educationOnly: true,
  domains: domains.length,
  knowledgeNodes: knowledgeNodes.length,
  marketCases: marketCases.length,
  trainingScenarios: trainingScenarios.length,
  mistakeTags: mistakeTags.length,
  rubrics: rubrics.length,
  learningPathEdges: learningPathEdges.length,
  sourceReviews: sourceReviews.length,
  minQuality: {
    knowledgeNode: Math.min(...knowledgeNodes.map((item) => item.qualityScore)),
    marketCase: Math.min(...marketCases.map((item) => item.qualityScore)),
    trainingScenario: Math.min(...trainingScenarios.map((item) => item.qualityScore)),
  },
};

console.log(JSON.stringify(summary, null, 2));
