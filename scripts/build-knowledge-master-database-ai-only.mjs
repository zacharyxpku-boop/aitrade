import fs from "node:fs";

const OUT_JSON = "docs/KNOWLEDGE_MASTER_DATABASE_AI_ONLY.json";
const OUT_MD = "docs/KNOWLEDGE_MASTER_DATABASE_AI_ONLY.md";
const OUT_JS = "education-master-knowledge-database.js";

const PATHS = {
  teachingPackages: "docs/KNOWLEDGE_INTERNAL_TEACHING_PACKAGES.json",
  precheck: "docs/KNOWLEDGE_AI_ONLY_TEACHING_PRECHECK.json",
  sedimentationAudit: "docs/KNOWLEDGE_SEDIMENTATION_TEACHABLE_MODULE_AUDIT.json",
  course5Nodes: "docs/LOCAL_COURSE_5_FOLLOWUP_KNOWLEDGE_NODES.json",
  videoCandidates: "docs/LOCAL_VIDEO_COURSE_KNOWLEDGE_NODE_CANDIDATES.json",
  publicLedger: "docs/PUBLIC_SOURCE_COVERAGE_LEDGER.json",
  publicAbsorptionMap: "docs/PUBLIC_SOURCE_ABSORPTION_MAP.json",
};

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function slug(value, fallback) {
  const out = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return out || fallback;
}

function text(value, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").trim();
}

