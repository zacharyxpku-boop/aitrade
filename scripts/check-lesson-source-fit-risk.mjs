import fs from "node:fs/promises";

const workbenchPath = "docs/LESSON_REWRITE_WORKBENCH.json";
const outputJson = "docs/LESSON_SOURCE_FIT_RISK_SUMMARY.json";
const outputMd = "docs/LESSON_SOURCE_FIT_RISK_SUMMARY.md";
const GREEN_SOURCE_TIERS = new Set(["green_official_public_domain", "green_public_domain_classic"]);
const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";

function fail(message) {
  throw new Error(message);
}

function hasAny(values, wanted) {
  return values.some((value) => wanted.includes(value));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function moduleProfile(moduleName) {
  if (/新闻|情绪|事件|鏂伴椈|鎯呯华|浜嬩欢/.test(moduleName)) {
    return {
      domain: "news_sentiment_events",
      expectedFamilies: ["SEC", "Investor.gov", "CFTC", "BLS", "BEA", "Federal Reserve", "Treasury"],
      preferredContext: "event, disclosure, fraud-red-flag, macro-release, and narrative-lag context",
    };
  }
  if (/心理|蹇冪悊/.test(moduleName)) {
    return {
      domain: "psychology_behavior",
      expectedFamilies: ["Investor.gov", "CFTC", "consumer.ftc.gov", "consumerfinance.gov"],
      preferredContext: "fraud education, behavior risk, confirmation bias, and scam-red-flag context",
    };
  }
  if (/风险|椋庨櫓/.test(moduleName)) {
    return {
      domain: "risk_portfolio",
      expectedFamilies: ["Investor.gov", "CFTC", "SEC", "Federal Reserve", "Treasury", "nist.gov"],
      preferredContext: "risk boundary, uncertainty, product-risk, and control-language context",
    };
  }
  if (/回测|鍥炴祴/.test(moduleName)) {
    return {
      domain: "backtesting_research_hygiene",
      expectedFamilies: ["Investor.gov", "CFTC", "SEC", "BLS", "BEA", "Federal Reserve", "EIA", "nist.gov"],
      preferredContext: "data hygiene, sample, disclosure, uncertainty, and methodology-boundary context",
    };
  }
  return {
    domain: "chart_price_action",
    expectedFamilies: ["Project Gutenberg", "Internet Archive", "SEC", "BLS", "BEA", "Federal Reserve", "Treasury"],
    preferredContext: "historical language, observation training, term boundary, and non-action chart-reading context",
  };
}

function riskForItem(item) {
  const families = unique(item.sourceFamilies || []);
  const profile = moduleProfile(item.module);
  const allRefs = [...(item.greenReviewedSources || []), ...(item.greenAuthoritySources || [])];
  const restrictedRefs = allRefs.filter((ref) => !GREEN_SOURCE_TIERS.has(ref.sourceUseTier));
  const reasons = [];
  const reviewerFocus = [];

  if (restrictedRefs.length) {
    reasons.push("restricted_source_leak");
    reviewerFocus.push("Do not use this item until non-green refs are removed from reviewer evidence.");
  }
  if (!hasAny(families, profile.expectedFamilies)) {
    reasons.push("no_expected_family_for_module_domain");
    reviewerFocus.push(`Confirm whether the attached source families really support ${profile.domain}; expected context: ${profile.preferredContext}.`);
  }
  if (profile.domain === "chart_price_action" && !hasAny(families, ["Project Gutenberg", "Internet Archive"])) {
    reasons.push("chart_lesson_without_public_domain_historical_context");
    reviewerFocus.push("Check whether chart-language claims need public-domain historical context or should be rewritten as pure observation training.");
  }
  if (profile.domain === "psychology_behavior" && !hasAny(families, ["Investor.gov", "CFTC", "consumer.ftc.gov", "consumerfinance.gov"])) {
    reasons.push("psychology_lesson_without_fraud_or_behavior_authority");
    reviewerFocus.push("Add human source-fit review for behavior/fraud framing before rewriting.");
  }
  if (profile.domain === "news_sentiment_events" && !hasAny(families, ["SEC", "BLS", "BEA", "Federal Reserve", "Treasury"])) {
    reasons.push("event_lesson_without_disclosure_or_macro_release_authority");
    reviewerFocus.push("Check whether event-reading claims need disclosure or macro-release authority context.");
  }
  if (families.length > 4) {
    reasons.push("broad_source_family_mix");
    reviewerFocus.push("Narrow the rewrite to source-boundary context only; do not blend unrelated authority into a stronger learner-facing claim.");
  }
  if (allRefs.some((ref) => /fraud|scam|protect|avoid/i.test(`${ref.name} ${ref.url}`)) && profile.domain === "chart_price_action") {
    reasons.push("fraud_source_attached_to_chart_context");
    reviewerFocus.push("Use fraud sources only for boundary warnings, not for explaining chart mechanics.");
  }
  if (allRefs.some((ref) => ref.sourceUseTier === "green_public_domain_classic")) {
    reviewerFocus.push("If using public-domain classics, keep only historical language or observation context; remove old trading-rule voice.");
  }
  if (!reviewerFocus.length) {
    reviewerFocus.push("Confirm source-to-topic fit during human rewrite; keep all sources as boundary evidence only.");
  }

  const severity = restrictedRefs.length
    ? "blocked"
    : reasons.length >= 3
      ? "high"
      : reasons.length >= 1
        ? "medium"
        : "low";

  return {
    lessonId: item.lessonId,
    module: item.module,
    topic: item.topic,
    rewritePriority: item.rewritePriority,
    currentGrade: item.currentGrade,
    currentScore: item.currentScore,
    expectedOutcome: item.expectedOutcome,
    sourceFamilies: families,
    moduleDomain: profile.domain,
    preferredContext: profile.preferredContext,
    riskLevel: severity,
    riskReasons: reasons,
    reviewerFocus,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
  };
}

function renderMarkdown(report) {
  return [
    "# Lesson Source-Fit Risk Summary",
    "",
    "This report helps reviewers prioritize source-to-topic fit checks for the lesson rewrite workbench.",
    "It is not content approval, learner-facing release, production readiness, or trading guidance.",
    "",
    "## Summary",
    "",
    `- Workbench items: ${report.workbenchItems}`,
    `- Rewrite batches: ${report.rewriteBatches}`,
    `- Source-fit rows: ${report.sourceFitRows}`,
    `- Blocked rows: ${report.riskCounts.blocked || 0}`,
    `- High-risk rows: ${report.riskCounts.high || 0}`,
    `- Medium-risk rows: ${report.riskCounts.medium || 0}`,
    `- Low-risk rows: ${report.riskCounts.low || 0}`,
    `- Green source leaks: ${report.greenSourceLeaks}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Batch Risk",
    "",
    "| Batch | Items | Blocked | High | Medium | Low | First review focus |",
    "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
    ...report.batchRows.map((row) => `| ${row.batchId} | ${row.itemCount} | ${row.riskCounts.blocked || 0} | ${row.riskCounts.high || 0} | ${row.riskCounts.medium || 0} | ${row.riskCounts.low || 0} | ${row.firstReviewFocus} |`),
    "",
    "## Highest Review Priority Rows",
    "",
    "| Lesson | Batch | Module | Topic | Risk | Reasons |",
    "| --- | --- | --- | --- | --- | --- |",
    ...report.rows
      .filter((row) => ["blocked", "high", "medium"].includes(row.riskLevel))
      .slice(0, 32)
      .map((row) => `| ${row.lessonId} | ${row.batchId} | ${row.module} | ${row.topic} | ${row.riskLevel} | ${row.riskReasons.join(", ") || "source-fit-review"} |`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const workbench = JSON.parse(await fs.readFile(workbenchPath, "utf8"));
if (workbench.educationOnly !== true) fail("workbench must keep educationOnly true");
if (workbench.productionReady !== false) fail("workbench must keep productionReady false");
if (workbench.expectedOutcome !== EXPECTED_OUTCOME) fail("workbench expectedOutcome changed");

const itemById = new Map((workbench.items || []).map((item) => [item.lessonId, item]));
const batchByLessonId = new Map();
for (const batch of workbench.rewriteBatches || []) {
  for (const lessonId of batch.lessonIds || []) {
    batchByLessonId.set(lessonId, batch.batchId);
  }
}

const rows = (workbench.items || []).map((item) => ({
  ...riskForItem(item),
  batchId: batchByLessonId.get(item.lessonId) || "unbatched",
}));
for (const row of rows) {
  if (row.expectedOutcome !== EXPECTED_OUTCOME) fail(`${row.lessonId} expectedOutcome changed`);
  if (row.currentGrade !== "structural_draft") fail(`${row.lessonId} must remain structural_draft`);
}

const missingBatchRows = [...itemById.keys()].filter((lessonId) => !batchByLessonId.has(lessonId));
if (missingBatchRows.length) fail(`source-fit risk found unbatched lessons: ${missingBatchRows.join(", ")}`);

const greenSourceLeaks = (workbench.items || [])
  .flatMap((item) => [...(item.greenReviewedSources || []), ...(item.greenAuthoritySources || [])])
  .filter((ref) => !GREEN_SOURCE_TIERS.has(ref.sourceUseTier)).length;
if (greenSourceLeaks) fail(`green source leak in source-fit risk input: ${greenSourceLeaks}`);

function countBy(items, keyFn) {
  return items.reduce((counts, item) => {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

const batchRows = (workbench.rewriteBatches || []).map((batch) => {
  const batchRiskRows = rows.filter((row) => row.batchId === batch.batchId);
  const sorted = [...batchRiskRows].sort((left, right) => {
    const rank = { blocked: 0, high: 1, medium: 2, low: 3 };
    return (rank[left.riskLevel] ?? 9) - (rank[right.riskLevel] ?? 9) || left.lessonId.localeCompare(right.lessonId);
  });
  return {
    batchId: batch.batchId,
    itemCount: batchRiskRows.length,
    modules: batch.modules,
    sourceFamilies: batch.sourceFamilies,
    riskCounts: countBy(batchRiskRows, (row) => row.riskLevel),
    firstReviewFocus: sorted[0]?.reviewerFocus?.[0] || "Confirm source-to-topic fit before rewriting.",
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  workbenchItems: workbench.items.length,
  rewriteBatches: workbench.rewriteBatches.length,
  sourceFitRows: rows.length,
  greenSourceLeaks,
  riskCounts: countBy(rows, (row) => row.riskLevel),
  batchRows,
  rows,
  boundary: "This report prioritizes human source-fit review only. It does not reject green sources, approve final wording, publish learner-facing content, change lesson grades, or provide trading advice.",
};

if (report.workbenchItems !== 48) fail(`expected 48 workbench items, got ${report.workbenchItems}`);
if (report.rewriteBatches !== 8) fail(`expected 8 rewrite batches, got ${report.rewriteBatches}`);
if (report.sourceFitRows !== report.workbenchItems) fail("source-fit rows must match workbench items");

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, renderMarkdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  workbenchItems: report.workbenchItems,
  rewriteBatches: report.rewriteBatches,
  sourceFitRows: report.sourceFitRows,
  riskCounts: report.riskCounts,
  greenSourceLeaks: report.greenSourceLeaks,
  outputJson,
  outputMd,
}, null, 2));
