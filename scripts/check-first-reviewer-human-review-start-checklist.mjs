import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_HUMAN_REVIEW_START_CHECKLIST.json";
const outputMd = "docs/FIRST_REVIEWER_HUMAN_REVIEW_START_CHECKLIST.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  creationChecklist: "docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.json",
  noteReadinessMatrix: "docs/FIRST_REVIEWER_NOTE_READINESS_MATRIX.json",
  directCandidateChecklist: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_CONFIRMATION_CHECKLIST.json",
  safeNoteExamples: "docs/FIRST_REVIEWER_SAFE_NOTE_EXAMPLES.json",
  statusInitProtection: "docs/LESSON_BATCH_REVIEW_STATUS_INIT_PROTECTION.json",
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

function item(id, label, evidence, manualAction) {
  return {
    id,
    label,
    status: "manual_required",
    evidence,
    manualAction,
  };
}

function markdown(report) {
  return [
    "# First Reviewer Human Review Start Checklist",
    "",
    "This is the final printable checklist before a human reviewer creates the real reviewer status overlay.",
    "It does not create the overlay, fill notes, approve lessons, publish content, or change grades.",
    "",
    "## Summary",
    "",
    `- Start allowed now: ${report.startAllowedNow}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Lesson cards: ${report.lessonCards}`,
    `- Blank note fields: ${report.blankNoteFields}`,
    `- Direct candidates to resolve: ${report.directCandidatesToConfirm}`,
    `- Manual checklist items: ${report.manualChecklistItems.length}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Manual Checklist",
    "",
    ...report.manualChecklistItems.map((row) => `- [ ] ${row.label} Evidence: ${row.evidence} Action: ${row.manualAction}`),
    "",
    "## Commands",
    "",
    `- Preview only: \`${report.previewCommand}\``,
    `- Write only after all boxes above are manually checked: \`${report.writeCommandAfterManualApproval}\``,
    `- Post-write validation: \`${report.postWriteValidationCommand}\``,
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
  creationChecklist,
  noteReadinessMatrix,
  directCandidateChecklist,
  safeNoteExamples,
  statusInitProtection,
  noteQualityLint,
  completionAudit,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.creationChecklist),
  readJson(paths.noteReadinessMatrix),
  readJson(paths.directCandidateChecklist),
  readJson(paths.safeNoteExamples),
  readJson(paths.statusInitProtection),
  readJson(paths.noteQualityLint),
  readJson(paths.completionAudit),
  exists(realStatusPath),
]);

