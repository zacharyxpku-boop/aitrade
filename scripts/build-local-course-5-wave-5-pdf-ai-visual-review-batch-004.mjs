import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_EXECUTION_PACK.json";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_004_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_004_INPUT.md";
const validationJsonPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_004_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_004_VALIDATION.md";

const reviewedAt = "2026-06-25T00:00:00.000+08:00";
const reviewerName = "Codex visual review wave 5 batch 004";
const batchId = "wave_5_pdf_ai_visual_review_batch_004";
const boundary = "Course 5 Wave 5 PDF AI visual review batch 004 is private reviewer-facing education operations material. It records page-level visual observations and visible text cues for twelve Wave 5 PDF samples so they can receive later human confirmation and OCR review. It does not complete OCR, replace human approval, merge content into learner-facing modules, approve source-folder removal, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, execution instructions, automation, write authorization, or production readiness.";

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
  ["course5_wave_5_pdf_supplemental_review_019", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies The Brooks Encyclopedia of Chart Patterns, Part 12 of 16, with classifications from Q to SL.",
    "reviewerOwnedVisualObservation": "The page is a cover slide with large title typography, author attribution, and a right-side chart motif showing a sharp decline and rebound.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity and taxonomy range for the Q-to-SL chart-pattern encyclopedia section.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; taxonomy_range_q_to_sl",
    "evidenceLimitations": "Cover evidence only; route for source map and taxonomy coverage rather than direct lesson content."
  }],
  ["course5_wave_5_pdf_supplemental_review_020", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide title describes a failed midday reversal upward, a wedge after a bearish open sequence, and labels around a later range-to-rally structure.",
    "reviewerOwnedVisualObservation": "The chart shows an initial decline, an extended trading range highlighted in blue, wedge markings, double-bottom context labels, moving-average interaction, and a later strong upward leg.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to trading-range-after-trend, wedge recognition, and failed-reversal context as historical chart-pattern literacy.",
    "modulePlacement": "chart_pattern_encyclopedia; wedge_patterns; trading_range_after_trend; failed_reversal_context",
    "evidenceLimitations": "Annotated chart evidence; exact label meanings and sequence interpretation require OCR and reviewer confirmation before module merge."
  }],
  ["course5_wave_5_pdf_supplemental_review_021", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text repeats The Brooks Encyclopedia of Chart Patterns, Part 12 of 16, with the Q to SL classification range.",
    "reviewerOwnedVisualObservation": "The page repeats the Part 12 cover-slide layout with author attribution and the same right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms source-version consistency for the Part 12 deck and supports coverage accounting.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware cover evidence; useful for coverage and version tracking, not as standalone instructional content."
  }],
  ["course5_wave_5_pdf_supplemental_review_022", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies The Brooks Encyclopedia of Chart Patterns, Part 6 of 16, with classifications from GD N to GT.",
    "reviewerOwnedVisualObservation": "The page is a cover slide with large orange title text, author attribution, and a right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity and taxonomy range for the GD-N-to-GT chart-pattern encyclopedia section.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; taxonomy_range_gd_n_to_gt",
    "evidenceLimitations": "Cover evidence only; use for source coverage and routing, not as a direct teaching concept."
  }],
  ["course5_wave_5_pdf_supplemental_review_023", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide title refers to a trading-range open with a triangle and later upward breakout context, with annotations around EMA interaction and reversal attempts.",
    "reviewerOwnedVisualObservation": "The chart shows a compact triangle near the left, colored boxes marking key bars, a moving-average line, a later strong upward leg, and a broader post-move consolidation area.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to triangle-open structure, trading-range open recognition, EMA context, and reversal-attempt sequencing.",
    "modulePlacement": "chart_pattern_encyclopedia; triangle_patterns; trading_range_open; ema_context",
    "evidenceLimitations": "Annotated chart evidence with condensed abbreviations; OCR and reviewer confirmation are required before converting to a learner module."
  }],
  ["course5_wave_5_pdf_supplemental_review_024", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text repeats The Brooks Encyclopedia of Chart Patterns, Part 6 of 16, with GD N to GT classifications.",
    "reviewerOwnedVisualObservation": "The page repeats the Part 6 cover-slide layout with author attribution and the right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms source-version consistency for the Part 6 deck and supports coverage accounting.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware cover evidence; useful for coverage and version tracking, not as standalone instructional content."
  }],
  ["course5_wave_5_pdf_supplemental_review_025", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies The Brooks Encyclopedia of Chart Patterns, Part 10 of 16, with classification M.",
    "reviewerOwnedVisualObservation": "The page is a cover slide with large title typography, author attribution, and a right-side chart motif showing a decline and rebound.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity and taxonomy range for the M classification chart-pattern deck.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; taxonomy_range_m",
    "evidenceLimitations": "Cover evidence only; route for source map and taxonomy coverage rather than direct lesson content."
  }],
  ["course5_wave_5_pdf_supplemental_review_026", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide title refers to an MTR top and double-top MTR, with notes around a slightly lower high, a tight upward channel, and a later decline.",
    "reviewerOwnedVisualObservation": "The chart shows an earlier rally, a long horizontal resistance reference, a later near-retest marked with red boxes, a moving-average line, and a sharp downward sequence afterward.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to major-trend-reversal top structure, double-top context, lower-high nuance, and channel exhaustion literacy.",
    "modulePlacement": "chart_pattern_encyclopedia; major_trend_reversal; double_top_context; channel_exhaustion",
    "evidenceLimitations": "Source slide includes tactical shorthand that must be neutralized; use only as historical structure-reading evidence until OCR and reviewer confirmation."
  }],
  ["course5_wave_5_pdf_supplemental_review_027", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text repeats The Brooks Encyclopedia of Chart Patterns, Part 10 of 16, with classification M.",
    "reviewerOwnedVisualObservation": "The page repeats the Part 10 cover-slide layout with author attribution and the same right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms source-version consistency for the Part 10 deck and supports coverage accounting.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware cover evidence; useful for coverage and version tracking, not as standalone instructional content."
  }],
  ["course5_wave_5_pdf_supplemental_review_028", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies The Brooks Encyclopedia of Chart Patterns, Part 7 of 16, with classifications from GU to GU M.",
    "reviewerOwnedVisualObservation": "The page is a cover slide with large title text, author attribution, and a right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity and taxonomy range for the GU-to-GU-M chart-pattern encyclopedia section.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; taxonomy_range_gu_to_gu_m",
    "evidenceLimitations": "Cover evidence only; use for source coverage and routing, not as a direct teaching concept."
  }],
  ["course5_wave_5_pdf_supplemental_review_029", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide title and annotations describe a double-top context, a likely trading-range open, a failed breakout above prior resistance, and weak reversal evidence.",
    "reviewerOwnedVisualObservation": "The chart shows two attempts near a horizontal resistance line, colored highlight boxes, a moving average, a mid-chart pullback, and a later renewed rise followed by volatile bars.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to double-top context, failed-breakout assessment, trading-range-open expectation, and weak-reversal evidence as visual literacy.",
    "modulePlacement": "chart_pattern_encyclopedia; double_top_context; failed_breakout_context; trading_range_open",
    "evidenceLimitations": "Source wording includes probability and tactical shorthand; rewrite as retrospective structure analysis and verify with OCR before module merge."
  }],
  ["course5_wave_5_pdf_supplemental_review_030", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text repeats The Brooks Encyclopedia of Chart Patterns, Part 7 of 16, with GU to GU M classifications.",
    "reviewerOwnedVisualObservation": "The page repeats the Part 7 cover-slide layout with author attribution and the right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms source-version consistency for the Part 7 deck and supports coverage accounting.",
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
const expectedIds = template.rows.slice(36, 48).map((row) => row.reviewRowId);
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
  inputTemplateStatus: "course_5_wave_5_pdf_ai_visual_review_batch_004_twelve_rows_ready_for_reviewer_confirmation",
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
  validationStatus: "course_5_wave_5_pdf_ai_visual_review_batch_004_partially_ready_release_and_deletion_blocked",
  validationMode: "wave_5_pdf_ai_visual_review_batch_004_gate",
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
  completionRule: "Batch 004 covers Wave 5 PDF samples 37 through 48 but does not approve module merge, learner-facing release, or source-folder removal.",
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

fs.writeFileSync(inputMdPath, `# Local Course 5 Wave 5 PDF AI Visual Review Batch 004\n\n${boundary}\n\n| Review row | Sample | Page | Module placement | Visual observation |\n|---|---:|---:|---|---|\n${mdRows}\n\nSource folder may be deleted: false\n`);

fs.writeFileSync(validationMdPath, `# Local Course 5 Wave 5 PDF AI Visual Review Batch 004 Validation\n\n- Status: ${validationArtifact.validationStatus}\n- Input rows: ${validationArtifact.inputRows}\n- Batch rows: ${validationArtifact.batchRows}\n- Ready rows: ${validationArtifact.readyRows}\n- Blocked rows: ${validationArtifact.blockedRows}\n- Missing field rows: ${validationArtifact.missingFieldRows}\n- Forbidden hit rows: ${validationArtifact.forbiddenHitRows}\n- Source folder may be deleted: ${validationArtifact.sourceFolderMayBeDeleted}\n- Learner-ready modules: ${validationArtifact.learnerReadyModules}\n`);

console.log(JSON.stringify({
  ok: true,
  validationStatus: validationArtifact.validationStatus,
  inputRows: validationArtifact.inputRows,
  batchRows: validationArtifact.batchRows,
  readyRows: validationArtifact.readyRows,
  blockedRows: validationArtifact.blockedRows,
  sourceFolderMayBeDeleted: validationArtifact.sourceFolderMayBeDeleted,
}, null, 2));
