import fs from "node:fs/promises";

const statusPath = process.env.TRADEGYM_BATCH_STATUS_PATH || "docs/LESSON_BATCH_REVIEW_STATUS.json";
const promptPath = "docs/FIRST_REVIEWER_NOTES_PROMPT.json";
const draftTemplatePath = "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json";
const outputJson = "docs/REVIEWER_NOTE_QUALITY_LINT.json";
const outputMd = "docs/REVIEWER_NOTE_QUALITY_LINT.md";
const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const READY_STATUS = "ready_for_separate_human_approval_review";
const REQUIRED_NOTE_FIELDS = [
  "originalRewriteNotes",
  "sourceFitNotes",
  "factCheckNotes",
  "boundaryCheckNotes",
  "copyingRiskNotes",
  "humanReviewerInitials",
];
const GENERIC_NOTE_PATTERN = /^(ok|done|reviewed|checked|yes|no|n\/a|na|pass|fine|good|same|see above)$/i;
const PLACEHOLDER_PATTERN = /temporary example only|placeholder|qa_example|lorem ipsum|todo|tbd/i;
const UNSAFE_NOTE_PATTERN = /buy now|sell now|hold position|entry signal|exit signal|win rate|guaranteed profit|backtest profit|broker order|auto-trading ready|real-money ready|production ready|learner-facing ready|approved final|commercial ready/i;
const FIELD_ANCHORS = {
  originalRewriteNotes: /original|rewrite|education|observation|prose|practice/i,
  sourceFitNotes: /direct|boundary|metadata|unsuitable|historical|macro|source/i,
  factCheckNotes: /fact|claim|check|metadata|unresolved|remove|verified/i,
  boundaryCheckNotes: /education-only|non-production|no advice|no signal|no performance|no broker|no automation|no real-money|boundary/i,
  copyingRiskNotes: /no-copy|no source-body|not copied|copying risk|source body|original wording/i,
};

function fail(message) {
  throw new Error(message);
}

async function readJson(path, optional = false) {
  try {
    return JSON.parse(await fs.readFile(path, "utf8"));
  } catch (error) {
    if (optional && error.code === "ENOENT") return null;
    throw error;
  }
}

function assertEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateNoteField(field, value, label) {
  if (!hasText(value)) return [`${label}.${field} is blank`];
  const trimmed = value.trim();
  const issues = [];
  if (field === "humanReviewerInitials") {
    if (trimmed.length < 2 || trimmed.length > 12) issues.push(`${label}.${field} must be 2-12 characters`);
    if (PLACEHOLDER_PATTERN.test(trimmed)) issues.push(`${label}.${field} cannot be generated example initials`);
    return issues;
  }
  if (trimmed.length < 48) issues.push(`${label}.${field} is too short to be useful`);
  if (GENERIC_NOTE_PATTERN.test(trimmed)) issues.push(`${label}.${field} is too generic`);
  if (PLACEHOLDER_PATTERN.test(trimmed)) issues.push(`${label}.${field} contains placeholder/example text`);
  if (UNSAFE_NOTE_PATTERN.test(trimmed)) issues.push(`${label}.${field} contains unsafe approval/trading/readiness wording`);
  if (!FIELD_ANCHORS[field].test(trimmed)) issues.push(`${label}.${field} lacks the required field-specific evidence anchor`);
  return issues;
}

