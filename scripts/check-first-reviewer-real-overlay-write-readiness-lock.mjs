import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.json";
const outputMd = "docs/FIRST_REVIEWER_REAL_OVERLAY_WRITE_READINESS_LOCK.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  humanStartChecklist: "docs/FIRST_REVIEWER_HUMAN_REVIEW_START_CHECKLIST.json",
  creationChecklist: "docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.json",
  realOverlayPreflight: "docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.json",
  initDryRun: "docs/LESSON_BATCH_REVIEW_STATUS_INIT_DRY_RUN.json",
  initProtection: "docs/LESSON_BATCH_REVIEW_STATUS_INIT_PROTECTION.json",
  runbookNegativeCases: "docs/FIRST_REVIEWER_RUNBOOK_NEGATIVE_CASES.json",
  filledNotesPositiveControlV2: "docs/FIRST_REVIEWER_FILLED_NOTES_POSITIVE_CONTROL_V2.json",
  postWriteApprovalDrill: "docs/FIRST_REVIEWER_POST_WRITE_APPROVAL_DRILL.json",
  directCandidatePostWriteDrill: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_POST_WRITE_DRILL.json",
  sourceFitNotesAcceptance: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.json",
  launchReadinessDashboard: "docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.json",
  statusDraft: "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json",
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

function gate(name, status, evidence, writeImpact) {
  return { name, status, evidence, writeImpact };
}

