import fs from "node:fs";

const reportPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_MERGE_APPLY_REPORT.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const report = readJson(reportPath);
const rows = report.applyRows || [];

if (report.educationOnly !== true) fail("report must keep educationOnly:true");
if (report.productionReady !== false) fail("report must keep productionReady:false");
if (report.learnerFacingRelease !== false) fail("report must keep learnerFacingRelease:false");
if (report.approvalStatus !== "not_approved") fail("report must remain not_approved");
if (report.applyMode !== "dry_run") fail(`expected dry_run applyMode, got ${report.applyMode}`);
if (report.applyStatus !== "blocked_no_ready_merge_rows") fail(`unexpected applyStatus: ${report.applyStatus}`);
if (report.packetId !== "node-public-source-fit-batch-002-packet") fail("report must target packet 002");
if (report.totalRows !== 60 || rows.length !== 60) fail(`expected 60 apply rows, got ${report.totalRows}/${rows.length}`);
if (report.readyToMergeRows !== 0) fail(`expected 0 ready rows, got ${report.readyToMergeRows}`);
if (report.blockedRows !== 60) fail(`expected 60 blocked rows, got ${report.blockedRows}`);
if (report.writtenRows !== 0) fail(`dry-run must not write rows, got ${report.writtenRows}`);
if (report.mergeAllowedNow !== false || report.writeAllowedNow !== false || report.manualAuthorizationRequired !== true) {
  fail("merge/write gates must remain locked");
}
if (report.fullDraftRows !== 1638) fail("full draft row count drift");

for (const row of rows) {
  if (!Number.isInteger(row.packetRowIndex) || !Number.isInteger(row.targetFullDraftRowIndex)) fail("apply row indexes missing");
  if (!row.reviewId || !row.nodeId || !row.documentId || !row.sourceName) fail("apply row identity missing");
  if (row.applyStatus !== "blocked_not_ready") fail(`${row.reviewId} should be blocked_not_ready`);
  if (row.willWrite !== false) fail(`${row.reviewId} dry-run must not write`);
  if (!Array.isArray(row.missingFields) || row.missingFields.length < 1) fail(`${row.reviewId} should report missing fields`);
  if (!Array.isArray(row.forbiddenHits)) fail(`${row.reviewId} forbiddenHits must be an array`);
  if (row.realHumanInput !== false) fail(`${row.reviewId} must not claim real human input`);
}

const boundaryText = `${report.boundary || ""} ${report.nextStep || ""}`.toLowerCase();
for (const phrase of [
  "dry-run mode writes no full draft changes",
  "does not create human judgments",
  "approve copied text",
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
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  applyMode: report.applyMode,
  applyStatus: report.applyStatus,
  totalRows: report.totalRows,
  readyToMergeRows: report.readyToMergeRows,
  blockedRows: report.blockedRows,
  writtenRows: report.writtenRows,
  mergeAllowedNow: report.mergeAllowedNow,
  writeAllowedNow: report.writeAllowedNow,
}, null, 2));
