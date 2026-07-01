import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.json";
const outputMd = "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_AUTHORIZATION_PREVIEW.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  operatorIndex: "docs/FIRST_REVIEWER_OPERATOR_INDEX.json",
  prewriteSampleDossier: "docs/FIRST_REVIEWER_PREWRITE_SAMPLE_DOSSIER.json",
  sequenceConsistency: "docs/FIRST_REVIEWER_SEQUENCE_CONSISTENCY.json",
  dayOfReviewPacketFreeze: "docs/FIRST_REVIEWER_DAY_OF_REVIEW_PACKET_FREEZE.json",
  humanReviewStartChecklist: "docs/FIRST_REVIEWER_HUMAN_REVIEW_START_CHECKLIST.json",
  creationChecklist: "docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.json",
  realOverlayPreflight: "docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.json",
  writeReadinessLock: "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.json",
  initDryRun: "docs/LESSON_BATCH_REVIEW_STATUS_INIT_DRY_RUN.json",
  initProtection: "docs/LESSON_BATCH_REVIEW_STATUS_INIT_PROTECTION.json",
  directCandidateWorksheet: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_DECISION_WORKSHEET.json",
  sourceFitNotesAcceptance: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.json",
  launchReadinessDashboard: "docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.json",
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

function item(name, machineStatus, humanRequirement, evidence, writeImpact) {
  return { name, machineStatus, humanRequirement, evidence, writeImpact };
}

