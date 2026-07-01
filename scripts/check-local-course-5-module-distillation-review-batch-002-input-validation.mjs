import fs from "node:fs";

const validationPath = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_002_INPUT_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_002_INPUT_VALIDATION.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const report = readJson(validationPath);
if (!fs.existsSync(validationMdPath)) fail(`missing ${validationMdPath}`);

if (report.educationOnly !== true) fail("validation must keep educationOnly:true");
if (report.productionReady !== false) fail("validation must keep productionReady:false");
if (report.learnerFacingRelease !== false) fail("validation must keep learnerFacingRelease:false");
if (report.approvalStatus !== "not_approved") fail("validation must keep approvalStatus:not_approved");
if (report.writeAllowedNow !== false) fail("validation must keep writeAllowedNow:false");
if (report.validationStatus !== "course_5_module_distillation_batch_002_input_blocked_missing_or_invalid_real_input") {
  fail(`unexpected validationStatus for blank template: ${report.validationStatus}`);
}
if (report.validationMode !== "batch_002_visual_ocr_reviewer_input_gate") fail("validation mode should identify batch 002");
if (report.inputRows !== 40) fail("validation must cover batch 002 40 rows");
if (report.readyRows !== 0 || report.blockedRows !== 40) fail("blank template should remain fully blocked");
if (report.missingFieldRows !== 40) fail("blank template should have missing fields on all rows");
if (report.acceptedForModuleDistillationRows !== 0 || report.acceptedForDeletionReadinessRows !== 0) {
  fail("validation must not accept rows for distillation or deletion");
}
if (report.sourceFolderMayBeDeleted !== false) fail("source folder deletion must remain blocked");
if (report.learnerReadyModules !== 0) fail("no Course 5 module may be learner-ready");
if (!Array.isArray(report.validationRows) || report.validationRows.length !== 40) fail("validation rows missing");

for (const row of report.validationRows) {
  if (row.readyForModuleDistillationReviewGate !== false) fail(`blank row must not be ready: ${row.inputId}`);
  if (row.validationStatus !== "blocked_missing_or_invalid_real_input") fail(`unexpected row status: ${row.inputId}`);
  if (!Array.isArray(row.missingFields) || row.missingFields.length < 10) fail(`blank row missing-fields check too weak: ${row.inputId}`);
}

const boundaryText = `${report.boundary || ""} ${report.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "human/ocr-owned visual notes",
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
  validationStatus: report.validationStatus,
  validationMode: report.validationMode,
  inputRows: report.inputRows,
  readyRows: report.readyRows,
  blockedRows: report.blockedRows,
  missingFieldRows: report.missingFieldRows,
  qualityIssueRows: report.qualityIssueRows,
  forbiddenHitRows: report.forbiddenHitRows,
  sourceFolderMayBeDeleted: report.sourceFolderMayBeDeleted,
}, null, 2));
