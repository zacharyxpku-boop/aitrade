import fs from "node:fs";

const handoffPath = "docs/KNOWLEDGE_FIRST_REVIEWER_ACTION_HANDOFF.json";
const fieldMapPath = "docs/KNOWLEDGE_FIRST_REVIEWER_FIELD_MAP.json";
const completionGatePath = "docs/KNOWLEDGE_FIRST_REVIEWER_COMPLETION_GATE.json";
const sprintPlanPath = "docs/KNOWLEDGE_MODULE_REVIEW_SPRINT_PLAN.json";
const outputJsonPath = "docs/KNOWLEDGE_FIRST_REVIEWER_EXECUTION_CHECKLIST.json";
const outputMdPath = "docs/KNOWLEDGE_FIRST_REVIEWER_EXECUTION_CHECKLIST.md";

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

const handoff = readJson(handoffPath);
const fieldMap = readJson(fieldMapPath);
const completionGate = readJson(completionGatePath);
const sprintPlan = readJson(sprintPlanPath);

for (const [label, artifact] of Object.entries({ handoff, fieldMap, completionGate, sprintPlan })) {
  assertBoundary(label, artifact);
}

const fieldRowsByAction = new Map((fieldMap.fieldRows || []).map((row) => [row.actionId, row]));
const executionRows = (handoff.firstActionRows || []).map((action) => {
  const fieldRow = fieldRowsByAction.get(action.actionId) || {};
  const executionPhase = action.actionType === "high_risk_lesson_reviewer_notes"
    ? "phase_1_fill_high_risk_reviewer_notes"
    : action.actionType === "direct_source_candidate_decision"
      ? "phase_2_resolve_direct_source_candidates"
      : "phase_3_fill_source_fit_packet_rows";
  return {
    executionRank: action.handoffRank,
    queueRank: action.queueRank,
    executionPhase,
    actionId: action.actionId,
    actionType: action.actionType,
    module: action.module,
    topic: action.topic,
    targetId: action.targetId,
    nodeId: action.nodeId,
    lessonId: action.lessonId,
    blockedItems: action.blockedItems || 0,
    readyItems: action.readyItems || 0,
    inputPath: fieldRow.draftPath || fieldRow.packetInputPath || action.inputPath,
    jsonPath: fieldRow.jsonPath || "",
    mappedFieldCount: fieldRow.mappedFieldCount || action.blockedItems || 0,
    validationCommand: action.validationCommand,
    nextGate: action.nextGate,
    reviewerTask: fieldRow.reviewerTask || action.reviewerInstruction,
    evidenceSamples: (action.evidenceSamples || []).slice(0, 3),
    reviewStatus: "execution_blocked_missing_real_reviewer_input",
    realHumanInputEntries: 0,
    learnerFacingRelease: false,
    writeAllowedNow: false,
  };
});

const inputPaths = completionGate.inputPaths || fieldMap.inputPaths || [];
const validationPaths = completionGate.validationPaths || [];
const stageRows = [
  {
    stageRank: 1,
    stageId: "preflight_open_input_copies",
    label: "Open the four reviewer-owned input copies",
    requiredItems: inputPaths.length,
    readyItems: inputPaths.filter((file) => fs.existsSync(file)).length,
    blockedItems: inputPaths.filter((file) => !fs.existsSync(file)).length,
    nextAction: "Confirm every input copy exists before any reviewer writes into it.",
    reviewStatus: "execution_preflight_ready",
  },
  {
    stageRank: 2,
    stageId: "fill_high_risk_reviewer_notes",
    label: "Fill 72 high-risk reviewer notes",
    requiredItems: completionGate.highRiskReviewerNoteFields,
    readyItems: completionGate.highRiskReadyReviewerNotes,
    blockedItems: completionGate.highRiskBlockedReviewerNotes,
    nextAction: "Fill every mapped realReviewerNotes slot in the high-risk overlay draft, then rerun overlay validation.",
    reviewStatus: "execution_blocked_missing_real_reviewer_input",
  },
  {
    stageRank: 3,
    stageId: "resolve_direct_source_decisions",
    label: "Resolve 5 direct-source decisions",
    requiredItems: completionGate.directSourceDecisionFields,
    readyItems: completionGate.readyDirectSourceDecisions,
    blockedItems: completionGate.blockedDirectSourceDecisions,
    nextAction: "Fill every directSourceDecisionRows decision without approving learner-facing citations.",
    reviewStatus: "execution_blocked_missing_real_reviewer_input",
  },
  {
    stageRank: 4,
    stageId: "fill_source_fit_packets_001_003",
    label: "Fill 180 source-fit rows in packets 001-003",
    requiredItems: completionGate.sourceFitReviewRows,
    readyItems: completionGate.readySourceFitReviewRows,
    blockedItems: completionGate.blockedSourceFitReviewRows,
    nextAction: "Fill packet rows with reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt, and realHumanInput.",
    reviewStatus: "execution_blocked_missing_real_reviewer_input",
  },
  {
    stageRank: 5,
    stageId: "run_validation_and_keep_release_locked",
    label: "Run validation and keep release locked",
    requiredItems: completionGate.requiredWorkItems,
    readyItems: completionGate.readyWorkItems,
    blockedItems: completionGate.blockedWorkItems,
    nextAction: "Rerun completion gate and keep learner release blocked until a separate approval gate passes.",
    reviewStatus: "execution_blocked_before_separate_approval",
  },
];

