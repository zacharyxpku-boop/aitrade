import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_PRINTABLE_CHECKLIST_PACK.json";
const outputMd = "docs/FIRST_REVIEWER_PRINTABLE_CHECKLIST_PACK.md";
const REQUIRED_FIELDS = [
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
  worksheet: "docs/FIRST_REVIEWER_WORKSHEET.json",
  noteReadinessMatrix: "docs/FIRST_REVIEWER_NOTE_READINESS_MATRIX.json",
  sourceRoleDecisionTable: "docs/FIRST_REVIEWER_SOURCE_ROLE_DECISION_TABLE.json",
  directCandidateChecklist: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_CONFIRMATION_CHECKLIST.json",
  safeNoteExamples: "docs/FIRST_REVIEWER_SAFE_NOTE_EXAMPLES.json",
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

function flattenLessons(worksheet) {
  return worksheet.batchWorksheets.flatMap((batch) => batch.lessons.map((lesson) => ({
    ...lesson,
    batchId: batch.batchId,
  })));
}

function markdown(report) {
  const lines = [
    "# First Reviewer Printable Checklist Pack",
    "",
    "This pack is for printing or manual checkbox review of the first reviewer lesson set.",
    "It is not completed review, approval, learner-facing release, production readiness, or lesson promotion.",
    "",
    "## Summary",
    "",
    `- Pack ready: ${report.packReady}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Lesson checklists: ${report.lessonChecklists}`,
    `- High-risk lessons: ${report.highRiskLessons}`,
    `- Note field checkboxes: ${report.noteFieldCheckboxes}`,
    `- Direct candidates to resolve: ${report.directCandidatesToConfirm}`,
    `- Source refs to inspect: ${report.sourceRefsToInspect}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Global Review Boxes",
    "",
    ...report.globalReviewBoxes.map((box) => `- [ ] ${box}`),
    "",
  ];

  for (const card of report.cards) {
    lines.push(
      "---",
      "",
      `## ${card.batchId} / ${card.lessonId}`,
      "",
      `- Risk: ${card.riskLevel}`,
      `- Module: ${card.module}`,
      `- Topic: ${card.topic}`,
      `- Source families: ${card.sourceFamilies.join(", ") || "none"}`,
      `- Direct candidates to resolve: ${card.directCandidateFamilies.join(", ") || "none"}`,
      "",
      "### Lesson Review",
      "",
      "- [ ] Read worksheet row and rewrite directions.",
      "- [ ] Confirm source families are direct, boundary-only, metadata-only, historical, macro/data, or unsuitable.",
      "- [ ] Confirm no copied external source body text is needed.",
      "- [ ] Confirm the lesson remains structural_draft.",
      "",
      "### Required Notes",
      "",
      ...card.noteFields.map((field) => `- [ ] ${field.field}: ${field.readyWhen}`),
      "",
      "### Safety Boxes",
      "",
      ...card.safetyBoxes.map((box) => `- [ ] ${box}`),
      "",
      "### Source Refs To Inspect",
      "",
      ...(card.sourceRefsToInspect.length ? card.sourceRefsToInspect.map((source) => `- ${source.sourceId} / ${source.name} / ${source.family || "unknown family"} / ${source.sourceUseTier}`) : ["- None listed for this row; use source-family role notes only."]),
      ""
    );
  }

  lines.push("## Boundary", "", report.boundary, "");
  return lines.join("\n");
}

