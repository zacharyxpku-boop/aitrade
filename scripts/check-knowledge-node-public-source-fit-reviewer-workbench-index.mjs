import fs from "node:fs";

const indexPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEWER_WORKBENCH_INDEX.json";
const indexMdPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEWER_WORKBENCH_INDEX.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const index = readJson(indexPath);
if (!fs.existsSync(indexMdPath)) fail(`missing ${indexMdPath}`);

if (index.educationOnly !== true) fail("index must keep educationOnly:true");
if (index.productionReady !== false) fail("index must keep productionReady:false");
if (index.learnerFacingRelease !== false) fail("index must keep learnerFacingRelease:false");
if (index.approvalStatus !== "not_approved") fail("index must remain not_approved");
if (index.workbenchIndexStatus !== "source_fit_reviewer_workbench_index_ready_all_packets_blocked_on_real_input") {
  fail(`unexpected workbenchIndexStatus: ${index.workbenchIndexStatus}`);
}
if (index.workbenchIndexMode !== "all_packet_readonly_review_navigation") fail("unexpected workbenchIndexMode");
if (index.totalPackets !== 35) fail(`expected 35 packets, got ${index.totalPackets}`);
if (index.packetsWithHandoff !== 35) fail("handoff coverage drift");
if (index.packetsWithInputCopyTemplate !== 35) fail("input copy template coverage drift");
if (index.packetsWithValidation !== 35) fail("validation coverage drift");
if (index.packetsWithDetailedRowBrowser !== 1) fail("detailed row browser count drift");
if (index.modules !== 12) fail(`expected 12 modules, got ${index.modules}`);
if (index.totalReviewRows !== 1638 || index.readyRows !== 0 || index.blockedRows !== 1638 || index.missingFieldRows !== 1638) {
  fail("global row readiness drift");
}
if (index.realHumanInputEntries !== 0) fail("index must not claim real human input");
if (index.learnerCitationApprovedRows !== 0 || index.copiedTextApprovedRows !== 0) {
  fail("index must not claim learner citation or copied text approval");
}
if (index.writeAllowedNow !== false || index.manualAuthorizationRequired !== true) fail("write gate must remain locked");
if (index.firstBlockedPacketId !== "node-public-source-fit-batch-001-packet") fail("first blocked packet drift");

if (!Array.isArray(index.packetRows) || index.packetRows.length !== 35) fail("packetRows must contain 35 packets");
for (const [offset, row] of index.packetRows.entries()) {
  const packetNumber = String(offset + 1).padStart(3, "0");
  if (row.order !== offset + 1 || row.packetNumber !== packetNumber) fail(`packet ${packetNumber} order drift`);
  if (row.packetId !== `node-public-source-fit-batch-${packetNumber}-packet`) fail(`packet ${packetNumber} id drift`);
  if (!row.batchId || !row.module || !row.inputCopyPath || !row.templatePath || !row.validationPath || !row.handoffPath) {
    fail(`packet ${packetNumber} missing paths`);
  }
  if (row.targetNodes <= 0 || row.reviewRows <= 0) fail(`packet ${packetNumber} counts missing`);
  if (row.readyRows !== 0 || row.blockedRows !== row.reviewRows || row.missingFieldRows !== row.reviewRows) {
    fail(`packet ${packetNumber} readiness drift`);
  }
  if (row.invalidDecisionRows !== 0 || row.forbiddenHitRows !== 0 || row.realHumanInputEntries !== 0) {
    fail(`packet ${packetNumber} validation drift`);
  }
  if (row.learnerCitationApprovedRows !== 0 || row.copiedTextApprovedRows !== 0) {
    fail(`packet ${packetNumber} approval drift`);
  }
  if (row.validationStatus !== "blocked_missing_real_reviewer_source_fit_input") {
    fail(`packet ${packetNumber} validation status drift`);
  }
  if (row.reviewStatus !== "blocked_missing_real_reviewer_input") fail(`packet ${packetNumber} review status drift`);
  if (!Array.isArray(row.sampleRows) || row.sampleRows.length === 0 || row.sampleRows.length > 6) {
    fail(`packet ${packetNumber} sample rows drift`);
  }
  if (packetNumber === "001" && row.hasDetailedRowBrowser !== true) fail("packet 001 detailed browser missing");
  if (packetNumber !== "001" && row.hasDetailedRowBrowser !== false) fail(`packet ${packetNumber} detailed browser drift`);
}

if (!Array.isArray(index.moduleRows) || index.moduleRows.length !== 12) fail("moduleRows must contain 12 modules");
const modulePacketTotal = index.moduleRows.reduce((sum, row) => sum + row.packets, 0);
const moduleReviewTotal = index.moduleRows.reduce((sum, row) => sum + row.reviewRows, 0);
if (modulePacketTotal !== 35) fail("module packet total drift");
if (moduleReviewTotal !== 1638) fail("module review total drift");
for (const row of index.moduleRows) {
  if (!row.module || row.packets <= 0 || row.reviewRows <= 0) fail("module row missing identity/counts");
  if (row.readyRows !== 0 || row.blockedRows !== row.reviewRows || row.realHumanInputEntries !== 0) {
    fail(`module ${row.module} readiness drift`);
  }
  if (row.reviewStatus !== "blocked_missing_real_reviewer_input") fail(`module ${row.module} review status drift`);
}

if (!Array.isArray(index.commands) || index.commands.length < 6) fail("commands missing");
for (const pattern of [
  /build:knowledge-node-public-source-fit-reviewer-workbench-index/,
  /check:knowledge-node-public-source-fit-reviewer-workbench-index/,
  /check:knowledge-node-public-source-fit-packet-001-reviewer-workbench/,
  /check:knowledge-node-public-source-fit-review-packet-handoff-index/,
]) {
  if (!index.commands.some((item) => pattern.test(item))) fail(`command missing: ${pattern}`);
}

const boundaryText = `${index.boundary || ""} ${index.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "all 35 source-fit packets",
  "readonly all-packet navigation",
  "1638 rows remain blocked",
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
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  workbenchIndexStatus: index.workbenchIndexStatus,
  totalPackets: index.totalPackets,
  packetsWithValidation: index.packetsWithValidation,
  modules: index.modules,
  totalReviewRows: index.totalReviewRows,
  readyRows: index.readyRows,
  blockedRows: index.blockedRows,
  realHumanInputEntries: index.realHumanInputEntries,
  writeAllowedNow: index.writeAllowedNow,
}, null, 2));
