import fs from "node:fs";

const assistMapPath = "docs/LOCAL_COURSE_P0_CANDIDATE_REVIEW_ASSIST_MAP.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const assistMap = readJson(assistMapPath);
const rows = assistMap.taskRows || [];

if (assistMap.educationOnly !== true) fail("assist map must keep educationOnly:true");
if (assistMap.productionReady !== false) fail("assist map must keep productionReady:false");
if (assistMap.learnerFacingRelease !== false) fail("assist map must keep learnerFacingRelease:false");
if (assistMap.approvalStatus !== "not_approved") fail("assist map must remain not_approved");
if (assistMap.assistMapStatus !== "review_assist_map_ready_not_applied") fail(`unexpected assistMapStatus: ${assistMap.assistMapStatus}`);
if (assistMap.totalP0Tasks !== 22 || rows.length !== 22) fail(`expected 22 task rows, got ${assistMap.totalP0Tasks}/${rows.length}`);
if (assistMap.manualTranscriptionTasks !== 19) fail(`expected 19 manual tasks, got ${assistMap.manualTranscriptionTasks}`);
if (assistMap.sourceReplacementTasks !== 3) fail(`expected 3 replacement tasks, got ${assistMap.sourceReplacementTasks}`);
if (assistMap.manualTasksWithCandidate !== 19) fail(`expected 19 manual candidate matches, got ${assistMap.manualTasksWithCandidate}`);
if (assistMap.manualTasksMissingCandidate !== 0) fail(`expected 0 missing manual candidates, got ${assistMap.manualTasksMissingCandidate}`);
if (assistMap.sourceReplacementTasksWithoutCandidate !== 3) fail(`expected 3 replacement tasks without candidates, got ${assistMap.sourceReplacementTasksWithoutCandidate}`);
if (assistMap.acceptedForP0OverlayTasks !== 0) fail("assist map must not accept tasks into P0 overlay");
if (assistMap.blockedUntilHumanReviewedTasks !== 22) fail(`expected 22 blocked tasks, got ${assistMap.blockedUntilHumanReviewedTasks}`);
if (assistMap.candidatePagesIndexed !== 19) fail(`expected 19 indexed candidate pages, got ${assistMap.candidatePagesIndexed}`);

const seenManualKeys = new Set();
for (const row of rows) {
  if (row.acceptedForP0Overlay !== false) fail(`${row.id} must not be accepted for overlay`);
  if (row.category === "manual_transcription") {
    if (row.matchStatus !== "candidate_available_for_human_review") fail(`${row.id} should have a human-review candidate`);
    if (!row.candidateId || !row.highResPreviewPath || !fs.existsSync(row.highResPreviewPath)) fail(`${row.id} candidate preview missing`);
    if (!row.highResPreviewUrl?.startsWith("/docs/local-course-low-extraction-high-res-previews/")) fail(`${row.id} high-res URL drift`);
    if (!row.candidateSummary || row.candidateSummary.length < 80) fail(`${row.id} candidate summary too thin`);
    if (!Array.isArray(row.riskTermFlags) || row.riskTermFlags.length < 2) fail(`${row.id} needs risk flags`);
    if (!Array.isArray(row.uncertainRegions) || row.uncertainRegions.length < 1) fail(`${row.id} needs uncertain regions`);
    if (!Array.isArray(row.requiredReviewerActions) || row.requiredReviewerActions.length < 4) fail(`${row.id} needs reviewer actions`);
    if (row.nextGate !== "human_verify_candidate_then_fill_p0_review_input") fail(`${row.id} manual next gate drift`);
    seenManualKeys.add(`${row.documentId}:${row.pageNumber}`);
  } else if (row.category === "source_replacement") {
    if (row.matchStatus !== "source_replacement_decision_required") fail(`${row.id} replacement status drift`);
    if (row.candidateId || row.highResPreviewPath || row.highResPreviewUrl) fail(`${row.id} replacement task should not have candidate preview`);
    if (row.nextGate !== "source_replacement_decision_then_reexport_or_unrecoverable_review") fail(`${row.id} replacement next gate drift`);
  } else {
    fail(`${row.id} unexpected category ${row.category}`);
  }
}

for (const docPage of [
  ...Array.from({ length: 8 }, (_, index) => `corpus_1313:${index + 1}`),
  ...Array.from({ length: 11 }, (_, index) => `corpus_1580:${index + 1}`),
]) {
  if (!seenManualKeys.has(docPage)) fail(`missing mapped manual candidate ${docPage}`);
}

const riskCounts = assistMap.riskTermFlagCounts || {};
for (const flag of ["signal_language", "specific_price_levels", "support_resistance_language", "market_meaning_language"]) {
  if (!riskCounts[flag]) fail(`risk term counts should include ${flag}`);
}

const boundaryText = `${assistMap.boundary || ""} ${assistMap.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-only working material",
  "reviewer-assist lookup",
  "does not perform accepted ocr",
  "fill reviewer fields",
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
  if (!boundaryText.includes(phrase)) fail(`assist map boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: assistMap.educationOnly,
  productionReady: assistMap.productionReady,
  learnerFacingRelease: assistMap.learnerFacingRelease,
  approvalStatus: assistMap.approvalStatus,
  assistMapStatus: assistMap.assistMapStatus,
  totalP0Tasks: assistMap.totalP0Tasks,
  manualTasksWithCandidate: assistMap.manualTasksWithCandidate,
  manualTasksMissingCandidate: assistMap.manualTasksMissingCandidate,
  sourceReplacementTasks: assistMap.sourceReplacementTasks,
  acceptedForP0OverlayTasks: assistMap.acceptedForP0OverlayTasks,
  blockedUntilHumanReviewedTasks: assistMap.blockedUntilHumanReviewedTasks,
}, null, 2));
