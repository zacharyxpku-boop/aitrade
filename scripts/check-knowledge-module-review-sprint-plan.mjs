import fs from "node:fs";

const sprintPlanPath = "docs/KNOWLEDGE_MODULE_REVIEW_SPRINT_PLAN.json";
const sprintPlanMdPath = "docs/KNOWLEDGE_MODULE_REVIEW_SPRINT_PLAN.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const plan = readJson(sprintPlanPath);
if (!fs.existsSync(sprintPlanMdPath)) fail(`missing ${sprintPlanMdPath}`);

if (plan.educationOnly !== true) fail("plan must keep educationOnly:true");
if (plan.productionReady !== false) fail("plan must keep productionReady:false");
if (plan.learnerFacingRelease !== false) fail("plan must keep learnerFacingRelease:false");
if (plan.approvalStatus !== "not_approved") fail("plan must remain not_approved");
if (plan.sprintPlanStatus !== "module_review_sprint_plan_ready_release_blocked") fail("unexpected sprintPlanStatus");
if (plan.sprintPlanMode !== "module_priority_plan_for_1715_reviewer_work_items") fail("unexpected sprintPlanMode");
if (plan.coursePathAuditStatus !== "course_path_readiness_audit_ready_release_blocked") fail("course path audit status drift");
if (plan.actionQueueStatus !== "knowledge_reviewer_action_queue_ready_blocked_on_real_input") fail("action queue status drift");
if (plan.progressMatrixStatus !== "node_public_source_fit_review_progress_matrix_ready_release_blocked") fail("progress matrix status drift");
if (plan.firstCompletionGateStatus !== "first_reviewer_completion_gate_blocked_missing_real_input") fail("first completion gate status drift");
if (plan.modules !== 12 || plan.coursePaths !== 12 || plan.sprintRows !== 12) fail("expected 12 modules/course paths/sprint rows");
if (plan.totalReviewerActions !== 52) fail("expected 52 reviewer actions");
if (plan.totalBlockedWorkItems !== 1715 || plan.totalReadyWorkItems !== 0) fail("blocked/ready work items drift");
if (plan.firstSprintBlockedWorkItems !== 257 || plan.firstSprintReadyWorkItems !== 0) fail("first sprint gate totals drift");
if (plan.highRiskSprintModules !== 4) fail("expected 4 high-risk sprint modules");
if (plan.sourceFitReviewRows !== 1638 || plan.readySourceFitReviewRows !== 0 || plan.blockedSourceFitReviewRows !== 1638) {
  fail("source-fit totals drift");
}
if (plan.highRiskBlockedLessons !== 12 || plan.highRiskBlockedReviewerNotes !== 72) fail("high-risk totals drift");
if (plan.directSourceDecisions !== 5 || plan.readyDirectSourceDecisions !== 0) fail("direct-source totals drift");
if (
  plan.realHumanInputEntries !== 0 ||
  plan.learnerCitationApprovedRows !== 0 ||
  plan.learnerReleaseReadyPaths !== 0
) {
  fail("plan must not claim real human input or learner release approval");
}
if (plan.writeAllowedNow !== false || plan.manualAuthorizationRequired !== true) fail("write gate drift");

if (!Array.isArray(plan.firstSprintRows) || plan.firstSprintRows.length !== 4) fail("expected 4 first sprint rows");
if (!Array.isArray(plan.moduleSprintRows) || plan.moduleSprintRows.length !== 12) fail("expected 12 module sprint rows");

if (!plan.firstSprintRows.every((row) => row.highRiskBlockedLessons > 0 && row.sprintPhase === "phase_1_high_risk_and_source_fit")) {
  fail("first sprint rows must be high-risk phase 1 modules");
}

