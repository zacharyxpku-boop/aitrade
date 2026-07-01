import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json";
const outputMd = "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  handoff: "docs/FIRST_REVIEWER_HANDOFF.json",
  worksheet: "docs/FIRST_REVIEWER_WORKSHEET.json",
  sourceRoleDecisionTable: "docs/FIRST_REVIEWER_SOURCE_ROLE_DECISION_TABLE.json",
  directCandidateChecklist: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_CONFIRMATION_CHECKLIST.json",
  noteStarter: "docs/FIRST_REVIEWER_HUMAN_NOTE_STARTER_TEMPLATE.json",
  safeNoteExamples: "docs/FIRST_REVIEWER_SAFE_NOTE_EXAMPLES.json",
  humanReviewStartChecklist: "docs/FIRST_REVIEWER_HUMAN_REVIEW_START_CHECKLIST.json",
  creationChecklist: "docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.json",
  realOverlayDryRunBundleAudit: "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.json",
  postWritePlaybook: "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_PLAYBOOK.json",
  realOverlayDiffAudit: "docs/FIRST_REVIEWER_REAL_OVERLAY_DIFF_AUDIT.json",
  noteQualityLint: "docs/REVIEWER_NOTE_QUALITY_LINT.json",
  completionAudit: "docs/LESSON_BATCH_COMPLETION_AUDIT.json",
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

function step(order, phase, file, command, humanAction, gate) {
  return { order, phase, file, command, humanAction, gate };
}

function normalizeOrders(rows) {
  return rows.map((row, index) => ({ ...row, order: index + 1 }));
}

