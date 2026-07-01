import fs from "node:fs";

const coursePathAuditPath = "docs/KNOWLEDGE_COURSE_PATH_READINESS_AUDIT.json";
const reviewerActionQueuePath = "docs/KNOWLEDGE_REVIEWER_ACTION_QUEUE.json";
const progressMatrixPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PROGRESS_MATRIX.json";
const firstCompletionGatePath = "docs/KNOWLEDGE_FIRST_REVIEWER_COMPLETION_GATE.json";
const outputJsonPath = "docs/KNOWLEDGE_MODULE_REVIEW_SPRINT_PLAN.json";
const outputMdPath = "docs/KNOWLEDGE_MODULE_REVIEW_SPRINT_PLAN.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(label, artifact) {
  if (artifact.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
  if (artifact.writeAllowedNow !== false) fail(`${label} must keep writeAllowedNow:false`);
}

const coursePathAudit = readJson(coursePathAuditPath);
const reviewerActionQueue = readJson(reviewerActionQueuePath);
const progressMatrix = readJson(progressMatrixPath);
const firstCompletionGate = readJson(firstCompletionGatePath);

for (const [label, artifact] of Object.entries({
  coursePathAudit,
  reviewerActionQueue,
  progressMatrix,
  firstCompletionGate,
})) {
  assertBoundary(label, artifact);
}

const actionByModule = new Map((reviewerActionQueue.moduleRows || []).map((row) => [row.module, row]));
const progressByModule = new Map((progressMatrix.moduleRows || []).map((row) => [row.module, row]));

const sprintRows = (coursePathAudit.pathRows || []).map((pathRow) => {
  const actionRow = actionByModule.get(pathRow.module) || {};
  const progressRow = progressByModule.get(pathRow.module) || {};
  const sourceFitRows = progressRow.reviewRows ?? pathRow.sourceFitRows ?? actionRow.sourceFitRows ?? 0;
  const readySourceFitRows = progressRow.readyRows ?? pathRow.readySourceFitRows ?? 0;
  const blockedSourceFitRows = progressRow.blockedRows ?? pathRow.blockedSourceFitRows ?? sourceFitRows;
  const highRiskBlockedLessons = pathRow.highRiskBlockedLessons || actionRow.highRiskLessons || 0;
  const blockedHighRiskNotes = pathRow.blockedHighRiskNotes || 0;
  const directSourceDecisions = pathRow.directSourceDecisions || actionRow.directSourceDecisions || 0;
  const readyDirectSourceDecisions = pathRow.readyDirectSourceDecisions || 0;
  const blockedReasons = [
    ...(blockedSourceFitRows > 0 ? ["source_fit_review_rows_blocked"] : []),
    ...(highRiskBlockedLessons > 0 ? ["high_risk_lessons_blocked"] : []),
    ...(blockedHighRiskNotes > 0 ? ["high_risk_reviewer_notes_blocked"] : []),
    ...(directSourceDecisions > readyDirectSourceDecisions ? ["direct_source_decisions_blocked"] : []),
    "separate_learner_release_approval_missing",
  ];

  return {
    sprintRank: 0,
    sprintPhase: "",
    module: pathRow.module,
    pathId: pathRow.pathId,
    lessonCount: pathRow.lessonCount || 0,
    unitCount: pathRow.unitCount || 0,
    estimatedMinutes: pathRow.estimatedMinutes || 0,
    sourceFitReviewRows: sourceFitRows,
    readySourceFitReviewRows: readySourceFitRows,
    blockedSourceFitReviewRows: blockedSourceFitRows,
    firstBlockedPacketId: progressRow.firstBlockedPacketId || pathRow.firstBlockedPacketId || "",
    highRiskBlockedLessons,
    blockedHighRiskNotes,
    directSourceDecisions,
    readyDirectSourceDecisions,
    blockedActionRows: actionRow.blockedActionRows || 0,
    blockedWorkItems: actionRow.blockedItems || 0,
    readyWorkItems: 0,
    firstActionId: actionRow.firstActionId || "",
    firstActionType: actionRow.firstActionType || "",
    firstInputPath: actionRow.firstInputPath || "",
    nextReviewerAction: pathRow.nextReviewerAction || "fill source-fit rows, high-risk notes, direct-source decisions, and separate release gates",
    learnerPathReleaseReady: false,
    learnerFacingRelease: false,
    realHumanInputEntries: 0,
    learnerCitationApprovedRows: 0,
    writeAllowedNow: false,
    reviewStatus: "module_review_sprint_blocked_missing_real_input",
    blockedReasons,
  };
}).sort((left, right) =>
  Number(right.highRiskBlockedLessons > 0) - Number(left.highRiskBlockedLessons > 0) ||
  (right.blockedWorkItems - left.blockedWorkItems) ||
  (right.blockedSourceFitReviewRows - left.blockedSourceFitReviewRows) ||
  left.module.localeCompare(right.module));

