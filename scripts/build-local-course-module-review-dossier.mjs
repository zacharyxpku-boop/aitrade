import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const outputJson = "docs/LOCAL_COURSE_MODULE_REVIEW_DOSSIER.json";
const outputMd = "docs/LOCAL_COURSE_MODULE_REVIEW_DOSSIER.md";

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

const { knowledgeBrowserIndex } = require("../education-knowledge-browser-index.js");

const selfAudit = readJson("docs/LOCAL_COURSE_MODULE_ABSORPTION_SELF_AUDIT.json");
const publicGap = readJson("docs/PUBLIC_SOURCE_GAP_AUDIT.json");
const highRiskGrounding = readJson("docs/LOCAL_COURSE_HIGH_RISK_PUBLIC_GROUNDING_MATRIX.json");
const p0SourceFitHandoff = readJson("docs/LOCAL_COURSE_P0_REAL_REVIEWER_SOURCE_FIT_HANDOFF.json");
const writePreview = readJson("docs/LOCAL_COURSE_P0_WRITE_AUTHORIZATION_PREVIEW.json");

for (const [label, artifact] of Object.entries({ selfAudit, publicGap, highRiskGrounding, p0SourceFitHandoff, writePreview })) {
  if (artifact.educationOnly !== true) fail(`${label} must keep educationOnly:true`);
  if (artifact.productionReady !== false) fail(`${label} must keep productionReady:false`);
}

const browserModuleByTitle = new Map((knowledgeBrowserIndex.modules || []).map((row) => [row.title, row]));
const browserModuleOrderByTitle = new Map((knowledgeBrowserIndex.modules || []).map((row, index) => [row.title, index]));
const publicByModule = new Map((publicGap.moduleRows || []).map((row) => [row.module, row]));
const highRiskLessonsByModule = countBy(highRiskGrounding.lessonRows || [], (row) => row.module);
const highRiskReleaseBlockersByModule = countBy(
  (highRiskGrounding.lessonRows || []).filter((row) => row.releaseBlocker === true),
  (row) => row.module,
);
const directSourceRowsByModule = countBy(highRiskGrounding.directSourceRows || [], (row) => row.module);
const highRiskLessonRowsByModule = new Map();
for (const lesson of highRiskGrounding.lessonRows || []) {
  if (!highRiskLessonRowsByModule.has(lesson.module)) highRiskLessonRowsByModule.set(lesson.module, []);
  highRiskLessonRowsByModule.get(lesson.module).push(lesson);
}

