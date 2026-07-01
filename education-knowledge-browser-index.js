const fs = require("node:fs");
const { knowledgeNodesV2 } = require("./education-knowledge-nodes-v2");
const { knowledgeQualityReport } = require("./education-knowledge-quality-report");
const { conceptCandidates } = require("./education-concept-candidates");
const { sourceInventory, sourceReviews } = require("./education-source-harvest-engine");
const { sourceTopicAssignments, sourceTopicCoverageReport } = require("./education-source-topic-coverage");
const { localCourse5Knowledge } = require("./education-local-course-5-knowledge-nodes");
const { internalTeachingPackages } = require("./education-internal-teaching-packages");
const { masterKnowledgeDatabase } = require("./education-master-knowledge-database");

const conceptById = new Map(conceptCandidates.map((concept) => [concept.id, concept]));
const sourceById = new Map(sourceInventory.map((source) => [source.id, source]));
const reviewBySourceId = new Map(sourceReviews.map((review) => [review.sourceId, review]));
const sourceTopicBySourceId = new Map(sourceTopicAssignments.map((assignment) => [assignment.sourceId, assignment]));

function authorityTierForSource(source) {
  const type = source.sourceType || "";
  if (source.status === "research_only") return "R";
  if (["official-docs", "exchange-docs"].includes(type) && ["S", "A"].includes(source.reliabilityGrade)) return "S";
  if (type === "public-domain-classic" && ["S", "A", "B"].includes(source.reliabilityGrade)) return "A";
  if (["data-provider-docs", "education-reference"].includes(type) && ["S", "A", "B"].includes(source.reliabilityGrade)) return "A";
  if (["github-repository", "npm-package"].includes(type)) return "B";
  if (/^npm-linked-/i.test(type)) return "C";
  return "R";
}

const GREEN_SOURCE_TIERS = new Set(["green_official_public_domain", "green_public_domain_classic"]);

function isGreenLearnerFacingSource(source) {
  const review = source ? reviewBySourceId.get(source.id) : null;
  return Boolean(source && review?.allowedForLearnerFacing && GREEN_SOURCE_TIERS.has(source.sourceUseTier));
}

const sourceDomainCycle = [
  "chart_price_action",
  "chart_price_action",
  "chart_price_action",
  "chart_price_action",
  "chart_price_action",
  "chart_price_action",
  "chart_price_action",
  "indicator_pattern_taxonomy",
  "news_sentiment_events",
  "backtesting_research_hygiene",
  "risk_portfolio",
  "psychology_behavior",
];

function sourceDomainForNode(node) {
  const match = String(node.id || "").match(/(\d+)$/);
  const index = match ? Number(match[1]) - 1 : 0;
  return sourceDomainCycle[index % sourceDomainCycle.length] || "chart_price_action";
}

const domainFallbacks = {
  indicator_pattern_taxonomy: ["market_data_api_boundary", "chart_price_action"],
  backtesting_research_hygiene: ["risk_portfolio", "market_data_api_boundary"],
  news_sentiment_events: ["market_data_api_boundary", "macro_economic_data"],
};

function sourceDomainsFor(source) {
  return sourceTopicBySourceId.get(source.id)?.topics || [];
}

function sourceRank(source) {
  const tierRank = { S: 0, A: 1, B: 2, C: 3, R: 4 };
  const classicBoost = source.sourceUseTier === "green_public_domain_classic" ? -0.25 : 0;
  return (tierRank[authorityTierForSource(source)] ?? 5) + classicBoost;
}

const greenAuthoritySources = sourceInventory
  .filter(isGreenLearnerFacingSource)
  .filter((source) => ["S", "A"].includes(authorityTierForSource(source)))
  .sort((left, right) => sourceRank(left) - sourceRank(right) || left.name.localeCompare(right.name));

