import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.json";
const outputMd = "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  rehearsalChecklist: "docs/FIRST_REVIEWER_REHEARSAL_CHECKLIST.json",
  directCandidateChecklist: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_CONFIRMATION_CHECKLIST.json",
  sourceRoleDecisionTable: "docs/FIRST_REVIEWER_SOURCE_ROLE_DECISION_TABLE.json",
  evidenceIntakeSummary: "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.json",
  separateApprovalGate: "docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.json",
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

function decisionRow(row) {
  return {
    batchId: row.batchId,
    lessonId: row.lessonId,
    module: row.module,
    topic: row.topic,
    riskLevel: row.riskLevel,
    family: row.family,
    defaultRole: row.defaultRole,
    currentDecisionStatus: "blank_requires_human_decision",
    allowedDecisionValues: [
      "confirm_direct_evidence_after_human_review",
      "downgrade_to_boundary_only",
      "blocked_needs_rewrite_or_source_replacement",
    ],
    decisionWriteTarget: row.requiredReviewerNoteField,
    sourceRefsToInspect: row.sourceRefs,
    sourceRefsToInspectCount: row.sourceRefs.length,
    confirmIf: row.confirmIf,
    downgradeIf: row.downgradeIf,
    blockIf: [
      "The lesson claim needs copied external source body text to be supported.",
      "The source would be used for chart-pattern proof, trading signals, entries/exits, performance, broker/order workflow, automation, or real-money guidance.",
      "The reviewer cannot explain the source role without changing the lesson grade or approval status.",
    ],
    allowedUse: row.allowedUse,
    disallowedUse: row.disallowedUse,
    requiredReviewerNotePrompt: "Write a short original human note naming the chosen decision, the source role, the claim it supports or does not support, and any rewrite needed. Do not copy source text.",
    mustRemainStructuralDraft: true,
    learnerFacingUseAllowedNow: false,
    approvalAllowedNow: false,
  };
}

