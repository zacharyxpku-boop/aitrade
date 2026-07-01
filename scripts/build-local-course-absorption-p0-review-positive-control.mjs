import fs from "node:fs";

const templatePath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_INPUT_TEMPLATE.json";
const outputJsonPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_POSITIVE_CONTROL_INPUT.json";
const outputMdPath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_POSITIVE_CONTROL_INPUT.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const template = readJson(templatePath);
if (template.educationOnly !== true) fail("template must keep educationOnly:true");
if (template.productionReady !== false) fail("template must keep productionReady:false");
if (template.learnerFacingRelease !== false) fail("template must keep learnerFacingRelease:false");
if (template.approvalStatus !== "not_approved") fail("template must remain not_approved");

const inputEntries = (template.inputEntries || []).map((entry, index) => {
  if (index !== 0) return entry;
  return {
    ...entry,
    inputStatus: "positive_control_fixture_ready",
    reviewerName: "Codex pipeline positive-control fixture",
    reviewedAt: "2026-06-21T00:00:00.000Z",
    manualInput: {
      ...entry.manualInput,
      humanTranscription: "Positive-control fixture only. This text proves the validator and dry-run apply path can accept a completed manual transcription entry; it is not a transcription of the private course page.",
      humanSummary: "Fixture-only education summary for pipeline validation. Do not use as absorbed course content.",
      uncertainWords: ["fixture_only_not_source_transcription"],
      checklist: Object.fromEntries(Object.keys(entry.manualInput?.checklist || {}).map((key) => [key, "done"])),
    },
  };
});

const fixture = {
  ...template,
  generatedAt: new Date().toISOString(),
  fixtureOnly: true,
  templateStatus: "positive_control_fixture",
  filledEntries: 1,
  readyForValidationEntries: 1,
  inputEntries,
  usage: [
    "This fixture proves one ready manual transcription entry can pass validator/apply dry-run.",
    "Do not apply this fixture with --write.",
    "Do not use fixture text as absorbed course content.",
  ],
  boundary: "P0 review positive-control input is a fixture for pipeline validation only. It is not a transcription of private course content, must not be written to the real overlay, does not approve learner-facing release, and does not provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course Absorption P0 Review Positive Control Input",
  "",
  "Fixture input for proving one P0 reviewer entry can pass validator/apply dry-run.",
  "",
  `- Fixture only: ${fixture.fixtureOnly}`,
  `- Template status: ${fixture.templateStatus}`,
  `- Total entries: ${fixture.totalEntries}`,
  `- Filled entries: ${fixture.filledEntries}`,
  `- Ready for validation entries: ${fixture.readyForValidationEntries}`,
  "",
  "## Filled Entry",
  "",
  `- ${inputEntries[0].id}: ${inputEntries[0].category} / page ${inputEntries[0].pageNumber}`,
  "",
  "## Boundary",
  "",
  fixture.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: fixture.educationOnly,
  productionReady: fixture.productionReady,
  learnerFacingRelease: fixture.learnerFacingRelease,
  approvalStatus: fixture.approvalStatus,
  fixtureOnly: fixture.fixtureOnly,
  templateStatus: fixture.templateStatus,
  totalEntries: fixture.totalEntries,
  filledEntries: fixture.filledEntries,
  readyForValidationEntries: fixture.readyForValidationEntries,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
