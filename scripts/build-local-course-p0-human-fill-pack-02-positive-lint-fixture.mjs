import fs from "node:fs";

const templatePath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_02_INPUT_COPY_TEMPLATE.json";
const outputJsonPath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_02_POSITIVE_LINT_FIXTURE.json";
const outputMdPath = "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_02_POSITIVE_LINT_FIXTURE.md";

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
if (template.learnerFacingRelease !== false || template.approvalStatus !== "not_approved") fail("template release gate drift");

const inputEntries = (template.inputEntries || []).map((entry) => {
  const flags = entry.packQualityRequirements?.riskTermFlags || [];
  return {
    ...entry,
    inputStatus: "positive_lint_fixture_ready",
    reviewerName: "Codex pack 02 lint positive-control fixture",
    reviewedAt: "2026-06-21T00:00:00.000Z",
    manualInput: {
      ...entry.manualInput,
      humanTranscription: [
        "Positive-control fixture only.",
        "A real reviewer would place the human-verified transcription from the high-resolution preview here.",
        "This placeholder proves the filled-copy lint and dry-run validation flow for candlestick taxonomy pages; it is not private course transcription.",
      ].join(" "),
      humanSummary: "Fixture-only education summary: candlestick anatomy, pattern names, and learning exercises should be handled as chart-literacy context without action advice or predictive claims.",
      uncertainWords: ["fixture_only_not_private_course_transcription"],
      publicReferenceNotes: "Public reference needed: verify candlestick anatomy, pattern taxonomy, support/resistance terminology, and any source recommendation against Wikipedia, official documentation, or open educational references before learner-facing use.",
      originalityNotes: "Original rewrite required: not copied from private course wording or the machine candidate; paraphrase as original education-only chart-literacy content.",
      riskRewriteNotes: flags.map((flag) => `${flag}: rewrite or remove this risk before learner-facing use.`).join(" "),
      checklist: Object.fromEntries(Object.keys(entry.manualInput?.checklist || {}).map((key) => [key, "done"])),
    },
  };
});

const fixture = {
  ...template,
  generatedAt: new Date().toISOString(),
  fixtureOnly: true,
  templateStatus: "pack_02_positive_lint_fixture",
  filledEntries: inputEntries.length,
  readyForValidationEntries: inputEntries.length,
  inputEntries,
  usage: [
    "This fixture proves pack 02 filled-copy lint can pass a structurally complete input.",
    "Do not apply this fixture with --write.",
    "Do not use fixture text as absorbed course content.",
  ],
  boundary: "Pack 02 positive lint fixture is pipeline validation material only. It is not a human transcription of private course content, must not be written to the real overlay, does not approve learner-facing release, and does not provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course P0 Human Fill Pack 02 Positive Lint Fixture",
  "",
  "Fixture-only positive control for pack 02 filled-copy lint.",
  "",
  `- Fixture only: ${fixture.fixtureOnly}`,
  `- Template status: ${fixture.templateStatus}`,
  `- Entries: ${fixture.totalEntries}`,
  `- Filled entries: ${fixture.filledEntries}`,
  `- Ready for validation entries: ${fixture.readyForValidationEntries}`,
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
