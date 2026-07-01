import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_EXECUTION_PACK.json";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_005_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_005_INPUT.md";
const validationJsonPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_005_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_005_VALIDATION.md";

const reviewedAt = "2026-06-25T00:00:00.000+08:00";
const reviewerName = "Codex visual review wave 5 batch 005";
const batchId = "wave_5_pdf_ai_visual_review_batch_005";
const boundary = "Course 5 Wave 5 PDF AI visual review batch 005 is private reviewer-facing education operations material. It records page-level visual observations and visible text cues for twelve Wave 5 PDF samples so they can receive later human confirmation and OCR review. It does not complete OCR, replace human approval, merge content into learner-facing modules, approve source-folder removal, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, execution instructions, automation, write authorization, or production readiness.";

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

const duplicateAware = "Duplicate-aware reinforcement row from another local PDF version; useful for source coverage and version consistency, but not a new concept by itself.";
const futureLossDecision = "Do not use future-loss acceptance here; retain this row for OCR and reviewer confirmation before any module merge or folder-removal decision.";

const batchNotes = new Map([
  ["course5_wave_5_pdf_supplemental_review_031", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies The Brooks Encyclopedia of Chart Patterns, Part 3 of 16, with classifications from D to F.",
    "reviewerOwnedVisualObservation": "The page is a cover slide with large title typography, author attribution, and a right-side chart motif showing a sharp decline and rebound.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity and taxonomy range for the D-to-F chart-pattern encyclopedia section.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; taxonomy_range_d_to_f",
    "evidenceLimitations": "Cover evidence only; route for source map and taxonomy coverage rather than direct lesson content."
  }],
  ["course5_wave_5_pdf_supplemental_review_032", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide title and notes describe double-top bear-flag attempts that stop working once the chart has transitioned into a trading-range context.",
    "reviewerOwnedVisualObservation": "The chart begins with a strong decline, then shifts into overlapping sideways movement with several red-highlighted flag attempts, descending guide lines, and a moving-average line.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to bear-flag failure, trend-to-range transition, and context-change literacy in historical chart review.",
    "modulePlacement": "chart_pattern_encyclopedia; bear_flag_context; failed_pattern_context; range_transition_context",
    "evidenceLimitations": "Annotated chart evidence; any tactical implication must be neutralized and verified by OCR and reviewer confirmation before module merge."
  }],
  ["course5_wave_5_pdf_supplemental_review_033", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text repeats The Brooks Encyclopedia of Chart Patterns, Part 3 of 16, with classifications from D to F.",
    "reviewerOwnedVisualObservation": "The page repeats the Part 3 cover-slide layout with author attribution and the same right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms source-version consistency for the Part 3 deck and supports coverage accounting.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware cover evidence; useful for coverage and version tracking, not as standalone instructional content."
  }],
  ["course5_wave_5_pdf_supplemental_review_034", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies the Chinese edition of Trading Price Action Trading Ranges, with title text about advanced swing technical analysis and range analysis.",
    "reviewerOwnedVisualObservation": "The page is a brown book cover with Chinese title and subtitle, English book title, author and translator lines, publisher marks, and a candlestick band near the bottom.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity for trading-range and swing-analysis book material inside Course 5.",
    "modulePlacement": "trading_ranges; source_identity; course_5_pdf_intake",
    "evidenceLimitations": "Cover evidence only; it confirms source identity but not detailed teaching claims."
  }],
  ["course5_wave_5_pdf_supplemental_review_035", {
    "reviewerOwnedOcrTextExcerpt": "Visible chapter text discusses a trend moving into a trading range, with a figure labeled 17.9 and numbered swings around a failed second leg context.",
    "reviewerOwnedVisualObservation": "The page contains dense Chinese paragraphs above a grayscale chart annotated with swing numbers, L/H labels, a moving average, and a figure caption.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to range-transition education, failed continuation context, and swing-count reading from a textbook-style source.",
    "modulePlacement": "trading_ranges; swing_structure; range_transition_context; textbook_evidence",
    "evidenceLimitations": "Text and chart page evidence requires OCR before exact claims can be used; do not rely on the visible screenshot alone for learner-facing wording."
  }],
  ["course5_wave_5_pdf_supplemental_review_036", {
    "reviewerOwnedOcrTextExcerpt": "Visible back-cover text summarizes the book scope around price action, range analysis, and market behavior, with QR code, ISBN barcode, and price block.",
    "reviewerOwnedVisualObservation": "The page is a brown back cover with a candlestick band near the top, several Chinese paragraphs, a slogan band, QR code, publisher seal, barcode, and pricing block.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row reinforces the source-map role of the trading-range book and its relationship to Course 5 range-analysis modules.",
    "modulePlacement": "trading_ranges; curriculum_context; source_map",
    "evidenceLimitations": "Back-cover summary evidence; broad scope claims need OCR and corroboration before becoming teaching assertions."
  }],
  ["course5_wave_5_pdf_supplemental_review_037", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide title describes an Emini five-minute chart with a bearish open sequence followed by an expanding triangle, with wedge and failed-breakout annotations.",
    "reviewerOwnedVisualObservation": "The chart shows an early downward channel, multiple highlighted pullback and wedge areas, dotted guide lines, an expanding-triangle area, a moving average, and later sideways-to-up movement.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to bearish-open structure, expanding-triangle recognition, wedge context, and failed-breakout visual literacy.",
    "modulePlacement": "chart_pattern_encyclopedia; expanding_triangle; wedge_patterns; failed_breakout_context",
    "evidenceLimitations": "Annotated chart evidence only; labels need OCR and reviewer confirmation before lesson use."
  }],
  ["course5_wave_5_pdf_supplemental_review_038", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide title describes a broad bull channel and trending trading range, with notes around gap-down context, double tops, double bottoms, micro channel, and failed breakout.",
    "reviewerOwnedVisualObservation": "The chart has an early gap-down area, a rising broad channel with overlapping swings, multiple colored highlights, dotted resistance references, and a moving-average line.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to broad-channel recognition, trending trading-range behavior, double-top/double-bottom context, and failed-breakout review.",
    "modulePlacement": "chart_pattern_encyclopedia; broad_channels; trending_trading_range; failed_breakout_context",
    "evidenceLimitations": "Source slide includes operational phrasing that must be rewritten as retrospective pattern literacy and verified before module merge."
  }],
  ["course5_wave_5_pdf_supplemental_review_039", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide title describes a bull trend from the open followed by reversal down, with labels around parabolic wedge exhaustion, lower-high double tops, breakout, low-two, wedge, and measured move.",
    "reviewerOwnedVisualObservation": "The chart shows a strong early upward sequence, a topping area with dotted resistance, a sharp downward leg, a measured-move reference, wedge markings, and later sideways-to-down movement.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to trend-from-open structure, exhaustion wedge context, reversal-down sequencing, and measured-move visual references.",
    "modulePlacement": "chart_pattern_encyclopedia; trend_from_open; parabolic_wedge; reversal_context; measured_move_reference",
    "evidenceLimitations": "Annotated chart evidence with condensed labels; exact sequencing requires OCR and reviewer confirmation before learner-facing use."
  }],
  ["course5_wave_5_pdf_supplemental_review_040", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies The Brooks Encyclopedia of Chart Patterns, Part 2 of 16, with classification C.",
    "reviewerOwnedVisualObservation": "The page is a cover slide with large title text, author attribution, and a right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity and taxonomy range for the C classification chart-pattern deck.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; taxonomy_range_c",
    "evidenceLimitations": "Cover evidence only; use for source coverage and routing, not as a direct teaching concept."
  }],
  ["course5_wave_5_pdf_supplemental_review_041", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide title describes a climactic decline and upward reversal despite an eleven-bar bearish micro-channel, with additional shorthand annotations near the low.",
    "reviewerOwnedVisualObservation": "The chart shows a downward micro-channel into a low, colored highlights around the low and recovery, a moving average, and a later strong upward leg followed by consolidation.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to climactic-move recognition, micro-channel exhaustion, reversal-context review, and chart-annotation literacy.",
    "modulePlacement": "chart_pattern_encyclopedia; climactic_move_context; micro_channel; reversal_context",
    "evidenceLimitations": "Source slide includes tactical shorthand and must be neutralized; OCR and reviewer confirmation are required before module merge."
  }],
  ["course5_wave_5_pdf_supplemental_review_042", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text repeats The Brooks Encyclopedia of Chart Patterns, Part 2 of 16, with classification C.",
    "reviewerOwnedVisualObservation": "The page repeats the Part 2 cover-slide layout with author attribution and the same right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms source-version consistency for the Part 2 deck and supports coverage accounting.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware cover evidence; useful for coverage and version tracking, not as standalone instructional content."
  }],
]);

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
    futureLossDecision,
    reviewerNameOrInitials: reviewerName,
    reviewedAt,
    batchReviewMode: "ai_visual_review_requires_human_confirmation_and_ocr_followup",
    reviewStatus: "blocked_missing_real_wave_5_pdf_reviewer_input",
    acceptedForWave5PdfSemanticReview: false,
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
  if (!sample) rowIssues.push("missing_matching_wave_5_pdf_sample");
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
  if (row.acceptedForWave5PdfSemanticReview !== false) rowIssues.push("row_must_not_self_accept_wave_5_pdf_semantic_review");
  if (row.acceptedForModuleDistillation !== false) rowIssues.push("row_must_not_self_accept_module_distillation");
  if (row.acceptedForDeletionReadiness !== false) rowIssues.push("row_must_not_self_accept_deletion_readiness");
  if (row.reviewStatus !== "blocked_missing_real_wave_5_pdf_reviewer_input") rowIssues.push("review_status_must_start_blocked");
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
const expectedIds = template.rows.slice(48, 60).map((row) => row.reviewRowId);
const actualIds = batchRows.map((row) => row.reviewRowId);

