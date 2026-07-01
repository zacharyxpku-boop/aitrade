import fs from "node:fs";

const outputJsonPath = "docs/LOCAL_COURSE_P0_WRITE_AUTHORIZATION_PREVIEW.json";
const outputMdPath = "docs/LOCAL_COURSE_P0_WRITE_AUTHORIZATION_PREVIEW.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(artifact, name) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
}

const operatorIndex = readJson("docs/LOCAL_COURSE_P0_REVIEW_OPERATOR_INDEX.json");
const overlay = readJson("docs/LOCAL_COURSE_ABSORPTION_P0_REVIEW_OVERLAY.json");
const readiness = readJson("docs/LOCAL_COURSE_ABSORPTION_READINESS_AUDIT.json");
const sourceFitValidation = readJson("docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_INPUT_VALIDATION.json");
const sourceFitPositiveValidation = readJson("docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_POSITIVE_FIXTURE_VALIDATION.json");
const highRiskRealReviewerValidation = readJson("docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_INPUT_VALIDATION.json");
const nodePublicSourceFitValidation = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_VALIDATION.json");
const nodePublicSourceFitProgressMatrix = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PROGRESS_MATRIX.json");
const blankValidationFiles = [
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01_INPUT_COPY_VALIDATION.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_02_INPUT_COPY_VALIDATION.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_03_INPUT_COPY_VALIDATION.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_04_INPUT_COPY_VALIDATION.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_05_INPUT_COPY_VALIDATION.json",
  "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_VALIDATION.json",
];
const blankLintFiles = [
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01_INPUT_COPY_LINT.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_02_INPUT_COPY_LINT.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_03_INPUT_COPY_LINT.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_04_INPUT_COPY_LINT.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_05_INPUT_COPY_LINT.json",
  "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_INPUT_COPY_LINT.json",
];
const fixtureApplyFiles = [
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_01_POSITIVE_LINT_FIXTURE_APPLY_REPORT.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_02_POSITIVE_LINT_FIXTURE_APPLY_REPORT.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_03_POSITIVE_LINT_FIXTURE_APPLY_REPORT.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_04_POSITIVE_LINT_FIXTURE_APPLY_REPORT.json",
  "docs/LOCAL_COURSE_P0_HUMAN_FILL_PACK_05_POSITIVE_LINT_FIXTURE_APPLY_REPORT.json",
  "docs/LOCAL_COURSE_P0_SOURCE_REPLACEMENT_POSITIVE_LINT_FIXTURE_APPLY_REPORT.json",
];

assertBoundary(operatorIndex, "operator index");
assertBoundary(overlay, "P0 overlay");
assertBoundary(readiness, "absorption readiness");
assertBoundary(sourceFitValidation, "source-fit input validation");
assertBoundary(sourceFitPositiveValidation, "source-fit positive fixture validation");
assertBoundary(highRiskRealReviewerValidation, "high-risk real reviewer overlay input validation");
assertBoundary(nodePublicSourceFitValidation, "node public source-fit review input validation");
assertBoundary(nodePublicSourceFitProgressMatrix, "node public source-fit progress matrix");
const blankValidations = blankValidationFiles.map((file) => ({ file, data: readJson(file) }));
const blankLints = blankLintFiles.map((file) => ({ file, data: readJson(file) }));
const fixtureApplies = fixtureApplyFiles.map((file) => ({ file, data: readJson(file) }));
for (const { file, data } of [...blankValidations, ...blankLints, ...fixtureApplies]) {
  assertBoundary(data, file);
}

