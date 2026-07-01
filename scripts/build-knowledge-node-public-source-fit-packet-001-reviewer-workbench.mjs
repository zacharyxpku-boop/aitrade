import fs from "node:fs";

const outputJson = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_PACKET_001_REVIEWER_WORKBENCH.json";
const outputMd = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_PACKET_001_REVIEWER_WORKBENCH.md";

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

const inputCopy = readJson("docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_001_INPUT_COPY_TEMPLATE.json");
const validation = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_INPUT_COPY_TEMPLATE_VALIDATION.json");
const mergePreview = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_MERGE_PREVIEW.json");
const applyReport = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_MERGE_APPLY_REPORT.json");
const launchDashboard = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REAL_REVIEWER_LAUNCH_DASHBOARD.json");

for (const [label, data] of Object.entries({ inputCopy, validation, mergePreview, applyReport, launchDashboard })) {
  assertBoundary(data, label);
}

const packetId = "node-public-source-fit-batch-001-packet";
for (const [label, data] of Object.entries({ inputCopy, mergePreview, applyReport })) {
  if (data.packetId !== packetId) fail(`${label} must be packet 001`);
}
if (launchDashboard.startPacket?.packetId !== packetId) fail("launch dashboard must start from packet 001");
if (!Array.isArray(inputCopy.rows) || inputCopy.rows.length !== 60) fail("packet 001 input copy must contain 60 rows");
if (!Array.isArray(validation.validationRows) || validation.validationRows.length !== 60) fail("packet 001 validation must contain 60 rows");
if (!Array.isArray(applyReport.applyRows) || applyReport.applyRows.length !== 60) fail("packet 001 apply report must contain 60 rows");

const validationByReviewId = new Map(validation.validationRows.map((row) => [row.reviewId, row]));
const applyByReviewId = new Map(applyReport.applyRows.map((row) => [row.reviewId, row]));
const rows = inputCopy.rows.map((row, rowIndex) => {
  const validationRow = validationByReviewId.get(row.reviewId) || {};
  const applyRow = applyByReviewId.get(row.reviewId) || {};
  return {
    rowIndex,
    reviewId: row.reviewId,
    nodeId: row.nodeId,
    title: row.title,
    module: row.module,
    topic: row.topic,
    documentId: row.documentId,
    sourceId: row.sourceId,
    sourceName: row.name,
    url: row.url,
    tier: row.tier,
    family: row.family,
    sourceRole: row.sourceRole,
    excerptPolicy: row.excerptPolicy,
    fitScore: row.fitScore,
    requiredDecisionValues: row.requiredDecisionValues || [],
    reviewerDecision: row.reviewerDecision,
    citationUse: row.citationUse,
    validationStatus: validationRow.validationStatus || "blocked_missing_or_invalid_reviewer_input",
    missingFields: validationRow.missingFields || [],
    invalidDecision: validationRow.invalidDecision === true,
    forbiddenHits: validationRow.forbiddenHits || [],
    realHumanInput: validationRow.realHumanInput === true,
    learnerCitationApproved: validationRow.learnerCitationApproved === true,
    copiedTextApproved: validationRow.copiedTextApproved === true,
    applyStatus: applyRow.applyStatus || "blocked_not_ready",
    willWrite: applyRow.willWrite === true,
    reviewStatus: validationRow.validationStatus === "ready_for_merge"
      ? "ready_for_merge_after_real_review"
      : "blocked_missing_real_reviewer_input",
    nextReviewerAction: "Inspect this node/source pair and fill only reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt, and realHumanInput in the packet input copy.",
  };
});

const nodeMap = new Map();
for (const row of rows) {
  const node = nodeMap.get(row.nodeId) || {
    nodeId: row.nodeId,
    title: row.title,
    module: row.module,
    topic: row.topic,
    candidateRows: 0,
    readyRows: 0,
    blockedRows: 0,
    wikipediaRows: 0,
    officialRows: 0,
    topFitScore: 0,
    sampleSources: [],
    reviewStatus: "blocked_missing_real_reviewer_input",
  };
  node.candidateRows += 1;
  if (row.reviewStatus === "ready_for_merge_after_real_review") node.readyRows += 1;
  else node.blockedRows += 1;
  if (/wikipedia/i.test(row.family || "") || /wikipedia/i.test(row.sourceName || "")) node.wikipediaRows += 1;
  if (/official/i.test(row.sourceRole || "") || /gov|sec|exchange|investopedia/i.test(`${row.url || ""} ${row.family || ""}`)) {
    node.officialRows += 1;
  }
  node.topFitScore = Math.max(node.topFitScore, row.fitScore || 0);
  if (node.sampleSources.length < 3) {
    node.sampleSources.push({
      sourceName: row.sourceName,
      url: row.url,
      family: row.family,
      fitScore: row.fitScore,
      validationStatus: row.validationStatus,
    });
  }
  nodeMap.set(row.nodeId, node);
}

