import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const READY_STATUS = "ready_for_separate_human_approval_review";
const realStatusPath = process.env.TRADEGYM_REVIEW_STATUS_PATH || "docs/LESSON_BATCH_REVIEW_STATUS.json";
const defaultOutputJson = "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.json";
const defaultOutputMd = "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.md";
const outputJson = process.env.TRADEGYM_EVIDENCE_INTAKE_JSON || "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.json";
const outputMd = process.env.TRADEGYM_EVIDENCE_INTAKE_MD || "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.md";
const usingDefaultOutput = outputJson === defaultOutputJson && outputMd === defaultOutputMd;
const REQUIRED_NOTE_FIELDS = [
  "originalRewriteNotes",
  "sourceFitNotes",
  "factCheckNotes",
  "boundaryCheckNotes",
  "copyingRiskNotes",
  "humanReviewerInitials",
];

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  printableChecklistPack: "docs/FIRST_REVIEWER_PRINTABLE_CHECKLIST_PACK.json",
  directCandidateChecklist: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_CONFIRMATION_CHECKLIST.json",
  noteQualityLint: "docs/REVIEWER_NOTE_QUALITY_LINT.json",
  completionAudit: process.env.TRADEGYM_BATCH_COMPLETION_AUDIT_JSON || "docs/LESSON_BATCH_COMPLETION_AUDIT.json",
  realOverlayDiffAudit: "docs/FIRST_REVIEWER_REAL_OVERLAY_DIFF_AUDIT.json",
};

function fail(message) {
  throw new Error(message);
}

async function readJson(path, optional = false) {
  try {
    return JSON.parse(await fs.readFile(path, "utf8"));
  } catch (error) {
    if (optional && error.code === "ENOENT") return null;
    throw error;
  }
}

function assertEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function overlayCards(overlay) {
  if (!overlay) return [];
  assertEnvelope(overlay, "real status overlay");
  if (overlay.sampleOnly === true) fail("real status overlay cannot be sampleOnly");
  const rows = [];
  for (const batch of overlay.batches || []) {
    assertEnvelope(batch, `real status overlay ${batch.batchId}`);
    if (batch.sampleOnly === true) fail(`${batch.batchId} cannot be sampleOnly`);
    for (const card of batch.lessonCards || []) {
      rows.push({
        batchId: batch.batchId,
        batchReviewStatus: batch.reviewStatus || "not_started",
        ...card,
      });
    }
  }
  return rows;
}