function markdown(report) {
  return [
    "# First Reviewer Human Execution Bundle",
    "",
    "This is the single-page execution index for the first human reviewer.",
    "It does not create reviewer notes, approve lessons, publish learner-facing content, or change lesson grades.",
    "",
    "## Summary",
    "",
    `- Bundle ready: ${report.bundleReady}`,
    `- Execution mode: ${report.executionMode}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Worksheet lessons: ${report.worksheetLessons}`,
    `- High-risk lessons: ${report.highRiskLessons}`,
    `- Source-family decisions: ${report.sourceFamilyDecisions}`,
    `- Direct candidates to confirm: ${report.directCandidatesToConfirm}`,
    `- Blank note fields: ${report.blankNoteFields}`,
    `- Real ready batches: ${report.realReadyBatches}`,
    `- Real note issues: ${report.realNoteIssues}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Execution Steps",
    "",
    ...report.executionSteps.map((row) => [
      `${row.order}. ${row.phase}`,
      `File: \`${row.file}\``,
      `Command: \`${row.command}\``,
      `Human action: ${row.humanAction}`,
      `Gate: ${row.gate}`,
    ].join(" - ")),
    "",
    "## Manual Sign-Off Boxes",
    "",
    ...report.manualSignoffBoxes.map((box) => `- [ ] ${box}`),
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
  handoff,
  worksheet,
  sourceRoleDecisionTable,
  directCandidateChecklist,
  noteStarter,
  safeNoteExamples,
  humanReviewStartChecklist,
  creationChecklist,
  realOverlayDryRunBundleAudit,
  postWritePlaybook,
  realOverlayDiffAudit,
  noteQualityLint,
  completionAudit,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.handoff),
  readJson(paths.worksheet),
  readJson(paths.sourceRoleDecisionTable),
  readJson(paths.directCandidateChecklist),
  readJson(paths.noteStarter),
  readJson(paths.safeNoteExamples),
  readJson(paths.humanReviewStartChecklist),
  readJson(paths.creationChecklist),
  readJson(paths.realOverlayDryRunBundleAudit),
  readJson(paths.postWritePlaybook),
  readJson(paths.realOverlayDiffAudit),
  readJson(paths.noteQualityLint),
  readJson(paths.completionAudit),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  handoff,
  worksheet,
  sourceRoleDecisionTable,
  directCandidateChecklist,
  noteStarter,
  safeNoteExamples,
  humanReviewStartChecklist,
  creationChecklist,
  realOverlayDryRunBundleAudit,
  postWritePlaybook,
  realOverlayDiffAudit,
  noteQualityLint,
  completionAudit,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; execution bundle currently expects pre-write state`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include the human execution bundle file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-human-execution-bundle")) fail("dry-run packet must include the human execution bundle command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include the human execution bundle file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-human-execution-bundle")) fail("progress dashboard must include the human execution bundle command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Human execution bundle" && row.status === "single_page_index_ready")) fail("progress dashboard must include human execution bundle status");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_OPERATOR_INDEX.md")) fail("dry-run packet must include the operator index file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-operator-index")) fail("dry-run packet must include the operator index command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Operator index" && row.status === "single_entrypoint_ready_pre_write_only")) fail("progress dashboard must include operator index status");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_ONE_PAGE_RUNBOOK.md")) fail("dry-run packet must include the one-page runbook file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-one-page-runbook")) fail("dry-run packet must include the one-page runbook command");
if (!progressDashboard.statusBoard.some((row) => row.name === "One-page runbook" && row.status === "printable_operator_runbook_ready")) fail("progress dashboard must include one-page runbook status");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_RUNBOOK_NEGATIVE_CASES.md")) fail("dry-run packet must include the runbook negative cases file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-runbook-negative-cases")) fail("dry-run packet must include the runbook negative cases command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Runbook negative cases" && row.status === "runbook_misuse_guard_ready")) fail("progress dashboard must include runbook negative cases status");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_PREWRITE_SAMPLE_DOSSIER.md")) fail("dry-run packet must include the pre-write sample dossier file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-prewrite-sample-dossier")) fail("dry-run packet must include the pre-write sample dossier command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Pre-write sample dossier" && row.status === "read_only_human_handoff_ready")) fail("progress dashboard must include pre-write sample dossier status");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_FILLED_NOTES_POSITIVE_CONTROL_V2.md")) fail("dry-run packet must include the filled-notes positive control v2 file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-filled-notes-positive-control-v2")) fail("dry-run packet must include the filled-notes positive control v2 command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Filled-notes positive control v2" && row.status === "temporary_candidate_flow_control_ready")) fail("progress dashboard must include filled-notes positive control v2 status");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_POST_WRITE_APPROVAL_DRILL.md")) fail("dry-run packet must include the post-write approval drill file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-post-write-approval-drill")) fail("dry-run packet must include the post-write approval drill command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Post-write approval drill" && row.status === "temporary_release_blocker_drill_ready")) fail("progress dashboard must include post-write approval drill status");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_POST_WRITE_DRILL.md")) fail("dry-run packet must include the direct-candidate post-write drill file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-direct-candidate-post-write-drill")) fail("dry-run packet must include the direct-candidate post-write drill command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Direct-candidate post-write drill" && row.status === "temporary_source_fit_boundary_drill_ready")) fail("progress dashboard must include direct-candidate post-write drill status");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_SIMULATOR.md")) fail("dry-run packet must include the post-write validation simulator file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-post-write-validation-simulator")) fail("dry-run packet must include the post-write validation simulator command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Post-write validation simulator" && row.status === "temporary_post_write_sequence_simulator_ready")) fail("progress dashboard must include post-write validation simulator status");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_SEQUENCE_CONSISTENCY.md")) fail("dry-run packet must include the sequence consistency file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-sequence-consistency")) fail("dry-run packet must include the sequence consistency command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Sequence consistency gate" && row.status === "pre_write_order_integrity_ready")) fail("progress dashboard must include sequence consistency status");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_DAY_OF_REVIEW_PACKET_FREEZE.md")) fail("dry-run packet must include the day-of-review packet freeze file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-day-of-review-packet-freeze")) fail("dry-run packet must include the day-of-review packet freeze command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Day-of-review packet freeze" && row.status === "frozen_pre_write_packet_ready")) fail("progress dashboard must include day-of-review packet freeze status");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.md")) fail("dry-run packet must include the real overlay write readiness lock file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock")) fail("dry-run packet must include the real overlay write readiness lock command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Real overlay write readiness lock" && row.status === "write_locked_manual_decision_required")) fail("progress dashboard must include real overlay write readiness lock status");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.md")) fail("dry-run packet must include the real overlay write authorization preview file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview")) fail("dry-run packet must include the real overlay write authorization preview command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Real overlay write authorization preview" && row.status === "authorization_preview_ready_manual_required")) fail("progress dashboard must include real overlay write authorization preview status");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.md")) fail("dry-run packet must include the day-zero write handoff file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-day-zero-write-handoff")) fail("dry-run packet must include the day-zero write handoff command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Day-zero write handoff" && row.status === "day_zero_handoff_ready_write_blocked")) fail("progress dashboard must include day-zero write handoff status");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md")) fail("dry-run packet must include the dry-run bundle audit file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit")) fail("dry-run packet must include the dry-run bundle audit command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Dry-run bundle audit" && row.status === "dry_run_bundle_audit_ready_pre_write_only")) fail("progress dashboard must include dry-run bundle audit status");

if (worksheet.worksheetLessons !== 12 || handoff.worksheetLessons !== 12) fail("human execution bundle must cover exactly 12 first-reviewer lessons");
if (worksheet.highRiskLessons !== 2 || handoff.highRiskLessons !== 2) fail("human execution bundle must keep two high-risk lessons visible");
if (sourceRoleDecisionTable.sourceFamilyDecisions !== noteStarter.roleHints) fail("source-role decisions must match note-starter role hints");
if (directCandidateChecklist.directCandidates !== 5 || directCandidateChecklist.nonGreenRefs !== 0) fail("direct-candidate checklist must stay green-only with 5 candidates");
if (noteStarter.blankNoteFields !== 72 || noteStarter.realStatusOverlayPresent !== false) fail("note starter must keep 72 blank fields and no real overlay");
if (safeNoteExamples.sampleOnly !== true || safeNoteExamples.realStatusOverlayPresent !== false) fail("safe examples must remain sample-only");
if (humanReviewStartChecklist.startAllowedNow !== false || humanReviewStartChecklist.realStatusOverlayPresent !== false) fail("human start checklist must remain a manual pre-start gate");
if (creationChecklist.creationAllowedNow !== false || creationChecklist.realStatusOverlayPresent !== false) fail("creation checklist must keep creation blocked in generated state");
if (realOverlayDryRunBundleAudit.auditReady !== true || realOverlayDryRunBundleAudit.writeAllowedNow !== false || realOverlayDryRunBundleAudit.commandOrderConsistent !== true) fail("dry-run bundle audit must stay ready, consistent, and write-blocked");
if (postWritePlaybook.executionAllowedNow !== false || postWritePlaybook.validationSequence.length < 12) fail("post-write playbook must remain future-only with full validation sequence");
if (realOverlayDiffAudit.realStatusOverlayPresent !== false || realOverlayDiffAudit.blankNoteFields !== 72 || realOverlayDiffAudit.filledNoteFields !== 0) fail("real overlay diff audit must show pre-write blank state");
if (noteQualityLint.realStatusOverlayPresent !== false || noteQualityLint.realNoteIssues !== 0) fail("note lint must show no real note issues before write");
if (completionAudit.statusOverlayPresent !== false || completionAudit.readyBatches !== 0) fail("completion audit must show no real ready batches before write");

const executionSteps = normalizeOrders([
  step(1, "Operator index", "docs/FIRST_REVIEWER_OPERATOR_INDEX.md", "npm.cmd run check:first-reviewer-operator-index", "Start from the operator index before opening other first-reviewer files.", "Index is not write permission, approval, release, or readiness."),
  step(2, "One-page runbook", "docs/FIRST_REVIEWER_ONE_PAGE_RUNBOOK.md", "npm.cmd run check:first-reviewer-one-page-runbook", "Use this as the printable day-of-review sequence and hard-stop checklist.", "Runbook is not real notes, write permission, approval, release, or readiness."),
  step(3, "Runbook misuse guard", "docs/FIRST_REVIEWER_RUNBOOK_NEGATIVE_CASES.md", "npm.cmd run check:first-reviewer-runbook-negative-cases", "Keep the runbook misuse negative cases passing before using the runbook in review preparation.", "Runbook cannot become notes, approval, release, grade promotion, launch readiness, or production readiness."),
  step(4, "Pre-write sample dossier", "docs/FIRST_REVIEWER_PREWRITE_SAMPLE_DOSSIER.md", "npm.cmd run check:first-reviewer-prewrite-sample-dossier", "Use the dossier as a read-only handoff packet for the first 12 lesson cards and gate sequence.", "Dossier cannot create notes, approvals, release candidates, or readiness claims."),
  step(5, "Filled-notes positive control v2", "docs/FIRST_REVIEWER_FILLED_NOTES_POSITIVE_CONTROL_V2.md", "npm.cmd run check:first-reviewer-filled-notes-positive-control-v2", "Use the temporary-file control to verify complete notes can become separate-approval candidates only.", "Positive control is not real reviewer evidence and cannot auto-approve or publish lessons."),
  step(6, "Post-write approval drill", "docs/FIRST_REVIEWER_POST_WRITE_APPROVAL_DRILL.md", "npm.cmd run check:first-reviewer-post-write-approval-drill", "Use the temporary drill to verify approval-review candidates remain blocked from release, launch, grade promotion, and production readiness.", "Drill is not real reviewer evidence, approval, release, or readiness."),
  step(7, "Direct-candidate post-write drill", "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_POST_WRITE_DRILL.md", "npm.cmd run check:first-reviewer-direct-candidate-post-write-drill", "Use the temporary drill to validate sourceFitNotes boundaries for BEA, BLS, CFTC, and SEC candidate rows.", "Drill is not real source confirmation, approval, release, or readiness."),
  step(8, "Post-write validation simulator", "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_SIMULATOR.md", "npm.cmd run check:first-reviewer-post-write-validation-simulator", "Use the temporary simulator to rehearse completion, evidence intake, separate approval, and release-drift guards after a future overlay exists.", "Simulator is not real reviewer evidence, approval, release, grade promotion, launch readiness, or production readiness."),
  step(9, "Sequence consistency gate", "docs/FIRST_REVIEWER_SEQUENCE_CONSISTENCY.md", "npm.cmd run check:first-reviewer-sequence-consistency", "Use the sequence gate to confirm execution steps, operator phases, post-write commands, and packet order remain contiguous.", "Sequence gate is not real reviewer evidence, approval, release, grade promotion, launch readiness, or production readiness."),
  step(10, "Day-of-review packet freeze", "docs/FIRST_REVIEWER_DAY_OF_REVIEW_PACKET_FREEZE.md", "npm.cmd run check:first-reviewer-day-of-review-packet-freeze", "Use the frozen packet to confirm every first-reviewer step has input, expected output, failure route, and forbidden actions.", "Freeze packet is not real reviewer evidence, approval, release, grade promotion, launch readiness, or production readiness."),
  step(8, "Orient", "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.md", "npm.cmd run check:first-reviewer-human-execution-bundle", "Use this page as the reviewer execution order after the operator index.", "No approval, release, or grade change."),
  step(9, "Printable checklist", "docs/FIRST_REVIEWER_PRINTABLE_CHECKLIST_PACK.md", "npm.cmd run check:first-reviewer-printable-checklist-pack", "Print or open the per-lesson checklist pack for manual tracking.", "Checklist boxes are not real review notes."),
  step(10, "Handoff", "docs/FIRST_REVIEWER_HANDOFF.md", "npm.cmd run check:first-reviewer-handoff", "Confirm scope, commands, and disallowed status language.", "Keep approvalStatus:not_approved."),
  step(11, "Worksheet", "docs/FIRST_REVIEWER_WORKSHEET.md", "npm.cmd run check:first-reviewer-worksheet", "Review 12 lessons, starting with the 2 high-risk rows.", "Do not rewrite learner-facing prose here."),
  step(12, "Source roles", "docs/FIRST_REVIEWER_SOURCE_ROLE_DECISION_TABLE.md", "npm.cmd run check:first-reviewer-source-role-decision-table", "Classify source families before note-taking.", "Do not treat candidate sources as approved direct evidence."),
  step(13, "Direct candidates", "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_CONFIRMATION_CHECKLIST.md", "npm.cmd run check:first-reviewer-direct-candidate-confirmation-checklist", "Confirm or downgrade the 5 direct candidates.", "Use green sources only; no yellow/red/research-only learner-facing evidence."),
  step(14, "Blank notes", "docs/FIRST_REVIEWER_HUMAN_NOTE_STARTER_TEMPLATE.md", "npm.cmd run check:first-reviewer-human-note-starter-template", "Use the 72 blank fields as the note map.", "Do not paste generated text as real notes."),
  step(15, "Safe examples", "docs/FIRST_REVIEWER_SAFE_NOTE_EXAMPLES.md", "npm.cmd run check:first-reviewer-safe-note-examples", "Read examples for style only.", "Sample-only examples are not review evidence."),
  step(16, "Start gate", "docs/FIRST_REVIEWER_HUMAN_REVIEW_START_CHECKLIST.md", "npm.cmd run check:first-reviewer-human-review-start-checklist", "Complete manual boxes before any real overlay write.", "Generated state keeps startAllowedNow:false."),
  step(17, "Creation gate", "docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.md", "npm.cmd run check:first-reviewer-real-overlay-creation-checklist", "Preview and intentionally decide whether a human will start note-taking.", "No automatic creation; no overwrite."),
  step(18, "Post-write route", "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_PLAYBOOK.md", "npm.cmd run check:first-reviewer-post-write-validation-playbook", "After real overlay creation, run the validation sequence.", "Still no approval or learner-facing release."),
  step(19, "Diff audit", "docs/FIRST_REVIEWER_REAL_OVERLAY_DIFF_AUDIT.md", "npm.cmd run check:first-reviewer-real-overlay-diff-audit", "Compare any real overlay with the blank template.", "Reject missing rows, unsafe wording, copy-risk wording, and status drift."),
  step(20, "Evidence intake", "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.md", "npm.cmd run check:first-reviewer-evidence-intake-summary", "Summarize complete notes, blockers, direct-candidate status, and candidates for separate approval review.", "Intake is triage only, not approval or release."),
  step(21, "Separate approval gate", "docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.md", "npm.cmd run check:first-reviewer-separate-approval-review-gate", "Keep complete-note candidates behind a separate manual approval review.", "Candidate status is not approval, release, production readiness, or grade promotion."),
  step(22, "Release drift guard", "docs/FIRST_REVIEWER_RELEASE_READINESS_NEGATIVE_CASES.md", "npm.cmd run check:first-reviewer-release-readiness-negative-cases", "Prove approval/release/production/commercial-ready drift is rejected.", "Passing negative cases are required before any future release review."),
  step(23, "Launch readiness dashboard", "docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.md", "npm.cmd run check:first-reviewer-launch-readiness-dashboard", "Review current blockers to internal trial, launch, and production readiness.", "Dashboard readiness is not approval, release, commercial readiness, or production readiness."),
  step(24, "Rehearsal checklist", "docs/FIRST_REVIEWER_REHEARSAL_CHECKLIST.md", "npm.cmd run check:first-reviewer-rehearsal-checklist", "Practice the 12 lesson cards, 72 note fields, and 5 direct-candidate decisions before real note-taking.", "Rehearsal is not real reviewer evidence, approval, release, or readiness."),
  step(25, "Direct candidate decisions", "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.md", "npm.cmd run check:first-reviewer-direct-candidate-decision-worksheet", "Use the blank worksheet to decide confirm, downgrade, or blocked for each direct-candidate source role.", "Generated worksheet rows are not confirmation; real sourceFitNotes are required."),
  step(25.5, "Source-fit decision summary", "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md", "npm.cmd run check:first-reviewer-source-fit-decision-summary", "Use the one-page summary to compare confirm, downgrade, and block criteria before writing sourceFitNotes.", "Summary is not a decision, source confirmation, approval, release, or readiness."),
  step(25.75, "SourceFitNotes card pack", "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md", "npm.cmd run check:first-reviewer-source-fit-notes-card-pack", "Print or copy the blank sourceFitNotes cards for the 5 direct candidates and leave all fields empty until real review.", "Card pack is not filled notes, source confirmation, approval, release, or readiness."),
  step(25.875, "SourceFitNotes card misuse guard", "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md", "npm.cmd run check:first-reviewer-source-fit-notes-card-negative-cases", "Run simulated pollution cases before any future sourceFitNotes are written.", "Negative cases are not real notes, source confirmation, approval, release, or readiness."),
  step(25.9375, "SourceFitNotes positive matrix", "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md", "npm.cmd run check:first-reviewer-source-fit-notes-positive-matrix", "Read sample-only confirm, downgrade, and block note shapes before future human note writing.", "Positive samples are not real notes, source confirmation, approval, release, or readiness."),
  step(25.96875, "SourceFitNotes human-fill preflight", "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md", "npm.cmd run check:first-reviewer-source-fit-notes-human-fill-preflight", "Confirm manual prerequisites before any real sourceFitNotes entry.", "Preflight is not real notes, source confirmation, write permission, approval, release, or readiness."),
  step(26, "Source fit notes acceptance", "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.md", "npm.cmd run check:first-reviewer-source-fit-notes-acceptance", "After future real sourceFitNotes are written, check that each note has a valid decision, source role, claim, rewrite action, and no unsafe wording.", "Acceptance controls are not real notes, approval, release, or readiness."),
  step(27, "Real overlay preflight", "docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.md", "npm.cmd run check:first-reviewer-real-overlay-preflight-summary", "Before any explicit write initializer, review the final manual and machine gates across start, creation, direct-candidate, sourceFitNotes, diff-audit, intake, and launch-readiness checks.", "Preflight does not create the overlay and must keep writeAllowedNow:false until a human decision exists."),
  step(28, "Write readiness lock", "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.md", "npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock", "Use the generated lock as the final hard stop before any real overlay write command.", "Lock remains writeAllowedNow:false and cannot replace explicit human note-taking intent."),
  step(29, "Write authorization preview", "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.md", "npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview", "Use the generated preview to separate machine-checked gates from missing human authorization before any write command.", "Preview remains writeAllowedNow:false and cannot authorize or create the real overlay."),
  step(30, "Day-zero write handoff", "docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.md", "npm.cmd run check:first-reviewer-day-zero-write-handoff", "Use the one-page handoff to review pre-write commands, human authorization blockers, write-command preview, and future post-write validation order.", "Handoff remains writeAllowedNow:false and cannot authorize or create the real overlay."),
  step(31, "Dry-run bundle audit", "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md", "npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit", "Run the consistency audit tying dry-run, overwrite protection, day-zero handoff, final rehearsal, authorization preview, and write locks together.", "Audit remains writeAllowedNow:false and cannot authorize or create the real overlay."),
  step(29, "Post-write command pack", "docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.md", "npm.cmd run check:first-reviewer-post-write-command-pack", "After a future real overlay exists, run the strict validation order and failure routes without skipping gates.", "Command pack is future-only now and cannot prove review evidence while the real overlay is absent."),
  step(30, "Final gates", "docs/REVIEWER_NOTE_QUALITY_LINT.md", "npm.cmd run check:curriculum-review", "Run note lint, completion audit, curriculum review, knowledge checks, browser checks, and full verify.", "Only a separate later approval review can consider readiness."),
]);

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  bundleReady: true,
  executionMode: "pre_write_manual_review_index",
  realStatusPath,
  realStatusOverlayPresent,
  targetBatches: worksheet.targetBatches,
  worksheetLessons: worksheet.worksheetLessons,
  highRiskLessons: worksheet.highRiskLessons,
  sourceFamilyDecisions: sourceRoleDecisionTable.sourceFamilyDecisions,
  directCandidatesToConfirm: directCandidateChecklist.directCandidates,
  blankNoteFields: noteStarter.blankNoteFields,
  realReadyBatches: completionAudit.readyBatches,
  realNoteIssues: noteQualityLint.realNoteIssues,
  executionSteps,
  manualSignoffBoxes: [
    "A human reviewer is identified before any real notes are written.",
    "Scope is limited to rewrite_batch_01 and rewrite_batch_05.",
    "The 5 direct-candidate source roles are confirmed or downgraded before sourceFitNotes.",
    "All 72 note fields start blank; generated prompts and examples are not copied as real notes.",
    "Reviewer accepts education-only, non-production, no-advice, no-signal, no-performance, no-broker, no-automation, and no-real-money boundaries.",
    "Real overlay write mode is intentional, and existing notes will not be overwritten.",
    "After write mode, completion, diff audit, note lint, curriculum, knowledge, browser, and full verify gates all run before any separate approval review.",
  ],
  stopConditions: [
    "Stop if docs/LESSON_BATCH_REVIEW_STATUS.json appears without explicit human note-taking.",
    "Stop if any generated prompt or sample is copied into real notes as evidence.",
    "Stop if any note or status claims approval, learner-facing readiness, commercial readiness, or production readiness.",
    "Stop if any note contains buy/sell/hold advice, trading signals, performance claims, broker/order workflow, automation, or real-money guidance.",
    "Stop if any external source body text is copied into notes or lesson prose.",
    "Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.",
  ],
  sourceReports: paths,
  boundary: "This bundle is a human reviewer execution index only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  bundleReady: report.bundleReady,
  executionMode: report.executionMode,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  targetBatches: report.targetBatches,
  worksheetLessons: report.worksheetLessons,
  highRiskLessons: report.highRiskLessons,
  sourceFamilyDecisions: report.sourceFamilyDecisions,
  directCandidatesToConfirm: report.directCandidatesToConfirm,
  blankNoteFields: report.blankNoteFields,
  executionSteps: report.executionSteps.length,
  outputJson,
  outputMd,
}, null, 2));
