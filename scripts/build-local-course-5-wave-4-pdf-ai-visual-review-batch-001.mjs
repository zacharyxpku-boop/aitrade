import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_4_PDF_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_4_PDF_EXECUTION_PACK.json";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_4_PDF_AI_VISUAL_REVIEW_BATCH_001_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_4_PDF_AI_VISUAL_REVIEW_BATCH_001_INPUT.md";
const validationJsonPath = "docs/LOCAL_COURSE_5_WAVE_4_PDF_AI_VISUAL_REVIEW_BATCH_001_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_4_PDF_AI_VISUAL_REVIEW_BATCH_001_VALIDATION.md";

const reviewedAt = "2026-06-25T00:00:00.000+08:00";
const reviewerName = "Codex visual review batch 001";
const batchId = "wave_4_pdf_ai_visual_review_batch_001";
const boundary = "Course 5 Wave 4 PDF AI visual review batch 001 is private reviewer-facing education operations material. It records page-level visual observations and visible text cues for nine Wave 4 PDF samples so they can receive later human confirmation and OCR review. It does not complete OCR, replace human approval, merge content into learner-facing modules, approve source-folder deletion, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, execution instructions, automation, write authorization, or production readiness.";

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

const batchNotes = new Map([
  ["course5_pdf_ocr_visual_review_010", {
    reviewerOwnedOcrTextExcerpt: "Visible page text includes the Chinese title Advanced Reversal Technical Analysis, lower volume, and the English subtitle Trading Price Action Reversals.",
    reviewerOwnedVisualObservation: "The page is a book cover with bilingual title text, author and translator lines, publisher mark, and a decorative candlestick chart band near the bottom.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this page is best used as source identity and module-placement evidence for reversal-analysis material, not as a specific chart-pattern example.",
    modulePlacement: "reversals; source_identity; course_5_pdf_intake",
    evidenceLimitations: "Cover page only; it does not provide a concrete reversal chart example and still needs OCR or manual bibliographic confirmation.",
  }],
  ["course5_pdf_ocr_visual_review_011", {
    reviewerOwnedOcrTextExcerpt: "Visible page cues include a rotated chart figure, page number 238, and a Chinese figure caption along the side.",
    reviewerOwnedVisualObservation: "The page contains a sideways chart image with numbered swing points, moving averages, several drawn trendlines, and horizontal reference lines.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this page can support teaching how reversal study often depends on trendlines, ranges, and numbered swing context rather than one isolated bar.",
    modulePlacement: "reversals; trendline_context; swing_structure",
    evidenceLimitations: "The chart is rotated and the caption needs OCR or manual checking before use in a lesson.",
  }],
  ["course5_pdf_ocr_visual_review_012", {
    reviewerOwnedOcrTextExcerpt: "Visible page text lists three recommended books, including Japanese Candlestick Charting Techniques, How Charts Can Help You in the Stock Market, and Indicators That Work.",
    reviewerOwnedVisualObservation: "The page is a recommended-reading layout with three boxed text summaries on the left and three book cover thumbnails on the right.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this page can support an extension-reading or source-map module rather than a direct price-action concept.",
    modulePlacement: "source_map; extension_reading; curriculum_context",
    evidenceLimitations: "It is not a chart evidence page; detailed book descriptions require OCR or manual transcription before teaching use.",
  }],
  ["course5_pdf_ocr_visual_review_013", {
    reviewerOwnedOcrTextExcerpt: "Visible page text includes the Chinese title Advanced Reversal Technical Analysis, upper volume, and the English subtitle Trading Price Action Reversals.",
    reviewerOwnedVisualObservation: "The page is a book cover parallel to the lower-volume cover, with bilingual title block, author and translator names, and a candlestick band at the bottom.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this page establishes the upper-volume reversal source and should be used for provenance and module grouping.",
    modulePlacement: "reversals; source_identity; course_5_pdf_intake",
    evidenceLimitations: "Cover page only; no specific chart structure is available on this page.",
  }],
  ["course5_pdf_ocr_visual_review_014", {
    reviewerOwnedOcrTextExcerpt: "Visible page text discusses market participants looking for reversals and references price pullbacks, moving averages, and trend or channel behavior.",
    reviewerOwnedVisualObservation: "The page is dense Chinese text with a running header for the upper reversal volume and page number 194.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this page appears to support a reversal-context lesson about participant expectations, failed continuation, and transition into range or opposite movement.",
    modulePlacement: "reversals; market_context; participant_expectations",
    evidenceLimitations: "Text-heavy page; OCR or manual transcription is required before extracting any precise claim.",
  }],
  ["course5_pdf_ocr_visual_review_015", {
    reviewerOwnedOcrTextExcerpt: "Visible header text references a chapter about daily-chart volume reversal, and the body mentions a stock example and prior chart comparison.",
    reviewerOwnedVisualObservation: "The page is mostly Chinese text, with no visible chart on the sampled page, and page number 397 at the bottom.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this page can be routed to reversal-with-volume context, but it cannot stand alone without the surrounding chart pages.",
    modulePlacement: "reversals; volume_context; daily_chart_context",
    evidenceLimitations: "Nearby chart pages and OCR are needed before module distillation.",
  }],
  ["course5_pdf_ocr_visual_review_016", {
    reviewerOwnedOcrTextExcerpt: "Visible cover text includes Advanced Trend Technical Analysis and the English subtitle Trading Price Action Trends.",
    reviewerOwnedVisualObservation: "The page is a trend-analysis book cover with large Chinese title text, English subtitle, author and translator lines, and a candlestick chart band at the bottom.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this page establishes the trend-analysis source and places later samples into the trends and channels curriculum area.",
    modulePlacement: "trends_and_channels; source_identity; course_5_pdf_intake",
    evidenceLimitations: "Cover page only; it should not be used as a chart-pattern teaching example.",
  }],
  ["course5_pdf_ocr_visual_review_017", {
    reviewerOwnedOcrTextExcerpt: "Visible page text discusses buying during rises or pullbacks, trend channel lines, failed breakouts, and uncertainty after price returns to a trading range.",
    reviewerOwnedVisualObservation: "The page is dense Chinese text under an Advanced Trend Technical Analysis header, with page number 196.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this page can support a trend-context lesson about pullbacks, channels, failed continuation, and the shift from trend to range uncertainty.",
    modulePlacement: "trends_and_channels; pullback_structure; trading_ranges",
    evidenceLimitations: "Text extraction remains incomplete; any precise wording needs OCR or manual confirmation.",
  }],
  ["course5_pdf_ocr_visual_review_018", {
    reviewerOwnedOcrTextExcerpt: "Visible back-cover text mentions discussion of trends, trading ranges, breakouts, reversals, trendlines, and trend channel lines.",
    reviewerOwnedVisualObservation: "The page is a back-cover style description with a candlestick chart strip, bullet-like circles, QR code, ISBN area, and publisher information.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this page can support a curriculum map for trend, range, breakout, reversal, and trendline topics covered by the source.",
    modulePlacement: "trends_and_channels; curriculum_context; source_map",
    evidenceLimitations: "Back-cover summary is broad marketing/context material and needs corroboration before teaching module claims.",
  }],
]);

