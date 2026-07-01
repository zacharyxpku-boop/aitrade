import fs from "node:fs";

const templatePath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_REVIEWER_INPUT_TEMPLATE.json";
const packPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_EXECUTION_PACK.json";
const inputJsonPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_001_INPUT.json";
const inputMdPath = "docs/reviewer-inputs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_001_INPUT.md";
const validationJsonPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_001_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_5_WAVE_5_PDF_AI_VISUAL_REVIEW_BATCH_001_VALIDATION.md";

const reviewedAt = "2026-06-25T00:00:00.000+08:00";
const reviewerName = "Codex visual review wave 5 batch 001";
const batchId = "wave_5_pdf_ai_visual_review_batch_001";
const boundary = "Course 5 Wave 5 PDF AI visual review batch 001 is private reviewer-facing education operations material. It records page-level visual observations and visible text cues for twelve Wave 5 PDF samples so they can receive later human confirmation and OCR review. It does not complete OCR, replace human approval, merge content into learner-facing modules, approve source-folder removal, approve learner-facing release, copy private source wording, provide stock recommendations, live signals, return promises, execution instructions, automation, write authorization, or production readiness.";

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
  ["course5_pdf_ocr_visual_review_019", {
    reviewerOwnedOcrTextExcerpt: "Visible slide text includes Video 1, Terminology, PA Fundamentals, Brooks Trading Course, and an English line about being familiar with terms.",
    reviewerOwnedVisualObservation: "The page is a course-slide title frame with a large terminology heading, Chinese translation text, a small chart image on the right, and course branding along the bottom.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row belongs to the price-action foundation path as a terminology and course-sequence entry point.",
    modulePlacement: "price_action_foundations; terminology; course_slides_alignment",
    evidenceLimitations: "Title-slide evidence only; it identifies the lesson area but does not provide a complete concept explanation without transcript or OCR confirmation.",
  }],
  ["course5_pdf_ocr_visual_review_020", {
    reviewerOwnedOcrTextExcerpt: "Visible slide text refers to Micro Channel, No PBs, a 9 bar bear micro channel, many gap bars, and eager bears with lower prices likely.",
    reviewerOwnedVisualObservation: "The slide shows a black-and-white price chart with a highlighted downward segment on the left and a later pullback/range area on the right, with bilingual annotations in multiple colors.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row routes to micro-channel recognition, no-pullback trend pressure, and the difference between a strong directional leg and later range behavior.",
    modulePlacement: "price_action_foundations; micro_channels; trend_pressure",
    evidenceLimitations: "Slide-level visual note only; exact bilingual wording and teaching emphasis still need OCR or reviewer confirmation.",
  }],
  ["course5_pdf_ocr_visual_review_021", {
    reviewerOwnedOcrTextExcerpt: "Visible slide text includes End of Video 36B, Trade Management and Taking Profits, PA Fundamentals, and Brooks Trading Course.",
    reviewerOwnedVisualObservation: "The page is an end-of-video slide with a large trade-management title, a presenter photo, and a small chart panel on the right.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row marks a course-path endpoint for trade-management concepts and should be used as curriculum sequencing evidence rather than an execution lesson.",
    modulePlacement: "price_action_foundations; trade_management; course_sequence",
    evidenceLimitations: "End-slide evidence only; it does not provide enough detail for learner-facing lesson content without transcript or OCR confirmation.",
  }],
  ["course5_pdf_ocr_visual_review_028", {
    reviewerOwnedOcrTextExcerpt: "Visible cover text includes Reading Price Charts Bar by Bar and a Chinese title about detailed interpretation of price behavior patterns.",
    reviewerOwnedVisualObservation: "The page is a book cover with Wiley branding, large Chinese title text, English subtitle text, translator and author lines, and publisher branding at the bottom.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces source identity for bar-by-bar price-action reading and price-action foundation modules.",
    modulePlacement: "price_action_foundations; bar_by_bar_reading; source_identity",
    evidenceLimitations: "Cover evidence only; it confirms source identity but not detailed teaching claims.",
  }],
  ["course5_pdf_ocr_visual_review_029", {
    reviewerOwnedOcrTextExcerpt: "Visible page text surrounds a chart figure and discusses a third push, pullback context, and a likely test of an earlier area.",
    reviewerOwnedVisualObservation: "The page contains a grayscale chart with a long rise, three numbered pullback or swing markers, and dense Chinese explanatory text above and below the figure.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row routes to bar-by-bar trend continuation reading, swing counting, and pullback-context interpretation.",
    modulePlacement: "price_action_foundations; bar_by_bar_reading; pullback_context",
    evidenceLimitations: "Chart-page evidence is useful, but exact interpretation still requires OCR or reviewer confirmation before lesson use.",
  }],
  ["course5_pdf_ocr_visual_review_030", {
    reviewerOwnedOcrTextExcerpt: "Visible page text is a general information record listing the Chinese book title, author, translator, ISBN, publication date, and publisher.",
    reviewerOwnedVisualObservation: "The page is mostly blank with a compact bibliographic block near the top left and no chart or lesson diagram.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row reinforces bibliography and source-version metadata for the bar-by-bar reading source.",
    modulePlacement: "source_map; bibliography; source_version_metadata",
    evidenceLimitations: "Bibliographic evidence only; not a direct teaching page.",
  }],
  ["course5_wave_5_pdf_supplemental_review_001", {
    reviewerOwnedOcrTextExcerpt: "Visible cover text includes Reading Price Charts Bar by Bar and a Chinese title about detailed interpretation of price behavior patterns.",
    reviewerOwnedVisualObservation: "The page repeats the same book-cover layout with Wiley branding, Chinese title, English subtitle, author and translator lines, and publisher branding.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row confirms another local PDF version maps to the same bar-by-bar price-action source identity.",
    modulePlacement: "price_action_foundations; bar_by_bar_reading; source_version_consistency",
    evidenceLimitations: duplicateAware,
  }],
  ["course5_wave_5_pdf_supplemental_review_002", {
    reviewerOwnedOcrTextExcerpt: "Visible page text surrounds the same chart figure and discusses a third push, pullback context, and a likely test of an earlier area.",
    reviewerOwnedVisualObservation: "The page repeats the grayscale chart with a long rise and three numbered swing markers, with dense explanatory text above and below.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row confirms the same bar-by-bar pullback-context chart page appears in another local PDF version.",
    modulePlacement: "price_action_foundations; bar_by_bar_reading; source_version_consistency",
    evidenceLimitations: duplicateAware,
  }],
  ["course5_wave_5_pdf_supplemental_review_003", {
    reviewerOwnedOcrTextExcerpt: "Visible page text is a general information record listing book title, author, translator, ISBN, publication date, and publisher.",
    reviewerOwnedVisualObservation: "The page repeats the mostly blank bibliographic-information layout with a compact text block near the top left.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row confirms source metadata consistency across another local PDF version.",
    modulePlacement: "source_map; bibliography; source_version_consistency",
    evidenceLimitations: duplicateAware,
  }],
  ["course5_wave_5_pdf_supplemental_review_004", {
    reviewerOwnedOcrTextExcerpt: "Visible cover text includes Reading Price Charts Bar by Bar and the Chinese title for detailed interpretation of price behavior patterns.",
    reviewerOwnedVisualObservation: "The page repeats the book-cover layout with Wiley mark, large Chinese title, English subtitle, author and translator lines, and publisher branding.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row confirms the original scanned PDF version maps to the same bar-by-bar source identity.",
    modulePlacement: "price_action_foundations; bar_by_bar_reading; source_version_consistency",
    evidenceLimitations: duplicateAware,
  }],
  ["course5_wave_5_pdf_supplemental_review_005", {
    reviewerOwnedOcrTextExcerpt: "Visible page text surrounds the same chart figure and discusses a third push, pullback context, and a likely test of an earlier area.",
    reviewerOwnedVisualObservation: "The page repeats the grayscale chart with three numbered swing markers and explanatory Chinese text above and below the figure.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row confirms the same bar-by-bar chart example appears in the original scanned PDF version.",
    modulePlacement: "price_action_foundations; bar_by_bar_reading; source_version_consistency",
    evidenceLimitations: duplicateAware,
  }],
  ["course5_wave_5_pdf_supplemental_review_006", {
    reviewerOwnedOcrTextExcerpt: "Visible page text is a general information record listing the Chinese book title, author, translator, ISBN, publication date, and publisher.",
    reviewerOwnedVisualObservation: "The page repeats the sparse bibliographic-information layout with a small text block and otherwise blank page.",
    paraphrasedTeachingConcept: "Original paraphrase, not copied: this row confirms the same source metadata page appears in the original scanned PDF version.",
    modulePlacement: "source_map; bibliography; source_version_consistency",
    evidenceLimitations: duplicateAware,
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
const expectedIds = template.rows.slice(0, 12).map((row) => row.reviewRowId);
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
  inputTemplateStatus: "course_5_wave_5_pdf_ai_visual_review_batch_001_twelve_rows_ready_for_reviewer_confirmation",
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
  validationStatus: "course_5_wave_5_pdf_ai_visual_review_batch_001_partially_ready_release_and_deletion_blocked",
  validationMode: "wave_5_pdf_ai_visual_review_batch_001_gate",
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
  completionRule: "Batch 001 covers the first twelve Wave 5 PDF samples but does not approve module merge, learner-facing release, or source-folder removal.",
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

fs.writeFileSync(inputMdPath, `# Local Course 5 Wave 5 PDF AI Visual Review Batch 001\n\n${boundary}\n\n| Review row | Sample | Page | Module placement | Visual observation |\n|---|---:|---:|---|---|\n${mdRows}\n\nSource folder may be deleted: false\n`);

fs.writeFileSync(validationMdPath, `# Local Course 5 Wave 5 PDF AI Visual Review Batch 001 Validation\n\n- Status: ${validationArtifact.validationStatus}\n- Input rows: ${validationArtifact.inputRows}\n- Batch rows: ${validationArtifact.batchRows}\n- Ready rows: ${validationArtifact.readyRows}\n- Blocked rows: ${validationArtifact.blockedRows}\n- Missing field rows: ${validationArtifact.missingFieldRows}\n- Forbidden hit rows: ${validationArtifact.forbiddenHitRows}\n- Source folder may be deleted: ${validationArtifact.sourceFolderMayBeDeleted}\n- Learner-ready modules: ${validationArtifact.learnerReadyModules}\n`);

console.log(JSON.stringify({
  ok: true,
  validationStatus: validationArtifact.validationStatus,
  inputRows: validationArtifact.inputRows,
  batchRows: validationArtifact.batchRows,
  readyRows: validationArtifact.readyRows,
  blockedRows: validationArtifact.blockedRows,
  sourceFolderMayBeDeleted: validationArtifact.sourceFolderMayBeDeleted,
}, null, 2));
