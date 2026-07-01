import fs from "node:fs";

const outputJson = "docs/LOCAL_COURSE_REVIEW_GATE_DASHBOARD.json";
const outputMd = "docs/LOCAL_COURSE_REVIEW_GATE_DASHBOARD.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertBoundary(name, artifact) {
  if (artifact.educationOnly !== true) fail(`${name} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${name} must keep productionReady:false`);
  if (artifact.learnerFacingRelease !== false) fail(`${name} must keep learnerFacingRelease:false`);
  if (artifact.approvalStatus !== "not_approved") fail(`${name} must remain not_approved`);
}

const moduleSelfAudit = readJson("docs/LOCAL_COURSE_MODULE_ABSORPTION_SELF_AUDIT.json");
const moduleDossier = readJson("docs/LOCAL_COURSE_MODULE_REVIEW_DOSSIER.json");
const publicGap = readJson("docs/PUBLIC_SOURCE_GAP_AUDIT.json");
const wikipediaAudit = readJson("docs/WIKIPEDIA_GROUNDING_AUDIT.json");
const highRiskSelfReview = readJson("docs/LOCAL_COURSE_HIGH_RISK_SELF_REVIEW_OVERLAY.json");
const highRiskGrounding = readJson("docs/LOCAL_COURSE_HIGH_RISK_PUBLIC_GROUNDING_MATRIX.json");
const highRiskRealReviewerStarter = readJson("docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_STARTER.json");
const highRiskRealReviewerValidation = readJson("docs/LOCAL_COURSE_HIGH_RISK_REAL_REVIEWER_OVERLAY_INPUT_VALIDATION.json");
const p0OperatorIndex = readJson("docs/LOCAL_COURSE_P0_REVIEW_OPERATOR_INDEX.json");
const p0TaskBoard = readJson("docs/LOCAL_COURSE_P0_REAL_REVIEWER_TASK_BOARD.json");
const p0EvidencePacket = readJson("docs/LOCAL_COURSE_P0_REAL_REVIEWER_EVIDENCE_PACKET.json");
const p0SourceFitValidation = readJson("docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_INPUT_VALIDATION.json");
const p0SourceFitHandoff = readJson("docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_HANDOFF.json");
const nodePublicSourceFitValidation = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_INPUT_VALIDATION.json");
const nodePublicSourceFitProgressMatrix = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PROGRESS_MATRIX.json");
const writePreview = readJson("docs/LOCAL_COURSE_P0_WRITE_AUTHORIZATION_PREVIEW.json");
const sourceSync = readJson("docs/LOCAL_COURSE_SOURCE_SYNC_AUDIT.json");

for (const [name, artifact] of Object.entries({
  moduleSelfAudit,
  moduleDossier,
  publicGap,
  wikipediaAudit,
  highRiskSelfReview,
  highRiskGrounding,
  highRiskRealReviewerStarter,
  highRiskRealReviewerValidation,
  p0OperatorIndex,
  p0TaskBoard,
  p0EvidencePacket,
  p0SourceFitValidation,
  p0SourceFitHandoff,
  nodePublicSourceFitValidation,
  nodePublicSourceFitProgressMatrix,
  writePreview,
  sourceSync,
})) {
  assertBoundary(name, artifact);
}

const publicByModule = new Map((publicGap.moduleRows || []).map((row) => [row.module, row]));
const wikipediaByModule = new Map((wikipediaAudit.moduleRows || []).map((row) => [row.module, row]));
const highRiskByModule = new Map((highRiskGrounding.moduleRows || []).map((row) => [row.module, row]));
const p0TasksByModule = new Map();
for (const task of p0TaskBoard.taskRows || []) {
  const key = task.sourceModule || "unknown";
  if (!p0TasksByModule.has(key)) p0TasksByModule.set(key, []);
  p0TasksByModule.get(key).push(task);
}

