import fs from "node:fs";

const outputJson = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_MERGE_PREVIEW.json";
const outputMd = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_MERGE_PREVIEW.md";

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

const packetInputPath = "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE.json";
const packetValidationPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE_VALIDATION.json";
const template = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE.json");
const packetInput = readJson(packetInputPath);
const packetValidation = readJson(packetValidationPath);
const fullDraft = readJson("docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_DRAFT.json");
const fullValidation = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_VALIDATION.json");

for (const [name, data] of Object.entries({ template, packetInput, packetValidation, fullDraft, fullValidation })) {
  assertBoundary(data, name);
}

const fullRowsByReviewId = new Map((fullDraft.rows || []).map((row, index) => [row.reviewId, { row, index }]));
const packetValidationByReviewId = new Map((packetValidation.validationRows || []).map((row) => [row.reviewId, row]));

const mergeRows = (packetInput.rows || []).map((row, packetRowIndex) => {
  const fullMatch = fullRowsByReviewId.get(row.reviewId);
  const validationRow = packetValidationByReviewId.get(row.reviewId);
  const sourceFieldsReady = validationRow?.validationStatus === "ready_for_source_fit_review_apply";
  return {
    packetRowIndex,
    targetFullDraftRowIndex: fullMatch?.index ?? -1,
    reviewId: row.reviewId,
    nodeId: row.nodeId,
    documentId: row.documentId,
    sourceName: row.name,
    mappedToFullDraft: Boolean(fullMatch),
    packetValidationStatus: validationRow?.validationStatus || "missing_packet_validation_row",
    readyForMerge: Boolean(fullMatch) && sourceFieldsReady && row.realHumanInput === true,
    mergeBlockedReason: !fullMatch
      ? "missing_matching_full_draft_row"
      : sourceFieldsReady && row.realHumanInput === true
        ? ""
        : "packet_row_not_ready_for_merge",
    fieldCopyPlan: {
      reviewerDecision: { from: `/rows/${packetRowIndex}/reviewerDecision`, to: `/rows/${fullMatch?.index ?? "missing"}/reviewerDecision` },
      sourceFitNotes: { from: `/rows/${packetRowIndex}/sourceFitNotes`, to: `/rows/${fullMatch?.index ?? "missing"}/sourceFitNotes` },
      citationUse: { from: `/rows/${packetRowIndex}/citationUse`, to: `/rows/${fullMatch?.index ?? "missing"}/citationUse` },
      reviewerName: { from: `/rows/${packetRowIndex}/reviewerName`, to: `/rows/${fullMatch?.index ?? "missing"}/reviewerName` },
      reviewedAt: { from: `/rows/${packetRowIndex}/reviewedAt`, to: `/rows/${fullMatch?.index ?? "missing"}/reviewedAt` },
      realHumanInput: { from: `/rows/${packetRowIndex}/realHumanInput`, to: `/rows/${fullMatch?.index ?? "missing"}/realHumanInput` },
    },
  };
});

const mappedRows = mergeRows.filter((row) => row.mappedToFullDraft).length;
const readyRows = mergeRows.filter((row) => row.readyForMerge).length;
const blockedRows = mergeRows.length - readyRows;
const missingTargetRows = mergeRows.length - mappedRows;
const mergeAllowedNow = mergeRows.length > 0 &&
  readyRows === mergeRows.length &&
  packetValidation.realHumanInputEntries === mergeRows.length &&
  packetValidation.validationStatus === "ready_for_node_public_source_fit_review_apply";

const preview = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  mergePreviewStatus: mergeAllowedNow
    ? "packet_002_merge_preview_ready_for_manual_authorization"
    : "packet_002_merge_preview_blocked_missing_ready_packet_input",
  mergePreviewMode: "dry_run_packet_input_copy_to_full_source_fit_draft_mapping",
  packetId: packetInput.packetId,
  batchId: packetInput.batchId,
  module: packetInput.module,
  packetInputPath,
  packetValidationPath,
  fullDraftInputPath: "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_DRAFT.json",
  fullValidationPath: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_VALIDATION.json",
  packetRows: mergeRows.length,
  fullDraftRows: fullDraft.rows?.length || 0,
  fullValidationRows: fullValidation.inputRows || 0,
  mappedRows,
  missingTargetRows,
  readyRows,
  blockedRows,
  packetValidationStatus: packetValidation.validationStatus,
  packetReadyRows: packetValidation.readyRows,
  packetBlockedRows: packetValidation.blockedRows,
  packetMissingFieldRows: packetValidation.missingFieldRows,
  packetForbiddenHitRows: packetValidation.forbiddenHitRows,
  packetRealHumanInputEntries: packetValidation.realHumanInputEntries,
  fullDraftReadyRowsBeforeMerge: fullValidation.readyRows,
  fullDraftBlockedRowsBeforeMerge: fullValidation.blockedRows,
  mergeAllowedNow,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  mergeRows,
  sampleMergeRows: mergeRows.slice(0, 12),
  commands: [
    "npm.cmd run validate:knowledge-node-public-source-fit-review-packet-002-input-copy-template",
    "npm.cmd run build:knowledge-node-public-source-fit-review-packet-002-merge-preview",
    "npm.cmd run check:knowledge-node-public-source-fit-review-packet-002-merge-preview",
  ],
  completionRule: "Packet 002 merge preview becomes ready only when the packet input copy validates every row as real human input, every packet row maps to the full 1638-row draft, forbidden hits are zero, learnerCitationApproved:false, copiedTextApproved:false, and a separate manual merge/write authorization exists.",
  boundary: "Packet 002 merge preview is dry-run reviewer operations only. It does not write the full source-fit draft, create human judgments, approve copied text, approve learner-facing citations, write lessons, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Knowledge Node Public Source-Fit Review Packet 002 Merge Preview",
  "",
  `- Merge preview status: ${preview.mergePreviewStatus}`,
  `- Packet: ${preview.packetId}`,
  `- Packet rows: ${preview.packetRows}`,
  `- Mapped rows: ${preview.mappedRows}`,
  `- Ready/blocked rows: ${preview.readyRows}/${preview.blockedRows}`,
  `- Packet validation: ${preview.packetValidationStatus}`,
  `- Packet missing field rows: ${preview.packetMissingFieldRows}`,
  `- Merge allowed now: ${preview.mergeAllowedNow}`,
  `- Write allowed now: ${preview.writeAllowedNow}`,
  "",
  "## Sample Merge Rows",
  "",
  ...preview.sampleMergeRows.map((row) => `- ${row.reviewId}: packet row ${row.packetRowIndex} -> full draft row ${row.targetFullDraftRowIndex}; ${row.mergeBlockedReason || "ready"}`),
  "",
  "## Boundary",
  "",
  preview.boundary,
  "",
].join("\n"), "utf8");

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
  packetRealHumanInputEntries: preview.packetRealHumanInputEntries,
  mergeAllowedNow: preview.mergeAllowedNow,
  writeAllowedNow: preview.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
