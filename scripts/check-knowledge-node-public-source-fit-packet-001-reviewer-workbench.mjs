import fs from "node:fs";

const workbenchPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_PACKET_001_REVIEWER_WORKBENCH.json";
const workbenchMdPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_PACKET_001_REVIEWER_WORKBENCH.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const workbench = readJson(workbenchPath);
if (!fs.existsSync(workbenchMdPath)) fail(`missing ${workbenchMdPath}`);

if (workbench.educationOnly !== true) fail("workbench must keep educationOnly:true");
if (workbench.productionReady !== false) fail("workbench must keep productionReady:false");
if (workbench.learnerFacingRelease !== false) fail("workbench must keep learnerFacingRelease:false");
if (workbench.approvalStatus !== "not_approved") fail("workbench must remain not_approved");
if (workbench.workbenchStatus !== "packet_001_reviewer_workbench_ready_blocked_on_real_input") {
  fail(`unexpected workbenchStatus: ${workbench.workbenchStatus}`);
}
if (workbench.workbenchMode !== "readonly_packet_row_browser_for_real_source_fit_review") fail("unexpected workbenchMode");
if (workbench.packetId !== "node-public-source-fit-batch-001-packet") fail("workbench must target packet 001");
if (!/PACKET_001_INPUT_COPY_TEMPLATE/.test(workbench.inputCopyPath || "")) fail("missing packet 001 input copy path");
if (!/INPUT_COPY_TEMPLATE_VALIDATION/.test(workbench.validationPath || "")) fail("missing validation path");
if (!/MERGE_PREVIEW/.test(workbench.mergePreviewPath || "")) fail("missing merge preview path");
if (!/MERGE_APPLY_REPORT/.test(workbench.applyReportPath || "")) fail("missing merge apply report path");

if (workbench.nodeCount !== 10) fail(`expected 10 nodes, got ${workbench.nodeCount}`);
if (workbench.reviewRows !== 60) fail(`expected 60 review rows, got ${workbench.reviewRows}`);
if (workbench.readyRows !== 0 || workbench.blockedRows !== 60 || workbench.missingFieldRows !== 60) {
  fail("packet row readiness drift");
}
if (workbench.invalidDecisionRows !== 0 || workbench.forbiddenHitRows !== 0) fail("unexpected invalid/forbidden rows");
if (workbench.realHumanInputEntries !== 0) fail("workbench must not claim real human input");
if (workbench.learnerCitationApprovedRows !== 0 || workbench.copiedTextApprovedRows !== 0) {
  fail("workbench must not claim citation/copy approval");
}
if (workbench.mergeMappedRows !== 60 || workbench.mergeMissingTargetRows !== 0) fail("merge mapping drift");
if (workbench.dryRunWrittenRows !== 0) fail("dry-run must not write rows");
if (workbench.writeAllowedNow !== false || workbench.manualAuthorizationRequired !== true) fail("write gate must remain locked");

const expectedEditableFields = [
  "reviewerDecision",
  "sourceFitNotes",
  "citationUse",
  "reviewerName",
  "reviewedAt",
  "realHumanInput",
];
if (!Array.isArray(workbench.reviewerEditableFields) || workbench.reviewerEditableFields.join("|") !== expectedEditableFields.join("|")) {
  fail("reviewer editable fields drift");
}
for (const locked of ["learnerCitationApproved:false", "copiedTextApproved:false", "writeAllowedNow:false"]) {
  if (!workbench.lockedFields?.includes(locked)) fail(`locked field missing: ${locked}`);
}

if (!Array.isArray(workbench.nodeRows) || workbench.nodeRows.length !== 10) fail("nodeRows must contain 10 rows");
if (!Array.isArray(workbench.rows) || workbench.rows.length !== 60) fail("rows must contain 60 rows");
for (const node of workbench.nodeRows) {
  if (!node.nodeId || !node.title || !node.module) fail("node row missing identity");
  if (node.candidateRows !== 6) fail(`${node.nodeId} must have 6 candidate rows`);
  if (node.readyRows !== 0 || node.blockedRows !== 6) fail(`${node.nodeId} readiness drift`);
  if (node.reviewStatus !== "blocked_missing_real_reviewer_input") fail(`${node.nodeId} review status drift`);
  if (!Array.isArray(node.sampleSources) || node.sampleSources.length === 0) fail(`${node.nodeId} missing sample sources`);
}
for (const [index, row] of workbench.rows.entries()) {
  if (row.rowIndex !== index) fail(`row ${index} index drift`);
  if (!row.reviewId || !row.nodeId || !row.documentId || !row.sourceName || !row.url) fail(`row ${index} missing source identity`);
  if (row.validationStatus !== "blocked_missing_or_invalid_reviewer_input") fail(`row ${index} validation drift`);
  if (row.reviewStatus !== "blocked_missing_real_reviewer_input") fail(`row ${index} review status drift`);
  if (!Array.isArray(row.missingFields) || row.missingFields.length < 5) fail(`row ${index} missing field list drift`);
  if (row.realHumanInput !== false || row.learnerCitationApproved !== false || row.copiedTextApproved !== false) {
    fail(`row ${index} forbidden approval/input drift`);
  }
  if (row.willWrite !== false || row.applyStatus !== "blocked_not_ready") fail(`row ${index} write/apply drift`);
  if (!Array.isArray(row.requiredDecisionValues) || row.requiredDecisionValues.length !== 3) {
    fail(`row ${index} required decision values drift`);
  }
}

if (!Array.isArray(workbench.commands) || workbench.commands.length < 8) fail("commands missing");
for (const pattern of [
  /build:knowledge-node-public-source-fit-packet-001-reviewer-workbench/,
  /check:knowledge-node-public-source-fit-packet-001-reviewer-workbench/,
  /validate:knowledge-node-public-source-fit-review-packet-input-copy-template/,
  /check:knowledge-node-public-source-fit-review-packet-merge-apply-report/,
]) {
  if (!workbench.commands.some((item) => pattern.test(item))) fail(`command missing: ${pattern}`);
}

const boundaryText = `${workbench.boundary || ""} ${workbench.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "readonly browser",
  "all 60 rows",
  "real human source-fit review input",
  "does not generate human decisions",
  "approve copied text",
  "approve learner-facing citations",
  "authorize writes",
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
