import fs from "node:fs";

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

const inputPath = argValue("--input", "docs/reviewer-inputs/LOCAL_COURSE_5_FOLLOWUP_REAL_REVIEWER_INPUT_TEMPLATE.json");
const outputJsonPath = argValue("--output-json", "docs/LOCAL_COURSE_5_FOLLOWUP_REVIEWER_INPUT_VALIDATION.json");
const outputMdPath = argValue("--output-md", "docs/LOCAL_COURSE_5_FOLLOWUP_REVIEWER_INPUT_VALIDATION.md");

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function text(value) {
  return String(value || "").trim();
}

const input = readJson(inputPath);
if (input.educationOnly !== true) fail("input must keep educationOnly:true");
if (input.productionReady !== false) fail("input must keep productionReady:false");
if (input.learnerFacingRelease !== false) fail("input must keep learnerFacingRelease:false");
if (input.approvalStatus !== "not_approved") fail("input must keep approvalStatus:not_approved");
if (input.writeAllowedNow !== false) fail("input must keep writeAllowedNow:false");
if (!Array.isArray(input.rows) || input.rows.length !== 386) fail("expected 386 Course 5 reviewer input rows");

const readyRows = [];
const blockedRows = [];
const issues = [];

for (const row of input.rows) {
  const editable = row.editableReviewerInput || {};
  const required = row.requiredFields || [];
  const missing = required.filter((field) => !text(editable[field]));
  const joinedInput = Object.values(editable).map(text).join("\n");
  const candidateSummary = text(row.candidateSummaryForOrientationOnly);
  const rowIssues = [];
  if (missing.length) rowIssues.push(`missing_fields:${missing.join(",")}`);
  if (candidateSummary && joinedInput.includes(candidateSummary.slice(0, Math.min(90, candidateSummary.length)))) {
    rowIssues.push("editable_input_copies_machine_candidate_summary");
  }
  if (/machine-assisted reviewer orientation/i.test(joinedInput)) rowIssues.push("editable_input_mentions_machine_orientation_as_source");
  if (!row.allowedModuleDispositionValues?.includes(editable.moduleDisposition)) rowIssues.push("invalid_moduleDisposition");
  if (!row.allowedSourceRetentionDecisionValues?.includes(editable.sourceRetentionDecision)) rowIssues.push("invalid_sourceRetentionDecision");
  if (row.acceptedForModuleDistillation !== false) rowIssues.push("row_must_not_self_accept_module_distillation");
  if (row.acceptedForDeletionReadiness !== false) rowIssues.push("row_must_not_self_accept_deletion_readiness");
  if (row.learnerFacingRelease !== false || row.productionReady !== false || row.writeAllowedNow !== false || row.approvalStatus !== "not_approved") {
    rowIssues.push("release_boundary_drift");
  }
  if (rowIssues.length) {
    blockedRows.push(row.inputId);
    issues.push({ inputId: row.inputId, draftId: row.draftId, issues: rowIssues });
  } else {
    readyRows.push(row.inputId);
  }
}

const validation = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  inputPath,
  validationStatus: readyRows.length === input.rows.length
    ? "course_5_followup_reviewer_input_valid_but_release_still_locked"
    : "course_5_followup_reviewer_input_blocked_missing_or_invalid_real_input",
  inputRows: input.rows.length,
  readyRows: readyRows.length,
  blockedRows: blockedRows.length,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  readyRowIds: readyRows,
  blockedRowIds: blockedRows,
  issues: issues.slice(0, 50),
  completionRule: "Reviewer input validation passes only when every row has real reviewer/OCR fields, valid module/source decisions, and no copied machine candidate summary. Passing validation still does not approve learner-facing release or deletion readiness.",
  boundary: "Course 5 follow-up reviewer input validation is private reviewer-facing education operations material. It validates human/OCR-owned input fields and blocks copied machine drafts, release changes, module acceptance, deletion readiness, stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Course 5 Follow-up Reviewer Input Validation",
  "",
  `- Validation status: ${validation.validationStatus}`,
  `- Input rows: ${validation.inputRows}`,
  `- Ready rows: ${validation.readyRows}`,
  `- Blocked rows: ${validation.blockedRows}`,
  `- Source folder may be deleted: ${validation.sourceFolderMayBeDeleted}`,
  "",
  "## First Issues",
  "",
  ...validation.issues.slice(0, 20).map((issue) => `- ${issue.inputId}: ${issue.issues.join("; ")}`),
  "",
  "## Boundary",
  "",
  validation.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  validationStatus: validation.validationStatus,
  inputRows: validation.inputRows,
  readyRows: validation.readyRows,
  blockedRows: validation.blockedRows,
  sourceFolderMayBeDeleted: validation.sourceFolderMayBeDeleted,
}, null, 2));
