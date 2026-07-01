import fs from "node:fs";

const jsonPath = "docs/KNOWLEDGE_AI_ONLY_TEACHING_PRECHECK.json";
const mdPath = "docs/KNOWLEDGE_AI_ONLY_TEACHING_PRECHECK.md";

function fail(message) {
  throw new Error(message);
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== undefined && value !== null && value !== "";
}

function requireFields(label, item, fields) {
  const missing = fields.filter((field) => !hasValue(item[field]));
  if (missing.length) fail(`${label} ${item.id || item.module || item.nodeId || item.candidateId || "item"} missing fields: ${missing.join(", ")}`);
}

if (!fs.existsSync(jsonPath)) fail(`missing ${jsonPath}`);
if (!fs.existsSync(mdPath)) fail(`missing ${mdPath}`);

const artifact = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

if (artifact.educationOnly !== true) fail("educationOnly drift");
if (artifact.productionReady !== false) fail("productionReady drift");
if (artifact.learnerFacingRelease !== false) fail("learnerFacingRelease drift");
if (artifact.approvalStatus !== "not_approved") fail("approvalStatus drift");
if (artifact.writeAllowedNow !== false) fail("writeAllowedNow drift");
if (artifact.precheckStatus !== "knowledge_ai_only_teaching_precheck_complete_internal_release_blocked") fail("precheckStatus drift");
if (!Array.isArray(artifact.sourceArtifacts) || artifact.sourceArtifacts.length < 5) fail("missing source artifact pointers");

const expectedTotals = {
  moduleDossiers: 12,
  lessonDraftSeeds: 36,
  sourceFitPrecheckRows: 360,
  course5RewriteDrafts: 36,
  videoModuleMappings: 150,
  publicCorpusDocuments: 1196,
  manualResidualItems: 4,
};
for (const [key, expected] of Object.entries(expectedTotals)) {
  if (artifact.totals?.[key] !== expected) fail(`${key} expected ${expected}, got ${artifact.totals?.[key]}`);
}
if (artifact.totals.compactedManualPriorityItems > 60) fail("manual residual list is not compact enough");

const requiredPrecheckCategories = ["likely_good", "needs_rewrite", "weak_source_fit", "high_risk"];
for (const category of requiredPrecheckCategories) {
  if (!artifact.sourceFitPrecheckCounts?.[category] || artifact.sourceFitPrecheckCounts[category] < 1) {
    fail(`missing source-fit category ${category}`);
  }
}

if (!Array.isArray(artifact.moduleDossiers) || artifact.moduleDossiers.length !== 12) fail("module dossier count mismatch");
if (!Array.isArray(artifact.lessonDraftSeeds) || artifact.lessonDraftSeeds.length !== 36) fail("lesson seed count mismatch");
if (!Array.isArray(artifact.sourceFitPrecheckRows) || artifact.sourceFitPrecheckRows.length !== 360) fail("source-fit precheck count mismatch");
if (!Array.isArray(artifact.course5TeachingRewriteDrafts) || artifact.course5TeachingRewriteDrafts.length !== 36) fail("Course 5 rewrite count mismatch");
if (!Array.isArray(artifact.videoModuleMappings) || artifact.videoModuleMappings.length !== 150) fail("video mapping count mismatch");
if (!Array.isArray(artifact.minimalManualResidualList) || artifact.minimalManualResidualList.length !== 4) fail("manual residual count mismatch");

const modules = new Set();
for (const dossier of artifact.moduleDossiers) {
  requireFields("ModuleDossier", dossier, [
    "dossierId",
    "module",
    "internalTeachingStatus",
    "coreConcepts",
    "teachableSequence",
    "practiceTypes",
    "commonMistakeFocus",
    "evidenceSummary",
    "riskBoundary",
    "lessonDraftSeeds",
    "aiSourceFitPrecheckSummary",
  ]);
  if (dossier.internalTeachingStatus !== "ai_only_module_dossier_ready_internal_use") fail(`dossier status drift ${dossier.module}`);
  if (dossier.learnerFacingRelease !== false || dossier.approvalStatus !== "not_approved") fail(`dossier release drift ${dossier.module}`);
  if (!Array.isArray(dossier.lessonDraftSeeds) || dossier.lessonDraftSeeds.length < 3) fail(`dossier needs at least 3 lesson draft seeds ${dossier.module}`);
  if (!Array.isArray(dossier.teachableSequence) || dossier.teachableSequence.length < 5) fail(`thin teachable sequence ${dossier.module}`);
  modules.add(dossier.module);
}
if (modules.size !== 12) fail("expected 12 unique modules");

