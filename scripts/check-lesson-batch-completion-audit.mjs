import fs from "node:fs/promises";

const guidePath = process.env.TRADEGYM_BATCH_REVIEW_GUIDE_PATH || "docs/LESSON_BATCH_REVIEW_GUIDE.json";
const workbenchPath = process.env.TRADEGYM_LESSON_REWRITE_WORKBENCH_PATH || "docs/LESSON_REWRITE_WORKBENCH.json";
const statusPath = process.env.TRADEGYM_BATCH_STATUS_PATH || "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputTemplateJson = process.env.TRADEGYM_BATCH_STATUS_TEMPLATE_JSON || "docs/LESSON_BATCH_REVIEW_STATUS_TEMPLATE.json";
const outputTemplateMd = process.env.TRADEGYM_BATCH_STATUS_TEMPLATE_MD || "docs/LESSON_BATCH_REVIEW_STATUS_TEMPLATE.md";
const outputJson = process.env.TRADEGYM_BATCH_COMPLETION_AUDIT_JSON || "docs/LESSON_BATCH_COMPLETION_AUDIT.json";
const outputMd = process.env.TRADEGYM_BATCH_COMPLETION_AUDIT_MD || "docs/LESSON_BATCH_COMPLETION_AUDIT.md";
const outputNegativeJson = process.env.TRADEGYM_BATCH_STATUS_NEGATIVE_JSON || "docs/LESSON_BATCH_STATUS_NEGATIVE_CASES.json";
const outputNegativeMd = process.env.TRADEGYM_BATCH_STATUS_NEGATIVE_MD || "docs/LESSON_BATCH_STATUS_NEGATIVE_CASES.md";
const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const REQUIRED_NOTE_FIELDS = [
  "originalRewriteNotes",
  "sourceFitNotes",
  "factCheckNotes",
  "boundaryCheckNotes",
  "copyingRiskNotes",
  "humanReviewerInitials",
];
const READY_STATUS = "ready_for_separate_human_approval_review";
const DISALLOWED_STATUS_PATTERN = /approved_final|commercial_ready|learner_facing_ready|production_ready|trading_signal|buy|sell|hold|broker|auto_trading|real_money/i;

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

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function assertSafeEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (record.learnerFacingRelease !== false) fail(`${label} cannot set learnerFacingRelease true`);
  if (record.approvalStatus && record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome && record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function overlayByBatch(statusOverlay) {
  if (!statusOverlay) return new Map();
  assertSafeEnvelope(statusOverlay, "manual status overlay");
  if (statusOverlay.sampleOnly === true) fail("manual status overlay cannot be sampleOnly");
  if (!Array.isArray(statusOverlay.batches)) fail("manual status overlay must include batches array");
  const seenBatchIds = new Set();
  const batches = new Map();
  for (const batch of statusOverlay.batches) {
    if (!batch.batchId) fail("manual status overlay batch missing batchId");
    if (batch.sampleOnly === true) fail(`${batch.batchId} cannot be sampleOnly in manual status overlay`);
    if (seenBatchIds.has(batch.batchId)) fail(`manual status overlay has duplicate batch ${batch.batchId}`);
    seenBatchIds.add(batch.batchId);
    batches.set(batch.batchId, batch);
  }
  return batches;
}

function validateStatusOverlayAgainstGuide(statusOverlay, guide) {
  const overlays = overlayByBatch(statusOverlay);
  if (!statusOverlay) return overlays;
  const guideBatches = new Map(guide.batches.map((batch) => [batch.batchId, batch]));
  for (const [batchId, statusBatch] of overlays.entries()) {
    const guideBatch = guideBatches.get(batchId);
    if (!guideBatch) fail(`manual status overlay references unknown batch ${batchId}`);
    assertSafeEnvelope(statusBatch, `manual status overlay ${batchId}`);
    const guideLessonIds = new Set(guideBatch.lessonCards.map((card) => card.lessonId));
    const seenLessonIds = new Set();
    if (!Array.isArray(statusBatch.lessonCards)) fail(`${batchId} manual status overlay must include lessonCards array`);
    for (const card of statusBatch.lessonCards) {
      if (!card.lessonId) fail(`${batchId} manual status overlay card missing lessonId`);
      if (!guideLessonIds.has(card.lessonId)) fail(`${batchId} manual status overlay references unknown lesson ${card.lessonId}`);
      if (seenLessonIds.has(card.lessonId)) fail(`${batchId} manual status overlay has duplicate lesson ${card.lessonId}`);
      seenLessonIds.add(card.lessonId);
      if (card.sampleOnly === true) fail(`${card.lessonId} cannot be sampleOnly in manual status overlay`);
      if ("currentGrade" in card && card.currentGrade !== "structural_draft") fail(`${card.lessonId} cannot override currentGrade`);
      if ("mustRemainStructuralDraft" in card && card.mustRemainStructuralDraft !== true) fail(`${card.lessonId} must keep mustRemainStructuralDraft true`);
      if ("approvalStatus" in card && card.approvalStatus !== "not_approved") fail(`${card.lessonId} card approvalStatus must stay not_approved`);
      if ("learnerFacingRelease" in card && card.learnerFacingRelease !== false) fail(`${card.lessonId} card cannot set learnerFacingRelease true`);
      if ("productionReady" in card && card.productionReady !== false) fail(`${card.lessonId} card must keep productionReady false`);
      if (DISALLOWED_STATUS_PATTERN.test(`${card.trackingStatus || ""} ${card.currentGrade || ""} ${card.approvalStatus || ""}`)) {
        fail(`${card.lessonId} has disallowed manual status claim`);
      }
    }
  }
  return overlays;
}

function mergedBatchState(guideBatch, statusBatch) {
  const statusCards = new Map((statusBatch?.lessonCards || []).map((card) => [card.lessonId, card]));
  return {
    ...guideBatch,
    reviewStatus: statusBatch?.reviewStatus || guideBatch.reviewStatus,
    approvalStatus: statusBatch?.approvalStatus || guideBatch.approvalStatus,
    learnerFacingRelease: statusBatch?.learnerFacingRelease ?? guideBatch.learnerFacingRelease,
    expectedOutcome: statusBatch?.expectedOutcome || guideBatch.expectedOutcome,
    lessonCards: guideBatch.lessonCards.map((card) => ({
      ...card,
      ...(statusCards.get(card.lessonId) || {}),
    })),
  };
}

function auditBatch(batch, allowedStatuses) {
  assertSafeEnvelope(batch, batch.batchId);
  if (!allowedStatuses.has(batch.reviewStatus)) fail(`${batch.batchId} has invalid reviewStatus ${batch.reviewStatus}`);
  if (DISALLOWED_STATUS_PATTERN.test(`${batch.reviewStatus} ${batch.approvalStatus || ""} ${batch.expectedOutcome || ""}`)) {
    fail(`${batch.batchId} contains disallowed completion claim`);
  }
  const ready = batch.reviewStatus === READY_STATUS;
  const missingNotes = [];
  for (const card of batch.lessonCards) {
    if (card.currentGrade !== "structural_draft") fail(`${card.lessonId} cannot leave structural_draft in completion audit`);
    if (card.mustRemainStructuralDraft !== true) fail(`${card.lessonId} must keep mustRemainStructuralDraft true`);
    if (DISALLOWED_STATUS_PATTERN.test(`${card.trackingStatus || ""} ${card.currentGrade || ""}`)) {
      fail(`${card.lessonId} has disallowed status claim`);
    }
    if (ready || card.trackingStatus === READY_STATUS) {
      for (const field of REQUIRED_NOTE_FIELDS) {
        if (!hasText(card[field])) missingNotes.push(`${card.lessonId}.${field}`);
      }
    }
  }
  return {
    batchId: batch.batchId,
    reviewStatus: batch.reviewStatus,
    itemCount: batch.lessonCards.length,
    readyForSeparateHumanApprovalReview: ready,
    missingRequiredNotes: missingNotes,
  };
}

function buildStatusTemplate(guide) {
  return {
    generatedAt: new Date().toISOString(),
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    expectedOutcome: EXPECTED_OUTCOME,
    purpose: "Manual reviewer status template. Copy to LESSON_BATCH_REVIEW_STATUS.json only when a human is ready to record review notes; leave approval and release fields unchanged.",
    instructions: [
      "Keep approvalStatus:not_approved and learnerFacingRelease:false.",
      "Fill notes only after original rewriting, source-fit review, fact check, boundary check, and copying-risk review are actually performed.",
      "Do not mark a batch ready_for_separate_human_approval_review until every lesson card in that batch has all required notes and humanReviewerInitials.",
      "Do not use this template to mark lessons commercial_ready or learner-facing ready.",
    ],
    batches: guide.batches.map((batch) => ({
      batchId: batch.batchId,
      educationOnly: true,
      productionReady: false,
      learnerFacingRelease: false,
      approvalStatus: "not_approved",
      expectedOutcome: EXPECTED_OUTCOME,
      reviewStatus: "not_started",
      lessonCards: batch.lessonCards.map((card) => ({
        lessonId: card.lessonId,
        trackingStatus: "not_started",
        originalRewriteNotes: "",
        sourceFitNotes: "",
        factCheckNotes: "",
        boundaryCheckNotes: "",
        copyingRiskNotes: "",
        humanReviewerInitials: "",
        mustRemainStructuralDraft: true,
      })),
    })),
    boundary: "This template is blank reviewer input scaffolding. It is not evidence of completed human review, final approval, learner-facing release, or commercial readiness.",
  };
}

function assertStatusTemplate(template, guide) {
  assertSafeEnvelope(template, "status template");
  if (template.purpose?.includes("Manual reviewer status template") !== true) fail("status template purpose missing");
  if (!Array.isArray(template.batches) || template.batches.length !== guide.batches.length) fail("status template must cover every guide batch");
  const guideBatches = new Map(guide.batches.map((batch) => [batch.batchId, batch]));
  for (const batch of template.batches) {
    const guideBatch = guideBatches.get(batch.batchId);
    if (!guideBatch) fail(`status template references unknown batch ${batch.batchId}`);
    assertSafeEnvelope(batch, `status template ${batch.batchId}`);
    if (batch.reviewStatus !== "not_started") fail(`${batch.batchId} template must start not_started`);
    if (!Array.isArray(batch.lessonCards) || batch.lessonCards.length !== guideBatch.lessonCards.length) fail(`${batch.batchId} template lesson card count mismatch`);
    const guideLessonIds = new Set(guideBatch.lessonCards.map((card) => card.lessonId));
    for (const card of batch.lessonCards) {
      if (!guideLessonIds.has(card.lessonId)) fail(`${batch.batchId} template references unknown lesson ${card.lessonId}`);
      if (card.trackingStatus !== "not_started") fail(`${card.lessonId} template must start not_started`);
      if (card.mustRemainStructuralDraft !== true) fail(`${card.lessonId} template must keep structural draft flag`);
      for (const field of REQUIRED_NOTE_FIELDS) {
        if (card[field] !== "") fail(`${card.lessonId}.${field} template value must be blank`);
      }
    }
  }
}

function renderStatusTemplateMarkdown(template) {
  return [
    "# Lesson Batch Review Status Template",
    "",
    "This blank template is for future human reviewer notes.",
    "It is not completed review, final approval, learner-facing release, production readiness, or trading guidance.",
    "",
    "## Summary",
    "",
    `- Template batches: ${template.batches.length}`,
    `- Lesson cards: ${template.batches.reduce((sum, batch) => sum + batch.lessonCards.length, 0)}`,
    `- Approval status: ${template.approvalStatus}`,
    `- Learner-facing release: ${template.learnerFacingRelease}`,
    `- educationOnly: ${template.educationOnly}`,
    `- productionReady: ${template.productionReady}`,
    "",
    "## Instructions",
    "",
    ...template.instructions.map((item) => `- ${item}`),
    "",
    "## Template Rows",
    "",
    "| Batch | Status | Lesson cards | Notes state |",
    "| --- | --- | ---: | --- |",
    ...template.batches.map((batch) => `| ${batch.batchId} | ${batch.reviewStatus} | ${batch.lessonCards.length} | blank |`),
    "",
    "## Boundary",
    "",
    template.boundary,
    "",
  ].join("\n");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeCompleteOverlay(guide) {
  return {
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    expectedOutcome: EXPECTED_OUTCOME,
    batches: [
      {
        batchId: guide.batches[0].batchId,
        educationOnly: true,
        productionReady: false,
        learnerFacingRelease: false,
        approvalStatus: "not_approved",
        expectedOutcome: EXPECTED_OUTCOME,
        reviewStatus: READY_STATUS,
        lessonCards: guide.batches[0].lessonCards.map((card) => ({
          lessonId: card.lessonId,
          trackingStatus: READY_STATUS,
          originalRewriteNotes: "Human reviewer note placeholder for negative-case control.",
          sourceFitNotes: "Human reviewer note placeholder for negative-case control.",
          factCheckNotes: "Human reviewer note placeholder for negative-case control.",
          boundaryCheckNotes: "Human reviewer note placeholder for negative-case control.",
          copyingRiskNotes: "Human reviewer note placeholder for negative-case control.",
          humanReviewerInitials: "QA",
          mustRemainStructuralDraft: true,
        })),
      },
    ],
  };
}

function expectOverlayFailure(name, guide, mutate, expectedPattern) {
  const overlay = makeCompleteOverlay(guide);
  mutate(overlay);
  try {
    const overlays = validateStatusOverlayAgainstGuide(overlay, guide);
    const missingRequiredNotes = [];
    for (const guideBatch of guide.batches) {
      const row = auditBatch(mergedBatchState(guideBatch, overlays.get(guideBatch.batchId)), new Set(guide.allowedStatuses || []));
      missingRequiredNotes.push(...row.missingRequiredNotes);
    }
    if (missingRequiredNotes.length) {
      fail(`ready batch/card is missing required reviewer notes: ${missingRequiredNotes.slice(0, 12).join(", ")}`);
    }
  } catch (error) {
    const passed = expectedPattern.test(error.message);
    return {
      name,
      expectedFailure: true,
      passed,
      errorMessage: error.message,
    };
  }
  return {
    name,
    expectedFailure: true,
    passed: false,
    errorMessage: "negative case unexpectedly passed",
  };
}

function runNegativeCases(guide) {
  const firstBatchId = guide.batches[0].batchId;
  const firstLessonId = guide.batches[0].lessonCards[0].lessonId;
  return [
    expectOverlayFailure("sample_overlay_rejected", guide, (overlay) => {
      overlay.sampleOnly = true;
    }, /sampleOnly/),
    expectOverlayFailure("approval_status_rejected", guide, (overlay) => {
      overlay.approvalStatus = "approved_final";
    }, /not_approved|completion claim/),
    expectOverlayFailure("learner_facing_release_rejected", guide, (overlay) => {
      overlay.learnerFacingRelease = true;
    }, /learnerFacingRelease/),
    expectOverlayFailure("production_ready_rejected", guide, (overlay) => {
      overlay.productionReady = true;
    }, /productionReady/),
    expectOverlayFailure("unknown_batch_rejected", guide, (overlay) => {
      overlay.batches[0].batchId = "rewrite_batch_UNKNOWN";
    }, /unknown batch/),
    expectOverlayFailure("duplicate_batch_rejected", guide, (overlay) => {
      overlay.batches.push(clone(overlay.batches[0]));
    }, /duplicate batch/),
    expectOverlayFailure("unknown_lesson_rejected", guide, (overlay) => {
      overlay.batches[0].lessonCards[0].lessonId = "lesson_UNKNOWN";
    }, /unknown lesson/),
    expectOverlayFailure("duplicate_lesson_rejected", guide, (overlay) => {
      overlay.batches[0].lessonCards.push(clone(overlay.batches[0].lessonCards[0]));
    }, /duplicate lesson/),
    expectOverlayFailure("ready_missing_notes_rejected", guide, (overlay) => {
      overlay.batches[0].lessonCards[0].sourceFitNotes = "";
    }, /missing required reviewer notes/),
    expectOverlayFailure("grade_override_rejected", guide, (overlay) => {
      overlay.batches[0].lessonCards[0].currentGrade = "commercial_ready";
    }, /currentGrade/),
    expectOverlayFailure("trading_signal_status_rejected", guide, (overlay) => {
      overlay.batches[0].lessonCards[0].trackingStatus = "trading_signal_ready";
    }, /disallowed manual status claim|disallowed status claim/),
    expectOverlayFailure("sample_card_rejected", guide, (overlay) => {
      overlay.batches[0].lessonCards[0].sampleOnly = true;
    }, /sampleOnly/),
  ].map((row) => ({ ...row, batchId: firstBatchId, lessonId: firstLessonId }));
}

function renderNegativeCasesMarkdown(report) {
  return [
    "# Lesson Batch Status Negative Cases",
    "",
    "This report proves the manual status overlay gate rejects unsafe or incomplete reviewer-status states.",
    "It is not approval, learner-facing release, production readiness, or trading guidance.",
    "",
    "## Summary",
    "",
    `- Negative cases: ${report.negativeCases}`,
    `- Passed cases: ${report.passedCases}`,
    `- Failed cases: ${report.failedCases}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Cases",
    "",
    "| Case | Passed | Error message |",
    "| --- | --- | --- |",
    ...report.rows.map((row) => `| ${row.name} | ${row.passed} | ${row.errorMessage.replaceAll("|", "/")} |`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const guide = await readJson(guidePath);
const workbench = await readJson(workbenchPath);
const statusOverlay = await readJson(statusPath, true);

assertSafeEnvelope(guide, "batch review guide");
if (workbench.educationOnly !== true) fail("workbench must keep educationOnly true");
if (workbench.productionReady !== false) fail("workbench must keep productionReady false");

const workbenchIds = new Set((workbench.items || []).map((item) => item.lessonId));
const guideIds = new Set(guide.batches.flatMap((batch) => batch.lessonCards.map((card) => card.lessonId)));
if (workbenchIds.size !== guideIds.size) fail("guide lesson card coverage does not match workbench items");
for (const lessonId of workbenchIds) {
  if (!guideIds.has(lessonId)) fail(`guide missing workbench lesson ${lessonId}`);
}

const overlays = validateStatusOverlayAgainstGuide(statusOverlay, guide);
const allowedStatuses = new Set(guide.allowedStatuses || []);
const batchRows = guide.batches.map((guideBatch) => auditBatch(mergedBatchState(guideBatch, overlays.get(guideBatch.batchId)), allowedStatuses));
const missingRequiredNotes = batchRows.flatMap((row) => row.missingRequiredNotes);
if (missingRequiredNotes.length) {
  fail(`ready batch/card is missing required reviewer notes: ${missingRequiredNotes.slice(0, 12).join(", ")}`);
}

const statusTemplate = buildStatusTemplate(guide);
assertStatusTemplate(statusTemplate, guide);
const negativeRows = runNegativeCases(guide);
const failedNegativeRows = negativeRows.filter((row) => !row.passed);
if (failedNegativeRows.length) {
  fail(`negative status overlay cases failed: ${failedNegativeRows.map((row) => row.name).join(", ")}`);
}

const audit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  statusOverlayPresent: Boolean(statusOverlay),
  statusTemplateBatches: statusTemplate.batches.length,
  statusTemplateLessonCards: statusTemplate.batches.reduce((sum, batch) => sum + batch.lessonCards.length, 0),
  guideBatches: guide.batches.length,
  guideLessonCards: guideIds.size,
  workbenchItems: workbenchIds.size,
  readyBatches: batchRows.filter((row) => row.readyForSeparateHumanApprovalReview).length,
  missingRequiredNotes: missingRequiredNotes.length,
  batchRows,
  boundary: "This audit only validates reviewer tracking completeness. It does not approve lessons, publish learner-facing content, change lesson grades, or certify commercial readiness.",
};
const negativeReport = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  negativeCases: negativeRows.length,
  passedCases: negativeRows.filter((row) => row.passed).length,
  failedCases: failedNegativeRows.length,
  rows: negativeRows,
  boundary: "These negative cases are synthetic safety checks for reviewer-status overlays. They do not approve lessons, publish learner-facing content, change lesson grades, or certify commercial readiness.",
};

await fs.writeFile(outputJson, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
await fs.writeFile(outputNegativeJson, `${JSON.stringify(negativeReport, null, 2)}\n`, "utf8");
await fs.writeFile(outputTemplateJson, `${JSON.stringify(statusTemplate, null, 2)}\n`, "utf8");
await fs.writeFile(outputTemplateMd, renderStatusTemplateMarkdown(statusTemplate), "utf8");
await fs.writeFile(outputNegativeMd, renderNegativeCasesMarkdown(negativeReport), "utf8");
await fs.writeFile(outputMd, [
  "# Lesson Batch Completion Audit",
  "",
  "This audit checks whether batch-level human-review tracking can safely advance to a separate approval review.",
  "It is not lesson approval, learner-facing release, production readiness, or trading guidance.",
  "",
  "## Summary",
  "",
  `- Status overlay present: ${audit.statusOverlayPresent}`,
  `- Status template batches: ${audit.statusTemplateBatches}`,
  `- Status template lesson cards: ${audit.statusTemplateLessonCards}`,
  `- Guide batches: ${audit.guideBatches}`,
  `- Guide lesson cards: ${audit.guideLessonCards}`,
  `- Workbench items: ${audit.workbenchItems}`,
  `- Ready batches: ${audit.readyBatches}`,
  `- Missing required notes: ${audit.missingRequiredNotes}`,
  `- Approval status: ${audit.approvalStatus}`,
  `- Learner-facing release: ${audit.learnerFacingRelease}`,
  `- educationOnly: ${audit.educationOnly}`,
  `- productionReady: ${audit.productionReady}`,
  "",
  "## Batch Rows",
  "",
  "| Batch | Status | Items | Ready for separate approval review | Missing notes |",
  "| --- | --- | ---: | --- | ---: |",
  ...batchRows.map((row) => `| ${row.batchId} | ${row.reviewStatus} | ${row.itemCount} | ${row.readyForSeparateHumanApprovalReview} | ${row.missingRequiredNotes.length} |`),
  "",
  "## Boundary",
  "",
  audit.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: audit.educationOnly,
  productionReady: audit.productionReady,
  learnerFacingRelease: audit.learnerFacingRelease,
  approvalStatus: audit.approvalStatus,
  statusOverlayPresent: audit.statusOverlayPresent,
  statusTemplateBatches: audit.statusTemplateBatches,
  statusTemplateLessonCards: audit.statusTemplateLessonCards,
  guideBatches: audit.guideBatches,
  guideLessonCards: audit.guideLessonCards,
  readyBatches: audit.readyBatches,
  missingRequiredNotes: audit.missingRequiredNotes,
  outputJson,
  outputMd,
  outputNegativeJson,
  outputNegativeMd,
  outputTemplateJson,
  outputTemplateMd,
}, null, 2));
