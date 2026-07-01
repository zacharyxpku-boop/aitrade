import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/LESSON_BATCH_REVIEW_OPERATOR_INDEX.json";
const outputMd = "docs/LESSON_BATCH_REVIEW_OPERATOR_INDEX.md";
const paths = {
  operatorDashboard: "docs/LESSON_BATCH_REVIEW_OPERATOR_DASHBOARD.json",
  overlayPreflight: "docs/LESSON_BATCH_REVIEW_OVERLAY_PREFLIGHT.json",
  sourceFitDashboard: "docs/SOURCE_FIT_REVIEWER_DASHBOARD.json",
  packetCoverage: "docs/LESSON_BATCH_PACKET_COVERAGE.json",
  statusTemplate: "docs/LESSON_BATCH_REVIEW_STATUS_TEMPLATE.json",
  firstReviewerOperatorIndex: "docs/FIRST_REVIEWER_OPERATOR_INDEX.json",
  firstReviewerDayZeroHandoff: "docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.json",
  firstReviewerWriteAuthorization: "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.json",
};

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

function assertBlocked(record, label) {
  if ("writeAllowedNow" in record && record.writeAllowedNow !== false) fail(`${label} must keep writeAllowedNow false`);
  if ("executionAllowedNow" in record && record.executionAllowedNow !== false) fail(`${label} must keep executionAllowedNow false`);
  if ("manualDecisionRequired" in record && record.manualDecisionRequired !== true) fail(`${label} must require manual decision`);
  if ("humanAuthorizationRecorded" in record && record.humanAuthorizationRecorded !== false) fail(`${label} cannot record human authorization`);
  if ("internalTrialReady" in record && record.internalTrialReady !== false) fail(`${label} cannot be internal trial ready`);
  if ("launchReady" in record && record.launchReady !== false) fail(`${label} cannot be launch ready`);
  if ("approvalReviewCandidates" in record && record.approvalReviewCandidates !== 0) fail(`${label} cannot create approval candidates`);
  if ("commercialReadyPromotions" in record && record.commercialReadyPromotions !== 0) fail(`${label} cannot promote commercial readiness`);
}

function templateCounts(template) {
  const batches = template.batches || [];
  const lessonCards = batches.reduce((sum, batch) => sum + (batch.lessonCards?.length || 0), 0);
  const filledNoteFields = batches.reduce((sum, batch) => sum + (batch.lessonCards || []).reduce((cardSum, card) => {
    return cardSum + ["originalRewriteNotes", "sourceFitNotes", "factCheckNotes", "boundaryCheckNotes", "copyingRiskNotes", "humanReviewerInitials"].filter((field) => card[field] !== "").length;
  }, 0), 0);
  return { batches: batches.length, lessonCards, filledNoteFields };
}

function phase(order, name, status, file, command, purpose, hardStop) {
  return { order, name, status, file, command, purpose, hardStop };
}

