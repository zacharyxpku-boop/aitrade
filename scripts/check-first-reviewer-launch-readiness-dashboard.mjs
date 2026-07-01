import fs from "node:fs/promises";

const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const realStatusPath = "docs/LESSON_BATCH_REVIEW_STATUS.json";
const outputJson = "docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.json";
const outputMd = "docs/FIRST_REVIEWER_LAUNCH_READINESS_DASHBOARD.md";

const paths = {
  dryRunPacket: "docs/FIRST_REVIEWER_DRY_RUN_PACKET.json",
  progressDashboard: "docs/FIRST_REVIEWER_PROGRESS_DASHBOARD.json",
  humanExecutionBundle: "docs/FIRST_REVIEWER_HUMAN_EXECUTION_BUNDLE.json",
  evidenceIntakeSummary: "docs/FIRST_REVIEWER_EVIDENCE_INTAKE_SUMMARY.json",
  separateApprovalGate: "docs/FIRST_REVIEWER_SEPARATE_APPROVAL_REVIEW_GATE.json",
  releaseNegativeCases: "docs/FIRST_REVIEWER_RELEASE_READINESS_NEGATIVE_CASES.json",
  greenGrounding: "docs/GREEN_SOURCE_GROUNDING.json",
  rewriteWorkbench: "docs/LESSON_REWRITE_WORKBENCH.json",
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
  if (record.learnerFacingRelease !== undefined && record.learnerFacingRelease !== false) fail(`${label} cannot be learner-facing release`);
  if (record.approvalStatus !== undefined && record.approvalStatus !== "not_approved") fail(`${label} must stay not_approved`);
  if (record.expectedOutcome !== undefined && record.expectedOutcome !== EXPECTED_OUTCOME) fail(`${label} expectedOutcome changed`);
}

function lane(name, status, evidence, blocker, nextAction) {
  return { name, status, evidence, blocker, nextAction };
}

