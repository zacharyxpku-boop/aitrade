import fs from "node:fs";

const packPath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_02.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const pack = readJson(packPath);
const cards = pack.packCards || [];

if (pack.educationOnly !== true) fail("fill pack must keep educationOnly:true");
if (pack.productionReady !== false) fail("fill pack must keep productionReady:false");
if (pack.learnerFacingRelease !== false) fail("fill pack must keep learnerFacingRelease:false");
if (pack.approvalStatus !== "not_approved") fail("fill pack must remain not_approved");
if (pack.packId !== "local_course_p0_human_fill_pack_02") fail(`unexpected packId: ${pack.packId}`);
if (pack.packStatus !== "blank_human_fill_pack_ready") fail(`unexpected packStatus: ${pack.packStatus}`);
if (pack.totalPackCards !== 4 || cards.length !== 4) fail(`expected 4 pack cards, got ${pack.totalPackCards}/${cards.length}`);
if (pack.manualFillCards !== 4) fail(`expected 4 manual fill cards, got ${pack.manualFillCards}`);
if (pack.filledCards !== 0 || pack.readyForValidationCards !== 0 || pack.acceptedForOverlayCards !== 0) {
  fail("blank fill pack must not fill, validate, or accept cards");
}
if (!Array.isArray(pack.targetTaskIds) || pack.targetTaskIds.length !== 4) fail("targetTaskIds must include 4 tasks");
if (!Array.isArray(pack.targetDocumentIds) || pack.targetDocumentIds.length !== 1 || pack.targetDocumentIds[0] !== "corpus_1580") {
  fail(`unexpected targetDocumentIds: ${(pack.targetDocumentIds || []).join(",")}`);
}
for (const expected of [5, 6, 7, 8]) {
  if (!pack.targetPageNumbers?.includes(expected)) fail(`missing target page ${expected}`);
}

for (const card of cards) {
  if (card.educationOnly !== true || card.productionReady !== false) fail(`${card.id} boundary drift`);
  if (card.learnerFacingRelease !== false || card.approvalStatus !== "not_approved") fail(`${card.id} release gate drift`);
  if (card.category !== "manual_transcription") fail(`${card.id} should be manual_transcription`);
  if (card.documentId !== "corpus_1580") fail(`${card.id} document drift`);
  if (card.fillStatus !== "blank_ready_for_human_fill") fail(`${card.id} must be blank-ready`);
  if (card.reviewerName !== "" || card.reviewedAt !== "") fail(`${card.id} reviewer fields must be blank`);
  if (!card.candidateId || card.matchStatus !== "candidate_available_for_human_review") fail(`${card.id} missing candidate match`);
  if (!card.highResPreviewUrl?.startsWith("/docs/local-course-low-extraction-high-res-previews/")) fail(`${card.id} high-res URL drift`);
  if (!Array.isArray(card.requiredFields) || !card.requiredFields.includes("riskRewriteNotes")) fail(`${card.id} required fields missing riskRewriteNotes`);
  if (card.fieldValues?.humanTranscription !== "" || card.fieldValues?.humanSummary !== "" || card.fieldValues?.riskRewriteNotes !== "") {
    fail(`${card.id} field values must remain blank`);
  }
  if (!Array.isArray(card.riskTermFlags) || card.riskTermFlags.length < 5) fail(`${card.id} risk flags too thin`);
  if (!Array.isArray(card.riskRewriteChecklist) || card.riskRewriteChecklist.length !== card.riskTermFlags.length) {
    fail(`${card.id} risk rewrite checklist must cover every risk flag`);
  }
  if (!Array.isArray(card.qualityLintRules) || card.qualityLintRules.length < 5) fail(`${card.id} quality lint rules too thin`);
  if (!card.qualityLintRules.some((rule) => /not copied from the machine candidate/i.test(rule))) {
    fail(`${card.id} must prohibit candidate copying`);
  }
  if (!card.qualityLintRules.some((rule) => /signal, forecast, support\/resistance, homework, and source-recommendation/i.test(rule))) {
    fail(`${card.id} must call out pack 02 high-risk language`);
  }
  if (card.nextGate !== "human_fill_pack_then_validate_p0_review_input_copy") fail(`${card.id} next gate drift`);
}

const riskCounts = pack.riskTermFlagCounts || {};
for (const flag of ["signal_language", "forecast_language", "support_resistance_language", "study_advice_language", "source_recommendation_language"]) {
  if (!riskCounts[flag]) fail(`risk term counts should include ${flag}`);
}

const boundaryText = `${pack.boundary || ""} ${pack.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "blank reviewer work material",
  "does not perform ocr",
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
  if (!boundaryText.includes(phrase)) fail(`fill pack boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: pack.educationOnly,
  productionReady: pack.productionReady,
  learnerFacingRelease: pack.learnerFacingRelease,
  approvalStatus: pack.approvalStatus,
  packId: pack.packId,
  packStatus: pack.packStatus,
  totalPackCards: pack.totalPackCards,
  filledCards: pack.filledCards,
  readyForValidationCards: pack.readyForValidationCards,
  acceptedForOverlayCards: pack.acceptedForOverlayCards,
}, null, 2));
