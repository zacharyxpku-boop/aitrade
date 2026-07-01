const { domains, knowledgeNodes } = require("./education-knowledge-taxonomy");
const { marketCases } = require("./education-market-cases");
const { trainingScenarios } = require("./education-training-scenarios");
const { mistakeTags } = require("./education-mistake-tags");
const { rubrics } = require("./education-rubrics");
const { sourceReviews } = require("./education-source-review");
const { learningPathEdges } = require("./education-learning-paths");

const knowledgeEngine = {
  meta: {
    name: "TradeGym AI交易教育知识工程系统",
    version: "0.1.0",
    educationOnly: true,
    productionReady: false,
    learnerBoundary: "只用于教育解释、图表阅读、轻训练和AI复盘；不用于荐股、即时交易提示、收益承诺、券商连接、自动交易或资金操作指导。",
  },
  layers: [
    "L0课程域",
    "L1能力模块",
    "L2知识主题",
    "L3原子知识点",
    "L4图表案例",
    "L5常见错因",
    "L6训练任务",
    "L7 AI批改标准",
  ],
  domains,
  knowledgeNodes,
  marketCases,
  trainingScenarios,
  mistakeTags,
  rubrics,
  sourceReviews,
  learningPathEdges,
};

module.exports = {
  knowledgeEngine,
  domains,
  knowledgeNodes,
  marketCases,
  trainingScenarios,
  mistakeTags,
  rubrics,
  sourceReviews,
  learningPathEdges,
};
