import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const TARGET_BATCH_ID = "rewrite_batch_02";
const outputJson = "docs/LESSON_BATCH_02_REVIEW_NOTES_DRY_RUN.json";
const outputMd = "docs/LESSON_BATCH_02_REVIEW_NOTES_DRY_RUN.md";
const paths = { editorPacket: "docs/LESSON_BATCH_02_EDITOR_PACKET.json" };
const REQUIRED_NOTE_FIELDS = ["originalRewriteNotes", "sourceFitNotes", "factCheckNotes", "boundaryCheckNotes", "copyingRiskNotes", "humanReviewerInitials"];
const UNSAFE_TEXT_PATTERN = /buy|sell|hold|signal|broker|order|auto.?trading|real.?money|profit|win.?rate|return|approved|commercial_ready|production_ready|learner.?facing/i;

function fail(message) {
  throw new Error(message);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function assertEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function blankNoteCard(lesson) {
  return {
    lessonId: lesson.lessonId,
    nodeId: lesson.nodeId,
    moduleLabel: lesson.moduleLabel,
    topicLabel: lesson.topicLabel,
    sourceFitRisk: lesson.sourceFitRisk,
    riskReasons: lesson.riskReasons,
    trackingStatus: "not_started",
    currentGrade: "structural_draft",
    mustRemainStructuralDraft: true,
    sourceFamilies: lesson.sourceFamilies,
    originalRewriteNotes: "",
    sourceFitNotes: "",
    factCheckNotes: "",
    boundaryCheckNotes: "",
    copyingRiskNotes: "",
    humanReviewerInitials: "",
    notePrompts: {
      originalRewriteNotes: `Record how the human rewrite teaches ${lesson.moduleLabel}/${lesson.topicLabel} in original prose without copying source text.`,
      sourceFitNotes: "Record macro/regulatory/fraud/public-domain source-fit decisions; range and reversal rows need explicit downgrade or boundary-only notes.",
      factCheckNotes: "Record facts checked against source identity, release context, terminology, and lesson claims.",
      boundaryCheckNotes: "Confirm no advice, signals, forecasts, broker/order workflow, automation, real-money guidance, performance promise, or readiness claim.",
      copyingRiskNotes: "Confirm no external body text, rules, tables, charts, UI text, public-domain maxims, or sample notes were copied.",
      humanReviewerInitials: "Fill only after a real human reviewer performs the review work.",
    },
  };
}

function validateCard(card) {
  if (card.trackingStatus !== "not_started") fail(`${card.lessonId} trackingStatus must remain not_started in dry-run`);
  if (card.currentGrade !== "structural_draft") fail(`${card.lessonId} currentGrade must remain structural_draft`);
  if (card.mustRemainStructuralDraft !== true) fail(`${card.lessonId} mustRemainStructuralDraft must stay true`);
  for (const field of REQUIRED_NOTE_FIELDS) {
    const value = card[field];
    if (UNSAFE_TEXT_PATTERN.test(String(value))) fail(`${card.lessonId}.${field} contains unsafe status/trading/readiness wording`);
    if (value !== "") fail(`${card.lessonId}.${field} must remain blank in dry-run`);
  }
}

let editorPacket;
function buildDryRunOverlay() {
  return {
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    expectedOutcome: EXPECTED_OUTCOME,
    dryRunOnly: true,
    batchId: TARGET_BATCH_ID,
    reviewStatus: "not_started",
    approvalReviewCandidates: 0,
    commercialReadyPromotions: 0,
    lessonCards: editorPacket.lessonCards.map(blankNoteCard),
  };
}

function validateDryRunOverlay(overlay) {
  assertEnvelope(overlay, "batch 02 dry-run overlay");
  if (overlay.dryRunOnly !== true) fail("dry-run overlay must keep dryRunOnly true");
  if (overlay.batchId !== TARGET_BATCH_ID) fail("dry-run overlay must stay scoped to rewrite_batch_02");
  if (overlay.reviewStatus !== "not_started") fail("dry-run overlay reviewStatus must remain not_started");
  if (overlay.approvalReviewCandidates !== 0) fail("dry-run overlay cannot create approval review candidates");
  if (overlay.commercialReadyPromotions !== 0) fail("dry-run overlay cannot promote commercial readiness");
  if (!Array.isArray(overlay.lessonCards) || overlay.lessonCards.length !== 6) fail("dry-run overlay must include 6 lesson cards");
  const seen = new Set();
  for (const card of overlay.lessonCards) {
    if (seen.has(card.lessonId)) fail(`duplicate lesson card ${card.lessonId}`);
    seen.add(card.lessonId);
    validateCard(card);
  }
}

function negativeCase(name, mutate, expectedPattern) {
  const overlay = buildDryRunOverlay();
  mutate(overlay);
  try {
    validateDryRunOverlay(overlay);
  } catch (error) {
    return { name, passed: expectedPattern.test(error.message), errorMessage: error.message };
  }
  return { name, passed: false, errorMessage: "negative case unexpectedly passed" };
}

function markdown(report) {
  return [
    "# Lesson Batch 02 Review Notes Dry Run",
    "",
    "This is a blank reviewer-notes dry run for Batch 02 reversal/range/psychology source-fit review.",
    "",
    "## Summary",
    "",
    `- Dry run ready: ${report.dryRunReady}`,
    `- Batch: ${report.batchId}`,
    `- Lesson cards: ${report.lessonCards}`,
    `- Blank note fields: ${report.blankNoteFields}`,
    `- Filled note fields: ${report.filledNoteFields}`,
    `- Negative cases passed: ${report.negativeCasesPassed}/${report.negativeCases}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Commercial-ready promotions: ${report.commercialReadyPromotions}`,
    "",
    "## Blank Note Rows",
    "",
    "| Lesson | Module | Topic | Risk | Risk reasons | Blank fields | Status |",
    "| --- | --- | --- | --- | --- | ---: | --- |",
    ...report.blankRows.map((row) => `| ${row.lessonId} | ${row.moduleLabel} | ${row.topicLabel} | ${row.sourceFitRisk} | ${row.riskReasons.join(", ") || "none"} | ${row.blankFields} | ${row.trackingStatus} |`),
    "",
    "## Negative Cases",
    "",
    "| Case | Passed | Error message |",
    "| --- | --- | --- |",
    ...report.negativeRows.map((row) => `| ${row.name} | ${row.passed} | ${row.errorMessage.replaceAll("|", "/")} |`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

editorPacket = await readJson(paths.editorPacket);
assertEnvelope(editorPacket, "batch 02 editor packet");
if (editorPacket.batchId !== TARGET_BATCH_ID) fail("editor packet must target rewrite_batch_02");
if (editorPacket.packetReady !== true) fail("editor packet must be ready before notes dry-run");
if (editorPacket.nonGreenRefs !== 0) fail("editor packet must not include non-green refs");
if (editorPacket.handAuthoredLessons !== 0) fail("editor packet cannot claim hand-authored lessons");
if (editorPacket.commercialReadyPromotions !== 0) fail("editor packet cannot promote lessons");
if ((editorPacket.riskCounts?.medium || 0) < 2) fail("editor packet must preserve medium-risk focus");

const dryRunOverlay = buildDryRunOverlay();
validateDryRunOverlay(dryRunOverlay);
const negativeRows = [
  negativeCase("filled_note_rejected", (overlay) => { overlay.lessonCards[0].sourceFitNotes = "Boundary-only source fit note."; }, /must remain blank/),
  negativeCase("approval_candidate_rejected", (overlay) => { overlay.approvalReviewCandidates = 1; }, /approval review candidates/),
  negativeCase("commercial_promotion_rejected", (overlay) => { overlay.commercialReadyPromotions = 1; }, /commercial readiness/),
  negativeCase("learner_release_rejected", (overlay) => { overlay.learnerFacingRelease = true; }, /learner-facing release/),
  negativeCase("grade_override_rejected", (overlay) => { overlay.lessonCards[0].currentGrade = "commercial_ready"; }, /currentGrade/),
  negativeCase("signal_wording_rejected", (overlay) => { overlay.lessonCards[0].boundaryCheckNotes = "This confirms a range-edge signal."; }, /unsafe status\/trading\/readiness wording/),
  negativeCase("duplicate_lesson_rejected", (overlay) => { overlay.lessonCards.push({ ...overlay.lessonCards[0] }); }, /6 lesson cards|duplicate/),
  negativeCase("wrong_batch_rejected", (overlay) => { overlay.batchId = "rewrite_batch_03"; }, /rewrite_batch_02/),
];
const failedNegativeRows = negativeRows.filter((row) => !row.passed);
if (failedNegativeRows.length) fail(`batch 02 notes dry-run negative cases failed: ${failedNegativeRows.map((row) => row.name).join(", ")}`);
const blankRows = dryRunOverlay.lessonCards.map((card) => ({
  lessonId: card.lessonId,
  moduleLabel: card.moduleLabel,
  topicLabel: card.topicLabel,
  sourceFitRisk: card.sourceFitRisk,
  riskReasons: card.riskReasons,
  trackingStatus: card.trackingStatus,
  blankFields: REQUIRED_NOTE_FIELDS.filter((field) => card[field] === "").length,
}));
const blankNoteFields = blankRows.reduce((sum, row) => sum + row.blankFields, 0);
const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  dryRunReady: true,
  dryRunMode: "blank_reviewer_notes_template_only",
  batchId: TARGET_BATCH_ID,
  lessonCards: dryRunOverlay.lessonCards.length,
  requiredNoteFields: REQUIRED_NOTE_FIELDS,
  blankNoteFields,
  filledNoteFields: 0,
  approvalReviewCandidates: 0,
  commercialReadyPromotions: 0,
  blankRows,
  dryRunOverlay,
  negativeCases: negativeRows.length,
  negativeCasesPassed: negativeRows.filter((row) => row.passed).length,
  negativeRows,
  sourceReports: paths,
  boundary: "This Batch 02 notes dry-run is a blank reviewer-input scaffold only. It does not create real review evidence, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or make the product production-ready.",
};
await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");
console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  dryRunReady: report.dryRunReady,
  dryRunMode: report.dryRunMode,
  batchId: report.batchId,
  lessonCards: report.lessonCards,
  blankNoteFields: report.blankNoteFields,
  filledNoteFields: report.filledNoteFields,
  negativeCasesPassed: report.negativeCasesPassed,
  negativeCases: report.negativeCases,
  approvalReviewCandidates: report.approvalReviewCandidates,
  commercialReadyPromotions: report.commercialReadyPromotions,
  outputJson,
  outputMd,
}, null, 2));