const [
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  worksheet,
  noteReadinessMatrix,
  sourceRoleDecisionTable,
  directCandidateChecklist,
  safeNoteExamples,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.worksheet),
  readJson(paths.noteReadinessMatrix),
  readJson(paths.sourceRoleDecisionTable),
  readJson(paths.directCandidateChecklist),
  readJson(paths.safeNoteExamples),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  worksheet,
  noteReadinessMatrix,
  sourceRoleDecisionTable,
  directCandidateChecklist,
  safeNoteExamples,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; printable pack must not run as completed review`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include printable checklist pack file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-printable-checklist-pack")) fail("dry-run packet must include printable checklist pack command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include printable checklist pack file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-printable-checklist-pack")) fail("progress dashboard must include printable checklist pack command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Printable checklist pack" && row.status === "printable_manual_checklist_ready")) fail("progress dashboard must include printable checklist pack status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to printable checklist pack");

const lessons = flattenLessons(worksheet);
if (lessons.length !== 12 || worksheet.worksheetLessons !== 12) fail("printable checklist pack must cover 12 first-reviewer lessons");
if (worksheet.highRiskLessons !== 2) fail("printable checklist pack must keep two high-risk lessons visible");
if (noteReadinessMatrix.matrixRows !== 72 || noteReadinessMatrix.blankNoteFields !== 72 || noteReadinessMatrix.prefilledNoteFields !== 0) fail("note readiness matrix must keep 72 blank fields");
if (sourceRoleDecisionTable.lessonRows.length !== 12 || sourceRoleDecisionTable.sourceFamilyDecisions !== 45) fail("source-role table must cover 12 lessons and 45 decisions");
if (directCandidateChecklist.directCandidates !== 5 || directCandidateChecklist.nonGreenRefs !== 0) fail("direct candidates must be green-only and unresolved");
if (safeNoteExamples.sampleOnly !== true) fail("safe note examples must remain sample-only");

const matrixRowsByLesson = new Map();
for (const row of noteReadinessMatrix.rows) {
  if (!matrixRowsByLesson.has(row.lessonId)) matrixRowsByLesson.set(row.lessonId, []);
  matrixRowsByLesson.get(row.lessonId).push(row);
}
const directRowsByLesson = new Map();
for (const row of directCandidateChecklist.rows) {
  if (!directRowsByLesson.has(row.lessonId)) directRowsByLesson.set(row.lessonId, []);
  directRowsByLesson.get(row.lessonId).push(row);
}

const cards = lessons.map((lesson) => {
  const noteRows = matrixRowsByLesson.get(lesson.lessonId) || [];
  if (noteRows.length !== REQUIRED_FIELDS.length) fail(`${lesson.lessonId} must have ${REQUIRED_FIELDS.length} note rows`);
  const fields = REQUIRED_FIELDS.map((field) => {
    const row = noteRows.find((candidate) => candidate.field === field);
    if (!row) fail(`${lesson.lessonId} missing note field ${field}`);
    return {
      field,
      readyWhen: row.readyWhen,
      currentBlocker: row.currentBlocker,
      prompt: row.prompt,
    };
  });
  const directRows = directRowsByLesson.get(lesson.lessonId) || [];
  return {
    batchId: lesson.batchId,
    lessonId: lesson.lessonId,
    module: lesson.module,
    topic: lesson.topic,
    riskLevel: lesson.riskLevel,
    rewritePriority: lesson.rewritePriority,
    currentGrade: lesson.currentGrade,
    mustRemainStructuralDraft: lesson.mustRemainStructuralDraft,
    sourceFamilies: lesson.sourceFamilies || [],
    sourceRefsToInspect: lesson.sourceRefsToInspect || [],
    directCandidateFamilies: directRows.map((row) => row.family),
    directCandidateRows: directRows.length,
    noteFields: fields,
    safetyBoxes: [
      "No approval, final-ready, learner-facing-ready, commercial-ready, or production-ready wording.",
      "No buy/sell/hold, entry/exit signal, performance, win-rate, backtest-profit, or real-money guidance.",
      "No broker/order workflow, automation, agency endorsement, or copied source body text.",
      "Yellow, red, and research_only sources remain out of learner-facing evidence.",
    ],
  };
});

const noteFieldCheckboxes = cards.reduce((sum, card) => sum + card.noteFields.length, 0);
if (noteFieldCheckboxes !== 72) fail("printable checklist pack must expose 72 note field checkboxes");
if (cards.filter((card) => card.riskLevel === "high").length !== 2) fail("printable checklist pack must surface 2 high-risk lessons");
if (cards.reduce((sum, card) => sum + card.directCandidateRows, 0) !== 5) fail("printable checklist pack must surface 5 direct candidate rows");

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  packReady: true,
  realStatusPath,
  realStatusOverlayPresent,
  targetBatches: worksheet.targetBatches,
  lessonChecklists: cards.length,
  highRiskLessons: worksheet.highRiskLessons,
  noteFieldCheckboxes,
  directCandidatesToConfirm: directCandidateChecklist.directCandidates,
  sourceRefsToInspect: cards.reduce((sum, card) => sum + card.sourceRefsToInspect.length, 0),
  cards,
  globalReviewBoxes: [
    "Use this pack only after reading the human execution bundle.",
    "Start with the high-risk lesson in each target batch.",
    "Resolve direct candidates before filling sourceFitNotes.",
    "Keep all generated prompts and examples out of real reviewer notes unless actual human review supports them.",
    "Keep every lesson structural_draft until separate human rewrite and factual review are complete.",
    "Run completion, diff audit, note lint, curriculum review, knowledge checks, browser checks, and full verify after any real overlay write.",
  ],
  sourceReports: paths,
  boundary: "This printable checklist pack is reviewer-facing manual scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  packReady: report.packReady,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  targetBatches: report.targetBatches,
  lessonChecklists: report.lessonChecklists,
  highRiskLessons: report.highRiskLessons,
  noteFieldCheckboxes: report.noteFieldCheckboxes,
  directCandidatesToConfirm: report.directCandidatesToConfirm,
  sourceRefsToInspect: report.sourceRefsToInspect,
  outputJson,
  outputMd,
}, null, 2));
