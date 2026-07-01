const { corpusDocuments, corpusChunks } = require("./education-corpus-index");
const { knowledgeBrowserIndex } = require("./education-knowledge-browser-index");

// Local private course coverage index.
// This maps the user's imported PDF course corpus into module/topic coverage and
// rewrite-intake candidates. It is an internal review layer only: local course
// text is not learner-facing and is not citation/publication-cleared.

const localCourseDocuments = corpusDocuments.filter((doc) => doc.tier === "local_private_course");
const localDocById = new Map(localCourseDocuments.map((doc) => [doc.id, doc]));
const localCourseChunks = corpusChunks.filter((chunk) => localDocById.has(chunk.documentId));

const DOMAIN_LABELS = {
  chart_price_action: "Chart reading / price action",
  indicator_pattern_taxonomy: "Indicators / pattern taxonomy",
  backtesting_research_hygiene: "Backtesting / research hygiene",
  risk_portfolio: "Risk / portfolio",
  psychology_behavior: "Psychology / behavior",
  news_sentiment_events: "News / sentiment / events",
  macro_economic_data: "Macro data",
  market_data_api_boundary: "Market data boundary",
  exchange_microstructure: "Order flow / microstructure",
  open_source_tooling: "Open-source tooling",
};

const MODULE_DOMAIN_HINTS = [
  { pattern: /K线|蜡烛|裸K|形态|谐波|缠论|价格行为|突破|趋势|支撑|压力|十字星|孕线|Gap|MTR|Supply|Demand/i, domains: ["chart_price_action"] },
  { pattern: /指标|MACD|布林|均线|VWAP|量价|成交量/i, domains: ["indicator_pattern_taxonomy", "chart_price_action"] },
  { pattern: /订单|盘口|庄家|主力|流动性|限价|市价/i, domains: ["exchange_microstructure", "risk_portfolio"] },
  { pattern: /心理|认知|纪律|情绪|心态/i, domains: ["psychology_behavior", "risk_portfolio"] },
  { pattern: /系统|交易系统|资金|计划|仓位|止损|止盈|风控|提升/i, domains: ["risk_portfolio", "backtesting_research_hygiene"] },
];

const DOMAIN_KEYWORDS = {
  chart_price_action: ["k线", "蜡烛", "形态", "突破", "趋势", "支撑", "压力", "裸k", "价格行为", "十字星", "旗形", "楔形", "反转", "回调", "通道", "头肩", "双重", "孕线", "gap", "mtr", "supply", "demand"],
  indicator_pattern_taxonomy: ["指标", "macd", "布林", "均线", "vwap", "量价", "成交量", "背离", "金叉", "死叉", "rsi"],
  backtesting_research_hygiene: ["回测", "复盘", "验证", "样本", "统计", "系统", "策略", "优化", "过拟合"],
  risk_portfolio: ["风险", "仓位", "止损", "止盈", "资金", "计划", "回撤", "杠杆", "盈亏", "本金"],
  psychology_behavior: ["心理", "认知", "纪律", "情绪", "贪婪", "恐惧", "执行", "耐心"],
  exchange_microstructure: ["订单", "盘口", "庄家", "主力", "流动性", "限价", "市价", "买卖盘", "成交"],
  news_sentiment_events: ["新闻", "消息", "事件", "情绪", "公告"],
  macro_economic_data: ["宏观", "利率", "通胀", "cpi", "gdp", "非农"],
};

const KNOWLEDGE_MODULE_DOMAIN_CYCLE = [
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

function docTextFor(doc) {
  return `${doc.sourceRelativePath || ""} ${doc.sourceModule || ""} ${doc.name || ""} ${doc.text || ""}`.toLowerCase();
}

function domainHintsForDoc(doc) {
  const text = docTextFor(doc);
  const domains = new Set();
  for (const hint of MODULE_DOMAIN_HINTS) {
    if (hint.pattern.test(text)) {
      for (const domain of hint.domains) domains.add(domain);
    }
  }
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword.toLowerCase()))) domains.add(domain);
  }
  return [...domains];
}

