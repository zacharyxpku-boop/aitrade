import fs from "node:fs";

const fieldMapPath = "docs/KNOWLEDGE_FIRST_REVIEWER_FIELD_MAP.json";
const workbenchPath = "docs/KNOWLEDGE_FIRST_REVIEWER_WORKBENCH.json";
const routeMapPath = "docs/KNOWLEDGE_FIRST_REVIEWER_POST_INPUT_ROUTE_MAP.json";
const overlayInputPath = "docs/reviewer-inputs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_DRAFT.json";
const packetInputPaths = [
  "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_001_INPUT_COPY_TEMPLATE.json",
  "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_002_INPUT_COPY_TEMPLATE.json",
  "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PACKET_003_INPUT_COPY_TEMPLATE.json",
];
const outputJsonPath = "docs/KNOWLEDGE_FIRST_REVIEWER_INPUT_QUEUE.json";
const outputMdPath = "docs/KNOWLEDGE_FIRST_REVIEWER_INPUT_QUEUE.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(label, artifact) {
  if (artifact.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
  if (artifact.writeAllowedNow !== false) fail(`${label} must keep writeAllowedNow:false`);
}

function routeIdForPacket(packetId = "") {
  const match = packetId.match(/batch-(\d{3})-packet$/);
  return match ? `source_fit_packet_${match[1]}` : "source_fit_packet_unknown";
}

const fieldMap = readJson(fieldMapPath);
const workbench = readJson(workbenchPath);
const routeMap = readJson(routeMapPath);
const overlay = readJson(overlayInputPath);
for (const [label, artifact] of Object.entries({ fieldMap, workbench, routeMap, overlay })) {
  assertBoundary(label, artifact);
}

const packets = packetInputPaths.map((inputPath) => {
  const packet = readJson(inputPath);
  assertBoundary(inputPath, packet);
  return { inputPath, packet };
});

const queueRowsData = [];

for (const fieldRow of fieldMap.fieldRows || []) {
  if (fieldRow.actionType !== "high_risk_lesson_reviewer_notes") continue;
  const lessonIndex = Number((fieldRow.jsonPath.match(/lessonRows\[(\d+)\]/) || [])[1]);
  const lesson = overlay.lessonRows?.[lessonIndex];
  if (!lesson) fail(`missing overlay lesson for ${fieldRow.jsonPath}`);
  for (const notePath of fieldRow.notePaths || []) {
    const noteIndex = Number((notePath.jsonPath.match(/realReviewerNotes\[(\d+)\]/) || [])[1]);
    const note = lesson.realReviewerNotes?.[noteIndex];
    if (!note) fail(`missing reviewer note for ${notePath.jsonPath}`);
    queueRowsData.push({
      itemRank: queueRowsData.length + 1,
      itemType: "high_risk_reviewer_note",
      routeId: "high_risk_overlay_notes_and_direct_sources",
      actionId: fieldRow.actionId,
      module: lesson.module,
      topic: lesson.topic,
      targetId: fieldRow.targetId,
      nodeId: lesson.nodeId,
      lessonId: lesson.lessonId,
      inputPath: overlayInputPath,
      jsonPath: notePath.jsonPath,
      requiredFields: note.requiredReviewerFields || notePath.requiredFields || [],
      allowedDecisionValues: note.allowedDecisionValues || notePath.allowedDecisionValues || [],
      prompt: note.prompt || notePath.prompt || "",
      evidenceSamples: (lesson.publicRefSamples || fieldRow.evidenceSamples || []).slice(0, 3),
      fillStatus: "missing_real_reviewer_input",
      readyForApprovalGate: note.readyForApprovalGate === true,
      learnerFacingRelease: false,
      writeAllowedNow: false,
      approvalStatus: "not_approved",
    });
  }
}

for (const [index, row] of (overlay.directSourceDecisionRows || []).entries()) {
  queueRowsData.push({
    itemRank: queueRowsData.length + 1,
    itemType: "direct_source_decision",
    routeId: "high_risk_overlay_notes_and_direct_sources",
    actionId: `direct-source-decision:${row.id}`,
    module: row.module,
    topic: row.topic,
    targetId: row.candidateId,
    nodeId: row.nodeId,
    lessonId: "",
    inputPath: overlayInputPath,
    jsonPath: `directSourceDecisionRows[${index}]`,
    requiredFields: row.requiredReviewerFields || ["reviewerName", "reviewedAt", "decision", "evidenceChecked", "reviewerNote"],
    allowedDecisionValues: row.allowedDecisionValues || [],
    prompt: `Resolve direct/private source candidate without approving learner-facing citations: ${row.privateOrDirectCandidateSource || ""}`,
    evidenceSamples: (row.publicReplacementRefSamples || []).slice(0, 3),
    fillStatus: "missing_real_reviewer_input",
    readyForApprovalGate: row.readyForApprovalGate === true,
    learnerFacingRelease: false,
    learnerCitationApproved: row.learnerCitationApproved === true,
    writeAllowedNow: false,
    approvalStatus: "not_approved",
  });
}

