import fs from "node:fs";

function readJson(path, fallback) {
  if (!fs.existsSync(path)) return fallback;
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function fail(message) {
  throw new Error(message);
}

const realSource = readJson("docs/REAL_SOURCE_HARVEST.json", {});
const publicHealth = readJson("docs/PUBLIC_DOCUMENT_URL_HEALTH.json", {});
const publicGetReview = readJson("docs/PUBLIC_DOCUMENT_GET_REVIEW.json", {});

const failedGithubQueries = (realSource.queryResults || [])
  .filter((item) => item.status !== 200)
  .map((item) => ({
    type: "github_query_retry",
    query: item.query,
    status: item.status,
    error: item.error || "unknown",
    nextAction: "Retry with smaller batch, later network window, or GitHub token. Do not invent repository results.",
  }));

const failedNpmQueries = (realSource.npmQueryResults || [])
  .filter((item) => item.status !== 200)
  .map((item) => ({
    type: "npm_query_retry",
    query: item.query,
    status: item.status,
    error: item.error || "unknown",
    nextAction: "Retry npm registry metadata only. Do not copy package README or source text.",
  }));

const publicReviewItems = Array.isArray(publicHealth.results)
  ? publicHealth.results.filter((item) => !item.ok)
  : (publicHealth.failed || []);

const getReachableUrls = new Set(
  (publicGetReview.results || []).filter((item) => item.ok).map((item) => item.url)
);

const termsReviewPendingUrls = publicReviewItems
  .filter((item) => getReachableUrls.has(item.url))
  .map((item) => ({
    type: "public_document_terms_review_pending",
    name: item.name,
    url: item.url,
    sourceType: item.sourceType,
    status: item.status,
    method: item.method,
    nextAction: "GET-reachable; reachability review done by script. Human terms/access review still required. Keep research_only until the use boundary is clear.",
  }));

const manualReviewUrls = publicReviewItems
  .filter((item) => !getReachableUrls.has(item.url))
  .map((item) => ({
    type: "public_document_manual_review",
    name: item.name,
    url: item.url,
    sourceType: item.sourceType,
    status: item.status,
    method: item.method,
    nextAction: "Review with browser/GET and terms page. Keep research_only unless access and use boundary are clear.",
  }));

const nextSourceBatches = [
  {
    id: "official_market_data_terms",
    priority: "P0",
    targetDomains: ["market_data_api_boundary", "exchange_microstructure"],
    searchFocus: "SEC, FINRA, CFTC, CME, CBOE, Nasdaq, NYSE, ICE, OCC terms and data documentation",
    reason: "Market-data and exchange documents are high-authority but often blocked by HEAD or require terms review.",
  },
  {
    id: "backtesting_bias_research",
    priority: "P1",
    targetDomains: ["backtesting_research_hygiene", "risk_portfolio"],
    searchFocus: "lookahead bias, survivorship bias, data snooping, transaction costs, slippage, walk-forward validation",
    reason: "Backtesting lessons need stronger source grounding before becoming professional course material.",
  },
  {
    id: "news_sentiment_event_context",
    priority: "P1",
    targetDomains: ["news_sentiment_events", "macro_economic_data"],
    searchFocus: "GDELT, EDGAR event metadata, macro calendars, earnings calendars, sentiment API terms",
    reason: "The product needs historical news and sentiment context, but only with clear source boundaries.",
  },
  {
    id: "trading_psychology_public_education",
    priority: "P2",
    targetDomains: ["psychology_behavior"],
    searchFocus: "investor behavior, fraud psychology, risk tolerance, behavioral finance, cognitive bias education",
    reason: "Psychology coverage now passes the stage gate but remains the thinnest domain.",
  },
];

const backlog = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  failedGithubQueries,
  failedNpmQueries,
  manualReviewUrls: manualReviewUrls.slice(0, 80),
  manualReviewOverflowCount: Math.max(0, manualReviewUrls.length - 80),
  termsReviewPendingUrls: termsReviewPendingUrls.slice(0, 80),
  nextSourceBatches,
  summary: {
    failedGithubQueries: failedGithubQueries.length,
    failedNpmQueries: failedNpmQueries.length,
    publicDocumentManualReviewUrls: manualReviewUrls.length,
    publicDocumentTermsReviewPending: termsReviewPendingUrls.length,
    getReviewedPublicDocs: publicGetReview.checked || 0,
    getReachablePublicDocs: publicGetReview.getReachable || 0,
    getStillManualPublicDocs: publicGetReview.stillNeedsManualReview || 0,
    nextSourceBatches: nextSourceBatches.length,
  },
  boundary: "This backlog tracks retry and review work only. It does not authorize content reuse, market-data redistribution, trading advice, signals, broker workflows, auto-trading, performance claims, or real-money guidance.",
};

