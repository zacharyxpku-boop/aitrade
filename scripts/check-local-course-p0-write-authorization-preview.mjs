import fs from "node:fs";

const previewPath = "docs/LOCAL_COURSE_P0_WRITE_AUTHORIZATION_PREVIEW.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const preview = readJson(previewPath);
const gates = preview.gates || [];

if (preview.educationOnly !== true) fail("preview must keep educationOnly:true");
if (preview.productionReady !== false) fail("preview must keep productionReady:false");
if (preview.learnerFacingRelease !== false) fail("preview must keep learnerFacingRelease:false");
if (preview.approvalStatus !== "not_approved") fail("preview must remain not_approved");
if (preview.previewStatus !== "write_authorization_preview_ready_manual_required") fail(`unexpected previewStatus: ${preview.previewStatus}`);
if (preview.writeAllowedNow !== false) fail("writeAllowedNow must remain false");
if (preview.manualAuthorizationRequired !== true) fail("manual authorization must be required");
if (preview.machineCheckedGatesPassed !== true) fail("machine checked gates should pass for the blocked preview state");
if (preview.realReviewerInputRequired !== true) fail("real reviewer input must be required");
if (preview.fixtureOnlyInputsRejectedForWrite !== true) fail("fixtureOnly inputs must be rejected for write");
if (preview.totalP0Tasks !== 22 || preview.totalReviewPackEntries !== 22) fail("P0 coverage drift");
if (preview.blankValidationReadyEntries !== 0 || preview.blankValidationBlockedEntries !== 22) fail("blank validation gate drift");
if (preview.blankLintReadyEntries !== 0 || preview.blankLintBlockedEntries !== 22) fail("blank lint gate drift");
if (preview.fixtureReadyToApplyEntries !== 22 || preview.fixtureOnlyReadyEntries !== 22 || preview.fixtureWrittenEntries !== 0) fail("fixture dry-run gate drift");
if (preview.sourceFitValidationStatus !== "blocked_missing_reviewer_input") fail(`unexpected source-fit validation status: ${preview.sourceFitValidationStatus}`);
if (preview.sourceFitReadyRows !== 0 || preview.sourceFitBlockedRows !== 22) fail("source-fit real input gate drift");
if (preview.sourceFitMissingFieldRows !== 22 || preview.sourceFitForbiddenHitRows !== 0) fail("source-fit real input quality gate drift");
if (preview.sourceFitFixtureValidationStatus !== "ready_for_source_fit_gate") fail(`unexpected source-fit fixture validation status: ${preview.sourceFitFixtureValidationStatus}`);
if (preview.sourceFitFixtureReadyRows !== 22 || preview.sourceFitFixtureRealHumanInputEntries !== 0) fail("source-fit fixture gate drift");
if (preview.highRiskRealReviewerValidationStatus !== "blocked_missing_real_reviewer_overlay_input") fail("high-risk real reviewer validation status drift");
if (preview.highRiskReadyLessons !== 0 || preview.highRiskBlockedLessons !== 12) fail("high-risk lesson readiness drift");
if (preview.highRiskReadyReviewerNotes !== 0 || preview.highRiskBlockedReviewerNotes !== 72) fail("high-risk reviewer note readiness drift");
if (preview.highRiskReadyDirectSourceDecisions !== 0 || preview.highRiskBlockedDirectSourceDecisions !== 5) fail("high-risk direct-source decision readiness drift");
if (preview.highRiskMissingFieldRows < 89 || preview.highRiskForbiddenHitRows !== 0) fail("high-risk validation quality drift");
if (preview.highRiskRealHumanInputEntries !== 0) fail("high-risk validation must not claim real human input while blank");
if (preview.nodePublicSourceFitValidationStatus !== "blocked_missing_real_reviewer_source_fit_input") {
  fail(`unexpected node public source-fit validation status: ${preview.nodePublicSourceFitValidationStatus}`);
}
if (preview.nodePublicSourceFitInputRows !== 1638 || preview.nodePublicSourceFitReadyRows !== 0 || preview.nodePublicSourceFitBlockedRows !== 1638) {
  fail("node public source-fit real input gate drift");
}
if (preview.nodePublicSourceFitMissingFieldRows !== 1638 || preview.nodePublicSourceFitForbiddenHitRows !== 0) {
  fail("node public source-fit validation quality drift");
}
if (
  preview.nodePublicSourceFitRealHumanInputEntries !== 0 ||
  preview.nodePublicSourceFitLearnerCitationApprovedRows !== 0 ||
  preview.nodePublicSourceFitCopiedTextApprovedRows !== 0
) {
  fail("node public source-fit validation must not claim human/citation approval while blank");
}
if (preview.nodePublicSourceFitProgressMatrixStatus !== "node_public_source_fit_review_progress_matrix_ready_release_blocked") {
  fail(`unexpected node public source-fit progress matrix status: ${preview.nodePublicSourceFitProgressMatrixStatus}`);
}
if (preview.nodePublicSourceFitProgressValidationStatus !== "blocked_missing_real_reviewer_source_fit_input") {
  fail("node public source-fit progress validation status drift");
}
if (
  preview.nodePublicSourceFitProgressTotalPackets !== 35 ||
  preview.nodePublicSourceFitReadyPackets !== 0 ||
  preview.nodePublicSourceFitBlockedPackets !== 35 ||
  preview.nodePublicSourceFitReadyModules !== 0 ||
  preview.nodePublicSourceFitBlockedModules !== 12 ||
  preview.nodePublicSourceFitOverallProgressPercent !== 0 ||
  preview.nodePublicSourceFitFirstBlockedPacketId !== "node-public-source-fit-batch-001-packet"
) {
  fail("node public source-fit progress matrix gate drift");
}
if (preview.overlayStatus !== "p0_review_not_started" || preview.overlayReadyForValidationTasks !== 0 || preview.overlayAcceptedForNextGateTasks !== 0) fail("overlay must remain untouched");
if (preview.readinessStatus !== "blocked_for_learner_facing_absorption") fail(`unexpected readiness status: ${preview.readinessStatus}`);
if (!Array.isArray(gates) || gates.length < 8) fail("preview gates too thin");

