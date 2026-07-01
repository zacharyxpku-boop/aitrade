import fs from "node:fs/promises";

const riskPath = "docs/LESSON_SOURCE_FIT_RISK_SUMMARY.json";
const outputJson = "docs/MEDIUM_RISK_SOURCE_FIT_CHECKLIST.json";
const outputMd = "docs/MEDIUM_RISK_SOURCE_FIT_CHECKLIST.md";
const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";

function fail(message) {
  throw new Error(message);
}

const CHECKLIST_BY_REASON = {
  broad_source_family_mix: {
    checklistType: "source_role_narrowing",
    reviewerChecklist: [
      "Assign each source family to exactly one role: term boundary, data boundary, fraud warning, disclosure context, or historical context.",
      "Remove any sentence that blends multiple source families into a stronger learner-facing claim.",
      "Keep the rewrite as observation training and state uncertainty before practice.",
    ],
  },
  fraud_source_attached_to_chart_context: {
    checklistType: "fraud_boundary_only",
    reviewerChecklist: [
      "Use Investor.gov/CFTC fraud material only as risk or scam-boundary context.",
      "Do not use fraud pages to define chart structures, confirm patterns, or imply market behavior.",
      "Move fraud context into warning language or remove it from explanatory prose.",
    ],
  },
  chart_lesson_without_public_domain_historical_context: {
    checklistType: "historical_context_or_observation_only",
    reviewerChecklist: [
      "Check whether the lesson actually needs historical market-language context.",
      "If public-domain historical context is weak or absent, rewrite as pure observation training.",
      "Do not invent historical support or preserve old trading-rule voice.",
    ],
  },
};

function checklistFor(row) {
  const checklistTypes = row.riskReasons.map((reason) => CHECKLIST_BY_REASON[reason]?.checklistType).filter(Boolean);
  const reviewerChecklist = row.riskReasons.flatMap((reason) => CHECKLIST_BY_REASON[reason]?.reviewerChecklist || []);
  return {
    lessonId: row.lessonId,
    batchId: row.batchId,
    module: row.module,
    topic: row.topic,
    riskLevel: row.riskLevel,
    riskReasons: row.riskReasons,
    checklistTypes: [...new Set(checklistTypes)],
    sourceFamilies: row.sourceFamilies,
    reviewerChecklist: [...new Set([
      ...reviewerChecklist,
      "Do not copy external source body text.",
      "Do not add buy/sell/hold, signals, performance claims, broker/order flow, auto-trading, or real-money guidance.",
      "Keep the lesson as structural_draft until separate human approval.",
    ])],
    requiredReviewerNotes: [
      "sourceFitNotes",
      "boundaryCheckNotes",
      "copyingRiskNotes",
    ],
    expectedOutcome: row.expectedOutcome,
    currentGrade: row.currentGrade,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
  };
}

function countBy(items, keyFn) {
  return items.reduce((counts, item) => {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function renderMarkdown(report) {
  return [
    "# Medium-Risk Source-Fit Checklist",
    "",
    "This lightweight checklist groups medium-risk source-fit rows by review type.",
    "It is not lesson rewriting, final approval, learner-facing release, production readiness, or trading guidance.",
    "",
    "## Summary",
    "",
    `- Medium-risk lessons: ${report.mediumRiskLessons}`,
    `- Checklist groups: ${Object.keys(report.checklistTypeCounts).length}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Checklist Type Counts",
    "",
    "| Checklist type | Rows |",
    "| --- | ---: |",
    ...Object.entries(report.checklistTypeCounts).map(([type, count]) => `| ${type} | ${count} |`),
    "",
    "## Batch Summary",
    "",
    "| Batch | Medium rows | Checklist types |",
    "| --- | ---: | --- |",
    ...report.batchRows.map((batch) => `| ${batch.batchId} | ${batch.mediumRows} | ${batch.checklistTypes.join(", ")} |`),
    "",
    "## Medium-Risk Rows",
    "",
    "| Lesson | Batch | Module | Topic | Checklist types | Required notes |",
    "| --- | --- | --- | --- | --- | --- |",
    ...report.rows.map((row) => `| ${row.lessonId} | ${row.batchId} | ${row.module} | ${row.topic} | ${row.checklistTypes.join(", ")} | ${row.requiredReviewerNotes.join(", ")} |`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const risk = JSON.parse(await fs.readFile(riskPath, "utf8"));
if (risk.educationOnly !== true) fail("source-fit risk summary must keep educationOnly true");
if (risk.productionReady !== false) fail("source-fit risk summary must keep productionReady false");
if (risk.approvalStatus !== "not_approved") fail("source-fit risk summary must stay not_approved");

const mediumRows = risk.rows.filter((row) => row.riskLevel === "medium").map(checklistFor);
if (mediumRows.length < 1) fail("expected at least one medium-risk row");
for (const row of mediumRows) {
  if (row.expectedOutcome !== EXPECTED_OUTCOME) fail(`${row.lessonId} expectedOutcome changed`);
  if (row.currentGrade !== "structural_draft") fail(`${row.lessonId} must remain structural_draft`);
  if (!row.checklistTypes.length) fail(`${row.lessonId} missing checklist type`);
  if (row.reviewerChecklist.length < 4) fail(`${row.lessonId} checklist too thin`);
}

const batchRows = Object.entries(
  mediumRows.reduce((groups, row) => {
    groups[row.batchId] ||= [];
    groups[row.batchId].push(row);
    return groups;
  }, {})
).map(([batchId, rows]) => ({
  batchId,
  mediumRows: rows.length,
  checklistTypes: [...new Set(rows.flatMap((row) => row.checklistTypes))],
}));

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  mediumRiskLessons: mediumRows.length,
  checklistTypeCounts: countBy(mediumRows.flatMap((row) => row.checklistTypes), (type) => type),
  batchRows,
  rows: mediumRows,
  boundary: "This checklist helps human reviewers triage medium-risk source-fit rows. It does not rewrite lesson prose, approve content, expand learner-facing exposure, change grades, or provide trading advice.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, renderMarkdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  mediumRiskLessons: report.mediumRiskLessons,
  checklistTypeCounts: report.checklistTypeCounts,
  outputJson,
  outputMd,
}, null, 2));
