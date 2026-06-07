const { config } = require("./config");

const demoCandles = [
  [102, 106, 100, 105],
  [105, 107, 102, 103],
  [103, 106, 101, 104],
  [104, 108, 103, 107],
  [107, 109, 105, 106],
  [106, 110, 105, 109],
  [109, 112, 108, 111],
  [111, 113, 109, 110],
  [110, 114, 109, 113],
  [113, 118, 112, 117],
  [117, 121, 116, 120],
  [120, 123, 117, 118],
  [118, 121, 115, 116],
  [116, 119, 114, 118],
  [118, 124, 117, 123],
  [123, 126, 121, 125],
  [125, 127, 122, 123],
  [123, 125, 119, 120],
];

function providerStatus() {
  return {
    provider: config.marketData.provider,
    mode: config.marketData.provider === "demo" ? "teaching-demo" : "external",
    licensedLiveData: false,
    productionNote: config.marketData.provider === "demo"
      ? "Demo candles are synthetic teaching data and are not live or licensed market data."
      : "External market data must be licensed, delayed/live status must be disclosed, and no trading signals may be produced.",
  };
}

function getDemoChartContext({ symbol = "DEMO-PRICE", timeframe = "15m" } = {}) {
  return {
    symbol,
    timeframe,
    candles: demoCandles,
    technical: "Teaching demo: price breaks above a prior high, then falls back into the range. The training focus is invalidation, not prediction.",
    dataSource: {
      provider: config.marketData.provider,
      mode: providerStatus().mode,
      label: "Synthetic teaching candles",
      isDemo: true,
      license: "internal-demo-only",
    },
  };
}

module.exports = {
  getDemoChartContext,
  providerStatus,
};
