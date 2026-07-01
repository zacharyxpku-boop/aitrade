import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json";
const outputMd = "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.md";

const paths = {
  handoff: "docs/FIRST_REVIEWER_HANDOFF.json",
  worksheet: "docs/FIRST_REVIEWER_WORKSHEET.json",
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  sourceRoleDecisionTable: "docs/FIRST_REVIEWER_SOURCE_ROLE_DECISION_TABLE.json",
  humanNoteStarterTemplate: "docs/FIRST_REVIEWER_HUMAN_NOTE_STARTER_TEMPLATE.json",
  creationChecklist: "docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.json",
  realOverlayDryRunBundleAudit: "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.json",
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

function statusRow(name, status, evidence, nextAction) {
  return { name, status, evidence, nextAction };
}

function markdown(report) {
  return [
    "# First Reviewer Progress Dashboard",
    "",
    "This dashboard compresses the first reviewer handoff into a single status page.",
    "It is an operations dashboard only; it does not create reviewer notes, approve lessons, publish content, or change lesson grades.",
    "",
    "## Summary",
    "",
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Worksheet lessons: ${report.worksheetLessons}`,
    `- High-risk lessons: ${report.highRiskLessons}`,
    `- Source-family decisions: ${report.sourceFamilyDecisions}`,
    `- Direct candidates needing confirmation: ${report.directCandidatesToConfirm}`,
    `- Blank note fields: ${report.blankNoteFields}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Creation allowed now: ${report.creationAllowedNow}`,
    `- Real ready batches: ${report.realReadyBatches}`,
    `- Real note issues: ${report.realNoteIssues}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Status Board",
    "",
    ...report.statusBoard.map((row) => `- ${row.name}: ${row.status} - ${row.evidence} Next: ${row.nextAction}`),
    "",
    "## First Reviewer File Order",
    "",
    ...report.fileOrder.map((file, index) => `${index + 1}. \`${file.path}\` - ${file.use}`),
    "",
    "## Required Commands",
    "",
    ...report.requiredCommands.map((command, index) => `${index + 1}. \`${command}\``),
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
  handoff,
  worksheet,
  dryRunPacket,
  sourceRoleDecisionTable,
  humanNoteStarterTemplate,
  creationChecklist,
  realOverlayDryRunBundleAudit,
  noteQualityLint,
  completionAudit,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.handoff),
  readJson(paths.worksheet),
  readJson(paths.dryRunPacket),
  readJson(paths.sourceRoleDecisionTable),
  readJson(paths.humanNoteStarterTemplate),
  readJson(paths.creationChecklist),
  readJson(paths.realOverlayDryRunBundleAudit),
  readJson(paths.noteQualityLint),
  readJson(paths.completionAudit),
  exists(realStatusPath),
]);

