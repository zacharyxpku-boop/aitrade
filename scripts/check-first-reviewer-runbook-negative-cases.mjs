import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const outputJson = "docs/FIRST_REVIEWER_RUNBOOK_NEGATIVE_CASES.json";
const outputMd = "docs/FIRST_REVIEWER_RUNBOOK_NEGATIVE_CASES.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  operatorIndex: "docs/FIRST_REVIEWER_OPERATOR_INDEX.json",
  onePageRunbook: "docs/FIRST_REVIEWER_ONE_PAGE_RUNBOOK.json",
  releaseNegativeCases: "docs/FIRST_REVIEWER_RELEASE_READINESS_NEGATIVE_CASES.json",
  realOverlayDryRunBundleAudit: "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.json",
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

function validateRunbook(candidate) {
  assertEnvelope(candidate, "one-page runbook candidate");
  const problems = [];
  if (candidate.runbookMode !== "printable_pre_write_operator_runbook") problems.push("runbookMode must stay printable_pre_write_operator_runbook");
  if (candidate.realStatusOverlayPresent !== false) problems.push("realStatusOverlayPresent must stay false");
  if (candidate.writeAllowedNow !== false) problems.push("writeAllowedNow must stay false");
  if (candidate.executionAllowedNow !== false) problems.push("executionAllowedNow must stay false");
  if (candidate.completeNoteCards !== 0) problems.push("completeNoteCards must stay 0");
  if (candidate.approvalReviewCandidates !== 0) problems.push("approvalReviewCandidates must stay 0");
  if (candidate.internalTrialReady !== false) problems.push("internalTrialReady must stay false");
  if (candidate.launchReady !== false) problems.push("launchReady must stay false");
  if (candidate.lessonChecklists !== 12) problems.push("lessonChecklists must stay 12");
  if (candidate.requiredNoteFields !== 72) problems.push("requiredNoteFields must stay 72");
  if (candidate.directCandidatesToResolve !== 5) problems.push("directCandidatesToResolve must stay 5");
  if (!candidate.runbookItems?.some((item) => item.sourceFile === "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md")) {
    problems.push("runbook must include dry-run bundle audit step");
  }
  if (!candidate.runbookItems?.some((item) => item.checkCommand === "npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit")) {
    problems.push("runbook must include dry-run bundle audit command");
  }
  const text = [
    ...(candidate.beforeStartBoxes || []),
    ...(candidate.runbookItems || []).map((item) => item.action),
  ].join(" ");
  if (/\b(buy|sell|hold|entry|exit|trading signal|buy signal|broker order|auto-?trade|win rate|profit|return guarantee|real money)\b/i.test(text)) {
    problems.push("runbook text contains trading, broker, automation, performance, or real-money wording");
  }
  if (/\b(approved_final|learner-facing release granted|commercial_ready|production-ready|production ready|launch ready granted)\b/i.test(text)) {
    problems.push("runbook text contains approval, release, commercial-ready, launch, or production wording");
  }
  if (problems.length) fail(problems.join("; "));
}

function negativeCase(name, base, mutate, expectedPattern) {
  const candidate = clone(base);
  mutate(candidate);
  try {
    validateRunbook(candidate);
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
    "# First Reviewer Runbook Negative Cases",
    "",
    "This report proves the one-page runbook cannot be treated as real notes, approval, release, grade promotion, launch readiness, or production readiness.",
    "It is a misuse guard only; it does not create reviewer notes or learner-facing content.",
    "",
    "## Summary",
    "",
    `- Negative cases: ${report.negativeCases}`,
    `- Passed cases: ${report.passedCases}`,
    `- Failed cases: ${report.failedCases}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Write allowed now: ${report.writeAllowedNow}`,
    `- Execution allowed now: ${report.executionAllowedNow}`,
    `- Complete note cards: ${report.completeNoteCards}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Internal trial ready: ${report.internalTrialReady}`,
    `- Launch ready: ${report.launchReady}`,
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
  operatorIndex,
  onePageRunbook,
  releaseNegativeCases,
  realOverlayDryRunBundleAudit,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.operatorIndex),
  readJson(paths.onePageRunbook),
  readJson(paths.releaseNegativeCases),
  readJson(paths.realOverlayDryRunBundleAudit),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  operatorIndex,
  onePageRunbook,
  releaseNegativeCases,
  realOverlayDryRunBundleAudit,
})) {
  assertEnvelope(record, label);
}

