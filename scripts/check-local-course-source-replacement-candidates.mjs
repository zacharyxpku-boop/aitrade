import fs from "node:fs";

const reportPath = "docs/LOCAL_COURSE_SOURCE_REPLACEMENT_CANDIDATES.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const report = readJson(reportPath);
const rows = report.targetRows || [];

if (report.educationOnly !== true) fail("candidate report must keep educationOnly:true");
if (report.productionReady !== false) fail("candidate report must keep productionReady:false");
if (report.learnerFacingRelease !== false) fail("candidate report must keep learnerFacingRelease:false");
if (report.approvalStatus !== "not_approved") fail("candidate report must remain not_approved");
if (report.discoveryStatus !== "candidate_discovery_complete_review_required") fail(`unexpected discoveryStatus: ${report.discoveryStatus}`);
if (report.replacementTargets !== 3 || rows.length !== 3) fail(`expected 3 replacement targets, got ${report.replacementTargets}/${rows.length}`);
if (report.targetsWithCandidates !== 3) fail(`expected candidates for all 3 targets, got ${report.targetsWithCandidates}`);
if (report.totalCandidateRows < 12) fail(`expected at least 12 candidate rows, got ${report.totalCandidateRows}`);

for (const row of rows) {
  if (row.educationOnly !== true || row.productionReady !== false) fail(`${row.id} boundary drift`);
  if (row.learnerFacingRelease !== false || row.approvalStatus !== "not_approved") fail(`${row.id} release gate drift`);
  if (row.targetStatus !== "source_replacement_required") fail(`${row.id} targetStatus drift`);
  if (!row.previewPath || !fs.existsSync(row.previewPath)) fail(`${row.id} preview missing`);
  if (!Array.isArray(row.candidates) || row.candidates.length < 3) fail(`${row.id} should expose at least 3 candidates`);
  if (!/review|locate_external_original/i.test(row.recommendedAction || "")) fail(`${row.id} recommendedAction must require reviewer work`);
  for (const candidate of row.candidates) {
    if (!candidate.relativePath || !candidate.sourceId) fail(`${row.id} candidate missing source identity`);
    if (candidate.relativePath === row.sourceRelativePath) fail(`${row.id} candidate cannot be the blank source itself`);
    if (!candidate.reviewerUse?.includes("candidate_only")) fail(`${row.id} candidate must remain candidate-only`);
    if (!["direct_replacement_candidate", "same_module_neighbor_candidate", "context_reference_candidate", "weak_reference_only"].includes(candidate.confidence)) {
      fail(`${row.id} invalid candidate confidence: ${candidate.confidence}`);
    }
  }
}

const boundaryText = (report.boundary || "").toLowerCase();
for (const phrase of [
  "reviewer-only suggestions",
  "do not replace files",
  "infer missing content",
  "approve learner-facing release",
  "trading advice",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
]) {
  if (!boundaryText.includes(phrase)) fail(`candidate report boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  discoveryStatus: report.discoveryStatus,
  replacementTargets: report.replacementTargets,
  targetsWithCandidates: report.targetsWithCandidates,
  targetsWithDirectReplacementCandidates: report.targetsWithDirectReplacementCandidates,
  totalCandidateRows: report.totalCandidateRows,
}, null, 2));
