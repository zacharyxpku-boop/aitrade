import fs from "node:fs";

const dossierPath = "docs/LOCAL_COURSE_MODULE_REVIEW_DOSSIER.json";
const publicLedgerPath = "docs/PUBLIC_SOURCE_COVERAGE_LEDGER.json";
const workbenchIndexPath = "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEWER_WORKBENCH_INDEX.json";
const highRiskCockpitPath = "docs/LOCAL_COURSE_HIGH_RISK_REVIEW_COCKPIT.json";
const readinessGatePath = "docs/KNOWLEDGE_BASE_READINESS_GATE.json";
const outputJsonPath = "docs/KNOWLEDGE_MODULE_REVIEW_COCKPIT.json";
const outputMdPath = "docs/KNOWLEDGE_MODULE_REVIEW_COCKPIT.md";

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

function byModule(rows = []) {
  return new Map(rows.map((row) => [row.module, row]));
}

const dossier = readJson(dossierPath);
const publicLedger = readJson(publicLedgerPath);
const workbenchIndex = readJson(workbenchIndexPath);
const highRiskCockpit = readJson(highRiskCockpitPath);
const readinessGate = readJson(readinessGatePath);

for (const [name, artifact] of Object.entries({
  dossier,
  publicLedger,
  workbenchIndex,
  highRiskCockpit,
  readinessGate,
})) {
  assertBoundary(name, artifact);
}

const publicByModule = byModule(publicLedger.moduleRows);
const workbenchByModule = byModule(workbenchIndex.moduleRows);
const highRiskByModule = byModule(highRiskCockpit.moduleRows);

const moduleRows = (dossier.moduleRows || []).map((row, index) => {
  const publicRow = publicByModule.get(row.module) || {};
  const workbenchRow = workbenchByModule.get(row.module) || {};
  const highRiskRow = highRiskByModule.get(row.module) || {};
  const sourceFitRows = workbenchRow.reviewRows ?? publicRow.reviewRows ?? 0;
  const readySourceFitRows = workbenchRow.readyRows ?? publicRow.readyReviewRows ?? 0;
  const blockedSourceFitRows = workbenchRow.blockedRows ?? publicRow.blockedReviewRows ?? sourceFitRows;
  const requiredHighRiskNotes = highRiskRow.requiredReviewerNotes || 0;
  const readyHighRiskNotes = highRiskRow.readyReviewerNotes || 0;
  const directSourceDecisions = highRiskRow.directSourceDecisions || row.directSourceCandidates || 0;
  const readyDirectSourceDecisions = highRiskRow.readyDirectSourceDecisions || 0;
  const learnerBlocked =
    row.learnerReleaseReady !== true ||
    readySourceFitRows !== sourceFitRows ||
    readyHighRiskNotes !== requiredHighRiskNotes ||
    readyDirectSourceDecisions !== directSourceDecisions;
  return {
    order: index + 1,
    moduleId: row.moduleId,
    browserModuleId: row.browserModuleId,
    module: row.module,
    expectedDomain: row.expectedDomain,
    topics: row.topics || [],
    coursePath: row.coursePath,
    entryNodeIds: row.entryNodeIds || [],
    learnerFacingNodes: row.learnerFacingNodes,
    localCourseDocuments: row.localCourseDocuments,
    nodesWithLocalCourseMatches: row.nodesWithLocalCourseMatches,
    readyForRewriteReview: row.readyForRewriteReview,
    localCoverageRate: row.localCoverageRate,
    publicEvidenceDocs: row.publicEvidenceDocs,
    wikipediaEvidenceDocs: row.wikipediaEvidenceDocs,
    officialLikeEvidenceDocs: row.officialLikeEvidenceDocs,
    uniqueHosts: row.uniqueHosts,
    directTriangulatedNodes: publicRow.directTriangulatedNodes || 0,
    nodesNeedingDirectTriangulation: publicRow.nodesNeedingDirectTriangulation || 0,
    sourceFitPackets: workbenchRow.packets || 0,
    sourceFitTargetNodes: workbenchRow.targetNodes || 0,
    sourceFitRows,
    readySourceFitRows,
    blockedSourceFitRows,
    firstBlockedPacketId: workbenchRow.firstBlockedPacketId || "",
    highRiskLessons: highRiskRow.lessons || row.highRiskLessons || 0,
    highRiskBlockedLessons: row.highRiskReleaseBlockers || 0,
    requiredHighRiskNotes,
    readyHighRiskNotes,
    blockedHighRiskNotes: highRiskRow.blockedReviewerNotes || 0,
    directSourceDecisions,
    readyDirectSourceDecisions,
    publicEvidenceSamples: (row.publicEvidenceSamples || []).slice(0, 3),
    highRiskLessonPreview: (row.highRiskLessonPreview || []).slice(0, 2),
    reviewStatus: learnerBlocked
      ? "module_internal_navigation_ready_learner_release_blocked"
      : "module_release_candidate_pending_manual_authorization",
    internalNavigationReady: row.localResearchReady === true &&
      row.publicReferenceReady === true &&
      row.rewriteDraftReady === true &&
      row.coursePath?.lessonCount === 30 &&
      (row.entryNodeIds || []).length > 0,
    learnerFacingRelease: false,
    writeAllowedNow: false,
    realHumanInputEntries: (workbenchRow.realHumanInputEntries || 0) + (highRiskRow.realHumanInputEntries || 0),
    nextReviewerAction: learnerBlocked
      ? [
          sourceFitRows ? `fill source-fit packet rows starting at ${workbenchRow.firstBlockedPacketId || "module packet queue"}` : "",
          requiredHighRiskNotes ? "fill high-risk real reviewer notes and direct-source decisions" : "",
          "review originality, citation use, and separate exact-path release approval",
        ].filter(Boolean).join("; ")
      : "run manual exact-path release authorization preview",
    boundary: "Reviewer-facing module cockpit row only. Local private PDFs and public source samples support review navigation; they are not learner-facing citation approval or trading guidance.",
  };
});

