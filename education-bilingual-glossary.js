// Bilingual finance glossary — the Chinese-language bridge for the knowledge base.
// Curated, not generated: each entry maps an English source term to its standard
// Chinese term, common aliases, the domain it belongs to, and an ORIGINAL one-line
// Chinese gloss written for learners. Glosses are original education expression,
// never copied from any source. This layer lets a Chinese learner navigate an
// English-sourced evidence base.
//
// educationOnly:true / productionReady:false. No trading advice, signals, or
// performance claims anywhere in this file.

const glossary = [
  // —— 图表与价格行为 chart_price_action ——
  { en: "price action", zh: "价格行为", aliases: ["裸K", "纯价格"], domain: "chart_price_action", gloss: "只看价格本身的运动来读市场，不依赖指标，先描述事实再谈解释。" },
  { en: "candlestick", zh: "K线 / 蜡烛图", aliases: ["阴阳线"], domain: "chart_price_action", gloss: "一根K线记录一段时间的开高低收，是图表阅读的最小单元。" },
  { en: "support", zh: "支撑", aliases: ["支撑位"], domain: "chart_price_action", gloss: "价格多次下跌到附近就被买盘接住的区域，是观察而非买卖指令。" },
  { en: "resistance", zh: "阻力", aliases: ["压力位"], domain: "chart_price_action", gloss: "价格多次上涨到附近就被卖盘压住的区域，强弱要看价格如何反应。" },
  { en: "support and resistance", zh: "支撑与阻力", aliases: ["支阻"], domain: "chart_price_action", gloss: "用历史上价格被接住或压住的区域，给当下走势画出参照框架。" },
  { en: "swing high", zh: "摆动高点", aliases: ["波段高点"], domain: "chart_price_action", gloss: "一段上涨后形成的局部最高点，用来标记结构和趋势方向。" },
  { en: "swing low", zh: "摆动低点", aliases: ["波段低点"], domain: "chart_price_action", gloss: "一段下跌后形成的局部最低点，与摆动高点一起界定市场结构。" },
  { en: "trend line", zh: "趋势线", aliases: ["趋势通道"], domain: "chart_price_action", gloss: "连接多个高点或低点的辅助线，帮助看清推进方向，不是精确买卖线。" },
  { en: "breakout", zh: "突破", aliases: ["破位"], domain: "chart_price_action", gloss: "价格离开原有区间，关键是看市场是否真正接受了新价格，而非穿过一条线。" },
  { en: "false breakout", zh: "假突破", aliases: ["假破位", "诱多诱空"], domain: "chart_price_action", gloss: "价格短暂越过关键位又快速收回，是初学者最常误读的形态之一。" },
  { en: "chart pattern", zh: "图表形态", aliases: ["技术形态"], domain: "chart_price_action", gloss: "价格走出的可识别图形，只是观察入口的分类标签，不构成因果结论。" },
  { en: "head and shoulders", zh: "头肩形态", aliases: ["头肩顶", "头肩底"], domain: "chart_price_action", gloss: "由三个高点构成的经典反转形态，需要结构证据链而非单根K线确认。" },
  { en: "double top", zh: "双顶", aliases: ["M顶"], domain: "chart_price_action", gloss: "价格两次冲高未能突破形成的形态，判断时要回看更大周期背景。" },
  { en: "double bottom", zh: "双底", aliases: ["W底"], domain: "chart_price_action", gloss: "价格两次探底获得支撑形成的形态，是否有效取决于后续结构。" },
  { en: "doji", zh: "十字星", aliases: ["十字线"], domain: "chart_price_action", gloss: "开盘价与收盘价几乎相等的K线，表示多空暂时平衡，含义随位置变化。" },
  { en: "wick", zh: "影线", aliases: ["上影线", "下影线"], domain: "chart_price_action", gloss: "K线实体之外的细线，记录被拒绝的价格区域，长影线常暗示一方力量衰竭。" },
  { en: "engulfing", zh: "吞没形态", aliases: ["吞噬"], domain: "chart_price_action", gloss: "一根K线完全覆盖前一根的形态，要结合位置和周期才有解读价值。" },
  { en: "tape reading", zh: "盘口阅读", aliases: ["读盘", "看盘"], domain: "chart_price_action", gloss: "通过逐笔成交和报价变化感知供需，是Wyckoff年代延续至今的观察方法。" },

  // —— 指标与形态分类 indicator_pattern_taxonomy ——
  { en: "moving average", zh: "移动平均线", aliases: ["均线", "MA"], domain: "indicator_pattern_taxonomy", gloss: "对一段时间价格取平均，平滑波动以看清方向，滞后是它的固有代价。" },
  { en: "relative strength index", zh: "相对强弱指标", aliases: ["RSI"], domain: "indicator_pattern_taxonomy", gloss: "衡量近期涨跌力量对比的震荡指标，超买超卖只是参考而非买卖信号。" },
  { en: "MACD", zh: "指数平滑异同移动平均", aliases: ["MACD指标"], domain: "indicator_pattern_taxonomy", gloss: "用两条均线之差捕捉动能变化，金叉死叉需结合趋势背景理解。" },
  { en: "bollinger bands", zh: "布林带", aliases: ["布林通道", "BOLL"], domain: "indicator_pattern_taxonomy", gloss: "以均线加减标准差画出的通道，带宽反映波动率而非方向。" },
  { en: "stochastic oscillator", zh: "随机指标", aliases: ["KD", "KDJ"], domain: "indicator_pattern_taxonomy", gloss: "比较收盘价在近期区间中的位置，用来观察动能而非预测涨跌。" },
  { en: "momentum", zh: "动量", aliases: ["动能"], domain: "indicator_pattern_taxonomy", gloss: "价格变化的速度与力度，可作为趋势强弱的观察维度。" },
  { en: "volume", zh: "成交量", aliases: ["量能"], domain: "indicator_pattern_taxonomy", gloss: "一段时间内的成交规模，是验证价格动作是否被市场认可的旁证。" },
  { en: "volatility", zh: "波动率", aliases: ["波动性"], domain: "indicator_pattern_taxonomy", gloss: "价格波动的剧烈程度，高波动意味着更大的不确定性而非方向。" },

  // —— 回测与研究卫生 backtesting_research_hygiene ——
  { en: "backtesting", zh: "回测", aliases: ["历史回测"], domain: "backtesting_research_hygiene", gloss: "用历史数据检验一套规则的表现，是研究卫生检查，不是未来收益证明。" },
  { en: "overfitting", zh: "过拟合", aliases: ["过度拟合", "曲线拟合"], domain: "backtesting_research_hygiene", gloss: "规则被历史数据调得过于精细，看起来有效实则记住了噪音。" },
  { en: "look-ahead bias", zh: "前视偏差", aliases: ["未来函数"], domain: "backtesting_research_hygiene", gloss: "回测中误用了当时还无法获得的信息，会让错误方法显得有效。" },
  { en: "survivorship bias", zh: "幸存者偏差", aliases: ["生存偏差"], domain: "backtesting_research_hygiene", gloss: "只统计活下来的样本，忽略已退市或失败的样本，系统性高估表现。" },
  { en: "data snooping", zh: "数据窥探", aliases: ["数据挖掘偏差"], domain: "backtesting_research_hygiene", gloss: "反复在同一数据上试很多规则，总能撞出巧合，把运气误当规律。" },
  { en: "walk-forward", zh: "前向验证", aliases: ["滚动验证"], domain: "backtesting_research_hygiene", gloss: "用滚动的样本外窗口检验规则稳健性，降低过拟合的迷惑性。" },
  { en: "out-of-sample", zh: "样本外", aliases: ["样本外测试"], domain: "backtesting_research_hygiene", gloss: "在构建规则时没用到的数据上做检验，是判断有效性的基本卫生。" },
  { en: "sharpe ratio", zh: "夏普比率", aliases: ["夏普"], domain: "backtesting_research_hygiene", gloss: "每承担一单位波动获得的超额回报，常被多重检验虚高，需谨慎解读。" },
  { en: "multiple testing", zh: "多重检验", aliases: ["多重比较"], domain: "backtesting_research_hygiene", gloss: "同时检验大量假设会抬高假阳性概率，是策略研究的常见陷阱。" },

  // —— 风险与组合 risk_portfolio ——
  { en: "risk management", zh: "风险管理", aliases: ["风控"], domain: "risk_portfolio", gloss: "训练失效条件、不行动条件和可复盘计划，而不是给出操作指令。" },
  { en: "drawdown", zh: "回撤", aliases: ["最大回撤"], domain: "risk_portfolio", gloss: "从高点到低点的损失幅度，衡量策略在最坏阶段的承受要求。" },
  { en: "position sizing", zh: "仓位管理", aliases: ["头寸规模"], domain: "risk_portfolio", gloss: "决定一笔交易投入多大比例的研究课题，是教育层讨论而非操作建议。" },
  { en: "diversification", zh: "分散化", aliases: ["分散投资"], domain: "risk_portfolio", gloss: "把风险分摊到相关性较低的多个标的上，降低单一冲击的影响。" },
  { en: "value at risk", zh: "在险价值", aliases: ["VaR"], domain: "risk_portfolio", gloss: "在给定置信水平下一段时间可能的最大损失估计，有其模型局限。" },
  { en: "portfolio", zh: "投资组合", aliases: ["组合"], domain: "risk_portfolio", gloss: "多个持仓的整体，研究重点是整体风险收益结构而非单一标的。" },
  { en: "margin", zh: "保证金", aliases: ["杠杆保证金"], domain: "risk_portfolio", gloss: "用借入资金放大仓位时需缴纳的担保，放大收益同时放大风险。" },
  { en: "leverage", zh: "杠杆", aliases: ["融资杠杆"], domain: "risk_portfolio", gloss: "用借入资金扩大敞口，是风险教育的重点对象而非鼓励使用的工具。" },
  { en: "kelly criterion", zh: "凯利公式", aliases: ["凯利准则"], domain: "risk_portfolio", gloss: "理论上的最优下注比例公式，现实中因参数不确定而需大幅打折理解。" },

  // —— 心理与行为 psychology_behavior ——
  { en: "behavioral finance", zh: "行为金融学", aliases: ["行为金融"], domain: "psychology_behavior", gloss: "研究认知偏误如何系统性影响决策的学科，是交易心理教育的理论根基。" },
  { en: "loss aversion", zh: "损失厌恶", aliases: ["亏损厌恶"], domain: "psychology_behavior", gloss: "对亏损的痛苦远大于同等盈利的快乐，会扭曲复盘和决策。" },
  { en: "confirmation bias", zh: "确认偏误", aliases: ["验证性偏差"], domain: "psychology_behavior", gloss: "只注意支持自己观点的证据，在复盘时会悄悄改写记忆。" },
  { en: "overconfidence", zh: "过度自信", aliases: ["过度自信偏差"], domain: "psychology_behavior", gloss: "高估自己判断的准确度，常导致忽视失效条件和反向证据。" },
  { en: "herding", zh: "羊群效应", aliases: ["从众"], domain: "psychology_behavior", gloss: "跟随大众而非独立判断，是市场情绪传染的心理机制。" },
  { en: "FOMO", zh: "害怕错过", aliases: ["错失恐惧"], domain: "psychology_behavior", gloss: "担心错过机会而仓促行动，会让学习者把巧合当确定性依据。" },
  { en: "disposition effect", zh: "处置效应", aliases: ["处分效应"], domain: "psychology_behavior", gloss: "倾向过早兑现盈利、过久持有亏损的行为偏差，影响复盘客观性。" },
  { en: "prospect theory", zh: "前景理论", aliases: ["展望理论"], domain: "psychology_behavior", gloss: "描述人在不确定下如何非理性地评估收益与损失的理论框架。" },

  // —— 新闻情绪与事件 news_sentiment_events ——
  { en: "sentiment", zh: "市场情绪", aliases: ["情绪"], domain: "news_sentiment_events", gloss: "群体对市场的整体态度，只做背景和偏见检查，不替代图表证据。" },
  { en: "sentiment analysis", zh: "情绪分析", aliases: ["舆情分析"], domain: "news_sentiment_events", gloss: "用文本量化市场情绪倾向的方法，存在数据偏差和滞后等局限。" },
  { en: "event study", zh: "事件研究", aliases: ["事件分析法"], domain: "news_sentiment_events", gloss: "考察特定事件前后价格反应的研究方法，需注意信息已被部分消化。" },
  { en: "efficient market hypothesis", zh: "有效市场假说", aliases: ["EMH"], domain: "news_sentiment_events", gloss: "认为价格已反映可得信息的理论，是讨论新闻能否带来优势的基准。" },
  { en: "earnings announcement", zh: "财报公告", aliases: ["业绩公告"], domain: "news_sentiment_events", gloss: "公司定期披露业绩的事件，常引发价格波动，是事件研究的典型对象。" },

  // —— 宏观经济数据 macro_economic_data ——
  { en: "inflation", zh: "通货膨胀", aliases: ["通胀"], domain: "macro_economic_data", gloss: "物价整体上涨的程度，影响货币政策预期和资产估值的重要宏观变量。" },
  { en: "CPI", zh: "消费者价格指数", aliases: ["居民消费价格指数"], domain: "macro_economic_data", gloss: "衡量一篮子消费品价格变化的核心通胀指标，市场高度关注其公布。" },
  { en: "GDP", zh: "国内生产总值", aliases: ["国民生产总值"], domain: "macro_economic_data", gloss: "一国一段时间产出的总量，是判断经济周期阶段的基础数据。" },
  { en: "monetary policy", zh: "货币政策", aliases: ["央行政策"], domain: "macro_economic_data", gloss: "央行通过利率和流动性影响经济的手段，是宏观背景的关键驱动。" },
  { en: "interest rate", zh: "利率", aliases: ["基准利率"], domain: "macro_economic_data", gloss: "资金的价格，利率预期变化会广泛影响各类资产的相对吸引力。" },
  { en: "yield curve", zh: "收益率曲线", aliases: ["利率曲线"], domain: "macro_economic_data", gloss: "不同期限国债利率连成的曲线，其形状常被用作经济周期的参考。" },
  { en: "federal reserve", zh: "美联储", aliases: ["美国联邦储备", "Fed"], domain: "macro_economic_data", gloss: "美国的中央银行，其政策决议是全球市场最重要的宏观事件之一。" },
  { en: "unemployment", zh: "失业率", aliases: ["就业数据"], domain: "macro_economic_data", gloss: "反映劳动力市场状况的核心指标，影响货币政策与市场预期。" },

  // —— 数据授权边界 market_data_api_boundary ——
  { en: "market data", zh: "行情数据", aliases: ["市场数据"], domain: "market_data_api_boundary", gloss: "价格、成交等市场信息，使用与再分发受数据提供方条款约束。" },
  { en: "data license", zh: "数据授权", aliases: ["数据许可"], domain: "market_data_api_boundary", gloss: "使用商业行情数据需要的授权，决定能否在产品中再分发。" },
  { en: "redistribution", zh: "再分发", aliases: ["二次分发"], domain: "market_data_api_boundary", gloss: "把获取的数据再提供给第三方，通常需要单独且更严格的授权。" },
  { en: "rate limit", zh: "频率限制", aliases: ["限流", "配额"], domain: "market_data_api_boundary", gloss: "数据接口对调用频次的限制，是接入设计时必须考虑的边界。" },
  { en: "terms of use", zh: "使用条款", aliases: ["服务条款", "ToS"], domain: "market_data_api_boundary", gloss: "来源方规定内容能否复用的法律文件，是合规采集的第一道闸门。" },

  // —— 交易所与市场微观结构 exchange_microstructure ——
  { en: "order book", zh: "订单簿", aliases: ["挂单簿", "盘口"], domain: "exchange_microstructure", gloss: "记录各价位买卖挂单的列表，反映即时的供需深度。" },
  { en: "limit order", zh: "限价单", aliases: ["限价委托"], domain: "exchange_microstructure", gloss: "指定价格才成交的委托，提供流动性但不保证成交。" },
  { en: "market order", zh: "市价单", aliases: ["市价委托"], domain: "exchange_microstructure", gloss: "以当前最优价立即成交的委托，保证成交但承担滑点。" },
  { en: "bid-ask spread", zh: "买卖价差", aliases: ["点差", "买卖差"], domain: "exchange_microstructure", gloss: "最高买价与最低卖价之差，是流动性和交易成本的直接体现。" },
  { en: "liquidity", zh: "流动性", aliases: ["市场深度"], domain: "exchange_microstructure", gloss: "在不显著移动价格下成交的能力，流动性差时滑点和波动更大。" },
  { en: "market maker", zh: "做市商", aliases: ["流动性提供者"], domain: "exchange_microstructure", gloss: "同时报出买卖价提供流动性的参与者，靠价差和管理库存获利。" },
  { en: "futures contract", zh: "期货合约", aliases: ["期货"], domain: "exchange_microstructure", gloss: "约定未来时间按约定价格交割的标准化合约，带杠杆和到期机制。" },
  { en: "option", zh: "期权", aliases: ["选择权"], domain: "exchange_microstructure", gloss: "赋予买方未来按约定价买卖权利的合约，定价涉及波动率等多重因素。" },
  { en: "implied volatility", zh: "隐含波动率", aliases: ["IV"], domain: "exchange_microstructure", gloss: "由期权价格反推出的市场对未来波动的预期，是期权研究的核心变量。" },
  { en: "settlement", zh: "结算", aliases: ["交割结算"], domain: "exchange_microstructure", gloss: "交易达成后完成资金和标的交收的过程，是市场基础设施的一环。" },
  { en: "high-frequency trading", zh: "高频交易", aliases: ["HFT"], domain: "exchange_microstructure", gloss: "以极短持仓和海量下单为特征的交易方式，深刻影响市场微观结构。" },

  // —— 开源工具 open_source_tooling ——
  { en: "library", zh: "代码库", aliases: ["程序库", "库"], domain: "open_source_tooling", gloss: "可复用的代码集合，用于实现回测、指标计算等研究任务。" },
  { en: "framework", zh: "框架", aliases: ["开发框架"], domain: "open_source_tooling", gloss: "提供结构化基础的工具集，让策略研究和数据处理更高效。" },
  { en: "algorithm", zh: "算法", aliases: ["算法逻辑"], domain: "open_source_tooling", gloss: "解决特定问题的步骤化方法，是把交易想法变成可检验规则的桥梁。" },
];