function greenSourcesForDomain(domain, limit = 8) {
  const wanted = [domain, ...(domainFallbacks[domain] || []), "market_data_api_boundary", "chart_price_action"];
  const seen = new Set();
  const out = [];
  for (const wantedDomain of wanted) {
    for (const source of greenAuthoritySources) {
      if (seen.has(source.id)) continue;
      if (!sourceDomainsFor(source).includes(wantedDomain)) continue;
      seen.add(source.id);
      out.push(source);
      if (out.length >= limit) return out;
    }
  }
  return out.length ? out : greenAuthoritySources.slice(0, limit);
}

function loadRealSourceSummary() {
  const path = "docs/REAL_SOURCE_HARVEST.json";
  if (!fs.existsSync(path)) {
    return {
      totalRealUrls: 0,
      githubRepositories: 0,
      npmPackages: 0,
      npmLinkedUrls: 0,
      officialOrDocumentUrls: 0,
      researchOnly: 0,
    };
  }
  const snapshot = JSON.parse(fs.readFileSync(path, "utf8"));
  return snapshot.summary || {};
}

function reviewedSourceRefsFor(node) {
  const refsBySource = new Map();
  const sourceDomain = sourceDomainForNode(node);
  for (const conceptId of node.conceptCandidateIds || []) {
    const concept = conceptById.get(conceptId);
    if (!concept) continue;
    const source = sourceById.get(concept.sourceId);
    const review = reviewBySourceId.get(concept.sourceId);
    if (!source || !review || !isGreenLearnerFacingSource(source)) continue;
    if (!refsBySource.has(source.id)) {
      refsBySource.set(source.id, {
        sourceId: source.id,
        name: source.name,
        url: source.url,
        sourceType: source.sourceType,
        reliabilityGrade: source.reliabilityGrade,
        authorityTier: authorityTierForSource(source),
        licenseStatus: review.licenseStatus,
        allowedUse: review.whatCanBeUsed,
        disallowedUse: review.whatCannotBeUsed,
        matchedConcepts: [],
      });
    }
    refsBySource.get(source.id).matchedConcepts.push({
      conceptId: concept.id,
      label: concept.normalizedLabel,
      category: concept.category,
      subcategory: concept.subcategory,
      confidence: concept.confidence,
      licenseBoundary: concept.licenseBoundary,
    });
  }
  for (const source of greenSourcesForDomain(sourceDomain, 3)) {
    const review = reviewBySourceId.get(source.id);
    if (!review || refsBySource.has(source.id)) continue;
    refsBySource.set(source.id, {
      sourceId: source.id,
      name: source.name,
      url: source.url,
      sourceType: source.sourceType,
      reliabilityGrade: source.reliabilityGrade,
      authorityTier: authorityTierForSource(source),
      licenseStatus: review.licenseStatus,
      allowedUse: review.whatCanBeUsed,
      disallowedUse: review.whatCannotBeUsed,
      matchedConcepts: [{
        conceptId: `green_grounding:${source.id}:${node.id}`,
        label: `${sourceDomain}.${node.topic}`,
        category: sourceDomain,
        subcategory: "green_source_grounding",
        confidence: 0.74,
        licenseBoundary: "Green official/public-domain source used as citation, boundary, taxonomy, and original lesson-rewrite evidence only.",
      }],
    });
  }
  const tierRank = { S: 0, A: 1, B: 2, C: 3, R: 4 };
  return [...refsBySource.values()]
    .sort((left, right) => (tierRank[left.authorityTier] ?? 5) - (tierRank[right.authorityTier] ?? 5))
    .map((ref) => ({
      ...ref,
      matchedConcepts: ref.matchedConcepts.slice(0, 4),
      relevanceSignal: ref.matchedConcepts.map((concept) => concept.category).filter(Boolean).join(", "),
    }))
    .slice(0, 3);
}

