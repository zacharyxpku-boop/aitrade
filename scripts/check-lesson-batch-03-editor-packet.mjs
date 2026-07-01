import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const TARGET_BATCH_ID = "rewrite_batch_03";
const outputJson = "docs/LESSON_BATCH_03_EDITOR_PACKET.json";
const outputMd = "docs/LESSON_BATCH_03_EDITOR_PACKET.md";
const paths = {
  workbench: "docs/LESSON_REWRITE_WORKBENCH.json",
  sourceFitRisk: "docs/LESSON_SOURCE_FIT_RISK_SUMMARY.json",
};
const lessonLabels = {
  lesson_knv2_0156: { moduleLabel: "trading_psychology", topicLabel: "overconfidence" },
  lesson_knv2_0240: { moduleLabel: "trading_psychology", topicLabel: "outcome_bias" },
  lesson_knv2_0004: { moduleLabel: "trend", topicLabel: "trend_definition" },
  lesson_knv2_0040: { moduleLabel: "trend", topicLabel: "trend_exhaustion" },
  lesson_knv2_0052: { moduleLabel: "trend", topicLabel: "trend_continuation" },
  lesson_knv2_0088: { moduleLabel: "trend", topicLabel: "trend_acceleration" },
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
  if (normalized.includes("consumerfinance")) {
    return "Consumer-protection and behavior-risk boundary only; useful for bias framing, not market or trend proof.";
  }
  if (normalized.includes("investor.gov") || normalized.includes("cftc")) {
    return "Fraud, phony-system, investor-protection, or commodity-risk boundary only; never trend-structure proof.";
  }
  if (normalized.includes("sec")) return "Disclosure and filing-literacy boundary only; no chart or trend validation.";
  if (normalized.includes("bls") || normalized.includes("bea") || normalized.includes("federal reserve") || normalized.includes("treasury") || normalized.includes("eia")) {
    return "Macro/data-release context only; cannot validate chart trends, continuation, exhaustion, or acceleration.";
  }
  if (normalized.includes("project gutenberg") || normalized.includes("internet archive")) {
    return "Public-domain historical language and observation context only; strip buy/sell rules, profit claims, and market maxims.";
  }
  return "Reviewer must downgrade to boundary-only unless direct, safe, licensed relevance is confirmed.";
}

function lessonRiskCue(item, riskRow) {
  if (riskRow?.riskLevel === "medium") {
    return "Medium source-fit risk: require explicit notes for broad authority mixing, fraud-source downgrade, and historical-context limits.";
  }
  if (item.module.includes("交易心理")) {
    return "Psychology language must stay behavior-risk oriented; no claim that a bias diagnosis predicts future market movement.";
  }
  if (item.module.includes("趋势")) {
    return "Trend language must stay descriptive and uncertainty-aware; no trigger, signal, forecast, or continuation/exhaustion rule.";
  }
  return "Keep the rewrite as observation-first education, not an action framework.";
}

function buildLessonCard(item, batchCard, riskRow) {
  const labels = lessonLabels[item.lessonId];
  if (!labels) fail(`${item.lessonId} missing ASCII labels`);
  if (item.currentGrade !== "structural_draft") fail(`${item.lessonId} must remain structural_draft`);
  if (item.handAuthored !== false) fail(`${item.lessonId} must remain generated draft`);
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
    reviewerFocus: riskRow?.reviewerFocus || [],
    handAuthored: item.handAuthored,
    mustRemainStructuralDraft: true,
    sourceFamilies,
    greenReviewedRefs: (item.greenReviewedSources || []).length,
    greenAuthorityRefs: (item.greenAuthoritySources || []).length,
    nonGreenRefs: nonGreenRefs.length,
    sourceBoundary: [
      "Use green refs as source identity, behavior-risk, fraud/data/regulatory/historical context, or boundary evidence only.",
      "Consumer-protection and fraud sources can frame overconfidence, outcome bias, and scam risk; they cannot prove market direction.",
      "Macro, disclosure, and data-release sources cannot prove trend definition, continuation, exhaustion, or acceleration.",
      "Public-domain classics may support historical language or observation exercises only after removing advice and profit voice.",
      "Keep yellow, red, and research_only sources out of learner-facing evidence.",
    ],
    licenseBoundary: [
      "Agency/public-document metadata may support reviewer notes, but learner-facing prose must be original.",
      "Do not copy agency logos, UI text, rule text, tables, charts, third-party inserts, or boilerplate.",
      "Do not preserve public-domain buy/sell rules, profit language, or market maxims.",
      "No source identity may imply regulator endorsement, forecast ability, trading-system validity, or commercial readiness.",
    ],
    rewriteInstructions: [
      `Rewrite ${labels.moduleLabel} / ${labels.topicLabel} as original teaching prose for interpretation practice.`,
      lessonRiskCue(item, riskRow),
      "Start with observable facts, separate interpretation from fact, and require at least one alternative explanation.",
      "Convert source references into source-fit and boundary checks; do not convert them into signals or procedures.",
      "End with a no-action learner note: what is known, unknown, and what evidence would weaken the interpretation.",
      "Leave the lesson structural_draft until a real human records all required reviewer notes.",
    ],
    reviewerChecklist: [
      "Original prose: no copied or lightly rewritten external source body text.",
      "Source fit: every consumer/fraud/regulatory/macro/historical family is downgraded, blocked, or boundary-limited as needed.",
      "Boundary: no buy/sell/hold, signal wording, broker/order workflow, automation, real-money guidance, forecast, or performance promise.",
      "License fit: no agency/rule/table/chart/UI/public-domain trading maxim copied.",
      "Teaching quality: includes misconception, observation task, alternative explanation, invalidation condition, and reflection prompt.",
      "Status: remains structural_draft and not_approved after this packet.",
    ],
    sourceFamilyGuidance: sourceFamilies.map((family) => ({ family, editorUse: sourceFamilyRole(family) })),
  };
}