function markdown(report) {
  return [
    "# First Reviewer Evidence Intake Summary",
    "",
    "This report summarizes future real reviewer-note intake for the first two review batches.",
    "It is not approval, learner-facing release, production readiness, or lesson promotion.",
    "",
    "## Summary",
    "",
    `- Intake ready: ${report.intakeReady}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Lesson cards expected: ${report.lessonCardsExpected}`,
    `- Overlay lesson cards found: ${report.overlayLessonCardsFound}`,
    `- Complete note cards: ${report.completeNoteCards}`,
    `- Incomplete note cards: ${report.incompleteNoteCards}`,
    `- Ready-for-separate-approval candidates: ${report.readyForSeparateApprovalCandidates}`,
    `- Blocked candidates: ${report.blockedCandidates}`,
    `- Direct candidates unresolved: ${report.directCandidatesUnresolved}`,
    `- Real note issues: ${report.realNoteIssues}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Candidate Rows",
    "",
    "| Batch | Lesson | Status | Notes | Direct candidates | Intake decision |",
    "| --- | --- | --- | --- | --- | --- |",
    ...(report.lessonRows.length
      ? report.lessonRows.map((row) => `| ${row.batchId} | ${row.lessonId} | ${row.trackingStatus} | ${row.filledNoteFields}/${row.requiredNoteFields} | ${row.directCandidateFamilies.join(", ") || "none"} | ${row.intakeDecision} |`)
      : ["| none | none | pre_write | 0/0 | none | no_real_overlay |"]),
    "",
    "## Blockers",
    "",
    ...(report.blockerRows.length ? report.blockerRows.map((row) => `- ${row.lessonId}: ${row.blockers.join("; ")}`) : ["- No real overlay exists, so no lesson can be accepted for separate approval review."]),
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
  printableChecklistPack,
  directCandidateChecklist,
  noteQualityLint,
  completionAudit,
  realOverlayDiffAudit,
  realOverlay,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.printableChecklistPack),
  readJson(paths.directCandidateChecklist),
  readJson(paths.noteQualityLint),
  readJson(paths.completionAudit),
  readJson(paths.realOverlayDiffAudit),
  readJson(realStatusPath, true),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  printableChecklistPack,
  directCandidateChecklist,
  noteQualityLint,
  completionAudit,
  realOverlayDiffAudit,
})) {
  assertEnvelope(record, label);
}

if (usingDefaultOutput) {
  if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include evidence intake summary file");
  if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-evidence-intake-summary")) fail("dry-run packet must include evidence intake summary command");
  if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include evidence intake summary file");
  if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-evidence-intake-summary")) fail("progress dashboard must include evidence intake summary command");
  if (!progressDashboard.statusBoard.some((row) => row.name === "Evidence intake summary" && row.status === "future_real_notes_intake_ready")) fail("progress dashboard must include evidence intake summary status");
  if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to evidence intake summary");
}

if (printableChecklistPack.lessonChecklists !== 12 || printableChecklistPack.noteFieldCheckboxes !== 72) fail("printable checklist pack must cover 12 lessons and 72 fields");
if (directCandidateChecklist.directCandidates !== 5 || directCandidateChecklist.nonGreenRefs !== 0) fail("direct candidates must remain green-only");
if (noteQualityLint.realNoteIssues !== 0) fail("real note quality lint must have zero current issues");
if (realOverlayDiffAudit.unsafeTextIssues !== 0 || realOverlayDiffAudit.copyRiskIssues !== 0 || realOverlayDiffAudit.structuralIssues !== 0) fail("real overlay diff audit must have zero issues");

const realStatusOverlayPresent = Boolean(realOverlay);
const overlayRows = overlayCards(realOverlay);
const checklistByLesson = new Map(printableChecklistPack.cards.map((card) => [card.lessonId, card]));
const directByLesson = new Map();
for (const row of directCandidateChecklist.rows) {
  if (!directByLesson.has(row.lessonId)) directByLesson.set(row.lessonId, []);
  directByLesson.get(row.lessonId).push(row);
}

const lessonRows = [];
const blockerRows = [];
let completeNoteCards = 0;
let readyForSeparateApprovalCandidates = 0;

for (const card of overlayRows) {
  const checklist = checklistByLesson.get(card.lessonId);
  const blockers = [];
  if (!checklist) blockers.push("lesson is not in the first-reviewer printable checklist pack");
  if (card.mustRemainStructuralDraft !== true) blockers.push("mustRemainStructuralDraft is not true");
  if ("currentGrade" in card && card.currentGrade !== "structural_draft") blockers.push("currentGrade is not structural_draft");
  if ("approvalStatus" in card && card.approvalStatus !== "not_approved") blockers.push("approvalStatus is not not_approved");
  if ("learnerFacingRelease" in card && card.learnerFacingRelease !== false) blockers.push("learnerFacingRelease is not false");
  if ("productionReady" in card && card.productionReady !== false) blockers.push("productionReady is not false");
  const filledFields = REQUIRED_NOTE_FIELDS.filter((field) => hasText(card[field]));
  const missingFields = REQUIRED_NOTE_FIELDS.filter((field) => !hasText(card[field]));
  if (missingFields.length) blockers.push(`missing notes: ${missingFields.join(", ")}`);
  const directRows = directByLesson.get(card.lessonId) || [];
  if (directRows.length && !hasText(card.sourceFitNotes)) blockers.push("direct candidates require sourceFitNotes confirmation or downgrade");
  const trackingStatus = card.trackingStatus || "not_started";
  const complete = blockers.length === 0 && filledFields.length === REQUIRED_NOTE_FIELDS.length;
  const candidate = complete && (trackingStatus === READY_STATUS || card.batchReviewStatus === READY_STATUS);
  if (complete) completeNoteCards += 1;
  if (candidate) readyForSeparateApprovalCandidates += 1;
  const row = {
    batchId: card.batchId,
    lessonId: card.lessonId,
    trackingStatus,
    requiredNoteFields: REQUIRED_NOTE_FIELDS.length,
    filledNoteFields: filledFields.length,
    missingNoteFields: missingFields,
    directCandidateFamilies: directRows.map((item) => item.family),
    blockers,
    intakeDecision: candidate ? "candidate_for_separate_human_approval_review" : "blocked_or_not_ready",
  };
  lessonRows.push(row);
  if (blockers.length) blockerRows.push({ lessonId: card.lessonId, blockers });
}

if (!realStatusOverlayPresent && (completeNoteCards !== 0 || readyForSeparateApprovalCandidates !== 0 || overlayRows.length !== 0)) {
  fail("pre-write intake summary cannot have real candidates");
}
if (readyForSeparateApprovalCandidates > completionAudit.readyBatches * 6) {
  fail("intake candidates cannot exceed completion audit ready batch capacity");
}

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  intakeReady: true,
  realStatusPath,
  realStatusOverlayPresent,
  targetBatches: printableChecklistPack.targetBatches,
  lessonCardsExpected: printableChecklistPack.lessonChecklists,
  overlayLessonCardsFound: overlayRows.length,
  completeNoteCards,
  incompleteNoteCards: overlayRows.length - completeNoteCards,
  readyForSeparateApprovalCandidates,
  blockedCandidates: overlayRows.length - readyForSeparateApprovalCandidates,
  directCandidatesUnresolved: realStatusOverlayPresent ? blockerRows.filter((row) => row.blockers.some((blocker) => blocker.includes("direct candidates"))).length : directCandidateChecklist.directCandidates,
  realNoteIssues: noteQualityLint.realNoteIssues,
  completionReadyBatches: completionAudit.readyBatches,
  diffAuditExecutableNow: realOverlayDiffAudit.auditExecutableNow,
  lessonRows,
  blockerRows,
  sourceReports: paths,
  boundary: "This intake summary only organizes future real reviewer evidence after a human-created status overlay exists. It does not create notes, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  intakeReady: report.intakeReady,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  lessonCardsExpected: report.lessonCardsExpected,
  overlayLessonCardsFound: report.overlayLessonCardsFound,
  completeNoteCards: report.completeNoteCards,
  readyForSeparateApprovalCandidates: report.readyForSeparateApprovalCandidates,
  blockedCandidates: report.blockedCandidates,
  directCandidatesUnresolved: report.directCandidatesUnresolved,
  outputJson,
  outputMd,
}, null, 2));
