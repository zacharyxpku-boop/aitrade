import fs from "node:fs";

const outputJson = "docs/LOCAL_COURSE_MODULE_ABSORPTION_SELF_AUDIT.json";
const outputMd = "docs/LOCAL_COURSE_MODULE_ABSORPTION_SELF_AUDIT.md";

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function countBy(rows, keyFn) {
  const result = new Map();
  for (const row of rows || []) {
    const key = keyFn(row);
    if (!key) continue;
    result.set(key, (result.get(key) || 0) + 1);
  }
  return result;
}

const coverage = readJson("docs/LOCAL_COURSE_KNOWLEDGE_COVERAGE.json");
const readiness = readJson("docs/LOCAL_COURSE_ABSORPTION_READINESS_AUDIT.json");
const publicGap = readJson("docs/PUBLIC_SOURCE_GAP_AUDIT.json");
const rewriteReview = readJson("docs/LOCAL_COURSE_REWRITE_REVIEW_REPORT.json");
const sourceQuality = readJson("docs/LOCAL_COURSE_SOURCE_QUALITY_AUDIT.json");
const highRiskSelfReview = readJson("docs/LOCAL_COURSE_HIGH_RISK_SELF_REVIEW_OVERLAY.json");
const highRiskGrounding = readJson("docs/LOCAL_COURSE_HIGH_RISK_PUBLIC_GROUNDING_MATRIX.json");
const p0Bundle = readJson("docs/LOCAL_COURSE_P0_HUMAN_REVIEW_BUNDLE.json");
const realReviewerHandoff = readJson("docs/LOCAL_COURSE_P0_HUMAN_REVIEW_REAL_REVIEWER_HANDOFF.json");

const publicByModule = new Map((publicGap.moduleRows || []).map((row) => [row.module, row]));
const highRiskLessonsByModule = countBy(highRiskGrounding.lessonRows || [], (row) => row.module);
const highRiskReleaseBlockersByModule = countBy(
  (highRiskGrounding.lessonRows || []).filter((row) => row.releaseBlocker === true),
  (row) => row.module,
);
const directSourceByModule = countBy(highRiskGrounding.directSourceRows || [], (row) => row.module);

const moduleRows = (coverage.moduleCoverage || []).map((row) => {
  const publicRow = publicByModule.get(row.module) || {};
  const rewriteDrafts = rewriteReview.moduleCounts?.[row.module] || 0;
  const localResearchReady = row.coverageRate === 1 && row.readyForRewriteReview === row.learnerFacingNodes;
  const publicReferenceReady = publicRow.readinessStatus === "public_reference_ready_for_reviewer";
  const rewriteDraftReady = rewriteDrafts >= 10;
  const highRiskLessons = highRiskLessonsByModule.get(row.module) || 0;
  const highRiskReleaseBlockers = highRiskReleaseBlockersByModule.get(row.module) || 0;
  const directSourceCandidates = directSourceByModule.get(row.module) || 0;
  const researchLayerStatus = localResearchReady && publicReferenceReady && rewriteDraftReady
    ? "research_layer_absorbed_pending_review"
    : "research_layer_needs_attention";
  return {
    moduleId: row.moduleId,
    module: row.module,
    expectedDomain: row.expectedDomain,
    learnerFacingNodes: row.learnerFacingNodes,
    localCourseDocuments: row.localCourseDocuments,
    nodesWithLocalCourseMatches: row.nodesWithLocalCourseMatches,
    readyForRewriteReview: row.readyForRewriteReview,
    localCoverageRate: row.coverageRate,
    publicEvidenceDocs: publicRow.matchedPublicDocs || 0,
    wikipediaEvidenceDocs: publicRow.wikipediaEvidenceDocs || 0,
    officialLikeEvidenceDocs: publicRow.officialLikeEvidenceDocs || 0,
    uniqueHosts: publicRow.uniqueHosts || 0,
    publicReferenceReady,
    rewriteDrafts,
    highRiskLessons,
    highRiskReleaseBlockers,
    directSourceCandidates,
    localResearchReady,
    rewriteDraftReady,
    researchLayerStatus,
    releaseGateStatus: "blocked_pending_human_review_and_separate_approval",
    nextGate: highRiskReleaseBlockers > 0
      ? "human_public_grounding_review_originality_review_then_release_gate"
      : "module_ready_for_reviewer_refinement_not_release",
  };
});

const modules = moduleRows.length;
const researchLayerReadyModules = moduleRows.filter((row) => row.researchLayerStatus === "research_layer_absorbed_pending_review").length;
const publicReferenceReadyModules = moduleRows.filter((row) => row.publicReferenceReady).length;
const localResearchReadyModules = moduleRows.filter((row) => row.localResearchReady).length;
const rewriteDraftReadyModules = moduleRows.filter((row) => row.rewriteDraftReady).length;
const modulesWithHighRiskReleaseBlockers = moduleRows.filter((row) => row.highRiskReleaseBlockers > 0).length;

