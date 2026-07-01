import fs from "node:fs";

const outputJson = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PROGRESS_MATRIX.json";
const outputMd = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PROGRESS_MATRIX.md";

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

const packets = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_BATCH_PACKETS.json");
const validation = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_VALIDATION.json");

assertBoundary("batch packets", packets);
assertBoundary("validation", validation);

const validationByReviewId = new Map((validation.validationRows || []).map((row) => [row.reviewId, row]));
const moduleMap = new Map();
const packetRows = (packets.batchPackets || []).map((packet) => {
  const validationRows = (packet.packetRows || []).map((row) => validationByReviewId.get(row.reviewId)).filter(Boolean);
  const readyRows = validationRows.filter((row) => /^ready/.test(row.validationStatus || "")).length;
  const blockedRows = validationRows.filter((row) => !/^ready/.test(row.validationStatus || "")).length;
  const missingFieldRows = validationRows.filter((row) => (row.missingFields || []).length > 0).length;
  const invalidDecisionRows = validationRows.filter((row) => row.invalidDecision === true).length;
  const forbiddenHitRows = validationRows.filter((row) => (row.forbiddenHits || []).length > 0).length;
  const realHumanInputEntries = validationRows.filter((row) => row.realHumanInput === true).length;
  const learnerCitationApprovedRows = validationRows.filter((row) => row.learnerCitationApproved === true).length;
  const copiedTextApprovedRows = validationRows.filter((row) => row.copiedTextApproved === true).length;
  const row = {
    packetId: packet.packetId,
    batchId: packet.batchId,
    order: packet.order,
    module: packet.module,
    reviewRows: packet.reviewRows,
    validationRows: validationRows.length,
    readyRows,
    blockedRows,
    missingFieldRows,
    invalidDecisionRows,
    forbiddenHitRows,
    realHumanInputEntries,
    learnerCitationApprovedRows,
    copiedTextApprovedRows,
    progressPercent: packet.reviewRows ? Math.round((readyRows / packet.reviewRows) * 100) : 0,
    progressStatus: readyRows === packet.reviewRows
      ? "ready_for_source_fit_gate"
      : "blocked_missing_real_reviewer_input",
    nextGate: readyRows === packet.reviewRows
      ? "rerun_triangulation_and_write_authorization_preview"
      : "fill_missing_reviewer_decisions_notes_citation_use_name_and_timestamp",
  };
  const moduleRow = moduleMap.get(packet.module) || {
    module: packet.module,
    packets: 0,
    reviewRows: 0,
    readyRows: 0,
    blockedRows: 0,
    missingFieldRows: 0,
    forbiddenHitRows: 0,
    realHumanInputEntries: 0,
    learnerCitationApprovedRows: 0,
    copiedTextApprovedRows: 0,
    firstBlockedPacketId: "",
  };
  moduleRow.packets += 1;
  moduleRow.reviewRows += row.reviewRows;
  moduleRow.readyRows += row.readyRows;
  moduleRow.blockedRows += row.blockedRows;
  moduleRow.missingFieldRows += row.missingFieldRows;
  moduleRow.forbiddenHitRows += row.forbiddenHitRows;
  moduleRow.realHumanInputEntries += row.realHumanInputEntries;
  moduleRow.learnerCitationApprovedRows += row.learnerCitationApprovedRows;
  moduleRow.copiedTextApprovedRows += row.copiedTextApprovedRows;
  if (!moduleRow.firstBlockedPacketId && row.blockedRows > 0) moduleRow.firstBlockedPacketId = row.packetId;
  moduleMap.set(packet.module, moduleRow);
  return row;
});

const moduleRows = [...moduleMap.values()].map((row) => ({
  ...row,
  progressPercent: row.reviewRows ? Math.round((row.readyRows / row.reviewRows) * 100) : 0,
  progressStatus: row.readyRows === row.reviewRows ? "ready_for_source_fit_gate" : "blocked_missing_real_reviewer_input",
}));