function markdown(report) {
  return [
    "# First Reviewer Real Overlay Write Readiness Lock",
    "",
    "This lock is the generated write-readiness gate before any real reviewer status overlay is created.",
    "It summarizes preflight, creation, temporary drills, and release blockers while keeping write permission blocked until an explicit human note-taking decision exists.",
    "",
    "## Summary",
    "",
    `- Lock ready: ${report.lockReady}`,
    `- Lock mode: ${report.lockMode}`,
    `- Write allowed now: ${report.writeAllowedNow}`,
    `- Manual decision required: ${report.manualDecisionRequired}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Creation allowed now: ${report.creationAllowedNow}`,
    `- Start allowed now: ${report.startAllowedNow}`,
    `- Temporary drills passed: ${report.temporaryDrillsPassed}/${report.temporaryDrills}`,
    `- Direct candidates covered: ${report.directCandidatesCovered}`,
    `- Blank note fields: ${report.blankNoteFields}`,
    `- Complete note cards: ${report.completeNoteCards}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Internal trial ready: ${report.internalTrialReady}`,
    `- Launch ready: ${report.launchReady}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Gate Rows",
    "",
    "| Gate | Status | Evidence | Write impact |",
    "| --- | --- | --- | --- |",
    ...report.gateRows.map((row) => `| ${row.name} | ${row.status} | ${row.evidence.replaceAll("|", "/")} | ${row.writeImpact.replaceAll("|", "/")} |`),
    "",
    "## Allowed Path After Human Decision",
    "",
    ...report.allowedPathAfterHumanDecision.map((item, index) => `${index + 1}. ${item}`),
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

const [
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  humanStartChecklist,
  creationChecklist,
  realOverlayPreflight,
  initDryRun,
  initProtection,
  runbookNegativeCases,
  filledNotesPositiveControlV2,
  postWriteApprovalDrill,
  directCandidatePostWriteDrill,
  sourceFitNotesAcceptance,
  launchReadinessDashboard,
  statusDraft,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.humanStartChecklist),
  readJson(paths.creationChecklist),
  readJson(paths.realOverlayPreflight),
  readJson(paths.initDryRun),
  readJson(paths.initProtection),
  readJson(paths.runbookNegativeCases),
  readJson(paths.filledNotesPositiveControlV2),
  readJson(paths.postWriteApprovalDrill),
  readJson(paths.directCandidatePostWriteDrill),
  readJson(paths.sourceFitNotesAcceptance),
  readJson(paths.launchReadinessDashboard),
  readJson(paths.statusDraft),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  humanStartChecklist,
  creationChecklist,
  realOverlayPreflight,
  initDryRun,
  initProtection,
  runbookNegativeCases,
  filledNotesPositiveControlV2,
  postWriteApprovalDrill,
  directCandidatePostWriteDrill,
  sourceFitNotesAcceptance,
  launchReadinessDashboard,
  statusDraft,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; write readiness lock expects pre-write state`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include write readiness lock file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-write-readiness-lock")) fail("dry-run packet must include write readiness lock command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Real overlay write readiness lock" && row.status === "write_locked_manual_decision_required")) fail("progress dashboard must include write readiness lock status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to write readiness lock");

if (humanStartChecklist.startAllowedNow !== false) fail("human start checklist must keep startAllowedNow false");
if (creationChecklist.creationAllowedNow !== false || creationChecklist.realStatusOverlayPresent !== false) fail("creation checklist must keep creation blocked and overlay absent");
if (realOverlayPreflight.writeAllowedNow !== false || realOverlayPreflight.manualDecisionRequired !== true) fail("preflight must keep write blocked and manual decision required");
if (initDryRun.mode !== "dry_run" || initDryRun.wroteStatusOverlay !== false || initDryRun.notesFilled !== 0) fail("initializer dry run must not write or fill notes");
if (initProtection.passedCases !== initProtection.protectionCases || initProtection.realStatusOverlayTouched !== false) fail("initializer protection must pass without touching real overlay");
if (runbookNegativeCases.failedCases !== 0) fail("runbook negative cases must pass before write readiness lock");
if (filledNotesPositiveControlV2.positiveControlReady !== true || filledNotesPositiveControlV2.realStatusOverlayTouched !== false) fail("filled-notes positive control must pass without touching real overlay");
if (postWriteApprovalDrill.drillReady !== true || postWriteApprovalDrill.realStatusOverlayTouched !== false) fail("post-write approval drill must pass without touching real overlay");
if (directCandidatePostWriteDrill.drillReady !== true || directCandidatePostWriteDrill.realStatusOverlayTouched !== false) fail("direct-candidate drill must pass without touching real overlay");
if (sourceFitNotesAcceptance.confirmedDecisions !== 0 || sourceFitNotesAcceptance.negativeCasesPassed !== sourceFitNotesAcceptance.negativeCases) fail("sourceFitNotes acceptance must remain generated-control only and pass negative cases");
if (launchReadinessDashboard.internalTrialReady !== false || launchReadinessDashboard.launchReady !== false) fail("launch dashboard must keep readiness false");
if (statusDraft.notesFilled !== 0 || statusDraft.draftLessonCards !== 12) fail("status draft must remain blank 12-card template");

const temporaryDrillRows = [
  filledNotesPositiveControlV2.positiveControlReady && filledNotesPositiveControlV2.realStatusOverlayTouched === false,
  postWriteApprovalDrill.drillReady && postWriteApprovalDrill.realStatusOverlayTouched === false,
  directCandidatePostWriteDrill.drillReady && directCandidatePostWriteDrill.realStatusOverlayTouched === false,
];

const gateRows = [
  gate("Human start decision", "locked_manual_required", `startAllowedNow:${humanStartChecklist.startAllowedNow}; manual checklist items:${humanStartChecklist.manualChecklistItems.length}.`, "Blocks write until explicit human reviewer decision exists."),
  gate("Creation checklist", "blocked_pre_write", `creationAllowedNow:${creationChecklist.creationAllowedNow}; dryRunPassed:${creationChecklist.dryRunPassed}; overwriteProtectionPassed:${creationChecklist.overwriteProtectionPassed}.`, "Machine checks pass, but write permission remains false."),
  gate("Real overlay preflight", "write_blocked", `writeAllowedNow:${realOverlayPreflight.writeAllowedNow}; manualDecisionRequired:${realOverlayPreflight.manualDecisionRequired}.`, "Confirms generated state cannot create real notes."),
  gate("Initializer dry run", "safe_preview_only", `mode:${initDryRun.mode}; wroteStatusOverlay:${initDryRun.wroteStatusOverlay}; notesFilled:${initDryRun.notesFilled}.`, "Preview only; no real overlay created."),
  gate("Overwrite protection", "passing", `${initProtection.passedCases}/${initProtection.protectionCases} cases passed; realStatusOverlayTouched:${initProtection.realStatusOverlayTouched}.`, "Protects existing notes from accidental overwrite."),
  gate("Temporary evidence chain drills", "passing_not_evidence", `${temporaryDrillRows.filter(Boolean).length}/${temporaryDrillRows.length} temporary drills passed.`, "Drills validate gates but do not become real reviewer evidence."),
  gate("Direct candidate sourceFitNotes", "boundary_drill_only", `${directCandidatePostWriteDrill.directCandidateRows} rows; ${directCandidatePostWriteDrill.greenRefsInspected} green refs; ${directCandidatePostWriteDrill.negativeCasesPassed}/${directCandidatePostWriteDrill.negativeCases} negative cases passed.`, "Candidate rows still require real human sourceFitNotes before source confirmation."),
  gate("Launch readiness", "not_ready", `internalTrialReady:${launchReadinessDashboard.internalTrialReady}; launchReady:${launchReadinessDashboard.launchReady}; productionReady:${launchReadinessDashboard.productionReady}.`, "Prevents trial, launch, or production claims from generated review scaffolding."),
];

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  lockReady: true,
  lockMode: "generated_pre_write_lock_manual_decision_required",
  realStatusPath,
  realStatusOverlayPresent,
  writeAllowedNow: false,
  manualDecisionRequired: true,
  creationAllowedNow: creationChecklist.creationAllowedNow,
  startAllowedNow: humanStartChecklist.startAllowedNow,
  temporaryDrills: temporaryDrillRows.length,
  temporaryDrillsPassed: temporaryDrillRows.filter(Boolean).length,
  directCandidatesCovered: directCandidatePostWriteDrill.directCandidateRows,
  greenRefsInspected: directCandidatePostWriteDrill.greenRefsInspected,
  blankNoteFields: creationChecklist.blankNoteFields,
  completeNoteCards: realOverlayPreflight.completeNoteCards,
  approvalReviewCandidates: realOverlayPreflight.approvalReviewCandidates,
  internalTrialReady: launchReadinessDashboard.internalTrialReady,
  launchReady: launchReadinessDashboard.launchReady,
  gateRows,
  allowedPathAfterHumanDecision: [
    "Run `npm.cmd run init:first-reviewer-status-overlay:dry-run` immediately before write mode.",
    "Run `npm.cmd run check:first-reviewer-status-init-protection` and confirm no real overlay exists.",
    "A human reviewer explicitly decides to begin real note-taking for the first reviewer scope.",
    "Run `npm.cmd run init:first-reviewer-status-overlay:write` only after that human decision.",
    "After write mode, run diff audit, note quality lint, sourceFitNotes acceptance, completion audit, evidence intake, separate approval gate, curriculum review, knowledge checks, browser checks, and temporary-SQLite verify.",
  ],
  hardStops: [
    "Stop if the real overlay already exists before write mode.",
    "Stop if no human reviewer has explicitly chosen to start note-taking.",
    "Stop if any generated drill, runbook, prompt, example, or checklist is treated as real reviewer evidence.",
    "Stop if direct candidates are treated as confirmed without original human sourceFitNotes.",
    "Stop if any artifact adds approval, learner-facing release, commercial_ready promotion, internalTrialReady, launchReady, or productionReady.",
    "Stop if notes or lesson text include trading advice, signals, performance claims, broker/order workflow, automation, real-money guidance, or copied external source body text.",
  ],
  sourceReports: paths,
  boundary: "This write readiness lock is generated pre-write operations scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, launch the course, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  lockReady: report.lockReady,
  lockMode: report.lockMode,
  writeAllowedNow: report.writeAllowedNow,
  manualDecisionRequired: report.manualDecisionRequired,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  creationAllowedNow: report.creationAllowedNow,
  startAllowedNow: report.startAllowedNow,
  temporaryDrillsPassed: report.temporaryDrillsPassed,
  temporaryDrills: report.temporaryDrills,
  directCandidatesCovered: report.directCandidatesCovered,
  internalTrialReady: report.internalTrialReady,
  launchReady: report.launchReady,
  outputJson,
  outputMd,
}, null, 2));
