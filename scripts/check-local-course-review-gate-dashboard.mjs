import fs from "node:fs";

const dashboardPath = "docs/LOCAL_COURSE_REVIEW_GATE_DASHBOARD.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const dashboard = readJson(dashboardPath);

if (dashboard.educationOnly !== true) fail("dashboard must keep educationOnly:true");
if (dashboard.productionReady !== false) fail("dashboard must keep productionReady:false");
if (dashboard.learnerFacingRelease !== false) fail("dashboard must keep learnerFacingRelease:false");
if (dashboard.approvalStatus !== "not_approved") fail("dashboard must remain not_approved");
if (dashboard.dashboardStatus !== "local_course_review_gate_dashboard_ready_release_blocked") {
  fail(`unexpected dashboardStatus: ${dashboard.dashboardStatus}`);
}
if (dashboard.dashboardMode !== "single_screen_internal_review_gate_for_local_course_absorption") {
  fail(`unexpected dashboardMode: ${dashboard.dashboardMode}`);
}
if (dashboard.localCourseDocuments !== 298 || dashboard.currentUniquePdfHashes !== 298) {
  fail("local course source coverage drift");
}
if (dashboard.corpusDocsForCurrentUniqueHashes !== 298) fail("current unique PDFs are not all mapped to corpus");
if (dashboard.modules !== 12 || dashboard.researchLayerReadyModules !== 12) fail("module research readiness drift");
if (dashboard.publicReferenceReadyModules !== 12 || dashboard.modulesWithWikipediaGrounding !== 12) {
  fail("public/Wikipedia grounding readiness drift");
}
if (dashboard.rewriteReadyNodes !== 360 || dashboard.matchedKnowledgeNodes !== 360) {
  fail("rewrite-ready node coverage drift");
}
if (dashboard.rewriteDrafts !== 120) fail("rewrite draft coverage drift");
if (dashboard.highRiskLessons !== 12 || dashboard.highRiskLessonsWithPublicGrounding !== 12) {
  fail("high-risk grounding drift");
}
if (dashboard.highRiskLessonsWithAtLeastThreeWikipediaRefs !== 12) {
  fail("high-risk Wikipedia grounding drift");
}
if (dashboard.highRiskReleaseBlockingLessons !== 12) fail("high-risk release blocker drift");
if (dashboard.codexSelfReviewNotes !== 72 || dashboard.expectedSelfReviewNotes !== 72) {
  fail("Codex self-review note coverage drift");
}
if (dashboard.highRiskRealReviewerValidationStatus !== "blocked_missing_real_reviewer_overlay_input") {
  fail("high-risk real reviewer validation status drift");
}
if (dashboard.highRiskRealReviewerReadyLessons !== 0 || dashboard.highRiskRealReviewerBlockedLessons !== 12) {
  fail("high-risk real reviewer lesson readiness drift");
}
if (dashboard.highRiskRealReviewerNotesReady !== 0 || dashboard.highRiskRealReviewerNotesBlocked !== 72) {
  fail("high-risk real reviewer note readiness drift");
}
if (dashboard.highRiskDirectSourceDecisionsReady !== 0 || dashboard.highRiskDirectSourceDecisionsBlocked !== 5) {
  fail("high-risk direct-source decision readiness drift");
}
if (dashboard.realHumanInputEntries !== 0) fail("dashboard must not fabricate real human input");
if (dashboard.p0Tasks !== 22 || dashboard.p0ReadyTasks !== 0 || dashboard.p0BlockedTasks !== 22) {
  fail("P0 task readiness drift");
}
if (dashboard.manualTranscriptionTasks !== 19 || dashboard.sourceReplacementTasks !== 3) {
  fail("P0 task category drift");
}
if (dashboard.sourceFitReadyRows !== 0 || dashboard.sourceFitBlockedRows !== 22) {
  fail("source-fit readiness drift");
}
if (dashboard.sourceFitFixtureReadyRows !== 22) fail("source-fit fixture control drift");
if (dashboard.nodePublicSourceFitValidationStatus !== "blocked_missing_real_reviewer_source_fit_input") {
  fail(`unexpected node public source-fit validation status: ${dashboard.nodePublicSourceFitValidationStatus}`);
}
if (dashboard.nodePublicSourceFitInputRows !== 1638 || dashboard.nodePublicSourceFitReadyRows !== 0 || dashboard.nodePublicSourceFitBlockedRows !== 1638) {
  fail("node public source-fit readiness drift");
}
if (dashboard.nodePublicSourceFitMissingFieldRows !== 1638 || dashboard.nodePublicSourceFitForbiddenHitRows !== 0) {
  fail("node public source-fit quality gate drift");
}
if (
  dashboard.nodePublicSourceFitRealHumanInputEntries !== 0 ||
  dashboard.nodePublicSourceFitLearnerCitationApprovedRows !== 0 ||
  dashboard.nodePublicSourceFitCopiedTextApprovedRows !== 0
) {
  fail("node public source-fit gate must not claim human approval while blank");
}
if (dashboard.nodePublicSourceFitProgressMatrixStatus !== "node_public_source_fit_review_progress_matrix_ready_release_blocked") {
  fail(`unexpected node public source-fit progress matrix status: ${dashboard.nodePublicSourceFitProgressMatrixStatus}`);
}
if (dashboard.nodePublicSourceFitProgressValidationStatus !== "blocked_missing_real_reviewer_source_fit_input") {
  fail("node public source-fit progress validation status drift");
}
if (
  dashboard.nodePublicSourceFitProgressTotalPackets !== 35 ||
  dashboard.nodePublicSourceFitReadyPackets !== 0 ||
  dashboard.nodePublicSourceFitBlockedPackets !== 35 ||
  dashboard.nodePublicSourceFitReadyModules !== 0 ||
  dashboard.nodePublicSourceFitBlockedModules !== 12 ||
  dashboard.nodePublicSourceFitOverallProgressPercent !== 0
) {
  fail("node public source-fit packet progress drift");
}
if (
  dashboard.nodePublicSourceFitProgressReadyRows !== 0 ||
  dashboard.nodePublicSourceFitProgressBlockedRows !== 1638 ||
  dashboard.nodePublicSourceFitFirstBlockedPacketId !== "node-public-source-fit-batch-001-packet"
) {
  fail("node public source-fit first blocked packet drift");
}
if (dashboard.learnerCitationApprovedLessons !== 0 || dashboard.learnerReleaseReadyModules !== 0) {
  fail("dashboard must not approve learner-facing release");
}
if (dashboard.writeAllowedNow !== false || dashboard.manualAuthorizationRequired !== true) {
  fail("write authorization gate must remain locked");
}
if (dashboard.releaseBlockerCount < 5) fail("expected release blockers not represented");

