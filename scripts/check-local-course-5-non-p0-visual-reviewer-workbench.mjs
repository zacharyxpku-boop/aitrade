import fs from "node:fs";

const workbenchPath = "docs/LOCAL_COURSE_5_NON_P0_VISUAL_REVIEWER_WORKBENCH.json";
const workbenchMdPath = "docs/LOCAL_COURSE_5_NON_P0_VISUAL_REVIEWER_WORKBENCH.md";
const workPacksPath = "docs/LOCAL_COURSE_5_FOLLOWUP_WORK_PACKS.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const workbench = readJson(workbenchPath);
const workPacks = readJson(workPacksPath);
if (!fs.existsSync(workbenchMdPath)) fail(`missing ${workbenchMdPath}`);

if (workbench.educationOnly !== true) fail("workbench must keep educationOnly:true");
if (workbench.productionReady !== false) fail("workbench must keep productionReady:false");
if (workbench.learnerFacingRelease !== false) fail("workbench must keep learnerFacingRelease:false");
if (workbench.approvalStatus !== "not_approved") fail("workbench must keep approvalStatus:not_approved");
if (workbench.writeAllowedNow !== false) fail("workbench must keep writeAllowedNow:false");
if (workbench.workbenchStatus !== "course_5_non_p0_visual_reviewer_workbench_ready_release_blocked") fail("unexpected workbenchStatus");

const expectedNonP0 = workPacks.workItems.filter((item) => !String(item.priority || "").startsWith("P0"));
const expectedSamples = expectedNonP0.reduce((sum, item) => sum + (item.sampleImages || []).length, 0);
if (workbench.nonP0SourceRows !== expectedNonP0.length) fail("non-P0 source count mismatch");
if (workbench.nonP0SourceRows !== 21) fail("expected 21 non-P0 source rows");
if (workbench.nonP0SampleCards !== expectedSamples) fail("non-P0 sample card count mismatch");
if (workbench.nonP0SampleCards !== 104) fail("expected 104 non-P0 sample cards");
if (workbench.priorityCounts?.P1_price_action_structure !== 13) fail("P1 price action count drift");
if (workbench.priorityCounts?.P1_glossary_or_translation !== 1) fail("P1 glossary count drift");
if (workbench.priorityCounts?.P2_supplemental !== 7) fail("P2 count drift");
if (workbench.modulesWithNonP0VisualWork < 8) fail("module coverage unexpectedly low");
if (workbench.readyReviewerNotes !== 0) fail("reviewer notes must not be fabricated");
if (workbench.blockedReviewerNotes !== workbench.nonP0SampleCards) fail("all cards should remain blocked on reviewer input");
if (workbench.deletionStillBlocked !== true || workbench.sourceFolderMayBeDeleted !== false) fail("deletion gate must remain blocked");

if (!Array.isArray(workbench.sourceRows) || workbench.sourceRows.length !== workbench.nonP0SourceRows) fail("sourceRows count mismatch");
if (!Array.isArray(workbench.sampleCards) || workbench.sampleCards.length !== workbench.nonP0SampleCards) fail("sampleCards count mismatch");

const expectedIds = new Set(expectedNonP0.map((item) => item.recordId));
for (const source of workbench.sourceRows) {
  if (!expectedIds.has(source.recordId)) fail(`unexpected source row: ${source.recordId}`);
}

const badSources = workbench.sourceRows.filter((row) =>
  row.sourceReviewStatus !== "needs_reviewer_semantic_distillation" ||
  row.deletionBlockerStatus !== "source_folder_not_deletable_until_review_resolved" ||
  !Array.isArray(row.semanticHypotheses) ||
  row.semanticHypotheses.length === 0 ||
  !Array.isArray(row.requiredReviewerFields) ||
  row.requiredReviewerFields.length < 6 ||
  row.learnerFacingRelease !== false ||
  row.approvalStatus !== "not_approved" ||
  row.productionReady !== false ||
  row.writeAllowedNow !== false
);
if (badSources.length) fail(`bad source rows: ${badSources.slice(0, 3).map((row) => row.recordId).join(", ")}`);

const missingImages = workbench.sampleCards.filter((card) => !fs.existsSync(card.sampleImagePath));
if (missingImages.length) fail(`missing sample images: ${missingImages.slice(0, 3).map((card) => card.sampleImagePath).join(", ")}`);

const badCards = workbench.sampleCards.filter((card) =>
  card.reviewStatus !== "needs_reviewer_visual_semantic_note" ||
  !Array.isArray(card.semanticHypotheses) ||
  card.semanticHypotheses.length === 0 ||
  !Array.isArray(card.requiredFields) ||
  card.requiredFields.length < 5 ||
  !card.reviewerPrompt?.includes("do not copy source prose") ||
  card.learnerFacingRelease !== false ||
  card.approvalStatus !== "not_approved" ||
  card.productionReady !== false ||
  card.writeAllowedNow !== false
);
if (badCards.length) fail(`bad sample cards: ${badCards.slice(0, 3).map((card) => card.cardId).join(", ")}`);

const semanticText = workbench.sampleCards.flatMap((card) => card.semanticHypotheses).join(" ");
for (const phrase of [
  "reversal_structure_review",
  "trend_or_channel_structure_review",
  "terminology_or_translation_review",
  "pdf_page_visual_semantics",
  "standalone_chart_image_semantics",
  "supplemental_source_candidate",
]) {
  if (!semanticText.includes(phrase)) fail(`semantic hypotheses missing: ${phrase}`);
}

const boundaryText = `${(workbench.reviewerRules || []).join(" ")} ${workbench.boundary || ""} ${workbench.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education",
  "p1/p2 visual evidence",
  "does not ocr source text",
  "fill reviewer conclusions",
  "delete files",
  "copy private source wording",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "production readiness",
  "deletion readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary/completion missing phrase: ${phrase}`);
}

if (!Array.isArray(workbench.commands) || !workbench.commands.some((command) => /check:local-course-5-non-p0-visual-reviewer-workbench/.test(command))) {
  fail("commands must include workbench check");
}

console.log(JSON.stringify({
  ok: true,
  workbenchStatus: workbench.workbenchStatus,
  nonP0SourceRows: workbench.nonP0SourceRows,
  nonP0SampleCards: workbench.nonP0SampleCards,
  modulesWithNonP0VisualWork: workbench.modulesWithNonP0VisualWork,
  readyReviewerNotes: workbench.readyReviewerNotes,
  blockedReviewerNotes: workbench.blockedReviewerNotes,
  sourceFolderMayBeDeleted: workbench.sourceFolderMayBeDeleted,
}, null, 2));
