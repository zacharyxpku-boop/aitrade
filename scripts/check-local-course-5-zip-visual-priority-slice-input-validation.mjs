import fs from "node:fs";

const validationPath = "docs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE_INPUT_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE_INPUT_VALIDATION.md";
const inputPath = "docs/reviewer-inputs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE_INPUT_TEMPLATE.json";
const slicePath = "docs/LOCAL_COURSE_5_ZIP_VISUAL_PRIORITY_SLICE.json";

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

const validation = readJson(validationPath);
const input = readJson(inputPath);
const slice = readJson(slicePath);
if (!fs.existsSync(validationMdPath)) fail(`missing ${validationMdPath}`);

assertBoundary("validation", validation);
assertBoundary("input", input);
assertBoundary("slice", slice);

if (validation.validationStatus !== "course_5_zip_visual_priority_slice_input_blocked_missing_or_invalid_real_visual_input") fail(`unexpected validationStatus: ${validation.validationStatus}`);
if (validation.validationMode !== "zip_visual_priority_slice_real_reviewer_input_gate") fail("unexpected validation mode");
if (validation.inputRows !== 85 || validation.readyRows !== 0 || validation.blockedRows !== 85) fail("ZIP visual priority validation should start fully blocked");
if (validation.missingFieldRows !== 85) fail("all blank ZIP visual priority rows should have missing fields");
if (validation.qualityIssueRows !== 0) fail("blank ZIP visual priority rows should not have non-field quality issues");
if (validation.forbiddenHitRows !== 0) fail("blank ZIP visual priority input should not have forbidden phrase hits");
if (validation.acceptedForZipSemanticReviewRows !== 0 || validation.acceptedForModuleDistillationRows !== 0 || validation.acceptedForDeletionReadinessRows !== 0) fail("validation must not accept rows");
if (validation.sourceFolderMayBeDeleted !== false || validation.learnerReadyModules !== 0) fail("release/deletion boundary drift");
if (!Array.isArray(validation.validationRows) || validation.validationRows.length !== 85) fail("validationRows must cover 85 ZIP priority rows");

const inputIds = new Set(input.rows.map((row) => row.reviewRowId));
const sampleIds = new Set(slice.sampleRows.map((row) => row.reviewRowId));
for (const row of validation.validationRows) {
  if (!inputIds.has(row.reviewRowId)) fail(`validation row missing input row: ${row.reviewRowId}`);
  if (!sampleIds.has(row.reviewRowId)) fail(`validation row missing ZIP visual priority sample row: ${row.reviewRowId}`);
  if (row.validationStatus !== "blocked_missing_or_invalid_zip_visual_priority_input") fail(`blank validation row must be blocked: ${row.reviewRowId}`);
  if (row.readyForZipVisualPrioritySemanticReviewGate !== false) fail(`blank validation row cannot be ready: ${row.reviewRowId}`);
  if (!Array.isArray(row.missingFields) || row.missingFields.length < 8) fail(`blank validation row should list missing fields: ${row.reviewRowId}`);
  if (!Array.isArray(row.qualityIssues) || row.qualityIssues.length !== 0) fail(`blank validation row should only be blocked by missing fields: ${row.reviewRowId}`);
  if (row.nextGate !== "fill_real_zip_visual_priority_reviewer_fields_then_revalidate") fail(`unexpected next gate: ${row.reviewRowId}`);
}

const boundaryText = `${validation.boundary || ""} ${validation.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "reviewer-owned visual observations",
  "visible text or label checks",
  "paraphrased teaching concepts",
  "module placement",
  "representativeness notes",
  "public-grounding requirements",
  "does not generate reviewer conclusions",
  "accept machine drafts as human review",
  "delete files",
  "learner-facing release",
  "source-folder deletion",
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
  validationStatus: validation.validationStatus,
  inputRows: validation.inputRows,
  readyRows: validation.readyRows,
  blockedRows: validation.blockedRows,
  missingFieldRows: validation.missingFieldRows,
  qualityIssueRows: validation.qualityIssueRows,
  forbiddenHitRows: validation.forbiddenHitRows,
  sourceFolderMayBeDeleted: validation.sourceFolderMayBeDeleted,
}, null, 2));
