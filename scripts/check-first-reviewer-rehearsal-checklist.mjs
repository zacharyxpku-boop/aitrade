import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_REHEARSAL_CHECKLIST.json";
const outputMd = "docs/FIRST_REVIEWER_REHEARSAL_CHECKLIST.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  launchReadinessDashboard: "docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.json",
  noteReadinessMatrix: "docs/FIRST_REVIEWER_NOTE_READINESS_MATRIX.json",
  directCandidateChecklist: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_CONFIRMATION_CHECKLIST.json",
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

function byLesson(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const existing = grouped.get(row.lessonId) || {
      batchId: row.batchId,
      lessonId: row.lessonId,
      riskLevel: row.riskLevel,
      noteFields: [],
      roleHintFamilies: new Set(),
      directCandidateFamilies: new Set(),
    };
    existing.noteFields.push(row.field);
    for (const family of row.roleHintFamilies || []) existing.roleHintFamilies.add(family);
    for (const family of row.directCandidatesToConfirm || []) existing.directCandidateFamilies.add(family);
    grouped.set(row.lessonId, existing);
  }
  return [...grouped.values()].map((row) => ({
    ...row,
    noteFields: [...new Set(row.noteFields)].sort(),
    noteFieldCount: new Set(row.noteFields).size,
    roleHintFamilies: [...row.roleHintFamilies].sort(),
    directCandidateFamilies: [...row.directCandidateFamilies].sort(),
    rehearsalSequence: [
      "Open worksheet row and confirm lesson remains structural_draft.",
      "Resolve direct candidates or downgrade them before sourceFitNotes.",
      "Fill originalRewriteNotes only after human rewrite-angle review.",
      "Fill sourceFitNotes only after source-family roles are human-confirmed.",
      "Fill factCheckNotes with checked claims and unresolved claims to remove.",
      "Fill boundaryCheckNotes after no advice, signal, performance, broker, automation, production, or real-money wording is confirmed.",
      "Fill copyingRiskNotes after checking no copied external source body text.",
      "Add humanReviewerInitials only after the real review work is complete.",
    ],
    currentStatus: "rehearsal_only_not_real_review",
  }));
}

