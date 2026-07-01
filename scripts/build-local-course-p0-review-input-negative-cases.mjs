import { spawnSync } from "node:child_process";
import fs from "node:fs";

const outputJsonPath = "docs/LOCAL_COURSE_P0_REVIEW_INPUT_NEGATIVE_CASES.json";
const outputMdPath = "docs/LOCAL_COURSE_P0_REVIEW_INPUT_NEGATIVE_CASES.md";
const manualBadInputPath = "docs/LOCAL_COURSE_P0_REVIEW_INPUT_NEGATIVE_CASES_MANUAL_BAD_INPUT.json";
const manualBadLintJsonPath = "docs/LOCAL_COURSE_P0_REVIEW_INPUT_NEGATIVE_CASES_MANUAL_BAD_INPUT_LINT.json";
const manualBadLintMdPath = "docs/LOCAL_COURSE_P0_REVIEW_INPUT_NEGATIVE_CASES_MANUAL_BAD_INPUT_LINT.md";
const sourceBadInputPath = "docs/LOCAL_COURSE_P0_REVIEW_INPUT_NEGATIVE_CASES_SOURCE_REPLACEMENT_BAD_INPUT.json";
const sourceBadLintJsonPath = "docs/LOCAL_COURSE_P0_REVIEW_INPUT_NEGATIVE_CASES_SOURCE_REPLACEMENT_BAD_INPUT_LINT.json";
const sourceBadLintMdPath = "docs/LOCAL_COURSE_P0_REVIEW_INPUT_NEGATIVE_CASES_SOURCE_REPLACEMENT_BAD_INPUT_LINT.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function assertBoundary(artifact, name) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
}