const moduleGateRows = (moduleDossier.moduleRows || []).map((row) => {
  const publicRow = publicByModule.get(row.module) || {};
  const wikiRow = wikipediaByModule.get(row.module) || {};
  const highRiskRow = highRiskByModule.get(row.module) || {};
  const localModuleTasks = p0TasksByModule.get(row.module) || [];
  return {
    moduleId: row.moduleId,
    module: row.module,
    learnerFacingNodes: row.learnerFacingNodes,
    localCourseDocuments: row.localCourseDocuments,
    readyForRewriteReview: row.readyForRewriteReview,
    localResearchReady: row.localResearchReady === true,
    publicReferenceReady: row.publicReferenceReady === true,
    wikipediaGroundingReady: wikiRow.wikipediaGroundingReady === true || row.wikipediaEvidenceDocs >= 2,
    publicEvidenceDocs: row.publicEvidenceDocs,
    wikipediaEvidenceDocs: row.wikipediaEvidenceDocs,
    officialLikeEvidenceDocs: row.officialLikeEvidenceDocs,
    highRiskLessons: row.highRiskLessons || 0,
    highRiskReleaseBlockers: row.highRiskReleaseBlockers || 0,
    selectedWikipediaRefs: highRiskRow.selectedWikipediaRefs || 0,
    learnerCitationApproved: false,
    learnerReleaseReady: false,
    p0Tasks: localModuleTasks.length,
    p0ReadyTasks: localModuleTasks.filter((task) => task.reviewReady === true).length,
    p0BlockedTasks: localModuleTasks.length,
    coursePathId: row.coursePath?.pathId || "",
    reviewGateStatus: row.highRiskReleaseBlockers > 0 || localModuleTasks.length > 0
      ? "blocked_pending_real_reviewer_input"
      : "blocked_pending_refinement_and_release_approval",
    nextGate: row.highRiskReleaseBlockers > 0
      ? "human_public_grounding_review_then_source_fit_and_release_gate"
      : "review_rewrite_drafts_then_separate_release_approval",
    samplePublicRefs: (publicRow.evidenceSamples || row.publicEvidenceSamples || []).slice(0, 2).map((sample) => ({
      name: sample.name,
      url: sample.url,
      family: sample.family,
      excerptPolicy: sample.excerptPolicy,
    })),
  };
});

const highRiskLessonRows = (highRiskGrounding.lessonRows || []).map((lesson) => ({
  candidateId: lesson.candidateId,
  nodeId: lesson.nodeId,
  lessonId: lesson.lessonId,
  module: lesson.module,
  topic: lesson.topic,
  wikipediaRefCount: (lesson.wikipediaRefs || []).length,
  publicContextRefCount: (lesson.publicContextRefs || []).length,
  publicGroundingStatus: lesson.publicGroundingStatus,
  selfReviewStatus: "codex_self_review_complete_not_human_approved",
  learnerCitationApproved: lesson.learnerCitationApproved === true,
  learnerFacingRelease: lesson.learnerFacingRelease === true,
  approvalStatus: lesson.approvalStatus,
  releaseBlocker: lesson.releaseBlocker === true,
  nextGate: lesson.nextGate || "human_public_grounding_review_then_originality_and_release_gate",
}));