function markdown(report) {
  return [
    "# First Reviewer Rehearsal Checklist",
    "",
    "This checklist turns the first reviewer packet into a rehearsal runbook before real notes are written.",
    "It is not a status overlay, real reviewer evidence, approval, learner-facing release, commercial readiness, or production readiness.",
    "",
    "## Summary",
    "",
    `- Rehearsal ready: ${report.rehearsalReady}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Lesson rehearsal cards: ${report.lessonRehearsalCards}`,
    `- Note fields rehearsed: ${report.noteFieldsRehearsed}`,
    `- Direct candidates rehearsed: ${report.directCandidatesRehearsed}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Complete note cards: ${report.completeNoteCards}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Internal trial ready: ${report.internalTrialReady}`,
    `- Launch ready: ${report.launchReady}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Lesson Cards",
    "",
    "| Batch | Lesson | Risk | Note fields | Direct families | Status |",
    "| --- | --- | --- | --- | --- | --- |",
    ...report.lessonRows.map((row) => `| ${row.batchId} | ${row.lessonId} | ${row.riskLevel} | ${row.noteFieldCount} | ${row.directCandidateFamilies.join(", ") || "none"} | ${row.currentStatus} |`),
    "",
    "## Rehearsal Steps",
    "",
    ...report.rehearsalSteps.map((step, index) => `${index + 1}. ${step}`),
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
  launchReadinessDashboard,
  noteReadinessMatrix,
  directCandidateChecklist,
  evidenceIntakeSummary,
  separateApprovalGate,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.launchReadinessDashboard),
  readJson(paths.noteReadinessMatrix),
  readJson(paths.directCandidateChecklist),
  readJson(paths.evidenceIntakeSummary),
  readJson(paths.separateApprovalGate),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  launchReadinessDashboard,
  noteReadinessMatrix,
  directCandidateChecklist,
  evidenceIntakeSummary,
  separateApprovalGate,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; rehearsal checklist must stay pre-write`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include rehearsal checklist file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-rehearsal-checklist")) fail("dry-run packet must include rehearsal checklist command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include rehearsal checklist file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-rehearsal-checklist")) fail("progress dashboard must include rehearsal checklist command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Rehearsal checklist" && row.status === "rehearsal_ready_not_review")) fail("progress dashboard must include rehearsal checklist status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to rehearsal checklist");

if (launchReadinessDashboard.internalTrialReady !== false || launchReadinessDashboard.launchReady !== false) fail("launch readiness dashboard must keep trial and launch readiness false");
if (launchReadinessDashboard.completeNoteCards !== 0 || launchReadinessDashboard.approvalReviewCandidates !== 0) fail("launch readiness dashboard must show no complete notes or approval candidates");
if (noteReadinessMatrix.lessonCards !== 12 || noteReadinessMatrix.matrixRows !== 72) fail("note readiness matrix must cover 12 lesson cards and 72 note fields");
if (noteReadinessMatrix.blankNoteFields !== 72 || noteReadinessMatrix.prefilledNoteFields !== 0) fail("note readiness matrix must keep all note fields blank");
if (noteReadinessMatrix.creationAllowedNow !== false || noteReadinessMatrix.realStatusOverlayPresent !== false) fail("note readiness matrix must keep creation blocked and real overlay absent");
if (directCandidateChecklist.directCandidates !== 5 || directCandidateChecklist.nonGreenRefs !== 0) fail("direct-candidate checklist must keep 5 green-only candidates");
if (evidenceIntakeSummary.completeNoteCards !== 0 || evidenceIntakeSummary.readyForSeparateApprovalCandidates !== 0) fail("evidence intake must stay empty before real notes");
if (separateApprovalGate.approvalReviewCandidates !== 0 || separateApprovalGate.autoApprovedLessons !== 0) fail("separate approval gate must stay empty before real notes");

for (const row of noteReadinessMatrix.rows) {
  if (row.status !== "blocked_until_real_human_review") fail(`${row.lessonId}/${row.field} must stay blocked until real human review`);
  const disallowedText = (row.disallowedNoteContent || []).join(" ").toLowerCase();
  if (!disallowedText.includes("buy/sell/hold") || !disallowedText.includes("copied external source body text")) fail(`${row.lessonId}/${row.field} must carry trading and copying-risk disallowed content`);
}

for (const row of directCandidateChecklist.rows) {
  if (row.confirmationStatus !== "needs_human_confirmation_or_downgrade") fail(`${row.lessonId}/${row.family} must require human confirmation or downgrade`);
  if (row.mustRemainStructuralDraft !== true || row.learnerFacingUseAllowedNow !== false) fail(`${row.lessonId}/${row.family} must remain structural draft and not learner-facing`);
  for (const ref of row.sourceRefs || []) {
    if (ref.sourceUseTier !== "green_official_public_domain" && ref.sourceUseTier !== "green_public_domain_classic") fail(`${row.lessonId}/${row.family} has non-green source ref`);
  }
}

const lessonRows = byLesson(noteReadinessMatrix.rows);
if (lessonRows.length !== 12) fail("rehearsal checklist must create 12 lesson rehearsal cards");
if (lessonRows.some((row) => row.noteFieldCount !== 6)) fail("each lesson rehearsal card must cover 6 required note fields");

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  rehearsalReady: true,
  rehearsalMode: "pre_write_human_rehearsal_only",
  targetBatches: noteReadinessMatrix.targetBatches,
  realStatusPath,
  realStatusOverlayPresent,
  lessonRehearsalCards: lessonRows.length,
  noteFieldsRehearsed: noteReadinessMatrix.matrixRows,
  directCandidatesRehearsed: directCandidateChecklist.directCandidates,
  completeNoteCards: evidenceIntakeSummary.completeNoteCards,
  approvalReviewCandidates: separateApprovalGate.approvalReviewCandidates,
  internalTrialReady: false,
  launchReady: false,
  lessonRows,
  rehearsalSteps: [
    "Open the human execution bundle and confirm this is a rehearsal-only pass.",
    "Open the worksheet and rehearse the 12 lesson cards without writing real notes.",
    "Resolve the 5 direct-candidate decisions on paper as confirm, downgrade, or still blocked.",
    "Walk each lesson through the six required note fields without filling the real overlay.",
    "Check every field against no advice, no signal, no performance, no broker, no automation, no production, no real-money, and no copied source text.",
    "Confirm that no lesson is marked approved, learner-facing, commercial_ready, launch-ready, or production-ready.",
    "Use the launch readiness dashboard as the blocker map after rehearsal; do not treat rehearsal as evidence intake.",
  ],
  stopConditions: [
    "Stop if a real status overlay appears during rehearsal.",
    "Stop if any generated prompt, sample, or rehearsal text is copied as real reviewer evidence.",
    "Stop if any direct candidate is treated as approved direct evidence before human confirmation.",
    "Stop if any note claims approval, learner-facing readiness, launch readiness, commercial readiness, or production readiness.",
    "Stop if any note contains buy/sell/hold advice, signals, returns, win-rate, profitability, broker/order workflow, automation, or real-money guidance.",
    "Stop if any external source body text is copied into notes or lesson prose.",
  ],
  sourceReports: paths,
  boundary: "This rehearsal checklist is a pre-write human operations runbook only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  rehearsalReady: report.rehearsalReady,
  rehearsalMode: report.rehearsalMode,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  lessonRehearsalCards: report.lessonRehearsalCards,
  noteFieldsRehearsed: report.noteFieldsRehearsed,
  directCandidatesRehearsed: report.directCandidatesRehearsed,
  completeNoteCards: report.completeNoteCards,
  approvalReviewCandidates: report.approvalReviewCandidates,
  internalTrialReady: report.internalTrialReady,
  launchReady: report.launchReady,
  outputJson,
  outputMd,
}, null, 2));
