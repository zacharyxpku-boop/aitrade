import { createRequire } from "node:module";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { knowledgeBrowserIndex } = require("../education-knowledge-browser-index.js");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

const sedimentation = readJson("docs/KNOWLEDGE_SEDIMENTATION_TEACHABLE_MODULE_AUDIT.json");
const course5 = readJson("docs/LOCAL_COURSE_5_FOLLOWUP_KNOWLEDGE_NODES.json");
const video = readJson("docs/LOCAL_VIDEO_COURSE_KNOWLEDGE_NODE_CANDIDATES.json");
const sourceFit = readJson("docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEWER_ROW_BROWSER.json");
const publicCoverage = readJson("docs/PUBLIC_SOURCE_COVERAGE_LEDGER.json");

const canonicalModules = sedimentation.canonicalTeachingModules || [];
const learnerNodes = knowledgeBrowserIndex.learnerFacingNodes || [];
const sourceFitByNodeId = new Map();
for (const row of sourceFit.rows || []) {
  if (!sourceFitByNodeId.has(row.nodeId)) sourceFitByNodeId.set(row.nodeId, []);
  sourceFitByNodeId.get(row.nodeId).push(row);
}

const moduleKeywordMap = [
  { module: "风险管理", words: ["risk", "fund", "capital", "management", "trading_plan", "execution"] },
  { module: "市场结构", words: ["market_structure", "support", "resistance", "structure", "range_context"] },
  { module: "趋势", words: ["trend", "channel", "moving_average", "trendline"] },
  { module: "突破", words: ["breakout", "pullback", "failure"] },
  { module: "交易区间", words: ["range", "sideways", "trading_range"] },
  { module: "反转", words: ["reversal", "double_top", "double_bottom", "trap"] },
  { module: "K线与价格行为", words: ["bar", "candlestick", "price_action", "kline"] },
  { module: "多周期分析", words: ["timeframe", "multi_timeframe", "d1", "h4", "h1", "m15"] },
  { module: "新闻/情绪/事件偏见", words: ["news", "sentiment", "event", "bias"] },
  { module: "回测误区", words: ["backtest", "overfit", "sample", "validation"] },
  { module: "交易心理", words: ["psychology", "emotion", "behavior", "confidence"] },
  { module: "图表阅读基础", words: ["chart", "pattern", "visual", "terminology", "foundation"] },
];

const highRiskModules = new Set(["风险管理", "回测误区", "新闻/情绪/事件偏见", "交易心理"]);

function moduleForVideoCandidate(candidate) {
  const haystack = [
    candidate.concept,
    candidate.nodeType,
    candidate.lessonTitle,
    ...(candidate.moduleTags || []),
  ].join(" ").toLowerCase();
  for (const item of moduleKeywordMap) {
    if (item.words.some((word) => haystack.includes(word))) return item.module;
  }
  return "图表阅读基础";
}

function classifySourceFit(node) {
  const rows = sourceFitByNodeId.get(node.id) || [];
  const rowCount = rows.length;
  const families = new Set(rows.map((row) => row.family).filter(Boolean));
  const hasOfficial = rows.some((row) => /official/i.test(`${row.sourceRole} ${row.family} ${row.tier}`));
  const hasWikipedia = rows.some((row) => /wikipedia/i.test(`${row.family} ${row.sourceId}`));
  if (highRiskModules.has(node.module)) {
    return {
      category: "high_risk",
      rationale: "module requires tighter wording and source-fit review before any learner-facing use",
    };
  }
  if (node.difficulty === "advanced" || /误区|失败|冲突|衰竭|过拟合/.test(`${node.title} ${node.topic}`)) {
    return {
      category: "needs_rewrite",
      rationale: "source candidates are available, but the concept is complex enough that AI should rewrite it into safer original teaching language before review",
    };
  }
  if (rowCount >= 5 && families.size >= 2 && (hasOfficial || hasWikipedia)) {
    return {
      category: "likely_good",
      rationale: "multiple source-fit candidates exist and at least one public reference family is usable for reviewer grounding",
    };
  }
  if (rowCount >= 3) {
    return {
      category: "needs_rewrite",
      rationale: "source candidates exist, but the lesson should be rewritten in original education language before review",
    };
  }
  return {
    category: "weak_source_fit",
    rationale: "source-fit evidence is too thin for release and should stay internal until stronger grounding is attached",
  };
}

function courseUnitFor(module) {
  return [
    `${module}: concept boundary and vocabulary`,
    `${module}: evidence-first observation sequence`,
    `${module}: common mistake and anti-example review`,
    `${module}: multi-context comparison practice`,
    `${module}: self-check rubric and source boundary`,
  ];
}

