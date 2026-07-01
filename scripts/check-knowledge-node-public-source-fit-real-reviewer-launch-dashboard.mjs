import fs from "node:fs";

const dashboardPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REAL_REVIEWER_LAUNCH_DASHBOARD.json";
const dashboardMdPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REAL_REVIEWER_LAUNCH_DASHBOARD.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const dashboard = readJson(dashboardPath);
if (!fs.existsSync(dashboardMdPath)) fail(`missing ${dashboardMdPath}`);

if (dashboard.educationOnly !== true) fail("dashboard must keep educationOnly:true");
if (dashboard.productionReady !== false) fail("dashboard must keep productionReady:false");
if (dashboard.learnerFacingRelease !== false) fail("dashboard must keep learnerFacingRelease:false");
if (dashboard.approvalStatus !== "not_approved") fail("dashboard must remain not_approved");
if (dashboard.launchStatus !== "source_fit_real_reviewer_launch_ready_blocked_on_real_input") {
  fail(`unexpected launchStatus: ${dashboard.launchStatus}`);
}
if (dashboard.launchMode !== "first_packet_real_reviewer_execution_start") fail("unexpected launchMode");
if (dashboard.reviewerCanStartNow !== true) fail("reviewerCanStartNow must be true");
if (dashboard.writeAllowedNow !== false || dashboard.manualAuthorizationRequired !== true) {
  fail("write gate must remain locked");
}
if (dashboard.packetHandoffCoverage !== "35/35") fail("packet handoff coverage drift");
if (dashboard.packetHandoffsReady !== 35 || dashboard.totalPackets !== 35) fail("packet counts drift");
if (dashboard.packetsWithInputCopyTemplate !== 35) fail("input copy template count drift");
if (dashboard.readyPackets !== 0 || dashboard.blockedPackets !== 35) fail("packet readiness drift");
if (
  dashboard.totalReviewRows !== 1638 ||
  dashboard.readyRows !== 0 ||
  dashboard.blockedRows !== 1638 ||
  dashboard.missingFieldRows !== 1638
) {
  fail("global row readiness drift");
}
if (dashboard.realHumanInputEntries !== 0) fail("dashboard must not claim real human input");
if (!dashboard.startPacket || dashboard.startPacket.packetId !== "node-public-source-fit-batch-001-packet") {
  fail("start packet must be packet 001");
}
if (!/PACKET_001_INPUT_COPY_TEMPLATE/.test(dashboard.startPacket.inputCopyPath || "")) {
  fail("start packet input copy path missing packet 001");
}
if (!/PACKET_001_HANDOFF/.test(dashboard.startPacket.handoffPath || "")) {
  fail("start packet handoff path missing packet 001");
}
if (dashboard.startPacketReviewRows !== 60 || dashboard.startPacketReadyRows !== 0 || dashboard.startPacketBlockedRows !== 60) {
  fail("start packet row counts drift");
}
if (dashboard.startPacketMissingFieldRows !== 60 || dashboard.startPacketRealHumanInputEntries !== 0) {
  fail("start packet input readiness drift");
}
if (dashboard.startPacket.mergePreviewStatus !== "packet_merge_preview_blocked_missing_ready_packet_input") {
  fail("merge preview status drift");
}
if (dashboard.startPacket.mergeApplyStatus !== "blocked_no_ready_merge_rows") fail("merge apply status drift");
if (dashboard.startPacket.mergeMappedRows !== 60 || dashboard.startPacket.mergeMissingTargetRows !== 0) {
  fail("merge preview mapping drift");
}
if (dashboard.startPacket.mergeAllowedNow !== false || dashboard.startPacket.dryRunWrittenRows !== 0) {
  fail("merge/write gates drift");
}

const expectedEditableFields = [
  "reviewerDecision",
  "sourceFitNotes",
  "citationUse",
  "reviewerName",
  "reviewedAt",
  "realHumanInput",
];
if (!Array.isArray(dashboard.editableReviewerFields) || dashboard.editableReviewerFields.join("|") !== expectedEditableFields.join("|")) {
  fail("editable reviewer field policy drift");
}
for (const locked of ["learnerCitationApproved:false", "copiedTextApproved:false", "writeAllowedNow:false"]) {
  if (!dashboard.lockedFields?.includes(locked)) fail(`locked field missing: ${locked}`);
}
if (!Array.isArray(dashboard.fieldPolicyRows) || dashboard.fieldPolicyRows.length !== 6) fail("field policy rows drift");
if (!dashboard.fieldPolicyRows.every((row) => row.field && row.reviewerAction && row.gate)) {
  fail("field policy row missing required text");
}
if (!Array.isArray(dashboard.dayOneChecklist) || dashboard.dayOneChecklist.length !== 8) fail("day-one checklist drift");
if (!dashboard.dayOneChecklist.some((item) => /all 60 packet rows/i.test(item))) fail("checklist missing 60-row review");
if (!dashboard.dayOneChecklist.some((item) => /learnerCitationApproved/i.test(item))) fail("checklist missing locked citation field");
if (!Array.isArray(dashboard.commands) || dashboard.commands.length !== 8) fail("commands drift");
for (const pattern of [
  /validate:knowledge-node-public-source-fit-review-packet-input-copy-template/,
  /check:knowledge-node-public-source-fit-review-packet-merge-preview/,
  /apply:knowledge-node-public-source-fit-review-packet-merge/,
  /check:knowledge-node-public-source-fit-review-packet-handoff-index/,
]) {
  if (!dashboard.commands.some((item) => pattern.test(item))) fail(`command missing: ${pattern}`);
}
if (!Array.isArray(dashboard.hardStops) || dashboard.hardStops.length < 6) fail("hard stops drift");

const boundaryText = `${dashboard.boundary || ""} ${dashboard.completionRule || ""} ${dashboard.hardStops.join(" ")}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "all 35 source-fit packet handoffs",
  "does not generate human decisions",
  "approve copied text",
  "approve learner-facing citations",
  "authorize writes",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "production readiness",
  "all 60 rows",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  launchStatus: dashboard.launchStatus,
  launchMode: dashboard.launchMode,
  packetHandoffCoverage: dashboard.packetHandoffCoverage,
  startPacket: dashboard.startPacket.packetId,
  startPacketReviewRows: dashboard.startPacketReviewRows,
  readyRows: dashboard.readyRows,
  blockedRows: dashboard.blockedRows,
  realHumanInputEntries: dashboard.realHumanInputEntries,
  writeAllowedNow: dashboard.writeAllowedNow,
}, null, 2));
