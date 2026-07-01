const { conceptCandidates } = require("./education-concept-candidates");
const { patternTaxonomy } = require("./education-pattern-taxonomy");
const { sourceInventory, sourceReviews } = require("./education-source-harvest-engine");
const { sourceTopicAssignments } = require("./education-source-topic-coverage");

const learningModules = [
  "图表阅读基础",
  "市场结构",
  "K线与价格行为",
  "趋势",
  "突破",
  "交易区间",
  "反转",
  "多周期分析",
  "新闻/情绪/事件偏见",
  "回测误区",
  "风险管理",
  "交易心理",
];

const moduleTopics = {
  图表阅读基础: ["结构先行", "价格位置", "收盘确认", "影线含义", "波动变化"],
  市场结构: ["高低点", "结构延续", "结构破坏", "关键区域", "价格接受"],
  "K线与价格行为": ["单根K线误区", "组合K线", "流动性扫过", "形态语境", "行为证据"],
  趋势: ["趋势定义", "趋势回调", "趋势加速", "趋势衰竭", "趋势中继"],
  突破: ["突破前压缩", "有效突破", "假突破", "突破回踩", "突破失败"],
  交易区间: ["区间上沿", "区间下沿", "区间中部", "区间轮动", "区间突破"],
  反转: ["反转定义", "衰竭证据", "双顶双底", "回调混淆", "反转失败"],
  多周期分析: ["D1背景", "H4结构", "H1节奏", "M15细节", "周期冲突"],
  "新闻/情绪/事件偏见": ["标题偏见", "事件时间", "情绪极端", "叙事滞后", "单源偏差"],
  回测误区: ["偷看未来", "样本太少", "过拟合", "成本忽略", "指标误用"],
  风险管理: ["失效条件", "不行动条件", "不确定性", "可复盘计划", "边界语言"],
  交易心理: ["害怕错过", "确认偏误", "过度自信", "情绪修正", "结果导向"],
};

const reviewBySourceId = new Map(sourceReviews.map((review) => [review.sourceId, review]));
const topicBySourceId = new Map(sourceTopicAssignments.map((assignment) => [assignment.sourceId, assignment]));
const GREEN_SOURCE_TIERS = new Set(["green_official_public_domain", "green_public_domain_classic"]);

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

const domainFallbacks = {
  indicator_pattern_taxonomy: ["market_data_api_boundary", "chart_price_action"],
  backtesting_research_hygiene: ["risk_portfolio", "market_data_api_boundary"],
  news_sentiment_events: ["market_data_api_boundary", "macro_economic_data"],
};

function sourceDomainForClusterIndex(index) {
  return sourceDomainCycle[index % sourceDomainCycle.length] || "chart_price_action";
}

function authorityTierForSource(source) {
  if (source.status === "research_only") return "R";
  if (["official-docs", "exchange-docs"].includes(source.sourceType) && ["S", "A"].includes(source.reliabilityGrade)) return "S";
  if (source.sourceType === "public-domain-classic" && ["S", "A", "B"].includes(source.reliabilityGrade)) return "A";
  if (["data-provider-docs", "education-reference"].includes(source.sourceType) && ["S", "A", "B"].includes(source.reliabilityGrade)) return "A";
  return "R";
}

function isGreenSource(source) {
  return GREEN_SOURCE_TIERS.has(source.sourceUseTier) && reviewBySourceId.get(source.id)?.allowedForLearnerFacing;
}

const greenAuthoritySources = sourceInventory
  .filter(isGreenSource)
  .filter((source) => ["S", "A"].includes(authorityTierForSource(source)));

function greenSourcesForDomain(domain, index) {
  const wanted = [domain, ...(domainFallbacks[domain] || []), "market_data_api_boundary", "chart_price_action"];
  const pool = greenAuthoritySources.filter((source) => {
    const topics = topicBySourceId.get(source.id)?.topics || [];
    return wanted.some((topic) => topics.includes(topic));
  });
  const usable = pool.length ? pool : greenAuthoritySources;
  return [0, 1].map((offset) => usable[(index + offset * 11) % usable.length]).filter(Boolean);
}

function authorityGroundingRefsFor(index) {
  const domain = sourceDomainForClusterIndex(index);
  return greenSourcesForDomain(domain, index).map((source) => ({
    sourceId: source.id,
    name: source.name,
    url: source.url,
    sourceType: source.sourceType,
    sourceUseTier: source.sourceUseTier,
    authorityTier: authorityTierForSource(source),
    topicDomain: domain,
    allowedUse: source.allowedUse,
    disallowedUse: source.disallowedUse,
    groundingUse: "Cluster-level green source grounding for taxonomy, source boundary, and original lesson rewrite evidence only.",
  }));
}

const conceptClusters = Array.from({ length: 3000 }, (_, index) => {
  const module = learningModules[index % learningModules.length];
  const topic = moduleTopics[module][Math.floor(index / learningModules.length) % moduleTopics[module].length];
  const start = (index * 7) % conceptCandidates.length;
  const pattern = patternTaxonomy[index % patternTaxonomy.length];
  return {
    id: `cluster_${String(index + 1).padStart(4, "0")}`,
    module,
    topic,
    title: `${module}: ${topic} cluster ${Math.floor(index / (learningModules.length * moduleTopics[module].length)) + 1}`,
    conceptCandidateIds: conceptCandidates.slice(start, start + 4).map((item) => item.id),
    patternTaxonomyIds: [pattern.id],
    teachingIntent: `Turn ${topic} from a source/taxonomy label into an explainable, practicable, and reviewable education node.`,
    riskBoundary: "Cluster is candidate concept grouping only; it is not direct learner-facing copy.",
    authorityGroundingRefs: authorityGroundingRefsFor(index),
    sourceGroundingBoundary: "Only green official/public-domain sources can ground learner-facing rewrite evidence; yellow/red sources remain metadata or review backlog.",
    learnerFacingAllowed: false,
  };
});

module.exports = {
  learningModules,
  conceptClusters,
};
