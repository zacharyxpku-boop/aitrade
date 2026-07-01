import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const READY_STATUS = "ready_for_separate_human_approval_review";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const draftPath = "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json";
const directCandidateWorksheetPath = "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.json";
const writeReadinessLockPath = "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.json";
const postWriteCommandPackPath = "docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.json";
const outputJson = "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_SIMULATOR.json";
const outputMd = "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_SIMULATOR.md";

const REQUIRED_NOTE_FIELDS = [
  "originalRewriteNotes",
  "sourceFitNotes",
  "factCheckNotes",
  "boundaryCheckNotes",
  "copyingRiskNotes",
  "humanReviewerInitials",
];
const ALLOWED_DECISIONS = [
  "confirm_direct_evidence_after_human_review",
  "downgrade_to_boundary_only",
  "blocked_needs_rewrite_or_source_replacement",
];
const UNSAFE_NOTE_PATTERN = /buy|sell|hold|entry signal|exit signal|win rate|profit|return|broker|order workflow|automation|real money|real-money|approved|approval|learner-facing|launch ready|commercial_ready|commercial ready|productionready|production ready/i;
const COPY_RISK_PATTERN = /copy this|quoted from|verbatim|paste source|external body text/i;

function fail(message) {
  throw new Error(message);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function exists(filePath) {
  return fs.access(filePath).then(() => true, () => false);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function safeDecisionNote(row) {
  const refs = row.sourceRefsToInspect.map((ref) => ref.sourceId).join(", ");
  return [
    "decision: downgrade_to_boundary_only.",
    `source role: ${row.family} ${row.defaultRole}; source ids: ${refs}; source titles and metadata were checked only for boundary/source-literacy context.`,
    "claim: this source family does not directly prove chart, price-action, or market-direction claims, so it must not be used as tactical evidence.",
    "rewrite action: keep the lesson structural_draft, rewrite the source mention as macro-data, filing, fraud, oversight, or source-boundary context only, and do not copy external source body text.",
  ].join(" ");
}

function validateSourceFitNote(note, row) {
  const issues = [];
  const text = String(note || "");
  const lower = text.toLowerCase();
  const context = `${row.batchId}.${row.lessonId}.${row.family}`;
  if (!text.trim()) issues.push(`${context} sourceFitNotes is blank`);
  if (text.trim().length < 180) issues.push(`${context} sourceFitNotes is too short`);
  if (!ALLOWED_DECISIONS.some((value) => lower.includes(value))) issues.push(`${context} lacks allowed decision`);
  for (const anchor of ["decision:", "source role:", "claim:", "rewrite action:", "source ids:"]) {
    if (!lower.includes(anchor)) issues.push(`${context} lacks ${anchor}`);
  }
  if (/chart-pattern proof|chart proof|signal support|entry\/exit proof|market direction proof|trading setup validator/.test(lower)) issues.push(`${context} misuses source as chart or signal proof`);
  if (UNSAFE_NOTE_PATTERN.test(text)) issues.push(`${context} contains unsafe readiness/trading wording`);
  if (COPY_RISK_PATTERN.test(text)) issues.push(`${context} contains copying-risk wording`);
  return issues;
}

function buildNotesByLesson(worksheet) {
  const notesByLesson = new Map();
  let greenRefsInspected = 0;
  for (const row of worksheet.decisionRows) {
    if (row.decisionWriteTarget !== "sourceFitNotes") fail(`${row.lessonId}/${row.family} must write to sourceFitNotes`);
    if (row.mustRemainStructuralDraft !== true || row.learnerFacingUseAllowedNow !== false || row.approvalAllowedNow !== false) {
      fail(`${row.lessonId}/${row.family} must remain structural draft, non-learner-facing, and unapproved`);
    }
    for (const ref of row.sourceRefsToInspect) {
      if (ref.sourceUseTier !== "green_official_public_domain" && ref.sourceUseTier !== "green_public_domain_classic") {
        fail(`${row.lessonId}/${row.family}/${ref.sourceId} is not a green source tier`);
      }
      greenRefsInspected += 1;
    }
    const note = safeDecisionNote(row);
    const issues = validateSourceFitNote(note, row);
    if (issues.length) fail(`safe sourceFitNotes failed for ${row.lessonId}/${row.family}: ${issues.join("; ")}`);
    const prior = notesByLesson.get(row.lessonId);
    notesByLesson.set(row.lessonId, prior ? `${prior} ${note}` : note);
  }
  return { notesByLesson, greenRefsInspected };
}

function fillCard(card, notesByLesson) {
  return {
    ...card,
    trackingStatus: READY_STATUS,
    originalRewriteNotes: `SIMULATOR ONLY: ${card.lessonId} original rewrite checked as structural_draft; no external source prose copied.`,
    sourceFitNotes: notesByLesson.get(card.lessonId)
      || "decision: downgrade_to_boundary_only. source role: no direct-candidate source role in this simulator card; source ids: none. claim: no direct evidence is confirmed by generated scaffolding. rewrite action: keep structural_draft and keep source mentions boundary-only.",
    factCheckNotes: `SIMULATOR ONLY: ${card.lessonId} factual claims remain limited to green-source role metadata and reviewer-visible boundaries.`,
    boundaryCheckNotes: "SIMULATOR ONLY: education-only boundary checked; no tactical advice, signal framing, result promise, execution workflow, automated action, or funding guidance.",
    copyingRiskNotes: "SIMULATOR ONLY: reviewer prose is original; no copied external source body text or paste-instruction is present.",
    humanReviewerInitials: "QA_SIM",
    mustRemainStructuralDraft: true,
  };
}

function buildTemporaryOverlay(draft, notesByLesson) {
  const overlay = {
    ...draft,
    purpose: "Temporary post-write validation simulator overlay. Not real reviewer evidence.",
    batches: draft.batches.map((batch) => ({
      ...batch,
      reviewStatus: READY_STATUS,
      lessonCards: batch.lessonCards.map((card) => fillCard(card, notesByLesson)),
    })),
  };
  assertEnvelope(overlay, "temporary overlay");
  for (const batch of overlay.batches) {
    assertEnvelope(batch, `temporary overlay ${batch.batchId}`);
    for (const card of batch.lessonCards) {
      if (card.trackingStatus !== READY_STATUS) fail(`${card.lessonId} simulator card must be ready status`);
      if (card.mustRemainStructuralDraft !== true) fail(`${card.lessonId} simulator card must remain structural draft`);
      for (const field of REQUIRED_NOTE_FIELDS) {
        if (!String(card[field] || "").trim()) fail(`${card.lessonId}.${field} must be filled in simulator`);
      }
    }
  }
  return overlay;
}

function validateDiffAuditLike(overlay) {
  const rows = overlay.batches.flatMap((batch) => batch.lessonCards.map((card) => ({ ...card, batchId: batch.batchId })));
  if (rows.length !== 12) fail(`simulator expected 12 cards, found ${rows.length}`);
  for (const row of rows) {
    for (const field of REQUIRED_NOTE_FIELDS) {
      if (!String(row[field] || "").trim()) fail(`${row.lessonId}.${field} is missing`);
    }
    const noteText = REQUIRED_NOTE_FIELDS.map((field) => row[field]).join(" ");
    if (UNSAFE_NOTE_PATTERN.test(noteText)) fail(`${row.lessonId} contains unsafe note wording`);
    if (COPY_RISK_PATTERN.test(noteText)) fail(`${row.lessonId} contains copying-risk note wording`);
  }
  return rows.length;
}

function negativeCase(name, mutate, expectedPattern) {
  try {
    mutate();
  } catch (error) {
    return {
      name,
      expectedFailure: true,
      passed: expectedPattern.test(error.message),
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

function runFailureRouteCases(baseOverlay, worksheet) {
  const sampleRow = worksheet.decisionRows[0];
  return [
    negativeCase("diff_missing_note_rejected", () => {
      const overlay = clone(baseOverlay);
      overlay.batches[0].lessonCards[0].sourceFitNotes = "";
      validateDiffAuditLike(overlay);
    }, /sourceFitNotes/),
    negativeCase("diff_trading_wording_rejected", () => {
      const overlay = clone(baseOverlay);
      overlay.batches[0].lessonCards[0].boundaryCheckNotes += " buy signal";
      validateDiffAuditLike(overlay);
    }, /unsafe/),
    negativeCase("diff_copying_wording_rejected", () => {
      const overlay = clone(baseOverlay);
      overlay.batches[0].lessonCards[0].copyingRiskNotes += " paste source";
      validateDiffAuditLike(overlay);
    }, /copying-risk/),
    negativeCase("sourceFit_missing_decision_rejected", () => {
      const issues = validateSourceFitNote("source role: CFTC context. claim: checked source. rewrite action: keep boundary only.", sampleRow);
      if (issues.length) fail(issues.join("; "));
    }, /allowed decision/),
    negativeCase("sourceFit_chart_proof_rejected", () => {
      const issues = validateSourceFitNote(`${safeDecisionNote(sampleRow)} chart proof`, sampleRow);
      if (issues.length) fail(issues.join("; "));
    }, /chart or signal proof/),
    negativeCase("sourceFit_approval_wording_rejected", () => {
      const issues = validateSourceFitNote(`${safeDecisionNote(sampleRow)} approved for learner-facing release`, sampleRow);
      if (issues.length) fail(issues.join("; "));
    }, /unsafe readiness/),
    negativeCase("sourceFit_copying_wording_rejected", () => {
      const issues = validateSourceFitNote(`${safeDecisionNote(sampleRow)} paste source text`, sampleRow);
      if (issues.length) fail(issues.join("; "));
    }, /copying-risk/),
  ];
}

function runNodeScript(scriptPath, env) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: 30000,
  });
  if (result.status !== 0) {
    fail(`${scriptPath} failed in simulator:\n${result.stdout}\n${result.stderr}`);
  }
}

function markdown(report) {
  return [
    "# First Reviewer Post-Write Validation Simulator",
    "",
    "This simulator runs the future post-write validation sequence against temporary files only.",
    "It proves complete reviewer-note states can flow through completion, intake, separate approval, and release-drift guards without creating real notes, approval, learner-facing release, grade promotion, launch readiness, or production readiness.",
    "",
    "## Summary",
    "",
    `- Simulator ready: ${report.simulatorReady}`,
    `- Simulator mode: ${report.simulatorMode}`,
    `- Temporary batches: ${report.temporaryBatches}`,
    `- Temporary lesson cards: ${report.temporaryLessonCards}`,
    `- Green refs inspected: ${report.greenRefsInspected}`,
    `- Completion ready batches: ${report.completionReadyBatches}`,
    `- Complete note cards: ${report.completeNoteCards}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Release negative cases passed: ${report.releaseNegativeCasesPassed}/${report.releaseNegativeCases}`,
    `- Failure routes covered: ${report.failureRoutesCovered}`,
    `- Real status overlay touched: ${report.realStatusOverlayTouched}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Validation Sequence",
    "",
    ...report.validationSequence.map((row, index) => `${index + 1}. ${row}`),
    "",
    "## Failure Routes",
    "",
    "| Case | Passed | Error message |",
    "| --- | --- | --- |",
    ...report.failureRouteRows.map((row) => `| ${row.name} | ${row.passed} | ${row.errorMessage.replaceAll("|", "/")} |`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const realBefore = await exists(realStatusPath);
const [draft, worksheet, writeReadinessLock, postWriteCommandPack] = await Promise.all([
  readJson(draftPath),
  readJson(directCandidateWorksheetPath),
  readJson(writeReadinessLockPath),
  readJson(postWriteCommandPackPath),
]);

for (const [label, record] of Object.entries({ draft, worksheet, writeReadinessLock, postWriteCommandPack })) {
  assertEnvelope(record, label);
}
if (realBefore) fail(`${realStatusPath} unexpectedly exists; simulator must run only while real overlay is absent`);
if (writeReadinessLock.writeAllowedNow !== false || writeReadinessLock.manualDecisionRequired !== true) fail("write readiness lock must keep write blocked before simulator");
if (postWriteCommandPack.executionAllowedNow !== false || postWriteCommandPack.commandRows.length !== 12) fail("post-write command pack must stay future-only with 12 commands");

const { notesByLesson, greenRefsInspected } = buildNotesByLesson(worksheet);
const temporaryOverlay = buildTemporaryOverlay(draft, notesByLesson);
const temporaryLessonCards = validateDiffAuditLike(temporaryOverlay);
const failureRouteRows = runFailureRouteCases(temporaryOverlay, worksheet);
const failedFailureRoutes = failureRouteRows.filter((row) => !row.passed);
if (failedFailureRoutes.length) fail(`simulator failure routes failed: ${failedFailureRoutes.map((row) => row.name).join(", ")}`);

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "tradegym-post-write-simulator-"));
const paths = {
  status: path.join(tempRoot, "LESSON_BATCH_REVIEW_STATUS.json"),
  completionJson: path.join(tempRoot, "LESSON_BATCH_COMPLETION_AUDIT.json"),
  completionMd: path.join(tempRoot, "LESSON_BATCH_COMPLETION_AUDIT.md"),
  templateJson: path.join(tempRoot, "LESSON_BATCH_REVIEW_STATUS_TEMPLATE.json"),
  templateMd: path.join(tempRoot, "LESSON_BATCH_REVIEW_STATUS_TEMPLATE.md"),
  negativeJson: path.join(tempRoot, "LESSON_BATCH_STATUS_NEGATIVE_CASES.json"),
  negativeMd: path.join(tempRoot, "LESSON_BATCH_STATUS_NEGATIVE_CASES.md"),
  intakeJson: path.join(tempRoot, "FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.json"),
  intakeMd: path.join(tempRoot, "FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.md"),
  approvalJson: path.join(tempRoot, "FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.json"),
  approvalMd: path.join(tempRoot, "FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.md"),
  releaseJson: path.join(tempRoot, "FIRST_REVIEWER_RELEASE_READINESS_NEGATIVE_CASES.json"),
  releaseMd: path.join(tempRoot, "FIRST_REVIEWER_RELEASE_READINESS_NEGATIVE_CASES.md"),
};

let completionAudit;
let evidenceIntake;
let separateApprovalGate;
let releaseNegativeCases;
try {
  await fs.writeFile(paths.status, `${JSON.stringify(temporaryOverlay, null, 2)}\n`, "utf8");
  const env = {
    TRADEGYM_BATCH_STATUS_PATH: paths.status,
    TRADEGYM_REVIEW_STATUS_PATH: paths.status,
    TRADEGYM_BATCH_COMPLETION_AUDIT_JSON: paths.completionJson,
    TRADEGYM_BATCH_COMPLETION_AUDIT_MD: paths.completionMd,
    TRADEGYM_BATCH_STATUS_TEMPLATE_JSON: paths.templateJson,
    TRADEGYM_BATCH_STATUS_TEMPLATE_MD: paths.templateMd,
    TRADEGYM_BATCH_STATUS_NEGATIVE_JSON: paths.negativeJson,
    TRADEGYM_BATCH_STATUS_NEGATIVE_MD: paths.negativeMd,
    TRADEGYM_EVIDENCE_INTAKE_JSON: paths.intakeJson,
    TRADEGYM_EVIDENCE_INTAKE_MD: paths.intakeMd,
    TRADEGYM_SEPARATE_APPROVAL_GATE_JSON: paths.approvalJson,
    TRADEGYM_SEPARATE_APPROVAL_GATE_MD: paths.approvalMd,
    TRADEGYM_RELEASE_NEGATIVE_CASES_JSON: paths.releaseJson,
    TRADEGYM_RELEASE_NEGATIVE_CASES_MD: paths.releaseMd,
  };
  runNodeScript("scripts/check-lesson-batch-completion-audit.mjs", env);
  runNodeScript("scripts/check-first-reviewer-evidence-intake-summary.mjs", env);
  runNodeScript("scripts/check-first-reviewer-separate-approval-review-gate.mjs", env);
  runNodeScript("scripts/check-first-reviewer-release-readiness-negative-cases.mjs", env);
  [completionAudit, evidenceIntake, separateApprovalGate, releaseNegativeCases] = await Promise.all([
    readJson(paths.completionJson),
    readJson(paths.intakeJson),
    readJson(paths.approvalJson),
    readJson(paths.releaseJson),
  ]);
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}

for (const [label, record] of Object.entries({ completionAudit, evidenceIntake, separateApprovalGate, releaseNegativeCases })) {
  assertEnvelope(record, label);
}
if (completionAudit.readyBatches !== 2) fail("simulator must produce 2 temporary completion-ready batches");
if (evidenceIntake.completeNoteCards !== 12 || evidenceIntake.readyForSeparateApprovalCandidates !== 12) fail("simulator intake must produce 12 candidate-only complete note cards");
if (separateApprovalGate.approvalReviewCandidates !== 12 || separateApprovalGate.autoApprovedLessons !== 0) fail("simulator approval gate must keep 12 candidates and zero auto approvals");
if (separateApprovalGate.learnerFacingReleaseCandidates !== 0 || separateApprovalGate.commercialReadyPromotions !== 0 || separateApprovalGate.productionReadyClaims !== 0) fail("simulator approval gate cannot create release, grade, or production claims");
if (releaseNegativeCases.failedCases !== 0 || releaseNegativeCases.passedCases !== releaseNegativeCases.negativeCases) fail("simulator release negative cases must pass");

const realAfter = await exists(realStatusPath);
const realStatusOverlayTouched = realBefore !== realAfter || realAfter === true;
if (realStatusOverlayTouched) fail("simulator touched the real status overlay");

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  simulatorReady: true,
  simulatorMode: "temporary_post_write_validation_sequence_only",
  realStatusPath,
  realStatusOverlayTouched,
  temporaryBatches: temporaryOverlay.batches.length,
  temporaryLessonCards,
  greenRefsInspected,
  completionReadyBatches: completionAudit.readyBatches,
  completeNoteCards: evidenceIntake.completeNoteCards,
  approvalReviewCandidates: separateApprovalGate.approvalReviewCandidates,
  autoApprovedLessons: separateApprovalGate.autoApprovedLessons,
  learnerFacingReleaseCandidates: separateApprovalGate.learnerFacingReleaseCandidates,
  commercialReadyPromotions: separateApprovalGate.commercialReadyPromotions,
  productionReadyClaims: separateApprovalGate.productionReadyClaims,
  releaseNegativeCases: releaseNegativeCases.negativeCases,
  releaseNegativeCasesPassed: releaseNegativeCases.passedCases,
  failureRoutesCovered: failureRouteRows.length,
  failureRouteRows,
  validationSequence: [
    "Build a temporary complete reviewer overlay from the blank first-reviewer template.",
    "Fill all 72 required note fields with simulator-only reviewer prose.",
    "Validate sourceFitNotes for 5 direct-candidate BEA/BLS/CFTC/SEC source roles.",
    "Run diff-audit-like checks for missing notes, unsafe wording, and copying-risk wording.",
    "Run lesson batch completion audit against temporary files.",
    "Run evidence intake summary against temporary files.",
    "Run separate approval review gate against temporary files.",
    "Run release readiness negative cases against temporary files.",
    "Delete all temporary files and confirm the real overlay remains absent.",
  ],
  sourceReports: {
    draftTemplate: draftPath,
    directCandidateWorksheet: directCandidateWorksheetPath,
    writeReadinessLock: writeReadinessLockPath,
    postWriteCommandPack: postWriteCommandPackPath,
  },
  boundary: "This post-write validation simulator uses temporary files only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill real human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, launch the course, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  simulatorReady: report.simulatorReady,
  temporaryBatches: report.temporaryBatches,
  temporaryLessonCards: report.temporaryLessonCards,
  completionReadyBatches: report.completionReadyBatches,
  completeNoteCards: report.completeNoteCards,
  approvalReviewCandidates: report.approvalReviewCandidates,
  releaseNegativeCasesPassed: report.releaseNegativeCasesPassed,
  releaseNegativeCases: report.releaseNegativeCases,
  realStatusOverlayTouched: report.realStatusOverlayTouched,
  outputJson,
  outputMd,
}, null, 2));