for (const [label, report] of Object.entries({
  dryRunPacket,
  progressDashboard,
  creationChecklist,
  noteReadinessMatrix,
  directCandidateChecklist,
  safeNoteExamples,
  statusInitProtection,
  noteQualityLint,
  completionAudit,
})) {
  assertEnvelope(report, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; start checklist must not run after real note-taking has started`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include the human review start checklist file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-human-review-start-checklist")) fail("dry-run packet must include the human review start checklist command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include the human review start checklist file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-human-review-start-checklist")) fail("progress dashboard must include the human review start checklist command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Human review start" && row.status === "manual_gate_before_real_overlay")) fail("progress dashboard must include human review start status");
if (creationChecklist.creationAllowedNow !== false || creationChecklist.realStatusOverlayPresent !== false) fail("creation checklist must keep real overlay creation blocked");
if (noteReadinessMatrix.prefilledNoteFields !== 0 || noteReadinessMatrix.blankNoteFields !== 72) fail("note readiness matrix must keep all first-reviewer note fields blank");
if (directCandidateChecklist.directCandidates !== 5 || directCandidateChecklist.nonGreenRefs !== 0) fail("direct-candidate checklist must keep 5 green-only candidate rows");
if (safeNoteExamples.sampleOnly !== true || safeNoteExamples.realStatusOverlayPresent !== false) fail("safe note examples must remain sample-only with no real overlay");
if (statusInitProtection.passedCases !== statusInitProtection.protectionCases || statusInitProtection.realStatusOverlayTouched !== false) fail("status init protection must pass without touching real overlay");
if (noteQualityLint.realStatusOverlayPresent !== false || noteQualityLint.realNoteIssues !== 0) fail("note quality lint must show no real notes");
if (completionAudit.statusOverlayPresent !== false || completionAudit.readyBatches !== 0) fail("completion audit must show no real ready batches");

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  startAllowedNow: false,
  startBlockedBy: [
    "This repository cannot prove an explicit human decision to begin real note-taking.",
    "Manual checklist boxes must be completed outside generated scaffolding before write mode is used.",
  ],
  realStatusPath,
  realStatusOverlayPresent,
  targetBatches: dryRunPacket.targetBatches,
  lessonCards: noteReadinessMatrix.lessonCards,
  blankNoteFields: noteReadinessMatrix.blankNoteFields,
  directCandidatesToConfirm: directCandidateChecklist.directCandidates,
  manualChecklistItems: [
    item("reviewer_named", "A human reviewer is identified and ready to record real notes.", "No generated artifact can prove this.", "Write reviewer identity outside this generated checklist before creating the overlay."),
    item("scope_confirmed", "The reviewer confirms the scope is only rewrite_batch_01 and rewrite_batch_05.", `${dryRunPacket.targetBatches.join(", ")} are the current target batches.`, "Do not expand scope during first real note-taking."),
    item("direct_candidates_resolved", "The reviewer has read the 5 direct-candidate source rows and will confirm or downgrade them before sourceFitNotes.", `${directCandidateChecklist.directCandidates} candidates and ${directCandidateChecklist.sourceRefsToInspect} source refs are queued.`, "Resolve source roles before filling sourceFitNotes."),
    item("notes_start_blank", "The reviewer confirms all 72 required note fields start blank.", `${noteReadinessMatrix.blankNoteFields} blank fields and ${noteReadinessMatrix.prefilledNoteFields} prefilled fields.`, "Do not paste generated examples into real notes."),
    item("safe_examples_understood", "The reviewer understands safe examples are sample-only guidance.", `${safeNoteExamples.safeExamples.length} safe examples and ${safeNoteExamples.rejectedExampleCategories.length} rejected categories are available.`, "Use examples as style guidance only, not as real review evidence."),
    item("boundary_accepted", "The reviewer accepts education-only and non-production boundaries.", "All checked artifacts keep approvalStatus:not_approved, learnerFacingRelease:false, and productionReady:false.", "Stop if any note suggests advice, signal, performance, broker/order, automation, or real-money guidance."),
    item("write_command_intentional", "The reviewer intentionally chooses whether to run the write initializer.", `Preview command is ${creationChecklist.dryRunCommand}; write command is ${creationChecklist.allowedCreationCommand}.`, "Run write mode only after all manual boxes are checked."),
  ],
  previewCommand: "npm.cmd run init:first-reviewer-status-overlay:dry-run",
  writeCommandAfterManualApproval: "npm.cmd run init:first-reviewer-status-overlay:write",
  postWriteValidationCommand: "npm.cmd run check:lesson-batch-completion && npm.cmd run check:reviewer-note-quality-lint && npm.cmd run check:curriculum-review",
  sourceReports: paths,
  stopConditions: [
    `Stop if ${realStatusPath} already exists; preserve existing notes before any force path.`,
    "Stop if a human reviewer is not explicitly ready to record real notes.",
    "Stop if direct candidates have not been reviewed for confirm-or-downgrade source fit.",
    "Stop if any generated sample note is copied into the real overlay as evidence.",
    "Stop if any note proposes advice, signals, broker/order workflow, automation, performance, or real-money guidance.",
    "Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.",
  ],
  boundary: "This checklist is a manual pre-start gate only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  startAllowedNow: report.startAllowedNow,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  targetBatches: report.targetBatches,
  lessonCards: report.lessonCards,
  blankNoteFields: report.blankNoteFields,
  directCandidatesToConfirm: report.directCandidatesToConfirm,
  manualChecklistItems: report.manualChecklistItems.length,
  outputJson,
  outputMd,
}, null, 2));
