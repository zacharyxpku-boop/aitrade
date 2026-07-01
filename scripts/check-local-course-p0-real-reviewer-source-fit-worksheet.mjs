import fs from "node:fs";

const worksheetPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_WORKSHEET.json";
const worksheetMdPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_WORKSHEET.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const worksheet = readJson(worksheetPath);
if (!fs.existsSync(worksheetMdPath)) fail(`missing ${worksheetMdPath}`);

if (worksheet.educationOnly !== true) fail("worksheet must keep educationOnly:true");
if (worksheet.productionReady !== false) fail("worksheet must keep productionReady:false");
if (worksheet.learnerFacingRelease !== false) fail("worksheet must keep learnerFacingRelease:false");
if (worksheet.approvalStatus !== "not_approved") fail("worksheet must remain not_approved");
if (worksheet.worksheetStatus !== "p0_real_reviewer_source_fit_worksheet_ready_blank") fail(`unexpected worksheetStatus: ${worksheet.worksheetStatus}`);
if (worksheet.worksheetMode !== "blank_human_source_fit_cards_with_public_ref_suggestions") fail("unexpected worksheetMode");
if (worksheet.totalCards !== 22) fail(`expected 22 cards, got ${worksheet.totalCards}`);
if (worksheet.manualTranscriptionCards !== 19) fail(`expected 19 manual cards, got ${worksheet.manualTranscriptionCards}`);
if (worksheet.sourceReplacementCards !== 3) fail(`expected 3 source replacement cards, got ${worksheet.sourceReplacementCards}`);
if (worksheet.totalBlankFields !== 176) fail(`expected 176 blank fields, got ${worksheet.totalBlankFields}`);
if (worksheet.cardsWithSuggestedRefs !== 22) fail("all cards must have suggested refs");
if (worksheet.cardsWithWikipediaRefs !== 22) fail("all cards must have Wikipedia/share-alike refs");
if (worksheet.cardsWithPublicContextRefs !== 22) fail("all cards must have public context refs");
if (worksheet.reviewerFilledCards !== 0) fail("worksheet must not claim reviewer-filled cards");
if (worksheet.generatedDecisions !== 0) fail("worksheet must not generate decisions");
if (worksheet.learnerCitationApprovedCards !== 0) fail("worksheet must not approve learner citations");
if (worksheet.realHumanInputEntries !== 0) fail("worksheet must not claim real human input");
if (worksheet.writeAllowedNow !== false) fail("worksheet must not allow writes");
if (worksheet.manualAuthorizationRequired !== true) fail("manual authorization must be required");
if (!Array.isArray(worksheet.commands) || worksheet.commands.length < 4) fail("worksheet must include command rows");
if (!Array.isArray(worksheet.cards) || worksheet.cards.length !== 22) fail("worksheet cards must contain 22 rows");

const allowedDecisions = new Set([
  "confirm_public_refs_support_neutral_vocabulary_only",
  "downgrade_refs_to_boundary_context_only",
  "reject_refs_as_not_fit_for_this_private_page",
  "block_until_replacement_or_transcription_review",
]);

for (const card of worksheet.cards) {
  if (!card.id || !card.inputEntryId || !card.taskId || !card.category) fail("card missing identity fields");
  if (card.readyForOverlayApply !== false) fail(`${card.id} must not be ready for overlay apply`);
  if (card.reviewerFilled !== false) fail(`${card.id} must not be reviewer-filled`);
  if (card.generatedDecision !== "") fail(`${card.id} must not contain generated decision text`);
  if (card.learnerCitationApproved !== false) fail(`${card.id} must not approve learner citation`);
  if (card.approvalStatus !== "not_approved") fail(`${card.id} must remain not_approved`);
  if (card.learnerFacingRelease !== false) fail(`${card.id} must not be learner-facing release ready`);
  if (card.nextGate !== "human_fill_source_fit_worksheet_then_validate_reviewer_input_copy") fail(`${card.id} has unexpected nextGate`);
  if (!Array.isArray(card.blankFields) || card.blankFields.length !== 8) fail(`${card.id} must expose 8 blank fields`);
  if (!card.blankFields.includes("sourceFitNote") || !card.blankFields.includes("publicReferenceNotes")) {
    fail(`${card.id} missing sourceFitNote/publicReferenceNotes blank fields`);
  }
  if (!Array.isArray(card.requiredReviewerDecisions) || card.requiredReviewerDecisions.length !== 4) {
    fail(`${card.id} must expose 4 required reviewer decisions`);
  }
  if (!card.requiredReviewerDecisions.every((decision) => allowedDecisions.has(decision))) {
    fail(`${card.id} contains unsupported reviewer decision`);
  }
  if (!Array.isArray(card.suggestedPublicRefs) || card.suggestedPublicRefs.length < 3) {
    fail(`${card.id} needs at least 3 suggested public refs`);
  }
  if (!card.suggestedPublicRefs.some((ref) => ref.tier === "share_alike" || ref.family === "Wikipedia")) {
    fail(`${card.id} missing Wikipedia/share-alike ref`);
  }
  if (!card.suggestedPublicRefs.some((ref) => ref.tier !== "share_alike" && ref.family !== "Wikipedia")) {
    fail(`${card.id} missing public context ref`);
  }
  if (!Array.isArray(card.acceptanceChecks) || card.acceptanceChecks.length < 5) fail(`${card.id} missing acceptance checks`);
  if (!Array.isArray(card.unsafeAutofillFields) || !card.unsafeAutofillFields.includes("sourceFitNote")) {
    fail(`${card.id} must mark sourceFitNote unsafe to autofill`);
  }
  const claimBoundary = (card.claimBoundary || "").toLowerCase();
  for (const phrase of ["setup", "signal", "future outcome", "strategy edge", "real-money action"]) {
    if (!claimBoundary.includes(phrase)) fail(`${card.id} claim boundary missing ${phrase}`);
  }
}

const boundaryText = `${worksheet.boundary || ""} ${worksheet.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "keeps all source-fit and public-reference judgment blank",
  "does not fill sourcefitnote",
  "does not generate reviewer decisions",
  "does not approve learner-facing citations",
  "does not authorize overlay writes",
  "stock recommendation",
  "live signal",
  "return promise",
  "broker workflow",
  "real-money action",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: worksheet.educationOnly,
  productionReady: worksheet.productionReady,
  learnerFacingRelease: worksheet.learnerFacingRelease,
  approvalStatus: worksheet.approvalStatus,
  worksheetStatus: worksheet.worksheetStatus,
  totalCards: worksheet.totalCards,
  totalBlankFields: worksheet.totalBlankFields,
  cardsWithSuggestedRefs: worksheet.cardsWithSuggestedRefs,
  reviewerFilledCards: worksheet.reviewerFilledCards,
  generatedDecisions: worksheet.generatedDecisions,
  learnerCitationApprovedCards: worksheet.learnerCitationApprovedCards,
  realHumanInputEntries: worksheet.realHumanInputEntries,
  writeAllowedNow: worksheet.writeAllowedNow,
}, null, 2));
