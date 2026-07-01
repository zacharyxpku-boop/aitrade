import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const TARGET_BATCH_ID = "rewrite_batch_07";
const outputJson = "docs/LESSON_BATCH_07_EDITOR_PACKET.json";
const outputMd = "docs/LESSON_BATCH_07_EDITOR_PACKET.md";
const paths = {
  workbench: "docs/LESSON_REWRITE_WORKBENCH.json",
  sourceFitRisk: "docs/LESSON_SOURCE_FIT_RISK_SUMMARY.json",
};

const lessonLabels = {
  lesson_knv2_0046: { moduleLabel: "backtest_mistakes", topicLabel: "ignored_costs" },
  lesson_knv2_0002: { moduleLabel: "market_structure", topicLabel: "highs_and_lows" },
  lesson_knv2_0026: { moduleLabel: "market_structure", topicLabel: "structure_break" },
  lesson_knv2_0005: { moduleLabel: "breakout", topicLabel: "pre_breakout_compression" },
  lesson_knv2_0017: { moduleLabel: "breakout", topicLabel: "valid_breakout" },
  lesson_knv2_0029: { moduleLabel: "breakout", topicLabel: "false_breakout" },
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
  if (normalized.includes("investor.gov")) return "Investor-protection and fraud-boundary context only; no trading conclusion.";
  if (normalized.includes("sec")) return "Disclosure, filing-literacy, and source-boundary context only.";
  if (normalized.includes("cftc")) return "Fraud, phony-system, commodity-risk, or market-report boundary context only.";
  if (normalized.includes("bls")) return "Macro release vocabulary and data-method context only; no market forecast.";
  if (normalized.includes("bea")) return "National-account, GDP, release-method, or data-boundary context only.";
  if (normalized.includes("federal reserve")) return "Policy/data-release context only; no rate, breakout, or direction call.";
  if (normalized.includes("treasury")) return "Official rate/debt-data terminology boundary only; no rate-trade recommendation.";
  if (normalized.includes("eia")) return "Energy data release context only; no commodity price direction.";
  if (normalized.includes("nist")) return "Measurement, model-risk, and process-quality context only; no trading-system certification.";
  if (normalized.includes("project gutenberg") || normalized.includes("internet archive")) {
    return "Public-domain historical language and observation exercises only; remove old buy/sell rules and profit language.";
  }
  return "Reviewer must classify as context-only unless license, source fit, and safe-use role are confirmed.";
}

function lessonRiskCue(item) {
  if (item.module.includes("回测")) {
    return "Emphasize cost, friction, leakage, and validation boundaries without performance promises.";
  }
  if (item.module.includes("市场结构")) {
    return "Emphasize descriptive structure reading, alternative explanations, and invalidation without action rules.";
  }
  if (item.module.includes("突破")) {
    return "Emphasize observation, confirmation limits, and false-breakout ambiguity without signal wording.";
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
    handAuthored: item.handAuthored,
    mustRemainStructuralDraft: true,
    sourceFamilies,
    greenReviewedRefs: (item.greenReviewedSources || []).length,
    greenAuthorityRefs: (item.greenAuthoritySources || []).length,
    nonGreenRefs: nonGreenRefs.length,
    sourceBoundary: [
      "Use green refs as context, vocabulary, method, data-release, historical, or fraud-boundary evidence only.",
      "Do not copy source body text, charts, tables, UI text, boilerplate, or historical market maxims.",
      "Do not treat macro, filing, or public-domain context as proof of a chart pattern or breakout outcome.",
      "If a source family does not directly fit the lesson claim, downgrade it to boundary-only or block for source replacement.",
      "Keep yellow, red, and research_only sources out of learner-facing evidence.",
    ],
    licenseBoundary: [
      "Agency/public-document metadata may support reviewer notes, but learner-facing prose must be original.",
      "Public-domain classics may support historical terminology and observation prompts only after edition/date spot check.",
      "Remove any buy/sell rule, profit language, or prescriptive market maxim from historical context.",
      "No source identity may imply regulator endorsement, forecast ability, or commercial readiness.",
    ],
    rewriteInstructions: [
      `Rewrite ${labels.moduleLabel} / ${labels.topicLabel} as original teaching prose for interpretation practice.`,
      lessonRiskCue(item),
      "Teach the observation, then the uncertainty, then the forbidden conclusion.",
      "Convert source references into source-fit and boundary checks; do not convert them into a trade rule.",
      "End with a no-action learner note: what is known, what is unknown, and what evidence would weaken the interpretation.",
      "Leave the lesson as structural_draft until a real human records all required reviewer notes.",
    ],
    reviewerChecklist: [
      "Original prose: no copied or lightly rewritten external source body text.",
      "Source fit: every source family has a defined role, downgrade, or block decision.",
      "License fit: no agency logos, third-party inserts, source tables, charts, UI text, or public-domain trading maxims copied.",
      "Boundary: no buy/sell/hold wording, signal wording, broker/order workflow, automation, real-money guidance, forecast, or performance promise.",
      "Teaching quality: includes misconception, observation task, alternative explanation, invalidation condition, and reflection prompt.",
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
    "# Lesson Batch 07 Editor Packet",
    "",
    "This packet turns Batch 07 into a bounded human editing packet for low-to-medium risk structural drafts.",
    "It strengthens source, license, rewrite, and checklist guidance without approving lessons or changing grades.",
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
if (handAuthoredLessons !== 0) fail("batch 07 editor packet must not claim hand-authored lessons");
if (commercialReadyPromotions !== 0) fail("batch 07 editor packet must not promote lessons");

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
  modules: ["backtest_mistakes", "market_structure", "breakout"],
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
  batchExitRule: "Batch 07 can only move to a separate human approval review after every lesson has originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, and reviewer initials. Even then, every lesson remains structural_draft until a later separate approval process.",
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
