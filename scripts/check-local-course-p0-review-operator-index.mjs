import fs from "node:fs";

const indexPath = "docs/LOCAL_COURSE_P0_REVIEW_OPERATOR_INDEX.json";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const index = readJson(indexPath);
const rows = index.packRows || [];

if (index.educationOnly !== true) fail("operator index must keep educationOnly:true");
if (index.productionReady !== false) fail("operator index must keep productionReady:false");
if (index.learnerFacingRelease !== false) fail("operator index must keep learnerFacingRelease:false");
if (index.approvalStatus !== "not_approved") fail("operator index must remain not_approved");
if (index.indexStatus !== "p0_review_operator_index_ready_not_applied") fail(`unexpected indexStatus: ${index.indexStatus}`);
if (index.totalP0Tasks !== 22) fail(`expected 22 P0 tasks, got ${index.totalP0Tasks}`);
if (index.manualTranscriptionTasks !== 19 || index.sourceReplacementTasks !== 3) fail("P0 task category drift");
if (index.manualPackCount !== 5 || index.manualPackCards !== 19) fail("manual pack coverage drift");
if (index.sourceReplacementPackEntries !== 3) fail("source replacement pack coverage drift");
if (index.totalReviewPackEntries !== 22 || index.reviewPackCoverageComplete !== true) fail("review pack coverage incomplete");
if (index.overlayStatus !== "p0_review_not_started") fail(`unexpected overlayStatus: ${index.overlayStatus}`);
if (index.overlayReadyForValidationTasks !== 0 || index.overlayAcceptedForNextGateTasks !== 0) fail("operator index must not imply overlay progress");
if (index.blankInputReadyEntries !== 0 || index.blankInputBlockedEntries !== 22) fail("blank input gate drift");
if (index.positiveFixtureReadyToApplyEntries !== 22 || index.positiveFixtureWrittenEntries !== 0) fail("positive fixture dry-run gate drift");
if (index.sourceReplacementTargetsWithDirectReplacementCandidates !== 0 || index.sourceReplacementApprovedReplacements !== 0) {
  fail("source replacement direct/approved drift");
}
if (!Array.isArray(rows) || rows.length !== 6) fail(`expected 6 pack rows, got ${rows.length}`);

for (const pack of ["01", "02", "03", "04", "05"]) {
  const row = rows.find((item) => item.packNumber === pack);
  if (!row) fail(`missing manual pack row ${pack}`);
  if (row.category !== "manual_transcription") fail(`pack ${pack} category drift`);
  if (row.packStatus !== "blank_human_fill_pack_ready") fail(`pack ${pack} status drift`);
  if (row.filledEntries !== 0 || row.validationReadyEntries !== 0 || row.lintReadyEntries !== 0) fail(`pack ${pack} must remain blank/blocked`);
  if (row.positiveFixtureWrittenEntries !== 0) fail(`pack ${pack} fixture must not write`);
  if (!Array.isArray(row.taskIds) || row.taskIds.length !== row.totalEntries) fail(`pack ${pack} task coverage drift`);
}

const replacement = rows.find((item) => item.packNumber === "source_replacement");
if (!replacement) fail("missing source replacement row");
if (replacement.category !== "source_replacement") fail("source replacement category drift");
if (replacement.totalEntries !== 3 || replacement.validationBlockedEntries !== 3) fail("source replacement blank gate drift");
if (replacement.positiveFixtureReadyToApplyEntries !== 3 || replacement.positiveFixtureWrittenEntries !== 0) fail("source replacement fixture gate drift");

const boundaryText = `${index.boundary || ""} ${index.completionRule || ""}`.toLowerCase();
for (const phrase of [
  "reviewer-only operational material",
  "does not write overlay changes",
  "approve learner-facing release",
  "infer missing private course content",
  "trading advice",
  "stock recommendations",
  "live signals",
  "return promises",
  "broker workflows",
  "automation",
  "real-money guidance",
  "proves p0 review coverage, not p0 completion",
]) {
  if (!boundaryText.includes(phrase)) fail(`operator index boundary missing phrase: ${phrase}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: index.educationOnly,
  productionReady: index.productionReady,
  learnerFacingRelease: index.learnerFacingRelease,
  approvalStatus: index.approvalStatus,
  indexStatus: index.indexStatus,
  totalReviewPackEntries: index.totalReviewPackEntries,
  blankInputBlockedEntries: index.blankInputBlockedEntries,
  positiveFixtureReadyToApplyEntries: index.positiveFixtureReadyToApplyEntries,
  positiveFixtureWrittenEntries: index.positiveFixtureWrittenEntries,
}, null, 2));
