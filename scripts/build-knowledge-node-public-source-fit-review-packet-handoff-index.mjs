import fs from "node:fs";

const outputJson = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_HANDOFF_INDEX.json";
const outputMd = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_HANDOFF_INDEX.md";

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

function discoverJsonArtifacts(pattern) {
  if (!fs.existsSync("docs")) return [];
  return fs.readdirSync("docs")
    .filter((name) => pattern.test(name))
    .sort()
    .map((name) => ({
      path: `docs/${name}`,
      data: readJson(`docs/${name}`),
    }));
}

const batchPackets = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_BATCH_PACKETS.json");
const progressMatrix = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PROGRESS_MATRIX.json");
const packet001Handoff = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_001_HANDOFF.json");
const handoffArtifacts = discoverJsonArtifacts(/^KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_\d{3}_HANDOFF\.json$/);
const legacyPacket001Template = readJsonIfExists("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_INPUT_COPY_TEMPLATE.json");
const templateArtifacts = [
  ...(legacyPacket001Template ? [{
    path: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_INPUT_COPY_TEMPLATE.json",
    data: legacyPacket001Template,
  }] : []),
  ...discoverJsonArtifacts(/^KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_\d{3}_INPUT_COPY_TEMPLATE\.json$/),
];
const handoffs = handoffArtifacts.map((artifact) => artifact.data);
const inputCopyTemplates = templateArtifacts.map((artifact) => artifact.data);

for (const [label, artifact] of Object.entries({ batchPackets, progressMatrix, packet001Handoff })) {
  assertBoundary(artifact, label);
}
for (const [index, artifact] of inputCopyTemplates.entries()) {
  assertBoundary(artifact, `input copy template ${index + 1}`);
}
for (const [index, artifact] of handoffs.entries()) {
  assertBoundary(artifact, `handoff ${index + 1}`);
}

const progressByPacket = new Map((progressMatrix.packetRows || []).map((row) => [row.packetId, row]));
const templateByPacket = new Map(inputCopyTemplates.map((template) => [template.packetId, template]));
const templatePathByPacket = new Map(templateArtifacts.map((artifact) => [artifact.data.packetId, artifact.path]));
const handoffByPacket = new Map(handoffs.map((handoff) => [handoff.packetId, handoff]));
const handoffPathByPacket = new Map(handoffArtifacts.map((artifact) => [artifact.data.packetId, artifact.path]));
const firstHandoffPacketId = packet001Handoff.packetId;

const packetRows = (batchPackets.batchPackets || []).map((packet) => {
  const progress = progressByPacket.get(packet.packetId) || {};
  const handoff = handoffByPacket.get(packet.packetId);
  const hasHandoff = Boolean(handoff);
  const inputCopyTemplate = templateByPacket.get(packet.packetId);
  const hasInputCopyTemplate = Boolean(inputCopyTemplate);
  const packetNumber = packet.packetId.match(/batch-(\d+)-packet/)?.[1] || "";
  return {
    order: packet.order,
    packetId: packet.packetId,
    batchId: packet.batchId,
    module: packet.module,
    targetNodes: packet.targetNodes,
    reviewRows: packet.reviewRows,
    wikipediaRows: packet.wikipediaRows,
    officialRows: packet.officialRows,
    readyRows: progress.readyRows ?? packet.readyRows ?? 0,
    blockedRows: progress.blockedRows ?? packet.blockedRows ?? packet.reviewRows,
    missingFieldRows: progress.missingFieldRows ?? packet.reviewRows,
    progressPercent: progress.progressPercent ?? 0,
    progressStatus: progress.progressStatus || "blocked_missing_real_reviewer_input",
    handoffStatus: hasHandoff ? handoff.handoffStatus : "handoff_not_generated",
    handoffPath: hasHandoff ? handoffPathByPacket.get(packet.packetId) || "" : "",
    inputCopyTemplateStatus: inputCopyTemplate?.templateStatus || "input_copy_template_not_generated",
    inputCopyPath: hasHandoff ? handoff.inputCopyPath : inputCopyTemplate?.inputCopyPath || "",
    inputCopyTemplatePath: hasInputCopyTemplate ? templatePathByPacket.get(packet.packetId) || "" : "",
    nextAction: hasHandoff
      ? `run_packet_${packetNumber}_handoff_phases_until_real_review_ready`
      : hasInputCopyTemplate
        ? "generate_packet_handoff_from_ready_input_copy_template"
        : "generate_packet_scoped_input_copy_and_handoff_before_real_review",
    nextCommand: hasHandoff
      ? (handoff.commands || []).find((command) => command.includes("check:")) || handoff.commands?.[0] || `open ${handoffPathByPacket.get(packet.packetId) || "packet handoff"}`
      : hasInputCopyTemplate
        ? "add packet handoff generator for this packet id, then validate and dry-run merge"
        : "extend packet input-copy/handoff generator for this packet id, then validate and dry-run merge",
    releaseGate: "blocked_until_real_reviewer_input_validation_merge_dry_run_and_separate_approval",
  };
});