const summaryGates = [
  {
    id: "source_folder_sync",
    status: sourceSync.syncStatus,
    passedForInternalReview: sourceSync.missingCurrentUniqueHashesFromCorpus === 0 && sourceSync.missingCurrentFilesFromManifest === 0,
    learnerReleaseGatePassed: false,
    evidence: `${sourceSync.currentUniquePdfHashes}/${sourceSync.manifestUniquePdfFiles} unique PDFs mapped`,
    nextGate: "keep source folder sync audit green before every release review",
  },
  {
    id: "research_layer_absorption",
    status: moduleSelfAudit.auditStatus,
    passedForInternalReview: moduleSelfAudit.researchLayerReadyModules === moduleSelfAudit.modules,
    learnerReleaseGatePassed: false,
    evidence: `${moduleSelfAudit.readyForRewriteReviewNodes}/${moduleSelfAudit.matchedKnowledgeNodes} nodes rewrite-ready`,
    nextGate: "review rewrite drafts and preserve education-only boundary",
  },
  {
    id: "public_wikipedia_grounding",
    status: wikipediaAudit.auditStatus,
    passedForInternalReview: wikipediaAudit.modulesWithWikipediaGrounding === wikipediaAudit.modules,
    learnerReleaseGatePassed: false,
    evidence: `${wikipediaAudit.wikipediaDocuments} Wikipedia docs, ${wikipediaAudit.highRiskWikipediaRefCount} high-risk refs`,
    nextGate: "human reviewer confirms public refs are context only or approved separately",
  },
  {
    id: "high_risk_self_review",
    status: highRiskSelfReview.overlayStatus,
    passedForInternalReview: highRiskSelfReview.reviewerNotesReviewed === highRiskSelfReview.expectedReviewerNotes,
    learnerReleaseGatePassed: false,
    evidence: `${highRiskSelfReview.reviewerNotesReviewed}/${highRiskSelfReview.expectedReviewerNotes} Codex self-review notes, ${highRiskSelfReview.releaseBlockingNotes} blocking notes`,
    nextGate: "real reviewer fills independent notes and separate approval gate",
  },
  {
    id: "high_risk_real_reviewer_overlay",
    status: highRiskRealReviewerValidation.validationStatus,
    passedForInternalReview: highRiskRealReviewerStarter.lessonCount === 12 &&
      highRiskRealReviewerStarter.totalReviewerNotes === 72 &&
      highRiskRealReviewerValidation.lessonCount === 12,
    learnerReleaseGatePassed: false,
    evidence: `${highRiskRealReviewerValidation.readyReviewerNotes}/${highRiskRealReviewerValidation.blockedReviewerNotes} real notes ready/blocked; ${highRiskRealReviewerValidation.readyDirectSourceDecisions}/${highRiskRealReviewerValidation.blockedDirectSourceDecisions} direct-source decisions ready/blocked`,
    nextGate: "real reviewer fills 72 notes and 5 direct-source decisions, then reruns validation",
  },
  {
    id: "p0_real_reviewer_tasks",
    status: p0TaskBoard.boardStatus,
    passedForInternalReview: p0TaskBoard.totalTasks === p0OperatorIndex.totalReviewPackEntries,
    learnerReleaseGatePassed: false,
    evidence: `${p0TaskBoard.readyTasks}/${p0TaskBoard.blockedTasks} real tasks ready/blocked; ${p0TaskBoard.realHumanInputEntries} real inputs`,
    nextGate: "fill copied reviewer input files, then validate and lint",
  },
  {
    id: "source_fit_notes",
    status: p0SourceFitValidation.validationStatus,
    passedForInternalReview: p0SourceFitValidation.totalRows === p0SourceFitHandoff.totalGuideRows,
    learnerReleaseGatePassed: false,
    evidence: `${p0SourceFitValidation.readyRows}/${p0SourceFitValidation.blockedRows} source-fit rows ready/blocked`,
    nextGate: "complete source-fit and public-reference notes without fixtures",
  },
  {
    id: "node_public_source_fit_review_input",
    status: nodePublicSourceFitValidation.validationStatus,
    passedForInternalReview: nodePublicSourceFitValidation.inputRows === 1638 &&
      nodePublicSourceFitValidation.blockedRows === 1638 &&
      nodePublicSourceFitValidation.realHumanInputEntries === 0,
    learnerReleaseGatePassed: false,
    evidence: `${nodePublicSourceFitValidation.readyRows}/${nodePublicSourceFitValidation.blockedRows} node public source-fit rows ready/blocked; ${nodePublicSourceFitValidation.realHumanInputEntries} real inputs`,
    nextGate: "real reviewer accepts/rejects public source-fit candidates before learner citations",
  },
  {
    id: "node_public_source_fit_progress_matrix",
    status: nodePublicSourceFitProgressMatrix.matrixStatus,
    passedForInternalReview: nodePublicSourceFitProgressMatrix.totalPackets === 35 &&
      nodePublicSourceFitProgressMatrix.readyPackets === 0 &&
      nodePublicSourceFitProgressMatrix.blockedPackets === 35 &&
      nodePublicSourceFitProgressMatrix.totalReviewRows === 1638 &&
      nodePublicSourceFitProgressMatrix.readyRows === 0 &&
      nodePublicSourceFitProgressMatrix.blockedRows === 1638,
    learnerReleaseGatePassed: false,
    evidence: `${nodePublicSourceFitProgressMatrix.readyPackets}/${nodePublicSourceFitProgressMatrix.blockedPackets} packets ready/blocked; ${nodePublicSourceFitProgressMatrix.readyModules}/${nodePublicSourceFitProgressMatrix.blockedModules} modules ready/blocked; ${nodePublicSourceFitProgressMatrix.overallProgressPercent}% progress; first blocked ${nodePublicSourceFitProgressMatrix.firstBlockedPacketId}`,
    nextGate: "complete packet-level source-fit review until every packet and module is ready",
  },
  {
    id: "write_authorization",
    status: writePreview.previewStatus,
    passedForInternalReview: writePreview.machineCheckedGatesPassed === true,
    learnerReleaseGatePassed: writePreview.writeAllowedNow === true,
    evidence: `writeAllowedNow:${writePreview.writeAllowedNow === true}; realHumanInputRequired:${writePreview.realReviewerInputRequired === true}`,
    nextGate: writePreview.nextGate || "manual authorization after real review only",
  },
];