const summaryGates = dashboard.summaryGates || [];
const moduleGateRows = dashboard.moduleGateRows || [];
const highRiskLessonRows = dashboard.highRiskLessonRows || [];
const nextActionRows = dashboard.nextActionRows || [];

if (!Array.isArray(summaryGates) || summaryGates.length !== 10) fail("expected 10 summary gates");
if (!Array.isArray(moduleGateRows) || moduleGateRows.length !== 12) fail("expected 12 module gate rows");
if (!Array.isArray(highRiskLessonRows) || highRiskLessonRows.length !== 12) fail("expected 12 high-risk lesson rows");
if (!Array.isArray(nextActionRows) || nextActionRows.length !== 10) fail("expected 10 next-action rows");

for (const gateId of [
  "source_folder_sync",
  "research_layer_absorption",
  "public_wikipedia_grounding",
  "high_risk_self_review",
  "high_risk_real_reviewer_overlay",
  "p0_real_reviewer_tasks",
  "source_fit_notes",
  "node_public_source_fit_review_input",
  "node_public_source_fit_progress_matrix",
  "write_authorization",
]) {
  const gate = summaryGates.find((row) => row.id === gateId);
  if (!gate) fail(`missing summary gate ${gateId}`);
  if (gate.learnerReleaseGatePassed !== false) fail(`${gateId} must not pass learner release`);
  if (!gate.status || !gate.evidence || !gate.nextGate) fail(`${gateId} missing review evidence`);
}

if (!summaryGates.some((row) => row.id === "high_risk_self_review" && /Codex self-review notes/i.test(row.evidence))) {
  fail("high-risk self-review gate must identify Codex self-review as non-human");
}
if (!summaryGates.some((row) =>
  row.id === "high_risk_real_reviewer_overlay" &&
  /0\/72 real notes ready\/blocked/i.test(row.evidence) &&
  /0\/5 direct-source decisions ready\/blocked/i.test(row.evidence)
)) {
  fail("high-risk real reviewer gate must show blank real overlay validation");
}
if (!summaryGates.some((row) => row.id === "p0_real_reviewer_tasks" && /0 real inputs/i.test(row.evidence))) {
  fail("P0 gate must show zero real human inputs");
}
if (!summaryGates.some((row) =>
  row.id === "node_public_source_fit_review_input" &&
  /0\/1638 node public source-fit rows ready\/blocked/i.test(row.evidence) &&
  /0 real inputs/i.test(row.evidence)
)) {
  fail("node public source-fit gate must show blank real review validation");
}
if (!summaryGates.some((row) =>
  row.id === "node_public_source_fit_progress_matrix" &&
  /0\/35 packets ready\/blocked/i.test(row.evidence) &&
  /0\/12 modules ready\/blocked/i.test(row.evidence) &&
  /0% progress/i.test(row.evidence) &&
  /node-public-source-fit-batch-001-packet/i.test(row.evidence)
)) {
  fail("node public source-fit progress gate must show packet-level blockage");
}
if (!summaryGates.some((row) => row.id === "write_authorization" && /writeAllowedNow:false/i.test(row.evidence))) {
  fail("write authorization gate must show writeAllowedNow:false");
}