function markdown(report) {
  return [
    "# First Reviewer Direct Candidate Decision Worksheet",
    "",
    "This worksheet gives the first reviewer a blank human-decision table for direct-candidate source roles.",
    "It does not confirm any source, write real notes, approve lessons, publish content, promote grades, or grant readiness.",
    "",
    "## Summary",
    "",
    `- Worksheet ready: ${report.worksheetReady}`,
    `- Decision rows: ${report.decisionRows.length}`,
    `- Source refs to inspect: ${report.sourceRefsToInspect}`,
    `- Families: ${report.families.join(", ")}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Confirmed decisions: ${report.confirmedDecisions}`,
    `- Downgraded decisions: ${report.downgradedDecisions}`,
    `- Blocked decisions: ${report.blockedDecisions}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Decision Rows",
    "",
    "| Lesson | Family | Risk | Refs | Current decision | Write target |",
    "| --- | --- | --- | --- | --- | --- |",
    ...report.decisionRows.map((row) => `| ${row.lessonId} | ${row.family} | ${row.riskLevel} | ${row.sourceRefsToInspectCount} | ${row.currentDecisionStatus} | ${row.decisionWriteTarget} |`),
    "",
    "## Allowed Decision Values",
    "",
    ...report.allowedDecisionValues.map((value) => `- ${value}`),
    "",
    "## Stop Conditions",
    "",
    ...report.stopConditions.map((condition) => `- ${condition}`),
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
  rehearsalChecklist,
  directCandidateChecklist,
  sourceRoleDecisionTable,
  evidenceIntakeSummary,
  separateApprovalGate,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.rehearsalChecklist),
  readJson(paths.directCandidateChecklist),
  readJson(paths.sourceRoleDecisionTable),
  readJson(paths.evidenceIntakeSummary),
  readJson(paths.separateApprovalGate),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  rehearsalChecklist,
  directCandidateChecklist,
  sourceRoleDecisionTable,
  evidenceIntakeSummary,
  separateApprovalGate,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; direct-candidate decision worksheet must stay pre-write`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include direct candidate decision worksheet file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-direct-candidate-decision-worksheet")) fail("dry-run packet must include direct candidate decision worksheet command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include direct candidate decision worksheet file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-direct-candidate-decision-worksheet")) fail("progress dashboard must include direct candidate decision worksheet command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Direct candidate decision worksheet" && row.status === "blank_decision_sheet_ready")) fail("progress dashboard must include direct candidate decision worksheet status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to direct candidate decision worksheet");

if (directCandidateChecklist.directCandidates !== 5) fail("direct-candidate checklist must expose 5 candidates");
if (directCandidateChecklist.nonGreenRefs !== 0) fail("direct-candidate checklist must stay green-only");
if (directCandidateChecklist.realStatusOverlayPresent !== false) fail("direct-candidate checklist must not depend on real status overlay");
if (sourceRoleDecisionTable.directCandidatesNeedingConfirmation !== 5) fail("source-role decision table must still show 5 direct candidates");
if (rehearsalChecklist.directCandidatesRehearsed !== 5) fail("rehearsal checklist must rehearse 5 direct candidates");
if (evidenceIntakeSummary.directCandidatesUnresolved !== 5) fail("evidence intake must keep 5 unresolved direct candidates before real review");
if (evidenceIntakeSummary.completeNoteCards !== 0 || evidenceIntakeSummary.readyForSeparateApprovalCandidates !== 0) fail("evidence intake must not produce candidates before real notes");
if (separateApprovalGate.approvalReviewCandidates !== 0 || separateApprovalGate.autoApprovedLessons !== 0) fail("separate approval gate must stay empty before real notes");

for (const row of directCandidateChecklist.rows) {
  if (row.confirmationStatus !== "needs_human_confirmation_or_downgrade") fail(`${row.lessonId}/${row.family} must require human confirmation or downgrade`);
  if (row.requiredReviewerNoteField !== "sourceFitNotes") fail(`${row.lessonId}/${row.family} must write decisions to sourceFitNotes`);
  if (row.mustRemainStructuralDraft !== true || row.learnerFacingUseAllowedNow !== false) fail(`${row.lessonId}/${row.family} must remain structural draft and non-learner-facing`);
  if (!Array.isArray(row.sourceRefs) || row.sourceRefs.length < 1) fail(`${row.lessonId}/${row.family} must include source refs to inspect`);
  for (const ref of row.sourceRefs) {
    if (ref.sourceUseTier !== "green_official_public_domain" && ref.sourceUseTier !== "green_public_domain_classic") fail(`${row.lessonId}/${row.family}/${ref.sourceId} must be green tier`);
  }
  const disallowed = `${row.disallowedUse} ${row.downgradeIf.join(" ")}`.toLowerCase();
  if (!disallowed.includes("chart") || !disallowed.includes("signal")) fail(`${row.lessonId}/${row.family} must warn against chart/signal misuse`);
}

const decisionRows = directCandidateChecklist.rows.map(decisionRow);
const sourceRefsToInspect = decisionRows.reduce((sum, row) => sum + row.sourceRefsToInspectCount, 0);
const families = [...new Set(decisionRows.map((row) => row.family))].sort();
const allowedDecisionValues = [
  "confirm_direct_evidence_after_human_review",
  "downgrade_to_boundary_only",
  "blocked_needs_rewrite_or_source_replacement",
];

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  worksheetReady: true,
  worksheetMode: "blank_human_decision_template_only",
  targetBatches: directCandidateChecklist.targetBatches,
  realStatusPath,
  realStatusOverlayPresent,
  decisionRows,
  sourceRefsToInspect,
  families,
  allowedDecisionValues,
  confirmedDecisions: 0,
  downgradedDecisions: 0,
  blockedDecisions: 0,
  approvalReviewCandidates: separateApprovalGate.approvalReviewCandidates,
  requiredWriteTarget: "sourceFitNotes",
  stopConditions: [
    "Stop if any direct candidate is marked confirmed by generated output instead of real human review.",
    "Stop if any source requires copied external source body text to support the lesson claim.",
    "Stop if any macro-data, filing, fraud, or oversight source is used as chart-pattern proof.",
    "Stop if any note includes buy/sell/hold advice, signals, returns, win-rate, profitability, broker/order workflow, automation, production readiness, or real-money guidance.",
    "Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.",
    "Stop if any decision changes lesson grade, approvalStatus, learnerFacingRelease, commercial readiness, or productionReady.",
  ],
  sourceReports: paths,
  boundary: "This worksheet is a blank human decision template for direct-candidate source roles only. It does not confirm source use, create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  worksheetReady: report.worksheetReady,
  worksheetMode: report.worksheetMode,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  decisionRows: report.decisionRows.length,
  sourceRefsToInspect: report.sourceRefsToInspect,
  families: report.families,
  confirmedDecisions: report.confirmedDecisions,
  downgradedDecisions: report.downgradedDecisions,
  blockedDecisions: report.blockedDecisions,
  approvalReviewCandidates: report.approvalReviewCandidates,
  outputJson,
  outputMd,
}, null, 2));
