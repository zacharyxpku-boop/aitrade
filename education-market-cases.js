const { knowledgeNodes, domains } = require("./education-knowledge-taxonomy");
const { caseQualityScore } = require("./education-knowledge-quality");

const patternTypes = [
  "structure_reading",
  "trend_pullback",
  "breakout_validation",
  "false_breakout",
  "range_edge",
  "range_middle_noise",
  "reversal_context",
  "multi_timeframe_conflict",
  "news_sentiment_bias",
  "backtest_misread",
];

function linkedNodes(index) {
  return [
    knowledgeNodes[index % knowledgeNodes.length].id,
    knowledgeNodes[(index + 10) % knowledgeNodes.length].id,
    knowledgeNodes[(index + 20) % knowledgeNodes.length].id,
  ];
}

const marketCases = Array.from({ length: 30 }, (_, index) => {
  const patternType = patternTypes[index % patternTypes.length];
  const domain = domains[index % domains.length];
  const item = {
    id: `case_${String(index + 1).padStart(3, "0")}`,
    title: `${domain.label} demo案例 ${index + 1}: ${patternType}`,
    patternType,
    marketType: index % 3 === 0 ? "index-demo" : index % 3 === 1 ? "forex-demo" : "crypto-demo",
    timeframeSet: ["D1", "H4", "H1", "M15"],
    sourceType: "demo",
    dataBoundary: "本案例为教育演示样例，不代表真实授权行情、实时数据或可交易信号。",
    chartNarrative: `这个案例用于练习${domain.label}下的${patternType}阅读：先看高周期结构，再解释局部K线。`,
    beforeContext: "案例开始前，学习者需要先描述D1与H4所在结构位置。",
    duringContext: "案例中段故意保留多周期冲突，要求学习者不要只看M15。",
    afterContext: "案例结束后只复盘观察流程，不评价真实交易结果。",
    keyObservations: [
      "D1提供背景，不给动作结论。",
      "H4定义结构区域。",
      "H1观察节奏变化。",
      "M15只描述局部细节。",
    ],
    commonTrap: "学习者容易把局部波动、新闻标题或单根K线当成完整依据。",
    whatUserShouldNotice: "先说清位置、结构、周期冲突和不确定性，再进入轻训练。",
    whatUserShouldNotConclude: "不能从这个demo案例推出任何真实标的方向、收益预期或实盘动作。",
    linkedKnowledgeNodeIds: linkedNodes(index),
    trainingScenarioIds: [
      `scenario_${String(index + 1).padStart(3, "0")}`,
      `scenario_${String(index + 31).padStart(3, "0")}`,
      `scenario_${String(index + 61).padStart(3, "0")}`,
    ].filter((id) => Number(id.slice(-3)) <= 80),
    boundaryNote: "案例只用于教育训练和图表阅读，不构成荐股、即时交易提示、收益承诺或资金操作指导。",
    reviewStatus: "draft",
  };
  return {
    ...item,
    qualityScore: caseQualityScore(item),
  };
});

module.exports = {
  marketCases,
};
