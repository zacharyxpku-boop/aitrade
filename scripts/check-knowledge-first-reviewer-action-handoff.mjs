import fs from "node:fs";

const handoffPath = "docs/KNOWLEDGE_FIRST_REVIEWER_ACTION_HANDOFF.json";
const handoffMdPath = "docs/KNOWLEDGE_FIRST_REVIEWER_ACTION_HANDOFF.md";
const queuePath = "docs/KNOWLEDGE_REVIEWER_ACTION_QUEUE.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const handoff = readJson(handoffPath);
const queue = readJson(queuePath);
if (!fs.existsSync(handoffMdPath)) fail(`missing ${handoffMdPath}`);

if (handoff.educationOnly !== true) fail("handoff must keep educationOnly:true");
if (handoff.productionReady !== false) fail("handoff must keep productionReady:false");
if (handoff.learnerFacingRelease !== false) fail("handoff must keep learnerFacingRelease:false");
if (handoff.approvalStatus !== "not_approved") fail("handoff must remain not_approved");
if (handoff.handoffStatus !== "first_reviewer_action_handoff_ready_blocked_on_real_input") fail("unexpected handoffStatus");
if (handoff.handoffMode !== "first_20_actions_high_risk_direct_source_source_fit") fail("unexpected handoffMode");
if (handoff.queueStatus !== "knowledge_reviewer_action_queue_ready_blocked_on_real_input") fail("queue status drift");
if (handoff.queueMode !== "unified_high_risk_source_fit_direct_source_review_actions") fail("queue mode drift");
if (handoff.readinessStatus !== "knowledge_base_internal_review_ready_release_blocked") fail("readiness status drift");
if (handoff.knowledgeBaseUsefulnessStatus !== "usable_as_internal_reviewer_knowledge_base_not_learner_course") {
  fail("knowledge base usefulness status drift");
}

if (handoff.totalQueueActions !== 52 || queue.totalActionRows !== 52) fail("queue action count drift");
if (handoff.totalQueueBlockedWorkItems !== 1715 || queue.blockedWorkItems !== 1715) fail("queue blocked work drift");
if (handoff.handoffActionRows !== 20) fail("expected 20 handoff actions");
if (handoff.highRiskLessonActions !== 12) fail("expected 12 high-risk lesson handoff actions");
if (handoff.directSourceDecisionActions !== 5) fail("expected 5 direct-source handoff actions");
if (handoff.sourceFitPacketActions !== 3) fail("expected 3 source-fit packet handoff actions");
if (handoff.blockedWorkItems !== 257 || handoff.readyWorkItems !== 0) fail("handoff work item totals drift");
if (handoff.highRiskReviewerNotes !== 72 || handoff.directSourceDecisions !== 5 || handoff.sourceFitReviewRows !== 180) {
  fail("handoff work breakdown drift");
}
if (
  handoff.realHumanInputEntries !== 0 ||
  handoff.learnerCitationApprovedRows !== 0 ||
  handoff.learnerReleaseReadyModules !== 0
) {
  fail("handoff must not claim real human input or learner release approval");
}
if (handoff.writeAllowedNow !== false || handoff.manualAuthorizationRequired !== true) fail("handoff write gate must stay locked");

if (!Array.isArray(handoff.firstActionRows) || handoff.firstActionRows.length !== 20) fail("expected 20 first action rows");
if (!Array.isArray(handoff.reviewerChecklist) || handoff.reviewerChecklist.length < 6) fail("reviewer checklist too thin");
if (!Array.isArray(handoff.acceptanceGates) || handoff.acceptanceGates.length < 5) fail("acceptance gates too thin");
if (!Array.isArray(handoff.commands) || !handoff.commands.some((command) => /check:knowledge-first-reviewer-action-handoff/.test(command))) {
  fail("commands must include first reviewer action handoff check");
}

if (!handoff.firstActionRows.every((row, index) =>
  row.handoffRank === index + 1 &&
  row.queueRank === index + 1 &&
  row.actionId &&
  row.actionType &&
  row.priorityBand &&
  row.module &&
  row.owner === "real_reviewer" &&
  row.blockedItems > 0 &&
  row.readyItems === 0 &&
  row.targetId &&
  row.inputPath &&
  row.validationCommand &&
  row.reviewStatus === "blocked_missing_real_reviewer_input" &&
  row.learnerFacingRelease === false &&
  row.writeAllowedNow === false &&
  row.realHumanInput === false
)) {
  fail("handoff action row boundary drift");
}

if (!handoff.firstActionRows.slice(0, 12).every((row) =>
  row.actionType === "high_risk_lesson_reviewer_notes" && row.blockedItems === 6)) {
  fail("first 12 handoff actions must be high-risk lesson note actions");
}
if (!handoff.firstActionRows.slice(12, 17).every((row) =>
  row.actionType === "direct_source_candidate_decision" && row.blockedItems === 1)) {
  fail("handoff actions 13-17 must be direct-source decisions");
}
if (!handoff.firstActionRows.slice(17, 20).every((row) =>
  row.actionType === "source_fit_packet_rows" && row.blockedItems === 60)) {
  fail("handoff actions 18-20 must be 60-row source-fit packets");
}
if ((handoff.sourceFitPacketIds || []).join(",") !== "node-public-source-fit-batch-001,node-public-source-fit-batch-002,node-public-source-fit-batch-003") {
  fail("source-fit packet ids drift");
}

const queueFirstIds = (queue.actionRows || []).slice(0, 20).map((row) => row.actionId).join("|");
const handoffIds = handoff.firstActionRows.map((row) => row.actionId).join("|");
if (queueFirstIds !== handoffIds) fail("handoff rows must match queue first 20 actions");

const boundaryText = `${handoff.boundary || ""} ${handoff.completionRule || ""} ${handoff.reviewerChecklist.join(" ")} ${handoff.acceptanceGates.join(" ")}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "absorbed local course evidence",
  "public/wikipedia/official source-fit rows",
  "12 high-risk lesson note actions",
  "5 direct-source decisions",
  "3 source-fit packet actions",
  "does not generate reviewer notes",
  "approve copied text",
  "approve learner-facing citations",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  handoffStatus: handoff.handoffStatus,
  handoffActionRows: handoff.handoffActionRows,
  blockedWorkItems: handoff.blockedWorkItems,
  highRiskLessonActions: handoff.highRiskLessonActions,
  directSourceDecisionActions: handoff.directSourceDecisionActions,
  sourceFitPacketActions: handoff.sourceFitPacketActions,
  realHumanInputEntries: handoff.realHumanInputEntries,
  writeAllowedNow: handoff.writeAllowedNow,
}, null, 2));
