import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { knowledgeBrowserIndex } = require("../education-knowledge-browser-index.js");
const appSource = readFileSync("app.js", "utf8");
const htmlSource = readFileSync("index.html", "utf8");
const cssSource = readFileSync("styles.css", "utf8");
const serverSource = readFileSync("server.js", "utf8");

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

function requireFields(label, item, fields) {
  const missing = fields.filter((field) => !hasValue(item[field]));
  if (missing.length) fail(`${label} ${item.id || item.title || "item"} missing fields: ${missing.join(", ")}`);
}

const text = JSON.stringify(knowledgeBrowserIndex);
const found = forbidden.filter((word) => text.includes(word));
if (found.length) fail(`knowledge browser contains forbidden terms: ${found.join(", ")}`);

if (knowledgeBrowserIndex.meta.educationOnly !== true) fail("knowledge browser must keep educationOnly true");
if (knowledgeBrowserIndex.meta.productionReady !== false) fail("knowledge browser must keep productionReady false");
if ((knowledgeBrowserIndex.sourceSummary.totalRealUrls || 0) < 10000) fail("knowledge browser source summary is below 10000 real URLs");
if ((knowledgeBrowserIndex.sourceSummary.officialOrDocumentUrls || 0) < 100) fail("knowledge browser official/public docs summary is below 100");
if (knowledgeBrowserIndex.qualitySummary.learnerFacingNodes < 360) fail("knowledge browser needs at least 360 learner-facing candidates");
if (knowledgeBrowserIndex.qualitySummary.reviewNeededNodes < knowledgeBrowserIndex.qualitySummary.learnerFacingNodes) fail("learner-facing candidates must remain review-tracked");
if (!knowledgeBrowserIndex.masterKnowledgeDatabase) fail("knowledge browser missing masterKnowledgeDatabase");
if (knowledgeBrowserIndex.masterKnowledgeDatabase.databaseStatus !== "ai_only_master_knowledge_database_ready_internal_release_blocked") fail("masterKnowledgeDatabase status drift");
if (knowledgeBrowserIndex.masterKnowledgeDatabase.learnerFacingRelease !== false) fail("masterKnowledgeDatabase learner release drift");
if (knowledgeBrowserIndex.masterKnowledgeDatabase.approvalStatus !== "not_approved") fail("masterKnowledgeDatabase approval drift");
if ((knowledgeBrowserIndex.masterKnowledgeDatabase.totals?.masterModules || 0) !== 12) fail("masterKnowledgeDatabase must expose 12 master modules");
if ((knowledgeBrowserIndex.masterKnowledgeDatabase.totals?.retrievalCards || 0) < 1790) fail("masterKnowledgeDatabase retrieval cards too low");
if ((knowledgeBrowserIndex.masterKnowledgeDatabase.totals?.relationshipEdges || 0) < 593) fail("masterKnowledgeDatabase relationship edges too low");
if ((knowledgeBrowserIndex.masterKnowledgeDatabase.totals?.quizAndPracticeItems || 0) < 180) fail("masterKnowledgeDatabase quiz/practice items too low");
if ((knowledgeBrowserIndex.qualitySummary.masterKnowledgeRetrievalCards || 0) < 1790) fail("qualitySummary missing master DB retrieval cards");
if (!knowledgeBrowserIndex.sourceTopicCoverage) fail("knowledge browser missing source topic coverage");
if (knowledgeBrowserIndex.sourceTopicCoverage.domains < 10) fail("knowledge browser source topic coverage needs at least 10 domains");
if (knowledgeBrowserIndex.sourceTopicCoverage.domainsMeetingSourceMinimum < 10) fail("not all source topic domains meet source minimum");
if (knowledgeBrowserIndex.sourceTopicCoverage.domainsMeetingLearnerFacingMinimum < 10) fail("not all source topic domains meet learner-facing minimum");
if (knowledgeBrowserIndex.sourceTopicCoverage.unclassifiedSources !== 0) fail("knowledge browser source topic coverage has unclassified sources");
if (knowledgeBrowserIndex.sourceTopicCoverage.duplicateLearnerFacingGroups !== 0) fail("knowledge browser has duplicate learner-facing source URL groups");
if (!Array.isArray(knowledgeBrowserIndex.sourceTopicCoverage.domainCards) || knowledgeBrowserIndex.sourceTopicCoverage.domainCards.length < 10) fail("knowledge browser missing source topic domain cards");
if (knowledgeBrowserIndex.modules.length < 10) fail("knowledge browser needs at least 10 modules");
if (knowledgeBrowserIndex.learnerFacingNodes.length < 360) fail("knowledge browser exposes fewer than 360 learner-facing nodes");

