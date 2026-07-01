import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_4_PDF_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_4_PDF_EXECUTION_PACK.json";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_4_PDF_AI_VISUAL_REVIEW_BATCH_003_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_4_PDF_AI_VISUAL_REVIEW_BATCH_003_INPUT.md";
const validationJsonPath = "docs/LOCAL_COURSE_5_WAVE_4_PDF_AI_VISUAL_REVIEW_BATCH_003_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_4_PDF_AI_VISUAL_REVIEW_BATCH_003_VALIDATION.md";

const reviewedAt = "2026-06-25T00:00:00.000+08:00";
const reviewerName = "Codex visual review batch 003";
const batchId = "wave_4_pdf_ai_visual_review_batch_003";
const boundary = "Course 5 Wave 4 PDF AI visual review batch 003 is private reviewer-facing education operations material. It records page-level visual observations and visible text cues for nine supplemental Wave 4 PDF samples so they can receive later human confirmation and OCR review. It does not complete OCR, replace human approval, merge content into learner-facing modules, approve source-folder removal, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, execution instructions, automation, write authorization, or production readiness.";

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

const duplicateAware = "Duplicate-aware reinforcement row from a separate PDF version; useful for source coverage and version consistency, but not a new concept by itself.";
const batchNotes = new Map([
  ["course5_wave_4_pdf_supplemental_review_010", {
    reviewerOwnedOcrTextExcerpt: "Visible cover text includes Advanced Trend Technical Analysis and the English subtitle Trading Price Action Trends.",
    reviewerOwnedVisualObservation: "The page is a trend-analysis book cover with large Chinese title text, author and translator lines, publisher marks, a navigation-wheel emblem, and a candlestick chart band near the bottom.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces source identity and module placement for the trend-analysis source used in trends and channels curriculum work.",
    modulePlacement: "trends_and_channels; source_identity; course_5_pdf_intake",
    evidenceLimitations: duplicateAware,
  }],
  ["course5_wave_4_pdf_supplemental_review_011", {
    reviewerOwnedOcrTextExcerpt: "Visible page text discusses participants buying during rises or pullbacks, channel lines, failed continuation, and uncertainty after price returns to a range.",
    reviewerOwnedVisualObservation: "The page is dense Chinese prose under an Advanced Trend Technical Analysis header, with no chart on the visible page and a printed page number near the top left.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces a trend-context lesson area about pullbacks, channel pressure, failed continuation, and range uncertainty.",
    modulePlacement: "trends_and_channels; pullback_structure; trading_ranges",
    evidenceLimitations: "Duplicate-aware text-page reinforcement; precise sentence-level claims still need OCR or manual confirmation before lesson use.",
  }],
  ["course5_wave_4_pdf_supplemental_review_012", {
    reviewerOwnedOcrTextExcerpt: "Visible back-cover text summarizes discussion of trends, trading ranges, breakouts, reversals, trendlines, and trend channel lines.",
    reviewerOwnedVisualObservation: "The page is a back cover with a candlestick strip across the top, Chinese summary text, a QR code, ISBN barcode, pricing block, and a dark slogan band.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces the curriculum-map role of the trend source across trend, range, breakout, reversal, and trendline topics.",
    modulePlacement: "trends_and_channels; curriculum_context; source_map",
    evidenceLimitations: "Duplicate-aware back-cover reinforcement; broad scope claims need corroboration before becoming teaching assertions.",
  }],
  ["course5_wave_4_pdf_supplemental_review_013", {
    reviewerOwnedOcrTextExcerpt: "Visible cover text includes Advanced Reversal Technical Analysis, upper volume, and the English subtitle Trading Price Action Reversals.",
    reviewerOwnedVisualObservation: "The page is a reversal-analysis book cover with bilingual title text, author and translator lines, a horizontal emblem band, publisher marks, and a candlestick chart strip.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces source identity and module placement for the upper-volume reversal-analysis material.",
    modulePlacement: "reversals; source_identity; course_5_pdf_intake",
    evidenceLimitations: duplicateAware,
  }],
  ["course5_wave_4_pdf_supplemental_review_014", {
    reviewerOwnedOcrTextExcerpt: "Visible page text discusses failed reversal attempts, later pullbacks, moving averages, trend context, and trader expectations around support behavior.",
    reviewerOwnedVisualObservation: "The page is dense Chinese prose from the upper-volume reversal source, with a running header at the top and printed page number 194 at the bottom.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row routes a reversal-context text page toward lessons on failed reversal attempts, retests, and expectation shifts.",
    modulePlacement: "reversals; market_context; participant_expectations",
    evidenceLimitations: "Duplicate-aware text-page reinforcement; exact wording and examples still require OCR or manual confirmation.",
  }],
  ["course5_wave_4_pdf_supplemental_review_015", {
    reviewerOwnedOcrTextExcerpt: "Visible header refers to a daily-chart high-volume reversal section, and the text describes trend-channel behavior, large movement, volume change, and delayed reversal behavior.",
    reviewerOwnedVisualObservation: "The page is a dense Chinese text page with a section header at the top right and printed page number 397 at the bottom.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces reversal-analysis material connected to daily-chart context, volume behavior, and trend-channel failure evidence.",
    modulePlacement: "reversals; volume_context; daily_chart_context",
    evidenceLimitations: "Duplicate-aware text-page reinforcement; the page has no visible chart, so chart-specific claims need source confirmation.",
  }],
  ["course5_wave_4_pdf_supplemental_review_016", {
    reviewerOwnedOcrTextExcerpt: "Visible cover text includes Advanced Reversal Technical Analysis, upper volume, and the English subtitle Trading Price Action Reversals.",
    reviewerOwnedVisualObservation: "The page repeats the upper-volume reversal cover with the same bilingual title block, emblem band, publisher marks, and candlestick chart strip.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row confirms another local PDF version maps to the same upper-volume reversal source identity.",
    modulePlacement: "reversals; source_identity; source_version_consistency",
    evidenceLimitations: duplicateAware,
  }],
  ["course5_wave_4_pdf_supplemental_review_017", {
    reviewerOwnedOcrTextExcerpt: "Visible page text discusses failed reversal attempts, later pullbacks, moving averages, trend context, and trader expectations around support behavior.",
    reviewerOwnedVisualObservation: "The page repeats the dense upper-volume reversal text page with the same top running header and bottom page number 194.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row confirms the same reversal-context text page appears in another local PDF version.",
    modulePlacement: "reversals; market_context; source_version_consistency",
    evidenceLimitations: "Duplicate-aware text-page reinforcement; use as version-coverage evidence rather than a separate new lesson concept.",
  }],
  ["course5_wave_4_pdf_supplemental_review_018", {
    reviewerOwnedOcrTextExcerpt: "Visible header refers to a daily-chart high-volume reversal section, and the text discusses trend-channel failure, large movement, volume change, and later reversal behavior.",
    reviewerOwnedVisualObservation: "The page repeats the daily-chart high-volume reversal text page with the same section header and printed page number 397.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row confirms the same daily-chart reversal context appears across another local PDF version.",
    modulePlacement: "reversals; volume_context; source_version_consistency",
    evidenceLimitations: "Duplicate-aware text-page reinforcement; keep as source consistency evidence until OCR and human confirmation are completed.",
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
const expectedIds = Array.from({ length: 9 }, (_, index) => `course5_wave_4_pdf_supplemental_review_${String(index + 10).padStart(3, "0")}`);
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
  inputTemplateStatus: "course_5_wave_4_pdf_ai_visual_review_batch_003_nine_rows_ready_for_reviewer_confirmation",
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
  validationStatus: "course_5_wave_4_pdf_ai_visual_review_batch_003_partially_ready_release_and_deletion_blocked",
  validationMode: "wave_4_pdf_ai_visual_review_batch_003_gate",
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
    "Course 5 source folder removal remains blocked.",
  ],
  completionRule: "Batch 003 covers the final nine Wave 4 PDF samples but does not approve module merge, learner-facing release, or source-folder removal.",
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

fs.writeFileSync(inputMdPath, `# Local Course 5 Wave 4 PDF AI Visual Review Batch 003\n\n${boundary}\n\n| Review row | Sample | Page | Module placement | Visual observation |\n|---|---:|---:|---|---|\n${mdRows}\n\nSource folder may be deleted: false\n`);

fs.writeFileSync(validationMdPath, `# Local Course 5 Wave 4 PDF AI Visual Review Batch 003 Validation\n\n- Status: ${validationArtifact.validationStatus}\n- Input rows: ${validationArtifact.inputRows}\n- Batch rows: ${validationArtifact.batchRows}\n- Ready rows: ${validationArtifact.readyRows}\n- Blocked rows: ${validationArtifact.blockedRows}\n- Missing field rows: ${validationArtifact.missingFieldRows}\n- Forbidden hit rows: ${validationArtifact.forbiddenHitRows}\n- Source folder may be deleted: ${validationArtifact.sourceFolderMayBeDeleted}\n- Learner-ready modules: ${validationArtifact.learnerReadyModules}\n`);

console.log(JSON.stringify({
  ok: true,
  validationStatus: validationArtifact.validationStatus,
  inputRows: validationArtifact.inputRows,
  batchRows: validationArtifact.batchRows,
  readyRows: validationArtifact.readyRows,
  blockedRows: validationArtifact.blockedRows,
  sourceFolderMayBeDeleted: validationArtifact.sourceFolderMayBeDeleted,
}, null, 2));
