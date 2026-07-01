import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = process.env.TRADEGYM_REVIEW_STATUS_PATH || "docs/LESSON_BATCH_REVIEW_STATUS.json";
const defaultOutputJson = "docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.json";
const defaultOutputMd = "docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.md";
const outputJson = process.env.TRADEGYM_SEPARATE_APPROVAL_GATE_JSON || "docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.json";
const outputMd = process.env.TRADEGYM_SEPARATE_APPROVAL_GATE_MD || "docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.md";
const usingDefaultOutput = outputJson === defaultOutputJson && outputMd === defaultOutputMd;

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  evidenceIntakeSummary: process.env.TRADEGYM_EVIDENCE_INTAKE_JSON || "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.json",
  noteQualityLint: "docs/REVIEWER_NOTE_QUALITY_LINT.json",
  completionAudit: process.env.TRADEGYM_BATCH_COMPLETION_AUDIT_JSON || "docs/LESSON_BATCH_COMPLETION_AUDIT.json",
  realOverlayDiffAudit: "docs/FIRST_REVIEWER_REAL_OVERLAY_DIFF_AUDIT.json",
};

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

function markdown(report) {
  return [
    "# First Reviewer Separate Approval Review Gate",
    "",
    "This gate defines the second human review step after reviewer evidence intake.",
    "It prevents complete notes from becoming approval, learner-facing release, production readiness, or commercial-ready lesson grades automatically.",
    "",
    "## Summary",
    "",
    `- Gate ready: ${report.gateReady}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Intake candidates: ${report.intakeCandidates}`,
    `- Approval-review candidates: ${report.approvalReviewCandidates}`,
    `- Auto-approved lessons: ${report.autoApprovedLessons}`,
    `- Learner-facing release candidates: ${report.learnerFacingReleaseCandidates}`,
    `- Commercial-ready promotions: ${report.commercialReadyPromotions}`,
    `- Production-ready claims: ${report.productionReadyClaims}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Candidate Rows",
    "",
    "| Batch | Lesson | Intake decision | Approval gate decision |",
    "| --- | --- | --- | --- |",
    ...(report.candidateRows.length
      ? report.candidateRows.map((row) => `| ${row.batchId} | ${row.lessonId} | ${row.intakeDecision} | ${row.approvalGateDecision} |`)
      : ["| none | none | no_real_candidate | no_candidate |"]),
    "",
    "## Manual Approval Review Requirements",
    "",
    ...report.manualApprovalReviewRequirements.map((row) => `- ${row}`),
    "",
    "## Forbidden Automatic Outcomes",
    "",
    ...report.forbiddenAutomaticOutcomes.map((row) => `- ${row}`),
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
  evidenceIntakeSummary,
  noteQualityLint,
  completionAudit,
  realOverlayDiffAudit,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.evidenceIntakeSummary),
  readJson(paths.noteQualityLint),
  readJson(paths.completionAudit),
  readJson(paths.realOverlayDiffAudit),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  evidenceIntakeSummary,
  noteQualityLint,
  completionAudit,
  realOverlayDiffAudit,
})) {
  assertEnvelope(record, label);
}

if (usingDefaultOutput) {
  if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include separate approval review gate file");
  if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-separate-approval-review-gate")) fail("dry-run packet must include separate approval review gate command");
  if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include separate approval review gate file");
  if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-separate-approval-review-gate")) fail("progress dashboard must include separate approval review gate command");
  if (!progressDashboard.statusBoard.some((row) => row.name === "Separate approval review gate" && row.status === "future_manual_approval_gate_ready")) fail("progress dashboard must include separate approval review gate status");
  if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to separate approval review gate");
}

if (noteQualityLint.realNoteIssues !== 0) fail("separate approval gate requires zero real note lint issues");
if (realOverlayDiffAudit.unsafeTextIssues !== 0 || realOverlayDiffAudit.copyRiskIssues !== 0 || realOverlayDiffAudit.structuralIssues !== 0) fail("separate approval gate requires zero diff-audit issues");
if (completionAudit.readyBatches < evidenceIntakeSummary.readyForSeparateApprovalCandidates / 6) fail("intake candidates cannot exceed completion audit batch readiness");

const candidateRows = (evidenceIntakeSummary.lessonRows || [])
  .filter((row) => row.intakeDecision === "candidate_for_separate_human_approval_review")
  .map((row) => ({
    batchId: row.batchId,
    lessonId: row.lessonId,
    intakeDecision: row.intakeDecision,
    approvalGateDecision: "candidate_only_requires_separate_manual_approval_review",
  }));

const autoApprovedLessons = candidateRows.filter((row) => /approved|commercial|learner|production/i.test(row.approvalGateDecision)).length;
if (autoApprovedLessons) fail("separate approval gate cannot auto-approve candidates");
if (!realStatusOverlayPresent && candidateRows.length !== 0) fail("pre-write state cannot have approval-review candidates");

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  gateReady: true,
  realStatusPath,
  realStatusOverlayPresent,
  intakeCandidates: evidenceIntakeSummary.readyForSeparateApprovalCandidates,
  approvalReviewCandidates: candidateRows.length,
  autoApprovedLessons: 0,
  learnerFacingReleaseCandidates: 0,
  commercialReadyPromotions: 0,
  productionReadyClaims: 0,
  candidateRows,
  manualApprovalReviewRequirements: [
    "A separate human approver must review completed notes after intake; the first reviewer cannot self-approve.",
    "The approver must re-check source fit, factual claims, safety boundaries, copying risk, and hand-authored quality.",
    "The approver must confirm yellow/red/research_only sources are not used as learner-facing evidence.",
    "The approver may only decide whether a lesson is ready for a later release review; this gate does not publish or promote lesson grades.",
    "Any unresolved direct candidate, note lint issue, diff audit issue, or completion audit issue keeps the lesson blocked.",
  ],
  forbiddenAutomaticOutcomes: [
    "Do not set approvalStatus to approved_final.",
    "Do not set learnerFacingRelease:true.",
    "Do not set productionReady:true.",
    "Do not change currentGrade to commercial_ready.",
    "Do not treat complete notes as approval evidence by themselves.",
    "Do not create trading advice, signals, performance claims, broker/order workflow, automation, or real-money guidance.",
  ],
  sourceReports: paths,
  boundary: "This gate only defines the separate human approval review boundary after evidence intake. It does not approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  gateReady: report.gateReady,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  intakeCandidates: report.intakeCandidates,
  approvalReviewCandidates: report.approvalReviewCandidates,
  autoApprovedLessons: report.autoApprovedLessons,
  learnerFacingReleaseCandidates: report.learnerFacingReleaseCandidates,
  commercialReadyPromotions: report.commercialReadyPromotions,
  productionReadyClaims: report.productionReadyClaims,
  outputJson,
  outputMd,
}, null, 2));
