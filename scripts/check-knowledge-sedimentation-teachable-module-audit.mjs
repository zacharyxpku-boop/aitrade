import fs from "node:fs";

function fail(message) {
  throw new Error(message);
}

function requireFields(label, item, fields) {
  const missing = fields.filter((field) => {
    const value = item[field];
    if (Array.isArray(value)) return value.length === 0;
    if (value && typeof value === "object") return Object.keys(value).length === 0;
    return value === undefined || value === null || value === "";
  });
  if (missing.length) fail(`${label} missing fields: ${missing.join(", ")}`);
}

const jsonPath = "docs/KNOWLEDGE_SEDIMENTATION_TEACHABLE_MODULE_AUDIT.json";
const mdPath = "docs/KNOWLEDGE_SEDIMENTATION_TEACHABLE_MODULE_AUDIT.md";
if (!fs.existsSync(jsonPath)) fail(`missing ${jsonPath}`);
if (!fs.existsSync(mdPath)) fail(`missing ${mdPath}`);

const audit = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

if (audit.educationOnly !== true) fail("educationOnly boundary drift");
if (audit.productionReady !== false) fail("productionReady boundary drift");
if (audit.learnerFacingRelease !== false) fail("learnerFacingRelease boundary drift");
if (audit.approvalStatus !== "not_approved") fail("approvalStatus drift");
if (audit.writeAllowedNow !== false) fail("writeAllowedNow drift");
if (audit.auditStatus !== "knowledge_sedimentation_teachable_module_audit_complete_internal_release_blocked") fail("auditStatus drift");
if (audit.knowledgeBaseUsefulnessStatus !== "usable_as_internal_reviewer_knowledge_base_not_learner_course") fail("usefulness status drift");

requireFields("Totals", audit.totals, [
  "canonicalTeachingModules",
  "existingKnowledgeNodesV2",
  "reviewedSourceBackedCandidateLessons",
  "coursePaths",
  "localPhysicalPdfFiles",
  "localCoveredPhysicalPdfFiles",
  "localUniquePdfHashes",
  "course5InternalKnowledgeNodes",
  "course5SupplementModules",
  "videoSemanticAbsorbedRows",
  "videoCandidateKnowledgePoints",
  "publicCorpusDocuments",
  "wikipediaDocuments",
  "officialLikeDocuments",
  "publicModuleGroundedNodes",
  "sourceFitReviewRows",
  "blockedSourceFitReviewRows",
  "internalNavigationReadyModules",
]);

if (audit.totals.canonicalTeachingModules !== 12) fail("expected 12 canonical teaching modules");
if (audit.totals.existingKnowledgeNodesV2 < 1500) fail("knowledge node base too small");
if (audit.totals.reviewedSourceBackedCandidateLessons !== 360) fail("expected 360 candidate lessons");
if (audit.totals.coursePaths !== 12) fail("expected 12 course paths");
if (audit.totals.localPhysicalPdfFiles !== 302) fail("local physical PDF count drift");
if (audit.totals.localCoveredPhysicalPdfFiles !== 313) fail("multi-folder covered PDF count drift");
if (audit.totals.localUniquePdfHashes !== 298) fail("local unique hash count drift");
if (audit.totals.course5InternalKnowledgeNodes !== 36) fail("Course 5 internal node count drift");
if (audit.totals.course5SupplementModules !== 11) fail("Course 5 module count drift");
if (audit.totals.videoSemanticAbsorbedRows !== 62) fail("video semantic absorption count drift");
if (audit.totals.videoCandidateKnowledgePoints !== 150) fail("video candidate count drift");
if (audit.totals.publicCorpusDocuments !== 1196) fail("public corpus count drift");
if (audit.totals.wikipediaDocuments !== 96) fail("Wikipedia count drift");
if (audit.totals.officialLikeDocuments !== 202) fail("official-like count drift");
if (audit.totals.publicModuleGroundedNodes !== 360) fail("public grounded node count drift");
if (audit.totals.sourceFitReviewRows !== 1638 || audit.totals.blockedSourceFitReviewRows !== 1638) fail("source-fit counts drift");
if (audit.totals.realHumanInputEntries !== 0) fail("must not claim real human input");
if (audit.totals.learnerReleaseReadyModules !== 0) fail("learner release must remain blocked");
if (audit.totals.internalNavigationReadyModules !== 12) fail("expected all modules internally navigable");

