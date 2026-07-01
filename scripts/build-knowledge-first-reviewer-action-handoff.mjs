import fs from "node:fs";

const queuePath = "docs/KNOWLEDGE_REVIEWER_ACTION_QUEUE.json";
const outputJsonPath = "docs/KNOWLEDGE_FIRST_REVIEWER_ACTION_HANDOFF.json";
const outputMdPath = "docs/KNOWLEDGE_FIRST_REVIEWER_ACTION_HANDOFF.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(queue) {
  if (queue.educationOnly !== true) fail("queue must keep educationOnly:true");
  if (queue.productionReady !== false) fail("queue must keep productionReady:false");
  if (queue.learnerFacingRelease !== false) fail("queue must keep learnerFacingRelease:false");
  if (queue.approvalStatus !== "not_approved") fail("queue must remain not_approved");
  if (queue.writeAllowedNow !== false) fail("queue must keep writeAllowedNow:false");
  if (queue.realHumanInputEntries !== 0) fail("queue must not claim real human input");
}

const queue = readJson(queuePath);
assertBoundary(queue);

const actionRows = queue.actionRows || [];
if (actionRows.length !== 52) fail(`expected 52 action rows, got ${actionRows.length}`);

const handoffRows = actionRows.slice(0, 20).map((row, index) => ({
  handoffRank: index + 1,
  queueRank: row.queueRank,
  actionId: row.actionId,
  actionType: row.actionType,
  priorityBand: row.priorityBand,
  module: row.module,
  topic: row.topic,
  owner: row.owner,
  blockedItems: row.blockedItems,
  readyItems: row.readyItems,
  targetId: row.targetId,
  nodeId: row.nodeId,
  lessonId: row.lessonId,
  inputPath: row.inputPath,
  validationCommand: row.validationCommand,
  nextGate: row.nextGate,
  actionLabel: row.actionLabel,
  reviewerInstruction: row.reviewerInstruction,
  evidenceSamples: row.evidenceSamples || [],
  reviewStatus: row.reviewStatus,
  learnerFacingRelease: false,
  writeAllowedNow: false,
  realHumanInput: false,
}));

const typeCounts = handoffRows.reduce((acc, row) => {
  acc[row.actionType] = (acc[row.actionType] || 0) + 1;
  return acc;
}, {});

