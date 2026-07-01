import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.json";
const outputMd = "docs/FIRST_REVIEWER_DAY_ZERO_WRITE_HANDOFF.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  operatorIndex: "docs/FIRST_REVIEWER_OPERATOR_INDEX.json",
  prewriteSampleDossier: "docs/FIRST_REVIEWER_PREWRITE_SAMPLE_DOSSIER.json",
  dayOfReviewPacketFreeze: "docs/FIRST_REVIEWER_DAY_OF_REVIEW_PACKET_FREEZE.json",
  writeReadinessLock: "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.json",
  authorizationPreview: "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.json",
  postWriteCommandPack: "docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.json",
  initDryRun: "docs/LESSON_BATCH_REVIEW_STATUS_INIT_DRY_RUN.json",
  initProtection: "docs/LESSON_BATCH_REVIEW_STATUS_INIT_PROTECTION.json",
};

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

function step(order, phase, command, expectedState, hardStop) {
  return { order, phase, command, expectedState, hardStop };
}

function markdown(report) {
  return [
    "# First Reviewer Day-Zero Write Handoff",
    "",
    "This handoff compresses the first-reviewer day-zero write route into one page.",
    "It is not write authorization and does not create the real reviewer status overlay.",
    "",
    "## Summary",
    "",
    `- Handoff ready: ${report.handoffReady}`,
    `- Handoff mode: ${report.handoffMode}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Write allowed now: ${report.writeAllowedNow}`,
    `- Manual decision required: ${report.manualDecisionRequired}`,
    `- Human authorization recorded: ${report.humanAuthorizationRecorded}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Pre-write commands: ${report.preWriteCommandRows.length}`,
    `- Future post-write commands: ${report.futurePostWriteCommandRows.length}`,
    `- Authorization blockers: ${report.authorizationBlockers.length}`,
    `- Complete note cards: ${report.completeNoteCards}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Confirmed decisions: ${report.confirmedDecisions}`,
    `- Internal trial ready: ${report.internalTrialReady}`,
    `- Launch ready: ${report.launchReady}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Day-Zero Pre-Write Route",
    "",
    "| Order | Phase | Command | Expected state | Hard stop |",
    "| --- | --- | --- | --- | --- |",
    ...report.preWriteCommandRows.map((row) => `| ${row.order} | ${row.phase} | \`${row.command}\` | ${row.expectedState.replaceAll("|", "/")} | ${row.hardStop.replaceAll("|", "/")} |`),
    "",
    "## Authorization Blockers",
    "",
    ...report.authorizationBlockers.map((blocker) => `- ${blocker}`),
    "",
    "## Future Post-Write Route",
    "",
    ...report.futurePostWriteCommandRows.map((row) => `${row.order}. \`${row.command}\` - ${row.purpose}`),
    "",
    "## Forbidden Actions",
    "",
    ...report.forbiddenActions.map((action) => `- ${action}`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const [
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  operatorIndex,
  prewriteSampleDossier,
  dayOfReviewPacketFreeze,
  writeReadinessLock,
  authorizationPreview,
  postWriteCommandPack,
  initDryRun,
  initProtection,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.operatorIndex),
  readJson(paths.prewriteSampleDossier),
  readJson(paths.dayOfReviewPacketFreeze),
  readJson(paths.writeReadinessLock),
  readJson(paths.authorizationPreview),
  readJson(paths.postWriteCommandPack),
  readJson(paths.initDryRun),
  readJson(paths.initProtection),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  operatorIndex,
  prewriteSampleDossier,
  dayOfReviewPacketFreeze,
  writeReadinessLock,
  authorizationPreview,
  postWriteCommandPack,
  initDryRun,
  initProtection,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; day-zero handoff expects pre-write state`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include day-zero handoff file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-day-zero-write-handoff")) fail("dry-run packet must include day-zero handoff command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Day-zero write handoff" && row.status === "day_zero_handoff_ready_write_blocked")) fail("progress dashboard must include day-zero handoff status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to day-zero handoff");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === outputMd)) fail("operator index must point to day-zero handoff");
if (!prewriteSampleDossier.packetOrder.some((row) => row.file === outputMd)) fail("pre-write dossier must include day-zero handoff");

if (dayOfReviewPacketFreeze.freezeReady !== true || dayOfReviewPacketFreeze.frozenSteps < 34) fail("day-of-review freeze must be ready before day-zero handoff");
if (writeReadinessLock.lockReady !== true || writeReadinessLock.writeAllowedNow !== false || writeReadinessLock.manualDecisionRequired !== true) fail("write readiness lock must remain locked");
if (authorizationPreview.authorizationPreviewReady !== true || authorizationPreview.writeAllowedNow !== false || authorizationPreview.humanAuthorizationRecorded !== false) fail("authorization preview must stay preview-only");
if (authorizationPreview.machineGatesSatisfied !== authorizationPreview.machineGates) fail("authorization preview machine gates must be satisfied before handoff");
if (postWriteCommandPack.executionAllowedNow !== false || postWriteCommandPack.commandRows.length !== 12) fail("post-write command pack must remain future-only with 12 commands");
if (initDryRun.mode !== "dry_run" || initDryRun.wroteStatusOverlay !== false || initDryRun.notesFilled !== 0) fail("initializer dry run must stay preview-only");
if (initProtection.passedCases !== initProtection.protectionCases || initProtection.realStatusOverlayTouched !== false) fail("initializer protection must pass without touching real overlay");

const preWriteCommandRows = [
  step(1, "Open operator index", "npm.cmd run check:first-reviewer-operator-index", "single_entrypoint_pre_write_only", "Stop if index grants write permission, approval, release, launch, or production readiness."),
  step(2, "Confirm frozen packet", "npm.cmd run check:first-reviewer-day-of-review-packet-freeze", `freezeReady:true; frozenSteps:${dayOfReviewPacketFreeze.frozenSteps}`, "Stop if any step lacks input, expected output, failure route, or forbidden actions."),
  step(3, "Run write readiness lock", "npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock", "writeAllowedNow:false; manualDecisionRequired:true", "Stop if generated checks grant write permission."),
  step(4, "Run authorization preview", "npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview", "humanAuthorizationRecorded:false; writeAllowedNow:false", "Stop if preview is treated as human authorization."),
  step(5, "Run initializer dry-run", "npm.cmd run init:first-reviewer-status-overlay:dry-run", "mode:dry_run; wroteStatusOverlay:false; notesFilled:0", "Stop if dry-run creates or fills the real overlay."),
  step(6, "Run overwrite protection", "npm.cmd run check:first-reviewer-status-init-protection", `${initProtection.passedCases}/${initProtection.protectionCases} protection cases passing`, "Stop if overwrite protection touches the real overlay or fails sentinel preservation."),
  step(7, "Human-only write decision", "manual human action only", "reviewer named; scope accepted; direct candidates understood; note fields blank", "Stop if no human reviewer explicitly chooses to begin real note-taking."),
  step(8, "Write command preview", "npm.cmd run init:first-reviewer-status-overlay:write", "shown for later human use only; not authorized by this handoff", "Stop unless the human-only write decision has actually happened."),
];

const authorizationBlockers = authorizationPreview.authorizationItems
  .filter((item) => !item.machineStatus.startsWith("machine_checked"))
  .map((item) => `${item.name}: ${item.humanRequirement}`);

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  handoffReady: true,
  handoffMode: "day_zero_pre_write_handoff_only",
  realStatusPath,
  realStatusOverlayPresent,
  writeAllowedNow: false,
  manualDecisionRequired: true,
  humanAuthorizationRecorded: false,
  targetBatches: authorizationPreview.targetBatches,
  preWriteCommandRows,
  futurePostWriteCommandRows: postWriteCommandPack.commandRows,
  authorizationBlockers,
  completeNoteCards: authorizationPreview.completeNoteCards,
  approvalReviewCandidates: authorizationPreview.approvalReviewCandidates,
  confirmedDecisions: authorizationPreview.confirmedDecisions,
  internalTrialReady: authorizationPreview.internalTrialReady,
  launchReady: authorizationPreview.launchReady,
  forbiddenActions: [
    "Do not run write mode from this handoff alone.",
    "Do not create or overwrite docs/LESSON_BATCH_REVIEW_STATUS.json without explicit human note-taking intent.",
    "Do not treat generated prompts, examples, drills, checklists, freeze packets, authorization previews, or this handoff as real reviewer notes.",
    "Do not confirm direct-candidate sources without human sourceFitNotes.",
    "Do not approve lessons, publish learner-facing content, promote generated drafts to commercial_ready, mark internalTrialReady, mark launchReady, or set productionReady true.",
    "Do not add buy/sell/hold advice, trading signals, performance claims, broker/order workflow, automation, copied source prose, or real-money guidance.",
    "Do not use yellow, red, or research_only sources as learner-facing evidence.",
  ],
  sourceReports: paths,
  boundary: "This day-zero write handoff is generated reviewer-facing operations scaffolding only. It does not authorize write mode, create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, promote grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, launch the course, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  handoffReady: report.handoffReady,
  handoffMode: report.handoffMode,
  writeAllowedNow: report.writeAllowedNow,
  manualDecisionRequired: report.manualDecisionRequired,
  humanAuthorizationRecorded: report.humanAuthorizationRecorded,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  targetBatches: report.targetBatches,
  preWriteCommands: report.preWriteCommandRows.length,
  futurePostWriteCommands: report.futurePostWriteCommandRows.length,
  authorizationBlockers: report.authorizationBlockers.length,
  completeNoteCards: report.completeNoteCards,
  approvalReviewCandidates: report.approvalReviewCandidates,
  confirmedDecisions: report.confirmedDecisions,
  internalTrialReady: report.internalTrialReady,
  launchReady: report.launchReady,
  outputJson,
  outputMd,
}, null, 2));
