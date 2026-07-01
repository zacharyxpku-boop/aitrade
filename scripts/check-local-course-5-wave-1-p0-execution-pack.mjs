import fs from "node:fs";

const packPath = "docs/LOCAL_COURSE_5_WAVE_1_P0_EXECUTION_PACK.json";
const packMdPath = "docs/LOCAL_COURSE_5_WAVE_1_P0_EXECUTION_PACK.md";
const packHtmlPath = "docs/local-course-5-wave-1-p0-execution-pack.html";
const priorityPlanPath = "docs/LOCAL_COURSE_5_BLOCKER_RESOLUTION_PRIORITY_PLAN.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must keep approvalStatus:not_approved`);
  if (artifact.writeAllowedNow !== false) fail(`${name} must keep writeAllowedNow:false`);
}

const pack = readJson(packPath);
const priorityPlan = readJson(priorityPlanPath);
if (!fs.existsSync(packMdPath)) fail(`missing ${packMdPath}`);
if (!fs.existsSync(packHtmlPath)) fail(`missing ${packHtmlPath}`);
const html = fs.readFileSync(packHtmlPath, "utf8");

assertBoundary("pack", pack);
assertBoundary("priorityPlan", priorityPlan);

if (pack.executionPackStatus !== "course_5_wave_1_p0_execution_pack_ready_blocked_on_real_reviewer_input") fail(`unexpected executionPackStatus: ${pack.executionPackStatus}`);
if (pack.waveId !== "wave_1_p0_space_and_curriculum_blockers") fail("unexpected wave id");
if (pack.sourceRows !== 3 || pack.pdfSourceRows !== 2 || pack.zipSourceRows !== 1) fail("Wave 1 source counts drift");
if (pack.sampleRows !== 18 || pack.pdfSampleRows !== 6 || pack.zipSampleRows !== 12) fail("Wave 1 sample counts drift");
if (pack.localToolResolvableSourceRows !== 1 || pack.ocrBlockedSourceRows !== 2) fail("Wave 1 execution mode counts drift");
if (pack.readyReviewerInputRows !== 0 || pack.blockedReviewerInputRows !== 18) fail("Wave 1 reviewer input should be fully blocked");
if (pack.acceptedForModuleDistillationRows !== 0 || pack.acceptedForDeletionReadinessRows !== 0) fail("Wave 1 pack must not accept rows");
if (pack.learnerReadyModules !== 0) fail("no learner-ready modules allowed");
if (pack.sourceFolderMayBeDeleted !== false || pack.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("source deletion boundary drift");
if (pack.deletionReadinessStatus !== "course_5_source_folder_not_deletable_absorption_incomplete") fail("deletion readiness status drift");
if (!Array.isArray(pack.affectedModules) || pack.affectedModules.join(",") !== "chart_pattern_encyclopedia,terminology_glossary") fail("Wave 1 affected modules drift");

if (!Array.isArray(pack.sourceRowsDetail) || pack.sourceRowsDetail.length !== 3) fail("sourceRowsDetail must cover 3 Wave 1 rows");
if (!Array.isArray(pack.sampleRowsDetail) || pack.sampleRowsDetail.length !== 18) fail("sampleRowsDetail must cover 18 Wave 1 samples");

const expectedWaveIds = new Set(priorityPlan.priorityRows.filter((row) => row.resolutionWave === pack.waveId).map((row) => row.recordId));
for (const row of pack.sourceRowsDetail) {
  if (!expectedWaveIds.has(row.recordId)) fail(`source row not in priority plan Wave 1: ${row.recordId}`);
  if (row.priorityBand !== "P0_space_and_curriculum_blocker") fail(`source row must be P0: ${row.recordId}`);
  if (row.sampleRows <= 0) fail(`source row missing samples: ${row.recordId}`);
  if (row.acceptedForModuleDistillation !== false || row.acceptedForDeletionReadiness !== false) fail(`source row acceptance boundary drift: ${row.recordId}`);
  if (row.learnerModuleMergeAllowedNow !== false || row.deletionEvidenceAllowedNow !== false) fail(`source row merge/delete gate drift: ${row.recordId}`);
  if (row.sourceFolderMayBeDeleted !== false) fail(`source row deletion drift: ${row.recordId}`);
  assertBoundary(`source row ${row.recordId}`, row);
}

for (const row of pack.sampleRowsDetail) {
  if (!expectedWaveIds.has(row.recordId)) fail(`sample row not in Wave 1: ${row.reviewRowId}`);
  if (row.priorityBand !== "P0_space_and_curriculum_blocker") fail(`sample row must be P0: ${row.reviewRowId}`);
  if (!row.sampleImagePath || row.sampleImageExists !== true) fail(`sample image missing: ${row.reviewRowId}`);
  if (!Array.isArray(row.requiredFields) || row.requiredFields.length < 7) fail(`required fields missing: ${row.reviewRowId}`);
  if (row.readyNow !== false) fail(`sample row cannot be ready: ${row.reviewRowId}`);
  if (row.sourceFolderMayBeDeleted !== false) fail(`sample deletion boundary drift: ${row.reviewRowId}`);
  assertBoundary(`sample row ${row.reviewRowId}`, row);
}

for (const artifactPath of [
  pack.sourcePriorityPlan,
  pack.sourcePdfPrioritySlice,
  pack.sourceZipPrioritySlice,
  pack.sourceDeletionReadiness,
]) {
  if (!fs.existsSync(artifactPath)) fail(`missing linked artifact: ${artifactPath}`);
}

for (const needle of [
  "Course 5 Wave 1 P0 Execution Pack",
  "source rows",
  "PDF source rows",
  "ZIP source rows",
  "sample rows",
  "blocked reviewer rows",
  "source folder may be deleted",
]) {
  if (!html.includes(needle)) fail(`HTML missing: ${needle}`);
}

const boundaryText = `${pack.boundary || ""} ${pack.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "first three p0 source blockers",
  "representative zip/pdf visual samples",
  "reviewer-owned visual or ocr input",
  "semantic merge preview",
  "public grounding",
  "deletion-readiness",
  "does not perform ocr",
  "generate reviewer conclusions",
  "accept machine drafts as human review",
  "merge content into learner-facing modules",
  "delete files",
  "source-folder deletion",
  "learner-facing release",
  "copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary/completion missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  executionPackStatus: pack.executionPackStatus,
  sourceRows: pack.sourceRows,
  pdfSourceRows: pack.pdfSourceRows,
  zipSourceRows: pack.zipSourceRows,
  sampleRows: pack.sampleRows,
  pdfSampleRows: pack.pdfSampleRows,
  zipSampleRows: pack.zipSampleRows,
  blockedReviewerInputRows: pack.blockedReviewerInputRows,
  sourceFolderMayBeDeleted: pack.sourceFolderMayBeDeleted,
}, null, 2));
