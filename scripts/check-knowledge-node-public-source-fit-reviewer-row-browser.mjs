import fs from "node:fs";

const browserPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEWER_ROW_BROWSER.json";
const browserMdPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEWER_ROW_BROWSER.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const browser = readJson(browserPath);
if (!fs.existsSync(browserMdPath)) fail(`missing ${browserMdPath}`);

if (browser.educationOnly !== true) fail("browser must keep educationOnly:true");
if (browser.productionReady !== false) fail("browser must keep productionReady:false");
if (browser.learnerFacingRelease !== false) fail("browser must keep learnerFacingRelease:false");
if (browser.approvalStatus !== "not_approved") fail("browser must remain not_approved");
if (browser.rowBrowserStatus !== "source_fit_reviewer_row_browser_ready_all_rows_blocked_on_real_input") {
  fail(`unexpected rowBrowserStatus: ${browser.rowBrowserStatus}`);
}
if (browser.rowBrowserMode !== "all_packet_readonly_row_level_review_navigation") fail("unexpected rowBrowserMode");
if (browser.totalPackets !== 35) fail("packet count drift");
if (browser.modules !== 12) fail("module count drift");
if (browser.totalReviewRows !== 1638 || browser.readyRows !== 0 || browser.blockedRows !== 1638 || browser.missingFieldRows !== 1638) {
  fail("row readiness drift");
}
if (browser.realHumanInputEntries !== 0) fail("browser must not claim real human input");
if (browser.learnerCitationApprovedRows !== 0 || browser.copiedTextApprovedRows !== 0) {
  fail("browser must not claim citation/copy approval");
}
if (browser.rowsWithUrl !== 1638) fail("all rows must have source URL");
if (browser.wikipediaRows < 1000) fail("wikipedia row coverage drift");
if (browser.officialRows < 200) fail("official row coverage drift");
if (browser.openResearchRows < 200) fail("open research row coverage drift");
if (browser.writeAllowedNow !== false || browser.manualAuthorizationRequired !== true) fail("write gate must remain locked");

if (!Array.isArray(browser.packetRows) || browser.packetRows.length !== 35) fail("packetRows must contain 35 packets");
for (const [index, row] of browser.packetRows.entries()) {
  const packetNumber = String(index + 1).padStart(3, "0");
  if (row.packetNumber !== packetNumber) fail(`packet ${packetNumber} number drift`);
  if (row.packetId !== `node-public-source-fit-batch-${packetNumber}-packet`) fail(`packet ${packetNumber} id drift`);
  if (row.reviewRows <= 0 || row.nodeCount <= 0) fail(`packet ${packetNumber} counts missing`);
  if (row.readyRows !== 0 || row.blockedRows !== row.reviewRows || row.missingFieldRows !== row.reviewRows) {
    fail(`packet ${packetNumber} readiness drift`);
  }
  if (row.realHumanInputEntries !== 0 || row.learnerCitationApprovedRows !== 0 || row.copiedTextApprovedRows !== 0) {
    fail(`packet ${packetNumber} approval/input drift`);
  }
  if (row.validationStatus !== "blocked_missing_real_reviewer_source_fit_input") {
    fail(`packet ${packetNumber} validation status drift`);
  }
  if (row.reviewStatus !== "blocked_missing_real_reviewer_input") fail(`packet ${packetNumber} review status drift`);
}

if (!Array.isArray(browser.moduleRows) || browser.moduleRows.length !== 12) fail("moduleRows must contain 12 modules");
if (browser.moduleRows.reduce((sum, row) => sum + row.packets, 0) !== 35) fail("module packet total drift");
if (browser.moduleRows.reduce((sum, row) => sum + row.reviewRows, 0) !== 1638) fail("module row total drift");
for (const row of browser.moduleRows) {
  if (!row.module || row.packets <= 0 || row.nodes <= 0 || row.reviewRows <= 0) fail("module row missing counts");
  if (row.readyRows !== 0 || row.blockedRows !== row.reviewRows || row.missingFieldRows !== row.reviewRows) {
    fail(`module ${row.module} readiness drift`);
  }
  if (row.realHumanInputEntries !== 0 || row.reviewStatus !== "blocked_missing_real_reviewer_input") {
    fail(`module ${row.module} status drift`);
  }
}

if (!Array.isArray(browser.familyRows) || browser.familyRows.length < 3) fail("family rows missing");
if (!browser.familyRows.some((row) => row.family === "Wikipedia" && row.rows >= 1000)) fail("wikipedia family drift");

if (!Array.isArray(browser.rows) || browser.rows.length !== 1638) fail("rows must contain 1638 rows");
const seenReviewIds = new Set();
for (const [index, row] of browser.rows.entries()) {
  if (row.globalRowIndex !== index) fail(`global row ${index} index drift`);
  if (!row.packetNumber || !row.packetId || !row.batchId || !row.module) fail(`row ${index} packet identity missing`);
  if (!row.reviewId || !row.nodeId || !row.documentId || !row.sourceName || !row.url) fail(`row ${index} source identity missing`);
  if (!/^https?:\/\//.test(row.url)) fail(`row ${index} URL must be http(s)`);
  if (!Array.isArray(row.requiredDecisionValues) || row.requiredDecisionValues.length !== 3) {
    fail(`row ${index} decision values drift`);
  }
  for (const field of ["reviewerDecision", "sourceFitNotes", "citationUse", "reviewerName", "reviewedAt"]) {
    if (!row.editableFieldPaths?.[field] || !row.editableFieldPaths[field].startsWith("/rows/")) {
      fail(`row ${index} editable field path missing: ${field}`);
    }
  }
  if (row.validationStatus !== "blocked_missing_or_invalid_reviewer_input") fail(`row ${index} validation drift`);
  if (row.reviewStatus !== "blocked_missing_real_reviewer_input") fail(`row ${index} review status drift`);
  if (!Array.isArray(row.missingFields) || row.missingFields.length < 5) fail(`row ${index} missing fields drift`);
  if (row.realHumanInput !== false || row.learnerCitationApproved !== false || row.copiedTextApproved !== false) {
    fail(`row ${index} forbidden input/approval drift`);
  }
  if (seenReviewIds.has(row.reviewId)) fail(`duplicate reviewId: ${row.reviewId}`);
  seenReviewIds.add(row.reviewId);
}

if (!Array.isArray(browser.commands) || browser.commands.length < 6) fail("commands missing");
for (const pattern of [
  /build:knowledge-node-public-source-fit-reviewer-row-browser/,
  /check:knowledge-node-public-source-fit-reviewer-row-browser/,
  /check:knowledge-node-public-source-fit-reviewer-workbench-index/,
  /validate:knowledge-node-public-source-fit-review-input/,
]) {
  if (!browser.commands.some((item) => pattern.test(item))) fail(`command missing: ${pattern}`);
}

const boundaryText = `${browser.boundary || ""} ${browser.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-facing education-only",
  "all 1638 node/source rows",
  "readonly all-row navigation",
  "all 1638 rows remain blocked",
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
