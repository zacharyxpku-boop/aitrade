import fs from "node:fs";

const workbenchPath = "docs/KNOWLEDGE_FIRST_REVIEWER_WORKBENCH.json";
const workbenchMdPath = "docs/KNOWLEDGE_FIRST_REVIEWER_WORKBENCH.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const workbench = readJson(workbenchPath);
if (!fs.existsSync(workbenchMdPath)) fail(`missing ${workbenchMdPath}`);

if (workbench.educationOnly !== true) fail("workbench must keep educationOnly:true");
if (workbench.productionReady !== false) fail("workbench must keep productionReady:false");
if (workbench.learnerFacingRelease !== false) fail("workbench must keep learnerFacingRelease:false");
if (workbench.approvalStatus !== "not_approved") fail("workbench must remain not_approved");
if (workbench.workbenchStatus !== "first_reviewer_workbench_ready_blocked_on_real_input") fail("unexpected workbenchStatus");
if (workbench.workbenchMode !== "first_20_action_cards_with_evidence_fields_and_gates") fail("unexpected workbenchMode");
if (workbench.handoffStatus !== "first_reviewer_action_handoff_ready_blocked_on_real_input") fail("handoff status drift");
if (workbench.fieldMapStatus !== "first_reviewer_field_map_ready_blocked_on_real_input") fail("field map status drift");
if (workbench.completionGateStatus !== "first_reviewer_completion_gate_blocked_missing_real_input") fail("completion gate status drift");
if (workbench.executionChecklistStatus !== "first_reviewer_execution_checklist_ready_blocked_on_real_input") fail("execution checklist status drift");
if (workbench.handoffActionRows !== 20 || workbench.mappedActionRows !== 20 || workbench.executionRowCount !== 20 || workbench.actionCards !== 20) {
  fail("first reviewer action/card counts drift");
}
if (workbench.requiredWorkItems !== 257 || workbench.readyWorkItems !== 0 || workbench.blockedWorkItems !== 257) fail("work item totals drift");
if (workbench.highRiskLessonActions !== 12 || workbench.highRiskReviewerNoteFields !== 72 || workbench.highRiskReadyReviewerNotes !== 0 || workbench.highRiskBlockedReviewerNotes !== 72) {
  fail("high-risk workbench totals drift");
}
if (workbench.directSourceDecisionActions !== 5 || workbench.directSourceDecisionFields !== 5 || workbench.readyDirectSourceDecisions !== 0 || workbench.blockedDirectSourceDecisions !== 5) {
  fail("direct-source workbench totals drift");
}
if (workbench.sourceFitPacketActions !== 3 || workbench.sourceFitReviewRows !== 180 || workbench.readySourceFitReviewRows !== 0 || workbench.blockedSourceFitReviewRows !== 180) {
  fail("source-fit workbench totals drift");
}
if (
  workbench.realHumanInputEntries !== 0 ||
  workbench.learnerCitationApprovedRows !== 0 ||
  workbench.learnerReleaseReadyModules !== 0 ||
  workbench.readyForSeparateApproval !== false
) {
  fail("workbench must not claim real input, learner approval, release readiness, or separate approval");
}
if (workbench.writeAllowedNow !== false || workbench.manualAuthorizationRequired !== true) fail("write gate drift");

if (!Array.isArray(workbench.inputPaths) || workbench.inputPaths.length !== 4) fail("expected four input paths");
if (!Array.isArray(workbench.validationPaths) || workbench.validationPaths.length !== 4) fail("expected four validation paths");
for (const file of [...workbench.inputPaths, ...workbench.validationPaths]) {
  if (!fs.existsSync(file)) fail(`referenced file missing: ${file}`);
}