const blankReadyEntries = blankValidations.reduce((sum, item) => sum + (item.data.readyEntries || 0), 0);
const blankBlockedEntries = blankValidations.reduce((sum, item) => sum + (item.data.blockedEntries || 0), 0);
const blankLintReadyEntries = blankLints.reduce((sum, item) => sum + (item.data.readyEntries || 0), 0);
const blankLintBlockedEntries = blankLints.reduce((sum, item) => sum + (item.data.blockedEntries || 0), 0);
const fixtureReadyToApplyEntries = fixtureApplies.reduce((sum, item) => sum + (item.data.readyToApplyEntries || 0), 0);
const fixtureWrittenEntries = fixtureApplies.reduce((sum, item) => sum + (item.data.writtenEntries || 0), 0);
const fixtureOnlyReadyEntries = fixtureApplies.reduce((sum, item) => sum + (item.data.fixtureOnly === true ? (item.data.readyToApplyEntries || 0) : 0), 0);
const sourceFitReadyRows = sourceFitValidation.readyRows || 0;
const sourceFitBlockedRows = sourceFitValidation.blockedRows || 0;
const sourceFitFixtureReadyRows = sourceFitPositiveValidation.fixtureReadyRows || 0;
const highRiskReadyLessons = highRiskRealReviewerValidation.readyLessons || 0;
const highRiskBlockedLessons = highRiskRealReviewerValidation.blockedLessons || 0;
const highRiskReadyReviewerNotes = highRiskRealReviewerValidation.readyReviewerNotes || 0;
const highRiskBlockedReviewerNotes = highRiskRealReviewerValidation.blockedReviewerNotes || 0;
const highRiskReadyDirectSourceDecisions = highRiskRealReviewerValidation.readyDirectSourceDecisions || 0;
const highRiskBlockedDirectSourceDecisions = highRiskRealReviewerValidation.blockedDirectSourceDecisions || 0;
const nodePublicSourceFitInputRows = nodePublicSourceFitValidation.inputRows || 0;
const nodePublicSourceFitReadyRows = nodePublicSourceFitValidation.readyRows || 0;
const nodePublicSourceFitBlockedRows = nodePublicSourceFitValidation.blockedRows || 0;
const nodePublicSourceFitReadyPackets = nodePublicSourceFitProgressMatrix.readyPackets || 0;
const nodePublicSourceFitBlockedPackets = nodePublicSourceFitProgressMatrix.blockedPackets || 0;
const nodePublicSourceFitReadyModules = nodePublicSourceFitProgressMatrix.readyModules || 0;
const nodePublicSourceFitBlockedModules = nodePublicSourceFitProgressMatrix.blockedModules || 0;
const nodePublicSourceFitOverallProgressPercent = nodePublicSourceFitProgressMatrix.overallProgressPercent || 0;

