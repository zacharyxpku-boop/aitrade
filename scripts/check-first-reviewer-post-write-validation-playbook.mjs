import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_PLAYBOOK.json";
const outputMd = "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_PLAYBOOK.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanReviewStartChecklist: "docs/FIRST_REVIEWER_HUMAN_REVIEW_START_CHECKLIST.json",
  creationChecklist: "docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.json",
  noteReadinessMatrix: "docs/FIRST_REVIEWER_NOTE_READINESS_MATRIX.json",
  directCandidateChecklist: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_CONFIRMATION_CHECKLIST.json",
  noteQualityLint: "docs/REVIEWER_NOTE_QUALITY_LINT.json",
  completionAudit: "docs/LESSON_BATCH_COMPLETION_AUDIT.json",
  gateSummary: "docs/REVIEW_STATUS_GATE_SUMMARY.json",
  initProtection: "docs/LESSON_BATCH_REVIEW_STATUS_INIT_PROTECTION.json",
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

function sequenceStep(order, command, purpose, stopIfFails) {
  return { order, command, purpose, stopIfFails };
}

function failureRow(trigger, requiredResponse) {
  return { trigger, requiredResponse };
}

function markdown(report) {
  return [
    "# First Reviewer Post-Write Validation Playbook",
    "",
    "This playbook defines what to run after a human reviewer intentionally creates the real reviewer status overlay.",
    "It is not a write command, approval, publication gate, lesson promotion, or learner-facing artifact.",
    "",
    "## Summary",
    "",
    `- Playbook ready: ${report.postWritePlaybookReady}`,
    `- Execution allowed now: ${report.executionAllowedNow}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Blank note fields before write: ${report.blankNoteFieldsBeforeWrite}`,
    `- Direct candidates to resolve: ${report.directCandidatesToResolve}`,
    `- Real ready batches now: ${report.realReadyBatchesNow}`,
    `- Real note issues now: ${report.realNoteIssuesNow}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Pre-Write Gate",
    "",
    ...report.preWriteGate.map((row) => `- ${row}`),
    "",
    "## Validation Sequence",
    "",
    ...report.validationSequence.map((step) => `${step.order}. \`${step.command}\` - ${step.purpose} Stop if fails: ${step.stopIfFails}`),
    "",
    "## Failure Handling",
    "",
    ...report.failureHandling.map((row) => `- ${row.trigger}: ${row.requiredResponse}`),
    "",
    "## Forbidden Recovery Actions",
    "",
    ...report.forbiddenRecoveryActions.map((action) => `- ${action}`),
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
  humanReviewStartChecklist,
  creationChecklist,
  noteReadinessMatrix,
  directCandidateChecklist,
  noteQualityLint,
  completionAudit,
  gateSummary,
  initProtection,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanReviewStartChecklist),
  readJson(paths.creationChecklist),
  readJson(paths.noteReadinessMatrix),
  readJson(paths.directCandidateChecklist),
  readJson(paths.noteQualityLint),
  readJson(paths.completionAudit),
  readJson(paths.gateSummary),
  readJson(paths.initProtection),
  exists(realStatusPath),
]);

