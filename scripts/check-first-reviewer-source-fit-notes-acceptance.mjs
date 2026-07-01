import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.json";
const outputMd = "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  noteQualityLint: "docs/REVIEWER_NOTE_QUALITY_LINT.json",
  directCandidateDecisionWorksheet: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.json",
  evidenceIntakeSummary: "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.json",
  separateApprovalGate: "docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.json",
};

const allowedDecisionValues = [
  "confirm_direct_evidence_after_human_review",
  "downgrade_to_boundary_only",
  "blocked_needs_rewrite_or_source_replacement",
];

const requiredAnchors = [
  "decision:",
  "source role:",
  "claim:",
  "rewrite action:",
];

function fail(message) {
  throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

async function exists(path) {
  return fs.access(path).then(() => true, () => false);
}

function assertEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function validateSourceFitNote(note, context) {
  const issues = [];
  const text = String(note || "");
  const lower = text.toLowerCase();
  if (!text.trim()) issues.push(`${context} sourceFitNotes is blank`);
  if (text.trim().length < 120) issues.push(`${context} sourceFitNotes is too short for direct-candidate acceptance`);
  if (!allowedDecisionValues.some((value) => lower.includes(value))) issues.push(`${context} sourceFitNotes lacks an allowed decision value`);
  for (const anchor of requiredAnchors) {
    if (!lower.includes(anchor)) issues.push(`${context} sourceFitNotes lacks ${anchor}`);
  }
  if (!/source (id|role)|family|metadata|title/i.test(text)) issues.push(`${context} sourceFitNotes lacks source identity or metadata reference`);
  if (!/downgrade|boundary|confirm|blocked|rewrite/i.test(text)) issues.push(`${context} sourceFitNotes lacks decision/action wording`);
  if (/approved|approval|learner-facing|launch ready|commercial_ready|commercial ready|productionReady|production ready/i.test(text)) issues.push(`${context} sourceFitNotes contains approval/readiness wording`);
  if (/buy|sell|hold|entry|exit|signal|win rate|profit|return|broker|order|automation|real money|real-money/i.test(text)) issues.push(`${context} sourceFitNotes contains trading or real-money wording`);
  if (/copy this|quoted from|verbatim|paste source|external body text/i.test(text)) issues.push(`${context} sourceFitNotes contains copying-risk wording`);
  return issues;
}

function positiveNote(row) {
  return [
    "decision: downgrade_to_boundary_only.",
    `source role: ${row.family} remains ${row.defaultRole} after inspecting the source title and metadata only.`,
    `claim: the current lesson claim is not directly supported as chart-pattern proof by ${row.family}; the source can only support source-boundary or risk-literacy context.`,
    "rewrite action: keep the lesson structural_draft, rewrite any direct-evidence phrasing into boundary context, and do not copy external source body text.",
  ].join(" ");
}

function negativeCase(name, row, note, expectedPattern) {
  const issues = validateSourceFitNote(note, `${row.batchId}.${row.lessonId}.${row.family}`);
  return {
    name,
    expectedFailure: true,
    passed: issues.some((issue) => expectedPattern.test(issue)),
    issueCount: issues.length,
    message: issues.join("; ") || "negative case unexpectedly passed",
  };
}

function markdown(report) {
  return [
    "# First Reviewer Source Fit Notes Acceptance",
    "",
    "This gate defines acceptance criteria for future real `sourceFitNotes` on the first-reviewer direct candidates.",
    "It is not real reviewer evidence, source confirmation, approval, release, commercial readiness, or production readiness.",
    "",
    "## Summary",
    "",
    `- Acceptance gate ready: ${report.acceptanceGateReady}`,
    `- Decision rows covered: ${report.decisionRowsCovered}`,
    `- Positive controls passed: ${report.positiveControlsPassed}/${report.positiveControls}`,
    `- Negative cases passed: ${report.negativeCasesPassed}/${report.negativeCases}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Real note issues: ${report.realNoteIssues}`,
    `- Confirmed decisions: ${report.confirmedDecisions}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Acceptance Rules",
    "",
    ...report.acceptanceRules.map((rule) => `- ${rule}`),
    "",
    "## Negative Cases",
    "",
    "| Case | Passed | Issues |",
    "| --- | --- | --- |",
    ...report.negativeCaseRows.map((row) => `| ${row.name} | ${row.passed} | ${row.message.replaceAll("|", "/")} |`),
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
  noteQualityLint,
  directCandidateDecisionWorksheet,
  evidenceIntakeSummary,
  separateApprovalGate,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.noteQualityLint),
  readJson(paths.directCandidateDecisionWorksheet),
  readJson(paths.evidenceIntakeSummary),
  readJson(paths.separateApprovalGate),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  noteQualityLint,
  directCandidateDecisionWorksheet,
  evidenceIntakeSummary,
  separateApprovalGate,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; sourceFitNotes acceptance currently expects pre-write state`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include sourceFitNotes acceptance file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-notes-acceptance")) fail("dry-run packet must include sourceFitNotes acceptance command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include sourceFitNotes acceptance file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-notes-acceptance")) fail("progress dashboard must include sourceFitNotes acceptance command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Source fit notes acceptance" && row.status === "acceptance_gate_ready_no_real_notes")) fail("progress dashboard must include sourceFitNotes acceptance status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to sourceFitNotes acceptance gate");

if (noteQualityLint.realStatusOverlayPresent !== false || noteQualityLint.realNoteIssues !== 0) fail("note quality lint must show no real notes before sourceFitNotes acceptance");
if (noteQualityLint.negativeCasesPassed !== noteQualityLint.negativeCases) fail("note quality lint negative cases must pass");
if (directCandidateDecisionWorksheet.decisionRows.length !== 5) fail("direct candidate worksheet must cover 5 decision rows");
if (directCandidateDecisionWorksheet.confirmedDecisions !== 0 || directCandidateDecisionWorksheet.downgradedDecisions !== 0 || directCandidateDecisionWorksheet.blockedDecisions !== 0) fail("direct candidate worksheet must remain blank in generated state");
if (evidenceIntakeSummary.completeNoteCards !== 0 || evidenceIntakeSummary.readyForSeparateApprovalCandidates !== 0) fail("evidence intake must stay empty before real sourceFitNotes");
if (separateApprovalGate.approvalReviewCandidates !== 0 || separateApprovalGate.autoApprovedLessons !== 0) fail("separate approval gate must stay empty before real sourceFitNotes");

const positiveRows = directCandidateDecisionWorksheet.decisionRows.map((row) => ({
  lessonId: row.lessonId,
  family: row.family,
  passed: validateSourceFitNote(positiveNote(row), `${row.batchId}.${row.lessonId}.${row.family}`).length === 0,
}));
const failedPositive = positiveRows.filter((row) => !row.passed);
if (failedPositive.length) fail(`sourceFitNotes positive controls failed: ${failedPositive.map((row) => `${row.lessonId}/${row.family}`).join(", ")}`);

const sampleRow = directCandidateDecisionWorksheet.decisionRows[0];
const negativeCaseRows = [
  negativeCase("blank_source_fit_note_rejected", sampleRow, "", /blank|too short/),
  negativeCase("missing_decision_value_rejected", sampleRow, "source role: CFTC boundary. claim: source title checked. rewrite action: keep educational context only without copied source text.", /decision value/),
  negativeCase("generic_confirmation_rejected", sampleRow, "decision: confirm_direct_evidence_after_human_review. source role: ok. claim: ok. rewrite action: ok.", /too short|source identity/),
  negativeCase("approval_wording_rejected", sampleRow, `${positiveNote(sampleRow)} This is approved for learner-facing release.`, /approval\/readiness/),
  negativeCase("trading_signal_wording_rejected", sampleRow, `${positiveNote(sampleRow)} This confirms an entry signal and exit plan.`, /trading|real-money/),
  negativeCase("copying_risk_wording_rejected", sampleRow, `${positiveNote(sampleRow)} Paste source verbatim into the lesson.`, /copying-risk/),
];
const failedNegative = negativeCaseRows.filter((row) => !row.passed);
if (failedNegative.length) fail(`sourceFitNotes negative cases failed: ${failedNegative.map((row) => row.name).join(", ")}`);

const acceptanceRules = [
  "A future real sourceFitNotes entry must include one allowed decision value.",
  "It must name the source role and source identity or metadata basis.",
  "It must state the lesson claim that is supported, unsupported, or being narrowed.",
  "It must state a rewrite action: confirm as direct evidence, downgrade to boundary-only, or block for rewrite/source replacement.",
  "It must be original human review prose and must not copy external source body text.",
  "It must not contain approval, learner-facing release, commercial readiness, production readiness, trading advice, signals, performance, broker/order workflow, automation, or real-money guidance.",
];

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  acceptanceGateReady: true,
  gateMode: "future_real_sourceFitNotes_quality_gate_only",
  realStatusPath,
  realStatusOverlayPresent,
  decisionRowsCovered: directCandidateDecisionWorksheet.decisionRows.length,
  allowedDecisionValues,
  requiredAnchors,
  acceptanceRules,
  positiveControls: positiveRows.length,
  positiveControlsPassed: positiveRows.filter((row) => row.passed).length,
  negativeCases: negativeCaseRows.length,
  negativeCasesPassed: negativeCaseRows.filter((row) => row.passed).length,
  negativeCaseRows,
  realNoteIssues: noteQualityLint.realNoteIssues,
  confirmedDecisions: directCandidateDecisionWorksheet.confirmedDecisions,
  approvalReviewCandidates: separateApprovalGate.approvalReviewCandidates,
  sourceReports: paths,
  boundary: "This sourceFitNotes acceptance gate defines future real-note quality criteria only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  acceptanceGateReady: report.acceptanceGateReady,
  gateMode: report.gateMode,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  decisionRowsCovered: report.decisionRowsCovered,
  positiveControlsPassed: report.positiveControlsPassed,
  positiveControls: report.positiveControls,
  negativeCasesPassed: report.negativeCasesPassed,
  negativeCases: report.negativeCases,
  confirmedDecisions: report.confirmedDecisions,
  approvalReviewCandidates: report.approvalReviewCandidates,
  outputJson,
  outputMd,
}, null, 2));
