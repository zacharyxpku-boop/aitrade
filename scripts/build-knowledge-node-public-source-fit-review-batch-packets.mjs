import fs from "node:fs";

const outputJson = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_BATCH_PACKETS.json";
const outputMd = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_BATCH_PACKETS.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
  if (artifact.writeAllowedNow !== false) fail(`${name} must not allow writes`);
}

function pointerFor(index, field) {
  return `/rows/${index}/${field}`;
}

const queue = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_EXECUTION_QUEUE.json");
const draft = readJson("docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_DRAFT.json");
const validation = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_VALIDATION.json");

for (const [name, artifact] of Object.entries({ queue, draft, validation })) {
  assertBoundary(name, artifact);
}

const rowsByModule = new Map();
for (const [index, row] of (draft.rows || []).entries()) {
  const packetRow = {
    inputRowIndex: index,
    reviewId: row.reviewId,
    nodeId: row.nodeId,
    title: row.title,
    module: row.module,
    topic: row.topic,
    documentId: row.documentId,
    sourceId: row.sourceId,
    name: row.name,
    url: row.url,
    tier: row.tier,
    family: row.family,
    sourceRole: row.sourceRole,
    excerptPolicy: row.excerptPolicy,
    fitScore: row.fitScore,
    requiredDecisionValues: row.requiredDecisionValues || [],
    fillableFields: {
      reviewerDecision: pointerFor(index, "reviewerDecision"),
      sourceFitNotes: pointerFor(index, "sourceFitNotes"),
      citationUse: pointerFor(index, "citationUse"),
      reviewerName: pointerFor(index, "reviewerName"),
      reviewedAt: pointerFor(index, "reviewedAt"),
    },
    fixedFields: {
      learnerCitationApproved: false,
      copiedTextApproved: false,
      realHumanInput: false,
    },
    reviewStatus: "blocked_missing_real_reviewer_input",
    reviewerInstruction: "Decide whether this public source is accepted for this specific node, rejected, or background-only. Use original notes only.",
  };
  if (!rowsByModule.has(row.module)) rowsByModule.set(row.module, []);
  rowsByModule.get(row.module).push(packetRow);
}

const moduleOffsets = new Map();
const batchPackets = (queue.batchRows || []).map((batch) => {
  const moduleRows = rowsByModule.get(batch.module) || [];
  const offset = moduleOffsets.get(batch.module) || 0;
  const packetRows = moduleRows.slice(offset, offset + batch.reviewRows);
  moduleOffsets.set(batch.module, offset + batch.reviewRows);
  const nodeIds = [...new Set(packetRows.map((row) => row.nodeId))];
  return {
    packetId: `${batch.batchId}-packet`,
    batchId: batch.batchId,
    order: batch.order,
    module: batch.module,
    packetStatus: "blank_batch_packet_ready_for_real_reviewer",
    owner: "real_reviewer",
    inputPath: batch.inputPath,
    targetNodes: nodeIds.length,
    reviewRows: packetRows.length,
    readyRows: 0,
    blockedRows: packetRows.length,
    wikipediaRows: packetRows.filter((row) => /wikipedia/i.test(`${row.family} ${row.name} ${row.url}`)).length,
    officialRows: packetRows.filter((row) => /official|public domain/i.test(row.family || "")).length,
    nodeIds,
    packetRows,
    sampleRows: packetRows.slice(0, 5).map((row) => ({
      inputRowIndex: row.inputRowIndex,
      reviewId: row.reviewId,
      nodeId: row.nodeId,
      topic: row.topic,
      name: row.name,
      family: row.family,
      reviewerDecisionPointer: row.fillableFields.reviewerDecision,
    })),
    acceptanceChecks: [
      "Every row has reviewerDecision, sourceFitNotes, citationUse, reviewerName, and reviewedAt filled by a real reviewer.",
      "learnerCitationApproved remains false unless a separate release approval gate exists.",
      "copiedTextApproved remains false; public sources support original rewriting only.",
      "Validation reports zero forbidden hits and fixtureOnly:false.",
    ],
    command: "npm.cmd run validate:knowledge-node-public-source-fit-review-input && npm.cmd run check:knowledge-node-public-source-fit-review-input-validation",
    nextGate: "validate_batch_input_then_rerun_execution_queue_and_write_authorization_preview",
  };
});