if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include runbook negative cases file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-runbook-negative-cases")) fail("dry-run packet must include runbook negative cases command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include runbook negative cases file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-runbook-negative-cases")) fail("progress dashboard must include runbook negative cases command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Runbook negative cases" && row.status === "runbook_misuse_guard_ready")) fail("progress dashboard must include runbook negative cases status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to runbook negative cases");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === outputMd)) fail("operator index must point to runbook negative cases");
if (!operatorIndex.criticalCommands.includes("npm.cmd run check:first-reviewer-runbook-negative-cases")) fail("operator index must include runbook negative cases command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md")) fail("dry-run packet must include dry-run bundle audit file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit")) fail("dry-run packet must include dry-run bundle audit command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Dry-run bundle audit" && row.status === "dry_run_bundle_audit_ready_pre_write_only")) fail("progress dashboard must include dry-run bundle audit status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md")) fail("human execution bundle must point to dry-run bundle audit");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md")) fail("operator index must point to dry-run bundle audit");
if (!operatorIndex.criticalCommands.includes("npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit")) fail("operator index must include dry-run bundle audit command");
if (realOverlayDryRunBundleAudit.auditReady !== true || realOverlayDryRunBundleAudit.writeAllowedNow !== false || realOverlayDryRunBundleAudit.humanAuthorizationRecorded !== false) fail("dry-run bundle audit must remain ready and write-blocked");

validateRunbook(onePageRunbook);
if (releaseNegativeCases.failedCases !== 0 || releaseNegativeCases.passedCases !== releaseNegativeCases.negativeCases) fail("release negative cases must pass before runbook misuse guard");

const rows = [
  negativeCase("runbook_mode_as_review_evidence_rejected", onePageRunbook, (candidate) => {
    candidate.runbookMode = "real_review_evidence";
  }, /runbookMode/),
  negativeCase("real_overlay_presence_rejected", onePageRunbook, (candidate) => {
    candidate.realStatusOverlayPresent = true;
  }, /realStatusOverlayPresent/),
  negativeCase("write_allowed_rejected", onePageRunbook, (candidate) => {
    candidate.writeAllowedNow = true;
  }, /writeAllowedNow/),
  negativeCase("execution_allowed_rejected", onePageRunbook, (candidate) => {
    candidate.executionAllowedNow = true;
  }, /executionAllowedNow/),
  negativeCase("complete_note_cards_rejected", onePageRunbook, (candidate) => {
    candidate.completeNoteCards = 1;
  }, /completeNoteCards/),
  negativeCase("approval_candidates_rejected", onePageRunbook, (candidate) => {
    candidate.approvalReviewCandidates = 1;
  }, /approvalReviewCandidates/),
  negativeCase("internal_trial_ready_rejected", onePageRunbook, (candidate) => {
    candidate.internalTrialReady = true;
  }, /internalTrialReady/),
  negativeCase("launch_ready_rejected", onePageRunbook, (candidate) => {
    candidate.launchReady = true;
  }, /launchReady/),
  negativeCase("approval_status_rejected", onePageRunbook, (candidate) => {
    candidate.approvalStatus = "approved_final";
  }, /not_approved/),
  negativeCase("learner_facing_release_rejected", onePageRunbook, (candidate) => {
    candidate.learnerFacingRelease = true;
  }, /learner-facing/),
  negativeCase("production_ready_rejected", onePageRunbook, (candidate) => {
    candidate.productionReady = true;
  }, /productionReady/),
  negativeCase("trading_signal_text_rejected", onePageRunbook, (candidate) => {
    candidate.runbookItems[0].action = "Approve the buy signal and broker order workflow.";
  }, /trading, broker, automation, performance, or real-money/),
  negativeCase("commercial_ready_text_rejected", onePageRunbook, (candidate) => {
    candidate.runbookItems[1].action = "Mark the lesson commercial_ready after reading this runbook.";
  }, /approval, release, commercial-ready, launch, or production/),
  negativeCase("missing_dry_run_bundle_audit_step_rejected", onePageRunbook, (candidate) => {
    candidate.runbookItems = candidate.runbookItems.filter((item) => item.sourceFile !== "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md");
  }, /dry-run bundle audit step/),
  negativeCase("missing_dry_run_bundle_audit_command_rejected", onePageRunbook, (candidate) => {
    const item = candidate.runbookItems.find((row) => row.sourceFile === "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md");
    item.checkCommand = "manual skip";
  }, /dry-run bundle audit command/),
];

const failedRows = rows.filter((row) => !row.passed);
if (failedRows.length) fail(`runbook negative cases failed: ${failedRows.map((row) => row.name).join(", ")}`);

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
  realStatusOverlayPresent: onePageRunbook.realStatusOverlayPresent,
  writeAllowedNow: onePageRunbook.writeAllowedNow,
  executionAllowedNow: onePageRunbook.executionAllowedNow,
  completeNoteCards: onePageRunbook.completeNoteCards,
  approvalReviewCandidates: onePageRunbook.approvalReviewCandidates,
  internalTrialReady: onePageRunbook.internalTrialReady,
  launchReady: onePageRunbook.launchReady,
  sourceReports: paths,
  boundary: "These negative cases only guard against one-page runbook misuse. They do not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, or make the product production-ready.",
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
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  writeAllowedNow: report.writeAllowedNow,
  executionAllowedNow: report.executionAllowedNow,
  completeNoteCards: report.completeNoteCards,
  approvalReviewCandidates: report.approvalReviewCandidates,
  internalTrialReady: report.internalTrialReady,
  launchReady: report.launchReady,
  outputJson,
  outputMd,
}, null, 2));
