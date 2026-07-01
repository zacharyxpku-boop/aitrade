import fs from "node:fs";

const matrixPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PROGRESS_MATRIX.json";
const matrixMdPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PROGRESS_MATRIX.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const matrix = readJson(matrixPath);
if (!fs.existsSync(matrixMdPath)) fail(`missing ${matrixMdPath}`);

if (matrix.educationOnly !== true) fail("matrix must keep educationOnly:true");
if (matrix.productionReady !== false) fail("matrix must keep productionReady:false");
if (matrix.learnerFacingRelease !== false) fail("matrix must keep learnerFacingRelease:false");
if (matrix.approvalStatus !== "not_approved") fail("matrix must remain not_approved");
if (matrix.matrixStatus !== "node_public_source_fit_review_progress_matrix_ready_release_blocked") {
  fail(`unexpected matrixStatus: ${matrix.matrixStatus}`);
}
if (matrix.matrixMode !== "batch_and_module_progress_from_real_review_validation") fail("unexpected matrix mode");
if (!/BATCH_PACKETS/.test(matrix.sourcePacketsPath || "")) fail("missing source packets path");
if (!/INPUT_VALIDATION/.test(matrix.sourceValidationPath || "")) fail("missing source validation path");
if (matrix.modules !== 12) fail("expected 12 modules");
if (matrix.totalPackets !== 35) fail("expected 35 packets");
if (matrix.totalReviewRows !== 1638) fail("expected 1638 review rows");
if (matrix.validationStatus !== "blocked_missing_real_reviewer_source_fit_input") fail("validation status drift");
if (matrix.readyRows !== 0 || matrix.blockedRows !== 1638 || matrix.missingFieldRows !== 1638) fail("blank progress readiness drift");
if (matrix.invalidDecisionRows !== 0 || matrix.forbiddenHitRows !== 0) fail("blank progress quality drift");
if (
  matrix.realHumanInputEntries !== 0 ||
  matrix.learnerCitationApprovedRows !== 0 ||
  matrix.copiedTextApprovedRows !== 0
) {
  fail("matrix must not claim human or learner approval while blank");
}
if (matrix.readyPackets !== 0 || matrix.blockedPackets !== 35) fail("packet progress drift");
if (matrix.readyModules !== 0 || matrix.blockedModules !== 12) fail("module progress drift");
if (matrix.overallProgressPercent !== 0) fail("blank matrix progress must be 0%");
if (matrix.firstBlockedPacketId !== "node-public-source-fit-batch-001-packet") fail("unexpected first blocked packet");
if (matrix.writeAllowedNow !== false || matrix.manualAuthorizationRequired !== true) fail("matrix must not allow writes");

if (!Array.isArray(matrix.packetRows) || matrix.packetRows.length !== 35) fail("packetRows must cover 35 packets");
if (!Array.isArray(matrix.moduleRows) || matrix.moduleRows.length !== 12) fail("moduleRows must cover 12 modules");
if (!Array.isArray(matrix.firstPriorityBlockedPackets) || matrix.firstPriorityBlockedPackets.length !== 6) fail("expected 6 priority blocked packets");

const packetTotal = matrix.packetRows.reduce((sum, row) => sum + (row.reviewRows || 0), 0);
const packetReadyTotal = matrix.packetRows.reduce((sum, row) => sum + (row.readyRows || 0), 0);
const packetBlockedTotal = matrix.packetRows.reduce((sum, row) => sum + (row.blockedRows || 0), 0);
const moduleTotal = matrix.moduleRows.reduce((sum, row) => sum + (row.reviewRows || 0), 0);
if (packetTotal !== 1638 || moduleTotal !== 1638) fail("progress row totals must add to 1638");
if (packetReadyTotal !== 0 || packetBlockedTotal !== 1638) fail("packet ready/blocked totals drift");

for (const row of matrix.packetRows) {
  if (!row.packetId || !row.batchId || !row.module) fail("packet row missing identity");
  if (row.validationRows !== row.reviewRows) fail(`${row.packetId} validation row mismatch`);
  if (row.readyRows !== 0 || row.blockedRows !== row.reviewRows) fail(`${row.packetId} readiness drift`);
  if (row.missingFieldRows !== row.reviewRows) fail(`${row.packetId} missing field drift`);
  if (row.progressStatus !== "blocked_missing_real_reviewer_input") fail(`${row.packetId} must remain blocked`);
  if (!/fill_missing_reviewer/.test(row.nextGate || "")) fail(`${row.packetId} missing next gate`);
}

for (const row of matrix.moduleRows) {
  if (!row.module || !row.firstBlockedPacketId) fail("module row missing identity or first blocked packet");
  if (row.readyRows !== 0 || row.blockedRows !== row.reviewRows) fail(`${row.module} module readiness drift`);
  if (row.missingFieldRows !== row.reviewRows) fail(`${row.module} module missing fields drift`);
  if (row.progressStatus !== "blocked_missing_real_reviewer_input") fail(`${row.module} must remain blocked`);
}

if (!Array.isArray(matrix.commands) || !matrix.commands.some((item) => item.includes("check:knowledge-node-public-source-fit-review-progress-matrix"))) {
  fail("commands missing progress matrix check");
}

const boundaryText = `${matrix.boundary || ""} ${matrix.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "validation output only",
  "does not infer missing reviewer decisions",
  "approve sources",
  "learner-facing citations",
  "write lessons",
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
}, null, 2));
