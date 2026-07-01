import fs from "node:fs";

const moduleCockpitPath = "docs/KNOWLEDGE_MODULE_REVIEW_COCKPIT.json";
const releaseBlockerAuditPath = "docs/KNOWLEDGE_RELEASE_BLOCKER_AUDIT.json";
const progressMatrixPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEW_PROGRESS_MATRIX.json";
const outputJsonPath = "docs/KNOWLEDGE_COURSE_PATH_READINESS_AUDIT.json";
const outputMdPath = "docs/KNOWLEDGE_COURSE_PATH_READINESS_AUDIT.md";

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

const moduleCockpit = readJson(moduleCockpitPath);
const releaseBlockerAudit = readJson(releaseBlockerAuditPath);
const progressMatrix = readJson(progressMatrixPath);
assertBoundary("moduleCockpit", moduleCockpit);
assertBoundary("releaseBlockerAudit", releaseBlockerAudit);
assertBoundary("progressMatrix", progressMatrix);

const progressByModule = new Map((progressMatrix.moduleRows || []).map((row) => [row.module, row]));

const pathRows = (moduleCockpit.moduleRows || []).map((moduleRow, index) => {
  const path = moduleRow.coursePath || {};
  const progress = progressByModule.get(moduleRow.module) || {};
  const internalPathReady = Boolean(
    (path.id || path.pathId) &&
    (path.lessonCount || 0) > 0 &&
    moduleRow.localCoverageRate === 1 &&
    moduleRow.readyForRewriteReview === moduleRow.learnerFacingNodes,
  );
  const learnerPathReleaseReady = false;
  const blockedReasons = [];
  if ((progress.blockedRows ?? moduleRow.blockedSourceFitRows ?? 0) > 0) blockedReasons.push("source_fit_review_rows_blocked");
  if ((moduleRow.highRiskBlockedLessons || 0) > 0) blockedReasons.push("high_risk_lessons_blocked");
  if ((moduleRow.blockedHighRiskNotes || 0) > 0) blockedReasons.push("high_risk_reviewer_notes_blocked");
  if ((moduleRow.directSourceDecisions || 0) > (moduleRow.readyDirectSourceDecisions || 0)) blockedReasons.push("direct_source_decisions_blocked");
  blockedReasons.push("separate_learner_release_approval_missing");

  return {
    order: index + 1,
    moduleId: moduleRow.moduleId,
    browserModuleId: moduleRow.browserModuleId,
    module: moduleRow.module,
    pathId: path.id || path.pathId || "",
    prerequisitePathIds: path.prerequisitePathIds || [],
    nextPathId: path.nextPathId || "",
    lessonCount: path.lessonCount || 0,
    unitCount: path.unitCount || 0,
    estimatedMinutes: path.estimatedMinutes || 0,
    entryLessonId: path.entryLessonId || "",
    finalLessonId: path.finalLessonId || "",
    localCourseDocuments: moduleRow.localCourseDocuments || 0,
    learnerFacingNodes: moduleRow.learnerFacingNodes || 0,
    nodesWithLocalCourseMatches: moduleRow.nodesWithLocalCourseMatches || 0,
    localCoverageRate: moduleRow.localCoverageRate || 0,
    publicEvidenceDocs: moduleRow.publicEvidenceDocs || 0,
    wikipediaEvidenceDocs: moduleRow.wikipediaEvidenceDocs || 0,
    officialLikeEvidenceDocs: moduleRow.officialLikeEvidenceDocs || 0,
    sourceFitRows: progress.reviewRows ?? moduleRow.sourceFitRows ?? 0,
    readySourceFitRows: progress.readyRows ?? moduleRow.readySourceFitRows ?? 0,
    blockedSourceFitRows: progress.blockedRows ?? moduleRow.blockedSourceFitRows ?? 0,
    firstBlockedPacketId: progress.firstBlockedPacketId || moduleRow.firstBlockedPacketId || "",
    highRiskBlockedLessons: moduleRow.highRiskBlockedLessons || 0,
    blockedHighRiskNotes: moduleRow.blockedHighRiskNotes || 0,
    directSourceDecisions: moduleRow.directSourceDecisions || 0,
    readyDirectSourceDecisions: moduleRow.readyDirectSourceDecisions || 0,
    internalPathReady,
    learnerPathReleaseReady,
    realHumanInputEntries: 0,
    learnerFacingRelease: false,
    writeAllowedNow: false,
    reviewStatus: internalPathReady
      ? "course_path_internal_navigation_ready_release_blocked"
      : "course_path_internal_navigation_attention_required",
    blockedReasons,
    nextReviewerAction: moduleRow.nextReviewerAction || "fill source-fit rows, high-risk notes, and release approval gates",
  };
});