function short(value, fallback = "", limit = 280) {
  const out = text(value, fallback);
  return out.length > limit ? `${out.slice(0, limit - 3)}...` : out;
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = row[key] || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function compactPublicSource(source) {
  return {
    id: source.documentId || source.sourceId || source.id,
    sourceId: source.sourceId || source.id,
    title: source.name || source.title || source.url || "public source",
    url: source.url || "",
    family: source.family || source.sourceFamily || source.sourceType || "public_source",
    module: source.module || source.bestModule || source.mappedModule || "",
    useTier: source.sourceUseTier || source.useTier || "",
    evidenceUse: "source grounding, taxonomy support, and citation candidate only; not content reuse approval",
    releaseStatus: "blocked_until_source_fit_review",
  };
}

function publicSourceRows(publicLedger) {
  const candidates = [
    publicLedger.documentRows,
    publicLedger.corpusDocuments,
    publicLedger.publicDocumentRows,
    publicLedger.publicDocuments,
    publicLedger.sourceRows,
    publicLedger.documentRows,
  ].find(Array.isArray) || [];
  return candidates.map(compactPublicSource);
}

function moduleKey(module) {
  return slug(module, `module-${String(module || "").length}`);
}

function qualityForModule({ module, sourceRows, courseNodes, videoRows, packageRow }) {
  const normalizedSourceRows = sourceRows.map((row) => ({
    ...row,
    normalizedSourceFitCategory: row.aiSourceFitCategory || row.category || "unknown",
  }));
  const counts = countBy(normalizedSourceRows, "normalizedSourceFitCategory");
  const likely = counts.likely_good || 0;
  const rewrite = counts.needs_rewrite || 0;
  const weak = counts.weak_source_fit || 0;
  const highRisk = counts.high_risk || 0;
  const evidenceScore = Math.min(35, likely * 1.1 + sourceRows.length * 0.5);
  const privateScore = Math.min(20, courseNodes.length * 2 + videoRows.length);
  const teachingScore = packageRow ? Math.min(25, packageRow.lessonOutlines.length * 4 + packageRow.quizItemCount * 0.35 + packageRow.practiceItemCount * 0.35) : 0;
  const penalty = highRisk * 0.2 + weak * 0.45 + rewrite * 0.25;
  const aiOnlyScore = Math.max(0, Math.min(100, Math.round(evidenceScore + privateScore + teachingScore + 20 - penalty)));
  const releaseRisk = highRisk > 0 ? "high_release_risk" : weak > 0 || rewrite > 0 ? "review_required_release_risk" : "lower_release_risk";
  return {
    module,
    aiOnlyScore,
    releaseRisk,
    sourceFitCounts: counts,
    coverageSignals: {
      sourceFitRows: sourceRows.length,
      course5Nodes: courseNodes.length,
      videoCandidates: videoRows.length,
      lessonOutlines: packageRow?.lessonOutlines?.length || 0,
      quizItems: packageRow?.quizItemCount || 0,
      practiceItems: packageRow?.practiceItemCount || 0,
    },
    aiOnlyUse: aiOnlyScore >= 70 ? "strong_internal_database_module" : aiOnlyScore >= 45 ? "usable_internal_module_with_known_gaps" : "thin_internal_module_needs_more_grounding",
    learnerRelease: false,
    approvalStatus: "not_approved",
    nextAiOnlyUpgrade: highRisk > 0
      ? "Generate safer internal examples and risk-language alternatives without approving release."
      : weak > 0
        ? "Prioritize source triangulation and clearer source-role labels."
        : "Convert more internal examples into structured practice and assessment cards.",
  };
}

function buildModuleRecord({ module, index, teachingPackage, precheck, course5, videos }) {
  const sourceRows = precheck.sourceFitPrecheckRows.filter((row) => row.module === module);
  const courseNodes = (course5.internalKnowledgeNodes || []).filter((row) => (
    row.mappedCanonicalModule === module || row.module === module || row.canonicalModule === module
  ));
  const videoRows = (videos.candidates || []).filter((row) => (
    row.mappedModule === module || row.canonicalModule === module || row.module === module
  ));
  const quality = qualityForModule({ module, sourceRows, courseNodes, videoRows, packageRow: teachingPackage });
  return {
    moduleId: `master_module_${moduleKey(module)}`,
    module,
    sequence: index + 1,
    databaseLayer: "module_master_record",
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    writeAllowedNow: false,
    quality,
    teachingPackageId: teachingPackage?.packageId || "",
    coreConcepts: teachingPackage?.moduleOverview?.coreConcepts || [],
    lessons: (teachingPackage?.lessonOutlines || []).map((lesson) => lesson.lessonId),
    sourceFitNodeIds: sourceRows.map((row) => row.nodeId),
    course5NodeIds: courseNodes.map((row) => row.nodeId || row.sourceNodeId || row.id).filter(Boolean),
    videoCandidateIds: videoRows.map((row) => row.candidateId || row.id).filter(Boolean),
    retrievalTags: [
      module,
      ...(teachingPackage?.moduleOverview?.coreConcepts || []),
      quality.releaseRisk,
      quality.aiOnlyUse,
    ].filter(Boolean),
    boundary: "AI-only internal master module record. It organizes education knowledge but does not approve learner-facing release.",
  };
}

function searchCard({ id, type, title, module, summary, tags, qualityScore = 0, releaseStatus = "internal_only_not_approved" }) {
  return {
    id,
    type,
    title: short(title, id, 120),
    module: module || "",
    summary: short(summary, "Internal education database card.", 260),
    tags: [...new Set((tags || []).filter(Boolean).map(String))].slice(0, 12),
    qualityScore,
    releaseStatus,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
  };
}

function buildMarkdown(db) {
  const moduleRows = db.masterModules.map((row) => (
    `| ${row.module} | ${row.quality.aiOnlyScore} | ${row.quality.aiOnlyUse} | ${row.quality.releaseRisk} | ${row.quality.coverageSignals.sourceFitRows} | ${row.quality.coverageSignals.course5Nodes} | ${row.quality.coverageSignals.videoCandidates} |`
  ));
  return `# Knowledge Master Database AI-only

- Status: ${db.databaseStatus}
- Master modules: ${db.totals.masterModules}
- Knowledge entities: ${db.totals.knowledgeEntities}
- Relationship edges: ${db.totals.relationshipEdges}
- Retrieval cards: ${db.totals.retrievalCards}
- Public source cards: ${db.totals.publicSourceCards}
- Internal teaching packages: ${db.totals.internalTeachingPackages}
- Learner-facing release: ${db.learnerFacingRelease}
- Approval status: ${db.approvalStatus}

## Module Quality

| Module | AI-only score | Internal use | Release risk | Source-fit | Course 5 | Video |
|---|---:|---|---|---:|---:|---:|
${moduleRows.join("\n")}

## Database Layers

${db.databaseLayers.map((layer) => `- ${layer.layer}: ${layer.count} rows / ${layer.use}`).join("\n")}

## Boundary

${db.boundary}
`;
}

const teachingPackages = readJson(PATHS.teachingPackages);
const precheck = readJson(PATHS.precheck);
const sedimentationAudit = readJson(PATHS.sedimentationAudit);
const course5 = readJson(PATHS.course5Nodes);
const videos = readJson(PATHS.videoCandidates);
const publicLedger = readJson(PATHS.publicLedger);
const publicAbsorptionMap = readJson(PATHS.publicAbsorptionMap);

const packageByModule = new Map(teachingPackages.moduleTeachingPackages.map((pkg) => [pkg.module, pkg]));
const modules = teachingPackages.moduleTeachingPackages.map((pkg) => pkg.module);
const publicSources = publicSourceRows(publicAbsorptionMap).length
  ? publicSourceRows(publicAbsorptionMap)
  : publicSourceRows(publicLedger);

const masterModules = modules.map((module, index) => buildModuleRecord({
  module,
  index,
  teachingPackage: packageByModule.get(module),
  precheck,
  course5,
  videos,
}));

const sourceFitCards = precheck.sourceFitPrecheckRows.map((row) => searchCard({
  id: `source_fit_${row.nodeId}`,
  type: "source_fit_precheck_node",
  title: row.title || row.topic || row.nodeId,
  module: row.module,
  summary: `${row.aiSourceFitCategory || row.category || "source_fit_unknown"}: ${row.aiNextAction || row.aiAllowedNextStep || row.nextAction || "Keep internal until reviewed."}`,
  tags: [row.module, row.aiSourceFitCategory || row.category, row.difficulty, "source_fit_precheck"],
  qualityScore: (row.aiSourceFitCategory || row.category) === "likely_good" ? 78 : (row.aiSourceFitCategory || row.category) === "needs_rewrite" ? 58 : (row.aiSourceFitCategory || row.category) === "weak_source_fit" ? 42 : 34,
  releaseStatus: "blocked_until_real_source_fit_review",
}));

const course5Cards = (course5.internalKnowledgeNodes || []).map((row) => searchCard({
  id: `course5_${row.nodeId || row.id}`,
  type: "course5_internal_node",
  title: row.title || row.concept || row.nodeId || row.id,
  module: row.mappedCanonicalModule || row.module || row.canonicalModule,
  summary: row.teachingUse || row.conceptExplanationDraft || row.summary || "Course 5 internal knowledge node.",
  tags: [row.module, row.mappedCanonicalModule, "course5", "private_source"],
  qualityScore: 55,
  releaseStatus: "private_source_internal_only",
}));

const videoCards = (videos.candidates || []).map((row) => searchCard({
  id: `video_${row.candidateId || row.id}`,
  type: "video_semantic_candidate",
  title: row.concept || row.title || row.candidateId || row.id,
  module: row.mappedModule || row.canonicalModule || row.module,
  summary: row.teachingUse || row.summary || row.evidenceSummary || "Video transcript-derived internal candidate.",
  tags: [row.mappedModule, row.priority, "video", "transcript"],
  qualityScore: row.priority === "P0" ? 52 : 48,
  releaseStatus: "transcript_grounding_required",
}));

const lessonCards = teachingPackages.lessonOutlines.map((lesson) => searchCard({
  id: `lesson_${lesson.lessonId}`,
  type: "lesson_outline",
  title: lesson.title,
  module: lesson.module,
  summary: lesson.conceptExplanation,
  tags: [lesson.module, "lesson_outline", "practice", "quiz"],
  qualityScore: 72,
  releaseStatus: "internal_course_design_only",
}));

const publicSourceCards = publicSources.map((source) => searchCard({
  id: `public_${source.id}`,
  type: "public_source_card",
  title: source.title,
  module: source.module,
  summary: `${source.family}: ${source.evidenceUse}`,
  tags: [source.family, source.module, "public_source"],
  qualityScore: source.url ? 65 : 45,
  releaseStatus: source.releaseStatus,
}));

const retrievalCards = [
  ...masterModules.map((row) => searchCard({
    id: row.moduleId,
    type: "master_module",
    title: row.module,
    module: row.module,
    summary: `${row.quality.aiOnlyUse}; ${row.quality.releaseRisk}; ${row.quality.coverageSignals.sourceFitRows} source-fit rows.`,
    tags: row.retrievalTags,
    qualityScore: row.quality.aiOnlyScore,
    releaseStatus: "internal_master_module_not_approved",
  })),
  ...lessonCards,
  ...sourceFitCards,
  ...course5Cards,
  ...videoCards,
  ...publicSourceCards,
];

const relationshipEdges = [
  ...teachingPackages.globalCourseGraph.edges.map((edge, index) => ({
    edgeId: `course_dep_${String(index + 1).padStart(2, "0")}`,
    from: `master_module_${moduleKey(edge.from)}`,
    to: `master_module_${moduleKey(edge.to)}`,
    relation: "DEPENDS_ON",
    evidence: edge.rationale || "internal course graph",
  })),
  ...teachingPackages.lessonOutlines.map((lesson) => ({
    edgeId: `module_has_lesson_${lesson.lessonId}`,
    from: `master_module_${moduleKey(lesson.module)}`,
    to: lesson.lessonId,
    relation: "HAS_LESSON",
    evidence: "internal teaching package",
  })),
  ...precheck.sourceFitPrecheckRows.map((row) => ({
    edgeId: `module_has_source_fit_${row.nodeId}`,
    from: `master_module_${moduleKey(row.module)}`,
    to: row.nodeId,
    relation: "HAS_SOURCE_FIT_PRECHECK",
    evidence: row.aiSourceFitCategory || row.category || "source-fit precheck",
  })),
  ...course5Cards.map((card) => ({
    edgeId: `module_has_course5_${card.id}`,
    from: `master_module_${moduleKey(card.module)}`,
    to: card.id,
    relation: "HAS_PRIVATE_COURSE_SUPPLEMENT",
    evidence: "Course 5 internal knowledge node",
  })),
  ...videoCards.map((card) => ({
    edgeId: `module_has_video_${card.id}`,
    from: `master_module_${moduleKey(card.module)}`,
    to: card.id,
    relation: "HAS_VIDEO_SEMANTIC_CANDIDATE",
    evidence: "local video semantic absorption",
  })),
];

const databaseLayers = [
  { layer: "masterModules", count: masterModules.length, use: "module-level AI-only internal database records and quality routing" },
  { layer: "lessonOutlines", count: teachingPackages.lessonOutlines.length, use: "internal lesson design and sequencing" },
  { layer: "quizAndPracticeItems", count: teachingPackages.quizAndPracticeItems.length, use: "internal assessment and practice generation" },
  { layer: "sourceFitPrecheckRows", count: precheck.sourceFitPrecheckRows.length, use: "AI source-fit triage, not approval" },
  { layer: "course5InternalKnowledgeNodes", count: course5.internalKnowledgeNodeRows || course5Cards.length, use: "private source-derived internal supplements" },
  { layer: "videoSemanticCandidates", count: videos.candidateRows || videoCards.length, use: "transcript-derived concept candidates" },
  { layer: "publicSourceCards", count: publicSourceCards.length, use: "public source pointers and grounding candidates" },
  { layer: "relationshipEdges", count: relationshipEdges.length, use: "knowledge graph navigation and dependency tracing" },
  { layer: "retrievalCards", count: retrievalCards.length, use: "unified search and AI retrieval routing" },
];

const artifact = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  databaseStatus: "ai_only_master_knowledge_database_ready_internal_release_blocked",
  databaseMode: "AI-only unified internal knowledge database; no new web fetch and no human review claims.",
  sourceArtifacts: PATHS,
  totals: {
    canonicalModules: modules.length,
    masterModules: masterModules.length,
    knowledgeEntities: masterModules.length + teachingPackages.lessonOutlines.length + teachingPackages.quizAndPracticeItems.length + precheck.sourceFitPrecheckRows.length + course5Cards.length + videoCards.length + publicSourceCards.length,
    relationshipEdges: relationshipEdges.length,
    retrievalCards: retrievalCards.length,
    publicSourceCards: publicSourceCards.length,
    sourceFitPrecheckRows: precheck.sourceFitPrecheckRows.length,
    course5InternalKnowledgeNodes: course5.internalKnowledgeNodeRows || course5Cards.length,
    videoSemanticCandidates: videos.candidateRows || videoCards.length,
    internalTeachingPackages: teachingPackages.totals.moduleTeachingPackages,
    lessonOutlines: teachingPackages.totals.lessonOutlines,
    quizAndPracticeItems: teachingPackages.totals.quizAndPracticeItems,
    publicCorpusDocuments: publicLedger.publicCorpusDocuments || sedimentationAudit.totals?.publicCorpusDocuments || 0,
  },
  databaseLayers,
  masterModules,
  retrievalCards,
  relationshipEdges,
  qualityDashboard: {
    moduleScores: masterModules.map((row) => row.quality),
    aiOnlyStrongModules: masterModules.filter((row) => row.quality.aiOnlyScore >= 70).length,
    aiOnlyUsableModules: masterModules.filter((row) => row.quality.aiOnlyScore >= 45).length,
    highReleaseRiskModules: masterModules.filter((row) => row.quality.releaseRisk === "high_release_risk").length,
    sourceFitPrecheckCounts: precheck.sourceFitPrecheckCounts,
    releaseReadiness: "learner_release_blocked_no_human_review_claimed",
  },
  retrievalViews: {
    byModule: Object.fromEntries(masterModules.map((row) => [row.module, retrievalCards.filter((card) => card.module === row.module).map((card) => card.id)])),
    byType: countBy(retrievalCards, "type"),
    byReleaseStatus: countBy(retrievalCards, "releaseStatus"),
  },
  ontologyMap: {
    domain: "TradeGym AI-only internal trading education knowledge database",
    entities_count: masterModules.length + retrievalCards.length,
    relationships_count: relationshipEdges.length,
    key_entities: masterModules.slice(0, 5).map((row) => row.module),
    critical_paths: [
      "public/private/video source -> source-fit precheck -> module master record -> lesson outline -> quiz/practice -> release blocker",
      teachingPackages.globalCourseGraph.nodes.map((node) => node.module).join(" -> "),
    ],
    knowledge_tree: masterModules.map((row) => ({
      module: row.module,
      lessons: row.lessons.length,
      sourceFitNodes: row.sourceFitNodeIds.length,
      course5Nodes: row.course5NodeIds.length,
      videoCandidates: row.videoCandidateIds.length,
    })),
    insights: [
      "The database is now organized around modules, retrieval cards, and graph edges instead of scattered source files.",
      "AI-only internal usefulness can be scored without pretending learner release is approved.",
      "The strongest next product surface is database browsing, search, and module QA, not more ingestion.",
    ],
    gaps: [
      "No real human source-fit or citation-use approval exists.",
      "High-risk modules remain blocked for learner-facing release.",
      "Some private visual/transcript-derived candidates still require grounding before release.",
    ],
  },
  knowledgeBrowserSurface: {
    field: "masterKnowledgeDatabase",
    visibleInOverview: true,
    internalOnly: true,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    contents: ["masterModules", "retrievalCards", "relationshipEdges", "qualityDashboard", "retrievalViews", "ontologyMap"],
  },
  boundary: "This is the strongest AI-only internal database layer currently derivable from the absorbed materials. It supports curriculum design, retrieval, QA, and review routing only. It does not approve publication, citation use, copied text, stock recommendations, live signals, broker workflows, auto-trading, return claims, or real-funds use.",
};

