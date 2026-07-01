import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_DAY_OF_REVIEW_PACKET_FREEZE.json";
const outputMd = "docs/FIRST_REVIEWER_DAY_OF_REVIEW_PACKET_FREEZE.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  operatorIndex: "docs/FIRST_REVIEWER_OPERATOR_INDEX.json",
  onePageRunbook: "docs/FIRST_REVIEWER_ONE_PAGE_RUNBOOK.json",
  prewriteSampleDossier: "docs/FIRST_REVIEWER_PREWRITE_SAMPLE_DOSSIER.json",
  sequenceConsistency: "docs/FIRST_REVIEWER_SEQUENCE_CONSISTENCY.json",
  launchReadinessDashboard: "docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.json",
};

const FORBIDDEN_ACTIONS = [
  "Do not create or overwrite docs/LESSON_BATCH_REVIEW_STATUS.json from this freeze packet.",
  "Do not treat generated prompts, examples, drills, simulators, checklists, or this freeze packet as real reviewer notes.",
  "Do not approve lessons, set learnerFacingRelease:true, set productionReady:true, or promote generated drafts to commercial_ready.",
  "Do not add buy/sell/hold advice, trading signals, performance claims, broker/order workflow, automation, copied source prose, or real-money guidance.",
  "Do not use yellow, red, or research_only sources as learner-facing evidence.",
];

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

function hasFile(list, filePath) {
  return list.some((row) => row.path === filePath || row.file === filePath || row.primaryFile === filePath);
}

function classifyStep(step) {
  const text = `${step.phase} ${step.file} ${step.humanAction} ${step.gate}`.toLowerCase();
  if (/simulator|drill|positive control|negative cases|sequence consistency/.test(text)) return "temporary_control_output_only";
  if (/worksheet|source roles|direct candidates|blank notes|safe examples|rehearsal|decision/.test(text)) return "manual_review_input_scaffold";
  if (/preflight|lock|creation|start gate/.test(text)) return "manual_decision_gate";
  if (/post-write|diff audit|intake|approval|release|launch|final gates/.test(text)) return "future_post_write_validation_gate";
  return "orientation_or_index";
}

function expectedOutputFor(step, category) {
  if (category === "manual_review_input_scaffold") return "Reviewer-facing input or checklist only; no real notes, approval, release, or grade change.";
  if (category === "temporary_control_output_only") return "Generated control output only; temporary files may be used, real overlay must remain absent.";
  if (category === "manual_decision_gate") return "Manual gate remains blocked until explicit human note-taking decision exists.";
  if (category === "future_post_write_validation_gate") return "Future validation output only unless a deliberately human-created real overlay exists.";
  return "Orientation/index output only; next reviewer file is identified.";
}

function failureRouteFor(step, category) {
  if (category === "manual_review_input_scaffold") return "Stop and rewrite the reviewer instruction if it could be mistaken for completed notes or approval.";
  if (category === "temporary_control_output_only") return "Stop if temporary control output touches the real overlay or creates readiness, release, approval, or grade promotion.";
  if (category === "manual_decision_gate") return "Stop if write/start permission appears without explicit human reviewer intent.";
  if (category === "future_post_write_validation_gate") return "Stop if the step is treated as executable evidence while the real overlay is absent.";
  return "Stop if the index points to missing files, missing commands, or unclear next actions.";
}

function buildFreezeRows(executionSteps) {
  return executionSteps.map((step) => {
    const category = classifyStep(step);
    const row = {
      order: step.order,
      phase: step.phase,
      inputFile: step.file,
      checkCommand: step.command,
      humanAction: step.humanAction,
      expectedOutput: expectedOutputFor(step, category),
      failureRoute: failureRouteFor(step, category),
      category,
      forbiddenActions: FORBIDDEN_ACTIONS,
    };
    for (const field of ["order", "phase", "inputFile", "checkCommand", "humanAction", "expectedOutput", "failureRoute", "category"]) {
      if (row[field] === undefined || row[field] === "") fail(`freeze row ${step.order} missing ${field}`);
    }
    if (!Array.isArray(row.forbiddenActions) || row.forbiddenActions.length < 5) fail(`freeze row ${step.order} missing forbidden actions`);
    return row;
  });
}

function checkContiguous(rows, label) {
  const orders = rows.map((row) => row.order);
  for (let index = 0; index < rows.length; index += 1) {
    if (orders[index] !== index + 1) fail(`${label} order ${orders[index]} must equal ${index + 1}`);
  }
}

