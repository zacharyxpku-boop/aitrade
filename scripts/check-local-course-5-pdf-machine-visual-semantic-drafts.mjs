import fs from "node:fs";

const draftsPath = "docs/LOCAL_COURSE_5_PDF_MACHINE_VISUAL_SEMANTIC_DRAFTS.json";
const draftsMdPath = "docs/LOCAL_COURSE_5_PDF_MACHINE_VISUAL_SEMANTIC_DRAFTS.md";
const executionPackPath = "docs/LOCAL_COURSE_5_PDF_OCR_VISUAL_EXECUTION_PACK.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const drafts = readJson(draftsPath);
const executionPack = readJson(executionPackPath);
if (!fs.existsSync(draftsMdPath)) fail(`missing ${draftsMdPath}`);

if (drafts.educationOnly !== true) fail("drafts must keep educationOnly:true");
if (drafts.productionReady !== false) fail("drafts must keep productionReady:false");
if (drafts.learnerFacingRelease !== false) fail("drafts must keep learnerFacingRelease:false");
if (drafts.approvalStatus !== "not_approved") fail("drafts must keep approvalStatus:not_approved");
if (drafts.writeAllowedNow !== false) fail("drafts must keep writeAllowedNow:false");
if (drafts.draftStatus !== "course_5_pdf_machine_visual_semantic_drafts_ready_blocked_on_ocr_or_real_visual_review") fail(`unexpected draftStatus: ${drafts.draftStatus}`);
if (drafts.draftMode !== "heuristic_pdf_page_orientation_not_ocr_not_human_review") fail(`unexpected draftMode: ${drafts.draftMode}`);
if (drafts.sourcePdfRows !== 41 || drafts.sourcePdfRows !== executionPack.pdfRows) fail("source PDF count drift");
if (drafts.sourcePdfPages !== 44398 || drafts.sourcePdfPages !== executionPack.totalPages) fail("source PDF page count drift");
if (drafts.sourceSampleRows !== 121 || drafts.pdfDraftRows !== 121 || drafts.pdfDraftRows !== executionPack.sampleRowCount) fail("PDF sample/draft count drift");
if (drafts.moduleRowCount < 9) fail("module row count unexpectedly low");
if (drafts.readyReviewerNotes !== 0) fail("reviewer notes must not be fabricated");
if (drafts.acceptedForPdfVisualSemanticReviewRows !== 0 || drafts.acceptedForModuleDistillationRows !== 0 || drafts.acceptedForDeletionReadinessRows !== 0) fail("machine PDF drafts must not be accepted");
if (drafts.sourceFolderMayBeDeleted !== false) fail("source folder deletion must remain blocked");
if (!Array.isArray(drafts.draftRows) || drafts.draftRows.length !== 121) fail("draftRows must cover 121 samples");
if (!Array.isArray(drafts.moduleRows) || drafts.moduleRows.length < 9) fail("module coverage unexpectedly low");

const ids = new Set();
for (const row of drafts.draftRows) {
  if (!row.draftId || ids.has(row.draftId)) fail(`duplicate or missing draftId: ${row.draftId}`);
  ids.add(row.draftId);
  if (!fs.existsSync(row.sampleImagePath)) fail(`missing sample image: ${row.sampleImagePath}`);
  if (row.draftStatus !== "pdf_machine_visual_semantic_draft_needs_ocr_or_real_reviewer_validation") fail(`bad row status: ${row.draftId}`);
  if (row.acceptedForPdfVisualSemanticReview !== false || row.acceptedForModuleDistillation !== false || row.acceptedForDeletionReadiness !== false) fail(`machine row pre-accepted: ${row.draftId}`);
  if (row.learnerFacingRelease !== false || row.approvalStatus !== "not_approved" || row.productionReady !== false || row.writeAllowedNow !== false) fail(`boundary drift: ${row.draftId}`);
  if (!Array.isArray(row.candidateConcepts) || row.candidateConcepts.length === 0) fail(`missing candidate concepts: ${row.draftId}`);
  if (!row.candidateSummary?.includes("Machine-assisted PDF page orientation")) fail(`bad candidate summary: ${row.draftId}`);
  if (!row.candidateSummary?.includes("Reviewer must inspect")) fail(`summary missing human verification: ${row.draftId}`);
  if (!Array.isArray(row.reviewerQuestions) || row.reviewerQuestions.length < 4) fail(`missing reviewer questions: ${row.draftId}`);
  if (!Array.isArray(row.riskFlags) || !row.riskFlags.includes("not_ocr_verified") || !row.riskFlags.includes("not_human_reviewed")) fail(`missing risk flags: ${row.draftId}`);
  if (!Array.isArray(row.acceptanceRequiredBeforeUse) || !row.acceptanceRequiredBeforeUse.includes("explicit_release_or_deletion_readiness_approval")) fail(`missing acceptance gates: ${row.draftId}`);
}

const concepts = drafts.draftRows.flatMap((row) => row.candidateConcepts).join(" ");
for (const concept of [
  "chart_pattern_taxonomy",
  "terminology_or_translation_review",
  "trend_or_channel_chart_reading",
  "reversal_chart_reading",
  "price_action_foundation_review",
  "trade_management_education_case_review",
  "bar_by_bar_chart_reading",
  "pdf_representative_page_visual_review",
]) {
  if (!concepts.includes(concept)) fail(`missing candidate concept: ${concept}`);
}

const priorityTotal = Object.values(drafts.priorityCounts || {}).reduce((sum, count) => sum + count, 0);
if (priorityTotal !== drafts.pdfDraftRows) fail("priority counts must sum to draft rows");
const bucketTotal = Object.values(drafts.extractionBucketCounts || {}).reduce((sum, count) => sum + count, 0);
if (bucketTotal !== drafts.pdfDraftRows) fail("bucket counts must sum to draft rows");

const chartModule = drafts.moduleRows.find((row) => row.moduleId === "chart_pattern_encyclopedia");
if (!chartModule || chartModule.draftRows < 20) fail("chart pattern PDF draft coverage missing");
const reversalsModule = drafts.moduleRows.find((row) => row.moduleId === "reversals");
if (!reversalsModule || reversalsModule.draftRows < 15) fail("reversals PDF draft coverage missing");

const boundaryText = `${drafts.boundary || ""} ${drafts.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education operations",
  "heuristic orientation",
  "do not perform ocr",
  "read or transcribe source text",
  "human review",
  "module acceptance",
  "deletion readiness",
  "learner-facing release",
  "copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary/completion missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  draftStatus: drafts.draftStatus,
  pdfDraftRows: drafts.pdfDraftRows,
  sourcePdfRows: drafts.sourcePdfRows,
  sourcePdfPages: drafts.sourcePdfPages,
  moduleRowCount: drafts.moduleRowCount,
  readyReviewerNotes: drafts.readyReviewerNotes,
  acceptedForPdfVisualSemanticReviewRows: drafts.acceptedForPdfVisualSemanticReviewRows,
  acceptedForDeletionReadinessRows: drafts.acceptedForDeletionReadinessRows,
  sourceFolderMayBeDeleted: drafts.sourceFolderMayBeDeleted,
}, null, 2));
