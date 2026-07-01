import fs from "node:fs";

const draftsPath = "docs/LOCAL_COURSE_5_ZIP_MACHINE_VISUAL_SEMANTIC_DRAFTS.json";
const draftsMdPath = "docs/LOCAL_COURSE_5_ZIP_MACHINE_VISUAL_SEMANTIC_DRAFTS.md";
const executionPackPath = "docs/LOCAL_COURSE_5_ZIP_IMAGE_PACKAGE_EXECUTION_PACK.json";

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
if (drafts.draftStatus !== "course_5_zip_machine_visual_semantic_drafts_ready_blocked_on_real_visual_review") fail(`unexpected draftStatus: ${drafts.draftStatus}`);
if (drafts.draftMode !== "heuristic_zip_image_orientation_not_ocr_not_human_review") fail(`unexpected draftMode: ${drafts.draftMode}`);

if (drafts.sourceZipRows !== 8 || drafts.sourceZipRows !== executionPack.zipRows) fail("source ZIP count drift");
if (drafts.sourceZipImageEntries !== 10569 || drafts.sourceZipImageEntries !== executionPack.totalImageEntries) fail("source ZIP image entry count drift");
if (drafts.sourceSampleRows !== 85 || drafts.zipDraftRows !== 85 || drafts.zipDraftRows !== executionPack.sampleRowCount) fail("ZIP sample/draft row count drift");
if (drafts.moduleRowCount < 6) fail("module row count unexpectedly low");
if (drafts.readyReviewerNotes !== 0) fail("reviewer notes must not be fabricated");
if (drafts.acceptedForZipSemanticReviewRows !== 0 || drafts.acceptedForModuleDistillationRows !== 0 || drafts.acceptedForDeletionReadinessRows !== 0) fail("machine ZIP drafts must not be accepted");
if (drafts.sourceFolderMayBeDeleted !== false) fail("source folder deletion must remain blocked");
if (!Array.isArray(drafts.draftRows) || drafts.draftRows.length !== 85) fail("draftRows must cover 85 samples");
if (!Array.isArray(drafts.moduleRows) || drafts.moduleRows.length < 6) fail("module coverage unexpectedly low");

const ids = new Set();
for (const row of drafts.draftRows) {
  if (!row.draftId || ids.has(row.draftId)) fail(`duplicate or missing draftId: ${row.draftId}`);
  ids.add(row.draftId);
  if (!fs.existsSync(row.sampleImagePath)) fail(`missing sample image: ${row.sampleImagePath}`);
  if (row.draftStatus !== "zip_machine_visual_semantic_draft_needs_real_reviewer_validation") fail(`bad row status: ${row.draftId}`);
  if (row.acceptedForZipSemanticReview !== false || row.acceptedForModuleDistillation !== false || row.acceptedForDeletionReadiness !== false) fail(`machine row pre-accepted: ${row.draftId}`);
  if (row.learnerFacingRelease !== false || row.approvalStatus !== "not_approved" || row.productionReady !== false || row.writeAllowedNow !== false) fail(`boundary drift: ${row.draftId}`);
  if (!Array.isArray(row.candidateConcepts) || row.candidateConcepts.length === 0) fail(`missing candidate concepts: ${row.draftId}`);
  if (!row.candidateSummary?.includes("Machine-assisted ZIP image orientation")) fail(`bad candidate summary: ${row.draftId}`);
  if (!row.candidateSummary?.includes("Reviewer must inspect")) fail(`summary missing human verification: ${row.draftId}`);
  if (!Array.isArray(row.reviewerQuestions) || row.reviewerQuestions.length < 4) fail(`missing reviewer questions: ${row.draftId}`);
  if (!Array.isArray(row.riskFlags) || !row.riskFlags.includes("not_ocr_verified") || !row.riskFlags.includes("not_human_reviewed")) fail(`missing risk flags: ${row.draftId}`);
  if (!Array.isArray(row.acceptanceRequiredBeforeUse) || !row.acceptanceRequiredBeforeUse.includes("explicit_release_or_deletion_readiness_approval")) fail(`missing acceptance gates: ${row.draftId}`);
}

const concepts = drafts.draftRows.flatMap((row) => row.candidateConcepts).join(" ");
for (const concept of [
  "chart_pattern_taxonomy",
  "trend_or_channel_chart_reading",
  "trading_range_chart_reading",
  "reversal_chart_reading",
  "breakout_or_pullback_chart_reading",
  "bar_by_bar_chart_reading",
  "zip_image_package_semantic_sampling",
]) {
  if (!concepts.includes(concept)) fail(`missing candidate concept: ${concept}`);
}

const densityTotal = Object.values(drafts.densityCounts || {}).reduce((sum, count) => sum + count, 0);
if (densityTotal !== drafts.zipDraftRows) fail("density counts must sum to draft rows");
const priorityTotal = Object.values(drafts.priorityCounts || {}).reduce((sum, count) => sum + count, 0);
if (priorityTotal !== drafts.zipDraftRows) fail("priority counts must sum to draft rows");

const chartModule = drafts.moduleRows.find((row) => row.moduleId === "chart_pattern_encyclopedia");
if (!chartModule || chartModule.draftRows < 20) fail("chart pattern encyclopedia ZIP draft coverage missing");
const barModule = drafts.moduleRows.find((row) => row.moduleId === "bar_by_bar_reading");
if (!barModule || barModule.draftRows < 10) fail("bar-by-bar ZIP draft coverage missing");

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
  zipDraftRows: drafts.zipDraftRows,
  sourceZipRows: drafts.sourceZipRows,
  sourceZipImageEntries: drafts.sourceZipImageEntries,
  moduleRowCount: drafts.moduleRowCount,
  readyReviewerNotes: drafts.readyReviewerNotes,
  acceptedForZipSemanticReviewRows: drafts.acceptedForZipSemanticReviewRows,
  acceptedForDeletionReadinessRows: drafts.acceptedForDeletionReadinessRows,
  sourceFolderMayBeDeleted: drafts.sourceFolderMayBeDeleted,
}, null, 2));
