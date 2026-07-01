import fs from "node:fs";

const templatePath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_NOTE_TEMPLATE.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const template = readJson(templatePath);
const cards = template.noteCards || [];

if (template.educationOnly !== true) fail("template must keep educationOnly:true");
if (template.productionReady !== false) fail("template must keep productionReady:false");
if (template.learnerFacingRelease !== false) fail("template must keep learnerFacingRelease:false");
if (template.approvalStatus !== "not_approved") fail("template must remain not_approved");
if (template.templateStatus !== "blank_human_review_note_template_ready") fail(`unexpected templateStatus: ${template.templateStatus}`);
if (template.totalP0Tasks !== 22 || cards.length !== 22) fail(`expected 22 note cards, got ${template.totalP0Tasks}/${cards.length}`);
if (template.manualReviewCards !== 19) fail(`expected 19 manual cards, got ${template.manualReviewCards}`);
if (template.sourceReplacementReviewCards !== 3) fail(`expected 3 replacement cards, got ${template.sourceReplacementReviewCards}`);
if (template.filledNoteCards !== 0 || template.readyForValidationCards !== 0 || template.acceptedForOverlayCards !== 0) {
  fail("blank template must not fill, validate, or accept cards");
}
if (template.manualCardsWithCandidate !== 19 || template.manualCardsMissingCandidate !== 0) fail("manual cards should all have candidates");

for (const field of ["humanTranscription", "humanSummary", "riskRewriteNotes", "publicReferenceNotes", "originalityNotes"]) {
  if (!template.requiredManualFields?.includes(field)) fail(`requiredManualFields missing ${field}`);
}
for (const field of ["replacementDecision", "replacementSourcePath", "rerunEvidence"]) {
  if (!template.requiredReplacementFields?.includes(field)) fail(`requiredReplacementFields missing ${field}`);
}

for (const card of cards) {
  if (card.educationOnly !== true || card.productionReady !== false) fail(`${card.id} boundary drift`);
  if (card.learnerFacingRelease !== false || card.approvalStatus !== "not_approved") fail(`${card.id} release gate drift`);
  if (card.noteStatus !== "blank_human_reviewer_note") fail(`${card.id} must remain blank`);
  if (card.reviewerName !== "" || card.reviewedAt !== "") fail(`${card.id} reviewer fields must be blank`);
  if (!Array.isArray(card.requiredFields) || card.requiredFields.length < 8) fail(`${card.id} required fields too thin`);
  if (!Array.isArray(card.forbiddenClaims) || card.forbiddenClaims.length < 6) fail(`${card.id} forbidden claims too thin`);
  if (!card.nextGate) fail(`${card.id} missing next gate`);
  if (card.category === "manual_transcription") {
    if (card.matchStatus !== "candidate_available_for_human_review") fail(`${card.id} missing candidate match`);
    if (!card.candidateId || !card.highResPreviewUrl?.startsWith("/docs/local-course-low-extraction-high-res-previews/")) {
      fail(`${card.id} missing high-res candidate evidence`);
    }
    if (!card.candidateSummary || card.candidateSummary.length < 80) fail(`${card.id} candidate summary too thin`);
    if (!Array.isArray(card.uncertainRegions) || card.uncertainRegions.length < 1) fail(`${card.id} missing uncertain regions`);
    if (!Array.isArray(card.riskRewriteChecklist) || card.riskRewriteChecklist.length < 2) fail(`${card.id} missing risk rewrite checklist`);
    if (!card.riskRewriteChecklist.every((item) => item.status === "not_started" && item.requiredAction)) {
      fail(`${card.id} risk rewrite checklist drift`);
    }
    if (card.humanFillFields?.humanTranscription !== "" || card.humanFillFields?.humanSummary !== "") {
      fail(`${card.id} manual fill fields must be blank`);
    }
    if (card.nextGate !== "human_fill_review_input_then_validate_apply_dry_run") fail(`${card.id} manual next gate drift`);
  } else if (card.category === "source_replacement") {
    if (card.candidateId || card.highResPreviewUrl) fail(`${card.id} replacement card should not have transcription candidate`);
    if (card.humanFillFields?.replacementDecision !== "" || card.humanFillFields?.replacementSourcePath !== "") {
      fail(`${card.id} replacement fields must be blank`);
    }
    if (card.nextGate !== "source_replacement_decision_then_rerun_quality_gates") fail(`${card.id} replacement next gate drift`);
  } else {
    fail(`${card.id} unexpected category ${card.category}`);
  }
}

const riskCounts = template.riskTermFlagCounts || {};
for (const flag of ["specific_price_levels", "entry_language", "signal_language", "support_resistance_language"]) {
  if (!riskCounts[flag]) fail(`risk term counts should include ${flag}`);
}

const boundaryText = `${template.boundary || ""} ${template.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "blank reviewer scaffolding",
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
  if (!boundaryText.includes(phrase)) fail(`template boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: template.educationOnly,
  productionReady: template.productionReady,
  learnerFacingRelease: template.learnerFacingRelease,
  approvalStatus: template.approvalStatus,
  templateStatus: template.templateStatus,
  totalP0Tasks: template.totalP0Tasks,
  manualReviewCards: template.manualReviewCards,
  sourceReplacementReviewCards: template.sourceReplacementReviewCards,
  filledNoteCards: template.filledNoteCards,
  readyForValidationCards: template.readyForValidationCards,
  acceptedForOverlayCards: template.acceptedForOverlayCards,
}, null, 2));
