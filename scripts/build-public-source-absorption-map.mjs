import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { knowledgeBrowserIndex } = require("../education-knowledge-browser-index.js");

const outputJson = "docs/PUBLIC_SOURCE_ABSORPTION_MAP.json";
const outputMd = "docs/PUBLIC_SOURCE_ABSORPTION_MAP.md";
const corpusDir = "data/corpus";
const publicTiers = new Set(["public_domain", "open_access", "share_alike", "permissive"]);

const moduleQueryTerms = [
  ["technical analysis", "chart", "candlestick", "support", "resistance", "price action", "volume", "trend line", "market trend"],
  ["market structure", "support", "resistance", "order book", "market microstructure", "liquidity", "supply", "demand", "market depth", "bid ask spread", "limit order", "market maker"],
  ["candlestick", "candlestick pattern", "doji", "price action", "wick", "chart pattern"],
  ["market trend", "trend following", "moving average", "momentum", "dow theory", "technical analysis"],
  ["breakout", "support", "resistance", "volatility", "chart pattern", "technical analysis"],
  ["trading range", "support", "resistance", "mean reversion", "bollinger", "market trend"],
  ["reversal", "double top", "double bottom", "head and shoulders", "candlestick pattern", "chart pattern"],
  ["technical analysis", "time frame", "timeframe", "market trend", "moving average", "chart"],
  ["market sentiment", "sentiment analysis", "event study", "news analytics", "behavioral economics", "confirmation bias"],
  ["backtesting", "overfitting", "look-ahead bias", "survivorship bias", "data dredging", "cross-validation", "transaction cost"],
  ["risk management", "position sizing", "drawdown", "value at risk", "leverage", "margin", "diversification"],
  ["behavioral economics", "loss aversion", "prospect theory", "confirmation bias", "overconfidence", "herd behavior", "fear of missing out", "gambler"],
];

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readCorpusDocs() {
  return fs.readdirSync(corpusDir)
    .filter((file) => /^corpus_\d+\.json$/.test(file))
    .map((file) => JSON.parse(fs.readFileSync(path.join(corpusDir, file), "utf8")));
}

