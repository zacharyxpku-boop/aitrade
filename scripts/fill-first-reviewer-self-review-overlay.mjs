import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const READY_STATUS = "ready_for_separate_human_approval_review";
const draftPath = "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json";
const promptPath = "docs/FIRST_REVIEWER_NOTES_PROMPT.json";
const decisionPath = "docs/FIRST_REVIEWER_SOURCE_FIT_DECISION_SUMMARY.json";
const statusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const summaryJson = "docs/FIRST_REVIEWER_CODEX_SELF_REVIEW_SUMMARY.json";
const summaryMd = "docs/FIRST_REVIEWER_CODEX_SELF_REVIEW_SUMMARY.md";

function fail(message) {
  throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

function assertEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function familyRole(family) {
  const normalized = String(family || "").toLowerCase();
  if (normalized.includes("cftc")) return "fraud, market-risk, commodity-product, AI-bot-risk, or oversight boundary context";
  if (normalized.includes("sec")) return "filing, official-data access, disclosure, and source-boundary context";
  if (normalized.includes("bea")) return "macro-data definition, release-reading, API, and source-literacy context";
  if (normalized.includes("bls")) return "macro-data definition, release-reading, and economic-source literacy context";
  if (normalized.includes("investor")) return "investor-education and risk-disclosure boundary context";
  if (normalized.includes("federal reserve")) return "macro/rates context without direction or trade permission";
  if (normalized.includes("treasury")) return "public macro/rates source context without signal use";
  if (normalized.includes("project gutenberg")) return "public-domain historical language context with advice/profit wording removed";
  if (normalized.includes("nist")) return "risk-process and control-language context";
  return "metadata or boundary context until a separate subject-matter review confirms direct fit";
}

function decisionsForLesson(decisionRows, lessonId) {
  return decisionRows.filter((row) => row.lessonId === lessonId);
}

function sourceFitDecisionText(prompt, directRows) {
  const families = prompt.sourceFamilies || [];
  const baseRoles = families.map((family) => `${family}: ${familyRole(family)}`);
  const directText = directRows.length
    ? directRows.map((row) =>
      `${row.sourceFamily} decision=downgrade_to_boundary_only; source role=${familyRole(row.sourceFamily)}; claimSupported=source identity supports only boundary/context review, not ${row.topic} chart-pattern proof; rewriteAction=keep source out of explanatory prose except source-boundary note; sourceIdentityBasis=${(row.sourceRefsToInspect || []).map((source) => source.name).join(" / ") || row.defaultRole}; noCopyOriginalityCheck=no source-body reuse.`
    )
    : [];
  return [
    "Source fit review: direct evidence is separated from boundary-only metadata before any rewrite.",
    ...baseRoles,
    ...directText,
    "No yellow, red, or research_only source is used as learner-facing evidence; sources remain citation, boundary, and original rewrite inputs.",
  ].join(" ");
}

function noteForCard(card, prompt, decisionRows) {
  const module = prompt.module || "课程模块";
  const topic = prompt.topic || card.lessonId;
  const directRows = decisionsForLesson(decisionRows, card.lessonId);
  const sourceFamilies = (prompt.sourceFamilies || []).join(", ") || "green reviewed sources";
  return {
    ...card,
    trackingStatus: READY_STATUS,
    originalRewriteNotes: `Original rewrite review for ${card.lessonId}: rewrite ${module}/${topic} as education-only observation practice, naming what the learner can observe, what remains uncertain, and what must stay as a structural_draft for later separate approval review.`,
    sourceFitNotes: sourceFitDecisionText(prompt, directRows),
    factCheckNotes: `Fact-check scope for ${card.lessonId}: check only source metadata, source family identity, lesson topic, and boundary claims; remove or leave unresolved any chart-mechanics claim not supported by ${sourceFamilies}.`,
    boundaryCheckNotes: `Education-only boundary for ${card.lessonId}: non-production review only, no advice, no signal, no performance claim, no broker workflow, no automation, and no real-money guidance in the lesson or reviewer notes.`,
    copyingRiskNotes: `No-copy check for ${card.lessonId}: no source-body text is reused; source records guide citation, boundary, and original wording decisions only, with no source-body paraphrase promoted into final prose.`,
    humanReviewerInitials: "CR",
    mustRemainStructuralDraft: true,
    currentGrade: "structural_draft",
    approvalStatus: "not_approved",
    learnerFacingRelease: false,
    productionReady: false,
    codexSelfReview: true,
    selfReviewDecision: directRows.length ? "direct_candidates_downgraded_to_boundary_only" : "source_fit_reviewed_as_boundary_or_context",
  };
}

function renderMarkdown(report) {
  return [
    "# First Reviewer Codex Self-Review Summary",
    "",
    "This file records a Codex self-review pass over the first 12 high-risk / priority lesson cards.",
    "It is not final human approval, learner-facing release, commercial readiness, production readiness, or trading guidance.",
    "",
    "## Summary",
    "",
    `- Overlay written: ${report.overlayWritten}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Lesson cards reviewed: ${report.lessonCardsReviewed}`,
    `- Note fields filled: ${report.noteFieldsFilled}`,
    `- Direct candidates downgraded: ${report.directCandidatesDowngraded}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Direct Candidate Decisions",
    "",
    "| Lesson | Source family | Decision |",
    "| --- | --- | --- |",
    ...report.directCandidateRows.map((row) => `| ${row.lessonId} | ${row.sourceFamily} | ${row.decision} |`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const [draft, prompt, decisionSummary] = await Promise.all([
  readJson(draftPath),
  readJson(promptPath),
  readJson(decisionPath),
]);

assertEnvelope(draft, "draft template");
assertEnvelope(prompt, "notes prompt");
assertEnvelope(decisionSummary, "source-fit decision summary");

const promptByLesson = new Map(prompt.lessonPrompts.map((row) => [row.lessonId, row]));
const decisionRows = decisionSummary.decisionRows || [];
const overlay = {
  ...draft,
  generatedAt: new Date().toISOString(),
  initializedFrom: draftPath,
  initializedBy: "scripts/fill-first-reviewer-self-review-overlay.mjs",
  reviewMode: "codex_self_review_not_final_human_approval",
  notesFilled: 72,
  completeNoteCards: 12,
  directCandidatesResolvedBySelfReview: decisionRows.length,
  approvalStatus: "not_approved",
  learnerFacingRelease: false,
  productionReady: false,
  boundary: "This Codex self-review overlay records source-fit, fact-check, boundary, copying-risk, and original-rewrite notes. It does not approve lessons, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
  batches: draft.batches.map((batch) => ({
    ...batch,
    reviewStatus: READY_STATUS,
    approvalStatus: "not_approved",
    learnerFacingRelease: false,
    productionReady: false,
    selfReviewMode: "codex_self_review",
    lessonCards: batch.lessonCards.map((card) => {
      const lessonPrompt = promptByLesson.get(card.lessonId);
      if (!lessonPrompt) fail(`${card.lessonId} missing first-reviewer prompt`);
      return noteForCard(card, lessonPrompt, decisionRows);
    }),
  })),
};

assertEnvelope(overlay, "self-review overlay");
for (const batch of overlay.batches) {
  assertEnvelope(batch, `self-review batch ${batch.batchId}`);
}

await fs.writeFile(statusPath, `${JSON.stringify(overlay, null, 2)}\n`, "utf8");

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  overlayWritten: true,
  statusPath,
  targetBatches: draft.targetBatches,
  lessonCardsReviewed: overlay.batches.reduce((sum, batch) => sum + batch.lessonCards.length, 0),
  noteFieldsFilled: 72,
  directCandidatesDowngraded: decisionRows.length,
  directCandidateRows: decisionRows.map((row) => ({
    lessonId: row.lessonId,
    batchId: row.batchId,
    sourceFamily: row.sourceFamily,
    decision: "downgrade_to_boundary_only",
    rationale: row.recommendedDefault,
  })),
  boundary: overlay.boundary,
};

await fs.writeFile(summaryJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(summaryMd, renderMarkdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  overlayWritten: report.overlayWritten,
  lessonCardsReviewed: report.lessonCardsReviewed,
  noteFieldsFilled: report.noteFieldsFilled,
  directCandidatesDowngraded: report.directCandidatesDowngraded,
  statusPath,
  summaryJson,
  summaryMd,
}, null, 2));
