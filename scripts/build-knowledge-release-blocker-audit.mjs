import fs from "node:fs";

const paths = {
  localLedger: "docs/LOCAL_COURSE_FOLDER_ABSORPTION_LEDGER.json",
  publicLedger: "docs/PUBLIC_SOURCE_COVERAGE_LEDGER.json",
  readinessGate: "docs/KNOWLEDGE_BASE_READINESS_GATE.json",
  moduleCockpit: "docs/KNOWLEDGE_MODULE_REVIEW_COCKPIT.json",
  actionQueue: "docs/KNOWLEDGE_REVIEWER_ACTION_QUEUE.json",
  firstHandoff: "docs/KNOWLEDGE_FIRST_REVIEWER_ACTION_HANDOFF.json",
  firstFieldMap: "docs/KNOWLEDGE_FIRST_REVIEWER_FIELD_MAP.json",
  firstCompletionGate: "docs/KNOWLEDGE_FIRST_REVIEWER_COMPLETION_GATE.json",
  rowBrowser: "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEWER_ROW_BROWSER.json",
};

const outputJsonPath = "docs/KNOWLEDGE_RELEASE_BLOCKER_AUDIT.json";
const outputMdPath = "docs/KNOWLEDGE_RELEASE_BLOCKER_AUDIT.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(label, artifact) {
  if (artifact.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${label} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${label} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${label} must remain not_approved`);
  if (artifact.writeAllowedNow !== false) fail(`${label} must keep writeAllowedNow:false`);
}

const artifacts = Object.fromEntries(Object.entries(paths).map(([key, file]) => [key, readJson(file)]));
for (const [key, artifact] of Object.entries(artifacts)) assertBoundary(key, artifact);

const localAbsorbed = artifacts.localLedger.mappedUniquePdfFiles === artifacts.localLedger.uniquePdfHashes &&
  artifacts.localLedger.unmappedUniquePdfFiles === 0;
const publicAbsorbed = artifacts.publicLedger.mappedPublicDocuments === artifacts.publicLedger.publicCorpusDocuments &&
  artifacts.publicLedger.unmappedPublicDocuments === 0;
const internalWorkbenchReady = artifacts.readinessGate.readinessStatus === "knowledge_base_internal_review_ready_release_blocked" &&
  artifacts.moduleCockpit.internalNavigationReadyModules === artifacts.moduleCockpit.modules;
const learnerReleaseBlocked = artifacts.readinessGate.learnerFacingRelease === false &&
  artifacts.moduleCockpit.learnerReleaseReadyModules === 0 &&
  artifacts.rowBrowser.readyRows === 0 &&
  artifacts.firstCompletionGate.readyForSeparateApproval === false;

const stageRows = [
  {
    stageId: "local_course_folder_absorption",
    label: "Local investment course folder absorption",
    status: artifacts.localLedger.ledgerStatus,
    ready: localAbsorbed,
    readyItems: artifacts.localLedger.mappedUniquePdfFiles,
    requiredItems: artifacts.localLedger.uniquePdfHashes,
    blockedItems: artifacts.localLedger.unmappedUniquePdfFiles,
    evidencePath: paths.localLedger,
    nextAction: "Keep ledger current if files are added to the local course folder.",
  },
  {
    stageId: "public_source_coverage",
    label: "Public/Wikipedia/official source coverage",
    status: artifacts.publicLedger.ledgerStatus,
    ready: publicAbsorbed,
    readyItems: artifacts.publicLedger.mappedPublicDocuments,
    requiredItems: artifacts.publicLedger.publicCorpusDocuments,
    blockedItems: artifacts.publicLedger.unmappedPublicDocuments || 0,
    evidencePath: paths.publicLedger,
    nextAction: "Keep public corpus mapped and license/source-family boundaries explicit.",
  },
  {
    stageId: "knowledge_base_readiness",
    label: "Internal knowledge base readiness",
    status: artifacts.readinessGate.readinessStatus,
    ready: internalWorkbenchReady,
    readyItems: artifacts.readinessGate.internalReadyGates,
    requiredItems: (artifacts.readinessGate.gateRows || []).length,
    blockedItems: artifacts.readinessGate.learnerFacingBlockedGates,
    evidencePath: paths.readinessGate,
    nextAction: "Treat the system as an internal reviewer workbench until human review clears blockers.",
  },
  {
    stageId: "module_review_cockpit",
    label: "Module review cockpit",
    status: artifacts.moduleCockpit.cockpitStatus,
    ready: artifacts.moduleCockpit.internalNavigationReadyModules === 12,
    readyItems: artifacts.moduleCockpit.internalNavigationReadyModules,
    requiredItems: artifacts.moduleCockpit.modules,
    blockedItems: artifacts.moduleCockpit.modules - artifacts.moduleCockpit.learnerReleaseReadyModules,
    evidencePath: paths.moduleCockpit,
    nextAction: "Use module cockpit for navigation; do not present modules as learner-release ready.",
  },
  {
    stageId: "reviewer_action_queue",
    label: "Unified reviewer action queue",
    status: artifacts.actionQueue.queueStatus,
    ready: artifacts.actionQueue.readyWorkItems === artifacts.actionQueue.blockedWorkItems + artifacts.actionQueue.readyWorkItems,
    readyItems: artifacts.actionQueue.readyWorkItems,
    requiredItems: artifacts.actionQueue.blockedWorkItems + artifacts.actionQueue.readyWorkItems,
    blockedItems: artifacts.actionQueue.blockedWorkItems,
    evidencePath: paths.actionQueue,
    nextAction: "Work the 52 reviewer actions: high-risk notes, direct-source decisions, and source-fit packets.",
  },
  {
    stageId: "first_reviewer_field_execution",
    label: "First reviewer field execution",
    status: artifacts.firstFieldMap.fieldMapStatus,
    ready: artifacts.firstCompletionGate.readyWorkItems === artifacts.firstCompletionGate.requiredWorkItems,
    readyItems: artifacts.firstCompletionGate.readyWorkItems,
    requiredItems: artifacts.firstCompletionGate.requiredWorkItems,
    blockedItems: artifacts.firstCompletionGate.blockedWorkItems,
    evidencePath: paths.firstCompletionGate,
    nextAction: "Fill the first 257 human-owned fields, then rerun validation and this audit.",
  },
  {
    stageId: "all_source_fit_rows",
    label: "All source-fit review rows",
    status: artifacts.rowBrowser.rowBrowserStatus,
    ready: artifacts.rowBrowser.readyRows === artifacts.rowBrowser.totalReviewRows,
    readyItems: artifacts.rowBrowser.readyRows,
    requiredItems: artifacts.rowBrowser.totalReviewRows,
    blockedItems: artifacts.rowBrowser.blockedRows,
    evidencePath: paths.rowBrowser,
    nextAction: "Complete source-fit decisions across all 35 packets before learner-facing citation approval.",
  },
];

const releaseBlockerRows = [
  {
    blockerId: "missing_real_human_review",
    severity: "p0",
    blockedItems: artifacts.actionQueue.blockedWorkItems,
    evidence: `${artifacts.actionQueue.readyWorkItems}/${artifacts.actionQueue.blockedWorkItems + artifacts.actionQueue.readyWorkItems} reviewer work items ready.`,
    nextGate: "real_reviewer_fills_mapped_inputs_then_validation_passes",
  },
  {
    blockerId: "source_fit_rows_not_reviewed",
    severity: "p0",
    blockedItems: artifacts.rowBrowser.blockedRows,
    evidence: `${artifacts.rowBrowser.readyRows}/${artifacts.rowBrowser.totalReviewRows} source-fit rows ready.`,
    nextGate: "all_source_fit_packet_validations_ready",
  },
  {
    blockerId: "first_reviewer_completion_gate_blocked",
    severity: "p0",
    blockedItems: artifacts.firstCompletionGate.blockedWorkItems,
    evidence: `${artifacts.firstCompletionGate.readyWorkItems}/${artifacts.firstCompletionGate.requiredWorkItems} first-handoff work items ready.`,
    nextGate: "first_reviewer_completion_gate_ready_for_separate_approval",
  },
  {
    blockerId: "learner_release_modules_zero",
    severity: "p0",
    blockedItems: artifacts.moduleCockpit.modules,
    evidence: `${artifacts.moduleCockpit.learnerReleaseReadyModules}/${artifacts.moduleCockpit.modules} modules learner-release ready.`,
    nextGate: "separate_human_release_approval_after_review_validation",
  },
];

const audit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  auditStatus: "knowledge_release_blocker_audit_ready_release_blocked",
  auditMode: "end_to_end_absorption_review_release_blocker_chain",
  knowledgeBaseUsefulnessStatus: artifacts.readinessGate.knowledgeBaseUsefulnessStatus,
  internalUseStatus: "usable_as_internal_reviewer_workbench",
  learnerUseStatus: "blocked_not_learner_course",
  localCourseAbsorbed: localAbsorbed,
  publicSourcesAbsorbed: publicAbsorbed,
  internalWorkbenchReady,
  learnerReleaseBlocked,
  physicalPdfFiles: artifacts.localLedger.physicalPdfFiles,
  uniquePdfHashes: artifacts.localLedger.uniquePdfHashes,
  mappedUniquePdfFiles: artifacts.localLedger.mappedUniquePdfFiles,
  publicCorpusDocuments: artifacts.publicLedger.publicCorpusDocuments,
  wikipediaDocuments: artifacts.publicLedger.wikipediaDocuments,
  officialLikeDocuments: artifacts.publicLedger.officialLikeDocuments,
  mappedPublicDocuments: artifacts.publicLedger.mappedPublicDocuments,
  moduleGroundedNodes: artifacts.publicLedger.moduleGroundedNodes,
  modules: artifacts.moduleCockpit.modules,
  internalNavigationReadyModules: artifacts.moduleCockpit.internalNavigationReadyModules,
  learnerReleaseReadyModules: artifacts.moduleCockpit.learnerReleaseReadyModules,
  reviewerActionRows: artifacts.actionQueue.totalActionRows,
  reviewerBlockedWorkItems: artifacts.actionQueue.blockedWorkItems,
  reviewerReadyWorkItems: artifacts.actionQueue.readyWorkItems,
  firstHandoffActionRows: artifacts.firstHandoff.handoffActionRows,
  firstHandoffRequiredWorkItems: artifacts.firstCompletionGate.requiredWorkItems,
  firstHandoffReadyWorkItems: artifacts.firstCompletionGate.readyWorkItems,
  firstHandoffBlockedWorkItems: artifacts.firstCompletionGate.blockedWorkItems,
  sourceFitReviewRows: artifacts.rowBrowser.totalReviewRows,
  readySourceFitReviewRows: artifacts.rowBrowser.readyRows,
  blockedSourceFitReviewRows: artifacts.rowBrowser.blockedRows,
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  stageRows,
  releaseBlockerRows,
  nextBestActions: [
    "Have a real reviewer fill the first reviewer mapped fields: 72 notes, 5 direct-source decisions, and 180 source-fit rows.",
    "Rerun high-risk overlay and packet 001-003 validations, then rebuild completion gate and release blocker audit.",
    "Continue packet-by-packet source-fit review until all 1638 rows are real-human reviewed.",
    "Only after validation passes, run a separate learner-facing citation/release approval gate.",
  ],
  commands: [
    "npm.cmd run build:knowledge-release-blocker-audit",
    "npm.cmd run check:knowledge-release-blocker-audit",
    "npm.cmd run check:knowledge-base-readiness-gate",
    "npm.cmd run check:knowledge-module-review-cockpit",
    "npm.cmd run check:knowledge-first-reviewer-completion-gate",
    "npm.cmd run check:knowledge-node-public-source-fit-reviewer-row-browser",
    "npm.cmd run verify",
  ],
  completionRule: "This release blocker audit is complete when the end-to-end chain accounts for local course absorption, public/Wikipedia/official source coverage, internal workbench readiness, reviewer action blockers, first reviewer completion blockers, and all source-fit row blockers. It does not remove blockers, generate human review, approve learner-facing release, or authorize writes.",
  boundary: "Knowledge release blocker audit is reviewer-facing education-only governance. It audits absorbed local investment course PDFs, public/Wikipedia/official source coverage, module review readiness, first reviewer gates, and source-fit review blockers; it does not generate reviewer notes, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Knowledge Release Blocker Audit",
  "",
  `- Audit status: ${audit.auditStatus}`,
  `- Internal use: ${audit.internalUseStatus}`,
  `- Learner use: ${audit.learnerUseStatus}`,
  `- Local PDFs mapped: ${audit.mappedUniquePdfFiles}/${audit.uniquePdfHashes}`,
  `- Public docs mapped: ${audit.mappedPublicDocuments}/${audit.publicCorpusDocuments}`,
  `- Modules navigable: ${audit.internalNavigationReadyModules}/${audit.modules}`,
  `- Learner-release modules: ${audit.learnerReleaseReadyModules}/${audit.modules}`,
  `- Reviewer work ready/blocked: ${audit.reviewerReadyWorkItems}/${audit.reviewerBlockedWorkItems}`,
  `- First handoff ready/blocked: ${audit.firstHandoffReadyWorkItems}/${audit.firstHandoffBlockedWorkItems}`,
  `- Source-fit rows ready/blocked: ${audit.readySourceFitReviewRows}/${audit.blockedSourceFitReviewRows}`,
  `- Real human input entries: ${audit.realHumanInputEntries}`,
  `- Write allowed now: ${audit.writeAllowedNow}`,
  "",
  "## Stage Rows",
  "",
  "| Stage | Status | Ready | Ready items | Required | Blocked | Next action |",
  "| --- | --- | --- | ---: | ---: | ---: | --- |",
  ...stageRows.map((row) => `| ${row.label} | ${row.status} | ${row.ready} | ${row.readyItems} | ${row.requiredItems} | ${row.blockedItems} | ${row.nextAction} |`),
  "",
  "## Release Blockers",
  "",
  "| Blocker | Severity | Blocked items | Evidence | Next gate |",
  "| --- | --- | ---: | --- | --- |",
  ...releaseBlockerRows.map((row) => `| ${row.blockerId} | ${row.severity} | ${row.blockedItems} | ${row.evidence} | ${row.nextGate} |`),
  "",
  "## Next Best Actions",
  "",
  ...audit.nextBestActions.map((item) => `- ${item}`),
  "",
  "## Boundary",
  "",
  audit.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  auditStatus: audit.auditStatus,
  internalUseStatus: audit.internalUseStatus,
  learnerUseStatus: audit.learnerUseStatus,
  localCourseAbsorbed: audit.localCourseAbsorbed,
  publicSourcesAbsorbed: audit.publicSourcesAbsorbed,
  internalWorkbenchReady: audit.internalWorkbenchReady,
  learnerReleaseBlocked: audit.learnerReleaseBlocked,
  reviewerBlockedWorkItems: audit.reviewerBlockedWorkItems,
  firstHandoffBlockedWorkItems: audit.firstHandoffBlockedWorkItems,
  blockedSourceFitReviewRows: audit.blockedSourceFitReviewRows,
  realHumanInputEntries: audit.realHumanInputEntries,
  writeAllowedNow: audit.writeAllowedNow,
}, null, 2));