for (const module of knowledgeBrowserIndex.modules) {
  requireFields("KnowledgeBrowserModule", module, ["id", "title", "totalNodes", "learnerFacingNodes", "topics", "entryNodeIds"]);
  if (module.learnerFacingNodes < 1) fail(`module ${module.title} has no learner-facing entry`);
}

for (const domain of knowledgeBrowserIndex.sourceTopicCoverage.domainCards) {
  requireFields("SourceTopicDomainCard", domain, ["id", "label", "totalSources", "learnerFacingAllowedSources", "taxonomyAllowedSources", "tierSOrASources", "researchOnlySources", "uniqueHosts", "uiStatus", "sourceUseBoundary"]);
  if (domain.uiStatus !== "coverage_ready_for_review") fail(`domain ${domain.id} is not ready for review coverage`);
  if (!/source coverage/i.test(domain.sourceUseBoundary)) fail(`domain ${domain.id} missing source coverage boundary`);
}

const nodeFields = [
  "id",
  "title",
  "module",
  "topic",
  "difficulty",
  "definition",
  "principle",
  "multiTimeframeView",
  "commonMistakes",
  "antiExamples",
  "practicePrompt",
  "rubricDraft",
  "sourceBoundary",
  "licenseBoundary",
  "sourceGroundingStatus",
  "sourceTopicDomains",
  "boundaryNote",
  "authorityContextRefs",
  "ui",
];

let nodesWithReviewedSourceRefs = 0;
let originalOnlyNodes = 0;
let nodesWithAuthorityContextRefs = 0;
for (const node of knowledgeBrowserIndex.learnerFacingNodes) {
  requireFields("KnowledgeBrowserNode", node, nodeFields);
  if (!/original|low-risk/i.test(`${node.sourceBoundary} ${node.licenseBoundary}`)) {
    fail(`node ${node.id} is learner-facing without original or low-risk source boundary`);
  }
  if (!["reviewed_source_refs", "original_expression_only"].includes(node.sourceGroundingStatus)) {
    fail(`node ${node.id} invalid sourceGroundingStatus`);
  }
  if (!Array.isArray(node.reviewedSourceRefs)) fail(`node ${node.id} reviewedSourceRefs must be an array`);
  if (!Array.isArray(node.authorityContextRefs)) fail(`node ${node.id} authorityContextRefs must be an array`);
  if (!Array.isArray(node.sourceTopicDomains) || !node.sourceTopicDomains.length) fail(`node ${node.id} missing sourceTopicDomains`);
  if (node.sourceTopicDomains.includes("unclassified_review_needed")) fail(`node ${node.id} leaks unclassified source topic domain`);
  if (!node.authorityContextRefs.length) fail(`node ${node.id} missing authorityContextRefs`);
  nodesWithAuthorityContextRefs += 1;
  if (node.sourceGroundingStatus === "reviewed_source_refs") {
    nodesWithReviewedSourceRefs += 1;
    if (!node.reviewedSourceRefs.length) fail(`node ${node.id} missing reviewedSourceRefs`);
  }
  if (node.sourceGroundingStatus === "original_expression_only") {
    originalOnlyNodes += 1;
    if (node.reviewedSourceRefs.length) fail(`node ${node.id} original_expression_only should not carry reviewedSourceRefs`);
  }
  for (const ref of node.reviewedSourceRefs) {
    requireFields("ReviewedSourceRef", ref, ["sourceId", "name", "url", "sourceType", "reliabilityGrade", "licenseStatus", "allowedUse", "disallowedUse", "matchedConcepts", "relevanceSignal"]);
    if (/research_only/i.test(JSON.stringify(ref))) fail(`node ${node.id} reviewedSourceRefs leaks research_only`);
    for (const concept of ref.matchedConcepts) {
      requireFields("MatchedConcept", concept, ["conceptId", "label", "category", "subcategory", "confidence", "licenseBoundary"]);
      if (concept.confidence < 0.5) fail(`node ${node.id} matched concept ${concept.conceptId} confidence too low`);
    }
  }
  for (const ref of node.authorityContextRefs) {
    requireFields("AuthorityContextRef", ref, ["sourceId", "name", "url", "sourceType", "reliabilityGrade", "authorityTier", "contextUse", "disallowedUse"]);
    if (!["S", "A"].includes(ref.authorityTier)) fail(`node ${node.id} authorityContextRefs must be Tier S/A`);
    if (/research_only/i.test(JSON.stringify(ref))) fail(`node ${node.id} authorityContextRefs leaks research_only`);
  }
  if (!node.ui.disabledActions.includes("No buy or sell instruction")) fail(`node ${node.id} missing UI disabled action boundary`);
}

