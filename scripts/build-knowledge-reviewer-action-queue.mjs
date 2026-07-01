import fs from "node:fs";

const moduleCockpitPath = "docs/KNOWLEDGE_MODULE_REVIEW_COCKPIT.json";
const sourceFitQueuePath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_EXECUTION_QUEUE.json";
const highRiskCockpitPath = "docs/LOCAL_COURSE_HIGH_RISK_REVIEW_COCKPIT.json";
const readinessGatePath = "docs/KNOWLEDGE_BASE_READINESS_GATE.json";
const outputJsonPath = "docs/KNOWLEDGE_REVIEWER_ACTION_QUEUE.json";
const outputMdPath = "docs/KNOWLEDGE_REVIEWER_ACTION_QUEUE.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
  if (artifact.writeAllowedNow !== false) fail(`${name} must not allow writes`);
}

function evidenceSamples(row) {
  return (row.publicRefSamples || row.publicReplacementRefSamples || row.sampleRows || [])
    .slice(0, 3)
    .map((item) => ({
      name: item.name || item.sourceName || item.title || "",
      url: item.url || "",
      family: item.family || "",
      excerptPolicy: item.excerptPolicy || "",
    }));
}

const moduleCockpit = readJson(moduleCockpitPath);
const sourceFitQueue = readJson(sourceFitQueuePath);
const highRiskCockpit = readJson(highRiskCockpitPath);
const readinessGate = readJson(readinessGatePath);

for (const [name, artifact] of Object.entries({
  moduleCockpit,
  sourceFitQueue,
  highRiskCockpit,
  readinessGate,
})) {
  assertBoundary(name, artifact);
}

const actionRows = [];

for (const row of highRiskCockpit.lessonRows || []) {
  actionRows.push({
    queueRank: actionRows.length + 1,
    actionId: `high-risk-lesson-notes:${row.candidateId}`,
    actionType: "high_risk_lesson_reviewer_notes",
    priorityBand: "p0_high_risk_lesson",
    module: row.module,
    topic: row.topic,
    owner: "real_reviewer",
    blockedItems: row.blockedReviewerNotes || row.realReviewerNotesRequired || 6,
    readyItems: row.realReviewerNotesReady || 0,
    targetId: row.candidateId,
    nodeId: row.nodeId,
    lessonId: row.lessonId,
    inputPath: highRiskCockpit.sourceRealReviewerOverlayStarter || "docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json",
    validationCommand: "npm.cmd run check:local-course-high-risk-real-reviewer-overlay-input-validation",
    nextGate: row.nextGate,
    actionLabel: "Fill six real reviewer notes for this high-risk lesson.",
    reviewerInstruction: row.nextReviewerAction,
    evidenceSamples: evidenceSamples(row),
    reviewStatus: "blocked_missing_real_reviewer_input",
    learnerFacingRelease: false,
    writeAllowedNow: false,
    realHumanInput: false,
  });
}

for (const row of highRiskCockpit.directSourceRows || []) {
  actionRows.push({
    queueRank: actionRows.length + 1,
    actionId: `direct-source-decision:${row.sourceResolutionId}`,
    actionType: "direct_source_candidate_decision",
    priorityBand: "p0_direct_source_decision",
    module: row.module,
    topic: row.topic,
    owner: "real_reviewer",
    blockedItems: 1,
    readyItems: row.readyForApprovalGate ? 1 : 0,
    targetId: row.sourceResolutionId,
    nodeId: row.nodeId || "",
    lessonId: row.candidateId || "",
    inputPath: highRiskCockpit.sourceRealReviewerOverlayStarter || "docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json",
    validationCommand: "npm.cmd run check:local-course-high-risk-real-reviewer-overlay-input-validation",
    nextGate: row.nextGate,
    actionLabel: "Decide direct/private source handling.",
    reviewerInstruction: row.nextReviewerAction,
    evidenceSamples: evidenceSamples(row),
    reviewStatus: "blocked_missing_real_reviewer_input",
    learnerFacingRelease: false,
    writeAllowedNow: false,
    realHumanInput: false,
  });
}

for (const batch of sourceFitQueue.batchRows || []) {
  actionRows.push({
    queueRank: actionRows.length + 1,
    actionId: `source-fit-batch:${batch.batchId}`,
    actionType: "source_fit_packet_rows",
    priorityBand: "p1_source_fit_packet",
    module: batch.module,
    topic: "",
    owner: "real_reviewer",
    blockedItems: batch.blockedRows || batch.reviewRows || 0,
    readyItems: batch.readyRows || 0,
    targetId: batch.batchId,
    nodeId: "",
    lessonId: "",
    inputPath: batch.inputPath,
    validationCommand: batch.command,
    nextGate: batch.nextGate,
    actionLabel: `Fill source-fit decisions for ${batch.reviewRows || 0} node/source rows.`,
    reviewerInstruction: "Inspect each node/source pair and fill reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt, and realHumanInput only after real human review.",
    evidenceSamples: evidenceSamples(batch),
    reviewStatus: "blocked_missing_real_reviewer_input",
    learnerFacingRelease: false,
    writeAllowedNow: false,
    realHumanInput: false,
  });
}

actionRows.forEach((row, index) => {
  row.queueRank = index + 1;
});

const moduleMap = new Map();
for (const row of moduleCockpit.moduleRows || []) {
  moduleMap.set(row.module, {
    module: row.module,
    moduleId: row.moduleId,
    sourceFitRows: row.sourceFitRows || 0,
    highRiskLessons: row.highRiskLessons || 0,
    directSourceDecisions: row.directSourceDecisions || 0,
    blockedActionRows: 0,
    blockedItems: 0,
    firstActionId: "",
    firstActionType: "",
    firstInputPath: "",
    reviewStatus: "blocked_missing_real_reviewer_input",
  });
}