if (!Array.isArray(audit.sourceLayers) || audit.sourceLayers.length !== 5) fail("expected five source layers");
if (!Array.isArray(audit.canonicalTeachingModules) || audit.canonicalTeachingModules.length !== 12) fail("expected 12 module audits");
if (!Array.isArray(audit.course5StandaloneModules) || audit.course5StandaloneModules.length !== 11) fail("expected 11 Course 5 supplement module audits");
if (!Array.isArray(audit.nextModuleizationActions) || audit.nextModuleizationActions.length < 5) fail("missing next moduleization actions");

const requiredModules = new Set([
  "图表阅读基础",
  "市场结构",
  "K线与价格行为",
  "趋势",
  "突破",
  "交易区间",
  "反转",
  "多周期分析",
  "新闻/情绪/事件偏见",
  "回测误区",
  "风险管理",
  "交易心理",
]);

let modulesWithCourse5Supplements = 0;
for (const row of audit.canonicalTeachingModules) {
  requireFields("CanonicalModule", row, [
    "module",
    "existingKnowledgeNodes",
    "reviewedSourceBackedCandidateLessons",
    "draftKnowledgeNodes",
    "topicCount",
    "sampleTopics",
    "publicGroundedNodes",
    "sourceFitReviewRows",
    "blockedSourceFitReviewRows",
    "teachableModuleStatus",
    "learnerReleaseStatus",
    "suggestedCourseUnit",
    "nextReviewAction",
  ]);
  if (!requiredModules.has(row.module)) fail(`unexpected module ${row.module}`);
  if (row.reviewedSourceBackedCandidateLessons !== 30) fail(`module ${row.module} should have 30 candidate lessons`);
  if (row.publicGroundedNodes !== 30) fail(`module ${row.module} should have 30 public grounded nodes`);
  if (row.teachableModuleStatus !== "internal_modular_teaching_design_ready") fail(`module ${row.module} not internally teachable`);
  if (row.learnerReleaseStatus !== "blocked_until_source_fit_originality_and_real_review_complete") fail(`module ${row.module} release status drift`);
  if (!Array.isArray(row.suggestedCourseUnit) || row.suggestedCourseUnit.length < 6) fail(`module ${row.module} needs course unit structure`);
  if ((row.course5SupplementLessonSeeds || 0) > 0) modulesWithCourse5Supplements += 1;
}
if (modulesWithCourse5Supplements < 8) fail("Course 5 supplement coverage across canonical modules is too thin");

for (const row of audit.sourceLayers) {
  requireFields("SourceLayer", row, ["layerId", "label", "status", "sourceCount", "uniqueContentCount", "knowledgeUse", "teachability"]);
}

const text = JSON.stringify(audit).toLowerCase();
for (const phrase of [
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
]) {
  if (!text.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  auditStatus: audit.auditStatus,
  canonicalTeachingModules: audit.totals.canonicalTeachingModules,
  reviewedSourceBackedCandidateLessons: audit.totals.reviewedSourceBackedCandidateLessons,
  course5InternalKnowledgeNodes: audit.totals.course5InternalKnowledgeNodes,
  videoCandidateKnowledgePoints: audit.totals.videoCandidateKnowledgePoints,
  publicCorpusDocuments: audit.totals.publicCorpusDocuments,
  learnerReleaseReadyModules: audit.totals.learnerReleaseReadyModules,
}, null, 2));
