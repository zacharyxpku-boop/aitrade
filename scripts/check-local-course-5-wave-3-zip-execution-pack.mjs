import fs from "node:fs";

const packPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_EXECUTION_PACK.json";
const packMdPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_EXECUTION_PACK.md";
const packHtmlPath = "docs/local-course-5-wave-3-zip-execution-pack.html";
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

if (pack.executionPackStatus !== "course_5_wave_3_zip_execution_pack_ready_blocked_on_real_visual_reviewer_input") fail(`unexpected executionPackStatus: ${pack.executionPackStatus}`);
if (pack.waveId !== "wave_3_locally_resolvable_zip_visuals") fail("unexpected wave id");
if (pack.sourceRows !== 6 || pack.pdfSourceRows !== 0 || pack.zipSourceRows !== 6) fail("Wave 3 source counts drift");
if (pack.sampleRows !== 61 || pack.pdfSampleRows !== 0 || pack.zipSampleRows !== 61) fail("Wave 3 sample counts drift");
if (pack.localToolResolvableSourceRows !== 6 || pack.ocrBlockedSourceRows !== 0) fail("Wave 3 execution mode counts drift");
if (pack.readyReviewerInputRows !== 0 || pack.blockedReviewerInputRows !== 61) fail("Wave 3 reviewer input should be fully blocked");
if (pack.acceptedForModuleDistillationRows !== 0 || pack.acceptedForDeletionReadinessRows !== 0) fail("Wave 3 pack must not accept rows");
if (pack.learnerReadyModules !== 0) fail("no learner-ready modules allowed");
if (pack.sourceFolderMayBeDeleted !== false || pack.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("source deletion boundary drift");
if (pack.deletionReadinessStatus !== "course_5_source_folder_not_deletable_absorption_incomplete") fail("deletion readiness status drift");
if (!Array.isArray(pack.affectedModules) || pack.affectedModules.length !== 5) fail("Wave 3 affected module count drift");

if (!Array.isArray(pack.sourceRowsDetail) || pack.sourceRowsDetail.length !== 6) fail("sourceRowsDetail must cover 6 Wave 3 rows");
if (!Array.isArray(pack.sampleRowsDetail) || pack.sampleRowsDetail.length !== 61) fail("sampleRowsDetail must cover 61 Wave 3 samples");

const expectedWaveIds = new Set(priorityPlan.priorityRows.filter((row) => row.resolutionWave === pack.waveId).map((row) => row.recordId));
for (const row of pack.sourceRowsDetail) {
  if (!expectedWaveIds.has(row.recordId)) fail(`source row not in priority plan Wave 3: ${row.recordId}`);
  if (row.extension !== ".zip") fail(`source row must be ZIP: ${row.recordId}`);
  if (row.priorityBand !== "P2_followup_blocker") fail(`source row must be P2: ${row.recordId}`);
  if (row.sampleRows <= 0) fail(`source row missing samples: ${row.recordId}`);
  if (row.canFullyResolveWithLocalToolsNow !== true) fail(`Wave 3 source should be locally resolvable: ${row.recordId}`);
  if (row.acceptedForModuleDistillation !== false || row.acceptedForDeletionReadiness !== false) fail(`source row acceptance boundary drift: ${row.recordId}`);
  if (row.learnerModuleMergeAllowedNow !== false || row.deletionEvidenceAllowedNow !== false) fail(`source row merge/delete gate drift: ${row.recordId}`);
  if (row.sourceFolderMayBeDeleted !== false) fail(`source row deletion drift: ${row.recordId}`);
  assertBoundary(`source row ${row.recordId}`, row);
}

for (const row of pack.sampleRowsDetail) {
  if (!expectedWaveIds.has(row.recordId)) fail(`sample row not in Wave 3: ${row.reviewRowId}`);
  if (row.sourceType !== "zip") fail(`sample row must be ZIP: ${row.reviewRowId}`);
  if (row.priorityBand !== "P2_followup_blocker") fail(`sample row must be P2: ${row.reviewRowId}`);
  if (!row.sampleImagePath || row.sampleImageExists !== true) fail(`sample image missing: ${row.reviewRowId}`);
  if (!Array.isArray(row.requiredFields) || row.requiredFields.length < 8) fail(`required fields missing: ${row.reviewRowId}`);
  if (row.readyNow !== false) fail(`sample row cannot be ready: ${row.reviewRowId}`);
  if (row.sourceFolderMayBeDeleted !== false) fail(`sample deletion boundary drift: ${row.reviewRowId}`);
  assertBoundary(`sample row ${row.reviewRowId}`, row);
}

for (const artifactPath of [
  pack.sourcePriorityPlan,
  pack.sourceZipPrioritySlice,
  pack.sourceDeletionReadiness,
]) {
  if (!fs.existsSync(artifactPath)) fail(`missing linked artifact: ${artifactPath}`);
}

for (const needle of [
  "Course 5 Wave 3 ZIP Execution Pack",
  "source rows",
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
  "six locally resolvable zip visual source blockers",
  "representative image samples",
  "reviewer-owned visual input",
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
  zipSourceRows: pack.zipSourceRows,
  sampleRows: pack.sampleRows,
  zipSampleRows: pack.zipSampleRows,
  blockedReviewerInputRows: pack.blockedReviewerInputRows,
  sourceFolderMayBeDeleted: pack.sourceFolderMayBeDeleted,
}, null, 2));