function markdown(report) {
  return [
    "# First Reviewer Day-Of-Review Packet Freeze",
    "",
    "This freezes the first-reviewer day-of-review packet into explicit inputs, outputs, failure routes, and forbidden actions.",
    "It is an operations freeze only; it is not real notes, approval, learner-facing release, commercial readiness, internal-trial readiness, launch readiness, or production readiness.",
    "",
    "## Summary",
    "",
    `- Freeze ready: ${report.freezeReady}`,
    `- Freeze mode: ${report.freezeMode}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Frozen steps: ${report.frozenSteps}`,
    `- Missing field rows: ${report.missingFieldRows}`,
    `- Cross-links checked: ${report.crossLinksChecked}`,
    `- Failed cross-links: ${report.failedCrossLinks}`,
    `- Complete note cards: ${report.completeNoteCards}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Internal trial ready: ${report.internalTrialReady}`,
    `- Launch ready: ${report.launchReady}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Frozen Steps",
    "",
    "| Order | Phase | Input | Check | Expected output | Failure route |",
    "| ---: | --- | --- | --- | --- | --- |",
    ...report.freezeRows.map((row) => `| ${row.order} | ${row.phase} | \`${row.inputFile}\` | \`${row.checkCommand}\` | ${row.expectedOutput.replaceAll("|", "/")} | ${row.failureRoute.replaceAll("|", "/")} |`),
    "",
    "## Global Forbidden Actions",
    "",
    ...report.globalForbiddenActions.map((action) => `- ${action}`),
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
  onePageRunbook,
  prewriteSampleDossier,
  sequenceConsistency,
  launchReadinessDashboard,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.operatorIndex),
  readJson(paths.onePageRunbook),
  readJson(paths.prewriteSampleDossier),
  readJson(paths.sequenceConsistency),
  readJson(paths.launchReadinessDashboard),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  operatorIndex,
  onePageRunbook,
  prewriteSampleDossier,
  sequenceConsistency,
  launchReadinessDashboard,
})) {
  assertEnvelope(record, label);
}

if (realStatusOverlayPresent) fail(`${realStatusPath} unexpectedly exists; day-of-review freeze expects pre-write state`);
if (sequenceConsistency.failedChecks !== 0 || sequenceConsistency.sequenceGateReady !== true) fail("sequence consistency must pass before packet freeze");
if (humanExecutionBundle.realStatusOverlayPresent !== false || humanExecutionBundle.executionSteps.length < 32) fail("human execution bundle must expose the full pre-write step chain");
if (operatorIndex.writeAllowedNow !== false || operatorIndex.executionAllowedNow !== false) fail("operator index must keep write and execution blocked");
if (onePageRunbook.runbookMode !== "printable_pre_write_operator_runbook") fail("one-page runbook must remain printable pre-write mode");
if (prewriteSampleDossier.dossierMode !== "read_only_pre_write_human_handoff") fail("pre-write dossier must remain read-only");
if (launchReadinessDashboard.internalTrialReady !== false || launchReadinessDashboard.launchReady !== false) fail("launch readiness must remain false");

const crossLinkRows = [
  { name: "dry-run includes freeze file", passed: hasFile(dryRunPacket.requiredFiles, outputMd) },
  { name: "dry-run includes freeze command", passed: dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-day-of-review-packet-freeze") },
  { name: "progress dashboard includes freeze status", passed: progressDashboard.statusBoard.some((row) => row.name === "Day-of-review packet freeze" && row.status === "frozen_pre_write_packet_ready") },
  { name: "human execution bundle points to freeze", passed: hasFile(humanExecutionBundle.executionSteps, outputMd) },
  { name: "operator index points to freeze", passed: hasFile(operatorIndex.phaseRows, outputMd) },
  { name: "pre-write dossier includes freeze", passed: hasFile(prewriteSampleDossier.packetOrder, outputMd) },
];
const failedCrossLinks = crossLinkRows.filter((row) => !row.passed);
if (failedCrossLinks.length) fail(`day-of-review freeze cross-links failed: ${failedCrossLinks.map((row) => row.name).join(", ")}`);

const freezeRows = buildFreezeRows(humanExecutionBundle.executionSteps);
checkContiguous(freezeRows, "freeze rows");
const missingFieldRows = freezeRows.filter((row) => Object.values(row).some((value) => value === undefined || value === "")).length;
if (missingFieldRows) fail("freeze rows cannot have missing fields");

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  freezeReady: true,
  freezeMode: "frozen_pre_write_day_of_review_packet",
  realStatusPath,
  realStatusOverlayPresent,
  frozenSteps: freezeRows.length,
  missingFieldRows,
  crossLinksChecked: crossLinkRows.length,
  failedCrossLinks: failedCrossLinks.length,
  completeNoteCards: operatorIndex.completeNoteCards,
  approvalReviewCandidates: operatorIndex.approvalReviewCandidates,
  internalTrialReady: launchReadinessDashboard.internalTrialReady,
  launchReady: launchReadinessDashboard.launchReady,
  freezeRows,
  crossLinkRows,
  globalForbiddenActions: FORBIDDEN_ACTIONS,
  sourceReports: paths,
  boundary: "This day-of-review packet freeze is reviewer-facing operations scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, confirm source use, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, grant internal-trial readiness, launch the course, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  freezeReady: report.freezeReady,
  freezeMode: report.freezeMode,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  frozenSteps: report.frozenSteps,
  missingFieldRows: report.missingFieldRows,
  crossLinksChecked: report.crossLinksChecked,
  failedCrossLinks: report.failedCrossLinks,
  completeNoteCards: report.completeNoteCards,
  approvalReviewCandidates: report.approvalReviewCandidates,
  internalTrialReady: report.internalTrialReady,
  launchReady: report.launchReady,
  outputJson,
  outputMd,
}, null, 2));
