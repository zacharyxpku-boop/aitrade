import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const defaultOutputJson = "docs/FIRST_REVIEWER_RELEASE_READINESS_NEGATIVE_CASES.json";
const defaultOutputMd = "docs/FIRST_REVIEWER_RELEASE_READINESS_NEGATIVE_CASES.md";
const outputJson = process.env.TRADEGYM_RELEASE_NEGATIVE_CASES_JSON || defaultOutputJson;
const outputMd = process.env.TRADEGYM_RELEASE_NEGATIVE_CASES_MD || defaultOutputMd;
const usingDefaultOutput = outputJson === defaultOutputJson && outputMd === defaultOutputMd;

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  separateApprovalGate: process.env.TRADEGYM_SEPARATE_APPROVAL_GATE_JSON || "docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.json",
  evidenceIntakeSummary: process.env.TRADEGYM_EVIDENCE_INTAKE_JSON || "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.json",
  lessonBatchNegativeCases: process.env.TRADEGYM_BATCH_STATUS_NEGATIVE_JSON || "docs/LESSON_BATCH_STATUS_NEGATIVE_CASES.json",
};

function fail(message) {
  throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function validateReleaseGate(candidate) {
  assertEnvelope(candidate, "release readiness gate candidate");
  const problems = [];
  if (candidate.autoApprovedLessons !== 0) problems.push("autoApprovedLessons must stay 0");
  if (candidate.learnerFacingReleaseCandidates !== 0) problems.push("learnerFacingReleaseCandidates must stay 0");
  if (candidate.commercialReadyPromotions !== 0) problems.push("commercialReadyPromotions must stay 0");
  if (candidate.productionReadyClaims !== 0) problems.push("productionReadyClaims must stay 0");
  for (const row of candidate.candidateRows || []) {
    const text = `${row.intakeDecision || ""} ${row.approvalGateDecision || ""}`;
    if (/approved|learner|commercial|production|release/i.test(text)) {
      problems.push(`${row.lessonId || "candidate row"} contains release/approval wording`);
    }
  }
  if (problems.length) fail(problems.join("; "));
}

function negativeCase(name, base, mutate, expectedPattern) {
  const candidate = clone(base);
  mutate(candidate);
  try {
    validateReleaseGate(candidate);
  } catch (error) {
    return {
      name,
      expectedFailure: true,
      passed: expectedPattern.test(error.message),
      errorMessage: error.message,
    };
  }
  return {
    name,
    expectedFailure: true,
    passed: false,
    errorMessage: "negative case unexpectedly passed",
  };
}

function markdown(report) {
  return [
    "# First Reviewer Release Readiness Negative Cases",
    "",
    "This report proves release/readiness drift is rejected after evidence intake and separate approval review gates.",
    "It is not approval, release, production readiness, grade promotion, or learner-facing content.",
    "",
    "## Summary",
    "",
    `- Negative cases: ${report.negativeCases}`,
    `- Passed cases: ${report.passedCases}`,
    `- Failed cases: ${report.failedCases}`,
    `- Real approval-review candidates: ${report.realApprovalReviewCandidates}`,
    `- Auto-approved lessons: ${report.autoApprovedLessons}`,
    `- Learner-facing release candidates: ${report.learnerFacingReleaseCandidates}`,
    `- Commercial-ready promotions: ${report.commercialReadyPromotions}`,
    `- Production-ready claims: ${report.productionReadyClaims}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Cases",
    "",
    "| Case | Passed | Error message |",
    "| --- | --- | --- |",
    ...report.rows.map((row) => `| ${row.name} | ${row.passed} | ${row.errorMessage.replaceAll("|", "/")} |`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const [
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  separateApprovalGate,
  evidenceIntakeSummary,
  lessonBatchNegativeCases,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.separateApprovalGate),
  readJson(paths.evidenceIntakeSummary),
  readJson(paths.lessonBatchNegativeCases),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  separateApprovalGate,
  evidenceIntakeSummary,
  lessonBatchNegativeCases,
})) {
  assertEnvelope(record, label);
}

if (usingDefaultOutput) {
  if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include release readiness negative cases file");
  if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-release-readiness-negative-cases")) fail("dry-run packet must include release readiness negative cases command");
  if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include release readiness negative cases file");
  if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-release-readiness-negative-cases")) fail("progress dashboard must include release readiness negative cases command");
  if (!progressDashboard.statusBoard.some((row) => row.name === "Release readiness negative cases" && row.status === "release_drift_guard_ready")) fail("progress dashboard must include release readiness negative cases status");
  if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to release readiness negative cases");
}

validateReleaseGate(separateApprovalGate);
if (evidenceIntakeSummary.readyForSeparateApprovalCandidates !== separateApprovalGate.intakeCandidates) fail("separate approval gate must mirror intake candidate count");
if (lessonBatchNegativeCases.failedCases !== 0 || lessonBatchNegativeCases.passedCases !== lessonBatchNegativeCases.negativeCases) fail("lesson batch negative cases must pass before release negative cases");

const rows = [
  negativeCase("approval_status_rejected", separateApprovalGate, (candidate) => {
    candidate.approvalStatus = "approved_final";
  }, /not_approved/),
  negativeCase("learner_facing_release_rejected", separateApprovalGate, (candidate) => {
    candidate.learnerFacingRelease = true;
  }, /learner-facing/),
  negativeCase("production_ready_rejected", separateApprovalGate, (candidate) => {
    candidate.productionReady = true;
  }, /productionReady/),
  negativeCase("auto_approved_lessons_rejected", separateApprovalGate, (candidate) => {
    candidate.autoApprovedLessons = 1;
  }, /autoApprovedLessons/),
  negativeCase("learner_facing_candidate_rejected", separateApprovalGate, (candidate) => {
    candidate.learnerFacingReleaseCandidates = 1;
  }, /learnerFacingReleaseCandidates/),
  negativeCase("commercial_ready_promotion_rejected", separateApprovalGate, (candidate) => {
    candidate.commercialReadyPromotions = 1;
  }, /commercialReadyPromotions/),
  negativeCase("production_ready_claim_rejected", separateApprovalGate, (candidate) => {
    candidate.productionReadyClaims = 1;
  }, /productionReadyClaims/),
  negativeCase("candidate_row_approval_wording_rejected", separateApprovalGate, (candidate) => {
    candidate.candidateRows = [{
      batchId: "rewrite_batch_01",
      lessonId: "lesson_knv2_0068",
      intakeDecision: "candidate_for_separate_human_approval_review",
      approvalGateDecision: "approved_final_learner_release",
    }];
  }, /release\/approval wording/),
];

const failedRows = rows.filter((row) => !row.passed);
if (failedRows.length) fail(`release readiness negative cases failed: ${failedRows.map((row) => row.name).join(", ")}`);

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  negativeCases: rows.length,
  passedCases: rows.filter((row) => row.passed).length,
  failedCases: failedRows.length,
  rows,
  realApprovalReviewCandidates: separateApprovalGate.approvalReviewCandidates,
  autoApprovedLessons: separateApprovalGate.autoApprovedLessons,
  learnerFacingReleaseCandidates: separateApprovalGate.learnerFacingReleaseCandidates,
  commercialReadyPromotions: separateApprovalGate.commercialReadyPromotions,
  productionReadyClaims: separateApprovalGate.productionReadyClaims,
  sourceReports: paths,
  boundary: "These negative cases only guard against release/readiness drift. They do not approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  negativeCases: report.negativeCases,
  passedCases: report.passedCases,
  failedCases: report.failedCases,
  realApprovalReviewCandidates: report.realApprovalReviewCandidates,
  autoApprovedLessons: report.autoApprovedLessons,
  learnerFacingReleaseCandidates: report.learnerFacingReleaseCandidates,
  commercialReadyPromotions: report.commercialReadyPromotions,
  productionReadyClaims: report.productionReadyClaims,
  outputJson,
  outputMd,
}, null, 2));
