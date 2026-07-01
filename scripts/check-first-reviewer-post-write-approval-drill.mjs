import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const READY_STATUS = "ready_for_separate_human_approval_review";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const draftPath = "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json";
const filledNotesControlPath = "docs/FIRST_REVIEWER_FILLED_NOTES_POSITIVE_CONTROL_V2.json";
const outputJson = "docs/FIRST_REVIEWER_POST_WRITE_APPROVAL_DRILL.json";
const outputMd = "docs/FIRST_REVIEWER_POST_WRITE_APPROVAL_DRILL.md";
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
    originalRewriteNotes: `POST-WRITE DRILL ONLY: original rewrite reviewed for ${card.lessonId}; no external source text copied.`,
    sourceFitNotes: `POST-WRITE DRILL ONLY: source roles reviewed for ${card.lessonId}; direct candidates remain candidate-only until separate human approval.`,
    factCheckNotes: `POST-WRITE DRILL ONLY: facts checked against allowed green-source metadata; unresolved claims stay blocked.`,
    boundaryCheckNotes: "POST-WRITE DRILL ONLY: no advice, signal, performance claim, broker/order workflow, automation, or real-money guidance.",
    copyingRiskNotes: "POST-WRITE DRILL ONLY: no source body text copied; wording remains original reviewer prose.",
    humanReviewerInitials: "QA_DRILL",
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
    "# First Reviewer Post-Write Approval Drill",
    "",
    "This drill simulates the future post-write state with temporary files only.",
    "It proves completed notes can become approval-review candidates while still being blocked from approval, learner-facing release, grade promotion, internal-trial readiness, launch readiness, and production readiness.",
    "",
    "## Summary",
    "",
    `- Drill ready: ${report.drillReady}`,
    `- Temporary batch: ${report.temporaryBatchId}`,
    `- Temporary lesson cards: ${report.temporaryLessonCards}`,
    `- Completion ready batches: ${report.completionReadyBatches}`,
    `- Intake complete note cards: ${report.intakeCompleteNoteCards}`,
    `- Separate approval candidates: ${report.separateApprovalCandidates}`,
    `- Release guard passed: ${report.releaseGuardPassedCases}/${report.releaseGuardCases}`,
    `- Auto-approved lessons: ${report.autoApprovedLessons}`,
    `- Learner-facing release candidates: ${report.learnerFacingReleaseCandidates}`,
    `- Commercial-ready promotions: ${report.commercialReadyPromotions}`,
    `- Production-ready claims: ${report.productionReadyClaims}`,
    `- Internal trial ready: ${report.internalTrialReady}`,
    `- Launch ready: ${report.launchReady}`,
    `- Real status overlay touched: ${report.realStatusOverlayTouched}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Validated Drill Flow",
    "",
    ...report.validatedFlow.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## Hard Stops",
    "",
    ...report.hardStops.map((item) => `- ${item}`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const realBefore = await exists(realStatusPath);
const [draft, filledNotesControl] = await Promise.all([
  readJson(draftPath),
  readJson(filledNotesControlPath),
]);
assertEnvelope(draft, "first reviewer draft template");
assertEnvelope(filledNotesControl, "filled-notes positive control v2");
if (filledNotesControl.positiveControlReady !== true) fail("filled-notes positive control v2 must pass before post-write drill");
if (filledNotesControl.autoApprovedLessons !== 0 || filledNotesControl.realStatusOverlayTouched !== false) fail("filled-notes positive control v2 must keep auto approvals at 0 and real overlay untouched");

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "tradegym-post-write-approval-drill-"));
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
const tempReleaseJson = path.join(tempRoot, "release.json");
const tempReleaseMd = path.join(tempRoot, "release.md");

try {
  const overlay = {
    ...draft,
    purpose: "Temporary post-write approval drill. Not real reviewer evidence.",
    batches: [completeBatch(draft.batches[0])],
  };

  assertEnvelope(overlay, "temporary post-write drill overlay");
  for (const batch of overlay.batches) {
    assertEnvelope(batch, `temporary post-write drill ${batch.batchId}`);
    if (batch.reviewStatus !== READY_STATUS) fail(`${batch.batchId} must be ready in post-write drill`);
    for (const card of batch.lessonCards) {
      if (card.trackingStatus !== READY_STATUS) fail(`${card.lessonId} must be ready in post-write drill`);
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
    TRADEGYM_RELEASE_NEGATIVE_CASES_JSON: tempReleaseJson,
    TRADEGYM_RELEASE_NEGATIVE_CASES_MD: tempReleaseMd,
  };

  runNode("scripts/check-lesson-batch-completion-audit.mjs", commonEnv);
  runNode("scripts/check-first-reviewer-evidence-intake-summary.mjs", commonEnv);
  runNode("scripts/check-first-reviewer-separate-approval-review-gate.mjs", commonEnv);
  runNode("scripts/check-first-reviewer-release-readiness-negative-cases.mjs", commonEnv);

  const [completion, intake, approval, releaseGuard] = await Promise.all([
    readJson(tempCompletionJson),
    readJson(tempIntakeJson),
    readJson(tempApprovalJson),
    readJson(tempReleaseJson),
  ]);
  assertEnvelope(completion, "temporary completion audit");
  assertEnvelope(intake, "temporary evidence intake");
  assertEnvelope(approval, "temporary separate approval gate");
  assertEnvelope(releaseGuard, "temporary release readiness guard");

  const temporaryLessonCards = overlay.batches[0].lessonCards.length;
  if (completion.readyBatches !== 1 || completion.missingRequiredNotes !== 0) fail("completion audit did not accept the temporary post-write batch");
  if (intake.completeNoteCards !== temporaryLessonCards || intake.readyForSeparateApprovalCandidates !== temporaryLessonCards) fail("evidence intake did not produce complete candidate-only rows");
  if (approval.approvalReviewCandidates !== temporaryLessonCards || approval.autoApprovedLessons !== 0) fail("separate approval gate did not keep candidates unapproved");
  if (approval.learnerFacingReleaseCandidates !== 0 || approval.commercialReadyPromotions !== 0 || approval.productionReadyClaims !== 0) fail("separate approval gate created release, grade, or production claims");
  if (releaseGuard.failedCases !== 0 || releaseGuard.passedCases !== releaseGuard.negativeCases) fail("release readiness negative cases failed in post-write drill");
  if (releaseGuard.realApprovalReviewCandidates !== temporaryLessonCards) fail("release guard did not see temporary approval-review candidates");

  const realAfter = await exists(realStatusPath);
  const realStatusOverlayTouched = realBefore !== realAfter || realAfter === true;
  if (realStatusOverlayTouched) fail("post-write approval drill touched real status overlay");

  const report = {
    generatedAt: new Date().toISOString(),
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    expectedOutcome: EXPECTED_OUTCOME,
    drillReady: true,
    temporaryBatchId: overlay.batches[0].batchId,
    temporaryLessonCards,
    completionReadyBatches: completion.readyBatches,
    intakeCompleteNoteCards: intake.completeNoteCards,
    intakeApprovalCandidates: intake.readyForSeparateApprovalCandidates,
    separateApprovalCandidates: approval.approvalReviewCandidates,
    releaseGuardCases: releaseGuard.negativeCases,
    releaseGuardPassedCases: releaseGuard.passedCases,
    releaseGuardFailedCases: releaseGuard.failedCases,
    autoApprovedLessons: approval.autoApprovedLessons,
    learnerFacingReleaseCandidates: approval.learnerFacingReleaseCandidates,
    commercialReadyPromotions: approval.commercialReadyPromotions,
    productionReadyClaims: approval.productionReadyClaims,
    internalTrialReady: false,
    launchReady: false,
    realStatusOverlayTouched,
    requiredNoteFields: REQUIRED_NOTE_FIELDS,
    validatedFlow: [
      "Temporary overlay simulates a future post-write state with all six required note fields filled for one batch.",
      "Completion audit accepts the batch as ready_for_separate_human_approval_review.",
      "Evidence intake counts complete notes as candidate-only rows.",
      "Separate approval gate converts intake rows into approval-review candidates only.",
      "Release readiness negative cases still reject approval, learner-facing release, commercial-ready promotion, and production-ready drift with candidates present.",
      "Internal trial, launch, and production readiness remain false.",
      "Real docs/LESSON_BATCH_REVIEW_STATUS.json remains absent.",
    ],
    hardStops: [
      "Approval-review candidates are not approvals.",
      "Complete reviewer notes are not learner-facing release evidence.",
      "No generated drill can promote a lesson to commercial_ready.",
      "No generated drill can set internalTrialReady, launchReady, or productionReady true.",
      "No generated drill can replace a separate human approval review.",
    ],
    sourceReports: {
      filledNotesControl: filledNotesControlPath,
      completionAudit: tempCompletionJson,
      evidenceIntakeSummary: tempIntakeJson,
      separateApprovalGate: tempApprovalJson,
      releaseNegativeCases: tempReleaseJson,
    },
    boundary: "This post-write approval drill uses temporary files only. It does not create real reviewer notes, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, launch the course, or make the product production-ready.",
  };

  await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(outputMd, markdown(report), "utf8");
  console.log(JSON.stringify({
    ok: true,
    educationOnly: report.educationOnly,
    productionReady: report.productionReady,
    learnerFacingRelease: report.learnerFacingRelease,
    approvalStatus: report.approvalStatus,
    drillReady: report.drillReady,
    temporaryBatchId: report.temporaryBatchId,
    temporaryLessonCards: report.temporaryLessonCards,
    completionReadyBatches: report.completionReadyBatches,
    intakeCompleteNoteCards: report.intakeCompleteNoteCards,
    separateApprovalCandidates: report.separateApprovalCandidates,
    releaseGuardPassedCases: report.releaseGuardPassedCases,
    releaseGuardFailedCases: report.releaseGuardFailedCases,
    autoApprovedLessons: report.autoApprovedLessons,
    learnerFacingReleaseCandidates: report.learnerFacingReleaseCandidates,
    commercialReadyPromotions: report.commercialReadyPromotions,
    productionReadyClaims: report.productionReadyClaims,
    internalTrialReady: report.internalTrialReady,
    launchReady: report.launchReady,
    realStatusOverlayTouched: report.realStatusOverlayTouched,
    outputJson,
    outputMd,
  }, null, 2));
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}