const nextActionRows = [
  {
    order: 1,
    id: "freeze_source_sync",
    status: summaryGates[0].passedForInternalReview ? "ready" : "blocked",
    command: "npm.cmd run check:local-course-source-sync-audit",
    owner: "operator",
    output: "confirm 298 unique PDFs remain mapped to the private research corpus",
  },
  {
    order: 2,
    id: "review_high_risk_lessons",
    status: "blocked_waiting_real_reviewer",
    command: "npm.cmd run check:local-course-high-risk-public-grounding-matrix",
    owner: "real_reviewer",
    output: "12 high-risk lessons receive human public-grounding and release-gate notes",
  },
  {
    order: 3,
    id: "fill_high_risk_real_reviewer_overlay",
    status: "blocked_missing_real_reviewer_input",
    command: "npm.cmd run validate:local-course-high-risk-real-reviewer-overlay-input && npm.cmd run check:local-course-high-risk-real-reviewer-overlay-input-validation",
    owner: "real_reviewer",
    output: "72 high-risk reviewer notes and 5 direct-source decisions become validation-ready",
  },
  {
    order: 4,
    id: "fill_p0_source_fit_notes",
    status: "blocked_missing_real_reviewer_input",
    command: "npm.cmd run validate:local-course-p0-real-reviewer-source-fit-input",
    owner: "real_reviewer",
    output: "22 source-fit rows become ready without fixture-only data",
  },
  {
    order: 5,
    id: "fill_node_public_source_fit_review",
    status: "blocked_missing_real_reviewer_input",
    command: "npm.cmd run validate:knowledge-node-public-source-fit-review-input && npm.cmd run check:knowledge-node-public-source-fit-review-input-validation",
    owner: "real_reviewer",
    output: "1638 node-level public source-fit candidate rows receive real reviewer decisions",
  },
  {
    order: 6,
    id: "track_node_public_source_fit_progress",
    status: "blocked_missing_real_reviewer_input",
    command: "npm.cmd run build:knowledge-node-public-source-fit-review-progress-matrix && npm.cmd run check:knowledge-node-public-source-fit-review-progress-matrix",
    owner: "operator",
    output: "35 packet progress matrix stays tied to validation output and first blocked packet",
  },
  {
    order: 7,
    id: "resolve_manual_transcription_pages",
    status: "blocked_missing_real_reviewer_input",
    command: "npm.cmd run check:local-course-p0-review-operator-index",
    owner: "real_reviewer",
    output: "19 manual transcription pages pass lint, validation, and dry-run apply",
  },
  {
    order: 8,
    id: "resolve_source_replacement_pages",
    status: "blocked_missing_real_reviewer_input",
    command: "npm.cmd run check:local-course-p0-source-replacement-review-pack",
    owner: "real_reviewer",
    output: "3 source replacement pages get accepted replacement or unrecoverable marker",
  },
  {
    order: 9,
    id: "rerun_write_authorization_preview",
    status: "blocked_until_real_inputs_ready",
    command: "npm.cmd run build:local-course-p0-write-authorization-preview && npm.cmd run check:local-course-p0-write-authorization-preview",
    owner: "operator",
    output: "write authorization remains locked until real review and explicit approval",
  },
  {
    order: 10,
    id: "separate_learner_release_approval",
    status: "blocked_until_human_approval",
    command: "npm.cmd run verify",
    owner: "approver",
    output: "learner-facing release remains false unless separate approval exists",
  },
];

