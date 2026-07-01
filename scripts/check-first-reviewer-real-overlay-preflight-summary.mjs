import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.json";
const outputMd = "docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  humanReviewStartChecklist: "docs/FIRST_REVIEWER_HUMAN_REVIEW_START_CHECKLIST.json",
  creationChecklist: "docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.json",
  directCandidateDecisionWorksheet: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.json",
  sourceFitNotesAcceptance: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.json",
  realOverlayDiffAudit: "docs/FIRST_REVIEWER_REAL_OVERLAY_DIFF_AUDIT.json",
  evidenceIntakeSummary: "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.json",
  launchReadinessDashboard: "docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.json",
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

function row(name, status, evidence, requiredBeforeWrite) {
  return { name, status, evidence, requiredBeforeWrite };
}

function markdown(report) {
  return [
    "# First Reviewer Real Overlay Preflight Summary",
    "",
    "This preflight summarizes the final gates before a human intentionally creates the real reviewer status overlay.",
    "It does not create the overlay, fill notes, approve lessons, publish content, or grant readiness.",
    "",
    "## Summary",
    "",
    `- Preflight ready: ${report.preflightReady}`,
    `- Write allowed now: ${report.writeAllowedNow}`,
    `- Manual decision required: ${report.manualDecisionRequired}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Start allowed now: ${report.startAllowedNow}`,
    `- Creation allowed now: ${report.creationAllowedNow}`,
    `- Blank note fields: ${report.blankNoteFields}`,
    `- Direct candidates unresolved: ${report.directCandidatesUnresolved}`,
    `- Confirmed direct decisions: ${report.confirmedDecisions}`,
    `- Complete note cards: ${report.completeNoteCards}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Internal trial ready: ${report.internalTrialReady}`,
    `- Launch ready: ${report.launchReady}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Preflight Rows",
    "",
    "| Gate | Status | Evidence | Required before write |",
    "| --- | --- | --- | --- |",
    ...report.preflightRows.map((item) => `| ${item.name} | ${item.status} | ${item.evidence.replaceAll("|", "/")} | ${item.requiredBeforeWrite.replaceAll("|", "/")} |`),
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
  humanReviewStartChecklist,
  creationChecklist,
  directCandidateDecisionWorksheet,
  sourceFitNotesAcceptance,
  realOverlayDiffAudit,
  evidenceIntakeSummary,
  launchReadinessDashboard,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.humanReviewStartChecklist),
  readJson(paths.creationChecklist),
  readJson(paths.directCandidateDecisionWorksheet),
  readJson(paths.sourceFitNotesAcceptance),
  readJson(paths.realOverlayDiffAudit),
  readJson(paths.evidenceIntakeSummary),
  readJson(paths.launchReadinessDashboard),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  humanReviewStartChecklist,
  creationChecklist,
  directCandidateDecisionWorksheet,
  sourceFitNotesAcceptance,
  realOverlayDiffAudit,
  evidenceIntakeSummary,
  launchReadinessDashboard,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; preflight currently expects no real overlay`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include real overlay preflight summary file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-preflight-summary")) fail("dry-run packet must include real overlay preflight summary command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include real overlay preflight summary file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-preflight-summary")) fail("progress dashboard must include real overlay preflight summary command");
if (!progressDashboard.statusBoard.some((item) => item.name === "Real overlay preflight summary" && item.status === "preflight_ready_write_blocked")) fail("progress dashboard must include preflight summary status");
if (!humanExecutionBundle.executionSteps.some((item) => item.file === outputMd)) fail("human execution bundle must point to preflight summary");

if (humanReviewStartChecklist.startAllowedNow !== false) fail("human review start checklist must keep startAllowedNow false in generated state");
if (creationChecklist.creationAllowedNow !== false || creationChecklist.realStatusOverlayPresent !== false) fail("creation checklist must keep creation blocked and overlay absent");
if (creationChecklist.dryRunPassed !== true || creationChecklist.overwriteProtectionPassed !== true) fail("creation checklist must show dry run and overwrite protection passing");
if (directCandidateDecisionWorksheet.confirmedDecisions !== 0 || directCandidateDecisionWorksheet.decisionRows.length !== 5) fail("direct candidate decision worksheet must remain blank with 5 rows");
if (sourceFitNotesAcceptance.positiveControlsPassed !== sourceFitNotesAcceptance.positiveControls || sourceFitNotesAcceptance.negativeCasesPassed !== sourceFitNotesAcceptance.negativeCases) fail("sourceFitNotes acceptance controls must pass");
if (sourceFitNotesAcceptance.confirmedDecisions !== 0) fail("sourceFitNotes acceptance must not confirm decisions in generated state");
if (realOverlayDiffAudit.realStatusOverlayPresent !== false || realOverlayDiffAudit.auditExecutableNow !== false) fail("real overlay diff audit must stay pre-write");
if (realOverlayDiffAudit.filledNoteFields !== 0 || realOverlayDiffAudit.blankNoteFields !== 72) fail("diff audit must keep 0 filled and 72 blank fields");
if (evidenceIntakeSummary.completeNoteCards !== 0 || evidenceIntakeSummary.readyForSeparateApprovalCandidates !== 0) fail("evidence intake must stay empty before real overlay");
if (launchReadinessDashboard.internalTrialReady !== false || launchReadinessDashboard.launchReady !== false) fail("launch readiness dashboard must keep trial and launch readiness false");

const preflightRows = [
  row("Human start decision", "manual_required", `${humanReviewStartChecklist.manualChecklistItems.length} manual boxes; startAllowedNow:${humanReviewStartChecklist.startAllowedNow}.`, "A human reviewer explicitly confirms identity, scope, blank notes, source-fit sequence, and write intent."),
  row("Dry run and overwrite protection", "machine_pass_manual_still_required", `dryRunPassed:${creationChecklist.dryRunPassed}; overwriteProtectionPassed:${creationChecklist.overwriteProtectionPassed}.`, "Run dry-run and protection checks immediately before any write command."),
  row("Blank note scaffold", "ready_blank_only", `${creationChecklist.lessonCards} lesson cards and ${creationChecklist.blankNoteFields} blank note fields.`, "Do not paste generated prompts or examples into the real overlay."),
  row("Direct candidate decisions", "blocked_until_human_decision", `${directCandidateDecisionWorksheet.decisionRows.length} decision rows; confirmed:${directCandidateDecisionWorksheet.confirmedDecisions}.`, "Resolve confirm, downgrade, or blocked decisions in real sourceFitNotes."),
  row("sourceFitNotes acceptance", "future_gate_ready", `${sourceFitNotesAcceptance.positiveControlsPassed}/${sourceFitNotesAcceptance.positiveControls} positive controls and ${sourceFitNotesAcceptance.negativeCasesPassed}/${sourceFitNotesAcceptance.negativeCases} negative cases passed.`, "Run after real sourceFitNotes exist; generated controls are not evidence."),
  row("Real overlay diff audit", "future_gate_ready_prewrite", `auditExecutableNow:${realOverlayDiffAudit.auditExecutableNow}; filled fields:${realOverlayDiffAudit.filledNoteFields}.`, "Run after write mode to inspect real filled fields, unsafe text, copying risk, and structure."),
  row("Evidence intake", "blocked_no_real_notes", `completeNoteCards:${evidenceIntakeSummary.completeNoteCards}; readyForSeparateApprovalCandidates:${evidenceIntakeSummary.readyForSeparateApprovalCandidates}.`, "Only run intake after completion, diff audit, note lint, and sourceFitNotes acceptance pass on real notes."),
  row("Launch readiness", "not_ready", `internalTrialReady:${launchReadinessDashboard.internalTrialReady}; launchReady:${launchReadinessDashboard.launchReady}.`, "Do not infer internal trial, release, commercial readiness, or production readiness from preflight."),
];

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  preflightReady: true,
  preflightMode: "manual_pre_write_summary_only",
  writeAllowedNow: false,
  manualDecisionRequired: true,
  realStatusPath,
  realStatusOverlayPresent,
  startAllowedNow: humanReviewStartChecklist.startAllowedNow,
  creationAllowedNow: creationChecklist.creationAllowedNow,
  blankNoteFields: creationChecklist.blankNoteFields,
  directCandidatesUnresolved: evidenceIntakeSummary.directCandidatesUnresolved,
  confirmedDecisions: directCandidateDecisionWorksheet.confirmedDecisions,
  completeNoteCards: evidenceIntakeSummary.completeNoteCards,
  approvalReviewCandidates: launchReadinessDashboard.approvalReviewCandidates,
  internalTrialReady: launchReadinessDashboard.internalTrialReady,
  launchReady: launchReadinessDashboard.launchReady,
  preflightRows,
  requiredCommandsBeforeWrite: [
    "npm.cmd run init:first-reviewer-status-overlay:dry-run",
    "npm.cmd run check:first-reviewer-status-init-protection",
    "npm.cmd run check:first-reviewer-real-overlay-preflight-summary",
  ],
  writeCommandAfterManualDecision: creationChecklist.allowedCreationCommand,
  requiredCommandsAfterWrite: [
    "npm.cmd run check:first-reviewer-real-overlay-diff-audit",
    "npm.cmd run check:reviewer-note-quality-lint",
    "npm.cmd run check:first-reviewer-source-fit-notes-acceptance",
    "npm.cmd run check:first-reviewer-evidence-intake-summary",
    "npm.cmd run check:first-reviewer-separate-approval-review-gate",
    "npm.cmd run check:curriculum-review",
  ],
  stopConditions: [
    "Stop if docs/LESSON_BATCH_REVIEW_STATUS.json already exists before write mode.",
    "Stop if no human reviewer has explicitly chosen to begin real note-taking.",
    "Stop if generated prompts, samples, or rehearsal text are copied into real notes.",
    "Stop if direct candidates are treated as confirmed without real sourceFitNotes.",
    "Stop if sourceFitNotes contain approval, release, production, trading, performance, broker/order, automation, real-money, or copied-source wording.",
    "Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.",
  ],
  sourceReports: paths,
  boundary: "This preflight summary is a manual pre-write operations gate only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  preflightReady: report.preflightReady,
  writeAllowedNow: report.writeAllowedNow,
  manualDecisionRequired: report.manualDecisionRequired,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  startAllowedNow: report.startAllowedNow,
  creationAllowedNow: report.creationAllowedNow,
  blankNoteFields: report.blankNoteFields,
  confirmedDecisions: report.confirmedDecisions,
  completeNoteCards: report.completeNoteCards,
  approvalReviewCandidates: report.approvalReviewCandidates,
  internalTrialReady: report.internalTrialReady,
  launchReady: report.launchReady,
  outputJson,
  outputMd,
}, null, 2));
