import fs from "node:fs";

const fixturePath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_POSITIVE_FIXTURE.json";
const validationPath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_POSITIVE_FIXTURE_VALIDATION.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const fixture = readJson(fixturePath);
const validation = readJson(validationPath);

if (fixture.educationOnly !== true || validation.educationOnly !== true) fail("positive fixture must keep educationOnly:true");
if (fixture.productionReady !== false || validation.productionReady !== false) fail("positive fixture must keep productionReady:false");
if (fixture.learnerFacingRelease !== false || validation.learnerFacingRelease !== false) fail("positive fixture must keep learnerFacingRelease:false");
if (fixture.approvalStatus !== "not_approved" || validation.approvalStatus !== "not_approved") fail("positive fixture must remain not_approved");
if (fixture.fixtureOnly !== true || validation.fixtureOnly !== true) fail("positive fixture must be fixtureOnly:true");
if (validation.fixtureValidationAllowed !== true) fail("positive fixture validation must require explicit fixture allowance");
if (fixture.templateStatus !== "p0_human_review_bundle_positive_fixture_ready") fail("invalid fixture templateStatus");
if (validation.validationStatus !== "ready_for_overlay_apply") fail("positive fixture validation should be ready");
if (fixture.totalEntries !== 22 || validation.totalEntries !== 22) fail("expected 22 entries");
if (fixture.manualTranscriptionEntries !== 19 || validation.manualTranscriptionEntries !== 19) fail("expected 19 manual entries");
if (fixture.sourceReplacementEntries !== 3 || validation.sourceReplacementEntries !== 3) fail("expected 3 source replacement entries");
if (fixture.filledEntries !== 22) fail("positive fixture should have 22 filled entries");
if (fixture.readyForValidationEntries !== 22) fail("positive fixture should have 22 validation-ready entries");
if (validation.readyEntries !== 22) fail("positive fixture validation should have 22 ready entries");
if (validation.blockedEntries !== 0) fail("positive fixture validation should have 0 blocked entries");
if (validation.forbiddenHitEntries !== 0) fail("positive fixture validation should have 0 forbidden hits");
if (!Array.isArray(fixture.inputEntries) || fixture.inputEntries.length !== 22) fail("fixture missing 22 input entries");
if (!Array.isArray(validation.validationRows) || validation.validationRows.length !== 22) fail("validation missing 22 rows");
if (!validation.validationRows.every((row) => row.readyForOverlayApply === true && row.missingFields.length === 0)) fail("all fixture rows must be validation-ready");
if (!/not real human review evidence/i.test(fixture.completionRule || "")) fail("fixture completionRule must reject real-review claims");
if (!/does not.*authorize overlay writes/i.test(fixture.completionRule || "")) fail("fixture completionRule must reject write authorization");
if (!/validator test material only/i.test(fixture.boundary || "")) fail("fixture boundary must be validator-only");
if (!/dry-run gate/i.test(validation.boundary || "")) fail("validation boundary must remain dry-run");

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  fixtureOnly: true,
  templateStatus: fixture.templateStatus,
  validationStatus: validation.validationStatus,
  totalEntries: fixture.totalEntries,
  readyEntries: validation.readyEntries,
  blockedEntries: validation.blockedEntries,
  forbiddenHitEntries: validation.forbiddenHitEntries,
}, null, 2));