const requiredFields = [
  "reviewerOwnedOcrTextExcerpt",
  "reviewerOwnedVisualObservation",
  "paraphrasedTeachingConcept",
  "modulePlacement",
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

const template = readJson(templatePath);
const pack = readJson(packPath);
assertBoundary("template", template);
assertBoundary("pack", pack);

const rows = template.rows.map((row) => {
  const note = batchNotes.get(row.reviewRowId);
  if (!note) return { ...row };
  return {
    ...row,
    ...note,
    reviewerNameOrInitials: reviewerName,
    reviewedAt,
    batchReviewMode: "ai_visual_review_requires_human_confirmation_and_ocr_followup",
    reviewStatus: "blocked_missing_real_wave_4_pdf_reviewer_input",
    acceptedForWave4PdfSemanticReview: false,
    acceptedForModuleDistillation: false,
    acceptedForDeletionReadiness: false,
    publicGroundingNeeded: true,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    productionReady: false,
    writeAllowedNow: false,
  };
});

const sampleByReviewRowId = new Map(pack.sampleRowsDetail.map((row) => [row.reviewRowId, row]));
const validationRows = rows.map((row) => {
  const sample = sampleByReviewRowId.get(row.reviewRowId);
  const rowIssues = [];
  if (!sample) rowIssues.push("missing_matching_wave_4_pdf_sample");
  if (row.sourceType !== "pdf") rowIssues.push("source_type_must_be_pdf");
  if (sample && row.sourceType !== sample.sourceType) rowIssues.push("source_type_mismatch");
  if (!fs.existsSync(row.sampleImagePath)) rowIssues.push("sample_image_missing");
  if (sample && row.sampleImagePath !== sample.sampleImagePath) rowIssues.push("sample_image_path_mismatch");
  if (sample && row.pageNumber !== sample.pageNumber) rowIssues.push("page_number_mismatch");
  if (batchNotes.has(row.reviewRowId) && row.batchReviewMode !== "ai_visual_review_requires_human_confirmation_and_ocr_followup") rowIssues.push("batch_row_missing_ai_review_boundary");
  const missingFields = requiredFields.filter((field) => !text(row[field]));
  if (missingFields.length) rowIssues.push(`missing_fields:${missingFields.join(",")}`);
  const joinedInput = requiredFields.map((field) => text(row[field])).join("\n");
  const hits = forbiddenHits(joinedInput);
  if (hits.length) rowIssues.push(`forbidden_phrases:${hits.join(",")}`);
  if (text(row.paraphrasedTeachingConcept) && !text(row.paraphrasedTeachingConcept).startsWith("Original paraphrase, not copied:")) rowIssues.push("paraphrased_teaching_concept_missing_originality_statement");
  if (row.publicGroundingNeeded !== true) rowIssues.push("public_grounding_must_remain_required_before_module_merge");
  if (row.acceptedForWave4PdfSemanticReview !== false) rowIssues.push("row_must_not_self_accept_wave_4_pdf_semantic_review");
  if (row.acceptedForModuleDistillation !== false) rowIssues.push("row_must_not_self_accept_module_distillation");
  if (row.acceptedForDeletionReadiness !== false) rowIssues.push("row_must_not_self_accept_deletion_readiness");
  if (row.reviewStatus !== "blocked_missing_real_wave_4_pdf_reviewer_input") rowIssues.push("review_status_must_start_blocked");
  return {
    reviewRowId: row.reviewRowId,
    executionSampleNo: row.executionSampleNo,
    pageNumber: row.pageNumber,
    sampleImagePath: row.sampleImagePath,
    batchRow: batchNotes.has(row.reviewRowId),
    readyForReviewerConfirmation: rowIssues.length === 0,
    issues: rowIssues,
  };
});

const batchRows = validationRows.filter((row) => row.batchRow);
const readyRows = validationRows.filter((row) => row.readyForReviewerConfirmation);
const blockedRows = validationRows.filter((row) => !row.readyForReviewerConfirmation);
const forbiddenHitRows = validationRows.filter((row) => row.issues.some((issue) => issue.startsWith("forbidden_phrases:")));
const missingFieldRows = validationRows.filter((row) => row.issues.some((issue) => issue.startsWith("missing_fields:")));
const expectedIds = Array.from({ length: 9 }, (_, index) => `course5_pdf_ocr_visual_review_${String(index + 10).padStart(3, "0")}`);
const actualIds = batchRows.map((row) => row.reviewRowId);

if (rows.length !== 27) fail(`expected 27 input rows, got ${rows.length}`);
if (batchRows.length !== 9) fail(`expected 9 batch rows, got ${batchRows.length}`);
if (readyRows.length !== 9) fail(`expected 9 ready rows, got ${readyRows.length}`);
if (blockedRows.length !== 18) fail(`expected 18 blocked rows, got ${blockedRows.length}`);
if (forbiddenHitRows.length !== 0) fail(`expected 0 forbidden hit rows, got ${forbiddenHitRows.length}`);
if (missingFieldRows.length !== 18) fail(`expected 18 missing field rows, got ${missingFieldRows.length}`);
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) fail(`unexpected batch ids ${actualIds.join(",")}`);

