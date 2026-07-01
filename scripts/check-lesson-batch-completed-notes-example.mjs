import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const draftPath = "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json";
const outputJson = "docs/LESSON_BATCH_COMPLETED_NOTES_EXAMPLE.json";
const outputMd = "docs/LESSON_BATCH_COMPLETED_NOTES_EXAMPLE.md";
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

function completeBatch(batch) {
  return {
    ...batch,
    reviewStatus: READY_STATUS,
    lessonCards: batch.lessonCards.map((card) => ({
      ...card,
      trackingStatus: READY_STATUS,
      originalRewriteNotes: `TEMPORARY EXAMPLE ONLY: reviewer wrote original educational prose for ${card.lessonId}; no source text copied.`,
      sourceFitNotes: `TEMPORARY EXAMPLE ONLY: reviewer separated direct source fit from boundary-only metadata for ${card.lessonId}.`,
      factCheckNotes: `TEMPORARY EXAMPLE ONLY: reviewer checked lesson claims against metadata and kept unresolved claims out.`,
      boundaryCheckNotes: "TEMPORARY EXAMPLE ONLY: reviewer confirmed no advice, signal, performance claim, broker/order, automation, or real-money guidance.",
      copyingRiskNotes: "TEMPORARY EXAMPLE ONLY: reviewer confirmed no external source body text was copied.",
      humanReviewerInitials: "QA_EXAMPLE",
      mustRemainStructuralDraft: true,
    })),
  };
}

function renderMarkdown(report) {
  return [
    "# Lesson Batch Completed Notes Example",
    "",
    "This report proves that a temporary, fully noted reviewer overlay can pass the completion audit.",
    "It uses temporary files only and is not real human review, final approval, learner-facing release, or production readiness.",
    "",
    "## Summary",
    "",
    `- Example batch: ${report.exampleBatchId}`,
    `- Example lesson cards: ${report.exampleLessonCards}`,
    `- Ready batches in temp audit: ${report.readyBatches}`,
    `- Missing required notes: ${report.missingRequiredNotes}`,
    `- Real status overlay touched: ${report.realStatusOverlayTouched}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Required Notes Filled",
    "",
    ...report.requiredNoteFields.map((field) => `- \`${field}\``),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const realStatusBefore = await fs.access(realStatusPath).then(() => true, () => false);
const draft = await readJson(draftPath);
assertEnvelope(draft, "first reviewer status draft");

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "tradegym-completed-notes-"));
const tempStatusPath = path.join(tempRoot, "LESSON_BATCH_REVIEW_STATUS.json");
const tempAuditJson = path.join(tempRoot, "completion-audit.json");
const tempAuditMd = path.join(tempRoot, "completion-audit.md");
const tempTemplateJson = path.join(tempRoot, "template.json");
const tempTemplateMd = path.join(tempRoot, "template.md");
const tempNegativeJson = path.join(tempRoot, "negative.json");
const tempNegativeMd = path.join(tempRoot, "negative.md");

const overlay = {
  ...draft,
  purpose: "Temporary completed-notes positive example. Not real reviewer evidence.",
  batches: [
    completeBatch(draft.batches[0]),
  ],
};

for (const batch of overlay.batches) {
  assertEnvelope(batch, `temporary overlay ${batch.batchId}`);
  if (batch.reviewStatus !== READY_STATUS) fail(`${batch.batchId} must be ready in positive example`);
  for (const card of batch.lessonCards) {
    if (card.trackingStatus !== READY_STATUS) fail(`${card.lessonId} must be ready in positive example`);
    if (card.mustRemainStructuralDraft !== true) fail(`${card.lessonId} must remain structural draft`);
    for (const field of REQUIRED_NOTE_FIELDS) {
      if (!card[field]) fail(`${card.lessonId}.${field} must be filled in positive example`);
    }
  }
}

await fs.writeFile(tempStatusPath, `${JSON.stringify(overlay, null, 2)}\n`, "utf8");
const result = spawnSync(process.execPath, ["scripts/check-lesson-batch-completion-audit.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    TRADEGYM_BATCH_STATUS_PATH: tempStatusPath,
    TRADEGYM_BATCH_COMPLETION_AUDIT_JSON: tempAuditJson,
    TRADEGYM_BATCH_COMPLETION_AUDIT_MD: tempAuditMd,
    TRADEGYM_BATCH_STATUS_TEMPLATE_JSON: tempTemplateJson,
    TRADEGYM_BATCH_STATUS_TEMPLATE_MD: tempTemplateMd,
    TRADEGYM_BATCH_STATUS_NEGATIVE_JSON: tempNegativeJson,
    TRADEGYM_BATCH_STATUS_NEGATIVE_MD: tempNegativeMd,
  },
  encoding: "utf8",
});

if (result.status !== 0) {
  fail(`temporary completed-notes audit failed: ${result.stderr || result.stdout}`);
}

const tempAudit = await readJson(tempAuditJson);
const realStatusAfter = await fs.access(realStatusPath).then(() => true, () => false);
const realStatusOverlayTouched = realStatusBefore !== realStatusAfter || realStatusAfter === true;
if (tempAudit.readyBatches !== 1) fail(`expected one ready batch in temp audit, got ${tempAudit.readyBatches}`);
if (tempAudit.missingRequiredNotes !== 0) fail("temp audit should have zero missing required notes");
if (tempAudit.approvalStatus !== "not_approved" || tempAudit.learnerFacingRelease !== false) fail("temp audit boundary changed");
if (realStatusOverlayTouched) fail("positive example touched real status overlay");

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  exampleBatchId: overlay.batches[0].batchId,
  exampleLessonCards: overlay.batches[0].lessonCards.length,
  readyBatches: tempAudit.readyBatches,
  missingRequiredNotes: tempAudit.missingRequiredNotes,
  realStatusOverlayTouched,
  requiredNoteFields: REQUIRED_NOTE_FIELDS,
  boundary: "This is a temporary positive-control validation only. It does not create real reviewer evidence, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, renderMarkdown(report), "utf8");
await fs.rm(tempRoot, { recursive: true, force: true });

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  exampleBatchId: report.exampleBatchId,
  exampleLessonCards: report.exampleLessonCards,
  readyBatches: report.readyBatches,
  missingRequiredNotes: report.missingRequiredNotes,
  realStatusOverlayTouched: report.realStatusOverlayTouched,
  outputJson,
  outputMd,
}, null, 2));
