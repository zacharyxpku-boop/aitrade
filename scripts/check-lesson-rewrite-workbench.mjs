import { createRequire } from "node:module";
import fs from "node:fs/promises";

const require = createRequire(import.meta.url);
const {
  GREEN_SOURCE_TIERS,
  EXPECTED_OUTCOME,
  batchReviewGuide,
  lessonRewriteWorkbench,
  lessonRewriteWorkbenchReport,
} = require("../education-lesson-review-workbench.js");

const outputJson = "docs/LESSON_REWRITE_WORKBENCH.json";
const outputMd = "docs/LESSON_REWRITE_WORKBENCH.md";
const outputGuideJson = "docs/LESSON_BATCH_REVIEW_GUIDE.json";
const outputGuideMd = "docs/LESSON_BATCH_REVIEW_GUIDE.md";
const REQUIRED_FIELDS = [
  "lessonId",
  "module",
  "topic",
  "currentGrade",
  "currentScore",
  "handAuthored",
  "rewritePriority",
  "greenReviewedSources",
  "greenAuthoritySources",
  "sourceFamilies",
  "sourceUseBoundary",
  "rewriteInstructions",
  "forbiddenDrift",
  "reviewerChecklist",
  "expectedOutcome",
];
const FORBIDDEN_DRIFT_SIGNALS = [
  "买入",
  "卖出",
  "持有",
  "实盘",
  "信号",
  "收益",
  "胜率",
  "回测盈利",
  "券商",
  "下单",
  "自动交易",
  "真实资金",
  "网页正文",
  "历史书",
  "FRED",
  "yellow",
  "red",
];
const REQUIRED_GUIDE_FIELDS = [
  "originalRewriteNotes",
  "sourceFitNotes",
  "factCheckNotes",
  "boundaryCheckNotes",
  "copyingRiskNotes",
  "humanReviewerInitials",
];

function fail(message) {
  throw new Error(message);
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== "";
}

function assertGreenRef(ref, item, field) {
  const required = ["sourceId", "name", "url", "sourceType", "reliabilityGrade", "licenseStatus", "allowedUse", "disallowedUse", "sourceUseTier", "relevanceSignal"];
  for (const key of required) {
    if (!hasValue(ref[key])) fail(`${item.lessonId}.${field} missing source ${key}`);
  }
  if (!GREEN_SOURCE_TIERS.has(ref.sourceUseTier)) {
    fail(`${item.lessonId}.${field} leaked non-green source tier ${ref.sourceUseTier}`);
  }
  const status = String(ref.sourceUseTier || "");
  if (/yellow|red|research_only/i.test(status)) {
    fail(`${item.lessonId}.${field} leaked restricted source tier ${status}`);
  }
}