const checklist = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  executionChecklistStatus: "first_reviewer_execution_checklist_ready_blocked_on_real_input",
  executionChecklistMode: "day_one_20_actions_257_work_items_execution_sequence",
  handoffStatus: handoff.handoffStatus,
  fieldMapStatus: fieldMap.fieldMapStatus,
  completionGateStatus: completionGate.completionGateStatus,
  sprintPlanStatus: sprintPlan.sprintPlanStatus,
  handoffActionRows: handoff.handoffActionRows,
  mappedActionRows: fieldMap.mappedActionRows,
  executionRowCount: executionRows.length,
  requiredWorkItems: completionGate.requiredWorkItems,
  readyWorkItems: completionGate.readyWorkItems,
  blockedWorkItems: completionGate.blockedWorkItems,
  highRiskLessonActions: handoff.highRiskLessonActions,
  highRiskReviewerNoteFields: completionGate.highRiskReviewerNoteFields,
  highRiskReadyReviewerNotes: completionGate.highRiskReadyReviewerNotes,
  highRiskBlockedReviewerNotes: completionGate.highRiskBlockedReviewerNotes,
  directSourceDecisionActions: handoff.directSourceDecisionActions,
  directSourceDecisionFields: completionGate.directSourceDecisionFields,
  readyDirectSourceDecisions: completionGate.readyDirectSourceDecisions,
  blockedDirectSourceDecisions: completionGate.blockedDirectSourceDecisions,
  sourceFitPacketActions: handoff.sourceFitPacketActions,
  sourceFitReviewRows: completionGate.sourceFitReviewRows,
  readySourceFitReviewRows: completionGate.readySourceFitReviewRows,
  blockedSourceFitReviewRows: completionGate.blockedSourceFitReviewRows,
  firstSprintBlockedWorkItems: sprintPlan.firstSprintBlockedWorkItems,
  totalReviewerBacklogWorkItems: sprintPlan.totalBlockedWorkItems,
  inputPaths,
  validationPaths,
  stageRows,
  executionRows,
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  learnerReleaseReadyModules: 0,
  readyForSeparateApproval: false,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  reviewerStartChecklist: [
    "Use only the four reviewer-owned input copies listed in inputPaths.",
    "Start with the 12 high-risk lesson actions before source-fit packets.",
    "Fill direct-source decisions after checking public replacement samples and source dependency risk.",
    "Fill packets 001-003 source-fit rows only after inspecting each node/source pair.",
    "Run every validation command and rebuild the completion gate after real reviewer input is saved.",
    "Do not unlock learner-facing release without a separate approval gate after all 257 items are ready.",
  ],
  commands: [
    "npm.cmd run build:knowledge-first-reviewer-execution-checklist",
    "npm.cmd run check:knowledge-first-reviewer-execution-checklist",
    "npm.cmd run check:knowledge-first-reviewer-action-handoff",
    "npm.cmd run check:knowledge-first-reviewer-field-map",
    "npm.cmd run check:knowledge-first-reviewer-completion-gate",
    "npm.cmd run check:knowledge-module-review-sprint-plan",
    "npm.cmd run verify",
  ],
  completionRule: "This first reviewer execution checklist is complete when the first 20 handoff actions are sequenced into day-one execution stages with the four input copies, four validation outputs, 72 high-risk reviewer note fields, 5 direct-source decision fields, 180 source-fit packet rows, and the 257-item completion gate. It does not complete review, generate reviewer notes, approve copied text, approve learner-facing citations, or unlock learner release.",
  boundary: "Knowledge first reviewer execution checklist is reviewer-facing education-only operations material for absorbed local course material and public/Wikipedia/official source-fit review rows. It organizes 20 first reviewer actions, 257 first-handoff work items, 72 high-risk reviewer notes, 5 direct-source decisions, and 180 source-fit packet rows; it does not generate reviewer notes, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(checklist, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Knowledge First Reviewer Execution Checklist",
  "",
  `- Execution checklist status: ${checklist.executionChecklistStatus}`,
  `- Actions sequenced: ${checklist.executionRows}/${checklist.handoffActionRows}`,
  `- Ready work items: ${checklist.readyWorkItems}/${checklist.requiredWorkItems}`,
  `- Blocked work items: ${checklist.blockedWorkItems}`,
  `- High-risk reviewer notes: ${checklist.highRiskReadyReviewerNotes}/${checklist.highRiskReviewerNoteFields}`,
  `- Direct-source decisions: ${checklist.readyDirectSourceDecisions}/${checklist.directSourceDecisionFields}`,
  `- Source-fit rows: ${checklist.readySourceFitReviewRows}/${checklist.sourceFitReviewRows}`,
  `- Real human input entries: ${checklist.realHumanInputEntries}`,
  `- Write allowed now: ${checklist.writeAllowedNow}`,
  "",
  "## Stage Rows",
  "",
  "| Stage | Label | Required | Ready | Blocked | Status | Next action |",
  "| ---: | --- | ---: | ---: | ---: | --- | --- |",
  ...stageRows.map((row) => `| ${row.stageRank} | ${row.label} | ${row.requiredItems} | ${row.readyItems} | ${row.blockedItems} | ${row.reviewStatus} | ${row.nextAction} |`),
  "",
  "## First Execution Rows",
  "",
  "| Rank | Phase | Type | Module | Target | Fields | Input | JSON path |",
  "| ---: | --- | --- | --- | --- | ---: | --- | --- |",
  ...executionRows.map((row) => `| ${row.executionRank} | ${row.executionPhase} | ${row.actionType} | ${row.module} | ${row.targetId} | ${row.mappedFieldCount} | ${row.inputPath} | ${row.jsonPath} |`),
  "",
  "## Reviewer Start Checklist",
  "",
  ...checklist.reviewerStartChecklist.map((item) => `- ${item}`),
  "",
  "## Completion Rule",
  "",
  checklist.completionRule,
  "",
  "## Boundary",
  "",
  checklist.boundary,
  "",
].join("\n"), "utf8");

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
