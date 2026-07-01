import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const TARGET_BATCH_ID = "rewrite_batch_01";
const outputJson = "docs/LESSON_BATCH_01_EDITOR_PACKET.json";
const outputMd = "docs/LESSON_BATCH_01_EDITOR_PACKET.md";
const paths = {
  workbench: "docs/LESSON_REWRITE_WORKBENCH.json",
  sourceFitRisk: "docs/LESSON_SOURCE_FIT_RISK_SUMMARY.json",
};
const lessonLabels = {
  lesson_knv2_0044: { moduleLabel: "multi_timeframe_analysis", topicLabel: "m15_detail" },
  lesson_knv2_0068: { moduleLabel: "multi_timeframe_analysis", topicLabel: "d1_context" },
  lesson_knv2_0128: { moduleLabel: "multi_timeframe_analysis", topicLabel: "d1_context_variant" },
  lesson_knv2_0140: { moduleLabel: "multi_timeframe_analysis", topicLabel: "h4_structure" },
  lesson_knv2_0054: { moduleLabel: "trading_range", topicLabel: "range_breakout" },
  lesson_knv2_0019: { moduleLabel: "reversal", topicLabel: "exhaustion_evidence" },
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
  if (normalized.includes("investor.gov") || normalized.includes("cftc")) {
    return "Fraud, phony-system, and investor-protection boundary only; never chart/timeframe/reversal evidence.";
  }
  if (normalized.includes("sec") || normalized.includes("federalregister.gov")) {
    return "Disclosure, filing, rulemaking, and source-boundary context only; no chart claim validation.";
  }
  if (normalized.includes("federal reserve") || normalized.includes("treasury") || normalized.includes("bea") || normalized.includes("bls")) {
    return "Macro/data-release context only; no market-direction, timeframe, breakout, or reversal forecast.";
  }
  if (normalized.includes("project gutenberg")) {
    return "Public-domain historical language and observation context only; strip old rules, profit language, and market maxims.";
  }
  return "Reviewer must downgrade to boundary-only unless a direct, safe, licensed role is confirmed.";
}

function lessonRiskCue(item, riskRow) {
  if (riskRow?.riskLevel === "high") {
    return "High-risk source fit: require explicit downgrade/block notes for every fraud or broad authority source before rewrite.";
  }
  if ((riskRow?.riskReasons || []).includes("chart_lesson_without_public_domain_historical_context")) {
    return "Chart/timeframe language must be observation-only unless historical context is explicitly bounded.";
  }
  if ((riskRow?.riskReasons || []).includes("broad_source_family_mix")) {
    return "Broad authority mix must be narrowed into source roles before any teaching prose is rewritten.";
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
    handAuthored: item.handAuthored,
    mustRemainStructuralDraft: true,
    sourceFamilies,
    greenReviewedRefs: (item.greenReviewedSources || []).length,
    greenAuthorityRefs: (item.greenAuthoritySources || []).length,
    nonGreenRefs: nonGreenRefs.length,
    sourceBoundary: [
      "Use green refs as source identity, fraud/data/regulatory/historical context, or boundary evidence only.",
      "Fraud and regulator sources cannot prove timeframe structure, range breakouts, reversal exhaustion, or chart validity.",
      "Macro sources cannot become a market-direction forecast, timeframe hierarchy, or confirmation rule.",
      "High-risk rows require sourceFitNotes that downgrade, block, or explicitly boundary-limit each weak-fit family.",
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
      "High-risk source fit: every fraud/regulatory/macro family is downgraded, blocked, or boundary-limited.",
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
    "# Lesson Batch 01 High-Risk Editor Packet",
    "",
    "This packet prepares Batch 01 for high-risk human source-fit review without approving lessons or changing grades.",
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
if (batch.priorityFocus !== "P0+P1") fail(`${TARGET_BATCH_ID} should stay scoped to P0+P1 review work`);

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
if ((riskCounts.high || 0) < 1) fail("batch 01 packet must preserve high-risk focus");
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
  packetMode: "high_risk_human_editor_packet_for_structural_drafts",
  batchId: TARGET_BATCH_ID,
  modules: ["multi_timeframe_analysis", "trading_range", "reversal"],
  sourceFamilies: batch.sourceFamilies,
  priorityFocus: batch.priorityFocus,
  riskCounts,
  lessonCards,
  nonGreenRefs,
  handAuthoredLessons,
  commercialReadyPromotions,
  reviewerNoteFields: ["originalRewriteNotes", "sourceFitNotes", "factCheckNotes", "boundaryCheckNotes", "copyingRiskNotes", "humanReviewerInitials"],
  sourceReports: paths,
  boundary: "This high-risk batch editor packet is reviewer-facing editing scaffolding only. It does not create learner-facing final prose, approve lessons, publish content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or make the product production-ready.",
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
