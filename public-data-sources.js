const publicDataSources = [
  {
    key: "stooq_daily_csv",
    name: "Stooq daily CSV",
    type: "market_ohlcv",
    access: "public_download",
    keyRequired: false,
    defaultProviderMode: "public-preview",
    url: "https://stooq.com/q/d/l/",
    useInProduct: "Preview daily OHLCV ingestion and source-label plumbing before a licensed market-data contract.",
    licenseStatus: "publicly reachable; commercial rights not verified",
    productionReady: false,
    requiredReview: ["terms review", "commercial-use review", "symbol coverage review", "data quality review"],
  },
  {
    key: "gdelt_doc_api",
    name: "GDELT 2.1 DOC API",
    type: "news_events",
    access: "public_api",
    keyRequired: false,
    defaultProviderMode: "public-preview",
    url: "https://api.gdeltproject.org/api/v2/doc/doc",
    useInProduct: "Preview historical news/event context and timestamped article attribution.",
    licenseStatus: "publicly reachable; downstream content rights depend on linked publishers",
    productionReady: false,
    requiredReview: ["terms review", "publisher-rights review", "attribution review", "rate-limit review"],
  },
  {
    key: "sec_edgar",
    name: "SEC EDGAR APIs",
    type: "filings_events",
    access: "official_public_api",
    keyRequired: false,
    defaultProviderMode: "public-official",
    url: "https://www.sec.gov/edgar/sec-api-documentation",
    useInProduct: "Add filing-event context with clear timestamps and source attribution.",
    licenseStatus: "official public access; must follow SEC fair-access and User-Agent requirements",
    productionReady: false,
    requiredReview: ["fair-access policy", "User-Agent policy", "issuer mapping", "event labeling review"],
  },
  {
    key: "alpha_vantage",
    name: "Alpha Vantage",
    type: "market_ohlcv_and_news",
    access: "documented_api",
    keyRequired: true,
    defaultProviderMode: "api-key-required",
    url: "https://www.alphavantage.co/documentation/",
    useInProduct: "Candidate for historical OHLCV/news adapter after API key and terms review.",
    licenseStatus: "requires API key and plan/terms review",
    productionReady: false,
    requiredReview: ["API terms", "plan limits", "commercial-use review", "redistribution review"],
  },
];

function publicDataCandidateManifest() {
  return {
    generatedAt: new Date().toISOString(),
    educationOnly: true,
    productionReady: false,
    summary: {
      total: publicDataSources.length,
      noKeyPreview: publicDataSources.filter((item) => !item.keyRequired).length,
      productionReady: publicDataSources.filter((item) => item.productionReady).length,
      needsLegalReview: publicDataSources.filter((item) => item.requiredReview?.length).length,
    },
    sources: publicDataSources,
    constraints: [
      "Publicly reachable data is not the same as licensed commercial training data.",
      "Preview adapters must keep source labels, timestamps, and productionReady:false visible.",
      "No public data preview may be used as a stock recommendation, live signal, return promise, broker workflow, auto-trading input, or real-money instruction.",
    ],
  };
}

module.exports = {
  publicDataCandidateManifest,
};
