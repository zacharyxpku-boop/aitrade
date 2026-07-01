import fs from "node:fs";

const checklistPath = "docs/KNOWLEDGE_FIRST_REVIEWER_EXECUTION_CHECKLIST.json";
const checklistMdPath = "docs/KNOWLEDGE_FIRST_REVIEWER_EXECUTION_CHECKLIST.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const checklist = readJson(checklistPath);
if (!fs.existsSync(checklistMdPath)) fail(`missing ${checklistMdPath}`);

if (checklist.educationOnly !== true) fail("checklist must keep educationOnly:true");
if (checklist.productionReady !== false) fail("checklist must keep productionReady:false");
if (checklist.learnerFacingRelease !== false) fail("checklist must keep learnerFacingRelease:false");
if (checklist.approvalStatus !== "not_approved") fail("checklist must remain not_approved");
if (checklist.executionChecklistStatus !== "first_reviewer_execution_checklist_ready_blocked_on_real_input") fail("unexpected executionChecklistStatus");
if (checklist.executionChecklistMode !== "day_one_20_actions_257_work_items_execution_sequence") fail("unexpected executionChecklistMode");
if (checklist.handoffStatus !== "first_reviewer_action_handoff_ready_blocked_on_real_input") fail("handoff status drift");
if (checklist.fieldMapStatus !== "first_reviewer_field_map_ready_blocked_on_real_input") fail("field map status drift");
if (checklist.completionGateStatus !== "first_reviewer_completion_gate_blocked_missing_real_input") fail("completion gate status drift");
if (checklist.sprintPlanStatus !== "module_review_sprint_plan_ready_release_blocked") fail("sprint plan status drift");
if (checklist.handoffActionRows !== 20 || checklist.mappedActionRows !== 20 || checklist.executionRowCount !== 20) fail("first reviewer action counts drift");
if (checklist.requiredWorkItems !== 257 || checklist.readyWorkItems !== 0 || checklist.blockedWorkItems !== 257) fail("work item totals drift");
if (checklist.highRiskLessonActions !== 12 || checklist.highRiskReviewerNoteFields !== 72 || checklist.highRiskReadyReviewerNotes !== 0 || checklist.highRiskBlockedReviewerNotes !== 72) {
  fail("high-risk execution totals drift");
}
if (checklist.directSourceDecisionActions !== 5 || checklist.directSourceDecisionFields !== 5 || checklist.readyDirectSourceDecisions !== 0 || checklist.blockedDirectSourceDecisions !== 5) {
  fail("direct-source execution totals drift");
}
if (checklist.sourceFitPacketActions !== 3 || checklist.sourceFitReviewRows !== 180 || checklist.readySourceFitReviewRows !== 0 || checklist.blockedSourceFitReviewRows !== 180) {
  fail("source-fit execution totals drift");
}
if (checklist.firstSprintBlockedWorkItems !== 257 || checklist.totalReviewerBacklogWorkItems !== 1715) fail("sprint backlog totals drift");
if (
  checklist.realHumanInputEntries !== 0 ||
  checklist.learnerCitationApprovedRows !== 0 ||
  checklist.learnerReleaseReadyModules !== 0 ||
  checklist.readyForSeparateApproval !== false
) {
  fail("checklist must not claim real human input, citation approval, release readiness, or separate approval");
}
if (checklist.writeAllowedNow !== false || checklist.manualAuthorizationRequired !== true) fail("write gate drift");

if (!Array.isArray(checklist.inputPaths) || checklist.inputPaths.length !== 4) fail("expected four input paths");
if (!Array.isArray(checklist.validationPaths) || checklist.validationPaths.length !== 4) fail("expected four validation paths");
for (const file of [...checklist.inputPaths, ...checklist.validationPaths]) {
  if (!fs.existsSync(file)) fail(`referenced file missing: ${file}`);
}