if (rows.length !== 85) fail(`expected 85 input rows, got ${rows.length}`);
if (batchRows.length !== 12) fail(`expected 12 batch rows, got ${batchRows.length}`);
if (readyRows.length !== 12) fail(`expected 12 ready rows, got ${readyRows.length}`);
if (blockedRows.length !== 73) fail(`expected 73 blocked rows, got ${blockedRows.length}`);
if (forbiddenHitRows.length !== 0) fail(`expected 0 forbidden hit rows, got ${forbiddenHitRows.length}`);
if (missingFieldRows.length !== 73) fail(`expected 73 missing field rows, got ${missingFieldRows.length}`);
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) fail(`unexpected batch ids ${actualIds.join(",")}`);

const inputArtifact = {
  ...template,
  generatedAt: reviewedAt,
  inputTemplateStatus: "course_5_wave_5_pdf_ai_visual_review_batch_005_twelve_rows_ready_for_reviewer_confirmation",
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
  validationStatus: "course_5_wave_5_pdf_ai_visual_review_batch_005_partially_ready_release_and_deletion_blocked",
  validationMode: "wave_5_pdf_ai_visual_review_batch_005_gate",
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
  acceptedForWave5PdfSemanticReviewRows: 0,
  acceptedForModuleDistillationRows: 0,
  acceptedForDeletionReadinessRows: 0,
  sourceFolderMayBeDeleted: false,
  learnerReadyModules: 0,
  validationRows,
  nextOperationalGates: [
    "Human reviewer confirmation and OCR follow-up are still required before semantic merge.",
    "Future-loss acceptance must not replace OCR for these rows.",
    "Course 5 source folder removal remains blocked.",
  ],
  completionRule: "Batch 005 covers Wave 5 PDF samples 49 through 60 but does not approve module merge, learner-facing release, or source-folder removal.",
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

fs.writeFileSync(inputMdPath, `# Local Course 5 Wave 5 PDF AI Visual Review Batch 005\n\n${boundary}\n\n| Review row | Sample | Page | Module placement | Visual observation |\n|---|---:|---:|---|---|\n${mdRows}\n\nSource folder may be deleted: false\n`);

fs.writeFileSync(validationMdPath, `# Local Course 5 Wave 5 PDF AI Visual Review Batch 005 Validation\n\n- Status: ${validationArtifact.validationStatus}\n- Input rows: ${validationArtifact.inputRows}\n- Batch rows: ${validationArtifact.batchRows}\n- Ready rows: ${validationArtifact.readyRows}\n- Blocked rows: ${validationArtifact.blockedRows}\n- Missing field rows: ${validationArtifact.missingFieldRows}\n- Forbidden hit rows: ${validationArtifact.forbiddenHitRows}\n- Source folder may be deleted: ${validationArtifact.sourceFolderMayBeDeleted}\n- Learner-ready modules: ${validationArtifact.learnerReadyModules}\n`);

console.log(JSON.stringify({
  ok: true,
  validationStatus: validationArtifact.validationStatus,
  inputRows: validationArtifact.inputRows,
  batchRows: validationArtifact.batchRows,
  readyRows: validationArtifact.readyRows,
  blockedRows: validationArtifact.blockedRows,
  sourceFolderMayBeDeleted: validationArtifact.sourceFolderMayBeDeleted,
}, null, 2));