function markdown(report) {
  return [
    "# First Reviewer Launch Readiness Dashboard",
    "",
    "This dashboard rolls up reviewer evidence, approval gates, release drift guards, and green-source grounding into one launch-readiness view.",
    "It is reviewer-facing operations scaffolding only; it is not learner-facing content, approval, launch permission, commercial readiness, or production readiness.",
    "",
    "## Summary",
    "",
    `- Dashboard ready: ${report.launchDashboardReady}`,
    `- Internal trial ready: ${report.internalTrialReady}`,
    `- Launch ready: ${report.launchReady}`,
    `- Real status overlay present: ${report.realStatusOverlayPresent}`,
    `- Complete note cards: ${report.completeNoteCards}`,
    `- Ready for separate approval candidates: ${report.readyForSeparateApprovalCandidates}`,
    `- Approval review candidates: ${report.approvalReviewCandidates}`,
    `- Direct candidates unresolved: ${report.directCandidatesUnresolved}`,
    `- Release negative cases passed: ${report.releaseNegativeCasesPassed}/${report.releaseNegativeCases}`,
    `- Bad grounding refs: ${report.badGroundingRefs}`,
    `- Rewrite workbench items: ${report.rewriteWorkbenchItems}`,
    `- Approval status: ${report.approvalStatus}`,
    `- Learner-facing release: ${report.learnerFacingRelease}`,
    `- educationOnly: ${report.educationOnly}`,
    `- productionReady: ${report.productionReady}`,
    "",
    "## Readiness Lanes",
    "",
    "| Lane | Status | Evidence | Blocker | Next action |",
    "| --- | --- | --- | --- | --- |",
    ...report.readinessLanes.map((row) => `| ${row.name} | ${row.status} | ${row.evidence.replaceAll("|", "/")} | ${row.blocker.replaceAll("|", "/")} | ${row.nextAction.replaceAll("|", "/")} |`),
    "",
    "## Blockers",
    "",
    ...report.blockers.map((blocker) => `- ${blocker}`),
    "",
    "## Required Next Actions",
    "",
    ...report.requiredNextActions.map((action, index) => `${index + 1}. ${action}`),
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
  evidenceIntakeSummary,
  separateApprovalGate,
  releaseNegativeCases,
  greenGrounding,
  rewriteWorkbench,
  realStatusOverlayPresent,
] = await Promise.all([
  readJson(paths.dryRunPacket),
  readJson(paths.progressDashboard),
  readJson(paths.humanExecutionBundle),
  readJson(paths.evidenceIntakeSummary),
  readJson(paths.separateApprovalGate),
  readJson(paths.releaseNegativeCases),
  readJson(paths.greenGrounding),
  readJson(paths.rewriteWorkbench),
  exists(realStatusPath),
]);

for (const [label, record] of Object.entries({
  dryRunPacket,
  progressDashboard,
  humanExecutionBundle,
  evidenceIntakeSummary,
  separateApprovalGate,
  releaseNegativeCases,
  greenGrounding,
  rewriteWorkbench,
})) {
  assertEnvelope(record, label);
}

if (!dryRunPacket.requiredFiles.some((file) => file.path === outputMd)) fail("dry-run packet must include launch readiness dashboard file");
if (!dryRunPacket.requiredCommands.includes("npm.cmd run check:first-reviewer-launch-readiness-dashboard")) fail("dry-run packet must include launch readiness dashboard command");
if (!progressDashboard.fileOrder.some((file) => file.path === outputMd)) fail("progress dashboard must include launch readiness dashboard file");
if (!progressDashboard.requiredCommands.includes("npm.cmd run check:first-reviewer-launch-readiness-dashboard")) fail("progress dashboard must include launch readiness dashboard command");
if (!progressDashboard.statusBoard.some((row) => row.name === "Launch readiness dashboard" && row.status === "not_ready_dashboard_ready")) fail("progress dashboard must include launch readiness dashboard status");
if (!humanExecutionBundle.executionSteps.some((row) => row.file === outputMd)) fail("human execution bundle must point to launch readiness dashboard");

if (evidenceIntakeSummary.realStatusOverlayPresent !== realStatusOverlayPresent) fail("evidence intake real overlay state must match filesystem");
if (evidenceIntakeSummary.readyForSeparateApprovalCandidates > evidenceIntakeSummary.completeNoteCards) fail("evidence intake candidates cannot exceed complete note cards");
if (separateApprovalGate.approvalReviewCandidates !== evidenceIntakeSummary.readyForSeparateApprovalCandidates) fail("separate approval candidates must mirror evidence intake candidates");
if (separateApprovalGate.autoApprovedLessons !== 0) fail("separate approval gate must have zero auto approvals");
if (separateApprovalGate.learnerFacingReleaseCandidates !== 0 || separateApprovalGate.commercialReadyPromotions !== 0 || separateApprovalGate.productionReadyClaims !== 0) fail("separate approval gate must not create release, grade, or production claims");
if (releaseNegativeCases.failedCases !== 0 || releaseNegativeCases.passedCases !== releaseNegativeCases.negativeCases) fail("release negative cases must pass before launch dashboard");
if (greenGrounding.badGroundingRefs !== 0 || greenGrounding.learnerFacingNodes !== 360) fail("green grounding must keep 360 learner-facing nodes and zero bad refs");
if (!greenGrounding.tierCounts || greenGrounding.tierCounts.yellow_metadata_citation_only || greenGrounding.tierCounts.red_terms_restricted_reference) fail("green grounding must not include yellow or red tiers");
if (!Array.isArray(rewriteWorkbench.items) || rewriteWorkbench.items.length !== 48) fail("rewrite workbench must keep the 48-item reviewer scope visible");

const readinessLanes = [
  lane("Knowledge source boundary", "passing", `${greenGrounding.uniqueAllGreenSources} unique green sources; ${greenGrounding.badGroundingRefs} bad grounding refs.`, "None in current generated grounding report.", "Keep running green grounding before and after any evidence changes."),
  lane("Reviewer execution scaffolding", "ready", `${humanExecutionBundle.executionSteps.length} human execution steps; ${humanExecutionBundle.blankNoteFields} blank note fields.`, "Scaffolding is not real review evidence.", "Use the bundle as the human reviewer start page."),
  lane("Codex self-review notes", realStatusOverlayPresent ? "self_review_complete_not_approval" : "not_started", `${evidenceIntakeSummary.completeNoteCards} complete note cards; overlay present:${evidenceIntakeSummary.realStatusOverlayPresent}.`, realStatusOverlayPresent ? "Self-review is not final human approval." : "No reviewer-status overlay exists.", "Use these notes as intake evidence, then require separate human approval review."),
  lane("Direct source candidates", evidenceIntakeSummary.directCandidatesUnresolved ? "blocked_unresolved" : "resolved_as_boundary_context", `${evidenceIntakeSummary.directCandidatesUnresolved} direct candidates unresolved.`, evidenceIntakeSummary.directCandidatesUnresolved ? "Direct evidence roles are not resolved." : "Direct candidates were downgraded or resolved for boundary/context use.", "Keep direct evidence claims out of lesson prose until separate approval review."),
  lane("Evidence intake", evidenceIntakeSummary.readyForSeparateApprovalCandidates ? "candidate_intake_ready" : "waiting_for_real_notes", `${evidenceIntakeSummary.readyForSeparateApprovalCandidates} ready-for-separate-approval candidates.`, evidenceIntakeSummary.readyForSeparateApprovalCandidates ? "Candidates still require separate approval review." : "No complete notes to intake.", "Send candidates to a separate human approval review; do not publish from intake."),
  lane("Separate approval", separateApprovalGate.approvalReviewCandidates ? "blocked_waiting_separate_human_approval" : "blocked_no_candidates", `${separateApprovalGate.approvalReviewCandidates} approval-review candidates; ${separateApprovalGate.autoApprovedLessons} auto approvals.`, "No automatic approval is allowed.", "A separate human approver must review candidates before any release review."),
  lane("Release drift guard", "passing_not_release", `${releaseNegativeCases.passedCases}/${releaseNegativeCases.negativeCases} negative cases passed.`, "Passing negative cases prevent drift but do not grant release readiness.", "Keep release drift guard passing after any future approval-gate changes."),
  lane("Internal trial readiness", "not_ready", "internalTrialReady:false by design after self-review.", "Separate human approval and release-review evidence are still absent.", "Complete separate approval before considering internal trial."),
  lane("Launch readiness", "not_ready_non_production", "launchReady:false and productionReady:false.", "The project remains education-only and non-production.", "Do not create launch or production claims from generated review scaffolding."),
];

const blockers = [
  "Codex self-review notes are not final human approval.",
  `${separateApprovalGate.approvalReviewCandidates} candidates still need separate human approval review.`,
  "No learner-facing release review has been performed.",
  "Release negative cases pass, which confirms drift is blocked rather than readiness granted.",
  "The rewrite workbench remains reviewer-facing structural draft work, not learner-facing final course material.",
];

const requiredNextActions = [
  "Treat the Codex self-review overlay as intake evidence, not approval.",
  "Run a separate human approval review for the 12 candidate lesson cards.",
  "Re-check source fit, factual claims, copying risk, and boundary wording during that separate review.",
  "Keep every lesson structural_draft until a later release-review process exists.",
  "Keep release readiness negative cases passing after every approval-gate change.",
  "Continue hand-authoring or approving broader structural_draft lessons before any later launch claim.",
];

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  expectedOutcome: EXPECTED_OUTCOME,
  launchDashboardReady: true,
  internalTrialReady: false,
  launchReady: false,
  realStatusPath,
  realStatusOverlayPresent,
  completeNoteCards: evidenceIntakeSummary.completeNoteCards,
  readyForSeparateApprovalCandidates: evidenceIntakeSummary.readyForSeparateApprovalCandidates,
  approvalReviewCandidates: separateApprovalGate.approvalReviewCandidates,
  directCandidatesUnresolved: evidenceIntakeSummary.directCandidatesUnresolved,
  releaseNegativeCases: releaseNegativeCases.negativeCases,
  releaseNegativeCasesPassed: releaseNegativeCases.passedCases,
  releaseNegativeCasesFailed: releaseNegativeCases.failedCases,
  badGroundingRefs: greenGrounding.badGroundingRefs,
  uniqueAllGreenSources: greenGrounding.uniqueAllGreenSources,
  rewriteWorkbenchItems: rewriteWorkbench.items.length,
  readinessLanes,
  blockers,
  requiredNextActions,
  sourceReports: paths,
  boundary: "This launch readiness dashboard is reviewer-facing operations scaffolding only. It does not create docs/LESSON_BATCH_REVIEW_STATUS.json, fill human notes, approve lessons, publish learner-facing content, change grades, certify commercial readiness, provide trading advice, imply performance, connect brokers, automate trading, guide real-money decisions, or make the product production-ready.",
};

await fs.writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(outputMd, markdown(report), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: report.educationOnly,
  productionReady: report.productionReady,
  learnerFacingRelease: report.learnerFacingRelease,
  approvalStatus: report.approvalStatus,
  launchDashboardReady: report.launchDashboardReady,
  internalTrialReady: report.internalTrialReady,
  launchReady: report.launchReady,
  realStatusOverlayPresent: report.realStatusOverlayPresent,
  completeNoteCards: report.completeNoteCards,
  approvalReviewCandidates: report.approvalReviewCandidates,
  releaseNegativeCasesPassed: report.releaseNegativeCasesPassed,
  releaseNegativeCasesFailed: report.releaseNegativeCasesFailed,
  outputJson,
  outputMd,
}, null, 2));
