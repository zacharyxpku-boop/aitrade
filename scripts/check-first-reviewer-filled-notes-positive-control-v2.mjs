import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const READY_STATUS = "ready_for_separate_human_approval_review";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const draftPath = "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json";
const runbookNegativeCasesPath = "docs/FIRST_REVIEWER_RUNBOOK_NEGATIVE_CASES.json";
const outputJson = "docs/FIRST_REVIEWER_FILLED_NOTES_POSITIVE_CONTROL_V2.json";
const outputMd = "docs/FIRST_REVIEWER_FILLED_NOTES_POSITIVE_CONTROL_V2.md";
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

async function exists(filePath) {
  return fs.access(filePath).then(() => true, () => false);
}

function assertEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function completeCard(card) {
  return {
    ...card,
    trackingStatus: READY_STATUS,
    originalRewriteNotes: `TEMP V2 ONLY: original rewrite checked for ${card.lessonId}; no external source text copied.`,
    sourceFitNotes: `TEMP V2 ONLY: source roles were reviewed for ${card.lessonId}; direct candidates are confirmed, downgraded, or blocked by human notes before use.`,
    factCheckNotes: `TEMP V2 ONLY: factual claims for ${card.lessonId} were checked against green metadata and unresolved claims stay out.`,
    boundaryCheckNotes: "TEMP V2 ONLY: no advice, signal, performance claim, broker/order workflow, automation, or real-money guidance.",
    copyingRiskNotes: "TEMP V2 ONLY: no source body text copied; wording remains original reviewer prose.",
    humanReviewerInitials: "QA_V2",
    mustRemainStructuralDraft: true,
  };
}

function completeBatch(batch) {
  return {
    ...batch,
    reviewStatus: READY_STATUS,
    lessonCards: batch.lessonCards.map(completeCard),
  };
}

