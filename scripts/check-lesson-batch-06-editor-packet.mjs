import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const TARGET_BATCH_ID = "rewrite_batch_06";
const outputJson = "docs/LESSON_BATCH_06_EDITOR_PACKET.json";
const outputMd = "docs/LESSON_BATCH_06_EDITOR_PACKET.md";
const paths = {
  workbench: "docs/LESSON_REWRITE_WORKBENCH.json",
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
  if (normalized.includes("investor.gov")) {
    return "Investor protection and fraud-red-flag context only; no trading conclusion or product endorsement.";
  }
  if (normalized.includes("cftc")) {
    return "Fraud, phony-system, digital-asset, commodity-risk, or market-report boundary context only.";
  }
  if (normalized === "sec") {
    return "Disclosure, filing-literacy, investor-protection, or source-boundary context only.";
  }
  if (normalized === "bls") {
    return "Macro release vocabulary and labor/inflation data-method context only; no market-direction forecast.";
  }
  if (normalized === "bea") {
    return "GDP, national-account, release-method, or public-domain-use boundary context only.";
  }
  if (normalized.includes("treasury") || normalized.includes("treasurydirect")) {
    return "Official rate/debt-data context and terminology boundary only; no rate-trade recommendation.";
  }
  if (normalized.includes("financialresearch.gov")) {
    return "Financial stability and research-boundary context only; no model performance claim.";
  }
  if (normalized.includes("project gutenberg") || normalized.includes("internet archive")) {
    return "Public-domain historical language and observation exercises only; remove old buy/sell rules and profit language.";
  }
  if (normalized === "eia") {
    return "Energy data release context only; no commodity price direction or trading call.";
  }
  return "Reviewer must classify as context-only unless license, source fit, and safe-use role are confirmed.";
}

const lessonLabels = {
  lesson_knv2_0275: { moduleLabel: "risk_management", topicLabel: "uncertainty" },
  lesson_knv2_0007: { moduleLabel: "reversal", topicLabel: "reversal_definition" },
  lesson_knv2_0031: { moduleLabel: "reversal", topicLabel: "double_top_double_bottom" },
  lesson_knv2_0010: { moduleLabel: "backtest_mistakes", topicLabel: "look_ahead_bias" },
  lesson_knv2_0022: { moduleLabel: "backtest_mistakes", topicLabel: "small_sample" },
  lesson_knv2_0034: { moduleLabel: "backtest_mistakes", topicLabel: "overfitting" },
};

function lessonRiskCue(item) {
  if (item.module.includes("风险") || item.module.toLowerCase().includes("risk")) {
    return "Emphasize uncertainty, sizing language as conceptual risk vocabulary only, and no real-money operation.";
  }
  if (item.module.includes("回测")) {
    return "Emphasize backtest hygiene, sample limits, leakage, and validation boundaries without performance promises.";
  }
  if (item.module.includes("反转")) {
    return "Emphasize observation, invalidation, and alternative explanations without reversal signals.";
  }
  return "Keep the rewrite as observation-first education, not an action framework.";
}

function buildLessonCard(item, batchCard) {
  const labels = lessonLabels[item.lessonId] || {
    moduleLabel: `module_for_${item.lessonId}`,
    topicLabel: `topic_for_${item.lessonId}`,
  };
  const reviewedRefs = [...(item.greenReviewedSources || []), ...(item.greenAuthoritySources || [])];
  const nonGreenRefs = reviewedRefs.filter((source) => !String(source.sourceUseTier || "").startsWith("green_"));
  if (nonGreenRefs.length) fail(`${item.lessonId} has non-green refs in editor packet`);
  if (item.currentGrade !== "structural_draft") fail(`${item.lessonId} must remain structural_draft`);
  if (item.handAuthored !== false) fail(`${item.lessonId} must be generated draft for this packet`);
  if (batchCard.mustRemainStructuralDraft !== true) fail(`${item.lessonId} batch card must remain structural draft`);

  const uniqueFamilies = [...new Set(item.sourceFamilies || [])];
  const sourceFamilyGuidance = uniqueFamilies.map((family) => ({
    family,
    editorUse: sourceFamilyRole(family),
  }));

  return {
    lessonId: item.lessonId,
    nodeId: item.nodeId,
    moduleLabel: labels.moduleLabel,
    topicLabel: labels.topicLabel,
    currentGrade: item.currentGrade,
    currentScore: item.currentScore,
    rewritePriority: item.rewritePriority,
    handAuthored: item.handAuthored,
    mustRemainStructuralDraft: true,
    sourceFamilies: uniqueFamilies,
    greenReviewedRefs: (item.greenReviewedSources || []).length,
    greenAuthorityRefs: (item.greenAuthoritySources || []).length,
    nonGreenRefs: nonGreenRefs.length,
    sourceBoundary: [
      "Use green refs as source-fit, term, fact-boundary, fraud/data/historical-context evidence only.",
      "Do not copy source body text into lesson prose or reviewer notes.",
      "Treat family-specific roles as context boundaries, not as claims that the source directly teaches the lesson.",
      "If a green source feels mismatched, downgrade it to boundary-only or block the lesson for source replacement.",
      "Keep all yellow, red, and research_only sources out of learner-facing evidence.",
    ],
    licenseBoundary: [
      "Agency/public-document metadata may support original rewrite evidence, but do not copy logos, UI text, third-party inserts, tables, charts, or boilerplate.",
      "Public-domain classics may support historical terminology and observation prompts only after edition/date spot check.",
      "Do not preserve old market maxims, buy/sell rules, or profit language from historical texts.",
      "Cite source identity in reviewer notes; keep learner-facing prose original and paraphrased at the concept level.",
    ],
    rewriteInstructions: [
      `Rewrite ${labels.moduleLabel} / ${labels.topicLabel} as original teaching prose for a learner who is practicing interpretation, not making trades.`,
      lessonRiskCue(item),
      "Start from observable evidence, then explain interpretation limits, then list what the learner must not conclude.",
      "Convert source references into boundaries and vocabulary checks; do not turn them into market direction, signals, or a procedure for live action.",
      "Add a no-action close: the learner records what is known, unknown, and what would invalidate the interpretation.",
      "Leave the lesson as structural_draft until a human editor records originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, and copyingRiskNotes.",
    ],
    reviewerChecklist: [
      "Original prose: no copied or lightly rewritten external source body text.",
      "Source fit: every source family has a defined role or is downgraded/blocked.",
      "License fit: no agency logos, UI text, third-party material, public-domain boilerplate, or historical trading maxims copied into prose.",
      "Boundary: no buy/sell/hold wording, signal wording, position sizing instruction, order/broker workflow, automation, real-money guidance, performance promise, or forecast.",
      "Teaching quality: includes misconception, observation task, alternative explanation, invalidation condition, and reflection prompt.",
      "Status: remains structural_draft and not_approved after this packet.",
    ],
    sourceFamilyGuidance,
  };
}

