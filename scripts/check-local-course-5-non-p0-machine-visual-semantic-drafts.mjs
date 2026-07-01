import fs from "node:fs";

const draftsPath = "docs/LOCAL_COURSE_5_NON_P0_MACHINE_VISUAL_SEMANTIC_DRAFTS.json";
const draftsMdPath = "docs/LOCAL_COURSE_5_NON_P0_MACHINE_VISUAL_SEMANTIC_DRAFTS.md";
const workbenchPath = "docs/LOCAL_COURSE_5_NON_P0_VISUAL_REVIEWER_WORKBENCH.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const drafts = readJson(draftsPath);
const workbench = readJson(workbenchPath);
if (!fs.existsSync(draftsMdPath)) fail(`missing ${draftsMdPath}`);

if (drafts.educationOnly !== true) fail("drafts must keep educationOnly:true");
if (drafts.productionReady !== false) fail("drafts must keep productionReady:false");
if (drafts.learnerFacingRelease !== false) fail("drafts must keep learnerFacingRelease:false");
if (drafts.approvalStatus !== "not_approved") fail("drafts must keep approvalStatus:not_approved");
if (drafts.writeAllowedNow !== false) fail("drafts must keep writeAllowedNow:false");
if (drafts.draftStatus !== "course_5_non_p0_machine_visual_semantic_drafts_ready_release_blocked") fail("unexpected draftStatus");
if (drafts.draftMode !== "heuristic_non_p0_machine_assisted_orientation_not_ocr_not_human_review") fail("unexpected draftMode");

if (drafts.nonP0DraftRows !== workbench.nonP0SampleCards) fail("draft count must match non-P0 workbench cards");
if (drafts.nonP0DraftRows !== 104) fail("expected 104 non-P0 draft rows");
if (drafts.sourceWorkbenchCards !== 104) fail("expected 104 source workbench cards");
if (drafts.moduleRows < 8) fail("module draft coverage unexpectedly low");
if (drafts.readyReviewerNotes !== 0) fail("reviewer notes must not be fabricated");
if (drafts.acceptedForModuleDistillationRows !== 0) fail("machine drafts must not be accepted for module distillation");
if (drafts.acceptedForDeletionReadinessRows !== 0) fail("machine drafts must not count toward deletion readiness");
if (drafts.sourceFolderMayBeDeleted !== false) fail("source folder deletion must remain blocked");
if (drafts.priorityCounts?.P1_price_action_structure !== 75) fail("P1 price action draft count drift");
if (drafts.priorityCounts?.P1_glossary_or_translation !== 1) fail("P1 glossary draft count drift");
if (drafts.priorityCounts?.P2_supplemental !== 28) fail("P2 draft count drift");

if (!Array.isArray(drafts.draftRows) || drafts.draftRows.length !== drafts.nonP0DraftRows) fail("draftRows count mismatch");
if (!Array.isArray(drafts.moduleRows) || drafts.moduleRows.length < 8) fail("moduleRows missing");

const missingImages = drafts.draftRows.filter((row) => !fs.existsSync(row.sampleImagePath));
if (missingImages.length) fail(`missing sample images: ${missingImages.slice(0, 3).map((row) => row.sampleImagePath).join(", ")}`);

const badRows = drafts.draftRows.filter((row) =>
  row.draftStatus !== "machine_assisted_non_p0_visual_semantic_draft_needs_reviewer_validation" ||
  row.acceptedForModuleDistillation !== false ||
  row.acceptedForDeletionReadiness !== false ||
  row.learnerFacingRelease !== false ||
  row.approvalStatus !== "not_approved" ||
  row.productionReady !== false ||
  row.writeAllowedNow !== false ||
  !Array.isArray(row.candidateConcepts) ||
  row.candidateConcepts.length === 0 ||
  !row.candidateSummary?.includes("Machine-assisted non-P0 reviewer orientation") ||
  !row.candidateSummary?.includes("Reviewer must verify visible text/labels") ||
  !Array.isArray(row.reviewerQuestions) ||
  row.reviewerQuestions.length < 4 ||
  !Array.isArray(row.riskFlags) ||
  !row.riskFlags.includes("not_ocr_verified") ||
  !row.riskFlags.includes("not_human_reviewed") ||
  !Array.isArray(row.acceptanceRequiredBeforeUse) ||
  !row.acceptanceRequiredBeforeUse.includes("explicit_release_approval")
);
if (badRows.length) fail(`bad machine draft rows: ${badRows.slice(0, 3).map((row) => row.draftId).join(", ")}`);

const concepts = drafts.draftRows.flatMap((row) => row.candidateConcepts).join(" ");
for (const concept of [
  "reversal_structure_review",
  "trend_or_channel_structure_review",
  "terminology_or_translation_review",
  "pdf_page_visual_review",
  "standalone_chart_image_review",
  "classification_needed_before_module_use",
]) {
  if (!concepts.includes(concept)) fail(`missing candidate concept: ${concept}`);
}

const modeTotal = Object.values(drafts.reviewModeCounts || {}).reduce((sum, count) => sum + count, 0);
if (modeTotal !== drafts.nonP0DraftRows) fail("review mode counts must sum to draft rows");
if (drafts.reviewModeCounts?.structure_module_review !== 75) fail("structure review count drift");
if (drafts.reviewModeCounts?.supplemental_keep_or_archive_review !== 28) fail("supplemental review count drift");

const reversalModule = drafts.moduleRows.find((row) => row.moduleId === "reversals");
if (!reversalModule || reversalModule.nonP0DraftRows < 30) fail("reversal module non-P0 coverage missing");
const trendsModule = drafts.moduleRows.find((row) => row.moduleId === "trends_and_channels");
if (!trendsModule || trendsModule.nonP0DraftRows < 20) fail("trends module non-P0 coverage missing");

const boundaryText = `${drafts.boundary || ""} ${drafts.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education",
  "heuristic orientation",
  "do not read or transcribe source text",
  "do not count as ocr",
  "human review",
  "module acceptance",
  "deletion readiness",
  "learner-facing release",
  "copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary/completion missing phrase: ${phrase}`);
}

if (!Array.isArray(drafts.commands) || !drafts.commands.some((command) => /check:local-course-5-non-p0-machine-visual-semantic-drafts/.test(command))) {
  fail("commands must include machine draft check");
}

console.log(JSON.stringify({
  ok: true,
  draftStatus: drafts.draftStatus,
  nonP0DraftRows: drafts.nonP0DraftRows,
  moduleRows: drafts.moduleRows.length,
  readyReviewerNotes: drafts.readyReviewerNotes,
  acceptedForModuleDistillationRows: drafts.acceptedForModuleDistillationRows,
  acceptedForDeletionReadinessRows: drafts.acceptedForDeletionReadinessRows,
  sourceFolderMayBeDeleted: drafts.sourceFolderMayBeDeleted,
}, null, 2));