const inputArtifact = {
  ...template,
  generatedAt: reviewedAt,
  inputTemplateStatus: "course_5_wave_4_pdf_ai_visual_review_batch_001_nine_rows_ready_for_reviewer_confirmation",
  rows,
  readyRows: readyRows.length,
  blockedRows: blockedRows.length,
  batchReviewMode: "ai_visual_review_requires_human_confirmation_and_ocr_followup",
  batchId,
  batchRows: batchRows.length,
  sourceFolderMayBeDeleted: false,
  boundary,
};

const validationArtifact = {
  generatedAt: reviewedAt,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  validationStatus: "course_5_wave_4_pdf_ai_visual_review_batch_001_partially_ready_release_and_deletion_blocked",
  validationMode: "wave_4_pdf_ai_visual_review_batch_001_gate",
  inputPath: inputJsonPath,
  sourceExecutionPack: packPath,
  inputRows: rows.length,
  batchRows: batchRows.length,
  pdfRows: rows.length,
  zipRows: 0,
  readyRows: readyRows.length,
  blockedRows: blockedRows.length,
  missingFieldRows: missingFieldRows.length,
  qualityIssueRows: validationRows.filter((row) => row.issues.some((issue) => !issue.startsWith("missing_fields:"))).length,
  forbiddenHitRows: forbiddenHitRows.length,
  acceptedForWave4PdfSemanticReviewRows: 0,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  learnerReadyModules: 0,
  validationRows,
  nextOperationalGates: [
    "Human reviewer confirmation and OCR follow-up are still required before semantic merge.",
    "Public grounding and originality review must remain blocked.",
    "Course 5 source folder deletion remains blocked.",
  ],
  completionRule: "Batch 001 covers the first nine Wave 4 PDF samples but does not approve module merge, learner-facing release, or source-folder deletion.",
  boundary,
};

