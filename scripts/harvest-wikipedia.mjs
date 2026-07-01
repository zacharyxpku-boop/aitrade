import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Wikipedia finance/trading article harvester.
// License: CC BY-SA 4.0 -> tier "share_alike". Reuse requires attribution and
// share-alike on derivatives; our learner-facing rule (original wording only)
// is stricter and stays in force. Articles feed the research/reference layer.

const corpusDir = "data/corpus";
fs.mkdirSync(corpusDir, { recursive: true });

const DELAY_MS = Number(process.env.WIKI_DELAY_MS || 800);
const FETCH_TIMEOUT_MS = 20000;
const USER_AGENT = "TradeGymEducationCorpus/0.1 (local education prototype; research-layer reference; contact: local)";

const ARTICLES = [
  // chart / price action / patterns
  "Technical analysis", "Candlestick chart", "Candlestick pattern", "Doji",
  "Support and resistance", "Chart pattern", "Head and shoulders (chart pattern)",
  "Double top and double bottom", "Trend line (technical analysis)", "Breakout (technical analysis)",
  "Fibonacci retracement", "Elliott wave principle", "Dow theory", "Market trend",
  // indicators
  "Moving average", "Relative strength index", "MACD", "Bollinger Bands",
  "Stochastic oscillator", "Average directional movement index", "Volume-weighted average price",
  "On-balance volume", "Momentum (technical analysis)", "Ichimoku Kinkō Hyō",
  // backtesting / research hygiene
  "Backtesting", "Overfitting", "Survivorship bias", "Look-ahead bias",
  "Data dredging", "Walk forward optimization", "Cross-validation (statistics)",
  "Multiple comparisons problem", "Sharpe ratio", "Sortino ratio",
  // risk / portfolio
  "Risk management", "Value at risk", "Kelly criterion", "Drawdown (economics)",
  "Position sizing", "Diversification (finance)", "Modern portfolio theory",
  "Margin (finance)", "Leverage (finance)", "Hedge (finance)",
  // psychology / behavior
  "Behavioral economics", "Loss aversion", "Prospect theory", "Herd behavior",
  "Confirmation bias", "Overconfidence effect", "Fear of missing out",
  "Gambler's fallacy", "Sunk cost", "Disposition effect",
  // news / sentiment / events
  "Sentiment analysis", "Market sentiment", "Event study", "Efficient-market hypothesis",
  "Random walk hypothesis", "Earnings call", "News analytics",
  // macro
  "Inflation", "Consumer price index", "Yield curve", "Federal Reserve",
  "Quantitative easing", "Interest rate", "Gross domestic product",
  // microstructure / instruments
  "Market microstructure", "Order book", "Bid–ask spread", "Market maker",
  "Order (exchange)", "Limit order book? ", "High-frequency trading", "Algorithmic trading",
  "Futures contract", "Option (finance)", "Greeks (finance)", "Implied volatility",
  "VIX", "Short (finance)", "Settlement (finance)", "Clearing (finance)",
  // strategies / misc education
  "Day trading", "Swing trading", "Trend following", "Mean reversion (finance)",
  "Pairs trade", "Momentum investing", "Market manipulation", "Pump and dump",
  "Ponzi scheme", "Insider trading",
].map((title) => title.trim()).filter((title) => !title.includes("?"));

const ARTICLE_LIST = process.env.WIKI_ARTICLES ? JSON.parse(process.env.WIKI_ARTICLES) : ARTICLES;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { redirect: "follow", headers: { "user-agent": USER_AGENT } , signal: controller.signal }).finally(() => clearTimeout(timer));
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

const existingFiles = fs.readdirSync(corpusDir).filter((file) => /^corpus_\d+\.json$/.test(file));
const existingSourceIds = new Set();
let docCounter = 0;
for (const file of existingFiles) {
  docCounter = Math.max(docCounter, Number((file.match(/^corpus_(\d+)\.json$/) || [])[1] || 0));
  try {
    const doc = JSON.parse(fs.readFileSync(path.join(corpusDir, file), "utf8"));
    if (doc.sourceId) existingSourceIds.add(doc.sourceId);
  } catch { /* keep numbering past unreadable files */ }
}

const stored = [];
const skipped = [];

for (const title of ARTICLE_LIST) {
  await sleep(DELAY_MS);
  try {
    const api = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|info&explaintext=1&redirects=1&inprop=url&format=json&formatversion=2&titles=${encodeURIComponent(title)}`;
    const response = await fetchWithTimeout(api);
    if (!response.ok) {
      skipped.push({ title, reason: `HTTP ${response.status}` });
      continue;
    }
    const data = await response.json();
    const page = data?.query?.pages?.[0];
    if (!page || page.missing || !page.extract) {
      skipped.push({ title, reason: "page missing or no extract" });
      continue;
    }
    const sourceId = `wikipedia:${page.pageid}`;
    if (existingSourceIds.has(sourceId)) {
      skipped.push({ title, reason: "already stored" });
      continue;
    }
    existingSourceIds.add(sourceId);
    const text = page.extract.trim();
    if (text.length < 1500) {
      skipped.push({ title, reason: `extract too short (${text.length})` });
      continue;
    }
    docCounter += 1;
    const id = `corpus_${String(docCounter).padStart(4, "0")}`;
    const record = {
      id,
      educationOnly: true,
      productionReady: false,
      sourceId,
      name: `Wikipedia: ${page.title}`,
      url: page.canonicalurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
      tier: "share_alike",
      contentType: "text/plain",
      sha256: sha256(Buffer.from(text, "utf8")),
      charCount: text.length,
      textExtraction: "full",
      attribution: `"${page.title}" by Wikipedia contributors, CC BY-SA 4.0, ${page.canonicalurl || ""}`,
      licenseEvidence: "Wikipedia text is CC BY-SA 4.0; reuse requires attribution and share-alike on adaptations.",
      text,
      fetchedAt: new Date().toISOString(),
      boundary: "CC BY-SA research-layer reference text. Any quoted reuse needs attribution and share-alike; learner-facing lessons keep original wording and modern risk boundaries. Not trading advice.",
    };
    fs.writeFileSync(path.join(corpusDir, `${id}.json`), `${JSON.stringify(record, null, 2)}\n`, "utf8");
    stored.push({ id, title: page.title, charCount: text.length });
  } catch (error) {
    skipped.push({ title, reason: error.name === "AbortError" ? "timeout" : error.message });
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  articlesAttempted: ARTICLE_LIST.length,
  articlesStored: stored.length,
  skipped: skipped.length,
  stored,
  skippedList: skipped,
  boundary: "Wikipedia harvest is CC BY-SA reference material for the research layer. It does not change learner-facing original-wording rules and is not trading advice.",
};
fs.writeFileSync("docs/WIKIPEDIA_HARVEST_REPORT.json", `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ok: true, articlesAttempted: ARTICLE_LIST.length, articlesStored: stored.length, skipped: skipped.length }, null, 2));