function runNode(script, env) {
  const result = spawnSync(process.execPath, [script], {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
  if (result.status !== 0) fail(`${script} failed: ${result.stderr || result.stdout}`);
}

function markdown(report) {
  return [
    "# First Reviewer Filled Notes Positive Control V2",
    "",
    "This report proves that a temporary, fully noted first-reviewer overlay can flow through completion, evidence intake, and separate approval gate as candidates only.",
    "It uses temporary files only and does not create real reviewer notes, approve lessons, publish learner-facing content, or change lesson grades.",
    "",
    "## Summary",
    "",
    `- Positive control ready: ${report.positiveControlReady}`,
    `- Temporary batch: ${report.temporaryBatchId}`,
    `- Temporary lesson cards: ${report.temporaryLessonCards}`,
    `- Completion ready batches: ${report.completionReadyBatches}`,
    `- Intake complete note cards: ${report.intakeCompleteNoteCards}`,
    `- Intake approval candidates: ${report.intakeApprovalCandidates}`,
    `- Separate approval candidates: ${report.separateApprovalCandidates}`,
    `- Auto-approved lessons: ${report.autoApprovedLessons}`,
    `- Commercial-ready promotions: ${report.commercialReadyPromotions}`,
    `- Production-ready claims: ${report.productionReadyClaims}`,
    `- Real status overlay touched: ${report.realStatusOverlayTouched}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Validated Flow",
    "",
    ...report.validatedFlow.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const realBefore = await exists(realStatusPath);
const [draft, runbookNegativeCases] = await Promise.all([
  readJson(draftPath),
  readJson(runbookNegativeCasesPath),
]);
assertEnvelope(draft, "first reviewer draft template");
assertEnvelope(runbookNegativeCases, "runbook negative cases");
if (runbookNegativeCases.failedCases !== 0) fail("runbook negative cases must pass before positive control v2");

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "tradegym-filled-notes-v2-"));
const tempStatusPath = path.join(tempRoot, "LESSON_BATCH_REVIEW_STATUS.json");
const tempCompletionJson = path.join(tempRoot, "completion.json");
const tempCompletionMd = path.join(tempRoot, "completion.md");
const tempTemplateJson = path.join(tempRoot, "template.json");
const tempTemplateMd = path.join(tempRoot, "template.md");
const tempNegativeJson = path.join(tempRoot, "negative.json");
const tempNegativeMd = path.join(tempRoot, "negative.md");
const tempIntakeJson = path.join(tempRoot, "intake.json");
const tempIntakeMd = path.join(tempRoot, "intake.md");
const tempApprovalJson = path.join(tempRoot, "approval.json");
const tempApprovalMd = path.join(tempRoot, "approval.md");

try {
  const overlay = {
    ...draft,
    purpose: "Temporary filled-notes positive control v2. Not real reviewer evidence.",
    batches: [completeBatch(draft.batches[0])],
  };

  assertEnvelope(overlay, "temporary positive overlay");
  for (const batch of overlay.batches) {
    assertEnvelope(batch, `temporary positive overlay ${batch.batchId}`);
    if (batch.reviewStatus !== READY_STATUS) fail(`${batch.batchId} must be ready in positive control`);
    for (const card of batch.lessonCards) {
      if (card.trackingStatus !== READY_STATUS) fail(`${card.lessonId} must be ready in positive control`);
      if (card.mustRemainStructuralDraft !== true) fail(`${card.lessonId} must remain structural draft`);
      for (const field of REQUIRED_NOTE_FIELDS) {
        if (!card[field]) fail(`${card.lessonId}.${field} must be filled`);
      }
    }
  }

  await fs.writeFile(tempStatusPath, `${JSON.stringify(overlay, null, 2)}\n`, "utf8");
  const commonEnv = {
    TRADEGYM_REVIEW_STATUS_PATH: tempStatusPath,
    TRADEGYM_BATCH_STATUS_PATH: tempStatusPath,
    TRADEGYM_BATCH_COMPLETION_AUDIT_JSON: tempCompletionJson,
    TRADEGYM_BATCH_COMPLETION_AUDIT_MD: tempCompletionMd,
    TRADEGYM_BATCH_STATUS_TEMPLATE_JSON: tempTemplateJson,
    TRADEGYM_BATCH_STATUS_TEMPLATE_MD: tempTemplateMd,
    TRADEGYM_BATCH_STATUS_NEGATIVE_JSON: tempNegativeJson,
    TRADEGYM_BATCH_STATUS_NEGATIVE_MD: tempNegativeMd,
    TRADEGYM_EVIDENCE_INTAKE_JSON: tempIntakeJson,
    TRADEGYM_EVIDENCE_INTAKE_MD: tempIntakeMd,
    TRADEGYM_SEPARATE_APPROVAL_GATE_JSON: tempApprovalJson,
    TRADEGYM_SEPARATE_APPROVAL_GATE_MD: tempApprovalMd,
  };

  runNode("scripts/check-lesson-batch-completion-audit.mjs", commonEnv);
  runNode("scripts/check-first-reviewer-evidence-intake-summary.mjs", commonEnv);
  runNode("scripts/check-first-reviewer-separate-approval-review-gate.mjs", commonEnv);

  const [completion, intake, approval] = await Promise.all([
    readJson(tempCompletionJson),
    readJson(tempIntakeJson),
    readJson(tempApprovalJson),
  ]);
  assertEnvelope(completion, "temporary completion audit");
  assertEnvelope(intake, "temporary evidence intake");
  assertEnvelope(approval, "temporary separate approval gate");

  const temporaryLessonCards = overlay.batches[0].lessonCards.length;
  if (completion.readyBatches !== 1 || completion.missingRequiredNotes !== 0) fail("completion audit did not accept the fully noted temporary batch");
  if (intake.completeNoteCards !== temporaryLessonCards) fail("evidence intake did not count all complete temporary notes");
  if (intake.readyForSeparateApprovalCandidates !== temporaryLessonCards) fail("evidence intake did not produce candidate-only rows");
  if (approval.approvalReviewCandidates !== temporaryLessonCards) fail("separate approval gate did not receive candidate rows");
  if (approval.autoApprovedLessons !== 0 || approval.commercialReadyPromotions !== 0 || approval.productionReadyClaims !== 0 || approval.learnerFacingReleaseCandidates !== 0) {
    fail("separate approval gate created an automatic release or readiness outcome");
  }

  const realAfter = await exists(realStatusPath);
  const realStatusOverlayTouched = realBefore !== realAfter || realAfter === true;
  if (realStatusOverlayTouched) fail("positive control v2 touched real status overlay");

  const report = {
    generatedAt: new Date().toISOString(),
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    expectedOutcome: EXPECTED_OUTCOME,
    positiveControlReady: true,
    temporaryBatchId: overlay.batches[0].batchId,
    temporaryLessonCards,
    completionReadyBatches: completion.readyBatches,
    intakeCompleteNoteCards: intake.completeNoteCards,
    intakeApprovalCandidates: intake.readyForSeparateApprovalCandidates,
    separateApprovalCandidates: approval.approvalReviewCandidates,
    autoApprovedLessons: approval.autoApprovedLessons,
    learnerFacingReleaseCandidates: approval.learnerFacingReleaseCandidates,
    commercialReadyPromotions: approval.commercialReadyPromotions,
    productionReadyClaims: approval.productionReadyClaims,
    realStatusOverlayTouched,
    requiredNoteFields: REQUIRED_NOTE_FIELDS,
    validatedFlow: [
      "Temporary overlay fills all six required note fields for one first-reviewer batch.",
      "Completion audit accepts the temporary batch as ready_for_separate_human_approval_review.",
      "Evidence intake counts complete note cards as candidates only.",
      "Separate approval gate receives candidates but creates zero auto approvals, release candidates, grade promotions, or production claims.",
      "Real docs/LESSON_BATCH_REVIEW_STATUS.json remains absent.",
    ],
    boundary: "This positive control uses temporary files only. It does not create real reviewer notes, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, or make the product production-ready.",
  };

  await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(outputMd, markdown(report), "utf8");
  console.log(JSON.stringify({
    ok: true,
    educationOnly: report.educationOnly,
    productionReady: report.productionReady,
    learnerFacingRelease: report.learnerFacingRelease,
    approvalStatus: report.approvalStatus,
    positiveControlReady: report.positiveControlReady,
    temporaryBatchId: report.temporaryBatchId,
    temporaryLessonCards: report.temporaryLessonCards,
    completionReadyBatches: report.completionReadyBatches,
    intakeCompleteNoteCards: report.intakeCompleteNoteCards,
    intakeApprovalCandidates: report.intakeApprovalCandidates,
    separateApprovalCandidates: report.separateApprovalCandidates,
    autoApprovedLessons: report.autoApprovedLessons,
    commercialReadyPromotions: report.commercialReadyPromotions,
    productionReadyClaims: report.productionReadyClaims,
    realStatusOverlayTouched: report.realStatusOverlayTouched,
    outputJson,
    outputMd,
  }, null, 2));
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}
