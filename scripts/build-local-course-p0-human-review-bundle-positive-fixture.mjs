import fs from "node:fs";

const fixturePaths = [
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01_POSITIVE_LINT_FIXTURE.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_02_POSITIVE_LINT_FIXTURE.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_03_POSITIVE_LINT_FIXTURE.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_04_POSITIVE_LINT_FIXTURE.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_05_POSITIVE_LINT_FIXTURE.json",
  "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_POSITIVE_LINT_FIXTURE.json",
];

const outputPath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_POSITIVE_FIXTURE.json";
const outputMdPath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_POSITIVE_FIXTURE.md";

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
  if (artifact.fixtureOnly !== true) fail(`${label} must be fixtureOnly:true`);
}

const fixtures = fixturePaths.map((file) => {
  const fixture = readJson(file);
  assertBoundary(fixture, file);
  return { file, fixture };
});

const inputEntries = fixtures.flatMap(({ file, fixture }) =>
  (fixture.inputEntries || []).map((entry) => ({
    ...entry,
    sourceFixturePath: file,
    bundleInputStatus: "positive_fixture_ready_for_validator_only",
  })));

const manualEntries = inputEntries.filter((entry) => entry.category === "manual_transcription");
const replacementEntries = inputEntries.filter((entry) => entry.category === "source_replacement");

const output = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  fixtureOnly: true,
  templateStatus: "p0_human_review_bundle_positive_fixture_ready",
  sourceBundleInputTemplate: "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_TEMPLATE.json",
  sourceFixturePaths: fixturePaths,
  totalEntries: inputEntries.length,
  manualTranscriptionEntries: manualEntries.length,
  sourceReplacementEntries: replacementEntries.length,
  filledEntries: inputEntries.length,
  readyForValidationEntries: inputEntries.length,
  targetTaskIds: inputEntries.map((entry) => entry.taskId),
  targetDocumentIds: [...new Set(inputEntries.map((entry) => entry.documentId).filter(Boolean))],
  targetPageNumbers: inputEntries.map((entry) => entry.pageNumber).filter((value) => value != null),
  inputEntries,
  usage: [
    "Use only with validate:local-course-p0-human-review-bundle-positive-fixture.",
    "Do not apply this fixture to the real P0 overlay.",
    "Do not treat this as real reviewer input or learner-facing approval.",
  ],
  completionRule: "This positive fixture proves the unified 22-entry validator path can pass with filled fixture data. It is not real human review evidence and does not authorize overlay writes.",
  boundary: "P0 human review bundle positive fixture is validator test material only. It does not perform OCR, replace real reviewer judgment, approve learner-facing release, write overlay changes, provide stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

if (output.totalEntries !== 22) fail(`expected 22 entries, got ${output.totalEntries}`);
if (output.manualTranscriptionEntries !== 19) fail(`expected 19 manual entries, got ${output.manualTranscriptionEntries}`);
if (output.sourceReplacementEntries !== 3) fail(`expected 3 source replacement entries, got ${output.sourceReplacementEntries}`);
if (new Set(output.targetTaskIds).size !== 22) fail("target task ids must be unique");
if (output.inputEntries.some((entry) => !entry.reviewerName || !entry.reviewedAt)) fail("positive fixture entries must carry fixture reviewer metadata");

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course P0 Human Review Bundle Positive Fixture",
  "",
  `- Status: ${output.templateStatus}`,
  `- Total entries: ${output.totalEntries}`,
  `- Manual transcription entries: ${output.manualTranscriptionEntries}`,
  `- Source replacement entries: ${output.sourceReplacementEntries}`,
  `- Fixture only: ${output.fixtureOnly}`,
  "",
  "This proves the unified validator path only. It is not real human approval.",
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  templateStatus: output.templateStatus,
  totalEntries: output.totalEntries,
  manualTranscriptionEntries: output.manualTranscriptionEntries,
  sourceReplacementEntries: output.sourceReplacementEntries,
  filledEntries: output.filledEntries,
  readyForValidationEntries: output.readyForValidationEntries,
  fixtureOnly: output.fixtureOnly,
  outputPath,
}, null, 2));
