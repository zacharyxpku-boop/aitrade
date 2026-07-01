import fs from "node:fs";

const outputJson = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_REAL_REVIEWER_HANDOFF.json";
const outputMd = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_REAL_REVIEWER_HANDOFF.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(artifact, label) {
  if (artifact.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
}

const bundle = readJson("docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE.json");
const inputTemplate = readJson("docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_TEMPLATE.json");
const inputValidation = readJson("docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_VALIDATION.json");
const positiveFixture = readJson("docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_POSITIVE_FIXTURE.json");
const positiveValidation = readJson("docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_POSITIVE_FIXTURE_VALIDATION.json");
const writePreview = readJson("docs/LOCAL_COURSE_P0_WRITE_AUTHORIZATION_PREVIEW.json");

[
  ["bundle", bundle],
  ["input template", inputTemplate],
  ["input validation", inputValidation],
  ["positive fixture", positiveFixture],
  ["positive validation", positiveValidation],
  ["write preview", writePreview],
].forEach(([label, artifact]) => assertBoundary(artifact, label));

if (bundle.totalReviewEntries !== 22) fail("bundle must cover 22 entries");
if (inputValidation.blockedEntries !== 22 || inputValidation.readyEntries !== 0) fail("blank input must remain blocked");
if (positiveFixture.fixtureOnly !== true || positiveValidation.fixtureOnly !== true) fail("positive path must remain fixture-only");
if (positiveValidation.readyEntries !== 22 || positiveValidation.blockedEntries !== 0) fail("positive fixture must validate 22 ready entries");
if (writePreview.writeAllowedNow !== false || writePreview.manualAuthorizationRequired !== true) fail("write preview must remain blocked/manual");

const fileRows = [
  {
    label: "Unified blank input template",
    path: "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_TEMPLATE.json",
    use: "copy this file before a real reviewer fills 22 P0 entries",
    currentState: `${inputTemplate.totalEntries} entries; filled ${inputTemplate.filledEntries}; validation blocked ${inputValidation.blockedEntries}`,
  },
  {
    label: "Unified blank validation report",
    path: "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_VALIDATION.json",
    use: "prove the unfilled template is blocked",
    currentState: `${inputValidation.readyEntries} ready / ${inputValidation.blockedEntries} blocked`,
  },
  {
    label: "Fixture-only positive control",
    path: "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_POSITIVE_FIXTURE.json",
    use: "prove validator mechanics only; never use as real review evidence",
    currentState: `${positiveFixture.totalEntries} fixture entries; fixtureOnly:${positiveFixture.fixtureOnly}`,
  },
  {
    label: "Fixture-only validation report",
    path: "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_POSITIVE_FIXTURE_VALIDATION.json",
    use: "prove the validator can pass 22 filled fixture entries",
    currentState: `${positiveValidation.readyEntries} ready / ${positiveValidation.blockedEntries} blocked`,
  },
  {
    label: "Write authorization preview",
    path: "docs/LOCAL_COURSE_P0_WRITE_AUTHORIZATION_PREVIEW.json",
    use: "confirm this handoff still does not authorize overlay writes",
    currentState: `writeAllowedNow:${writePreview.writeAllowedNow}; manualAuthorizationRequired:${writePreview.manualAuthorizationRequired}`,
  },
];

const commandRows = [
  {
    order: 1,
    command: "npm.cmd run check:local-course-p0-human-review-bundle",
    expectedState: "22 review entries covered; writeAllowedNow:false",
    hardStop: "Stop if totalReviewEntries is not 22 or approval/release becomes true.",
  },
  {
    order: 2,
    command: "npm.cmd run check:local-course-p0-human-review-bundle-input-copy-template",
    expectedState: "blank unified input remains 0 ready / 22 blocked",
    hardStop: "Stop if the blank input validates as ready.",
  },
  {
    order: 3,
    command: "npm.cmd run check:local-course-p0-human-review-bundle-positive-fixture",
    expectedState: "fixture-only positive path remains 22 ready / 0 blocked",
    hardStop: "Stop if the fixture is treated as real reviewer input or approval.",
  },
  {
    order: 4,
    command: "copy docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_TEMPLATE.json to a reviewer-owned filled input path",
    expectedState: "new copied file exists outside the generated template",
    hardStop: "Do not edit generated template in place.",
  },
  {
    order: 5,
    command: "npm.cmd run validate:local-course-p0-human-review-bundle-input-copy -- --input <reviewer-filled-copy>.json --output-json <reviewer-validation>.json --output-md <reviewer-validation>.md",
    expectedState: "only real reviewer-filled entries may become ready_for_overlay_apply",
    hardStop: "Stop if reviewer identity, reviewedAt, transcription/decision notes, or checklists are missing.",
  },
  {
    order: 6,
    command: "npm.cmd run check:local-course-p0-write-authorization-preview",
    expectedState: "writeAllowedNow:false until explicit manual authorization and post-validation gates",
    hardStop: "Stop if preview is interpreted as write authorization.",
  },
];

const handoff = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  handoffStatus: "p0_real_reviewer_handoff_ready_write_blocked",
  handoffMode: "unified_22_entry_real_reviewer_fill_only",
  totalReviewEntries: bundle.totalReviewEntries,
  manualTranscriptionEntries: bundle.manualTranscriptionEntries,
  sourceReplacementEntries: bundle.sourceReplacementEntries,
  blankInputValidationStatus: inputValidation.validationStatus,
  blankInputReadyEntries: inputValidation.readyEntries,
  blankInputBlockedEntries: inputValidation.blockedEntries,
  positiveFixtureValidationStatus: positiveValidation.validationStatus,
  positiveFixtureReadyEntries: positiveValidation.readyEntries,
  positiveFixtureBlockedEntries: positiveValidation.blockedEntries,
  positiveFixtureOnly: positiveFixture.fixtureOnly,
  realHumanInputEntries: bundle.realHumanInputEntries,
  writeAllowedNow: writePreview.writeAllowedNow,
  manualAuthorizationRequired: writePreview.manualAuthorizationRequired,
  fileRows,
  commandRows,
  reviewerRules: [
    "Use the unified input template copy, not the generated template in place.",
    "Fill all 22 entries with real reviewerName and reviewedAt values.",
    "Manual transcription entries require humanTranscription, humanSummary, public/source-fit notes, rewrite-boundary notes, and completed checklist.",
    "Source replacement entries require selected decision, replacement path or unrecoverable marker, replacement note, rerun evidence, and completed checklist.",
    "Do not paste private-course prose into learner-facing text.",
    "Do not add stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
    "Do not treat fixture-only positive controls as real review evidence.",
    "Do not write overlay changes until separate write authorization is explicit and machine gates pass.",
  ],
  completionRule: "This handoff makes the unified P0 reviewer fill path operable. It does not complete real human review, does not approve learner-facing release, and does not authorize overlay writes.",
  boundary: "P0 real reviewer handoff is reviewer-facing operations scaffolding only. It does not perform OCR, replace real reviewer judgment, approve learner-facing release, write overlay changes, provide stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJson, `${JSON.stringify(handoff, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Local Course P0 Real Reviewer Handoff",
  "",
  `- Status: ${handoff.handoffStatus}`,
  `- Mode: ${handoff.handoffMode}`,
  `- Total entries: ${handoff.totalReviewEntries}`,
  `- Manual transcription entries: ${handoff.manualTranscriptionEntries}`,
  `- Source replacement entries: ${handoff.sourceReplacementEntries}`,
  `- Blank input: ${handoff.blankInputReadyEntries} ready / ${handoff.blankInputBlockedEntries} blocked`,
  `- Positive fixture: ${handoff.positiveFixtureReadyEntries} ready / ${handoff.positiveFixtureBlockedEntries} blocked / fixtureOnly:${handoff.positiveFixtureOnly}`,
  `- Real human input entries: ${handoff.realHumanInputEntries}`,
  `- Write allowed now: ${handoff.writeAllowedNow}`,
  "",
  "## Files",
  "",
  "| File | Use | Current state |",
  "| --- | --- | --- |",
  ...fileRows.map((row) => `| ${row.path} | ${row.use} | ${row.currentState} |`),
  "",
  "## Commands",
  "",
  "| Order | Command | Expected state | Hard stop |",
  "| ---: | --- | --- | --- |",
  ...commandRows.map((row) => `| ${row.order} | \`${row.command}\` | ${row.expectedState} | ${row.hardStop} |`),
  "",
  "## Reviewer Rules",
  "",
  ...handoff.reviewerRules.map((rule) => `- ${rule}`),
  "",
  "## Boundary",
  "",
  handoff.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  handoffStatus: handoff.handoffStatus,
  totalReviewEntries: handoff.totalReviewEntries,
  blankInputBlockedEntries: handoff.blankInputBlockedEntries,
  positiveFixtureReadyEntries: handoff.positiveFixtureReadyEntries,
  realHumanInputEntries: handoff.realHumanInputEntries,
  writeAllowedNow: handoff.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
