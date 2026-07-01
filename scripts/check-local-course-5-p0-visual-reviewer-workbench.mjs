import fs from "node:fs";

const workbenchPath = "docs/LOCAL_COURSE_5_P0_VISUAL_REVIEWER_WORKBENCH.json";
const workbenchMdPath = "docs/LOCAL_COURSE_5_P0_VISUAL_REVIEWER_WORKBENCH.md";
const evidencePath = "docs/LOCAL_COURSE_5_P0_VISUAL_EVIDENCE_PACK.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const workbench = readJson(workbenchPath);
const evidence = readJson(evidencePath);
if (!fs.existsSync(workbenchMdPath)) fail(`missing ${workbenchMdPath}`);

if (workbench.educationOnly !== true) fail("workbench must keep educationOnly:true");
if (workbench.productionReady !== false) fail("workbench must keep productionReady:false");
if (workbench.learnerFacingRelease !== false) fail("workbench must keep learnerFacingRelease:false");
if (workbench.approvalStatus !== "not_approved") fail("workbench must keep approvalStatus:not_approved");
if (workbench.writeAllowedNow !== false) fail("workbench must keep writeAllowedNow:false");
if (workbench.workbenchStatus !== "course_5_p0_visual_reviewer_workbench_ready_release_blocked") fail("unexpected workbenchStatus");

if (workbench.p0SourceRows !== evidence.p0SourceRows) fail("P0 source row count mismatch with evidence pack");
if (workbench.p0SampleCards !== evidence.sampleRows) fail("P0 sample card count mismatch with evidence pack");
if (workbench.p0SourceRows !== 28) fail("expected 28 P0 source rows");
if (workbench.p0SampleCards !== 282) fail("expected 282 P0 sample cards");
if (workbench.p0PdfSources !== 26) fail("expected 26 P0 PDF sources");
if (workbench.p0ZipSources !== 2) fail("expected 2 P0 ZIP sources");
if (workbench.modulesWithP0VisualWork < 3) fail("expected P0 work across at least three modules");
if (workbench.readyReviewerNotes !== 0) fail("real reviewer notes must not be fabricated");
if (workbench.blockedReviewerNotes !== workbench.p0SampleCards) fail("all sample cards should remain blocked on reviewer input");
if (workbench.deletionStillBlocked !== true || workbench.sourceFolderMayBeDeleted !== false) fail("deletion gate must remain blocked");
if (workbench.reviewFieldCount < 160) fail("review field coverage unexpectedly low");

if (!Array.isArray(workbench.moduleRows) || !workbench.moduleRows.some((row) => row.moduleId === "chart_pattern_encyclopedia" && row.p0SourceRows === 25)) {
  fail("chart pattern encyclopedia P0 module coverage missing");
}
if (!workbench.moduleRows.some((row) => row.moduleId === "course_slides_alignment" && row.p0SourceRows === 3)) {
  fail("course slide alignment P0 module coverage missing");
}
if (!workbench.moduleRows.some((row) => row.moduleId === "terminology_glossary" && row.p0SourceRows >= 2)) {
  fail("terminology glossary P0 module coverage missing");
}

if (!Array.isArray(workbench.sourceRows) || workbench.sourceRows.length !== workbench.p0SourceRows) fail("sourceRows count mismatch");
if (!Array.isArray(workbench.sampleCards) || workbench.sampleCards.length !== workbench.p0SampleCards) fail("sampleCards count mismatch");

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
  typeof card.visualMetrics?.edgeDensity !== "number" ||
  typeof card.visualMetrics?.visualDensity !== "number" ||
  card.learnerFacingRelease !== false ||
  card.approvalStatus !== "not_approved" ||
  card.productionReady !== false ||
  card.writeAllowedNow !== false
);
if (badCards.length) fail(`bad sample cards: ${badCards.slice(0, 3).map((card) => card.cardId).join(", ")}`);

const semanticText = workbench.sampleCards.flatMap((card) => card.semanticHypotheses).join(" ");
for (const phrase of [
  "chart_pattern_taxonomy_candidate",
  "pdf_page_visual_semantics",
  "standalone_chart_image_semantics",
  "machine_translation_quality_check_required",
  "large_encyclopedia_source_stratified_sample",
]) {
  if (!semanticText.includes(phrase)) fail(`semantic hypotheses missing: ${phrase}`);
}

const rulesText = `${(workbench.reviewerRules || []).join(" ")} ${workbench.boundary || ""} ${workbench.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "private reviewer-facing education",
  "paraphrased teaching",
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
  "source folder",
]) {
  if (!rulesText.includes(phrase)) fail(`rules/boundary missing phrase: ${phrase}`);
}

if (!Array.isArray(workbench.commands) || !workbench.commands.some((command) => /check:local-course-5-p0-visual-reviewer-workbench/.test(command))) {
  fail("commands must include workbench check");
}

console.log(JSON.stringify({
  ok: true,
  workbenchStatus: workbench.workbenchStatus,
  p0SourceRows: workbench.p0SourceRows,
  p0SampleCards: workbench.p0SampleCards,
  modulesWithP0VisualWork: workbench.modulesWithP0VisualWork,
  readyReviewerNotes: workbench.readyReviewerNotes,
  blockedReviewerNotes: workbench.blockedReviewerNotes,
  sourceFolderMayBeDeleted: workbench.sourceFolderMayBeDeleted,
}, null, 2));
