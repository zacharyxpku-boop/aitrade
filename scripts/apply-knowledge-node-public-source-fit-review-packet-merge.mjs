import fs from "node:fs";

const defaultOutputJson = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_MERGE_APPLY_REPORT.json";
const defaultOutputMd = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_MERGE_APPLY_REPORT.md";

function fail(message) {
  throw new Error(message);
}

function argValue(name, fallback) {
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
  if (data.writeAllowedNow !== false) fail(`${name} must not allow writes`);
}

const packetInputPath = argValue("--packet-input", "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_001_INPUT_COPY_TEMPLATE.json");
const packetValidationPath = argValue("--packet-validation", "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_INPUT_COPY_TEMPLATE_VALIDATION.json");
const fullDraftPath = argValue("--full-draft", "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_DRAFT.json");
const mergePreviewPath = argValue("--merge-preview", "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_MERGE_PREVIEW.json");
const outputJson = argValue("--output-json", defaultOutputJson);
const outputMd = argValue("--output-md", defaultOutputMd);
const write = process.argv.includes("--write");

const packetInput = readJson(packetInputPath);
const packetValidation = readJson(packetValidationPath);
const fullDraft = readJson(fullDraftPath);
const mergePreview = readJson(mergePreviewPath);

for (const [name, data] of Object.entries({ packetInput, packetValidation, fullDraft, mergePreview })) {
  assertBoundary(data, name);
}

const fullRowsByReviewId = new Map((fullDraft.rows || []).map((row, index) => [row.reviewId, { row, index }]));
const validationByReviewId = new Map((packetValidation.validationRows || []).map((row) => [row.reviewId, row]));

const applyRows = (packetInput.rows || []).map((packetRow, packetRowIndex) => {
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
    willWrite: write && ready,
    missingFields,
    invalidDecision: validation?.invalidDecision === true,
    forbiddenHits: validation?.forbiddenHits || [],
    realHumanInput: packetRow.realHumanInput === true,
  };
});

const readyRows = applyRows.filter((row) => row.applyStatus === "ready_to_merge");
const blockedRows = applyRows.filter((row) => row.applyStatus !== "ready_to_merge");
const writtenRows = applyRows.filter((row) => row.willWrite);

if (write && readyRows.length !== applyRows.length) {
  fail("cannot --write packet merge until every packet row is ready_to_merge");
}
if (write && mergePreview.mergeAllowedNow !== true) {
  fail("cannot --write packet merge until merge preview reports mergeAllowedNow:true");
}

if (write && writtenRows.length) {
  const updatedRows = (fullDraft.rows || []).map((fullRow) => {
    const packetRow = (packetInput.rows || []).find((row) => row.reviewId === fullRow.reviewId);
    if (!packetRow) return fullRow;
    const applyRow = applyRows.find((row) => row.reviewId === fullRow.reviewId);
    if (!applyRow?.willWrite) return fullRow;
    return {
      ...fullRow,
      reviewerDecision: packetRow.reviewerDecision,
      sourceFitNotes: packetRow.sourceFitNotes,
      citationUse: packetRow.citationUse,
      reviewerName: packetRow.reviewerName,
      reviewedAt: packetRow.reviewedAt,
      learnerCitationApproved: false,
      copiedTextApproved: false,
      realHumanInput: true,
    };
  });
  const updatedDraft = {
    ...fullDraft,
    generatedAt: new Date().toISOString(),
    readyReviewRows: updatedRows.filter((row) => row.realHumanInput === true).length,
    blockedReviewRows: updatedRows.filter((row) => row.realHumanInput !== true).length,
    realHumanInputEntries: updatedRows.filter((row) => row.realHumanInput === true).length,
    learnerCitationApprovedRows: updatedRows.filter((row) => row.learnerCitationApproved === true).length,
    copiedTextApprovedRows: updatedRows.filter((row) => row.copiedTextApproved === true).length,
    rows: updatedRows,
  };
  fs.writeFileSync(fullDraftPath, `${JSON.stringify(updatedDraft, null, 2)}\n`, "utf8");
}

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  applyMode: write ? "write" : "dry_run",
  applyStatus: writtenRows.length
    ? "merged_ready_packet_rows"
    : readyRows.length
      ? "ready_packet_rows_not_written"
      : "blocked_no_ready_merge_rows",
  packetId: packetInput.packetId,
  batchId: packetInput.batchId,
  module: packetInput.module,
  packetInputPath,
  packetValidationPath,
  fullDraftPath,
  mergePreviewPath,
  totalRows: applyRows.length,
  readyToMergeRows: readyRows.length,
  blockedRows: blockedRows.length,
  writtenRows: writtenRows.length,
  mergeAllowedNow: mergePreview.mergeAllowedNow === true,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  fullDraftRows: fullDraft.rows?.length || 0,
  applyRows,
  nextStep: readyRows.length
    ? (write ? "Rerun full source-fit validation, progress matrix, review gate dashboard, and write authorization preview." : "Rerun with --write only after confirming packet validation, merge preview, and manual authorization.")
    : "Fill packet input copy with real reviewer decisions, validate the packet input, rebuild merge preview, then rerun this dry-run.",
  boundary: "Packet merge apply is a guarded reviewer-input merge pipeline. Dry-run mode writes no full draft changes. It does not create human judgments, approve copied text, approve learner-facing citations, write lessons, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Knowledge Node Public Source-Fit Review Packet Merge Apply Report",
  "",
  `- Apply mode: ${report.applyMode}`,
  `- Apply status: ${report.applyStatus}`,
  `- Packet: ${report.packetId}`,
  `- Total rows: ${report.totalRows}`,
  `- Ready to merge rows: ${report.readyToMergeRows}`,
  `- Blocked rows: ${report.blockedRows}`,
  `- Written rows: ${report.writtenRows}`,
  `- Merge allowed now: ${report.mergeAllowedNow}`,
  `- Write allowed now: ${report.writeAllowedNow}`,
  "",
  "## First Rows",
  "",
  "| Review ID | Packet row | Full draft row | Apply status | Will write | Missing fields |",
  "| --- | ---: | ---: | --- | --- | --- |",
  ...applyRows.slice(0, 12).map((row) => `| ${row.reviewId} | ${row.packetRowIndex} | ${row.targetFullDraftRowIndex} | ${row.applyStatus} | ${row.willWrite} | ${row.missingFields.join(", ")} |`),
  "",
  "## Next Step",
  "",
  report.nextStep,
  "",
  "## Boundary",
  "",
  report.boundary,
  "",
].join("\n"), "utf8");

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
  outputJson,
  outputMd,
}, null, 2));
