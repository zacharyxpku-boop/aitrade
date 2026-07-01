import fs from "node:fs";

const handoffPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_HANDOFF.json";
const handoffMdPath = "docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_HANDOFF.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const handoff = readJson(handoffPath);
if (!fs.existsSync(handoffMdPath)) fail(`missing ${handoffMdPath}`);

if (handoff.educationOnly !== true) fail("handoff must keep educationOnly:true");
if (handoff.productionReady !== false) fail("handoff must keep productionReady:false");
if (handoff.learnerFacingRelease !== false) fail("handoff must keep learnerFacingRelease:false");
if (handoff.approvalStatus !== "not_approved") fail("handoff must remain not_approved");
if (handoff.handoffStatus !== "p0_real_reviewer_source_fit_handoff_ready_blocked_on_real_input") {
  fail(`unexpected handoffStatus: ${handoff.handoffStatus}`);
}
if (handoff.handoffMode !== "single_entrypoint_for_real_source_fit_review_execution") fail("unexpected handoffMode");
if (handoff.totalP0Tasks !== 22) fail(`expected 22 P0 tasks, got ${handoff.totalP0Tasks}`);
if (handoff.totalSourceFitCards !== 22) fail(`expected 22 source-fit cards, got ${handoff.totalSourceFitCards}`);
if (handoff.totalGuideRows !== 22) fail(`expected 22 guide rows, got ${handoff.totalGuideRows}`);
if (handoff.sourceFitRealReadyRows !== 0) fail("real source-fit ready rows must stay 0 before human input");
if (handoff.sourceFitRealBlockedRows !== 22) fail("real source-fit blocked rows must stay 22 before human input");
if (handoff.sourceFitFixtureReadyRows !== 22) fail("fixture control must have 22 ready rows");
if (handoff.writeAllowedNow !== false) fail("handoff must not allow writes");
if (handoff.realHumanInputEntries !== 0) fail("handoff must not claim real human input");
if (handoff.manualAuthorizationRequired !== true) fail("manual authorization must be required");
if (handoff.fixtureOnlyInputsRejectedForWrite !== true) fail("fixture-only inputs must be rejected for write");

const requiredPhaseIds = [
  "inspect_p0_task_board",
  "review_public_evidence_packet",
  "fill_source_fit_worksheet",
  "map_notes_to_draft_input",
  "validate_real_source_fit_input",
  "compare_positive_fixture_control",
  "check_write_authorization_preview",
];
if (!Array.isArray(handoff.phaseRows) || handoff.phaseRows.length !== requiredPhaseIds.length) {
  fail("phaseRows must contain exactly 7 phases");
}
for (const [index, id] of requiredPhaseIds.entries()) {
  const row = handoff.phaseRows[index];
  if (!row || row.order !== index + 1 || row.id !== id) fail(`phase ${index + 1} must be ${id}`);
  if (!row.status || !row.inputFile || !row.command || !row.reviewerAction || !row.hardStop) {
    fail(`${id} missing executable handoff fields`);
  }
}

if (!Array.isArray(handoff.hardStops) || handoff.hardStops.length < 5) fail("handoff must include hard stops");
const hardStopText = handoff.hardStops.join(" ").toLowerCase();
for (const phrase of [
  "fixture-only",
  "sourcefitrealreadyrows is 0",
  "learner-facing citations",
  "setup, signal, future outcome, strategy edge, or real-money action",
  "explicit human authorization",
]) {
  if (!hardStopText.includes(phrase)) fail(`hard stops missing phrase: ${phrase}`);
}

if (!Array.isArray(handoff.commands) || handoff.commands.length < 4) fail("handoff must expose verification commands");
for (const phrase of [
  "check:local-course-p0-real-reviewer-source-fit-handoff",
  "check:local-course-p0-real-reviewer-source-fit-input-validation",
  "check:local-course-p0-real-reviewer-source-fit-positive-fixture",
  "check:local-course-p0-write-authorization-preview",
]) {
  if (!handoff.commands.some((command) => command.includes(phrase))) fail(`commands missing ${phrase}`);
}

const boundaryText = `${handoff.boundary || ""} ${handoff.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "does not fill notes",
  "does not create real reviewer judgment",
  "does not approve learner-facing citations",
  "does not authorize overlay writes",
  "does not infer missing private content",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "write authorization",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: handoff.educationOnly,
  productionReady: handoff.productionReady,
  learnerFacingRelease: handoff.learnerFacingRelease,
  approvalStatus: handoff.approvalStatus,
  handoffStatus: handoff.handoffStatus,
  totalP0Tasks: handoff.totalP0Tasks,
  phaseRows: handoff.phaseRows.length,
  sourceFitRealReadyRows: handoff.sourceFitRealReadyRows,
  sourceFitRealBlockedRows: handoff.sourceFitRealBlockedRows,
  sourceFitFixtureReadyRows: handoff.sourceFitFixtureReadyRows,
  realHumanInputEntries: handoff.realHumanInputEntries,
  writeAllowedNow: handoff.writeAllowedNow,
}, null, 2));
