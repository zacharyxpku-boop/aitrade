import fs from "node:fs";

const fixturePath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_POSITIVE_FIXTURE.json";
const fixtureMdPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_POSITIVE_FIXTURE.md";
const validationPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_POSITIVE_FIXTURE_VALIDATION.json";
const validationMdPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_POSITIVE_FIXTURE_VALIDATION.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const fixture = readJson(fixturePath);
const validation = readJson(validationPath);
if (!fs.existsSync(fixtureMdPath)) fail(`missing ${fixtureMdPath}`);
if (!fs.existsSync(validationMdPath)) fail(`missing ${validationMdPath}`);

for (const [label, artifact] of [["fixture", fixture], ["validation", validation]]) {
  if (artifact.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
}

if (fixture.fixtureOnly !== true) fail("positive fixture must be fixtureOnly:true");
if (fixture.fixtureStatus !== "p0_real_reviewer_source_fit_positive_fixture_ready") fail("unexpected fixtureStatus");
if (fixture.fixtureMode !== "positive_control_for_source_fit_validator_only") fail("unexpected fixtureMode");
if (fixture.totalEntries !== 22) fail(`expected 22 fixture entries, got ${fixture.totalEntries}`);
if (fixture.filledSourceFitEntries !== 22) fail("fixture must fill 22 source-fit entries");
if (fixture.realHumanInputEntries !== 0) fail("fixture must not claim real human input");
if (fixture.generatedDecisions !== 0) fail("fixture must not claim generated decisions");
if (fixture.learnerCitationApprovedRows !== 0) fail("fixture must not approve learner citations");
if (fixture.writeAllowedNow !== false) fail("fixture must not allow writes");
if (!Array.isArray(fixture.inputEntries) || fixture.inputEntries.length !== 22) fail("fixture inputEntries must contain 22 rows");
if (!fixture.inputEntries.every((entry) => entry.fixtureOnlyReason && entry.sourceFitFixture?.fixtureOnly === true)) {
  fail("all fixture entries must carry fixture-only metadata");
}

if (validation.fixtureOnly !== true) fail("positive validation must be fixtureOnly:true");
if (validation.fixtureValidationAllowed !== true) fail("positive validation must be run with --allow-fixture");
if (validation.validationStatus !== "ready_for_source_fit_gate") fail(`positive validation should pass, got ${validation.validationStatus}`);
if (validation.totalRows !== 22) fail(`expected 22 validation rows, got ${validation.totalRows}`);
if (validation.readyRows !== 22) fail("positive validation must have 22 ready rows");
if (validation.blockedRows !== 0) fail("positive validation must have 0 blocked rows");
if (validation.missingFieldRows !== 0) fail("positive validation must have 0 missing-field rows");
if (validation.qualityIssueRows !== 0) fail("positive validation must have 0 quality issue rows");
if (validation.forbiddenHitRows !== 0) fail("positive validation must have 0 forbidden-hit rows");
if (validation.fixtureReadyRows !== 22) fail("positive validation must count 22 fixture ready rows");
if (validation.realHumanInputEntries !== 0) fail("positive validation must not claim real human input");
if (validation.writeAllowedNow !== false) fail("positive validation must not allow writes");
if (!Array.isArray(validation.validationRows) || validation.validationRows.length !== 22) fail("validationRows must contain 22 rows");
if (!validation.validationRows.every((row) =>
  row.validationStatus === "ready_for_source_fit_gate" &&
  row.readyForSourceFitGate === true &&
  row.missingFields.length === 0 &&
  row.qualityIssues.length === 0 &&
  row.forbiddenHits.length === 0 &&
  row.nextGate === "run_bundle_validator_then_approval_and_write_authorization_gates"
)) fail("all positive validation rows must be ready and clean");

const boundaryText = `${fixture.boundary || ""} ${fixture.completionRule || ""} ${validation.boundary || ""} ${validation.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "fixture-only",
  "not real human input",
  "does not create real reviewer judgment",
  "does not approve learner-facing citations",
  "does not authorize overlay writes",
  "stock recommendation",
  "live signal",
  "return promise",
  "broker workflow",
  "real-money guidance",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  fixtureOnly: fixture.fixtureOnly,
  validationStatus: validation.validationStatus,
  totalRows: validation.totalRows,
  readyRows: validation.readyRows,
  blockedRows: validation.blockedRows,
  fixtureReadyRows: validation.fixtureReadyRows,
  realHumanInputEntries: validation.realHumanInputEntries,
  writeAllowedNow: validation.writeAllowedNow,
}, null, 2));
