import fs from "node:fs";

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const inputPath = argValue("--input", "docs/reviewer-inputs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_001_INPUT_COPY_TEMPLATE.json");
const batchPath = argValue("--batch", "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_001.json");
const outputJsonPath = argValue("--output-json", "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_001_INPUT_VALIDATION.json");
const outputMdPath = argValue("--output-md", "docs/LOCAL_COURSE_5_MODULE_DISTILLATION_REVIEW_BATCH_001_INPUT_VALIDATION.md");

const forbiddenPhrases = [
  "buy signal",
  "sell signal",
  "must buy",
  "must sell",
  "recommended buy",
  "recommended sell",
  "guaranteed return",
  "win rate",
  "profit target",
  "stop loss instruction",
  "real money",
  "broker",
  "auto trading",
  "approved for release",
  "learner-facing approved",
  "write allowed",
  "delete source",
];

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

function text(value) {
  return String(value || "").trim();
}

function forbiddenHits(value) {
  const blob = String(value || "").toLowerCase();
  return forbiddenPhrases.filter((phrase) => blob.includes(phrase.toLowerCase()));
}

const input = readJson(inputPath);
const batch = readJson(batchPath);
assertBoundary("batch input", input);
assertBoundary("batch", batch);

const batchNumber = String(batch.batchId || "course5-module-distillation-review-batch-001").match(/batch-(\d+)/)?.[1] || "001";
const batchLabel = `batch_${batchNumber}`;
const batchTitle = `Batch ${Number(batchNumber)}`;

if (batch.selectedRows !== 40 || !Array.isArray(batch.batchRows)) fail(`${batchTitle} must contain 40 rows`);
if (!Array.isArray(input.rows) || input.rows.length !== 40) fail(`${batchTitle} input must contain 40 rows`);

const batchIds = new Set(batch.batchRows.map((row) => row.inputId));
const inputIds = new Set(input.rows.map((row) => row.inputId));
for (const id of batchIds) {
  if (!inputIds.has(id)) fail(`input is missing batch row ${id}`);
}
if (inputIds.size !== input.rows.length) fail("input contains duplicate inputId rows");

const validationRows = [];
for (const row of input.rows) {
  const editable = row.editableReviewerInput || {};
  const rowIssues = [];
  const requiredFields = [
    "reviewerName",
    "reviewedAt",
    "visibleElements",
    "visualSemanticNote",
    "ocrOrManualText",
    "uncertaintyNotes",
    "moduleDisposition",
    "publicGroundingNeeded",
    "originalRewriteGuidance",
    "sourceRetentionDecision",
  ];
  const missingFields = requiredFields.filter((field) => !text(editable[field]));
  const joinedInput = Object.values(editable).map(text).join("\n");
  const candidateSummary = text(row.candidateSummaryForOrientationOnly);

  if (missingFields.length) rowIssues.push(`missing_fields:${missingFields.join(",")}`);
  if (candidateSummary && joinedInput.includes(candidateSummary.slice(0, Math.min(90, candidateSummary.length)))) {
    rowIssues.push("editable_input_copies_machine_candidate_summary");
  }
  if (/machine-assisted|orientation only|candidateSummaryForOrientationOnly/i.test(joinedInput)) {
    rowIssues.push("editable_input_mentions_machine_orientation_as_authority");
  }
  if (!row.allowedModuleDispositionValues?.includes(editable.moduleDisposition)) rowIssues.push("invalid_moduleDisposition");
  if (!row.allowedSourceRetentionDecisionValues?.includes(editable.sourceRetentionDecision)) rowIssues.push("invalid_sourceRetentionDecision");
  const hits = forbiddenHits(joinedInput);
  if (hits.length) rowIssues.push(`forbidden_phrases:${hits.join(",")}`);
  if (text(joinedInput) && !/paraphrase|rewrite|original|not copied|no copy/i.test(joinedInput)) {
    rowIssues.push("missing_originality_or_paraphrase_statement");
  }
  if (row.acceptedForModuleDistillation !== false) rowIssues.push("row_must_not_self_accept_module_distillation");
  if (row.acceptedForDeletionReadiness !== false) rowIssues.push("row_must_not_self_accept_deletion_readiness");
  if (row.learnerFacingRelease !== false || row.productionReady !== false || row.writeAllowedNow !== false || row.approvalStatus !== "not_approved") {
    rowIssues.push("release_boundary_drift");
  }
  if (!fs.existsSync(row.sampleImagePath)) rowIssues.push("sample_image_missing");

  validationRows.push({
    inputId: row.inputId,
    batchRowId: row.batchRowId,
    primaryModuleId: row.primaryModuleId,
    sourceTier: row.sourceTier,
    validationStatus: rowIssues.length ? "blocked_missing_or_invalid_real_input" : "ready_for_module_distillation_review_gate",
    readyForModuleDistillationReviewGate: rowIssues.length === 0,
    missingFields,
    qualityIssues: rowIssues.filter((issue) => !issue.startsWith("missing_fields:")),
    forbiddenHits: hits,
    nextGate: rowIssues.length
      ? "fill_real_reviewer_or_ocr_fields_then_revalidate"
      : "route_ready_row_to_distillation_merge_preview_after_public_grounding_check",
  });
}

