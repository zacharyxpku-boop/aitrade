import fs from "node:fs";

const reportPath = "docs/LOCAL_COURSE_P0_REVIEW_INPUT_NEGATIVE_CASES.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const report = readJson(reportPath);
const manualLint = readJson(report.manualBadLintPath);
const sourceLint = readJson(report.sourceBadLintPath);

if (report.educationOnly !== true) fail("negative cases must keep educationOnly:true");
if (report.productionReady !== false) fail("negative cases must keep productionReady:false");
if (report.learnerFacingRelease !== false) fail("negative cases must keep learnerFacingRelease:false");
if (report.approvalStatus !== "not_approved") fail("negative cases must remain not_approved");
if (report.reportStatus !== "p0_review_input_negative_cases_ready") fail(`unexpected reportStatus: ${report.reportStatus}`);
if (report.totalNegativeCases < 5) fail("negative case coverage too thin");
if (report.writeAllowedNow !== false) fail("write must remain disallowed");
if (report.fixtureOnlyReadyEntries !== 22 || report.fixtureWrittenEntries !== 0) fail("fixture write gate drift");
if (report.overlayStatus !== "p0_review_not_started") fail("overlay must remain untouched");

if (report.manualBadLintStatus !== "blocked_quality_lint") fail("bad manual input should be blocked");
if (report.manualBadCandidateCopyIssueEntries < 4) fail("bad manual input should trigger candidate-copy issues for all 4 rows");
if (report.manualBadForbiddenHitEntries < 4) fail("bad manual input should trigger forbidden hits for all 4 rows");
if (manualLint.readyEntries !== 0 || manualLint.blockedEntries !== 4) fail("manual negative lint ready/blocked drift");
if (manualLint.candidateCopyIssueEntries < 4 || manualLint.forbiddenHitEntries < 4) fail("manual negative lint issue drift");

if (report.sourceBadLintStatus !== "blocked_quality_lint") fail("bad source replacement input should be blocked");
if (report.sourceBadDirectCandidateMisuseEntries < 3) fail("source replacement misuse should trigger all 3 rows");
if (report.sourceBadInvalidDecisionEntries !== 0) fail("source replacement negative should use allowed decision but wrong evidence");
if (sourceLint.readyEntries !== 0 || sourceLint.blockedEntries !== 3) fail("source negative lint ready/blocked drift");
if (sourceLint.directCandidateMisuseEntries < 3) fail("source negative lint misuse drift");

const cases = report.negativeCases || [];
for (const id of [
  "blank_inputs_blocked",
  "fixture_ready_entries_not_authorizable",
  "manual_candidate_copy_and_forbidden_claims",
  "source_neighbor_candidate_misuse",
  "overlay_must_remain_untouched",
]) {
  if (!cases.some((item) => item.id === id)) fail(`missing negative case ${id}`);
}

const boundaryText = `${report.boundary || ""} ${report.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "fixture-only",
  "do not write overlay changes",
  "bad reviewer input is blocked",
  "approve learner-facing release",
  "infer missing private course content",
  "trading advice",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
]) {
  if (!boundaryText.includes(phrase)) fail(`negative cases boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  reportStatus: report.reportStatus,
  manualBadCandidateCopyIssueEntries: report.manualBadCandidateCopyIssueEntries,
  manualBadForbiddenHitEntries: report.manualBadForbiddenHitEntries,
  sourceBadDirectCandidateMisuseEntries: report.sourceBadDirectCandidateMisuseEntries,
  writeAllowedNow: report.writeAllowedNow,
}, null, 2));
