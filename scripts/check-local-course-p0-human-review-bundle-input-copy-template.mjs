import fs from "node:fs";

const templatePath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_TEMPLATE.json";
const validationPath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_VALIDATION.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const template = readJson(templatePath);
const validation = readJson(validationPath);

if (template.educationOnly !== true || validation.educationOnly !== true) fail("bundle input must keep educationOnly:true");
if (template.productionReady !== false || validation.productionReady !== false) fail("bundle input must keep productionReady:false");
if (template.learnerFacingRelease !== false || validation.learnerFacingRelease !== false) fail("bundle input must keep learnerFacingRelease:false");
if (template.approvalStatus !== "not_approved" || validation.approvalStatus !== "not_approved") fail("bundle input must remain not_approved");
if (template.fixtureOnly !== false || validation.fixtureOnly !== false) fail("bundle input must not be fixture-only");
if (template.templateStatus !== "p0_human_review_bundle_input_copy_blank") fail("invalid templateStatus");
if (template.totalEntries !== 22 || validation.totalEntries !== 22) fail("expected 22 total entries");
if (template.manualTranscriptionEntries !== 19 || validation.manualTranscriptionEntries !== 19) fail("expected 19 manual entries");
if (template.sourceReplacementEntries !== 3 || validation.sourceReplacementEntries !== 3) fail("expected 3 source replacement entries");
if (template.filledEntries !== 0) fail("blank template must have 0 filled entries");
if (template.readyForValidationEntries !== 0) fail("blank template must have 0 ready entries");
if (validation.validationStatus !== "blocked_missing_reviewer_input") fail("blank validation must be blocked");
if (validation.readyEntries !== 0) fail("blank validation must have 0 ready entries");
if (validation.blockedEntries !== 22) fail("blank validation must block all 22 entries");
if (validation.forbiddenHitEntries !== 0) fail("blank validation should have no forbidden hits");
if (!Array.isArray(template.inputEntries) || template.inputEntries.length !== 22) fail("template missing 22 input entries");
if (!Array.isArray(validation.validationRows) || validation.validationRows.length !== 22) fail("validation missing 22 rows");
if (!template.inputEntries.every((entry) =>
  entry.bundleInputStatus === "blank_ready_for_real_reviewer_fill" &&
  entry.reviewerName === "" &&
  entry.reviewedAt === "" &&
  ["manual_transcription", "source_replacement"].includes(entry.category)
)) fail("template entries are not blank reviewer inputs");
if (!validation.validationRows.every((row) =>
  row.validationStatus === "blocked_missing_reviewer_input" &&
  row.readyForOverlayApply === false &&
  row.missingFields.includes("reviewerName") &&
  row.missingFields.includes("reviewedAt")
)) fail("validation rows must block missing reviewer identity");
if (!/does not contain real reviewer input/i.test(template.completionRule || "")) fail("template completionRule must reject real-review claims");
if (!/does not write overlay changes/i.test(template.boundary || "")) fail("template boundary must reject writes");
if (!/does not write overlay changes/i.test(validation.boundary || "")) fail("validation boundary must reject writes");
if (!/stock recommendations/i.test(template.boundary || "")) fail("template boundary must preserve guardrails");

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  templateStatus: template.templateStatus,
  validationStatus: validation.validationStatus,
  totalEntries: template.totalEntries,
  manualTranscriptionEntries: template.manualTranscriptionEntries,
  sourceReplacementEntries: template.sourceReplacementEntries,
  readyEntries: validation.readyEntries,
  blockedEntries: validation.blockedEntries,
}, null, 2));