for (const [label, report] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanReviewStartChecklist,
  creationChecklist,
  noteReadinessMatrix,
  directCandidateChecklist,
  noteQualityLint,
  completionAudit,
  gateSummary,
  initProtection,
})) {
  assertEnvelope(report, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} exists; this playbook must be generated before post-write execution`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include the post-write validation playbook file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-post-write-validation-playbook")) fail("dry-run packet must include the post-write validation playbook command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include the post-write validation playbook file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-post-write-validation-playbook")) fail("progress dashboard must include the post-write validation playbook command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Post-write validation" && row.status === "future_gate_ready")) fail("progress dashboard must include post-write validation status");
if (humanReviewStartChecklist.startAllowedNow !== false || humanReviewStartChecklist.realStatusOverlayPresent !== false) fail("human review start must remain blocked before explicit human action");
if (creationChecklist.creationAllowedNow !== false || creationChecklist.realStatusOverlayPresent !== false) fail("creation checklist must keep creation blocked");
if (noteReadinessMatrix.prefilledNoteFields !== 0 || noteReadinessMatrix.blankNoteFields !== 72) fail("note readiness matrix must keep all required notes blank");
if (directCandidateChecklist.directCandidates !== 5 || directCandidateChecklist.nonGreenRefs !== 0) fail("direct candidates must remain green-only and unresolved");
if (noteQualityLint.realStatusOverlayPresent !== false || noteQualityLint.realNoteIssues !== 0) fail("note lint must show no real notes before write");
if (completionAudit.statusOverlayPresent !== false || completionAudit.readyBatches !== 0) fail("completion audit must show no real ready batches before write");
if (gateSummary.realStatusOverlayPresent !== false || gateSummary.realReadyBatches !== 0) fail("gate summary must show no real ready batches before write");
if (initProtection.realStatusOverlayTouched !== false || initProtection.passedCases !== initProtection.protectionCases) fail("init protection must pass and leave real overlay untouched");

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  postWritePlaybookReady: true,
  executionAllowedNow: false,
  executionBlockedBy: [
    `${realStatusPath} is absent, so post-write validation is not executable yet.`,
    "A human reviewer must complete the manual start checklist and intentionally create the real overlay before this sequence is used.",
  ],
  realStatusPath,
  realStatusOverlayPresent,
  targetBatches: dryRunPacket.targetBatches,
  blankNoteFieldsBeforeWrite: noteReadinessMatrix.blankNoteFields,
  directCandidatesToResolve: directCandidateChecklist.directCandidates,
  realReadyBatchesNow: completionAudit.readyBatches,
  realNoteIssuesNow: noteQualityLint.realNoteIssues,
  preWriteGate: [
    "Human review start checklist reports startAllowedNow:false until manual confirmation is performed.",
    "Real overlay creation checklist reports creationAllowedNow:false until an explicit human note-taking decision.",
    "All first-reviewer note fields remain blank before write; sample-only examples are not real notes.",
    "Direct-candidate source rows must be confirmed or downgraded before sourceFitNotes are filled.",
    "Current completion audit and gate summary show 0 real ready batches.",
  ],
  validationSequence: [
    sequenceStep(1, "npm.cmd run check:first-reviewer-human-review-start-checklist", "Reconfirm the manual pre-start gate before any write path.", true),
    sequenceStep(2, "npm.cmd run init:first-reviewer-status-overlay:dry-run", "Preview the real overlay scaffold without writing it.", true),
    sequenceStep(3, "npm.cmd run init:first-reviewer-status-overlay:write", "Run only after explicit human review starts; creates blank real note fields.", true),
    sequenceStep(4, "npm.cmd run check:lesson-batch-completion", "Validate real batch status shape and required-note completeness.", true),
    sequenceStep(5, "npm.cmd run check:first-reviewer-real-overlay-diff-audit", "Compare the real overlay against the blank first-reviewer template for field-level changes and unsafe text risks.", true),
    sequenceStep(6, "npm.cmd run check:reviewer-note-quality-lint", "Reject generic, placeholder, approving, trading, readiness, broker/order, automation, performance, or real-money wording.", true),
    sequenceStep(7, "npm.cmd run check:first-reviewer-direct-candidate-confirmation-checklist", "Recheck direct-candidate source roles remain green-only and require human confirmation or downgrade.", true),
    sequenceStep(8, "npm.cmd run check:first-reviewer-safe-note-examples", "Confirm sample-only examples remain separate from real reviewer notes.", true),
    sequenceStep(9, "npm.cmd run check:curriculum-review", "Run the complete curriculum/reviewer gate chain.", true),
    sequenceStep(10, "npm.cmd run check:knowledge-base", "Recheck knowledge-base and green grounding boundaries.", true),
    sequenceStep(11, "npm.cmd run check:knowledge-browser", "Recheck learner-facing browser candidates remain safe and review-tracked.", true),
    sequenceStep(12, "temporary SQLite npm.cmd run verify", "Run full repo verification with TRADEGYM_SQLITE_PATH set to a temp file and clean it afterward.", true),
  ],
  failureHandling: [
    failureRow("Missing required reviewer notes", "Keep the batch not_started or in_progress; fill only after actual human review work, then rerun completion and lint."),
    failureRow("Reviewer note quality lint fails", "Edit the real notes to be specific, factual, non-approving, and safety-bound; do not mark any batch ready."),
    failureRow("Unsafe wording appears", "Remove advice, signals, performance, broker/order, automation, or real-money wording and rerun the lint before any next gate."),
    failureRow("Source fit is unresolved", "Downgrade the source role to boundary-only, metadata-only, historical context, macro/data context, or unsuitable in the note; do not use it as direct lesson evidence."),
    failureRow("Real overlay exists unexpectedly", "Stop and preserve the file; do not overwrite, delete, or force-recreate it without explicit user authorization and note preservation."),
    failureRow("Curriculum review fails", "Do not promote, publish, or approve; fix the failing gate while preserving education-only and source-boundary rules."),
  ],
  forbiddenRecoveryActions: [
    "Do not delete, overwrite, or force-recreate real reviewer notes as a shortcut.",
    "Do not copy sample-only notes into the real overlay as review evidence.",
    "Do not mark generated lessons commercial_ready.",
    "Do not set learnerFacingRelease:true.",
    "Do not set productionReady:true.",
    "Do not relax green/yellow/red or research_only source boundaries.",
    "Do not add buy/sell/hold advice, trading signals, broker/order workflows, automation, performance claims, or real-money guidance.",
  ],
  sourceReports: paths,
  boundary: "This playbook is a future post-write validation gate only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  postWritePlaybookReady: report.postWritePlaybookReady,
  executionAllowedNow: report.executionAllowedNow,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  targetBatches: report.targetBatches,
  validationSteps: report.validationSequence.length,
  failureHandlingRows: report.failureHandling.length,
  outputJson,
  outputMd,
}, null, 2));