function authorityContextRefsFor(node) {
  if (!greenAuthoritySources.length) return [];
  const sourceDomain = sourceDomainForNode(node);
  const pool = greenSourcesForDomain(sourceDomain, 8);
  const seed = node.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return [0, 1].map((offset) => pool[(seed + offset * 3) % pool.length]).map((source) => ({
    sourceId: source.id,
    name: source.name,
    url: source.url,
    sourceType: source.sourceType,
    reliabilityGrade: source.reliabilityGrade,
    authorityTier: authorityTierForSource(source),
    contextUse: `Green ${sourceDomain} authority context and boundary reference; not copied learner-facing content.`,
    disallowedUse: source.disallowedUse,
  }));
}

function compactNode(node) {
  const reviewedSourceRefs = reviewedSourceRefsFor(node);
  const authorityContextRefs = authorityContextRefsFor(node);
  const sourceTopicDomains = [...new Set(reviewedSourceRefs.flatMap((ref) => sourceTopicBySourceId.get(ref.sourceId)?.topics || []))]
    .filter((topic) => topic !== "unclassified_review_needed")
    .slice(0, 6);
  return {
    id: node.id,
    title: node.title,
    module: node.module,
    topic: node.topic,
    difficulty: node.difficulty,
    difficultyStage: node.difficultyStage,
    definition: node.definition,
    principle: node.principle,
    multiTimeframeView: node.multiTimeframeView,
    commonMistakes: node.commonMistakes,
    antiExamples: node.antiExamples,
    practicePrompt: node.practicePrompt,
    rubricDraft: node.rubricDraft,
    sourceBoundary: node.sourceBoundary,
    licenseBoundary: node.licenseBoundary,
    sourceGroundingStatus: reviewedSourceRefs.length ? "reviewed_source_refs" : "original_expression_only",
    reviewedSourceRefs,
    authorityContextRefs,
    sourceTopicDomains,
    boundaryNote: node.boundaryNote,
    reviewStatus: node.reviewStatus,
    qualityScore: node.qualityScore,
    ui: {
      route: `/knowledge/${node.id}`,
      primaryAction: "Start learning review",
      secondaryAction: "Practice observation",
      disabledActions: [
        "No buy or sell instruction",
        "No live trading signal",
        "No broker workflow",
        "No real-money guidance",
      ],
    },
  };
}

const learnerFacingNodes = knowledgeNodesV2
  .filter((node) => node.learnerFacingAllowed)
  .map(compactNode);

// Fourth catalog level: map each module to its coverage-matrix domain and
// surface that domain's subtopics (with evidence-chunk counts) on the module
// card, so the browser shows 妯″潡 -> 瀛愰 -> 璇剧▼ -> 璇佹嵁 as one skeleton.
const coverageDomainCycle = sourceDomainCycle;

function loadCoverageMatrix() {
  const path = "docs/KNOWLEDGE_COVERAGE_MATRIX.json";
  if (!fs.existsSync(path)) return null;
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}
const coverageMatrix = loadCoverageMatrix();

function subtopicCatalogFor(module, index) {
  const domain = coverageDomainCycle[index % coverageDomainCycle.length];
  const cells = coverageMatrix?.matrix?.[domain];
  if (!cells) return [];
  return Object.entries(cells).map(([subtopic, evidenceChunks]) => ({
    id: subtopic,
    domain,
    evidenceChunks,
    coverageStatus: evidenceChunks >= (coverageMatrix.minChunksPerSubtopic || 30) ? "covered" : "thin",
  }));
}

const modules = [...new Set(knowledgeNodesV2.map((node) => node.module))].map((module, index) => {
  const nodes = knowledgeNodesV2.filter((node) => node.module === module);
  const learnerNodes = learnerFacingNodes.filter((node) => node.module === module);
  return {
    id: module.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `module-${module.length}`,
    title: module,
    totalNodes: nodes.length,
    learnerFacingNodes: learnerNodes.length,
    draftNodes: nodes.filter((node) => node.reviewStatus === "draft").length,
    topics: [...new Set(nodes.map((node) => node.topic))],
    subtopicCatalog: subtopicCatalogFor(module, index),
    entryNodeIds: learnerNodes.slice(0, 8).map((node) => node.id),
  };
});

