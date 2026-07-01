import fs from "node:fs";

const handoffPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_HANDOFF.json";
const handoffMdPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_HANDOFF.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const handoff = readJson(handoffPath);
if (!fs.existsSync(handoffMdPath)) fail(`missing ${handoffMdPath}`);

if (handoff.educationOnly !== true) fail("handoff must keep educationOnly:true");
if (handoff.productionReady !== false) fail("handoff must keep productionReady:false");
if (handoff.learnerFacingRelease !== false) fail("handoff must keep learnerFacingRelease:false");
if (handoff.approvalStatus !== "not_approved") fail("handoff must remain not_approved");
if (handoff.handoffStatus !== "node_public_source_fit_packet_002_handoff_ready_blocked_on_real_input") {
  fail(`unexpected handoffStatus: ${handoff.handoffStatus}`);
}
if (handoff.handoffMode !== "single_packet_reviewer_execution_path") fail("unexpected handoffMode");
if (handoff.packetId !== "node-public-source-fit-batch-002-packet") fail("handoff must target packet 002");
if (!/PACKET_002_INPUT_COPY_TEMPLATE/.test(handoff.inputCopyPath || "")) fail("handoff must expose packet 002 input copy path");
if (handoff.reviewRows !== 60 || handoff.targetNodes !== 10) fail("packet handoff row/node counts drift");
if (handoff.packetReadyRows !== 0 || handoff.packetBlockedRows !== 60 || handoff.packetMissingFieldRows !== 60) {
  fail("packet validation counts drift");
}
if (handoff.packetRealHumanInputEntries !== 0) fail("handoff must not claim real human input");
if (handoff.mergeMappedRows !== 60 || handoff.mergeReadyRows !== 0 || handoff.mergeBlockedRows !== 60) {
  fail("merge preview counts drift");
}
if (handoff.mergeAllowedNow !== false || handoff.mergeDryRunWrittenRows !== 0) fail("merge gates must remain locked");
if (handoff.progressReadyPackets !== 0 || handoff.progressBlockedPackets !== 35) fail("progress packet counts drift");
if (handoff.writeAllowedNow !== false || handoff.manualAuthorizationRequired !== true) fail("write gate must remain locked");

const requiredPhaseIds = [
  "inspect_packet_002_input_copy_template",
  "validate_packet_002_input_copy",
  "rebuild_packet_002_merge_preview",
  "run_packet_002_merge_apply_dry_run",
  "rerun_progress_matrix",
  "rerun_review_gate_dashboard",
];
if (!Array.isArray(handoff.phaseRows) || handoff.phaseRows.length !== requiredPhaseIds.length) {
  fail("phaseRows must contain exactly 6 phases");
}
for (const [index, id] of requiredPhaseIds.entries()) {
  const row = handoff.phaseRows[index];
  if (!row || row.order !== index + 1 || row.id !== id) fail(`phase ${index + 1} must be ${id}`);
  if (!row.status || !row.inputFile || !row.command || !row.reviewerAction || !row.hardStop) {
    fail(`${id} missing executable handoff fields`);
  }
}

if (!Array.isArray(handoff.hardStops) || handoff.hardStops.length < 5) fail("handoff must include hard stops");
const hardStopText = handoff.hardStops.join(" ").toLowerCase();
for (const phrase of [
  "real reviewer",
  "realhumaninput:true",
  "learner-facing citations",
  "exact input path",
  "stock recommendations",
]) {
  if (!hardStopText.includes(phrase)) fail(`hard stops missing phrase: ${phrase}`);
}

if (!Array.isArray(handoff.commands) || handoff.commands.length < 5) fail("handoff must expose verification commands");
for (const phrase of [
  "check:knowledge-node-public-source-fit-review-packet-002-handoff",
  "check:knowledge-node-public-source-fit-review-packet-002-input-copy-template",
  "check:knowledge-node-public-source-fit-review-packet-002-merge-preview",
  "check:knowledge-node-public-source-fit-review-packet-002-merge-apply-report",
  "npm.cmd run verify",
]) {
  if (!handoff.commands.some((command) => command.includes(phrase))) fail(`commands missing ${phrase}`);
}

const boundaryText = `${handoff.boundary || ""} ${handoff.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "does not fill packet rows",
  "does not create human judgments",
  "does not approve learner-facing citations",
  "does not authorize --write",
  "does not write lessons",
  "approve copied text",
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
  educationOnly: handoff.educationOnly,
  productionReady: handoff.productionReady,
  learnerFacingRelease: handoff.learnerFacingRelease,
  approvalStatus: handoff.approvalStatus,
  handoffStatus: handoff.handoffStatus,
  packetId: handoff.packetId,
  phaseRows: handoff.phaseRows.length,
  packetReadyRows: handoff.packetReadyRows,
  packetBlockedRows: handoff.packetBlockedRows,
  mergeDryRunWrittenRows: handoff.mergeDryRunWrittenRows,
  writeAllowedNow: handoff.writeAllowedNow,
}, null, 2));
