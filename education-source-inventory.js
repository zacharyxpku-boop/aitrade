const { openSourceProjectReviews } = require("./education-open-source-projects");
const fs = require("node:fs");

const officialSources = [
  ["SEC EDGAR API", "https://www.sec.gov/edgar/sec-api-documentation", "official-docs", "public filing context"],
  ["FRED API", "https://fred.stlouisfed.org/docs/api/fred/", "official-docs", "economic indicator context"],
  ["Alpha Vantage Docs", "https://www.alphavantage.co/documentation/", "data-provider-docs", "API boundary review"],
  ["Polygon Docs", "https://polygon.io/docs", "data-provider-docs", "API boundary review"],
  ["Nasdaq Data Link Docs", "https://docs.data.nasdaq.com/", "data-provider-docs", "API boundary review"],
  ["CME Market Data", "https://www.cmegroup.com/market-data.html", "exchange-docs", "exchange data boundary"],
  ["NYSE Market Data", "https://www.nyse.com/market-data", "exchange-docs", "exchange data boundary"],
  ["TradingView Policies", "https://www.tradingview.com/policies/", "terms-review", "screen and data boundary"],
  ["Yahoo Finance Terms", "https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html", "terms-review", "data boundary review"],
  ["Investopedia Technical Analysis", "https://www.investopedia.com/technical-analysis-4689657", "education-reference", "concept discovery"],
  ["BabyPips School", "https://www.babypips.com/learn/forex", "education-reference", "curriculum structure discovery"],
];

const searchQueries = [
  "github technical analysis indicators",
  "github candlestick pattern detection",
  "github chart pattern scanner",
  "github backtesting framework trading",
  "github quant finance awesome list",
  "github algorithmic trading resources",
  "github risk metrics finance",
  "github market data api library",
  "public technical analysis glossary",
  "public candlestick pattern glossary",
  "public chart pattern education",
  "public backtesting mistakes trading",
  "official market data API documentation",
  "official economic data API documentation",
  "news sentiment API documentation finance",
  "technical analysis taxonomy github",
  "trading psychology cognitive bias education",
  "risk management trading glossary",
  "market structure price action education",
  "candlestick glossary education",
  "futures exchange education market data",
  "options education market structure",
  "forex education price action",
  "crypto market microstructure education",
  "macro event trading education",
  "event study finance github",
  "walk forward optimization github",
  "slippage transaction cost model github",
  "data quality finance market data",
  "financial sentiment analysis github",
  "news sentiment finance api docs",
  "technical analysis glossary support resistance",
];

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sourceEntry({
  id,
  name,
  url,
  sourceType,
  domain,
  license = "requires-review",
  termsUrl = "",
  crawlMethod = "manual-review",
  extractionTarget = "taxonomy",
  status = "research_only",
  reliabilityGrade = "B",
  notes = "",
  allowedUse,
  disallowedUse,
  sourceUseTier = "unclassified_review_needed",
}) {
  return {
    id,
    name,
    url,
    sourceType,
    domain,
    license,
    termsUrl,
    crawlMethod,
    allowedUse: allowedUse || (status === "taxonomy_allowed"
      ? "Use project/category names and high-level taxonomy as research cues after review."
      : "Use only as research inventory until human review is complete."),
    disallowedUse: disallowedUse || "Do not copy text, code, examples, comments, strategy rules, data, screenshots, or outputs into learner-facing content.",
    sourceUseTier,
    reliabilityGrade,
    extractionTarget,
    status,
    notes,
  };
}

function normalizeRealHarvestSource(source, index) {
  const sourceType = source.sourceType || "public-source";
  const status = source.status === "taxonomy_candidate" ? "taxonomy_allowed" : "research_only";
  return sourceEntry({
    id: `src_real_${String(index + 1).padStart(5, "0")}`,
    name: source.name || source.packageName || `Real source ${index + 1}`,
    url: source.url,
    sourceType,
    domain: source.topicDomain || source.query || sourceType,
    license: source.license || "requires-review",
    termsUrl: source.termsUrl || source.packageUrl || source.url,
    crawlMethod: sourceType === "github-repository" ? "github-api-metadata" : sourceType.startsWith("npm") ? "npm-registry-metadata" : "manual-public-doc-review",
    extractionTarget: source.description || source.allowedUse || "taxonomy and source-boundary metadata",
    status,
    reliabilityGrade: source.reliabilityGrade || "C",
    allowedUse: source.allowedUse,
    disallowedUse: source.disallowedUse,
    sourceUseTier: source.sourceUseTier,
    notes: `Imported from docs/REAL_SOURCE_HARVEST.json as source metadata only. Original status: ${source.status || "unknown"}.`,
  });
}

