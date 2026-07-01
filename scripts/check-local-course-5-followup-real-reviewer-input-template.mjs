import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_FOLLOWUP_REAL_REVIEWER_INPUT_TEMPLATE.json";
const templateMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_FOLLOWUP_REAL_REVIEWER_INPUT_TEMPLATE.md";
const validationPath = "docs/LOCAL_COURSE_5_FOLLOWUP_REVIEWER_INPUT_VALIDATION.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const template = readJson(templatePath);
if (!fs.existsSync(templateMdPath)) fail(`missing ${templateMdPath}`);
const validation = fs.existsSync(validationPath) ? readJson(validationPath) : null;

if (template.educationOnly !== true) fail("template must keep educationOnly:true");
if (template.productionReady !== false) fail("template must keep productionReady:false");
if (template.learnerFacingRelease !== false) fail("template must keep learnerFacingRelease:false");
if (template.approvalStatus !== "not_approved") fail("template must keep approvalStatus:not_approved");
if (template.writeAllowedNow !== false) fail("template must keep writeAllowedNow:false");
if (template.inputTemplateStatus !== "course_5_followup_real_reviewer_input_template_ready_blocked_missing_input") fail("unexpected inputTemplateStatus");
if (template.inputRows !== 386) fail("expected 386 input rows");
if (template.p0InputRows !== 282) fail("expected 282 P0 input rows");
if (template.nonP0InputRows !== 104) fail("expected 104 non-P0 input rows");
if (template.readyRows !== 0) fail("template must not contain ready rows");
if (template.blockedRows !== 386) fail("template should mark all rows blocked");
if (template.acceptedForModuleDistillationRows !== 0 || template.acceptedForDeletionReadinessRows !== 0) fail("template must not accept rows");
if (template.sourceFolderMayBeDeleted !== false) fail("source folder deletion must remain blocked");

if (!Array.isArray(template.rows) || template.rows.length !== 386) fail("rows count mismatch");
const ids = new Set(template.rows.map((row) => row.inputId));
if (ids.size !== 386) fail("input IDs must be unique");

const badRows = template.rows.filter((row) =>
  row.validationStatus !== "blocked_missing_real_reviewer_input" ||
  row.acceptedForModuleDistillation !== false ||
  row.acceptedForDeletionReadiness !== false ||
  row.learnerFacingRelease !== false ||
  row.approvalStatus !== "not_approved" ||
  row.productionReady !== false ||
  row.writeAllowedNow !== false ||
  !Array.isArray(row.requiredFields) ||
  row.requiredFields.length < 10 ||
  !row.requiredFields.includes("visualSemanticNote") ||
  !row.requiredFields.includes("sourceRetentionDecision") ||
  !row.editableReviewerInput ||
  Object.values(row.editableReviewerInput).some((value) => String(value || "").trim() !== "")
);
if (badRows.length) fail(`bad template rows: ${badRows.slice(0, 3).map((row) => row.inputId).join(", ")}`);

if (validation) {
  if (validation.inputRows !== 386) fail("validation input count drift");
  if (validation.readyRows !== 0) fail("template validation must have zero ready rows");
  if (validation.blockedRows !== 386) fail("template validation must block all rows");
  if (validation.sourceFolderMayBeDeleted !== false) fail("validation must keep deletion blocked");
}

const boundaryText = `${template.boundary || ""} ${template.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education",
  "blank fields",
  "ocr or human visual notes",
  "module disposition",
  "source-retention decisions",
  "does not generate reviewer notes",
  "accept machine drafts as human review",
  "delete files",
  "learner-facing release",
  "copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary/completion missing phrase: ${phrase}`);
}

if (!Array.isArray(template.commands) || !template.commands.some((command) => /validate:local-course-5-followup-reviewer-input/.test(command))) {
  fail("commands must include reviewer input validation");
}

console.log(JSON.stringify({
  ok: true,
  inputTemplateStatus: template.inputTemplateStatus,
  inputRows: template.inputRows,
  p0InputRows: template.p0InputRows,
  nonP0InputRows: template.nonP0InputRows,
  readyRows: template.readyRows,
  blockedRows: template.blockedRows,
  sourceFolderMayBeDeleted: template.sourceFolderMayBeDeleted,
}, null, 2));
