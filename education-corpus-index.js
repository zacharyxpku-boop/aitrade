const fs = require("node:fs");
const path = require("node:path");

// Corpus evidence index: turns harvested license-cleared documents into
// 500-800 character chunks tagged against the 10 source-topic domains, and
// proposes concept-association candidates. This is internal research material.
// It is not learner-facing content and grants no publication rights.

const corpusDir = "data/corpus";

const DOMAIN_KEYWORDS = {
  chart_price_action: ["candlestick", "price action", "support", "resistance", "chart pattern", "trend line", "breakout", "swing high", "swing low", "wick", "rejection", "hammer", "engulfing", "doji", "candle", "formation", "triangle", "flag", "wedge", "false breakout", "pin bar", "shadow", "body of the candle", "reversal pattern", "continuation pattern", "head and shoulders", "k线", "蜡烛图", "十字星", "影线", "实体", "支撑", "阻力", "压力位", "趋势线", "突破", "假突破", "头肩", "双重顶", "双重底", "三角形", "旗形", "楔形", "孕线", "反转k", "价格行为", "裸k"],
  indicator_pattern_taxonomy: ["moving average", "rsi", "macd", "bollinger", "oscillator", "momentum indicator", "volume indicator", "stochastic", "均线", "移动平均", "指标", "布林带", "随机指标", "成交量", "量价", "vwap", "背离", "金叉", "死叉"],
  backtesting_research_hygiene: ["backtest", "overfitting", "out-of-sample", "walk-forward", "survivorship", "look-ahead", "data snooping", "sharpe ratio", "cross-validation", "回测", "过拟合", "样本外", "未来函数", "幸存者偏差", "数据窥探", "夏普", "复盘"],
  risk_portfolio: ["risk management", "drawdown", "position sizing", "diversification", "portfolio", "value at risk", "volatility", "margin", "leverage", "stop order", "风险管理", "回撤", "仓位", "头寸", "分散", "杠杆", "保证金", "止损", "止盈", "资金管理"],
  psychology_behavior: ["behavioral", "bias", "overconfidence", "loss aversion", "herding", "fomo", "investor behavior", "fraud", "emotion", "discipline", "心理", "认知", "纪律", "情绪", "贪婪", "恐惧", "过度自信", "损失厌恶", "从众", "执行力"],
  news_sentiment_events: ["sentiment", "news", "headline", "earnings announcement", "event study", "press release", "media", "social media", "新闻", "情绪", "事件", "公告", "财报", "舆情", "消息面"],
  macro_economic_data: ["inflation", "cpi", "gdp", "unemployment", "monetary policy", "interest rate", "federal reserve", "fomc", "treasury yield", "payroll", "economic indicator", "通胀", "利率", "美联储", "货币政策", "国债收益率", "非农", "宏观"],
  market_data_api_boundary: ["api", "terms of use", "license", "redistribution", "data feed", "rate limit", "subscription", "data product", "data vendor", "entitlement", "usage policy", "data provider", "market data", "throttle", "quota", "requests per", "rate-limit", "rate limiting", "usage limit", "api key", "endpoint", "data license", "redistribution rights", "usage restriction", "feed handler", "vendor agreement", "数据源", "授权", "许可", "再分发", "行情数据", "接口"],
  exchange_microstructure: ["order book", "limit order", "market order", "bid-ask", "spread", "liquidity", "market maker", "exchange", "futures contract", "options", "settlement", "clearing", "auction", "tick", "订单簿", "盘口", "限价单", "市价单", "买卖价差", "流动性", "做市商", "撮合", "期货", "期权", "结算", "清算"],
  open_source_tooling: ["python", "library", "repository", "open source", "implementation", "framework", "algorithm", "code", "开源", "代码", "算法", "库", "框架", "脚本"],
};

const DOMAIN_TO_CONCEPT_CATEGORY = {
  chart_price_action: "chart_reading",
  indicator_pattern_taxonomy: "indicator_taxonomy",
  backtesting_research_hygiene: "backtest",
  risk_portfolio: "psychology_risk",
  psychology_behavior: "psychology_risk",
  news_sentiment_events: "news_sentiment",
  macro_economic_data: "news_sentiment",
  market_data_api_boundary: "indicator_taxonomy",
  exchange_microstructure: "breakout",
  open_source_tooling: "indicator_taxonomy",
};