sprintRows.forEach((row, index) => {
  row.sprintRank = index + 1;
  row.sprintPhase = row.highRiskBlockedLessons > 0
    ? "phase_1_high_risk_and_source_fit"
    : row.sprintRank <= 8
      ? "phase_2_source_fit_packets"
      : "phase_3_source_fit_completion";
});

const highRiskSprintModules = sprintRows.filter((row) => row.highRiskBlockedLessons > 0).length;
const sprintPlan = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  sprintPlanStatus: "module_review_sprint_plan_ready_release_blocked",
  sprintPlanMode: "module_priority_plan_for_1715_reviewer_work_items",
  coursePathAuditStatus: coursePathAudit.auditStatus,
  actionQueueStatus: reviewerActionQueue.queueStatus,
  progressMatrixStatus: progressMatrix.matrixStatus,
  firstCompletionGateStatus: firstCompletionGate.completionGateStatus,
  modules: coursePathAudit.modules,
  coursePaths: coursePathAudit.coursePaths,
  sprintRows: sprintRows.length,
  totalReviewerActions: reviewerActionQueue.totalActionRows,
  totalBlockedWorkItems: reviewerActionQueue.blockedWorkItems,
  totalReadyWorkItems: reviewerActionQueue.readyWorkItems,
  firstSprintBlockedWorkItems: firstCompletionGate.blockedWorkItems,
  firstSprintReadyWorkItems: firstCompletionGate.readyWorkItems,
  highRiskSprintModules,
  sourceFitReviewRows: coursePathAudit.sourceFitReviewRows,
  readySourceFitReviewRows: coursePathAudit.readySourceFitReviewRows,
  blockedSourceFitReviewRows: coursePathAudit.blockedSourceFitReviewRows,
  highRiskBlockedLessons: coursePathAudit.highRiskBlockedLessons,
  highRiskBlockedReviewerNotes: coursePathAudit.highRiskBlockedReviewerNotes,
  directSourceDecisions: coursePathAudit.directSourceDecisions,
  readyDirectSourceDecisions: coursePathAudit.readyDirectSourceDecisions,
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  learnerReleaseReadyPaths: coursePathAudit.learnerReleaseReadyPaths,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  firstSprintRows: sprintRows.slice(0, highRiskSprintModules),
  moduleSprintRows: sprintRows,
  nextBestActions: [
    "Run phase 1 on the four modules with high-risk lesson blockers before ordinary source-fit packets.",
    "Use the first sprint completion gate for the first 257 blocked work items: 72 high-risk notes, 5 direct-source decisions, and 180 source-fit rows.",
    "After real reviewer input lands, rerun the source-fit progress matrix, course path audit, and this sprint plan.",
    "Keep learner release blocked until all module rows have real reviewer input and separate approval gates pass.",
  ],
  commands: [
    "npm.cmd run build:knowledge-module-review-sprint-plan",
    "npm.cmd run check:knowledge-module-review-sprint-plan",
    "npm.cmd run check:knowledge-course-path-readiness-audit",
    "npm.cmd run check:knowledge-reviewer-action-queue",
    "npm.cmd run check:knowledge-node-public-source-fit-review-progress-matrix",
    "npm.cmd run verify",
  ],
  completionRule: "This module review sprint plan is complete when all 12 modules are prioritized with module blockers, reviewer action counts, first packet/action pointers, and next reviewer actions for the 1715 reviewer work items. It does not complete review, generate reviewer notes, approve copied text, approve learner-facing citations, or unlock learner release.",
  boundary: "Knowledge module review sprint plan is reviewer-facing education-only governance for absorbed local investment course material and public/Wikipedia/official source-fit rows. It organizes 1715 reviewer work items, 12 high-risk lessons, 72 high-risk reviewer notes, 5 direct-source decisions, and 1638 source-fit rows; it does not generate reviewer notes, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(sprintPlan, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Knowledge Module Review Sprint Plan",
  "",
  `- Sprint plan status: ${sprintPlan.sprintPlanStatus}`,
  `- Modules: ${sprintPlan.modules}`,
  `- Reviewer actions: ${sprintPlan.totalReviewerActions}`,
  `- Blocked work items: ${sprintPlan.totalBlockedWorkItems}`,
  `- First sprint blocked work items: ${sprintPlan.firstSprintBlockedWorkItems}`,
  `- High-risk sprint modules: ${sprintPlan.highRiskSprintModules}`,
  `- Source-fit ready/blocked: ${sprintPlan.readySourceFitReviewRows}/${sprintPlan.blockedSourceFitReviewRows}`,
  `- High-risk lessons: ${sprintPlan.highRiskBlockedLessons}`,
  `- High-risk reviewer notes: ${sprintPlan.highRiskBlockedReviewerNotes}`,
  `- Direct-source decisions ready/total: ${sprintPlan.readyDirectSourceDecisions}/${sprintPlan.directSourceDecisions}`,
  `- Real human input entries: ${sprintPlan.realHumanInputEntries}`,
  `- Write allowed now: ${sprintPlan.writeAllowedNow}`,
  "",
  "## Module Sprint Rows",
  "",
  "| Rank | Phase | Module | Path | Blocked work | Actions | Source-fit ready/blocked | High-risk | Direct | First action | Next |",
  "| ---: | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |",
  ...sprintRows.map((row) => `| ${row.sprintRank} | ${row.sprintPhase} | ${row.module} | ${row.pathId} | ${row.blockedWorkItems} | ${row.blockedActionRows} | ${row.readySourceFitReviewRows}/${row.blockedSourceFitReviewRows} | ${row.highRiskBlockedLessons} | ${row.readyDirectSourceDecisions}/${row.directSourceDecisions} | ${row.firstActionId} | ${row.nextReviewerAction} |`),
  "",
  "## Next Best Actions",
  "",
  ...sprintPlan.nextBestActions.map((item) => `- ${item}`),
  "",
  "## Completion Rule",
  "",
  sprintPlan.completionRule,
  "",
  "## Boundary",
  "",
  sprintPlan.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  sprintPlanStatus: sprintPlan.sprintPlanStatus,
  modules: sprintPlan.modules,
  sprintRows: sprintPlan.sprintRows,
  totalReviewerActions: sprintPlan.totalReviewerActions,
  totalBlockedWorkItems: sprintPlan.totalBlockedWorkItems,
  firstSprintBlockedWorkItems: sprintPlan.firstSprintBlockedWorkItems,
  highRiskSprintModules: sprintPlan.highRiskSprintModules,
  sourceFitReviewRows: sprintPlan.sourceFitReviewRows,
  highRiskBlockedReviewerNotes: sprintPlan.highRiskBlockedReviewerNotes,
  realHumanInputEntries: sprintPlan.realHumanInputEntries,
  writeAllowedNow: sprintPlan.writeAllowedNow,
}, null, 2));
