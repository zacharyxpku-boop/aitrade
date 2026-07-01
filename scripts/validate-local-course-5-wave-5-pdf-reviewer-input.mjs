import fs from "node:fs";

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const inputPath = argValue("--input", "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_TEMPLATE.json");
const packPath = argValue("--pack", "docs/LOCAL_COURSE_5_WAVE_5_PDF_EXECUTION_PACK.json");
const outputJsonPath = argValue("--output-json", "docs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_VALIDATION.json");
const outputMdPath = argValue("--output-md", "docs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_VALIDATION.md");

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

const requiredFields = [
  "reviewerOwnedOcrTextExcerpt",
  "reviewerOwnedVisualObservation",
  "paraphrasedTeachingConcept",
  "modulePlacement",
  "futureLossDecision",
  "evidenceLimitations",
  "reviewerNameOrInitials",
  "reviewedAt",
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
const pack = readJson(packPath);
assertBoundary("Wave 5 PDF reviewer input", input);
assertBoundary("Wave 5 PDF execution pack", pack);

if (!Array.isArray(input.rows) || input.rows.length !== 85) fail("expected 85 Wave 5 PDF reviewer input rows");
if (!Array.isArray(pack.sampleRowsDetail) || pack.sampleRowsDetail.length !== 85) fail("expected 85 Wave 5 PDF execution samples");

const sampleByReviewRowId = new Map(pack.sampleRowsDetail.map((row) => [row.reviewRowId, row]));
const validationRows = input.rows.map((row) => {
  assertBoundary(`Wave 5 PDF reviewer input ${row.reviewRowId}`, row);
  const sample = sampleByReviewRowId.get(row.reviewRowId);
  const rowIssues = [];
  if (!sample) rowIssues.push("missing_matching_wave_5_pdf_sample");
  if (row.sourceType !== "pdf") rowIssues.push("source_type_must_be_pdf");
  if (sample && row.sourceType !== sample.sourceType) rowIssues.push("source_type_mismatch");
  if (!fs.existsSync(row.sampleImagePath)) rowIssues.push("sample_image_missing");
  if (sample && row.sampleImagePath !== sample.sampleImagePath) rowIssues.push("sample_image_path_mismatch");
  if (sample && row.pageNumber !== sample.pageNumber) rowIssues.push("page_number_mismatch");

  const missingFields = requiredFields.filter((field) => !text(row[field]));
  if (missingFields.length) rowIssues.push(`missing_fields:${missingFields.join(",")}`);

  const joinedInput = requiredFields.map((field) => text(row[field])).join("\n");
  const hits = forbiddenHits(joinedInput);
  if (hits.length) rowIssues.push(`forbidden_phrases:${hits.join(",")}`);
  if (/machine-assisted|orientation only|candidateSummary|machine visual|machine draft/i.test(joinedInput)) {
    rowIssues.push("reviewer_input_mentions_machine_orientation_as_authority");
  }
  if (text(row.paraphrasedTeachingConcept) && !/paraphrase|rewrite|original|not copied|no copy|自写|改写|不复制|非照搬/.test(text(row.paraphrasedTeachingConcept))) {
    rowIssues.push("paraphrased_teaching_concept_missing_originality_statement");
  }
  if (text(row.futureLossDecision) && !/ocr needed|visual review needed|accept documented future loss|do not accept future loss|needs deeper review|保留|接受损失|不接受损失|需要ocr|需要复核/i.test(text(row.futureLossDecision))) {
    rowIssues.push("future_loss_decision_missing_allowed_decision_language");
  }
  if (row.publicGroundingNeeded !== true) rowIssues.push("public_grounding_must_remain_required_before_module_merge");
  if (row.acceptedForWave5PdfSemanticReview !== false) rowIssues.push("row_must_not_self_accept_wave_5_pdf_semantic_review");
  if (row.acceptedForModuleDistillation !== false) rowIssues.push("row_must_not_self_accept_module_distillation");
  if (row.acceptedForDeletionReadiness !== false) rowIssues.push("row_must_not_self_accept_deletion_readiness");
  if (row.reviewStatus !== "blocked_missing_real_wave_5_pdf_reviewer_input") rowIssues.push("review_status_must_start_blocked");

  return {
    reviewRowId: row.reviewRowId,
    executionSampleNo: row.executionSampleNo,
    sourceType: row.sourceType,
    recordId: row.recordId,
    pageNumber: row.pageNumber,
    validationStatus: rowIssues.length ? "blocked_missing_or_invalid_wave_5_pdf_reviewer_input" : "ready_for_wave_5_pdf_semantic_or_future_loss_gate",
    readyForWave5PdfSemanticOrFutureLossGate: rowIssues.length === 0,
    missingFields,
    qualityIssues: rowIssues.filter((issue) => !issue.startsWith("missing_fields:")),
    forbiddenHits: hits,
    nextGate: rowIssues.length
      ? "fill_real_wave_5_pdf_reviewer_fields_then_revalidate"
      : "route_ready_wave_5_pdf_row_to_pdf_ocr_priority_route_map_after_public_grounding_check",
  };
});

const readyRows = validationRows.filter((row) => row.readyForWave5PdfSemanticOrFutureLossGate).length;
const blockedRows = validationRows.length - readyRows;
const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  validationStatus: readyRows === validationRows.length
    ? "course_5_wave_5_pdf_reviewer_input_valid_release_still_locked"
    : "course_5_wave_5_pdf_reviewer_input_blocked_missing_or_invalid_real_input",
  validationMode: "wave_5_pdf_real_reviewer_or_future_loss_input_gate",
  inputPath,
  sourceExecutionPack: packPath,
  inputRows: validationRows.length,
  pdfRows: validationRows.length,
  zipRows: 0,
  readyRows,
  blockedRows,
  missingFieldRows: validationRows.filter((row) => row.missingFields.length).length,
  qualityIssueRows: validationRows.filter((row) => row.qualityIssues.length).length,
  forbiddenHitRows: validationRows.filter((row) => row.forbiddenHits.length).length,
  acceptedForWave5PdfSemanticReviewRows: 0,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  learnerReadyModules: 0,
  forbiddenPhrases,
  validationRows,
  completionRule: "Wave 5 PDF reviewer input validation passes only when all 85 rows contain real reviewer-owned OCR, visual-semantic, and future-loss decision fields, no copied machine summaries, no forbidden trading advice language, public grounding remains required, and no release/delete boundary drifts.",
  boundary: "Course 5 Wave 5 PDF reviewer input validation is private reviewer-facing education operations material. It validates reviewer-owned OCR, visual-semantic, and future-loss decision input for the 29 remaining PDF OCR or future-loss decision blockers and their representative page samples. It does not perform OCR, generate reviewer conclusions, accept machine drafts as human review, delete files, approve learner-facing release, approve source-folder deletion, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Course 5 Wave 5 PDF Reviewer Input Validation",
  "",
  `- Validation status: ${report.validationStatus}`,
  `- Input rows: ${report.inputRows}`,
  `- PDF rows: ${report.pdfRows}`,
  `- Ready rows: ${report.readyRows}`,
  `- Blocked rows: ${report.blockedRows}`,
  `- Missing-field rows: ${report.missingFieldRows}`,
  `- Source folder may be deleted: ${report.sourceFolderMayBeDeleted}`,
  "",
  "## First Issues",
  "",
  ...validationRows
    .filter((row) => !row.readyForWave5PdfSemanticOrFutureLossGate)
    .slice(0, 85)
    .map((row) => `- ${row.reviewRowId}: ${[...row.missingFields, ...row.qualityIssues].join("; ")}`),
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
  pdfRows: report.pdfRows,
  zipRows: report.zipRows,
  readyRows: report.readyRows,
  blockedRows: report.blockedRows,
  missingFieldRows: report.missingFieldRows,
  sourceFolderMayBeDeleted: report.sourceFolderMayBeDeleted,
}, null, 2));
