import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_ONE_PAGE_RUNBOOK.json";
const outputMd = "docs/FIRST_REVIEWER_ONE_PAGE_RUNBOOK.md";

const paths = {
  operatorIndex: "docs/FIRST_REVIEWER_OPERATOR_INDEX.json",
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  printableChecklistPack: "docs/FIRST_REVIEWER_PRINTABLE_CHECKLIST_PACK.json",
  sourceFitDecisionSummary: "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.json",
  sourceFitNotesCardPack: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.json",
  sourceFitNotesCardNegativeCases: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.json",
  sourceFitNotesPositiveMatrix: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.json",
  sourceFitNotesHumanFillPreflight: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.json",
  preflightSummary: "docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.json",
  realOverlayDryRunBundleAudit: "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.json",
  postWriteCommandPack: "docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.json",
  evidenceIntakeSummary: "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.json",
  separateApprovalGate: "docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.json",
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

function checklistItem(order, label, sourceFile, checkCommand, action, stopIf) {
  return { order, label, sourceFile, checkCommand, action, stopIf };
}

function markdown(report) {
  return [
    "# First Reviewer One-Page Runbook",
    "",
    "This runbook compresses the first-reviewer workflow into a printable operator page.",
    "It is not real review evidence, approval, learner-facing release, commercial readiness, or production readiness.",
    "",
    "## Status",
    "",
    `- Runbook ready: ${report.runbookReady}`,
    `- Runbook mode: ${report.runbookMode}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Write allowed now: ${report.writeAllowedNow}`,
    `- Post-write execution allowed now: ${report.executionAllowedNow}`,
    `- Lesson checklists: ${report.lessonChecklists}`,
    `- Required note fields: ${report.requiredNoteFields}`,
    `- Direct candidates to resolve: ${report.directCandidatesToResolve}`,
      `- Source-fit decision rows: ${report.sourceFitDecisionRows}`,
      `- SourceFitNotes cards: ${report.sourceFitNotesCards}`,
      `- SourceFitNotes card negative cases: ${report.sourceFitNotesCardNegativeCases}`,
      `- SourceFitNotes positive samples: ${report.sourceFitNotesPositiveSamples}`,
      `- SourceFitNotes human-fill preflight rows: ${report.sourceFitNotesHumanFillPreflightRows}`,
      `- Complete note cards: ${report.completeNoteCards}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Internal trial ready: ${report.internalTrialReady}`,
    `- Launch ready: ${report.launchReady}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Before You Start",
    "",
    ...report.beforeStartBoxes.map((box) => `- [ ] ${box}`),
    "",
    "## One-Page Sequence",
    "",
    ...report.runbookItems.map((item) => [
      `${item.order}. ${item.label}`,
      `   - File: \`${item.sourceFile}\``,
      `   - Check: \`${item.checkCommand}\``,
      `   - Do: ${item.action}`,
      `   - Stop if: ${item.stopIf}`,
    ].join("\n")),
    "",
    "## Hard Stops",
    "",
    ...report.hardStops.map((stop) => `- ${stop}`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const [
  operatorIndex,
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  printableChecklistPack,
  sourceFitDecisionSummary,
  sourceFitNotesCardPack,
  sourceFitNotesCardNegativeCases,
  sourceFitNotesPositiveMatrix,
  sourceFitNotesHumanFillPreflight,
  preflightSummary,
  realOverlayDryRunBundleAudit,
  postWriteCommandPack,
  evidenceIntakeSummary,
  separateApprovalGate,
  launchReadinessDashboard,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.operatorIndex),
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.printableChecklistPack),
  readJson(paths.sourceFitDecisionSummary),
  readJson(paths.sourceFitNotesCardPack),
  readJson(paths.sourceFitNotesCardNegativeCases),
  readJson(paths.sourceFitNotesPositiveMatrix),
  readJson(paths.sourceFitNotesHumanFillPreflight),
  readJson(paths.preflightSummary),
  readJson(paths.realOverlayDryRunBundleAudit),
  readJson(paths.postWriteCommandPack),
  readJson(paths.evidenceIntakeSummary),
  readJson(paths.separateApprovalGate),
  readJson(paths.launchReadinessDashboard),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  operatorIndex,
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  printableChecklistPack,
  sourceFitDecisionSummary,
  sourceFitNotesCardPack,
  sourceFitNotesCardNegativeCases,
  sourceFitNotesPositiveMatrix,
  sourceFitNotesHumanFillPreflight,
  preflightSummary,
  realOverlayDryRunBundleAudit,
  postWriteCommandPack,
  evidenceIntakeSummary,
  separateApprovalGate,
  launchReadinessDashboard,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; one-page runbook currently expects pre-write state`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include one-page runbook file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-one-page-runbook")) fail("dry-run packet must include one-page runbook command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include one-page runbook file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-one-page-runbook")) fail("progress dashboard must include one-page runbook command");
if (!progressDashboard.statusBoard.some((row) => row.name === "One-page runbook" && row.status === "printable_operator_runbook_ready")) fail("progress dashboard must include one-page runbook status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to one-page runbook");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === outputMd)) fail("operator index must point to one-page runbook");
if (!operatorIndex.criticalCommands.includes("npm.cmd run check:first-reviewer-one-page-runbook")) fail("operator index must include one-page runbook command");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md")) fail("operator index must point to dry-run bundle audit");
if (!operatorIndex.criticalCommands.includes("npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit")) fail("operator index must include dry-run bundle audit command");

if (operatorIndex.operatorMode !== "single_entrypoint_pre_write_only") fail("operator index must stay pre-write only");
if (preflightSummary.writeAllowedNow !== false || preflightSummary.manualDecisionRequired !== true) fail("preflight must keep write blocked until explicit human decision");
if (realOverlayDryRunBundleAudit.auditReady !== true || realOverlayDryRunBundleAudit.writeAllowedNow !== false) fail("dry-run bundle audit must stay ready and write-blocked");
if (postWriteCommandPack.executionAllowedNow !== false) fail("post-write command pack must remain future-only");
if (printableChecklistPack.lessonChecklists !== 12 || printableChecklistPack.noteFieldCheckboxes !== 72) fail("printable checklist pack must keep 12 lesson cards and 72 note fields");
if (printableChecklistPack.directCandidatesToConfirm !== 5) fail("printable checklist pack must keep 5 direct candidates visible");
if (sourceFitDecisionSummary.summaryReady !== true || sourceFitDecisionSummary.decisionRows.length !== 5 || sourceFitDecisionSummary.confirmedDecisions !== 0 || sourceFitDecisionSummary.writeAllowedNow !== false) fail("source-fit decision summary must stay ready, blank, and write-blocked");
if (sourceFitNotesCardPack.cardPackReady !== true || sourceFitNotesCardPack.blankCards !== 5 || sourceFitNotesCardPack.filledFields !== 0) fail("sourceFitNotes card pack must keep 5 blank cards and 0 filled fields");
if (sourceFitNotesCardNegativeCases.negativeCasesReady !== true || sourceFitNotesCardNegativeCases.failedCases !== 0) fail("sourceFitNotes card negative cases must pass all simulated misuse guards");
if (sourceFitNotesPositiveMatrix.matrixReady !== true || sourceFitNotesPositiveMatrix.sampleOnly !== true || sourceFitNotesPositiveMatrix.failedSamples !== 0) fail("sourceFitNotes positive matrix must stay sample-only and passing");
if (sourceFitNotesHumanFillPreflight.preflightReady !== true || sourceFitNotesHumanFillPreflight.humanFillAllowedNow !== false || sourceFitNotesHumanFillPreflight.directCandidates !== 5) fail("sourceFitNotes human-fill preflight must stay ready, manual-blocked, and cover 5 candidates");
if (evidenceIntakeSummary.completeNoteCards !== 0 || evidenceIntakeSummary.readyForSeparateApprovalCandidates !== 0) fail("evidence intake must stay empty before real notes");
if (separateApprovalGate.approvalReviewCandidates !== 0 || separateApprovalGate.autoApprovedLessons !== 0) fail("separate approval gate must stay empty before real notes");
if (launchReadinessDashboard.internalTrialReady !== false || launchReadinessDashboard.launchReady !== false) fail("launch readiness must remain false");

const runbookItems = [
  checklistItem(1, "Open operator index", "docs/FIRST_REVIEWER_OPERATOR_INDEX.md", "npm.cmd run check:first-reviewer-operator-index", "Confirm this is the active entrypoint and all readiness flags remain false.", "Any readiness, release, approval, or production flag turns true."),
  checklistItem(2, "Read the one-page execution order", "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.md", "npm.cmd run check:first-reviewer-human-execution-bundle", "Use the bundle to confirm the longer file order after this page.", "The bundle stops being pre_write_manual_review_index."),
  checklistItem(3, "Use the printable lesson pack", "docs/FIRST_REVIEWER_PRINTABLE_CHECKLIST_PACK.md", "npm.cmd run check:first-reviewer-printable-checklist-pack", "Work through 12 lesson cards, 72 note fields, and 5 direct candidates on paper or manually.", "Any note field is prefilled by generated scaffolding."),
  checklistItem(4, "Resolve direct candidates", "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.md", "npm.cmd run check:first-reviewer-direct-candidate-decision-worksheet", "Choose confirm after review, downgrade, or block for every direct-candidate source role.", "A generated row is treated as confirmed source evidence."),
  checklistItem(5, "Read source-fit summary", "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md", "npm.cmd run check:first-reviewer-source-fit-decision-summary", "Compare confirm, downgrade, and block criteria before any future sourceFitNotes are written.", "The summary is treated as a decision, confirmation, approval, or write authorization."),
  checklistItem(6, "Use blank sourceFitNotes cards", "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md", "npm.cmd run check:first-reviewer-source-fit-notes-card-pack", "Prepare the 5 blank cards and leave all 35 required fields empty until real review.", "Any card field is prefilled or treated as a real note."),
  checklistItem(7, "Check card misuse guards", "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md", "npm.cmd run check:first-reviewer-source-fit-notes-card-negative-cases", "Confirm simulated card prefill, unsafe wording, source misuse, and yellow/red drift are rejected.", "A polluted card state is treated as a valid note or source confirmation."),
  checklistItem(8, "Read positive note shapes", "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md", "npm.cmd run check:first-reviewer-source-fit-notes-positive-matrix", "Use sample-only confirm, downgrade, and block note shapes as writing guidance.", "Sample text is copied as real reviewer evidence or treated as source confirmation."),
  checklistItem(9, "Run sourceFitNotes fill preflight", "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md", "npm.cmd run check:first-reviewer-source-fit-notes-human-fill-preflight", "Check reviewer identity, 5 candidate decisions, source identity basis, and no-copy requirements before real note entry.", "Preflight output is treated as write permission or real source confirmation."),
  checklistItem(10, "Check note wording before write", "docs/FIRST_REVIEWER_SAFE_NOTE_EXAMPLES.md", "npm.cmd run check:first-reviewer-safe-note-examples", "Use examples only for safe shape; write original notes only after real review.", "Examples, prompts, or source body text are copied into notes."),
  checklistItem(11, "Run preflight before any overlay write", "docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.md", "npm.cmd run check:first-reviewer-real-overlay-preflight-summary", "Confirm writeAllowedNow remains false until explicit human note-taking starts.", "The real overlay appears without deliberate human start."),
  checklistItem(12, "Audit dry-run bundle consistency", "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md", "npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit", "Confirm dry-run, overwrite protection, day-zero handoff, final rehearsal, and write locks still agree.", "The audit grants write permission or finds command-order drift."),
  checklistItem(10, "After future write, run command pack", "docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.md", "npm.cmd run check:first-reviewer-post-write-command-pack", "Use the strict post-write command order only after a human-created overlay exists.", "Execution is treated as proof while the overlay is absent."),
  checklistItem(11, "Intake complete notes only", "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.md", "npm.cmd run check:first-reviewer-evidence-intake-summary", "Use intake as triage after real notes pass lint and completion.", "Incomplete notes become approval candidates."),
  checklistItem(12, "Keep separate approval separate", "docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.md", "npm.cmd run check:first-reviewer-separate-approval-review-gate", "Send only complete intake candidates to a later separate human approval review.", "Any auto-approval, release, grade promotion, or production claim appears."),
  checklistItem(13, "Read launch blockers", "docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.md", "npm.cmd run check:first-reviewer-launch-readiness-dashboard", "Treat the dashboard as a blocker map, not readiness.", "internalTrialReady, launchReady, or productionReady becomes true."),
];

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  runbookReady: true,
  runbookMode: "printable_pre_write_operator_runbook",
  realStatusPath,
  realStatusOverlayPresent,
  writeAllowedNow: preflightSummary.writeAllowedNow,
  executionAllowedNow: postWriteCommandPack.executionAllowedNow,
  lessonChecklists: printableChecklistPack.lessonChecklists,
  requiredNoteFields: printableChecklistPack.noteFieldCheckboxes,
  directCandidatesToResolve: printableChecklistPack.directCandidatesToConfirm,
    sourceFitDecisionRows: sourceFitDecisionSummary.decisionRows.length,
    sourceFitNotesCards: sourceFitNotesCardPack.blankCards,
    sourceFitNotesCardNegativeCases: sourceFitNotesCardNegativeCases.negativeCases,
    sourceFitNotesPositiveSamples: sourceFitNotesPositiveMatrix.decisionSamples,
    sourceFitNotesHumanFillPreflightRows: sourceFitNotesHumanFillPreflight.directCandidates,
  completeNoteCards: evidenceIntakeSummary.completeNoteCards,
  approvalReviewCandidates: separateApprovalGate.approvalReviewCandidates,
  internalTrialReady: launchReadinessDashboard.internalTrialReady,
  launchReady: launchReadinessDashboard.launchReady,
  beforeStartBoxes: [
    "I am using this as reviewer-facing scaffolding, not final course material.",
    "I have not created or overwritten docs/LESSON_BATCH_REVIEW_STATUS.json.",
    "I will keep all generated prompts, examples, and source excerpts out of real notes unless actual human review supports original wording.",
    "I will keep every lesson structural_draft until separate human rewrite and factual review are complete.",
  ],
  runbookItems,
  hardStops: [
    "Stop if any artifact claims approval, learner-facing release, commercial readiness, internal-trial readiness, launch readiness, or production readiness.",
    "Stop if any note contains buy/sell/hold advice, trading signals, performance claims, broker/order workflow, automation, copied source prose, or real-money guidance.",
    "Stop if any yellow, red, or research_only source is proposed as learner-facing evidence.",
    "Stop if real reviewer notes are created by generated scaffolding rather than deliberate human review.",
  ],
  sourceReports: paths,
  boundary: "This one-page runbook is reviewer-facing manual scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  runbookReady: report.runbookReady,
  runbookMode: report.runbookMode,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  writeAllowedNow: report.writeAllowedNow,
  executionAllowedNow: report.executionAllowedNow,
  lessonChecklists: report.lessonChecklists,
  requiredNoteFields: report.requiredNoteFields,
  directCandidatesToResolve: report.directCandidatesToResolve,
  sourceFitDecisionRows: report.sourceFitDecisionRows,
  sourceFitNotesCards: report.sourceFitNotesCards,
  completeNoteCards: report.completeNoteCards,
  approvalReviewCandidates: report.approvalReviewCandidates,
  internalTrialReady: report.internalTrialReady,
  launchReady: report.launchReady,
  outputJson,
  outputMd,
}, null, 2));