const sourceFitPacketRows = handoffRows.filter((row) => row.actionType === "source_fit_packet_rows");
const handoff = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  handoffStatus: "first_reviewer_action_handoff_ready_blocked_on_real_input",
  handoffMode: "first_20_actions_high_risk_direct_source_source_fit",
  queueStatus: queue.queueStatus,
  queueMode: queue.queueMode,
  readinessStatus: queue.readinessStatus,
  knowledgeBaseUsefulnessStatus: queue.knowledgeBaseUsefulnessStatus,
  totalQueueActions: queue.totalActionRows,
  totalQueueBlockedWorkItems: queue.blockedWorkItems,
  handoffActionRows: handoffRows.length,
  highRiskLessonActions: typeCounts.high_risk_lesson_reviewer_notes || 0,
  directSourceDecisionActions: typeCounts.direct_source_candidate_decision || 0,
  sourceFitPacketActions: typeCounts.source_fit_packet_rows || 0,
  blockedWorkItems: handoffRows.reduce((sum, row) => sum + (row.blockedItems || 0), 0),
  readyWorkItems: handoffRows.reduce((sum, row) => sum + (row.readyItems || 0), 0),
  highRiskReviewerNotes: handoffRows
    .filter((row) => row.actionType === "high_risk_lesson_reviewer_notes")
    .reduce((sum, row) => sum + (row.blockedItems || 0), 0),
  directSourceDecisions: handoffRows
    .filter((row) => row.actionType === "direct_source_candidate_decision")
    .reduce((sum, row) => sum + (row.blockedItems || 0), 0),
  sourceFitReviewRows: sourceFitPacketRows.reduce((sum, row) => sum + (row.blockedItems || 0), 0),
  sourceFitPacketIds: sourceFitPacketRows.map((row) => row.targetId),
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  learnerReleaseReadyModules: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  firstActionRows: handoffRows,
  reviewerChecklist: [
    "Work from a human-owned copy of the listed inputPath; do not edit generated starter files directly.",
    "For each high-risk lesson action, fill exactly six real reviewer notes only after reading the lesson, Codex self-review, and evidence samples.",
    "For each direct-source action, decide whether private/direct source material remains reviewer-only or is replaced with public context references.",
    "For each source-fit packet row, fill reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt, and realHumanInput only after real review.",
    "Reject or rewrite any note that sounds like a stock recommendation, live signal, return promise, broker workflow, automation, or real-money guidance.",
    "Run the listed validation commands after human input is added, then run the approval gate before any learner-facing citation is considered.",
  ],
  acceptanceGates: [
    "72 high-risk reviewer notes are filled by a real reviewer and pass validation.",
    "5 direct-source candidate decisions are filled by a real reviewer and pass validation.",
    "180 source-fit rows across packets 001-003 are reviewed by a real reviewer and pass validation.",
    "realHumanInput is true only on rows actually reviewed by a human.",
    "writeAllowedNow remains false until a separate approval gate explicitly unlocks a later write/apply step.",
  ],
  commands: [
    "npm.cmd run build:knowledge-first-reviewer-action-handoff",
    "npm.cmd run check:knowledge-first-reviewer-action-handoff",
    "npm.cmd run check:knowledge-reviewer-action-queue",
    "npm.cmd run check:local-course-high-risk-real-reviewer-overlay-input-validation",
    "npm.cmd run validate:knowledge-node-public-source-fit-review-input",
    "npm.cmd run verify",
  ],
  completionRule: "This first reviewer handoff is complete when the first 20 queue actions are frozen into a reviewer-owned execution slice: 12 high-risk lesson note actions, 5 direct-source decisions, and 3 source-fit packet actions covering 257 blocked work items. It does not complete or generate real human review.",
  boundary: "Knowledge first reviewer action handoff is reviewer-facing education-only operations. It packages absorbed local course evidence, public/Wikipedia/official source-fit rows, high-risk lesson notes, direct-source decisions, and source-fit packet rows for real human review; it does not generate reviewer notes, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(handoff, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Knowledge First Reviewer Action Handoff",
  "",
  `- Handoff status: ${handoff.handoffStatus}`,
  `- Queue status: ${handoff.queueStatus}`,
  `- Handoff actions: ${handoff.handoffActionRows}/${handoff.totalQueueActions}`,
  `- Blocked work items in handoff: ${handoff.blockedWorkItems}`,
  `- High-risk lesson actions: ${handoff.highRiskLessonActions}`,
  `- Direct-source decision actions: ${handoff.directSourceDecisionActions}`,
  `- Source-fit packet actions: ${handoff.sourceFitPacketActions}`,
  `- Source-fit packet ids: ${handoff.sourceFitPacketIds.join(", ")}`,
  `- Real human input entries: ${handoff.realHumanInputEntries}`,
  `- Write allowed now: ${handoff.writeAllowedNow}`,
  "",
  "## Action Slice",
  "",
  "| Handoff rank | Queue rank | Type | Module | Target | Blocked items | Input |",
  "| ---: | ---: | --- | --- | --- | ---: | --- |",
  ...handoff.firstActionRows.map((row) => `| ${row.handoffRank} | ${row.queueRank} | ${row.actionType} | ${row.module} | ${row.targetId} | ${row.blockedItems} | ${row.inputPath || ""} |`),
  "",
  "## Reviewer Checklist",
  "",
  ...handoff.reviewerChecklist.map((item) => `- ${item}`),
  "",
  "## Acceptance Gates",
  "",
  ...handoff.acceptanceGates.map((item) => `- ${item}`),
  "",
  "## Completion Rule",
  "",
  handoff.completionRule,
  "",
  "## Boundary",
  "",
  handoff.boundary,
  "",
].join("\n"), "utf8");

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