const cockpit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  cockpitStatus: "module_review_cockpit_ready_release_blocked",
  cockpitMode: "module_to_nodes_sources_course_path_review_status_navigation",
  sourceRoot: dossier.sourceRoot,
  modules: moduleRows.length,
  internalNavigationReadyModules: moduleRows.filter((row) => row.internalNavigationReady).length,
  learnerReleaseReadyModules: moduleRows.filter((row) => row.learnerFacingRelease === true).length,
  localCourseDocuments: dossier.localCourseDocuments,
  localCourseChunks: dossier.localCourseChunks,
  matchedKnowledgeNodes: dossier.matchedKnowledgeNodes,
  readyForRewriteReviewNodes: dossier.readyForRewriteReviewNodes,
  publicCorpusDocuments: publicLedger.publicCorpusDocuments,
  wikipediaDocuments: publicLedger.wikipediaDocuments,
  officialLikeDocuments: publicLedger.officialLikeDocuments,
  sourceFitReviewRows: workbenchIndex.totalReviewRows,
  readySourceFitReviewRows: workbenchIndex.readyRows,
  blockedSourceFitReviewRows: workbenchIndex.blockedRows,
  highRiskLessons: highRiskCockpit.lessonCount,
  highRiskReadyReviewerNotes: highRiskCockpit.readyReviewerNotes,
  highRiskBlockedReviewerNotes: highRiskCockpit.blockedReviewerNotes,
  realHumanInputEntries: moduleRows.reduce((sum, row) => sum + (row.realHumanInputEntries || 0), 0),
  readinessStatus: readinessGate.readinessStatus,
  knowledgeBaseUsefulnessStatus: readinessGate.knowledgeBaseUsefulnessStatus,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  moduleRows,
  priorityModuleRows: [...moduleRows]
    .sort((left, right) =>
      (right.highRiskBlockedLessons - left.highRiskBlockedLessons) ||
      (right.blockedSourceFitRows - left.blockedSourceFitRows) ||
      (right.wikipediaEvidenceDocs - left.wikipediaEvidenceDocs))
    .slice(0, 6)
    .map((row) => ({
      module: row.module,
      highRiskBlockedLessons: row.highRiskBlockedLessons,
      blockedSourceFitRows: row.blockedSourceFitRows,
      firstBlockedPacketId: row.firstBlockedPacketId,
      nextReviewerAction: row.nextReviewerAction,
    })),
  commands: [
    "npm.cmd run build:knowledge-module-review-cockpit",
    "npm.cmd run check:knowledge-module-review-cockpit",
    "npm.cmd run check:knowledge-base-readiness-gate",
    "npm.cmd run verify",
  ],
  completionRule: "This cockpit is complete when every module exposes local course coverage, public/Wikipedia/official grounding, course path, entry nodes, source-fit packet state, high-risk blockers, and the next reviewer action in one navigation layer. It does not complete real human review or learner-facing release.",
  boundary: "Knowledge module review cockpit is reviewer-facing education-only navigation. It modularizes the absorbed local investment course and public/Wikipedia/official materials for review; it does not generate real reviewer notes, approve copied text, approve learner-facing citations, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.writeFileSync(outputJsonPath, `${JSON.stringify(cockpit, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMdPath, [
  "# Knowledge Module Review Cockpit",
  "",
  `- Cockpit status: ${cockpit.cockpitStatus}`,
  `- Modules: ${cockpit.internalNavigationReadyModules}/${cockpit.modules} internal navigation ready`,
  `- Learner-release ready modules: ${cockpit.learnerReleaseReadyModules}/${cockpit.modules}`,
  `- Local course documents: ${cockpit.localCourseDocuments}`,
  `- Public docs: ${cockpit.publicCorpusDocuments} (${cockpit.wikipediaDocuments} Wikipedia, ${cockpit.officialLikeDocuments} official-like)`,
  `- Source-fit rows ready: ${cockpit.readySourceFitReviewRows}/${cockpit.sourceFitReviewRows}`,
  `- High-risk notes ready: ${cockpit.highRiskReadyReviewerNotes}/${cockpit.highRiskReadyReviewerNotes + cockpit.highRiskBlockedReviewerNotes}`,
  `- Real human input entries: ${cockpit.realHumanInputEntries}`,
  `- Write allowed now: ${cockpit.writeAllowedNow}`,
  "",
  "## Module Rows",
  "",
  "| Module | Local docs | Nodes | Public docs | Wikipedia | Source-fit ready | High-risk blockers | First packet | Next action |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |",
  ...moduleRows.map((row) => `| ${row.module} | ${row.localCourseDocuments} | ${row.learnerFacingNodes} | ${row.publicEvidenceDocs} | ${row.wikipediaEvidenceDocs} | ${row.readySourceFitRows}/${row.sourceFitRows} | ${row.highRiskBlockedLessons} | ${row.firstBlockedPacketId || "n/a"} | ${row.nextReviewerAction} |`),
  "",
  "## Boundary",
  "",
  cockpit.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  cockpitStatus: cockpit.cockpitStatus,
  modules: cockpit.modules,
  internalNavigationReadyModules: cockpit.internalNavigationReadyModules,
  learnerReleaseReadyModules: cockpit.learnerReleaseReadyModules,
  sourceFitReviewRows: cockpit.sourceFitReviewRows,
  readySourceFitReviewRows: cockpit.readySourceFitReviewRows,
  highRiskReadyReviewerNotes: cockpit.highRiskReadyReviewerNotes,
  realHumanInputEntries: cockpit.realHumanInputEntries,
  writeAllowedNow: cockpit.writeAllowedNow,
}, null, 2));
