const { config } = require("./config");

function providerStatus() {
  const publicPreview = config.news.provider === "gdelt_public";
  return {
    provider: config.news.provider,
    mode: config.news.provider === "demo" ? "teaching-demo" : publicPreview ? "public-preview" : "external",
    licensedNewsData: false,
    productionNote: config.news.provider === "demo"
      ? "Demo news and sentiment are educational context only, not real-time news or investable sentiment."
      : publicPreview
        ? "GDELT public preview can test timestamped event context, but publisher rights and commercial use still need review."
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

module.exports = {
  getDemoEventContext,
  getPublicNewsEvents,
  providerStatus,
};
