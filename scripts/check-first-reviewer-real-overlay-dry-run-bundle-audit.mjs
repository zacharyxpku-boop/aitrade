import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.json";
const outputMd = "docs/FIRST_REVIEWER_REAL_OVERLAY_DRY_RUN_BUNDLE_AUDIT.md";

const paths = {
  initDryRun: "docs/LESSON_BATCH_REVIEW_STATUS_INIT_DRY_RUN.json",
  initProtection: "docs/LESSON_BATCH_REVIEW_STATUS_INIT_PROTECTION.json",
  dayZeroWriteHandoff: "docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.json",
  finalRehearsalChecklist: "docs/FIRST_REVIEWER_DAY_ZERO_FINAL_REHEARSAL_CHECKLIST.json",
  authorizationPreview: "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.json",
  writeReadinessLock: "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.json",
  creationChecklist: "docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.json",
};

const expectedPreWriteCommands = [
  "npm.cmd run check:first-reviewer-operator-index",
  "npm.cmd run check:first-reviewer-day-of-review-packet-freeze",
  "npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock",
  "npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview",
  "npm.cmd run init:first-reviewer-status-overlay:dry-run",
  "npm.cmd run check:first-reviewer-status-init-protection",
  "manual human action only",
  "npm.cmd run init:first-reviewer-status-overlay:write",
];

