import fs from "node:fs";

const inputPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_003_INPUT.json";
const validationPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_003_VALIDATION.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_003_INPUT.md";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_003_VALIDATION.md";

function fail(message) {
  throw new Error(message);
}

function readJson(path) {
  if (!fs.existsSync(path)) fail(`missing ${path}`);
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function assertBoundary(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must keep approvalStatus:not_approved`);
  if (artifact.writeAllowedNow !== false) fail(`${name} must keep writeAllowedNow:false`);
}

const input = readJson(inputPath);
const validation = readJson(validationPath);
assertBoundary("input", input);
assertBoundary("validation", validation);

for (const path of [inputMdPath, validationMdPath]) {
  if (!fs.existsSync(path)) fail(`missing ${path}`);
}

if (input.inputTemplateStatus !== "course_5_wave_5_pdf_ai_visual_review_batch_003_twelve_rows_ready_for_reviewer_confirmation") fail("unexpected input status");
if (validation.validationStatus !== "course_5_wave_5_pdf_ai_visual_review_batch_003_partially_ready_release_and_deletion_blocked") fail("unexpected validation status");
if (validation.validationMode !== "wave_5_pdf_ai_visual_review_batch_003_gate") fail("unexpected validation mode");
if (validation.inputRows !== 85) fail(`expected 85 input rows, got ${validation.inputRows}`);
if (validation.batchRows !== 12) fail(`expected 12 batch rows, got ${validation.batchRows}`);
if (validation.readyRows !== 12) fail(`expected 12 ready rows, got ${validation.readyRows}`);
if (validation.blockedRows !== 73) fail(`expected 73 blocked rows, got ${validation.blockedRows}`);
if (validation.missingFieldRows !== 73) fail(`expected 73 missing field rows, got ${validation.missingFieldRows}`);
if (validation.forbiddenHitRows !== 0) fail(`expected 0 forbidden hit rows, got ${validation.forbiddenHitRows}`);
if (validation.acceptedForWave5PdfSemanticReviewRows !== 0) fail("wave 5 semantic acceptances must remain 0");
if (validation.acceptedForModuleDistillationRows !== 0) fail("module distillation acceptances must remain 0");
if (validation.acceptedForDeletionReadinessRows !== 0) fail("deletion-readiness acceptances must remain 0");
if (validation.sourceFolderMayBeDeleted !== false) fail("source folder removal must remain blocked");
if (validation.learnerReadyModules !== 0) fail("learner-ready modules must remain 0");

const expectedIds = input.rows.slice(24, 36).map((row) => row.reviewRowId);
const batchRows = validation.validationRows.filter((row) => row.batchRow);
const actualIds = batchRows.map((row) => row.reviewRowId);
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) fail(`unexpected batch ids ${actualIds.join(",")}`);
for (const row of batchRows) {
  if (row.readyForReviewerConfirmation !== true) fail(`${row.reviewRowId} should be ready for reviewer confirmation`);
  if (row.issues.length !== 0) fail(`${row.reviewRowId} should have no issues`);
  if (!fs.existsSync(row.sampleImagePath)) fail(`${row.reviewRowId} sample image missing`);
}

console.log(JSON.stringify({
  ok: true,
  validationStatus: validation.validationStatus,
  inputRows: validation.inputRows,
  batchRows: validation.batchRows,
  readyRows: validation.readyRows,
  blockedRows: validation.blockedRows,
  sourceFolderMayBeDeleted: validation.sourceFolderMayBeDeleted,
}, null, 2));