fs.writeFileSync(OUT_JSON, `${JSON.stringify(artifact, null, 2)}\n`);
fs.writeFileSync(OUT_MD, buildMarkdown(artifact));
fs.writeFileSync(OUT_JS, `// Generated by scripts/build-knowledge-master-database-ai-only.mjs.\n// AI-only internal knowledge database; not learner-facing approved.\nconst masterKnowledgeDatabase = ${JSON.stringify({
  databaseStatus: artifact.databaseStatus,
  educationOnly: artifact.educationOnly,
  productionReady: artifact.productionReady,
  learnerFacingRelease: artifact.learnerFacingRelease,
  approvalStatus: artifact.approvalStatus,
  writeAllowedNow: artifact.writeAllowedNow,
  totals: artifact.totals,
  databaseLayers: artifact.databaseLayers,
  masterModules: artifact.masterModules,
  retrievalCards: artifact.retrievalCards,
  relationshipEdges: artifact.relationshipEdges,
  qualityDashboard: artifact.qualityDashboard,
  retrievalViews: artifact.retrievalViews,
  ontologyMap: artifact.ontologyMap,
  knowledgeBrowserSurface: artifact.knowledgeBrowserSurface,
  boundary: artifact.boundary,
}, null, 2)};\n\nmodule.exports = { masterKnowledgeDatabase };\n`);

console.log(JSON.stringify({
  ok: true,
  databaseStatus: artifact.databaseStatus,
  masterModules: artifact.totals.masterModules,
  knowledgeEntities: artifact.totals.knowledgeEntities,
  relationshipEdges: artifact.totals.relationshipEdges,
  retrievalCards: artifact.totals.retrievalCards,
  aiOnlyStrongModules: artifact.qualityDashboard.aiOnlyStrongModules,
}, null, 2));