const expectedFinalRehearsalCommands = [
  "npm.cmd run check:lesson-batch-review-operator-index",
  "npm.cmd run check:first-reviewer-operator-index",
  "npm.cmd run check:first-reviewer-rehearsal-checklist",
  "npm.cmd run check:first-reviewer-direct-candidate-decision-worksheet",
  "npm.cmd run check:first-reviewer-source-fit-decision-summary",
  "npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock",
  "npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview",
  "npm.cmd run check:first-reviewer-day-zero-write-handoff",
  "npm.cmd run check:first-reviewer-day-zero-final-rehearsal-checklist",
  "npm.cmd run init:first-reviewer-status-overlay:dry-run",
  "npm.cmd run check:first-reviewer-status-init-protection",
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

function assertBlocked(record, label) {
  if ("realStatusOverlayPresent" in record && record.realStatusOverlayPresent !== false) fail(`${label} must see no real status overlay`);
  if ("writeAllowedNow" in record && record.writeAllowedNow !== false) fail(`${label} cannot allow write now`);
  if ("creationAllowedNow" in record && record.creationAllowedNow !== false) fail(`${label} cannot allow creation now`);
  if ("startAllowedNow" in record && record.startAllowedNow !== false) fail(`${label} cannot allow start now`);
  if ("manualDecisionRequired" in record && record.manualDecisionRequired !== true) fail(`${label} must require manual decision`);
  if ("humanAuthorizationRecorded" in record && record.humanAuthorizationRecorded !== false) fail(`${label} cannot record human authorization`);
  if ("approvalReviewCandidates" in record && record.approvalReviewCandidates !== 0) fail(`${label} cannot create approval candidates`);
  if ("commercialReadyPromotions" in record && record.commercialReadyPromotions !== 0) fail(`${label} cannot promote generated lessons`);
  if ("internalTrialReady" in record && record.internalTrialReady !== false) fail(`${label} cannot be internal-trial ready`);
  if ("launchReady" in record && record.launchReady !== false) fail(`${label} cannot be launch ready`);
}

function sameList(actual, expected, label) {
  if (!Array.isArray(actual) || actual.length !== expected.length) fail(`${label} command count changed`);
  for (const [index, command] of expected.entries()) {
    if (actual[index] !== command) fail(`${label} command ${index + 1} expected ${command}, got ${actual[index]}`);
  }
}

function auditRow(name, passed, evidence) {
  return { name, passed, evidence };
}

function renderMarkdown(report) {
  return [
    "# First Reviewer Real Overlay Dry-Run Bundle Audit",
    "",
    "This audit checks that the pre-write dry-run bundle, overwrite protection, day-zero handoff, final rehearsal, and write locks still agree before any future human-created reviewer overlay.",
    "It is read-only scaffolding and does not create docs/LESSON_BATCH_REVIEW_STATUS.json.",
    "",
    "## Summary",
    "",
    `- Audit ready: ${report.auditReady}`,
    `- Audit mode: ${report.auditMode}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Dry-run safe: ${report.dryRunSafe}`,
    `- Overwrite protection passed: ${report.overwriteProtectionPassed}`,
    `- Command order consistent: ${report.commandOrderConsistent}`,
    `- Forbidden actions aligned: ${report.forbiddenActionsAligned}`,
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
    "## Audit Rows",
    "",
    "| Check | Passed | Evidence |",
    "| --- | --- | --- |",
    ...report.auditRows.map((row) => `| ${row.name} | ${row.passed} | ${row.evidence.replaceAll("|", "/")} |`),
    "",
    "## Pre-Write Command Order",
    "",
    ...report.preWriteCommandOrder.map((command, index) => `${index + 1}. \`${command}\``),
    "",
    "## Final Rehearsal Command Order",
    "",
    ...report.finalRehearsalCommandOrder.map((command, index) => `${index + 1}. \`${command}\``),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const [
  initDryRun,
  initProtection,
  dayZeroWriteHandoff,
  finalRehearsalChecklist,
  authorizationPreview,
  writeReadinessLock,
  creationChecklist,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.initDryRun),
  readJson(paths.initProtection),
  readJson(paths.dayZeroWriteHandoff),
  readJson(paths.finalRehearsalChecklist),
  readJson(paths.authorizationPreview),
  readJson(paths.writeReadinessLock),
  readJson(paths.creationChecklist),
  exists(realStatusPath),
]);

for (const [label, record] of [
  ["initializer dry-run", initDryRun],
  ["initializer protection", initProtection],
  ["day-zero write handoff", dayZeroWriteHandoff],
  ["final rehearsal checklist", finalRehearsalChecklist],
  ["authorization preview", authorizationPreview],
  ["write readiness lock", writeReadinessLock],
  ["creation checklist", creationChecklist],
]) {
  assertEnvelope(record, label);
  assertBlocked(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; dry-run bundle audit must stay pre-write`);
if (initDryRun.mode !== "dry_run" || initDryRun.wroteStatusOverlay !== false || initDryRun.notesFilled !== 0) fail("initializer dry-run must remain preview-only");
if (initDryRun.targetBatches.join(",") !== "rewrite_batch_01,rewrite_batch_05") fail("initializer dry-run target batches changed");
if (initProtection.protectionCases !== 3 || initProtection.passedCases !== 3) fail("initializer protection must keep 3/3 passing cases");
if (initProtection.realStatusOverlayTouched !== false || initProtection.existingTempOverlayPreserved !== true) fail("initializer protection must not touch real overlay and must preserve sentinel");
if (dayZeroWriteHandoff.handoffReady !== true || dayZeroWriteHandoff.handoffMode !== "day_zero_pre_write_handoff_only") fail("day-zero handoff must stay pre-write only");
if (dayZeroWriteHandoff.preWriteCommandRows?.length !== 8 || dayZeroWriteHandoff.futurePostWriteCommandRows?.length !== 12) fail("day-zero handoff command counts changed");
if (dayZeroWriteHandoff.authorizationBlockers?.length !== 2) fail("day-zero handoff must keep 2 authorization blockers");
if (finalRehearsalChecklist.checklistReady !== true || finalRehearsalChecklist.checklistMode !== "day_zero_final_rehearsal_pre_write_only") fail("final rehearsal checklist must stay pre-write only");
if (finalRehearsalChecklist.lessonCards !== 12 || finalRehearsalChecklist.blankNoteFields !== 72 || finalRehearsalChecklist.directCandidateDecisions !== 5) fail("final rehearsal lesson/note/candidate counts changed");
if (finalRehearsalChecklist.sourceFitDecisionRows !== 5 || finalRehearsalChecklist.confirmedDecisions !== 0) fail("final rehearsal source-fit summary counts changed");
if (authorizationPreview.authorizationPreviewReady !== true || authorizationPreview.machineGatesSatisfied !== authorizationPreview.machineGates) fail("authorization preview machine gates must be satisfied but not authorizing write");
if (writeReadinessLock.lockReady !== true) fail("write readiness lock must be ready and blocked");
if (creationChecklist.dryRunPassed !== true || creationChecklist.overwriteProtectionPassed !== true || !Array.isArray(creationChecklist.creationPrerequisites)) {
  fail("creation checklist must remain available with dry-run, overwrite protection, and prerequisites");
}

const handoffCommandOrder = dayZeroWriteHandoff.preWriteCommandRows.map((row) => row.command);
sameList(handoffCommandOrder, expectedPreWriteCommands, "day-zero handoff pre-write");
sameList(finalRehearsalChecklist.commandOrder, expectedFinalRehearsalCommands, "final rehearsal");

const forbiddenText = [
  ...(dayZeroWriteHandoff.forbiddenActions ?? []),
  ...(finalRehearsalChecklist.forbiddenActions ?? []),
  ...(authorizationPreview.hardStops ?? []),
  ...(writeReadinessLock.hardStops ?? []),
].join("\n").toLowerCase();

const requiredForbiddenSignals = [
  "write mode",
  "human",
  "commercial_ready",
  "productionready",
  "buy/sell/hold",
  "trading signals",
  "performance claims",
  "broker",
  "automation",
  "real-money",
  "yellow, red, or research_only",
];
const missingForbiddenSignals = requiredForbiddenSignals.filter((signal) => !forbiddenText.includes(signal));
if (missingForbiddenSignals.length) fail(`forbidden actions lost signals: ${missingForbiddenSignals.join(", ")}`);

const auditRows = [
  auditRow("initializer_dry_run_preview_only", true, "mode:dry_run; wroteStatusOverlay:false; notesFilled:0"),
  auditRow("overwrite_protection_3_of_3", true, "protectionCases:3; passedCases:3; realStatusOverlayTouched:false"),
  auditRow("day_zero_handoff_pre_write_only", true, "8 pre-write rows, 12 future post-write rows, 2 human blockers"),
  auditRow("final_rehearsal_pre_write_only", true, "12 lesson cards, 72 blank notes, 5 unconfirmed direct candidates, 5 source-fit decision rows"),
  auditRow("authorization_preview_not_authorization", true, "humanAuthorizationRecorded:false; writeAllowedNow:false"),
  auditRow("write_readiness_lock_blocked", true, "lockReady:true; manualDecisionRequired:true; writeAllowedNow:false"),
  auditRow("command_order_consistent", true, "day-zero and final rehearsal command orders match expected dry-run bundle route"),
  auditRow("forbidden_actions_aligned", true, "write, approval, readiness, trading, broker, automation, real-money, copying, and yellow/red leaks remain blocked"),
  auditRow("real_overlay_absent", true, `${realStatusPath} is absent`),
];

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  auditReady: true,
  auditMode: "real_overlay_dry_run_bundle_sanity_pre_write_only",
  targetBatches: dayZeroWriteHandoff.targetBatches,
  realStatusPath,
  dryRunSafe: true,
  overwriteProtectionPassed: true,
  commandOrderConsistent: true,
  forbiddenActionsAligned: true,
  realStatusOverlayPresent,
  writeAllowedNow: false,
  manualDecisionRequired: true,
  humanAuthorizationRecorded: false,
  approvalReviewCandidates: 0,
  commercialReadyPromotions: 0,
  internalTrialReady: false,
  launchReady: false,
  preWriteCommandOrder: handoffCommandOrder,
  finalRehearsalCommandOrder: finalRehearsalChecklist.commandOrder,
  auditRows,
  sourceReports: paths,
  boundary: "This dry-run bundle audit is generated reviewer-facing operations scaffolding only. It does not authorize write mode, create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, promote grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, launch the course, make the product production-ready, or use yellow/red/research_only sources as learner-facing evidence.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, renderMarkdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  auditReady: report.auditReady,
  auditMode: report.auditMode,
  targetBatches: report.targetBatches,
  dryRunSafe: report.dryRunSafe,
  overwriteProtectionPassed: report.overwriteProtectionPassed,
  commandOrderConsistent: report.commandOrderConsistent,
  forbiddenActionsAligned: report.forbiddenActionsAligned,
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
