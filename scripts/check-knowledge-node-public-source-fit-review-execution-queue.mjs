import fs from "node:fs";

const queuePath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_EXECUTION_QUEUE.json";
const queueMdPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_EXECUTION_QUEUE.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const queue = readJson(queuePath);
if (!fs.existsSync(queueMdPath)) fail(`missing ${queueMdPath}`);

if (queue.educationOnly !== true) fail("queue must keep educationOnly:true");
if (queue.productionReady !== false) fail("queue must keep productionReady:false");
if (queue.learnerFacingRelease !== false) fail("queue must keep learnerFacingRelease:false");
if (queue.approvalStatus !== "not_approved") fail("queue must remain not_approved");
if (queue.queueStatus !== "node_public_source_fit_review_execution_queue_ready_release_blocked") {
  fail(`unexpected queueStatus: ${queue.queueStatus}`);
}
if (queue.queueMode !== "module_batch_review_for_public_source_fit_candidates") fail("unexpected queueMode");
if (queue.batchSize !== 60) fail("unexpected batch size");
if (queue.modules !== 12) fail("expected 12 modules");
if (queue.candidateTargetNodes !== 273) fail("candidate target nodes drifted");
if (queue.reviewRows !== 1638) fail("review rows drifted");
if (queue.validationStatus !== "blocked_missing_real_reviewer_source_fit_input") fail("validation status drifted");
if (queue.readyRows !== 0 || queue.blockedRows !== 1638) fail("review row readiness drifted");
if (queue.missingFieldRows !== 1638 || queue.forbiddenHitRows !== 0) fail("review validation quality drifted");
if (
  queue.realHumanInputEntries !== 0 ||
  queue.learnerCitationApprovedRows !== 0 ||
  queue.copiedTextApprovedRows !== 0
) {
  fail("queue must not claim real human or learner approval while blank");
}
if (queue.totalBatches !== 35) fail(`unexpected batch count: ${queue.totalBatches}`);
if (queue.readyBatches !== 0 || queue.blockedBatches !== queue.totalBatches) fail("batch readiness drifted");
if (queue.writeAllowedNow !== false || queue.manualAuthorizationRequired !== true) fail("queue must not allow writes");
if (queue.upstreamReviewGateStatus !== "local_course_review_gate_dashboard_ready_release_blocked") {
  fail("queue must stay tied to blocked review dashboard");
}

if (!Array.isArray(queue.moduleRows) || queue.moduleRows.length !== 12) fail("expected 12 module rows");
if (!Array.isArray(queue.batchRows) || queue.batchRows.length !== queue.totalBatches) fail("batchRows count mismatch");
if (!Array.isArray(queue.firstPriorityBatches) || queue.firstPriorityBatches.length !== 6) fail("expected 6 first priority batches");

const moduleRowTotal = queue.moduleRows.reduce((sum, row) => sum + (row.reviewRows || 0), 0);
const batchRowTotal = queue.batchRows.reduce((sum, row) => sum + (row.reviewRows || 0), 0);
if (moduleRowTotal !== 1638 || batchRowTotal !== 1638) fail("queue rows do not add up to 1638");
if (queue.moduleRows.reduce((sum, row) => sum + (row.targetNodes || 0), 0) !== 273) fail("module node counts do not add up");

for (const row of queue.moduleRows) {
  if (!row.module || !row.nextBatchId) fail("module row missing identity or next batch");
  if (row.targetNodes <= 0 || row.reviewRows <= 0 || row.batchCount <= 0) fail(`module ${row.module} has invalid counts`);
  if (row.readyRows !== 0 || row.blockedRows !== row.reviewRows) fail(`module ${row.module} readiness drift`);
  if (row.reviewStatus !== "blocked_missing_real_reviewer_input") fail(`module ${row.module} must remain blocked`);
  if (!/fill_real_reviewer/.test(row.nextGate || "")) fail(`module ${row.module} missing reviewer next gate`);
}

for (const batch of queue.batchRows) {
  if (!batch.batchId || !batch.module || !batch.owner || !batch.command) fail("batch row missing identity");
  if (batch.status !== "blocked_missing_real_reviewer_input") fail(`${batch.batchId} must remain blocked`);
  if (batch.owner !== "real_reviewer") fail(`${batch.batchId} must be owned by real_reviewer`);
  if (batch.reviewRows < 1 || batch.reviewRows > queue.batchSize) fail(`${batch.batchId} row count out of range`);
  if (batch.readyRows !== 0 || batch.blockedRows !== batch.reviewRows) fail(`${batch.batchId} readiness drift`);
  if (!/validate:knowledge-node-public-source-fit-review-input/.test(batch.command)) fail(`${batch.batchId} missing validation command`);
  if (!Array.isArray(batch.sampleRows) || batch.sampleRows.length < 1) fail(`${batch.batchId} missing samples`);
  if (!/real reviewer completes decisions/i.test(batch.nextGate || "")) fail(`${batch.batchId} missing real reviewer gate`);
}

if (!Array.isArray(queue.reviewerChecklist) || queue.reviewerChecklist.length < 5) fail("reviewer checklist too thin");
if (!Array.isArray(queue.commands) || !queue.commands.some((item) => item.includes("check:knowledge-node-public-source-fit-review-execution-queue"))) {
  fail("commands missing queue check");
}

const boundaryText = `${queue.boundary || ""} ${queue.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "execution planning only",
  "all 1638 node public source-fit rows",
  "does not approve sources",
  "copied text",
  "learner-facing citations",
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
  educationOnly: queue.educationOnly,
  productionReady: queue.productionReady,
  learnerFacingRelease: queue.learnerFacingRelease,
  approvalStatus: queue.approvalStatus,
  queueStatus: queue.queueStatus,
  modules: queue.modules,
  candidateTargetNodes: queue.candidateTargetNodes,
  reviewRows: queue.reviewRows,
  totalBatches: queue.totalBatches,
  blockedBatches: queue.blockedBatches,
  readyRows: queue.readyRows,
  blockedRows: queue.blockedRows,
  realHumanInputEntries: queue.realHumanInputEntries,
  writeAllowedNow: queue.writeAllowedNow,
}, null, 2));