function markdown(report) {
  return [
    "# First Reviewer Real Overlay Write Authorization Preview",
    "",
    "This is a generated authorization preview before any real reviewer-status overlay write.",
    "It identifies machine-checked gates and the human decisions still required, while keeping write permission blocked.",
    "",
    "## Summary",
    "",
    `- Authorization preview ready: ${report.authorizationPreviewReady}`,
    `- Authorization mode: ${report.authorizationMode}`,
    `- Write allowed now: ${report.writeAllowedNow}`,
    `- Creation allowed now: ${report.creationAllowedNow}`,
    `- Start allowed now: ${report.startAllowedNow}`,
    `- Manual decision required: ${report.manualDecisionRequired}`,
    `- Human authorization recorded: ${report.humanAuthorizationRecorded}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Authorization items: ${report.authorizationItems.length}`,
    `- Machine gates satisfied: ${report.machineGatesSatisfied}/${report.machineGates}`,
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
    "## Authorization Items",
    "",
    "| Item | Machine status | Human requirement | Evidence | Write impact |",
    "| --- | --- | --- | --- | --- |",
    ...report.authorizationItems.map((row) => `| ${row.name} | ${row.machineStatus} | ${row.humanRequirement} | ${row.evidence.replaceAll("|", "/")} | ${row.writeImpact.replaceAll("|", "/")} |`),
    "",
    "## Command Preview",
    "",
    `- Dry run: \`${report.dryRunCommand}\``,
    `- Write command shown for later human use only: \`${report.writeCommandPreview}\``,
    "",
    "## Hard Stops",
    "",
    ...report.hardStops.map((stop) => `- ${stop}`),
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
  sequenceConsistency,
  dayOfReviewPacketFreeze,
  humanReviewStartChecklist,
  creationChecklist,
  realOverlayPreflight,
  writeReadinessLock,
  initDryRun,
  initProtection,
  directCandidateWorksheet,
  sourceFitNotesAcceptance,
  launchReadinessDashboard,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.operatorIndex),
  readJson(paths.prewriteSampleDossier),
  readJson(paths.sequenceConsistency),
  readJson(paths.dayOfReviewPacketFreeze),
  readJson(paths.humanReviewStartChecklist),
  readJson(paths.creationChecklist),
  readJson(paths.realOverlayPreflight),
  readJson(paths.writeReadinessLock),
  readJson(paths.initDryRun),
  readJson(paths.initProtection),
  readJson(paths.directCandidateWorksheet),
  readJson(paths.sourceFitNotesAcceptance),
  readJson(paths.launchReadinessDashboard),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  operatorIndex,
  prewriteSampleDossier,
  sequenceConsistency,
  dayOfReviewPacketFreeze,
  humanReviewStartChecklist,
  creationChecklist,
  realOverlayPreflight,
  writeReadinessLock,
  initDryRun,
  initProtection,
  directCandidateWorksheet,
  sourceFitNotesAcceptance,
  launchReadinessDashboard,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; authorization preview expects pre-write state`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include authorization preview file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-write-authorization-preview")) fail("dry-run packet must include authorization preview command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Real overlay write authorization preview" && row.status === "authorization_preview_ready_manual_required")) fail("progress dashboard must include authorization preview status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to authorization preview");
if (!operatorIndex.phaseRows.some((row) => row.primaryFile === outputMd)) fail("operator index must point to authorization preview");
if (!prewriteSampleDossier.packetOrder.some((row) => row.file === outputMd)) fail("pre-write dossier must include authorization preview");

if (sequenceConsistency.failedChecks !== 0) fail("sequence consistency must pass before authorization preview");
if (dayOfReviewPacketFreeze.freezeReady !== true || dayOfReviewPacketFreeze.missingFieldRows !== 0 || dayOfReviewPacketFreeze.failedCrossLinks !== 0) fail("day-of-review packet freeze must be complete before authorization preview");
if (humanReviewStartChecklist.startAllowedNow !== false || humanReviewStartChecklist.realStatusOverlayPresent !== false) fail("human start checklist must keep start blocked before explicit human decision");
if (creationChecklist.creationAllowedNow !== false || creationChecklist.dryRunPassed !== true || creationChecklist.overwriteProtectionPassed !== true) fail("creation checklist must pass dry-run/protection while keeping creation blocked");
if (realOverlayPreflight.writeAllowedNow !== false || realOverlayPreflight.manualDecisionRequired !== true) fail("preflight must keep write blocked and manual decision required");
if (writeReadinessLock.lockReady !== true || writeReadinessLock.writeAllowedNow !== false || writeReadinessLock.manualDecisionRequired !== true) fail("write readiness lock must keep write blocked and manual decision required");
if (initDryRun.mode !== "dry_run" || initDryRun.wroteStatusOverlay !== false || initDryRun.notesFilled !== 0) fail("initializer dry run must not write overlay or fill notes");
if (initProtection.passedCases !== initProtection.protectionCases || initProtection.realStatusOverlayTouched !== false) fail("initializer protection must pass without touching real overlay");
if (directCandidateWorksheet.confirmedDecisions !== 0 || directCandidateWorksheet.realStatusOverlayPresent !== false) fail("direct-candidate worksheet must remain blank/unconfirmed before real notes");
if (sourceFitNotesAcceptance.confirmedDecisions !== 0 || sourceFitNotesAcceptance.negativeCasesPassed !== sourceFitNotesAcceptance.negativeCases) fail("sourceFitNotes acceptance must remain generated-control only and pass negative cases");
if (launchReadinessDashboard.internalTrialReady !== false || launchReadinessDashboard.launchReady !== false) fail("launch readiness must remain blocked");

const authorizationItems = [
  item("Reviewer identity", "not_machine_satisfied", "A real human reviewer must be named before write mode.", "Generated checks cannot identify a human reviewer.", "Blocks write."),
  item("Scope limit", "machine_checked", "Human reviewer must accept scope limited to rewrite_batch_01 and rewrite_batch_05.", `targetBatches:${creationChecklist.targetBatches.join(",")}.`, "Allows only blank-overlay initialization for the first reviewer scope after human decision."),
  item("Frozen packet", "machine_checked", "Reviewer must use the frozen packet as day-of-review sequence.", `freezeReady:${dayOfReviewPacketFreeze.freezeReady}; frozenSteps:${dayOfReviewPacketFreeze.frozenSteps}.`, "Prevents ad hoc write flow."),
  item("Sequence consistency", "machine_checked", "Reviewer must not skip ordered gates.", `failedChecks:${sequenceConsistency.failedChecks}.`, "Keeps first-reviewer order coherent."),
  item("Write readiness lock", "machine_checked_write_blocked", "Human decision is still required even though the lock is ready.", `lockReady:${writeReadinessLock.lockReady}; writeAllowedNow:${writeReadinessLock.writeAllowedNow}; manualDecisionRequired:${writeReadinessLock.manualDecisionRequired}.`, "Blocks generated write authorization."),
  item("Dry-run initializer", "machine_checked_preview_only", "Human must run dry-run immediately before any later write.", `mode:${initDryRun.mode}; wroteStatusOverlay:${initDryRun.wroteStatusOverlay}; notesFilled:${initDryRun.notesFilled}.`, "Previews write shape without creating real notes."),
  item("Overwrite protection", "machine_checked", "Human must stop if a real overlay appears.", `${initProtection.passedCases}/${initProtection.protectionCases} protection cases passed.`, "Protects future human notes from accidental overwrite."),
  item("Direct candidates", "not_human_confirmed", "Human must confirm, downgrade, or block each direct candidate in sourceFitNotes.", `confirmedDecisions:${directCandidateWorksheet.confirmedDecisions}; sourceFitConfirmed:${sourceFitNotesAcceptance.confirmedDecisions}.`, "Blocks source confirmation and learner-facing evidence upgrades."),
  item("Blank notes", "machine_checked_blank", "Human notes must start blank and be written from actual review work.", `blankNoteFields:${creationChecklist.blankNoteFields}; completeNoteCards:${realOverlayPreflight.completeNoteCards}.`, "Blocks treating generated scaffolding as evidence."),
  item("Generated-sample boundary", "machine_checked_boundary", "Generated prompts, examples, drills, checklists, and freeze packets cannot be copied as real notes.", "All upstream reports keep learnerFacingRelease:false and approvalStatus:not_approved.", "Blocks approval/release drift."),
  item("Green-only evidence boundary", "machine_checked_boundary", "Human must keep yellow/red/research_only outside learner-facing evidence.", "Dry-run and freeze hard stops include yellow/red/research_only isolation.", "Blocks unsafe evidence promotion."),
  item("Launch and approval boundary", "machine_checked_not_ready", "Human cannot infer approval, commercial readiness, internal trial, launch, or production readiness from this preview.", `internalTrialReady:${launchReadinessDashboard.internalTrialReady}; launchReady:${launchReadinessDashboard.launchReady}; productionReady:${launchReadinessDashboard.productionReady}.`, "Blocks release/readiness claims."),
];

const machineGateRows = authorizationItems.filter((row) => row.machineStatus.startsWith("machine_checked"));

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  authorizationPreviewReady: true,
  authorizationMode: "manual_authorization_preview_only",
  realStatusPath,
  realStatusOverlayPresent,
  writeAllowedNow: false,
  creationAllowedNow: false,
  startAllowedNow: false,
  manualDecisionRequired: true,
  humanAuthorizationRecorded: false,
  targetBatches: creationChecklist.targetBatches,
  authorizationItems,
  machineGates: machineGateRows.length,
  machineGatesSatisfied: machineGateRows.length,
  completeNoteCards: realOverlayPreflight.completeNoteCards,
  approvalReviewCandidates: realOverlayPreflight.approvalReviewCandidates,
  confirmedDecisions: sourceFitNotesAcceptance.confirmedDecisions,
  internalTrialReady: launchReadinessDashboard.internalTrialReady,
  launchReady: launchReadinessDashboard.launchReady,
  dryRunCommand: "npm.cmd run init:first-reviewer-status-overlay:dry-run",
  writeCommandPreview: "npm.cmd run init:first-reviewer-status-overlay:write",
  hardStops: [
    "Do not run write mode from generated authorization preview alone.",
    "Stop if a real human reviewer has not been identified.",
    "Stop if scope expands beyond rewrite_batch_01 and rewrite_batch_05.",
    "Stop if docs/LESSON_BATCH_REVIEW_STATUS.json already exists.",
    "Stop if generated prompts, examples, drills, checklists, or packet rows are treated as real reviewer notes.",
    "Stop if direct candidates are treated as confirmed without original human sourceFitNotes.",
    "Stop if any artifact implies approval, learner-facing release, commercial_ready promotion, internalTrialReady, launchReady, or productionReady.",
    "Stop if notes or lesson text include trading advice, signals, performance claims, broker/order workflow, automation, copied external source prose, or real-money guidance.",
    "Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.",
  ],
  sourceReports: paths,
  boundary: "This authorization preview is generated reviewer-facing operations scaffolding only. It does not authorize write mode, create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, promote grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, launch the course, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  authorizationPreviewReady: report.authorizationPreviewReady,
  authorizationMode: report.authorizationMode,
  writeAllowedNow: report.writeAllowedNow,
  manualDecisionRequired: report.manualDecisionRequired,
  humanAuthorizationRecorded: report.humanAuthorizationRecorded,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  targetBatches: report.targetBatches,
  authorizationItems: report.authorizationItems.length,
  machineGatesSatisfied: report.machineGatesSatisfied,
  machineGates: report.machineGates,
  completeNoteCards: report.completeNoteCards,
  approvalReviewCandidates: report.approvalReviewCandidates,
  confirmedDecisions: report.confirmedDecisions,
  internalTrialReady: report.internalTrialReady,
  launchReady: report.launchReady,
  outputJson,
  outputMd,
}, null, 2));