assertBoundary("input", inputArtifact);
assertBoundary("validation", validationArtifact);

fs.writeFileSync(inputJsonPath, `${JSON.stringify(inputArtifact, null, 2)}\n`);
fs.writeFileSync(validationJsonPath, `${JSON.stringify(validationArtifact, null, 2)}\n`);

const mdRows = rows
  .filter((row) => batchNotes.has(row.reviewRowId))
  .map((row) => `| ${row.reviewRowId} | ${row.executionSampleNo} | ${row.pageNumber} | ${row.modulePlacement} | ${row.reviewerOwnedVisualObservation} |`)
  .join("\n");

fs.writeFileSync(inputMdPath, `# Local Course 5 Wave 4 PDF AI Visual Review Batch 001\n\n${boundary}\n\n| Review row | Sample | Page | Module placement | Visual observation |\n|---|---:|---:|---|---|\n${mdRows}\n\nSource folder may be deleted: false\n`);

fs.writeFileSync(validationMdPath, `# Local Course 5 Wave 4 PDF AI Visual Review Batch 001 Validation\n\n- Status: ${validationArtifact.validationStatus}\n- Input rows: ${validationArtifact.inputRows}\n- Batch rows: ${validationArtifact.batchRows}\n- Ready rows: ${validationArtifact.readyRows}\n- Blocked rows: ${validationArtifact.blockedRows}\n- Missing field rows: ${validationArtifact.missingFieldRows}\n- Forbidden hit rows: ${validationArtifact.forbiddenHitRows}\n- Source folder may be deleted: ${validationArtifact.sourceFolderMayBeDeleted}\n- Learner-ready modules: ${validationArtifact.learnerReadyModules}\n`);

console.log(JSON.stringify({
  ok: true,
  validationStatus: validationArtifact.validationStatus,
  inputRows: validationArtifact.inputRows,
  batchRows: validationArtifact.batchRows,
  readyRows: validationArtifact.readyRows,
  blockedRows: validationArtifact.blockedRows,
  sourceFolderMayBeDeleted: validationArtifact.sourceFolderMayBeDeleted,
}, null, 2));
