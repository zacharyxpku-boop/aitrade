import fs from "node:fs";

const reportPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_INPUT_VALIDATION.json";
const reportMdPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_INPUT_VALIDATION.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const report = readJson(reportPath);
if (!fs.existsSync(reportMdPath)) fail(`missing ${reportMdPath}`);

if (report.educationOnly !== true) fail("source-fit validation must keep educationOnly:true");
if (report.productionReady !== false) fail("source-fit validation must keep productionReady:false");
if (report.learnerFacingRelease !== false) fail("source-fit validation must keep learnerFacingRelease:false");
if (report.approvalStatus !== "not_approved") fail("source-fit validation must remain not_approved");
if (report.validationStatus !== "blocked_missing_reviewer_input") fail(`blank source-fit input must stay blocked, got ${report.validationStatus}`);
if (report.validationMode !== "source_fit_and_public_reference_notes_gate") fail("unexpected validationMode");
if (report.totalRows !== 22) fail(`expected 22 rows, got ${report.totalRows}`);
if (report.readyRows !== 0) fail("blank source-fit input must have 0 ready rows");
if (report.blockedRows !== 22) fail("blank source-fit input must block all 22 rows");
if (report.missingFieldRows !== 22) fail("blank source-fit input must have 22 missing-field rows");
if (report.forbiddenHitRows !== 0) fail("blank source-fit input must not have forbidden hits");
if (report.fixtureOnly !== false) fail("blank real-review source-fit input must not be fixtureOnly");
if (report.fixtureReadyRows !== 0) fail("blank real-review source-fit input must have 0 fixture ready rows");
if (report.realHumanInputEntries !== 0) fail("blank source-fit input must not claim real human input");
if (report.generatedDecisions !== 0) fail("source-fit validation must not generate decisions");
if (report.learnerCitationApprovedRows !== 0) fail("source-fit validation must not approve learner citations");
if (report.writeAllowedNow !== false) fail("source-fit validation must not allow writes");
if (report.manualAuthorizationRequired !== true) fail("manual authorization must be required");
if (!Array.isArray(report.allowedDecisionValues) || report.allowedDecisionValues.length !== 4) fail("must expose 4 allowed decision values");
if (!Array.isArray(report.forbiddenPhrases) || report.forbiddenPhrases.length < 12) fail("must expose forbidden phrases");
if (!Array.isArray(report.validationRows) || report.validationRows.length !== 22) fail("validationRows must contain 22 rows");

for (const row of report.validationRows) {
  if (!row.id || !row.inputEntryId || !row.taskId || !row.category) fail("validation row missing identity fields");
  if (row.validationStatus !== "blocked_missing_reviewer_input") fail(`${row.id} must remain blocked while blank`);
  if (row.readyForSourceFitGate !== false) fail(`${row.id} must not be ready for source-fit gate`);
  if (!Array.isArray(row.missingFields) || row.missingFields.length < 2) fail(`${row.id} must expose missing fields`);
  if (!row.missingFields.some((field) => /sourceFitNote|publicReferenceNotes/.test(field))) {
    fail(`${row.id} must require sourceFitNote/publicReferenceNotes`);
  }
  if (!Array.isArray(row.qualityIssues)) fail(`${row.id} qualityIssues must be an array`);
  if (!Array.isArray(row.forbiddenHits)) fail(`${row.id} forbiddenHits must be an array`);
  if (row.forbiddenHits.length !== 0) fail(`${row.id} blank row must not have forbidden hits`);
  if (row.nextGate !== "fill_source_fit_notes_then_revalidate") fail(`${row.id} has unexpected nextGate`);
}

const boundaryText = `${report.boundary || ""} ${report.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "validates source-fit note shape",
  "does not generate reviewer decisions",
  "approve learner-facing citations",
  "write authorization",
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
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  validationStatus: report.validationStatus,
  totalRows: report.totalRows,
  readyRows: report.readyRows,
  blockedRows: report.blockedRows,
  missingFieldRows: report.missingFieldRows,
  forbiddenHitRows: report.forbiddenHitRows,
  fixtureOnly: report.fixtureOnly,
  fixtureReadyRows: report.fixtureReadyRows,
  realHumanInputEntries: report.realHumanInputEntries,
  writeAllowedNow: report.writeAllowedNow,
}, null, 2));
