import fs from "node:fs";

const validationPath = "docs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_REVIEW_INPUT_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_REVIEW_INPUT_VALIDATION.md";
const inputPath = "docs/reviewer-inputs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_REVIEW_INPUT_TEMPLATE.json";
const draftsPath = "docs/LOCAL_COURSE_5_ZIP_MACHINE_VISUAL_SEMANTIC_DRAFTS.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const validation = readJson(validationPath);
const input = readJson(inputPath);
const drafts = readJson(draftsPath);
if (!fs.existsSync(validationMdPath)) fail(`missing ${validationMdPath}`);

for (const [name, artifact] of Object.entries({ validation, input, drafts })) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must keep approvalStatus:not_approved`);
  if (artifact.writeAllowedNow !== false) fail(`${name} must keep writeAllowedNow:false`);
}

if (validation.validationStatus !== "course_5_zip_image_package_review_input_blocked_missing_or_invalid_real_visual_input") fail(`unexpected validationStatus: ${validation.validationStatus}`);
if (validation.validationMode !== "zip_image_package_real_visual_reviewer_input_gate") fail("unexpected validation mode");
if (validation.inputRows !== 85 || validation.readyRows !== 0 || validation.blockedRows !== 85) fail("ZIP validation should start fully blocked");
if (validation.missingFieldRows !== 85) fail("all blank ZIP input rows should have missing fields");
if (validation.forbiddenHitRows !== 0) fail("blank template should not have forbidden phrase hits");
if (validation.acceptedForZipSemanticReviewRows !== 0 || validation.acceptedForModuleDistillationRows !== 0 || validation.acceptedForDeletionReadinessRows !== 0) fail("validation must not accept rows");
if (validation.sourceFolderMayBeDeleted !== false || validation.learnerReadyModules !== 0) fail("release/deletion boundary drift");
if (!Array.isArray(validation.validationRows) || validation.validationRows.length !== 85) fail("validationRows must cover 85 rows");

const inputIds = new Set(input.rows.map((row) => row.reviewRowId));
const draftIds = new Set(drafts.draftRows.map((row) => row.reviewRowId));
for (const row of validation.validationRows) {
  if (!inputIds.has(row.reviewRowId)) fail(`validation row missing input row: ${row.reviewRowId}`);
  if (!draftIds.has(row.reviewRowId)) fail(`validation row missing draft row: ${row.reviewRowId}`);
  if (row.validationStatus !== "blocked_missing_or_invalid_real_visual_input") fail(`blank validation row must be blocked: ${row.reviewRowId}`);
  if (row.readyForZipSemanticReviewGate !== false) fail(`blank validation row cannot be ready: ${row.reviewRowId}`);
  if (!Array.isArray(row.missingFields) || row.missingFields.length < 7) fail(`blank validation row should list missing fields: ${row.reviewRowId}`);
  if (row.nextGate !== "fill_real_visual_reviewer_fields_then_revalidate") fail(`unexpected next gate: ${row.reviewRowId}`);
}

const boundaryText = `${validation.boundary || ""} ${validation.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "human-owned visual notes",
  "paraphrased concept notes",
  "deletion-readiness evidence",
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