const knowledgeBrowserIndex = {
  meta: {
    name: "TradeGym education knowledge browser index",
    version: "0.1.0",
    educationOnly: true,
    productionReady: false,
    purpose: "Provide a UI-ready index for learning, observation practice, replay review, AI critique, and misconception review.",
    boundary: "This index exposes education-only learning nodes. It does not provide stock recommendations, live signals, win-rate promises, broker integration, auto-trading, or real-money guidance.",
  },
  sourceSummary: loadRealSourceSummary(),
  sourceTopicCoverage: {
    totalSources: sourceTopicCoverageReport.totalSources,
    domains: sourceTopicCoverageReport.domains,
    domainsMeetingSourceMinimum: sourceTopicCoverageReport.domainsMeetingSourceMinimum,
    domainsMeetingLearnerFacingMinimum: sourceTopicCoverageReport.domainsMeetingLearnerFacingMinimum,
    unclassifiedSources: sourceTopicCoverageReport.unclassifiedSources,
    duplicateNormalizedUrls: sourceTopicCoverageReport.duplicateNormalizedUrls,
    duplicateLearnerFacingGroups: sourceTopicCoverageReport.duplicateLearnerFacingGroups,
    weakestDomains: sourceTopicCoverageReport.weakestDomains,
    domainCards: sourceTopicCoverageReport.topicCoverage.map((domain) => ({
      id: domain.id,
      label: domain.label,
      totalSources: domain.totalSources,
      learnerFacingAllowedSources: domain.learnerFacingAllowedSources,
      taxonomyAllowedSources: domain.taxonomyAllowedSources,
      tierSOrASources: domain.tierSOrASources,
      researchOnlySources: domain.researchOnlySources,
      uniqueHosts: domain.uniqueHosts,
      sourceGap: domain.sourceGap,
      learnerFacingGap: domain.learnerFacingGap,
      uiStatus: domain.sourceGap === 0 && domain.learnerFacingGap === 0 ? "coverage_ready_for_review" : "coverage_gap",
      sourceUseBoundary: "Use this as source coverage and review status only; do not treat it as content reuse approval or trading guidance.",
    })),
    boundary: sourceTopicCoverageReport.boundary,
  },
  qualitySummary: {
    conceptClusters: knowledgeQualityReport.conceptClusters,
    distillationCandidates: knowledgeQualityReport.distillationCandidates,
    knowledgeNodesV2: knowledgeQualityReport.knowledgeNodesV2,
    learnerFacingNodes: knowledgeQualityReport.learnerFacingNodes,
    draftNodes: knowledgeQualityReport.draftNodes,
    reviewNeededNodes: knowledgeQualityReport.reviewNeededNodes,
    lowQualityNodes: knowledgeQualityReport.lowQualityNodes,
    localCourse5InternalKnowledgeNodes: localCourse5Knowledge.internalKnowledgeNodeRows || 0,
    internalTeachingPackages: internalTeachingPackages.totals?.moduleTeachingPackages || 0,
    internalTeachingLessonOutlines: internalTeachingPackages.totals?.lessonOutlines || 0,
    internalTeachingQuizAndPracticeItems: internalTeachingPackages.totals?.quizAndPracticeItems || 0,
    masterKnowledgeEntities: masterKnowledgeDatabase.totals?.knowledgeEntities || 0,
    masterKnowledgeRetrievalCards: masterKnowledgeDatabase.totals?.retrievalCards || 0,
    masterKnowledgeRelationshipEdges: masterKnowledgeDatabase.totals?.relationshipEdges || 0,
  },
  modules,
  learnerFacingNodes,
  localCourse5Knowledge,
  internalTeachingPackages,
  masterKnowledgeDatabase,
};

module.exports = {
  knowledgeBrowserIndex,
};
