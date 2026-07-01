import fs from "node:fs";

const outputJson = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REAL_REVIEWER_LAUNCH_DASHBOARD.json";
const outputMd = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REAL_REVIEWER_LAUNCH_DASHBOARD.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(data, label) {
  if (data.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (data.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (data.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (data.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
}

const handoffIndex = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_HANDOFF_INDEX.json");
const packet001Handoff = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_001_HANDOFF.json");
const mergePreview = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_MERGE_PREVIEW.json");
const mergeApplyReport = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_MERGE_APPLY_REPORT.json");

for (const [label, data] of Object.entries({ handoffIndex, packet001Handoff, mergePreview, mergeApplyReport })) {
  assertBoundary(data, label);
}

const startPacket = (handoffIndex.packetRows || []).find((row) => row.packetId === handoffIndex.firstBlockedPacketId)
  || (handoffIndex.packetRows || [])[0];
if (!startPacket) fail("missing start packet row");
if (startPacket.packetId !== "node-public-source-fit-batch-001-packet") fail("start packet must be packet 001");
if (packet001Handoff.packetId !== startPacket.packetId) fail("packet 001 handoff must match start packet");
if (mergePreview.packetId !== startPacket.packetId) fail("merge preview must match start packet");
if (mergeApplyReport.packetId !== startPacket.packetId) fail("merge apply report must match start packet");

const editableReviewerFields = [
  "reviewerDecision",
  "sourceFitNotes",
  "citationUse",
  "reviewerName",
  "reviewedAt",
  "realHumanInput",
];

const lockedFields = [
  "learnerCitationApproved:false",
  "copiedTextApproved:false",
  "writeAllowedNow:false",
  "productionReady:false",
  "learnerFacingRelease:false",
];

const dashboard = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  launchStatus: "source_fit_real_reviewer_launch_ready_blocked_on_real_input",
  launchMode: "first_packet_real_reviewer_execution_start",
  reviewerCanStartNow: true,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  packetHandoffCoverage: `${handoffIndex.packetsWithHandoff}/${handoffIndex.totalPackets}`,
  packetHandoffsReady: handoffIndex.packetsWithHandoff,
  totalPackets: handoffIndex.totalPackets,
  packetsWithInputCopyTemplate: handoffIndex.packetsWithInputCopyTemplate,
  readyPackets: handoffIndex.readyPackets,
  blockedPackets: handoffIndex.blockedPackets,
  totalReviewRows: handoffIndex.totalReviewRows,
  readyRows: handoffIndex.readyRows,
  blockedRows: handoffIndex.blockedRows,
  missingFieldRows: handoffIndex.missingFieldRows,
  realHumanInputEntries: handoffIndex.realHumanInputEntries,
  startPacket: {
    order: startPacket.order,
    packetId: startPacket.packetId,
    batchId: startPacket.batchId,
    module: startPacket.module,
    inputCopyPath: startPacket.inputCopyPath,
    inputCopyTemplatePath: startPacket.inputCopyTemplatePath,
    handoffPath: startPacket.handoffPath,
    reviewRows: startPacket.reviewRows,
    targetNodes: startPacket.targetNodes,
    readyRows: startPacket.readyRows,
    blockedRows: startPacket.blockedRows,
    missingFieldRows: startPacket.missingFieldRows,
    realHumanInputEntries: packet001Handoff.packetRealHumanInputEntries,
    handoffStatus: packet001Handoff.handoffStatus,
    mergePreviewStatus: mergePreview.mergePreviewStatus,
    mergeApplyStatus: mergeApplyReport.applyStatus,
    mergeMappedRows: mergePreview.mappedRows,
    mergeMissingTargetRows: mergePreview.missingTargetRows,
    mergeAllowedNow: mergePreview.mergeAllowedNow,
    dryRunWrittenRows: mergeApplyReport.writtenRows,
  },
  startPacketReviewRows: startPacket.reviewRows,
  startPacketReadyRows: startPacket.readyRows,
  startPacketBlockedRows: startPacket.blockedRows,
  startPacketMissingFieldRows: startPacket.missingFieldRows,
  startPacketRealHumanInputEntries: packet001Handoff.packetRealHumanInputEntries,
  editableReviewerFields,
  lockedFields,
  fieldPolicyRows: [
    {
      field: "reviewerDecision",
      reviewerAction: "Fill only after personally checking whether the source supports the node.",
      allowedValues: ["accepted", "rejected", "needs_replacement"],
      gate: "required_for_ready_row",
    },
    {
      field: "sourceFitNotes",
      reviewerAction: "Write a concise reviewer note explaining the decision.",
      allowedValues: ["human-written note"],
      gate: "required_for_ready_row",
    },
    {
      field: "citationUse",
      reviewerAction: "Describe how the source can be used internally for education planning.",
      allowedValues: ["background", "definition", "method_context", "reject"],
      gate: "required_for_ready_row",
    },
    {
      field: "reviewerName",
      reviewerAction: "Identify the real reviewer who inspected the source.",
      allowedValues: ["real reviewer identity"],
      gate: "required_for_ready_row",
    },
    {
      field: "reviewedAt",
      reviewerAction: "Use the actual review timestamp.",
      allowedValues: ["ISO timestamp"],
      gate: "required_for_ready_row",
    },
    {
      field: "realHumanInput",
      reviewerAction: "Set true only for rows personally reviewed by a real human.",
      allowedValues: [true],
      gate: "never_generated_by_codex",
    },
  ],
  dayOneChecklist: [
    "Open the packet 001 input copy template.",
    "Review all 60 packet rows against the node and source evidence.",
    "Fill only reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt, and realHumanInput.",
    "Keep learnerCitationApproved, copiedTextApproved, write flags, learner release flags, and production flags locked false.",
    "Run packet input validation and stop until all 60 rows are ready.",
    "Run merge preview and confirm 60 mapped rows, 0 missing target rows, and no write.",
    "Run dry-run merge apply and confirm writtenRows stays 0 unless a separate exact-path write authorization exists.",
    "Rebuild the handoff index and progress matrix after authorized review changes.",
  ],
  commands: [
    "npm.cmd run validate:knowledge-node-public-source-fit-review-packet-input-copy-template",
    "npm.cmd run check:knowledge-node-public-source-fit-review-packet-input-copy-template",
    "npm.cmd run build:knowledge-node-public-source-fit-review-packet-merge-preview",
    "npm.cmd run check:knowledge-node-public-source-fit-review-packet-merge-preview",
    "npm.cmd run apply:knowledge-node-public-source-fit-review-packet-merge",
    "npm.cmd run check:knowledge-node-public-source-fit-review-packet-merge-apply-report",
    "npm.cmd run build:knowledge-node-public-source-fit-review-packet-handoff-index",
    "npm.cmd run check:knowledge-node-public-source-fit-review-packet-handoff-index",
  ],
  hardStops: [
    "Stop if the reviewer did not personally inspect the node and source.",
    "Stop if any row uses generated, copied, fixture, or unreviewed text as realHumanInput.",
    "Stop if learner-facing citation approval or copied-text approval appears in this launch path.",
    "Stop if merge preview is not packet 001, not 60 mapped rows, or has any missing target row.",
    "Stop if dry-run merge apply reports writtenRows above 0 without separate exact-path write authorization.",
    "Stop if any artifact claims production readiness, live signals, stock recommendations, return promises, broker workflows, automation, or real-money guidance.",
  ],
  completionRule: "The first source-fit real reviewer launch cannot advance until packet 001 has all 60 rows filled by real human source-fit review input, input validation passes, merge preview maps all 60 rows with 0 missing targets, dry-run apply is reviewed, and a separate exact-path manual authorization exists for any write.",
  boundary: "Source-fit real reviewer launch dashboard is reviewer-facing education-only operations material. It starts the first packet's human review loop for all 35 source-fit packet handoffs; it does not generate human decisions, approve copied text, approve learner-facing citations, authorize writes, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.writeFileSync(outputJson, `${JSON.stringify(dashboard, null, 2)}\n`, "utf8");

const md = `# Source-Fit Real Reviewer Launch Dashboard

- Status: ${dashboard.launchStatus}
- Mode: ${dashboard.launchMode}
- Packet handoffs: ${dashboard.packetHandoffCoverage}
- Review rows: ready ${dashboard.readyRows}/${dashboard.totalReviewRows}, blocked ${dashboard.blockedRows}
- Real human input entries: ${dashboard.realHumanInputEntries}
- Start packet: ${dashboard.startPacket.packetId}
- Start input: ${dashboard.startPacket.inputCopyPath}
- Start packet rows: ready ${dashboard.startPacketReadyRows}/${dashboard.startPacketReviewRows}, blocked ${dashboard.startPacketBlockedRows}
- Write allowed now: ${dashboard.writeAllowedNow}

## Day-One Checklist

${dashboard.dayOneChecklist.map((item, index) => `${index + 1}. ${item}`).join("\n")}

## Editable Reviewer Fields

${dashboard.fieldPolicyRows.map((row) => `- ${row.field}: ${row.reviewerAction} Gate: ${row.gate}.`).join("\n")}

## Hard Stops

${dashboard.hardStops.map((item) => `- ${item}`).join("\n")}

## Commands

${dashboard.commands.map((item) => `- \`${item}\``).join("\n")}

## Boundary

${dashboard.boundary}
`;

fs.writeFileSync(outputMd, md, "utf8");

console.log(JSON.stringify({
  ok: true,
  launchStatus: dashboard.launchStatus,
  packetHandoffCoverage: dashboard.packetHandoffCoverage,
  startPacket: dashboard.startPacket.packetId,
  startPacketReviewRows: dashboard.startPacketReviewRows,
  readyRows: dashboard.readyRows,
  blockedRows: dashboard.blockedRows,
  realHumanInputEntries: dashboard.realHumanInputEntries,
  writeAllowedNow: dashboard.writeAllowedNow,
}, null, 2));