function assertWorkbench() {
  if (lessonRewriteWorkbench.educationOnly !== true) fail("workbench must keep educationOnly true");
  if (lessonRewriteWorkbench.productionReady !== false) fail("workbench must keep productionReady false");
  if (lessonRewriteWorkbenchReport.educationOnly !== true) fail("report must keep educationOnly true");
  if (lessonRewriteWorkbenchReport.productionReady !== false) fail("report must keep productionReady false");
  if (lessonRewriteWorkbench.expectedOutcome !== EXPECTED_OUTCOME) fail("workbench expectedOutcome changed");

  const items = lessonRewriteWorkbench.items || [];
  if (items.length < 48) fail(`expected at least 48 workbench items, got ${items.length}`);

  const moduleCounts = new Map();
  for (const item of items) {
    for (const field of REQUIRED_FIELDS) {
      if (!hasValue(item[field])) fail(`${item.lessonId || "unknown"} missing ${field}`);
    }
    moduleCounts.set(item.module, (moduleCounts.get(item.module) || 0) + 1);
    if (item.educationOnly !== true) fail(`${item.lessonId} must keep educationOnly true`);
    if (item.productionReady !== false) fail(`${item.lessonId} must keep productionReady false`);
    if (item.handAuthored !== false) fail(`${item.lessonId} must be handAuthored:false`);
    if (item.currentGrade !== "structural_draft") fail(`${item.lessonId} must stay structural_draft, got ${item.currentGrade}`);
    if (item.currentGrade === "commercial_ready") fail(`${item.lessonId} cannot be commercial_ready`);
    if (typeof item.currentScore !== "number") fail(`${item.lessonId} missing numeric currentScore`);
    if (!["P0", "P1", "P2"].includes(item.rewritePriority)) fail(`${item.lessonId} invalid priority ${item.rewritePriority}`);
    if (item.greenReviewedSources.length < 2 || item.greenReviewedSources.length > 3) fail(`${item.lessonId} must have 2-3 greenReviewedSources`);
    if (item.greenAuthoritySources.length < 1 || item.greenAuthoritySources.length > 2) fail(`${item.lessonId} must have 1-2 greenAuthoritySources`);
    if (item.sourceFamilies.length < 1) fail(`${item.lessonId} missing sourceFamilies`);
    if (item.expectedOutcome !== EXPECTED_OUTCOME) fail(`${item.lessonId} invalid expectedOutcome`);
    if (/approved_final|commercial_ready/i.test(item.expectedOutcome)) fail(`${item.lessonId} expectedOutcome cannot approve final/commercial status`);
    if (item.rewriteInstructions.length < 6) fail(`${item.lessonId} rewriteInstructions too thin`);
    if (!item.rewriteInstructions.join(" ").includes("原创中文")) fail(`${item.lessonId} rewriteInstructions must require original Chinese writing`);
    if (!item.rewriteInstructions.join(" ").includes("不复制")) fail(`${item.lessonId} rewriteInstructions must ban copied source text`);
    if (!/不行动|失效|不确定/.test(item.rewriteInstructions.join(" "))) fail(`${item.lessonId} rewriteInstructions must require no-action, invalidation, and uncertainty`);
    if (item.forbiddenDrift.length < 6) fail(`${item.lessonId} forbiddenDrift too thin`);
    const forbiddenText = item.forbiddenDrift.join(" ");
    for (const signal of FORBIDDEN_DRIFT_SIGNALS) {
      if (!forbiddenText.includes(signal)) fail(`${item.lessonId} forbiddenDrift missing ${signal}`);
    }
    if (item.reviewerChecklist.length < 5) fail(`${item.lessonId} reviewerChecklist too thin`);
    for (const ref of item.greenReviewedSources) assertGreenRef(ref, item, "greenReviewedSources");
    for (const ref of item.greenAuthoritySources) assertGreenRef(ref, item, "greenAuthoritySources");
  }

  if (moduleCounts.size < 12) fail(`expected 12 modules covered, got ${moduleCounts.size}`);
  for (const [module, count] of moduleCounts) {
    if (count < 4) fail(`module ${module} has only ${count} workbench items`);
  }
  if (lessonRewriteWorkbenchReport.yellowRedResearchLeaks !== 0) {
    fail(`yellow/red/research-only leaks must be 0, got ${lessonRewriteWorkbenchReport.yellowRedResearchLeaks}`);
  }

  const batches = lessonRewriteWorkbench.rewriteBatches || [];
  if (batches.length < 8) fail(`expected at least 8 rewrite batches, got ${batches.length}`);
  const itemIds = new Set(items.map((item) => item.lessonId));
  const batchedIds = [];
  for (const batch of batches) {
    if (!hasValue(batch.batchId)) fail("rewrite batch missing batchId");
    if (batch.educationOnly !== true) fail(`${batch.batchId} must keep educationOnly true`);
    if (batch.productionReady !== false) fail(`${batch.batchId} must keep productionReady false`);
    if (batch.expectedOutcome !== EXPECTED_OUTCOME) fail(`${batch.batchId} invalid expectedOutcome`);
    if (/approved_final|commercial_ready/i.test(batch.expectedOutcome)) fail(`${batch.batchId} cannot approve final/commercial status`);
    if (!Array.isArray(batch.lessonIds) || batch.lessonIds.length < 1) fail(`${batch.batchId} missing lessonIds`);
    if (batch.itemCount !== batch.lessonIds.length) fail(`${batch.batchId} itemCount does not match lessonIds`);
    if (!Array.isArray(batch.modules) || batch.modules.length < 1) fail(`${batch.batchId} missing modules`);
    if (!Array.isArray(batch.sourceFamilies) || batch.sourceFamilies.length < 1) fail(`${batch.batchId} missing sourceFamilies`);
    if (!Array.isArray(batch.reviewerFocus) || batch.reviewerFocus.length < 3) fail(`${batch.batchId} reviewerFocus too thin`);
    if (!Array.isArray(batch.entryCriteria) || batch.entryCriteria.length < 3) fail(`${batch.batchId} entryCriteria too thin`);
    if (!Array.isArray(batch.exitCriteria) || batch.exitCriteria.length < 3) fail(`${batch.batchId} exitCriteria too thin`);
    const safetyGates = new Set(batch.safetyGates || []);
    for (const gate of ["no_trading_advice", "no_live_signal", "no_performance_claim", "no_broker_or_order_flow", "no_auto_trading", "no_real_money_guidance", "no_external_body_copying", "green_sources_only"]) {
      if (!safetyGates.has(gate)) fail(`${batch.batchId} missing safety gate ${gate}`);
    }
    for (const lessonId of batch.lessonIds) {
      if (!itemIds.has(lessonId)) fail(`${batch.batchId} references unknown lesson ${lessonId}`);
      batchedIds.push(lessonId);
    }
  }
  const duplicateBatchedIds = batchedIds.filter((lessonId, index) => batchedIds.indexOf(lessonId) !== index);
  if (duplicateBatchedIds.length) fail(`duplicate batched lessons: ${[...new Set(duplicateBatchedIds)].join(", ")}`);
  const missingFromBatches = [...itemIds].filter((lessonId) => !batchedIds.includes(lessonId));
  if (missingFromBatches.length) fail(`workbench lessons missing from batches: ${missingFromBatches.join(", ")}`);

  if (batchReviewGuide.educationOnly !== true) fail("batch review guide must keep educationOnly true");
  if (batchReviewGuide.productionReady !== false) fail("batch review guide must keep productionReady false");
  if (batchReviewGuide.learnerFacingRelease !== false) fail("batch review guide cannot be learner-facing release");
  if (batchReviewGuide.approvalStatus !== "not_approved") fail("batch review guide must stay not_approved");
  if (batchReviewGuide.expectedOutcome !== EXPECTED_OUTCOME) fail("batch review guide expectedOutcome changed");
  for (const claim of batchReviewGuide.disallowedCompletionClaims || []) {
    if (/approved_final|commercial_ready|learner_facing_ready|production_ready|trading_signal/i.test(claim) === false) {
      fail(`unexpected disallowed completion claim token: ${claim}`);
    }
  }
  for (const field of REQUIRED_GUIDE_FIELDS) {
    if (!(batchReviewGuide.requiredReviewerFields || []).includes(field)) fail(`batch review guide missing reviewer field ${field}`);
  }
  if ((batchReviewGuide.batches || []).length !== batches.length) fail("batch review guide does not cover every rewrite batch");
  const guideLessonIds = [];
  const allowedStatuses = new Set(batchReviewGuide.allowedStatuses || []);
  for (const guideBatch of batchReviewGuide.batches || []) {
    const sourceBatch = batches.find((batch) => batch.batchId === guideBatch.batchId);
    if (!sourceBatch) fail(`guide references unknown batch ${guideBatch.batchId}`);
    if (guideBatch.educationOnly !== true) fail(`${guideBatch.batchId} guide must keep educationOnly true`);
    if (guideBatch.productionReady !== false) fail(`${guideBatch.batchId} guide must keep productionReady false`);
    if (guideBatch.learnerFacingRelease !== false) fail(`${guideBatch.batchId} guide cannot release learner-facing content`);
    if (guideBatch.approvalStatus !== "not_approved") fail(`${guideBatch.batchId} guide must stay not_approved`);
    if (guideBatch.expectedOutcome !== EXPECTED_OUTCOME) fail(`${guideBatch.batchId} guide expectedOutcome changed`);
    if (!allowedStatuses.has(guideBatch.reviewStatus)) fail(`${guideBatch.batchId} invalid reviewStatus ${guideBatch.reviewStatus}`);
    if (!Array.isArray(guideBatch.lessonCards) || guideBatch.lessonCards.length !== sourceBatch.lessonIds.length) {
      fail(`${guideBatch.batchId} lessonCards must match source batch lesson count`);
    }
    const sourceLessonSet = new Set(sourceBatch.lessonIds);
    for (const card of guideBatch.lessonCards) {
      if (!sourceLessonSet.has(card.lessonId)) fail(`${guideBatch.batchId} guide card references lesson outside batch: ${card.lessonId}`);
      if (card.currentGrade !== "structural_draft") fail(`${card.lessonId} guide card must stay structural_draft`);
      if (card.mustRemainStructuralDraft !== true) fail(`${card.lessonId} guide card must require structural_draft`);
      if (card.trackingStatus !== "not_started") fail(`${card.lessonId} guide card must start not_started`);
      for (const field of REQUIRED_GUIDE_FIELDS.filter((field) => field !== "humanReviewerInitials")) {
        if (!(card.requiredNotes || []).includes(field)) fail(`${card.lessonId} guide card missing required note ${field}`);
      }
      guideLessonIds.push(card.lessonId);
    }
  }
  const duplicateGuideIds = guideLessonIds.filter((lessonId, index) => guideLessonIds.indexOf(lessonId) !== index);
  if (duplicateGuideIds.length) fail(`duplicate guide lesson cards: ${[...new Set(duplicateGuideIds)].join(", ")}`);
  const missingFromGuide = [...itemIds].filter((lessonId) => !guideLessonIds.includes(lessonId));
  if (missingFromGuide.length) fail(`workbench lessons missing from guide: ${missingFromGuide.join(", ")}`);
}

