import fs from "node:fs/promises";

const guidePath = "docs/LESSON_BATCH_REVIEW_GUIDE.json";
const dashboardPath = "docs/SOURCE_FIT_REVIEWER_DASHBOARD.json";
const outputJson = "docs/LESSON_BATCH_REVIEW_STATUS_EXAMPLE.json";
const outputMd = "docs/LESSON_BATCH_REVIEW_STATUS_EXAMPLE.md";
const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const SAMPLE_BATCH_ID = "rewrite_batch_02";
const REQUIRED_NOTE_FIELDS = [
  "originalRewriteNotes",
  "sourceFitNotes",
  "factCheckNotes",
  "boundaryCheckNotes",
  "copyingRiskNotes",
  "humanReviewerInitials",
];
const DISALLOWED_TEXT_PATTERN = /approved_final|commercial_ready|learner_facing_ready|production_ready|trading_signal|buy|sell|hold|broker|auto_trading|real_money/i;

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

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function riskRowByLesson(dashboard) {
  return new Map(dashboard.lessonRows.map((row) => [row.lessonId, row]));
}

function exampleNotes(card, riskRow) {
  const riskLevel = riskRow?.riskLevel || "unknown";
  const nextAction = riskRow?.nextAction || "review_source_fit_before_rewrite";
  return {
    lessonId: card.lessonId,
    trackingStatus: "example_ready_for_separate_human_approval_review",
    riskLevel,
    sourceFitNextAction: nextAction,
    originalRewriteNotes: `EXAMPLE ONLY: rewrite notes would summarize the human-created educational explanation for ${card.lessonId}; do not copy source text.`,
    sourceFitNotes: `EXAMPLE ONLY: reviewer would record why the attached green sources support only the permitted ${riskLevel} source-fit role.`,
    factCheckNotes: "EXAMPLE ONLY: reviewer would record factual checks against source metadata and lesson claims.",
    boundaryCheckNotes: "EXAMPLE ONLY: reviewer would confirm no recommendations, signals, performance claims, broker/order flow, automation, or real-money guidance.",
    copyingRiskNotes: "EXAMPLE ONLY: reviewer would confirm the final prose is original and contains no copied external body text.",
    humanReviewerInitials: "EXAMPLE_ONLY",
    mustRemainStructuralDraft: true,
  };
}

function renderMarkdown(report) {
  return [
    "# Lesson Batch Review Status Example",
    "",
    "This file shows how a human reviewer status overlay should be filled.",
    "It is sample-only scaffolding, not a real review, approval, learner-facing release, production readiness, or trading guidance.",
    "",
    "## Summary",
    "",
    `- Sample only: ${report.sampleOnly}`,
    `- Example batch: ${report.exampleBatchId}`,
    `- Example lesson cards: ${report.exampleLessonCards}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## How To Use",
    "",
    ...report.instructions.map((item) => `- ${item}`),
    "",
    "## Example Lesson Rows",
    "",
    "| Lesson | Risk | Tracking status | Source-fit action | Required note fields filled |",
    "| --- | --- | --- | --- | ---: |",
    ...report.exampleOverlay.batches[0].lessonCards.map((card) => {
      const filled = REQUIRED_NOTE_FIELDS.filter((field) => hasText(card[field])).length;
      return `| ${card.lessonId} | ${card.riskLevel} | ${card.trackingStatus} | ${card.sourceFitNextAction} | ${filled}/${REQUIRED_NOTE_FIELDS.length} |`;
    }),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const guide = await readJson(guidePath);
const dashboard = await readJson(dashboardPath);
assertEnvelope(guide, "batch review guide");
assertEnvelope(dashboard, "source-fit reviewer dashboard");

const sampleGuideBatch = guide.batches.find((batch) => batch.batchId === SAMPLE_BATCH_ID);
if (!sampleGuideBatch) fail(`missing sample batch ${SAMPLE_BATCH_ID}`);
if (sampleGuideBatch.lessonCards.length !== 6) fail("sample batch must keep six lesson cards");

const riskRows = riskRowByLesson(dashboard);
const lessonCards = sampleGuideBatch.lessonCards.map((card) => {
  const riskRow = riskRows.get(card.lessonId);
  if (!riskRow) fail(`dashboard missing source-fit row for ${card.lessonId}`);
  return exampleNotes(card, riskRow);
});

const exampleOverlay = {
  sampleOnly: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  purpose: "Sample-only reviewer status overlay showing the required note fields for one batch. Do not copy this file to LESSON_BATCH_REVIEW_STATUS.json as real evidence.",
  batches: [
    {
      batchId: SAMPLE_BATCH_ID,
      sampleOnly: true,
      educationOnly: true,
      productionReady: false,
      learnerFacingRelease: false,
      approvalStatus: "not_approved",
      expectedOutcome: EXPECTED_OUTCOME,
      reviewStatus: "example_ready_for_separate_human_approval_review",
      lessonCards,
    },
  ],
};

assertEnvelope(exampleOverlay, "status example");
if (exampleOverlay.sampleOnly !== true) fail("status example must be sampleOnly");
if (exampleOverlay.batches.length !== 1) fail("status example must cover exactly one example batch");

for (const batch of exampleOverlay.batches) {
  assertEnvelope(batch, `status example ${batch.batchId}`);
  if (batch.sampleOnly !== true) fail(`${batch.batchId} must be sampleOnly`);
  if (DISALLOWED_TEXT_PATTERN.test(`${batch.reviewStatus} ${batch.approvalStatus} ${batch.expectedOutcome}`)) {
    fail(`${batch.batchId} contains disallowed completion claim`);
  }
  for (const card of batch.lessonCards) {
    if (card.mustRemainStructuralDraft !== true) fail(`${card.lessonId} must remain structural draft`);
    if (DISALLOWED_TEXT_PATTERN.test(`${card.trackingStatus} ${card.currentGrade || ""} ${card.approvalStatus || ""}`)) {
      fail(`${card.lessonId} contains disallowed status wording`);
    }
    for (const field of REQUIRED_NOTE_FIELDS) {
      if (!hasText(card[field])) fail(`${card.lessonId}.${field} must show sample note text`);
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  sampleOnly: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  exampleBatchId: SAMPLE_BATCH_ID,
  exampleLessonCards: lessonCards.length,
  requiredNoteFields: REQUIRED_NOTE_FIELDS,
  instructions: [
    "Use this file only to understand the expected shape of a manually filled status overlay.",
    "Create or edit docs/LESSON_BATCH_REVIEW_STATUS.json only after a real human reviewer performs the work.",
    "Keep approvalStatus:not_approved and learnerFacingRelease:false even when a batch is ready for a separate approval review.",
    "Do not use example notes as real reviewer evidence.",
  ],
  exampleOverlay,
  boundary: "This example is sample-only reviewer scaffolding. It does not approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, renderMarkdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  sampleOnly: report.sampleOnly,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  exampleBatchId: report.exampleBatchId,
  exampleLessonCards: report.exampleLessonCards,
  outputJson,
  outputMd,
}, null, 2));
