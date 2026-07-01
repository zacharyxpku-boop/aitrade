import fs from "node:fs";

const previewPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_MERGE_PREVIEW.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const preview = readJson(previewPath);

if (preview.educationOnly !== true) fail("preview must keep educationOnly:true");
if (preview.productionReady !== false) fail("preview must keep productionReady:false");
if (preview.learnerFacingRelease !== false) fail("preview must keep learnerFacingRelease:false");
if (preview.approvalStatus !== "not_approved") fail("preview must remain not_approved");
if (preview.mergePreviewStatus !== "packet_002_merge_preview_blocked_missing_ready_packet_input") {
  fail(`unexpected merge preview status: ${preview.mergePreviewStatus}`);
}
if (preview.mergePreviewMode !== "dry_run_packet_input_copy_to_full_source_fit_draft_mapping") fail("unexpected merge preview mode");
if (preview.packetId !== "node-public-source-fit-batch-002-packet") fail("merge preview must target packet 002");
if (preview.packetRows !== 60 || preview.fullDraftRows !== 1638 || preview.fullValidationRows !== 1638) fail("merge row counts drift");
if (preview.mappedRows !== 60 || preview.missingTargetRows !== 0) fail("packet rows must map to full draft");
if (preview.readyRows !== 0 || preview.blockedRows !== 60) fail("blank packet must remain blocked for merge");
if (preview.packetValidationStatus !== "blocked_missing_real_reviewer_source_fit_input") fail("packet validation status drift");
if (preview.packetReadyRows !== 0 || preview.packetBlockedRows !== 60 || preview.packetMissingFieldRows !== 60) {
  fail("packet validation counts drift");
}
if (preview.packetForbiddenHitRows !== 0 || preview.packetRealHumanInputEntries !== 0) {
  fail("blank packet must not claim human input or forbidden hits");
}
if (preview.fullDraftReadyRowsBeforeMerge !== 0 || preview.fullDraftBlockedRowsBeforeMerge !== 1638) {
  fail("full draft validation baseline drift");
}
if (preview.mergeAllowedNow !== false || preview.writeAllowedNow !== false || preview.manualAuthorizationRequired !== true) {
  fail("merge/write gates must remain locked");
}

if (!Array.isArray(preview.mergeRows) || preview.mergeRows.length !== 60) fail("merge rows missing");
for (const row of preview.mergeRows) {
  if (!Number.isInteger(row.packetRowIndex) || !Number.isInteger(row.targetFullDraftRowIndex)) fail("merge row indexes missing");
  if (!row.reviewId || !row.nodeId || !row.documentId || !row.sourceName) fail("merge row identity missing");
  if (row.mappedToFullDraft !== true || row.readyForMerge !== false) fail("blank merge row readiness drift");
  if (row.mergeBlockedReason !== "packet_row_not_ready_for_merge") fail("blank merge row should be blocked on packet readiness");
  if (row.fieldCopyPlan?.reviewerDecision?.from !== `/rows/${row.packetRowIndex}/reviewerDecision`) {
    fail("reviewerDecision source pointer drift");
  }
  if (row.fieldCopyPlan?.reviewerDecision?.to !== `/rows/${row.targetFullDraftRowIndex}/reviewerDecision`) {
    fail("reviewerDecision target pointer drift");
  }
}
if (!Array.isArray(preview.sampleMergeRows) || preview.sampleMergeRows.length !== 12) fail("sample merge rows drift");
if (!Array.isArray(preview.commands) || !preview.commands.some((item) => item.includes("check:knowledge-node-public-source-fit-review-packet-002-merge-preview"))) {
  fail("preview commands missing self-check");
}

const boundaryText = `${preview.boundary || ""} ${preview.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "dry-run reviewer operations",
  "does not write the full source-fit draft",
  "create human judgments",
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
  educationOnly: preview.educationOnly,
  productionReady: preview.productionReady,
  learnerFacingRelease: preview.learnerFacingRelease,
  approvalStatus: preview.approvalStatus,
  mergePreviewStatus: preview.mergePreviewStatus,
  packetId: preview.packetId,
  packetRows: preview.packetRows,
  mappedRows: preview.mappedRows,
  readyRows: preview.readyRows,
  blockedRows: preview.blockedRows,
  mergeAllowedNow: preview.mergeAllowedNow,
  writeAllowedNow: preview.writeAllowedNow,
}, null, 2));