const glossaryByEn = new Map(glossary.map((entry) => [entry.en.toLowerCase(), entry]));
const glossaryByDomain = glossary.reduce((acc, entry) => {
  (acc[entry.domain] = acc[entry.domain] || []).push(entry);
  return acc;
}, {});

// All searchable surface forms (English + Chinese + aliases) -> entry.
const termIndex = new Map();
for (const entry of glossary) {
  const forms = [entry.en, entry.zh, ...(entry.aliases || [])];
  for (const form of forms) {
    for (const piece of String(form).split(/[\/、]/).map((s) => s.trim()).filter(Boolean)) {
      termIndex.set(piece.toLowerCase(), entry);
    }
  }
}

function matchGlossaryTerms(text, { limit = 6 } = {}) {
  const lower = String(text || "").toLowerCase();
  const found = [];
  const seen = new Set();
  for (const [form, entry] of termIndex) {
    if (seen.has(entry.en)) continue;
    if (lower.includes(form)) {
      seen.add(entry.en);
      found.push(entry);
      if (found.length >= limit) break;
    }
  }
  return found;
}

const glossaryReport = {
  educationOnly: true,
  productionReady: false,
  terms: glossary.length,
  domains: Object.keys(glossaryByDomain).length,
  domainCounts: Object.fromEntries(Object.entries(glossaryByDomain).map(([k, v]) => [k, v.length])),
  boundary: "Bilingual glossary is original education expression bridging English sources to Chinese learners. Not trading advice, signals, or performance claims.",
};

module.exports = {
  glossary,
  glossaryByEn,
  glossaryByDomain,
  matchGlossaryTerms,
  glossaryReport,
};
