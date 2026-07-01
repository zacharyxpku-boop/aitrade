import fs from "node:fs";

const gatePath = "docs/KNOWLEDGE_FIRST_REVIEWER_COMPLETION_GATE.json";
const gateMdPath = "docs/KNOWLEDGE_FIRST_REVIEWER_COMPLETION_GATE.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const gate = readJson(gatePath);
if (!fs.existsSync(gateMdPath)) fail(`missing ${gateMdPath}`);

if (gate.educationOnly !== true) fail("gate must keep educationOnly:true");
if (gate.productionReady !== false) fail("gate must keep productionReady:false");
if (gate.learnerFacingRelease !== false) fail("gate must keep learnerFacingRelease:false");
if (gate.approvalStatus !== "not_approved") fail("gate must remain not_approved");
if (gate.completionGateStatus !== "first_reviewer_completion_gate_blocked_missing_real_input") fail("unexpected completionGateStatus");
if (gate.gateMode !== "first_20_actions_257_work_items_completion_gate") fail("unexpected gateMode");
if (gate.fieldMapStatus !== "first_reviewer_field_map_ready_blocked_on_real_input") fail("field map status drift");
if (gate.handoffStatus !== "first_reviewer_action_handoff_ready_blocked_on_real_input") fail("handoff status drift");
if (gate.handoffActionRows !== 20 || gate.mappedActionRows !== 20) fail("first reviewer action count drift");
if (gate.requiredWorkItems !== 257 || gate.readyWorkItems !== 0 || gate.blockedWorkItems !== 257) fail("work item totals drift");
if (gate.highRiskReviewerNoteFields !== 72 || gate.highRiskReadyReviewerNotes !== 0 || gate.highRiskBlockedReviewerNotes !== 72) {
  fail("high-risk reviewer note totals drift");
}
if (gate.directSourceDecisionFields !== 5 || gate.readyDirectSourceDecisions !== 0 || gate.blockedDirectSourceDecisions !== 5) {
  fail("direct-source decision totals drift");
}
if (gate.sourceFitReviewRows !== 180 || gate.readySourceFitReviewRows !== 0 || gate.blockedSourceFitReviewRows !== 180) {
  fail("source-fit review row totals drift");
}
if (gate.missingSourceFitFieldRows !== 180) fail("source-fit missing field totals drift");
if (
  gate.realHumanInputEntries !== 0 ||
  gate.learnerCitationApprovedRows !== 0 ||
  gate.learnerReleaseReadyModules !== 0 ||
  gate.readyForSeparateApproval !== false
) {
  fail("gate must not claim real input, learner approval, release readiness, or separate approval readiness");
}
if (gate.writeAllowedNow !== false || gate.manualAuthorizationRequired !== true) fail("gate write lock drift");

if (!Array.isArray(gate.inputPaths) || gate.inputPaths.length !== 4) fail("expected 4 input paths");
if (!Array.isArray(gate.validationPaths) || gate.validationPaths.length !== 4) fail("expected 4 validation paths");
for (const file of [...gate.inputPaths, ...gate.validationPaths]) {
  if (!fs.existsSync(file)) fail(`gate referenced missing file: ${file}`);
}

if (!Array.isArray(gate.gateRows) || gate.gateRows.length !== 3) fail("expected 3 gate rows");
const [notesGate, directGate, sourceFitGate] = gate.gateRows;
if (
  notesGate.gateId !== "high_risk_reviewer_notes" ||
  notesGate.requiredItems !== 72 ||
  notesGate.readyItems !== 0 ||
  notesGate.blockedItems !== 72 ||
  notesGate.validationStatus !== "blocked_missing_real_reviewer_overlay_input"
) {
  fail("high-risk notes gate row drift");
}
if (
  directGate.gateId !== "direct_source_decisions" ||
  directGate.requiredItems !== 5 ||
  directGate.readyItems !== 0 ||
  directGate.blockedItems !== 5 ||
  directGate.validationStatus !== "blocked_missing_real_reviewer_overlay_input"
) {
  fail("direct-source gate row drift");
}
if (
  sourceFitGate.gateId !== "source_fit_packets_001_003" ||
  sourceFitGate.requiredItems !== 180 ||
  sourceFitGate.readyItems !== 0 ||
  sourceFitGate.blockedItems !== 180 ||
  sourceFitGate.missingFieldRows !== 180 ||
  sourceFitGate.validationStatus !== "blocked_missing_real_reviewer_source_fit_input"
) {
  fail("source-fit gate row drift");
}

if (!Array.isArray(gate.commands) || !gate.commands.some((command) => /check:knowledge-first-reviewer-completion-gate/.test(command))) {
  fail("commands must include completion gate check");
}

const boundaryText = `${gate.boundary || ""} ${gate.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "absorbed local course material",
  "public/wikipedia/official source-fit review rows",
  "257 first-handoff work items",
  "72 high-risk reviewer notes",
  "5 direct-source decisions",
  "180 source-fit packet rows",
  "separate approval gate",
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
  completionGateStatus: gate.completionGateStatus,
  requiredWorkItems: gate.requiredWorkItems,
  readyWorkItems: gate.readyWorkItems,
  blockedWorkItems: gate.blockedWorkItems,
  highRiskReadyReviewerNotes: gate.highRiskReadyReviewerNotes,
  readyDirectSourceDecisions: gate.readyDirectSourceDecisions,
  readySourceFitReviewRows: gate.readySourceFitReviewRows,
  realHumanInputEntries: gate.realHumanInputEntries,
  writeAllowedNow: gate.writeAllowedNow,
}, null, 2));
