import fs from "node:fs";

const batchPath = "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_BATCH_04.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const batch = readJson(batchPath);
const pages = batch.candidatePagesList || [];

if (batch.educationOnly !== true) fail("candidate batch must keep educationOnly:true");
if (batch.productionReady !== false) fail("candidate batch must keep productionReady:false");
if (batch.learnerFacingRelease !== false) fail("candidate batch must keep learnerFacingRelease:false");
if (batch.approvalStatus !== "not_approved") fail("candidate batch must remain not_approved");
if (batch.batchStatus !== "machine_assisted_transcription_candidates_ready_for_human_review") {
  fail(`unexpected batchStatus: ${batch.batchStatus}`);
}
if (batch.documentId !== "corpus_1580") fail(`unexpected documentId: ${batch.documentId}`);
if (batch.candidatePages !== 4 || pages.length !== 4) fail(`expected 4 candidate pages, got ${batch.candidatePages}/${pages.length}`);
if (batch.acceptedForP0OverlayPages !== 0) fail("machine-assisted candidates must not be accepted for P0 overlay");
if (batch.blockedUntilHumanReviewedPages !== 4) fail(`expected 4 human-review-blocked pages, got ${batch.blockedUntilHumanReviewedPages}`);

const pageNumbers = new Set();
for (const page of pages) {
  if (page.educationOnly !== true || page.productionReady !== false) fail(`${page.id} boundary drift`);
  if (page.learnerFacingRelease !== false || page.approvalStatus !== "not_approved") fail(`${page.id} release gate drift`);
  if (page.documentId !== "corpus_1580") fail(`${page.id} document drift`);
  if (page.candidateStatus !== "machine_assisted_visual_candidate_needs_human_review") fail(`${page.id} status drift`);
  if (page.acceptedForP0Overlay !== false) fail(`${page.id} must not be accepted for overlay`);
  if (!page.highResPreviewPath || !fs.existsSync(page.highResPreviewPath)) fail(`${page.id} high-res preview missing`);
  if (page.visualEvidenceStatus !== "high_res_preview_ready_for_manual_transcription") fail(`${page.id} visual status drift`);
  if (!Array.isArray(page.visibleTextExtract) || page.visibleTextExtract.length < 3) fail(`${page.id} needs visible text extract lines`);
  if (!page.educationOnlySummary || page.educationOnlySummary.length < 80) fail(`${page.id} needs education-only summary`);
  if (!Array.isArray(page.uncertainRegions) || page.uncertainRegions.length < 1) fail(`${page.id} needs uncertain region notes`);
  if (!Array.isArray(page.riskTermFlags) || page.riskTermFlags.length < 3) fail(`${page.id} needs risk-term flags`);
  if (!Array.isArray(page.rewriteAngles) || page.rewriteAngles.length < 2) fail(`${page.id} needs rewrite angles`);
  if (!Array.isArray(page.requiredReviewerActions) || page.requiredReviewerActions.length < 4) fail(`${page.id} needs reviewer actions`);
  if (!page.requiredReviewerActions.some((action) => /public references/i.test(action))) fail(`${page.id} must require public-reference cross-check`);
  if (page.nextGate !== "human_review_before_p0_overlay_apply") fail(`${page.id} next gate drift`);
  if (pageNumbers.has(page.pageNumber)) fail(`duplicate page number: ${page.pageNumber}`);
  pageNumbers.add(page.pageNumber);
}

for (const expected of [5, 6, 7, 8]) {
  if (!pageNumbers.has(expected)) fail(`missing candidate page ${expected}`);
}

const riskCounts = batch.riskTermFlagCounts || {};
for (const flag of [
  "shadow_body_language",
  "kline_classification_language",
  "signal_language",
  "source_recommendation_language",
  "force_comparison_language",
]) {
  if (!riskCounts[flag]) fail(`risk term counts should include ${flag}`);
}

const boundaryText = `${batch.boundary || ""} ${batch.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-only working notes",
  "not human transcriptions",
  "do not perform accepted ocr",
  "public-source grounding",
  "approve learner-facing release",
  "copy private course wording",
  "trading advice",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
]) {
  if (!boundaryText.includes(phrase)) fail(`candidate batch boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: batch.educationOnly,
  productionReady: batch.productionReady,
  learnerFacingRelease: batch.learnerFacingRelease,
  approvalStatus: batch.approvalStatus,
  batchStatus: batch.batchStatus,
  documentId: batch.documentId,
  candidatePages: batch.candidatePages,
  acceptedForP0OverlayPages: batch.acceptedForP0OverlayPages,
  blockedUntilHumanReviewedPages: batch.blockedUntilHumanReviewedPages,
}, null, 2));
