import fs from "node:fs";

const outputJson = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEWER_WORKBENCH_INDEX.json";
const outputMd = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEWER_WORKBENCH_INDEX.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readJsonIfExists(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(data, label) {
  if (data.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (data.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (data.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (data.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
}

function packetNumberFromId(packetId) {
  return packetId.match(/batch-(\d+)-packet/)?.[1] || "";
}

function templatePathForPacket(packetNumber) {
  return packetNumber === "001"
    ? "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_INPUT_COPY_TEMPLATE.json"
    : `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_INPUT_COPY_TEMPLATE.json`;
}

function validationPathForPacket(packetNumber) {
  return packetNumber === "001"
    ? "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_INPUT_COPY_TEMPLATE_VALIDATION.json"
    : `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_INPUT_COPY_TEMPLATE_VALIDATION.json`;
}

const handoffIndex = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_HANDOFF_INDEX.json");
const packet001Workbench = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_PACKET_001_REVIEWER_WORKBENCH.json");
assertBoundary(handoffIndex, "handoff index");
assertBoundary(packet001Workbench, "packet 001 workbench");

const packetRows = (handoffIndex.packetRows || []).map((packet) => {
  const packetNumber = packetNumberFromId(packet.packetId);
  const handoff = readJson(packet.handoffPath);
  const templatePath = templatePathForPacket(packetNumber);
  const validationPath = validationPathForPacket(packetNumber);
  const template = readJson(templatePath);
  const validation = readJson(validationPath);
  assertBoundary(handoff, `packet ${packetNumber} handoff`);
  assertBoundary(template, `packet ${packetNumber} template`);
  assertBoundary(validation, `packet ${packetNumber} validation`);

  if (handoff.packetId !== packet.packetId) fail(`packet ${packetNumber} handoff packet mismatch`);
  if (template.packetId !== packet.packetId) fail(`packet ${packetNumber} template packet mismatch`);
  if (validation.inputRows !== packet.reviewRows) fail(`packet ${packetNumber} validation row drift`);

  const packet001Detail = packetNumber === "001" ? packet001Workbench : null;
  const fillableRows = packet001Detail
    ? packet001Detail.rows.slice(0, 6).map((row) => ({
      rowIndex: row.rowIndex,
      reviewId: row.reviewId,
      nodeId: row.nodeId,
      documentId: row.documentId,
      sourceName: row.sourceName,
      family: row.family,
      url: row.url,
      validationStatus: row.validationStatus,
      missingFields: row.missingFields,
    }))
    : (template.fillableFieldRows || []).slice(0, 6).map((row) => ({
      rowIndex: (row.order || 1) - 1,
      reviewId: row.reviewId,
      nodeId: row.nodeId,
      documentId: row.documentId,
      sourceName: row.sourceName,
      validationStatus: "blocked_missing_or_invalid_reviewer_input",
      missingFields: ["reviewerDecision", "sourceFitNotes", "citationUse", "reviewerName", "reviewedAt"],
    }));

  return {
    order: packet.order,
    packetNumber,
    packetId: packet.packetId,
    batchId: packet.batchId,
    module: packet.module,
    targetNodes: packet.targetNodes,
    reviewRows: packet.reviewRows,
    readyRows: validation.readyRows,
    blockedRows: validation.blockedRows,
    missingFieldRows: validation.missingFieldRows,
    invalidDecisionRows: validation.invalidDecisionRows,
    forbiddenHitRows: validation.forbiddenHitRows,
    realHumanInputEntries: validation.realHumanInputEntries,
    learnerCitationApprovedRows: validation.learnerCitationApprovedRows,
    copiedTextApprovedRows: validation.copiedTextApprovedRows,
    handoffStatus: handoff.handoffStatus,
    templateStatus: template.templateStatus || template.inputStatus,
    validationStatus: validation.validationStatus,
    inputCopyPath: packet.inputCopyPath || handoff.inputCopyPath || template.inputCopyPath,
    templatePath,
    validationPath,
    handoffPath: packet.handoffPath,
    hasDetailedRowBrowser: packetNumber === "001",
    detailedRowBrowserPath: packetNumber === "001"
      ? "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_PACKET_001_REVIEWER_WORKBENCH.json"
      : "",
    sampleRows: fillableRows,
    reviewStatus: validation.readyRows === packet.reviewRows
      ? "ready_after_real_review"
      : "blocked_missing_real_reviewer_input",
    nextAction: packetNumber === "001"
      ? "use_packet_001_row_browser_then_fill_real_reviewer_input_copy"
      : `open_packet_${packetNumber}_input_copy_template_then_fill_real_reviewer_rows`,
  };
});

const moduleRowsByName = new Map();
for (const row of packetRows) {
  const module = moduleRowsByName.get(row.module) || {
    module: row.module,
    packets: 0,
    targetNodes: 0,
    reviewRows: 0,
    readyRows: 0,
    blockedRows: 0,
    realHumanInputEntries: 0,
    firstBlockedPacketId: row.packetId,
    reviewStatus: "blocked_missing_real_reviewer_input",
  };
  module.packets += 1;
  module.targetNodes += row.targetNodes || 0;
  module.reviewRows += row.reviewRows || 0;
  module.readyRows += row.readyRows || 0;
  module.blockedRows += row.blockedRows || 0;
  module.realHumanInputEntries += row.realHumanInputEntries || 0;
  if (module.readyRows === module.reviewRows && module.reviewRows > 0) module.reviewStatus = "ready_after_real_review";
  moduleRowsByName.set(row.module, module);
}

const index = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  workbenchIndexStatus: "source_fit_reviewer_workbench_index_ready_all_packets_blocked_on_real_input",
  workbenchIndexMode: "all_packet_readonly_review_navigation",
  totalPackets: packetRows.length,
  packetsWithHandoff: handoffIndex.packetsWithHandoff,
  packetsWithInputCopyTemplate: handoffIndex.packetsWithInputCopyTemplate,
  packetsWithValidation: packetRows.filter((row) => row.validationStatus).length,
  packetsWithDetailedRowBrowser: packetRows.filter((row) => row.hasDetailedRowBrowser).length,
  modules: moduleRowsByName.size,
  totalReviewRows: handoffIndex.totalReviewRows,
  readyRows: handoffIndex.readyRows,
  blockedRows: handoffIndex.blockedRows,
  missingFieldRows: handoffIndex.missingFieldRows,
  realHumanInputEntries: handoffIndex.realHumanInputEntries,
  learnerCitationApprovedRows: packetRows.reduce((sum, row) => sum + (row.learnerCitationApprovedRows || 0), 0),
  copiedTextApprovedRows: packetRows.reduce((sum, row) => sum + (row.copiedTextApprovedRows || 0), 0),
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  firstBlockedPacketId: handoffIndex.firstBlockedPacketId,
  packetRows,
  moduleRows: Array.from(moduleRowsByName.values()),
  commands: [
    "npm.cmd run build:knowledge-node-public-source-fit-reviewer-workbench-index",
    "npm.cmd run check:knowledge-node-public-source-fit-reviewer-workbench-index",
    "npm.cmd run build:knowledge-node-public-source-fit-packet-001-reviewer-workbench",
    "npm.cmd run check:knowledge-node-public-source-fit-packet-001-reviewer-workbench",
    "npm.cmd run build:knowledge-node-public-source-fit-review-packet-handoff-index",
    "npm.cmd run check:knowledge-node-public-source-fit-review-packet-handoff-index",
  ],
  completionRule: "The source-fit reviewer workbench index is a readonly all-packet navigation layer. It is not complete as course approval: all 35 packets and 1638 rows remain blocked until real human reviewer input, packet validation, merge preview, dry-run apply review, and separate exact-path write authorization pass.",
  boundary: "Source-fit reviewer workbench index is reviewer-facing education-only navigation across all 35 source-fit packets. It displays packet/module progress, input templates, validation state, and sample source rows; it does not generate human decisions, approve copied text, approve learner-facing citations, authorize writes, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.writeFileSync(outputJson, `${JSON.stringify(index, null, 2)}\n`, "utf8");

const md = `# Source-Fit Reviewer Workbench Index

- Status: ${index.workbenchIndexStatus}
- Packets: ${index.totalPackets}
- Modules: ${index.modules}
- Rows: ready ${index.readyRows}/${index.totalReviewRows}, blocked ${index.blockedRows}
- Real human input entries: ${index.realHumanInputEntries}
- Detailed row browsers: ${index.packetsWithDetailedRowBrowser}
- Write allowed now: ${index.writeAllowedNow}

## Module Rows

${index.moduleRows.map((row) => `- ${row.module}: packets ${row.packets}, rows ${row.readyRows}/${row.reviewRows}, blocked ${row.blockedRows}, first ${row.firstBlockedPacketId}`).join("\n")}

## First Packets

${index.packetRows.slice(0, 12).map((row) => `- ${row.packetNumber}: ${row.packetId} - rows ${row.readyRows}/${row.reviewRows}, ${row.validationStatus}`).join("\n")}

## Boundary

${index.boundary}
`;

fs.writeFileSync(outputMd, md, "utf8");

console.log(JSON.stringify({
  ok: true,
  workbenchIndexStatus: index.workbenchIndexStatus,
  totalPackets: index.totalPackets,
  packetsWithValidation: index.packetsWithValidation,
  totalReviewRows: index.totalReviewRows,
  readyRows: index.readyRows,
  blockedRows: index.blockedRows,
  realHumanInputEntries: index.realHumanInputEntries,
  writeAllowedNow: index.writeAllowedNow,
}, null, 2));
