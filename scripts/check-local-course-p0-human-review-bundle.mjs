import fs from "node:fs";

const reportPath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE.json";

function fail(message) {
  throw new Error(message);
}

if (!fs.existsSync(reportPath)) fail(`missing ${reportPath}`);
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

if (report.educationOnly !== true) fail("bundle must keep educationOnly:true");
if (report.productionReady !== false) fail("bundle must keep productionReady:false");
if (report.learnerFacingRelease !== false) fail("bundle must keep learnerFacingRelease:false");
if (report.approvalStatus !== "not_approved") fail("bundle must remain not_approved");
if (report.bundleStatus !== "p0_human_review_bundle_ready_not_applied") fail("invalid bundleStatus");
if (report.manualPackCount !== 5) fail("expected 5 manual packs");
if (report.sourceReplacementPackCount !== 1) fail("expected 1 source replacement pack");
if (report.totalPackRows !== 6) fail("expected 6 pack rows");
if (report.manualTranscriptionEntries !== 19) fail("expected 19 manual transcription entries");
if (report.sourceReplacementEntries !== 3) fail("expected 3 source replacement entries");
if (report.totalReviewEntries !== 22) fail("expected 22 total review entries");
if (report.filledEntries !== 0) fail("blank bundle must have 0 filled entries");
if (report.validationReadyEntries !== 0) fail("blank bundle must have 0 validation-ready entries");
if (report.validationBlockedEntries !== 22) fail("blank bundle must keep all 22 entries blocked");
if (report.acceptedForOverlayEntries !== 0) fail("blank bundle must have 0 accepted overlay entries");
if (report.positiveFixtureReadyEntries !== 22) fail("expected 22 positive fixture ready entries");
if (report.fixtureOnlyReadyEntries !== 22) fail("expected 22 fixture-only ready entries");
if (report.fixtureWrittenEntries !== 0) fail("fixture entries must not be written");
if (report.realHumanInputEntries !== 0) fail("bundle must not claim real human input");
if (report.writeAllowedNow !== false) fail("bundle must not authorize writes");
if (report.approvalGatePassed !== false) fail("bundle must not pass approval gate");
if (report.humanApprovalRequired !== true) fail("human approval must remain required");
if (report.realReviewerInputRequired !== true) fail("real reviewer input must remain required");
if (!Array.isArray(report.packRows) || report.packRows.length !== 6) fail("missing packRows");
if (!report.packRows.filter((row) => row.category === "manual_transcription").every((row) =>
  row.packStatus === "blank_human_fill_pack_ready" &&
  row.totalInputEntries >= 3 &&
  row.filledEntries === 0 &&
  row.validation.readyEntries === 0 &&
  row.validation.blockedEntries === row.totalInputEntries &&
  row.positiveFixture.fixtureOnly === true
)) fail("manual pack rows are not blank/blocked fixture-controlled rows");
if (!report.packRows.some((row) =>
  row.category === "source_replacement" &&
  row.packStatus === "blank_source_replacement_review_pack_ready" &&
  row.totalInputEntries === 3 &&
  row.validation.blockedEntries === 3 &&
  row.positiveFixture.fixtureOnly === true
)) fail("source replacement row is missing or invalid");
if (!/does not prove human review completion/i.test(report.completionRule || "")) fail("completionRule must reject completion claims");
if (!/does not perform OCR/i.test(report.boundary || "")) fail("boundary must reject OCR claims");
if (!/does not.*approve learner-facing release/i.test(report.boundary || "")) fail("boundary must reject learner-facing release");
if (!/stock recommendations/i.test(report.boundary || "")) fail("boundary must preserve product guardrails");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  bundleStatus: report.bundleStatus,
  manualTranscriptionEntries: report.manualTranscriptionEntries,
  sourceReplacementEntries: report.sourceReplacementEntries,
  totalReviewEntries: report.totalReviewEntries,
  validationBlockedEntries: report.validationBlockedEntries,
  positiveFixtureReadyEntries: report.positiveFixtureReadyEntries,
  realHumanInputEntries: report.realHumanInputEntries,
  writeAllowedNow: report.writeAllowedNow,
}, null, 2));