for (const [label, report] of Object.entries({
  handoff,
  worksheet,
  dryRunPacket,
  sourceRoleDecisionTable,
  humanNoteStarterTemplate,
  creationChecklist,
  realOverlayDryRunBundleAudit,
  noteQualityLint,
  completionAudit,
})) {
  assertEnvelope(report, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; progress dashboard must not require real notes`);
if (handoff.statusOverlayPresent !== false) fail("handoff must show no real status overlay");
if (dryRunPacket.realStatusOverlayPresent !== false || dryRunPacket.realReadyBatches !== 0) fail("dry-run packet must show no real overlay and no real ready batches");
if (sourceRoleDecisionTable.realStatusOverlayPresent !== false) fail("source-role table must not depend on real status overlay");
if (humanNoteStarterTemplate.realStatusOverlayPresent !== false || humanNoteStarterTemplate.blankNoteFields !== 72) fail("note starter must keep 72 blank note fields and no real overlay");
if (creationChecklist.realStatusOverlayPresent !== false || creationChecklist.creationAllowedNow !== false) fail("creation checklist must keep creation blocked until explicit human note-taking begins");
if (realOverlayDryRunBundleAudit.auditReady !== true || realOverlayDryRunBundleAudit.writeAllowedNow !== false || realOverlayDryRunBundleAudit.commandOrderConsistent !== true) fail("dry-run bundle audit must stay ready, consistent, and write-blocked");
if (noteQualityLint.realStatusOverlayPresent !== false || noteQualityLint.realNoteIssues !== 0) fail("note lint must show no real notes and no real issues");
if (completionAudit.statusOverlayPresent !== false || completionAudit.readyBatches !== 0) fail("completion audit must show no real ready batches");
if (worksheet.worksheetLessons !== 12 || sourceRoleDecisionTable.lessonRows.length !== 12 || humanNoteStarterTemplate.lessonCards !== 12) fail("first reviewer dashboard must cover exactly 12 lessons");
if (worksheet.highRiskLessons !== 2 || sourceRoleDecisionTable.highRiskLessons !== 2) fail("first reviewer dashboard must keep two high-risk lessons visible");
if (sourceRoleDecisionTable.sourceFamilyDecisions !== humanNoteStarterTemplate.roleHints) fail("source-role decisions must match note-starter role hints");
if (sourceRoleDecisionTable.directCandidatesNeedingConfirmation !== humanNoteStarterTemplate.directCandidatesToConfirm) fail("direct candidates must match between source-role table and note starter");
if (!handoff.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-creation-checklist")) fail("handoff must include creation checklist command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.md")) fail("dry-run packet must include creation checklist file");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_CONFIRMATION_CHECKLIST.md")) fail("dry-run packet must include direct-candidate checklist file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-direct-candidate-confirmation-checklist")) fail("dry-run packet must include direct-candidate checklist command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_SAFE_NOTE_EXAMPLES.md")) fail("dry-run packet must include safe note examples file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-safe-note-examples")) fail("dry-run packet must include safe note examples command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_HUMAN_REVIEW_START_CHECKLIST.md")) fail("dry-run packet must include human review start checklist file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-human-review-start-checklist")) fail("dry-run packet must include human review start checklist command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_PLAYBOOK.md")) fail("dry-run packet must include post-write validation playbook file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-post-write-validation-playbook")) fail("dry-run packet must include post-write validation playbook command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_REAL_OVERLAY_DIFF_AUDIT.md")) fail("dry-run packet must include real overlay diff audit file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-diff-audit")) fail("dry-run packet must include real overlay diff audit command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.md")) fail("dry-run packet must include human execution bundle file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-human-execution-bundle")) fail("dry-run packet must include human execution bundle command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_PRINTABLE_CHECKLIST_PACK.md")) fail("dry-run packet must include printable checklist pack file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-printable-checklist-pack")) fail("dry-run packet must include printable checklist pack command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.md")) fail("dry-run packet must include evidence intake summary file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-evidence-intake-summary")) fail("dry-run packet must include evidence intake summary command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.md")) fail("dry-run packet must include separate approval review gate file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-separate-approval-review-gate")) fail("dry-run packet must include separate approval review gate command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_RELEASE_READINESS_NEGATIVE_CASES.md")) fail("dry-run packet must include release readiness negative cases file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-release-readiness-negative-cases")) fail("dry-run packet must include release readiness negative cases command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.md")) fail("dry-run packet must include launch readiness dashboard file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-launch-readiness-dashboard")) fail("dry-run packet must include launch readiness dashboard command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_REHEARSAL_CHECKLIST.md")) fail("dry-run packet must include rehearsal checklist file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-rehearsal-checklist")) fail("dry-run packet must include rehearsal checklist command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.md")) fail("dry-run packet must include direct candidate decision worksheet file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-direct-candidate-decision-worksheet")) fail("dry-run packet must include direct candidate decision worksheet command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.md")) fail("dry-run packet must include source-fit decision summary file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-decision-summary")) fail("dry-run packet must include source-fit decision summary command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_PACK.md")) fail("dry-run packet must include sourceFitNotes card pack file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-notes-card-pack")) fail("dry-run packet must include sourceFitNotes card pack command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_CARD_NEGATIVE_CASES.md")) fail("dry-run packet must include sourceFitNotes card negative cases file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-notes-card-negative-cases")) fail("dry-run packet must include sourceFitNotes card negative cases command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_POSITIVE_MATRIX.md")) fail("dry-run packet must include sourceFitNotes positive matrix file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-notes-positive-matrix")) fail("dry-run packet must include sourceFitNotes positive matrix command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_HUMAN_FILL_PREFLIGHT.md")) fail("dry-run packet must include sourceFitNotes human-fill preflight file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-notes-human-fill-preflight")) fail("dry-run packet must include sourceFitNotes human-fill preflight command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.md")) fail("dry-run packet must include sourceFitNotes acceptance file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-source-fit-notes-acceptance")) fail("dry-run packet must include sourceFitNotes acceptance command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.md")) fail("dry-run packet must include real overlay preflight summary file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-preflight-summary")) fail("dry-run packet must include real overlay preflight summary command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.md")) fail("dry-run packet must include real overlay write readiness lock file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock")) fail("dry-run packet must include real overlay write readiness lock command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.md")) fail("dry-run packet must include real overlay write authorization preview file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview")) fail("dry-run packet must include real overlay write authorization preview command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.md")) fail("dry-run packet must include day-zero write handoff file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-day-zero-write-handoff")) fail("dry-run packet must include day-zero write handoff command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md")) fail("dry-run packet must include dry-run bundle audit file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-dry-run-bundle-audit")) fail("dry-run packet must include dry-run bundle audit command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.md")) fail("dry-run packet must include post-write command pack file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-post-write-command-pack")) fail("dry-run packet must include post-write command pack command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_OPERATOR_INDEX.md")) fail("dry-run packet must include operator index file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-operator-index")) fail("dry-run packet must include operator index command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_ONE_PAGE_RUNBOOK.md")) fail("dry-run packet must include one-page runbook file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-one-page-runbook")) fail("dry-run packet must include one-page runbook command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_RUNBOOK_NEGATIVE_CASES.md")) fail("dry-run packet must include runbook negative cases file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-runbook-negative-cases")) fail("dry-run packet must include runbook negative cases command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_PREWRITE_SAMPLE_DOSSIER.md")) fail("dry-run packet must include pre-write sample dossier file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-prewrite-sample-dossier")) fail("dry-run packet must include pre-write sample dossier command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_FILLED_NOTES_POSITIVE_CONTROL_V2.md")) fail("dry-run packet must include filled-notes positive control v2 file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-filled-notes-positive-control-v2")) fail("dry-run packet must include filled-notes positive control v2 command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_POST_WRITE_APPROVAL_DRILL.md")) fail("dry-run packet must include post-write approval drill file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-post-write-approval-drill")) fail("dry-run packet must include post-write approval drill command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_POST_WRITE_DRILL.md")) fail("dry-run packet must include direct-candidate post-write drill file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-direct-candidate-post-write-drill")) fail("dry-run packet must include direct-candidate post-write drill command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_SIMULATOR.md")) fail("dry-run packet must include post-write validation simulator file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-post-write-validation-simulator")) fail("dry-run packet must include post-write validation simulator command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_SEQUENCE_CONSISTENCY.md")) fail("dry-run packet must include sequence consistency file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-sequence-consistency")) fail("dry-run packet must include sequence consistency command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === "docs/FIRST_REVIEWER_DAY_OF_REVIEW_PACKET_FREEZE.md")) fail("dry-run packet must include day-of-review packet freeze file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-day-of-review-packet-freeze")) fail("dry-run packet must include day-of-review packet freeze command");

const statusBoard = [
  statusRow(
    "Operator index",
    "single_entrypoint_ready_pre_write_only",
    "A single operator entrypoint is available across pre-write, post-write, evidence intake, separate approval, and launch-readiness gates.",
    "Start from the operator index before opening the first-reviewer execution bundle or dry-run packet."
  ),
  statusRow(
    "One-page runbook",
    "printable_operator_runbook_ready",
    "A printable one-page runbook is available for the first reviewer, compressing the operator index into hard-stop review steps.",
    "Use it as the day-of-review checklist; it is not real notes, approval, release, or readiness."
  ),
  statusRow(
    "Runbook negative cases",
    "runbook_misuse_guard_ready",
    "Negative cases prove the one-page runbook cannot be misused as real notes, approval, release, grade promotion, launch readiness, or production readiness.",
    "Keep this guard passing before using the runbook in human review preparation."
  ),
  statusRow(
    "Pre-write sample dossier",
    "read_only_human_handoff_ready",
    "A read-only handoff packet is available for the first 12 lesson cards, 72 note fields, 5 direct candidates, runbook negative cases, and future post-write commands.",
    "Use it only to brief a human reviewer; it must not create notes, approvals, release candidates, or readiness claims."
  ),
  statusRow(
    "Filled-notes positive control v2",
    "temporary_candidate_flow_control_ready",
    "A temporary-file positive control proves complete reviewer notes can reach evidence intake and separate-approval candidates without auto-approval or real overlay writes.",
    "Use it as validation of the gate chain only; it is not real reviewer evidence."
  ),
  statusRow(
    "Post-write approval drill",
    "temporary_release_blocker_drill_ready",
    "A temporary post-write drill proves approval-review candidates still cannot become approval, learner-facing release, grade promotion, launch readiness, or production readiness.",
    "Use it as validation of future post-write blockers only; it is not real reviewer evidence or approval."
  ),
  statusRow(
    "Direct-candidate post-write drill",
    "temporary_source_fit_boundary_drill_ready",
    "A temporary direct-candidate drill validates BEA, BLS, CFTC, and SEC candidate sourceFitNotes boundaries without confirming source use or learner-facing evidence.",
    "Use it as validation of sourceFitNotes decision boundaries only; it is not real source confirmation."
  ),
  statusRow(
    "Post-write validation simulator",
    "temporary_post_write_sequence_simulator_ready",
    "A temporary full post-write simulator chains completion audit, evidence intake, separate approval gate, and release-drift negative cases without touching the real overlay.",
    "Use it to rehearse the future post-write validation order only; it is not real reviewer evidence, approval, release, or readiness."
  ),
  statusRow(
    "Sequence consistency gate",
    "pre_write_order_integrity_ready",
    "A sequence gate checks first-reviewer execution steps, operator phases, post-write commands, dry-run commands, and packet order for contiguous numbering and cross-links.",
    "Run it after the first-reviewer reports regenerate; it is an operations integrity check, not review evidence or approval."
  ),
  statusRow(
    "Day-of-review packet freeze",
    "frozen_pre_write_packet_ready",
    "A frozen day-of-review packet is available with explicit input, expected output, failure route, and forbidden actions for every first-reviewer step.",
    "Use it as the final pre-write checklist; it is not real notes, approval, release, or readiness."
  ),
  statusRow(
    "Human execution bundle",
    "single_page_index_ready",
    "A single-page execution index is available for opening reviewer files in the intended order.",
    "Start from the execution bundle, then move through handoff, worksheet, source roles, note gates, and validation gates."
  ),
  statusRow(
    "Printable checklist pack",
    "printable_manual_checklist_ready",
    "A printable per-lesson checklist pack is available with 12 lesson cards and 72 blank note-field boxes.",
    "Use it only for manual review tracking; it is not real notes, approval, or release evidence."
  ),
  statusRow(
    "Evidence intake summary",
    "future_real_notes_intake_ready",
    "An intake summary is available for future real reviewer notes and separate-approval candidate triage.",
    "Use it only after a human-created overlay exists; current generated state must report zero real candidates."
  ),
  statusRow(
    "Separate approval review gate",
    "future_manual_approval_gate_ready",
    "A separate manual approval gate is available after evidence intake, keeping candidates from becoming automatic approvals.",
    "Use it only to triage candidates for a later human approval review; it does not approve, publish, or promote lessons."
  ),
  statusRow(
    "Release readiness negative cases",
    "release_drift_guard_ready",
    "Negative cases prove approval, learner-facing release, production readiness, and commercial-ready drift are rejected.",
    "Keep this passing before any future real overlay or release-review artifact is treated as meaningful evidence."
  ),
  statusRow(
    "Launch readiness dashboard",
    "not_ready_dashboard_ready",
    "A launch readiness dashboard is available to summarize evidence intake, approval gate, release drift guard, green grounding, and blockers.",
    "Use it as a blocker map only; current generated state remains internalTrialReady:false, launchReady:false, and productionReady:false."
  ),
  statusRow(
    "Rehearsal checklist",
    "rehearsal_ready_not_review",
    "A rehearsal checklist is available for walking 12 lesson cards, 72 note fields, and 5 direct candidates before real note-taking.",
    "Use rehearsal to practice the manual flow only; it is not real notes, evidence intake, approval, release, or readiness."
  ),
  statusRow(
    "Direct candidate decision worksheet",
    "blank_decision_sheet_ready",
    "A blank decision worksheet is available for confirm, downgrade, or blocked decisions across the 5 direct candidates.",
    "Do not treat any generated decision row as confirmation; the real reviewer must write sourceFitNotes after source inspection."
  ),
  statusRow(
    "Source-fit decision summary",
    "one_page_decision_summary_ready",
    "A one-page summary compresses confirm, downgrade, and block criteria for the 5 direct-candidate rows.",
    "Use it before sourceFitNotes; generated output must not choose or record the decision."
  ),
  statusRow(
    "SourceFitNotes card pack",
    "blank_printable_cards_ready",
    "A printable blank card pack is available for the 5 direct-candidate sourceFitNotes rows and 35 required fields.",
    "Use it only as blank human note-taking scaffolding; generated output must not fill any note field."
  ),
  statusRow(
    "SourceFitNotes card negative cases",
    "card_misuse_guard_ready",
    "Negative cases prove prefilled fields, approval wording, trading signals, copied-source instructions, chart-proof misuse, and yellow/red source drift are rejected.",
    "Run this immediately after the card pack and before future sourceFitNotes acceptance."
  ),
  statusRow(
    "SourceFitNotes positive matrix",
    "sample_only_positive_shapes_ready",
    "A sample-only matrix distinguishes confirm, downgrade, and block note shapes while keeping 0 confirmed decisions.",
    "Use as human-writing guidance only; do not copy samples as real reviewer notes or source confirmation."
  ),
  statusRow(
    "SourceFitNotes human-fill preflight",
    "manual_fill_preflight_ready_write_blocked",
    "A preflight checks reviewer identity, 5 candidate decisions, source identity basis, no-copy checks, and required fields before real sourceFitNotes.",
    "Use before any real note entry; it keeps humanFillAllowedNow:false and writeAllowedNow:false."
  ),
  statusRow(
    "Source fit notes acceptance",
    "acceptance_gate_ready_no_real_notes",
    "A future sourceFitNotes acceptance gate is available with positive controls and negative cases for direct-candidate notes.",
    "Run it after real sourceFitNotes exist; generated controls are not real notes or source confirmation."
  ),
  statusRow(
    "Real overlay preflight summary",
    "preflight_ready_write_blocked",
    "A final pre-write summary is available across start, creation, direct-candidate, sourceFitNotes, diff-audit, intake, and launch-readiness gates.",
    "Use it before any write command; current generated state still requires an explicit human decision and keeps writeAllowedNow:false."
  ),
  statusRow(
    "Real overlay write readiness lock",
    "write_locked_manual_decision_required",
    "A generated write-readiness lock summarizes preflight, creation, temporary drills, and release blockers while keeping writeAllowedNow:false.",
    "Use it as the last generated hard stop before write mode; it cannot replace explicit human note-taking intent."
  ),
  statusRow(
    "Real overlay write authorization preview",
    "authorization_preview_ready_manual_required",
    "A generated authorization preview separates machine-checked gates from missing human authorization while keeping writeAllowedNow:false.",
    "Use it to brief the human reviewer before write mode; it is not write permission and cannot create the real overlay."
  ),
  statusRow(
    "Day-zero write handoff",
    "day_zero_handoff_ready_write_blocked",
    "A one-page day-zero handoff compresses pre-write checks, human authorization blockers, write-command preview, and future post-write validation order while keeping writeAllowedNow:false.",
    "Use it as the final operations brief before a human-only write decision; it is not write permission."
  ),
  statusRow(
    "Dry-run bundle audit",
    "dry_run_bundle_audit_ready_pre_write_only",
    "A pre-write consistency audit ties dry-run, overwrite protection, day-zero handoff, final rehearsal, authorization preview, and write locks together while keeping writeAllowedNow:false.",
    "Run it before any future real overlay write; it is not write permission and cannot create the real overlay."
  ),
  statusRow(
    "Post-write command pack",
    "future_command_pack_ready",
    "A future post-write command pack is available with strict validation order and failure routes after a real overlay exists.",
    "Do not execute it as proof now; current generated state keeps executionAllowedNow:false and real overlay absent."
  ),
  statusRow(
    "Handoff entrypoint",
    "ready_for_human_reading",
    `${handoff.files.length} files and ${handoff.requiredCommands.length} commands are listed for the first reviewer.`,
    "Open the handoff before worksheet work."
  ),
  statusRow(
    "Worksheet scope",
    "ready_for_source_fit_review",
    `${worksheet.worksheetLessons} lessons across ${worksheet.targetBatches.join(", ")} with ${worksheet.highRiskLessons} high-risk rows first.`,
    "Review high-risk rows before medium or low rows."
  ),
  statusRow(
    "Source-role decisions",
    "needs_human_confirmation",
    `${sourceRoleDecisionTable.sourceFamilyDecisions} source-family roles are pre-sorted; ${sourceRoleDecisionTable.directCandidatesNeedingConfirmation} direct candidates still need confirmation.`,
    "Confirm direct vs boundary-only use before any prose rewrite."
  ),
  statusRow(
    "Direct-candidate confirmation",
    "confirm_or_downgrade_before_sourceFitNotes",
    `${sourceRoleDecisionTable.directCandidatesNeedingConfirmation} direct candidates must be resolved before sourceFitNotes are filled.`,
    "Open the direct-candidate checklist after the source-role table and before the human note starter."
  ),
  statusRow(
    "Human note starter",
    "blank_template_ready",
    `${humanNoteStarterTemplate.lessonCards} cards and ${humanNoteStarterTemplate.blankNoteFields} blank required note fields are available.`,
    "Fill notes only after actual human review work."
  ),
  statusRow(
    "Safe note examples",
    "sample_only_guidance",
    "Safe note examples are available in the dry-run packet as examples only, not real reviewer notes.",
    "Read examples before writing notes, but do not copy them into the real overlay without actual review work."
  ),
  statusRow(
    "Human review start",
    "manual_gate_before_real_overlay",
    "A final human start checklist is available before any real status overlay is created.",
    "Complete the checklist manually before running any explicit write initializer."
  ),
  statusRow(
    "Real overlay creation",
    "blocked_until_explicit_human_decision",
    `creationAllowedNow:${creationChecklist.creationAllowedNow}; real overlay present:${creationChecklist.realStatusOverlayPresent}.`,
    "Run the write initializer only after explicit human note-taking starts."
  ),
  statusRow(
    "Post-write validation",
    "future_gate_ready",
    "A post-write validation playbook is listed for the moment after a human-created real overlay exists.",
    "After explicit write mode, run completion, note lint, curriculum, knowledge, browser, and full verify gates before any separate approval review."
  ),
  statusRow(
    "Real overlay diff audit",
    "prewrite_safe_future_gate_ready",
    "A diff audit is available to compare any future real overlay against the blank first-reviewer template.",
    "Run it after a human-created overlay exists to see filled fields, blank fields, structural mismatches, unsafe wording, and copying-risk wording."
  ),
  statusRow(
    "Note quality lint",
    "future_gate_ready",
    `Real note issues:${noteQualityLint.realNoteIssues}; negative cases passing:${noteQualityLint.negativeCasesPassed}/${noteQualityLint.negativeCases}.`,
    "Run after real notes exist, before ready-for-separate-approval status."
  ),
  statusRow(
    "Completion audit",
    "no_real_ready_batches",
    `readyBatches:${completionAudit.readyBatches}; statusOverlayPresent:${completionAudit.statusOverlayPresent}.`,
    "Do not claim batch readiness until real complete notes pass the audit."
  ),
];

const fileOrder = [
  {
    path: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.md",
    use: "one-page status board and next-action map",
  },
  ...dryRunPacket.requiredFiles,
];

const requiredCommands = [
  "npm.cmd run check:first-reviewer-progress-dashboard",
  ...dryRunPacket.requiredCommands,
];

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  targetBatches: worksheet.targetBatches,
  worksheetLessons: worksheet.worksheetLessons,
  highRiskLessons: worksheet.highRiskLessons,
  sourceFamilyDecisions: sourceRoleDecisionTable.sourceFamilyDecisions,
  directCandidatesToConfirm: humanNoteStarterTemplate.directCandidatesToConfirm,
  blankNoteFields: humanNoteStarterTemplate.blankNoteFields,
  realStatusPath,
  realStatusOverlayPresent,
  creationAllowedNow: creationChecklist.creationAllowedNow,
  realReadyBatches: dryRunPacket.realReadyBatches,
  realNoteIssues: noteQualityLint.realNoteIssues,
  statusBoard,
  fileOrder,
  requiredCommands,
  stopConditions: [
    "Stop if a real status overlay appears without explicit human note-taking.",
    "Stop if any note field is prefilled by generated scaffolding.",
    "Stop if any artifact changes approvalStatus, learnerFacingRelease, productionReady, or lesson grade.",
    "Stop if any rewrite proposes buy/sell/hold advice, trading signals, broker/order workflow, automation, performance claims, or real-money guidance.",
    "Stop if any external source body text is copied into notes or lesson prose.",
    "Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.",
  ],
  sourceReports: paths,
  boundary: "This dashboard is reviewer-facing operations scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  targetBatches: report.targetBatches,
  worksheetLessons: report.worksheetLessons,
  highRiskLessons: report.highRiskLessons,
  sourceFamilyDecisions: report.sourceFamilyDecisions,
  directCandidatesToConfirm: report.directCandidatesToConfirm,
  blankNoteFields: report.blankNoteFields,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  creationAllowedNow: report.creationAllowedNow,
  realReadyBatches: report.realReadyBatches,
  realNoteIssues: report.realNoteIssues,
  outputJson,
  outputMd,
}, null, 2));