const gates = [
  {
    id: "coverage_complete",
    status: operatorIndex.reviewPackCoverageComplete === true && operatorIndex.totalReviewPackEntries === overlay.totalP0Tasks ? "pass" : "fail",
    evidence: `${operatorIndex.totalReviewPackEntries}/${overlay.totalP0Tasks} P0 review entries covered.`,
    blocksWrite: false,
  },
  {
    id: "blank_inputs_blocked",
    status: blankReadyEntries === 0 && blankBlockedEntries === overlay.totalP0Tasks ? "pass" : "fail",
    evidence: `Blank validations ready ${blankReadyEntries}, blocked ${blankBlockedEntries}.`,
    blocksWrite: false,
  },
  {
    id: "blank_lints_blocked",
    status: blankLintReadyEntries === 0 && blankLintBlockedEntries === overlay.totalP0Tasks ? "pass" : "fail",
    evidence: `Blank lints ready ${blankLintReadyEntries}, blocked ${blankLintBlockedEntries}.`,
    blocksWrite: false,
  },
  {
    id: "fixtures_dry_run_only",
    status: fixtureReadyToApplyEntries === overlay.totalP0Tasks && fixtureWrittenEntries === 0 ? "pass" : "fail",
    evidence: `Fixture dry-run ready ${fixtureReadyToApplyEntries}, written ${fixtureWrittenEntries}.`,
    blocksWrite: false,
  },
  {
    id: "no_real_reviewer_input_copy",
    status: "manual_required",
    evidence: "No real reviewer-filled input copy has been supplied to this preview.",
    blocksWrite: true,
  },
  {
    id: "fixture_ready_entries_not_authorizable",
    status: fixtureOnlyReadyEntries > 0 ? "blocked" : "pass",
    evidence: `${fixtureOnlyReadyEntries} ready entries are fixtureOnly validation controls and cannot authorize --write.`,
    blocksWrite: fixtureOnlyReadyEntries > 0,
  },
  {
    id: "source_fit_real_input_blocked",
    status: sourceFitReadyRows === 0 && sourceFitBlockedRows === overlay.totalP0Tasks ? "pass" : "fail",
    evidence: `Real source-fit input ready ${sourceFitReadyRows}, blocked ${sourceFitBlockedRows}.`,
    blocksWrite: false,
  },
  {
    id: "source_fit_fixture_not_authorizable",
    status: sourceFitFixtureReadyRows === overlay.totalP0Tasks && sourceFitPositiveValidation.realHumanInputEntries === 0 ? "blocked" : "fail",
    evidence: `${sourceFitFixtureReadyRows} source-fit fixture rows are ready, real human input ${sourceFitPositiveValidation.realHumanInputEntries || 0}.`,
    blocksWrite: sourceFitFixtureReadyRows > 0,
  },
  {
    id: "high_risk_real_reviewer_overlay_blocked",
    status: highRiskReadyLessons === 0 &&
      highRiskBlockedLessons === 12 &&
      highRiskReadyReviewerNotes === 0 &&
      highRiskBlockedReviewerNotes === 72 &&
      highRiskReadyDirectSourceDecisions === 0 &&
      highRiskBlockedDirectSourceDecisions === 5
      ? "pass"
      : "fail",
    evidence: `High-risk real reviewer overlay lessons ${highRiskReadyLessons}/${highRiskBlockedLessons} ready/blocked; notes ${highRiskReadyReviewerNotes}/${highRiskBlockedReviewerNotes}; direct-source ${highRiskReadyDirectSourceDecisions}/${highRiskBlockedDirectSourceDecisions}.`,
    blocksWrite: true,
  },
  {
    id: "node_public_source_fit_review_input_blocked",
    status: nodePublicSourceFitInputRows === 1638 &&
      nodePublicSourceFitReadyRows === 0 &&
      nodePublicSourceFitBlockedRows === 1638 &&
      nodePublicSourceFitValidation.realHumanInputEntries === 0
      ? "pass"
      : "fail",
    evidence: `Node public source-fit review input rows ${nodePublicSourceFitReadyRows}/${nodePublicSourceFitBlockedRows} ready/blocked; real human input ${nodePublicSourceFitValidation.realHumanInputEntries || 0}.`,
    blocksWrite: true,
  },
  {
    id: "node_public_source_fit_progress_matrix_blocked",
    status: nodePublicSourceFitProgressMatrix.totalPackets === 35 &&
      nodePublicSourceFitReadyPackets === 0 &&
      nodePublicSourceFitBlockedPackets === 35 &&
      nodePublicSourceFitReadyModules === 0 &&
      nodePublicSourceFitBlockedModules === 12 &&
      nodePublicSourceFitOverallProgressPercent === 0 &&
      nodePublicSourceFitProgressMatrix.firstBlockedPacketId
      ? "pass"
      : "fail",
    evidence: `Node public source-fit packet progress ${nodePublicSourceFitReadyPackets}/${nodePublicSourceFitBlockedPackets} ready/blocked; modules ${nodePublicSourceFitReadyModules}/${nodePublicSourceFitBlockedModules}; first blocked ${nodePublicSourceFitProgressMatrix.firstBlockedPacketId || "missing"}.`,
    blocksWrite: true,
  },
  {
    id: "overlay_untouched",
    status: overlay.overlayStatus === "p0_review_not_started" && overlay.readyForValidationTasks === 0 && overlay.acceptedForNextGateTasks === 0 ? "pass" : "fail",
    evidence: `${overlay.overlayStatus}; ready ${overlay.readyForValidationTasks}; accepted ${overlay.acceptedForNextGateTasks}.`,
    blocksWrite: false,
  },
  {
    id: "readiness_still_blocked",
    status: readiness.readinessStatus === "blocked_for_learner_facing_absorption" ? "pass" : "fail",
    evidence: `${readiness.readinessStatus}; open blockers ${readiness.openBlockers}.`,
    blocksWrite: false,
  },
];

