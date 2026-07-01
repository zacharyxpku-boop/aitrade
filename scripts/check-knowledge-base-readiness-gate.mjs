import fs from "node:fs";

const gatePath = "docs/KNOWLEDGE_BASE_READINESS_GATE.json";
const gateMdPath = "docs/KNOWLEDGE_BASE_READINESS_GATE.md";

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
if (gate.readinessStatus !== "knowledge_base_internal_review_ready_release_blocked") fail(`unexpected readinessStatus: ${gate.readinessStatus}`);
if (gate.knowledgeBaseUsefulnessStatus !== "usable_as_internal_reviewer_knowledge_base_not_learner_course") {
  fail("unexpected usefulness status");
}
if (gate.gateMode !== "local_folder_public_source_source_fit_high_risk_release_gate") fail("unexpected gateMode");
if (gate.localPhysicalFiles !== 302 || gate.localUniquePdfHashes !== 298 || gate.localMappedUniquePdfFiles !== 298 || gate.localUnmappedUniquePdfFiles !== 0) {
  fail("local course absorption counts drift");
}
if (gate.localDocumentNodeMatches !== 2375) fail("local document-node match count drift");
if (gate.publicCorpusDocuments !== 1196 || gate.wikipediaDocuments !== 96 || gate.officialLikeDocuments !== 202) {
  fail("public source counts drift");
}
if (gate.publicMappedDocuments !== 1196 || gate.publicDocumentNodeMatches !== 9568) fail("public source mapping counts drift");
if (gate.knowledgeNodes !== 360 || gate.moduleGroundedNodes !== 360 || gate.directTriangulatedNodes !== 87) {
  fail("knowledge node grounding counts drift");
}
if (gate.sourceFitReviewRows !== 1638 || gate.readySourceFitReviewRows !== 0 || gate.blockedSourceFitReviewRows !== 1638) {
  fail("source-fit review readiness drift");
}
if (gate.realHumanInputEntries !== 0) fail("gate must not claim real human input");
if (gate.highRiskLessons !== 12 || gate.highRiskReadyReviewerNotes !== 0 || gate.highRiskBlockedReviewerNotes !== 72) {
  fail("high-risk reviewer note counts drift");
}
if (gate.highRiskReadyDirectSourceDecisions !== 0 || gate.highRiskBlockedDirectSourceDecisions !== 5) {
  fail("high-risk direct-source decision counts drift");
}
if (gate.packetHandoffCoverage !== "35/35" || gate.reviewerCanStartNow !== true) fail("reviewer launch coverage drift");
if (gate.internalReadyGates !== 5 || gate.learnerFacingBlockedGates !== 5) fail("gate row summary drift");
if (gate.writeAllowedNow !== false || gate.manualAuthorizationRequired !== true) fail("write gate must remain locked");

if (!Array.isArray(gate.gateRows) || gate.gateRows.length !== 5) fail("expected 5 gate rows");
if (!gate.gateRows.every((row) =>
  row.id &&
  row.label &&
  row.passedForInternalReview === true &&
  row.learnerFacingBlocked === true &&
  row.evidence &&
  row.nextGate
)) {
  fail("gate row readiness/boundary drift");
}
if (!Array.isArray(gate.nextActionQueue) || gate.nextActionQueue.length !== 5) fail("expected 5 blocked next actions");
if (!gate.nextActionQueue.some((row) => /1638_real_reviewer_source_fit_rows/.test(row.nextGate))) {
  fail("next action queue must include source-fit real review work");
}
if (!gate.nextActionQueue.some((row) => /72_real_reviewer_notes/.test(row.nextGate))) {
  fail("next action queue must include high-risk reviewer notes");
}
if (!Array.isArray(gate.commands) || !gate.commands.some((command) => /check:knowledge-base-readiness-gate/.test(command))) {
  fail("commands must include readiness gate check");
}

const boundaryText = `${gate.boundary || ""} ${gate.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "local private course absorption",
  "public/wikipedia/official source coverage",
  "does not generate real reviewer notes",
  "approve learner-facing citations",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "production readiness",
  "all real human source-fit rows",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  readinessStatus: gate.readinessStatus,
  knowledgeBaseUsefulnessStatus: gate.knowledgeBaseUsefulnessStatus,
  localMappedUniquePdfFiles: gate.localMappedUniquePdfFiles,
  publicMappedDocuments: gate.publicMappedDocuments,
  moduleGroundedNodes: gate.moduleGroundedNodes,
  sourceFitReviewRows: gate.sourceFitReviewRows,
  readySourceFitReviewRows: gate.readySourceFitReviewRows,
  highRiskReadyReviewerNotes: gate.highRiskReadyReviewerNotes,
  realHumanInputEntries: gate.realHumanInputEntries,
  writeAllowedNow: gate.writeAllowedNow,
}, null, 2));
