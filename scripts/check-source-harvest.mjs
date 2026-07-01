import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const {
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
} = require("../education-source-harvest-engine.js");

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

const sourceFields = ["id", "name", "url", "sourceType", "domain", "license", "crawlMethod", "allowedUse", "disallowedUse", "reliabilityGrade", "extractionTarget", "status", "notes"];
const reviewFields = ["id", "sourceId", "licenseStatus", "termsRisk", "contentUseRisk", "dataUseRisk", "commercialUseRisk", "allowedForTaxonomy", "allowedForLearnerFacing", "requiresHumanReview", "whatCanBeUsed", "whatCannotBeUsed"];
const conceptFields = ["id", "sourceId", "rawLabel", "normalizedLabel", "category", "subcategory", "aliases", "relatedTerms", "sourceType", "sourceReliability", "licenseBoundary", "confidence", "learnerFacingAllowed"];
const patternFields = ["id", "type", "category", "name", "aliases", "sourceIds", "educationUse", "commonMisread", "multiTimeframeRelevance", "boundaryNote"];
const projectFields = ["id", "name", "url", "license", "projectType", "coveredConcepts", "usableTaxonomy", "unusableContent", "termsRisk", "notes"];

requireNoForbidden("sourceHarvest", sourceHarvest);
requireCount("SourceInventory", sourceInventory, 10000);
requireCount("SourceReview", sourceReviews, 1500);
requireCount("ConceptCandidate", conceptCandidates, 50000);
requireCount("PatternTaxonomy", patternTaxonomy, 5000);
requireCount("OpenSourceProjectReview", openSourceProjectReviews, 1000);
requireCount("BacktestMistakeCandidate", backtestMistakeCandidates, 1000);
requireCount("NewsSentimentConcept", newsSentimentConcepts, 1000);
requireCount("DataBoundaryRule", dataBoundaryRules, 300);
requireCount("EducationGlossaryCandidate", educationGlossaryCandidates, 10000);
requireCount("RiskPsychologyCandidate", riskPsychologyCandidates, 3000);

const sourceIds = new Set(sourceInventory.map((item) => item.id));
const learnerAllowedSourceIds = new Set(sourceReviews.filter((item) => item.allowedForLearnerFacing).map((item) => item.sourceId));
const realSourceSnapshotPath = "docs/REAL_SOURCE_HARVEST.json";
const realSourceSnapshot = fs.existsSync(realSourceSnapshotPath)
  ? JSON.parse(fs.readFileSync(realSourceSnapshotPath, "utf8"))
  : null;

for (const source of sourceInventory) {
  requireFields("SourceInventory", source, sourceFields);
  if (!["S", "A", "B", "C", "D"].includes(source.reliabilityGrade)) fail(`SourceInventory ${source.id} invalid reliabilityGrade`);
}

for (const review of sourceReviews) {
  requireFields("SourceReview", review, reviewFields);
  if (!sourceIds.has(review.sourceId)) fail(`SourceReview ${review.id} invalid sourceId`);
  if (review.allowedForLearnerFacing && !review.whatCannotBeUsed) fail(`SourceReview ${review.id} missing learner-facing boundary`);
}

for (const concept of conceptCandidates) {
  requireFields("ConceptCandidate", concept, conceptFields);
  if (!sourceIds.has(concept.sourceId)) fail(`ConceptCandidate ${concept.id} invalid sourceId`);
  if (concept.learnerFacingAllowed && !learnerAllowedSourceIds.has(concept.sourceId)) {
    fail(`ConceptCandidate ${concept.id} learnerFacingAllowed without reviewed source`);
  }
  if (concept.learnerFacingAllowed && (!concept.licenseBoundary || !concept.sourceReliability)) {
    fail(`ConceptCandidate ${concept.id} missing licenseBoundary/sourceReliability`);
  }
}

for (const pattern of patternTaxonomy) {
  requireFields("PatternTaxonomy", pattern, patternFields);
  if (!pattern.sourceIds.some((id) => sourceIds.has(id))) fail(`PatternTaxonomy ${pattern.id} invalid sourceIds`);
}

for (const project of openSourceProjectReviews) requireFields("OpenSourceProjectReview", project, projectFields);
for (const item of backtestMistakeCandidates) requireFields("BacktestMistakeCandidate", item, ["id", "label", "category", "description", "whyItMatters", "learnerMisuse", "boundaryNote"]);
for (const item of newsSentimentConcepts) requireFields("NewsSentimentConcept", item, ["id", "label", "category", "description", "educationUse", "biasRisk", "boundaryNote"]);
for (const item of dataBoundaryRules) requireFields("DataBoundaryRule", item, ["id", "label", "sourceType", "rule", "allowedUse", "disallowedUse", "learnerDisclosure"]);
for (const item of educationGlossaryCandidates) requireFields("EducationGlossaryCandidate", item, ["id", "term", "normalizedTerm", "domain", "sourceClass", "educationUse", "learnerFacingAllowed", "licenseBoundary", "boundaryNote"]);
for (const item of riskPsychologyCandidates) requireFields("RiskPsychologyCandidate", item, ["id", "label", "category", "educationUse", "riskMechanism", "coachingQuestion", "learnerFacingAllowed", "boundaryNote"]);

const summary = {
  ok: true,
  productionReady: false,
  educationOnly: true,
  sourceInventory: sourceInventory.length,
  sourceReviews: sourceReviews.length,
  conceptCandidates: conceptCandidates.length,
  patternTaxonomy: patternTaxonomy.length,
  openSourceProjectReviews: openSourceProjectReviews.length,
  backtestMistakeCandidates: backtestMistakeCandidates.length,
  newsSentimentConcepts: newsSentimentConcepts.length,
  dataBoundaryRules: dataBoundaryRules.length,
  educationGlossaryCandidates: educationGlossaryCandidates.length,
  riskPsychologyCandidates: riskPsychologyCandidates.length,
  realSourceCoverage: realSourceSnapshot ? {
    realUrls: realSourceSnapshot.summary?.totalRealUrls || 0,
    githubRepositories: realSourceSnapshot.summary?.githubRepositories || 0,
    npmPackages: realSourceSnapshot.summary?.npmPackages || 0,
    officialOrDocumentUrls: realSourceSnapshot.summary?.officialOrDocumentUrls || 0,
    gapToTarget3000RealUrls: Math.max(0, 3000 - (realSourceSnapshot.summary?.totalRealUrls || 0)),
  } : {
    realUrls: 0,
    githubRepositories: 0,
    officialOrDocumentUrls: 0,
    gapToTarget3000RealUrls: 3000,
  },
  taxonomyAllowedSources: sourceReviews.filter((item) => item.allowedForTaxonomy).length,
  learnerFacingAllowedSources: sourceReviews.filter((item) => item.allowedForLearnerFacing).length,
  researchOnlySources: sourceInventory.filter((item) => item.status === "research_only").length,
};

console.log(JSON.stringify(summary, null, 2));
