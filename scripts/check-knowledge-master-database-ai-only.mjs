import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const JSON_PATH = "docs/KNOWLEDGE_MASTER_DATABASE_AI_ONLY.json";
const MD_PATH = "docs/KNOWLEDGE_MASTER_DATABASE_AI_ONLY.md";
const JS_PATH = "education-master-knowledge-database.js";

function fail(message) {
  console.error(`knowledge master database check failed: ${message}`);
  process.exit(1);
}

function readJson(path) {
  if (!fs.existsSync(path)) fail(`missing ${path}`);
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

for (const path of [JSON_PATH, MD_PATH, JS_PATH]) {
  if (!fs.existsSync(path)) fail(`missing ${path}`);
}

const artifact = readJson(JSON_PATH);
const { masterKnowledgeDatabase } = require(`../${JS_PATH}`);
const { knowledgeBrowserIndex } = require("../education-knowledge-browser-index");

if (artifact.educationOnly !== true) fail("educationOnly drift");
if (artifact.productionReady !== false) fail("productionReady drift");
if (artifact.learnerFacingRelease !== false) fail("learnerFacingRelease drift");
if (artifact.approvalStatus !== "not_approved") fail("approvalStatus drift");
if (artifact.writeAllowedNow !== false) fail("writeAllowedNow drift");
if (artifact.databaseStatus !== "ai_only_master_knowledge_database_ready_internal_release_blocked") fail("databaseStatus drift");

const totals = artifact.totals || {};
if (totals.canonicalModules !== 12) fail(`expected 12 canonical modules, got ${totals.canonicalModules}`);
if (totals.masterModules !== 12) fail(`expected 12 master modules, got ${totals.masterModules}`);
if (totals.sourceFitPrecheckRows !== 360) fail(`expected 360 source-fit rows, got ${totals.sourceFitPrecheckRows}`);
if (totals.course5InternalKnowledgeNodes !== 36) fail(`expected 36 Course 5 nodes, got ${totals.course5InternalKnowledgeNodes}`);
if (totals.videoSemanticCandidates !== 150) fail(`expected 150 video candidates, got ${totals.videoSemanticCandidates}`);
if (totals.internalTeachingPackages !== 12) fail(`expected 12 teaching packages, got ${totals.internalTeachingPackages}`);
if (totals.lessonOutlines !== 36) fail(`expected 36 lesson outlines, got ${totals.lessonOutlines}`);
if (totals.quizAndPracticeItems < 108) fail(`expected at least 108 quiz/practice items, got ${totals.quizAndPracticeItems}`);
if (totals.publicCorpusDocuments !== 1196) fail(`expected 1196 public corpus documents, got ${totals.publicCorpusDocuments}`);
if (totals.knowledgeEntities < 730) fail(`knowledge entity count too low: ${totals.knowledgeEntities}`);
if (totals.relationshipEdges < 500) fail(`relationship edge count too low: ${totals.relationshipEdges}`);
if (totals.retrievalCards < 720) fail(`retrieval card count too low: ${totals.retrievalCards}`);

const requiredLayers = new Set([
  "masterModules",
  "lessonOutlines",
  "quizAndPracticeItems",
  "sourceFitPrecheckRows",
  "course5InternalKnowledgeNodes",
  "videoSemanticCandidates",
  "publicSourceCards",
  "relationshipEdges",
  "retrievalCards",
]);
for (const layer of artifact.databaseLayers || []) {
  requiredLayers.delete(layer.layer);
  if (!Number.isFinite(layer.count) || layer.count <= 0) fail(`bad layer count ${layer.layer}`);
  if (!layer.use) fail(`missing layer use ${layer.layer}`);
}
if (requiredLayers.size) fail(`missing database layers: ${[...requiredLayers].join(", ")}`);

if (!Array.isArray(artifact.masterModules) || artifact.masterModules.length !== 12) fail("masterModules mismatch");
const moduleIds = new Set();
for (const row of artifact.masterModules) {
  moduleIds.add(row.moduleId);
  if (row.educationOnly !== true || row.productionReady !== false || row.learnerFacingRelease !== false || row.approvalStatus !== "not_approved" || row.writeAllowedNow !== false) fail(`module boundary drift ${row.moduleId}`);
  if (!row.quality || !Number.isFinite(row.quality.aiOnlyScore)) fail(`missing quality ${row.moduleId}`);
  if (!row.quality.aiOnlyUse || !row.quality.releaseRisk) fail(`missing quality routing ${row.moduleId}`);
  if ((row.quality.coverageSignals?.sourceFitRows || 0) <= 0) fail(`missing source-fit coverage ${row.moduleId}`);
  if (!Array.isArray(row.lessons) || row.lessons.length < 3) fail(`too few lessons ${row.moduleId}`);
  if (!Array.isArray(row.retrievalTags) || row.retrievalTags.length < 3) fail(`missing retrieval tags ${row.moduleId}`);
}

if (!Array.isArray(artifact.relationshipEdges) || artifact.relationshipEdges.length !== totals.relationshipEdges) fail("relationshipEdges mismatch");
const relationTypes = new Set(artifact.relationshipEdges.map((edge) => edge.relation));
for (const relation of ["DEPENDS_ON", "HAS_LESSON", "HAS_SOURCE_FIT_PRECHECK", "HAS_PRIVATE_COURSE_SUPPLEMENT", "HAS_VIDEO_SEMANTIC_CANDIDATE"]) {
  if (!relationTypes.has(relation)) fail(`missing relation ${relation}`);
}
for (const edge of artifact.relationshipEdges) {
  if (!edge.edgeId || !edge.from || !edge.to || !edge.relation) fail("malformed relationship edge");
}

if (!Array.isArray(artifact.retrievalCards) || artifact.retrievalCards.length !== totals.retrievalCards) fail("retrievalCards mismatch");
const retrievalTypes = artifact.retrievalViews?.byType || {};
for (const type of ["master_module", "lesson_outline", "source_fit_precheck_node", "course5_internal_node", "video_semantic_candidate"]) {
  if (!retrievalTypes[type]) fail(`missing retrieval type ${type}`);
}
for (const card of artifact.retrievalCards) {
  if (card.educationOnly !== true || card.productionReady !== false || card.learnerFacingRelease !== false || card.approvalStatus !== "not_approved") fail(`retrieval card boundary drift ${card.id}`);
  if (!card.id || !card.type || !card.title || !card.releaseStatus) fail(`malformed retrieval card ${card.id}`);
}

if (!artifact.qualityDashboard) fail("missing qualityDashboard");
if (artifact.qualityDashboard.releaseReadiness !== "learner_release_blocked_no_human_review_claimed") fail("release readiness drift");
if (artifact.qualityDashboard.highReleaseRiskModules < 4) fail("expected high-risk release modules to remain visible");
if (artifact.qualityDashboard.aiOnlyUsableModules < 8) fail("too few AI-only usable modules");

if (!artifact.ontologyMap || artifact.ontologyMap.entities_count < 700 || artifact.ontologyMap.relationships_count < 500) fail("ontology map too thin");
if (!artifact.knowledgeBrowserSurface || artifact.knowledgeBrowserSurface.field !== "masterKnowledgeDatabase") fail("knowledge browser surface missing");

if (masterKnowledgeDatabase.databaseStatus !== artifact.databaseStatus) fail("generated JS status mismatch");
if (masterKnowledgeDatabase.totals?.masterModules !== 12) fail("generated JS totals mismatch");
if (masterKnowledgeDatabase.learnerFacingRelease !== false || masterKnowledgeDatabase.approvalStatus !== "not_approved") fail("generated JS release drift");

if (!knowledgeBrowserIndex.masterKnowledgeDatabase) fail("Knowledge Browser index missing masterKnowledgeDatabase");
if (knowledgeBrowserIndex.masterKnowledgeDatabase.databaseStatus !== artifact.databaseStatus) fail("Knowledge Browser database status mismatch");
if (knowledgeBrowserIndex.masterKnowledgeDatabase.totals?.retrievalCards < 720) fail("Knowledge Browser retrieval cards too low");
if (knowledgeBrowserIndex.qualitySummary?.masterKnowledgeRetrievalCards < 720) fail("Knowledge Browser quality summary missing master DB");

const forbidden = [
  "recommended buy",
  "recommended sell",
  "guaranteed return",
  "profit target",
  "approved for release",
  "learner-facing approved",
  "broker workflow ready",
  "auto-trading enabled",
  "real-money ready",
];
const body = JSON.stringify(artifact).toLowerCase();
for (const phrase of forbidden) {
  if (body.includes(phrase)) fail(`forbidden phrase '${phrase}'`);
}

const md = fs.readFileSync(MD_PATH, "utf8");
if (!md.includes("Knowledge Master Database AI-only")) fail("markdown title missing");
if (!md.includes("Learner-facing release: false")) fail("markdown release boundary missing");

console.log(JSON.stringify({
  ok: true,
  databaseStatus: artifact.databaseStatus,
  masterModules: totals.masterModules,
  knowledgeEntities: totals.knowledgeEntities,
  relationshipEdges: totals.relationshipEdges,
  retrievalCards: totals.retrievalCards,
  aiOnlyUsableModules: artifact.qualityDashboard.aiOnlyUsableModules,
  highReleaseRiskModules: artifact.qualityDashboard.highReleaseRiskModules,
  knowledgeBrowserSurface: artifact.knowledgeBrowserSurface,
}, null, 2));
