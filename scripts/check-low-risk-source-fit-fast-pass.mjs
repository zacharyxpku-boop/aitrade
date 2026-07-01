import fs from "node:fs/promises";

const riskPath = "docs/LESSON_SOURCE_FIT_RISK_SUMMARY.json";
const workbenchPath = "docs/LESSON_REWRITE_WORKBENCH.json";
const outputJson = "docs/LOW_RISK_SOURCE_FIT_FAST_PASS.json";
const outputMd = "docs/LOW_RISK_SOURCE_FIT_FAST_PASS.md";
const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const GREEN_SOURCE_TIERS = new Set(["green_official_public_domain", "green_public_domain_classic"]);

function fail(message) {
  throw new Error(message);
}

function countBy(items, keyFn) {
  return items.reduce((counts, item) => {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function fastPassRow(row, item) {
  const refs = [...(item.greenReviewedSources || []), ...(item.greenAuthoritySources || [])];
  const nonGreenRefs = refs.filter((ref) => !GREEN_SOURCE_TIERS.has(ref.sourceUseTier));
  return {
    lessonId: row.lessonId,
    batchId: row.batchId,
    module: row.module,
    topic: row.topic,
    currentGrade: row.currentGrade,
    currentScore: row.currentScore,
    rewritePriority: row.rewritePriority,
    riskLevel: row.riskLevel,
    sourceFamilies: row.sourceFamilies,
    greenReviewedSources: (item.greenReviewedSources || []).length,
    greenAuthoritySources: (item.greenAuthoritySources || []).length,
    nonGreenRefs: nonGreenRefs.length,
    fastPassStatus: "eligible_for_human_rewrite_queue_only",
    fastPassChecks: [
      "green_sources_only",
      "no_external_body_copying",
      "no_trading_advice_or_signal",
      "no_performance_claim",
      "no_broker_order_auto_trading_or_real_money_guidance",
      "keep_structural_draft_until_separate_human_approval",
    ],
    requiredReviewerNotes: [
      "greenOnlyConfirmed",
      "copyingRiskNotes",
      "boundaryCheckNotes",
      "structuralDraftConfirmed",
    ],
    expectedOutcome: row.expectedOutcome,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
  };
}

function renderMarkdown(report) {
  return [
    "# Low-Risk Source-Fit Fast Pass",
    "",
    "This report gives low-risk source-fit rows a fast human-review checklist.",
    "It is not final approval, learner-facing release, production readiness, or trading guidance.",
    "",
    "## Summary",
    "",
    `- Low-risk lessons: ${report.lowRiskLessons}`,
    `- Batches covered: ${report.batchesCovered}`,
    `- Non-green refs: ${report.nonGreenRefs}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Batch Counts",
    "",
    "| Batch | Low-risk rows |",
    "| --- | ---: |",
    ...Object.entries(report.batchCounts).map(([batchId, count]) => `| ${batchId} | ${count} |`),
    "",
    "## Fast-Pass Rows",
    "",
    "| Lesson | Batch | Module | Topic | Status | Required notes |",
    "| --- | --- | --- | --- | --- | --- |",
    ...report.rows.map((row) => `| ${row.lessonId} | ${row.batchId} | ${row.module} | ${row.topic} | ${row.fastPassStatus} | ${row.requiredReviewerNotes.join(", ")} |`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const risk = JSON.parse(await fs.readFile(riskPath, "utf8"));
const workbench = JSON.parse(await fs.readFile(workbenchPath, "utf8"));
if (risk.educationOnly !== true || workbench.educationOnly !== true) fail("inputs must keep educationOnly true");
if (risk.productionReady !== false || workbench.productionReady !== false) fail("inputs must keep productionReady false");
if (risk.approvalStatus !== "not_approved") fail("source-fit risk summary must stay not_approved");

const itemById = new Map(workbench.items.map((item) => [item.lessonId, item]));
const rows = risk.rows
  .filter((row) => row.riskLevel === "low")
  .map((row) => {
    const item = itemById.get(row.lessonId);
    if (!item) fail(`missing workbench item for ${row.lessonId}`);
    return fastPassRow(row, item);
  });

if (!rows.length) fail("expected low-risk source-fit rows");
for (const row of rows) {
  if (row.currentGrade !== "structural_draft") fail(`${row.lessonId} must remain structural_draft`);
  if (row.expectedOutcome !== EXPECTED_OUTCOME) fail(`${row.lessonId} expectedOutcome changed`);
  if (row.nonGreenRefs !== 0) fail(`${row.lessonId} has non-green refs`);
  if (row.fastPassStatus !== "eligible_for_human_rewrite_queue_only") fail(`${row.lessonId} cannot be marked approved or ready`);
}

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  lowRiskLessons: rows.length,
  batchesCovered: new Set(rows.map((row) => row.batchId)).size,
  nonGreenRefs: rows.reduce((sum, row) => sum + row.nonGreenRefs, 0),
  batchCounts: countBy(rows, (row) => row.batchId),
  rows,
  boundary: "This fast-pass checklist only makes low-risk rows easier to queue for human rewriting. It does not approve lessons, publish learner-facing content, change grades, or provide trading advice.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, renderMarkdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  lowRiskLessons: report.lowRiskLessons,
  batchesCovered: report.batchesCovered,
  nonGreenRefs: report.nonGreenRefs,
  outputJson,
  outputMd,
}, null, 2));
