import fs from "node:fs";

const handoffPath = "docs/KNOWLEDGE_FIRST_REVIEWER_ACTION_HANDOFF.json";
const fieldMapPath = "docs/KNOWLEDGE_FIRST_REVIEWER_FIELD_MAP.json";
const completionGatePath = "docs/KNOWLEDGE_FIRST_REVIEWER_COMPLETION_GATE.json";
const executionChecklistPath = "docs/KNOWLEDGE_FIRST_REVIEWER_EXECUTION_CHECKLIST.json";
const outputJsonPath = "docs/KNOWLEDGE_FIRST_REVIEWER_WORKBENCH.json";
const outputMdPath = "docs/KNOWLEDGE_FIRST_REVIEWER_WORKBENCH.md";

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

function gateIdFor(actionType) {
  if (actionType === "high_risk_lesson_reviewer_notes") return "high_risk_reviewer_notes";
  if (actionType === "direct_source_candidate_decision") return "direct_source_decisions";
  return "source_fit_packets_001_003";
}

const handoff = readJson(handoffPath);
const fieldMap = readJson(fieldMapPath);
const completionGate = readJson(completionGatePath);
const executionChecklist = readJson(executionChecklistPath);

for (const [label, artifact] of Object.entries({ handoff, fieldMap, completionGate, executionChecklist })) {
  assertBoundary(label, artifact);
}

const fieldRowsByAction = new Map((fieldMap.fieldRows || []).map((row) => [row.actionId, row]));
const executionRowsByAction = new Map((executionChecklist.executionRows || []).map((row) => [row.actionId, row]));
const gateRowsById = new Map((completionGate.gateRows || []).map((row) => [row.gateId, row]));

const actionCards = (handoff.firstActionRows || []).map((action) => {
  const fieldRow = fieldRowsByAction.get(action.actionId);
  const executionRow = executionRowsByAction.get(action.actionId);
  if (!fieldRow) fail(`missing field row for ${action.actionId}`);
  if (!executionRow) fail(`missing execution row for ${action.actionId}`);
  const gateId = gateIdFor(action.actionType);
  const gateRow = gateRowsById.get(gateId) || {};

  return {
    cardRank: action.handoffRank,
    queueRank: action.queueRank,
    executionPhase: executionRow.executionPhase,
    gateId,
    gateStatus: gateRow.validationStatus || "",
    actionId: action.actionId,
    actionType: action.actionType,
    priorityBand: action.priorityBand,
    module: action.module,
    topic: action.topic,
    targetId: action.targetId,
    nodeId: action.nodeId,
    lessonId: action.lessonId,
    inputPath: executionRow.inputPath,
    jsonPath: executionRow.jsonPath,
    mappedFieldCount: fieldRow.mappedFieldCount || 0,
    blockedItems: action.blockedItems || 0,
    readyItems: action.readyItems || 0,
    validationCommand: action.validationCommand,
    nextGate: action.nextGate,
    reviewerTask: executionRow.reviewerTask || fieldRow.reviewerTask || action.reviewerInstruction,
    evidenceSamples: (action.evidenceSamples || []).slice(0, 3),
    notePathCount: Array.isArray(fieldRow.notePaths) ? fieldRow.notePaths.length : 0,
    firstNotePath: Array.isArray(fieldRow.notePaths) && fieldRow.notePaths[0] ? fieldRow.notePaths[0].jsonPath : "",
    requiredFields: fieldRow.requiredFields || fieldRow.notePaths?.[0]?.requiredFields || [],
    allowedDecisionValues: fieldRow.allowedDecisionValues || fieldRow.notePaths?.[0]?.allowedDecisionValues || [],
    cardStatus: "workbench_card_blocked_missing_real_reviewer_input",
    realHumanInputEntries: 0,
    learnerFacingRelease: false,
    writeAllowedNow: false,
  };
});

const phaseRows = [
  {
    phaseId: "phase_1_fill_high_risk_reviewer_notes",
    actionRows: actionCards.filter((row) => row.executionPhase === "phase_1_fill_high_risk_reviewer_notes").length,
    requiredItems: actionCards
      .filter((row) => row.executionPhase === "phase_1_fill_high_risk_reviewer_notes")
      .reduce((sum, row) => sum + row.blockedItems, 0),
    readyItems: 0,
    blockedItems: completionGate.highRiskBlockedReviewerNotes,
    nextGate: "high_risk_reviewer_notes",
  },
  {
    phaseId: "phase_2_resolve_direct_source_candidates",
    actionRows: actionCards.filter((row) => row.executionPhase === "phase_2_resolve_direct_source_candidates").length,
    requiredItems: actionCards
      .filter((row) => row.executionPhase === "phase_2_resolve_direct_source_candidates")
      .reduce((sum, row) => sum + row.blockedItems, 0),
    readyItems: 0,
    blockedItems: completionGate.blockedDirectSourceDecisions,
    nextGate: "direct_source_decisions",
  },
  {
    phaseId: "phase_3_fill_source_fit_packet_rows",
    actionRows: actionCards.filter((row) => row.executionPhase === "phase_3_fill_source_fit_packet_rows").length,
    requiredItems: actionCards
      .filter((row) => row.executionPhase === "phase_3_fill_source_fit_packet_rows")
      .reduce((sum, row) => sum + row.blockedItems, 0),
    readyItems: 0,
    blockedItems: completionGate.blockedSourceFitReviewRows,
    nextGate: "source_fit_packets_001_003",
  },
];

