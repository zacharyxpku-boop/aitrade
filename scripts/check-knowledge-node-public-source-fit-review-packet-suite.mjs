import fs from "node:fs";

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

function packetLabel(number) {
  return String(number).padStart(3, "0");
}

function assertBoundary(data, name) {
  if (data.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (data.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (data.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (data.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
  if (Object.hasOwn(data, "writeAllowedNow") && data.writeAllowedNow !== false) fail(`${name} must not allow writes`);
}

const packetNumber = packetLabel(argValue("--packet-number", "003"));
const packetId = `node-public-source-fit-batch-${packetNumber}-packet`;
const batchId = `node-public-source-fit-batch-${packetNumber}`;
const lowerPacket = `packet_${packetNumber}`;
const paths = {
  templateJson: `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_INPUT_COPY_TEMPLATE.json`,
  inputJson: `docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_INPUT_COPY_TEMPLATE.json`,
  validationJson: `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_INPUT_COPY_TEMPLATE_VALIDATION.json`,
  mergePreviewJson: `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_MERGE_PREVIEW.json`,
  mergeApplyJson: `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_MERGE_APPLY_REPORT.json`,
  handoffJson: `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_HANDOFF.json`,
  handoffMd: `docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_${packetNumber}_HANDOFF.md`,
};

const template = readJson(paths.templateJson);
const inputCopy = readJson(paths.inputJson);
const validation = readJson(paths.validationJson);
const preview = readJson(paths.mergePreviewJson);
const applyReport = readJson(paths.mergeApplyJson);
const handoff = readJson(paths.handoffJson);
if (!fs.existsSync(paths.handoffMd)) fail(`missing ${paths.handoffMd}`);

for (const [name, data] of Object.entries({ template, inputCopy, validation, preview, applyReport, handoff })) {
  assertBoundary(data, name);
}

if (template.templateStatus !== `node_public_source_fit_${lowerPacket}_input_copy_template_ready_blank`) fail("template status drift");
if (inputCopy.inputStatus !== "packet_input_copy_template_ready_for_real_reviewer") fail("input copy status drift");
for (const data of [template, inputCopy, validation, preview, applyReport, handoff]) {
  if (data.packetId && data.packetId !== packetId) fail(`${packetId} identity drift`);
  if (data.batchId && data.batchId !== batchId) fail(`${packetId} batch drift`);
}
if (validation.inputPath && validation.inputPath !== paths.inputJson) fail("validation input path drift");
const expectedRows = inputCopy.rows?.length || inputCopy.reviewRows;
const expectedTargetNodes = inputCopy.targetNodes;
if (!Number.isInteger(expectedRows) || expectedRows <= 0) fail("expected packet row count missing");
if (!Number.isInteger(expectedTargetNodes) || expectedTargetNodes <= 0) fail("expected target node count missing");
if (template.reviewRows !== expectedRows || inputCopy.reviewRows !== expectedRows || validation.inputRows !== expectedRows) fail("packet row count drift");
if (template.targetNodes !== expectedTargetNodes || inputCopy.targetNodes !== expectedTargetNodes) fail("packet target node count drift");
if (validation.validationStatus !== "blocked_missing_real_reviewer_source_fit_input") fail("validation status drift");
if (validation.readyRows !== 0 || validation.blockedRows !== expectedRows || validation.missingFieldRows !== expectedRows) fail("blank validation counts drift");
if (validation.realHumanInputEntries !== 0 || validation.learnerCitationApprovedRows !== 0 || validation.copiedTextApprovedRows !== 0) {
  fail("blank packet must not claim human/citation/copy approval");
}

if (!Array.isArray(inputCopy.rows) || inputCopy.rows.length !== expectedRows) fail("input rows missing");
for (const row of inputCopy.rows) {
  if (!row.reviewId || !row.nodeId || !row.documentId || !row.name || !row.url) fail("input row identity missing");
  if (row.reviewerDecision !== "" || row.sourceFitNotes !== "" || row.citationUse !== "" || row.reviewerName !== "" || row.reviewedAt !== "") {
    fail("input copy must remain blank before real reviewer fill");
  }
  if (row.learnerCitationApproved !== false || row.copiedTextApproved !== false || row.realHumanInput !== false) {
    fail("input row must not approve citation/copy or claim real input");
  }
}

if (preview.mergePreviewStatus !== `${lowerPacket}_merge_preview_blocked_missing_ready_packet_input`) fail("merge preview status drift");
if (preview.packetRows !== expectedRows || preview.fullDraftRows !== 1638 || preview.fullValidationRows !== 1638) fail("merge row counts drift");
if (preview.mappedRows !== expectedRows || preview.missingTargetRows !== 0) fail("packet rows must map to full draft");
if (preview.readyRows !== 0 || preview.blockedRows !== expectedRows || preview.mergeAllowedNow !== false) fail("blank merge preview readiness drift");

if (applyReport.applyMode !== "dry_run" || applyReport.applyStatus !== "blocked_no_ready_merge_rows") fail("apply report status drift");
if (applyReport.totalRows !== expectedRows || applyReport.readyToMergeRows !== 0 || applyReport.blockedRows !== expectedRows || applyReport.writtenRows !== 0) {
  fail("dry-run apply counts drift");
}
if (!Array.isArray(applyReport.applyRows) || !applyReport.applyRows.every((row) => row.willWrite === false && row.realHumanInput === false)) {
  fail("dry-run apply rows must remain unwritten and non-human");
}

if (handoff.handoffStatus !== `node_public_source_fit_${lowerPacket}_handoff_ready_blocked_on_real_input`) fail("handoff status drift");
if (handoff.reviewRows !== expectedRows || handoff.targetNodes !== expectedTargetNodes) fail("handoff row/node counts drift");
if (handoff.packetReadyRows !== 0 || handoff.packetBlockedRows !== expectedRows || handoff.packetMissingFieldRows !== expectedRows) fail("handoff validation counts drift");
if (handoff.mergeMappedRows !== expectedRows || handoff.mergeReadyRows !== 0 || handoff.mergeBlockedRows !== expectedRows) fail("handoff merge counts drift");
if (handoff.mergeDryRunWrittenRows !== 0 || handoff.writeAllowedNow !== false || handoff.manualAuthorizationRequired !== true) fail("handoff write gate drift");
if (!Array.isArray(handoff.phaseRows) || handoff.phaseRows.length !== 6) fail("handoff phases drift");

const boundaryText = `${template.boundary || ""} ${inputCopy.boundary || ""} ${preview.boundary || ""} ${applyReport.boundary || ""} ${handoff.boundary || ""} ${handoff.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
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
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  packetNumber,
  packetId,
  validationStatus: validation.validationStatus,
  mergePreviewStatus: preview.mergePreviewStatus,
  handoffStatus: handoff.handoffStatus,
  reviewRows: handoff.reviewRows,
  mappedRows: handoff.mergeMappedRows,
  readyRows: handoff.mergeReadyRows,
  blockedRows: handoff.mergeBlockedRows,
  writtenRows: handoff.mergeDryRunWrittenRows,
  writeAllowedNow: handoff.writeAllowedNow,
}, null, 2));