for (const row of moduleGateRows) {
  if (!row.moduleId || !row.module || !row.coursePathId) fail("module gate row missing identity");
  if (row.readyForRewriteReview !== row.learnerFacingNodes) fail(`module ${row.module} rewrite coverage drift`);
  if (row.localResearchReady !== true || row.publicReferenceReady !== true || row.wikipediaGroundingReady !== true) {
    fail(`module ${row.module} internal research gates not ready`);
  }
  if (row.learnerCitationApproved !== false || row.learnerReleaseReady !== false) {
    fail(`module ${row.module} must not be learner-release approved`);
  }
  if (!/^blocked_pending_/.test(row.reviewGateStatus || "")) fail(`module ${row.module} gate is not blocked`);
  if (!Array.isArray(row.samplePublicRefs) || row.samplePublicRefs.length < 2) {
    fail(`module ${row.module} lacks public ref samples`);
  }
}

for (const lesson of highRiskLessonRows) {
  if (!lesson.lessonId || !lesson.nodeId || !lesson.module || !lesson.topic) fail("high-risk lesson identity missing");
  if (lesson.wikipediaRefCount < 3 || lesson.publicContextRefCount < 2) {
    fail(`high-risk lesson ${lesson.lessonId} public grounding drift`);
  }
  if (lesson.selfReviewStatus !== "codex_self_review_complete_not_human_approved") {
    fail(`high-risk lesson ${lesson.lessonId} must keep human approval separate`);
  }
  if (lesson.learnerCitationApproved !== false || lesson.learnerFacingRelease !== false) {
    fail(`high-risk lesson ${lesson.lessonId} must not be learner-release approved`);
  }
  if (lesson.releaseBlocker !== true || !/human_public_grounding_review/i.test(lesson.nextGate || "")) {
    fail(`high-risk lesson ${lesson.lessonId} release gate drift`);
  }
}

for (const action of nextActionRows) {
  if (!action.id || !action.command || !action.owner || !action.output) fail("next action row incomplete");
}
if (!nextActionRows.some((row) => row.owner === "real_reviewer")) fail("next actions must include real reviewer work");
if (!nextActionRows.some((row) => /validate:local-course-p0-real-reviewer-source-fit-input/.test(row.command))) {
  fail("next actions must include real source-fit validation");
}
if (!nextActionRows.some((row) => /validate:local-course-high-risk-real-reviewer-overlay-input/.test(row.command))) {
  fail("next actions must include high-risk real reviewer overlay validation");
}
if (!nextActionRows.some((row) => /validate:knowledge-node-public-source-fit-review-input/.test(row.command))) {
  fail("next actions must include node public source-fit validation");
}
if (!nextActionRows.some((row) => /check:knowledge-node-public-source-fit-review-progress-matrix/.test(row.command))) {
  fail("next actions must include node public source-fit progress matrix check");
}

const boundaryText = `${dashboard.completionRule || ""} ${dashboard.boundary || ""}`.toLowerCase();
for (const phrase of [
  "internal review-gate visibility",
  "does not prove learner-facing course readiness",
  "real reviewer notes",
  "source-fit input",
  "learner-facing citations",
  "separate approval",
  "reviewer-facing education-only",
  "does not publish private pdfs",
  "approve learner-facing citations",
  "write overlays",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`dashboard boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: dashboard.educationOnly,
  productionReady: dashboard.productionReady,
  learnerFacingRelease: dashboard.learnerFacingRelease,
  approvalStatus: dashboard.approvalStatus,
  dashboardStatus: dashboard.dashboardStatus,
  modules: dashboard.modules,
  highRiskLessons: dashboard.highRiskLessons,
  p0Tasks: dashboard.p0Tasks,
  realHumanInputEntries: dashboard.realHumanInputEntries,
  sourceFitReadyRows: dashboard.sourceFitReadyRows,
  sourceFitBlockedRows: dashboard.sourceFitBlockedRows,
  nodePublicSourceFitReadyRows: dashboard.nodePublicSourceFitReadyRows,
  nodePublicSourceFitBlockedRows: dashboard.nodePublicSourceFitBlockedRows,
  nodePublicSourceFitReadyPackets: dashboard.nodePublicSourceFitReadyPackets,
  nodePublicSourceFitBlockedPackets: dashboard.nodePublicSourceFitBlockedPackets,
  nodePublicSourceFitOverallProgressPercent: dashboard.nodePublicSourceFitOverallProgressPercent,
  nodePublicSourceFitFirstBlockedPacketId: dashboard.nodePublicSourceFitFirstBlockedPacketId,
  writeAllowedNow: dashboard.writeAllowedNow,
}, null, 2));