for (const id of [
  "coverage_complete",
  "blank_inputs_blocked",
  "blank_lints_blocked",
  "fixtures_dry_run_only",
  "no_real_reviewer_input_copy",
  "fixture_ready_entries_not_authorizable",
  "source_fit_real_input_blocked",
  "source_fit_fixture_not_authorizable",
  "high_risk_real_reviewer_overlay_blocked",
  "node_public_source_fit_review_input_blocked",
  "node_public_source_fit_progress_matrix_blocked",
  "overlay_untouched",
  "readiness_still_blocked",
]) {
  if (!gates.some((gate) => gate.id === id)) fail(`missing gate ${id}`);
}

const blockingGateIds = gates.filter((gate) => gate.blocksWrite).map((gate) => gate.id);
if (!blockingGateIds.includes("no_real_reviewer_input_copy")) fail("must block on missing real reviewer input");
if (!blockingGateIds.includes("fixture_ready_entries_not_authorizable")) fail("must block fixture ready entries");
if (!blockingGateIds.includes("source_fit_fixture_not_authorizable")) fail("must block source-fit fixture ready rows");
if (!blockingGateIds.includes("high_risk_real_reviewer_overlay_blocked")) fail("must block high-risk real reviewer overlay");
if (!blockingGateIds.includes("node_public_source_fit_review_input_blocked")) fail("must block node public source-fit review input");
if (!blockingGateIds.includes("node_public_source_fit_progress_matrix_blocked")) fail("must block node public source-fit progress matrix");
if (gates.some((gate) => gate.status === "fail")) fail("machine gate should not fail in this preview");

const preconditions = preview.requiredWritePreconditions || [];
for (const phrase of ["fixtureOnly:false", "zero forbidden hits", "Source-fit validation", "High-risk real reviewer overlay validation", "Node public source-fit review input validation", "Node public source-fit progress matrix", "writtenEntries:0", "explicit human approval"]) {
  if (!preconditions.some((item) => item.includes(phrase))) fail(`missing precondition phrase: ${phrase}`);
}

const boundaryText = `${preview.boundary || ""} ${preview.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "not write authorization",
  "writeallowednow must stay false",
  "reviewer-only operational material",
  "does not write overlay changes",
  "approve learner-facing release",
  "infer missing private course content",
  "trading advice",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
]) {
  if (!boundaryText.includes(phrase)) fail(`preview boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: preview.educationOnly,
  productionReady: preview.productionReady,
  learnerFacingRelease: preview.learnerFacingRelease,
  approvalStatus: preview.approvalStatus,
  previewStatus: preview.previewStatus,
  writeAllowedNow: preview.writeAllowedNow,
  manualAuthorizationRequired: preview.manualAuthorizationRequired,
  fixtureOnlyReadyEntries: preview.fixtureOnlyReadyEntries,
  fixtureWrittenEntries: preview.fixtureWrittenEntries,
  sourceFitReadyRows: preview.sourceFitReadyRows,
  sourceFitBlockedRows: preview.sourceFitBlockedRows,
  sourceFitFixtureReadyRows: preview.sourceFitFixtureReadyRows,
  highRiskReadyReviewerNotes: preview.highRiskReadyReviewerNotes,
  highRiskBlockedReviewerNotes: preview.highRiskBlockedReviewerNotes,
  nodePublicSourceFitReadyRows: preview.nodePublicSourceFitReadyRows,
  nodePublicSourceFitBlockedRows: preview.nodePublicSourceFitBlockedRows,
  nodePublicSourceFitReadyPackets: preview.nodePublicSourceFitReadyPackets,
  nodePublicSourceFitBlockedPackets: preview.nodePublicSourceFitBlockedPackets,
  nodePublicSourceFitOverallProgressPercent: preview.nodePublicSourceFitOverallProgressPercent,
  nodePublicSourceFitFirstBlockedPacketId: preview.nodePublicSourceFitFirstBlockedPacketId,
}, null, 2));
