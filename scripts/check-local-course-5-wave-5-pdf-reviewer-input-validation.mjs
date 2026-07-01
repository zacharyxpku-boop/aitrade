import fs from "node:fs";

const validationPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_VALIDATION.md";
const inputPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_EXECUTION_PACK.json";

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
const pack = readJson(packPath);
if (!fs.existsSync(validationMdPath)) fail(`missing ${validationMdPath}`);

assertBoundary("validation", validation);
assertBoundary("input", input);
assertBoundary("pack", pack);

if (validation.validationStatus !== "course_5_wave_5_pdf_reviewer_input_blocked_missing_or_invalid_real_input") fail(`unexpected validationStatus: ${validation.validationStatus}`);
if (validation.validationMode !== "wave_5_pdf_real_reviewer_or_future_loss_input_gate") fail("unexpected validation mode");
if (validation.inputRows !== 85 || validation.pdfRows !== 85 || validation.zipRows !== 0) fail("Wave 5 PDF validation counts drift");
if (validation.readyRows !== 0 || validation.blockedRows !== 85) fail("blank Wave 5 PDF input should be fully blocked");
if (validation.missingFieldRows !== 85) fail("all blank Wave 5 PDF rows should have missing fields");
if (validation.qualityIssueRows !== 0 || validation.forbiddenHitRows !== 0) fail("blank Wave 5 PDF rows should not have quality or forbidden hits");
if (validation.acceptedForWave5PdfSemanticReviewRows !== 0 || validation.acceptedForModuleDistillationRows !== 0 || validation.acceptedForDeletionReadinessRows !== 0) fail("validation must not accept rows");
if (validation.sourceFolderMayBeDeleted !== false || validation.learnerReadyModules !== 0) fail("release/deletion boundary drift");

if (!Array.isArray(validation.validationRows) || validation.validationRows.length !== 85) fail("validationRows must cover 85 rows");
const inputIds = new Set(input.rows.map((row) => row.reviewRowId));
const sampleIds = new Set(pack.sampleRowsDetail.map((row) => row.reviewRowId));
for (const row of validation.validationRows) {
  if (!inputIds.has(row.reviewRowId)) fail(`validation row missing input row: ${row.reviewRowId}`);
  if (!sampleIds.has(row.reviewRowId)) fail(`validation row missing pack sample row: ${row.reviewRowId}`);
  if (row.sourceType !== "pdf") fail(`Wave 5 row must be PDF: ${row.reviewRowId}`);
  if (row.validationStatus !== "blocked_missing_or_invalid_wave_5_pdf_reviewer_input") fail(`blank validation row must be blocked: ${row.reviewRowId}`);
  if (row.readyForWave5PdfSemanticOrFutureLossGate !== false) fail(`blank validation row cannot be ready: ${row.reviewRowId}`);
  if (!Array.isArray(row.missingFields) || row.missingFields.length !== 8) fail(`blank validation row should list 8 missing fields: ${row.reviewRowId}`);
  if (!row.missingFields.includes("futureLossDecision")) fail(`future-loss missing field should be present: ${row.reviewRowId}`);
  if (!Array.isArray(row.qualityIssues) || row.qualityIssues.length !== 0) fail(`blank validation row should only be blocked by missing fields: ${row.reviewRowId}`);
  if (row.nextGate !== "fill_real_wave_5_pdf_reviewer_fields_then_revalidate") fail(`unexpected next gate: ${row.reviewRowId}`);
}

const boundaryText = `${validation.boundary || ""} ${validation.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "29 remaining pdf ocr or future-loss decision blockers",
  "representative page samples",
  "future-loss decision input",
  "reviewer-owned",
  "does not perform ocr",
  "generate reviewer conclusions",
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
  pdfRows: validation.pdfRows,
  zipRows: validation.zipRows,
  readyRows: validation.readyRows,
  blockedRows: validation.blockedRows,
  missingFieldRows: validation.missingFieldRows,
  sourceFolderMayBeDeleted: validation.sourceFolderMayBeDeleted,
}, null, 2));