function mdTableRows(items) {
  return items.map((item) => {
    const families = item.sourceFamilies.join(", ");
    return `| ${item.lessonId} | ${item.module} | ${item.topic} | ${item.currentScore} | ${item.rewritePriority} | ${families} |`;
  });
}

function renderMarkdown() {
  const report = lessonRewriteWorkbenchReport;
  const items = lessonRewriteWorkbench.items;
  return [
    "# Lesson Rewrite Workbench",
    "",
    "This is a human lesson-rewrite queue that turns green-source grounding into reviewer tasks.",
    "It is not final course approval, content reuse approval, trading guidance, or production readiness.",
    "",
    "## Summary",
    "",
    `- Workbench items: ${report.totalItems}`,
    `- Modules covered: ${report.modulesCovered}`,
    `- Minimum items per module: ${report.minItemsPerModule}`,
    `- Hand-authored items: ${report.handAuthoredItems}`,
    `- Yellow/red/research-only leaks: ${report.yellowRedResearchLeaks}`,
    `- Rewrite batches: ${report.rewriteBatches}`,
    `- Batch review guide batches: ${report.batchReviewGuideBatches}`,
    `- Batch review guide lesson cards: ${report.batchReviewGuideLessonCards}`,
    `- Batch size range: ${report.batchSizeRange.min}-${report.batchSizeRange.max}`,
    `- Expected outcome: ${report.expectedOutcome}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Priority Split",
    "",
    "| Priority | Items |",
    "| --- | ---: |",
    ...Object.entries(report.priorityCounts).sort().map(([priority, count]) => `| ${priority} | ${count} |`),
    "",
    "## Module Coverage",
    "",
    "| Module | Items |",
    "| --- | ---: |",
    ...Object.entries(report.moduleCounts).map(([module, count]) => `| ${module} | ${count} |`),
    "",
    "## Source Families",
    "",
    "| Family | Workbench appearances |",
    "| --- | ---: |",
    ...Object.entries(report.sourceFamilyCounts)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([family, count]) => `| ${family} | ${count} |`),
    "",
    "## Rewrite Batches",
    "",
    "| Batch | Items | Priority focus | Modules | Source families |",
    "| --- | ---: | --- | --- | --- |",
    ...lessonRewriteWorkbench.rewriteBatches.map((batch) => `| ${batch.batchId} | ${batch.itemCount} | ${batch.priorityFocus} | ${batch.modules.join(", ")} | ${batch.sourceFamilies.join(", ")} |`),
    "",
    "## Rewrite Queue",
    "",
    "| Lesson | Module | Topic | Score | Priority | Source families |",
    "| --- | --- | --- | ---: | --- | --- |",
    ...mdTableRows(items),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
    "Green sources may guide source fit, fact/term/fraud/data/historical boundaries, and original rewriting tasks only. Generated lessons stay structural_draft until human approval.",
    "",
  ].join("\n");
}

function renderGuideMarkdown() {
  return [
    "# Lesson Batch Review Guide",
    "",
    "This guide tracks human rewriting work for the lesson rewrite workbench.",
    "It is not learner-facing release, final approval, production readiness, or trading guidance.",
    "",
    "## Summary",
    "",
    `- Guide batches: ${batchReviewGuide.batches.length}`,
    `- Lesson cards: ${batchReviewGuide.batches.reduce((sum, batch) => sum + batch.lessonCards.length, 0)}`,
    `- Approval status: ${batchReviewGuide.approvalStatus}`,
    `- Learner-facing release: ${batchReviewGuide.learnerFacingRelease}`,
    `- Expected outcome: ${batchReviewGuide.expectedOutcome}`,
    `- educationOnly: ${batchReviewGuide.educationOnly}`,
    `- productionReady: ${batchReviewGuide.productionReady}`,
    "",
    "## Required Reviewer Fields",
    "",
    ...batchReviewGuide.requiredReviewerFields.map((field) => `- ${field}`),
    "",
    "## Allowed Statuses",
    "",
    ...batchReviewGuide.allowedStatuses.map((status) => `- ${status}`),
    "",
    "## Batch Tracking",
    "",
    "| Batch | Status | Items | Priority focus | Modules | Required notes |",
    "| --- | --- | ---: | --- | --- | --- |",
    ...batchReviewGuide.batches.map((batch) => `| ${batch.batchId} | ${batch.reviewStatus} | ${batch.itemCount} | ${batch.priorityFocus} | ${batch.modules.join(", ")} | ${batch.lessonCards[0].requiredNotes.join(", ")} |`),
    "",
    "## Lesson Cards",
    "",
    "| Batch | Lesson | Module | Topic | Score | Priority | Tracking |",
    "| --- | --- | --- | --- | ---: | --- | --- |",
    ...batchReviewGuide.batches.flatMap((batch) => batch.lessonCards.map((card) => `| ${batch.batchId} | ${card.lessonId} | ${card.module} | ${card.topic} | ${card.currentScore} | ${card.rewritePriority} | ${card.trackingStatus} |`)),
    "",
    "## Boundary",
    "",
    batchReviewGuide.boundary,
    "",
  ].join("\n");
}

assertWorkbench();

await fs.mkdir("docs", { recursive: true });
await fs.writeFile(outputJson, `${JSON.stringify(lessonRewriteWorkbench, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, renderMarkdown(), "utf8");
await fs.writeFile(outputGuideJson, `${JSON.stringify(batchReviewGuide, null, 2)}\n`, "utf8");
await fs.writeFile(outputGuideMd, renderGuideMarkdown(), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: lessonRewriteWorkbenchReport.educationOnly,
  productionReady: lessonRewriteWorkbenchReport.productionReady,
  items: lessonRewriteWorkbenchReport.totalItems,
  modulesCovered: lessonRewriteWorkbenchReport.modulesCovered,
  minItemsPerModule: lessonRewriteWorkbenchReport.minItemsPerModule,
  rewriteBatches: lessonRewriteWorkbenchReport.rewriteBatches,
  batchReviewGuideBatches: lessonRewriteWorkbenchReport.batchReviewGuideBatches,
  batchReviewGuideLessonCards: lessonRewriteWorkbenchReport.batchReviewGuideLessonCards,
  batchSizeRange: lessonRewriteWorkbenchReport.batchSizeRange,
  yellowRedResearchLeaks: lessonRewriteWorkbenchReport.yellowRedResearchLeaks,
  outputJson,
  outputMd,
  outputGuideJson,
  outputGuideMd,
}, null, 2));