const audit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  auditStatus: "course_path_readiness_audit_ready_release_blocked",
  auditMode: "module_course_paths_internal_ready_learner_release_blocked",
  releaseBlockerAuditStatus: releaseBlockerAudit.auditStatus,
  knowledgeBaseUsefulnessStatus: moduleCockpit.knowledgeBaseUsefulnessStatus,
  modules: pathRows.length,
  coursePaths: pathRows.length,
  internalReadyPaths: pathRows.filter((row) => row.internalPathReady).length,
  learnerReleaseReadyPaths: pathRows.filter((row) => row.learnerPathReleaseReady).length,
  blockedLearnerReleasePaths: pathRows.filter((row) => !row.learnerPathReleaseReady).length,
  totalLessons: pathRows.reduce((sum, row) => sum + row.lessonCount, 0),
  totalUnits: pathRows.reduce((sum, row) => sum + row.unitCount, 0),
  totalEstimatedMinutes: pathRows.reduce((sum, row) => sum + row.estimatedMinutes, 0),
  nodesWithLocalCourseMatches: pathRows.reduce((sum, row) => sum + row.nodesWithLocalCourseMatches, 0),
  learnerFacingNodes: pathRows.reduce((sum, row) => sum + row.learnerFacingNodes, 0),
  sourceFitReviewRows: pathRows.reduce((sum, row) => sum + row.sourceFitRows, 0),
  readySourceFitReviewRows: pathRows.reduce((sum, row) => sum + row.readySourceFitRows, 0),
  blockedSourceFitReviewRows: pathRows.reduce((sum, row) => sum + row.blockedSourceFitRows, 0),
  highRiskBlockedLessons: pathRows.reduce((sum, row) => sum + row.highRiskBlockedLessons, 0),
  highRiskBlockedReviewerNotes: pathRows.reduce((sum, row) => sum + row.blockedHighRiskNotes, 0),
  directSourceDecisions: pathRows.reduce((sum, row) => sum + row.directSourceDecisions, 0),
  readyDirectSourceDecisions: pathRows.reduce((sum, row) => sum + row.readyDirectSourceDecisions, 0),
  realHumanInputEntries: 0,
  learnerCitationApprovedRows: 0,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  pathRows,
  nextBestActions: [
    "Use this audit as the course-path-level navigation layer for reviewer planning.",
    "Start with modules that have high-risk blocked lessons, then continue source-fit packet review module by module.",
    "Rerun this audit after real reviewer input changes progress matrix, high-risk notes, or direct-source decisions.",
    "Do not expose any path as learner-release ready until separate release approval passes.",
  ],
  commands: [
    "npm.cmd run build:knowledge-course-path-readiness-audit",
    "npm.cmd run check:knowledge-course-path-readiness-audit",
    "npm.cmd run check:knowledge-module-review-cockpit",
    "npm.cmd run check:knowledge-release-blocker-audit",
    "npm.cmd run check:knowledge-node-public-source-fit-review-progress-matrix",
    "npm.cmd run verify",
  ],
  completionRule: "This course path readiness audit is complete when all 12 course paths are represented with module coverage, curriculum sequence, internal navigation status, source-fit blockers, high-risk blockers, direct-source blockers, and next reviewer action. It does not approve learner-facing release or replace real human review.",
  boundary: "Knowledge course path readiness audit is reviewer-facing education-only governance. It organizes absorbed local investment course material and public/Wikipedia/official source context into internal course-path readiness rows; it does not generate reviewer notes, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, write authorization, learner release, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Knowledge Course Path Readiness Audit",
  "",
  `- Audit status: ${audit.auditStatus}`,
  `- Internal ready paths: ${audit.internalReadyPaths}/${audit.coursePaths}`,
  `- Learner-release ready paths: ${audit.learnerReleaseReadyPaths}/${audit.coursePaths}`,
  `- Lessons: ${audit.totalLessons}`,
  `- Units: ${audit.totalUnits}`,
  `- Estimated minutes: ${audit.totalEstimatedMinutes}`,
  `- Source-fit rows ready/blocked: ${audit.readySourceFitReviewRows}/${audit.blockedSourceFitReviewRows}`,
  `- High-risk blocked lessons: ${audit.highRiskBlockedLessons}`,
  `- High-risk blocked reviewer notes: ${audit.highRiskBlockedReviewerNotes}`,
  `- Direct-source decisions ready/total: ${audit.readyDirectSourceDecisions}/${audit.directSourceDecisions}`,
  `- Real human input entries: ${audit.realHumanInputEntries}`,
  `- Write allowed now: ${audit.writeAllowedNow}`,
  "",
  "## Path Rows",
  "",
  "| Path | Module | Lessons | Units | Local | Source-fit ready/blocked | High-risk | Direct | Status | Next |",
  "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |",
  ...pathRows.map((row) => `| ${row.pathId} | ${row.module} | ${row.lessonCount} | ${row.unitCount} | ${row.nodesWithLocalCourseMatches}/${row.learnerFacingNodes} | ${row.readySourceFitRows}/${row.blockedSourceFitRows} | ${row.highRiskBlockedLessons} | ${row.readyDirectSourceDecisions}/${row.directSourceDecisions} | ${row.reviewStatus} | ${row.nextReviewerAction} |`),
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
  coursePaths: audit.coursePaths,
  internalReadyPaths: audit.internalReadyPaths,
  learnerReleaseReadyPaths: audit.learnerReleaseReadyPaths,
  totalLessons: audit.totalLessons,
  sourceFitReviewRows: audit.sourceFitReviewRows,
  blockedSourceFitReviewRows: audit.blockedSourceFitReviewRows,
  highRiskBlockedReviewerNotes: audit.highRiskBlockedReviewerNotes,
  realHumanInputEntries: audit.realHumanInputEntries,
  writeAllowedNow: audit.writeAllowedNow,
}, null, 2));
