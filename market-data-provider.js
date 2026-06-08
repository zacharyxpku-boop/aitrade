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
  const alphaPreview = config.marketData.provider === "alpha_vantage";
  return {
    provider: config.marketData.provider,
    mode: config.marketData.provider === "demo" ? "teaching-demo" : publicPreview ? "public-preview" : alphaPreview ? (config.marketData.apiKey ? "api-key-preview" : "api-key-missing") : "external",
    licensedLiveData: false,
    productionNote: config.marketData.provider === "demo"
      ? "Demo candles are synthetic teaching data and are not live or licensed market data."
      : publicPreview
        ? "Stooq public CSV preview can test ingestion, but commercial-use rights and production licensing are not verified. User-facing real historical candles require a licensed market-data contract."
        : alphaPreview
          ? "Alpha Vantage preview requires an API key and commercial-use approval/plan review; it remains non-signal education context."
        : "External market data must be licensed, display/redistribution rights and delayed/live status must be disclosed, and no trading signals may be produced.",
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
    authorizationTier: "unverified_public_market_data",
    authorizedForLearnerDataset: false,
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

function parseAlphaTimeSeries(payload, limit) {
  const series = payload?.["Time Series (Daily)"] || payload?.["Time Series (60min)"] || {};
  return Object.entries(series)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-Math.max(5, Math.min(Number(limit) || 60, 240)))
    .map(([date, row]) => ({
      date,
      open: Number(row["1. open"]),
      high: Number(row["2. high"]),
      low: Number(row["3. low"]),
      close: Number(row["4. close"]),
      volume: Number(row["5. volume"] || 0),
    }))
    .filter((row) => row.date && [row.open, row.high, row.low, row.close].every(Number.isFinite));
}

async function getAlphaVantageDailyCandles({ symbol = "AAPL", limit = 60 } = {}) {
  if (!config.marketData.apiKey) {
    throw new Error("Alpha Vantage preview requires MARKET_DATA_API_KEY; no fallback data is fabricated.");
  }
  const safeSymbol = String(symbol || "AAPL").trim().toUpperCase().replace(/[^A-Z0-9._-]/g, "").slice(0, 24);
  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "TIME_SERIES_DAILY");
  url.searchParams.set("symbol", safeSymbol || "AAPL");
  url.searchParams.set("outputsize", "compact");
  url.searchParams.set("apikey", config.marketData.apiKey);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Alpha Vantage daily request failed: ${response.status}`);
  }
  const payload = await response.json();
  if (payload?.Note || payload?.Information) {
    throw new Error(payload.Note || payload.Information);
  }
  if (payload?.["Error Message"]) {
    throw new Error(payload["Error Message"]);
  }
  const rows = parseAlphaTimeSeries(payload, limit);
  if (!rows.length) {
    throw new Error("Alpha Vantage returned no parseable OHLCV rows for this symbol.");
  }
  return {
    symbol: safeSymbol,
    timeframe: "1D",
    provider: "alpha_vantage_daily",
    providerMode: "api-key-preview",
    licenseStatus: "API key configured; plan, commercial-use, and redistribution terms still require review",
    authorizationTier: "api_key_terms_review_required",
    authorizedForLearnerDataset: false,
    productionReady: false,
    educationOnly: true,
    sourceUrl: "https://www.alphavantage.co/documentation/#daily",
    rows,
    candles: rows.map((row) => [row.open, row.high, row.low, row.close]),
    constraints: [
      "Alpha Vantage preview is for authorized API ingestion testing only, subject to the configured account plan.",
      "It is not a stock recommendation, live signal, return promise, broker workflow, auto-trading input, or real-money instruction.",
    ],
  };
}

async function getYahooPublicDailyCandles({ symbol = "AAPL", limit = 60 } = {}) {
  const safeSymbol = String(symbol || "AAPL").trim().toUpperCase().replace(/[^A-Z0-9._-]/g, "").slice(0, 24);
  const safeLimit = Math.max(5, Math.min(Number(limit) || 60, 180));
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(safeSymbol || "AAPL")}`);
  url.searchParams.set("range", "6mo");
  url.searchParams.set("interval", "1d");
  url.searchParams.set("includePrePost", "false");
  const response = await fetch(url, {
    headers: {
      "user-agent": "TradeGym education-only public data preview; contact: local-demo@tradegym.local",
      "accept": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Yahoo chart public preview request failed: ${response.status}`);
  }
  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0] || {};
  const timestamps = result?.timestamp || [];
  const rows = timestamps.map((timestamp, index) => ({
    date: new Date(timestamp * 1000).toISOString().slice(0, 10),
    open: Number(quote.open?.[index]),
    high: Number(quote.high?.[index]),
    low: Number(quote.low?.[index]),
    close: Number(quote.close?.[index]),
    volume: Number(quote.volume?.[index] || 0),
  })).filter((row) => row.date && [row.open, row.high, row.low, row.close].every(Number.isFinite)).slice(-safeLimit);
  if (!rows.length) {
    throw new Error("Yahoo chart public preview returned no parseable OHLCV rows.");
  }
  return {
    symbol: safeSymbol,
    timeframe: "1D",
    provider: "yahoo_chart_public_preview",
    providerMode: "public-preview",
    licenseStatus: "publicly reachable endpoint; commercial rights, redistribution, and display terms not verified",
    authorizationTier: "unverified_public_market_data",
    authorizedForLearnerDataset: false,
    productionReady: false,
    educationOnly: true,
    sourceUrl: url.toString(),
    rows,
    candles: rows.map((row) => [row.open, row.high, row.low, row.close]),
    constraints: [
      "Yahoo chart preview is only a fallback for education trial ingestion testing.",
      "Commercial product use requires licensed market data, redistribution/display review, and source attribution.",
      "It must not be used as a stock recommendation, live signal, return promise, broker workflow, auto-trading input, or real-money instruction.",
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
  getAlphaVantageDailyCandles,
  getDemoChartContext,
  getPublicDailyCandles,
  getYahooPublicDailyCandles,
  providerStatus,
};
