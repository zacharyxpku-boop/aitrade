import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_EXECUTION_PACK.json";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_007_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_007_INPUT.md";
const validationJsonPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_007_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_007_VALIDATION.md";

const reviewedAt = "2026-06-25T00:00:00.000+08:00";
const reviewerName = "Codex visual review wave 5 batch 007 final";
const batchId = "wave_5_pdf_ai_visual_review_batch_007";
const boundary = "Course 5 Wave 5 PDF AI visual review batch 007 final is private reviewer-facing education operations material. It records page-level visual observations and visible text cues for the final thirteen Wave 5 PDF samples so they can receive later human confirmation and OCR review. It does not complete OCR, replace human approval, merge content into learner-facing modules, approve source-folder removal, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, execution instructions, automation, write authorization, or production readiness.";

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
  ["course5_wave_5_pdf_supplemental_review_055", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies New Slides Added/Updated for The Brooks Encyclopedia of Chart Patterns with latest update March 1, 2024 and Al Brooks attribution.",
    "reviewerOwnedVisualObservation": "The page is a full-screen slide viewer cover with large title text, author line, and a right-side chart motif showing a sharp decline and rebound.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes updated-source identity and version-date routing for the supplemental chart-pattern deck.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; update_version_context",
    "evidenceLimitations": "Cover evidence only; use for source map and version tracking rather than direct lesson content."
  }],
  ["course5_wave_5_pdf_supplemental_review_056", {
    "reviewerOwnedOcrTextExcerpt": "Visible title describes a low-two bearish flag after a lower-high double-top major-trend-reversal context, with breakout, two-leg, measured-move, and EMA flag annotations.",
    "reviewerOwnedVisualObservation": "The chart shows an initial rally, broad topping area, sharp downside break, a small consolidation below the moving average, and marked lower-high flag context.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to low-two flag structure, lower-high double-top context, major reversal review, measured-move literacy, and EMA interaction.",
    "modulePlacement": "chart_pattern_encyclopedia; low_two_flag; lower_high_double_top_context; ema_context; measured_move_reference",
    "evidenceLimitations": "Annotated chart evidence includes probability-style language; rewrite only as retrospective structure literacy after OCR and reviewer confirmation."
  }],
  ["course5_wave_5_pdf_supplemental_review_057", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text repeats New Slides Added/Updated for The Brooks Encyclopedia of Chart Patterns with latest update March 1, 2024 and author attribution.",
    "reviewerOwnedVisualObservation": "The page repeats the updated-deck cover layout, this time with a portrait image, author line, and right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms updated supplemental deck identity and version consistency for coverage accounting.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware cover evidence; useful for coverage and version tracking, not standalone instruction."
  }],
  ["course5_wave_5_pdf_supplemental_review_058", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies The Brooks Encyclopedia of Chart Patterns, Part 15 of 16, classifications TRD to V.",
    "reviewerOwnedVisualObservation": "The page is a slide viewer cover with left outline thumbnails, large orange title typography, author attribution, and a right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity and taxonomy range for the TRD-to-V chart-pattern encyclopedia section.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; taxonomy_range_trd_to_v",
    "evidenceLimitations": "Cover evidence only; route for source coverage and taxonomy map rather than direct lesson content."
  }],
  ["course5_wave_5_pdf_supplemental_review_059", {
    "reviewerOwnedOcrTextExcerpt": "Visible title describes failed bull-trend resumption after a brief breakout attempt, followed by return to a trading-range state.",
    "reviewerOwnedVisualObservation": "The chart shows a strong earlier upswing inside a shaded channel, then a long sideways area around the moving average with a small failed upward attempt.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to trend-resumption failure, breakout-attempt review, and transition from trend behavior back into range behavior.",
    "modulePlacement": "chart_pattern_encyclopedia; trend_resumption_failure; breakout_attempt_context; trading_range_transition",
    "evidenceLimitations": "Single annotated slide; use as structure-reading evidence pending OCR and reviewer confirmation."
  }],
  ["course5_wave_5_pdf_supplemental_review_060", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text repeats The Brooks Encyclopedia of Chart Patterns, Part 15 of 16, classifications TRD to V.",
    "reviewerOwnedVisualObservation": "The page repeats the Part 15 cover layout with author portrait, left outline thumbnails, and the right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms source-version consistency for the Part 15 deck and supports final coverage accounting.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware cover evidence; useful for coverage and version tracking, not standalone instructional content."
  }],
  ["course5_wave_5_pdf_supplemental_review_061", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies The Brooks Encyclopedia of Chart Patterns, Part 14 of 16, classifications T to TRA.",
    "reviewerOwnedVisualObservation": "The page is a cover slide inside a slide viewer with outline thumbnails, large title text, author attribution, and a right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity and taxonomy range for the T-to-TRA chart-pattern encyclopedia section.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; taxonomy_range_t_to_tra",
    "evidenceLimitations": "Cover evidence only; route for source coverage and taxonomy mapping rather than direct lesson content."
  }],
  ["course5_wave_5_pdf_supplemental_review_062", {
    "reviewerOwnedOcrTextExcerpt": "Visible title describes a second-leg bearish trap with exhaustion-gap context below a wedge bottom, plus later reversal-climax language.",
    "reviewerOwnedVisualObservation": "The chart shows a prior sideways-to-down move, highlighted wedge-bottom area, colored bar cluster around a failed downside extension, and a later decline.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to wedge-bottom context, second-leg trap review, exhaustion-gap literacy, and failed-extension interpretation.",
    "modulePlacement": "chart_pattern_encyclopedia; wedge_bottom; second_leg_trap_context; exhaustion_gap_reference; failed_extension_context",
    "evidenceLimitations": "Annotated chart includes tactical shorthand; retain as retrospective pattern-literacy input until OCR and reviewer confirmation."
  }],
  ["course5_wave_5_pdf_supplemental_review_063", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text repeats The Brooks Encyclopedia of Chart Patterns, Part 14 of 16, classifications T to TRA.",
    "reviewerOwnedVisualObservation": "The page repeats the Part 14 cover slide with author portrait, left outline thumbnails, and right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms source-version consistency for the Part 14 deck and supports coverage accounting.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware cover evidence; useful for coverage and version tracking, not standalone instruction."
  }],
  ["course5_wave_5_pdf_supplemental_review_064", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies The Brooks Encyclopedia of Chart Patterns, Part 16 of 16, classifications W to Z.",
    "reviewerOwnedVisualObservation": "The page is a cover slide inside a slide viewer with outline thumbnails, large title text, author attribution, and a right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity and taxonomy range for the W-to-Z chart-pattern encyclopedia section.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; taxonomy_range_w_to_z",
    "evidenceLimitations": "Cover evidence only; route for source coverage and taxonomy map rather than direct lesson content."
  }],
  ["course5_wave_5_pdf_supplemental_review_065", {
    "reviewerOwnedOcrTextExcerpt": "Visible title describes a truncated wedge that failed and became a wedge bottom, with double-bottom and second-leg-down annotations.",
    "reviewerOwnedVisualObservation": "The chart shows a steep decline, a sideways base with dotted wedge guides, a failed breakdown area, red-highlighted bars, and a rebound above the moving average.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to truncated-wedge diagnosis, wedge-bottom conversion, double-bottom context, and failed-breakdown review.",
    "modulePlacement": "chart_pattern_encyclopedia; truncated_wedge; wedge_bottom; double_bottom_context; failed_breakdown_context",
    "evidenceLimitations": "Single chart example with dense annotations; use as module candidate only after OCR and reviewer confirmation."
  }],
  ["course5_wave_5_pdf_supplemental_review_066", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text repeats The Brooks Encyclopedia of Chart Patterns, Part 16 of 16, classifications W to Z.",
    "reviewerOwnedVisualObservation": "The page repeats the Part 16 cover slide with author portrait, outline thumbnails, and right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms source-version consistency for the Part 16 deck and supports final coverage accounting.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware cover evidence; useful for coverage and version tracking, not standalone instructional content."
  }],
  ["course5_wave_5_pdf_supplemental_review_067", {
    "reviewerOwnedOcrTextExcerpt": "Visible page is a long Chinese knowledge-tree map with many colored branches and repeated course-system labels.",
    "reviewerOwnedVisualObservation": "The image is a very tall vertical mind map with dense small text, color-coded branches, and multiple large section trunks spanning the page.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to global course-system architecture, concept taxonomy, and future module-navigation mapping rather than a single lesson claim.",
    "modulePlacement": "course_5_system_map; knowledge_tree; module_navigation; taxonomy_backbone",
    "evidenceLimitations": "Text is too dense for reliable visual reading; preserve original source and require high-resolution OCR or manual extraction before module merge."
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
const expectedIds = template.rows.slice(72, 85).map((row) => row.reviewRowId);
const actualIds = batchRows.map((row) => row.reviewRowId);

if (rows.length !== 85) fail(`expected 85 input rows, got ${rows.length}`);
if (batchRows.length !== 13) fail(`expected 13 batch rows, got ${batchRows.length}`);
if (readyRows.length !== 13) fail(`expected 13 ready rows, got ${readyRows.length}`);
if (blockedRows.length !== 72) fail(`expected 72 blocked rows, got ${blockedRows.length}`);
if (forbiddenHitRows.length !== 0) fail(`expected 0 forbidden hit rows, got ${forbiddenHitRows.length}`);
if (missingFieldRows.length !== 72) fail(`expected 72 missing field rows, got ${missingFieldRows.length}`);
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) fail(`unexpected batch ids ${actualIds.join(",")}`);

const inputArtifact = {
  ...template,
  generatedAt: reviewedAt,
  inputTemplateStatus: "course_5_wave_5_pdf_ai_visual_review_batch_007_final_thirteen_rows_ready_for_reviewer_confirmation",
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
  validationStatus: "course_5_wave_5_pdf_ai_visual_review_batch_007_final_rows_ready_release_and_deletion_blocked",
  validationMode: "wave_5_pdf_ai_visual_review_batch_007_gate",
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
  completionRule: "Batch 007 Final covers Wave 5 PDF samples 73 through 85 but does not approve module merge, learner-facing release, or source-folder removal.",
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

fs.writeFileSync(inputMdPath, `# Local Course 5 Wave 5 PDF AI Visual Review Batch 007 Final\n\n${boundary}\n\n| Review row | Sample | Page | Module placement | Visual observation |\n|---|---:|---:|---|---|\n${mdRows}\n\nSource folder may be deleted: false\n`);

fs.writeFileSync(validationMdPath, `# Local Course 5 Wave 5 PDF AI Visual Review Batch 007 Final Validation\n\n- Status: ${validationArtifact.validationStatus}\n- Input rows: ${validationArtifact.inputRows}\n- Batch rows: ${validationArtifact.batchRows}\n- Ready rows: ${validationArtifact.readyRows}\n- Blocked rows: ${validationArtifact.blockedRows}\n- Missing field rows: ${validationArtifact.missingFieldRows}\n- Forbidden hit rows: ${validationArtifact.forbiddenHitRows}\n- Source folder may be deleted: ${validationArtifact.sourceFolderMayBeDeleted}\n- Learner-ready modules: ${validationArtifact.learnerReadyModules}\n`);

console.log(JSON.stringify({
  ok: true,
  validationStatus: validationArtifact.validationStatus,
  inputRows: validationArtifact.inputRows,
  batchRows: validationArtifact.batchRows,
  readyRows: validationArtifact.readyRows,
  blockedRows: validationArtifact.blockedRows,
  sourceFolderMayBeDeleted: validationArtifact.sourceFolderMayBeDeleted,
}, null, 2));
