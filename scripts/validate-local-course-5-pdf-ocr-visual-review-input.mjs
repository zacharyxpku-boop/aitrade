import fs from "node:fs";

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const inputPath = argValue("--input", "docs/reviewer-inputs/LOCAL_COURSE_5_PDF_OCR_VISUAL_REVIEW_INPUT_TEMPLATE.json");
const draftsPath = argValue("--drafts", "docs/LOCAL_COURSE_5_PDF_MACHINE_VISUAL_SEMANTIC_DRAFTS.json");
const outputJsonPath = argValue("--output-json", "docs/LOCAL_COURSE_5_PDF_OCR_VISUAL_REVIEW_INPUT_VALIDATION.json");
const outputMdPath = argValue("--output-md", "docs/LOCAL_COURSE_5_PDF_OCR_VISUAL_REVIEW_INPUT_VALIDATION.md");

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
const drafts = readJson(draftsPath);
assertBoundary("PDF OCR visual review input", input);
assertBoundary("PDF machine drafts", drafts);

if (!Array.isArray(input.rows) || input.rows.length !== 121) fail("expected 121 PDF OCR/visual reviewer input rows");
if (!Array.isArray(drafts.draftRows) || drafts.draftRows.length !== 121) fail("expected 121 PDF machine draft rows");

const draftByReviewRowId = new Map(drafts.draftRows.map((row) => [row.reviewRowId, row]));
const validationRows = [];

for (const row of input.rows) {
  const draft = draftByReviewRowId.get(row.reviewRowId);
  const rowIssues = [];
  if (!draft) rowIssues.push("missing_matching_machine_draft");
  if (!fs.existsSync(row.sampleImagePath)) rowIssues.push("sample_image_missing");

  const requiredFields = [
    "reviewerObservedPageElements",
    "reviewerOcrOrManualText",
    "reviewerTeachingModulePlacement",
    "reviewerParaphrasedConceptNote",
    "reviewerDeletionReadinessEvidence",
    "reviewerNameOrInitials",
    "reviewedAt",
  ];
  const missingFields = requiredFields.filter((field) => !text(row[field]));
  if (missingFields.length) rowIssues.push(`missing_fields:${missingFields.join(",")}`);

  const joinedInput = requiredFields.map((field) => text(row[field])).join("\n");
  const hits = forbiddenHits(joinedInput);
  if (hits.length) rowIssues.push(`forbidden_phrases:${hits.join(",")}`);
  if (/machine-assisted|orientation only|candidateSummary|machine visual|machine draft/i.test(joinedInput)) {
    rowIssues.push("reviewer_input_mentions_machine_orientation_as_authority");
  }
  if (draft?.candidateSummary && joinedInput.includes(draft.candidateSummary.slice(0, Math.min(90, draft.candidateSummary.length)))) {
    rowIssues.push("reviewer_input_copies_machine_candidate_summary");
  }
  if (text(row.reviewerParaphrasedConceptNote) && !/paraphrase|rewrite|original|not copied|no copy|自写|改写|不复制/.test(text(row.reviewerParaphrasedConceptNote))) {
    rowIssues.push("paraphrased_note_missing_originality_statement");
  }
  if (row.acceptForPdfVisualSemanticReview !== false) rowIssues.push("row_must_not_self_accept_pdf_visual_semantic_review");
  if (row.acceptForDeletionReadiness !== false) rowIssues.push("row_must_not_self_accept_deletion_readiness");
  if (row.reviewStatus !== "blocked_missing_real_ocr_or_visual_reviewer_input") rowIssues.push("review_status_must_start_blocked");

  validationRows.push({
    reviewRowId: row.reviewRowId,
    recordId: row.recordId,
    pageNumber: row.pageNumber,
    validationStatus: rowIssues.length ? "blocked_missing_or_invalid_real_ocr_or_visual_input" : "ready_for_pdf_visual_semantic_review_gate",
    readyForPdfVisualSemanticReviewGate: rowIssues.length === 0,
    missingFields,
    qualityIssues: rowIssues.filter((issue) => !issue.startsWith("missing_fields:")),
    forbiddenHits: hits,
    nextGate: rowIssues.length
      ? "fill_real_ocr_or_visual_reviewer_fields_then_revalidate"
      : "route_ready_pdf_row_to_semantic_merge_preview_after_public_grounding_check",
  });
}

const readyRows = validationRows.filter((row) => row.readyForPdfVisualSemanticReviewGate).length;
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
    ? "course_5_pdf_ocr_visual_review_input_valid_release_still_locked"
    : "course_5_pdf_ocr_visual_review_input_blocked_missing_or_invalid_real_ocr_or_visual_input",
  validationMode: "pdf_ocr_visual_real_reviewer_input_gate",
  inputPath,
  draftsPath,
  inputRows: validationRows.length,
  readyRows,
  blockedRows,
  missingFieldRows,
  qualityIssueRows,
  forbiddenHitRows,
  acceptedForPdfVisualSemanticReviewRows: 0,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  learnerReadyModules: 0,
  forbiddenPhrases,
  validationRows,
  completionRule: "PDF OCR/visual input validation passes only when all 121 rows contain real OCR or visual reviewer-owned fields, no copied machine summaries, no forbidden trading advice language, and no release/delete boundary drift. Passing validation still does not approve learner-facing release, module distillation, or source deletion.",
  boundary: "Course 5 PDF OCR and visual reviewer input validation is private reviewer-facing education operations material. It validates human/OCR-owned page observations, manual/OCR text notes, module placement, paraphrased concept notes, and deletion-readiness evidence; it does not generate reviewer conclusions, accept machine drafts as human review, delete files, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Course 5 PDF OCR And Visual Review Input Validation",
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
    .filter((row) => !row.readyForPdfVisualSemanticReviewGate)
    .slice(0, 20)
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
  readyRows: report.readyRows,
  blockedRows: report.blockedRows,
  missingFieldRows: report.missingFieldRows,
  qualityIssueRows: report.qualityIssueRows,
  forbiddenHitRows: report.forbiddenHitRows,
  sourceFolderMayBeDeleted: report.sourceFolderMayBeDeleted,
}, null, 2));