const localDocProfiles = localCourseDocuments.map((doc) => ({
  id: doc.id,
  sourceId: doc.sourceId,
  name: doc.name,
  sourceModule: doc.sourceModule,
  sourceRelativePath: doc.sourceRelativePath,
  url: doc.url,
  charCount: doc.charCount,
  textExtraction: doc.textExtraction,
  domains: domainHintsForDoc(doc),
}));

const domainProfiles = {};
for (const profile of localDocProfiles) {
  const domains = profile.domains.length ? profile.domains : ["unclassified_local_course"];
  for (const domain of domains) {
    const row = (domainProfiles[domain] = domainProfiles[domain] || {
      id: domain,
      label: DOMAIN_LABELS[domain] || domain,
      documents: 0,
      chunks: 0,
      charCount: 0,
      modules: {},
      sampleDocuments: [],
    });
    row.documents += 1;
    row.charCount += profile.charCount || 0;
    row.modules[profile.sourceModule || "unknown"] = (row.modules[profile.sourceModule || "unknown"] || 0) + 1;
    if (row.sampleDocuments.length < 6) {
      row.sampleDocuments.push({
        documentId: profile.id,
        name: profile.name,
        sourceRelativePath: profile.sourceRelativePath,
        charCount: profile.charCount,
      });
    }
  }
}
for (const chunk of localCourseChunks) {
  const doc = localDocById.get(chunk.documentId);
  const domains = localDocProfiles.find((profile) => profile.id === doc?.id)?.domains || chunk.domains || [];
  for (const domain of domains.length ? domains : ["unclassified_local_course"]) {
    if (!domainProfiles[domain]) continue;
    domainProfiles[domain].chunks += 1;
  }
}

function tokensFor(value) {
  const text = String(value || "").toLowerCase();
  const latin = text.match(/[a-z0-9]{3,}/g) || [];
  const chinese = text.match(/[\u4e00-\u9fff]{2,}/g) || [];
  const chinesePairs = [];
  for (const word of chinese) {
    for (let index = 0; index < word.length - 1; index += 1) {
      chinesePairs.push(word.slice(index, index + 2));
    }
  }
  return [...new Set([...latin, ...chinese, ...chinesePairs])].filter((token) => token.length >= 2);
}

function scoreProfileForNode(profile, node, wantedDomain) {
  const haystack = docTextFor(localDocById.get(profile.id));
  let score = 0;
  const query = tokensFor([node.title, node.module, node.topic, node.definition, node.principle].join(" "));
  for (const token of query.slice(0, 80)) {
    if (haystack.includes(token)) score += token.length > 2 ? 2 : 1;
  }
  if (profile.domains.includes(wantedDomain)) score += 12;
  if (profile.sourceModule && String(node.module || "").includes(profile.sourceModule)) score += 6;
  return score;
}

const localCourseNodeMatches = [];
for (const [moduleIndex, module] of knowledgeBrowserIndex.modules.entries()) {
  const wantedDomain = KNOWLEDGE_MODULE_DOMAIN_CYCLE[moduleIndex % KNOWLEDGE_MODULE_DOMAIN_CYCLE.length];
  const moduleNodes = knowledgeBrowserIndex.learnerFacingNodes.filter((node) => node.module === module.title);
  for (const node of moduleNodes) {
    const matches = localDocProfiles
      .map((profile) => ({ profile, score: scoreProfileForNode(profile, node, wantedDomain) }))
      .filter((row) => row.score > 0)
      .sort((left, right) => right.score - left.score || (right.profile.charCount || 0) - (left.profile.charCount || 0))
      .slice(0, 5)
      .map((row) => ({
        documentId: row.profile.id,
        name: row.profile.name,
        sourceRelativePath: row.profile.sourceRelativePath,
        sourceModule: row.profile.sourceModule,
        domains: row.profile.domains,
        charCount: row.profile.charCount,
        score: row.score,
        useBoundary: "Local private course evidence for reviewer distillation only. Do not copy text learner-facing; rewrite as original education content and keep approval blocked.",
      }));
    localCourseNodeMatches.push({
      nodeId: node.id,
      title: node.title,
      module: node.module,
      topic: node.topic,
      expectedDomain: wantedDomain,
      localCourseMatchCount: matches.length,
      topMatches: matches,
      rewriteIntakeStatus: matches.length >= 2 ? "local_course_ready_for_rewrite_review" : "needs_more_local_mapping",
    });
  }
}

