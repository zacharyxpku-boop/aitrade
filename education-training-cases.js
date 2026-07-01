// Training case layer — the skeleton for the "练" half of the product.
// A training case is an annotated chart situation: "what happened here + why +
// what a learner could misread." It is the structure an AI coach grades against.
//
// CRITICAL COMPLIANCE: this layer does NOT fabricate price/OHLC data. Every case
// carries an explicit `chartData: { status: "licensed_data_pending" }` placeholder.
// Real candles slot in only when a licensed/authorized market-data source is
// connected. Demo/sample data must never be dressed up as real market data.
//
// educationOnly:true / productionReady:false. No buy/sell calls, no signals,
// no performance claims — these are observation-and-review training shells.

const { knowledgeBrowserIndex } = require("./education-knowledge-browser-index");
const { mistakeTags } = require("./education-mistake-tags");
const { searchChunks, queryTermsForNode } = require("./education-corpus-retrieval");

const moduleToCoverageDomain = {
  图表阅读基础: "chart_price_action", 市场结构: "chart_price_action", "K线与价格行为": "chart_price_action",
  趋势: "chart_price_action", 突破: "chart_price_action", 交易区间: "chart_price_action", 反转: "chart_price_action",
  多周期分析: "indicator_pattern_taxonomy", "新闻/情绪/事件偏见": "news_sentiment_events",
  回测误区: "backtesting_research_hygiene", 风险管理: "risk_portfolio", 交易心理: "psychology_behavior",
};

// Annotation roles: the observable things a learner must point at on a chart.
// These are generic structural slots, filled with the case topic, NOT predictions.
function annotationScaffold(topic) {
  return [
    { role: "context", prompt: `先标出与「${topic}」相关的高周期背景：当前处于趋势、区间还是转换期。`, observation: "（待学员/审稿填写图表事实）", evidenceChunkIds: [] },
    { role: "structure", prompt: `标出最近的摆动高低点，说明「${topic}」出现在结构的什么位置。`, observation: "（待填写）", evidenceChunkIds: [] },
    { role: "trigger", prompt: `指出「${topic}」的局部触发细节，并注明它单独是否足以支撑结论。`, observation: "（待填写）", evidenceChunkIds: [] },
    { role: "invalidation", prompt: `写出这次解读的失效条件：出现什么就说明判断错了。`, observation: "（待填写）", evidenceChunkIds: [] },
  ];
}

function pickMistakeTraps(module, index) {
  const domainHint = {
    交易心理: "psychology", 风险管理: "risk", 回测误区: "backtest",
    "新闻/情绪/事件偏见": "news", 突破: "breakout", 反转: "reversal",
  }[module] || "chart";
  const matched = mistakeTags.filter((tag) => (tag.id || "").includes(domainHint));
  const pool = matched.length >= 2 ? matched : mistakeTags;
  return [pool[index % pool.length], pool[(index + 3) % pool.length]].filter(Boolean).map((tag) => ({
    mistakeTagId: tag.id,
    label: tag.label,
    diagnosis: `如果学员在本案例中表现出「${tag.label}」，提示其回到结构、周期与背景证据重新描述，不直接给方向。`,
  }));
}

const learnerNodes = knowledgeBrowserIndex.learnerFacingNodes;

const trainingCases = learnerNodes.map((node, index) => {
  const domain = moduleToCoverageDomain[node.module];
  const evidence = searchChunks(`${queryTermsForNode(node)} ${node.topic}`, { domain, limit: 2 })
    .map((hit) => ({ chunkId: hit.chunkId, sourceUrl: hit.url, licenseTier: hit.tier }));
  const annotations = annotationScaffold(node.topic).map((slot, slotIndex) => ({
    ...slot,
    evidenceChunkIds: evidence[slotIndex % evidence.length] ? [evidence[slotIndex % evidence.length].chunkId] : [],
  }));
  return {
    id: `case_${String(index + 1).padStart(4, "0")}`,
    educationOnly: true,
    productionReady: false,
    nodeId: node.id,
    module: node.module,
    topic: node.topic,
    coverageDomain: domain,
    // No fabricated candles. Real OHLC slots in only after licensed data connects.
    chartData: {
      status: "licensed_data_pending",
      instrument: null,
      timeframe: null,
      dateRange: null,
      note: "历史行情/盘口数据为授权数据待接入框架，禁止用 demo 或模拟数据冒充真实授权行情。",
    },
    annotations,
    whatHappenedPrompt: `用图表事实描述这段「${node.topic}」：看到了什么、它在哪里、哪些还不确定。不预测后续走势。`,
    whyItMattersPrompt: `说明为什么这段案例值得作为「${node.topic}」的学习样本，它训练的是哪种观察能力。`,
    mistakeTraps: pickMistakeTraps(node.module, index),
    rubricRef: { source: "knowledge_lesson", nodeId: node.id, note: "批改标准复用该节点 lesson 的 rubricDraft，保证案例练习与课程判定一致。" },
    evidenceRefs: evidence,
    learnerBoundary: "本案例为教育观察训练框架，不提供买卖、信号、收益承诺或真实资金操作指导。",
    sourceBoundary: "标注证据来自已审授权语料，案例讲解为原创表达；真实行情数据待授权接入。",
    reviewStatus: "case_skeleton",
  };
});

const casesWithEvidence = trainingCases.filter((item) => item.evidenceRefs.length > 0).length;
const trainingCaseReport = {
  educationOnly: true,
  productionReady: false,
  cases: trainingCases.length,
  casesWithEvidence,
  modules: [...new Set(trainingCases.map((item) => item.module))].length,
  chartDataStatus: "licensed_data_pending",
  fabricatedPriceData: 0,
  boundary: "Training-case layer is the skeleton for the practice half. Chart data is a licensed-data-pending placeholder; nothing here is real market data, trading advice, or a performance claim.",
};

module.exports = { trainingCases, trainingCaseReport };
