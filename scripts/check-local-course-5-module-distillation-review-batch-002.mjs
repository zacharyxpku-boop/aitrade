import fs from "node:fs";

const batchPath = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_002.json";
const inputCopyPath = "docs/reviewer-inputs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_002_INPUT_COPY_TEMPLATE.json";
const previousBatchPath = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_001.json";

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
const previousBatch = readJson(previousBatchPath);
assertBoundary("batch", batch);
assertBoundary("inputCopy", inputCopy);
assertBoundary("previousBatch", previousBatch);

if (batch.batchStatus !== "course_5_module_distillation_review_batch_002_ready_blocked_missing_real_input") fail(`unexpected batchStatus: ${batch.batchStatus}`);
if (inputCopy.inputCopyStatus !== "course_5_module_distillation_review_batch_002_input_copy_ready_blank") fail(`unexpected inputCopyStatus: ${inputCopy.inputCopyStatus}`);
if (batch.totalTemplateRows !== 386) fail("batch must be cut from 386-row reviewer template");
if (batch.previouslySelectedRows !== 40) fail("batch 002 must know batch 001 selected 40 rows");
if (batch.selectedRows !== 40 || batch.blockedRows !== 40 || batch.readyRows !== 0) fail("batch row readiness counts drift");
if (batch.remainingRowsAfterBatch !== 306) fail("batch 002 remaining row count drift");
if (batch.p0Rows < 20) fail("batch 002 should preserve P0 priority");
if (batch.modulesCovered < 8) fail("batch 002 should cover remaining primary modules broadly");
if (batch.sourceFolderMayBeDeleted !== false || inputCopy.sourceFolderMayBeDeleted !== false) fail("source folder deletion must remain blocked");
if (batch.learnerReadyModules !== 0) fail("no Course 5 module may be learner-ready");
if (!Array.isArray(batch.batchRows) || batch.batchRows.length !== 40) fail("batch rows missing");
if (!Array.isArray(inputCopy.rows) || inputCopy.rows.length !== 40) fail("input copy rows missing");

const previousIds = new Set(previousBatch.batchRows.map((row) => row.inputId));
const batchIds = new Set();
for (const row of batch.batchRows) {
  if (previousIds.has(row.inputId)) fail(`batch 002 repeats batch 001 inputId: ${row.inputId}`);
  if (batchIds.has(row.inputId)) fail(`duplicate inputId in batch 002: ${row.inputId}`);
  batchIds.add(row.inputId);
  if (!row.sampleImagePath || !fs.existsSync(row.sampleImagePath)) fail(`missing image for ${row.batchRowId}`);
  if (!Array.isArray(row.lessonSeedTargets) || row.lessonSeedTargets.length === 0) fail(`row missing lesson seeds: ${row.batchRowId}`);
  if (row.validationStatus !== "blocked_missing_real_reviewer_input") fail(`row validation drift: ${row.batchRowId}`);
  if (row.acceptedForModuleDistillation !== false || row.acceptedForDeletionReadiness !== false) fail(`row acceptance drift: ${row.batchRowId}`);
}

console.log(JSON.stringify({
  ok: true,
  batchStatus: batch.batchStatus,
  selectedRows: batch.selectedRows,
  previouslySelectedRows: batch.previouslySelectedRows,
  remainingRowsAfterBatch: batch.remainingRowsAfterBatch,
  modulesCovered: batch.modulesCovered,
  p0Rows: batch.p0Rows,
  nonP0Rows: batch.nonP0Rows,
  sourceFolderMayBeDeleted: batch.sourceFolderMayBeDeleted,
}, null, 2));
