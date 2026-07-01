import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_EXECUTION_PACK.json";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_006_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_006_INPUT.md";
const validationJsonPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_006_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_006_VALIDATION.md";

const reviewedAt = "2026-06-25T00:00:00.000+08:00";
const reviewerName = "Codex visual review wave 5 batch 006";
const batchId = "wave_5_pdf_ai_visual_review_batch_006";
const boundary = "Course 5 Wave 5 PDF AI visual review batch 006 is private reviewer-facing education operations material. It records page-level visual observations and visible text cues for twelve Wave 5 PDF samples so they can receive later human confirmation and OCR review. It does not complete OCR, replace human approval, merge content into learner-facing modules, approve source-folder removal, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, execution instructions, automation, write authorization, or production readiness.";

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
  ["course5_wave_5_pdf_supplemental_review_043", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies The Brooks Encyclopedia of Chart Patterns, Part 1 of 16, with classifications from A to B.",
    "reviewerOwnedVisualObservation": "The page is a cover slide with large orange title text, author attribution, and a right-side chart motif showing a decline and rebound.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity and taxonomy range for the A-to-B chart-pattern encyclopedia section.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; taxonomy_range_a_to_b",
    "evidenceLimitations": "Cover evidence only; route for source map and taxonomy coverage rather than direct lesson content."
  }],
  ["course5_wave_5_pdf_supplemental_review_044", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide title and notes describe a small-pullback bearish trend that starts late but develops with consecutive large bearish bars, follow-through, and a wedge-like climax label.",
    "reviewerOwnedVisualObservation": "The chart shows a sideways opening area, a sharp downward sequence with multiple red highlights, a moving-average line, a dotted wedge reference, and later sideways consolidation near the low.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to small-pullback trend structure, breakout follow-through, spike-versus-channel comparison, and climactic-move review.",
    "modulePlacement": "chart_pattern_encyclopedia; small_pullback_trend; breakout_followthrough; climactic_move_context",
    "evidenceLimitations": "Source slide includes probability-style and tactical shorthand; use only as historical structure-reading evidence until OCR and reviewer confirmation."
  }],
  ["course5_wave_5_pdf_supplemental_review_045", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text repeats The Brooks Encyclopedia of Chart Patterns, Part 1 of 16, with classifications from A to B.",
    "reviewerOwnedVisualObservation": "The page repeats the Part 1 cover-slide layout with author attribution and the same right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms source-version consistency for the Part 1 deck and supports coverage accounting.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware cover evidence; useful for coverage and version tracking, not as standalone instructional content."
  }],
  ["course5_wave_5_pdf_supplemental_review_046", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies The Brooks Encyclopedia of Chart Patterns, Part 9 of 16, with classifications from H to L.",
    "reviewerOwnedVisualObservation": "The page is a cover slide with large title typography, author attribution, and a right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity and taxonomy range for the H-to-L chart-pattern encyclopedia section.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; taxonomy_range_h_to_l",
    "evidenceLimitations": "Cover evidence only; use for source coverage and routing, not as a direct teaching concept."
  }],
  ["course5_wave_5_pdf_supplemental_review_047", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide title and notes describe an outside-bar break below an inside-inside pattern, followed by another inside-inside pattern and later upside breakout context.",
    "reviewerOwnedVisualObservation": "The chart shows a prior rally, a broad sideways range, a sharp downward bar, highlighted inside-bar clusters near the low, green follow-through highlights, and a moving-average line.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to outside-bar context, inside-inside pattern recognition, failed-breakout review, and mode-shift literacy.",
    "modulePlacement": "chart_pattern_encyclopedia; inside_bar_patterns; outside_bars; failed_breakout_context",
    "evidenceLimitations": "Annotated chart evidence with condensed labels; exact terminology needs OCR and reviewer confirmation before module merge."
  }],
  ["course5_wave_5_pdf_supplemental_review_048", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text repeats The Brooks Encyclopedia of Chart Patterns, Part 9 of 16, with classifications from H to L.",
    "reviewerOwnedVisualObservation": "The page repeats the Part 9 cover-slide layout with author attribution and the right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms source-version consistency for the Part 9 deck and supports coverage accounting.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware cover evidence; useful for coverage and version tracking, not as standalone instructional content."
  }],
  ["course5_wave_5_pdf_supplemental_review_049", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies The Brooks Encyclopedia of Chart Patterns, Part 5 of 16, with classifications from GD to GD M.",
    "reviewerOwnedVisualObservation": "The page is a cover slide with large orange title text, author attribution, and a right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity and taxonomy range for the GD-to-GD-M chart-pattern encyclopedia section.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; taxonomy_range_gd_to_gd_m",
    "evidenceLimitations": "Cover evidence only; route for source map and taxonomy coverage rather than direct lesson content."
  }],
  ["course5_wave_5_pdf_supplemental_review_050", {
    "reviewerOwnedOcrTextExcerpt": "Visible title page states gap-down and high-two setup terminology on an orange background inside the GD-to-GD-M classification deck.",
    "reviewerOwnedVisualObservation": "The page is a text-only title slide with large white lettering, orange background, and faint chart-pattern watermark.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to gap-down and high-two terminology mapping as a title-only taxonomy cue, not as practical guidance.",
    "modulePlacement": "chart_pattern_encyclopedia; terminology_title; gap_context; high_two_context",
    "evidenceLimitations": "Title-slide evidence only; it must not become an instructional action rule without surrounding slides, OCR, and reviewer confirmation."
  }],
  ["course5_wave_5_pdf_supplemental_review_051", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text repeats The Brooks Encyclopedia of Chart Patterns, Part 5 of 16, with classifications from GD to GD M.",
    "reviewerOwnedVisualObservation": "The page repeats the Part 5 cover-slide layout with author attribution and the same right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms source-version consistency for the Part 5 deck and supports coverage accounting.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware cover evidence; useful for coverage and version tracking, not as standalone instructional content."
  }],
  ["course5_wave_5_pdf_supplemental_review_052", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies The Brooks Encyclopedia of Chart Patterns, Part 4 of 16, with classification G.",
    "reviewerOwnedVisualObservation": "The page is a cover slide with large title typography, author attribution, and a right-side chart motif showing a decline and rebound.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity and taxonomy range for the G classification chart-pattern deck.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; taxonomy_range_g",
    "evidenceLimitations": "Cover evidence only; use for source coverage and routing, not as a direct teaching concept."
  }],
  ["course5_wave_5_pdf_supplemental_review_053", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide title and labels describe a bearish channel with breakout context, EMA interaction, lower-high double-top flag context, measuring-gap language, and acceleration downward.",
    "reviewerOwnedVisualObservation": "The chart shows a descending channel, a failed bounce near the moving average, dotted guide levels, highlighted bearish bars, and a later lower trading area.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to bear-channel structure, EMA interaction, measuring-gap context, failed reversal review, and acceleration literacy.",
    "modulePlacement": "chart_pattern_encyclopedia; bear_channel; ema_context; measuring_gap_reference; failed_reversal_context",
    "evidenceLimitations": "Source slide includes forward-looking shorthand; rewrite as retrospective structure analysis and verify with OCR before module merge."
  }],
  ["course5_wave_5_pdf_supplemental_review_054", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text repeats The Brooks Encyclopedia of Chart Patterns, Part 4 of 16, with classification G.",
    "reviewerOwnedVisualObservation": "The page repeats the Part 4 cover-slide layout with author attribution and the right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms source-version consistency for the Part 4 deck and supports coverage accounting.",
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
const expectedIds = template.rows.slice(60, 72).map((row) => row.reviewRowId);
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
  inputTemplateStatus: "course_5_wave_5_pdf_ai_visual_review_batch_006_twelve_rows_ready_for_reviewer_confirmation",
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
  validationStatus: "course_5_wave_5_pdf_ai_visual_review_batch_006_partially_ready_release_and_deletion_blocked",
  validationMode: "wave_5_pdf_ai_visual_review_batch_006_gate",
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
  completionRule: "Batch 006 covers Wave 5 PDF samples 61 through 72 but does not approve module merge, learner-facing release, or source-folder removal.",
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

fs.writeFileSync(inputMdPath, `# Local Course 5 Wave 5 PDF AI Visual Review Batch 006\n\n${boundary}\n\n| Review row | Sample | Page | Module placement | Visual observation |\n|---|---:|---:|---|---|\n${mdRows}\n\nSource folder may be deleted: false\n`);

fs.writeFileSync(validationMdPath, `# Local Course 5 Wave 5 PDF AI Visual Review Batch 006 Validation\n\n- Status: ${validationArtifact.validationStatus}\n- Input rows: ${validationArtifact.inputRows}\n- Batch rows: ${validationArtifact.batchRows}\n- Ready rows: ${validationArtifact.readyRows}\n- Blocked rows: ${validationArtifact.blockedRows}\n- Missing field rows: ${validationArtifact.missingFieldRows}\n- Forbidden hit rows: ${validationArtifact.forbiddenHitRows}\n- Source folder may be deleted: ${validationArtifact.sourceFolderMayBeDeleted}\n- Learner-ready modules: ${validationArtifact.learnerReadyModules}\n`);

console.log(JSON.stringify({
  ok: true,
  validationStatus: validationArtifact.validationStatus,
  inputRows: validationArtifact.inputRows,
  batchRows: validationArtifact.batchRows,
  readyRows: validationArtifact.readyRows,
  blockedRows: validationArtifact.blockedRows,
  sourceFolderMayBeDeleted: validationArtifact.sourceFolderMayBeDeleted,
}, null, 2));
