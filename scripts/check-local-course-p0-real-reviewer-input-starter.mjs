import fs from "node:fs";

const starterPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER.json";
const starterMdPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER.md";
const draftPath = "docs/reviewer-inputs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_REAL_INPUT_DRAFT.json";
const validationPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_INPUT_STARTER_VALIDATION.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const starter = readJson(starterPath);
const draft = readJson(draftPath);
const validation = readJson(validationPath);
if (!fs.existsSync(starterMdPath)) fail(`missing ${starterMdPath}`);
if (!fs.existsSync(validationMdPath)) fail(`missing ${validationMdPath}`);

for (const [label, artifact] of [["starter", starter], ["draft", draft], ["validation", validation]]) {
  if (artifact.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
}

if (starter.starterStatus !== "real_reviewer_input_starter_ready_waiting_for_human_fill") fail("unexpected starterStatus");
if (starter.starterMode !== "reviewer_owned_blank_copy_plus_blocked_validation") fail("unexpected starterMode");
if (starter.draftInputPath !== draftPath) fail("starter draft path mismatch");
if (starter.draftValidationJsonPath !== validationPath) fail("starter validation path mismatch");
if (starter.totalEntries !== 22 || draft.totalEntries !== 22 || validation.totalEntries !== 22) fail("expected 22 total entries");
if (starter.manualTranscriptionEntries !== 19 || draft.manualTranscriptionEntries !== 19 || validation.manualTranscriptionEntries !== 19) fail("expected 19 manual entries");
if (starter.sourceReplacementEntries !== 3 || draft.sourceReplacementEntries !== 3 || validation.sourceReplacementEntries !== 3) fail("expected 3 source replacement entries");
if (starter.filledEntries !== 0 || draft.filledEntries !== 0) fail("starter draft must have 0 filled entries");
if (starter.readyForValidationEntries !== 0 || draft.readyForValidationEntries !== 0) fail("starter draft must have 0 ready entries");
if (starter.validationStatus !== "blocked_missing_reviewer_input" || validation.validationStatus !== "blocked_missing_reviewer_input") fail("starter validation must remain blocked");
if (starter.validationReadyEntries !== 0 || validation.readyEntries !== 0) fail("starter validation must have 0 ready entries");
if (starter.validationBlockedEntries !== 22 || validation.blockedEntries !== 22) fail("starter validation must block all 22 entries");
if (starter.realHumanInputEntries !== 0) fail("starter must not claim real human input");
if (starter.writeAllowedNow !== false) fail("starter must not allow writes");
if (starter.manualAuthorizationRequired !== true) fail("manual authorization must be required");
if (draft.reviewerOwnedCopy !== true || validation.reviewerOwnedCopy !== true) fail("draft and validation must be reviewer-owned copy artifacts");
if (draft.fixtureOnly !== false || validation.fixtureOnly !== false) fail("starter artifacts must not be fixture-only");
if (draft.sourceTemplatePath !== "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_TEMPLATE.json") fail("draft source template mismatch");
if (!Array.isArray(draft.inputEntries) || draft.inputEntries.length !== 22) fail("draft must contain 22 input entries");
if (!Array.isArray(validation.validationRows) || validation.validationRows.length !== 22) fail("validation must contain 22 rows");

if (!draft.inputEntries.every((entry) =>
  entry.bundleInputStatus === "reviewer_owned_copy_blank" &&
  entry.inputStatus === "awaiting_real_reviewer_fill" &&
  entry.reviewerName === "" &&
  entry.reviewedAt === "" &&
  ["manual_transcription", "source_replacement"].includes(entry.category)
)) fail("draft entries must remain blank reviewer-owned inputs");

if (!validation.validationRows.every((row) =>
  row.validationStatus === "blocked_missing_reviewer_input" &&
  row.readyForOverlayApply === false &&
  row.missingFields.includes("reviewerName") &&
  row.missingFields.includes("reviewedAt")
)) fail("validation rows must block missing reviewer identity");

const boundaryText = `${starter.boundary || ""} ${starter.completionRule || ""} ${draft.boundary || ""} ${validation.boundary || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "does not create real reviewer judgment",
  "approve learner-facing release",
  "write overlay changes",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "real-money guidance",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  starterStatus: starter.starterStatus,
  totalEntries: starter.totalEntries,
  readyEntries: starter.validationReadyEntries,
  blockedEntries: starter.validationBlockedEntries,
  realHumanInputEntries: starter.realHumanInputEntries,
  writeAllowedNow: starter.writeAllowedNow,
  draftInputPath: starter.draftInputPath,
}, null, 2));