function markdown(report) {
  return [
    "# Lesson Batch Review Operator Index",
    "",
    "This is the broad reviewer entrypoint for the 48-lesson rewrite queue.",
    "It links the all-batch dashboard, source-fit dashboard, overlay preflight, and first-reviewer handoff without creating real notes, approvals, release candidates, or readiness claims.",
    "",
    "## Summary",
    "",
    `- Operator index ready: ${report.operatorIndexReady}`,
    `- Operator mode: ${report.operatorMode}`,
    `- Rewrite batches: ${report.rewriteBatches}`,
    `- Lesson cards: ${report.lessonCards}`,
    `- Risk mix: H:${report.riskCounts.high} M:${report.riskCounts.medium} L:${report.riskCounts.low}`,
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
    "## Phase Map",
    "",
    "| Order | Phase | Status | File | Command | Purpose | Hard stop |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...report.phaseRows.map((row) => `| ${row.order} | ${row.name} | ${row.status} | \`${row.file}\` | \`${row.command}\` | ${row.purpose} | ${row.hardStop} |`),
    "",
    "## Batch Priority",
    "",
    "| Batch | Risk mix | Lessons | First action |",
    "| --- | --- | ---: | --- |",
    ...report.batchRows.map((row) => `| ${row.batchId} | H:${row.riskCounts.high || 0} M:${row.riskCounts.medium || 0} L:${row.riskCounts.low || 0} | ${row.lessonCards} | ${row.firstAction} |`),
    "",
    "## Operator Rules",
    "",
    ...report.operatorRules.map((rule) => `- ${rule}`),
    "",
    "## Stop Conditions",
    "",
    ...report.stopConditions.map((condition) => `- ${condition}`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const [
  operatorDashboard,
  overlayPreflight,
  sourceFitDashboard,
  packetCoverage,
  statusTemplate,
  firstReviewerOperatorIndex,
  firstReviewerDayZeroHandoff,
  firstReviewerWriteAuthorization,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.operatorDashboard),
  readJson(paths.overlayPreflight),
  readJson(paths.sourceFitDashboard),
  readJson(paths.packetCoverage),
  readJson(paths.statusTemplate),
  readJson(paths.firstReviewerOperatorIndex),
  readJson(paths.firstReviewerDayZeroHandoff),
  readJson(paths.firstReviewerWriteAuthorization),
  exists(realStatusPath),
]);

for (const [label, record] of [
  ["operator dashboard", operatorDashboard],
  ["overlay preflight", overlayPreflight],
  ["source fit dashboard", sourceFitDashboard],
  ["packet coverage", packetCoverage],
  ["status template", statusTemplate],
  ["first reviewer operator index", firstReviewerOperatorIndex],
  ["first reviewer day-zero handoff", firstReviewerDayZeroHandoff],
  ["first reviewer write authorization", firstReviewerWriteAuthorization],
]) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; all-batch operator index expects pre-write state`);
if (operatorDashboard.dashboardReady !== true || overlayPreflight.preflightReady !== true) fail("all-batch dashboard and preflight must be ready");
if (operatorDashboard.rewriteBatches !== 8 || operatorDashboard.lessonCards !== 48) fail("operator dashboard must cover 8 batches and 48 lessons");
if (overlayPreflight.rewriteBatches !== 8 || overlayPreflight.lessonCards !== 48) fail("overlay preflight must cover 8 batches and 48 lessons");
if (sourceFitDashboard.sourceFitLessons !== 48 || sourceFitDashboard.rewriteBatches !== 8) fail("source-fit dashboard must cover the same 48 lessons and 8 batches");
if (packetCoverage.fullyCoveredBatches !== 8 || packetCoverage.uncoveredBatches !== 0) fail("packet coverage must remain 8/8");
if (operatorDashboard.nonGreenRefs !== 0 || sourceFitDashboard.greenSourceLeaks !== 0) fail("source boundary drifted");
if (operatorDashboard.blankNoteFields !== 288 || operatorDashboard.filledNoteFields !== 0) fail("operator dashboard must keep 288 blank and 0 filled note fields");
if (overlayPreflight.blankNoteFields !== 288 || overlayPreflight.filledNoteFields !== 0) fail("overlay preflight must keep 288 blank and 0 filled note fields");
if (firstReviewerOperatorIndex.operatorIndexReady !== true || firstReviewerDayZeroHandoff.handoffReady !== true) fail("first-reviewer entrypoints must remain ready");

for (const [label, record] of [
  ["overlay preflight", overlayPreflight],
  ["first reviewer operator index", firstReviewerOperatorIndex],
  ["first reviewer day-zero handoff", firstReviewerDayZeroHandoff],
  ["first reviewer write authorization", firstReviewerWriteAuthorization],
]) {
  assertBlocked(record, label);
}

const template = templateCounts(statusTemplate);
if (template.batches !== 8 || template.lessonCards !== 48 || template.filledNoteFields !== 0) fail("status template must remain 8 batches, 48 cards, and 0 filled note fields");

const batchRows = operatorDashboard.batchRows.map((row) => ({
  batchId: row.batchId,
  lessonCards: row.lessonCards,
  riskCounts: row.riskCounts,
  firstAction: row.manualAction,
}));

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  operatorIndexReady: true,
  operatorMode: "all_batch_single_entrypoint_pre_write_only",
  realStatusPath,
  realStatusOverlayPresent,
  rewriteBatches: operatorDashboard.rewriteBatches,
  lessonCards: operatorDashboard.lessonCards,
  riskCounts: operatorDashboard.riskCounts,
  blankNoteFields: operatorDashboard.blankNoteFields,
  filledNoteFields: operatorDashboard.filledNoteFields,
  nonGreenRefs: operatorDashboard.nonGreenRefs,
  writeAllowedNow: false,
  manualDecisionRequired: true,
  humanAuthorizationRecorded: false,
  approvalReviewCandidates: 0,
  commercialReadyPromotions: 0,
  internalTrialReady: false,
  launchReady: false,
  phaseRows: [
    phase(1, "All-batch orientation", "ready_pre_write_only", paths.operatorDashboard.replace(".json", ".md"), "npm.cmd run check:lesson-batch-review-operator-dashboard", "See the 8-batch / 48-lesson queue and risk mix.", "Dashboard is not review evidence or approval."),
    phase(2, "All-batch source-fit queue", "ready_pre_write_only", paths.sourceFitDashboard.replace(".json", ".md"), "npm.cmd run check:source-fit-reviewer-dashboard", "Use high, medium, and low source-fit reports to choose work order.", "Source-fit dashboard cannot confirm source use without human notes."),
    phase(3, "All-batch overlay preflight", "write_blocked_manual_required", paths.overlayPreflight.replace(".json", ".md"), "npm.cmd run check:lesson-batch-review-overlay-preflight", "Confirm the broad queue is still pre-write with real overlay absent.", "writeAllowedNow must stay false until explicit human authorization."),
    phase(4, "First reviewer entrypoint", "ready_pre_write_only", paths.firstReviewerOperatorIndex.replace(".json", ".md"), "npm.cmd run check:first-reviewer-operator-index", "Start concrete note-taking workflow with the first two high-risk batches.", "First-reviewer index is still scaffolding only."),
    phase(5, "Day-zero write handoff", "write_blocked_manual_required", paths.firstReviewerDayZeroHandoff.replace(".json", ".md"), "npm.cmd run check:first-reviewer-day-zero-write-handoff", "Use the scoped day-zero route only when a human reviewer is ready.", "Generated handoff cannot authorize write mode."),
    phase(6, "Full curriculum gate", "required_before_any_claim", "docs/CURRICULUM_REVIEW_QUEUE.md", "npm.cmd run check:curriculum-review", "Re-run the full curriculum chain after reviewer-facing artifacts change.", "Passing checks do not create approval, release, or production readiness."),
  ],
  batchRows,
  operatorRules: [
    "Start broad review from this index, then use the all-batch dashboard and source-fit dashboard to choose the next human-reviewed batch.",
    "Handle high-risk rows before medium and low rows; the first concrete write workflow remains scoped to rewrite_batch_01 and rewrite_batch_05.",
    "Keep generated notes, examples, packets, dashboards, and preflights separate from real human reviewer notes.",
    "Use the real overlay only after explicit human authorization; current generated state keeps writeAllowedNow:false.",
    "Never treat completed notes as approval; separate approval review remains required after evidence intake.",
    "Do not infer internal trial, launch, commercial readiness, or production readiness from any reviewer scaffold.",
  ],
  stopConditions: [
    "Stop if docs/LESSON_BATCH_REVIEW_STATUS.json appears without explicit human note-taking authorization.",
    "Stop if any generated scaffold is copied as real reviewer notes.",
    "Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.",
    "Stop if any artifact claims approval, learner-facing release, commercial_ready promotion, internalTrialReady, launchReady, or productionReady.",
    "Stop if notes or lesson text include buy/sell/hold advice, trading signals, performance claims, broker/order workflow, automation, copied external source prose, or real-money guidance.",
  ],
  sourceReports: paths,
  boundary: "This all-batch operator index is reviewer-facing operations scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, launch the course, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  operatorIndexReady: report.operatorIndexReady,
  operatorMode: report.operatorMode,
  rewriteBatches: report.rewriteBatches,
  lessonCards: report.lessonCards,
  blankNoteFields: report.blankNoteFields,
  filledNoteFields: report.filledNoteFields,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  writeAllowedNow: report.writeAllowedNow,
  manualDecisionRequired: report.manualDecisionRequired,
  humanAuthorizationRecorded: report.humanAuthorizationRecorded,
  approvalReviewCandidates: report.approvalReviewCandidates,
  commercialReadyPromotions: report.commercialReadyPromotions,
  internalTrialReady: report.internalTrialReady,
  launchReady: report.launchReady,
  outputJson,
  outputMd,
}, null, 2));