const dashboard = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  dashboardStatus: "local_course_review_gate_dashboard_ready_release_blocked",
  dashboardMode: "single_screen_internal_review_gate_for_local_course_absorption",
  sourceRoot: moduleSelfAudit.sourceRoot,
  localCourseDocuments: moduleSelfAudit.localCourseDocuments,
  localCourseChunks: moduleSelfAudit.localCourseChunks,
  currentUniquePdfHashes: sourceSync.currentUniquePdfHashes,
  corpusDocsForCurrentUniqueHashes: sourceSync.corpusDocsForCurrentUniqueHashes,
  modules: moduleDossier.modules,
  researchLayerReadyModules: moduleSelfAudit.researchLayerReadyModules,
  publicReferenceReadyModules: publicGap.publicReferenceReadyModules,
  modulesWithWikipediaGrounding: wikipediaAudit.modulesWithWikipediaGrounding,
  rewriteReadyNodes: moduleSelfAudit.readyForRewriteReviewNodes,
  matchedKnowledgeNodes: moduleSelfAudit.matchedKnowledgeNodes,
  rewriteDrafts: moduleSelfAudit.rewriteDrafts,
  highRiskLessons: highRiskGrounding.lessonCount,
  highRiskLessonsWithPublicGrounding: highRiskGrounding.lessonsWithPublicGrounding,
  highRiskLessonsWithAtLeastThreeWikipediaRefs: wikipediaAudit.highRiskLessonsWithAtLeastThreeWikipediaRefs,
  highRiskReleaseBlockingLessons: highRiskGrounding.releaseBlockingLessons,
  codexSelfReviewNotes: highRiskSelfReview.reviewerNotesReviewed,
  expectedSelfReviewNotes: highRiskSelfReview.expectedReviewerNotes,
  highRiskRealReviewerValidationStatus: highRiskRealReviewerValidation.validationStatus,
  highRiskRealReviewerReadyLessons: highRiskRealReviewerValidation.readyLessons,
  highRiskRealReviewerBlockedLessons: highRiskRealReviewerValidation.blockedLessons,
  highRiskRealReviewerNotesReady: highRiskRealReviewerValidation.readyReviewerNotes,
  highRiskRealReviewerNotesBlocked: highRiskRealReviewerValidation.blockedReviewerNotes,
  highRiskDirectSourceDecisionsReady: highRiskRealReviewerValidation.readyDirectSourceDecisions,
  highRiskDirectSourceDecisionsBlocked: highRiskRealReviewerValidation.blockedDirectSourceDecisions,
  realHumanInputEntries: p0TaskBoard.realHumanInputEntries,
  p0Tasks: p0TaskBoard.totalTasks,
  p0ReadyTasks: p0TaskBoard.readyTasks,
  p0BlockedTasks: p0TaskBoard.blockedTasks,
  manualTranscriptionTasks: p0TaskBoard.manualTranscriptionTasks,
  sourceReplacementTasks: p0TaskBoard.sourceReplacementTasks,
  sourceFitReadyRows: p0SourceFitValidation.readyRows,
  sourceFitBlockedRows: p0SourceFitValidation.blockedRows,
  sourceFitFixtureReadyRows: p0SourceFitHandoff.sourceFitFixtureReadyRows,
  nodePublicSourceFitValidationStatus: nodePublicSourceFitValidation.validationStatus,
  nodePublicSourceFitInputRows: nodePublicSourceFitValidation.inputRows,
  nodePublicSourceFitReadyRows: nodePublicSourceFitValidation.readyRows,
  nodePublicSourceFitBlockedRows: nodePublicSourceFitValidation.blockedRows,
  nodePublicSourceFitMissingFieldRows: nodePublicSourceFitValidation.missingFieldRows,
  nodePublicSourceFitForbiddenHitRows: nodePublicSourceFitValidation.forbiddenHitRows,
  nodePublicSourceFitRealHumanInputEntries: nodePublicSourceFitValidation.realHumanInputEntries,
  nodePublicSourceFitLearnerCitationApprovedRows: nodePublicSourceFitValidation.learnerCitationApprovedRows,
  nodePublicSourceFitCopiedTextApprovedRows: nodePublicSourceFitValidation.copiedTextApprovedRows,
  nodePublicSourceFitProgressMatrixStatus: nodePublicSourceFitProgressMatrix.matrixStatus,
  nodePublicSourceFitProgressValidationStatus: nodePublicSourceFitProgressMatrix.validationStatus,
  nodePublicSourceFitProgressTotalPackets: nodePublicSourceFitProgressMatrix.totalPackets,
  nodePublicSourceFitReadyPackets: nodePublicSourceFitProgressMatrix.readyPackets,
  nodePublicSourceFitBlockedPackets: nodePublicSourceFitProgressMatrix.blockedPackets,
  nodePublicSourceFitReadyModules: nodePublicSourceFitProgressMatrix.readyModules,
  nodePublicSourceFitBlockedModules: nodePublicSourceFitProgressMatrix.blockedModules,
  nodePublicSourceFitOverallProgressPercent: nodePublicSourceFitProgressMatrix.overallProgressPercent,
  nodePublicSourceFitProgressReadyRows: nodePublicSourceFitProgressMatrix.readyRows,
  nodePublicSourceFitProgressBlockedRows: nodePublicSourceFitProgressMatrix.blockedRows,
  nodePublicSourceFitFirstBlockedPacketId: nodePublicSourceFitProgressMatrix.firstBlockedPacketId,
  learnerCitationApprovedLessons: highRiskGrounding.learnerCitationApprovedLessons,
  learnerReleaseReadyModules: moduleDossier.learnerReleaseReadyModules,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  releaseBlockerCount: (moduleSelfAudit.releaseBlockers || []).length,
  summaryGates,
  moduleGateRows,
  highRiskLessonRows,
  nextActionRows,
  commands: [
    "npm.cmd run check:local-course-review-gate-dashboard",
    "npm.cmd run check:local-course-module-review-dossier",
    "npm.cmd run check:wikipedia-grounding-audit",
    "npm.cmd run check:local-course-p0-real-reviewer-source-fit-handoff",
    "npm.cmd run check:local-course-p0-write-authorization-preview",
  ],
  completionRule: "This dashboard proves internal review-gate visibility for absorbed local course material and public/Wikipedia grounding. It does not prove learner-facing course readiness; real reviewer notes, source-fit input, source replacement decisions, dry-run apply, and separate approval remain required.",
  boundary: "Reviewer-facing education-only review gate. It aggregates private course coverage, public/Wikipedia grounding candidates, Codex self-review, and P0 human-review blockers; it does not publish private PDFs, approve learner-facing citations, write overlays, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(dashboard, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Local Course Review Gate Dashboard",
  "",
  "Single-screen internal review gate for local-course absorption.",
  "",
  `- Dashboard status: ${dashboard.dashboardStatus}`,
  `- Source root: ${dashboard.sourceRoot}`,
  `- Local docs/chunks: ${dashboard.localCourseDocuments}/${dashboard.localCourseChunks}`,
  `- Modules research/public/Wikipedia ready: ${dashboard.researchLayerReadyModules}/${dashboard.publicReferenceReadyModules}/${dashboard.modulesWithWikipediaGrounding}`,
  `- Rewrite-ready nodes: ${dashboard.rewriteReadyNodes}/${dashboard.matchedKnowledgeNodes}`,
  `- High-risk lessons grounded/blocking: ${dashboard.highRiskLessonsWithPublicGrounding}/${dashboard.highRiskReleaseBlockingLessons}`,
  `- Codex self-review notes: ${dashboard.codexSelfReviewNotes}/${dashboard.expectedSelfReviewNotes}`,
  `- High-risk real reviewer notes ready/blocked: ${dashboard.highRiskRealReviewerNotesReady}/${dashboard.highRiskRealReviewerNotesBlocked}`,
  `- High-risk direct-source decisions ready/blocked: ${dashboard.highRiskDirectSourceDecisionsReady}/${dashboard.highRiskDirectSourceDecisionsBlocked}`,
  `- Real human inputs: ${dashboard.realHumanInputEntries}`,
  `- P0 tasks ready/blocked: ${dashboard.p0ReadyTasks}/${dashboard.p0BlockedTasks}`,
  `- Source-fit ready/blocked: ${dashboard.sourceFitReadyRows}/${dashboard.sourceFitBlockedRows}`,
  `- Node public source-fit ready/blocked: ${dashboard.nodePublicSourceFitReadyRows}/${dashboard.nodePublicSourceFitBlockedRows}`,
  `- Node public source-fit packets ready/blocked/progress: ${dashboard.nodePublicSourceFitReadyPackets}/${dashboard.nodePublicSourceFitBlockedPackets}/${dashboard.nodePublicSourceFitOverallProgressPercent}%`,
  `- First blocked node public source-fit packet: ${dashboard.nodePublicSourceFitFirstBlockedPacketId}`,
  `- Write allowed now: ${dashboard.writeAllowedNow}`,
  "",
  "## Summary Gates",
  "",
  "| Gate | Status | Internal ready | Learner release | Evidence | Next gate |",
  "| --- | --- | --- | --- | --- | --- |",
  ...summaryGates.map((gate) => `| ${gate.id} | ${gate.status} | ${gate.passedForInternalReview} | ${gate.learnerReleaseGatePassed} | ${gate.evidence} | ${gate.nextGate} |`),
  "",
  "## Module Gates",
  "",
  "| Module | Path | Local ready | Public ready | Wikipedia ready | High-risk blockers | P0 blocked | Gate |",
  "| --- | --- | --- | --- | --- | ---: | ---: | --- |",
  ...moduleGateRows.map((row) => `| ${row.module} | ${row.coursePathId} | ${row.readyForRewriteReview}/${row.learnerFacingNodes} | ${row.publicReferenceReady} | ${row.wikipediaGroundingReady} | ${row.highRiskReleaseBlockers} | ${row.p0BlockedTasks} | ${row.reviewGateStatus} |`),
  "",
  "## Next Actions",
  "",
  ...nextActionRows.map((row) => `${row.order}. ${row.id}: ${row.status} / ${row.command}`),
  "",
  "## Completion Rule",
  "",
  dashboard.completionRule,
  "",
  "## Boundary",
  "",
  dashboard.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: dashboard.educationOnly,
  productionReady: dashboard.productionReady,
  learnerFacingRelease: dashboard.learnerFacingRelease,
  approvalStatus: dashboard.approvalStatus,
  dashboardStatus: dashboard.dashboardStatus,
  modules: dashboard.modules,
  researchLayerReadyModules: dashboard.researchLayerReadyModules,
  modulesWithWikipediaGrounding: dashboard.modulesWithWikipediaGrounding,
  highRiskLessons: dashboard.highRiskLessons,
  p0Tasks: dashboard.p0Tasks,
  p0BlockedTasks: dashboard.p0BlockedTasks,
  sourceFitBlockedRows: dashboard.sourceFitBlockedRows,
  nodePublicSourceFitBlockedRows: dashboard.nodePublicSourceFitBlockedRows,
  nodePublicSourceFitReadyPackets: dashboard.nodePublicSourceFitReadyPackets,
  nodePublicSourceFitBlockedPackets: dashboard.nodePublicSourceFitBlockedPackets,
  nodePublicSourceFitOverallProgressPercent: dashboard.nodePublicSourceFitOverallProgressPercent,
  nodePublicSourceFitFirstBlockedPacketId: dashboard.nodePublicSourceFitFirstBlockedPacketId,
  realHumanInputEntries: dashboard.realHumanInputEntries,
  writeAllowedNow: dashboard.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
