import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/LESSON_BATCH_REVIEW_OVERLAY_PREFLIGHT.json";
const outputMd = "docs/LESSON_BATCH_REVIEW_OVERLAY_PREFLIGHT.md";
const paths = {
  operatorDashboard: "docs/LESSON_BATCH_REVIEW_OPERATOR_DASHBOARD.json",
  packetCoverage: "docs/LESSON_BATCH_PACKET_COVERAGE.json",
  completionAudit: "docs/LESSON_BATCH_COMPLETION_AUDIT.json",
  statusTemplate: "docs/LESSON_BATCH_REVIEW_STATUS_TEMPLATE.json",
  sourceFitDashboard: "docs/SOURCE_FIT_REVIEWER_DASHBOARD.json",
  firstReviewerPreflight: "docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.json",
  firstReviewerWriteLock: "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.json",
  firstReviewerAuthorization: "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.json",
};
const noteFields = ["originalRewriteNotes", "sourceFitNotes", "factCheckNotes", "boundaryCheckNotes", "copyingRiskNotes", "humanReviewerInitials"];

function fail(message) {
  throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

async function exists(path) {
  return fs.access(path).then(() => true, () => false);
}

function assertEnvelope(record, label) {
  if (record.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (record.productionReady !== false) fail(`${label} must keep productionReady false`);
  if ("learnerFacingRelease" in record && record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if ("approvalStatus" in record && record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function assertBlockedGate(record, label) {
  if (record.writeAllowedNow !== false) fail(`${label} must keep writeAllowedNow false`);
  if (record.manualDecisionRequired !== true) fail(`${label} must require manual decision`);
  if (record.realStatusOverlayPresent !== false) fail(`${label} must see no real status overlay`);
  if ("humanAuthorizationRecorded" in record && record.humanAuthorizationRecorded !== false) fail(`${label} cannot record generated human authorization`);
  if ("internalTrialReady" in record && record.internalTrialReady !== false) fail(`${label} cannot be internal trial ready`);
  if ("launchReady" in record && record.launchReady !== false) fail(`${label} cannot be launch ready`);
}

function countStatusTemplate(template) {
  let lessonCards = 0;
  let blankNoteFields = 0;
  let filledNoteFields = 0;
  for (const batch of template.batches || []) {
    assertEnvelope(batch, `${batch.batchId} status template batch`);
    if (batch.reviewStatus !== "not_started") fail(`${batch.batchId} template must remain not_started`);
    for (const card of batch.lessonCards || []) {
      lessonCards += 1;
      if (card.trackingStatus !== "not_started") fail(`${card.lessonId} template card must remain not_started`);
      if (card.mustRemainStructuralDraft !== true) fail(`${card.lessonId} must remain structural draft`);
      for (const field of noteFields) {
        if (card[field] === "") blankNoteFields += 1;
        else filledNoteFields += 1;
      }
    }
  }
  return { batches: template.batches?.length || 0, lessonCards, blankNoteFields, filledNoteFields };
}

function markdown(report) {
  return [
    "# Lesson Batch Review Overlay Preflight",
    "",
    "This is the all-batch pre-write gate for the 48-lesson reviewer queue. It validates the broad batch dashboard, the blank status template, and the first-reviewer write gates while keeping real overlay writes blocked.",
    "",
    "## Summary",
    "",
    `- Preflight ready: ${report.preflightReady}`,
    `- Preflight mode: ${report.preflightMode}`,
    `- Rewrite batches: ${report.rewriteBatches}`,
    `- Lesson cards: ${report.lessonCards}`,
    `- Blank note fields: ${report.blankNoteFields}`,
    `- Filled note fields: ${report.filledNoteFields}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Write allowed now: ${report.writeAllowedNow}`,
    `- Manual decision required: ${report.manualDecisionRequired}`,
    `- Human authorization recorded: ${report.humanAuthorizationRecorded}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Commercial-ready promotions: ${report.commercialReadyPromotions}`,
    `- Internal trial ready: ${report.internalTrialReady}`,
    `- Launch ready: ${report.launchReady}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Gate Rows",
    "",
    "| Gate | Status | Evidence | Write impact |",
    "| --- | --- | --- | --- |",
    ...report.gateRows.map((row) => `| ${row.name} | ${row.status} | ${row.evidence} | ${row.writeImpact} |`),
    "",
    "## Manual Authorization Items",
    "",
    ...report.manualAuthorizationItems.map((item) => `- ${item}`),
    "",
    "## Command Preview",
    "",
    "Before any future human-authorized write:",
    "",
    ...report.requiredCommandsBeforeWrite.map((command) => `- \`${command}\``),
    "",
    `Write command preview only: \`${report.writeCommandPreview}\``,
    "",
    "After a future write:",
    "",
    ...report.requiredCommandsAfterWrite.map((command) => `- \`${command}\``),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const [
  operatorDashboard,
  packetCoverage,
  completionAudit,
  statusTemplate,
  sourceFitDashboard,
  firstReviewerPreflight,
  firstReviewerWriteLock,
  firstReviewerAuthorization,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.operatorDashboard),
  readJson(paths.packetCoverage),
  readJson(paths.completionAudit),
  readJson(paths.statusTemplate),
  readJson(paths.sourceFitDashboard),
  readJson(paths.firstReviewerPreflight),
  readJson(paths.firstReviewerWriteLock),
  readJson(paths.firstReviewerAuthorization),
  exists(realStatusPath),
]);

for (const [label, record] of [
  ["operator dashboard", operatorDashboard],
  ["packet coverage", packetCoverage],
  ["completion audit", completionAudit],
  ["status template", statusTemplate],
  ["source fit dashboard", sourceFitDashboard],
  ["first reviewer preflight", firstReviewerPreflight],
  ["first reviewer write lock", firstReviewerWriteLock],
  ["first reviewer authorization preview", firstReviewerAuthorization],
]) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; all-batch preflight is pre-write only`);
if (operatorDashboard.dashboardReady !== true) fail("operator dashboard must be ready");
if (operatorDashboard.rewriteBatches !== 8 || operatorDashboard.lessonCards !== 48) fail("operator dashboard must cover 8 batches and 48 lessons");
if (operatorDashboard.blankNoteFields !== 288 || operatorDashboard.filledNoteFields !== 0) fail("operator dashboard must keep 288 blank and 0 filled note fields");
if (operatorDashboard.nonGreenRefs !== 0) fail("operator dashboard found non-green refs");
if (operatorDashboard.approvalReviewCandidates !== 0 || operatorDashboard.commercialReadyPromotions !== 0) fail("operator dashboard cannot create approval candidates or promotions");
if (operatorDashboard.realStatusOverlayPresent !== false) fail("operator dashboard must see no real overlay");

if (packetCoverage.fullyCoveredBatches !== 8 || packetCoverage.uncoveredBatches !== 0) fail("packet coverage must remain 8/8");
if (packetCoverage.dedicatedEditorPackets !== 8 || packetCoverage.dedicatedNotesDryRuns !== 8) fail("dedicated packet coverage drifted");
if (completionAudit.statusOverlayPresent !== false || completionAudit.readyBatches !== 0) fail("completion audit must remain pre-write with 0 ready batches");
if (completionAudit.statusTemplateBatches !== 8 || completionAudit.statusTemplateLessonCards !== 48) fail("completion audit must see the 8-batch template");

const templateCounts = countStatusTemplate(statusTemplate);
if (templateCounts.batches !== 8 || templateCounts.lessonCards !== 48) fail("status template must cover 8 batches and 48 lesson cards");
if (templateCounts.blankNoteFields !== 288 || templateCounts.filledNoteFields !== 0) fail("status template must keep all 288 note fields blank");

assertBlockedGate(firstReviewerPreflight, "first reviewer preflight");
assertBlockedGate(firstReviewerWriteLock, "first reviewer write lock");
assertBlockedGate(firstReviewerAuthorization, "first reviewer authorization preview");

if (firstReviewerPreflight.blankNoteFields !== 72 || firstReviewerPreflight.approvalReviewCandidates !== 0) fail("first reviewer preflight counts drifted");
if (firstReviewerWriteLock.blankNoteFields !== 72 || firstReviewerWriteLock.approvalReviewCandidates !== 0) fail("first reviewer write lock counts drifted");
if (firstReviewerAuthorization.humanAuthorizationRecorded !== false || firstReviewerAuthorization.approvalReviewCandidates !== 0) fail("first reviewer authorization must remain blocked and candidate-free");

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  preflightReady: true,
  preflightMode: "all_batch_real_overlay_preflight_manual_required",
  realStatusPath,
  realStatusOverlayPresent,
  writeAllowedNow: false,
  manualDecisionRequired: true,
  humanAuthorizationRecorded: false,
  rewriteBatches: operatorDashboard.rewriteBatches,
  lessonCards: operatorDashboard.lessonCards,
  dedicatedEditorPackets: packetCoverage.dedicatedEditorPackets,
  dedicatedNotesDryRuns: packetCoverage.dedicatedNotesDryRuns,
  fullyCoveredBatches: packetCoverage.fullyCoveredBatches,
  uncoveredBatches: packetCoverage.uncoveredBatches,
  riskCounts: operatorDashboard.riskCounts,
  blankNoteFields: operatorDashboard.blankNoteFields,
  filledNoteFields: operatorDashboard.filledNoteFields,
  statusTemplateBlankNoteFields: templateCounts.blankNoteFields,
  statusTemplateFilledNoteFields: templateCounts.filledNoteFields,
  nonGreenRefs: operatorDashboard.nonGreenRefs,
  completeNoteCards: 0,
  readyBatches: 0,
  approvalReviewCandidates: 0,
  commercialReadyPromotions: 0,
  internalTrialReady: false,
  launchReady: false,
  gateRows: [
    {
      name: "All-batch packet coverage",
      status: "machine_checked",
      evidence: "8/8 dedicated editor packets and notes dry-runs are present.",
      writeImpact: "Allows reviewer orientation only; does not allow real notes or approval.",
    },
    {
      name: "All-batch blank status template",
      status: "blank_pre_write",
      evidence: "8 batches, 48 lesson cards, 288 blank note fields, 0 filled fields.",
      writeImpact: "Template may be copied only after explicit human note-taking authorization.",
    },
    {
      name: "Real overlay absence",
      status: "write_blocked",
      evidence: "docs/LESSON_BATCH_REVIEW_STATUS.json is absent.",
      writeImpact: "Generated checks cannot create the real overlay.",
    },
    {
      name: "First-reviewer write lock",
      status: "blocked_manual_required",
      evidence: "writeAllowedNow:false; manualDecisionRequired:true; humanAuthorizationRecorded:false.",
      writeImpact: "Any future first-reviewer write remains scoped and human-authorized only.",
    },
    {
      name: "Evidence and source boundary",
      status: "green_only_pre_write",
      evidence: "nonGreenRefs:0; yellow/red/research_only are not learner-facing evidence.",
      writeImpact: "Blocks unsafe source promotion.",
    },
    {
      name: "Approval and release boundary",
      status: "not_ready",
      evidence: "0 complete note cards, 0 ready batches, 0 approval candidates, 0 commercial-ready promotions.",
      writeImpact: "Blocks approval, learner-facing release, internal-trial readiness, launch readiness, and production readiness.",
    },
  ],
  manualAuthorizationItems: [
    "A real human reviewer must be identified before any write initializer is run in write mode.",
    "The human reviewer must choose an explicit scope; current first-reviewer write tooling is scoped to rewrite_batch_01 and rewrite_batch_05, not all 48 lessons.",
    "The reviewer must run dry-run and overwrite-protection checks immediately before a future write.",
    "Generated prompts, examples, dashboards, drills, and packets must not be pasted as real reviewer notes.",
    "Every direct source-fit candidate must be confirmed, downgraded, or blocked in original human sourceFitNotes before evidence intake.",
    "No artifact may claim approval, learner-facing release, internal-trial readiness, launch readiness, commercial readiness, production readiness, trading advice, performance, broker/order workflow, automation, real-money guidance, or copied source text.",
  ],
  requiredCommandsBeforeWrite: [
    "npm.cmd run init:first-reviewer-status-overlay:dry-run",
    "npm.cmd run check:first-reviewer-status-init-protection",
    "npm.cmd run check:first-reviewer-real-overlay-preflight-summary",
    "npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock",
    "npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview",
    "npm.cmd run check:lesson-batch-review-overlay-preflight",
  ],
  writeCommandPreview: "npm.cmd run init:first-reviewer-status-overlay:write",
  requiredCommandsAfterWrite: [
    "npm.cmd run check:first-reviewer-real-overlay-diff-audit",
    "npm.cmd run check:reviewer-note-quality-lint",
    "npm.cmd run check:first-reviewer-source-fit-notes-acceptance",
    "npm.cmd run check:lesson-batch-completion",
    "npm.cmd run check:first-reviewer-evidence-intake-summary",
    "npm.cmd run check:first-reviewer-separate-approval-review-gate",
    "npm.cmd run check:first-reviewer-release-readiness-negative-cases",
    "npm.cmd run check:curriculum-review",
    "npm.cmd run check:knowledge-base",
    "npm.cmd run check:knowledge-browser",
  ],
  sourceReports: paths,
  boundary: "This all-batch overlay preflight is reviewer-facing operations scaffolding only. It does not authorize write mode, create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, promote grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, launch the course, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  preflightReady: report.preflightReady,
  preflightMode: report.preflightMode,
  rewriteBatches: report.rewriteBatches,
  lessonCards: report.lessonCards,
  blankNoteFields: report.blankNoteFields,
  filledNoteFields: report.filledNoteFields,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  writeAllowedNow: report.writeAllowedNow,
  manualDecisionRequired: report.manualDecisionRequired,
  humanAuthorizationRecorded: report.humanAuthorizationRecorded,
  nonGreenRefs: report.nonGreenRefs,
  approvalReviewCandidates: report.approvalReviewCandidates,
  commercialReadyPromotions: report.commercialReadyPromotions,
  internalTrialReady: report.internalTrialReady,
  launchReady: report.launchReady,
  outputJson,
  outputMd,
}, null, 2));
