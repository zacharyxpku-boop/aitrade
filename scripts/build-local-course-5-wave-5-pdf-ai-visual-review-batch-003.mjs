import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_EXECUTION_PACK.json";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_003_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_003_INPUT.md";
const validationJsonPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_003_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_003_VALIDATION.md";

const reviewedAt = "2026-06-25T00:00:00.000+08:00";
const reviewerName = "Codex visual review wave 5 batch 003";
const batchId = "wave_5_pdf_ai_visual_review_batch_003";
const boundary = "Course 5 Wave 5 PDF AI visual review batch 003 is private reviewer-facing education operations material. It records page-level visual observations and visible text cues for twelve Wave 5 PDF samples so they can receive later human confirmation and OCR review. It does not complete OCR, replace human approval, merge content into learner-facing modules, approve source-folder removal, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, execution instructions, automation, write authorization, or production readiness.";

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
  ["course5_pdf_ocr_visual_review_025", {
    "reviewerOwnedOcrTextExcerpt": "Visible text identifies a translator preface page for an advanced PA slide deck and describes the course context and learning sequence.",
    "reviewerOwnedVisualObservation": "The page is mostly Chinese prose with a large title, a formal preface layout, and no standalone chart example.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row records source background and curriculum framing for the advanced PA slide material rather than a chart-pattern lesson.",
    "modulePlacement": "course_slides_alignment; curriculum_context; source_background",
    "evidenceLimitations": "Preface-page evidence only; it supports source context and sequencing but does not provide a learner-ready technical concept."
  }],
  ["course5_pdf_ocr_visual_review_026", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide title refers to a five-minute chart as a broad channel or trending trading-range day, with bilingual notes and colored chart annotations.",
    "reviewerOwnedVisualObservation": "The slide shows a candlestick chart moving within a broad downward channel, with drawn guide lines, colored highlights, a moving average, and numbered bar labels.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to broad-channel and trading-range education, emphasizing visual recognition of overlapping swings and channel boundaries.",
    "modulePlacement": "course_slides_alignment; broad_channels; trading_ranges",
    "evidenceLimitations": "Slide-level visual evidence; exact chart interpretation and any conditional language require OCR and reviewer confirmation before module use."
  }],
  ["course5_pdf_ocr_visual_review_027", {
    "reviewerOwnedOcrTextExcerpt": "Visible review text includes ideas about changing style when the premise changes and recognizing trapped participants in a market sequence.",
    "reviewerOwnedVisualObservation": "The page is a text-heavy review slide with numbered bullet points and bilingual phrasing, without a chart panel.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row belongs in review-checkpoint material about updating market context and identifying when earlier assumptions no longer fit.",
    "modulePlacement": "course_slides_alignment; review_checkpoint; market_context",
    "evidenceLimitations": "Text-slide evidence; needs OCR, editorial rewrite, and reviewer confirmation before learner-facing summarization."
  }],
  ["course5_pdf_ocr_visual_review_031", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies The Brooks Encyclopedia of Chart Patterns, Part 13 of 16, with classifications from SM to SZ.",
    "reviewerOwnedVisualObservation": "The page is a cover slide with large orange title text, author attribution, and a right-side chart image used as a visual motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity and classification range for the chart-pattern encyclopedia sequence.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; taxonomy_range_sm_to_sz",
    "evidenceLimitations": "Cover evidence only; useful for source mapping and taxonomy boundaries, not for a standalone lesson."
  }],
  ["course5_pdf_ocr_visual_review_032", {
    "reviewerOwnedOcrTextExcerpt": "Visible title text presents a position-exit-and-reversal terminology slide inside the SM to SZ classification section.",
    "reviewerOwnedVisualObservation": "The page is a title slide with a large heading, a mostly blank body area, and a right-side chart motif inherited from the deck template.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to terminology mapping for reversal-context language while preserving it as a title-only source cue.",
    "modulePlacement": "chart_pattern_encyclopedia; terminology_title; reversal_context",
    "evidenceLimitations": "Title-slide evidence only; it must not be converted into practical action guidance without confirmed surrounding slides and public grounding."
  }],
  ["course5_pdf_ocr_visual_review_033", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide title describes a prior-session climactic decline followed by sideways-to-up context, with probability-style wording visible on the slide.",
    "reviewerOwnedVisualObservation": "The chart shows a strong downward sequence, later basing and rebound action, a moving-average line, numbered bars, and text callouts around the example.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row should become a historical chart-case note about climactic movement and subsequent range formation, with any forecast-style language neutralized.",
    "modulePlacement": "chart_pattern_encyclopedia; climactic_move_context; historical_chart_case",
    "evidenceLimitations": "Probability-like wording on the source must be rewritten as retrospective pattern context and verified before teaching use."
  }],
  ["course5_pdf_ocr_visual_review_034", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies The Brooks Encyclopedia of Chart Patterns, Part 8 of 16, with classifications from GU N to GZ.",
    "reviewerOwnedVisualObservation": "The page is a cover slide with large title typography, author attribution, and a right-side chart image showing a downward move and rebound.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row records source identity and taxonomy range for the Part 8 chart-pattern deck.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; taxonomy_range_gu_to_gz",
    "evidenceLimitations": "Cover evidence only; use for source coverage and routing, not as a direct teaching concept."
  }],
  ["course5_pdf_ocr_visual_review_035", {
    "reviewerOwnedOcrTextExcerpt": "Visible title and annotations describe a gap-up chart with a triangle structure and a failed upward breakout, with colored arrows and boxes.",
    "reviewerOwnedVisualObservation": "The slide shows a candlestick chart with converging triangle guide lines, shaded zones, a moving-average line, and annotations around a failed breakout area.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to gap context, triangle recognition, and failed-breakout taxonomy as visual pattern literacy.",
    "modulePlacement": "chart_pattern_encyclopedia; gap_context; triangle_failed_breakout",
    "evidenceLimitations": "Annotated chart evidence; exact sequence labels and any implied tactical use require OCR and reviewer confirmation."
  }],
  ["course5_pdf_ocr_visual_review_036", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text repeats Part 8 of 16 and the GU N to GZ classification range for the Brooks chart-pattern encyclopedia.",
    "reviewerOwnedVisualObservation": "The page repeats the title-slide layout with author attribution and the same right-side chart motif, suggesting closing or repeated source identity material.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row reinforces source-version consistency and confirms the taxonomy range at another point in the PDF.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware cover evidence; useful for version consistency but not a new lesson by itself."
  }],
  ["course5_wave_5_pdf_supplemental_review_016", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text identifies The Brooks Encyclopedia of Chart Patterns, Part 11 of 16, with classifications from N to P.",
    "reviewerOwnedVisualObservation": "The page is a cover slide with large title text, author attribution, and a right-side chart motif showing a sharp decline and rebound.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity and classification range for the N-to-P chart-pattern encyclopedia section.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; taxonomy_range_n_to_p",
    "evidenceLimitations": "Cover evidence only; route for source map and taxonomy coverage rather than direct lesson content."
  }],
  ["course5_wave_5_pdf_supplemental_review_017", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide title and labels discuss consecutive outside bars, failed breakout attempts, a final flag context, and a later downward sequence.",
    "reviewerOwnedVisualObservation": "The chart shows an upward trend segment, a tight range near the top, colored green and red boxes, arrows, a moving average, and a later decline.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to outside-bar clusters, failed-breakout context, and final-flag pattern literacy as historical chart reading.",
    "modulePlacement": "chart_pattern_encyclopedia; outside_bars; failed_breakout_context; final_flag_context",
    "evidenceLimitations": "Annotated chart evidence with condensed terminology; OCR and reviewer confirmation are required before converting to a learner module."
  }],
  ["course5_wave_5_pdf_supplemental_review_018", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text repeats The Brooks Encyclopedia of Chart Patterns, Part 11 of 16, with N to P classifications.",
    "reviewerOwnedVisualObservation": "The page repeats the Part 11 cover-slide layout with author attribution and a right-side chart motif.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms source-version consistency for the Part 11 deck and supports coverage accounting.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware cover evidence; use for coverage and version tracking, not as standalone instructional content."
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
const expectedIds = template.rows.slice(24, 36).map((row) => row.reviewRowId);
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
  inputTemplateStatus: "course_5_wave_5_pdf_ai_visual_review_batch_003_twelve_rows_ready_for_reviewer_confirmation",
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
  validationStatus: "course_5_wave_5_pdf_ai_visual_review_batch_003_partially_ready_release_and_deletion_blocked",
  validationMode: "wave_5_pdf_ai_visual_review_batch_003_gate",
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
  completionRule: "Batch 003 covers Wave 5 PDF samples 25 through 36 but does not approve module merge, learner-facing release, or source-folder removal.",
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

fs.writeFileSync(inputMdPath, `# Local Course 5 Wave 5 PDF AI Visual Review Batch 003\n\n${boundary}\n\n| Review row | Sample | Page | Module placement | Visual observation |\n|---|---:|---:|---|---|\n${mdRows}\n\nSource folder may be deleted: false\n`);

fs.writeFileSync(validationMdPath, `# Local Course 5 Wave 5 PDF AI Visual Review Batch 003 Validation\n\n- Status: ${validationArtifact.validationStatus}\n- Input rows: ${validationArtifact.inputRows}\n- Batch rows: ${validationArtifact.batchRows}\n- Ready rows: ${validationArtifact.readyRows}\n- Blocked rows: ${validationArtifact.blockedRows}\n- Missing field rows: ${validationArtifact.missingFieldRows}\n- Forbidden hit rows: ${validationArtifact.forbiddenHitRows}\n- Source folder may be deleted: ${validationArtifact.sourceFolderMayBeDeleted}\n- Learner-ready modules: ${validationArtifact.learnerReadyModules}\n`);

console.log(JSON.stringify({
  ok: true,
  validationStatus: validationArtifact.validationStatus,
  inputRows: validationArtifact.inputRows,
  batchRows: validationArtifact.batchRows,
  readyRows: validationArtifact.readyRows,
  blockedRows: validationArtifact.blockedRows,
  sourceFolderMayBeDeleted: validationArtifact.sourceFolderMayBeDeleted,
}, null, 2));
