import fs from "node:fs/promises";

const riskPath = "docs/LESSON_SOURCE_FIT_RISK_SUMMARY.json";
const highPath = "docs/HIGH_RISK_SOURCE_FIT_ACTION_PLAN.json";
const mediumPath = "docs/MEDIUM_RISK_SOURCE_FIT_CHECKLIST.json";
const lowPath = "docs/LOW_RISK_SOURCE_FIT_FAST_PASS.json";
const outputJson = "docs/SOURCE_FIT_REVIEWER_DASHBOARD.json";
const outputMd = "docs/SOURCE_FIT_REVIEWER_DASHBOARD.md";
const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";

function fail(message) {
  throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

function assertBoundary(name, report) {
  if (report.educationOnly !== true) fail(`${name} must keep educationOnly true`);
  if (report.productionReady !== false) fail(`${name} must keep productionReady false`);
  if (report.learnerFacingRelease !== false) fail(`${name} must not be learner-facing release`);
  if (report.approvalStatus !== "not_approved") fail(`${name} must stay not_approved`);
  if (report.expectedOutcome !== EXPECTED_OUTCOME) fail(`${name} expectedOutcome changed`);
}

function countBy(items, keyFn) {
  return items.reduce((counts, item) => {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function nextActionFor(row) {
  if (row.riskLevel === "high") {
    return "inspect_source_fit_before_rewrite";
  }
  if (row.riskLevel === "medium") {
    return "complete_targeted_source_fit_checklist";
  }
  return "queue_for_human_rewrite_after_fast_pass_notes";
}

function reviewerNotesFor(row) {
  if (row.riskLevel === "high") {
    return [
      "sourceFamilyMismatchNotes",
      "safeRewriteDirectionNotes",
      "boundaryCheckNotes",
      "structuralDraftConfirmed",
    ];
  }
  if (row.riskLevel === "medium") {
    return [
      "sourceRoleNarrowingNotes",
      "copyingRiskNotes",
      "boundaryCheckNotes",
      "structuralDraftConfirmed",
    ];
  }
  return [
    "greenOnlyConfirmed",
    "copyingRiskNotes",
    "boundaryCheckNotes",
    "structuralDraftConfirmed",
  ];
}

function riskRank(riskLevel) {
  return { high: 0, medium: 1, low: 2 }[riskLevel] ?? 9;
}

function renderMarkdown(report) {
  return [
    "# Source-Fit Reviewer Dashboard",
    "",
    "This dashboard merges the high, medium, and low source-fit reports into one reviewer-facing queue.",
    "It is not final approval, learner-facing release, production readiness, or trading guidance.",
    "",
    "## Summary",
    "",
    `- Source-fit lessons: ${report.sourceFitLessons}`,
    `- Rewrite batches: ${report.rewriteBatches}`,
    `- High-risk rows: ${report.riskCounts.high}`,
    `- Medium-risk rows: ${report.riskCounts.medium}`,
    `- Low-risk rows: ${report.riskCounts.low}`,
    `- Green source leaks: ${report.greenSourceLeaks}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Review Order",
    "",
    ...report.reviewOrder.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## Batch Dashboard",
    "",
    "| Batch | Items | Risk mix | Modules | Source families | First action |",
    "| --- | ---: | --- | --- | --- | --- |",
    ...report.batchRows.map((row) => {
      const riskMix = `H:${row.riskCounts.high || 0} M:${row.riskCounts.medium || 0} L:${row.riskCounts.low || 0}`;
      return `| ${row.batchId} | ${row.itemCount} | ${riskMix} | ${row.modules.join(", ")} | ${row.sourceFamilies.join(", ")} | ${row.firstAction} |`;
    }),
    "",
    "## Lesson Queue",
    "",
    "| Lesson | Batch | Risk | Module | Topic | Next action | Required notes |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...report.lessonRows.map((row) => `| ${row.lessonId} | ${row.batchId} | ${row.riskLevel} | ${row.module} | ${row.topic} | ${row.nextAction} | ${row.requiredReviewerNotes.join(", ")} |`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const risk = await readJson(riskPath);
const high = await readJson(highPath);
const medium = await readJson(mediumPath);
const low = await readJson(lowPath);

assertBoundary("risk summary", risk);
assertBoundary("high-risk action plan", high);
assertBoundary("medium-risk checklist", medium);
assertBoundary("low-risk fast pass", low);

if (risk.sourceFitRows !== 48) fail("risk summary must cover the 48-workbench lesson queue");
if (risk.greenSourceLeaks !== 0) fail("risk summary has green-source leaks");
if (high.highRiskLessons !== 2) fail("expected 2 high-risk lessons");
if (high.restrictedSourceLeaks !== 0) fail("high-risk action plan has restricted source leaks");
if (medium.mediumRiskLessons !== 21) fail("expected 21 medium-risk lessons");
if (low.lowRiskLessons !== 25) fail("expected 25 low-risk lessons");
if (low.nonGreenRefs !== 0) fail("low-risk fast pass has non-green refs");

const actionByLessonId = new Map([
  ...high.rows.map((row) => [row.lessonId, { report: "HIGH_RISK_SOURCE_FIT_ACTION_PLAN", details: row }]),
  ...medium.rows.map((row) => [row.lessonId, { report: "MEDIUM_RISK_SOURCE_FIT_CHECKLIST", details: row }]),
  ...low.rows.map((row) => [row.lessonId, { report: "LOW_RISK_SOURCE_FIT_FAST_PASS", details: row }]),
]);

const lessonRows = risk.rows
  .map((row) => {
    const action = actionByLessonId.get(row.lessonId);
    if (!action) fail(`missing action/checklist row for ${row.lessonId}`);
    if (row.currentGrade !== "structural_draft") fail(`${row.lessonId} must remain structural_draft`);
    if (row.expectedOutcome !== EXPECTED_OUTCOME) fail(`${row.lessonId} expectedOutcome changed`);
    return {
      lessonId: row.lessonId,
      batchId: row.batchId,
      module: row.module,
      topic: row.topic,
      riskLevel: row.riskLevel,
      currentGrade: row.currentGrade,
      sourceFamilies: row.sourceFamilies || [],
      sourceReport: action.report,
      nextAction: nextActionFor(row),
      requiredReviewerNotes: reviewerNotesFor(row),
      approvalStatus: "not_approved",
      learnerFacingRelease: false,
      productionReady: false,
      educationOnly: true,
    };
  })
  .sort((a, b) => riskRank(a.riskLevel) - riskRank(b.riskLevel) || a.batchId.localeCompare(b.batchId) || a.lessonId.localeCompare(b.lessonId));

const rowsByBatch = Map.groupBy(lessonRows, (row) => row.batchId);
const batchRows = [...rowsByBatch.entries()]
  .map(([batchId, rows]) => {
    const riskCounts = countBy(rows, (row) => row.riskLevel);
    const firstAction = rows.some((row) => row.riskLevel === "high")
      ? "resolve_high_risk_source_fit_before_batch_rewrite"
      : rows.some((row) => row.riskLevel === "medium")
        ? "complete_medium_checklists_then_queue_low_risk_rows"
        : "queue_low_risk_rows_after_fast_pass_notes";
    return {
      batchId,
      itemCount: rows.length,
      riskCounts,
      modules: uniq(rows.map((row) => row.module)),
      sourceFamilies: uniq(rows.flatMap((row) => row.sourceFamilies)),
      firstAction,
    };
  })
  .sort((a, b) => a.batchId.localeCompare(b.batchId));

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  sourceFitLessons: lessonRows.length,
  rewriteBatches: batchRows.length,
  riskCounts: countBy(lessonRows, (row) => row.riskLevel),
  greenSourceLeaks: risk.greenSourceLeaks,
  sourceReports: {
    high: "docs/HIGH_RISK_SOURCE_FIT_ACTION_PLAN.md",
    medium: "docs/MEDIUM_RISK_SOURCE_FIT_CHECKLIST.md",
    low: "docs/LOW_RISK_SOURCE_FIT_FAST_PASS.md",
  },
  reviewOrder: [
    "Resolve high-risk source-fit rows before any prose rewrite.",
    "Complete medium-risk checklist notes before batching those lessons for rewrite.",
    "Use low-risk fast-pass rows only after green-only, no-copy, no-advice, and structural-draft notes are recorded.",
    "Keep every generated lesson structural_draft until separate human rewrite and factual review are complete.",
  ],
  batchRows,
  lessonRows,
  boundary: "This reviewer dashboard coordinates source-fit review only. It does not approve lessons, publish learner-facing content, change grades, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

if (report.sourceFitLessons !== 48) fail("dashboard must include all 48 source-fit rows");
if ((report.riskCounts.high || 0) !== 2 || (report.riskCounts.medium || 0) !== 21 || (report.riskCounts.low || 0) !== 25) {
  fail("dashboard risk counts must match high/medium/low source-fit reports");
}
if (report.batchRows.length !== 8) fail("dashboard must cover 8 rewrite batches");

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, renderMarkdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  sourceFitLessons: report.sourceFitLessons,
  rewriteBatches: report.rewriteBatches,
  riskCounts: report.riskCounts,
  greenSourceLeaks: report.greenSourceLeaks,
  outputJson,
  outputMd,
}, null, 2));
