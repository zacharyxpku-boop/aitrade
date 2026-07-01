import fs from "node:fs/promises";

const fullTemplatePath = "docs/LESSON_BATCH_REVIEW_STATUS_TEMPLATE.json";
const worksheetPath = "docs/FIRST_REVIEWER_WORKSHEET.json";
const outputJson = "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json";
const outputMd = "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.md";
const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const TARGET_BATCHES = ["rewrite_batch_01", "rewrite_batch_05"];
const REQUIRED_NOTE_FIELDS = [
  "originalRewriteNotes",
  "sourceFitNotes",
  "factCheckNotes",
  "boundaryCheckNotes",
  "copyingRiskNotes",
  "humanReviewerInitials",
];
const DISALLOWED_STATUS_PATTERN = /approved_final|commercial_ready|learner_facing_ready|production_ready|trading_signal|buy|sell|hold|broker|auto_trading|real_money|ready_for_separate_human_approval_review/i;

function fail(message) {
  throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

function assertEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function worksheetByLesson(worksheet) {
  return new Map(worksheet.batchWorksheets.flatMap((batch) => batch.lessons.map((lesson) => [lesson.lessonId, lesson])));
}

function renderMarkdown(report) {
  return [
    "# Lesson Batch Review Status Draft Template For Batch 01/05",
    "",
    "This draft template narrows the blank reviewer status overlay to the first worksheet batches.",
    "It is not completed review, approval, learner-facing release, production readiness, or trading guidance.",
    "",
    "## Summary",
    "",
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Draft lesson cards: ${report.draftLessonCards}`,
    `- High-risk cards: ${report.riskCounts.high || 0}`,
    `- Medium-risk cards: ${report.riskCounts.medium || 0}`,
    `- Low-risk cards: ${report.riskCounts.low || 0}`,
    `- Notes filled: ${report.notesFilled}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Use",
    "",
    ...report.instructions.map((item) => `- ${item}`),
    "",
    "## Draft Rows",
    "",
    "| Batch | Lesson | Risk | Tracking status | Notes state |",
    "| --- | --- | --- | --- | --- |",
    ...report.batches.flatMap((batch) => batch.lessonCards.map((card) => `| ${batch.batchId} | ${card.lessonId} | ${card.riskLevel} | ${card.trackingStatus} | blank |`)),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const fullTemplate = await readJson(fullTemplatePath);
const worksheet = await readJson(worksheetPath);
assertEnvelope(fullTemplate, "full status template");
assertEnvelope(worksheet, "first reviewer worksheet");

const fullBatchById = new Map(fullTemplate.batches.map((batch) => [batch.batchId, batch]));
const worksheetLessonById = worksheetByLesson(worksheet);
const batches = TARGET_BATCHES.map((batchId) => {
  const sourceBatch = fullBatchById.get(batchId);
  if (!sourceBatch) fail(`missing full template batch ${batchId}`);
  return {
    ...sourceBatch,
    lessonCards: sourceBatch.lessonCards.map((card) => {
      const worksheetLesson = worksheetLessonById.get(card.lessonId);
      if (!worksheetLesson) fail(`worksheet missing ${card.lessonId}`);
      return {
        ...card,
        riskLevel: worksheetLesson.riskLevel,
        sourceFitNextAction: worksheetLesson.nextAction,
        reviewerContext: worksheetLesson.reviewFocus,
      };
    }),
  };
});

const draft = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  purpose: "Draft reviewer status overlay for the first worksheet batches only. Copy into LESSON_BATCH_REVIEW_STATUS.json only when a human reviewer is ready to record real notes.",
  targetBatches: TARGET_BATCHES,
  sourceWorksheet: "docs/FIRST_REVIEWER_WORKSHEET.md",
  instructions: [
    "Keep every note blank until a human reviewer performs the work.",
    "Keep reviewStatus:not_started and trackingStatus:not_started until real review begins.",
    "Keep approvalStatus:not_approved and learnerFacingRelease:false.",
    "Run npm.cmd run check:lesson-batch-completion after adding real notes.",
    "Do not use this draft template to mark approval, commercial readiness, or learner-facing readiness.",
  ],
  batches,
  boundary: "This draft template is blank reviewer-input scaffolding for two first-pass batches. It is not evidence of completed human review, final approval, learner-facing release, commercial readiness, trading advice, performance implication, broker connection, automation, or real-money guidance.",
};

assertEnvelope(draft, "first reviewer status draft template");
if (draft.batches.length !== 2) fail("draft template must include exactly two batches");
if (draft.batches.some((batch) => !TARGET_BATCHES.includes(batch.batchId))) fail("draft template has unexpected batch");
if ("sampleOnly" in draft) fail("draft template must not be sampleOnly");

const rows = draft.batches.flatMap((batch) => batch.lessonCards.map((card) => ({ batch, card })));
if (rows.length !== 12) fail("draft template must include 12 lesson cards");
const riskCounts = {};
let notesFilled = 0;
for (const { batch, card } of rows) {
  assertEnvelope(batch, `draft ${batch.batchId}`);
  if (batch.reviewStatus !== "not_started") fail(`${batch.batchId} must start not_started`);
  if (DISALLOWED_STATUS_PATTERN.test(`${batch.reviewStatus} ${batch.approvalStatus} ${batch.expectedOutcome}`)) {
    fail(`${batch.batchId} contains disallowed status wording`);
  }
  if (card.trackingStatus !== "not_started") fail(`${card.lessonId} must start not_started`);
  if (card.mustRemainStructuralDraft !== true) fail(`${card.lessonId} must keep structural draft flag`);
  if (DISALLOWED_STATUS_PATTERN.test(`${card.trackingStatus} ${card.approvalStatus || ""}`)) {
    fail(`${card.lessonId} contains disallowed status wording`);
  }
  if (!card.riskLevel || !card.sourceFitNextAction || !card.reviewerContext) fail(`${card.lessonId} missing worksheet reviewer context`);
  riskCounts[card.riskLevel] = (riskCounts[card.riskLevel] || 0) + 1;
  for (const field of REQUIRED_NOTE_FIELDS) {
    if (card[field] !== "") fail(`${card.lessonId}.${field} must remain blank`);
    if (card[field]) notesFilled += 1;
  }
}

const report = {
  ...draft,
  draftLessonCards: rows.length,
  riskCounts,
  notesFilled,
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, renderMarkdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  targetBatches: report.targetBatches,
  draftLessonCards: report.draftLessonCards,
  riskCounts: report.riskCounts,
  notesFilled: report.notesFilled,
  outputJson,
  outputMd,
}, null, 2));
