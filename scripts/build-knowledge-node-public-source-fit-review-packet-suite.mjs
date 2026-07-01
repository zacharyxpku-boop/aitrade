import fs from "node:fs";
import { spawnSync } from "node:child_process";

function fail(message) {
  throw new Error(message);
}

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
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
  if (Object.hasOwn(data, "writeAllowedNow") && data.writeAllowedNow !== false) fail(`${name} must not allow writes`);
}

function writeJson(file, data) {
  fs.mkdirSync(file.split(/[\\/]/).slice(0, -1).join("/"), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function packetLabel(number) {
  return String(number).padStart(3, "0");
}

const packetNumber = packetLabel(argValue("--packet-number", "003"));
const packetNumberInt = Number.parseInt(packetNumber, 10);
if (!Number.isInteger(packetNumberInt) || packetNumberInt < 1) fail(`invalid --packet-number ${packetNumber}`);

const packetId = `node-public-source-fit-batch-${packetNumber}-packet`;
const batchId = `node-public-source-fit-batch-${packetNumber}`;
const titlePacket = `Packet ${packetNumber}`;
const lowerPacket = `packet_${packetNumber}`;

const paths = {
  templateJson: `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_INPUT_COPY_TEMPLATE.json`,
  templateMd: `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_INPUT_COPY_TEMPLATE.md`,
  inputJson: `docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_INPUT_COPY_TEMPLATE.json`,
  inputMd: `docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_INPUT_COPY_TEMPLATE.md`,
  validationJson: `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_INPUT_COPY_TEMPLATE_VALIDATION.json`,
  validationMd: `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_INPUT_COPY_TEMPLATE_VALIDATION.md`,
  mergePreviewJson: `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_MERGE_PREVIEW.json`,
  mergePreviewMd: `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_MERGE_PREVIEW.md`,
  mergeApplyJson: `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_MERGE_APPLY_REPORT.json`,
  mergeApplyMd: `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_MERGE_APPLY_REPORT.md`,
  handoffJson: `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_HANDOFF.json`,
  handoffMd: `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_HANDOFF.md`,
};

const packetPack = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_BATCH_PACKETS.json");
assertBoundary(packetPack, "batch packets");
const selectedPacket = (packetPack.batchPackets || []).find((row) => row.packetId === packetId);
if (!selectedPacket) fail(`missing selected packet ${packetId}`);
if (selectedPacket.batchId !== batchId) fail(`batch id drift for ${packetId}`);
if (!Array.isArray(selectedPacket.packetRows) || selectedPacket.packetRows.length === 0) fail("selected packet rows missing");

const inputRows = selectedPacket.packetRows.map((row) => ({
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
  reviewRows: inputRows.length,
  readyReviewRows: 0,
  blockedReviewRows: inputRows.length,
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  copiedTextApprovedRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  rows: inputRows,
  allowedDecisionValues: ["accept_for_node_source_fit", "reject_for_node_source_fit", "background_only"],
  validatorCommand: `node scripts/validate-knowledge-node-public-source-fit-review-input.mjs --input ${paths.inputJson} --output-json ${paths.validationJson} --output-md ${paths.validationMd}`,
  completionRule: "This packet input copy is ready only after all packet rows have real human reviewer decisions, source-fit notes, citation use, reviewer name, reviewedAt timestamp, no forbidden language, no copied text approval, no learner citation approval, and realHumanInput:true.",
  boundary: "Packet input copy template is reviewer-facing education-only governance. It does not create human judgments, approve copied text, approve learner-facing citations, write lessons, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

const template = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  templateStatus: `node_public_source_fit_${lowerPacket}_input_copy_template_ready_blank`,
  templateMode: "packet_scoped_input_copy_for_real_reviewer",
  packetId: inputCopy.packetId,
  batchId: inputCopy.batchId,
  module: inputCopy.module,
  inputCopyPath: paths.inputJson,
  inputCopyMarkdownPath: paths.inputMd,
  validationOutputPath: paths.validationJson,
  validationMarkdownPath: paths.validationMd,
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
  fillableFieldRows: inputRows.slice(0, 12).map((row, index) => ({
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
    `npm.cmd run build:knowledge-node-public-source-fit-review-packet-${packetNumber}-suite`,
    `npm.cmd run check:knowledge-node-public-source-fit-review-packet-${packetNumber}-suite`,
  ],
  validatorCommand: inputCopy.validatorCommand,
  completionRule: inputCopy.completionRule,
  boundary: inputCopy.boundary,
};

writeJson(paths.inputJson, inputCopy);
fs.writeFileSync(paths.inputMd, [
  `# Knowledge Node Public Source-Fit Review ${titlePacket} Input Copy Template`,
  "",
  `- Packet: ${inputCopy.packetId}`,
  `- Module: ${inputCopy.module}`,
  `- Review rows: ${inputCopy.reviewRows}`,
  `- Ready rows: ${inputCopy.readyReviewRows}`,
  `- Blocked rows: ${inputCopy.blockedReviewRows}`,
  `- Real human input entries: ${inputCopy.realHumanInputEntries}`,
  `- Write allowed now: ${inputCopy.writeAllowedNow}`,
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
writeJson(paths.templateJson, template);
fs.writeFileSync(paths.templateMd, [
  `# Knowledge Node Public Source-Fit Review ${titlePacket} Input Copy Template`,
  "",
  `- Template status: ${template.templateStatus}`,
  `- Packet: ${template.packetId}`,
  `- Module: ${template.module}`,
  `- Input copy: ${template.inputCopyPath}`,
  `- Review rows: ${template.reviewRows}`,
  `- Blocked rows: ${template.blockedReviewRows}`,
  `- Write allowed now: ${template.writeAllowedNow}`,
  "",
  "## Boundary",
  "",
  template.boundary,
  "",
].join("\n"), "utf8");

const validationRun = spawnSync(process.execPath, [
  "scripts/validate-knowledge-node-public-source-fit-review-input.mjs",
  "--input", paths.inputJson,
  "--output-json", paths.validationJson,
  "--output-md", paths.validationMd,
], { stdio: "inherit" });
if (validationRun.status !== 0) fail(`packet ${packetNumber} validation generation failed`);

const packetValidation = readJson(paths.validationJson);
const fullDraft = readJson("docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_DRAFT.json");
const fullValidation = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_VALIDATION.json");
for (const [name, data] of Object.entries({ packetValidation, fullDraft, fullValidation })) assertBoundary(data, name);

const fullRowsByReviewId = new Map((fullDraft.rows || []).map((row, index) => [row.reviewId, { row, index }]));
const packetValidationByReviewId = new Map((packetValidation.validationRows || []).map((row) => [row.reviewId, row]));
const mergeRows = (inputCopy.rows || []).map((row, packetRowIndex) => {
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

const mergePreview = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  mergePreviewStatus: mergeAllowedNow
    ? `${lowerPacket}_merge_preview_ready_for_manual_authorization`
    : `${lowerPacket}_merge_preview_blocked_missing_ready_packet_input`,
  mergePreviewMode: "dry_run_packet_input_copy_to_full_source_fit_draft_mapping",
  packetId: inputCopy.packetId,
  batchId: inputCopy.batchId,
  module: inputCopy.module,
  packetInputPath: paths.inputJson,
  packetValidationPath: paths.validationJson,
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
    `npm.cmd run build:knowledge-node-public-source-fit-review-packet-${packetNumber}-suite`,
    `npm.cmd run check:knowledge-node-public-source-fit-review-packet-${packetNumber}-suite`,
  ],
  completionRule: `${titlePacket} merge preview becomes ready only when the packet input copy validates every row as real human input, every packet row maps to the full 1638-row draft, forbidden hits are zero, learnerCitationApproved:false, copiedTextApproved:false, and a separate manual merge/write authorization exists.`,
  boundary: `${titlePacket} merge preview is dry-run reviewer operations only. It does not write the full source-fit draft, create human judgments, approve copied text, approve learner-facing citations, write lessons, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.`,
};
writeJson(paths.mergePreviewJson, mergePreview);
fs.writeFileSync(paths.mergePreviewMd, [
  `# Knowledge Node Public Source-Fit Review ${titlePacket} Merge Preview`,
  "",
  `- Merge preview status: ${mergePreview.mergePreviewStatus}`,
  `- Packet: ${mergePreview.packetId}`,
  `- Packet rows: ${mergePreview.packetRows}`,
  `- Mapped rows: ${mergePreview.mappedRows}`,
  `- Ready/blocked rows: ${mergePreview.readyRows}/${mergePreview.blockedRows}`,
  `- Merge allowed now: ${mergePreview.mergeAllowedNow}`,
  "",
  "## Boundary",
  "",
  mergePreview.boundary,
  "",
].join("\n"), "utf8");

const validationByReviewId = new Map((packetValidation.validationRows || []).map((row) => [row.reviewId, row]));
const applyRows = (inputCopy.rows || []).map((packetRow, packetRowIndex) => {
  const target = fullRowsByReviewId.get(packetRow.reviewId);
  const validation = validationByReviewId.get(packetRow.reviewId);
  const ready = Boolean(target) &&
    validation?.validationStatus === "ready_for_source_fit_review_apply" &&
    packetRow.realHumanInput === true &&
    packetRow.learnerCitationApproved === false &&
    packetRow.copiedTextApproved === false;
  const missingFields = Array.isArray(validation?.missingFields) ? validation.missingFields : ["validationRow"];
  return {
    packetRowIndex,
    targetFullDraftRowIndex: target?.index ?? -1,
    reviewId: packetRow.reviewId,
    nodeId: packetRow.nodeId,
    documentId: packetRow.documentId,
    sourceName: packetRow.name,
    applyStatus: ready ? "ready_to_merge" : "blocked_not_ready",
    willWrite: false,
    missingFields,
    invalidDecision: validation?.invalidDecision === true,
    forbiddenHits: validation?.forbiddenHits || [],
    realHumanInput: packetRow.realHumanInput === true,
  };
});
const readyToMergeRows = applyRows.filter((row) => row.applyStatus === "ready_to_merge").length;
const blockedApplyRows = applyRows.length - readyToMergeRows;
const applyReport = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  applyMode: "dry_run",
  applyStatus: readyToMergeRows ? "ready_packet_rows_not_written" : "blocked_no_ready_merge_rows",
  packetId: inputCopy.packetId,
  batchId: inputCopy.batchId,
  module: inputCopy.module,
  packetInputPath: paths.inputJson,
  packetValidationPath: paths.validationJson,
  fullDraftPath: "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_DRAFT.json",
  mergePreviewPath: paths.mergePreviewJson,
  totalRows: applyRows.length,
  readyToMergeRows,
  blockedRows: blockedApplyRows,
  writtenRows: 0,
  mergeAllowedNow: mergePreview.mergeAllowedNow === true,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  fullDraftRows: fullDraft.rows?.length || 0,
  applyRows,
  nextStep: readyToMergeRows
    ? "Rerun with --write only after confirming packet validation, merge preview, and manual authorization."
    : "Fill packet input copy with real reviewer decisions, validate the packet input, rebuild merge preview, then rerun this dry-run.",
  boundary: "Packet merge apply is a guarded reviewer-input merge pipeline. Dry-run mode writes no full draft changes. It does not create human judgments, approve copied text, approve learner-facing citations, write lessons, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};
writeJson(paths.mergeApplyJson, applyReport);
fs.writeFileSync(paths.mergeApplyMd, [
  `# Knowledge Node Public Source-Fit Review ${titlePacket} Merge Apply Report`,
  "",
  `- Apply mode: ${applyReport.applyMode}`,
  `- Apply status: ${applyReport.applyStatus}`,
  `- Packet: ${applyReport.packetId}`,
  `- Total rows: ${applyReport.totalRows}`,
  `- Ready to merge rows: ${applyReport.readyToMergeRows}`,
  `- Blocked rows: ${applyReport.blockedRows}`,
  `- Written rows: ${applyReport.writtenRows}`,
  `- Write allowed now: ${applyReport.writeAllowedNow}`,
  "",
  "## Boundary",
  "",
  applyReport.boundary,
  "",
].join("\n"), "utf8");

const progressMatrix = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PROGRESS_MATRIX.json");
const reviewGateDashboard = readJson("docs/LOCAL_COURSE_REVIEW_GATE_DASHBOARD.json");
assertBoundary(progressMatrix, "progress matrix");
assertBoundary(reviewGateDashboard, "review gate dashboard");

const phaseRows = [
  ["inspect_input_copy_template", template.templateStatus, paths.templateJson, `npm.cmd run check:knowledge-node-public-source-fit-review-packet-${packetNumber}-suite`, `Open ${titlePacket} input copy and fill only real reviewer-owned fields.`, `Stop if the file is not ${packetId}, has fewer than ${inputCopy.reviewRows} rows, or any row already claims learnerCitationApproved/copy approval.`],
  ["validate_input_copy", packetValidation.validationStatus, paths.validationJson, `npm.cmd run build:knowledge-node-public-source-fit-review-packet-${packetNumber}-suite && npm.cmd run check:knowledge-node-public-source-fit-review-packet-${packetNumber}-suite`, `Rerun ${titlePacket} validation after filling; all rows must be ready before merge preview can proceed.`, "Stop while readyRows is 0, blockedRows is nonzero, missingFieldRows is nonzero, or realHumanInputEntries is 0."],
  ["rebuild_merge_preview", mergePreview.mergePreviewStatus, paths.mergePreviewJson, `npm.cmd run build:knowledge-node-public-source-fit-review-packet-${packetNumber}-suite && npm.cmd run check:knowledge-node-public-source-fit-review-packet-${packetNumber}-suite`, `Confirm every ${titlePacket} row maps back to the full source-fit draft before any merge apply.`, "Stop unless mappedRows equals packet rows, missingTargetRows is 0, and mergeAllowedNow is true after real review."],
  ["run_merge_apply_dry_run", applyReport.applyStatus, paths.mergeApplyJson, `npm.cmd run build:knowledge-node-public-source-fit-review-packet-${packetNumber}-suite && npm.cmd run check:knowledge-node-public-source-fit-review-packet-${packetNumber}-suite`, "Use dry-run apply to verify willWrite stays false until the packet is fully ready and explicit write authorization exists.", "Stop if writtenRows is nonzero in dry-run or any row willWrite before manual approval."],
  ["rerun_progress_matrix", progressMatrix.matrixStatus, "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PROGRESS_MATRIX.json", "npm.cmd run build:knowledge-node-public-source-fit-review-progress-matrix && npm.cmd run check:knowledge-node-public-source-fit-review-progress-matrix", `After an authorized merge, rerun the progress matrix and confirm ${titlePacket} moves from blocked to ready.`, "Stop if progress changes without real human input or if learner citations/copy approval appear."],
  ["rerun_review_gate_dashboard", reviewGateDashboard.dashboardStatus, "docs/LOCAL_COURSE_REVIEW_GATE_DASHBOARD.json", "npm.cmd run build:local-course-review-gate-dashboard && npm.cmd run check:local-course-review-gate-dashboard", "Refresh the single-screen review gate so packet progress, source-fit rows, and write authorization remain visible.", "Stop if writeAllowedNow becomes true before all real review gates and separate approval pass."],
].map(([id, status, inputFile, command, reviewerAction, hardStop], index) => ({
  order: index + 1,
  id: `${lowerPacket}_${id}`,
  status,
  inputFile,
  command,
  reviewerAction,
  hardStop,
}));

const handoff = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  handoffStatus: `node_public_source_fit_${lowerPacket}_handoff_ready_blocked_on_real_input`,
  handoffMode: "single_packet_reviewer_execution_path",
  packetId,
  batchId,
  module: inputCopy.module,
  inputCopyPath: inputCopy.inputCopyPath || paths.inputJson,
  reviewRows: inputCopy.reviewRows,
  targetNodes: inputCopy.targetNodes,
  packetReadyRows: packetValidation.readyRows,
  packetBlockedRows: packetValidation.blockedRows,
  packetMissingFieldRows: packetValidation.missingFieldRows,
  packetRealHumanInputEntries: packetValidation.realHumanInputEntries,
  mergeMappedRows: mergePreview.mappedRows,
  mergeReadyRows: mergePreview.readyRows,
  mergeBlockedRows: mergePreview.blockedRows,
  mergeAllowedNow: mergePreview.mergeAllowedNow,
  mergeDryRunWrittenRows: applyReport.writtenRows,
  progressReadyPackets: progressMatrix.readyPackets,
  progressBlockedPackets: progressMatrix.blockedPackets,
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
    `npm.cmd run build:knowledge-node-public-source-fit-review-packet-${packetNumber}-suite`,
    `npm.cmd run check:knowledge-node-public-source-fit-review-packet-${packetNumber}-suite`,
    "npm.cmd run verify",
  ],
  completionRule: `This handoff is executable only as reviewer operations. It does not fill packet rows, does not create human judgments, does not approve learner-facing citations, and does not authorize --write. ${titlePacket} remains blocked until all ${inputCopy.reviewRows} rows contain real human source-fit review input and pass validation.`,
  boundary: `Node public source-fit ${titlePacket} handoff is reviewer-facing education-only operations material. It organizes the packet input copy, validation, merge preview, dry-run apply, and progress checks; it does not write lessons, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.`,
};
writeJson(paths.handoffJson, handoff);
fs.writeFileSync(paths.handoffMd, [
  `# Knowledge Node Public Source-Fit Review ${titlePacket} Handoff`,
  "",
  `- Status: ${handoff.handoffStatus}`,
  `- Packet: ${handoff.packetId}`,
  `- Module: ${handoff.module}`,
  `- Input copy: ${handoff.inputCopyPath}`,
  `- Review rows: ${handoff.reviewRows}`,
  `- Packet ready/blocked: ${handoff.packetReadyRows}/${handoff.packetBlockedRows}`,
  `- Merge mapped/ready/blocked: ${handoff.mergeMappedRows}/${handoff.mergeReadyRows}/${handoff.mergeBlockedRows}`,
  `- Dry-run written rows: ${handoff.mergeDryRunWrittenRows}`,
  `- Write allowed now: ${handoff.writeAllowedNow}`,
  "",
  "## Phases",
  "",
  "| # | Phase | Status | Command | Hard stop |",
  "|---:|---|---|---|---|",
  ...phaseRows.map((row) => `| ${row.order} | ${row.id} | ${row.status} | \`${row.command}\` | ${row.hardStop} |`),
  "",
  "## Boundary",
  "",
  handoff.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  packetNumber,
  packetId,
  reviewRows: inputCopy.reviewRows,
  targetNodes: inputCopy.targetNodes,
  validationStatus: packetValidation.validationStatus,
  mergePreviewStatus: mergePreview.mergePreviewStatus,
  handoffStatus: handoff.handoffStatus,
  mappedRows: mergePreview.mappedRows,
  readyRows: mergePreview.readyRows,
  blockedRows: mergePreview.blockedRows,
  writtenRows: applyReport.writtenRows,
  writeAllowedNow: false,
}, null, 2));
