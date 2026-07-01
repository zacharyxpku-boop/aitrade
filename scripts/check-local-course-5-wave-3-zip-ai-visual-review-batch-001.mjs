import fs from "node:fs";

const inputPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_001_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_001_INPUT.md";
const validationPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_001_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_3_ZIP_AI_VISUAL_REVIEW_BATCH_001_VALIDATION.md";

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
  if (artifact.sourceFolderMayBeDeleted !== false) fail(`${name} must keep sourceFolderMayBeDeleted:false`);
}

const input = readJson(inputPath);
const validation = readJson(validationPath);
if (!fs.existsSync(inputMdPath)) fail(`missing ${inputMdPath}`);
if (!fs.existsSync(validationMdPath)) fail(`missing ${validationMdPath}`);

assertBoundary("batch input", input);
assertBoundary("batch validation", validation);

if (input.inputTemplateStatus !== "course_5_wave_3_zip_ai_visual_review_batch_001_twelve_rows_ready_for_reviewer_confirmation") fail("unexpected batch input status");
if (validation.validationStatus !== "course_5_wave_3_zip_ai_visual_review_batch_001_partially_ready_release_and_deletion_blocked") fail("unexpected validation status");
if (validation.validationMode !== "wave_3_zip_ai_visual_review_batch_001_gate") fail("unexpected validation mode");
if (input.rows.length !== 61 || validation.inputRows !== 61) fail("batch must keep all 61 Wave 3 rows");
if (input.batchRows !== 12 || validation.batchRows !== 12) fail("batch must cover exactly 12 rows");
if (validation.readyRows !== 12 || validation.blockedRows !== 49) fail("batch ready/blocked counts drift");
if (validation.missingFieldRows !== 49 || validation.forbiddenHitRows !== 0) fail("batch validation quality counts drift");
if (validation.acceptedForWave3SemanticReviewRows !== 0 || validation.acceptedForModuleDistillationRows !== 0 || validation.acceptedForDeletionReadinessRows !== 0) fail("batch must not accept rows for merge/deletion");
if (validation.learnerReadyModules !== 0) fail("batch must not create learner-ready modules");

const readyRows = validation.validationRows.filter((row) => row.readyForWave3AiVisualConfirmationGate);
const readyIds = readyRows.map((row) => row.reviewRowId);
for (const expected of [
  "course5_zip_image_review_025",
  "course5_zip_image_review_026",
  "course5_zip_image_review_027",
  "course5_zip_image_review_028",
  "course5_zip_image_review_029",
  "course5_zip_image_review_030",
  "course5_zip_image_review_031",
  "course5_zip_image_review_032",
  "course5_zip_image_review_033",
  "course5_zip_image_review_034",
  "course5_zip_image_review_035",
  "course5_zip_image_review_036",
]) {
  if (!readyIds.includes(expected)) fail(`missing ready batch row: ${expected}`);
}

for (const row of input.rows.filter((row) => readyIds.includes(row.reviewRowId))) {
  if (row.batchReviewMode !== "ai_visual_review_requires_human_confirmation") fail(`batch mode drift: ${row.reviewRowId}`);
  if (!row.reviewerOwnedVisualObservation || !row.reviewerVisibleTextOrLabelCheck || !row.paraphrasedTeachingConcept || !row.representativenessNote || !row.evidenceLimitations) fail(`batch row missing note fields: ${row.reviewRowId}`);
  if (!row.paraphrasedTeachingConcept.startsWith("Original paraphrase, not copied:")) fail(`batch row missing originality marker: ${row.reviewRowId}`);
  if (row.publicGroundingNeeded !== true) fail(`batch row must require public grounding: ${row.reviewRowId}`);
  if (row.acceptedForWave3SemanticReview !== false || row.acceptedForModuleDistillation !== false || row.acceptedForDeletionReadiness !== false) fail(`batch row must not self-accept: ${row.reviewRowId}`);
}

const boundaryText = `${input.boundary || ""} ${validation.boundary || ""} ${validation.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "model-assisted visual observations",
  "human confirmation",
  "public grounding",
  "originality review",
  "teaching-module distillation",
  "deletion-readiness",
  "does not perform ocr",
  "replace human approval",
  "accept machine drafts as final review",
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
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
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
