import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.json";
const outputMd = "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  directCandidateChecklist: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_CONFIRMATION_CHECKLIST.json",
  directCandidateDecisionWorksheet: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.json",
  sourceRoleDecisionTable: "docs/FIRST_REVIEWER_SOURCE_ROLE_DECISION_TABLE.json",
  sourceFitNotesAcceptance: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.json",
};

const allowedDecisionValues = [
  "confirm_direct_evidence_after_human_review",
  "downgrade_to_boundary_only",
  "blocked_needs_rewrite_or_source_replacement",
];

const requiredReviewerFields = [
  "decision",
  "sourceRole",
  "claimSupported",
  "rewriteAction",
  "sourceIdentityBasis",
  "noCopyOriginalityCheck",
  "reviewerInitials",
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

function summarizeRow(row, checklistRows) {
  const checklistRow = checklistRows.find((candidate) => candidate.lessonId === row.lessonId && candidate.family === row.family);
  if (!checklistRow) fail(`${row.lessonId}/${row.family} is missing from direct-candidate checklist`);
  if (row.currentDecisionStatus !== "blank_requires_human_decision") fail(`${row.lessonId}/${row.family} must stay blank before real review`);
  if (row.mustRemainStructuralDraft !== true) fail(`${row.lessonId}/${row.family} must remain structural_draft`);
  if (row.approvalAllowedNow !== false || row.learnerFacingUseAllowedNow !== false) fail(`${row.lessonId}/${row.family} cannot allow approval or learner-facing use now`);
  if (JSON.stringify(row.allowedDecisionValues) !== JSON.stringify(allowedDecisionValues)) fail(`${row.lessonId}/${row.family} allowed decision values changed`);
  for (const ref of row.sourceRefsToInspect) {
    if (ref.sourceUseTier !== "green_official_public_domain" && ref.sourceUseTier !== "green_public_domain_classic") fail(`${row.lessonId}/${row.family}/${ref.sourceId} must stay green`);
  }

  return {
    batchId: row.batchId,
    lessonId: row.lessonId,
    module: row.module,
    topic: row.topic,
    riskLevel: row.riskLevel,
    sourceFamily: row.family,
    defaultRole: row.defaultRole,
    currentDecisionStatus: row.currentDecisionStatus,
    recommendedDefault: "downgrade_to_boundary_only_unless_human_confirms_direct_claim_fit",
    sourceRefsToInspect: row.sourceRefsToInspect.map((ref) => ({
      sourceId: ref.sourceId,
      name: ref.name,
      url: ref.url,
      sourceUseTier: ref.sourceUseTier,
      licenseStatus: ref.licenseStatus,
    })),
    sourceRefsToInspectCount: row.sourceRefsToInspectCount,
    confirmIf: row.confirmIf,
    downgradeIf: row.downgradeIf,
    blockIf: row.blockIf,
    allowedUse: row.allowedUse,
    disallowedUse: row.disallowedUse,
    requiredReviewerFields,
    mustRemainStructuralDraft: true,
    learnerFacingUseAllowedNow: false,
    approvalAllowedNow: false,
  };
}

function markdown(report) {
  return [
    "# First Reviewer Source-Fit Decision Summary",
    "",
    "This one-page summary compresses the direct-candidate source-fit decisions for Batch 01 and Batch 05.",
    "It does not confirm sources, write real reviewer notes, approve lessons, publish learner-facing content, or certify readiness.",
    "",
    "## Summary",
    "",
    `- Summary ready: ${report.summaryReady}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Decision rows: ${report.decisionRows.length}`,
    `- Source refs to inspect: ${report.sourceRefsToInspect}`,
    `- Source families: ${report.families.join(", ")}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Confirmed decisions: ${report.confirmedDecisions}`,
    `- Downgraded decisions: ${report.downgradedDecisions}`,
    `- Blocked decisions: ${report.blockedDecisions}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Decision Rows",
    "",
    "| Lesson | Batch | Family | Refs | Recommended default | Current decision |",
    "| --- | --- | --- | --- | --- | --- |",
    ...report.decisionRows.map((row) => `| ${row.lessonId} | ${row.batchId} | ${row.sourceFamily} | ${row.sourceRefsToInspectCount} | ${row.recommendedDefault} | ${row.currentDecisionStatus} |`),
    "",
    "## Reviewer Field Requirements",
    "",
    ...report.requiredReviewerFields.map((field) => `- ${field}`),
    "",
    "## Hard Stops",
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
  directCandidateChecklist,
  directCandidateDecisionWorksheet,
  sourceRoleDecisionTable,
  sourceFitNotesAcceptance,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.directCandidateChecklist),
  readJson(paths.directCandidateDecisionWorksheet),
  readJson(paths.sourceRoleDecisionTable),
  readJson(paths.sourceFitNotesAcceptance),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  directCandidateChecklist,
  directCandidateDecisionWorksheet,
  sourceRoleDecisionTable,
  sourceFitNotesAcceptance,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; source-fit decision summary must stay pre-write`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include source-fit decision summary file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-decision-summary")) fail("dry-run packet must include source-fit decision summary command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include source-fit decision summary file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-decision-summary")) fail("progress dashboard must include source-fit decision summary command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Source-fit decision summary" && row.status === "one_page_decision_summary_ready")) fail("progress dashboard must include source-fit decision summary status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to source-fit decision summary");

if (directCandidateChecklist.directCandidates !== 5 || directCandidateDecisionWorksheet.decisionRows.length !== 5) fail("source-fit summary must cover exactly 5 direct-candidate rows");
if (directCandidateChecklist.sourceRefsToInspect !== 8 || directCandidateDecisionWorksheet.sourceRefsToInspect !== 8) fail("source-fit summary must cover exactly 8 source refs");
if (directCandidateChecklist.nonGreenRefs !== 0) fail("direct-candidate checklist must stay green-only");
if (sourceRoleDecisionTable.directCandidatesNeedingConfirmation !== 5) fail("source role table must keep 5 direct candidates needing confirmation");
if (sourceFitNotesAcceptance.acceptanceGateReady !== true || sourceFitNotesAcceptance.decisionRowsCovered !== 5) fail("sourceFitNotes acceptance must cover the 5 direct candidates");
if (directCandidateDecisionWorksheet.confirmedDecisions !== 0 || directCandidateDecisionWorksheet.downgradedDecisions !== 0 || directCandidateDecisionWorksheet.blockedDecisions !== 0) fail("generated worksheet must not contain real decisions");
if (sourceFitNotesAcceptance.confirmedDecisions !== 0 || sourceFitNotesAcceptance.approvalReviewCandidates !== 0) fail("sourceFitNotes acceptance must not create decisions or approval candidates");

const decisionRows = directCandidateDecisionWorksheet.decisionRows.map((row) => summarizeRow(row, directCandidateChecklist.rows));
const sourceRefsToInspect = decisionRows.reduce((sum, row) => sum + row.sourceRefsToInspectCount, 0);
const families = [...new Set(decisionRows.map((row) => row.sourceFamily))].sort();
if (sourceRefsToInspect !== 8) fail("source-fit decision summary source ref count must be 8");
if (JSON.stringify(families) !== JSON.stringify(["BEA", "BLS", "CFTC", "SEC"])) fail(`source-fit decision summary families changed: ${families.join(", ")}`);

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  summaryReady: true,
  summaryMode: "one_page_human_decision_summary_only",
  targetBatches: directCandidateDecisionWorksheet.targetBatches,
  realStatusPath,
  realStatusOverlayPresent,
  decisionRows,
  sourceRefsToInspect,
  families,
  allowedDecisionValues,
  requiredReviewerFields,
  confirmedDecisions: 0,
  downgradedDecisions: 0,
  blockedDecisions: 0,
  approvalReviewCandidates: 0,
  writeAllowedNow: false,
  manualDecisionRequired: true,
  humanAuthorizationRecorded: false,
  stopConditions: [
    "Stop if generated output confirms, downgrades, blocks, or approves any direct-candidate source role.",
    "Stop if BEA, BLS, CFTC, SEC, or public-domain material is used as chart-pattern proof, trading-signal proof, performance proof, broker/order workflow, automation, or real-money guidance.",
    "Stop if any source-fit note requires copied external source body text.",
    "Stop if yellow, red, or research_only sources are proposed for learner-facing evidence.",
    "Stop if any generated decision changes lesson grade, approvalStatus, learnerFacingRelease, commercial readiness, or productionReady.",
  ],
  sourceReports: paths,
  boundary: "This source-fit decision summary is a one-page reviewer aid for Batch 01 and Batch 05 direct-candidate rows only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  summaryReady: report.summaryReady,
  summaryMode: report.summaryMode,
  targetBatches: report.targetBatches,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  decisionRows: report.decisionRows.length,
  sourceRefsToInspect: report.sourceRefsToInspect,
  families: report.families,
  confirmedDecisions: report.confirmedDecisions,
  downgradedDecisions: report.downgradedDecisions,
  blockedDecisions: report.blockedDecisions,
  approvalReviewCandidates: report.approvalReviewCandidates,
  writeAllowedNow: report.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
