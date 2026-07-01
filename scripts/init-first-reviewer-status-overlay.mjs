import fs from "node:fs/promises";

const draftPath = process.env.TRADEGYM_STATUS_INIT_DRAFT_PATH || "docs/LESSON_BATCH_REVIEW_STATUS_DRAFT_TEMPLATE_FOR_BATCH_01_05.json";
const handoffPath = process.env.TRADEGYM_STATUS_INIT_HANDOFF_PATH || "docs/FIRST_REVIEWER_HANDOFF.json";
const statusPath = process.env.TRADEGYM_STATUS_OVERLAY_PATH || "docs/LESSON_BATCH_REVIEW_STATUS.json";
const dryRunJson = process.env.TRADEGYM_STATUS_INIT_DRY_RUN_JSON || "docs/LESSON_BATCH_REVIEW_STATUS_INIT_DRY_RUN.json";
const dryRunMd = process.env.TRADEGYM_STATUS_INIT_DRY_RUN_MD || "docs/LESSON_BATCH_REVIEW_STATUS_INIT_DRY_RUN.md";
const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const writeMode = process.argv.includes("--write");
const forceMode = process.argv.includes("--force");
const REQUIRED_NOTE_FIELDS = [
  "originalRewriteNotes",
  "sourceFitNotes",
  "factCheckNotes",
  "boundaryCheckNotes",
  "copyingRiskNotes",
  "humanReviewerInitials",
];

function fail(message) {
  throw new Error(message);
}

async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

async function exists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

function assertEnvelope(report, label) {
  if (report.educationOnly !== true) fail(`${label} must keep educationOnly true`);
  if (report.productionReady !== false) fail(`${label} must keep productionReady false`);
  if (report.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (report.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (report.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function renderMarkdown(report) {
  return [
    "# Lesson Batch Review Status Init Dry Run",
    "",
    "This report explains the safe initialization path for the real reviewer status overlay.",
    "Default mode does not create docs/LESSON_BATCH_REVIEW_STATUS.json.",
    "",
    "## Summary",
    "",
    `- Mode: ${report.mode}`,
    `- Wrote status overlay: ${report.wroteStatusOverlay}`,
    `- Existing status overlay before run: ${report.statusOverlayExistedBeforeRun}`,
    `- Target path: ${report.targetPath}`,
    `- Target batches: ${report.targetBatches.join(", ")}`,
    `- Lesson cards: ${report.lessonCards}`,
    `- Notes filled: ${report.notesFilled}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Commands",
    "",
    `- Dry run: \`${report.commands.dryRun}\``,
    `- Write empty overlay: \`${report.commands.write}\``,
    `- Validate after writing: \`${report.commands.validate}\``,
    "",
    "## Safety Rules",
    "",
    ...report.safetyRules.map((rule) => `- ${rule}`),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const draft = await readJson(draftPath);
const handoff = await readJson(handoffPath);
assertEnvelope(draft, "first reviewer status draft");
assertEnvelope(handoff, "first reviewer handoff");

const statusExisted = await exists(statusPath);
const rows = draft.batches.flatMap((batch) => batch.lessonCards.map((card) => ({ batch, card })));
let notesFilled = 0;
for (const { batch, card } of rows) {
  assertEnvelope(batch, `draft batch ${batch.batchId}`);
  if (batch.reviewStatus !== "not_started") fail(`${batch.batchId} must start not_started`);
  if (card.trackingStatus !== "not_started") fail(`${card.lessonId} must start not_started`);
  if (card.mustRemainStructuralDraft !== true) fail(`${card.lessonId} must remain structural draft`);
  for (const field of REQUIRED_NOTE_FIELDS) {
    if (card[field] !== "") fail(`${card.lessonId}.${field} must be blank before initialization`);
    if (card[field]) notesFilled += 1;
  }
}

if (statusExisted && writeMode && !forceMode) {
  fail(`${statusPath} already exists; rerun with --write --force only after manually preserving current reviewer notes`);
}

if (writeMode) {
  await fs.writeFile(statusPath, `${JSON.stringify({
    ...draft,
    initializedFrom: draftPath,
    initializedBy: "scripts/init-first-reviewer-status-overlay.mjs --write",
    initializedAt: new Date().toISOString(),
  }, null, 2)}\n`, "utf8");
}

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  mode: writeMode ? "write" : "dry_run",
  wroteStatusOverlay: writeMode,
  statusOverlayExistedBeforeRun: statusExisted,
  targetPath: statusPath,
  targetBatches: draft.targetBatches,
  lessonCards: rows.length,
  notesFilled,
  sourceDraft: draftPath,
  sourceHandoff: handoffPath,
  commands: {
    dryRun: "npm.cmd run init:first-reviewer-status-overlay:dry-run",
    write: "npm.cmd run init:first-reviewer-status-overlay:write",
    validate: "npm.cmd run check:lesson-batch-completion",
  },
  safetyRules: [
    "Default dry-run mode must not create docs/LESSON_BATCH_REVIEW_STATUS.json.",
    "Use --write only when a human reviewer is ready to record real notes.",
    "Do not overwrite an existing status overlay without separately preserving human notes.",
    "Keep all notes blank until review work has actually been performed.",
    "Keep approvalStatus:not_approved and learnerFacingRelease:false.",
  ],
  boundary: "This initializer only creates or previews a blank reviewer-status overlay. It does not approve lessons, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(dryRunJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(dryRunMd, renderMarkdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  mode: report.mode,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  wroteStatusOverlay: report.wroteStatusOverlay,
  statusOverlayExistedBeforeRun: report.statusOverlayExistedBeforeRun,
  targetBatches: report.targetBatches,
  lessonCards: report.lessonCards,
  notesFilled: report.notesFilled,
  dryRunJson,
  dryRunMd,
}, null, 2));