if (!plan.moduleSprintRows.every((row, index) =>
  row.sprintRank === index + 1 &&
  row.sprintPhase &&
  row.module &&
  row.pathId &&
  row.lessonCount === 30 &&
  row.unitCount === 3 &&
  row.estimatedMinutes === 240 &&
  row.sourceFitReviewRows > 0 &&
  row.readySourceFitReviewRows === 0 &&
  row.blockedSourceFitReviewRows === row.sourceFitReviewRows &&
  row.blockedActionRows >= 1 &&
  row.blockedWorkItems >= row.blockedActionRows &&
  row.readyWorkItems === 0 &&
  row.firstActionId &&
  row.firstActionType &&
  row.firstInputPath &&
  row.nextReviewerAction &&
  row.learnerPathReleaseReady === false &&
  row.learnerFacingRelease === false &&
  row.realHumanInputEntries === 0 &&
  row.learnerCitationApprovedRows === 0 &&
  row.writeAllowedNow === false &&
  row.reviewStatus === "module_review_sprint_blocked_missing_real_input" &&
  Array.isArray(row.blockedReasons) &&
  row.blockedReasons.includes("source_fit_review_rows_blocked") &&
  row.blockedReasons.includes("separate_learner_release_approval_missing")
)) {
  fail("module sprint row readiness drift");
}

const blockedWorkItems = plan.moduleSprintRows.reduce((sum, row) => sum + (row.blockedWorkItems || 0), 0);
const blockedActionRows = plan.moduleSprintRows.reduce((sum, row) => sum + (row.blockedActionRows || 0), 0);
const sourceFitRows = plan.moduleSprintRows.reduce((sum, row) => sum + (row.sourceFitReviewRows || 0), 0);
const blockedSourceFitRows = plan.moduleSprintRows.reduce((sum, row) => sum + (row.blockedSourceFitReviewRows || 0), 0);
const highRiskLessons = plan.moduleSprintRows.reduce((sum, row) => sum + (row.highRiskBlockedLessons || 0), 0);
const highRiskNotes = plan.moduleSprintRows.reduce((sum, row) => sum + (row.blockedHighRiskNotes || 0), 0);
const directSourceDecisions = plan.moduleSprintRows.reduce((sum, row) => sum + (row.directSourceDecisions || 0), 0);
if (blockedWorkItems !== 1715) fail("module blocked work item totals drift");
if (blockedActionRows !== 52) fail("module action row totals drift");
if (sourceFitRows !== 1638 || blockedSourceFitRows !== 1638) fail("module source-fit totals drift");
if (highRiskLessons !== 12 || highRiskNotes !== 72) fail("module high-risk totals drift");
if (directSourceDecisions !== 5) fail("module direct-source totals drift");

if (!Array.isArray(plan.nextBestActions) || plan.nextBestActions.length < 4) fail("next best actions too thin");
if (!Array.isArray(plan.commands) || !plan.commands.some((command) => /check:knowledge-module-review-sprint-plan/.test(command))) {
  fail("commands must include module review sprint plan check");
}

const boundaryText = `${plan.boundary || ""} ${plan.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "absorbed local investment course material",
  "public/wikipedia/official source-fit rows",
  "1715 reviewer work items",
  "12 high-risk lessons",
  "72 high-risk reviewer notes",
  "5 direct-source decisions",
  "1638 source-fit rows",
  "does not generate reviewer notes",
  "approve copied text",
  "approve learner-facing citations",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "write authorization",
  "learner release",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  sprintPlanStatus: plan.sprintPlanStatus,
  modules: plan.modules,
  sprintRows: plan.sprintRows,
  totalReviewerActions: plan.totalReviewerActions,
  totalBlockedWorkItems: plan.totalBlockedWorkItems,
  firstSprintBlockedWorkItems: plan.firstSprintBlockedWorkItems,
  highRiskSprintModules: plan.highRiskSprintModules,
  sourceFitReviewRows: plan.sourceFitReviewRows,
  highRiskBlockedReviewerNotes: plan.highRiskBlockedReviewerNotes,
  realHumanInputEntries: plan.realHumanInputEntries,
  writeAllowedNow: plan.writeAllowedNow,
}, null, 2));
