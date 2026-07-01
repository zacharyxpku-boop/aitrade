import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { knowledgeBrowserIndex } = require("../education-knowledge-browser-index.js");

function readJson(path) {
  if (!fs.existsSync(path)) throw new Error(`missing ${path}`);
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const readinessGate = readJson("docs/KNOWLEDGE_BASE_READINESS_GATE.json");
const releaseBlockerAudit = readJson("docs/KNOWLEDGE_RELEASE_BLOCKER_AUDIT.json");
const coursePathAudit = readJson("docs/KNOWLEDGE_COURSE_PATH_READINESS_AUDIT.json");
const localFolderLedger = readJson("docs/LOCAL_COURSE_FOLDER_ABSORPTION_LEDGER.json");
const localMultiFolderAudit = readJson("docs/LOCAL_COURSE_MULTI_FOLDER_ABSORPTION_AUDIT.json");
const course5Knowledge = readJson("docs/LOCAL_COURSE_5_FOLLOWUP_KNOWLEDGE_NODES.json");
const videoCoverage = readJson("docs/LOCAL_VIDEO_COURSE_COVERAGE_AUDIT.json");
const videoCandidates = readJson("docs/LOCAL_VIDEO_COURSE_KNOWLEDGE_NODE_CANDIDATES.json");
const publicCoverage = readJson("docs/PUBLIC_SOURCE_COVERAGE_LEDGER.json");
const moduleCockpit = readJson("docs/KNOWLEDGE_MODULE_REVIEW_COCKPIT.json");
const sprintPlan = readJson("docs/KNOWLEDGE_MODULE_REVIEW_SPRINT_PLAN.json");

const course5ToCanonical = {
  chart_pattern_encyclopedia: ["图表阅读基础", "K线与价格行为"],
  trends_and_channels: ["趋势", "市场结构"],
  reversals: ["反转"],
  terminology_glossary: ["图表阅读基础"],
  trading_ranges: ["交易区间"],
  bar_by_bar_reading: ["K线与价格行为", "图表阅读基础"],
  course_slides_alignment: ["图表阅读基础"],
  breakouts_and_pullbacks: ["突破", "趋势"],
  price_action_foundations: ["图表阅读基础", "市场结构"],
  unclassified_supplement: ["图表阅读基础"],
  trade_management: ["风险管理"],
};

const publicModuleByName = new Map((publicCoverage.moduleRows || []).map((row) => [row.module, row]));
const course5ByCanonical = new Map();
for (const row of course5Knowledge.moduleSummary || []) {
  for (const canonical of course5ToCanonical[row.moduleId] || ["图表阅读基础"]) {
    if (!course5ByCanonical.has(canonical)) course5ByCanonical.set(canonical, []);
    course5ByCanonical.get(canonical).push(row);
  }
}

function statusForModule(module) {
  const publicRow = publicModuleByName.get(module.title);
  const course5Rows = course5ByCanonical.get(module.title) || [];
  const sourceFitRows = publicRow?.reviewRows || 0;
  const blockedRows = publicRow?.blockedReviewRows || 0;
  const course5Seeds = course5Rows.reduce((sum, row) => sum + (row.lessonSeedRows || 0), 0);
  const course5Evidence = course5Rows.reduce((sum, row) => sum + (row.aiAbsorbedRows || 0), 0);
  const internalTeachable = module.learnerFacingNodes >= 30 && module.entryNodeIds.length > 0;
  return {
    moduleId: module.id,
    module: module.title,
    existingKnowledgeNodes: module.totalNodes,
    reviewedSourceBackedCandidateLessons: module.learnerFacingNodes,
    draftKnowledgeNodes: module.draftNodes,
    topicCount: module.topics.length,
    sampleTopics: module.topics.slice(0, 8),
    subtopicCount: (module.subtopicCatalog || []).length,
    entryNodeIds: module.entryNodeIds,
    publicGroundedNodes: publicRow?.moduleGroundedNodes || 0,
    publicEvidenceDocuments: publicRow?.matchedPublicDocs || 0,
    wikipediaEvidenceDocuments: publicRow?.wikipediaEvidenceDocs || 0,
    officialLikeEvidenceDocuments: publicRow?.officialLikeEvidenceDocs || 0,
    sourceFitReviewRows: sourceFitRows,
    blockedSourceFitReviewRows: blockedRows,
    course5SupplementModules: course5Rows.map((row) => ({
      moduleId: row.moduleId,
      moduleLabel: row.moduleLabel,
      aiAbsorbedRows: row.aiAbsorbedRows,
      lessonSeedRows: row.lessonSeedRows,
    })),
    course5SupplementEvidenceRows: course5Evidence,
    course5SupplementLessonSeeds: course5Seeds,
    teachableModuleStatus: internalTeachable ? "internal_modular_teaching_design_ready" : "module_shell_needs_more_structure",
    learnerReleaseStatus: "blocked_until_source_fit_originality_and_real_review_complete",
    suggestedCourseUnit: [
      "概念边界与术语",
      "图表/案例观察",
      "常见误区与反例",
      "多周期或语境核对",
      "练习任务与评分规则",
      "来源证据与发布前审核",
    ],
    nextReviewAction: blockedRows > 0
      ? "review source-fit rows and rewrite original learner-facing lesson text"
      : "keep as internal review module until release gate changes",
  };
}

const canonicalTeachingModules = knowledgeBrowserIndex.modules.map(statusForModule);

const course5StandaloneModules = (course5Knowledge.moduleSummary || []).map((row) => ({
  moduleId: row.moduleId,
  moduleLabel: row.moduleLabel,
  alignedCanonicalModules: course5ToCanonical[row.moduleId] || ["图表阅读基础"],
  aiAbsorbedRows: row.aiAbsorbedRows,
  lessonSeedRows: row.lessonSeedRows,
  representativeInputRows: row.representativeInputRows,
  teachableUse: "private supplemental lesson seed and evidence cluster",
  learnerReleaseStatus: "blocked_until_public_grounding_original_rewrite_and_review",
}));

const sourceLayers = [
  {
    layerId: "local_desktop_pdf_folders",
    label: "Desktop local PDF folders",
    status: localMultiFolderAudit.auditStatus || localFolderLedger.ledgerStatus,
    sourceCount: localMultiFolderAudit.contentCoveredPhysicalPdfFiles,
    uniqueContentCount: localMultiFolderAudit.uniquePdfHashes,
    knowledgeUse: "private source evidence and rewrite review grounding",
    teachability: "supports all 12 canonical modules after source-fit review",
  },
  {
    layerId: "course_5_followup_folder_5",
    label: "Course 5 follow-up folder 5",
    status: course5Knowledge.status,
    sourceCount: course5Knowledge.sourceRows,
    uniqueContentCount: course5Knowledge.internalKnowledgeNodeRows,
    knowledgeUse: "internal supplemental Course 5 module nodes",
    teachability: "36 internal knowledge nodes across 11 supplement modules",
  },
  {
    layerId: "local_video_courses",
    label: "Local video courses",
    status: videoCoverage.auditStatus,
    sourceCount: videoCoverage.sourceVideos,
    uniqueContentCount: videoCandidates.candidateRows,
    knowledgeUse: "transcript-derived candidate concepts and review queue",
    teachability: "150 candidate knowledge points require module fit and review before release",
  },
  {
    layerId: "public_sources",
    label: "Public / Wikipedia / official-like sources",
    status: publicCoverage.ledgerStatus,
    sourceCount: publicCoverage.publicCorpusDocuments,
    uniqueContentCount: publicCoverage.moduleGroundedNodes,
    knowledgeUse: "source grounding, citation candidates, and safety boundary evidence",
    teachability: "grounds 360 candidate lessons but source-fit rows remain blocked",
  },
  {
    layerId: "knowledge_browser_curriculum",
    label: "Knowledge Browser curriculum",
    status: coursePathAudit.auditStatus,
    sourceCount: coursePathAudit.totalLessons,
    uniqueContentCount: coursePathAudit.coursePaths,
    knowledgeUse: "canonical internal course path and module navigation",
    teachability: "12 internal course paths, 360 candidate lessons, learner release blocked",
  },
];

const artifact = {
  generatedAt: "2026-06-26T00:00:00.000+08:00",
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  auditStatus: "knowledge_sedimentation_teachable_module_audit_complete_internal_release_blocked",
  knowledgeBaseUsefulnessStatus: readinessGate.knowledgeBaseUsefulnessStatus,
  overallJudgment:
    "The knowledge base has enough structure for internal modular course design: local documents, public grounding, video transcripts, and Course 5 follow-up nodes are all represented. It is not yet approved as learner-facing course content.",
  totals: {
    canonicalTeachingModules: canonicalTeachingModules.length,
    existingKnowledgeNodesV2: knowledgeBrowserIndex.qualitySummary.knowledgeNodesV2,
    reviewedSourceBackedCandidateLessons: knowledgeBrowserIndex.learnerFacingNodes.length,
    coursePaths: coursePathAudit.coursePaths,
    localPhysicalPdfFiles: localFolderLedger.physicalPdfFiles,
    localCoveredPhysicalPdfFiles: localMultiFolderAudit.contentCoveredPhysicalPdfFiles,
    localUniquePdfHashes: localMultiFolderAudit.uniquePdfHashes,
    course5InternalKnowledgeNodes: course5Knowledge.internalKnowledgeNodeRows,
    course5SupplementModules: course5Knowledge.moduleRows,
    videoSemanticAbsorbedRows: videoCoverage.semanticAbsorbedRows,
    videoCandidateKnowledgePoints: videoCandidates.candidateRows,
    publicCorpusDocuments: publicCoverage.publicCorpusDocuments,
    wikipediaDocuments: publicCoverage.wikipediaDocuments,
    officialLikeDocuments: publicCoverage.officialLikeDocuments,
    publicModuleGroundedNodes: publicCoverage.moduleGroundedNodes,
    sourceFitReviewRows: publicCoverage.sourceFitReviewRows,
    blockedSourceFitReviewRows: publicCoverage.blockedSourceFitReviewRows,
    realHumanInputEntries: readinessGate.realHumanInputEntries,
    learnerReleaseReadyModules: moduleCockpit.learnerReleaseReadyModules,
    internalNavigationReadyModules: moduleCockpit.internalNavigationReadyModules,
  },
  sourceLayers,
  canonicalTeachingModules,
  course5StandaloneModules,
  videoKnowledgeLayer: {
    status: videoCandidates.candidateStatus,
    sourceVideos: videoCandidates.sourceVideos,
    semanticAbsorbedRows: videoCandidates.semanticAbsorbedRows,
    candidateRows: videoCandidates.candidateRows,
    uniqueConcepts: videoCandidates.uniqueConcepts,
    p0CandidateRows: videoCandidates.p0CandidateRows,
    nextAction: "map video candidate concepts into the canonical 12-module teaching audit and review high-risk P0 concepts first",
  },
  reviewAudit: {
    internalWorkbenchReady: releaseBlockerAudit.internalWorkbenchReady,
    publicSourcesAbsorbed: releaseBlockerAudit.publicSourcesAbsorbed,
    localCourseAbsorbed: releaseBlockerAudit.localCourseAbsorbed,
    learnerReleaseBlocked: releaseBlockerAudit.learnerReleaseBlocked,
    totalReviewerActions: sprintPlan.totalReviewerActions,
    totalBlockedWorkItems: sprintPlan.totalBlockedWorkItems,
    sourceFitReviewRows: readinessGate.sourceFitReviewRows,
    highRiskBlockedReviewerNotes: readinessGate.highRiskBlockedReviewerNotes,
    realHumanInputEntries: readinessGate.realHumanInputEntries,
  },
  nextModuleizationActions: [
    "Use the 12 canonical teaching modules as the top-level curriculum taxonomy.",
    "Attach Course 5 supplement nodes to matching canonical modules as private lesson examples.",
    "Map video course candidate concepts into the same 12-module taxonomy.",
    "For each module, turn internal nodes into lesson drafts only after public grounding and originality rewrite.",
    "Keep learner-facing release blocked until source-fit review rows and high-risk reviewer notes are resolved.",
  ],
  boundary:
    "This is an internal education knowledge-management audit. It classifies and modularizes knowledge for curriculum design only. It does not approve learner-facing publication, stock recommendations, live signals, return promises, broker workflows, automation, or real-money guidance.",
};

fs.writeFileSync("docs/KNOWLEDGE_SEDIMENTATION_TEACHABLE_MODULE_AUDIT.json", `${JSON.stringify(artifact, null, 2)}\n`);

const moduleRows = canonicalTeachingModules.map((row) =>
  `| ${row.module} | ${row.reviewedSourceBackedCandidateLessons} | ${row.course5SupplementLessonSeeds} | ${row.publicEvidenceDocuments} | ${row.teachableModuleStatus} | ${row.learnerReleaseStatus} |`,
).join("\n");

const layerRows = sourceLayers.map((row) =>
  `| ${row.label} | ${row.sourceCount} | ${row.uniqueContentCount} | ${row.teachability} |`,
).join("\n");

fs.writeFileSync(
  "docs/KNOWLEDGE_SEDIMENTATION_TEACHABLE_MODULE_AUDIT.md",
  `# Knowledge Sedimentation Teachable Module Audit\n\n` +
    `- Status: ${artifact.auditStatus}\n` +
    `- Overall: ${artifact.overallJudgment}\n` +
    `- Canonical teaching modules: ${artifact.totals.canonicalTeachingModules}\n` +
    `- Candidate lessons: ${artifact.totals.reviewedSourceBackedCandidateLessons}\n` +
    `- Course 5 internal nodes: ${artifact.totals.course5InternalKnowledgeNodes}\n` +
    `- Video candidate points: ${artifact.totals.videoCandidateKnowledgePoints}\n` +
    `- Public documents: ${artifact.totals.publicCorpusDocuments}\n` +
    `- Learner release ready modules: ${artifact.totals.learnerReleaseReadyModules}\n\n` +
    `## Source Layers\n\n| Layer | Source count | Knowledge count | Teachability |\n|---|---:|---:|---|\n${layerRows}\n\n` +
    `## Canonical Modules\n\n| Module | Candidate lessons | Course 5 seeds | Public docs | Internal status | Release status |\n|---|---:|---:|---:|---|---|\n${moduleRows}\n\n` +
    `## Next Actions\n\n${artifact.nextModuleizationActions.map((item) => `- ${item}`).join("\n")}\n\n` +
    `${artifact.boundary}\n`,
);

console.log(JSON.stringify({
  ok: true,
  auditStatus: artifact.auditStatus,
  canonicalTeachingModules: artifact.totals.canonicalTeachingModules,
  reviewedSourceBackedCandidateLessons: artifact.totals.reviewedSourceBackedCandidateLessons,
  course5InternalKnowledgeNodes: artifact.totals.course5InternalKnowledgeNodes,
  videoCandidateKnowledgePoints: artifact.totals.videoCandidateKnowledgePoints,
  publicCorpusDocuments: artifact.totals.publicCorpusDocuments,
  learnerReleaseReadyModules: artifact.totals.learnerReleaseReadyModules,
}, null, 2));
