import fs from "node:fs";

const matrixPath = "docs/LOCAL_COURSE_5_SOURCE_TO_MODULE_COVERAGE_MATRIX.json";
const matrixMdPath = "docs/LOCAL_COURSE_5_SOURCE_TO_MODULE_COVERAGE_MATRIX.md";
const matrixHtmlPath = "docs/local-course-5-source-to-module-coverage-matrix.html";
const intakePath = "docs/LOCAL_COURSE_5_DOCUMENT_INTAKE.json";
const teachingPath = "docs/LOCAL_COURSE_5_TEACHING_MODULE_DISTILLATION.json";

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

const matrix = readJson(matrixPath);
const intake = readJson(intakePath);
const teaching = readJson(teachingPath);
if (!fs.existsSync(matrixMdPath)) fail(`missing ${matrixMdPath}`);
if (!fs.existsSync(matrixHtmlPath)) fail(`missing ${matrixHtmlPath}`);
const html = fs.readFileSync(matrixHtmlPath, "utf8");

assertBoundary("matrix", matrix);
assertBoundary("intake", intake);
assertBoundary("teaching", teaching);

if (matrix.matrixStatus !== "course_5_source_to_module_coverage_matrix_ready_release_and_deletion_blocked") fail(`unexpected matrixStatus: ${matrix.matrixStatus}`);
if (matrix.totalFiles !== 134 || matrix.sourceRows !== 134) fail("matrix must cover all 134 Course 5 files");
if (matrix.uniquePrimaryRows !== 131) fail("unique primary row count drift");
if (matrix.textAbsorbedRows !== 82) fail("text absorbed row count drift");
if (matrix.followupRequiredRows !== 49) fail("follow-up row count drift");
if (matrix.duplicateRows !== 3) fail("duplicate row count drift");
if (matrix.totalExtractedChars < 15315443) fail("extracted chars regressed");
if (matrix.knowledgeNodeCandidateRows !== 675) fail("knowledge node candidate count drift");
if (matrix.modules !== 13 || matrix.modulesWithSourceRows !== 13) fail("module coverage must include all 13 modules");
if (matrix.modulesWithFollowupBlockers !== 11) fail("module blocker count drift");
if (matrix.modulesLearnerReady !== 0) fail("no learner-ready modules allowed");
if (matrix.acceptedForModuleDistillationRows !== 0 || matrix.acceptedForDeletionReadinessRows !== 0) fail("matrix must not accept rows");
if (matrix.sourceFolderMayBeDeleted !== false || matrix.currentKnowledgeArtifactsCanReplaceSourceFolder !== false) fail("source deletion boundary drift");
if (matrix.deletionReadinessStatus !== "course_5_source_folder_not_deletable_absorption_incomplete") fail("deletion readiness status drift");

if (!Array.isArray(matrix.sourceRowsDetail) || matrix.sourceRowsDetail.length !== 134) fail("sourceRowsDetail must cover 134 rows");
if (!Array.isArray(matrix.moduleRows) || matrix.moduleRows.length !== 13) fail("moduleRows must cover 13 modules");

const intakeIds = new Set(intake.rows.map((row) => row.recordId));
const matrixPhysicalKeys = new Set();
for (const row of matrix.sourceRowsDetail) {
  if (!intakeIds.has(row.recordId)) fail(`matrix row missing from intake: ${row.recordId}`);
  const physicalKey = `${row.sourceRowNo}:${row.relativePath}:${row.sha256}`;
  if (matrixPhysicalKeys.has(physicalKey)) fail(`duplicate matrix physical row: ${physicalKey}`);
  matrixPhysicalKeys.add(physicalKey);
  if (!Array.isArray(row.moduleIds) || row.moduleIds.length === 0) fail(`source row missing moduleIds: ${row.recordId}`);
  if (!["text_absorbed_private_module_candidate", "followup_required_visual_or_ocr_blocked", "duplicate_represented_by_primary_hash"].includes(row.absorptionClass)) {
    fail(`unexpected absorption class for ${row.recordId}: ${row.absorptionClass}`);
  }
  if (row.learnerModuleMergeAllowedNow !== false) fail(`learner module merge must stay closed: ${row.recordId}`);
  if (row.acceptedForModuleDistillation !== false || row.acceptedForDeletionReadiness !== false) fail(`row acceptance boundary drift: ${row.recordId}`);
  if (row.sourceFolderMayBeDeleted !== false) fail(`source folder deletion drift: ${row.recordId}`);
  assertBoundary(`source row ${row.recordId}`, row);
}

const moduleIds = new Set(teaching.moduleRows.map((row) => row.moduleId));
for (const row of matrix.moduleRows) {
  if (!moduleIds.has(row.moduleId)) fail(`matrix module missing from distillation: ${row.moduleId}`);
  if (row.sourceRows <= 0) fail(`module must have source coverage: ${row.moduleId}`);
  if (row.lessonSeedCount < 4) fail(`module lesson seed coverage too thin: ${row.moduleId}`);
  if (row.learnerReady !== false) fail(`module cannot be learner-ready: ${row.moduleId}`);
  if (row.sourceFolderMayBeDeleted !== false) fail(`module deletion boundary drift: ${row.moduleId}`);
  assertBoundary(`module row ${row.moduleId}`, row);
}

for (const artifactPath of [
  matrix.sourceIntake,
  matrix.sourceTeachingDistillation,
  matrix.sourceRetentionManifest,
  matrix.sourceDeletionReadiness,
]) {
  if (!fs.existsSync(artifactPath)) fail(`missing linked artifact: ${artifactPath}`);
}

for (const needle of [
  "Course 5 Source To Module Coverage Matrix",
  "source rows",
  "text absorbed rows",
  "follow-up required rows",
  "modules with blockers",
  "learner-ready modules",
  "source folder may be deleted",
]) {
  if (!html.includes(needle)) fail(`HTML missing: ${needle}`);
}

const boundaryText = `${matrix.boundary || ""} ${matrix.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "teaching-module candidates",
  "follow-up blockers",
  "review gates",
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
  matrixStatus: matrix.matrixStatus,
  sourceRows: matrix.sourceRows,
  textAbsorbedRows: matrix.textAbsorbedRows,
  followupRequiredRows: matrix.followupRequiredRows,
  duplicateRows: matrix.duplicateRows,
  modules: matrix.modules,
  modulesWithFollowupBlockers: matrix.modulesWithFollowupBlockers,
  sourceFolderMayBeDeleted: matrix.sourceFolderMayBeDeleted,
}, null, 2));