if (backlog.educationOnly !== true) fail("source review backlog must keep educationOnly true");
if (backlog.productionReady !== false) fail("source review backlog must keep productionReady false");
if (!Array.isArray(backlog.nextSourceBatches) || backlog.nextSourceBatches.length < 4) fail("source review backlog needs next source batches");
if ((backlog.summary.failedGithubQueries + backlog.summary.failedNpmQueries + backlog.summary.publicDocumentManualReviewUrls) < 1) {
  fail("source review backlog should preserve at least one retry/review item while gaps remain");
}

await fs.promises.mkdir("docs", { recursive: true });
await fs.promises.writeFile("docs/SOURCE_REVIEW_BACKLOG.json", `${JSON.stringify(backlog, null, 2)}\n`, "utf8");

const md = [
  "# Source Review Backlog",
  "",
  "This backlog turns source-harvest failures and public-document health gaps into follow-up work. It is not learner-facing content and not production readiness.",
  "",
  "## Summary",
  "",
  `- Failed GitHub queries: ${backlog.summary.failedGithubQueries}`,
  `- Failed npm queries: ${backlog.summary.failedNpmQueries}`,
  `- Public-document manual review URLs: ${backlog.summary.publicDocumentManualReviewUrls}`,
  `- Public-document GET-reachable, terms review pending: ${backlog.summary.publicDocumentTermsReviewPending}`,
  `- GET-reviewed public-document URLs: ${backlog.summary.getReviewedPublicDocs}`,
  `- GET-reachable public-document URLs: ${backlog.summary.getReachablePublicDocs}`,
  `- GET-still-manual public-document URLs: ${backlog.summary.getStillManualPublicDocs}`,
  `- Listed manual-review URLs: ${backlog.manualReviewUrls.length}`,
  `- Manual-review overflow count: ${backlog.manualReviewOverflowCount}`,
  "",
  "## Failed GitHub Queries",
  "",
  ...failedGithubQueries.map((item) => `- ${item.query}: ${item.error} (${item.nextAction})`),
  "",
  "## Failed npm Queries",
  "",
  ...failedNpmQueries.map((item) => `- ${item.query}: ${item.error} (${item.nextAction})`),
  "",
  "## Next Source Batches",
  "",
  ...nextSourceBatches.map((item) => `- ${item.priority} ${item.id}: ${item.searchFocus}. Reason: ${item.reason}`),
  "",
  "## GET-Reachable, Terms Review Pending",
  "",
  ...backlog.termsReviewPendingUrls.slice(0, 20).map((item) => `- ${item.status} ${item.name}: ${item.url} (${item.nextAction})`),
  "",
  "## First Manual Review URLs",
  "",
  ...backlog.manualReviewUrls.slice(0, 30).map((item) => `- ${item.status} ${item.name}: ${item.url} (${item.nextAction})`),
  "",
  "## Boundary",
  "",
  backlog.boundary,
  "",
].join("\n");

await fs.promises.writeFile("docs/SOURCE_REVIEW_BACKLOG.md", md, "utf8");

console.log(JSON.stringify({
  ok: true,
  productionReady: false,
  educationOnly: true,
  failedGithubQueries: backlog.summary.failedGithubQueries,
  failedNpmQueries: backlog.summary.failedNpmQueries,
  publicDocumentManualReviewUrls: backlog.summary.publicDocumentManualReviewUrls,
  publicDocumentTermsReviewPending: backlog.summary.publicDocumentTermsReviewPending,
  getReviewedPublicDocs: backlog.summary.getReviewedPublicDocs,
  getReachablePublicDocs: backlog.summary.getReachablePublicDocs,
  getStillManualPublicDocs: backlog.summary.getStillManualPublicDocs,
  nextSourceBatches: backlog.summary.nextSourceBatches,
  outputJson: "docs/SOURCE_REVIEW_BACKLOG.json",
  outputMd: "docs/SOURCE_REVIEW_BACKLOG.md",
}, null, 2));