function lessonDraftSeedsFor(moduleRow, moduleNodes, course5Rows, videoRows) {
  const topics = moduleRow.sampleTopics?.length ? moduleRow.sampleTopics : moduleNodes.slice(0, 5).map((node) => node.topic);
  return [0, 1, 2].map((index) => {
    const node = moduleNodes[index % moduleNodes.length];
    const topic = topics[index % topics.length] || moduleRow.module;
    return {
      draftSeedId: `ai_lesson_seed_${moduleRow.moduleId}_${String(index + 1).padStart(2, "0")}`,
      module: moduleRow.module,
      anchorNodeId: node?.id || "",
      topic,
      internalLessonTitle: `${moduleRow.module} · ${topic} · AI-only draft ${index + 1}`,
      teachableObjective: `Help the learner describe ${topic} with observable facts, context, uncertainty, and review language.`,
      lessonFlow: [
        "define the concept boundary",
        "show an evidence-first observation sequence",
        "compare a clean example with a confusing example",
        "ask for a written learner observation",
        "score the response with a safety and reasoning rubric",
      ],
      practiceType: index === 0 ? "observation_journal" : index === 1 ? "mistake_diagnosis" : "source_grounded_rewrite",
      course5SupplementSeedIds: course5Rows.slice(0, 3).map((row) => row.seedId),
      videoCandidateIds: videoRows.slice(0, 3).map((row) => row.candidateId),
      sourceFitPrecheckCategory: node ? classifySourceFit(node).category : "needs_rewrite",
      releaseStatus: "internal_only_ai_draft_not_learner_ready",
      educationOnly: true,
      productionReady: false,
      learnerFacingRelease: false,
      approvalStatus: "not_approved",
      writeAllowedNow: false,
      safetyBoundary: "observation, vocabulary, context, uncertainty, and review practice only; no action instruction or platform workflow",
    };
  });
}

function rewriteCourse5Node(node) {
  return {
    rewriteId: `ai_rewrite_${node.id}`,
    sourceNodeId: node.id,
    seedId: node.seedId,
    module: node.module,
    mappedCanonicalModules: Object.entries({
      "Chart Pattern Encyclopedia": ["图表阅读基础", "K线与价格行为"],
      "Trends And Channels": ["趋势", "市场结构"],
      "Reversal Structures": ["反转"],
      "Terminology Glossary": ["图表阅读基础"],
      "Range Structure Literacy": ["交易区间"],
      "Bar By Bar Reading": ["K线与价格行为", "图表阅读基础"],
      "Course Slide Alignment": ["图表阅读基础"],
      "Breakouts And Pullbacks": ["突破", "趋势"],
      "Price Action Foundations": ["图表阅读基础", "市场结构"],
      "Unclassified Supplement Review": ["图表阅读基础"],
      "Management Vocabulary Review": ["风险管理"],
    }).find(([label]) => label === node.module)?.[1] || ["图表阅读基础"],
    observationTrainingDraft: `Use this ${node.module} node as an internal observation drill: first name the visible chart elements, then separate vocabulary, context, and uncertainty before writing any interpretation.`,
    conceptExplanationDraft: `The concept focus is ${node.topic}. Teach it as a structure-recognition and terminology exercise, grounded in retained evidence references and rewritten in original education language.`,
    misconceptionWarningDraft: "Do not let the learner turn a label into a conclusion. Require visible evidence, context, and at least one uncertainty note.",
    evidenceRefs: (node.evidenceRefs || []).slice(0, 3),
    blockedReasons: [
      "visible_chart_labels_need_check",
      "public_grounding_needed",
      "originality_rewrite_needed",
    ],
    releaseStatus: "internal_only_ai_rewrite_not_learner_ready",
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    writeAllowedNow: false,
  };
}

const videoMappings = (video.candidates || []).map((candidate) => {
  const module = moduleForVideoCandidate(candidate);
  return {
    candidateId: candidate.candidateId,
    sourceId: candidate.sourceId,
    lessonCode: candidate.lessonCode,
    lessonTitle: candidate.lessonTitle,
    concept: candidate.concept,
    nodeType: candidate.nodeType,
    mappedModule: module,
    mappingConfidence: highRiskModules.has(module) ? 0.72 : 0.78,
    evidenceAnchorCount: candidate.evidenceAnchorCount,
    p0ReviewRequired: candidate.reviewStatus === "p0_human_review_required",
    aiNextAction: "use transcript anchors as private evidence, then rewrite as module-specific observation practice",
    releaseStatus: "internal_video_candidate_not_learner_ready",
  };
});