function markdown(report) {
  return [
    "# Lesson Batch 03 Editor Packet",
    "",
    "This packet prepares Batch 03 for human source-fit review without approving lessons or changing grades.",
    "",
    "## Summary",
    "",
    `- Packet ready: ${report.packetReady}`,
    `- Batch: ${report.batchId}`,
    `- Lessons: ${report.lessonCards.length}`,
    `- Modules: ${report.modules.join(", ")}`,
    `- Risk mix: ${Object.entries(report.riskCounts).map(([key, value]) => `${key}:${value}`).join(", ")}`,
    `- Non-green refs: ${report.nonGreenRefs}`,
    `- Hand-authored lessons: ${report.handAuthoredLessons}`,
    `- Commercial-ready promotions: ${report.commercialReadyPromotions}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    "",
    "## Lesson Cards",
    "",
    ...report.lessonCards.flatMap((lesson) => [
      `### ${lesson.lessonId}`,
      "",
      `- Module/topic: ${lesson.moduleLabel} / ${lesson.topicLabel}`,
      `- Source-fit risk: ${lesson.sourceFitRisk}`,
      `- Risk reasons: ${lesson.riskReasons.join(", ") || "none"}`,
      `- Source families: ${lesson.sourceFamilies.join(", ")}`,
      "",
      "Source boundary:",
      ...lesson.sourceBoundary.map((line) => `- ${line}`),
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
if (!batch) fail(`${TARGET_BATCH_ID} missing`);
assertEnvelope(batch, TARGET_BATCH_ID);
if (batch.itemCount !== 6 || batch.lessonCards.length !== 6) fail(`${TARGET_BATCH_ID} must contain 6 lesson cards`);
if (batch.learnerFacingRelease !== false || batch.approvalStatus !== "not_approved") fail(`${TARGET_BATCH_ID} must stay not approved and unreleased`);
if (batch.priorityFocus !== "P1") fail(`${TARGET_BATCH_ID} should stay scoped to P1 review work`);

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
if ((riskCounts.medium || 0) < 3) fail("batch 03 packet must preserve medium-risk focus");
if (nonGreenRefs !== 0) fail("editor packet cannot include non-green refs");
if (handAuthoredLessons !== 0) fail("editor packet must not claim hand-authored lessons");
if (commercialReadyPromotions !== 0) fail("editor packet must not promote lessons");

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  packetReady: true,
  packetMode: "medium_risk_human_editor_packet_for_structural_drafts",
  batchId: TARGET_BATCH_ID,
  modules: ["trading_psychology", "trend"],
  sourceFamilies: batch.sourceFamilies,
  priorityFocus: batch.priorityFocus,
  riskCounts,
  lessonCards,
  nonGreenRefs,
  handAuthoredLessons,
  commercialReadyPromotions,
  reviewerNoteFields: ["originalRewriteNotes", "sourceFitNotes", "factCheckNotes", "boundaryCheckNotes", "copyingRiskNotes", "humanReviewerInitials"],
  sourceReports: paths,
  boundary: "This Batch 03 editor packet is reviewer-facing editing scaffolding only. It does not create learner-facing final prose, approve lessons, publish content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or make the product production-ready.",
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
