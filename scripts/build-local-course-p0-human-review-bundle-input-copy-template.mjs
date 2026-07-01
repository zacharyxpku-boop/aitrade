import fs from "node:fs";

const inputTemplatePaths = [
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01_INPUT_COPY_TEMPLATE.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_02_INPUT_COPY_TEMPLATE.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_03_INPUT_COPY_TEMPLATE.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_04_INPUT_COPY_TEMPLATE.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_05_INPUT_COPY_TEMPLATE.json",
  "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_TEMPLATE.json",
];

const outputPath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_TEMPLATE.json";
const outputMdPath = "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE_INPUT_COPY_TEMPLATE.md";

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

const templates = inputTemplatePaths.map((file) => {
  const template = readJson(file);
  assertBoundary(template, file);
  return { file, template };
});

const inputEntries = templates.flatMap(({ file, template }) =>
  (template.inputEntries || []).map((entry) => ({
    ...entry,
    sourceTemplatePath: file,
    bundleInputStatus: "blank_ready_for_real_reviewer_fill",
  })));

const manualEntries = inputEntries.filter((entry) => entry.category === "manual_transcription");
const replacementEntries = inputEntries.filter((entry) => entry.category === "source_replacement");

const bundleInput = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  fixtureOnly: false,
  templateStatus: "p0_human_review_bundle_input_copy_blank",
  sourceBundle: "docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE.json",
  sourceTemplatePaths: inputTemplatePaths,
  totalEntries: inputEntries.length,
  manualTranscriptionEntries: manualEntries.length,
  sourceReplacementEntries: replacementEntries.length,
  filledEntries: 0,
  readyForValidationEntries: 0,
  targetTaskIds: inputEntries.map((entry) => entry.taskId),
  targetDocumentIds: [...new Set(inputEntries.map((entry) => entry.documentId).filter(Boolean))],
  targetPageNumbers: inputEntries.map((entry) => entry.pageNumber).filter((value) => value != null),
  inputEntries,
  usage: [
    "Copy this file before filling real reviewer notes.",
    "Fill reviewerName, reviewedAt, and the category-specific reviewer fields for every entry.",
    "Run npm.cmd run validate:local-course-p0-human-review-bundle-input-copy against the filled copy.",
    "Do not write overlays until validation, lint, separate approval, and write authorization gates pass.",
  ],
  completionRule: "This is one consolidated blank input template for all 22 P0 review entries. It does not contain real reviewer input, does not validate as ready, and does not authorize overlay writes.",
  boundary: "P0 human review bundle input copy is blank reviewer input material only. It does not perform OCR, replace real reviewer judgment, approve learner-facing release, does not write overlay changes, provide stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

if (bundleInput.totalEntries !== 22) fail(`expected 22 entries, got ${bundleInput.totalEntries}`);
if (bundleInput.manualTranscriptionEntries !== 19) fail(`expected 19 manual entries, got ${bundleInput.manualTranscriptionEntries}`);
if (bundleInput.sourceReplacementEntries !== 3) fail(`expected 3 source replacement entries, got ${bundleInput.sourceReplacementEntries}`);
if (new Set(bundleInput.targetTaskIds).size !== 22) fail("target task ids must be unique");
if (bundleInput.inputEntries.some((entry) => entry.reviewerName || entry.reviewedAt)) fail("blank bundle input must not contain reviewer identity");

fs.writeFileSync(outputPath, `${JSON.stringify(bundleInput, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course P0 Human Review Bundle Input Copy Template",
  "",
  `- Status: ${bundleInput.templateStatus}`,
  `- Total entries: ${bundleInput.totalEntries}`,
  `- Manual transcription entries: ${bundleInput.manualTranscriptionEntries}`,
  `- Source replacement entries: ${bundleInput.sourceReplacementEntries}`,
  `- Filled entries: ${bundleInput.filledEntries}`,
  `- Ready for validation: ${bundleInput.readyForValidationEntries}`,
  "",
  "Copy this file before a real reviewer fills it. The template is intentionally blank and blocked.",
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  templateStatus: bundleInput.templateStatus,
  totalEntries: bundleInput.totalEntries,
  manualTranscriptionEntries: bundleInput.manualTranscriptionEntries,
  sourceReplacementEntries: bundleInput.sourceReplacementEntries,
  filledEntries: bundleInput.filledEntries,
  readyForValidationEntries: bundleInput.readyForValidationEntries,
  outputPath,
}, null, 2));