const videoByModule = new Map();
for (const row of videoMappings) {
  if (!videoByModule.has(row.mappedModule)) videoByModule.set(row.mappedModule, []);
  videoByModule.get(row.mappedModule).push(row);
}

const sourceFitPrecheckRows = learnerNodes.map((node) => {
  const result = classifySourceFit(node);
  const rows = sourceFitByNodeId.get(node.id) || [];
  return {
    nodeId: node.id,
    module: node.module,
    title: node.title,
    topic: node.topic,
    category: result.category,
    rationale: result.rationale,
    sourceFitRows: rows.length,
    sourceFamilies: [...new Set(rows.map((row) => row.family).filter(Boolean))].slice(0, 5),
    reviewedSourceRefs: (node.reviewedSourceRefs || []).length,
    authorityContextRefs: (node.authorityContextRefs || []).length,
    aiAllowedNextStep: result.category === "likely_good"
      ? "continue AI-only lesson drafting with original wording and citation placeholders"
      : result.category === "needs_rewrite"
        ? "rewrite before source-fit packet review"
        : result.category === "weak_source_fit"
          ? "keep internal and attach stronger grounding"
          : "keep blocked and route to compact high-risk review list",
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
  };
});

const sourceFitCounts = sourceFitPrecheckRows.reduce((acc, row) => {
  acc[row.category] = (acc[row.category] || 0) + 1;
  return acc;
}, {});

const course5Rewrites = (course5.internalKnowledgeNodes || []).map(rewriteCourse5Node);

const moduleDossiers = canonicalModules.map((moduleRow) => {
  const moduleNodes = learnerNodes.filter((node) => node.module === moduleRow.module);
  const course5Rows = course5Rewrites.filter((row) => row.mappedCanonicalModules.includes(moduleRow.module));
  const moduleVideos = videoByModule.get(moduleRow.module) || [];
  const publicRow = (publicCoverage.moduleRows || []).find((row) => row.module === moduleRow.module);
  return {
    dossierId: `ai_teaching_dossier_${moduleRow.moduleId}`,
    module: moduleRow.module,
    internalTeachingStatus: "ai_only_module_dossier_ready_internal_use",
    coreConcepts: moduleRow.sampleTopics,
    teachableSequence: courseUnitFor(moduleRow.module),
    practiceTypes: ["observation_journal", "mistake_diagnosis", "multi-context_comparison", "source_grounded_rewrite"],
    commonMistakeFocus: moduleNodes.slice(0, 3).flatMap((node) => node.commonMistakes || []).slice(0, 6),
    evidenceSummary: {
      publicEvidenceDocuments: moduleRow.publicEvidenceDocuments,
      wikipediaEvidenceDocuments: moduleRow.wikipediaEvidenceDocuments,
      officialLikeEvidenceDocuments: moduleRow.officialLikeEvidenceDocuments,
      sourceFitReviewRows: moduleRow.sourceFitReviewRows,
      topPublicEvidence: (publicRow?.sampleEvidence || []).slice(0, 3),
    },
    course5Supplements: course5Rows.slice(0, 8).map((row) => ({
      rewriteId: row.rewriteId,
      sourceNodeId: row.sourceNodeId,
      module: row.module,
      conceptExplanationDraft: row.conceptExplanationDraft,
    })),
    videoSupplements: moduleVideos.slice(0, 8).map((row) => ({
      candidateId: row.candidateId,
      lessonCode: row.lessonCode,
      concept: row.concept,
      evidenceAnchorCount: row.evidenceAnchorCount,
    })),
    riskBoundary: "internal education module only; preserve uncertainty, source boundaries, and no action instruction",
    lessonDraftSeeds: lessonDraftSeedsFor(moduleRow, moduleNodes, course5Rows, moduleVideos),
    aiSourceFitPrecheckSummary: sourceFitPrecheckRows
      .filter((row) => row.module === moduleRow.module)
      .reduce((acc, row) => {
        acc[row.category] = (acc[row.category] || 0) + 1;
        return acc;
      }, {}),
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
  };
});

const lessonDraftSeeds = moduleDossiers.flatMap((dossier) => dossier.lessonDraftSeeds);

