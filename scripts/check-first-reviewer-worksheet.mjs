import fs from "node:fs/promises";

const guidePath = "docs/LESSON_BATCH_REVIEW_GUIDE.json";
const dashboardPath = "docs/SOURCE_FIT_REVIEWER_DASHBOARD.json";
const highRiskPath = "docs/HIGH_RISK_SOURCE_FIT_ACTION_PLAN.json";
const outputJson = "docs/FIRST_REVIEWER_WORKSHEET.json";
const outputMd = "docs/FIRST_REVIEWER_WORKSHEET.md";
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
const DISALLOWED_STATUS_PATTERN = /approved_final|commercial_ready|learner_facing_ready|production_ready|trading_signal|buy|sell|hold|broker|auto_trading|real_money/i;

function fail(message) {
  throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

function assertEnvelope(report, label) {
  if (report.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (report.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (report.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (report.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (report.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function summarizeSources(highRiskRow) {
  return (highRiskRow?.sourceRefsToInspect || []).map((ref) => ({
    sourceId: ref.sourceId,
    name: ref.name,
    url: ref.url,
    family: ref.family,
    sourceType: ref.sourceType,
    sourceUseTier: ref.sourceUseTier,
    reliabilityGrade: ref.reliabilityGrade,
    allowedUse: ref.allowedUse,
    disallowedUse: ref.disallowedUse,
    relevanceSignal: ref.relevanceSignal,
  }));
}

function worksheetLesson(card, dashboardRow, highRiskRow) {
  const riskLevel = dashboardRow?.riskLevel || "unclassified";
  const isHighRisk = riskLevel === "high";
  return {
    lessonId: card.lessonId,
    batchId: dashboardRow?.batchId,
    module: card.module,
    topic: card.topic,
    currentGrade: card.currentGrade,
    currentScore: card.currentScore,
    rewritePriority: card.rewritePriority,
    riskLevel,
    sourceFamilies: unique(card.sourceFamilies || dashboardRow?.sourceFamilies || []),
    nextAction: isHighRisk ? "resolve_high_risk_source_fit_before_rewrite" : dashboardRow?.nextAction,
    reviewFocus: isHighRisk
      ? "Decide whether each attached source supports the topic directly or must be kept as boundary-only metadata before any prose rewrite."
      : "Complete source-fit notes after the high-risk lesson in the same batch is resolved.",
    sourceFitQuestions: isHighRisk ? highRiskRow.reviewerQuestions : [
      "Does the source family support this lesson topic directly, or only a boundary note?",
      "Can the lesson be rewritten as original observation training without copying source body text?",
      "Are uncertainty and no-action boundaries visible before practice prompts?",
    ],
    rewriteDirections: isHighRisk ? highRiskRow.suggestedRewriteDirection : [
      "Rewrite only as original educational explanation or observation training.",
      "Do not copy external source body text into lesson prose.",
      "Keep the lesson structural_draft until separate human rewrite and factual review are complete.",
    ],
    sourceRefsToInspect: isHighRisk ? summarizeSources(highRiskRow) : [],
    requiredReviewerNotes: REQUIRED_NOTE_FIELDS,
    approvalStatus: "not_approved",
    learnerFacingRelease: false,
    productionReady: false,
    educationOnly: true,
    mustRemainStructuralDraft: true,
  };
}

function renderMarkdown(report) {
  return [
    "# First Reviewer Worksheet",
    "",
    "This worksheet packages the first high-risk source-fit batches for human review.",
    "It is not completed review, final approval, learner-facing release, production readiness, or trading guidance.",
    "",
    "## Summary",
    "",
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Worksheet lessons: ${report.worksheetLessons}`,
    `- High-risk lessons: ${report.highRiskLessons}`,
    `- Medium-risk lessons: ${report.riskCounts.medium || 0}`,
    `- Low-risk lessons: ${report.riskCounts.low || 0}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Review Order",
    "",
    ...report.reviewOrder.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## Batch Worksheets",
    "",
    ...report.batchWorksheets.flatMap((batch) => [
      `### ${batch.batchId}`,
      "",
      `- First action: ${batch.firstAction}`,
      `- Risk mix: high ${batch.riskCounts.high || 0}, medium ${batch.riskCounts.medium || 0}, low ${batch.riskCounts.low || 0}`,
      `- Source families: ${batch.sourceFamilies.join(", ")}`,
      "",
      "| Lesson | Risk | Module | Topic | Next action | Required notes |",
      "| --- | --- | --- | --- | --- | --- |",
      ...batch.lessons.map((lesson) => `| ${lesson.lessonId} | ${lesson.riskLevel} | ${lesson.module} | ${lesson.topic} | ${lesson.nextAction} | ${lesson.requiredReviewerNotes.join(", ")} |`),
      "",
    ]),
    "## High-Risk Source Inspection",
    "",
    ...report.highRiskWorksheets.flatMap((lesson) => [
      `### ${lesson.lessonId}`,
      "",
      `- Batch: ${lesson.batchId}`,
      `- Module/topic: ${lesson.module} / ${lesson.topic}`,
      `- Review focus: ${lesson.reviewFocus}`,
      "",
      "Reviewer questions:",
      ...lesson.sourceFitQuestions.map((question) => `- ${question}`),
      "",
      "Rewrite directions:",
      ...lesson.rewriteDirections.map((direction) => `- ${direction}`),
      "",
      "Source refs to inspect:",
      "| Source | Family | Tier | Allowed use summary |",
      "| --- | --- | --- | --- |",
      ...lesson.sourceRefsToInspect.map((ref) => `| ${ref.name} | ${ref.family} | ${ref.sourceUseTier} | ${ref.allowedUse} |`),
      "",
    ]),
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const guide = await readJson(guidePath);
const dashboard = await readJson(dashboardPath);
const highRisk = await readJson(highRiskPath);
assertEnvelope(guide, "batch review guide");
assertEnvelope(dashboard, "source-fit reviewer dashboard");
assertEnvelope(highRisk, "high-risk action plan");

const guideBatchById = new Map(guide.batches.map((batch) => [batch.batchId, batch]));
const dashboardRowByLessonId = new Map(dashboard.lessonRows.map((row) => [row.lessonId, row]));
const highRiskByLessonId = new Map(highRisk.rows.map((row) => [row.lessonId, row]));

const batchWorksheets = TARGET_BATCHES.map((batchId) => {
  const guideBatch = guideBatchById.get(batchId);
  const dashboardBatch = dashboard.batchRows.find((row) => row.batchId === batchId);
  if (!guideBatch || !dashboardBatch) fail(`missing worksheet source batch ${batchId}`);
  const lessons = guideBatch.lessonCards.map((card) => worksheetLesson(card, dashboardRowByLessonId.get(card.lessonId), highRiskByLessonId.get(card.lessonId)));
  return {
    batchId,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    expectedOutcome: EXPECTED_OUTCOME,
    firstAction: dashboardBatch.firstAction,
    riskCounts: dashboardBatch.riskCounts,
    sourceFamilies: dashboardBatch.sourceFamilies,
    lessonCount: lessons.length,
    lessons,
  };
});

const lessonRows = batchWorksheets.flatMap((batch) => batch.lessons);
const highRiskWorksheets = lessonRows.filter((lesson) => lesson.riskLevel === "high");
if (batchWorksheets.length !== 2) fail("first reviewer worksheet must cover two high-risk batches");
if (lessonRows.length !== 12) fail("first reviewer worksheet must cover 12 lesson cards");
if (highRiskWorksheets.length !== 2) fail("first reviewer worksheet must cover exactly two high-risk lessons");

for (const lesson of lessonRows) {
  if (lesson.currentGrade !== "structural_draft") fail(`${lesson.lessonId} must remain structural_draft`);
  if (lesson.mustRemainStructuralDraft !== true) fail(`${lesson.lessonId} must keep structural draft flag`);
  if (DISALLOWED_STATUS_PATTERN.test(`${lesson.nextAction || ""} ${lesson.approvalStatus || ""} ${lesson.currentGrade || ""}`)) {
    fail(`${lesson.lessonId} contains disallowed status wording`);
  }
  for (const field of REQUIRED_NOTE_FIELDS) {
    if (!lesson.requiredReviewerNotes.includes(field)) fail(`${lesson.lessonId} missing required note ${field}`);
  }
}

for (const lesson of highRiskWorksheets) {
  if (!lesson.sourceRefsToInspect.length) fail(`${lesson.lessonId} high-risk worksheet needs source refs to inspect`);
  for (const ref of lesson.sourceRefsToInspect) {
    if (!ref.sourceId || !ref.name || !ref.url || !ref.sourceUseTier || !ref.allowedUse || !ref.disallowedUse) {
      fail(`${lesson.lessonId} source ref missing required metadata`);
    }
    if (!["green_official_public_domain", "green_public_domain_classic"].includes(ref.sourceUseTier)) {
      fail(`${lesson.lessonId} source ref must stay green-only`);
    }
  }
}

const riskCounts = lessonRows.reduce((counts, lesson) => {
  counts[lesson.riskLevel] = (counts[lesson.riskLevel] || 0) + 1;
  return counts;
}, {});

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  targetBatches: TARGET_BATCHES,
  worksheetLessons: lessonRows.length,
  highRiskLessons: highRiskWorksheets.length,
  riskCounts,
  reviewOrder: [
    "Start with the high-risk lesson in each batch before rewriting any adjacent medium or low rows.",
    "Record source-fit notes that separate direct evidence, boundary-only metadata, and sources to keep out of explanatory prose.",
    "Rewrite only original education prose; do not copy external source body text.",
    "Run the batch completion audit before any batch is marked ready for a separate human approval review.",
  ],
  batchWorksheets,
  highRiskWorksheets,
  boundary: "This worksheet is reviewer-facing scaffolding for human source-fit and rewrite work. It does not approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
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
  worksheetLessons: report.worksheetLessons,
  highRiskLessons: report.highRiskLessons,
  riskCounts: report.riskCounts,
  outputJson,
  outputMd,
}, null, 2));
