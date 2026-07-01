import fs from "node:fs";

const batchPath = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_001.json";
const batchMdPath = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_001.md";
const inputCopyPath = "docs/reviewer-inputs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_001_INPUT_COPY_TEMPLATE.json";
const inputCopyMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_001_INPUT_COPY_TEMPLATE.md";

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

const batch = readJson(batchPath);
const inputCopy = readJson(inputCopyPath);
if (!fs.existsSync(batchMdPath)) fail(`missing ${batchMdPath}`);
if (!fs.existsSync(inputCopyMdPath)) fail(`missing ${inputCopyMdPath}`);

assertBoundary("batch", batch);
assertBoundary("inputCopy", inputCopy);

if (batch.batchStatus !== "course_5_module_distillation_review_batch_001_ready_blocked_missing_real_input") {
  fail(`unexpected batchStatus: ${batch.batchStatus}`);
}
if (inputCopy.inputCopyStatus !== "course_5_module_distillation_review_batch_001_input_copy_ready_blank") {
  fail(`unexpected inputCopyStatus: ${inputCopy.inputCopyStatus}`);
}
if (batch.totalTemplateRows !== 386) fail("batch must be cut from 386-row reviewer template");
if (batch.selectedRows !== 40 || batch.blockedRows !== 40 || batch.readyRows !== 0) fail("batch row readiness counts drift");
if (inputCopy.inputRows !== 40 || inputCopy.blockedRows !== 40 || inputCopy.readyRows !== 0) fail("input copy row counts drift");
if (batch.p0Rows < 20) fail("batch should prioritize P0 rows while preserving module breadth");
if (batch.modulesCovered < 9) fail("batch should cover all 9 primary modules present in the reviewer template");
if (batch.acceptedForModuleDistillationRows !== 0 || batch.acceptedForDeletionReadinessRows !== 0) {
  fail("batch must not accept machine drafts as reviewed");
}
if (batch.sourceFolderMayBeDeleted !== false || inputCopy.sourceFolderMayBeDeleted !== false) fail("source folder deletion must remain blocked");
if (batch.learnerReadyModules !== 0) fail("no Course 5 module may be learner-ready");

if (!Array.isArray(batch.batchRows) || batch.batchRows.length !== 40) fail("batch rows missing");
if (!Array.isArray(inputCopy.rows) || inputCopy.rows.length !== 40) fail("input copy rows missing");

const ids = new Set();
for (const row of batch.batchRows) {
  if (ids.has(row.inputId)) fail(`duplicate inputId in batch: ${row.inputId}`);
  ids.add(row.inputId);
  if (!row.sampleImagePath || !row.primaryModuleId) fail(`row missing image or module: ${row.batchRowId}`);
  if (!Array.isArray(row.lessonSeedTargets) || row.lessonSeedTargets.length === 0) fail(`row missing lesson seeds: ${row.batchRowId}`);
  if (!Array.isArray(row.reviewerQuestions) || row.reviewerQuestions.length === 0) fail(`row missing reviewer questions: ${row.batchRowId}`);
  if (row.validationStatus !== "blocked_missing_real_reviewer_input") fail(`row validation drift: ${row.batchRowId}`);
  if (row.acceptedForModuleDistillation !== false || row.acceptedForDeletionReadiness !== false) fail(`row acceptance drift: ${row.batchRowId}`);
  if (row.productionReady !== false || row.learnerFacingRelease !== false || row.writeAllowedNow !== false || row.approvalStatus !== "not_approved") {
    fail(`row release boundary drift: ${row.batchRowId}`);
  }
  const editable = row.editableReviewerInput || {};
  for (const field of ["reviewerName", "reviewedAt", "visibleElements", "visualSemanticNote", "ocrOrManualText", "uncertaintyNotes", "moduleDisposition", "publicGroundingNeeded", "originalRewriteGuidance", "sourceRetentionDecision"]) {
    if (editable[field] !== "") fail(`template field should remain blank for ${row.batchRowId}: ${field}`);
  }
}

const inputIds = new Set(inputCopy.rows.map((row) => row.inputId));
if (inputIds.size !== ids.size) fail("input copy has duplicate rows");
for (const id of ids) {
  if (!inputIds.has(id)) fail(`input copy missing batch row: ${id}`);
}

const boundaryText = `${batch.boundary || ""} ${batch.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "bounded first set",
  "lesson seeds",
  "does not generate reviewer conclusions",
  "accept machine drafts as human review",
  "delete files",
  "learner-facing release",
  "copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

if (!Array.isArray(batch.commands) || !batch.commands.some((command) => /check:local-course-5-module-distillation-review-batch-001/.test(command))) {
  fail("commands must include batch check");
}

console.log(JSON.stringify({
  ok: true,
  batchStatus: batch.batchStatus,
  selectedRows: batch.selectedRows,
  modulesCovered: batch.modulesCovered,
  p0Rows: batch.p0Rows,
  nonP0Rows: batch.nonP0Rows,
  readyRows: batch.readyRows,
  blockedRows: batch.blockedRows,
  sourceFolderMayBeDeleted: batch.sourceFolderMayBeDeleted,
}, null, 2));
