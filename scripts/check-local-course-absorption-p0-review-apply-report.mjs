import fs from "node:fs";

const reportPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_APPLY_REPORT.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const report = readJson(reportPath);
const rows = report.applyRows || [];

if (report.educationOnly !== true) fail("apply report must keep educationOnly:true");
if (report.productionReady !== false) fail("apply report must keep productionReady:false");
if (report.learnerFacingRelease !== false) fail("apply report must keep learnerFacingRelease:false");
if (report.approvalStatus !== "not_approved") fail("apply report must remain not_approved");
if (report.applyMode !== "dry_run") fail(`expected dry_run applyMode for checked report, got ${report.applyMode}`);
if (report.applyStatus !== "blocked_no_ready_entries") fail(`unexpected applyStatus: ${report.applyStatus}`);
if (report.totalEntries !== 22 || rows.length !== 22) fail(`expected 22 rows, got ${report.totalEntries}/${rows.length}`);
if (report.readyToApplyEntries !== 0) fail(`expected 0 ready entries, got ${report.readyToApplyEntries}`);
if (report.blockedEntries !== 22) fail(`expected 22 blocked entries, got ${report.blockedEntries}`);
if (report.writtenEntries !== 0) fail(`dry-run must not write entries, got ${report.writtenEntries}`);

for (const row of rows) {
  if (row.applyStatus !== "blocked_not_ready") fail(`${row.id} should be blocked_not_ready`);
  if (row.willWrite !== false) fail(`${row.id} dry-run must not write`);
  if (!Array.isArray(row.missingFields) || row.missingFields.length < 1) fail(`${row.id} should report missing fields`);
  if (!Array.isArray(row.forbiddenHits)) fail(`${row.id} forbiddenHits must be an array`);
  if (!row.nextGate) fail(`${row.id} missing nextGate`);
}

const boundaryText = `${report.boundary || ""} ${report.nextStep || ""}`.toLowerCase();
for (const phrase of [
  "dry-run mode writes no overlay changes",
  "does not approve learner-facing release",
  "trading advice",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
]) {
  if (!boundaryText.includes(phrase)) fail(`apply report boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  applyMode: report.applyMode,
  applyStatus: report.applyStatus,
  totalEntries: report.totalEntries,
  readyToApplyEntries: report.readyToApplyEntries,
  blockedEntries: report.blockedEntries,
  writtenEntries: report.writtenEntries,
}, null, 2));