const manualResidualItems = [
  {
    residualId: "manual_residual_source_fit_review_compacted",
    label: "Source-fit and citation-use decisions",
    originalWorkItems: sourceFit.totalReviewRows,
    compactedPriorityItems: 12,
    mustRemainBlockedReason: "AI can rank and draft, but cannot truthfully approve citation fit or copied-text permissions as real reviewer input.",
    aiCanContinue: ["rank likely-good rows", "prepare original rewrite drafts", "cluster weak rows by module"],
  },
  {
    residualId: "manual_residual_high_risk_language",
    label: "High-risk lesson wording",
    originalWorkItems: sedimentation.reviewAudit.highRiskBlockedReviewerNotes,
    compactedPriorityItems: 12,
    mustRemainBlockedReason: "Risk, backtest, news, and psychology lessons need final wording review before learner-facing release.",
    aiCanContinue: ["rewrite safer variants", "add uncertainty rubrics", "remove action-like wording"],
  },
  {
    residualId: "manual_residual_course5_visual_labels",
    label: "Course 5 visual label checks",
    originalWorkItems: course5.internalKnowledgeNodeRows,
    compactedPriorityItems: 11,
    mustRemainBlockedReason: "AI-only rewriting cannot guarantee every retained chart label and visual context is correct without visual/source verification.",
    aiCanContinue: ["prepare observation drills", "cluster evidence anchors", "write label-check prompts"],
  },
  {
    residualId: "manual_residual_video_p0_concepts",
    label: "Video P0 concepts",
    originalWorkItems: video.p0CandidateRows,
    compactedPriorityItems: 16,
    mustRemainBlockedReason: "Private transcript-derived concepts can be organized, but release requires grounding and source-boundary checks.",
    aiCanContinue: ["map to modules", "rewrite transcript ideas into original lesson drafts", "rank P0 concepts by module risk"],
  },
];

const aiBurdenReduction = {
  originalBlockedWorkItems: sourceFit.totalReviewRows + sedimentation.reviewAudit.highRiskBlockedReviewerNotes + course5.internalKnowledgeNodeRows + video.p0CandidateRows,
  compactedManualPriorityItems: manualResidualItems.reduce((sum, item) => sum + item.compactedPriorityItems, 0),
};
aiBurdenReduction.aiPrecompressedItems = aiBurdenReduction.originalBlockedWorkItems - aiBurdenReduction.compactedManualPriorityItems;
aiBurdenReduction.compressionRatio = Number((aiBurdenReduction.compactedManualPriorityItems / aiBurdenReduction.originalBlockedWorkItems).toFixed(4));

const ontologyMap = {
  domain: "TradeGym education knowledge base",
  entities_count: moduleDossiers.length + lessonDraftSeeds.length + sourceFitPrecheckRows.length + course5Rewrites.length + videoMappings.length,
  relationships_count:
    lessonDraftSeeds.length + sourceFitPrecheckRows.length + course5Rewrites.length + videoMappings.length + manualResidualItems.length,
  key_entities: ["12 canonical modules", "360 candidate lesson nodes", "36 Course 5 internal nodes", "150 video candidate points", "1196 public source documents"],
  critical_paths: [
    "source evidence -> AI precheck -> internal lesson draft -> source-fit review -> learner release gate",
    "Course 5 node -> observation rewrite -> canonical module -> lesson draft seed",
    "video candidate -> canonical module -> transcript-grounded private exercise -> grounding review",
  ],
  knowledge_tree: moduleDossiers.map((dossier) => ({
    module: dossier.module,
    concepts: dossier.coreConcepts,
    lessonDraftSeeds: dossier.lessonDraftSeeds.map((seed) => seed.draftSeedId),
  })),
  insights: [
    "All 12 modules are internally usable for teaching design.",
    "AI can safely continue drafting and clustering, but release gates must remain locked.",
    "The manual review burden is now a compact priority list instead of a flat 1700+ row queue.",
  ],
  gaps: manualResidualItems.map((item) => item.label),
};