const readyRows = validationRows.filter((row) => row.readyForModuleDistillationReviewGate).length;
const blockedRows = validationRows.length - readyRows;
const missingFieldRows = validationRows.filter((row) => row.missingFields.length).length;
const qualityIssueRows = validationRows.filter((row) => row.qualityIssues.length).length;
const forbiddenHitRows = validationRows.filter((row) => row.forbiddenHits.length).length;

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  validationStatus: readyRows === validationRows.length
    ? `course_5_module_distillation_${batchLabel}_input_valid_release_still_locked`
    : `course_5_module_distillation_${batchLabel}_input_blocked_missing_or_invalid_real_input`,
  validationMode: `${batchLabel}_visual_ocr_reviewer_input_gate`,
  inputPath,
  batchPath,
  inputRows: validationRows.length,
  readyRows,
  blockedRows,
  missingFieldRows,
  qualityIssueRows,
  forbiddenHitRows,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  learnerReadyModules: 0,
  forbiddenPhrases,
  validationRows,
  completionRule: `${batchTitle} input validation passes only when all 40 rows contain real reviewer/OCR-owned fields, valid disposition and retention decisions, no copied machine summaries, no forbidden trading advice language, and no release/delete boundary drift. Passing validation still does not approve learner-facing release or source deletion.`,
  boundary: `Course 5 module distillation ${batchTitle.toLowerCase()} input validation is private reviewer-facing education operations material. It validates human/OCR-owned visual notes, module disposition, public grounding needs, rewrite guidance, and source-retention decisions; it does not generate reviewer conclusions, accept machine drafts as human review, delete files, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.`,
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  `# Course 5 Module Distillation ${batchTitle} Input Validation`,
  "",
  `- Validation status: ${report.validationStatus}`,
  `- Input rows: ${report.inputRows}`,
  `- Ready rows: ${report.readyRows}`,
  `- Blocked rows: ${report.blockedRows}`,
  `- Missing-field rows: ${report.missingFieldRows}`,
  `- Quality-issue rows: ${report.qualityIssueRows}`,
  `- Forbidden-hit rows: ${report.forbiddenHitRows}`,
  `- Source folder may be deleted: ${report.sourceFolderMayBeDeleted}`,
  "",
  "## First Issues",
  "",
  ...validationRows
    .filter((row) => !row.readyForModuleDistillationReviewGate)
    .slice(0, 20)
    .map((row) => `- ${row.inputId}: ${[...row.missingFields, ...row.qualityIssues].join("; ")}`),
  "",
  "## Boundary",
  "",
  report.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  validationStatus: report.validationStatus,
  inputRows: report.inputRows,
  readyRows: report.readyRows,
  blockedRows: report.blockedRows,
  missingFieldRows: report.missingFieldRows,
  qualityIssueRows: report.qualityIssueRows,
  forbiddenHitRows: report.forbiddenHitRows,
  sourceFolderMayBeDeleted: report.sourceFolderMayBeDeleted,
}, null, 2));