if (!Array.isArray(checklist.stageRows) || checklist.stageRows.length !== 5) fail("expected five stage rows");
const expectedStages = [
  "preflight_open_input_copies",
  "fill_high_risk_reviewer_notes",
  "resolve_direct_source_decisions",
  "fill_source_fit_packets_001_003",
  "run_validation_and_keep_release_locked",
];
if (!checklist.stageRows.every((row, index) =>
  row.stageRank === index + 1 &&
  row.stageId === expectedStages[index] &&
  row.requiredItems >= row.readyItems &&
  row.requiredItems === row.readyItems + row.blockedItems &&
  row.nextAction &&
  row.reviewStatus
)) {
  fail("stage row sequence drift");
}
if (checklist.stageRows[0].blockedItems !== 0 || checklist.stageRows[0].reviewStatus !== "execution_preflight_ready") {
  fail("preflight stage should be ready because input copies exist");
}
if (checklist.stageRows[1].requiredItems !== 72 || checklist.stageRows[1].blockedItems !== 72) fail("high-risk stage totals drift");
if (checklist.stageRows[2].requiredItems !== 5 || checklist.stageRows[2].blockedItems !== 5) fail("direct-source stage totals drift");
if (checklist.stageRows[3].requiredItems !== 180 || checklist.stageRows[3].blockedItems !== 180) fail("source-fit stage totals drift");
if (checklist.stageRows[4].requiredItems !== 257 || checklist.stageRows[4].blockedItems !== 257) fail("validation stage totals drift");

if (!Array.isArray(checklist.executionRows) || checklist.executionRows.length !== 20) fail("expected 20 execution rows");
if (!checklist.executionRows.every((row, index) =>
  row.executionRank === index + 1 &&
  row.queueRank >= 1 &&
  row.executionPhase &&
  row.actionId &&
  row.actionType &&
  row.module &&
  row.targetId &&
  row.blockedItems > 0 &&
  row.readyItems === 0 &&
  row.inputPath &&
  row.mappedFieldCount === row.blockedItems &&
  row.validationCommand &&
  row.nextGate &&
  row.reviewerTask &&
  row.reviewStatus === "execution_blocked_missing_real_reviewer_input" &&
  row.realHumanInputEntries === 0 &&
  row.learnerFacingRelease === false &&
  row.writeAllowedNow === false
)) {
  fail("execution row readiness drift");
}
if (!checklist.executionRows.slice(0, 12).every((row) =>
  row.actionType === "high_risk_lesson_reviewer_notes" &&
  row.executionPhase === "phase_1_fill_high_risk_reviewer_notes" &&
  row.blockedItems === 6)) {
  fail("first 12 execution rows must be high-risk note actions");
}
if (!checklist.executionRows.slice(12, 17).every((row) =>
  row.actionType === "direct_source_candidate_decision" &&
  row.executionPhase === "phase_2_resolve_direct_source_candidates" &&
  row.blockedItems === 1)) {
  fail("rows 13-17 must be direct-source decisions");
}
if (!checklist.executionRows.slice(17).every((row) =>
  row.actionType === "source_fit_packet_rows" &&
  row.executionPhase === "phase_3_fill_source_fit_packet_rows" &&
  row.blockedItems === 60)) {
  fail("rows 18-20 must be source-fit packet actions");
}

const executionBlocked = checklist.executionRows.reduce((sum, row) => sum + (row.blockedItems || 0), 0);
if (executionBlocked !== 257) fail("execution row blocked total drift");

if (!Array.isArray(checklist.reviewerStartChecklist) || checklist.reviewerStartChecklist.length < 6) fail("reviewer start checklist too thin");
if (!Array.isArray(checklist.commands) || !checklist.commands.some((command) => /check:knowledge-first-reviewer-execution-checklist/.test(command))) {
  fail("commands must include execution checklist check");
}

const boundaryText = `${checklist.boundary || ""} ${checklist.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "absorbed local course material",
  "public/wikipedia/official source-fit review rows",
  "20 first reviewer actions",
  "257 first-handoff work items",
  "72 high-risk reviewer notes",
  "5 direct-source decisions",
  "180 source-fit packet rows",
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
  executionChecklistStatus: checklist.executionChecklistStatus,
  executionRowCount: checklist.executionRowCount,
  requiredWorkItems: checklist.requiredWorkItems,
  readyWorkItems: checklist.readyWorkItems,
  blockedWorkItems: checklist.blockedWorkItems,
  highRiskReviewerNoteFields: checklist.highRiskReviewerNoteFields,
  directSourceDecisionFields: checklist.directSourceDecisionFields,
  sourceFitReviewRows: checklist.sourceFitReviewRows,
  realHumanInputEntries: checklist.realHumanInputEntries,
  writeAllowedNow: checklist.writeAllowedNow,
}, null, 2));
