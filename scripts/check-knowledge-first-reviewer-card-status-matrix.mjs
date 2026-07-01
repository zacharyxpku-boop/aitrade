import fs from "node:fs";

const matrixPath = "docs/KNOWLEDGE_FIRST_REVIEWER_CARD_STATUS_MATRIX.json";
const matrixMdPath = "docs/KNOWLEDGE_FIRST_REVIEWER_CARD_STATUS_MATRIX.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const matrix = readJson(matrixPath);
if (!fs.existsSync(matrixMdPath)) fail(`missing ${matrixMdPath}`);

if (matrix.educationOnly !== true) fail("matrix must keep educationOnly:true");
if (matrix.productionReady !== false) fail("matrix must keep productionReady:false");
if (matrix.learnerFacingRelease !== false) fail("matrix must keep learnerFacingRelease:false");
if (matrix.approvalStatus !== "not_approved") fail("matrix must remain not_approved");
if (matrix.matrixStatus !== "first_reviewer_card_status_matrix_ready_all_cards_blocked_on_real_input") fail("unexpected matrixStatus");
if (matrix.matrixMode !== "per_card_missing_real_input_status_for_20_first_reviewer_cards") fail("unexpected matrixMode");
if (matrix.workbenchStatus !== "first_reviewer_workbench_ready_blocked_on_real_input") fail("workbench status drift");
if (matrix.completionGateStatus !== "first_reviewer_completion_gate_blocked_missing_real_input") fail("completion gate status drift");
if (matrix.actionCards !== 20 || matrix.cardStatusRows !== 20) fail("expected 20 action cards/status rows");
if (matrix.phaseStatusRows !== 3) fail("expected 3 phase status rows");
if (matrix.validationStatusRows !== 4) fail("expected 4 validation status rows");
if (matrix.requiredWorkItems !== 257 || matrix.readyWorkItems !== 0 || matrix.blockedWorkItems !== 257) fail("work item totals drift");
if (matrix.highRiskReviewerNoteFields !== 72 || matrix.highRiskReadyReviewerNotes !== 0 || matrix.highRiskBlockedReviewerNotes !== 72) {
  fail("high-risk note totals drift");
}
if (matrix.directSourceDecisionFields !== 5 || matrix.readyDirectSourceDecisions !== 0 || matrix.blockedDirectSourceDecisions !== 5) {
  fail("direct-source decision totals drift");
}
if (matrix.sourceFitReviewRows !== 180 || matrix.readySourceFitReviewRows !== 0 || matrix.blockedSourceFitReviewRows !== 180) {
  fail("source-fit row totals drift");
}
if (
  matrix.realHumanInputEntries !== 0 ||
  matrix.learnerCitationApprovedRows !== 0 ||
  matrix.learnerReleaseReadyModules !== 0 ||
  matrix.readyForSeparateApproval !== false
) {
  fail("matrix must not claim real input, citation approval, learner release, or separate approval");
}
if (matrix.writeAllowedNow !== false || matrix.manualAuthorizationRequired !== true) fail("write gate drift");

if (!Array.isArray(matrix.validationRows) || matrix.validationRows.length !== 4) fail("validation rows missing");
if (!matrix.validationRows.every((row, index) =>
  row.validationRank === index + 1 &&
  row.validationId &&
  row.inputPath &&
  row.validationPath &&
  row.validationStatus &&
  row.requiredItems === row.readyItems + row.blockedItems &&
  row.readyItems === 0 &&
  row.blockedItems > 0 &&
  row.realHumanInputEntries === 0 &&
  fs.existsSync(row.inputPath) &&
  fs.existsSync(row.validationPath)
)) {
  fail("validation status row drift");
}
const validationRequired = matrix.validationRows.reduce((sum, row) => sum + (row.requiredItems || 0), 0);
const validationBlocked = matrix.validationRows.reduce((sum, row) => sum + (row.blockedItems || 0), 0);
if (validationRequired !== 257 || validationBlocked !== 257) fail("validation row totals drift");

