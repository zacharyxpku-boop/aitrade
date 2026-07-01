import fs from "node:fs/promises";

const riskPath = "docs/LESSON_SOURCE_FIT_RISK_SUMMARY.json";
const workbenchPath = "docs/LESSON_REWRITE_WORKBENCH.json";
const outputJson = "docs/HIGH_RISK_SOURCE_FIT_ACTION_PLAN.json";
const outputMd = "docs/HIGH_RISK_SOURCE_FIT_ACTION_PLAN.md";
const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const GREEN_SOURCE_TIERS = new Set(["green_official_public_domain", "green_public_domain_classic"]);

function fail(message) {
  throw new Error(message);
}

function sourceUseForFamily(family, moduleDomain) {
  if (family === "Investor.gov") return "Use only for investor-protection, fraud-red-flag, and uncertainty-boundary notes; do not use it to explain chart mechanics.";
  if (family === "CFTC") return "Use only for product-risk, trading-bot fraud, digital-asset/commodity-risk, or phony-system warnings; do not turn it into a chart signal.";
  if (family === "SEC") return "Use only for disclosure, filing-literacy, source-boundary, and terminology context; do not use it as proof of a price-action rule.";
  if (family === "BLS" || family === "BEA") return "Use only for macro-data release and definition boundaries; do not write market-direction predictions.";
  if (family === "Treasury" || family === "Federal Reserve") return "Use only for rate, macro, and policy-context boundaries; do not imply a trade decision.";
  if (family === "Project Gutenberg" || family === "Internet Archive") return "Use only for public-domain historical market language and observation exercises; remove old buy/sell or profit-maxim language.";
  return `Use only as source-boundary context for ${moduleDomain}; require human source-fit confirmation before rewrite.`;
}

function rewriteDirectionFor(row) {
  const directions = [
    "Rewrite as observation training: visible evidence first, interpretation limits second, no-action / invalidation / uncertainty third.",
    "Keep all sources as reviewer-facing boundary evidence only; do not copy source body text into lesson prose.",
    "Do not add buy/sell/hold, real-time signal, return/win-rate/backtest-profit, broker/order, auto-trading, or real-money guidance.",
  ];
  if (row.riskReasons.includes("chart_lesson_without_public_domain_historical_context")) {
    directions.push("If no public-domain historical source is semantically fit, remove historical-language claims and keep the lesson as pure chart-observation practice.");
  }
  if (row.riskReasons.includes("fraud_source_attached_to_chart_context")) {
    directions.push("Move Investor.gov/CFTC fraud context into boundary warnings only; do not use fraud pages to define chart structures.");
  }
  if (row.riskReasons.includes("broad_source_family_mix")) {
    directions.push("Narrow the lesson to one source role per paragraph: term boundary, data boundary, fraud warning, or historical context.");
  }
  if (row.riskReasons.includes("no_expected_family_for_module_domain")) {
    directions.push("Before rewriting, either attach a better chart/historical/context source or explicitly mark the current source mix as boundary-only.");
  }
  return directions;
}

function buildPlanRow(row, item) {
  const refs = [...(item.greenReviewedSources || []), ...(item.greenAuthoritySources || [])];
  const badRefs = refs.filter((ref) => !GREEN_SOURCE_TIERS.has(ref.sourceUseTier));
  return {
    lessonId: row.lessonId,
    batchId: row.batchId,
    module: row.module,
    topic: row.topic,
    riskLevel: row.riskLevel,
    riskReasons: row.riskReasons,
    currentGrade: row.currentGrade,
    currentScore: row.currentScore,
    expectedOutcome: row.expectedOutcome,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    sourceFamilies: row.sourceFamilies,
    familyActionPlan: row.sourceFamilies.map((family) => ({
      family,
      reviewerUse: sourceUseForFamily(family, row.moduleDomain),
    })),
    sourceRefsToInspect: refs.map((ref) => ({
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
    })),
    possibleMismatch: row.reviewerFocus,
    reviewerQuestions: [
      "Does each source family support the lesson topic directly, or only a boundary warning?",
      "Which source should be removed from explanatory prose and kept only as a reviewer citation?",
      "Does the rewritten lesson still work as original observation training without source-body copying?",
      "Are no-action, invalidation, and uncertainty visible before any practice prompt?",
    ],
    suggestedRewriteDirection: rewriteDirectionFor(row),
    requiredReviewerNotes: [
      "sourceFitNotes",
      "boundaryCheckNotes",
      "copyingRiskNotes",
      "originalRewriteNotes",
      "factCheckNotes",
    ],
    restrictedSourceLeaks: badRefs.length,
    mustRemainStructuralDraft: true,
  };
}

function renderMarkdown(report) {
  return [
    "# High-Risk Source-Fit Action Plan",
    "",
    "This report gives reviewer action plans for high-risk source-to-topic fit rows.",
    "It is not lesson rewriting, final approval, learner-facing release, production readiness, or trading guidance.",
    "",
    "## Summary",
    "",
    `- High-risk lessons: ${report.highRiskLessons}`,
    `- Restricted source leaks: ${report.restrictedSourceLeaks}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Action Rows",
    "",
    "| Lesson | Batch | Module | Topic | Risk reasons | First action |",
    "| --- | --- | --- | --- | --- | --- |",
    ...report.rows.map((row) => `| ${row.lessonId} | ${row.batchId} | ${row.module} | ${row.topic} | ${row.riskReasons.join(", ")} | ${row.suggestedRewriteDirection[0]} |`),
    "",
    "## Source Family Use",
    "",
    ...report.rows.flatMap((row) => [
      `### ${row.lessonId}`,
      "",
      ...row.familyActionPlan.map((plan) => `- ${plan.family}: ${plan.reviewerUse}`),
      "",
    ]),
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
if (risk.approvalStatus !== "not_approved") fail("risk summary must stay not_approved");

const itemById = new Map(workbench.items.map((item) => [item.lessonId, item]));
const highRows = risk.rows.filter((row) => row.riskLevel === "high");
if (highRows.length < 1) fail("expected at least one high-risk source-fit row");

const rows = highRows.map((row) => {
  const item = itemById.get(row.lessonId);
  if (!item) fail(`missing workbench item for ${row.lessonId}`);
  return buildPlanRow(row, item);
});

for (const row of rows) {
  if (row.currentGrade !== "structural_draft") fail(`${row.lessonId} must stay structural_draft`);
  if (row.expectedOutcome !== EXPECTED_OUTCOME) fail(`${row.lessonId} expectedOutcome changed`);
  if (row.restrictedSourceLeaks !== 0) fail(`${row.lessonId} has restricted source leaks`);
  if (row.suggestedRewriteDirection.some((item) => /buy|sell|hold|broker|auto-trading|real-money|return|win-rate/i.test(item) && !/^Do not/.test(item))) {
    fail(`${row.lessonId} action plan contains unsafe positive trading language`);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  highRiskLessons: rows.length,
  restrictedSourceLeaks: rows.reduce((sum, row) => sum + row.restrictedSourceLeaks, 0),
  rows,
  boundary: "This action plan tells human reviewers what to inspect first. It does not rewrite lesson prose, approve content, expand learner-facing exposure, change grades, or provide trading advice.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, renderMarkdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  highRiskLessons: report.highRiskLessons,
  restrictedSourceLeaks: report.restrictedSourceLeaks,
  outputJson,
  outputMd,
}, null, 2));