if (nodesWithReviewedSourceRefs < 360) fail(`expected at least 360 learner-facing nodes with reviewed source refs, got ${nodesWithReviewedSourceRefs}`);
if (originalOnlyNodes !== 0) fail(`expected 0 original_expression_only nodes in current browser index, got ${originalOnlyNodes}`);
if (nodesWithAuthorityContextRefs < 360) fail(`expected all learner-facing nodes to carry authority context refs, got ${nodesWithAuthorityContextRefs}`);

const requiredCockpitSnippets = [
  "function renderKnowledgeReviewCockpit",
  "knowledge-review-cockpit",
  "High-risk lesson queue",
  "Direct-source boundary",
  "learnerFacingRelease",
  "writeAllowed",
  "does not approve learner-facing release",
];

for (const snippet of requiredCockpitSnippets) {
  if (!appSource.includes(snippet)) fail(`knowledge browser app missing review cockpit snippet: ${snippet}`);
}

const requiredDeliverySnippets = [
  "function renderKnowledgeBrowserMasterDelivery",
  "knowledge-master-delivery",
  "Internal Course Delivery",
  "Module overview",
  "Lessons / practice / quiz",
  "Release blockers",
  "masterKnowledgeDatabase",
  "/api/knowledge-browser/master-knowledge-database",
];

for (const snippet of requiredDeliverySnippets) {
  if (!appSource.includes(snippet)) fail(`knowledge browser app missing master delivery snippet: ${snippet}`);
}

for (const snippet of [
  "knowledgeBrowserMasterDelivery",
  "Master database 课程交付面板",
]) {
  if (!htmlSource.includes(snippet)) fail(`knowledge browser HTML missing master delivery container: ${snippet}`);
}

for (const snippet of [
  "/api/knowledge-browser/master-knowledge-database",
  "masterKnowledgeDatabase",
  "learnerFacingRelease",
  "writeAllowedNow",
]) {
  if (!serverSource.includes(snippet)) fail(`knowledge browser server missing master DB API snippet: ${snippet}`);
}

const requiredCockpitStyles = [
  ".knowledge-review-cockpit",
  ".knowledge-cockpit-metrics",
  ".knowledge-cockpit-columns",
  ".knowledge-cockpit-list",
  ".knowledge-master-delivery",
  ".knowledge-master-hero",
  ".knowledge-master-grid",
  ".knowledge-module-score-list",
  ".knowledge-delivery-card-list",
  ".knowledge-blocker-strip",
];

for (const snippet of requiredCockpitStyles) {
  if (!cssSource.includes(snippet)) fail(`knowledge browser CSS missing cockpit/delivery style: ${snippet}`);
}

const modulesWithSubtopics = knowledgeBrowserIndex.modules.filter((module) => (module.subtopicCatalog || []).length > 0).length;
if (modulesWithSubtopics < knowledgeBrowserIndex.modules.length) {
  throw new Error(`modules missing subtopic catalog: ${knowledgeBrowserIndex.modules.length - modulesWithSubtopics}`);
}

console.log(JSON.stringify({
  ok: true,
  productionReady: false,
  educationOnly: true,
  modules: knowledgeBrowserIndex.modules.length,
  learnerFacingNodes: knowledgeBrowserIndex.learnerFacingNodes.length,
  nodesWithReviewedSourceRefs,
  originalOnlyNodes,
  nodesWithAuthorityContextRefs,
  realUrls: knowledgeBrowserIndex.sourceSummary.totalRealUrls,
  officialOrDocumentUrls: knowledgeBrowserIndex.sourceSummary.officialOrDocumentUrls,
  sourceTopicDomains: knowledgeBrowserIndex.sourceTopicCoverage.domains,
  sourceTopicDomainsReady: knowledgeBrowserIndex.sourceTopicCoverage.domainsMeetingSourceMinimum,
  reviewCockpit: true,
  masterDeliveryPanel: true,
  masterRetrievalCards: knowledgeBrowserIndex.masterKnowledgeDatabase.totals.retrievalCards,
  reviewNeededNodes: knowledgeBrowserIndex.qualitySummary.reviewNeededNodes,
}, null, 2));
