import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_OPERATOR_INDEX.json";
const outputMd = "docs/FIRST_REVIEWER_OPERATOR_INDEX.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  directCandidateWorksheet: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.json",
  sourceFitDecisionSummary: "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.json",
  sourceFitNotesCardPack: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.json",
  sourceFitNotesCardNegativeCases: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.json",
  sourceFitNotesPositiveMatrix: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.json",
  sourceFitNotesHumanFillPreflight: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.json",
  sourceFitNotesAcceptance: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.json",
  preflightSummary: "docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.json",
  postWriteCommandPack: "docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.json",
  evidenceIntakeSummary: "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.json",
  separateApprovalGate: "docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.json",
  launchReadinessDashboard: "docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.json",
  runbookNegativeCases: "docs/FIRST_REVIEWER_RUNBOOK_NEGATIVE_CASES.json",
  filledNotesPositiveControlV2: "docs/FIRST_REVIEWER_FILLED_NOTES_POSITIVE_CONTROL_V2.json",
  postWriteApprovalDrill: "docs/FIRST_REVIEWER_POST_WRITE_APPROVAL_DRILL.json",
  directCandidatePostWriteDrill: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_POST_WRITE_DRILL.json",
  postWriteValidationSimulator: "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_SIMULATOR.json",
  realOverlayWriteReadinessLock: "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.json",
  realOverlayDryRunBundleAudit: "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.json",
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

function phase(order, name, status, primaryFile, command, nextAction, blocker) {
  return { order, name, status, primaryFile, command, nextAction, blocker };
}

function normalizeOrders(rows) {
  return rows.map((row, index) => ({ ...row, order: index + 1 }));
}