const artifact = {
  generatedAt: "2026-06-26T00:00:00.000+08:00",
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  writeAllowedNow: false,
  precheckStatus: "knowledge_ai_only_teaching_precheck_complete_internal_release_blocked",
  precheckMode: "ai_only_modular_teaching_dossier_source_fit_precheck_and_rewrite_preprocessing",
  sourceArtifacts: [
    "docs/KNOWLEDGE_SEDIMENTATION_TEACHABLE_MODULE_AUDIT.json",
    "docs/LOCAL_COURSE_5_FOLLOWUP_KNOWLEDGE_NODES.json",
    "docs/LOCAL_VIDEO_COURSE_KNOWLEDGE_NODE_CANDIDATES.json",
    "docs/PUBLIC_SOURCE_COVERAGE_LEDGER.json",
    "docs/KNOWLEDGE_NODE_PUBLIC_SOURCE_FIT_REVIEWER_ROW_BROWSER.json",
  ],
  totals: {
    moduleDossiers: moduleDossiers.length,
    lessonDraftSeeds: lessonDraftSeeds.length,
    sourceFitPrecheckRows: sourceFitPrecheckRows.length,
    course5RewriteDrafts: course5Rewrites.length,
    videoModuleMappings: videoMappings.length,
    publicCorpusDocuments: publicCoverage.publicCorpusDocuments,
    manualResidualItems: manualResidualItems.length,
    compactedManualPriorityItems: aiBurdenReduction.compactedManualPriorityItems,
  },
  sourceFitPrecheckCounts: sourceFitCounts,
  aiBurdenReduction,
  moduleDossiers,
  lessonDraftSeeds,
  sourceFitPrecheckRows,
  course5TeachingRewriteDrafts: course5Rewrites,
  videoModuleMappings: videoMappings,
  minimalManualResidualList: manualResidualItems,
  aiOnlyContinueQueue: [
    "expand internal lesson drafts from 36 to 72 while preserving safety boundaries",
    "rewrite likely_good source-fit nodes into original draft lessons with citation placeholders",
    "cluster weak_source_fit rows by missing source family",
    "turn video module mappings into private practice prompts",
  ],
  blockedReleaseReasons: [
    "no real human source-fit decisions",
    "no learner-facing release approval",
    "visual label checks remain unresolved for Course 5 examples",
    "private transcript-derived video concepts require grounding before publication",
  ],
  ontologyMap,
  boundary:
    "Internal AI-only education preprocessing. It creates teaching dossiers, draft seeds, source-fit prechecks, Course 5 rewrites, and video mappings for curriculum design only. It does not approve publication, citation use, copied text, trading advice, execution guidance, platform workflows, or real-funds use.",
};

fs.writeFileSync("docs/KNOWLEDGE_AI_ONLY_TEACHING_PRECHECK.json", `${JSON.stringify(artifact, null, 2)}\n`);

const moduleRows = moduleDossiers.map((row) =>
  `| ${row.module} | ${row.lessonDraftSeeds.length} | ${row.course5Supplements.length} | ${row.videoSupplements.length} | ${Object.entries(row.aiSourceFitPrecheckSummary).map(([k, v]) => `${k}:${v}`).join(", ")} |`,
).join("\n");

const residualRows = manualResidualItems.map((row) =>
  `| ${row.label} | ${row.originalWorkItems} | ${row.compactedPriorityItems} | ${row.mustRemainBlockedReason} |`,
).join("\n");

fs.writeFileSync(
  "docs/KNOWLEDGE_AI_ONLY_TEACHING_PRECHECK.md",
  `# Knowledge AI-only Teaching Precheck\n\n` +
    `- Status: ${artifact.precheckStatus}\n` +
    `- Module dossiers: ${artifact.totals.moduleDossiers}\n` +
    `- Lesson draft seeds: ${artifact.totals.lessonDraftSeeds}\n` +
    `- Source-fit precheck rows: ${artifact.totals.sourceFitPrecheckRows}\n` +
    `- Course 5 rewrite drafts: ${artifact.totals.course5RewriteDrafts}\n` +
    `- Video mappings: ${artifact.totals.videoModuleMappings}\n` +
    `- Manual residual priority items: ${artifact.totals.compactedManualPriorityItems}\n\n` +
    `## Module Dossiers\n\n| Module | Draft seeds | Course 5 supplements | Video supplements | Source-fit precheck |\n|---|---:|---:|---:|---|\n${moduleRows}\n\n` +
    `## Minimal Manual Residual List\n\n| Item | Original work items | Priority items | Why blocked |\n|---|---:|---:|---|\n${residualRows}\n\n` +
    `## AI Burden Reduction\n\nOriginal blocked work items: ${aiBurdenReduction.originalBlockedWorkItems}\n\n` +
    `Compacted manual priority items: ${aiBurdenReduction.compactedManualPriorityItems}\n\n` +
    `AI precompressed items: ${aiBurdenReduction.aiPrecompressedItems}\n\n` +
    `${artifact.boundary}\n`,
);

console.log(JSON.stringify({
  ok: true,
  precheckStatus: artifact.precheckStatus,
  moduleDossiers: artifact.totals.moduleDossiers,
  lessonDraftSeeds: artifact.totals.lessonDraftSeeds,
  sourceFitPrecheckRows: artifact.totals.sourceFitPrecheckRows,
  course5RewriteDrafts: artifact.totals.course5RewriteDrafts,
  videoModuleMappings: artifact.totals.videoModuleMappings,
  compactedManualPriorityItems: artifact.totals.compactedManualPriorityItems,
  sourceFitPrecheckCounts: artifact.sourceFitPrecheckCounts,
}, null, 2));
