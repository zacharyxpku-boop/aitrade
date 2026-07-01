import fs from "node:fs";

const templatePath = "docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_INPUT_TEMPLATE.json";
const assistMapPath = "docs/LOCAL_COURSE_P0_CANDIDATE_REVIEW_ASSIST_MAP.json";
const outputJsonPath = "docs/LOCAL_COURSE_P0_REVIEW_INPUT_DRY_RUN_SAMPLE.json";
const outputMdPath = "docs/LOCAL_COURSE_P0_REVIEW_INPUT_DRY_RUN_SAMPLE.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const template = readJson(templatePath);
const assistMap = readJson(assistMapPath);

for (const [name, artifact] of [["template", template], ["assist map", assistMap]]) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false || artifact.approvalStatus !== "not_approved") {
    fail(`${name} release gate drift`);
  }
}

const assistByTask = new Map((assistMap.taskRows || []).map((row) => [row.taskId, row]));
const targetTaskIds = (assistMap.taskRows || [])
  .filter((row) => row.category === "manual_transcription" && row.matchStatus === "candidate_available_for_human_review")
  .slice(0, 2)
  .map((row) => row.taskId);

if (targetTaskIds.length !== 2) fail(`expected 2 dry-run target tasks, got ${targetTaskIds.length}`);

const inputEntries = (template.inputEntries || []).map((entry) => {
  if (!targetTaskIds.includes(entry.taskId)) return entry;
  const assist = assistByTask.get(entry.taskId);
  if (!assist) fail(`missing assist row for ${entry.taskId}`);
  return {
    ...entry,
    inputStatus: "candidate_review_fixture_ready",
    reviewerName: "Codex candidate-review dry-run fixture",
    reviewedAt: "2026-06-21T00:00:00.000Z",
    dryRunCandidateAssist: {
      assistRowId: assist.id,
      candidateId: assist.candidateId,
      matchStatus: assist.matchStatus,
      highResPreviewUrl: assist.highResPreviewUrl,
      riskTermFlags: assist.riskTermFlags,
      uncertainRegions: assist.uncertainRegions,
      fixtureOnlyReason: "This sample proves the reviewer-input validation path. It is not a human transcription and must not be written to the real overlay.",
    },
    manualInput: {
      ...entry.manualInput,
      humanTranscription: [
        "Fixture-only reviewer input sample derived from the machine-assisted candidate summary.",
        "A human reviewer must open the original preview and high-resolution preview, verify all visible text, correct uncertain regions, and rewrite into original education-only wording before any real overlay write.",
        `Candidate summary for orientation only: ${assist.candidateSummary}`,
      ].join(" "),
      humanSummary: [
        "Fixture-only dry-run summary.",
        "The real reviewer must replace this with verified human transcription notes and keep all market-language as chart-literacy context, not advice or signals.",
      ].join(" "),
      uncertainWords: [
        "fixture_only_not_human_transcription",
        ...(assist.uncertainRegions || []).slice(0, 2),
      ],
      checklist: Object.fromEntries(Object.keys(entry.manualInput?.checklist || {}).map((key) => [key, "done"])),
    },
  };
});

const sample = {
  ...template,
  generatedAt: new Date().toISOString(),
  fixtureOnly: true,
  templateStatus: "candidate_review_dry_run_fixture",
  sourceAssistMap: assistMapPath,
  filledEntries: targetTaskIds.length,
  readyForValidationEntries: targetTaskIds.length,
  dryRunTargetTaskIds: targetTaskIds,
  inputEntries,
  usage: [
    "This fixture proves two machine-candidate-assisted P0 manual-review entries can pass validator/apply dry-run.",
    "Do not apply this fixture with --write.",
    "Do not use fixture text as absorbed course content or learner-facing material.",
    "Replace fixture text with human-verified transcription before any real overlay update.",
  ],
  boundary: "P0 candidate review dry-run sample is a fixture for pipeline validation only. It is not a human transcription of private course content, must not be written to the real overlay, does not approve learner-facing release, and does not provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(sample, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course P0 Review Input Dry-Run Sample",
  "",
  "Fixture-only sample for proving candidate-assisted P0 reviewer input validation.",
  "",
  `- Fixture only: ${sample.fixtureOnly}`,
  `- Template status: ${sample.templateStatus}`,
  `- Total entries: ${sample.totalEntries}`,
  `- Filled entries: ${sample.filledEntries}`,
  `- Ready for validation entries: ${sample.readyForValidationEntries}`,
  `- Target tasks: ${sample.dryRunTargetTaskIds.join(", ")}`,
  "",
  "## Filled Entries",
  "",
  "| Input entry | Task | Page | Candidate | Status |",
  "| --- | --- | ---: | --- | --- |",
  ...inputEntries
    .filter((entry) => targetTaskIds.includes(entry.taskId))
    .map((entry) => `| ${entry.id} | ${entry.taskId} | ${entry.pageNumber || ""} | ${entry.dryRunCandidateAssist?.candidateId || ""} | ${entry.inputStatus} |`),
  "",
  "## Boundary",
  "",
  sample.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: sample.educationOnly,
  productionReady: sample.productionReady,
  learnerFacingRelease: sample.learnerFacingRelease,
  approvalStatus: sample.approvalStatus,
  fixtureOnly: sample.fixtureOnly,
  templateStatus: sample.templateStatus,
  totalEntries: sample.totalEntries,
  filledEntries: sample.filledEntries,
  readyForValidationEntries: sample.readyForValidationEntries,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
