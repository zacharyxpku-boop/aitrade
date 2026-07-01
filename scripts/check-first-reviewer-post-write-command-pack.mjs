import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.json";
const outputMd = "docs/FIRST_REVIEWER_POST_WRITE_COMMAND_PACK.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  postWritePlaybook: "docs/FIRST_REVIEWER_POST_WRITE_VALIDATION_PLAYBOOK.json",
  preflightSummary: "docs/FIRST_REVIEWER_REAL_OVERLAY_PREFLIGHT_SUMMARY.json",
  realOverlayDiffAudit: "docs/FIRST_REVIEWER_REAL_OVERLAY_DIFF_AUDIT.json",
  noteQualityLint: "docs/REVIEWER_NOTE_QUALITY_LINT.json",
  sourceFitNotesAcceptance: "docs/FIRST_REVIEWER_SOURCE_FIT_NOTES_ACCEPTANCE.json",
  evidenceIntakeSummary: "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.json",
  separateApprovalGate: "docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.json",
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

function commandStep(order, command, purpose, failRoute, stopIfFails = true) {
  return { order, command, purpose, failRoute, stopIfFails };
}

function markdown(report) {
  return [
    "# First Reviewer Post-Write Command Pack",
    "",
    "This command pack gives the first reviewer the strict validation order after a human-created real overlay exists.",
    "It is future-only in the current generated state and must not create, overwrite, approve, publish, or promote anything.",
    "",
    "## Summary",
    "",
    `- Command pack ready: ${report.commandPackReady}`,
    `- Execution allowed now: ${report.executionAllowedNow}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Post-write steps: ${report.commandRows.length}`,
    `- Failure routes: ${report.failureRoutes.length}`,
    `- Complete note cards: ${report.completeNoteCards}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Confirmed direct decisions: ${report.confirmedDecisions}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Command Order",
    "",
    "| Order | Command | Purpose | Failure route |",
    "| --- | --- | --- | --- |",
    ...report.commandRows.map((row) => `| ${row.order} | \`${row.command}\` | ${row.purpose.replaceAll("|", "/")} | ${row.failRoute.replaceAll("|", "/")} |`),
    "",
    "## Failure Routes",
    "",
    ...report.failureRoutes.map((item) => `- ${item.trigger}: ${item.response}`),
    "",
    "## Forbidden Recovery Actions",
    "",
    ...report.forbiddenRecoveryActions.map((item) => `- ${item}`),
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
  postWritePlaybook,
  preflightSummary,
  realOverlayDiffAudit,
  noteQualityLint,
  sourceFitNotesAcceptance,
  evidenceIntakeSummary,
  separateApprovalGate,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.postWritePlaybook),
  readJson(paths.preflightSummary),
  readJson(paths.realOverlayDiffAudit),
  readJson(paths.noteQualityLint),
  readJson(paths.sourceFitNotesAcceptance),
  readJson(paths.evidenceIntakeSummary),
  readJson(paths.separateApprovalGate),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  postWritePlaybook,
  preflightSummary,
  realOverlayDiffAudit,
  noteQualityLint,
  sourceFitNotesAcceptance,
  evidenceIntakeSummary,
  separateApprovalGate,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; command pack currently expects future-only state`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include post-write command pack file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-post-write-command-pack")) fail("dry-run packet must include post-write command pack command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include post-write command pack file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-post-write-command-pack")) fail("progress dashboard must include post-write command pack command");
if (!progressDashboard.statusBoard.some((item) => item.name === "Post-write command pack" && item.status === "future_command_pack_ready")) fail("progress dashboard must include post-write command pack status");
if (!humanExecutionBundle.executionSteps.some((item) => item.file === outputMd)) fail("human execution bundle must point to post-write command pack");

if (postWritePlaybook.executionAllowedNow !== false || postWritePlaybook.realStatusOverlayPresent !== false) fail("post-write playbook must remain future-only before real overlay exists");
if (preflightSummary.writeAllowedNow !== false || preflightSummary.manualDecisionRequired !== true) fail("preflight must still require a human decision before write");
if (realOverlayDiffAudit.auditExecutableNow !== false || realOverlayDiffAudit.filledNoteFields !== 0) fail("diff audit must not be executable before real overlay exists");
if (noteQualityLint.realStatusOverlayPresent !== false || noteQualityLint.realNoteIssues !== 0) fail("note quality lint must show no real note issues before overlay exists");
if (sourceFitNotesAcceptance.confirmedDecisions !== 0 || sourceFitNotesAcceptance.negativeCasesPassed !== sourceFitNotesAcceptance.negativeCases) fail("sourceFitNotes acceptance must have no confirmations and passing negative cases");
if (evidenceIntakeSummary.completeNoteCards !== 0 || evidenceIntakeSummary.readyForSeparateApprovalCandidates !== 0) fail("evidence intake must stay empty before real overlay exists");
if (separateApprovalGate.approvalReviewCandidates !== 0 || separateApprovalGate.autoApprovedLessons !== 0) fail("separate approval gate must stay empty before real overlay exists");

const commandRows = [
  commandStep(1, "npm.cmd run check:first-reviewer-real-overlay-preflight-summary", "Confirm write mode was intentionally reached through manual preflight.", "Stop if writeAllowedNow is false and no explicit human decision exists."),
  commandStep(2, "npm.cmd run check:first-reviewer-real-overlay-diff-audit", "Inspect real overlay structure, filled fields, unsafe text, and copying-risk wording.", "Fix structural or unsafe-note issues before any intake."),
  commandStep(3, "npm.cmd run check:reviewer-note-quality-lint", "Reject blank, generic, approving, readiness, trading, broker, automation, performance, or real-money notes.", "Edit real notes; keep batches blocked until lint passes."),
  commandStep(4, "npm.cmd run check:first-reviewer-source-fit-notes-acceptance", "Validate direct-candidate sourceFitNotes contain decision, source role, claim, rewrite action, and no unsafe wording.", "Downgrade, block, or rewrite sourceFitNotes before continuing."),
  commandStep(5, "npm.cmd run check:lesson-batch-completion", "Validate batch status shape and required-note completeness.", "Keep incomplete batches not_started or in_progress."),
  commandStep(6, "npm.cmd run check:first-reviewer-evidence-intake-summary", "Summarize complete notes, blockers, direct-candidate status, and separate-approval candidates.", "Treat intake as triage only, not approval."),
  commandStep(7, "npm.cmd run check:first-reviewer-separate-approval-review-gate", "Keep intake candidates behind a separate human approval review.", "Reject auto-approval, learner-facing release, commercial-ready promotion, and production claims."),
  commandStep(8, "npm.cmd run check:first-reviewer-release-readiness-negative-cases", "Prove release/readiness drift remains rejected.", "Fix drift before any broader curriculum checks."),
  commandStep(9, "npm.cmd run check:curriculum-review", "Run the full curriculum and reviewer gate chain.", "Fix the failing gate without relaxing boundaries."),
  commandStep(10, "npm.cmd run check:knowledge-base", "Recheck knowledge-base, self-audit, and green grounding boundaries.", "Do not promote generated drafts or weaken source boundaries."),
  commandStep(11, "npm.cmd run check:knowledge-browser", "Recheck learner-facing browser candidates remain review-tracked and source-grounded.", "Block release if learner-facing risk expands."),
  commandStep(12, "temporary SQLite npm.cmd run verify", "Run full repo verification with TRADEGYM_SQLITE_PATH set to a temp file and clean it afterward.", "Fix application verification failures before any next review phase."),
];

const failureRoutes = [
  { trigger: "Real overlay absent", response: "Do not run post-write pack as evidence; return to preflight and wait for explicit human write decision." },
  { trigger: "Missing or blank notes", response: "Keep the lesson blocked and fill notes only after actual human review work." },
  { trigger: "Direct candidate unresolved", response: "Use confirm, downgrade, or blocked decision in sourceFitNotes; never infer direct evidence from generated rows." },
  { trigger: "Unsafe wording", response: "Remove advice, signals, performance, broker/order, automation, production, release, approval, and real-money wording." },
  { trigger: "Copying risk", response: "Remove copied or paste-instructed source text; notes must be original human review prose." },
  { trigger: "Approval or readiness drift", response: "Reset the row to not_approved and learnerFacingRelease:false; do not promote grade or production status." },
  { trigger: "Verification failure", response: "Fix the failing gate and rerun from the failed command forward, preserving real notes." },
];

const forbiddenRecoveryActions = [
  "Do not delete, overwrite, or force-recreate real reviewer notes to make checks pass.",
  "Do not copy generated sample notes into the real overlay.",
  "Do not mark generated lessons commercial_ready.",
  "Do not set learnerFacingRelease:true, productionReady:true, or approvalStatus other than not_approved.",
  "Do not relax green/yellow/red or research_only source boundaries.",
  "Do not add buy/sell/hold advice, trading signals, performance claims, broker/order workflows, automation, or real-money guidance.",
];

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  commandPackReady: true,
  commandPackMode: "future_post_write_validation_only",
  executionAllowedNow: false,
  realStatusPath,
  realStatusOverlayPresent,
  commandRows,
  failureRoutes,
  forbiddenRecoveryActions,
  completeNoteCards: evidenceIntakeSummary.completeNoteCards,
  approvalReviewCandidates: separateApprovalGate.approvalReviewCandidates,
  confirmedDecisions: sourceFitNotesAcceptance.confirmedDecisions,
  sourceReports: paths,
  boundary: "This post-write command pack is a future validation order only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  commandPackReady: report.commandPackReady,
  executionAllowedNow: report.executionAllowedNow,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  commandRows: report.commandRows.length,
  failureRoutes: report.failureRoutes.length,
  completeNoteCards: report.completeNoteCards,
  approvalReviewCandidates: report.approvalReviewCandidates,
  confirmedDecisions: report.confirmedDecisions,
  outputJson,
  outputMd,
}, null, 2));