function markdown(report) {
  return [
    "# First Reviewer Operator Index",
    "",
    "This is the single operator entrypoint for first-reviewer work.",
    "It connects the pre-write handoff, manual decision worksheets, post-write validation, evidence intake, separate approval gate, and launch-readiness blockers.",
    "It does not create reviewer notes, approve lessons, publish learner-facing content, promote lesson grades, or certify production readiness.",
    "",
    "## Summary",
    "",
    `- Operator index ready: ${report.operatorIndexReady}`,
    `- Operator mode: ${report.operatorMode}`,
    `- Write allowed now: ${report.writeAllowedNow}`,
    `- Post-write execution allowed now: ${report.executionAllowedNow}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Complete note cards: ${report.completeNoteCards}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Confirmed direct decisions: ${report.confirmedDecisions}`,
    `- Internal trial ready: ${report.internalTrialReady}`,
    `- Launch ready: ${report.launchReady}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Phase Map",
    "",
    "| Order | Phase | Status | Primary file | Command | Next action | Blocker |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...report.phaseRows.map((row) => `| ${row.order} | ${row.name} | ${row.status} | \`${row.primaryFile}\` | \`${row.command}\` | ${row.nextAction.replaceAll("|", "/")} | ${row.blocker.replaceAll("|", "/")} |`),
    "",
    "## Single Entrypoint Rules",
    "",
    ...report.singleEntrypointRules.map((rule) => `- ${rule}`),
    "",
    "## Critical Commands",
    "",
    ...report.criticalCommands.map((command, index) => `${index + 1}. \`${command}\``),
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
  directCandidateWorksheet,
  sourceFitDecisionSummary,
  sourceFitNotesCardPack,
  sourceFitNotesCardNegativeCases,
  sourceFitNotesPositiveMatrix,
  sourceFitNotesHumanFillPreflight,
  sourceFitNotesAcceptance,
  preflightSummary,
  postWriteCommandPack,
  evidenceIntakeSummary,
  separateApprovalGate,
  launchReadinessDashboard,
  postWriteValidationSimulator,
  realOverlayDryRunBundleAudit,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.directCandidateWorksheet),
  readJson(paths.sourceFitDecisionSummary),
  readJson(paths.sourceFitNotesCardPack),
  readJson(paths.sourceFitNotesCardNegativeCases),
  readJson(paths.sourceFitNotesPositiveMatrix),
  readJson(paths.sourceFitNotesHumanFillPreflight),
  readJson(paths.sourceFitNotesAcceptance),
  readJson(paths.preflightSummary),
  readJson(paths.postWriteCommandPack),
  readJson(paths.evidenceIntakeSummary),
  readJson(paths.separateApprovalGate),
  readJson(paths.launchReadinessDashboard),
  readJson(paths.postWriteValidationSimulator),
  readJson(paths.realOverlayDryRunBundleAudit),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  directCandidateWorksheet,
  sourceFitDecisionSummary,
  sourceFitNotesCardPack,
  sourceFitNotesCardNegativeCases,
  sourceFitNotesPositiveMatrix,
  sourceFitNotesHumanFillPreflight,
  sourceFitNotesAcceptance,
  preflightSummary,
  postWriteCommandPack,
  evidenceIntakeSummary,
  separateApprovalGate,
  launchReadinessDashboard,
  postWriteValidationSimulator,
  realOverlayDryRunBundleAudit,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; operator index currently expects pre-write state`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include operator index file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-operator-index")) fail("dry-run packet must include operator index command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include operator index file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-operator-index")) fail("progress dashboard must include operator index command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Operator index" && row.status === "single_entrypoint_ready_pre_write_only")) fail("progress dashboard must include operator index status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to operator index");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_FILLED_NOTES_POSITIVE_CONTROL_V2.md")) fail("dry-run packet must include filled-notes positive control v2 file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-filled-notes-positive-control-v2")) fail("dry-run packet must include filled-notes positive control v2 command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Filled-notes positive control v2" && row.status === "temporary_candidate_flow_control_ready")) fail("progress dashboard must include filled-notes positive control v2 status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === "docs/FIRST_REVIEWER_FILLED_NOTES_POSITIVE_CONTROL_V2.md")) fail("human execution bundle must point to filled-notes positive control v2");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_POST_WRITE_APPROVAL_DRILL.md")) fail("dry-run packet must include post-write approval drill file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-post-write-approval-drill")) fail("dry-run packet must include post-write approval drill command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Post-write approval drill" && row.status === "temporary_release_blocker_drill_ready")) fail("progress dashboard must include post-write approval drill status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === "docs/FIRST_REVIEWER_POST_WRITE_APPROVAL_DRILL.md")) fail("human execution bundle must point to post-write approval drill");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_POST_WRITE_DRILL.md")) fail("dry-run packet must include direct-candidate post-write drill file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-direct-candidate-post-write-drill")) fail("dry-run packet must include direct-candidate post-write drill command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Direct-candidate post-write drill" && row.status === "temporary_source_fit_boundary_drill_ready")) fail("progress dashboard must include direct-candidate post-write drill status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_POST_WRITE_DRILL.md")) fail("human execution bundle must point to direct-candidate post-write drill");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_SIMULATOR.md")) fail("dry-run packet must include post-write validation simulator file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-post-write-validation-simulator")) fail("dry-run packet must include post-write validation simulator command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Post-write validation simulator" && row.status === "temporary_post_write_sequence_simulator_ready")) fail("progress dashboard must include post-write validation simulator status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_SIMULATOR.md")) fail("human execution bundle must point to post-write validation simulator");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_SEQUENCE_CONSISTENCY.md")) fail("dry-run packet must include sequence consistency file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-sequence-consistency")) fail("dry-run packet must include sequence consistency command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Sequence consistency gate" && row.status === "pre_write_order_integrity_ready")) fail("progress dashboard must include sequence consistency status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === "docs/FIRST_REVIEWER_SEQUENCE_CONSISTENCY.md")) fail("human execution bundle must point to sequence consistency gate");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_DAY_OF_REVIEW_PACKET_FREEZE.md")) fail("dry-run packet must include day-of-review packet freeze file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-day-of-review-packet-freeze")) fail("dry-run packet must include day-of-review packet freeze command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Day-of-review packet freeze" && row.status === "frozen_pre_write_packet_ready")) fail("progress dashboard must include day-of-review packet freeze status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === "docs/FIRST_REVIEWER_DAY_OF_REVIEW_PACKET_FREEZE.md")) fail("human execution bundle must point to day-of-review packet freeze");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.md")) fail("dry-run packet must include real overlay write readiness lock file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock")) fail("dry-run packet must include real overlay write readiness lock command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Real overlay write readiness lock" && row.status === "write_locked_manual_decision_required")) fail("progress dashboard must include real overlay write readiness lock status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.md")) fail("human execution bundle must point to real overlay write readiness lock");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.md")) fail("dry-run packet must include real overlay write authorization preview file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview")) fail("dry-run packet must include real overlay write authorization preview command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Real overlay write authorization preview" && row.status === "authorization_preview_ready_manual_required")) fail("progress dashboard must include real overlay write authorization preview status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.md")) fail("human execution bundle must point to real overlay write authorization preview");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.md")) fail("dry-run packet must include day-zero write handoff file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-day-zero-write-handoff")) fail("dry-run packet must include day-zero write handoff command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Day-zero write handoff" && row.status === "day_zero_handoff_ready_write_blocked")) fail("progress dashboard must include day-zero write handoff status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === "docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.md")) fail("human execution bundle must point to day-zero write handoff");

if (preflightSummary.writeAllowedNow !== false || preflightSummary.manualDecisionRequired !== true) fail("preflight must keep write blocked until a human decision");
if (postWriteCommandPack.executionAllowedNow !== false || postWriteCommandPack.realStatusOverlayPresent !== false) fail("post-write command pack must remain future-only before overlay exists");
if (evidenceIntakeSummary.completeNoteCards !== 0 || evidenceIntakeSummary.readyForSeparateApprovalCandidates !== 0) fail("evidence intake must stay empty before real notes");
if (separateApprovalGate.approvalReviewCandidates !== 0 || separateApprovalGate.autoApprovedLessons !== 0) fail("separate approval gate cannot create candidates or approvals before real notes");
if (separateApprovalGate.learnerFacingReleaseCandidates !== 0 || separateApprovalGate.commercialReadyPromotions !== 0 || separateApprovalGate.productionReadyClaims !== 0) fail("separate approval gate cannot create release, grade, or production claims");
if (sourceFitDecisionSummary.decisionRows.length !== 5 || sourceFitDecisionSummary.confirmedDecisions !== 0 || sourceFitDecisionSummary.writeAllowedNow !== false) fail("source-fit decision summary must keep 5 blank, write-blocked decisions");
if (sourceFitNotesCardPack.blankCards !== 5 || sourceFitNotesCardPack.filledFields !== 0 || sourceFitNotesCardPack.writeAllowedNow !== false) fail("sourceFitNotes card pack must keep 5 blank, write-blocked cards");
if (sourceFitNotesCardNegativeCases.negativeCasesReady !== true || sourceFitNotesCardNegativeCases.failedCases !== 0 || sourceFitNotesCardNegativeCases.passedCases !== sourceFitNotesCardNegativeCases.negativeCases || sourceFitNotesCardNegativeCases.writeAllowedNow !== false) fail("sourceFitNotes card negative cases must reject all simulated misuse and stay write-blocked");
if (sourceFitNotesPositiveMatrix.matrixReady !== true || sourceFitNotesPositiveMatrix.sampleOnly !== true || sourceFitNotesPositiveMatrix.failedSamples !== 0 || sourceFitNotesPositiveMatrix.confirmedDecisions !== 0 || sourceFitNotesPositiveMatrix.writeAllowedNow !== false) fail("sourceFitNotes positive matrix must stay sample-only and write-blocked");
if (sourceFitNotesHumanFillPreflight.preflightReady !== true || sourceFitNotesHumanFillPreflight.humanFillAllowedNow !== false || sourceFitNotesHumanFillPreflight.directCandidates !== 5 || sourceFitNotesHumanFillPreflight.confirmedDecisions !== 0 || sourceFitNotesHumanFillPreflight.writeAllowedNow !== false) fail("sourceFitNotes human-fill preflight must stay manual-blocked with 5 unresolved candidates");
if (sourceFitNotesAcceptance.confirmedDecisions !== 0) fail("sourceFitNotes acceptance cannot confirm direct decisions without real notes");
if (launchReadinessDashboard.internalTrialReady !== false || launchReadinessDashboard.launchReady !== false) fail("launch readiness dashboard must remain not ready");
if (directCandidateWorksheet.realStatusOverlayPresent !== false) fail("direct candidate worksheet must stay pre-write");
if (postWriteValidationSimulator.simulatorReady !== true || postWriteValidationSimulator.realStatusOverlayTouched !== false) fail("post-write validation simulator must pass without touching real overlay");
if (realOverlayDryRunBundleAudit.auditReady !== true || realOverlayDryRunBundleAudit.auditMode !== "real_overlay_dry_run_bundle_sanity_pre_write_only") fail("dry-run bundle audit must stay ready and pre-write only");
if (realOverlayDryRunBundleAudit.writeAllowedNow !== false || realOverlayDryRunBundleAudit.humanAuthorizationRecorded !== false) fail("dry-run bundle audit cannot authorize write mode");

const phaseRows = normalizeOrders([
  phase(1, "Operator entrypoint", "single_entrypoint_ready_pre_write_only", outputMd, "npm.cmd run check:first-reviewer-operator-index", "Start here before opening other first-reviewer files.", "None; this index is an orientation map only."),
  phase(2, "One-page runbook", "printable_operator_runbook_ready", "docs/FIRST_REVIEWER_ONE_PAGE_RUNBOOK.md", "npm.cmd run check:first-reviewer-one-page-runbook", "Use the printable runbook as the day-of-review sequence and hard-stop checklist.", "Runbook is not real notes, approval, release, or write permission."),
  phase(3, "Runbook misuse guard", "runbook_misuse_guard_ready", "docs/FIRST_REVIEWER_RUNBOOK_NEGATIVE_CASES.md", "npm.cmd run check:first-reviewer-runbook-negative-cases", "Keep misuse negative cases passing before using the runbook.", "Runbook cannot become notes, approval, release, grade promotion, launch readiness, or production readiness."),
  phase(4, "Pre-write sample dossier", "read_only_human_handoff_ready", "docs/FIRST_REVIEWER_PREWRITE_SAMPLE_DOSSIER.md", "npm.cmd run check:first-reviewer-prewrite-sample-dossier", "Use as a read-only handoff packet for the first 12 lesson cards and gate sequence.", "Dossier cannot create notes, approvals, release candidates, or readiness claims."),
  phase(5, "Filled-notes positive control v2", "temporary_candidate_flow_control_ready", "docs/FIRST_REVIEWER_FILLED_NOTES_POSITIVE_CONTROL_V2.md", "npm.cmd run check:first-reviewer-filled-notes-positive-control-v2", "Use the temporary-file control to prove completed notes become candidate-only rows.", "Positive control is not real notes, approval, release, grade promotion, or readiness."),
  phase(6, "Post-write approval drill", "temporary_release_blocker_drill_ready", "docs/FIRST_REVIEWER_POST_WRITE_APPROVAL_DRILL.md", "npm.cmd run check:first-reviewer-post-write-approval-drill", "Use the temporary drill to prove approval-review candidates stay blocked from release, launch, grade promotion, and production readiness.", "Drill is not real notes, approval, release, grade promotion, launch readiness, or production readiness."),
  phase(7, "Direct-candidate post-write drill", "temporary_source_fit_boundary_drill_ready", "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_POST_WRITE_DRILL.md", "npm.cmd run check:first-reviewer-direct-candidate-post-write-drill", "Use the temporary drill to validate sourceFitNotes boundaries for BEA, BLS, CFTC, and SEC candidate rows.", "Drill is not real source confirmation, approval, release, grade promotion, launch readiness, or production readiness."),
  phase(8, "Post-write validation simulator", "temporary_post_write_sequence_simulator_ready", "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_SIMULATOR.md", "npm.cmd run check:first-reviewer-post-write-validation-simulator", "Use the temporary simulator to rehearse completion, evidence intake, separate approval, and release-drift guards.", "Simulator is not real reviewer evidence, approval, release, grade promotion, launch readiness, or production readiness."),
  phase(9, "Sequence consistency gate", "pre_write_order_integrity_ready", "docs/FIRST_REVIEWER_SEQUENCE_CONSISTENCY.md", "npm.cmd run check:first-reviewer-sequence-consistency", "Use the sequence gate to confirm first-reviewer execution steps, operator phases, command rows, and packet order remain contiguous.", "Sequence gate is not real reviewer evidence, approval, release, grade promotion, launch readiness, or production readiness."),
  phase(10, "Day-of-review packet freeze", "frozen_pre_write_packet_ready", "docs/FIRST_REVIEWER_DAY_OF_REVIEW_PACKET_FREEZE.md", "npm.cmd run check:first-reviewer-day-of-review-packet-freeze", "Use the frozen packet to confirm every first-reviewer step has explicit input, expected output, failure route, and forbidden actions.", "Freeze packet is not real reviewer evidence, approval, release, grade promotion, launch readiness, or production readiness."),
  phase(8, "Orient and scope", "ready", "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.md", "npm.cmd run check:first-reviewer-human-execution-bundle", "Use the bundle for the human reviewer execution order.", "Bundle is not approval, release, or write permission."),
  phase(9, "Dry-run packet", "ready", "docs/FIRST_REVIEWER_DRY_RUN_PACKET.md", "npm.cmd run check:first-reviewer-dry-run-packet", "Review file and command order before real note-taking.", "Dry-run output is not real review evidence."),
  phase(10, "Source fit and direct candidates", "blocked_until_human_decision", "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.md", "npm.cmd run check:first-reviewer-direct-candidate-decision-worksheet", "Confirm, downgrade, or block each direct-candidate source role.", "Generated rows cannot confirm direct evidence."),
  phase(10.5, "Source-fit decision summary", "one_page_summary_ready_no_decisions", "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md", "npm.cmd run check:first-reviewer-source-fit-decision-summary", "Compare confirm, downgrade, and block criteria before sourceFitNotes are written.", "Summary cannot choose the decision or confirm direct evidence."),
  phase(10.75, "SourceFitNotes card pack", "blank_printable_cards_ready", "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md", "npm.cmd run check:first-reviewer-source-fit-notes-card-pack", "Use blank cards for future direct-candidate sourceFitNotes.", "Cards cannot be treated as filled notes, source confirmation, or approval."),
  phase(10.875, "SourceFitNotes card misuse guard", "card_misuse_guard_ready", "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md", "npm.cmd run check:first-reviewer-source-fit-notes-card-negative-cases", "Prove simulated card pollution is rejected before future sourceFitNotes.", "Negative cases are not real notes, source confirmation, approval, or write permission."),
  phase(10.9375, "SourceFitNotes positive matrix", "sample_only_positive_shapes_ready", "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md", "npm.cmd run check:first-reviewer-source-fit-notes-positive-matrix", "Use sample-only confirm, downgrade, and block note shapes before future sourceFitNotes.", "Samples cannot be copied as real notes or treated as source confirmation."),
  phase(10.96875, "SourceFitNotes human-fill preflight", "manual_fill_preflight_ready_write_blocked", "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md", "npm.cmd run check:first-reviewer-source-fit-notes-human-fill-preflight", "Check reviewer identity, candidate decisions, source identity basis, and no-copy requirements before real note entry.", "Preflight cannot choose decisions, fill notes, or grant write permission."),
  phase(11, "Blank notes and safe examples", "ready_blank_only", "docs/FIRST_REVIEWER_HUMAN_NOTE_STARTER_TEMPLATE.md", "npm.cmd run check:first-reviewer-human-note-starter-template", "Use blank fields and examples as reviewer scaffolding only.", "Examples and prompts cannot be copied as real notes."),
  phase(12, "Manual start gate", "manual_required", "docs/FIRST_REVIEWER_HUMAN_REVIEW_START_CHECKLIST.md", "npm.cmd run check:first-reviewer-human-review-start-checklist", "A human reviewer must intentionally decide to begin real note-taking.", "Generated state keeps start blocked."),
  phase(13, "Real overlay preflight", "write_blocked_manual_required", "docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.md", "npm.cmd run check:first-reviewer-real-overlay-preflight-summary", "Run before any explicit write initializer.", "writeAllowedNow:false until explicit human decision."),
  phase(14, "Write readiness lock", "write_locked_manual_decision_required", "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.md", "npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock", "Use as the final generated hard stop before any real overlay write command.", "Lock cannot replace explicit human note-taking intent."),
  phase(15, "Write authorization preview", "authorization_preview_ready_manual_required", "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.md", "npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview", "Use as the generated preview that separates machine-checked gates from the still-missing human write authorization.", "Preview keeps writeAllowedNow:false and cannot authorize or create the real overlay."),
  phase(16, "Day-zero write handoff", "day_zero_handoff_ready_write_blocked", "docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.md", "npm.cmd run check:first-reviewer-day-zero-write-handoff", "Use as the one-page day-zero route for pre-write checks, human authorization blockers, write-command preview, and future post-write validation order.", "Handoff keeps writeAllowedNow:false and cannot authorize or create the real overlay."),
  phase(17, "Dry-run bundle audit", "dry_run_bundle_audit_ready_pre_write_only", "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md", "npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit", "Use as the consistency audit tying dry-run, overwrite protection, day-zero handoff, final rehearsal, and write locks together before any future real overlay write.", "Audit keeps writeAllowedNow:false and cannot authorize or create the real overlay."),
  phase(18, "Post-write validation", "future_only_overlay_absent", "docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.md", "npm.cmd run check:first-reviewer-post-write-command-pack", "Use only after a human-created real overlay exists.", "executionAllowedNow:false and overlay absent."),
  phase(16, "Evidence intake", "blocked_no_real_notes", "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.md", "npm.cmd run check:first-reviewer-evidence-intake-summary", "Summarize real note completeness after post-write checks pass.", "No complete note cards exist."),
  phase(17, "Separate approval", "blocked_no_candidates", "docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.md", "npm.cmd run check:first-reviewer-separate-approval-review-gate", "Keep completed notes behind a separate human approval review.", "No approval-review candidates exist."),
  phase(18, "Launch readiness", "not_ready_non_production", "docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.md", "npm.cmd run check:first-reviewer-launch-readiness-dashboard", "Use as a blocker dashboard only.", "internalTrialReady:false, launchReady:false, productionReady:false."),
]);

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  operatorIndexReady: true,
  operatorMode: "single_entrypoint_pre_write_only",
  realStatusPath,
  realStatusOverlayPresent,
  writeAllowedNow: preflightSummary.writeAllowedNow,
  executionAllowedNow: postWriteCommandPack.executionAllowedNow,
  internalTrialReady: launchReadinessDashboard.internalTrialReady,
  launchReady: launchReadinessDashboard.launchReady,
  completeNoteCards: evidenceIntakeSummary.completeNoteCards,
  approvalReviewCandidates: separateApprovalGate.approvalReviewCandidates,
  confirmedDecisions: sourceFitNotesAcceptance.confirmedDecisions,
  phaseRows,
  singleEntrypointRules: [
    "Start from this operator index before any other first-reviewer document.",
    "Do not create or write the real overlay unless preflight passes and a human reviewer explicitly decides to begin note-taking.",
    "Use the post-write command pack only after docs/LESSON_BATCH_REVIEW_STATUS.json exists from a deliberate human-review workflow.",
    "Evidence intake is triage only; separate approval review is still required.",
    "This index cannot approve lessons, release learner-facing content, promote grades, grant internal-trial readiness, or change productionReady.",
  ],
  criticalCommands: [
    "npm.cmd run check:first-reviewer-operator-index",
    "npm.cmd run check:first-reviewer-one-page-runbook",
    "npm.cmd run check:first-reviewer-runbook-negative-cases",
    "npm.cmd run check:first-reviewer-prewrite-sample-dossier",
    "npm.cmd run check:first-reviewer-filled-notes-positive-control-v2",
    "npm.cmd run check:first-reviewer-post-write-approval-drill",
    "npm.cmd run check:first-reviewer-direct-candidate-post-write-drill",
    "npm.cmd run check:first-reviewer-post-write-validation-simulator",
    "npm.cmd run check:first-reviewer-sequence-consistency",
    "npm.cmd run check:first-reviewer-day-of-review-packet-freeze",
    "npm.cmd run check:first-reviewer-real-overlay-preflight-summary",
    "npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock",
    "npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview",
    "npm.cmd run check:first-reviewer-day-zero-write-handoff",
    "npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit",
    "npm.cmd run check:first-reviewer-post-write-command-pack",
    "npm.cmd run check:curriculum-review",
  ],
  stopConditions: [
    "Stop if docs/LESSON_BATCH_REVIEW_STATUS.json appears without an explicit human note-taking decision.",
    "Stop if any artifact sets approvalStatus other than not_approved, learnerFacingRelease:true, productionReady:true, internalTrialReady:true, or launchReady:true.",
    "Stop if generated prompts, examples, or worksheets are copied into real notes as review evidence.",
    "Stop if any yellow, red, or research_only source is proposed as learner-facing evidence.",
    "Stop if any note or lesson text adds buy/sell/hold advice, trading signals, performance claims, broker/order workflow, automation, copied source prose, or real-money guidance.",
  ],
  sourceReports: paths,
  boundary: "This operator index is reviewer-facing operations scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  operatorIndexReady: report.operatorIndexReady,
  operatorMode: report.operatorMode,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  writeAllowedNow: report.writeAllowedNow,
  executionAllowedNow: report.executionAllowedNow,
  completeNoteCards: report.completeNoteCards,
  approvalReviewCandidates: report.approvalReviewCandidates,
  confirmedDecisions: report.confirmedDecisions,
  internalTrialReady: report.internalTrialReady,
  launchReady: report.launchReady,
  outputJson,
  outputMd,
}, null, 2));