const index = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  indexStatus: "node_public_source_fit_packet_handoff_index_ready_release_blocked",
  indexMode: "all_packet_review_handoff_navigation",
  totalPackets: packetRows.length,
  packetsWithHandoff: packetRows.filter((row) => row.handoffStatus !== "handoff_not_generated").length,
  packetsWithoutHandoff: packetRows.filter((row) => row.handoffStatus === "handoff_not_generated").length,
  packetsWithInputCopyTemplate: packetRows.filter((row) => row.inputCopyTemplateStatus !== "input_copy_template_not_generated").length,
  packetsWithoutInputCopyTemplate: packetRows.filter((row) => row.inputCopyTemplateStatus === "input_copy_template_not_generated").length,
  readyPackets: progressMatrix.readyPackets,
  blockedPackets: progressMatrix.blockedPackets,
  totalReviewRows: progressMatrix.totalReviewRows,
  readyRows: progressMatrix.readyRows,
  blockedRows: progressMatrix.blockedRows,
  missingFieldRows: progressMatrix.missingFieldRows,
  realHumanInputEntries: progressMatrix.realHumanInputEntries,
  firstBlockedPacketId: progressMatrix.firstBlockedPacketId,
  firstHandoffPacketId,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  packetRows,
  firstPriorityRows: packetRows.slice(0, 8),
  commands: [
    "npm.cmd run build:knowledge-node-public-source-fit-review-packet-handoff-index",
    "npm.cmd run check:knowledge-node-public-source-fit-review-packet-handoff-index",
    ...handoffs.map((handoff) => (handoff.commands || []).find((command) => command.includes("check:"))).filter(Boolean),
    "npm.cmd run check:knowledge-node-public-source-fit-review-progress-matrix",
  ],
  completionRule: "This index makes all 35 source-fit packets visible for real reviewer execution. It does not generate human decisions, does not approve learner-facing citations, and does not authorize writes. Packet rows become complete only through real reviewer-filled input copies, validation, dry-run merge, and separate approval.",
  boundary: "Node public source-fit packet handoff index is reviewer-facing education-only operations material. It organizes packet-level review execution for public source-fit candidates; it does not write lessons, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.writeFileSync(outputJson, `${JSON.stringify(index, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Knowledge Node Public Source-Fit Review Packet Handoff Index",
  "",
  `- Status: ${index.indexStatus}`,
  `- Total packets: ${index.totalPackets}`,
  `- With/without handoff: ${index.packetsWithHandoff}/${index.packetsWithoutHandoff}`,
  `- With/without input copy template: ${index.packetsWithInputCopyTemplate}/${index.packetsWithoutInputCopyTemplate}`,
  `- Ready/blocked packets: ${index.readyPackets}/${index.blockedPackets}`,
  `- Ready/blocked rows: ${index.readyRows}/${index.blockedRows}`,
  `- First blocked packet: ${index.firstBlockedPacketId}`,
  `- First handoff packet: ${index.firstHandoffPacketId}`,
  `- Write allowed now: ${index.writeAllowedNow}`,
  "",
  "## First Priority Packets",
  "",
  "| # | Packet | Module | Rows | Ready | Blocked | Template | Handoff | Next action |",
  "|---:|---|---|---:|---:|---:|---|---|---|",
  ...index.firstPriorityRows.map((row) => `| ${row.order} | ${row.packetId} | ${row.module} | ${row.reviewRows} | ${row.readyRows} | ${row.blockedRows} | ${row.inputCopyTemplateStatus} | ${row.handoffStatus} | ${row.nextAction} |`),
  "",
  "## Boundary",
  "",
  index.boundary,
  "",
].join("\n"), "utf8");

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
  outputJson,
  outputMd,
}, null, 2));