function hostFor(doc) {
  try {
    return new URL(doc.url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function isWikipediaDoc(doc) {
  return /wikipedia\.org/i.test(doc.url || "") ||
    /wikipedia/i.test(doc.sourceId || "") ||
    /^Wikipedia:/i.test(doc.name || "");
}

function isOfficialLikeDoc(doc) {
  const host = hostFor(doc);
  return host.endsWith(".gov") ||
    /sec\.gov|investor\.gov|federalreserve\.gov|cftc\.gov|finra\.org|nasdaqtrader\.com|treasury\.gov|bls\.gov|bea\.gov|census\.gov/i.test(`${host} ${doc.url || ""}`);
}

function sourceFamily(doc) {
  const host = hostFor(doc);
  if (isWikipediaDoc(doc)) return "Wikipedia";
  if (isOfficialLikeDoc(doc)) return "Official/Public Domain";
  if (/arxiv\.org$/.test(host)) return "Open Research";
  if (/github\.com$/.test(host)) return "Permissive/Open Source";
  return host;
}

function excerptPolicy(doc) {
  if (isWikipediaDoc(doc) || doc.tier === "share_alike") return "attribution_and_share_alike_required";
  if (doc.tier === "open_access") return "pointer_or_quote_only_after_license_review";
  if (doc.tier === "public_domain") return "cite_and_paraphrase_with_embedded_third_party_spot_check";
  return "cite_and_paraphrase_for_original_lesson";
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

function docTextFor(doc) {
  return `${doc.name || ""} ${doc.url || ""} ${doc.sourceId || ""} ${doc.pageTitle || ""} ${String(doc.text || "").slice(0, 80000)}`.toLowerCase();
}

function scoreHaystackForTerms(haystack, terms, metaBoost = 1) {
  const meta = haystack.slice(0, 2000);
  let score = 0;
  const matchedTerms = [];
  for (const term of terms) {
    const normalized = String(term || "").toLowerCase();
    if (!normalized) continue;
    if (meta.includes(normalized)) {
      score += 4 * metaBoost;
      matchedTerms.push(normalized);
    } else if (haystack.includes(normalized)) {
      score += 1;
      matchedTerms.push(normalized);
    }
  }
  return { score, matchedTerms: [...new Set(matchedTerms)] };
}

function scoreDocForNodeHaystack(haystack, node) {
  const query = tokensFor([
    node.title,
    node.module,
    node.topic,
    node.definition,
    node.principle,
  ].join(" "));
  let score = 0;
  for (const token of query.slice(0, 36)) {
    if (haystack.includes(token)) score += token.length > 2 ? 2 : 1;
  }
  return score;
}

function fallbackModulesForDoc(doc) {
  const text = docTextFor(doc);
  const modules = [];
  if (/candlestick|doji|chart|technical analysis|price action|support|resistance|trend|breakout|reversal/.test(text)) {
    modules.push("图表阅读基础", "K线与价格行为", "趋势", "突破", "反转");
  }
  if (/market microstructure|order book|liquidity|bid ask|limit order|market maker/.test(text)) {
    modules.push("市场结构", "交易区间", "风险管理");
  }
  if (/backtest|overfitting|look-ahead|survivorship|cross-validation|transaction cost|research/.test(text)) {
    modules.push("回测误区", "风险管理");
  }
  if (/risk management|position sizing|drawdown|margin|leverage|diversification|value at risk/.test(text)) {
    modules.push("风险管理", "交易心理");
  }
  if (/scam|fraud|consumer|money sense|moneysense|monetary authority|mas singapore|mas\.gov\.sg|political economy|interest rate|whittaker|entropy|thermodynamics|arxiv|archive\.org/.test(text)) {
    modules.push("风险管理", "回测误区", "新闻/情绪/事件偏见", "交易心理");
  }
  if (/behavioral economics|loss aversion|prospect theory|overconfidence|confirmation bias|herd|sentiment|news|event/.test(text)) {
    modules.push("交易心理", "新闻/情绪/事件偏见");
  }
  if (/sec\.gov|investor\.gov|finra|cftc|federalreserve|treasury|bls|bea|census/.test(text)) {
    modules.push("风险管理", "新闻/情绪/事件偏见", "回测误区");
  }
  if (/github|api|python|library|open source|dataset|data/.test(text)) {
    modules.push("回测误区", "风险管理", "图表阅读基础");
  }
  return [...new Set(modules)];
}

const publicGap = readJson("docs/PUBLIC_SOURCE_GAP_AUDIT.json");
const wikipediaGrounding = readJson("docs/WIKIPEDIA_GROUNDING_AUDIT.json");
if (publicGap.educationOnly !== true || wikipediaGrounding.educationOnly !== true) fail("source audits must keep educationOnly:true");
if (publicGap.productionReady !== false || wikipediaGrounding.productionReady !== false) fail("source audits must keep productionReady:false");

const nodeRows = knowledgeBrowserIndex.learnerFacingNodes || [];
const moduleIndexByTitle = new Map(knowledgeBrowserIndex.modules.map((module, index) => [module.title, index]));
const corpusDocs = readCorpusDocs();
const publicDocs = corpusDocs.filter((doc) => publicTiers.has(doc.tier))
  .sort((left, right) => String(left.id).localeCompare(String(right.id)));
const wikipediaDocs = publicDocs.filter(isWikipediaDoc);
const officialLikeDocs = publicDocs.filter(isOfficialLikeDoc);
const nodesByModule = new Map();
for (const node of nodeRows) {
  if (!nodesByModule.has(node.module)) nodesByModule.set(node.module, []);
  nodesByModule.get(node.module).push(node);
}

const documentRows = publicDocs.map((doc) => {
  const haystack = docTextFor(doc);
  const moduleScores = knowledgeBrowserIndex.modules
    .map((module, index) => ({
      module: module.title,
      score: scoreHaystackForTerms(haystack, moduleQueryTerms[index] || [], isWikipediaDoc(doc) ? 2 : 1).score,
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.module.localeCompare(right.module, "zh-Hans-CN"))
    .slice(0, 4);
  const candidateModules = moduleScores.length
    ? moduleScores.map((row) => row.module)
    : fallbackModulesForDoc(doc);
  const moduleScoreByName = new Map(moduleScores.map((row) => [row.module, row.score]));
  const candidateNodes = candidateModules.flatMap((module) => nodesByModule.get(module) || []);
  const scoredMatches = candidateNodes
    .map((node) => ({
      node,
      score: (moduleScoreByName.get(node.module) || 1) + scoreDocForNodeHaystack(haystack, node),
    }))
    .sort((left, right) => right.score - left.score || String(left.node.id).localeCompare(String(right.node.id)))
    .slice(0, 8);
  let topNodeMatches = scoredMatches.map(({ node, score }) => ({
    nodeId: node.id,
    title: node.title,
    module: node.module,
    topic: node.topic,
    score,
    matchSource: moduleScores.length ? "public_module_then_node_reverse_score" : "public_metadata_fallback_review_required",
  }));
  if (topNodeMatches.length === 0) {
    const fallbackModules = fallbackModulesForDoc(doc);
    topNodeMatches = nodeRows
      .filter((node) => fallbackModules.includes(node.module))
      .slice(0, 5)
      .map((node) => ({
        nodeId: node.id,
        title: node.title,
        module: node.module,
        topic: node.topic,
        score: 1,
        matchSource: "public_metadata_fallback_review_required",
      }));
  }
  const matchedModules = [...new Set(topNodeMatches.map((match) => match.module))].sort((left, right) =>
    left.localeCompare(right, "zh-Hans-CN"));
  const matchedTopics = [...new Set(topNodeMatches.map((match) => match.topic))].sort((left, right) =>
    left.localeCompare(right, "zh-Hans-CN"));
  return {
    documentId: doc.id,
    sourceId: doc.sourceId,
    name: doc.name,
    url: doc.url,
    host: hostFor(doc),
    tier: doc.tier,
    family: sourceFamily(doc),
    isWikipedia: isWikipediaDoc(doc),
    isOfficialLike: isOfficialLikeDoc(doc),
    charCount: doc.charCount || 0,
    textExtraction: doc.textExtraction || "unknown",
    matchedNodeCount: topNodeMatches.length,
    matchedModules,
    matchedTopics: matchedTopics.slice(0, 12),
    topNodeMatches,
    excerptPolicy: excerptPolicy(doc),
    learnerCitationApproved: false,
    absorptionStatus: topNodeMatches.length
      ? "mapped_to_knowledge_nodes_public_research_only"
      : "public_source_mapping_attention_required",
    nextGate: topNodeMatches.length
      ? "reviewer_selects_source_role_then_paraphrase_original_lesson_with_attribution_boundary"
      : "retune_public_source_terms_or_mark_inventory_only",
  };
});

const unmappedRows = documentRows.filter((row) => row.matchedNodeCount === 0);
const moduleMap = new Map();
for (const row of documentRows) {
  for (const module of row.matchedModules) {
    const moduleRow = moduleMap.get(module) || {
      module,
      publicDocuments: 0,
      wikipediaDocuments: 0,
      officialLikeDocuments: 0,
      shareAlikeDocuments: 0,
      openAccessDocuments: 0,
      nodeMatches: 0,
      sampleDocuments: [],
    };
    moduleRow.publicDocuments += 1;
    if (row.isWikipedia) moduleRow.wikipediaDocuments += 1;
    if (row.isOfficialLike) moduleRow.officialLikeDocuments += 1;
    if (row.tier === "share_alike") moduleRow.shareAlikeDocuments += 1;
    if (row.tier === "open_access") moduleRow.openAccessDocuments += 1;
    moduleRow.nodeMatches += row.matchedNodeCount;
    if (moduleRow.sampleDocuments.length < 5) {
      moduleRow.sampleDocuments.push({
        documentId: row.documentId,
        name: row.name,
        family: row.family,
        matchedNodeCount: row.matchedNodeCount,
      });
    }
    moduleMap.set(module, moduleRow);
  }
}

const mappedWikipediaDocuments = documentRows.filter((row) => row.isWikipedia && row.matchedNodeCount > 0).length;
const mappedOfficialLikeDocuments = documentRows.filter((row) => row.isOfficialLike && row.matchedNodeCount > 0).length;
const auditStatus = documentRows.length === publicGap.publicCorpusDocuments &&
  wikipediaDocs.length === publicGap.wikipediaDocuments &&
  officialLikeDocs.length === publicGap.officialLikeDocuments &&
  mappedWikipediaDocuments === wikipediaDocs.length &&
  mappedOfficialLikeDocuments === officialLikeDocs.length &&
  unmappedRows.length === 0
  ? "public_sources_mapped_to_knowledge_nodes_release_blocked"
  : "public_source_absorption_attention_required";

const audit = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  auditStatus,
  auditMode: "reverse_public_source_to_knowledge_node_absorption_map",
  corpusDocuments: corpusDocs.length,
  publicCorpusDocuments: publicDocs.length,
  wikipediaDocuments: wikipediaDocs.length,
  officialLikeDocuments: officialLikeDocs.length,
  mappedPublicDocuments: documentRows.filter((row) => row.matchedNodeCount > 0).length,
  unmappedPublicDocuments: unmappedRows.length,
  mappedWikipediaDocuments,
  unmappedWikipediaDocuments: wikipediaDocs.length - mappedWikipediaDocuments,
  mappedOfficialLikeDocuments,
  unmappedOfficialLikeDocuments: officialLikeDocs.length - mappedOfficialLikeDocuments,
  shareAlikeDocuments: documentRows.filter((row) => row.tier === "share_alike").length,
  openAccessDocuments: documentRows.filter((row) => row.tier === "open_access").length,
  permissiveDocuments: documentRows.filter((row) => row.tier === "permissive").length,
  publicDomainDocuments: documentRows.filter((row) => row.tier === "public_domain").length,
  totalPublicDocumentNodeMatches: documentRows.reduce((sum, row) => sum + row.matchedNodeCount, 0),
  modulesWithPublicSourceMapping: moduleMap.size,
  modulesWithWikipediaMapping: [...moduleMap.values()].filter((row) => row.wikipediaDocuments > 0).length,
  learnerCitationApprovedDocuments: documentRows.filter((row) => row.learnerCitationApproved === true).length,
  writeAllowedNow: false,
  manualAuthorizationRequired: true,
  moduleRows: [...moduleMap.values()].sort((left, right) => right.publicDocuments - left.publicDocuments || left.module.localeCompare(right.module, "zh-Hans-CN")),
  documentRows,
  unmappedRows,
  wikipediaRows: documentRows.filter((row) => row.isWikipedia).slice(0, 40),
  officialLikeRows: documentRows.filter((row) => row.isOfficialLike).slice(0, 40),
  topMappedPublicRows: documentRows
    .slice()
    .sort((left, right) => right.matchedNodeCount - left.matchedNodeCount || (right.charCount || 0) - (left.charCount || 0))
    .slice(0, 20)
    .map((row) => ({
      documentId: row.documentId,
      name: row.name,
      family: row.family,
      tier: row.tier,
      matchedNodeCount: row.matchedNodeCount,
      matchedModules: row.matchedModules,
      excerptPolicy: row.excerptPolicy,
    })),
  commands: [
    "npm.cmd run check:public-source-absorption-map",
    "npm.cmd run check:public-source-gap",
    "npm.cmd run check:wikipedia-grounding-audit",
    "npm.cmd run verify",
  ],
  completionRule: "Public/Wikipedia materials are absorbed only for the reviewer research layer when they are mapped to knowledge nodes with source-family and excerpt-policy boundaries. Learner-facing citations, copied text, lesson writes, or release still require human source-role review, attribution/license handling, originality review, and explicit approval.",
  boundary: "Public source absorption map is reviewer-facing education-only governance. Wikipedia and other public materials support terminology, taxonomy, source-fit review, and original lesson rewrites; this does not approve copied text, learner-facing citations, stock recommendations, live signals, return promises, broker workflows, automation, real-money guidance, or production readiness.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync(outputJson, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
fs.writeFileSync(outputMd, [
  "# Public Source Absorption Map",
  "",
  "Reverse audit from public/Wikipedia corpus documents into the knowledge-node graph.",
  "",
  `- Audit status: ${audit.auditStatus}`,
  `- Public corpus documents: ${audit.publicCorpusDocuments}`,
  `- Wikipedia documents mapped: ${audit.mappedWikipediaDocuments}/${audit.wikipediaDocuments}`,
  `- Official-like documents mapped: ${audit.mappedOfficialLikeDocuments}/${audit.officialLikeDocuments}`,
  `- Public documents mapped: ${audit.mappedPublicDocuments}/${audit.publicCorpusDocuments}`,
  `- Total public document-node matches: ${audit.totalPublicDocumentNodeMatches}`,
  `- Learner citation approved documents: ${audit.learnerCitationApprovedDocuments}`,
  `- Write allowed now: ${audit.writeAllowedNow}`,
  "",
  "## Module Rows",
  "",
  "| Module | Public docs | Wikipedia | Official-like | Node matches |",
  "|---|---:|---:|---:|---:|",
  ...audit.moduleRows.map((row) => `| ${row.module} | ${row.publicDocuments} | ${row.wikipediaDocuments} | ${row.officialLikeDocuments} | ${row.nodeMatches} |`),
  "",
  "## Boundary",
  "",
  audit.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: audit.educationOnly,
  productionReady: audit.productionReady,
  learnerFacingRelease: audit.learnerFacingRelease,
  approvalStatus: audit.approvalStatus,
  auditStatus: audit.auditStatus,
  publicCorpusDocuments: audit.publicCorpusDocuments,
  mappedPublicDocuments: audit.mappedPublicDocuments,
  unmappedPublicDocuments: audit.unmappedPublicDocuments,
  mappedWikipediaDocuments: audit.mappedWikipediaDocuments,
  mappedOfficialLikeDocuments: audit.mappedOfficialLikeDocuments,
  totalPublicDocumentNodeMatches: audit.totalPublicDocumentNodeMatches,
  writeAllowedNow: audit.writeAllowedNow,
  outputJson,
  outputMd,
}, null, 2));