const workbench = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  workbenchStatus: "first_reviewer_workbench_ready_blocked_on_real_input",
  workbenchMode: "first_20_action_cards_with_evidence_fields_and_gates",
  handoffStatus: handoff.handoffStatus,
  fieldMapStatus: fieldMap.fieldMapStatus,
  completionGateStatus: completionGate.completionGateStatus,
  executionChecklistStatus: executionChecklist.executionChecklistStatus,
  handoffActionRows: handoff.handoffActionRows,
  mappedActionRows: fieldMap.mappedActionRows,
  executionRowCount: executionChecklist.executionRowCount,
  actionCards: actionCards.length,
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
  inputPaths: executionChecklist.inputPaths || [],
  validationPaths: executionChecklist.validationPaths || [],
  stageRows: executionChecklist.stageRows || [],
  phaseRows,
  actionCardRows: actionCards,
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  learnerReleaseReadyModules: 0,
  readyForSeparateApproval: false,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  reviewerGuardrails: [
    "Use the workbench as navigation only; write real input only into reviewer-owned input copies.",
    "Do not copy Codex self-review, private PDF prose, Wikipedia prose, or public source prose into reviewer notes.",
    "Every card must preserve education-only wording and avoid setup, signal, return, broker, automation, or real-money guidance.",
    "After filling input copies, rerun validation and completion gate before requesting separate approval.",
    "This workbench never unlocks learner release or write authorization by itself.",
  ],
  commands: [
    "npm.cmd run build:knowledge-first-reviewer-workbench",
    "npm.cmd run check:knowledge-first-reviewer-workbench",
    "npm.cmd run check:knowledge-first-reviewer-action-handoff",
    "npm.cmd run check:knowledge-first-reviewer-field-map",
    "npm.cmd run check:knowledge-first-reviewer-execution-checklist",
    "npm.cmd run check:knowledge-first-reviewer-completion-gate",
    "npm.cmd run verify",
  ],
  completionRule: "This first reviewer workbench is complete when all first 20 reviewer actions are represented as action cards with execution phase, gate, input path, JSON path, mapped field count, evidence samples, validation command, and reviewer task for the 257 first-handoff work items. It does not complete review, generate reviewer notes, approve copied text, approve learner-facing citations, or unlock learner release.",
  boundary: "Knowledge first reviewer workbench is reviewer-facing education-only operations material for absorbed local course material and public/Wikipedia/official source-fit review rows. It organizes 20 first reviewer actions, 257 first-handoff work items, 72 high-risk reviewer notes, 5 direct-source decisions, and 180 source-fit packet rows into human-owned work cards; it does not generate reviewer notes, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(workbench, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Knowledge First Reviewer Workbench",
  "",
  `- Workbench status: ${workbench.workbenchStatus}`,
  `- Action cards: ${workbench.actionCards}`,
  `- Ready work items: ${workbench.readyWorkItems}/${workbench.requiredWorkItems}`,
  `- Blocked work items: ${workbench.blockedWorkItems}`,
  `- High-risk reviewer notes: ${workbench.highRiskReadyReviewerNotes}/${workbench.highRiskReviewerNoteFields}`,
  `- Direct-source decisions: ${workbench.readyDirectSourceDecisions}/${workbench.directSourceDecisionFields}`,
  `- Source-fit rows: ${workbench.readySourceFitReviewRows}/${workbench.sourceFitReviewRows}`,
  `- Real human input entries: ${workbench.realHumanInputEntries}`,
  `- Write allowed now: ${workbench.writeAllowedNow}`,
  "",
  "## Phase Rows",
  "",
  "| Phase | Actions | Required | Ready | Blocked | Next gate |",
  "| --- | ---: | ---: | ---: | ---: | --- |",
  ...phaseRows.map((row) => `| ${row.phaseId} | ${row.actionRows} | ${row.requiredItems} | ${row.readyItems} | ${row.blockedItems} | ${row.nextGate} |`),
  "",
  "## Action Cards",
  "",
  "| Card | Phase | Type | Module | Target | Fields | Input | JSON path | Gate |",
  "| ---: | --- | --- | --- | --- | ---: | --- | --- | --- |",
  ...actionCards.map((row) => `| ${row.cardRank} | ${row.executionPhase} | ${row.actionType} | ${row.module} | ${row.targetId} | ${row.mappedFieldCount} | ${row.inputPath} | ${row.jsonPath} | ${row.gateId} |`),
  "",
  "## Reviewer Guardrails",
  "",
  ...workbench.reviewerGuardrails.map((item) => `- ${item}`),
  "",
  "## Completion Rule",
  "",
  workbench.completionRule,
  "",
  "## Boundary",
  "",
  workbench.boundary,
  "",
].join("\n"), "utf8");

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