if (!Array.isArray(matrix.phaseRows) || matrix.phaseRows.length !== 3) fail("phase rows missing");
const [highRiskPhase, directPhase, sourceFitPhase] = matrix.phaseRows;
if (
  highRiskPhase.phaseId !== "phase_1_fill_high_risk_reviewer_notes" ||
  highRiskPhase.actionRows !== 12 ||
  highRiskPhase.requiredItems !== 72 ||
  highRiskPhase.readyItems !== 0 ||
  highRiskPhase.blockedItems !== 72 ||
  highRiskPhase.phaseStatus !== "phase_blocked_missing_real_reviewer_input"
) {
  fail("high-risk phase row drift");
}
if (
  directPhase.phaseId !== "phase_2_resolve_direct_source_candidates" ||
  directPhase.actionRows !== 5 ||
  directPhase.requiredItems !== 5 ||
  directPhase.readyItems !== 0 ||
  directPhase.blockedItems !== 5 ||
  directPhase.phaseStatus !== "phase_blocked_missing_real_reviewer_input"
) {
  fail("direct-source phase row drift");
}
if (
  sourceFitPhase.phaseId !== "phase_3_fill_source_fit_packet_rows" ||
  sourceFitPhase.actionRows !== 3 ||
  sourceFitPhase.requiredItems !== 180 ||
  sourceFitPhase.readyItems !== 0 ||
  sourceFitPhase.blockedItems !== 180 ||
  sourceFitPhase.phaseStatus !== "phase_blocked_missing_real_reviewer_input"
) {
  fail("source-fit phase row drift");
}

if (!Array.isArray(matrix.cardRows) || matrix.cardRows.length !== 20) fail("expected 20 card rows");
if (!matrix.cardRows.every((row, index) =>
  row.cardRank === index + 1 &&
  row.queueRank >= 1 &&
  row.executionPhase &&
  row.actionId &&
  row.actionType &&
  row.module &&
  row.targetId &&
  row.gateId &&
  row.gateStatus &&
  row.inputPath &&
  row.jsonPath &&
  row.validationCommand &&
  row.requiredItems === row.readyItems + row.blockedItems &&
  row.readyItems === 0 &&
  row.blockedItems > 0 &&
  row.missingRequiredFieldGroups === row.blockedItems &&
  row.mappedFieldCount === row.requiredItems &&
  Array.isArray(row.evidenceSamples) &&
  row.evidenceSamples.length >= 1 &&
  row.humanInputStatus === "missing_real_reviewer_input" &&
  row.cardStatus === "card_status_blocked_missing_real_input" &&
  row.nextGate &&
  row.nextAction &&
  row.realHumanInputEntries === 0 &&
  row.learnerFacingRelease === false &&
  row.writeAllowedNow === false
)) {
  fail("card status row drift");
}
if (!matrix.cardRows.slice(0, 12).every((row) =>
  row.actionType === "high_risk_lesson_reviewer_notes" &&
  row.executionPhase === "phase_1_fill_high_risk_reviewer_notes" &&
  row.gateId === "high_risk_reviewer_notes" &&
  row.requiredItems === 6 &&
  row.notePathCount === 6 &&
  row.firstNotePath)) {
  fail("first 12 card rows must be high-risk note cards");
}
if (!matrix.cardRows.slice(12, 17).every((row) =>
  row.actionType === "direct_source_candidate_decision" &&
  row.executionPhase === "phase_2_resolve_direct_source_candidates" &&
  row.gateId === "direct_source_decisions" &&
  row.requiredItems === 1)) {
  fail("cards 13-17 must be direct-source cards");
}
if (!matrix.cardRows.slice(17).every((row) =>
  row.actionType === "source_fit_packet_rows" &&
  row.executionPhase === "phase_3_fill_source_fit_packet_rows" &&
  row.gateId === "source_fit_packets_001_003" &&
  row.requiredItems === 60)) {
  fail("cards 18-20 must be source-fit packet cards");
}

const cardRequired = matrix.cardRows.reduce((sum, row) => sum + (row.requiredItems || 0), 0);
const cardBlocked = matrix.cardRows.reduce((sum, row) => sum + (row.blockedItems || 0), 0);
if (cardRequired !== 257 || cardBlocked !== 257) fail("card row totals drift");

if (!Array.isArray(matrix.nextBestActions) || matrix.nextBestActions.length < 5) fail("next best actions too thin");
if (!Array.isArray(matrix.commands) || !matrix.commands.some((command) => /check:knowledge-first-reviewer-card-status-matrix/.test(command))) {
  fail("commands must include card status matrix check");
}

const boundaryText = `${matrix.boundary || ""} ${matrix.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "absorbed local course material",
  "public/wikipedia/official source-fit review rows",
  "20 first reviewer action cards",
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
