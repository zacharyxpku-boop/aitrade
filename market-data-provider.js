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
  const publicPreview = config.marketData.provider === "stooq_public";
  return {
    provider: config.marketData.provider,
    mode: config.marketData.provider === "demo" ? "teaching-demo" : publicPreview ? "public-preview" : "external",
    licensedLiveData: false,
    productionNote: config.marketData.provider === "demo"
      ? "Demo candles are synthetic teaching data and are not live or licensed market data."
      : publicPreview
        ? "Stooq public CSV preview can test ingestion, but commercial-use rights and production licensing are not verified."
        : "External market data must be licensed, delayed/live status must be disclosed, and no trading signals may be produced.",
  };
}

function parseStooqCsv(csv) {
  const lines = String(csv || "").trim().split(/\r?\n/).filter(Boolean);
  const rows = lines.slice(1).map((line) => {
    const [date, open, high, low, close, volume] = line.split(",");
    return {
      date,
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume || 0),
    };
  }).filter((row) => row.date && [row.open, row.high, row.low, row.close].every(Number.isFinite));
  return rows;
}

async function getPublicDailyCandles({ symbol = "aapl.us", limit = 60 } = {}) {
  const safeSymbol = String(symbol || "aapl.us").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(safeSymbol)}&i=d`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "TradeGym education-only public data preview; contact: local-demo@tradegym.local",
    },
  });
  if (!response.ok) {
    throw new Error(`Stooq public CSV request failed: ${response.status}`);
  }
  const text = await response.text();
  if (/requires JavaScript|__verify|<html/i.test(text)) {
    throw new Error("Stooq public CSV is protected by browser verification in this environment; do not bypass it without terms review.");
  }
  const rows = parseStooqCsv(text).slice(-Math.max(5, Math.min(Number(limit) || 60, 240)));
  if (!rows.length) {
    throw new Error("Stooq public CSV returned no parseable OHLCV rows for this symbol.");
  }
  return {
    symbol: safeSymbol,
    timeframe: "1D",
    provider: "stooq_daily_csv",
    providerMode: "public-preview",
    licenseStatus: "publicly reachable; commercial rights not verified",
    productionReady: false,
    educationOnly: true,
    sourceUrl: url,
    rows,
    candles: rows.map((row) => [row.open, row.high, row.low, row.close]),
    constraints: [
      "Public CSV preview is for ingestion testing and education dataset review only.",
      "It is not licensed production market data, a live signal, a return promise, or real-money trading guidance.",
    ],
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
  getPublicDailyCandles,
  providerStatus,
};
