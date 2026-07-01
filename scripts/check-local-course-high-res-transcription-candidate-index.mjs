import fs from "node:fs";

const indexPath = "docs/LOCAL_COURSE_HIGH_RES_TRANSCRIPTION_CANDIDATE_INDEX.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const index = readJson(indexPath);
const rows = index.pageRows || [];

if (index.educationOnly !== true) fail("candidate index must keep educationOnly:true");
if (index.productionReady !== false) fail("candidate index must keep productionReady:false");
if (index.learnerFacingRelease !== false) fail("candidate index must keep learnerFacingRelease:false");
if (index.approvalStatus !== "not_approved") fail("candidate index must remain not_approved");
if (index.indexStatus !== "machine_assisted_candidate_index_ready_for_human_review") fail(`unexpected indexStatus: ${index.indexStatus}`);
if (index.batchCount !== 5) fail(`expected 5 batches, got ${index.batchCount}`);
if (index.candidatePages !== 19 || rows.length !== 19) fail(`expected 19 page rows, got ${index.candidatePages}/${rows.length}`);
if (index.acceptedForP0OverlayPages !== 0) fail("candidate index must not accept pages for P0 overlay");
if (index.blockedUntilHumanReviewedPages !== 19) fail(`expected 19 blocked pages, got ${index.blockedUntilHumanReviewedPages}`);
if (!Array.isArray(index.documentIds) || index.documentIds.length !== 2 || !index.documentIds.includes("corpus_1313") || !index.documentIds.includes("corpus_1580")) {
  fail(`unexpected documentIds: ${(index.documentIds || []).join(",")}`);
}

const pageNumbersByDocument = rows.reduce((map, row) => {
  if (!map.has(row.documentId)) map.set(row.documentId, new Set());
  map.get(row.documentId).add(row.pageNumber);
  return map;
}, new Map());
for (const expected of [1, 2, 3, 4, 5, 6, 7, 8]) {
  if (!pageNumbersByDocument.get("corpus_1313")?.has(expected)) fail(`missing corpus_1313 page row ${expected}`);
}
for (const expected of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
  if (!pageNumbersByDocument.get("corpus_1580")?.has(expected)) fail(`missing corpus_1580 page row ${expected}`);
}

for (const row of rows) {
  if (row.candidateStatus !== "machine_assisted_visual_candidate_needs_human_review") fail(`${row.id} status drift`);
  if (row.acceptedForP0Overlay !== false) fail(`${row.id} must remain not accepted`);
  if (!row.highResPreviewPath || !fs.existsSync(row.highResPreviewPath)) fail(`${row.id} high-res preview missing`);
  if (!row.educationOnlySummary || row.educationOnlySummary.length < 80) fail(`${row.id} summary too thin`);
  if (!Array.isArray(row.uncertainRegions) || row.uncertainRegions.length < 1) fail(`${row.id} missing uncertain regions`);
  if (!Array.isArray(row.riskTermFlags) || row.riskTermFlags.length < 2) fail(`${row.id} missing risk flags`);
  if (!Array.isArray(row.rewriteAngles) || row.rewriteAngles.length < 2) fail(`${row.id} missing rewrite angles`);
  if (row.nextGate !== "human_review_before_p0_overlay_apply") fail(`${row.id} next gate drift`);
}

const riskCounts = index.riskTermFlagCounts || {};
for (const flag of ["entry_language", "specific_price_levels", "signal_language", "risk_reward_language", "stop_loss_language", "historical_origin_language", "ohlc_definition_language", "kline_classification_language", "force_comparison_language", "source_recommendation_language", "specific_asset_examples", "market_meaning_language"]) {
  if (!riskCounts[flag]) fail(`risk term counts should include ${flag}`);
}
if (!Array.isArray(index.topRiskTermFlags) || index.topRiskTermFlags.length < 8) fail("top risk flags too thin");

const boundaryText = `${index.boundary || ""} ${index.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-only working material",
  "machine-assisted reviewer work queue",
  "does not perform accepted ocr",
  "accepted transcription",
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
  if (!boundaryText.includes(phrase)) fail(`candidate index boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: index.educationOnly,
  productionReady: index.productionReady,
  learnerFacingRelease: index.learnerFacingRelease,
  approvalStatus: index.approvalStatus,
  indexStatus: index.indexStatus,
  batchCount: index.batchCount,
  candidatePages: index.candidatePages,
  acceptedForP0OverlayPages: index.acceptedForP0OverlayPages,
  blockedUntilHumanReviewedPages: index.blockedUntilHumanReviewedPages,
}, null, 2));
