import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";

const paths = {
  completionAudit: "docs/LESSON_BATCH_COMPLETION_AUDIT.json",
  negativeCases: "docs/LESSON_BATCH_STATUS_NEGATIVE_CASES.json",
  dryRun: "docs/LESSON_BATCH_REVIEW_STATUS_INIT_DRY_RUN.json",
  initProtection: "docs/LESSON_BATCH_REVIEW_STATUS_INIT_PROTECTION.json",
  completedNotesExample: "docs/LESSON_BATCH_COMPLETED_NOTES_EXAMPLE.json",
  firstReviewerHandoff: "docs/FIRST_REVIEWER_HANDOFF.json",
};

const outputJson = "docs/REVIEW_STATUS_GATE_SUMMARY.json";
const outputMd = "docs/REVIEW_STATUS_GATE_SUMMARY.md";

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
  if (record.learnerFacingRelease !== false) fail(`${label} cannot set learnerFacingRelease true`);
  if (record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function assertBoundaryText(record, label) {
  const boundary = String(record.boundary || "");
  const normalized = boundary.toLowerCase();
  if (!normalized.includes("approve")) fail(`${label} boundary must mention approval boundary`);
  if (!normalized.includes("learner-facing") && !normalized.includes("publish")) fail(`${label} boundary must mention learner-facing or publish boundary`);
  if (!normalized.includes("commercial readiness") && !normalized.includes("promote")) fail(`${label} boundary must mention commercial readiness or promotion boundary`);
}

function gateRow({ name, status, evidence, blocks, allows, sourceReport }) {
  return {
    name,
    status,
    evidence,
    blocks,
    allows,
    sourceReport,
  };
}

function renderMarkdown(report) {
  return [
    "# Review Status Gate Summary",
    "",
    "This report summarizes the reviewer-status gates around lesson batch review.",
    "It is a reviewer-facing safety matrix, not completed human review, learner-facing release, production readiness, or trading guidance.",
    "",
    "## Summary",
    "",
    `- Gate rows: ${report.gateRows.length}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Real ready batches: ${report.realReadyBatches}`,
    `- Negative cases passing: ${report.negativeCasesPassed}/${report.negativeCases}`,
    `- Dry-run wrote status overlay: ${report.dryRunWroteStatusOverlay}`,
    `- Init protection passed: ${report.initProtectionPassed}/${report.initProtectionCases}`,
    `- Positive-control ready batches: ${report.positiveControlReadyBatches}`,
    `- Positive-control real overlay touched: ${report.positiveControlRealOverlayTouched}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Gate Matrix",
    "",
    "| Gate | Status | Evidence | Blocks | Allows |",
    "| --- | --- | --- | --- | --- |",
    ...report.gateRows.map((row) => [
      row.name,
      row.status,
      row.evidence,
      row.blocks,
      row.allows,
    ].map((cell) => String(cell).replaceAll("|", "/")).join(" | ")).map((line) => `| ${line} |`),
    "",
    "## Required Reports",
    "",
    ...Object.entries(report.requiredReports).map(([key, path]) => `- ${key}: \`${path}\``),
    "",
    "## Boundary",
    "",
    report.boundary,
    "",
  ].join("\n");
}

const [
  completionAudit,
  negativeCases,
  dryRun,
  initProtection,
  completedNotesExample,
  firstReviewerHandoff,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.completionAudit),
  readJson(paths.negativeCases),
  readJson(paths.dryRun),
  readJson(paths.initProtection),
  readJson(paths.completedNotesExample),
  readJson(paths.firstReviewerHandoff),
  exists(realStatusPath),
]);