if (!Array.isArray(workbench.stageRows) || workbench.stageRows.length !== 5) fail("expected five stage rows");
if (!Array.isArray(workbench.phaseRows) || workbench.phaseRows.length !== 3) fail("expected three phase rows");
const [highRiskPhase, directPhase, sourceFitPhase] = workbench.phaseRows;
if (
  highRiskPhase.phaseId !== "phase_1_fill_high_risk_reviewer_notes" ||
  highRiskPhase.actionRows !== 12 ||
  highRiskPhase.requiredItems !== 72 ||
  highRiskPhase.readyItems !== 0 ||
  highRiskPhase.blockedItems !== 72 ||
  highRiskPhase.nextGate !== "high_risk_reviewer_notes"
) {
  fail("high-risk phase row drift");
}
if (
  directPhase.phaseId !== "phase_2_resolve_direct_source_candidates" ||
  directPhase.actionRows !== 5 ||
  directPhase.requiredItems !== 5 ||
  directPhase.readyItems !== 0 ||
  directPhase.blockedItems !== 5 ||
  directPhase.nextGate !== "direct_source_decisions"
) {
  fail("direct-source phase row drift");
}
if (
  sourceFitPhase.phaseId !== "phase_3_fill_source_fit_packet_rows" ||
  sourceFitPhase.actionRows !== 3 ||
  sourceFitPhase.requiredItems !== 180 ||
  sourceFitPhase.readyItems !== 0 ||
  sourceFitPhase.blockedItems !== 180 ||
  sourceFitPhase.nextGate !== "source_fit_packets_001_003"
) {
  fail("source-fit phase row drift");
}

if (!Array.isArray(workbench.actionCardRows) || workbench.actionCardRows.length !== 20) fail("expected 20 action card rows");
if (!workbench.actionCardRows.every((row, index) =>
  row.cardRank === index + 1 &&
  row.queueRank >= 1 &&
  row.executionPhase &&
  row.gateId &&
  row.gateStatus &&
  row.actionId &&
  row.actionType &&
  row.priorityBand &&
  row.module &&
  row.targetId &&
  row.inputPath &&
  row.jsonPath &&
  row.mappedFieldCount === row.blockedItems &&
  row.blockedItems > 0 &&
  row.readyItems === 0 &&
  row.validationCommand &&
  row.nextGate &&
  row.reviewerTask &&
  Array.isArray(row.evidenceSamples) &&
  row.evidenceSamples.length >= 1 &&
  row.cardStatus === "workbench_card_blocked_missing_real_reviewer_input" &&
  row.realHumanInputEntries === 0 &&
  row.learnerFacingRelease === false &&
  row.writeAllowedNow === false
)) {
  fail("action card row drift");
}
if (!workbench.actionCardRows.slice(0, 12).every((row) =>
  row.actionType === "high_risk_lesson_reviewer_notes" &&
  row.executionPhase === "phase_1_fill_high_risk_reviewer_notes" &&
  row.gateId === "high_risk_reviewer_notes" &&
  row.blockedItems === 6 &&
  row.notePathCount === 6 &&
  row.firstNotePath)) {
  fail("first 12 workbench cards must be high-risk reviewer note cards");
}
if (!workbench.actionCardRows.slice(12, 17).every((row) =>
  row.actionType === "direct_source_candidate_decision" &&
  row.executionPhase === "phase_2_resolve_direct_source_candidates" &&
  row.gateId === "direct_source_decisions" &&
  row.blockedItems === 1)) {
  fail("cards 13-17 must be direct-source cards");
}
if (!workbench.actionCardRows.slice(17).every((row) =>
  row.actionType === "source_fit_packet_rows" &&
  row.executionPhase === "phase_3_fill_source_fit_packet_rows" &&
  row.gateId === "source_fit_packets_001_003" &&
  row.blockedItems === 60)) {
  fail("cards 18-20 must be source-fit packet cards");
}

const blockedTotal = workbench.actionCardRows.reduce((sum, row) => sum + (row.blockedItems || 0), 0);
if (blockedTotal !== 257) fail("action card blocked item totals drift");

if (!Array.isArray(workbench.reviewerGuardrails) || workbench.reviewerGuardrails.length < 5) fail("reviewer guardrails too thin");
if (!Array.isArray(workbench.commands) || !workbench.commands.some((command) => /check:knowledge-first-reviewer-workbench/.test(command))) {
  fail("commands must include first reviewer workbench check");
}

const boundaryText = `${workbench.boundary || ""} ${workbench.completionRule || ""}`.toLowerCase();
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
  workbenchStatus: workbench.workbenchStatus,
  actionCards: workbench.actionCards,
  requiredWorkItems: workbench.requiredWorkItems,
  readyWorkItems: workbench.readyWorkItems,
  blockedWorkItems: workbench.blockedWorkItems,
  highRiskReviewerNoteFields: workbench.highRiskReviewerNoteFields,
  directSourceDecisionFields: workbench.directSourceDecisionFields,
  sourceFitReviewRows: workbench.sourceFitReviewRows,
  realHumanInputEntries: workbench.realHumanInputEntries,
  writeAllowedNow: workbench.writeAllowedNow,
}, null, 2));
