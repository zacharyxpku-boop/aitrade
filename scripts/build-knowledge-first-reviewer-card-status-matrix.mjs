import fs from "node:fs";

const workbenchPath = "docs/KNOWLEDGE_FIRST_REVIEWER_WORKBENCH.json";
const completionGatePath = "docs/KNOWLEDGE_FIRST_REVIEWER_COMPLETION_GATE.json";
const highRiskValidationPath = "docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_INPUT_VALIDATION.json";
const packetValidationPaths = [
  "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_INPUT_COPY_TEMPLATE_VALIDATION.json",
  "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE_VALIDATION.json",
  "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_003_INPUT_COPY_TEMPLATE_VALIDATION.json",
];
const outputJsonPath = "docs/KNOWLEDGE_FIRST_REVIEWER_CARD_STATUS_MATRIX.json";
const outputMdPath = "docs/KNOWLEDGE_FIRST_REVIEWER_CARD_STATUS_MATRIX.md";

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

const workbench = readJson(workbenchPath);
const completionGate = readJson(completionGatePath);
const highRiskValidation = readJson(highRiskValidationPath);
const packetValidations = packetValidationPaths.map(readJson);

for (const [label, artifact] of Object.entries({ workbench, completionGate, highRiskValidation })) {
  assertBoundary(label, artifact);
}
packetValidations.forEach((validation, index) => assertBoundary(`packetValidation${index + 1}`, validation));

const validationStatusRows = [
  {
    validationRank: 1,
    validationId: "high_risk_overlay_notes_and_direct_sources",
    inputPath: highRiskValidation.inputPath,
    validationPath: highRiskValidationPath,
    validationStatus: highRiskValidation.validationStatus,
    requiredItems: (highRiskValidation.blockedReviewerNotes || 0) + (highRiskValidation.blockedDirectSourceDecisions || 0),
    readyItems: (highRiskValidation.readyReviewerNotes || 0) + (highRiskValidation.readyDirectSourceDecisions || 0),
    blockedItems: (highRiskValidation.blockedReviewerNotes || 0) + (highRiskValidation.blockedDirectSourceDecisions || 0),
    missingFieldRows: highRiskValidation.missingFieldRows || 0,
    realHumanInputEntries: highRiskValidation.realHumanInputEntries || 0,
  },
  ...packetValidations.map((validation, index) => ({
    validationRank: index + 2,
    validationId: `source_fit_packet_${String(index + 1).padStart(3, "0")}`,
    inputPath: validation.inputPath,
    validationPath: packetValidationPaths[index],
    validationStatus: validation.validationStatus,
    requiredItems: validation.reviewRows || validation.blockedRows || 0,
    readyItems: validation.readyRows || 0,
    blockedItems: validation.blockedRows || 0,
    missingFieldRows: validation.missingFieldRows || 0,
    realHumanInputEntries: validation.realHumanInputEntries || 0,
  })),
];

const cardStatusRows = (workbench.actionCardRows || []).map((card) => ({
  cardRank: card.cardRank,
  queueRank: card.queueRank,
  executionPhase: card.executionPhase,
  actionId: card.actionId,
  actionType: card.actionType,
  module: card.module,
  topic: card.topic,
  targetId: card.targetId,
  nodeId: card.nodeId,
  lessonId: card.lessonId,
  gateId: card.gateId,
  gateStatus: card.gateStatus,
  inputPath: card.inputPath,
  jsonPath: card.jsonPath,
  validationCommand: card.validationCommand,
  requiredItems: card.blockedItems,
  readyItems: 0,
  blockedItems: card.blockedItems,
  missingRequiredFieldGroups: card.blockedItems,
  mappedFieldCount: card.mappedFieldCount,
  notePathCount: card.notePathCount,
  firstNotePath: card.firstNotePath,
  evidenceSamples: card.evidenceSamples || [],
  humanInputStatus: "missing_real_reviewer_input",
  cardStatus: "card_status_blocked_missing_real_input",
  nextGate: card.nextGate,
  nextAction: card.reviewerTask,
  realHumanInputEntries: 0,
  learnerFacingRelease: false,
  writeAllowedNow: false,
}));

const phaseStatusRows = (workbench.phaseRows || []).map((row) => ({
  phaseId: row.phaseId,
  actionRows: row.actionRows,
  requiredItems: row.requiredItems,
  readyItems: 0,
  blockedItems: row.blockedItems,
  nextGate: row.nextGate,
  phaseStatus: "phase_blocked_missing_real_reviewer_input",
}));