for (const action of actionRows) {
  if (!moduleMap.has(action.module)) {
    moduleMap.set(action.module, {
      module: action.module,
      moduleId: "",
      sourceFitRows: 0,
      highRiskLessons: 0,
      directSourceDecisions: 0,
      blockedActionRows: 0,
      blockedItems: 0,
      firstActionId: "",
      firstActionType: "",
      firstInputPath: "",
      reviewStatus: "blocked_missing_real_reviewer_input",
    });
  }
  const moduleRow = moduleMap.get(action.module);
  moduleRow.blockedActionRows += 1;
  moduleRow.blockedItems += action.blockedItems || 0;
  if (!moduleRow.firstActionId) {
    moduleRow.firstActionId = action.actionId;
    moduleRow.firstActionType = action.actionType;
    moduleRow.firstInputPath = action.inputPath || "";
  }
}

const actionQueue = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  queueStatus: "knowledge_reviewer_action_queue_ready_blocked_on_real_input",
  queueMode: "unified_high_risk_source_fit_direct_source_review_actions",
  readinessStatus: readinessGate.readinessStatus,
  knowledgeBaseUsefulnessStatus: readinessGate.knowledgeBaseUsefulnessStatus,
  modules: moduleCockpit.modules,
  internalNavigationReadyModules: moduleCockpit.internalNavigationReadyModules,
  totalActionRows: actionRows.length,
  highRiskLessonActions: highRiskCockpit.lessonRows.length,
  directSourceDecisionActions: highRiskCockpit.directSourceRows.length,
  sourceFitPacketActions: sourceFitQueue.batchRows.length,
  blockedWorkItems: actionRows.reduce((sum, row) => sum + (row.blockedItems || 0), 0),
  readyWorkItems: actionRows.reduce((sum, row) => sum + (row.readyItems || 0), 0),
  sourceFitReviewRows: sourceFitQueue.reviewRows,
  highRiskReviewerNotes: highRiskCockpit.expectedReviewerNotes,
  directSourceDecisions: highRiskCockpit.directSourceDecisionCount,
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  learnerReleaseReadyModules: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  firstActionRows: actionRows.slice(0, 20),
  moduleRows: [...moduleMap.values()].sort((left, right) =>
    (right.blockedItems - left.blockedItems) || left.module.localeCompare(right.module)),
  actionRows,
  commands: [
    "npm.cmd run build:knowledge-reviewer-action-queue",
    "npm.cmd run check:knowledge-reviewer-action-queue",
    "npm.cmd run check:knowledge-module-review-cockpit",
    "npm.cmd run check:knowledge-node-public-source-fit-review-execution-queue",
    "npm.cmd run check:local-course-high-risk-review-cockpit",
    "npm.cmd run verify",
  ],
  completionRule: "This unified queue is complete when every currently blocked real-review task is represented as a reviewer-owned action row: 12 high-risk lesson note actions, 5 direct-source decisions, and 35 source-fit packet actions. It does not complete or generate the real human review itself.",
  boundary: "Knowledge reviewer action queue is reviewer-facing education-only operations. It organizes absorbed local course evidence, public/Wikipedia/official source-fit rows, high-risk lesson notes, and direct-source decisions for real human review; it does not generate reviewer notes, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(actionQueue, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Knowledge Reviewer Action Queue",
  "",
  `- Queue status: ${actionQueue.queueStatus}`,
  `- Actions: ${actionQueue.totalActionRows}`,
  `- Blocked work items: ${actionQueue.blockedWorkItems}`,
  `- High-risk lesson actions: ${actionQueue.highRiskLessonActions}`,
  `- Direct-source decision actions: ${actionQueue.directSourceDecisionActions}`,
  `- Source-fit packet actions: ${actionQueue.sourceFitPacketActions}`,
  `- Real human input entries: ${actionQueue.realHumanInputEntries}`,
  `- Write allowed now: ${actionQueue.writeAllowedNow}`,
  "",
  "## First Actions",
  "",
  "| Rank | Type | Module | Target | Blocked items | Input |",
  "| ---: | --- | --- | --- | ---: | --- |",
  ...actionQueue.firstActionRows.map((row) => `| ${row.queueRank} | ${row.actionType} | ${row.module} | ${row.targetId} | ${row.blockedItems} | ${row.inputPath || ""} |`),
  "",
  "## Module Queue",
  "",
  "| Module | Actions | Blocked items | Source-fit rows | High-risk lessons | Direct decisions | First action |",
  "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
  ...actionQueue.moduleRows.map((row) => `| ${row.module} | ${row.blockedActionRows} | ${row.blockedItems} | ${row.sourceFitRows} | ${row.highRiskLessons} | ${row.directSourceDecisions} | ${row.firstActionId} |`),
  "",
  "## Completion Rule",
  "",
  actionQueue.completionRule,
  "",
  "## Boundary",
  "",
  actionQueue.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  queueStatus: actionQueue.queueStatus,
  totalActionRows: actionQueue.totalActionRows,
  blockedWorkItems: actionQueue.blockedWorkItems,
  highRiskLessonActions: actionQueue.highRiskLessonActions,
  directSourceDecisionActions: actionQueue.directSourceDecisionActions,
  sourceFitPacketActions: actionQueue.sourceFitPacketActions,
  realHumanInputEntries: actionQueue.realHumanInputEntries,
  writeAllowedNow: actionQueue.writeAllowedNow,
}, null, 2));
