import fs from "node:fs";

const templatePath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE.json";
const inputCopyPath = "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE.json";
const validationPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE_VALIDATION.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const template = readJson(templatePath);
const inputCopy = readJson(inputCopyPath);
const validation = readJson(validationPath);

for (const [name, data] of Object.entries({ template, inputCopy, validation })) {
  if (data.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (data.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (data.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (data.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
  if (data.writeAllowedNow !== false) fail(`${name} must not allow writes`);
}

if (template.templateStatus !== "node_public_source_fit_packet_002_input_copy_template_ready_blank") {
  fail(`unexpected template status: ${template.templateStatus}`);
}
if (template.templateMode !== "second_blocked_packet_scoped_input_copy_for_real_reviewer") fail("unexpected template mode");
if (inputCopy.inputStatus !== "packet_input_copy_template_ready_for_real_reviewer") fail("unexpected input copy status");
if (inputCopy.inputMode !== "packet_scoped_human_reviewer_source_fit_decisions_required") fail("unexpected input copy mode");
if (template.packetId !== "node-public-source-fit-batch-002-packet") fail("template should target packet 002");
if (inputCopy.packetId !== template.packetId || validation.inputPath !== inputCopyPath) fail("packet input copy path mismatch");
if (template.batchId !== "node-public-source-fit-batch-002" || inputCopy.batchId !== template.batchId) fail("packet 002 batch drift");
if (template.reviewRows !== 60 || inputCopy.reviewRows !== 60 || validation.inputRows !== 60) fail("packet row count drift");
if (template.targetNodes !== 10 || inputCopy.targetNodes !== 10) fail("packet target node count drift");
if (template.readyReviewRows !== 0 || inputCopy.readyReviewRows !== 0 || validation.readyRows !== 0) fail("blank packet should have zero ready rows");
if (template.blockedReviewRows !== 60 || inputCopy.blockedReviewRows !== 60 || validation.blockedRows !== 60) {
  fail("blank packet should have 60 blocked rows");
}
if (validation.validationStatus !== "blocked_missing_real_reviewer_source_fit_input") fail("unexpected packet validation status");
if (validation.missingFieldRows !== 60 || validation.invalidDecisionRows !== 0 || validation.forbiddenHitRows !== 0) {
  fail("packet validation quality gate drift");
}
if (
  template.realHumanInputEntries !== 0 ||
  inputCopy.realHumanInputEntries !== 0 ||
  validation.realHumanInputEntries !== 0 ||
  validation.learnerCitationApprovedRows !== 0 ||
  validation.copiedTextApprovedRows !== 0
) {
  fail("blank packet must not claim human/citation/copy approval");
}

if (!Array.isArray(inputCopy.rows) || inputCopy.rows.length !== 60) fail("input copy rows missing");
for (const row of inputCopy.rows) {
  if (!row.reviewId || !row.nodeId || !row.documentId || !row.name || !row.url) fail("input copy row identity missing");
  if (row.reviewerDecision !== "" || row.sourceFitNotes !== "" || row.citationUse !== "" || row.reviewerName !== "" || row.reviewedAt !== "") {
    fail("input copy must remain blank before real reviewer fill");
  }
  if (row.learnerCitationApproved !== false || row.copiedTextApproved !== false || row.realHumanInput !== false) {
    fail("input copy row must not approve citation/copy or claim real input");
  }
  if (!row.sourceDraftPointer?.reviewerDecision || !row.sourceDraftPointer?.sourceFitNotes) fail("source draft pointers missing");
}

if (!Array.isArray(template.fillableFieldRows) || template.fillableFieldRows.length !== 12) fail("template fillable preview rows drift");
if (!template.fillableFieldRows.every((row) =>
  row.reviewerDecision === `/rows/${row.order - 1}/reviewerDecision` &&
  row.sourceFitNotes === `/rows/${row.order - 1}/sourceFitNotes`
)) {
  fail("template fillable JSON pointers drift");
}
if (!Array.isArray(template.commands) || !template.commands.some((item) => item.includes("validate:knowledge-node-public-source-fit-review-packet-002-input-copy-template"))) {
  fail("template commands missing packet 002 validation command");
}

const boundaryText = `${template.boundary || ""} ${inputCopy.boundary || ""} ${validation.boundary || ""} ${inputCopy.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "real human reviewer",
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
  templateStatus: template.templateStatus,
  validationStatus: validation.validationStatus,
  packetId: template.packetId,
  reviewRows: template.reviewRows,
  readyRows: validation.readyRows,
  blockedRows: validation.blockedRows,
  missingFieldRows: validation.missingFieldRows,
  realHumanInputEntries: validation.realHumanInputEntries,
  writeAllowedNow: template.writeAllowedNow,
}, null, 2));
