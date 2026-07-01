import fs from "node:fs";

const inputPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_1_P0_AI_VISUAL_REVIEW_PILOT_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_1_P0_AI_VISUAL_REVIEW_PILOT_INPUT.md";
const validationPath = "docs/LOCAL_COURSE_5_WAVE_1_P0_AI_VISUAL_REVIEW_PILOT_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_1_P0_AI_VISUAL_REVIEW_PILOT_VALIDATION.md";

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

assertBoundary("pilot input", input);
assertBoundary("pilot validation", validation);

if (input.inputTemplateStatus !== "course_5_wave_1_p0_ai_visual_review_pilot_twelve_rows_ready_for_reviewer_confirmation") fail("unexpected pilot input status");
if (validation.validationStatus !== "course_5_wave_1_p0_ai_visual_review_pilot_partially_ready_release_and_deletion_blocked") fail("unexpected validation status");
if (validation.validationMode !== "wave_1_p0_ai_visual_review_pilot_gate") fail("unexpected validation mode");
if (input.rows.length !== 18 || validation.inputRows !== 18) fail("pilot must keep all 18 Wave 1 rows");
if (input.pilotRows !== 12 || validation.pilotRows !== 12) fail("pilot must cover exactly 12 rows");
if (validation.readyRows !== 12 || validation.blockedRows !== 6) fail("pilot ready/blocked counts drift");
if (validation.missingFieldRows !== 6 || validation.forbiddenHitRows !== 0) fail("pilot validation quality counts drift");
if (validation.acceptedForWave1SemanticReviewRows !== 0 || validation.acceptedForModuleDistillationRows !== 0 || validation.acceptedForDeletionReadinessRows !== 0) fail("pilot must not accept rows for merge/deletion");
if (validation.learnerReadyModules !== 0) fail("pilot must not create learner-ready modules");

const readyRows = validation.validationRows.filter((row) => row.readyForWave1AiVisualConfirmationGate);
const readyIds = readyRows.map((row) => row.reviewRowId);
for (const expected of [
  "course5_zip_image_review_001",
  "course5_zip_image_review_002",
  "course5_zip_image_review_003",
  "course5_zip_image_review_004",
  "course5_zip_image_review_005",
  "course5_zip_image_review_006",
  "course5_zip_image_review_007",
  "course5_zip_image_review_008",
  "course5_zip_image_review_009",
  "course5_zip_image_review_010",
  "course5_zip_image_review_011",
  "course5_zip_image_review_012",
]) {
  if (!readyIds.includes(expected)) fail(`missing ready pilot row: ${expected}`);
}

for (const row of input.rows.filter((row) => readyIds.includes(row.reviewRowId))) {
  if (row.pilotReviewMode !== "ai_visual_review_requires_human_confirmation") fail(`pilot mode drift: ${row.reviewRowId}`);
  if (!row.reviewerOwnedVisualObservation || !row.reviewerVisibleTextOrLabelCheck || !row.paraphrasedTeachingConcept || !row.representativenessNote || !row.evidenceLimitations) fail(`pilot row missing note fields: ${row.reviewRowId}`);
  if (!row.paraphrasedTeachingConcept.startsWith("Original paraphrase, not copied:")) fail(`pilot row missing originality marker: ${row.reviewRowId}`);
  if (row.publicGroundingNeeded !== true) fail(`pilot row must require public grounding: ${row.reviewRowId}`);
  if (row.acceptedForWave1SemanticReview !== false || row.acceptedForModuleDistillation !== false || row.acceptedForDeletionReadiness !== false) fail(`pilot row must not self-accept: ${row.reviewRowId}`);
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
  pilotRows: validation.pilotRows,
  readyRows: validation.readyRows,
  blockedRows: validation.blockedRows,
  sourceFolderMayBeDeleted: validation.sourceFolderMayBeDeleted,
}, null, 2));