const moduleCoverage = knowledgeBrowserIndex.modules.map((module, index) => {
  const domain = KNOWLEDGE_MODULE_DOMAIN_CYCLE[index % KNOWLEDGE_MODULE_DOMAIN_CYCLE.length];
  const nodeRows = localCourseNodeMatches.filter((row) => row.module === module.title);
  const docIds = new Set(nodeRows.flatMap((row) => row.topMatches.map((match) => match.documentId)));
  const readyNodes = nodeRows.filter((row) => row.rewriteIntakeStatus === "local_course_ready_for_rewrite_review").length;
  return {
    moduleId: module.id,
    module: module.title,
    expectedDomain: domain,
    localCourseDocuments: docIds.size,
    learnerFacingNodes: nodeRows.length,
    nodesWithLocalCourseMatches: nodeRows.filter((row) => row.localCourseMatchCount > 0).length,
    readyForRewriteReview: readyNodes,
    coverageRate: nodeRows.length ? Number((readyNodes / nodeRows.length).toFixed(4)) : 0,
    sampleDocuments: [...docIds].slice(0, 8).map((id) => {
      const doc = localDocById.get(id);
      return {
        documentId: id,
        name: doc?.name,
        sourceRelativePath: doc?.sourceRelativePath,
      };
    }),
  };
});

const rewriteRowsByModule = new Map();
for (const row of localCourseNodeMatches.filter((item) => item.rewriteIntakeStatus === "local_course_ready_for_rewrite_review")) {
  if (!rewriteRowsByModule.has(row.module)) rewriteRowsByModule.set(row.module, []);
  rewriteRowsByModule.get(row.module).push(row);
}
const balancedRewriteRows = [];
for (const module of knowledgeBrowserIndex.modules) {
  const rows = (rewriteRowsByModule.get(module.title) || [])
    .sort((left, right) => {
      const leftScore = left.topMatches.reduce((sum, match) => sum + match.score, 0);
      const rightScore = right.topMatches.reduce((sum, match) => sum + match.score, 0);
      return rightScore - leftScore || left.nodeId.localeCompare(right.nodeId);
    })
    .slice(0, 10);
  balancedRewriteRows.push(...rows);
}

const localCourseRewriteIntake = balancedRewriteRows
  .slice(0, 120)
  .map((row) => ({
    nodeId: row.nodeId,
    title: row.title,
    module: row.module,
    topic: row.topic,
    localCourseEvidence: row.topMatches.slice(0, 3),
    rewriteTask: "Use local private course notes as reviewer-only background, compare against green/public source boundaries, then write original education-only lesson prose. Keep structural_draft until separate approval.",
    forbiddenDrift: [
      "Do not copy local PDF wording into learner-facing lessons.",
      "Do not turn course notes into buy/sell signals, entry instructions, broker workflows, automation, return claims, or real-money guidance.",
      "Do not mark learnerFacingRelease or productionReady true.",
    ],
  }));

const localCourseCoverageIndex = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  tier: "local_private_course",
  sourceRoot: "C:\\Users\\86136\\Desktop\\投资",
  documents: localCourseDocuments.length,
  chunks: localCourseChunks.length,
  matchedNodes: localCourseNodeMatches.filter((row) => row.localCourseMatchCount > 0).length,
  readyForRewriteReviewNodes: localCourseNodeMatches.filter((row) => row.rewriteIntakeStatus === "local_course_ready_for_rewrite_review").length,
  domainCoverage: Object.values(domainProfiles).sort((left, right) => right.documents - left.documents),
  moduleCoverage,
  nodeMatches: localCourseNodeMatches,
  rewriteIntake: localCourseRewriteIntake,
  boundary: "Local course coverage is private reviewer intake only. It helps absorb the user's course folder into the knowledge workflow, but it is not learner-facing content, publication approval, investment advice, live signals, broker integration, automation, return promises, or real-money guidance.",
};

module.exports = {
  localCourseCoverageIndex,
};