function loadDocuments() {
  if (!fs.existsSync(corpusDir)) return [];
  return fs.readdirSync(corpusDir)
    .filter((file) => file.startsWith("corpus_") && file.endsWith(".json"))
    .map((file) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(corpusDir, file), "utf8"));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function chunkText(text, { min = 500, max = 800 } = {}) {
  const chunks = [];
  const clean = (text || "").replace(/\s+\n/g, "\n").trim();
  let cursor = 0;
  while (cursor < clean.length) {
    let end = Math.min(cursor + max, clean.length);
    if (end < clean.length) {
      const window = clean.slice(cursor + min, end);
      const breakAt = Math.max(window.lastIndexOf(". "), window.lastIndexOf("\n"), window.lastIndexOf("。"));
      if (breakAt > 0) end = cursor + min + breakAt + 1;
    }
    const piece = clean.slice(cursor, end).trim();
    if (piece.length >= 120) chunks.push(piece);
    cursor = end;
  }
  return chunks;
}

// Heuristic chunk quality: penalize reference-list fragments, math/symbol noise
// from PDF extraction, and very short chunks. low_noise chunks stay stored but
// are excluded from retrieval and lesson grounding.
function qualityFor(text) {
  const length = text.length;
  const refHits = (text.match(/\[\d+\]|et al\.|arXiv:\d{4}\.\d{4,5}|pp\.\s?\d+|doi\.org/gi) || []).length;
  const symbolHits = (text.match(/[{}\\^_=<>|�]/g) || []).length;
  const symbolRatio = symbolHits / Math.max(length, 1);
  let score = 1;
  if (refHits > 5) score -= 0.5;
  else if (refHits > 2) score -= 0.2;
  if (symbolRatio > 0.08) score -= 0.5;
  else if (symbolRatio > 0.04) score -= 0.2;
  if (length < 300) score -= 0.3;
  const tier = score >= 0.8 ? "high" : score >= 0.5 ? "medium" : "low_noise";
  return { score: Number(score.toFixed(2)), tier };
}

function domainsFor(text) {
  const lower = text.toLowerCase();
  const scores = [];
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    let hits = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) hits += 1;
    }
    if (hits > 0) scores.push({ domain, hits });
  }
  return scores.sort((left, right) => right.hits - left.hits).slice(0, 3);
}

const corpusDocuments = loadDocuments();
const corpusChunks = [];

for (const doc of corpusDocuments) {
  const chunks = chunkText(doc.text || "");
  chunks.forEach((text, index) => {
    const domains = domainsFor(text);
    const quality = qualityFor(text);
    corpusChunks.push({
      id: `${doc.id}_chunk_${String(index + 1).padStart(3, "0")}`,
      documentId: doc.id,
      sourceId: doc.sourceId,
      url: doc.url,
      tier: doc.tier,
      sequence: index + 1,
      charCount: text.length,
      qualityScore: quality.score,
      qualityTier: quality.tier,
      domains: domains.map((item) => item.domain),
      conceptCategoryCandidates: [...new Set(domains.map((item) => DOMAIN_TO_CONCEPT_CATEGORY[item.domain]).filter(Boolean))],
      text,
      boundary: "Internal research evidence chunk. Learner-facing lessons must use original wording; quote only after the document's license tier and embedded third-party material are reviewed.",
    });
  });
}

const domainCounts = {};
for (const chunk of corpusChunks) {
  for (const domain of chunk.domains) {
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  }
}

const corpusIndexReport = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  documents: corpusDocuments.length,
  documentsByTier: corpusDocuments.reduce((acc, doc) => {
    acc[doc.tier] = (acc[doc.tier] || 0) + 1;
    return acc;
  }, {}),
  chunks: corpusChunks.length,
  chunksWithDomain: corpusChunks.filter((chunk) => chunk.domains.length > 0).length,
  qualityTierCounts: corpusChunks.reduce((acc, chunk) => {
    acc[chunk.qualityTier] = (acc[chunk.qualityTier] || 0) + 1;
    return acc;
  }, {}),
  retrievalPoolChunks: corpusChunks.filter((chunk) => chunk.qualityTier !== "low_noise").length,
  domainCounts,
  boundary: "The corpus index is an internal evidence layer. It does not publish external text to learners and does not provide trading advice.",
};

module.exports = {
  corpusDocuments,
  corpusChunks,
  corpusIndexReport,
};
