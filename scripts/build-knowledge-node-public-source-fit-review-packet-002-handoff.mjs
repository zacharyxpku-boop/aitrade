import fs from "node:fs";

const outputJson = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_HANDOFF.json";
const outputMd = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_HANDOFF.md";

const sources = {
  inputTemplate: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE.json",
  packetValidation: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE_VALIDATION.json",
  mergePreview: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_MERGE_PREVIEW.json",
  mergeApplyReport: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_MERGE_APPLY_REPORT.json",
  progressMatrix: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PROGRESS_MATRIX.json",
  reviewGateDashboard: "docs/LOCAL_COURSE_REVIEW_GATE_DASHBOARD.json",
};

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

const data = Object.fromEntries(Object.entries(sources).map(([key, file]) => [key, readJson(file)]));
for (const [key, artifact] of Object.entries(data)) assertBoundary(artifact, key);

const packetId = data.inputTemplate.packetId;
const phaseRows = [
  {
    order: 1,
    id: "inspect_packet_002_input_copy_template",
    status: data.inputTemplate.templateStatus,
    inputFile: sources.inputTemplate,
    command: "npm.cmd run check:knowledge-node-public-source-fit-review-packet-002-input-copy-template",
    reviewerAction: "Open the packet 002 input copy and fill only reviewerDecision, sourceFitNotes, citationUse, reviewerName, reviewedAt, and realHumanInput for rows you personally reviewed.",
    hardStop: "Stop if the file is not packet 002, has fewer than 60 rows, or any row already claims learnerCitationApproved/copy approval.",
  },
  {
    order: 2,
    id: "validate_packet_002_input_copy",
    status: data.packetValidation.validationStatus,
    inputFile: sources.packetValidation,
    command: "npm.cmd run validate:knowledge-node-public-source-fit-review-packet-002-input-copy-template && npm.cmd run check:knowledge-node-public-source-fit-review-packet-002-input-copy-template",
    reviewerAction: "Rerun packet 002 validation after filling; all 60 rows must be ready before merge preview can proceed.",
    hardStop: "Stop while readyRows is 0, blockedRows is 60, missingFieldRows is 60, or realHumanInputEntries is 0.",
  },
  {
    order: 3,
    id: "rebuild_packet_002_merge_preview",
    status: data.mergePreview.mergePreviewStatus,
    inputFile: sources.mergePreview,
    command: "npm.cmd run build:knowledge-node-public-source-fit-review-packet-002-merge-preview && npm.cmd run check:knowledge-node-public-source-fit-review-packet-002-merge-preview",
    reviewerAction: "Confirm every packet 002 row maps back to the 1638-row full source-fit draft before any merge apply.",
    hardStop: "Stop unless mappedRows is 60, missingTargetRows is 0, and mergeAllowedNow is true after real review.",
  },
  {
    order: 4,
    id: "run_packet_002_merge_apply_dry_run",
    status: data.mergeApplyReport.applyStatus,
    inputFile: sources.mergeApplyReport,
    command: "npm.cmd run apply:knowledge-node-public-source-fit-review-packet-002-merge && npm.cmd run check:knowledge-node-public-source-fit-review-packet-002-merge-apply-report",
    reviewerAction: "Use dry-run apply to verify willWrite stays false until packet 002 is fully ready and explicit write authorization exists.",
    hardStop: "Stop if writtenRows is nonzero in dry-run or any row willWrite before manual approval.",
  },
  {
    order: 5,
    id: "rerun_progress_matrix",
    status: data.progressMatrix.matrixStatus,
    inputFile: sources.progressMatrix,
    command: "npm.cmd run build:knowledge-node-public-source-fit-review-progress-matrix && npm.cmd run check:knowledge-node-public-source-fit-review-progress-matrix",
    reviewerAction: "After an authorized merge, rerun the packet/module progress matrix and confirm packet 002 moves from blocked to ready.",
    hardStop: "Stop if progress changes without real human input or if learner citations/copy approval appear.",
  },
  {
    order: 6,
    id: "rerun_review_gate_dashboard",
    status: data.reviewGateDashboard.dashboardStatus,
    inputFile: sources.reviewGateDashboard,
    command: "npm.cmd run build:local-course-review-gate-dashboard && npm.cmd run check:local-course-review-gate-dashboard",
    reviewerAction: "Refresh the single-screen review gate so packet progress, source-fit rows, and write authorization remain visible.",
    hardStop: "Stop if writeAllowedNow becomes true before all real review gates and separate approval pass.",
  },
];

