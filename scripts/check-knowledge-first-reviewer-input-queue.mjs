import fs from "node:fs";

const queuePath = "docs/KNOWLEDGE_FIRST_REVIEWER_INPUT_QUEUE.json";
const queueMdPath = "docs/KNOWLEDGE_FIRST_REVIEWER_INPUT_QUEUE.md";

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
if (queue.queueStatus !== "first_reviewer_input_queue_ready_blocked_on_real_input") fail("unexpected queueStatus");
if (queue.queueMode !== "257_human_owned_required_inputs_expanded_from_cards_routes_and_packets") fail("unexpected queueMode");
if (queue.fieldMapStatus !== "first_reviewer_field_map_ready_blocked_on_real_input") fail("field map status drift");
if (queue.workbenchStatus !== "first_reviewer_workbench_ready_blocked_on_real_input") fail("workbench status drift");
if (queue.routeMapStatus !== "first_reviewer_post_input_route_map_ready_blocked_on_real_input") fail("route map status drift");
if (queue.actionCards !== 20 || queue.routeRows !== 4) fail("card/route totals drift");
if (queue.queueRows !== 257 || queue.readyRows !== 0 || queue.blockedRows !== 257) fail("queue totals drift");
if (queue.highRiskNoteRows !== 72 || queue.directSourceDecisionRows !== 5 || queue.sourceFitReviewRows !== 180) {
  fail("queue item type totals drift");
}
if (
  queue.realHumanInputEntries !== 0 ||
  queue.learnerCitationApprovedRows !== 0 ||
  queue.copiedTextApprovedRows !== 0 ||
  queue.readyForSeparateApproval !== false ||
  queue.mergeAllowedNow !== false ||
  queue.writeAllowedNow !== false ||
  queue.manualAuthorizationRequired !== true
) {
  fail("queue must keep real input/release/merge/write gates locked");
}
if (!Array.isArray(queue.inputPaths) || queue.inputPaths.length !== 4 || !queue.inputPaths.every((inputPath) => fs.existsSync(inputPath))) {
  fail("queue input paths drift");
}
if (!Array.isArray(queue.routeBreakdownRows) || queue.routeBreakdownRows.length !== 4) fail("route breakdown drift");
if (queue.routeBreakdownRows.reduce((sum, row) => sum + (row.itemRows || 0), 0) !== 257) fail("route breakdown total drift");

if (!Array.isArray(queue.queueRowsData) || queue.queueRowsData.length !== 257) fail("queue rows data missing");
const highRiskRows = queue.queueRowsData.filter((row) => row.itemType === "high_risk_reviewer_note");
const directRows = queue.queueRowsData.filter((row) => row.itemType === "direct_source_decision");
const sourceRows = queue.queueRowsData.filter((row) => row.itemType === "source_fit_packet_row");
if (highRiskRows.length !== 72 || directRows.length !== 5 || sourceRows.length !== 180) fail("queue row type split drift");
if (!queue.queueRowsData.every((row, index) =>
  row.itemRank === index + 1 &&
  row.routeId &&
  row.actionId &&
  row.module &&
  row.inputPath &&
  fs.existsSync(row.inputPath) &&
  row.jsonPath &&
  Array.isArray(row.requiredFields) &&
  row.requiredFields.length >= 1 &&
  row.prompt &&
  row.fillStatus === "missing_real_reviewer_input" &&
  row.learnerFacingRelease === false &&
  row.writeAllowedNow === false &&
  row.approvalStatus === "not_approved"
)) {
  fail("queue row drift");
}
if (!highRiskRows.every((row) =>
  row.routeId === "high_risk_overlay_notes_and_direct_sources" &&
  /^lessonRows\[\d+\]\.realReviewerNotes\[\d+\]$/.test(row.jsonPath) &&
  row.requiredFields.includes("decision") &&
  row.requiredFields.includes("reviewerNote") &&
  Array.isArray(row.evidenceSamples) &&
  row.evidenceSamples.length >= 1
)) {
  fail("high-risk note rows drift");
}
if (!directRows.every((row) =>
  row.routeId === "high_risk_overlay_notes_and_direct_sources" &&
  /^directSourceDecisionRows\[\d+\]$/.test(row.jsonPath) &&
  row.requiredFields.includes("decision") &&
  row.learnerCitationApproved === false
)) {
  fail("direct source rows drift");
}
if (!sourceRows.every((row) =>
  /^source_fit_packet_00[1-3]$/.test(row.routeId) &&
  /^rows\[\d+\]$/.test(row.jsonPath) &&
  row.requiredFields.includes("reviewerDecision") &&
  row.requiredFields.includes("sourceFitNotes") &&
  row.requiredFields.includes("citationUse") &&
  row.learnerCitationApproved === false &&
  row.copiedTextApproved === false
)) {
  fail("source-fit rows drift");
}
if (!Array.isArray(queue.commands) || !queue.commands.some((command) => /check:knowledge-first-reviewer-input-queue/.test(command))) {
  fail("commands must include input queue check");
}

const boundaryText = `${queue.boundary || ""} ${queue.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "absorbed local course material",
  "public/wikipedia/official source-fit review rows",
  "72 high-risk reviewer notes",
  "5 direct-source decisions",
  "180 source-fit packet rows",
  "does not generate reviewer notes",
  "approve copied text",
  "approve learner-facing citations",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "write authorization",
  "learner release",
  "production readiness",
]) {
  if (!boundaryText.includes(phrase)) fail(`boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  queueStatus: queue.queueStatus,
  queueRows: queue.queueRows,
  highRiskNoteRows: queue.highRiskNoteRows,
  directSourceDecisionRows: queue.directSourceDecisionRows,
  sourceFitReviewRows: queue.sourceFitReviewRows,
  readyRows: queue.readyRows,
  blockedRows: queue.blockedRows,
  realHumanInputEntries: queue.realHumanInputEntries,
  writeAllowedNow: queue.writeAllowedNow,
}, null, 2));
