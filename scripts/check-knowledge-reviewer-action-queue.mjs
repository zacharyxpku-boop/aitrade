import fs from "node:fs";

const queuePath = "docs/KNOWLEDGE_REVIEWER_ACTION_QUEUE.json";
const queueMdPath = "docs/KNOWLEDGE_REVIEWER_ACTION_QUEUE.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const queue = readJson(queuePath);
if (!fs.existsSync(queueMdPath)) fail(`missing ${queueMdPath}`);

if (queue.educationOnly !== true) fail("queue must keep educationOnly:true");
if (queue.productionReady !== false) fail("queue must keep productionReady:false");
if (queue.learnerFacingRelease !== false) fail("queue must keep learnerFacingRelease:false");
if (queue.approvalStatus !== "not_approved") fail("queue must remain not_approved");
if (queue.queueStatus !== "knowledge_reviewer_action_queue_ready_blocked_on_real_input") fail(`unexpected queueStatus: ${queue.queueStatus}`);
if (queue.queueMode !== "unified_high_risk_source_fit_direct_source_review_actions") fail("unexpected queueMode");
if (queue.readinessStatus !== "knowledge_base_internal_review_ready_release_blocked") fail("readiness status drift");
if (queue.knowledgeBaseUsefulnessStatus !== "usable_as_internal_reviewer_knowledge_base_not_learner_course") {
  fail("knowledge base usefulness status drift");
}
if (queue.modules !== 12 || queue.internalNavigationReadyModules !== 12) fail("module navigation counts drift");
if (queue.totalActionRows !== 52) fail(`expected 52 action rows, got ${queue.totalActionRows}`);
if (queue.highRiskLessonActions !== 12) fail("expected 12 high-risk lesson actions");
if (queue.directSourceDecisionActions !== 5) fail("expected 5 direct-source decision actions");
if (queue.sourceFitPacketActions !== 35) fail("expected 35 source-fit packet actions");
if (queue.blockedWorkItems !== 1715 || queue.readyWorkItems !== 0) fail("blocked/ready work item counts drift");
if (queue.sourceFitReviewRows !== 1638 || queue.highRiskReviewerNotes !== 72 || queue.directSourceDecisions !== 5) {
  fail("source-fit/high-risk work item counts drift");
}
if (
  queue.realHumanInputEntries !== 0 ||
  queue.learnerCitationApprovedRows !== 0 ||
  queue.learnerReleaseReadyModules !== 0
) {
  fail("queue must not claim real human input or learner release approval");
}
if (queue.writeAllowedNow !== false || queue.manualAuthorizationRequired !== true) fail("write gate must remain locked");

if (!Array.isArray(queue.firstActionRows) || queue.firstActionRows.length !== 20) fail("expected 20 first action rows");
if (!Array.isArray(queue.moduleRows) || queue.moduleRows.length !== 12) fail("expected 12 module rows");
if (!Array.isArray(queue.commands) || !queue.commands.some((command) => /check:knowledge-reviewer-action-queue/.test(command))) {
  fail("commands must include action queue check");
}

const actions = queue.actionRows;
if (!Array.isArray(actions) || actions.length !== 52) fail("actionRows array must contain 52 actions");
const typeCounts = actions.reduce((acc, row) => {
  acc[row.actionType] = (acc[row.actionType] || 0) + 1;
  return acc;
}, {});
if (typeCounts.high_risk_lesson_reviewer_notes !== 12) fail("high-risk action count drift");
if (typeCounts.direct_source_candidate_decision !== 5) fail("direct-source action count drift");
if (typeCounts.source_fit_packet_rows !== 35) fail("source-fit packet action count drift");

if (!actions.every((row, index) =>
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
  row.realHumanInput === false &&
  /reviewer/i.test(row.reviewerInstruction || "")
)) {
  fail("action row readiness/boundary drift");
}

const totalBlocked = actions.reduce((sum, row) => sum + (row.blockedItems || 0), 0);
const totalReady = actions.reduce((sum, row) => sum + (row.readyItems || 0), 0);
if (totalBlocked !== 1715 || totalReady !== 0) fail("action row item totals drift");

if (!actions.slice(0, 12).every((row) => row.actionType === "high_risk_lesson_reviewer_notes" && row.blockedItems === 6)) {
  fail("first 12 actions must be high-risk lesson note actions");
}
if (!actions.slice(12, 17).every((row) => row.actionType === "direct_source_candidate_decision" && row.blockedItems === 1)) {
  fail("actions 13-17 must be direct-source decisions");
}
if (!actions.slice(17).every((row) => row.actionType === "source_fit_packet_rows" && row.blockedItems >= 1 && row.blockedItems <= 60)) {
  fail("remaining actions must be source-fit packet rows");
}

const moduleBlockedTotal = queue.moduleRows.reduce((sum, row) => sum + (row.blockedItems || 0), 0);
const moduleActionTotal = queue.moduleRows.reduce((sum, row) => sum + (row.blockedActionRows || 0), 0);
if (moduleBlockedTotal !== 1715 || moduleActionTotal !== 52) fail("module queue totals drift");
if (!queue.moduleRows.every((row) =>
  row.module &&
  row.blockedActionRows >= 1 &&
  row.blockedItems >= row.blockedActionRows &&
  row.firstActionId &&
  row.firstActionType &&
  row.firstInputPath &&
  row.reviewStatus === "blocked_missing_real_reviewer_input"
)) {
  fail("module row action summary drift");
}

const boundaryText = `${queue.boundary || ""} ${queue.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "absorbed local course evidence",
  "public/wikipedia/official source-fit rows",
  "12 high-risk lesson note actions",
  "5 direct-source decisions",
  "35 source-fit packet actions",
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
  queueStatus: queue.queueStatus,
  totalActionRows: queue.totalActionRows,
  blockedWorkItems: queue.blockedWorkItems,
  highRiskLessonActions: queue.highRiskLessonActions,
  directSourceDecisionActions: queue.directSourceDecisionActions,
  sourceFitPacketActions: queue.sourceFitPacketActions,
  realHumanInputEntries: queue.realHumanInputEntries,
  writeAllowedNow: queue.writeAllowedNow,
}, null, 2));