const matrix = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  matrixStatus: "first_reviewer_card_status_matrix_ready_all_cards_blocked_on_real_input",
  matrixMode: "per_card_missing_real_input_status_for_20_first_reviewer_cards",
  workbenchStatus: workbench.workbenchStatus,
  completionGateStatus: completionGate.completionGateStatus,
  actionCards: workbench.actionCards,
  cardStatusRows: cardStatusRows.length,
  phaseStatusRows: phaseStatusRows.length,
  validationStatusRows: validationStatusRows.length,
  requiredWorkItems: completionGate.requiredWorkItems,
  readyWorkItems: completionGate.readyWorkItems,
  blockedWorkItems: completionGate.blockedWorkItems,
  highRiskReviewerNoteFields: completionGate.highRiskReviewerNoteFields,
  highRiskReadyReviewerNotes: completionGate.highRiskReadyReviewerNotes,
  highRiskBlockedReviewerNotes: completionGate.highRiskBlockedReviewerNotes,
  directSourceDecisionFields: completionGate.directSourceDecisionFields,
  readyDirectSourceDecisions: completionGate.readyDirectSourceDecisions,
  blockedDirectSourceDecisions: completionGate.blockedDirectSourceDecisions,
  sourceFitReviewRows: completionGate.sourceFitReviewRows,
  readySourceFitReviewRows: completionGate.readySourceFitReviewRows,
  blockedSourceFitReviewRows: completionGate.blockedSourceFitReviewRows,
  missingSourceFitFieldRows: completionGate.missingSourceFitFieldRows,
  validationMissingFieldRows: validationStatusRows.reduce((sum, row) => sum + (row.missingFieldRows || 0), 0),
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  learnerReleaseReadyModules: 0,
  readyForSeparateApproval: false,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  validationRows: validationStatusRows,
  phaseRows: phaseStatusRows,
  cardRows: cardStatusRows,
  nextBestActions: [
    "Fill high-risk reviewer note cards first, then rerun high-risk overlay validation.",
    "Fill direct-source decision cards after checking source dependency and public replacement samples.",
    "Fill source-fit packet card rows only in reviewer-owned packet input copies.",
    "Rerun this matrix after each real reviewer input batch to show ready/blocked drift by card.",
    "Keep learner release and write authorization locked until the separate approval gate passes.",
  ],
  commands: [
    "npm.cmd run build:knowledge-first-reviewer-card-status-matrix",
    "npm.cmd run check:knowledge-first-reviewer-card-status-matrix",
    "npm.cmd run check:knowledge-first-reviewer-workbench",
    "npm.cmd run check:knowledge-first-reviewer-completion-gate",
    "npm.cmd run verify",
  ],
  completionRule: "This first reviewer card status matrix is complete when every first reviewer workbench card has a per-card ready/blocked status, missing real input count, gate, input path, JSON path, evidence sample, and validation command for the 257 first-handoff work items. It does not complete review, generate reviewer notes, approve copied text, approve learner-facing citations, or unlock learner release.",
  boundary: "Knowledge first reviewer card status matrix is reviewer-facing education-only operations material for absorbed local course material and public/Wikipedia/official source-fit review rows. It tracks 20 first reviewer action cards, 257 first-handoff work items, 72 high-risk reviewer notes, 5 direct-source decisions, and 180 source-fit packet rows; it does not generate reviewer notes, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(matrix, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Knowledge First Reviewer Card Status Matrix",
  "",
  `- Matrix status: ${matrix.matrixStatus}`,
  `- Card status rows: ${matrix.cardStatusRows}`,
  `- Ready work items: ${matrix.readyWorkItems}/${matrix.requiredWorkItems}`,
  `- Blocked work items: ${matrix.blockedWorkItems}`,
  `- High-risk reviewer notes: ${matrix.highRiskReadyReviewerNotes}/${matrix.highRiskReviewerNoteFields}`,
  `- Direct-source decisions: ${matrix.readyDirectSourceDecisions}/${matrix.directSourceDecisionFields}`,
  `- Source-fit rows: ${matrix.readySourceFitReviewRows}/${matrix.sourceFitReviewRows}`,
  `- Real human input entries: ${matrix.realHumanInputEntries}`,
  `- Write allowed now: ${matrix.writeAllowedNow}`,
  "",
  "## Phase Status",
  "",
  "| Phase | Actions | Required | Ready | Blocked | Status |",
  "| --- | ---: | ---: | ---: | ---: | --- |",
  ...phaseStatusRows.map((row) => `| ${row.phaseId} | ${row.actionRows} | ${row.requiredItems} | ${row.readyItems} | ${row.blockedItems} | ${row.phaseStatus} |`),
  "",
  "## Validation Status",
  "",
  "| Validation | Required | Ready | Blocked | Missing fields | Status |",
  "| --- | ---: | ---: | ---: | ---: | --- |",
  ...validationStatusRows.map((row) => `| ${row.validationId} | ${row.requiredItems} | ${row.readyItems} | ${row.blockedItems} | ${row.missingFieldRows} | ${row.validationStatus} |`),
  "",
  "## Card Rows",
  "",
  "| Card | Phase | Type | Module | Target | Required | Ready | Blocked | Input | JSON path |",
  "| ---: | --- | --- | --- | --- | ---: | ---: | ---: | --- | --- |",
  ...cardStatusRows.map((row) => `| ${row.cardRank} | ${row.executionPhase} | ${row.actionType} | ${row.module} | ${row.targetId} | ${row.requiredItems} | ${row.readyItems} | ${row.blockedItems} | ${row.inputPath} | ${row.jsonPath} |`),
  "",
  "## Completion Rule",
  "",
  matrix.completionRule,
  "",
  "## Boundary",
  "",
  matrix.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  matrixStatus: matrix.matrixStatus,
  cardStatusRows: matrix.cardStatusRows,
  requiredWorkItems: matrix.requiredWorkItems,
  readyWorkItems: matrix.readyWorkItems,
  blockedWorkItems: matrix.blockedWorkItems,
  highRiskReviewerNoteFields: matrix.highRiskReviewerNoteFields,
  directSourceDecisionFields: matrix.directSourceDecisionFields,
  sourceFitReviewRows: matrix.sourceFitReviewRows,
  realHumanInputEntries: matrix.realHumanInputEntries,
  writeAllowedNow: matrix.writeAllowedNow,
}, null, 2));
