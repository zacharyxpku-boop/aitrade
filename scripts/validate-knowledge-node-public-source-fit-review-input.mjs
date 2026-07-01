import fs from "node:fs";

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

const inputPath = argValue("--input", "docs/reviewer-inputs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_DRAFT.json");
const outputJson = argValue("--output-json", "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_VALIDATION.json");
const outputMd = argValue("--output-md", "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_VALIDATION.md");
const allowFixture = args.includes("--allow-fixture");

const allowedDecisionValues = new Set(["accept_for_node_source_fit", "reject_for_node_source_fit", "background_only"]);
const forbiddenPatterns = [
  /buy\s*signal/i,
  /sell\s*signal/i,
  /win\s*rate/i,
  /guaranteed\s*return/i,
  /profit\s*promise/i,
  /broker\s*workflow/i,
  /auto[-\s]?trading/i,
  /real[-\s]?money/i,
  /荐股|买入信号|卖出信号|胜率|收益承诺|实盘|自动交易|券商/i,
];

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

const input = readJson(inputPath);
if (input.educationOnly !== true) fail("input must keep educationOnly:true");
if (input.productionReady !== false) fail("input must keep productionReady:false");
if (input.learnerFacingRelease !== false) fail("input must keep learnerFacingRelease:false");
if (input.approvalStatus !== "not_approved") fail("input must remain not_approved");
if (!Array.isArray(input.rows)) fail("input rows missing");

const rows = input.rows;
const validationRows = [];
let readyRows = 0;
let blockedRows = 0;
let missingFieldRows = 0;
let invalidDecisionRows = 0;
let forbiddenHitRows = 0;
let realHumanInputEntries = 0;
let learnerCitationApprovedRows = 0;
let copiedTextApprovedRows = 0;
let fixtureReadyRows = 0;

for (const row of rows) {
  const missingFields = [];
  for (const field of ["reviewerDecision", "sourceFitNotes", "citationUse", "reviewerName", "reviewedAt"]) {
    if (!hasText(row[field])) missingFields.push(field);
  }
  const invalidDecision = hasText(row.reviewerDecision) && !allowedDecisionValues.has(row.reviewerDecision);
  const text = [
    row.reviewerDecision,
    row.sourceFitNotes,
    row.citationUse,
    row.reviewerName,
  ].join(" ");
  const forbiddenHits = forbiddenPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => String(pattern));
  const realHumanInput = row.realHumanInput === true && !allowFixture;
  if (row.realHumanInput === true) realHumanInputEntries += 1;
  if (row.learnerCitationApproved === true) learnerCitationApprovedRows += 1;
  if (row.copiedTextApproved === true) copiedTextApprovedRows += 1;
  const ready = missingFields.length === 0 &&
    !invalidDecision &&
    forbiddenHits.length === 0 &&
    row.learnerCitationApproved === false &&
    row.copiedTextApproved === false &&
    (realHumanInput || allowFixture);
  if (ready) {
    readyRows += 1;
    if (allowFixture) fixtureReadyRows += 1;
  } else {
    blockedRows += 1;
  }
  if (missingFields.length > 0) missingFieldRows += 1;
  if (invalidDecision) invalidDecisionRows += 1;
  if (forbiddenHits.length > 0) forbiddenHitRows += 1;
  validationRows.push({
    reviewId: row.reviewId,
    nodeId: row.nodeId,
    documentId: row.documentId,
    reviewerDecision: row.reviewerDecision || "",
    validationStatus: ready ? "ready_for_source_fit_review_apply" : "blocked_missing_or_invalid_reviewer_input",
    missingFields,
    invalidDecision,
    forbiddenHits,
    learnerCitationApproved: row.learnerCitationApproved === true,
    copiedTextApproved: row.copiedTextApproved === true,
    realHumanInput: row.realHumanInput === true,
  });
}

const validationStatus = readyRows === rows.length && rows.length > 0 && realHumanInputEntries === rows.length
  ? "ready_for_node_public_source_fit_review_apply"
  : "blocked_missing_real_reviewer_source_fit_input";

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  validationStatus,
  inputPath,
  inputRows: rows.length,
  readyRows,
  blockedRows,
  missingFieldRows,
  invalidDecisionRows,
  forbiddenHitRows,
  realHumanInputEntries,
  learnerCitationApprovedRows,
  copiedTextApprovedRows,
  fixtureReadyRows,
  allowFixture,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  validationRows,
  blockedSamples: validationRows.filter((row) => row.validationStatus !== "ready_for_source_fit_review_apply").slice(0, 20),
  completionRule: "Node public source-fit review input is ready only when every row has real human reviewer decisions and notes, no forbidden language, no copied text approval, no learner citation approval, and fixtureOnly:false.",
  boundary: "Node public source-fit review validation is reviewer-facing education-only governance. It does not approve copied text, learner-facing citations, stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Knowledge Node Public Source-Fit Review Input Validation",
  "",
  `- Validation status: ${report.validationStatus}`,
  `- Input rows: ${report.inputRows}`,
  `- Ready rows: ${report.readyRows}`,
  `- Blocked rows: ${report.blockedRows}`,
  `- Missing field rows: ${report.missingFieldRows}`,
  `- Invalid decision rows: ${report.invalidDecisionRows}`,
  `- Forbidden hit rows: ${report.forbiddenHitRows}`,
  `- Real human input entries: ${report.realHumanInputEntries}`,
  `- Learner citation approved rows: ${report.learnerCitationApprovedRows}`,
  `- Copied text approved rows: ${report.copiedTextApprovedRows}`,
  `- Write allowed now: ${report.writeAllowedNow}`,
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
  validationStatus: report.validationStatus,
  inputRows: report.inputRows,
  readyRows: report.readyRows,
  blockedRows: report.blockedRows,
  missingFieldRows: report.missingFieldRows,
  invalidDecisionRows: report.invalidDecisionRows,
  forbiddenHitRows: report.forbiddenHitRows,
  realHumanInputEntries: report.realHumanInputEntries,
  writeAllowedNow: report.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
