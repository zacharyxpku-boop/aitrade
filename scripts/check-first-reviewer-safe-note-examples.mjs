import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_SAFE_NOTE_EXAMPLES.json";
const outputMd = "docs/FIRST_REVIEWER_SAFE_NOTE_EXAMPLES.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  noteReadinessMatrix: "docs/FIRST_REVIEWER_NOTE_READINESS_MATRIX.json",
  directCandidateChecklist: "docs/FIRST_REVIEWER_DIRECT_CANDIDATE_CONFIRMATION_CHECKLIST.json",
  noteQualityLint: "docs/REVIEWER_NOTE_QUALITY_LINT.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
};

const UNSAFE_PATTERN = /buy now|sell now|hold position|entry signal|exit signal|win rate|guaranteed profit|backtest profit|broker order|auto-trading ready|real-money ready|production ready|learner-facing ready|approved final|commercial ready/i;
const FIELD_ANCHORS = {
  sourceFitNotes: /direct|boundary|metadata|unsuitable|macro|source|downgrade|confirm/i,
  boundaryCheckNotes: /education-only|non-production|no advice|no signal|no performance|no broker|no automation|no real-money|boundary/i,
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

function validateSafeExample(example) {
  if (!FIELD_ANCHORS[example.field]) fail(`${example.id} has unsupported field ${example.field}`);
  if (example.text.length < 64) fail(`${example.id} is too short to model a useful note`);
  if (!FIELD_ANCHORS[example.field].test(example.text)) fail(`${example.id} lacks required field anchor`);
  if (UNSAFE_PATTERN.test(example.text)) fail(`${example.id} contains unsafe wording`);
  if (/approved|publish|learner-facing|commercial|production-ready|real-money ready/i.test(example.text)) {
    fail(`${example.id} contains approval/release/readiness wording`);
  }
}

function markdown(report) {
  return [
    "# First Reviewer Safe Note Examples",
    "",
    "This sample-only table shows the shape of acceptable reviewer notes and the categories of notes that must be rejected.",
    "It does not fill real reviewer notes, approve lessons, publish content, or create a status overlay.",
    "",
    "## Summary",
    "",
    `- Safe examples: ${report.safeExamples.length}`,
    `- Rejected example categories: ${report.rejectedExampleCategories.length}`,
    `- Covered fields: ${report.coveredFields.join(", ")}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Safe Examples",
    "",
    ...report.safeExamples.flatMap((example) => [
      `- ${example.id} / \`${example.field}\``,
      `  - Use when: ${example.useWhen}`,
      `  - Sample note: ${example.text}`,
    ]),
    "",
    "## Rejected Example Categories",
    "",
    ...report.rejectedExampleCategories.map((example) => `- ${example.category}: ${example.rejectedBecause}`),
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
  dryRunPacket,
  noteReadinessMatrix,
  directCandidateChecklist,
  noteQualityLint,
  progressDashboard,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.noteReadinessMatrix),
  readJson(paths.directCandidateChecklist),
  readJson(paths.noteQualityLint),
  readJson(paths.progressDashboard),
  exists(realStatusPath),
]);

for (const [label, report] of Object.entries({
  dryRunPacket,
  noteReadinessMatrix,
  directCandidateChecklist,
  noteQualityLint,
  progressDashboard,
})) {
  assertEnvelope(report, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; examples must not depend on real notes`);
if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include safe note examples file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-safe-note-examples")) fail("dry-run packet must include safe note examples command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include safe note examples file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-safe-note-examples")) fail("progress dashboard must include safe note examples command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Safe note examples" && row.status === "sample_only_guidance")) fail("progress dashboard must include sample-only safe note examples status");
if (noteReadinessMatrix.prefilledNoteFields !== 0 || noteReadinessMatrix.matrixRows !== 72) fail("note readiness matrix must stay blank with 72 rows");
if (directCandidateChecklist.directCandidates !== 5 || directCandidateChecklist.nonGreenRefs !== 0) fail("direct-candidate checklist must keep 5 green-only candidates");
if (noteQualityLint.realStatusOverlayPresent !== false || noteQualityLint.realNoteIssues !== 0) fail("note quality lint must show no real notes");
if (progressDashboard.realReadyBatches !== 0 || progressDashboard.realNoteIssues !== 0) fail("progress dashboard must show no real ready batches or notes");

const safeExamples = [
  {
    id: "safe_source_fit_direct_candidate_downgrade",
    field: "sourceFitNotes",
    useWhen: "A green official source is relevant to source literacy or risk context but does not directly prove the lesson's chart concept.",
    text: "Source fit: classify this source as boundary-only metadata for education context; do not treat it as direct chart evidence, and keep any unsupported claim marked for removal.",
  },
  {
    id: "safe_source_fit_confirmed_context",
    field: "sourceFitNotes",
    useWhen: "A reviewer confirms the source supports data, filing, fraud, or source-boundary literacy without becoming trading evidence.",
    text: "Source fit: confirm this source only for official source-boundary context; it may support metadata literacy, while unsuitable chart or signal claims remain excluded.",
  },
  {
    id: "safe_boundary_check",
    field: "boundaryCheckNotes",
    useWhen: "A reviewer finishes safety-boundary review for a lesson card.",
    text: "Education-only boundary checked: non-production, no advice, no signal, no performance claim, no broker workflow, no automation, and no real-money guidance.",
  },
  {
    id: "safe_boundary_check_after_rewrite",
    field: "boundaryCheckNotes",
    useWhen: "A reviewer checks rewritten prose before any separate approval review.",
    text: "Boundary after rewrite: keep the lesson as observation practice only; no advice, no signal, no performance wording, no broker/order flow, and no real-money instruction.",
  },
];

for (const example of safeExamples) {
  validateSafeExample(example);
}

const rejectedExampleCategories = [
  {
    category: "approval_or_release_claim",
    rejectedBecause: "Any note claiming final approval, learner-facing release, commercial readiness, or production readiness is not a reviewer note.",
  },
  {
    category: "trading_action_or_signal",
    rejectedBecause: "Any note that names tactical actions, signals, entries, exits, or position instructions violates the education-only boundary.",
  },
  {
    category: "performance_or_real_money_claim",
    rejectedBecause: "Any note implying returns, win rates, backtest profit, or real-money readiness is rejected.",
  },
  {
    category: "copied_source_body",
    rejectedBecause: "Any note that copies external source body text instead of summarizing reviewer decisions is rejected.",
  },
  {
    category: "generic_placeholder",
    rejectedBecause: "One-word notes, placeholders, or generated-example initials do not prove real human review work.",
  },
];

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  sampleOnly: true,
  realStatusPath,
  realStatusOverlayPresent,
  coveredFields: [...new Set(safeExamples.map((example) => example.field))],
  safeExamples,
  rejectedExampleCategories,
  sourceReports: paths,
  stopConditions: [
    "Stop if a sample note is copied into the real status overlay without actual human review.",
    "Stop if any example is treated as approval, learner-facing release, commercial readiness, or production readiness.",
    "Stop if any note contains tactical trading actions, signals, broker/order workflow, automation, performance claims, or real-money guidance.",
    "Stop if any note copies external source body text.",
    "Stop if yellow, red, or research_only sources are proposed as learner-facing evidence.",
  ],
  boundary: "This table is sample-only reviewer guidance. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change lesson grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  sampleOnly: report.sampleOnly,
  safeExamples: report.safeExamples.length,
  rejectedExampleCategories: report.rejectedExampleCategories.length,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  outputJson,
  outputMd,
}, null, 2));