const handoff = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  handoffStatus: "node_public_source_fit_packet_002_handoff_ready_blocked_on_real_input",
  handoffMode: "single_packet_reviewer_execution_path",
  packetId,
  batchId: data.inputTemplate.batchId,
  module: data.inputTemplate.module,
  inputCopyPath: data.inputTemplate.inputCopyPath,
  reviewRows: data.inputTemplate.reviewRows,
  targetNodes: data.inputTemplate.targetNodes,
  packetReadyRows: data.packetValidation.readyRows,
  packetBlockedRows: data.packetValidation.blockedRows,
  packetMissingFieldRows: data.packetValidation.missingFieldRows,
  packetRealHumanInputEntries: data.packetValidation.realHumanInputEntries,
  mergeMappedRows: data.mergePreview.mappedRows,
  mergeReadyRows: data.mergePreview.readyRows,
  mergeBlockedRows: data.mergePreview.blockedRows,
  mergeAllowedNow: data.mergePreview.mergeAllowedNow,
  mergeDryRunWrittenRows: data.mergeApplyReport.writtenRows,
  progressReadyPackets: data.progressMatrix.readyPackets,
  progressBlockedPackets: data.progressMatrix.blockedPackets,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  phaseRows,
  hardStops: [
    "Do not fill reviewer fields unless a real reviewer has inspected the node and source.",
    "Do not set realHumanInput:true for generated, copied, fixture, or unreviewed rows.",
    "Do not approve learner-facing citations or copied text in this packet handoff.",
    "Do not run --write unless packet validation is fully ready, merge preview is ready, dry-run has been reviewed, and explicit human authorization names the exact input path.",
    "Do not introduce stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
  ],
  commands: [
    "npm.cmd run check:knowledge-node-public-source-fit-review-packet-002-handoff",
    "npm.cmd run check:knowledge-node-public-source-fit-review-packet-002-input-copy-template",
    "npm.cmd run check:knowledge-node-public-source-fit-review-packet-002-merge-preview",
    "npm.cmd run check:knowledge-node-public-source-fit-review-packet-002-merge-apply-report",
    "npm.cmd run verify",
  ],
  completionRule: "This handoff is executable only as reviewer operations. It does not fill packet rows, does not create human judgments, does not approve learner-facing citations, and does not authorize --write. Packet 002 remains blocked until all 60 rows contain real human source-fit review input and pass validation.",
  boundary: "Node public source-fit packet 002 handoff is reviewer-facing education-only operations material. It organizes the second packet's input copy, validation, merge preview, dry-run apply, and progress checks; it does not write lessons, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.writeFileSync(outputJson, `${JSON.stringify(handoff, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Knowledge Node Public Source-Fit Review Packet 002 Handoff",
  "",
  `- Status: ${handoff.handoffStatus}`,
  `- Packet: ${handoff.packetId}`,
  `- Module: ${handoff.module}`,
  `- Input copy: ${handoff.inputCopyPath}`,
  `- Review rows: ${handoff.reviewRows}`,
  `- Packet ready/blocked: ${handoff.packetReadyRows}/${handoff.packetBlockedRows}`,
  `- Merge mapped/ready/blocked: ${handoff.mergeMappedRows}/${handoff.mergeReadyRows}/${handoff.mergeBlockedRows}`,
  `- Dry-run written rows: ${handoff.mergeDryRunWrittenRows}`,
  `- Packet progress ready/blocked: ${handoff.progressReadyPackets}/${handoff.progressBlockedPackets}`,
  `- Write allowed now: ${handoff.writeAllowedNow}`,
  "",
  "## Phases",
  "",
  "| # | Phase | Status | Command | Hard stop |",
  "|---:|---|---|---|---|",
  ...phaseRows.map((row) => `| ${row.order} | ${row.id} | ${row.status} | \`${row.command}\` | ${row.hardStop} |`),
  "",
  "## Hard Stops",
  "",
  ...handoff.hardStops.map((item) => `- ${item}`),
  "",
  "## Boundary",
  "",
  handoff.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: handoff.educationOnly,
  productionReady: handoff.productionReady,
  learnerFacingRelease: handoff.learnerFacingRelease,
  approvalStatus: handoff.approvalStatus,
  handoffStatus: handoff.handoffStatus,
  packetId: handoff.packetId,
  reviewRows: handoff.reviewRows,
  packetReadyRows: handoff.packetReadyRows,
  packetBlockedRows: handoff.packetBlockedRows,
  mergeMappedRows: handoff.mergeMappedRows,
  mergeDryRunWrittenRows: handoff.mergeDryRunWrittenRows,
  writeAllowedNow: handoff.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
