import fs from "node:fs";

const indexPath = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_INDEX.json";
const indexMdPath = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_INDEX.md";

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

const index = readJson(indexPath);
if (!fs.existsSync(indexMdPath)) fail(`missing ${indexMdPath}`);
assertBoundary("batch index", index);

if (index.indexStatus !== "course_5_module_distillation_review_batch_index_all_cards_batched_release_blocked") fail(`unexpected indexStatus: ${index.indexStatus}`);
if (index.totalReviewerRows !== 386) fail("index must cover 386 reviewer rows");
if (index.totalBatches !== 10) fail("expected 10 batches for 386 rows at batch size 40");
if (index.coveredRows !== 386 || index.remainingRows !== 0) fail("all reviewer rows must be batched");
if (index.duplicateInputIds !== 0) fail("duplicate input IDs must be zero");
if (index.missingImageRows !== 0) fail("missing image rows must be zero");
if (index.readyRows !== 0 || index.blockedRows !== 386) fail("all rows should remain blocked until real input");
if (index.sourceFolderMayBeDeleted !== false || index.learnerReadyModules !== 0) fail("release/delete boundary drift");
if (!Array.isArray(index.batchRows) || index.batchRows.length !== 10) fail("batch rows missing");

const inputIds = new Set();
let totalRows = 0;
for (const row of index.batchRows) {
  for (const file of [row.batchJson, row.inputCopyJson, row.workbenchJson, row.workbenchHtml, row.validationJson]) {
    if (!fs.existsSync(file)) fail(`missing batch artifact: ${file}`);
  }
  const batch = readJson(row.batchJson);
  const inputCopy = readJson(row.inputCopyJson);
  const workbench = readJson(row.workbenchJson);
  const validation = readJson(row.validationJson);
  assertBoundary(`batch ${row.batchNo}`, batch);
  assertBoundary(`input copy ${row.batchNo}`, inputCopy);
  assertBoundary(`workbench ${row.batchNo}`, workbench);
  assertBoundary(`validation ${row.batchNo}`, validation);
  if (batch.selectedRows !== row.selectedRows) fail(`batch row count mismatch: ${row.batchNo}`);
  if (inputCopy.inputRows !== row.selectedRows || workbench.selectedRows !== row.selectedRows || validation.inputRows !== row.selectedRows) {
    fail(`artifact row count mismatch: ${row.batchNo}`);
  }
  if (validation.readyRows !== 0 || validation.blockedRows !== row.selectedRows) fail(`validation should be fully blocked: ${row.batchNo}`);
  for (const batchRow of batch.batchRows) {
    if (inputIds.has(batchRow.inputId)) fail(`duplicate inputId across batches: ${batchRow.inputId}`);
    inputIds.add(batchRow.inputId);
    if (!fs.existsSync(batchRow.sampleImagePath)) fail(`missing image: ${batchRow.sampleImagePath}`);
  }
  totalRows += row.selectedRows;
}

if (inputIds.size !== 386 || totalRows !== 386) fail("cross-batch coverage mismatch");

const boundaryText = `${index.boundary || ""} ${index.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "all 386 visual/ocr reviewer cards",
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

console.log(JSON.stringify({
  ok: true,
  indexStatus: index.indexStatus,
  totalReviewerRows: index.totalReviewerRows,
  totalBatches: index.totalBatches,
  coveredRows: index.coveredRows,
  remainingRows: index.remainingRows,
  missingImageRows: index.missingImageRows,
  sourceFolderMayBeDeleted: index.sourceFolderMayBeDeleted,
}, null, 2));
