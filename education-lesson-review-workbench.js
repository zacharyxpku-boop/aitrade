const fs = require("node:fs");
const { knowledgeLessons } = require("./education-knowledge-lessons");
const { knowledgeBrowserIndex } = require("./education-knowledge-browser-index");
const { sourceInventory, sourceReviews } = require("./education-source-harvest-engine");

const GREEN_SOURCE_TIERS = new Set(["green_official_public_domain", "green_public_domain_classic"]);
const EXPECTED_OUTCOME = "keep_as_structural_draft_after_rewrite_until_human_approval";
const MIN_ITEMS_PER_MODULE = 4;

const sourceById = new Map(sourceInventory.map((source) => [source.id, source]));
const reviewBySourceId = new Map(sourceReviews.map((review) => [review.sourceId, review]));
const nodeById = new Map(knowledgeBrowserIndex.learnerFacingNodes.map((node) => [node.id, node]));

function readSelfAudit() {
  const path = "docs/KNOWLEDGE_SELF_AUDIT.json";
  if (!fs.existsSync(path)) {
    return { results: [] };
  }
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function hostFor(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function familyFor(source) {
  const host = hostFor(source.url);
  if (/investor\.gov$/.test(host)) return "Investor.gov";
  if (/(^|\.)sec\.gov$/.test(host) || host === "data.sec.gov") return "SEC";
  if (/cftc\.gov$/.test(host)) return "CFTC";
  if (/bls\.gov$/.test(host)) return "BLS";
  if (/bea\.gov$/.test(host)) return "BEA";
  if (/gutenberg\.org$/.test(host)) return "Project Gutenberg";
  if (/archive\.org$/.test(host)) return "Internet Archive";
  if (/federalreserve\.gov$/.test(host)) return "Federal Reserve";
  if (/treasury\.gov$/.test(host)) return "Treasury";
  if (/eia\.gov$/.test(host)) return "EIA";
  if (/census\.gov$/.test(host)) return "Census";
  return host;
}

function enrichSourceRef(ref, fallbackSignal) {
  const source = sourceById.get(ref.sourceId);
  const review = reviewBySourceId.get(ref.sourceId);
  return {
    sourceId: ref.sourceId,
    name: ref.name || source?.name,
    url: ref.url || source?.url,
    sourceType: ref.sourceType || source?.sourceType,
    reliabilityGrade: ref.reliabilityGrade || source?.reliabilityGrade,
    authorityTier: ref.authorityTier,
    sourceUseTier: source?.sourceUseTier,
    licenseStatus: ref.licenseStatus || review?.licenseStatus || source?.licenseStatus || "review_required",
    allowedUse: ref.allowedUse || review?.whatCanBeUsed || source?.allowedUse,
    disallowedUse: ref.disallowedUse || review?.whatCannotBeUsed || source?.disallowedUse,
    matchedConcepts: (ref.matchedConcepts || []).slice(0, 4),
    relevanceSignal: ref.relevanceSignal || ref.contextUse || fallbackSignal,
    family: familyFor(source || ref),
  };
}

function isGreenRef(ref) {
  return GREEN_SOURCE_TIERS.has(ref.sourceUseTier);
}

function priorityFor(auditRow, module) {
  if (auditRow.total <= 86) return "P0";
  if (/news|sentiment|risk|psychology|macro|鏂伴椈|椋庨櫓|蹇冪悊|鍥炴祴/i.test(module)) return "P1";
  if (auditRow.total <= 89) return "P1";
  return "P2";
}

function instructionsFor(item, families) {
  const familyHint = families.join(", ");
  return [
    `用原创中文把 ${item.module} / ${item.topic} 改写成可教学的解释，不复制任何来源正文或网页段落。`,
    `把 green sources 只当作事实边界、术语边界、反诈边界、数据口径边界或历史语境参考；本课仍是 structural_draft。`,
    "保留观察训练：先描述可见证据，再说明解释限制，最后写清不行动条件、失效条件和不确定性。",
    "SEC/Investor.gov 仅用于披露阅读、投资者保护、欺诈红旗、AI/社交媒体骗局等语境，不转成交易判断。",
    "CFTC 仅用于 AI trading bot fraud、phony trading systems、digital asset 或 commodity product risk 等风险教育语境。",
    "BLS/BEA 仅用于 CPI、PPI、employment、GDP 等宏观数据发布和口径解读，不写成市场方向预测。",
    "Project Gutenberg / Internet Archive 公版经典只用于历史市场语言、观察练习和术语演变，去掉旧书里的买卖规则和盈利口吻。",
    `本条优先核对的 source families: ${familyHint || "green official/public-domain sources"}。`,
  ];
}

const forbiddenDrift = [
  "不得输出买入、卖出、持有或加减仓建议。",
  "不得把课程写成实盘信号、实时行情判断或确定性方向提示。",
  "不得包装收益、胜率、回测盈利、策略有效性或绩效承诺。",
  "不得加入券商、下单、自动交易、订单路由或真实资金操作指导。",
  "不得复写、翻译或改写外部网页正文作为 learner-facing 内容。",
  "不得保留历史书中的操作口吻、交易规则口吻或盈利暗示。",
  "不得把 FRED、yellow、red、research_only source 当作 learner-facing evidence。",
];

const reviewerChecklist = [
  "是否为原创中文教学表达，而不是来源正文复写。",
  "是否只使用 green source 作为边界、术语、事实、反诈、数据口径或历史语境参考。",
  "是否明确写出 no-action 条件、失效条件和不确定性。",
  "是否只要求观察和解释，没有行动建议、信号或真实资金指导。",
  "是否保留 educationOnly:true 和 productionReady:false 的产品边界。",
  "是否仍应保持 structural_draft，等待人工批准后才可能进入更高状态。",
];

function buildWorkbench() {
  const selfAudit = readSelfAudit();
  const auditByLessonId = new Map(selfAudit.results.map((row) => [row.lessonId, row]));
  const rows = knowledgeLessons
    .map((lesson) => {
      const auditRow = auditByLessonId.get(lesson.id);
      const node = nodeById.get(lesson.nodeId);
      if (!auditRow || !node) return null;
      const reviewed = (node.reviewedSourceRefs || []).map((ref) => enrichSourceRef(ref, `${node.module}.${node.topic}`)).filter(isGreenRef);
      const authority = (node.authorityContextRefs || []).map((ref) => enrichSourceRef(ref, `${node.module}.${node.topic}`)).filter(isGreenRef);
      return {
        lesson,
        node,
        auditRow,
        reviewed,
        authority,
        sourceRichness: reviewed.length + authority.length,
      };
    })
    .filter((row) => row && row.auditRow.grade === "structural_draft" && row.auditRow.handAuthored === false && row.reviewed.length >= 2 && row.authority.length >= 1);

  const modules = [...new Set(knowledgeBrowserIndex.modules.map((module) => module.title))];
  const selected = [];
  for (const module of modules) {
    const moduleRows = rows
      .filter((row) => row.lesson.module === module)
      .sort((left, right) => left.auditRow.total - right.auditRow.total || right.sourceRichness - left.sourceRichness || left.lesson.id.localeCompare(right.lesson.id))
      .slice(0, MIN_ITEMS_PER_MODULE);
    selected.push(...moduleRows);
  }

  return selected.map((row) => {
    const greenReviewedSources = row.reviewed.slice(0, 3);
    const greenAuthoritySources = row.authority.slice(0, 2);
    const sourceFamilies = [...new Set([...greenReviewedSources, ...greenAuthoritySources].map((ref) => ref.family))].filter(Boolean);
    const base = {
      lessonId: row.lesson.id,
      nodeId: row.lesson.nodeId,
      module: row.lesson.module,
      topic: row.lesson.topic,
      currentGrade: row.auditRow.grade,
      currentScore: row.auditRow.total,
      handAuthored: false,
      rewritePriority: priorityFor(row.auditRow, row.lesson.module),
      greenReviewedSources,
      greenAuthoritySources,
      sourceFamilies,
      sourceUseBoundary: "Green sources are reviewer evidence for source fit, factual boundary, term boundary, fraud/data/historical context, and original lesson rewriting only. Do not copy source body text, add trading advice, create signals, connect brokers, automate orders, make performance claims, or guide real funds.",
      expectedOutcome: EXPECTED_OUTCOME,
      educationOnly: true,
      productionReady: false,
    };
    return {
      ...base,
      rewriteInstructions: instructionsFor(base, sourceFamilies),
      forbiddenDrift,
      reviewerChecklist,
    };
  });
}

const items = buildWorkbench();
const moduleCounts = items.reduce((counts, item) => {
  counts[item.module] = (counts[item.module] || 0) + 1;
  return counts;
}, {});
const priorityCounts = items.reduce((counts, item) => {
  counts[item.rewritePriority] = (counts[item.rewritePriority] || 0) + 1;
  return counts;
}, {});
const sourceFamilyCounts = items.flatMap((item) => item.sourceFamilies).reduce((counts, family) => {
  counts[family] = (counts[family] || 0) + 1;
  return counts;
}, {});

function orderedForBatching(workbenchItems) {
  const priorityRank = { P0: 0, P1: 1, P2: 2 };
  return [...workbenchItems].sort((left, right) => {
    return (priorityRank[left.rewritePriority] ?? 9) - (priorityRank[right.rewritePriority] ?? 9)
      || left.currentScore - right.currentScore
      || left.module.localeCompare(right.module)
      || left.lessonId.localeCompare(right.lessonId);
  });
}

function buildRewriteBatches(workbenchItems, batchSize = 6) {
  const ordered = orderedForBatching(workbenchItems);
  const batches = [];
  for (let index = 0; index < ordered.length; index += batchSize) {
    const batchItems = ordered.slice(index, index + batchSize);
    const modules = [...new Set(batchItems.map((item) => item.module))];
    const sourceFamilies = [...new Set(batchItems.flatMap((item) => item.sourceFamilies))];
    const priorities = [...new Set(batchItems.map((item) => item.rewritePriority))];
    batches.push({
      batchId: `rewrite_batch_${String(batches.length + 1).padStart(2, "0")}`,
      educationOnly: true,
      productionReady: false,
      expectedOutcome: EXPECTED_OUTCOME,
      priorityFocus: priorities.join("+"),
      itemCount: batchItems.length,
      lessonIds: batchItems.map((item) => item.lessonId),
      modules,
      sourceFamilies,
      reviewerFocus: [
        "Rewrite original teaching prose from the lesson scaffold; do not copy source body text.",
        "Check that each green source is used only for source fit, term, factual, fraud, data, or historical-context boundaries.",
        "Add uncertainty, invalidation, and no-action language before any practice prompt is considered reviewer-ready.",
      ],
      entryCriteria: [
        "Lesson is a non-hand-authored structural_draft from the workbench.",
        "Lesson has 2-3 green reviewed sources and 1-2 green authority sources.",
        "No yellow, red, FRED, or research_only source is used as learner-facing evidence.",
      ],
      exitCriteria: [
        "Reviewer confirms original wording and no copied external text.",
        "Reviewer confirms no buy/sell/hold, signal, broker, auto-trading, return, win-rate, backtest-profit, or real-funds guidance.",
        "Reviewer leaves the item as structural_draft until separate human approval exists.",
      ],
      safetyGates: [
        "no_trading_advice",
        "no_live_signal",
        "no_performance_claim",
        "no_broker_or_order_flow",
        "no_auto_trading",
        "no_real_money_guidance",
        "no_external_body_copying",
        "green_sources_only",
      ],
    });
  }
  return batches;
}

const rewriteBatches = buildRewriteBatches(items);
const itemByLessonId = new Map(items.map((item) => [item.lessonId, item]));

function buildBatchReviewGuide(batches) {
  return {
    generatedAt: new Date().toISOString(),
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    expectedOutcome: EXPECTED_OUTCOME,
    purpose: "Provide reviewer-facing tracking fields for human lesson rewriting without approving or publishing any generated draft.",
    allowedStatuses: [
      "not_started",
      "rewrite_in_progress",
      "needs_fact_check",
      "needs_boundary_check",
      "blocked_for_source_fit_review",
      "ready_for_separate_human_approval_review",
    ],
    requiredReviewerFields: [
      "originalRewriteNotes",
      "sourceFitNotes",
      "factCheckNotes",
      "boundaryCheckNotes",
      "copyingRiskNotes",
      "humanReviewerInitials",
    ],
    disallowedCompletionClaims: [
      "approved_final",
      "commercial_ready",
      "learner_facing_ready",
      "production_ready",
      "trading_signal_ready",
    ],
    batches: batches.map((batch) => ({
      batchId: batch.batchId,
      educationOnly: true,
      productionReady: false,
      learnerFacingRelease: false,
      reviewStatus: "not_started",
      approvalStatus: "not_approved",
      expectedOutcome: EXPECTED_OUTCOME,
      itemCount: batch.itemCount,
      priorityFocus: batch.priorityFocus,
      modules: batch.modules,
      sourceFamilies: batch.sourceFamilies,
      lessonIds: batch.lessonIds,
      reviewOrder: [
        "rewrite_original_prose",
        "check_green_source_fit",
        "check_fact_and_term_boundaries",
        "check_no_action_language",
        "check_no_external_body_copying",
        "record_human_review_notes",
      ],
      statusTransitions: [
        "not_started -> rewrite_in_progress",
        "rewrite_in_progress -> needs_fact_check",
        "needs_fact_check -> needs_boundary_check",
        "needs_boundary_check -> ready_for_separate_human_approval_review",
        "any_status -> blocked_for_source_fit_review",
      ],
      batchExitRule: "A batch can only leave the workbench when every lesson has human reviewer notes for original wording, source fit, fact check, boundary check, and copying risk; even then the lessons remain structural_draft until separate approval.",
      lessonCards: batch.lessonIds.map((lessonId) => {
        const item = itemByLessonId.get(lessonId);
        return {
          lessonId,
          module: item?.module,
          topic: item?.topic,
          currentGrade: item?.currentGrade,
          currentScore: item?.currentScore,
          rewritePriority: item?.rewritePriority,
          sourceFamilies: item?.sourceFamilies || [],
          trackingStatus: "not_started",
          requiredNotes: [
            "originalRewriteNotes",
            "sourceFitNotes",
            "factCheckNotes",
            "boundaryCheckNotes",
            "copyingRiskNotes",
          ],
          mustRemainStructuralDraft: true,
        };
      }),
    })),
    boundary: "This guide tracks human review work only. It does not approve content, expand learner-facing exposure, change lesson status, create trading advice, or permit copied source text.",
  };
}

const batchReviewGuide = buildBatchReviewGuide(rewriteBatches);

const lessonRewriteWorkbench = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  expectedOutcome: EXPECTED_OUTCOME,
  selectionRule: "Select the lowest-scoring non-hand-authored structural_draft lessons in each module that already have green reviewed and authority source grounding.",
  items,
  rewriteBatches,
  batchReviewGuide,
  boundary: "This workbench is a human-review queue only. It does not approve final course copy, copy external text, provide trading advice, or promote any generated draft to commercial_ready.",
};

const lessonRewriteWorkbenchReport = {
  generatedAt: lessonRewriteWorkbench.generatedAt,
  educationOnly: true,
  productionReady: false,
  totalItems: items.length,
  modulesCovered: Object.keys(moduleCounts).length,
  minItemsPerModule: Math.min(...Object.values(moduleCounts)),
  moduleCounts,
  priorityCounts,
  sourceFamilyCounts,
  rewriteBatches: rewriteBatches.length,
  batchReviewGuideBatches: batchReviewGuide.batches.length,
  batchReviewGuideLessonCards: batchReviewGuide.batches.reduce((sum, batch) => sum + batch.lessonCards.length, 0),
  batchSizeRange: {
    min: Math.min(...rewriteBatches.map((batch) => batch.itemCount)),
    max: Math.max(...rewriteBatches.map((batch) => batch.itemCount)),
  },
  handAuthoredItems: items.filter((item) => item.handAuthored).length,
  yellowRedResearchLeaks: items
    .flatMap((item) => [...item.greenReviewedSources, ...item.greenAuthoritySources])
    .filter((ref) => !GREEN_SOURCE_TIERS.has(ref.sourceUseTier)).length,
  expectedOutcome: EXPECTED_OUTCOME,
  boundary: lessonRewriteWorkbench.boundary,
};

module.exports = {
  GREEN_SOURCE_TIERS,
  EXPECTED_OUTCOME,
  lessonRewriteWorkbench,
  lessonRewriteWorkbenchReport,
  batchReviewGuide,
};