const moduleRows = (selfAudit.moduleRows || []).map((row) => {
  const browserModule = browserModuleByTitle.get(row.module) || {};
  const moduleIndex = browserModuleOrderByTitle.get(row.module) ?? 0;
  const publicRow = publicByModule.get(row.module) || {};
  const highRiskLessons = highRiskLessonsByModule.get(row.module) || 0;
  const highRiskReleaseBlockers = highRiskReleaseBlockersByModule.get(row.module) || 0;
  const directSourceCandidates = directSourceRowsByModule.get(row.module) || 0;
  const highRiskLessonPreview = (highRiskLessonRowsByModule.get(row.module) || []).slice(0, 4).map((lesson) => ({
    candidateId: lesson.candidateId,
    nodeId: lesson.nodeId,
    lessonId: lesson.lessonId,
    topic: lesson.topic,
    publicGroundingStatus: lesson.publicGroundingStatus,
    wikipediaRefCount: (lesson.wikipediaRefs || []).length,
    publicContextRefCount: (lesson.publicContextRefs || []).length,
    selectedPublicRefCount: lesson.selectedPublicRefCount || 0,
    learnerCitationApproved: lesson.learnerCitationApproved === true,
    learnerFacingRelease: lesson.learnerFacingRelease === true,
    approvalStatus: lesson.approvalStatus,
    releaseBlocker: lesson.releaseBlocker === true,
    nextGate: lesson.nextGate,
    firstWikipediaRefs: (lesson.wikipediaRefs || []).slice(0, 2).map((ref) => ({
      name: ref.name,
      url: ref.url,
      excerptPolicy: ref.excerptPolicy,
    })),
    firstPublicContextRefs: (lesson.publicContextRefs || []).slice(0, 2).map((ref) => ({
      name: ref.name,
      url: ref.url,
      excerptPolicy: ref.excerptPolicy,
    })),
  }));
  const publicEvidenceSamples = (publicRow.evidenceSamples || []).slice(0, 3).map((sample) => ({
    documentId: sample.documentId,
    sourceId: sample.sourceId,
    name: sample.name,
    url: sample.url,
    family: sample.family,
    tier: sample.tier,
    excerptPolicy: sample.excerptPolicy,
  }));
  const coursePath = {
    pathId: `path_${moduleIndex + 1}`,
    lessonCount: browserModule.learnerFacingNodes || row.learnerFacingNodes || 0,
    unitCount: Math.ceil((browserModule.learnerFacingNodes || row.learnerFacingNodes || 0) / 10),
    estimatedMinutes: (browserModule.learnerFacingNodes || row.learnerFacingNodes || 0) * 8,
    entryLessonId: browserModule.entryNodeIds?.[0] ? `lesson_${browserModule.entryNodeIds[0]}` : "",
    finalLessonId: "",
  };
  const reviewStatus = highRiskReleaseBlockers > 0
    ? "module_review_ready_high_risk_release_blocked"
    : "module_review_ready_refinement_blocked";
  return {
    moduleId: row.moduleId,
    browserModuleId: browserModule.id || row.moduleId,
    module: row.module,
    expectedDomain: row.expectedDomain,
    topics: browserModule.topics || [],
    entryNodeIds: browserModule.entryNodeIds || [],
    learnerFacingNodes: row.learnerFacingNodes,
    localCourseDocuments: row.localCourseDocuments,
    nodesWithLocalCourseMatches: row.nodesWithLocalCourseMatches,
    readyForRewriteReview: row.readyForRewriteReview,
    localCoverageRate: row.localCoverageRate,
    publicEvidenceDocs: row.publicEvidenceDocs,
    wikipediaEvidenceDocs: row.wikipediaEvidenceDocs,
    officialLikeEvidenceDocs: row.officialLikeEvidenceDocs,
    uniqueHosts: row.uniqueHosts,
    publicEvidenceSamples,
    coursePath,
    rewriteDrafts: row.rewriteDrafts,
    localResearchReady: row.localResearchReady,
    publicReferenceReady: row.publicReferenceReady,
    rewriteDraftReady: row.rewriteDraftReady,
    researchLayerStatus: row.researchLayerStatus,
    highRiskLessons,
    highRiskReleaseBlockers,
    highRiskLessonPreview,
    directSourceCandidates,
    learnerReleaseReady: false,
    reviewStatus,
    nextReviewerAction: highRiskReleaseBlockers > 0
      ? "review high-risk public grounding, source-fit notes, originality, and separate release approval"
      : "review rewrite drafts, source-fit notes, originality, and separate release approval",
    boundary: "Reviewer-facing module dossier only; public evidence samples are grounding candidates, not learner-facing citation approval or trading guidance.",
  };
});

const rowsWithCoursePath = moduleRows.filter((row) => row.coursePath.pathId && row.coursePath.lessonCount > 0).length;
const rowsWithPublicEvidenceSamples = moduleRows.filter((row) => row.publicEvidenceSamples.length >= 3).length;
const rowsWithEntryNodes = moduleRows.filter((row) => row.entryNodeIds.length > 0).length;
const rowsWithHighRiskBlockers = moduleRows.filter((row) => row.highRiskReleaseBlockers > 0).length;
const highRiskPreviewRows = moduleRows.reduce((sum, row) => sum + row.highRiskLessonPreview.length, 0);
const learnerReleaseReadyModules = moduleRows.filter((row) => row.learnerReleaseReady === true).length;

