const { mistakeTags } = require("./education-mistake-tags");
const { rubrics } = require("./education-rubrics");
const { knowledgeQualityScore } = require("./education-knowledge-quality");

const domains = [
  {
    key: "chart_basics",
    label: "图表阅读基础",
    topics: ["K线是行为记录", "单根K线误区", "结构优先", "价格位置", "收盘确认", "波动变化", "图表缩放偏差", "观察语言"],
  },
  {
    key: "market_structure",
    label: "市场结构",
    topics: ["高点低点", "结构延续", "结构破坏", "关键区域", "价格接受", "价格拒绝", "支撑压力区域", "结构证据链"],
  },
  {
    key: "candles_price_action",
    label: "K线与价格行为",
    topics: ["实体与影线", "吞没形态语境", "锤子线语境", "十字星语境", "连续K线压力", "假动作", "流动性扫过", "行为而非名字"],
  },
  {
    key: "trend",
    label: "趋势",
    topics: ["趋势定义", "上升结构", "下降结构", "趋势回调", "趋势加速", "趋势衰竭", "趋势中继", "逆势误区"],
  },
  {
    key: "breakout",
    label: "突破",
    topics: ["突破定义", "突破前压缩", "有效突破观察", "假突破", "突破后回踩", "区间边缘突破", "新闻推动突破", "突破失败复盘"],
  },
  {
    key: "range",
    label: "交易区间",
    topics: ["区间定义", "区间上沿", "区间下沿", "区间中部噪音", "区间假突破", "区间内追逐", "区间突破确认", "区间切换"],
  },
  {
    key: "reversal",
    label: "反转",
    topics: ["反转定义", "反转不是单根K线", "趋势衰竭", "双顶双底语境", "头肩形态语境", "反转与回调", "反转失败", "情绪推动反转"],
  },
  {
    key: "multi_timeframe",
    label: "多周期分析",
    topics: ["D1定方向", "H4看结构", "H1看节奏", "M15看细节", "周期冲突", "小周期诱导", "大周期边界", "由大到小复盘"],
  },
  {
    key: "news_sentiment",
    label: "新闻/情绪/事件偏见",
    topics: ["新闻是背景", "标题偏见", "事件前波动", "事件后回撤", "利好利空误读", "情绪过热", "单一来源偏差", "叙事复盘"],
  },
  {
    key: "backtest_psychology",
    label: "回测与交易心理误区",
    topics: ["偷看未来", "样本太少", "只挑成功样本", "忽略成本", "一次样本当规律", "指标不是证明", "错题复盘", "只改一件事"],
  },
];

const difficultyStages = ["入门", "进阶", "专题", "综合案例"];

function tagFor(index) {
  return mistakeTags[index % mistakeTags.length].id;
}

function nodeId(domainIndex, topicIndex) {
  return `kn_${String(domainIndex + 1).padStart(2, "0")}_${String(topicIndex + 1).padStart(2, "0")}`;
}

const knowledgeNodes = domains.flatMap((domain, domainIndex) => (
  domain.topics.map((topic, topicIndex) => {
    const id = nodeId(domainIndex, topicIndex);
    const previous = topicIndex > 0
      ? nodeId(domainIndex, topicIndex - 1)
      : nodeId((domainIndex + domains.length - 1) % domains.length, domains[(domainIndex + domains.length - 1) % domains.length].topics.length - 1);
    const nextInDomain = topicIndex < domain.topics.length - 1
      ? [nodeId(domainIndex, topicIndex + 1)]
      : [nodeId((domainIndex + 1) % domains.length, 0)];
    const globalIndex = domainIndex * 8 + topicIndex;
    const item = {
      id,
      title: `${domain.label}：${topic}`,
      module: domain.label,
      topic,
      difficulty: topicIndex < 2 ? "starter" : topicIndex < 5 ? "builder" : "advanced",
      difficultyStage: difficultyStages[Math.min(3, Math.floor(topicIndex / 2))],
      definition: `${topic}是${domain.label}中的一个原子学习点，用来训练学习者先描述可观察结构，再解释背景和误区。`,
      principle: `${topic}不能脱离价格位置、市场结构和多周期背景理解；它只是一种阅读线索，不是行动结论。`,
      whyItMatters: `学习${topic}可以减少凭单一K线、新闻标题或短周期波动下结论的冲动。`,
      whenItAppears: `常见于学习者复盘${domain.label}案例时，尤其是D1/H4背景和M15细节不一致的时候。`,
      howToRead: `先看D1方向，再看H4结构，再用H1确认节奏，最后用M15描述细节；每一步都只写观察，不写实盘动作。`,
      multiTimeframeView: {
        D1: "先确认大背景和主要结构位置。",
        H4: "再确认区间、趋势段或关键区域。",
        H1: "观察节奏变化和结构是否延续。",
        M15: "只用于描述局部细节，不能单独得出结论。",
      },
      commonMistakes: [
        "只看小周期就下结论。",
        "把新闻或情绪当成行动理由。",
        "把形态名字当成完整分析。",
      ],
      antiExamples: [
        `看到${topic}相关形态后立刻给出方向性结论。`,
        "用一次样本总结固定规则。",
      ],
      relatedCaseIds: [`case_${String((globalIndex % 30) + 1).padStart(3, "0")}`],
      practiceTaskIds: [`scenario_${String(globalIndex + 1).padStart(3, "0")}`],
      rubricIds: [rubrics[globalIndex % rubrics.length].id],
      mistakeTagIds: [tagFor(globalIndex), tagFor(globalIndex + 9)],
      prerequisiteNodeIds: [previous],
      nextNodeIds: nextInDomain,
      sourceRefs: ["src_original_curriculum", domain.key.includes("candles") ? "src_talib" : "src_pandas_ta_classic"],
      sourceReliability: "A",
      licenseNote: "Learner-facing expression is original; external sources are taxonomy references only.",
      controversyNote: `${topic}在不同交易教学体系中解释口径可能不同，本产品只采用教育阅读口径，不把它转成实盘规则。`,
      boundaryNote: "本知识点只用于图表阅读和教育复盘，不提供荐股、即时交易提示、收益承诺或资金操作指导。",
      reviewStatus: "draft",
    };
    return {
      ...item,
      qualityScore: knowledgeQualityScore(item),
    };
  })
));

module.exports = {
  domains,
  knowledgeNodes,
};