const matrix = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  matrixStatus: "node_public_source_fit_review_progress_matrix_ready_release_blocked",
  matrixMode: "batch_and_module_progress_from_real_review_validation",
  sourcePacketsPath: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_BATCH_PACKETS.json",
  sourceValidationPath: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_VALIDATION.json",
  modules: packets.modules,
  totalPackets: packets.totalPackets,
  totalReviewRows: packets.reviewRows,
  validationStatus: validation.validationStatus,
  readyRows: validation.readyRows,
  blockedRows: validation.blockedRows,
  missingFieldRows: validation.missingFieldRows,
  invalidDecisionRows: validation.invalidDecisionRows,
  forbiddenHitRows: validation.forbiddenHitRows,
  realHumanInputEntries: validation.realHumanInputEntries,
  learnerCitationApprovedRows: validation.learnerCitationApprovedRows,
  copiedTextApprovedRows: validation.copiedTextApprovedRows,
  readyPackets: packetRows.filter((row) => row.progressStatus === "ready_for_source_fit_gate").length,
  blockedPackets: packetRows.filter((row) => row.progressStatus !== "ready_for_source_fit_gate").length,
  readyModules: moduleRows.filter((row) => row.progressStatus === "ready_for_source_fit_gate").length,
  blockedModules: moduleRows.filter((row) => row.progressStatus !== "ready_for_source_fit_gate").length,
  overallProgressPercent: packets.reviewRows ? Math.round((validation.readyRows / packets.reviewRows) * 100) : 0,
  firstBlockedPacketId: packetRows.find((row) => row.blockedRows > 0)?.packetId || "",
  firstPriorityBlockedPackets: packetRows.filter((row) => row.blockedRows > 0).slice(0, 6),
  moduleRows,
  packetRows,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  commands: [
    "npm.cmd run validate:knowledge-node-public-source-fit-review-input",
    "npm.cmd run build:knowledge-node-public-source-fit-review-progress-matrix",
    "npm.cmd run check:knowledge-node-public-source-fit-review-progress-matrix",
    "npm.cmd run check:knowledge-node-public-source-fit-review-batch-packets",
  ],
  completionRule: "This progress matrix reports source-fit reviewer progress from validation output only. It does not infer missing reviewer decisions, approve sources, approve learner-facing citations, write lessons, or authorize release.",
  boundary: "Node public source-fit review progress matrix is reviewer-facing education-only governance. It does not approve copied text, learner-facing citations, stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(matrix, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Knowledge Node Public Source-Fit Review Progress Matrix",
  "",
  `- Matrix status: ${matrix.matrixStatus}`,
  `- Validation status: ${matrix.validationStatus}`,
  `- Rows ready/blocked: ${matrix.readyRows}/${matrix.blockedRows}`,
  `- Packets ready/blocked: ${matrix.readyPackets}/${matrix.blockedPackets}`,
  `- Modules ready/blocked: ${matrix.readyModules}/${matrix.blockedModules}`,
  `- Overall progress: ${matrix.overallProgressPercent}%`,
  `- Write allowed now: ${matrix.writeAllowedNow}`,
  "",
  "## First Blocked Packets",
  "",
  "| Packet | Module | Ready | Blocked | Missing | Forbidden | Progress |",
  "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
  ...matrix.firstPriorityBlockedPackets.map((row) => `| ${row.packetId} | ${row.module} | ${row.readyRows} | ${row.blockedRows} | ${row.missingFieldRows} | ${row.forbiddenHitRows} | ${row.progressPercent}% |`),
  "",
  "## Module Progress",
  "",
  "| Module | Packets | Ready | Blocked | Missing | First blocked packet |",
  "| --- | ---: | ---: | ---: | ---: | --- |",
  ...matrix.moduleRows.map((row) => `| ${row.module} | ${row.packets} | ${row.readyRows} | ${row.blockedRows} | ${row.missingFieldRows} | ${row.firstBlockedPacketId} |`),
  "",
  "## Completion Rule",
  "",
  matrix.completionRule,
  "",
  "## Boundary",
  "",
  matrix.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: matrix.educationOnly,
  productionReady: matrix.productionReady,
  learnerFacingRelease: matrix.learnerFacingRelease,
  approvalStatus: matrix.approvalStatus,
  matrixStatus: matrix.matrixStatus,
  totalPackets: matrix.totalPackets,
  totalReviewRows: matrix.totalReviewRows,
  readyRows: matrix.readyRows,
  blockedRows: matrix.blockedRows,
  readyPackets: matrix.readyPackets,
  blockedPackets: matrix.blockedPackets,
  firstBlockedPacketId: matrix.firstBlockedPacketId,
  writeAllowedNow: matrix.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
