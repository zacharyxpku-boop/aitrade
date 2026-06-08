const { config } = require("./config");

function providerStatus() {
  const publicPreview = config.news.provider === "gdelt_public";
  const secPreview = config.news.provider === "sec_edgar";
  const alphaPreview = config.news.provider === "alpha_vantage";
  return {
    provider: config.news.provider,
    mode: config.news.provider === "demo" ? "teaching-demo" : publicPreview ? "public-preview" : secPreview ? "official-public-preview" : alphaPreview ? (config.news.apiKey ? "api-key-preview" : "api-key-missing") : "external",
    licensedNewsData: false,
    productionNote: config.news.provider === "demo"
      ? "Demo news and sentiment are educational context only, not real-time news or investable sentiment."
      : publicPreview
        ? "GDELT can provide authorized public event/context metadata with citation; linked publisher content rights still need review."
        : secPreview
          ? "SEC EDGAR official public preview can add filing-event context when fair-access and User-Agent rules are followed."
        : alphaPreview
            ? "Alpha Vantage news preview requires an API key and commercial-use approval/plan review; sentiment is context only."
        : "External news data must include attribution, licensing, timestamps, and uncertainty labels.",
  };
}

function getDemoEventContext() {
  return {
    news: "Teaching demo data: no real news event is being used. Treat this as a classroom scenario.",
    sentiment: "Teaching demo data: sentiment is only context for discipline training, not a buy or sell reason.",
    eventTags: ["demo-context", "sentiment-risk", "no-live-news"],
    dataSource: {
      provider: config.news.provider,
      mode: providerStatus().mode,
      label: "Synthetic teaching event context",
      isDemo: true,
      license: "internal-demo-only",
    },
  };
}

async function getPublicNewsEvents({ query = "market volatility", maxRecords = 5 } = {}) {
  const safeQuery = String(query || "market volatility").trim().slice(0, 160);
  const safeMax = Math.max(1, Math.min(Number(maxRecords) || 5, 20));
  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", safeQuery);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("format", "json");
  url.searchParams.set("maxrecords", String(safeMax));
  url.searchParams.set("sort", "datedesc");
  const response = await fetch(url, {
    headers: {
      "user-agent": "TradeGym education-only public news preview; contact: local-demo@tradegym.local",
    },
  });
  if (!response.ok) {
    throw new Error(`GDELT public DOC request failed: ${response.status}`);
  }
  const payload = await response.json();
  const articles = (payload.articles || []).slice(0, safeMax).map((item) => ({
    title: item.title || "",
    url: item.url || "",
    domain: item.domain || "",
    seenDate: item.seendate || item.seenDate || "",
    language: item.language || "",
    sourceCountry: item.sourcecountry || item.sourceCountry || "",
  }));
  return {
    query: safeQuery,
    provider: "gdelt_doc_api",
    providerMode: "public-preview",
    licenseStatus: "publicly reachable; linked publisher rights not verified",
    authorizationTier: "public_terms_allow_commercial_context_metadata",
    authorizedForEducationPreview: true,
    productionReady: false,
    educationOnly: true,
    sourceUrl: url.toString(),
    articles,
    constraints: [
      "GDELT preview is for historical event-context review and attribution testing only.",
      "Linked publisher content rights, commercial use, and retention rules require legal review before production.",
      "News and sentiment remain context, not a buy/sell reason, live signal, or real-money instruction.",
    ],
  };
}

function normalizeCik(value) {
  return String(value || "0000320193").replace(/\D/g, "").padStart(10, "0").slice(-10);
}

