import fs from "node:fs";

const guidePath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_INPUT_GUIDE.json";
const guideMdPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_INPUT_GUIDE.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const guide = readJson(guidePath);
if (!fs.existsSync(guideMdPath)) fail(`missing ${guideMdPath}`);

if (guide.educationOnly !== true) fail("guide must keep educationOnly:true");
if (guide.productionReady !== false) fail("guide must keep productionReady:false");
if (guide.learnerFacingRelease !== false) fail("guide must keep learnerFacingRelease:false");
if (guide.approvalStatus !== "not_approved") fail("guide must remain not_approved");
if (guide.guideStatus !== "p0_real_reviewer_source_fit_input_guide_ready_blank") fail(`unexpected guideStatus: ${guide.guideStatus}`);
if (guide.guideMode !== "maps_source_fit_cards_to_reviewer_owned_draft_input_fields") fail("unexpected guideMode");
if (guide.sourceDraftInput !== "docs/reviewer-inputs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_REAL_INPUT_DRAFT.json") fail("unexpected sourceDraftInput");
if (guide.totalGuideRows !== 22) fail(`expected 22 guide rows, got ${guide.totalGuideRows}`);
if (guide.manualTranscriptionRows !== 19) fail(`expected 19 manual rows, got ${guide.manualTranscriptionRows}`);
if (guide.sourceReplacementRows !== 3) fail(`expected 3 source replacement rows, got ${guide.sourceReplacementRows}`);
if (guide.rowsWithSourceFitFieldPath !== 22) fail("all rows must have source-fit field paths");
if (guide.rowsWithPublicReferenceNotesFieldPath !== 22) fail("all rows must have public reference notes field paths");
if (guide.rowsWithSuggestedRefs !== 22) fail("all rows must have suggested refs");
if (guide.rowsWithWikipediaRefs !== 22) fail("all rows must have Wikipedia/share-alike refs");
if (guide.rowsWithPublicContextRefs !== 22) fail("all rows must have public context refs");
if (guide.reviewerFilledRows !== 0) fail("guide must not claim reviewer-filled rows");
if (guide.generatedDecisions !== 0) fail("guide must not generate decisions");
if (guide.learnerCitationApprovedRows !== 0) fail("guide must not approve learner citations");
if (guide.realHumanInputEntries !== 0) fail("guide must not claim real human input");
if (guide.writeAllowedNow !== false) fail("guide must not allow writes");
if (guide.manualAuthorizationRequired !== true) fail("manual authorization must be required");
if (!Array.isArray(guide.commands) || guide.commands.length < 4) fail("guide must include commands");
if (!Array.isArray(guide.forbiddenPhrases) || guide.forbiddenPhrases.length < 10) fail("guide must include forbidden phrases");
if (!Array.isArray(guide.guideRows) || guide.guideRows.length !== 22) fail("guideRows must contain 22 rows");

for (const row of guide.guideRows) {
  if (!row.id || !row.cardId || !row.inputEntryId || !row.taskId) fail("guide row missing identity fields");
  if (!/^\/inputEntries\/\d+$/.test(row.jsonPointer || "")) fail(`${row.id} has invalid jsonPointer`);
  if (!Array.isArray(row.requiredFieldPaths) || row.requiredFieldPaths.length < 8) fail(`${row.id} missing required field paths`);
  if (!row.sourceFitFieldPath || !row.publicReferenceNotesFieldPath) fail(`${row.id} missing source-fit/public refs paths`);
  if (!Array.isArray(row.suggestedRefIds) || row.suggestedRefIds.length < 3) fail(`${row.id} needs suggested ref ids`);
  if (row.suggestedRefCount < 3) fail(`${row.id} suggestedRefCount too low`);
  if (row.wikipediaRefCount < 1) fail(`${row.id} missing wikipedia ref count`);
  if (row.publicContextRefCount < 1) fail(`${row.id} missing public context ref count`);
  if (!Array.isArray(row.requiredReviewerDecisionValues) || row.requiredReviewerDecisionValues.length !== 4) {
    fail(`${row.id} missing reviewer decision values`);
  }
  if (!Array.isArray(row.unsafeAutofillFields) || !row.unsafeAutofillFields.includes("sourceFitNote")) {
    fail(`${row.id} must mark sourceFitNote unsafe to autofill`);
  }
  if (!Array.isArray(row.fillInstructions) || row.fillInstructions.length < 4) fail(`${row.id} missing fill instructions`);
  if (!/validate:local-course-p0-human-review-bundle-input-copy/.test(row.validationCommand || "")) {
    fail(`${row.id} missing validation command`);
  }
  if (row.reviewerFilled !== false) fail(`${row.id} must not be reviewer-filled`);
  if (row.generatedDecision !== "") fail(`${row.id} must not contain generated decision text`);
  if (row.learnerCitationApproved !== false) fail(`${row.id} must not approve learner citation`);
  if (row.approvalStatus !== "not_approved") fail(`${row.id} must remain not_approved`);
  if (row.learnerFacingRelease !== false) fail(`${row.id} must not be learner-facing release ready`);
  if (row.writeAllowedNow !== false) fail(`${row.id} must not allow writes`);
  if (row.nextGate !== "fill_draft_input_copy_then_validate_and_lint") fail(`${row.id} has unexpected nextGate`);
}

const boundaryText = `${guide.boundary || ""} ${guide.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "shows where humans should write",
  "keeps all judgment blank",
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
  educationOnly: guide.educationOnly,
  productionReady: guide.productionReady,
  learnerFacingRelease: guide.learnerFacingRelease,
  approvalStatus: guide.approvalStatus,
  guideStatus: guide.guideStatus,
  totalGuideRows: guide.totalGuideRows,
  rowsWithSourceFitFieldPath: guide.rowsWithSourceFitFieldPath,
  rowsWithPublicReferenceNotesFieldPath: guide.rowsWithPublicReferenceNotesFieldPath,
  rowsWithSuggestedRefs: guide.rowsWithSuggestedRefs,
  reviewerFilledRows: guide.reviewerFilledRows,
  generatedDecisions: guide.generatedDecisions,
  learnerCitationApprovedRows: guide.learnerCitationApprovedRows,
  realHumanInputEntries: guide.realHumanInputEntries,
  writeAllowedNow: guide.writeAllowedNow,
}, null, 2));