function runNode(args) {
  const result = spawnSync(process.execPath, args, { encoding: "utf8", stdio: "pipe" });
  if (result.status !== 0) {
    throw new Error(`command failed: node ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  }
}

const pack01Template = readJson("docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01_INPUT_COPY_TEMPLATE.json");
const sourceTemplate = readJson("docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_TEMPLATE.json");
const operatorIndex = readJson("docs/LOCAL_COURSE_P0_REVIEW_OPERATOR_INDEX.json");
const writePreview = readJson("docs/LOCAL_COURSE_P0_WRITE_AUTHORIZATION_PREVIEW.json");
assertBoundary(pack01Template, "pack 01 template");
assertBoundary(sourceTemplate, "source replacement template");
assertBoundary(operatorIndex, "operator index");
assertBoundary(writePreview, "write authorization preview");

const manualEntries = (pack01Template.inputEntries || []).map((entry) => {
  const flags = entry.packQualityRequirements?.riskTermFlags || [];
  const candidateSummary = entry.packQualityRequirements?.candidateSummary || "candidate summary unavailable";
  return {
    ...entry,
    inputStatus: "negative_case_bad_manual_input",
    reviewerName: "Codex negative-case fixture",
    reviewedAt: "2026-06-21T00:00:00.000Z",
    manualInput: {
      ...entry.manualInput,
      humanTranscription: `${candidateSummary} Candidate summary for orientation only. This intentionally copies candidate text to prove lint blocks it.`,
      humanSummary: "This bad fixture says stock recommendation, buy signal, sell signal, guaranteed return, broker workflow, auto trading, and real money.",
      uncertainWords: ["negative_case"],
      publicReferenceNotes: "Public reference: Wikipedia and official/open educational source checks would be required before use.",
      originalityNotes: "Original rewrite required: not copied and original rewrite must be checked; this fixture intentionally violates candidate-copy rules elsewhere.",
      riskRewriteNotes: flags.map((flag) => `${flag}: rewrite before learner-facing use.`).join(" "),
      checklist: Object.fromEntries(Object.keys(entry.manualInput?.checklist || {}).map((key) => [key, "done"])),
    },
  };
});

const manualBadInput = {
  ...pack01Template,
  generatedAt: new Date().toISOString(),
  fixtureOnly: true,
  templateStatus: "negative_case_bad_manual_input",
  filledEntries: manualEntries.length,
  readyForValidationEntries: 0,
  inputEntries: manualEntries,
  boundary: "Negative-case manual input fixture is pipeline validation material only. It intentionally includes candidate-copy and forbidden-claim defects. It must never be written to the real overlay and does not approve learner-facing release.",
};
writeJson(manualBadInputPath, manualBadInput);
runNode([
  "scripts/lint-local-course-p0-human-fill-pack-01-input-copy.mjs",
  "--input", manualBadInputPath,
  "--output-json", manualBadLintJsonPath,
  "--output-md", manualBadLintMdPath,
]);
const manualBadLint = readJson(manualBadLintJsonPath);

const sourceEntries = (sourceTemplate.inputEntries || []).map((entry) => {
  const candidate = entry.decisionInput?.topCandidates?.[0] || {};
  return {
    ...entry,
    inputStatus: "negative_case_bad_source_replacement_input",
    reviewerName: "Codex negative-case fixture",
    reviewedAt: "2026-06-21T00:00:00.000Z",
    decisionInput: {
      ...entry.decisionInput,
      selectedDecision: "locate_external_original",
      selectedCandidateSourceId: candidate.sourceId || "",
      selectedCandidateRelativePath: candidate.relativePath || "",
    },
    replacementInput: {
      replacementSourcePath: candidate.relativePath || "missing-neighbor-candidate",
      replacementNote: "Bad fixture: claims a neighbor candidate as external original even though no direct replacement is confirmed; no inference should be allowed.",
      rerunEvidence: "Bad fixture still names preview rerun, harvest rerun, quality audit, and intake audit so direct-candidate misuse is the blocking issue.",
      checklist: Object.fromEntries(Object.keys(entry.replacementInput?.checklist || {}).map((key) => [key, "done"])),
    },
  };
});

const sourceBadInput = {
  ...sourceTemplate,
  generatedAt: new Date().toISOString(),
  fixtureOnly: true,
  templateStatus: "negative_case_bad_source_replacement_input",
  filledEntries: sourceEntries.length,
  readyForValidationEntries: 0,
  inputEntries: sourceEntries,
  boundary: "Negative-case source replacement input fixture is pipeline validation material only. It intentionally treats neighbor candidates as direct replacements and must never be written to the real overlay.",
};
writeJson(sourceBadInputPath, sourceBadInput);
runNode([
  "scripts/local-course-p0-source-replacement-review-suite.mjs",
  "lint-input",
  "--input", sourceBadInputPath,
  "--output-json", sourceBadLintJsonPath,
  "--output-md", sourceBadLintMdPath,
]);
const sourceBadLint = readJson(sourceBadLintJsonPath);

const negativeCases = [
  {
    id: "blank_inputs_blocked",
    category: "blank_input",
    expectedStatus: "blocked",
    observedStatus: operatorIndex.blankInputReadyEntries === 0 && operatorIndex.blankInputBlockedEntries === 22 ? "blocked" : "unexpected",
    evidence: `operator blank ready ${operatorIndex.blankInputReadyEntries}, blocked ${operatorIndex.blankInputBlockedEntries}`,
  },
  {
    id: "fixture_ready_entries_not_authorizable",
    category: "fixture_write",
    expectedStatus: "blocked",
    observedStatus: writePreview.writeAllowedNow === false && writePreview.fixtureOnlyReadyEntries === 22 && writePreview.fixtureWrittenEntries === 0 ? "blocked" : "unexpected",
    evidence: `writeAllowedNow:${writePreview.writeAllowedNow}; fixture ready ${writePreview.fixtureOnlyReadyEntries}; written ${writePreview.fixtureWrittenEntries}`,
  },
  {
    id: "manual_candidate_copy_and_forbidden_claims",
    category: "manual_transcription",
    expectedStatus: "blocked_quality_lint",
    observedStatus: manualBadLint.lintStatus,
    evidence: `candidateCopyIssueEntries:${manualBadLint.candidateCopyIssueEntries}; forbiddenHitEntries:${manualBadLint.forbiddenHitEntries}`,
  },
  {
    id: "source_neighbor_candidate_misuse",
    category: "source_replacement",
    expectedStatus: "blocked_quality_lint",
    observedStatus: sourceBadLint.lintStatus,
    evidence: `directCandidateMisuseEntries:${sourceBadLint.directCandidateMisuseEntries}; invalidDecisionEntries:${sourceBadLint.invalidDecisionEntries}`,
  },
  {
    id: "overlay_must_remain_untouched",
    category: "overlay",
    expectedStatus: "blocked_before_write",
    observedStatus: writePreview.overlayStatus,
    evidence: `overlay ready ${writePreview.overlayReadyForValidationTasks}; accepted ${writePreview.overlayAcceptedForNextGateTasks}`,
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  reportStatus: "p0_review_input_negative_cases_ready",
  totalNegativeCases: negativeCases.length,
  blockedNegativeCases: negativeCases.filter((item) => /^blocked/.test(item.observedStatus) || item.observedStatus === "p0_review_not_started").length,
  manualBadInputPath,
  manualBadLintPath: manualBadLintJsonPath,
  sourceBadInputPath,
  sourceBadLintPath: sourceBadLintJsonPath,
  manualBadLintStatus: manualBadLint.lintStatus,
  manualBadCandidateCopyIssueEntries: manualBadLint.candidateCopyIssueEntries,
  manualBadForbiddenHitEntries: manualBadLint.forbiddenHitEntries,
  sourceBadLintStatus: sourceBadLint.lintStatus,
  sourceBadDirectCandidateMisuseEntries: sourceBadLint.directCandidateMisuseEntries,
  sourceBadInvalidDecisionEntries: sourceBadLint.invalidDecisionEntries,
  writeAllowedNow: writePreview.writeAllowedNow,
  fixtureOnlyReadyEntries: writePreview.fixtureOnlyReadyEntries,
  fixtureWrittenEntries: writePreview.fixtureWrittenEntries,
  overlayStatus: writePreview.overlayStatus,
  negativeCases,
  completionRule: "These negative cases prove bad reviewer input is blocked before overlay writes. They are not review approvals, not real reviewer notes, not course absorption, and not learner-facing release.",
  boundary: "P0 review input negative cases are fixture-only reviewer-operations tests. They do not write overlay changes, approve learner-facing release, infer missing private course content, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

writeJson(outputJsonPath, report);
fs.writeFileSync(outputMdPath, [
  "# Local Course P0 Review Input Negative Cases",
  "",
  "Fixture-only negative cases for P0 reviewer input and write gates.",
  "",
  `- Report status: ${report.reportStatus}`,
  `- Negative cases: ${report.totalNegativeCases}`,
  `- Manual bad lint: ${report.manualBadLintStatus}`,
  `- Manual candidate-copy issue entries: ${report.manualBadCandidateCopyIssueEntries}`,
  `- Manual forbidden-hit entries: ${report.manualBadForbiddenHitEntries}`,
  `- Source bad lint: ${report.sourceBadLintStatus}`,
  `- Direct-candidate misuse entries: ${report.sourceBadDirectCandidateMisuseEntries}`,
  `- Write allowed now: ${report.writeAllowedNow}`,
  `- Fixture written entries: ${report.fixtureWrittenEntries}`,
  "",
  "## Cases",
  "",
  "| Case | Category | Expected | Observed | Evidence |",
  "| --- | --- | --- | --- | --- |",
  ...negativeCases.map((item) => `| ${item.id} | ${item.category} | ${item.expectedStatus} | ${item.observedStatus} | ${item.evidence} |`),
  "",
  "## Completion Rule",
  "",
  report.completionRule,
  "",
  "## Boundary",
  "",
  report.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  reportStatus: report.reportStatus,
  totalNegativeCases: report.totalNegativeCases,
  manualBadLintStatus: report.manualBadLintStatus,
  manualBadCandidateCopyIssueEntries: report.manualBadCandidateCopyIssueEntries,
  manualBadForbiddenHitEntries: report.manualBadForbiddenHitEntries,
  sourceBadLintStatus: report.sourceBadLintStatus,
  sourceBadDirectCandidateMisuseEntries: report.sourceBadDirectCandidateMisuseEntries,
  writeAllowedNow: report.writeAllowedNow,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
