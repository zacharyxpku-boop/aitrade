const { config } = require("./config");

function providerStatus() {
  return {
    provider: config.news.provider,
    mode: config.news.provider === "demo" ? "teaching-demo" : "external",
    licensedNewsData: false,
    productionNote: config.news.provider === "demo"
      ? "Demo news and sentiment are educational context only, not real-time news or investable sentiment."
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

module.exports = {
  getDemoEventContext,
  providerStatus,
};
