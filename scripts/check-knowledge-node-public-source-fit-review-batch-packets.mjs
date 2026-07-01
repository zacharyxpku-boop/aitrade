import fs from "node:fs";

const packetPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_BATCH_PACKETS.json";
const packetMdPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_BATCH_PACKETS.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const packet = readJson(packetPath);
if (!fs.existsSync(packetMdPath)) fail(`missing ${packetMdPath}`);

if (packet.educationOnly !== true) fail("packet must keep educationOnly:true");
if (packet.productionReady !== false) fail("packet must keep productionReady:false");
if (packet.learnerFacingRelease !== false) fail("packet must keep learnerFacingRelease:false");
if (packet.approvalStatus !== "not_approved") fail("packet must remain not_approved");
if (packet.packetStatus !== "node_public_source_fit_review_batch_packets_ready_release_blocked") {
  fail(`unexpected packetStatus: ${packet.packetStatus}`);
}
if (packet.packetMode !== "fillable_batch_packets_for_node_public_source_fit_review") fail("unexpected packetMode");
if (!/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_EXECUTION_QUEUE/.test(packet.sourceQueuePath || "")) fail("missing source queue path");
if (!/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_DRAFT/.test(packet.sourceDraftInputPath || "")) fail("missing source draft path");
if (packet.modules !== 12) fail("expected 12 modules");
if (packet.totalBatches !== 35 || packet.totalPackets !== 35) fail("expected 35 packets");
if (packet.candidateTargetNodes !== 273) fail("candidate target nodes drifted");
if (packet.reviewRows !== 1638) fail("review rows drifted");
if (packet.readyRows !== 0 || packet.blockedRows !== 1638 || packet.missingFieldRows !== 1638) fail("blank packet readiness drifted");
if (
  packet.realHumanInputEntries !== 0 ||
  packet.learnerCitationApprovedRows !== 0 ||
  packet.copiedTextApprovedRows !== 0
) {
  fail("batch packets must not claim real human or learner approval while blank");
}
if (packet.writeAllowedNow !== false || packet.manualAuthorizationRequired !== true) fail("packet must not allow writes");

if (!Array.isArray(packet.firstPriorityPackets) || packet.firstPriorityPackets.length !== 6) fail("expected 6 first priority packets");
if (!Array.isArray(packet.batchPackets) || packet.batchPackets.length !== 35) fail("expected 35 batch packets");

const totalRows = packet.batchPackets.reduce((sum, row) => sum + (row.reviewRows || 0), 0);
const uniquePacketIds = new Set(packet.batchPackets.map((row) => row.packetId));
const uniqueReviewIds = new Set();
if (totalRows !== 1638) fail("packet row total must be 1638");
if (uniquePacketIds.size !== 35) fail("packet IDs must be unique");

for (const batch of packet.batchPackets) {
  if (!batch.packetId || !batch.batchId || !batch.module || !batch.inputPath) fail("batch packet missing identity");
  if (batch.packetStatus !== "blank_batch_packet_ready_for_real_reviewer") fail(`${batch.packetId} must remain blank-ready`);
  if (batch.owner !== "real_reviewer") fail(`${batch.packetId} owner must be real_reviewer`);
  if (batch.reviewRows < 1 || batch.reviewRows > 60) fail(`${batch.packetId} row count out of range`);
  if (batch.readyRows !== 0 || batch.blockedRows !== batch.reviewRows) fail(`${batch.packetId} readiness drift`);
  if (!Array.isArray(batch.packetRows) || batch.packetRows.length !== batch.reviewRows) fail(`${batch.packetId} rows mismatch`);
  if (!Array.isArray(batch.acceptanceChecks) || batch.acceptanceChecks.length < 4) fail(`${batch.packetId} acceptance checks too thin`);
  if (!/validate:knowledge-node-public-source-fit-review-input/.test(batch.command || "")) fail(`${batch.packetId} missing validation command`);
  for (const row of batch.packetRows) {
    if (!row.reviewId || !row.nodeId || !row.documentId || !row.url || !row.name) fail(`${batch.packetId} row missing identity`);
    if (uniqueReviewIds.has(row.reviewId)) fail(`duplicate review row ${row.reviewId}`);
    uniqueReviewIds.add(row.reviewId);
    if (!Number.isInteger(row.inputRowIndex) || row.inputRowIndex < 0) fail(`${row.reviewId} missing input row index`);
    for (const field of ["reviewerDecision", "sourceFitNotes", "citationUse", "reviewerName", "reviewedAt"]) {
      if (!row.fillableFields?.[field]?.startsWith(`/rows/${row.inputRowIndex}/`)) fail(`${row.reviewId} missing pointer for ${field}`);
    }
    if (row.fixedFields?.learnerCitationApproved !== false || row.fixedFields?.copiedTextApproved !== false || row.fixedFields?.realHumanInput !== false) {
      fail(`${row.reviewId} must not approve citation/copy or claim human input`);
    }
    if (row.reviewStatus !== "blocked_missing_real_reviewer_input") fail(`${row.reviewId} must remain blocked`);
  }
}
if (uniqueReviewIds.size !== 1638) fail("review IDs must cover 1638 unique rows");

if (!Array.isArray(packet.commands) || !packet.commands.some((item) => item.includes("check:knowledge-node-public-source-fit-review-batch-packets"))) {
  fail("commands missing batch packet check");
}

const boundaryText = `${packet.boundary || ""} ${packet.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "all 1638 node public source-fit rows",
  "blank scaffolding only",
  "do not create human judgments",
  "approve sources",
  "copied text",
  "learner-facing citations",
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
  educationOnly: packet.educationOnly,
  productionReady: packet.productionReady,
  learnerFacingRelease: packet.learnerFacingRelease,
  approvalStatus: packet.approvalStatus,
  packetStatus: packet.packetStatus,
  totalPackets: packet.totalPackets,
  reviewRows: packet.reviewRows,
  readyRows: packet.readyRows,
  blockedRows: packet.blockedRows,
  realHumanInputEntries: packet.realHumanInputEntries,
  writeAllowedNow: packet.writeAllowedNow,
}, null, 2));
