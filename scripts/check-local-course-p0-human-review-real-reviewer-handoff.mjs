import fs from "node:fs";

const handoffPath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_REAL_REVIEWER_HANDOFF.json";
const handoffMdPath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_REAL_REVIEWER_HANDOFF.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const handoff = readJson(handoffPath);
if (!fs.existsSync(handoffMdPath)) fail(`missing ${handoffMdPath}`);
const markdown = fs.readFileSync(handoffMdPath, "utf8");

if (handoff.educationOnly !== true) fail("handoff must keep educationOnly:true");
if (handoff.productionReady !== false) fail("handoff must keep productionReady:false");
if (handoff.learnerFacingRelease !== false) fail("handoff must keep learnerFacingRelease:false");
if (handoff.approvalStatus !== "not_approved") fail("handoff must remain not_approved");
if (handoff.handoffStatus !== "p0_real_reviewer_handoff_ready_write_blocked") fail("invalid handoffStatus");
if (handoff.handoffMode !== "unified_22_entry_real_reviewer_fill_only") fail("invalid handoffMode");
if (handoff.totalReviewEntries !== 22) fail("handoff must cover 22 entries");
if (handoff.manualTranscriptionEntries !== 19) fail("handoff must cover 19 manual entries");
if (handoff.sourceReplacementEntries !== 3) fail("handoff must cover 3 source replacement entries");
if (handoff.blankInputValidationStatus !== "blocked_missing_reviewer_input") fail("blank input must remain blocked");
if (handoff.blankInputReadyEntries !== 0) fail("blank input must have 0 ready entries");
if (handoff.blankInputBlockedEntries !== 22) fail("blank input must have 22 blocked entries");
if (handoff.positiveFixtureValidationStatus !== "ready_for_overlay_apply") fail("positive fixture must validate ready");
if (handoff.positiveFixtureReadyEntries !== 22) fail("positive fixture must have 22 ready entries");
if (handoff.positiveFixtureBlockedEntries !== 0) fail("positive fixture must have 0 blocked entries");
if (handoff.positiveFixtureOnly !== true) fail("positive fixture must remain fixture-only");
if (handoff.realHumanInputEntries !== 0) fail("handoff must not claim real human input");
if (handoff.writeAllowedNow !== false) fail("handoff must not authorize writes");
if (handoff.manualAuthorizationRequired !== true) fail("handoff must require manual authorization");
if (!Array.isArray(handoff.fileRows) || handoff.fileRows.length < 5) fail("handoff must include file rows");
if (!Array.isArray(handoff.commandRows) || handoff.commandRows.length < 6) fail("handoff must include command rows");
if (!handoff.fileRows.some((row) => row.path === "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_TEMPLATE.json")) fail("handoff must point to unified input template");
if (!handoff.fileRows.some((row) => row.path === "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_POSITIVE_FIXTURE.json" && /never use as real review/i.test(row.use))) fail("handoff must warn about fixture-only positive control");
if (!handoff.commandRows.some((row) => /validate:local-course-p0-human-review-bundle-input-copy/.test(row.command) && /reviewer-filled-copy/.test(row.command))) fail("handoff must include real filled-copy validation command");
if (!handoff.commandRows.some((row) => /check:local-course-p0-write-authorization-preview/.test(row.command) && /writeAllowedNow:false/.test(row.expectedState))) fail("handoff must include write authorization preview check");
if (!handoff.reviewerRules.some((rule) => /Do not treat fixture-only positive controls as real review evidence/i.test(rule))) fail("handoff must reject fixture-as-review drift");
if (!/does not complete real human review/i.test(handoff.completionRule || "")) fail("completionRule must reject completion claims");
if (!/does not approve learner-facing release/i.test(handoff.completionRule || "")) fail("completionRule must reject release approval");
if (!/does not authorize overlay writes/i.test(handoff.completionRule || "")) fail("completionRule must reject write authorization");
if (!/does not perform OCR/i.test(handoff.boundary || "")) fail("boundary must reject OCR claims");
if (!/stock recommendations/i.test(handoff.boundary || "")) fail("boundary must preserve guardrails");

for (const command of [
  "npm.cmd run check:local-course-p0-human-review-bundle",
  "npm.cmd run check:local-course-p0-human-review-bundle-input-copy-template",
  "npm.cmd run check:local-course-p0-human-review-bundle-positive-fixture",
  "npm.cmd run check:local-course-p0-write-authorization-preview",
]) {
  if (!markdown.includes(command)) fail(`handoff markdown missing command ${command}`);
}
for (const text of [
  "Write allowed now: false",
  "Real human input entries: 0",
  "fixtureOnly:true",
]) {
  if (!markdown.includes(text)) fail(`handoff markdown missing ${text}`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  handoffStatus: handoff.handoffStatus,
  totalReviewEntries: handoff.totalReviewEntries,
  blankInputBlockedEntries: handoff.blankInputBlockedEntries,
  positiveFixtureReadyEntries: handoff.positiveFixtureReadyEntries,
  realHumanInputEntries: handoff.realHumanInputEntries,
  writeAllowedNow: handoff.writeAllowedNow,
}, null, 2));