const blockingGates = gates.filter((gate) => gate.blocksWrite);
const failedMachineGates = gates.filter((gate) => gate.status === "fail");
const preview = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  previewStatus: "write_authorization_preview_ready_manual_required",
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  machineCheckedGatesPassed: failedMachineGates.length === 0,
  realReviewerInputRequired: true,
  fixtureOnlyInputsRejectedForWrite: true,
  totalP0Tasks: overlay.totalP0Tasks,
  totalReviewPackEntries: operatorIndex.totalReviewPackEntries,
  blankValidationReadyEntries: blankReadyEntries,
  blankValidationBlockedEntries: blankBlockedEntries,
  blankLintReadyEntries,
  blankLintBlockedEntries,
  fixtureReadyToApplyEntries,
  fixtureOnlyReadyEntries,
  fixtureWrittenEntries,
  sourceFitValidationStatus: sourceFitValidation.validationStatus,
  sourceFitReadyRows,
  sourceFitBlockedRows,
  sourceFitMissingFieldRows: sourceFitValidation.missingFieldRows,
  sourceFitForbiddenHitRows: sourceFitValidation.forbiddenHitRows,
  sourceFitFixtureValidationStatus: sourceFitPositiveValidation.validationStatus,
  sourceFitFixtureReadyRows,
  sourceFitFixtureRealHumanInputEntries: sourceFitPositiveValidation.realHumanInputEntries,
  highRiskRealReviewerValidationStatus: highRiskRealReviewerValidation.validationStatus,
  highRiskReadyLessons,
  highRiskBlockedLessons,
  highRiskReadyReviewerNotes,
  highRiskBlockedReviewerNotes,
  highRiskReadyDirectSourceDecisions,
  highRiskBlockedDirectSourceDecisions,
  highRiskMissingFieldRows: highRiskRealReviewerValidation.missingFieldRows,
  highRiskForbiddenHitRows: highRiskRealReviewerValidation.forbiddenHitRows,
  highRiskRealHumanInputEntries: highRiskRealReviewerValidation.realHumanInputEntries,
  nodePublicSourceFitValidationStatus: nodePublicSourceFitValidation.validationStatus,
  nodePublicSourceFitInputRows,
  nodePublicSourceFitReadyRows,
  nodePublicSourceFitBlockedRows,
  nodePublicSourceFitMissingFieldRows: nodePublicSourceFitValidation.missingFieldRows,
  nodePublicSourceFitForbiddenHitRows: nodePublicSourceFitValidation.forbiddenHitRows,
  nodePublicSourceFitRealHumanInputEntries: nodePublicSourceFitValidation.realHumanInputEntries,
  nodePublicSourceFitLearnerCitationApprovedRows: nodePublicSourceFitValidation.learnerCitationApprovedRows,
  nodePublicSourceFitCopiedTextApprovedRows: nodePublicSourceFitValidation.copiedTextApprovedRows,
  nodePublicSourceFitProgressMatrixStatus: nodePublicSourceFitProgressMatrix.matrixStatus,
  nodePublicSourceFitProgressValidationStatus: nodePublicSourceFitProgressMatrix.validationStatus,
  nodePublicSourceFitProgressTotalPackets: nodePublicSourceFitProgressMatrix.totalPackets,
  nodePublicSourceFitReadyPackets,
  nodePublicSourceFitBlockedPackets,
  nodePublicSourceFitReadyModules,
  nodePublicSourceFitBlockedModules,
  nodePublicSourceFitOverallProgressPercent,
  nodePublicSourceFitFirstBlockedPacketId: nodePublicSourceFitProgressMatrix.firstBlockedPacketId,
  overlayStatus: overlay.overlayStatus,
  overlayReadyForValidationTasks: overlay.readyForValidationTasks,
  overlayAcceptedForNextGateTasks: overlay.acceptedForNextGateTasks,
  readinessStatus: readiness.readinessStatus,
  openBlockers: readiness.openBlockers,
  gates,
  blockedReasons: [
    "No real reviewer-filled input copy was supplied.",
    "High-risk real reviewer overlay still has 72 blocked notes and 5 blocked direct-source decisions.",
    "Node public source-fit review input still has 1638 blocked candidate rows and zero real reviewer decisions.",
    "Node public source-fit progress matrix still has 35 blocked packets across 12 blocked modules.",
    "All currently ready apply rows are fixtureOnly dry-run controls.",
    "Source-fit validation has no real ready rows; the only passing source-fit path is fixtureOnly.",
    "A human must inspect lint, validation, and apply dry-run outputs before any --write run.",
  ],
  requiredWritePreconditions: [
    "Use a copied input file, not the blank template and not a fixture.",
    "The copied input must have fixtureOnly:false.",
    "Pack-specific lint must report ready entries with zero quality issues.",
    "Generic P0 validation must report ready entries and zero forbidden hits.",
    "Source-fit validation must report real ready rows, zero forbidden hits, and fixtureOnly:false.",
    "High-risk real reviewer overlay validation must report 12 ready lessons, 72 ready notes, 5 ready direct-source decisions, zero forbidden hits, and fixtureOnly:false.",
    "Node public source-fit review input validation must report 1638 real reviewed rows, zero forbidden hits, no copied-text approval, and explicit learner-citation decisions.",
    "Node public source-fit progress matrix must report 35/35 ready packets, 12/12 ready modules, 100% progress, and no first blocked packet.",
    "Apply dry-run must report ready entries with writtenEntries:0.",
    "A human reviewer must provide explicit human approval for the --write command and that exact input path.",
  ],
  nextGate: "real_reviewer_input_then_lint_validate_apply_dry_run_then_manual_write_authorization",
  completionRule: "This preview is not write authorization. It only separates machine-checked prerequisites from missing human authorization; writeAllowedNow must stay false until a real reviewer-filled non-fixture input copy passes lint, validation, dry-run apply, and explicit human approval.",
  boundary: "P0 write authorization preview is reviewer-only operational material. It does not write overlay changes, approve learner-facing release, infer missing private course content, provide trading advice, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Local Course P0 Write Authorization Preview",
  "",
  "Machine-checked preview for future P0 overlay writes. This is not write authorization.",
  "",
  `- Preview status: ${preview.previewStatus}`,
  `- Write allowed now: ${preview.writeAllowedNow}`,
  `- Manual authorization required: ${preview.manualAuthorizationRequired}`,
  `- P0 coverage: ${preview.totalReviewPackEntries}/${preview.totalP0Tasks}`,
  `- Blank validation ready/blocked: ${preview.blankValidationReadyEntries}/${preview.blankValidationBlockedEntries}`,
  `- Fixture ready/written: ${preview.fixtureReadyToApplyEntries}/${preview.fixtureWrittenEntries}`,
  `- Source-fit real ready/blocked: ${preview.sourceFitReadyRows}/${preview.sourceFitBlockedRows}`,
  `- Source-fit fixture ready: ${preview.sourceFitFixtureReadyRows}`,
  `- High-risk real reviewer notes ready/blocked: ${preview.highRiskReadyReviewerNotes}/${preview.highRiskBlockedReviewerNotes}`,
  `- High-risk direct-source decisions ready/blocked: ${preview.highRiskReadyDirectSourceDecisions}/${preview.highRiskBlockedDirectSourceDecisions}`,
  `- Node public source-fit ready/blocked: ${preview.nodePublicSourceFitReadyRows}/${preview.nodePublicSourceFitBlockedRows}`,
  `- Node public source-fit packets ready/blocked/progress: ${preview.nodePublicSourceFitReadyPackets}/${preview.nodePublicSourceFitBlockedPackets}/${preview.nodePublicSourceFitOverallProgressPercent}%`,
  `- First blocked node public source-fit packet: ${preview.nodePublicSourceFitFirstBlockedPacketId}`,
  `- Overlay: ${preview.overlayStatus} / accepted ${preview.overlayAcceptedForNextGateTasks}`,
  "",
  "## Gates",
  "",
  "| Gate | Status | Blocks write | Evidence |",
  "| --- | --- | --- | --- |",
  ...gates.map((gate) => `| ${gate.id} | ${gate.status} | ${gate.blocksWrite} | ${gate.evidence} |`),
  "",
  "## Blocked Reasons",
  "",
  ...preview.blockedReasons.map((reason) => `- ${reason}`),
  "",
  "## Required Write Preconditions",
  "",
  ...preview.requiredWritePreconditions.map((item) => `- ${item}`),
  "",
  "## Completion Rule",
  "",
  preview.completionRule,
  "",
  "## Boundary",
  "",
  preview.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: preview.educationOnly,
  productionReady: preview.productionReady,
  learnerFacingRelease: preview.learnerFacingRelease,
  approvalStatus: preview.approvalStatus,
  previewStatus: preview.previewStatus,
  writeAllowedNow: preview.writeAllowedNow,
  machineCheckedGatesPassed: preview.machineCheckedGatesPassed,
  manualAuthorizationRequired: preview.manualAuthorizationRequired,
  fixtureOnlyReadyEntries: preview.fixtureOnlyReadyEntries,
  fixtureWrittenEntries: preview.fixtureWrittenEntries,
  sourceFitReadyRows: preview.sourceFitReadyRows,
  sourceFitBlockedRows: preview.sourceFitBlockedRows,
  sourceFitFixtureReadyRows: preview.sourceFitFixtureReadyRows,
  highRiskReadyReviewerNotes: preview.highRiskReadyReviewerNotes,
  highRiskBlockedReviewerNotes: preview.highRiskBlockedReviewerNotes,
  highRiskReadyDirectSourceDecisions: preview.highRiskReadyDirectSourceDecisions,
  highRiskBlockedDirectSourceDecisions: preview.highRiskBlockedDirectSourceDecisions,
  nodePublicSourceFitReadyRows: preview.nodePublicSourceFitReadyRows,
  nodePublicSourceFitBlockedRows: preview.nodePublicSourceFitBlockedRows,
  nodePublicSourceFitReadyPackets: preview.nodePublicSourceFitReadyPackets,
  nodePublicSourceFitBlockedPackets: preview.nodePublicSourceFitBlockedPackets,
  nodePublicSourceFitOverallProgressPercent: preview.nodePublicSourceFitOverallProgressPercent,
  nodePublicSourceFitFirstBlockedPacketId: preview.nodePublicSourceFitFirstBlockedPacketId,
  outputJson: outputJsonPath,
  outputMd: outputMdPath,
}, null, 2));