function markdown(report) {
  return [
    "# Lesson Batch 06 Editor Packet",
    "",
    "This packet turns one non-first-reviewer rewrite batch into a bounded human editing packet.",
    "It strengthens source, license, rewrite, and checklist guidance without approving lessons or changing grades.",
    "",
    "## Summary",
    "",
    `- Packet ready: ${report.packetReady}`,
    `- Batch: ${report.batchId}`,
    `- Lessons: ${report.lessonCards.length}`,
    `- Modules: ${report.modules.join(", ")}`,
    `- Source families: ${report.sourceFamilies.join(", ")}`,
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
assertEnvelope(workbench, "lesson rewrite workbench");

const batch = workbench.batchReviewGuide?.batches?.find((row) => row.batchId === TARGET_BATCH_ID);
if (!batch) fail(`${TARGET_BATCH_ID} missing from batch review guide`);
assertEnvelope(batch, TARGET_BATCH_ID);
if (["rewrite_batch_01", "rewrite_batch_05"].includes(batch.batchId)) fail("editor packet must target a non-first-reviewer batch");
if (batch.itemCount !== 6 || batch.lessonCards.length !== 6) fail(`${TARGET_BATCH_ID} must contain 6 lesson cards`);
if (batch.learnerFacingRelease !== false || batch.approvalStatus !== "not_approved") fail(`${TARGET_BATCH_ID} must stay not approved and unreleased`);

const itemsById = new Map(workbench.items.map((item) => [item.lessonId, item]));
const lessonCards = batch.lessonCards.map((card) => {
  const item = itemsById.get(card.lessonId);
  if (!item) fail(`${card.lessonId} missing from workbench items`);
  assertEnvelope(item, card.lessonId);
  return buildLessonCard(item, card);
});

const nonGreenRefs = lessonCards.reduce((sum, lesson) => sum + lesson.nonGreenRefs, 0);
const handAuthoredLessons = lessonCards.filter((lesson) => lesson.handAuthored).length;
const commercialReadyPromotions = lessonCards.filter((lesson) => lesson.currentGrade === "commercial_ready").length;
if (nonGreenRefs !== 0) fail("editor packet cannot include non-green source refs");
if (handAuthoredLessons !== 0) fail("batch 06 editor packet must not claim hand-authored lessons");
if (commercialReadyPromotions !== 0) fail("batch 06 editor packet must not promote lessons");

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
  modules: ["risk_management", "reversal", "backtest_mistakes"],
  sourceFamilies: batch.sourceFamilies,
  priorityFocus: batch.priorityFocus,
  lessonCards,
  nonGreenRefs,
  handAuthoredLessons,
  commercialReadyPromotions,
  batchExitRule: "Batch 06 can only move to a separate human approval review after every lesson has originalRewriteNotes, sourceFitNotes, factCheckNotes, boundaryCheckNotes, copyingRiskNotes, and reviewer initials. Even then, every lesson remains structural_draft until a later separate approval process.",
  reviewerNoteFields: [
    "originalRewriteNotes",
    "sourceFitNotes",
    "factCheckNotes",
    "boundaryCheckNotes",
    "copyingRiskNotes",
    "humanReviewerInitials",
  ],
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
  sourceFamilies: report.sourceFamilies.length,
  nonGreenRefs: report.nonGreenRefs,
  handAuthoredLessons: report.handAuthoredLessons,
  commercialReadyPromotions: report.commercialReadyPromotions,
  outputJson,
  outputMd,
}, null, 2));
