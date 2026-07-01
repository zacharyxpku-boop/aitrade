import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_EXECUTION_PACK.json";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_002_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_002_INPUT.md";
const validationJsonPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_002_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_002_VALIDATION.md";

const reviewedAt = "2026-06-25T00:00:00.000+08:00";
const reviewerName = "Codex visual review wave 5 batch 002";
const batchId = "wave_5_pdf_ai_visual_review_batch_002";
const boundary = "Course 5 Wave 5 PDF AI visual review batch 002 is private reviewer-facing education operations material. It records page-level visual observations and visible text cues for twelve Wave 5 PDF samples so they can receive later human confirmation and OCR review. It does not complete OCR, replace human approval, merge content into learner-facing modules, approve source-folder removal, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, execution instructions, automation, write authorization, or production readiness.";

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
  ["course5_wave_5_pdf_supplemental_review_007", {
    "reviewerOwnedOcrTextExcerpt": "Visible title text identifies an added or updated Brooks chart-pattern encyclopedia slide deck, updated in March 2024, with a chart panel on the right.",
    "reviewerOwnedVisualObservation": "The page is a title slide with large Chinese text, a right-side intraday chart showing a sharp decline and rebound, and screen-viewer controls around the slide.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row establishes source identity for the chart-pattern encyclopedia and routes it to the visual taxonomy and glossary path.",
    "modulePlacement": "chart_pattern_encyclopedia; terminology_glossary; source_identity",
    "evidenceLimitations": "Title-slide evidence only; use for source identity and curriculum mapping, not as a standalone chart-pattern lesson."
  }],
  ["course5_wave_5_pdf_supplemental_review_008", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide text refers to a low two bear flag after LH DT MTR, bear breakout, measured movement, EMA context, and multiple colored annotations.",
    "reviewerOwnedVisualObservation": "The slide contains a candlestick chart with dotted horizontal levels, a moving-average line, shaded swing areas, green and red arrows, and labels around a bearish continuation example.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to chart-pattern taxonomy for bear-flag structure, failed reversal context, measured-move framing, and annotation literacy.",
    "modulePlacement": "chart_pattern_encyclopedia; bear_flag_context; visual_annotation_literacy",
    "evidenceLimitations": "Machine-translated slide evidence; exact labels and statistical claims require OCR and reviewer confirmation before lesson use."
  }],
  ["course5_wave_5_pdf_supplemental_review_009", {
    "reviewerOwnedOcrTextExcerpt": "Visible title text again identifies the Brooks chart-pattern encyclopedia slide deck with an update date in March 2024 and a chart panel on the right.",
    "reviewerOwnedVisualObservation": "The page repeats the deck title layout with a presenter photo, Chinese title text, and a right-side chart showing a selloff and rebound shape.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms the same encyclopedia source identity at the end of the deck and supports version consistency tracking.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware reinforcement row from another local PDF version; useful for source coverage and version comparison, but not a new concept by itself."
  }],
  ["course5_wave_5_pdf_supplemental_review_010", {
    "reviewerOwnedOcrTextExcerpt": "Visible table headings include abbreviation, description, and Chinese translation or explanation, with entries such as 17t, 20GB, AIL, AIS, BO, BOM, BP, and BRN.",
    "reviewerOwnedVisualObservation": "The page is a dense three-column glossary table pairing abbreviations with English descriptions and Chinese explanations.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row belongs in the terminology glossary and helps map shorthand terms into neutral educational definitions.",
    "modulePlacement": "terminology_glossary; course_slides_alignment; abbreviation_map",
    "evidenceLimitations": "Glossary-page evidence; some terms use trading-context wording and must be rewritten neutrally before learner-facing use."
  }],
  ["course5_wave_5_pdf_supplemental_review_011", {
    "reviewerOwnedOcrTextExcerpt": "Visible entries include L3, L4, LH, LL, LOD, MA, MAG, and MDB, with explanations about pullbacks, wedge or flag structures, lower highs, lower lows, and moving averages.",
    "reviewerOwnedVisualObservation": "The page is a glossary table with long Chinese explanations in the right column and short English abbreviation descriptions in the middle column.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row bridges abbreviation learning with chart-pattern language for pullbacks, wedges, flags, and moving-average references.",
    "modulePlacement": "terminology_glossary; chart_pattern_encyclopedia; abbreviation_map",
    "evidenceLimitations": "Machine-translated glossary evidence; phrasing needs editorial cleanup and public grounding before teaching use."
  }],
  ["course5_wave_5_pdf_supplemental_review_012", {
    "reviewerOwnedOcrTextExcerpt": "Visible entries include TW and W, with explanations around truncated wedge, wedge, three-push pattern, converging trendlines, and trend-change context.",
    "reviewerOwnedVisualObservation": "The page is a sparse glossary table with two large rows and long Chinese explanations about wedge-family pattern terminology.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to wedge-family terminology and helps connect abbreviation glossary work with pattern taxonomy.",
    "modulePlacement": "terminology_glossary; wedge_patterns; chart_pattern_encyclopedia",
    "evidenceLimitations": "Glossary-only evidence without chart examples; needs OCR and reviewer confirmation before module merge."
  }],
  ["course5_wave_5_pdf_supplemental_review_013", {
    "reviewerOwnedOcrTextExcerpt": "Visible title text identifies the Brooks chart-pattern encyclopedia deck, updated March 1, 2024, with a right-side chart panel.",
    "reviewerOwnedVisualObservation": "The page is the Google-translated version of the encyclopedia title slide, with similar layout but slightly different translation and scaling.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row records a separate machine-translated version of the same chart-pattern encyclopedia source.",
    "modulePlacement": "chart_pattern_encyclopedia; source_version_consistency; machine_translation_comparison",
    "evidenceLimitations": "Duplicate-aware reinforcement row from another machine-translated PDF version; useful for source coverage and translation comparison, but not a new concept by itself."
  }],
  ["course5_wave_5_pdf_supplemental_review_014", {
    "reviewerOwnedOcrTextExcerpt": "Visible slide text again refers to a low two bear flag after LH DT MTR, a major bear breakout, measured movement, and EMA context.",
    "reviewerOwnedVisualObservation": "The page repeats the annotated bear-flag chart example with different machine-translation wording and the same colored arrows, dotted levels, moving average, and shaded zones.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms that the bear-flag chart-pattern example appears across another translation version.",
    "modulePlacement": "chart_pattern_encyclopedia; bear_flag_context; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware chart-pattern evidence; use for version comparison until OCR and reviewer confirmation are completed."
  }],
  ["course5_wave_5_pdf_supplemental_review_015", {
    "reviewerOwnedOcrTextExcerpt": "Visible title text again identifies the chart-pattern encyclopedia deck and update date, with the same right-side chart panel.",
    "reviewerOwnedVisualObservation": "The page repeats the deck closing/title layout with a presenter photo, Chinese title text, and chart panel.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row confirms end-of-deck source identity across another machine-translated PDF version.",
    "modulePlacement": "chart_pattern_encyclopedia; source_identity; source_version_consistency",
    "evidenceLimitations": "Duplicate-aware reinforcement row from another machine-translated PDF version; useful for source coverage and version comparison, but not a new concept by itself."
  }],
  ["course5_pdf_ocr_visual_review_022", {
    "reviewerOwnedOcrTextExcerpt": "Visible cover text includes Advanced Swing Technical Analysis in Chinese and Trading Price Action Trading Ranges in English.",
    "reviewerOwnedVisualObservation": "The page is a book cover with large Chinese title text, English subtitle, author and translator lines, publisher marks, and a candlestick strip near the bottom.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row reinforces source identity for range-analysis material and should be routed beyond generic trade-management labeling.",
    "modulePlacement": "trading_ranges; source_identity; course_5_pdf_intake",
    "evidenceLimitations": "Cover evidence only; it confirms source identity but not detailed teaching claims."
  }],
  ["course5_pdf_ocr_visual_review_023", {
    "reviewerOwnedOcrTextExcerpt": "Visible page header refers to pullbacks and trend-to-range discussion, with a chart figure labeled by numbered swing points and L or H markers.",
    "reviewerOwnedVisualObservation": "The page contains dense Chinese text above a grayscale chart annotated with swing counts, lower-high and higher-low style labels, and a moving-average line.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row routes to range-analysis education around failed continuation, swing labeling, and transition from trend to trading range.",
    "modulePlacement": "trading_ranges; swing_structure; range_transition_context",
    "evidenceLimitations": "Chart-page evidence is useful, but exact interpretation still requires OCR and reviewer confirmation before lesson use."
  }],
  ["course5_pdf_ocr_visual_review_024", {
    "reviewerOwnedOcrTextExcerpt": "Visible back-cover text describes the book scope around trading ranges, price action, and market behavior, with publisher, QR code, barcode, and price block.",
    "reviewerOwnedVisualObservation": "The page is a back cover with a candlestick band near the top, several Chinese paragraphs, a dark slogan band, QR code, ISBN barcode, and pricing block.",
    "paraphrasedTeachingConcept": "Original paraphrase, not copied: this row reinforces the source-map role of the range-analysis book and its relationship to the broader price-action curriculum.",
    "modulePlacement": "trading_ranges; curriculum_context; source_map",
    "evidenceLimitations": "Back-cover summary evidence; broad scope claims need corroboration before becoming teaching assertions."
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
const expectedIds = template.rows.slice(12, 24).map((row) => row.reviewRowId);
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
  inputTemplateStatus: "course_5_wave_5_pdf_ai_visual_review_batch_002_twelve_rows_ready_for_reviewer_confirmation",
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
  validationStatus: "course_5_wave_5_pdf_ai_visual_review_batch_002_partially_ready_release_and_deletion_blocked",
  validationMode: "wave_5_pdf_ai_visual_review_batch_002_gate",
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
  completionRule: "Batch 002 covers Wave 5 PDF samples 13 through 24 but does not approve module merge, learner-facing release, or source-folder removal.",
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

fs.writeFileSync(inputMdPath, `# Local Course 5 Wave 5 PDF AI Visual Review Batch 002\n\n${boundary}\n\n| Review row | Sample | Page | Module placement | Visual observation |\n|---|---:|---:|---|---|\n${mdRows}\n\nSource folder may be deleted: false\n`);

fs.writeFileSync(validationMdPath, `# Local Course 5 Wave 5 PDF AI Visual Review Batch 002 Validation\n\n- Status: ${validationArtifact.validationStatus}\n- Input rows: ${validationArtifact.inputRows}\n- Batch rows: ${validationArtifact.batchRows}\n- Ready rows: ${validationArtifact.readyRows}\n- Blocked rows: ${validationArtifact.blockedRows}\n- Missing field rows: ${validationArtifact.missingFieldRows}\n- Forbidden hit rows: ${validationArtifact.forbiddenHitRows}\n- Source folder may be deleted: ${validationArtifact.sourceFolderMayBeDeleted}\n- Learner-ready modules: ${validationArtifact.learnerReadyModules}\n`);

console.log(JSON.stringify({
  ok: true,
  validationStatus: validationArtifact.validationStatus,
  inputRows: validationArtifact.inputRows,
  batchRows: validationArtifact.batchRows,
  readyRows: validationArtifact.readyRows,
  blockedRows: validationArtifact.blockedRows,
  sourceFolderMayBeDeleted: validationArtifact.sourceFolderMayBeDeleted,
}, null, 2));
