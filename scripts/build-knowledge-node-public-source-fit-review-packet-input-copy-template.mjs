import fs from "node:fs";

const outputJson = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_INPUT_COPY_TEMPLATE.json";
const outputMd = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_INPUT_COPY_TEMPLATE.md";
const inputCopyJson = "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_001_INPUT_COPY_TEMPLATE.json";
const inputCopyMd = "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_001_INPUT_COPY_TEMPLATE.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(data, name) {
  if (data.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (data.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (data.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (data.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
  if (data.writeAllowedNow !== false) fail(`${name} must not allow writes`);
}

const packetPack = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_BATCH_PACKETS.json");
assertBoundary(packetPack, "batch packets");

const selectedPacketId = packetPack.firstPriorityPackets?.[0]?.packetId || "node-public-source-fit-batch-001-packet";
const selectedPacket = (packetPack.batchPackets || []).find((row) => row.packetId === selectedPacketId);
if (!selectedPacket) fail(`missing selected packet ${selectedPacketId}`);
if (!Array.isArray(selectedPacket.packetRows) || selectedPacket.packetRows.length === 0) fail("selected packet rows missing");

const rows = selectedPacket.packetRows.map((row) => ({
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
  reviewerDecision: "",
  sourceFitNotes: "",
  citationUse: "",
  reviewerName: "",
  reviewedAt: "",
  learnerCitationApproved: false,
  copiedTextApproved: false,
  realHumanInput: false,
  requiredDecisionValues: row.requiredDecisionValues || ["accept_for_node_source_fit", "reject_for_node_source_fit", "background_only"],
  sourceDraftPointer: {
    reviewerDecision: row.fillableFields?.reviewerDecision,
    sourceFitNotes: row.fillableFields?.sourceFitNotes,
    citationUse: row.fillableFields?.citationUse,
    reviewerName: row.fillableFields?.reviewerName,
    reviewedAt: row.fillableFields?.reviewedAt,
  },
  fixedFieldPolicy: row.fixedFields || {
    learnerCitationApproved: false,
    copiedTextApproved: false,
    realHumanInputRequired: true,
  },
  boundary: row.boundary || "Reviewer must decide source role and fit. Do not approve copied text, trading advice, signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
}));

const inputCopy = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  inputStatus: "packet_input_copy_template_ready_for_real_reviewer",
  inputMode: "packet_scoped_human_reviewer_source_fit_decisions_required",
  packetId: selectedPacket.packetId,
  batchId: selectedPacket.batchId,
  module: selectedPacket.module,
  sourceBatchPacketsPath: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_BATCH_PACKETS.json",
  sourceDraftInputPath: packetPack.sourceDraftInputPath,
  targetNodes: selectedPacket.targetNodes,
  reviewRows: rows.length,
  readyReviewRows: 0,
  blockedReviewRows: rows.length,
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  copiedTextApprovedRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  rows,
  allowedDecisionValues: ["accept_for_node_source_fit", "reject_for_node_source_fit", "background_only"],
  validatorCommand: `node scripts/validate-knowledge-node-public-source-fit-review-input.mjs --input ${inputCopyJson} --output-json docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_INPUT_COPY_TEMPLATE_VALIDATION.json --output-md docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_INPUT_COPY_TEMPLATE_VALIDATION.md`,
  completionRule: "This packet input copy is ready only after all packet rows have real human reviewer decisions, source-fit notes, citation use, reviewer name, reviewedAt timestamp, no forbidden language, no copied text approval, no learner citation approval, and realHumanInput:true.",
  boundary: "Packet input copy template is reviewer-facing education-only governance. It does not create human judgments, approve copied text, approve learner-facing citations, write lessons, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

const template = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  templateStatus: "node_public_source_fit_packet_input_copy_template_ready_blank",
  templateMode: "first_blocked_packet_scoped_input_copy_for_real_reviewer",
  packetId: inputCopy.packetId,
  batchId: inputCopy.batchId,
  module: inputCopy.module,
  inputCopyPath: inputCopyJson,
  inputCopyMarkdownPath: inputCopyMd,
  sourceBatchPacketsPath: inputCopy.sourceBatchPacketsPath,
  sourceDraftInputPath: inputCopy.sourceDraftInputPath,
  targetNodes: inputCopy.targetNodes,
  reviewRows: inputCopy.reviewRows,
  readyReviewRows: 0,
  blockedReviewRows: inputCopy.reviewRows,
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  copiedTextApprovedRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  fillableFieldRows: rows.slice(0, 12).map((row, index) => ({
    order: index + 1,
    reviewId: row.reviewId,
    nodeId: row.nodeId,
    documentId: row.documentId,
    sourceName: row.name,
    reviewerDecision: `/rows/${index}/reviewerDecision`,
    sourceFitNotes: `/rows/${index}/sourceFitNotes`,
    citationUse: `/rows/${index}/citationUse`,
    reviewerName: `/rows/${index}/reviewerName`,
    reviewedAt: `/rows/${index}/reviewedAt`,
  })),
  commands: [
    "npm.cmd run build:knowledge-node-public-source-fit-review-packet-input-copy-template",
    "npm.cmd run validate:knowledge-node-public-source-fit-review-packet-input-copy-template",
    "npm.cmd run check:knowledge-node-public-source-fit-review-packet-input-copy-template",
  ],
  validatorCommand: inputCopy.validatorCommand,
  completionRule: inputCopy.completionRule,
  boundary: inputCopy.boundary,
};

fs.mkdirSync("docs/reviewer-inputs", { recursive: true });
fs.writeFileSync(inputCopyJson, `${JSON.stringify(inputCopy, null, 2)}\n`, "utf8");
fs.writeFileSync(inputCopyMd, [
  "# Knowledge Node Public Source-Fit Review Packet 001 Input Copy Template",
  "",
  `- Packet: ${inputCopy.packetId}`,
  `- Module: ${inputCopy.module}`,
  `- Review rows: ${inputCopy.reviewRows}`,
  `- Ready rows: ${inputCopy.readyReviewRows}`,
  `- Blocked rows: ${inputCopy.blockedReviewRows}`,
  `- Real human input entries: ${inputCopy.realHumanInputEntries}`,
  `- Write allowed now: ${inputCopy.writeAllowedNow}`,
  "",
  "## Fill These Fields",
  "",
  "- `reviewerDecision`: `accept_for_node_source_fit`, `reject_for_node_source_fit`, or `background_only`.",
  "- `sourceFitNotes`: reviewer-owned source fit rationale.",
  "- `citationUse`: how the source may support original rewriting, or why it should remain background only.",
  "- `reviewerName` and `reviewedAt`: real reviewer identity and timestamp.",
  "- Set `realHumanInput:true` only after a real reviewer fills the row.",
  "- Keep `learnerCitationApproved:false` and `copiedTextApproved:false` unless a separate approval gate changes policy.",
  "",
  "## Sample Rows",
  "",
  ...inputCopy.rows.slice(0, 12).map((row, index) => `${index + 1}. ${row.reviewId}: ${row.name}`),
  "",
  "## Boundary",
  "",
  inputCopy.boundary,
  "",
].join("\n"), "utf8");

fs.writeFileSync(outputJson, `${JSON.stringify(template, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Knowledge Node Public Source-Fit Review Packet Input Copy Template",
  "",
  `- Template status: ${template.templateStatus}`,
  `- Packet: ${template.packetId}`,
  `- Module: ${template.module}`,
  `- Input copy: ${template.inputCopyPath}`,
  `- Review rows: ${template.reviewRows}`,
  `- Blocked rows: ${template.blockedReviewRows}`,
  `- Write allowed now: ${template.writeAllowedNow}`,
  "",
  "## Commands",
  "",
  ...template.commands.map((command) => `- \`${command}\``),
  "",
  "## Boundary",
  "",
  template.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: template.educationOnly,
  productionReady: template.productionReady,
  learnerFacingRelease: template.learnerFacingRelease,
  approvalStatus: template.approvalStatus,
  templateStatus: template.templateStatus,
  packetId: template.packetId,
  reviewRows: template.reviewRows,
  blockedReviewRows: template.blockedReviewRows,
  realHumanInputEntries: template.realHumanInputEntries,
  writeAllowedNow: template.writeAllowedNow,
  outputJson,
  outputMd,
  inputCopyJson,
  inputCopyMd,
}, null, 2));
