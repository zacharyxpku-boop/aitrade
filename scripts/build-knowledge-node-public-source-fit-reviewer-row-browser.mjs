import fs from "node:fs";

const outputJson = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEWER_ROW_BROWSER.json";
const outputMd = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEWER_ROW_BROWSER.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(data, label) {
  if (data.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (data.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (data.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (data.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
}

const workbenchIndex = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEWER_WORKBENCH_INDEX.json");
assertBoundary(workbenchIndex, "reviewer workbench index");

const rows = [];
const packetRows = [];
const moduleRowsByName = new Map();
let globalRowIndex = 0;

for (const packet of workbenchIndex.packetRows || []) {
  const inputCopy = readJson(packet.inputCopyPath);
  const validation = readJson(packet.validationPath);
  assertBoundary(inputCopy, `packet ${packet.packetNumber} input copy`);
  assertBoundary(validation, `packet ${packet.packetNumber} validation`);
  if (inputCopy.packetId !== packet.packetId) fail(`packet ${packet.packetNumber} input copy mismatch`);
  if (!Array.isArray(inputCopy.rows) || inputCopy.rows.length !== packet.reviewRows) {
    fail(`packet ${packet.packetNumber} input copy row drift`);
  }
  if (!Array.isArray(validation.validationRows) || validation.validationRows.length !== packet.reviewRows) {
    fail(`packet ${packet.packetNumber} validation row drift`);
  }

  const validationByReviewId = new Map(validation.validationRows.map((row) => [row.reviewId, row]));
  const packetStartRowIndex = globalRowIndex;
  const packetNodeIds = new Set();

  for (const [packetRowIndex, row] of inputCopy.rows.entries()) {
    const validationRow = validationByReviewId.get(row.reviewId) || {};
    packetNodeIds.add(row.nodeId);
    rows.push({
      globalRowIndex,
      packetRowIndex,
      packetNumber: packet.packetNumber,
      packetId: packet.packetId,
      batchId: packet.batchId,
      module: row.module,
      reviewId: row.reviewId,
      nodeId: row.nodeId,
      title: row.title,
      topic: row.topic,
      documentId: row.documentId,
      sourceId: row.sourceId,
      sourceName: row.name,
      url: row.url,
      tier: row.tier,
      family: row.family,
      sourceRole: row.sourceRole,
      excerptPolicy: row.excerptPolicy,
      fitScore: row.fitScore,
      requiredDecisionValues: row.requiredDecisionValues || [],
      editableFieldPaths: {
        reviewerDecision: row.sourceDraftPointer?.reviewerDecision || "",
        sourceFitNotes: row.sourceDraftPointer?.sourceFitNotes || "",
        citationUse: row.sourceDraftPointer?.citationUse || "",
        reviewerName: row.sourceDraftPointer?.reviewerName || "",
        reviewedAt: row.sourceDraftPointer?.reviewedAt || "",
      },
      reviewerDecision: row.reviewerDecision,
      citationUse: row.citationUse,
      validationStatus: validationRow.validationStatus || "blocked_missing_or_invalid_reviewer_input",
      missingFields: validationRow.missingFields || [],
      invalidDecision: validationRow.invalidDecision === true,
      forbiddenHits: validationRow.forbiddenHits || [],
      realHumanInput: validationRow.realHumanInput === true,
      learnerCitationApproved: validationRow.learnerCitationApproved === true,
      copiedTextApproved: validationRow.copiedTextApproved === true,
      reviewStatus: validationRow.validationStatus === "ready_for_merge"
        ? "ready_after_real_review"
        : "blocked_missing_real_reviewer_input",
      nextReviewerAction: "Inspect this node/source pair and fill the editable reviewer fields in the packet input copy only after real human review.",
    });
    globalRowIndex += 1;
  }

  const packetRow = {
    order: packet.order,
    packetNumber: packet.packetNumber,
    packetId: packet.packetId,
    batchId: packet.batchId,
    module: packet.module,
    targetNodes: packet.targetNodes,
    nodeCount: packetNodeIds.size,
    reviewRows: packet.reviewRows,
    startGlobalRowIndex: packetStartRowIndex,
    endGlobalRowIndex: globalRowIndex - 1,
    readyRows: validation.readyRows,
    blockedRows: validation.blockedRows,
    missingFieldRows: validation.missingFieldRows,
    invalidDecisionRows: validation.invalidDecisionRows,
    forbiddenHitRows: validation.forbiddenHitRows,
    realHumanInputEntries: validation.realHumanInputEntries,
    learnerCitationApprovedRows: validation.learnerCitationApprovedRows,
    copiedTextApprovedRows: validation.copiedTextApprovedRows,
    validationStatus: validation.validationStatus,
    inputCopyPath: packet.inputCopyPath,
    validationPath: packet.validationPath,
    reviewStatus: validation.readyRows === packet.reviewRows
      ? "ready_after_real_review"
      : "blocked_missing_real_reviewer_input",
  };
  packetRows.push(packetRow);

  const moduleRow = moduleRowsByName.get(packet.module) || {
    module: packet.module,
    packets: 0,
    nodes: 0,
    reviewRows: 0,
    readyRows: 0,
    blockedRows: 0,
    missingFieldRows: 0,
    realHumanInputEntries: 0,
    firstGlobalRowIndex: packetStartRowIndex,
    firstBlockedPacketId: packet.packetId,
    reviewStatus: "blocked_missing_real_reviewer_input",
  };
  moduleRow.packets += 1;
  moduleRow.nodes += packetNodeIds.size;
  moduleRow.reviewRows += packet.reviewRows;
  moduleRow.readyRows += validation.readyRows;
  moduleRow.blockedRows += validation.blockedRows;
  moduleRow.missingFieldRows += validation.missingFieldRows;
  moduleRow.realHumanInputEntries += validation.realHumanInputEntries;
  if (moduleRow.readyRows === moduleRow.reviewRows && moduleRow.reviewRows > 0) {
    moduleRow.reviewStatus = "ready_after_real_review";
  }
  moduleRowsByName.set(packet.module, moduleRow);
}

const familyRows = Array.from(rows.reduce((map, row) => {
  const family = row.family || "unknown";
  const current = map.get(family) || {
    family,
    rows: 0,
    readyRows: 0,
    blockedRows: 0,
    realHumanInputEntries: 0,
  };
  current.rows += 1;
  if (row.reviewStatus === "ready_after_real_review") current.readyRows += 1;
  else current.blockedRows += 1;
  if (row.realHumanInput) current.realHumanInputEntries += 1;
  map.set(family, current);
  return map;
}, new Map()).values()).sort((a, b) => b.rows - a.rows || a.family.localeCompare(b.family));

const browser = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  rowBrowserStatus: "source_fit_reviewer_row_browser_ready_all_rows_blocked_on_real_input",
  rowBrowserMode: "all_packet_readonly_row_level_review_navigation",
  totalPackets: workbenchIndex.totalPackets,
  modules: workbenchIndex.modules,
  totalReviewRows: rows.length,
  readyRows: workbenchIndex.readyRows,
  blockedRows: workbenchIndex.blockedRows,
  missingFieldRows: workbenchIndex.missingFieldRows,
  realHumanInputEntries: workbenchIndex.realHumanInputEntries,
  learnerCitationApprovedRows: workbenchIndex.learnerCitationApprovedRows,
  copiedTextApprovedRows: workbenchIndex.copiedTextApprovedRows,
  rowsWithUrl: rows.filter((row) => /^https?:\/\//.test(row.url || "")).length,
  wikipediaRows: rows.filter((row) => /wikipedia/i.test(row.family || "") || /wikipedia/i.test(row.sourceName || "")).length,
  officialRows: rows.filter((row) => /official/i.test(row.sourceRole || "") || /gov|sec|exchange/i.test(`${row.url || ""} ${row.family || ""}`)).length,
  openResearchRows: rows.filter((row) => /open research|arxiv|open_access/i.test(`${row.family || ""} ${row.url || ""} ${row.tier || ""}`)).length,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  packetRows,
  moduleRows: Array.from(moduleRowsByName.values()),
  familyRows,
  rows,
  commands: [
    "npm.cmd run build:knowledge-node-public-source-fit-reviewer-row-browser",
    "npm.cmd run check:knowledge-node-public-source-fit-reviewer-row-browser",
    "npm.cmd run build:knowledge-node-public-source-fit-reviewer-workbench-index",
    "npm.cmd run check:knowledge-node-public-source-fit-reviewer-workbench-index",
    "npm.cmd run validate:knowledge-node-public-source-fit-review-input",
    "npm.cmd run check:knowledge-node-public-source-fit-review-input-validation",
  ],
  completionRule: "The source-fit reviewer row browser is a readonly all-row navigation layer. It is not course approval: all 1638 rows remain blocked until real human source-fit review input, validation, merge preview, dry-run apply review, and separate exact-path write authorization pass.",
  boundary: "Source-fit reviewer row browser is reviewer-facing education-only navigation across all 1638 node/source rows. It displays source URLs, source families, missing reviewer fields, packet placement, and validation state; it does not generate human decisions, approve copied text, approve learner-facing citations, authorize writes, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.writeFileSync(outputJson, `${JSON.stringify(browser, null, 2)}\n`, "utf8");

const md = `# Source-Fit Reviewer Row Browser

- Status: ${browser.rowBrowserStatus}
- Packets: ${browser.totalPackets}
- Modules: ${browser.modules}
- Rows: ready ${browser.readyRows}/${browser.totalReviewRows}, blocked ${browser.blockedRows}
- Rows with URL: ${browser.rowsWithUrl}
- Wikipedia rows: ${browser.wikipediaRows}
- Official rows: ${browser.officialRows}
- Real human input entries: ${browser.realHumanInputEntries}
- Write allowed now: ${browser.writeAllowedNow}

## Source Families

${browser.familyRows.map((row) => `- ${row.family}: rows ${row.rows}, ready ${row.readyRows}, blocked ${row.blockedRows}`).join("\n")}

## First Rows

${browser.rows.slice(0, 16).map((row) => `- ${row.globalRowIndex + 1}. ${row.packetNumber} ${row.reviewId}: ${row.sourceName} - ${row.validationStatus}`).join("\n")}

## Boundary

${browser.boundary}
`;

fs.writeFileSync(outputMd, md, "utf8");

console.log(JSON.stringify({
  ok: true,
  rowBrowserStatus: browser.rowBrowserStatus,
  totalPackets: browser.totalPackets,
  modules: browser.modules,
  totalReviewRows: browser.totalReviewRows,
  readyRows: browser.readyRows,
  blockedRows: browser.blockedRows,
  rowsWithUrl: browser.rowsWithUrl,
  realHumanInputEntries: browser.realHumanInputEntries,
  writeAllowedNow: browser.writeAllowedNow,
}, null, 2));