const audit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  auditStatus: "module_research_layer_absorbed_release_blocked",
  courseUsabilityStatus: "usable_for_internal_reviewer_navigation_not_learner_release",
  sourceRoot: coverage.sourceRoot || readiness.sourceRoot,
  modules,
  researchLayerReadyModules,
  localResearchReadyModules,
  publicReferenceReadyModules,
  rewriteDraftReadyModules,
  modulesWithHighRiskReleaseBlockers,
  localCourseDocuments: coverage.documents,
  localCourseChunks: coverage.chunks,
  importedUniquePdfFiles: readiness.importedUniquePdfFiles,
  uniquePdfFiles: readiness.uniquePdfFiles,
  matchedKnowledgeNodes: readiness.matchedKnowledgeNodes,
  readyForRewriteReviewNodes: readiness.readyForRewriteReviewNodes,
  publicCorpusDocuments: publicGap.publicCorpusDocuments,
  wikipediaDocuments: publicGap.wikipediaDocuments,
  officialLikeDocuments: publicGap.officialLikeDocuments,
  rewriteDrafts: rewriteReview.draftsReviewed,
  rewriteCandidatesReadyForSeparateReview: rewriteReview.readyForSeparateReviewCandidates,
  copyRiskIssues: rewriteReview.copyRiskIssues,
  safetyIssues: rewriteReview.safetyIssues,
  lowExtractionDocs: sourceQuality.lowExtractionDocs,
  riskyLanguageDocs: sourceQuality.forbiddenLanguageDocs,
  manualTranscriptionPages: readiness.manualTranscriptionPages,
  sourceReplacementCandidates: readiness.sourceReplacementCandidates,
  acceptedTranscriptPages: readiness.acceptedTranscriptPages,
  p0ReviewEntries: p0Bundle.totalReviewEntries,
  p0ValidationBlockedEntries: p0Bundle.validationBlockedEntries,
  realHumanInputEntries: realReviewerHandoff.realHumanInputEntries,
  highRiskLessonCount: highRiskGrounding.lessonCount,
  highRiskLessonsWithPublicGrounding: highRiskGrounding.lessonsWithPublicGrounding,
  highRiskReleaseBlockingLessons: highRiskGrounding.releaseBlockingLessons,
  highRiskCodexSelfReviewNotes: highRiskSelfReview.reviewerNotesReviewed,
  highRiskExpectedSelfReviewNotes: highRiskSelfReview.expectedReviewerNotes,
  directSourceCandidateResolutions: highRiskGrounding.directSourceCandidateResolutionsMapped,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  releaseBlockers: [
    {
      id: "p0_real_human_review_missing",
      count: realReviewerHandoff.totalReviewEntries - realReviewerHandoff.realHumanInputEntries,
      status: "blocked",
      nextGate: "fill_real_reviewer_input_copy_then_validate_lint_and_dry_run",
    },
    {
      id: "manual_transcription_pages",
      count: readiness.manualTranscriptionPages,
      status: "blocked",
      nextGate: "human_transcription_then_source_fit_public_grounding_originality_review",
    },
    {
      id: "source_replacement_candidates",
      count: readiness.sourceReplacementCandidates,
      status: "blocked",
      nextGate: "reviewer_selects_replacement_or_unrecoverable_marker_then_rerun_audits",
    },
    {
      id: "high_risk_release_blocking_lessons",
      count: highRiskGrounding.releaseBlockingLessons,
      status: "blocked",
      nextGate: "human_public_grounding_review_then_separate_release_approval",
    },
    {
      id: "reviewer_refinement_candidates",
      count: readiness.reviewerCandidates,
      status: "blocked",
      nextGate: "reviewer_refinement_and_separate_approval",
    },
  ],
  moduleRows,
  completionRule: "Module absorption is complete only for the internal research/reviewer layer when every module has local course matches, public/Wikipedia grounding, and rewrite candidates. Learner-facing course release remains blocked until real human P0 review, transcription/replacement, source-fit, public-grounding, originality, and separate approval gates pass.",
  boundary: "Module absorption self-audit is reviewer-facing education-only governance. It does not approve learner-facing release, does not make private PDFs public citations, does not provide stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Local Course Module Absorption Self-Audit",
  "",
  "This is a module-level self-audit for internal reviewer work. It separates research-layer absorption from learner-facing release.",
  "",
  `- Audit status: ${audit.auditStatus}`,
  `- Course usability: ${audit.courseUsabilityStatus}`,
  `- Modules research-layer ready: ${researchLayerReadyModules}/${modules}`,
  `- Local PDFs imported: ${audit.importedUniquePdfFiles}/${audit.uniquePdfFiles}`,
  `- Public-reference-ready modules: ${publicReferenceReadyModules}/${modules}`,
  `- Rewrite drafts reviewed: ${audit.rewriteDrafts}`,
  `- P0 review entries blocked: ${audit.p0ValidationBlockedEntries}/${audit.p0ReviewEntries}`,
  `- Real human input entries: ${audit.realHumanInputEntries}`,
  `- High-risk release-blocking lessons: ${audit.highRiskReleaseBlockingLessons}/${audit.highRiskLessonCount}`,
  `- Write allowed now: ${audit.writeAllowedNow}`,
  "",
  "## Module Rows",
  "",
  "| Module | Local nodes | Public docs | Wikipedia | Rewrite drafts | High-risk blockers | Research layer |",
  "|---|---:|---:|---:|---:|---:|---|",
  ...moduleRows.map((row) => `| ${row.module} | ${row.readyForRewriteReview}/${row.learnerFacingNodes} | ${row.publicEvidenceDocs} | ${row.wikipediaEvidenceDocs} | ${row.rewriteDrafts} | ${row.highRiskReleaseBlockers} | ${row.researchLayerStatus} |`),
  "",
  "## Release Blockers",
  "",
  ...audit.releaseBlockers.map((row) => `- ${row.id}: ${row.count} (${row.status}) -> ${row.nextGate}`),
  "",
  "## Boundary",
  "",
  audit.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: audit.educationOnly,
  productionReady: audit.productionReady,
  learnerFacingRelease: audit.learnerFacingRelease,
  approvalStatus: audit.approvalStatus,
  auditStatus: audit.auditStatus,
  modules,
  researchLayerReadyModules,
  publicReferenceReadyModules,
  realHumanInputEntries: audit.realHumanInputEntries,
  writeAllowedNow: audit.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
