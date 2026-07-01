import fs from "node:fs";

const indexPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_HANDOFF_INDEX.json";
const indexMdPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_HANDOFF_INDEX.md";

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
if (index.indexStatus !== "node_public_source_fit_packet_handoff_index_ready_release_blocked") {
  fail(`unexpected indexStatus: ${index.indexStatus}`);
}
if (index.indexMode !== "all_packet_review_handoff_navigation") fail("unexpected indexMode");
if (index.totalPackets !== 35) fail(`expected 35 packets, got ${index.totalPackets}`);
if (index.packetsWithHandoff !== 35 || index.packetsWithoutHandoff !== 0) fail("handoff coverage drift");
if (index.packetsWithInputCopyTemplate !== 35 || index.packetsWithoutInputCopyTemplate !== 0) {
  fail("input copy template coverage drift");
}
if (index.readyPackets !== 0 || index.blockedPackets !== 35) fail("packet readiness drift");
if (index.totalReviewRows !== 1638 || index.readyRows !== 0 || index.blockedRows !== 1638 || index.missingFieldRows !== 1638) {
  fail("source-fit row readiness drift");
}
if (index.realHumanInputEntries !== 0) fail("index must not claim real human input");
if (index.firstBlockedPacketId !== "node-public-source-fit-batch-001-packet") fail("first blocked packet drift");
if (index.firstHandoffPacketId !== "node-public-source-fit-batch-001-packet") fail("first handoff packet drift");
if (index.writeAllowedNow !== false || index.manualAuthorizationRequired !== true) fail("write gate must remain locked");

if (!Array.isArray(index.packetRows) || index.packetRows.length !== 35) fail("packetRows must contain 35 packets");
for (const packetNumber of ["001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012", "013", "014", "015", "016", "017", "018", "019", "020", "021", "022", "023", "024", "025", "026", "027", "028", "029", "030", "031", "032", "033", "034", "035"]) {
  const row = index.packetRows[Number(packetNumber) - 1];
  if (row.packetId !== `node-public-source-fit-batch-${packetNumber}-packet`) fail(`packet ${packetNumber} row order drift`);
  if (row.handoffStatus !== `node_public_source_fit_packet_${packetNumber}_handoff_ready_blocked_on_real_input`) {
    fail(`packet ${packetNumber} handoff status drift`);
  }
  if (!new RegExp(`PACKET_${packetNumber}_HANDOFF`).test(row.handoffPath || "")) fail(`packet ${packetNumber} handoff path missing`);
  const expectedTemplateStatus = packetNumber === "001"
    ? "node_public_source_fit_packet_input_copy_template_ready_blank"
    : `node_public_source_fit_packet_${packetNumber}_input_copy_template_ready_blank`;
  if (row.inputCopyTemplateStatus !== expectedTemplateStatus) fail(`packet ${packetNumber} input copy template status drift`);
  if (!new RegExp(`PACKET_${packetNumber}_INPUT_COPY_TEMPLATE`).test(row.inputCopyPath || "")) fail(`packet ${packetNumber} input copy path missing`);
  if (packetNumber !== "001" && !new RegExp(`PACKET_${packetNumber}_INPUT_COPY_TEMPLATE`).test(row.inputCopyTemplatePath || "")) {
    fail(`packet ${packetNumber} input copy template path missing`);
  }
  if (row.nextAction !== `run_packet_${packetNumber}_handoff_phases_until_real_review_ready`) fail(`packet ${packetNumber} next action drift`);
  const expectedCommandPattern = Number(packetNumber) <= 2
    ? `check:knowledge-node-public-source-fit-review-packet-${packetNumber}-handoff`
    : `check:knowledge-node-public-source-fit-review-packet-${packetNumber}-suite`;
  if (!row.nextCommand.includes(expectedCommandPattern)) fail(`packet ${packetNumber} next command drift`);
}

const packetsWithoutHandoff = index.packetRows.filter((row) => row.handoffStatus === "handoff_not_generated");
if (packetsWithoutHandoff.length !== 0) fail("expected 0 packets without handoff");
for (const row of index.packetRows) {
  if (!row.packetId || !row.batchId || !row.module || !Number.isInteger(row.order)) fail("packet identity missing");
  if (row.readyRows !== 0 || row.blockedRows <= 0 || row.progressPercent !== 0) fail(`${row.packetId} readiness drift`);
  if (row.progressStatus !== "blocked_missing_real_reviewer_input") fail(`${row.packetId} progress status drift`);
  if (row.releaseGate !== "blocked_until_real_reviewer_input_validation_merge_dry_run_and_separate_approval") {
    fail(`${row.packetId} release gate drift`);
  }
}

if (!Array.isArray(index.firstPriorityRows) || index.firstPriorityRows.length !== 8) fail("first priority rows drift");
if (!Array.isArray(index.commands) || !index.commands.some((item) => item.includes("check:knowledge-node-public-source-fit-review-packet-handoff-index"))) {
  fail("commands missing self-check");
}
if (!index.commands.some((item) => item.includes("check:knowledge-node-public-source-fit-review-packet-002-handoff"))) {
  fail("commands missing packet 002 handoff check");
}
if (!index.commands.some((item) => item.includes("check:knowledge-node-public-source-fit-review-packet-003-suite"))) {
  fail("commands missing packet 003 suite check");
}
for (const packetNumber of ["004", "005", "006", "007", "008", "009", "010", "011", "012", "013", "014", "015", "016", "017", "018", "019", "020", "021", "022", "023", "024", "025", "026", "027", "028", "029", "030", "031", "032", "033", "034", "035"]) {
  if (!index.commands.some((item) => item.includes(`check:knowledge-node-public-source-fit-review-packet-${packetNumber}-suite`))) {
    fail(`commands missing packet ${packetNumber} suite check`);
  }
}

const boundaryText = `${index.boundary || ""} ${index.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "all 35 source-fit packets",
  "does not generate human decisions",
  "does not approve learner-facing citations",
  "does not authorize writes",
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
  educationOnly: index.educationOnly,
  productionReady: index.productionReady,
  learnerFacingRelease: index.learnerFacingRelease,
  approvalStatus: index.approvalStatus,
  indexStatus: index.indexStatus,
  totalPackets: index.totalPackets,
  packetsWithHandoff: index.packetsWithHandoff,
  packetsWithoutHandoff: index.packetsWithoutHandoff,
  packetsWithInputCopyTemplate: index.packetsWithInputCopyTemplate,
  packetsWithoutInputCopyTemplate: index.packetsWithoutInputCopyTemplate,
  readyPackets: index.readyPackets,
  blockedPackets: index.blockedPackets,
  readyRows: index.readyRows,
  blockedRows: index.blockedRows,
  writeAllowedNow: index.writeAllowedNow,
}, null, 2));