for (const [label, report] of Object.entries({
  completionAudit,
  negativeCases,
  dryRun,
  initProtection,
  completedNotesExample,
  firstReviewerHandoff,
})) {
  assertEnvelope(report, label);
  assertBoundaryText(report, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; this summary expects no real human-review status overlay yet`);
if (completionAudit.statusOverlayPresent !== false) fail("completion audit must show no real status overlay yet");
if (completionAudit.readyBatches !== 0) fail("real completion audit must not have ready batches yet");
if (completionAudit.missingRequiredNotes !== 0) fail("real completion audit should have zero missing notes when no real ready batches exist");
if (negativeCases.failedCases !== 0 || negativeCases.passedCases !== negativeCases.negativeCases) fail("all negative status cases must pass");
if (dryRun.mode !== "dry_run" || dryRun.wroteStatusOverlay !== false || dryRun.notesFilled !== 0) fail("dry-run initializer must not write or fill notes");
if (initProtection.passedCases !== initProtection.protectionCases || initProtection.realStatusOverlayTouched !== false) fail("init protection must pass without touching real overlay");
if (completedNotesExample.readyBatches !== 1 || completedNotesExample.missingRequiredNotes !== 0) fail("positive-control completed-notes example must produce one temp ready batch");
if (completedNotesExample.realStatusOverlayTouched !== false) fail("positive-control example must not touch real status overlay");
if (firstReviewerHandoff.statusOverlayPresent !== false) fail("handoff must still show no real status overlay");

const gateRows = [
  gateRow({
    name: "real_status_overlay_absent",
    status: "passing",
    evidence: `${realStatusPath} does not exist; completion audit statusOverlayPresent:false`,
    blocks: "accidental claims of real human review, approval, or release",
    allows: "blank-template and worksheet preparation only",
    sourceReport: paths.completionAudit,
  }),
  gateRow({
    name: "dry_run_initializer",
    status: "passing",
    evidence: `mode:${dryRun.mode}; wroteStatusOverlay:${dryRun.wroteStatusOverlay}; notesFilled:${dryRun.notesFilled}`,
    blocks: "creating reviewer-status files during preview",
    allows: "safe preview of the first reviewer status overlay",
    sourceReport: paths.dryRun,
  }),
  gateRow({
    name: "overwrite_protection",
    status: "passing",
    evidence: `${initProtection.passedCases}/${initProtection.protectionCases} protection cases passed`,
    blocks: "overwriting existing reviewer notes without an explicit separate force path",
    allows: "temporary protection checks that leave the real overlay untouched",
    sourceReport: paths.initProtection,
  }),
  gateRow({
    name: "negative_status_cases",
    status: "passing",
    evidence: `${negativeCases.passedCases}/${negativeCases.negativeCases} unsafe or incomplete cases rejected`,
    blocks: "approval claims, release flags, production readiness, grade overrides, sample overlays, unknown rows, and missing notes",
    allows: "only structurally valid, boundary-preserving reviewer tracking",
    sourceReport: paths.negativeCases,
  }),
  gateRow({
    name: "positive_completed_notes_control",
    status: "passing_temp_only",
    evidence: `temporary readyBatches:${completedNotesExample.readyBatches}; realStatusOverlayTouched:${completedNotesExample.realStatusOverlayTouched}`,
    blocks: "treating examples as real reviewer evidence",
    allows: "proving the completion audit can pass when real required notes eventually exist",
    sourceReport: paths.completedNotesExample,
  }),
  gateRow({
    name: "first_reviewer_handoff_alignment",
    status: "passing",
    evidence: `${firstReviewerHandoff.worksheetLessons} worksheet lessons; ${firstReviewerHandoff.highRiskLessons} high-risk lessons; statusOverlayPresent:${firstReviewerHandoff.statusOverlayPresent}`,
    blocks: "starting with broad unsorted review work or unsafe status words",
    allows: "bounded review of rewrite_batch_01 and rewrite_batch_05",
    sourceReport: paths.firstReviewerHandoff,
  }),
];

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  realStatusPath,
  realStatusOverlayPresent,
  realReadyBatches: completionAudit.readyBatches,
  negativeCases: negativeCases.negativeCases,
  negativeCasesPassed: negativeCases.passedCases,
  dryRunWroteStatusOverlay: dryRun.wroteStatusOverlay,
  initProtectionCases: initProtection.protectionCases,
  initProtectionPassed: initProtection.passedCases,
  positiveControlReadyBatches: completedNotesExample.readyBatches,
  positiveControlRealOverlayTouched: completedNotesExample.realStatusOverlayTouched,
  gateRows,
  requiredReports: paths,
  boundary: "This summary is a reviewer-status gate matrix only. It does not approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, or guide real-money decisions.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, renderMarkdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  realReadyBatches: report.realReadyBatches,
  negativeCasesPassed: report.negativeCasesPassed,
  negativeCases: report.negativeCases,
  gateRows: report.gateRows.length,
  outputJson,
  outputMd,
}, null, 2));