for (const seed of artifact.lessonDraftSeeds) {
  requireFields("LessonDraftSeed", seed, [
    "draftSeedId",
    "module",
    "topic",
    "internalLessonTitle",
    "teachableObjective",
    "lessonFlow",
    "practiceType",
    "sourceFitPrecheckCategory",
    "releaseStatus",
    "safetyBoundary",
  ]);
  if (seed.releaseStatus !== "internal_only_ai_draft_not_learner_ready") fail(`lesson seed release status drift ${seed.draftSeedId}`);
  if (seed.educationOnly !== true || seed.productionReady !== false || seed.learnerFacingRelease !== false || seed.approvalStatus !== "not_approved" || seed.writeAllowedNow !== false) fail(`lesson seed boundary drift ${seed.draftSeedId}`);
}

for (const row of artifact.sourceFitPrecheckRows) {
  requireFields("SourceFitPrecheckRow", row, ["nodeId", "module", "title", "topic", "category", "rationale", "aiAllowedNextStep"]);
  if (!requiredPrecheckCategories.includes(row.category)) fail(`invalid source-fit category ${row.category}`);
  if (row.learnerFacingRelease !== false || row.approvalStatus !== "not_approved") fail(`source-fit row release drift ${row.nodeId}`);
}

for (const row of artifact.course5TeachingRewriteDrafts) {
  requireFields("Course5Rewrite", row, [
    "rewriteId",
    "sourceNodeId",
    "seedId",
    "module",
    "mappedCanonicalModules",
    "observationTrainingDraft",
    "conceptExplanationDraft",
    "misconceptionWarningDraft",
    "evidenceRefs",
    "blockedReasons",
    "releaseStatus",
  ]);
  if (row.releaseStatus !== "internal_only_ai_rewrite_not_learner_ready") fail(`Course 5 rewrite release drift ${row.rewriteId}`);
  if (row.educationOnly !== true || row.productionReady !== false || row.learnerFacingRelease !== false || row.approvalStatus !== "not_approved" || row.writeAllowedNow !== false) fail(`Course 5 rewrite boundary drift ${row.rewriteId}`);
}

for (const row of artifact.videoModuleMappings) {
  requireFields("VideoMapping", row, ["candidateId", "sourceId", "lessonCode", "concept", "nodeType", "mappedModule", "aiNextAction", "releaseStatus"]);
  if (!modules.has(row.mappedModule)) fail(`video mapped to unknown module ${row.mappedModule}`);
  if (row.releaseStatus !== "internal_video_candidate_not_learner_ready") fail(`video release drift ${row.candidateId}`);
}

for (const item of artifact.minimalManualResidualList) {
  requireFields("ManualResidual", item, ["residualId", "label", "originalWorkItems", "compactedPriorityItems", "mustRemainBlockedReason", "aiCanContinue"]);
  if (item.compactedPriorityItems > item.originalWorkItems) fail(`manual residual compression invalid ${item.residualId}`);
}

if (!artifact.aiBurdenReduction || artifact.aiBurdenReduction.originalBlockedWorkItems < 1700) fail("missing AI burden reduction");
if (artifact.aiBurdenReduction.compactedManualPriorityItems !== artifact.totals.compactedManualPriorityItems) fail("compacted manual count mismatch");
if (artifact.aiBurdenReduction.aiPrecompressedItems < 1600) fail("AI burden reduction too small");
if (!artifact.ontologyMap || artifact.ontologyMap.entities_count < 590 || artifact.ontologyMap.relationships_count < 580) fail("ontology map too thin");

const text = JSON.stringify(artifact).toLowerCase();
for (const forbidden of [
  "recommended buy",
  "recommended sell",
  "guaranteed return",
  "profit target",
  "approved for release",
  "learner-facing approved",
  "broker workflow ready",
  "auto-trading enabled",
]) {
  if (text.includes(forbidden)) fail(`forbidden phrase found: ${forbidden}`);
}

console.log(JSON.stringify({
  ok: true,
  precheckStatus: artifact.precheckStatus,
  moduleDossiers: artifact.totals.moduleDossiers,
  lessonDraftSeeds: artifact.totals.lessonDraftSeeds,
  sourceFitPrecheckRows: artifact.totals.sourceFitPrecheckRows,
  course5RewriteDrafts: artifact.totals.course5RewriteDrafts,
  videoModuleMappings: artifact.totals.videoModuleMappings,
  compactedManualPriorityItems: artifact.totals.compactedManualPriorityItems,
  aiPrecompressedItems: artifact.aiBurdenReduction.aiPrecompressedItems,
  sourceFitPrecheckCounts: artifact.sourceFitPrecheckCounts,
}, null, 2));
