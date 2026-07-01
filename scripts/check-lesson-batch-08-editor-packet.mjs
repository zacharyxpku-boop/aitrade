import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const TARGET_BATCH_ID = "rewrite_batch_08";
const outputJson = "docs/LESSON_BATCH_08_EDITOR_PACKET.json";
const outputMd = "docs/LESSON_BATCH_08_EDITOR_PACKET.md";
const paths = {
  workbench: "docs/LESSON_REWRITE_WORKBENCH.json",
  sourceFitRisk: "docs/LESSON_SOURCE_FIT_RISK_SUMMARY.json",
};

const lessonLabels = {
  lesson_knv2_0041: { moduleLabel: "breakout", topicLabel: "breakout_pullback" },
  lesson_knv2_0037: { moduleLabel: "chart_reading_basics", topicLabel: "wick_meaning" },
  lesson_knv2_0049: { moduleLabel: "chart_reading_basics", topicLabel: "volatility_change" },
  lesson_knv2_0061: { moduleLabel: "chart_reading_basics", topicLabel: "structure_first" },
  lesson_knv2_0073: { moduleLabel: "chart_reading_basics", topicLabel: "price_location" },
  lesson_knv2_0009: { moduleLabel: "news_sentiment_events", topicLabel: "headline_bias" },
};