const nodeRows = Array.from(nodeMap.values()).map((node) => ({
  ...node,
  reviewStatus: node.readyRows === node.candidateRows
    ? "ready_after_real_review"
    : "blocked_missing_real_reviewer_input",
}));

const workbench = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  workbenchStatus: "packet_001_reviewer_workbench_ready_blocked_on_real_input",
  workbenchMode: "readonly_packet_row_browser_for_real_source_fit_review",
  packetId,
  batchId: inputCopy.batchId,
  module: inputCopy.module,
  inputCopyPath: "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_001_INPUT_COPY_TEMPLATE.json",
  validationPath: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_INPUT_COPY_TEMPLATE_VALIDATION.json",
  mergePreviewPath: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_MERGE_PREVIEW.json",
  applyReportPath: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_MERGE_APPLY_REPORT.json",
  nodeCount: nodeRows.length,
  reviewRows: rows.length,
  readyRows: validation.readyRows,
  blockedRows: validation.blockedRows,
  missingFieldRows: validation.missingFieldRows,
  invalidDecisionRows: validation.invalidDecisionRows,
  forbiddenHitRows: validation.forbiddenHitRows,
  realHumanInputEntries: validation.realHumanInputEntries,
  learnerCitationApprovedRows: validation.learnerCitationApprovedRows,
  copiedTextApprovedRows: validation.copiedTextApprovedRows,
  mergeMappedRows: mergePreview.mappedRows,
  mergeMissingTargetRows: mergePreview.missingTargetRows,
  dryRunWrittenRows: applyReport.writtenRows,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  reviewerEditableFields: launchDashboard.editableReviewerFields || [],
  lockedFields: launchDashboard.lockedFields || [],
  nodeRows,
  rows,
  commands: [
    "npm.cmd run build:knowledge-node-public-source-fit-packet-001-reviewer-workbench",
    "npm.cmd run check:knowledge-node-public-source-fit-packet-001-reviewer-workbench",
    "npm.cmd run validate:knowledge-node-public-source-fit-review-packet-input-copy-template",
    "npm.cmd run check:knowledge-node-public-source-fit-review-packet-input-copy-template",
    "npm.cmd run build:knowledge-node-public-source-fit-review-packet-merge-preview",
    "npm.cmd run check:knowledge-node-public-source-fit-review-packet-merge-preview",
    "npm.cmd run apply:knowledge-node-public-source-fit-review-packet-merge",
    "npm.cmd run check:knowledge-node-public-source-fit-review-packet-merge-apply-report",
  ],
  completionRule: "This packet 001 reviewer workbench is complete only as a readonly browser. Packet 001 remains blocked until all 60 rows receive real human source-fit review input, validation passes, merge preview maps all rows, dry-run apply is reviewed, and a separate exact-path write authorization exists.",
  boundary: "Packet 001 reviewer workbench is reviewer-facing education-only source-fit review navigation. It displays node/source candidates, validation state, missing reviewer fields, and dry-run write state; it does not generate human decisions, approve copied text, approve learner-facing citations, authorize writes, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.writeFileSync(outputJson, `${JSON.stringify(workbench, null, 2)}\n`, "utf8");

const md = `# Packet 001 Reviewer Workbench

- Status: ${workbench.workbenchStatus}
- Packet: ${workbench.packetId}
- Module: ${workbench.module}
- Nodes: ${workbench.nodeCount}
- Rows: ready ${workbench.readyRows}/${workbench.reviewRows}, blocked ${workbench.blockedRows}
- Real human input entries: ${workbench.realHumanInputEntries}
- Dry-run written rows: ${workbench.dryRunWrittenRows}
- Write allowed now: ${workbench.writeAllowedNow}

## Node Rows

${workbench.nodeRows.map((node) => `- ${node.nodeId}: candidates ${node.candidateRows}, ready ${node.readyRows}, blocked ${node.blockedRows}, topFit ${node.topFitScore}`).join("\n")}

## First Review Rows

${workbench.rows.slice(0, 12).map((row) => `- ${row.rowIndex + 1}. ${row.reviewId}: ${row.sourceName} (${row.family}) - ${row.validationStatus}`).join("\n")}

## Boundary

${workbench.boundary}
`;

fs.writeFileSync(outputMd, md, "utf8");

console.log(JSON.stringify({
  ok: true,
  workbenchStatus: workbench.workbenchStatus,
  packetId: workbench.packetId,
  nodeCount: workbench.nodeCount,
  reviewRows: workbench.reviewRows,
  readyRows: workbench.readyRows,
  blockedRows: workbench.blockedRows,
  realHumanInputEntries: workbench.realHumanInputEntries,
  dryRunWrittenRows: workbench.dryRunWrittenRows,
  writeAllowedNow: workbench.writeAllowedNow,
}, null, 2));