function validateOverlayNotes(overlay, prompt) {
  assertEnvelope(overlay, "review status overlay");
  const promptLessons = new Map((prompt.lessonPrompts || []).map((lesson) => [lesson.lessonId, lesson]));
  const issues = [];
  const rows = [];
  for (const batch of overlay.batches || []) {
    assertEnvelope(batch, `review status batch ${batch.batchId}`);
    for (const card of batch.lessonCards || []) {
      const label = `${batch.batchId}.${card.lessonId}`;
      const promptLesson = promptLessons.get(card.lessonId);
      if (!promptLesson) issues.push(`${label} is not covered by first reviewer notes prompt`);
      if (card.mustRemainStructuralDraft !== true) issues.push(`${label} mustRemainStructuralDraft must stay true`);
      if ("currentGrade" in card && card.currentGrade !== "structural_draft") issues.push(`${label} currentGrade cannot change`);
      if ("approvalStatus" in card && card.approvalStatus !== "not_approved") issues.push(`${label} approvalStatus must stay not_approved`);
      if ("learnerFacingRelease" in card && card.learnerFacingRelease !== false) issues.push(`${label} learnerFacingRelease must stay false`);
      if ("productionReady" in card && card.productionReady !== false) issues.push(`${label} productionReady must stay false`);
      if (card.trackingStatus === READY_STATUS || batch.reviewStatus === READY_STATUS) {
        for (const field of REQUIRED_NOTE_FIELDS) {
          issues.push(...validateNoteField(field, card[field], label));
        }
      }
      rows.push({
        batchId: batch.batchId,
        lessonId: card.lessonId,
        trackingStatus: card.trackingStatus || "not_started",
        promptCovered: Boolean(promptLesson),
        checkedRequiredNotes: card.trackingStatus === READY_STATUS || batch.reviewStatus === READY_STATUS,
      });
    }
  }
  return { issues, rows };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeCompletedOverlay(draft) {
  return {
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    expectedOutcome: EXPECTED_OUTCOME,
    batches: [
      {
        ...draft.batches[0],
        reviewStatus: READY_STATUS,
        lessonCards: draft.batches[0].lessonCards.map((card) => ({
          ...card,
          trackingStatus: READY_STATUS,
          originalRewriteNotes: `Original rewrite plan for ${card.lessonId}: keep this as education prose and observation practice, with no copied source body text and no grade promotion.`,
          sourceFitNotes: `Source fit for ${card.lessonId}: classify direct evidence separately from boundary-only metadata, and keep unsuitable sources out of explanatory prose.`,
          factCheckNotes: `Fact-check scope for ${card.lessonId}: verify only claims supported by metadata or remove unresolved claims before any separate approval review.`,
          boundaryCheckNotes: `Education-only boundary for ${card.lessonId}: non-production, no advice, no signal, no performance claim, no broker workflow, no automation, and no real-money guidance.`,
          copyingRiskNotes: `No-copy check for ${card.lessonId}: no source-body text is copied; sources only guide citation, boundary, and original wording decisions.`,
          humanReviewerInitials: "HR",
          mustRemainStructuralDraft: true,
        })),
      },
    ],
  };
}

function runNegativeCase(name, overlay, prompt, mutate, expectedPattern) {
  const candidate = clone(overlay);
  mutate(candidate);
  const result = validateOverlayNotes(candidate, prompt);
  const message = result.issues.join("; ");
  return {
    name,
    expectedFailure: true,
    passed: expectedPattern.test(message),
    issueCount: result.issues.length,
    message,
  };
}

function renderMarkdown(report) {
  return [
    "# Reviewer Note Quality Lint",
    "",
    "This lint defines quality gates for future real reviewer notes.",
    "It does not create real notes, approve lessons, publish learner-facing content, or certify production readiness.",
    "",
    "## Summary",
    "",
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Real note issues: ${report.realNoteIssues}`,
    `- Positive control passed: ${report.positiveControlPassed}`,
    `- Negative cases passing: ${report.negativeCasesPassed}/${report.negativeCases}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Lint Rules",
    "",
    ...report.lintRules.map((rule) => `- ${rule}`),
    "",
    "## Negative Cases",
    "",
    "| Case | Passed | Issues |",
    "| --- | --- | ---: |",
    ...report.negativeCaseRows.map((row) => `| ${row.name} | ${row.passed} | ${row.issueCount} |`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const [prompt, draft, realOverlay] = await Promise.all([
  readJson(promptPath),
  readJson(draftTemplatePath),
  readJson(statusPath, true),
]);

assertEnvelope(prompt, "first reviewer notes prompt");
assertEnvelope(draft, "first reviewer draft template");
if (prompt.lessonPrompts.length !== 12) fail("note lint expects 12 first reviewer prompts");
if (draft.notesFilled !== 0) fail("draft template must still have zero filled notes");

const realStatusOverlayPresent = Boolean(realOverlay);
let realNoteIssues = [];
let realRows = [];
if (realOverlay) {
  const result = validateOverlayNotes(realOverlay, prompt);
  realNoteIssues = result.issues;
  realRows = result.rows;
  if (realNoteIssues.length) fail(`real reviewer notes failed quality lint: ${realNoteIssues.slice(0, 8).join("; ")}`);
}

const positiveOverlay = makeCompletedOverlay(draft);
const positiveResult = validateOverlayNotes(positiveOverlay, prompt);
if (positiveResult.issues.length) fail(`positive reviewer note quality control failed: ${positiveResult.issues.join("; ")}`);

const negativeCaseRows = [
  runNegativeCase("blank_source_fit_note_rejected", positiveOverlay, prompt, (overlay) => {
    overlay.batches[0].lessonCards[0].sourceFitNotes = "";
  }, /blank/),
  runNegativeCase("generic_fact_check_note_rejected", positiveOverlay, prompt, (overlay) => {
    overlay.batches[0].lessonCards[0].factCheckNotes = "reviewed";
  }, /too short|generic/),
  runNegativeCase("placeholder_initials_rejected", positiveOverlay, prompt, (overlay) => {
    overlay.batches[0].lessonCards[0].humanReviewerInitials = "QA_EXAMPLE";
  }, /generated example initials/),
  runNegativeCase("unsafe_trading_note_rejected", positiveOverlay, prompt, (overlay) => {
    overlay.batches[0].lessonCards[0].boundaryCheckNotes = "Entry signal: buy now after the setup and use this as real-money ready guidance.";
  }, /unsafe approval\/trading\/readiness wording/),
  runNegativeCase("approval_claim_rejected", positiveOverlay, prompt, (overlay) => {
    overlay.batches[0].lessonCards[0].originalRewriteNotes = "This lesson is approved final and commercial ready after review.";
  }, /unsafe approval\/trading\/readiness wording/),
  runNegativeCase("copying_placeholder_rejected", positiveOverlay, prompt, (overlay) => {
    overlay.batches[0].lessonCards[0].copyingRiskNotes = "Temporary example only: copied paragraph from source body.";
  }, /placeholder|lacks the required/),
];
const failedNegativeRows = negativeCaseRows.filter((row) => !row.passed);
if (failedNegativeRows.length) fail(`reviewer note lint negative cases failed: ${failedNegativeRows.map((row) => row.name).join(", ")}`);

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  statusPath,
  realStatusOverlayPresent,
  realNoteIssues: realNoteIssues.length,
  realRows,
  positiveControlPassed: true,
  positiveControlRows: positiveResult.rows.length,
  negativeCases: negativeCaseRows.length,
  negativeCasesPassed: negativeCaseRows.filter((row) => row.passed).length,
  negativeCaseRows,
  lintRules: [
    "Ready batches or cards must have all required note fields filled.",
    "Notes must be specific enough to show source-fit, fact-check, boundary, copying-risk, and original-rewrite work.",
    "Notes cannot use placeholders, generated example initials, or generic one-word approvals.",
    "Notes cannot claim final approval, learner-facing readiness, commercial readiness, production readiness, trading signals, broker/order workflows, automation readiness, performance, or real-money guidance.",
    "Reviewer initials must only be added after real human review work is performed.",
  ],
  boundary: "This lint is reviewer-status quality control only. It does not create real reviewer notes, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, renderMarkdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  realNoteIssues: report.realNoteIssues,
  positiveControlPassed: report.positiveControlPassed,
  negativeCasesPassed: report.negativeCasesPassed,
  negativeCases: report.negativeCases,
  outputJson,
  outputMd,
}, null, 2));