function fail(message) {
  throw new Error(message);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function assertEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function sourceFamilyRole(family) {
  const normalized = family.toLowerCase();
  if (normalized.includes("investor.gov") || normalized.includes("consumer.ftc.gov")) {
    return "Fraud, headline-hype, and investor-protection boundary context only; never chart-pattern proof.";
  }
  if (normalized.includes("cftc")) return "Fraud, phony-system, commodity-risk, or market-report boundary context only.";
  if (normalized.includes("sec")) return "Disclosure, filing-literacy, source-boundary, or event-reading context only.";
  if (normalized.includes("bls")) return "Labor/inflation release vocabulary and data-method context only; no market-direction forecast.";
  if (normalized.includes("bea")) return "GDP/national-account release context only; no chart-pattern confirmation.";
  if (normalized.includes("federal reserve")) return "Policy/data-release context only; no breakout or price-direction call.";
  if (normalized.includes("treasury")) return "Official rate/debt-data terminology boundary only; no rate-trade recommendation.";
  if (normalized.includes("nass.usda.gov")) return "Agricultural data-release context only; no commodity or price-position call.";
  if (normalized.includes("project gutenberg")) {
    return "Public-domain historical language and observation exercises only; remove old buy/sell rules and profit language.";
  }
  return "Reviewer must classify as context-only unless license, source fit, and safe-use role are confirmed.";
}

function lessonRiskCue(item, riskRow) {
  if ((riskRow?.riskReasons || []).includes("fraud_source_attached_to_chart_context")) {
    return "Fraud-education sources may explain hype and manipulation risk only; they cannot validate a chart reading.";
  }
  if (item.module.includes("突破")) {
    return "Treat breakout language as an observation exercise with alternative explanations, not a signal or trigger.";
  }
  if (item.module.includes("图表")) {
    return "Teach visual description, uncertainty, and invalidation before any interpretation label.";
  }
  if (item.module.includes("新闻")) {
    return "Teach source reading, headline framing, and event-context limits without predicting market reaction.";
  }
  return "Keep the rewrite as observation-first education, not an action framework.";
}

function buildLessonCard(item, batchCard, riskRow) {
  const labels = lessonLabels[item.lessonId];
  if (!labels) fail(`${item.lessonId} missing ASCII labels`);
  if (item.currentGrade !== "structural_draft") fail(`${item.lessonId} must remain structural_draft`);
  if (item.handAuthored !== false) fail(`${item.lessonId} must remain generated draft for this packet`);
  if (batchCard.mustRemainStructuralDraft !== true) fail(`${item.lessonId} batch card must remain structural draft`);

  const refs = [...(item.greenReviewedSources || []), ...(item.greenAuthoritySources || [])];
  const nonGreenRefs = refs.filter((source) => !String(source.sourceUseTier || "").startsWith("green_"));
  if (nonGreenRefs.length) fail(`${item.lessonId} has non-green refs`);

  const sourceFamilies = [...new Set(item.sourceFamilies || [])];
  return {
    lessonId: item.lessonId,
    nodeId: item.nodeId,
    moduleLabel: labels.moduleLabel,
    topicLabel: labels.topicLabel,
    currentGrade: item.currentGrade,
    currentScore: item.currentScore,
    rewritePriority: item.rewritePriority,
    sourceFitRisk: riskRow?.riskLevel || "unclassified",
    riskReasons: riskRow?.riskReasons || [],
    handAuthored: item.handAuthored,
    mustRemainStructuralDraft: true,
    sourceFamilies,
    greenReviewedRefs: (item.greenReviewedSources || []).length,
    greenAuthorityRefs: (item.greenAuthoritySources || []).length,
    nonGreenRefs: nonGreenRefs.length,
    sourceBoundary: [
      "Use green refs as context, vocabulary, event-reading, data-release, fraud-boundary, or historical evidence only.",
      "Fraud and investor-protection sources cannot prove chart patterns, breakouts, pullbacks, wick meaning, volatility shifts, or price location.",
      "Macro, filing, and agency data sources cannot be converted into market-direction forecasts or confirmation rules.",
      "Public-domain classics can support historical language and observation prompts only after stripping prescriptive trading rules.",
      "Keep yellow, red, and research_only sources out of learner-facing evidence.",
    ],
    licenseBoundary: [
      "Agency/public-document metadata may support reviewer notes, but learner-facing prose must be original.",
      "Do not copy agency logos, UI text, third-party inserts, source tables, charts, or boilerplate.",
      "Do not preserve public-domain buy/sell rules, profit language, or market maxims in the rewrite.",
      "No source identity may imply regulator endorsement, forecast ability, trading-system validity, or commercial readiness.",
    ],
    rewriteInstructions: [
      `Rewrite ${labels.moduleLabel} / ${labels.topicLabel} as original teaching prose for interpretation practice.`,
      lessonRiskCue(item, riskRow),
      "Start with what is observable, separate interpretation from fact, then name at least one alternative explanation.",
      "Convert source references into source-fit and boundary checks; do not convert them into trade rules or event predictions.",
      "End with a no-action learner note: what is known, what is unknown, and what evidence would weaken the interpretation.",
      "Leave the lesson as structural_draft until a real human records all required reviewer notes.",
    ],
    reviewerChecklist: [
      "Original prose: no copied or lightly rewritten external source body text.",
      "Source fit: every source family has a defined role, downgrade, or block decision.",
      "Fraud-boundary fit: fraud sources stay about hype/red flags and never validate chart interpretation.",
      "License fit: no agency logos, third-party inserts, source tables, charts, UI text, or public-domain trading maxims copied.",
      "Boundary: no buy/sell/hold wording, signal wording, broker/order workflow, automation, real-money guidance, forecast, or performance promise.",
      "Status: remains structural_draft and not_approved after this packet.",
    ],
    sourceFamilyGuidance: sourceFamilies.map((family) => ({
      family,
      editorUse: sourceFamilyRole(family),
    })),
  };
}

function markdown(report) {
  return [
    "# Lesson Batch 08 Editor Packet",
    "",
    "This packet turns Batch 08 into a bounded human editing packet for medium-heavy source-fit risk.",
    "It focuses on chart/news/breakout wording that could otherwise drift into signal language.",
    "",
    "## Summary",
    "",
    `- Packet ready: ${report.packetReady}`,
    `- Batch: ${report.batchId}`,
    `- Lessons: ${report.lessonCards.length}`,
    `- Modules: ${report.modules.join(", ")}`,
    `- Source families: ${report.sourceFamilies.join(", ")}`,
    `- Risk mix: ${Object.entries(report.riskCounts).map(([key, value]) => `${key}:${value}`).join(", ")}`,
    `- Non-green refs: ${report.nonGreenRefs}`,
    `- Hand-authored lessons: ${report.handAuthoredLessons}`,
    `- Commercial-ready promotions: ${report.commercialReadyPromotions}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Lesson Cards",
    "",
    ...report.lessonCards.flatMap((lesson) => [
      `### ${lesson.lessonId}`,
      "",
      `- Module/topic: ${lesson.moduleLabel} / ${lesson.topicLabel}`,
      `- Grade: ${lesson.currentGrade}`,
      `- Source-fit risk: ${lesson.sourceFitRisk}`,
      `- Risk reasons: ${lesson.riskReasons.join(", ") || "none"}`,
      `- Source families: ${lesson.sourceFamilies.join(", ")}`,
      `- Green refs: reviewed ${lesson.greenReviewedRefs}, authority ${lesson.greenAuthorityRefs}`,
      "",
      "Source boundary:",
      ...lesson.sourceBoundary.map((line) => `- ${line}`),
      "",
      "License boundary:",
      ...lesson.licenseBoundary.map((line) => `- ${line}`),
      "",
      "Rewrite instructions:",
      ...lesson.rewriteInstructions.map((line) => `- ${line}`),
      "",
      "Reviewer checklist:",
      ...lesson.reviewerChecklist.map((line) => `- ${line}`),
      "",
      "Source family guidance:",
      ...lesson.sourceFamilyGuidance.map((row) => `- ${row.family}: ${row.editorUse}`),
      "",
    ]),
    "## Exit Rule",
    "",
    report.batchExitRule,
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const workbench = await readJson(paths.workbench);
const sourceFitRisk = await readJson(paths.sourceFitRisk);
assertEnvelope(workbench, "lesson rewrite workbench");
assertEnvelope(sourceFitRisk, "source fit risk summary");

const batch = workbench.batchReviewGuide?.batches?.find((row) => row.batchId === TARGET_BATCH_ID);
if (!batch) fail(`${TARGET_BATCH_ID} missing from batch review guide`);
assertEnvelope(batch, TARGET_BATCH_ID);
if (batch.itemCount !== 6 || batch.lessonCards.length !== 6) fail(`${TARGET_BATCH_ID} must contain 6 lesson cards`);
if (batch.learnerFacingRelease !== false || batch.approvalStatus !== "not_approved") fail(`${TARGET_BATCH_ID} must stay not approved and unreleased`);
if (batch.priorityFocus !== "P2") fail(`${TARGET_BATCH_ID} should stay scoped to P2 review work`);

const itemsById = new Map(workbench.items.map((item) => [item.lessonId, item]));
const riskRowsById = new Map(sourceFitRisk.rows.map((row) => [row.lessonId, row]));
const lessonCards = batch.lessonCards.map((card) => {
  const item = itemsById.get(card.lessonId);
  if (!item) fail(`${card.lessonId} missing from workbench items`);
  assertEnvelope(item, card.lessonId);
  return buildLessonCard(item, card, riskRowsById.get(card.lessonId));
});

const riskCounts = lessonCards.reduce((counts, lesson) => {
  counts[lesson.sourceFitRisk] = (counts[lesson.sourceFitRisk] || 0) + 1;
  return counts;
}, {});
const nonGreenRefs = lessonCards.reduce((sum, lesson) => sum + lesson.nonGreenRefs, 0);
const handAuthoredLessons = lessonCards.filter((lesson) => lesson.handAuthored).length;
const commercialReadyPromotions = lessonCards.filter((lesson) => lesson.currentGrade === "commercial_ready").length;
if (nonGreenRefs !== 0) fail("editor packet cannot include non-green source refs");
if (handAuthoredLessons !== 0) fail("batch 08 editor packet must not claim hand-authored lessons");
if (commercialReadyPromotions !== 0) fail("batch 08 editor packet must not promote lessons");
if ((riskCounts.medium || 0) < 5) fail("batch 08 packet should preserve its medium-risk focus");

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  packetReady: true,
  packetMode: "human_editor_packet_for_structural_drafts",
  batchId: TARGET_BATCH_ID,
  modules: ["breakout", "chart_reading_basics", "news_sentiment_events"],
  sourceFamilies: batch.sourceFamilies,
  priorityFocus: batch.priorityFocus,
  riskCounts,
  lessonCards,
  nonGreenRefs,
  handAuthoredLessons,
  commercialReadyPromotions,
  reviewerNoteFields: [
    "originalRewriteNotes",
    "sourceFitNotes",
    "factCheckNotes",
    "boundaryCheckNotes",
    "copyingRiskNotes",
    "humanReviewerInitials",
  ],
  batchExitRule: "Batch 08 can only move to a separate human approval review after every lesson has originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, and reviewer initials. Even then, every lesson remains structural_draft until a later separate approval process.",
  sourceReports: paths,
  boundary: "This batch editor packet is reviewer-facing editing scaffolding only. It does not create learner-facing final prose, approve lessons, publish content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  packetReady: report.packetReady,
  packetMode: report.packetMode,
  batchId: report.batchId,
  lessonCards: report.lessonCards.length,
  modules: report.modules,
  riskCounts: report.riskCounts,
  sourceFamilies: report.sourceFamilies.length,
  nonGreenRefs: report.nonGreenRefs,
  handAuthoredLessons: report.handAuthoredLessons,
  commercialReadyPromotions: report.commercialReadyPromotions,
  outputJson,
  outputMd,
}, null, 2));