async function getSecFilingEvents({ cik = "0000320193", limit = 10 } = {}) {
  const safeCik = normalizeCik(cik);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 40));
  const url = `https://data.sec.gov/submissions/CIK${safeCik}.json`;
  const response = await fetch(url, {
    headers: {
      "user-agent": config.news.secUserAgent,
      "accept": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`SEC EDGAR submissions request failed: ${response.status}`);
  }
  const payload = await response.json();
  const recent = payload?.filings?.recent || {};
  const accessionNumbers = recent.accessionNumber || [];
  const forms = recent.form || [];
  const filingDates = recent.filingDate || [];
  const reportDates = recent.reportDate || [];
  const acceptanceDates = recent.acceptanceDateTime || [];
  const primaryDocuments = recent.primaryDocument || [];
  const cikNoZeros = String(Number(safeCik));
  const filings = accessionNumbers.slice(0, safeLimit).map((accessionNumber, index) => {
    const accessionPath = String(accessionNumber || "").replace(/-/g, "");
    const primaryDocument = primaryDocuments[index] || "";
    return {
      cik: safeCik,
      companyName: payload.name || "",
      ticker: (payload.tickers || [])[0] || "",
      form: forms[index] || "",
      filingDate: filingDates[index] || "",
      reportDate: reportDates[index] || "",
      acceptanceDateTime: acceptanceDates[index] || "",
      accessionNumber,
      primaryDocument,
      sourceUrl: accessionPath && primaryDocument
        ? `https://www.sec.gov/Archives/edgar/data/${cikNoZeros}/${accessionPath}/${primaryDocument}`
        : url,
    };
  }).filter((item) => item.accessionNumber);
  if (!filings.length) {
    throw new Error("SEC EDGAR returned no filing events for this CIK.");
  }
  return {
    cik: safeCik,
    provider: "sec_edgar_submissions",
    providerMode: "official-public-preview",
    licenseStatus: "official public SEC API; fair-access, User-Agent, attribution, and retention rules must be followed",
    authorizationTier: "official_public_context_api",
    authorizedForEducationPreview: true,
    productionReady: false,
    educationOnly: true,
    sourceUrl: url,
    filings,
    constraints: [
      "SEC filings are historical event context for education review, not buy/sell reasons or recommendations.",
      "Use a truthful User-Agent, respect fair-access limits, and keep SEC/source attribution visible.",
    ],
  };
}

async function getAlphaVantageNewsSentiment({ tickers = "AAPL", limit = 5 } = {}) {
  if (!config.news.apiKey) {
    throw new Error("Alpha Vantage news preview requires NEWS_API_KEY; no fallback news or sentiment is fabricated.");
  }
  const safeTickers = String(tickers || "AAPL").toUpperCase().replace(/[^A-Z0-9,._-]/g, "").slice(0, 120);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 50));
  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "NEWS_SENTIMENT");
  url.searchParams.set("tickers", safeTickers || "AAPL");
  url.searchParams.set("limit", String(safeLimit));
  url.searchParams.set("apikey", config.news.apiKey);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Alpha Vantage news request failed: ${response.status}`);
  }
  const payload = await response.json();
  if (payload?.Note || payload?.Information) {
    throw new Error(payload.Note || payload.Information);
  }
  if (payload?.["Error Message"]) {
    throw new Error(payload["Error Message"]);
  }
  const articles = (payload.feed || []).slice(0, safeLimit).map((item) => ({
    title: item.title || "",
    url: item.url || "",
    source: item.source || "",
    timePublished: item.time_published || "",
    summary: item.summary || "",
    overallSentimentLabel: item.overall_sentiment_label || "",
    overallSentimentScore: Number(item.overall_sentiment_score),
  }));
  if (!articles.length) {
    throw new Error("Alpha Vantage returned no parseable news/sentiment rows for this ticker set.");
  }
  return {
    tickers: safeTickers,
    provider: "alpha_vantage_news_sentiment",
    providerMode: "api-key-preview",
    licenseStatus: "API key configured; plan, commercial-use, publisher rights, and redistribution terms still require review",
    authorizationTier: "api_key_terms_review_required",
    authorizedForEducationPreview: false,
    productionReady: false,
    educationOnly: true,
    sourceUrl: "https://www.alphavantage.co/documentation/#news-sentiment",
    articles,
    constraints: [
      "Sentiment labels are classroom context only; they must not become trading permission, ranking, prediction, or advice.",
      "Provider plan, publisher rights, attribution, retention, and redistribution limits must be reviewed before production datasets.",
    ],
  };
}

module.exports = {
  getAlphaVantageNewsSentiment,
  getDemoEventContext,
  getPublicNewsEvents,
  getSecFilingEvents,
  providerStatus,
};
