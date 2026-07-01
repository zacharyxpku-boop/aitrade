import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const draftPath = "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json";
const outputJson = "docs/FIRST_REVIEWER_REAL_OVERLAY_DIFF_AUDIT.json";
const outputMd = "docs/FIRST_REVIEWER_REAL_OVERLAY_DIFF_AUDIT.md";
const REQUIRED_NOTE_FIELDS = [
  "originalRewriteNotes",
  "sourceFitNotes",
  "factCheckNotes",
  "boundaryCheckNotes",
  "copyingRiskNotes",
  "humanReviewerInitials",
];
const UNSAFE_TEXT_PATTERN = /buy now|sell now|hold position|entry signal|exit signal|win rate|guaranteed profit|backtest profit|broker order|auto-trading ready|real-money ready|production ready|learner-facing ready|approved final|commercial ready/i;
const COPY_RISK_PATTERN = /copied paragraph|verbatim|source body|full text copied|paste from source/i;

const paths = {
  draftTemplate: draftPath,
  noteQualityLint: "docs/REVIEWER_NOTE_QUALITY_LINT.json",
  completionAudit: "docs/LESSON_BATCH_COMPLETION_AUDIT.json",
  postWritePlaybook: "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_PLAYBOOK.json",
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

function templateIndex(draft) {
  const batches = new Map();
  const cards = new Map();
  for (const batch of draft.batches || []) {
    batches.set(batch.batchId, batch);
    for (const card of batch.lessonCards || []) {
      cards.set(`${batch.batchId}:${card.lessonId}`, card);
    }
  }
  return { batches, cards };
}

function diffOverlay(draft, overlay) {
  const { batches: draftBatches, cards: draftCards } = templateIndex(draft);
  const issues = [];
  const batchRows = [];
  const fieldRows = [];
  const seenCards = new Set();

  assertEnvelope(overlay, "real status overlay");
  if (overlay.sampleOnly === true) issues.push("real status overlay cannot be sampleOnly");
  if (!Array.isArray(overlay.batches)) issues.push("real status overlay must include batches array");

  for (const batch of overlay.batches || []) {
    const draftBatch = draftBatches.get(batch.batchId);
    if (!draftBatch) issues.push(`${batch.batchId} is not in first-reviewer draft template`);
    assertEnvelope(batch, `real status batch ${batch.batchId}`);
    if (batch.sampleOnly === true) issues.push(`${batch.batchId} cannot be sampleOnly`);
    batchRows.push({
      batchId: batch.batchId,
      reviewStatus: batch.reviewStatus || "not_started",
      templateCovered: Boolean(draftBatch),
      lessonCards: Array.isArray(batch.lessonCards) ? batch.lessonCards.length : 0,
    });

    for (const card of batch.lessonCards || []) {
      const cardKey = `${batch.batchId}:${card.lessonId}`;
      const draftCard = draftCards.get(cardKey);
      seenCards.add(cardKey);
      if (!draftCard) issues.push(`${cardKey} is not in first-reviewer draft template`);
      if (card.sampleOnly === true) issues.push(`${cardKey} cannot be sampleOnly`);
      if (card.mustRemainStructuralDraft !== true) issues.push(`${cardKey} must keep mustRemainStructuralDraft:true`);
      if ("currentGrade" in card && card.currentGrade !== "structural_draft") issues.push(`${cardKey} cannot change currentGrade`);
      if ("approvalStatus" in card && card.approvalStatus !== "not_approved") issues.push(`${cardKey} approvalStatus must stay not_approved`);
      if ("learnerFacingRelease" in card && card.learnerFacingRelease !== false) issues.push(`${cardKey} learnerFacingRelease must stay false`);
      if ("productionReady" in card && card.productionReady !== false) issues.push(`${cardKey} productionReady must stay false`);

      for (const field of REQUIRED_NOTE_FIELDS) {
        const value = card[field] ?? "";
        const filled = hasText(value);
        const unsafeText = field !== "humanReviewerInitials" && UNSAFE_TEXT_PATTERN.test(String(value));
        const copyRisk = field !== "humanReviewerInitials" && COPY_RISK_PATTERN.test(String(value));
        if (unsafeText) issues.push(`${cardKey}.${field} contains unsafe trading/readiness wording`);
        if (copyRisk) issues.push(`${cardKey}.${field} may contain copied-source-body wording`);
        fieldRows.push({
          batchId: batch.batchId,
          lessonId: card.lessonId,
          field,
          filled,
          changedFromBlank: filled,
          unsafeText,
          copyRisk,
        });
      }
    }
  }

  for (const cardKey of draftCards.keys()) {
    if (!seenCards.has(cardKey)) issues.push(`${cardKey} is missing from real status overlay`);
  }

  return { issues, batchRows, fieldRows };
}

function markdown(report) {
  return [
    "# First Reviewer Real Overlay Diff Audit",
    "",
    "This report compares a future real reviewer status overlay against the first-reviewer blank draft template.",
    "When the real overlay is absent, it records a safe pre-write state. When present, it reports filled fields, missing rows, and unsafe text risks.",
    "",
    "## Summary",
    "",
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Audit executable now: ${report.auditExecutableNow}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Template lesson cards: ${report.templateLessonCards}`,
    `- Required note fields: ${report.requiredNoteFields}`,
    `- Filled note fields: ${report.filledNoteFields}`,
    `- Blank note fields: ${report.blankNoteFields}`,
    `- Unsafe text issues: ${report.unsafeTextIssues}`,
    `- Copy-risk issues: ${report.copyRiskIssues}`,
    `- Structural issues: ${report.structuralIssues}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Batch Rows",
    "",
    "| Batch | Status | Template covered | Lesson cards |",
    "| --- | --- | --- | ---: |",
    ...report.batchRows.map((row) => `| ${row.batchId} | ${row.reviewStatus} | ${row.templateCovered} | ${row.lessonCards} |`),
    "",
    "## Issues",
    "",
    ...(report.issues.length ? report.issues.map((issue) => `- ${issue}`) : ["- No real overlay issues are present in the current pre-write state."]),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const [draft, noteQualityLint, completionAudit, postWritePlaybook, realOverlay] = await Promise.all([
  readJson(draftPath),
  readJson(paths.noteQualityLint),
  readJson(paths.completionAudit),
  readJson(paths.postWritePlaybook),
  readJson(realStatusPath, true),
]);

for (const [label, record] of Object.entries({ draft, noteQualityLint, completionAudit, postWritePlaybook })) {
  assertEnvelope(record, label);
}

if (draft.notesFilled !== 0) fail("first-reviewer draft template must keep notesFilled at 0");
if (draft.draftLessonCards !== 12) fail("first-reviewer diff audit expects 12 draft lesson cards");

const realStatusOverlayPresent = Boolean(realOverlay);
let diff = { issues: [], batchRows: [], fieldRows: [] };
if (realOverlay) {
  diff = diffOverlay(draft, realOverlay);
}

const unsafeTextIssues = diff.fieldRows.filter((row) => row.unsafeText).length;
const copyRiskIssues = diff.fieldRows.filter((row) => row.copyRisk).length;
const filledNoteFields = diff.fieldRows.filter((row) => row.filled).length;
const templateLessonCards = draft.batches.reduce((sum, batch) => sum + batch.lessonCards.length, 0);
const requiredNoteFields = templateLessonCards * REQUIRED_NOTE_FIELDS.length;
const blankNoteFields = realOverlay ? requiredNoteFields - filledNoteFields : requiredNoteFields;
const structuralIssues = diff.issues.length - unsafeTextIssues - copyRiskIssues;

if (diff.issues.length) {
  fail(`real overlay diff audit failed: ${diff.issues.slice(0, 8).join("; ")}`);
}

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  realStatusPath,
  realStatusOverlayPresent,
  auditExecutableNow: realStatusOverlayPresent,
  targetBatches: draft.targetBatches,
  templateLessonCards,
  requiredNoteFields,
  filledNoteFields,
  blankNoteFields,
  unsafeTextIssues,
  copyRiskIssues,
  structuralIssues,
  issues: diff.issues,
  batchRows: realOverlay ? diff.batchRows : draft.batches.map((batch) => ({
    batchId: batch.batchId,
    reviewStatus: "not_started",
    templateCovered: true,
    lessonCards: batch.lessonCards.length,
  })),
  fieldRows: diff.fieldRows,
  sourceReports: paths,
  currentGateContext: {
    noteQualityRealOverlayPresent: noteQualityLint.realStatusOverlayPresent,
    noteQualityRealIssues: noteQualityLint.realNoteIssues,
    completionStatusOverlayPresent: completionAudit.statusOverlayPresent,
    completionReadyBatches: completionAudit.readyBatches,
    postWriteExecutionAllowedNow: postWritePlaybook.executionAllowedNow,
  },
  boundary: "This diff audit is reviewer-status quality control only. It does not create or overwrite docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  auditExecutableNow: report.auditExecutableNow,
  targetBatches: report.targetBatches,
  templateLessonCards: report.templateLessonCards,
  filledNoteFields: report.filledNoteFields,
  blankNoteFields: report.blankNoteFields,
  unsafeTextIssues: report.unsafeTextIssues,
  copyRiskIssues: report.copyRiskIssues,
  structuralIssues: report.structuralIssues,
  outputJson,
  outputMd,
}, null, 2));