const packet = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  packetStatus: "node_public_source_fit_review_batch_packets_ready_release_blocked",
  packetMode: "fillable_batch_packets_for_node_public_source_fit_review",
  sourceQueuePath: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_EXECUTION_QUEUE.json",
  sourceDraftInputPath: "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_DRAFT.json",
  modules: queue.modules,
  totalBatches: queue.totalBatches,
  totalPackets: batchPackets.length,
  candidateTargetNodes: queue.candidateTargetNodes,
  reviewRows: draft.rows?.length || 0,
  readyRows: validation.readyRows,
  blockedRows: validation.blockedRows,
  missingFieldRows: validation.missingFieldRows,
  realHumanInputEntries: validation.realHumanInputEntries,
  learnerCitationApprovedRows: validation.learnerCitationApprovedRows,
  copiedTextApprovedRows: validation.copiedTextApprovedRows,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  firstPriorityPackets: batchPackets.slice(0, 6).map((row) => ({
    packetId: row.packetId,
    batchId: row.batchId,
    module: row.module,
    targetNodes: row.targetNodes,
    reviewRows: row.reviewRows,
    wikipediaRows: row.wikipediaRows,
    officialRows: row.officialRows,
    packetStatus: row.packetStatus,
    inputPath: row.inputPath,
  })),
  batchPackets,
  commands: [
    "npm.cmd run build:knowledge-node-public-source-fit-review-batch-packets",
    "npm.cmd run check:knowledge-node-public-source-fit-review-batch-packets",
    "npm.cmd run validate:knowledge-node-public-source-fit-review-input",
    "npm.cmd run check:knowledge-node-public-source-fit-review-input-validation",
  ],
  completionRule: "These batch packets make all 1638 node public source-fit rows directly actionable for real reviewers, but they are blank scaffolding only. They do not create human judgments, approve sources, approve learner citations, change triangulation, write lessons, or authorize release.",
  boundary: "Node public source-fit review batch packets are reviewer-facing education-only governance. They do not approve copied text, learner-facing citations, stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Knowledge Node Public Source-Fit Review Batch Packets",
  "",
  `- Packet status: ${packet.packetStatus}`,
  `- Packets: ${packet.totalPackets}`,
  `- Review rows ready/blocked: ${packet.readyRows}/${packet.blockedRows}`,
  `- Real human input entries: ${packet.realHumanInputEntries}`,
  `- Write allowed now: ${packet.writeAllowedNow}`,
  "",
  "## First Priority Packets",
  "",
  "| Packet | Module | Rows | Nodes | Wiki | Official | Status |",
  "| --- | --- | ---: | ---: | ---: | ---: | --- |",
  ...packet.firstPriorityPackets.map((row) => `| ${row.packetId} | ${row.module} | ${row.reviewRows} | ${row.targetNodes} | ${row.wikipediaRows} | ${row.officialRows} | ${row.packetStatus} |`),
  "",
  "## Packet Index",
  "",
  "| Packet | Batch | Module | Rows | Input |",
  "| --- | --- | --- | ---: | --- |",
  ...packet.batchPackets.map((row) => `| ${row.packetId} | ${row.batchId} | ${row.module} | ${row.reviewRows} | ${row.inputPath} |`),
  "",
  "## Completion Rule",
  "",
  packet.completionRule,
  "",
  "## Boundary",
  "",
  packet.boundary,
  "",
].join("\n"), "utf8");

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
  outputJson,
  outputMd,
}, null, 2));