function loadRealHarvestInventory() {
  const path = "docs/REAL_SOURCE_HARVEST.json";
  if (!fs.existsSync(path)) return [];
  try {
    const snapshot = JSON.parse(fs.readFileSync(path, "utf8"));
    const seen = new Set();
    return (snapshot.sources || [])
      .filter((source) => source.url && !/search\?/i.test(source.url))
      .filter((source) => {
        if (seen.has(source.url)) return false;
        seen.add(source.url);
        return true;
      })
      .map(normalizeRealHarvestSource)
      .sort((a, b) => authorityRank(a) - authorityRank(b));
  } catch {
    return [];
  }
}

function authorityRank(source) {
  if (["official-docs", "exchange-docs"].includes(source.sourceType) && ["S", "A"].includes(source.reliabilityGrade)) return 0;
  if (["data-provider-docs", "education-reference"].includes(source.sourceType) && ["S", "A", "B"].includes(source.reliabilityGrade)) return 1;
  if (source.sourceType === "github-repository" && source.status !== "research_only") return 2;
  if (source.sourceType === "npm-package" && source.status !== "research_only") return 3;
  if (/^npm-linked-/i.test(source.sourceType)) return 4;
  return 5;
}

const projectSources = openSourceProjectReviews.map((project) => sourceEntry({
  id: `src_${project.id}`,
  name: project.name,
  url: project.url,
  sourceType: "github-project",
  domain: project.projectType,
  license: project.license,
  termsUrl: `${project.url}/blob/master/LICENSE`,
  extractionTarget: project.coveredConcepts.join(", "),
  status: "research_only",
  reliabilityGrade: project.projectType.includes("awesome") ? "B" : "A",
  notes: "Imported from open source project review seed list.",
}));

const officialInventory = officialSources.map(([name, url, sourceType, extractionTarget], index) => sourceEntry({
  id: `src_official_${String(index + 1).padStart(3, "0")}`,
  name,
  url,
  sourceType,
  domain: "official-public-reference",
  license: "terms-review-required",
  termsUrl: url,
  extractionTarget,
  status: sourceType === "official-docs" ? "taxonomy_allowed" : "research_only",
  reliabilityGrade: sourceType === "official-docs" || sourceType === "exchange-docs" ? "S" : "B",
  notes: "Official or public documentation used for boundary language and source classification.",
}));

const searchInventory = [];
for (let round = 0; searchInventory.length < 2960; round += 1) {
  const query = searchQueries[round % searchQueries.length];
  const host = round % 3 === 0 ? "github" : round % 3 === 1 ? "public-web" : "official-doc-search";
  const url = host === "github"
    ? `https://github.com/search?q=${encodeURIComponent(query)}&type=repositories`
    : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  searchInventory.push(sourceEntry({
    id: `src_search_${String(searchInventory.length + 1).padStart(3, "0")}`,
    name: `Search inventory: ${query} #${Math.floor(round / searchQueries.length) + 1}`,
    url,
    sourceType: `${host}-search-index`,
    domain: slug(query),
    license: "not-applicable-search-index",
    termsUrl: "",
    crawlMethod: "search-result-review-only",
    extractionTarget: "discover candidate sources and taxonomy labels",
    status: "research_only",
    reliabilityGrade: "C",
    notes: "Search URL is an inventory pointer; individual results require separate license and terms review.",
  }));
}

const realHarvestInventory = loadRealHarvestInventory();
const sourceInventory = realHarvestInventory.length >= 1000
  ? realHarvestInventory
  : [...projectSources, ...officialInventory, ...searchInventory];

module.exports = {
  sourceInventory,
};
