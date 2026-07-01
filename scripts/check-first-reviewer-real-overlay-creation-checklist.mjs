import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.json";
const outputMd = "docs/FIRST_REVIEWER_REAL_OVERLAY_CREATION_CHECKLIST.md";

const paths = {
  handoff: "docs/FIRST_REVIEWER_HANDOFF.json",
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  humanNoteStarterTemplate: "docs/FIRST_REVIEWER_HUMAN_NOTE_STARTER_TEMPLATE.json",
  initDryRun: "docs/LESSON_BATCH_REVIEW_STATUS_INIT_DRY_RUN.json",
  initProtection: "docs/LESSON_BATCH_REVIEW_STATUS_INIT_PROTECTION.json",
  gateSummary: "docs/REVIEW_STATUS_GATE_SUMMARY.json",
  statusDraft: "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json",
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
  if (record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function pass(name, evidence) {
  return { name, status: "pass", evidence };
}

function manual(name, evidence) {
  return { name, status: "manual_required", evidence };
}

function markdown(report) {
  return [
    "# First Reviewer Real Overlay Creation Checklist",
    "",
    "This checklist defines the safe conditions for creating the real reviewer status overlay.",
    "It does not create the overlay, fill reviewer notes, approve lessons, publish content, or certify production readiness.",
    "",
    "## Summary",
    "",
    `- Creation allowed now: ${report.creationAllowedNow}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Target path: ${report.realStatusPath}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Lesson cards: ${report.lessonCards}`,
    `- Blank note fields: ${report.blankNoteFields}`,
    `- Dry-run passed: ${report.dryRunPassed}`,
    `- Overwrite protection passed: ${report.overwriteProtectionPassed}`,
    `- Real ready batches: ${report.realReadyBatches}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Creation Commands",
    "",
    `- Dry run: \`${report.dryRunCommand}\``,
    `- Allowed creation command after explicit human note-taking decision: \`${report.allowedCreationCommand}\``,
    "",
    "## Preconditions",
    "",
    ...report.creationPrerequisites.map((row) => `- ${row.name}: ${row.status} - ${row.evidence}`),
    "",
    "## Pre-Creation Commands",
    "",
    ...report.preCreationCommands.map((command, index) => `${index + 1}. \`${command}\``),
    "",
    "## Post-Creation Commands",
    "",
    ...report.postCreationCommands.map((command, index) => `${index + 1}. \`${command}\``),
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
  handoff,
  dryRunPacket,
  humanNoteStarterTemplate,
  initDryRun,
  initProtection,
  gateSummary,
  statusDraft,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.handoff),
  readJson(paths.dryRunPacket),
  readJson(paths.humanNoteStarterTemplate),
  readJson(paths.initDryRun),
  readJson(paths.initProtection),
  readJson(paths.gateSummary),
  readJson(paths.statusDraft),
  exists(realStatusPath),
]);

for (const [label, report] of Object.entries({
  handoff,
  dryRunPacket,
  humanNoteStarterTemplate,
  initDryRun,
  initProtection,
  gateSummary,
  statusDraft,
})) {
  assertEnvelope(report, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} already exists; do not create or overwrite real reviewer notes in this checklist`);
if (!handoff.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-creation-checklist")) fail("handoff must include the real overlay creation checklist command");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-real-overlay-creation-checklist")) fail("dry-run packet must include the real overlay creation checklist command");
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include the real overlay creation checklist file");
if (dryRunPacket.realStatusOverlayPresent !== false || dryRunPacket.realReadyBatches !== 0) fail("dry-run packet must show no real overlay and no ready batches");
if (humanNoteStarterTemplate.realStatusOverlayPresent !== false) fail("human note starter must not depend on a real status overlay");
if (humanNoteStarterTemplate.lessonCards !== 12 || humanNoteStarterTemplate.blankNoteFields !== 72) fail("human note starter must keep 12 lesson cards and 72 blank note fields");
if (initDryRun.mode !== "dry_run" || initDryRun.wroteStatusOverlay !== false || initDryRun.notesFilled !== 0) fail("init dry run must not write status overlay or notes");
if (initDryRun.targetPath !== realStatusPath || initDryRun.lessonCards !== 12) fail("init dry run target path or lesson-card count changed");
if (initProtection.passedCases !== initProtection.protectionCases || initProtection.realStatusOverlayTouched !== false || initProtection.existingTempOverlayPreserved !== true) fail("init protection must pass without touching real overlay");
if (gateSummary.realStatusOverlayPresent !== false || gateSummary.realReadyBatches !== 0) fail("gate summary must show no real overlay and no real ready batches");
if (statusDraft.notesFilled !== 0 || statusDraft.draftLessonCards !== 12) fail("status draft must remain a 12-card blank draft");

const dryRunPassed = initDryRun.mode === "dry_run" && initDryRun.wroteStatusOverlay === false && initDryRun.notesFilled === 0;
const overwriteProtectionPassed = initProtection.passedCases === initProtection.protectionCases && initProtection.realStatusOverlayTouched === false;
const blankStarterReady = humanNoteStarterTemplate.lessonCards === 12 && humanNoteStarterTemplate.blankNoteFields === 72;

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  realStatusPath,
  realStatusOverlayPresent,
  creationAllowedNow: false,
  creationBlockedBy: [
    "No explicit human reviewer decision to begin recording real notes is present in repo evidence.",
  ],
  targetBatches: initDryRun.targetBatches,
  lessonCards: humanNoteStarterTemplate.lessonCards,
  blankNoteFields: humanNoteStarterTemplate.blankNoteFields,
  directCandidatesToConfirm: humanNoteStarterTemplate.directCandidatesToConfirm,
  realReadyBatches: gateSummary.realReadyBatches,
  dryRunPassed,
  overwriteProtectionPassed,
  dryRunCommand: "npm.cmd run init:first-reviewer-status-overlay:dry-run",
  allowedCreationCommand: "npm.cmd run init:first-reviewer-status-overlay:write",
  preCreationCommands: [
    "npm.cmd run init:first-reviewer-status-overlay:dry-run",
    "npm.cmd run check:first-reviewer-status-init-protection",
    "npm.cmd run check:first-reviewer-dry-run-packet",
    "npm.cmd run check:first-reviewer-human-note-starter-template",
    "npm.cmd run check:first-reviewer-real-overlay-creation-checklist",
  ],
  postCreationCommands: [
    "npm.cmd run check:lesson-batch-completion",
    "npm.cmd run check:reviewer-note-quality-lint",
    "npm.cmd run check:curriculum-review",
  ],
  creationPrerequisites: [
    manual("Human reviewer explicitly ready to record real notes", "No repo artifact can prove this; it must be an explicit human decision before running the write command."),
    pass("Dry run passed", "Initializer is in dry_run mode, wroteStatusOverlay:false, notesFilled:0."),
    pass("Overwrite protection passed", `${initProtection.passedCases}/${initProtection.protectionCases} protection cases passed and real overlay untouched.`),
    pass("Starter blank fields ready", `${humanNoteStarterTemplate.lessonCards} lesson cards and ${humanNoteStarterTemplate.blankNoteFields} blank note fields are present.`),
    pass("Existing real overlay absent", `${realStatusPath} does not exist.`),
    pass("Handoff packet available", `Handoff and dry-run packet both include this checklist before real overlay creation; packet covers ${dryRunPacket.targetBatches.join(", ")} with ${dryRunPacket.worksheetLessons} worksheet lessons.`),
    pass("No approval, release, or production flags", "All checked artifacts keep approvalStatus:not_approved, learnerFacingRelease:false, and productionReady:false."),
  ],
  stopConditions: [
    `Stop if ${realStatusPath} exists before the creation command; preserve existing notes before any force path.`,
    "Stop if any note field is prefilled before real review work starts.",
    "Stop if any artifact asks to approve, publish, mark commercial_ready, or set productionReady:true.",
    "Stop if any note or rewrite requests buy/sell/hold advice, trading signals, broker/order workflow, automation, performance claims, or real-money guidance.",
    "Stop if any external source body text is proposed for copying into lesson prose or notes.",
    "Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.",
  ],
  sourceReports: paths,
  boundary: "This checklist is reviewer-facing gate scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  creationAllowedNow: report.creationAllowedNow,
  targetBatches: report.targetBatches,
  lessonCards: report.lessonCards,
  blankNoteFields: report.blankNoteFields,
  dryRunPassed: report.dryRunPassed,
  overwriteProtectionPassed: report.overwriteProtectionPassed,
  outputJson,
  outputMd,
}, null, 2));