const dossier = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  dossierStatus: "module_review_dossier_ready_for_internal_navigation_release_blocked",
  dossierMode: "module_browser_packet_for_local_course_absorption_review",
  sourceRoot: selfAudit.sourceRoot,
  modules: moduleRows.length,
  researchLayerReadyModules: selfAudit.researchLayerReadyModules,
  rowsWithCoursePath,
  rowsWithPublicEvidenceSamples,
  rowsWithEntryNodes,
  rowsWithHighRiskBlockers,
  highRiskPreviewRows,
  highRiskPreviewReleaseBlockers: moduleRows.reduce(
    (sum, row) => sum + row.highRiskLessonPreview.filter((lesson) => lesson.releaseBlocker === true).length,
    0,
  ),
  highRiskPreviewLearnerCitationApproved: moduleRows.reduce(
    (sum, row) => sum + row.highRiskLessonPreview.filter((lesson) => lesson.learnerCitationApproved === true).length,
    0,
  ),
  learnerReleaseReadyModules,
  localCourseDocuments: selfAudit.localCourseDocuments,
  localCourseChunks: selfAudit.localCourseChunks,
  matchedKnowledgeNodes: selfAudit.matchedKnowledgeNodes,
  readyForRewriteReviewNodes: selfAudit.readyForRewriteReviewNodes,
  publicCorpusDocuments: selfAudit.publicCorpusDocuments,
  wikipediaDocuments: selfAudit.wikipediaDocuments,
  officialLikeDocuments: selfAudit.officialLikeDocuments,
  curriculumPaths: knowledgeBrowserIndex.modules.length,
  totalPathLessons: (knowledgeBrowserIndex.modules || []).reduce((sum, row) => sum + (row.learnerFacingNodes || 0), 0),
  p0SourceFitHandoffStatus: p0SourceFitHandoff.handoffStatus,
  p0SourceFitRealReadyRows: p0SourceFitHandoff.sourceFitRealReadyRows,
  p0SourceFitRealBlockedRows: p0SourceFitHandoff.sourceFitRealBlockedRows,
  p0SourceFitFixtureReadyRows: p0SourceFitHandoff.sourceFitFixtureReadyRows,
  writeAuthorizationStatus: writePreview.previewStatus,
  writeAllowedNow: false,
  realHumanInputEntries: selfAudit.realHumanInputEntries,
  manualAuthorizationRequired: true,
  globalReleaseBlockers: selfAudit.releaseBlockers || [],
  moduleRows,
  commands: [
    "npm.cmd run check:local-course-module-review-dossier",
    "npm.cmd run check:local-course-module-absorption-self-audit",
    "npm.cmd run check:local-course-p0-real-reviewer-source-fit-handoff",
    "npm.cmd run check:local-course-p0-write-authorization-preview",
  ],
  completionRule: "This dossier proves module-level internal navigation readiness for reviewer work only. It does not prove learner-facing release, real source-fit review completion, or write authorization.",
  boundary: "Module review dossier is reviewer-facing education-only governance. It combines local private course coverage, public/Wikipedia grounding candidates, curriculum paths, and review gates; it does not make private PDFs public citations, approve learner-facing release, provide stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(dossier, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Local Course Module Review Dossier",
  "",
  "This is the internal module browser packet for local-course absorption review. It keeps research-layer readiness separate from learner-facing release.",
  "",
  `- Dossier status: ${dossier.dossierStatus}`,
  `- Modules: ${dossier.modules}`,
  `- Research-layer-ready modules: ${dossier.researchLayerReadyModules}/${dossier.modules}`,
  `- Rows with course path: ${dossier.rowsWithCoursePath}/${dossier.modules}`,
  `- Rows with public evidence samples: ${dossier.rowsWithPublicEvidenceSamples}/${dossier.modules}`,
  `- Rows with entry nodes: ${dossier.rowsWithEntryNodes}/${dossier.modules}`,
  `- High-risk blocker modules: ${dossier.rowsWithHighRiskBlockers}`,
  `- High-risk lesson previews: ${dossier.highRiskPreviewRows}`,
  `- P0 source-fit real ready/blocked: ${dossier.p0SourceFitRealReadyRows}/${dossier.p0SourceFitRealBlockedRows}`,
  `- Write allowed now: ${dossier.writeAllowedNow}`,
  "",
  "## Module Rows",
  "",
  "| Module | Path | Entry nodes | Local nodes | Public samples | Wikipedia | High-risk previews | High-risk blockers | Review status |",
  "|---|---|---:|---:|---:|---:|---:|---:|---|",
  ...moduleRows.map((row) => `| ${row.module} | ${row.coursePath.pathId} | ${row.entryNodeIds.length} | ${row.readyForRewriteReview}/${row.learnerFacingNodes} | ${row.publicEvidenceSamples.length} | ${row.wikipediaEvidenceDocs} | ${row.highRiskLessonPreview.length} | ${row.highRiskReleaseBlockers} | ${row.reviewStatus} |`),
  "",
  "## Global Release Blockers",
  "",
  ...dossier.globalReleaseBlockers.map((row) => `- ${row.id}: ${row.count} (${row.status}) -> ${row.nextGate}`),
  "",
  "## Boundary",
  "",
  dossier.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: dossier.educationOnly,
  productionReady: dossier.productionReady,
  learnerFacingRelease: dossier.learnerFacingRelease,
  approvalStatus: dossier.approvalStatus,
  dossierStatus: dossier.dossierStatus,
  modules: dossier.modules,
  researchLayerReadyModules: dossier.researchLayerReadyModules,
  rowsWithCoursePath: dossier.rowsWithCoursePath,
  rowsWithPublicEvidenceSamples: dossier.rowsWithPublicEvidenceSamples,
  highRiskPreviewRows: dossier.highRiskPreviewRows,
  p0SourceFitRealReadyRows: dossier.p0SourceFitRealReadyRows,
  p0SourceFitRealBlockedRows: dossier.p0SourceFitRealBlockedRows,
  writeAllowedNow: dossier.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