for (const { inputPath, packet } of packets) {
  for (const [index, row] of (packet.rows || []).entries()) {
    queueRowsData.push({
      itemRank: queueRowsData.length + 1,
      itemType: "source_fit_packet_row",
      routeId: routeIdForPacket(packet.packetId),
      actionId: `source-fit-row:${row.reviewId}`,
      module: row.module,
      topic: row.topic,
      targetId: row.reviewId,
      nodeId: row.nodeId,
      lessonId: "",
      inputPath,
      jsonPath: `rows[${index}]`,
      requiredFields: ["reviewerDecision", "sourceFitNotes", "citationUse", "reviewerName", "reviewedAt"],
      allowedDecisionValues: row.requiredDecisionValues || packet.allowedDecisionValues || [],
      prompt: `Decide whether ${row.name || row.sourceId} fits ${row.title || row.nodeId} as education-only source context.`,
      evidenceSamples: [{
        name: row.name,
        url: row.url,
        family: row.family,
        excerptPolicy: row.excerptPolicy,
      }],
      fillStatus: "missing_real_reviewer_input",
      readyForApprovalGate: false,
      learnerFacingRelease: false,
      learnerCitationApproved: row.learnerCitationApproved === true,
      copiedTextApproved: row.copiedTextApproved === true,
      writeAllowedNow: false,
      approvalStatus: "not_approved",
    });
  }
}

const highRiskNoteRows = queueRowsData.filter((row) => row.itemType === "high_risk_reviewer_note").length;
const directSourceDecisionRows = queueRowsData.filter((row) => row.itemType === "direct_source_decision").length;
const sourceFitReviewRows = queueRowsData.filter((row) => row.itemType === "source_fit_packet_row").length;

const queue = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  queueStatus: "first_reviewer_input_queue_ready_blocked_on_real_input",
  queueMode: "257_human_owned_required_inputs_expanded_from_cards_routes_and_packets",
  fieldMapStatus: fieldMap.fieldMapStatus,
  workbenchStatus: workbench.workbenchStatus,
  routeMapStatus: routeMap.routeMapStatus,
  actionCards: workbench.actionCards,
  routeRows: routeMap.routeRows,
  queueRows: queueRowsData.length,
  highRiskNoteRows,
  directSourceDecisionRows,
  sourceFitReviewRows,
  readyRows: 0,
  blockedRows: queueRowsData.length,
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  copiedTextApprovedRows: 0,
  readyForSeparateApproval: false,
  mergeAllowedNow: false,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  inputPaths: [overlayInputPath, ...packetInputPaths],
  routeBreakdownRows: [
    { routeId: "high_risk_overlay_notes_and_direct_sources", itemRows: highRiskNoteRows + directSourceDecisionRows, readyRows: 0, blockedRows: highRiskNoteRows + directSourceDecisionRows },
    ...packets.map(({ packet }) => {
      const routeId = routeIdForPacket(packet.packetId);
      const itemRows = queueRowsData.filter((row) => row.routeId === routeId).length;
      return { routeId, itemRows, readyRows: 0, blockedRows: itemRows };
    }),
  ],
  queueRowsData,
  commands: [
    "npm.cmd run build:knowledge-first-reviewer-input-queue",
    "npm.cmd run check:knowledge-first-reviewer-input-queue",
    "npm.cmd run check:knowledge-first-reviewer-post-input-route-map",
    "npm.cmd run check:knowledge-first-reviewer-card-status-matrix",
    "npm.cmd run verify",
  ],
  completionRule: "This first reviewer input queue is complete when all 257 human-owned input rows are expanded with route, input path, JSON path, required fields, prompt, evidence pointer, and locked release/write status. It does not fill reviewer notes, decide source fit, approve copied text, approve learner-facing citations, merge packet rows, or unlock learner release.",
  boundary: "Knowledge first reviewer input queue is reviewer-facing education-only operations material for absorbed local course material and public/Wikipedia/official source-fit review rows. It expands the first reviewer work into 72 high-risk reviewer notes, 5 direct-source decisions, and 180 source-fit packet rows; it does not generate reviewer notes, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Knowledge First Reviewer Input Queue",
  "",
  `- Queue status: ${queue.queueStatus}`,
  `- Queue rows: ${queue.queueRows}`,
  `- High-risk reviewer note rows: ${queue.highRiskNoteRows}`,
  `- Direct-source decision rows: ${queue.directSourceDecisionRows}`,
  `- Source-fit review rows: ${queue.sourceFitReviewRows}`,
  `- Ready rows: ${queue.readyRows}`,
  `- Blocked rows: ${queue.blockedRows}`,
  `- Real human input entries: ${queue.realHumanInputEntries}`,
  `- Merge allowed now: ${queue.mergeAllowedNow}`,
  `- Write allowed now: ${queue.writeAllowedNow}`,
  "",
  "## Route Breakdown",
  "",
  "| Route | Rows | Ready | Blocked |",
  "| --- | ---: | ---: | ---: |",
  ...queue.routeBreakdownRows.map((row) => `| ${row.routeId} | ${row.itemRows} | ${row.readyRows} | ${row.blockedRows} |`),
  "",
  "## First 12 Rows",
  "",
  "| Rank | Type | Module | Topic | JSON path | Status |",
  "| ---: | --- | --- | --- | --- | --- |",
  ...queue.queueRowsData.slice(0, 12).map((row) => `| ${row.itemRank} | ${row.itemType} | ${row.module} | ${row.topic} | ${row.jsonPath} | ${row.fillStatus} |`),
  "",
  "## Boundary",
  "",
  queue.boundary,
  "",
].join("\n"), "utf8");

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
