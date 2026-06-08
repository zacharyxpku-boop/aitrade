import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getPublicDailyCandles, getYahooPublicDailyCandles } = require("../market-data-provider");
const { getPublicNewsEvents, getSecFilingEvents } = require("../news-provider");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const seedPath = path.join(root, "data", "db.json");

const targets = [
  {
    id: "aapl",
    stooqSymbol: "aapl.us",
    displaySymbol: "AAPL",
    cik: "0000320193",
    newsQuery: "Apple stock earnings volatility",
    track: "入门",
    concept: "前高与失效条件",
  },
  {
    id: "msft",
    stooqSymbol: "msft.us",
    displaySymbol: "MSFT",
    cik: "0000789019",
    newsQuery: "Microsoft AI cloud earnings stock",
    track: "进阶",
    concept: "趋势回踩与等待条件",
  },
  {
    id: "tsla",
    stooqSymbol: "tsla.us",
    displaySymbol: "TSLA",
    cik: "0001318605",
    newsQuery: "Tesla delivery stock volatility",
    track: "综合",
    concept: "情绪波动与不追高",
  },
  {
    id: "nvda",
    stooqSymbol: "nvda.us",
    displaySymbol: "NVDA",
    cik: "0001045810",
    newsQuery: "Nvidia AI chip earnings stock",
    track: "复盘专项",
    concept: "消息热度与结构边界",
  },
];

function readSeed() {
  return JSON.parse(fs.readFileSync(seedPath, "utf8"));
}

function writeSeed(db) {
  fs.writeFileSync(seedPath, `${JSON.stringify(db, null, 2)}\n`);
}

function roundedCandles(candles = []) {
  return candles.map((row) => row.map((value) => Number(Number(value).toFixed(2))));
}

function lastWindow(chart, size = 24) {
  const rows = chart.rows.slice(-size);
  return {
    rows,
    candles: roundedCandles(rows.map((row) => [row.open, row.high, row.low, row.close])),
  };
}

function structureSummary(rows = []) {
  const visible = rows.slice(0, Math.max(8, rows.length - 4));
  const highs = visible.map((row) => row.high);
  const closes = visible.map((row) => row.close);
  const priorHigh = Math.max(...highs.slice(0, -1));
  const currentClose = closes.at(-1);
  const recentLow = Math.min(...visible.slice(-8).map((row) => row.low));
  const reclaimed = currentClose > priorHigh;
  return {
    priorHigh: Number(priorHigh.toFixed(2)),
    currentClose: Number(currentClose.toFixed(2)),
    recentLow: Number(recentLow.toFixed(2)),
    reclaimed,
  };
}

function articleLine(preview) {
  const first = preview?.articles?.[0];
  if (!first?.title) return "GDELT 未返回可用文章标题；本题只使用行情结构和 SEC 事件元数据。";
  return `GDELT 公开事件元数据：${first.title}（${first.domain || "source"}，${first.seenDate || "date unknown"}）。只用标题/来源/时间做历史背景，不抓取或复刻正文。`;
}

function filingLine(sec) {
  const first = sec?.filings?.[0];
  if (!first?.form) return "SEC EDGAR 未返回可用 filing 事件。";
  return `SEC EDGAR 公开 filing 事件：${first.companyName || first.ticker || "issuer"} ${first.form}，filingDate ${first.filingDate || "unknown"}。`;
}

function scenarioFromPreview({ target, chart, gdelt, sec, index }) {
  const window = lastWindow(chart);
  const structure = structureSummary(window.rows);
  const level = target.track;
  const id = `public-preview-${target.id}-${index + 1}`;
  const sourceUrl = chart.sourceUrl;
  return {
    id,
    title: `${target.displaySymbol} 公开预览：${target.concept}`,
    tag: `${level} · 公开预览 · ${target.concept}`,
    symbol: target.displaySymbol,
    timeframe: "1D",
    candles: window.candles,
    technical: `公开预览行情窗口显示：前高约 ${structure.priorHigh}，当前已知收盘约 ${structure.currentClose}，近端失效/认错参考区约 ${structure.recentLow}。训练目标是先写结构和失效条件，不预测方向。`,
    news: `${articleLine(gdelt)} ${filingLine(sec)}`,
    sentiment: "新闻和热度只作为历史环境背景：当时能看到的是事件标题、来源、披露时间和市场波动；事后涨跌不能倒推成理由。",
    question: "在这个公开预览历史窗口里，学习者应该先练什么？",
    options: [
      "先写前高、当前已知收盘、失效/认错条件，并说明哪些信息当时还不知道",
      "看到热门新闻就直接把它当成做多理由",
      "先看后面走势，再回头补一个解释",
      "因为是知名股票，所以不用写风险边界",
    ],
    answer: 0,
    feedbackTitle: "先写当时可见证据，不用结果倒推",
    feedback: `这题训练 ${target.concept}。合格答案要写清楚：当时看到什么结构、哪里认错、新闻/情绪只是背景、哪些结果当时还不知道。`,
    tags: [level, "公开预览", "历史回顾", target.concept, "不偷看未来"],
    baseScores: [82, 78, 84],
    nextPath: "继续按同一格式练：看到什么 → 怎么判断 → 哪里认错 → 我不做什么。公开数据只用于教育预览，不是实盘信号。",
    status: "published",
    reviewStatus: "approved",
    releaseStatus: "public_preview_demo",
    createdAt: new Date().toISOString(),
    createdBy: "public-preview-seed-script",
    source: {
      provider: "public-preview-seed-script",
      mode: "public-preview",
      isDemo: true,
      educationOnly: true,
      productionReady: false,
      learnerLabel: "公开预览历史数据：可用于教育试用和数据管线验证，不等于商业授权行情/新闻数据。",
      marketData: {
        provider: chart.provider,
        mode: chart.providerMode,
        license: chart.licenseStatus,
        authorizationTier: chart.authorizationTier,
        sourceUrl,
        authorizedForLearnerDataset: false,
        productionReady: false,
      },
      news: {
        provider: gdelt?.provider || "gdelt_doc_api",
        mode: gdelt?.providerMode || "public-preview",
        license: gdelt?.licenseStatus || "public metadata preview; linked publisher rights not verified",
        sourceUrl: gdelt?.sourceUrl || "",
        secProvider: sec?.provider || "sec_edgar_submissions",
        secSourceUrl: sec?.sourceUrl || "",
        authorizedForEducationPreview: true,
        productionReady: false,
      },
      constraints: [
        "公开预览数据只用于教育试用、数据管线验证和来源透明训练。",
        "商业化仍需授权历史行情、授权新闻/情绪数据、归因和保留策略审查。",
        "不得把公开预览数据用于荐股、实盘信号、收益承诺、券商连接或真实资金指导。",
      ],
    },
    contextTimeline: [
      {
        label: "当时可见",
        text: `可见 OHLC 历史窗口、GDELT 事件标题/来源/时间、SEC filing 元数据。前高约 ${structure.priorHigh}，当前收盘约 ${structure.currentClose}。`,
      },
      {
        label: "当时不可见",
        text: "后续 K 线、最终涨跌、事后复盘文章和事后解释都不可用。",
      },
      {
        label: "学习用途",
        text: "只训练结构、失效条件、消息/情绪边界和反偷看未来；不生成交易建议。",
      },
    ],
  };
}

async function fetchPreview(target) {
  const result = { target: target.displaySymbol, ok: false, errors: [] };
  try {
    result.chart = await getPublicDailyCandles({ symbol: target.stooqSymbol, limit: 80 });
  } catch (error) {
    result.errors.push(`market:${error.message}`);
    try {
      result.chart = await getYahooPublicDailyCandles({ symbol: target.displaySymbol, limit: 80 });
      result.errors.push("market_fallback:used_yahoo_chart_public_preview_after_stooq_unavailable");
    } catch (fallbackError) {
      result.errors.push(`market_fallback:${fallbackError.message}`);
    }
  }
  try {
    result.gdelt = await getPublicNewsEvents({ query: target.newsQuery, maxRecords: 5 });
  } catch (error) {
    result.errors.push(`gdelt:${error.message}`);
  }
  try {
    result.sec = await getSecFilingEvents({ cik: target.cik, limit: 5 });
  } catch (error) {
    result.errors.push(`sec:${error.message}`);
  }
  result.ok = Boolean(result.chart);
  return result;
}

const db = readSeed();
const previews = [];
for (const target of targets) {
  previews.push(await fetchPreview(target));
}

const scenarios = previews
  .filter((preview) => preview.ok)
  .map((preview, index) => scenarioFromPreview({
    target: targets.find((item) => item.displaySymbol === preview.target),
    chart: preview.chart,
    gdelt: preview.gdelt,
    sec: preview.sec,
    index,
  }));

const existing = new Map((db.scenarios || []).map((scenario) => [scenario.id, scenario]));
for (const scenario of scenarios) existing.set(scenario.id, scenario);
db.scenarios = Array.from(existing.values()).slice(0, 300);

db.publicPreviewSeedRuns ||= [];
db.publicPreviewSeedRuns.unshift({
  id: `public-preview-seed-${Date.now()}`,
  createdAt: new Date().toISOString(),
  attempted: targets.length,
  createdOrUpdated: scenarios.length,
  providerModes: ["stooq_public", "gdelt_public", "sec_edgar"],
  educationOnly: true,
  productionReady: false,
  errors: previews.flatMap((preview) => preview.errors.map((error) => `${preview.target}:${error}`)),
});
db.publicPreviewSeedRuns = db.publicPreviewSeedRuns.slice(0, 20);

writeSeed(db);

console.log(JSON.stringify({
  ok: scenarios.length > 0,
  attempted: targets.length,
  createdOrUpdated: scenarios.length,
  totalScenarios: db.scenarios.length,
  errors: previews.flatMap((preview) => preview.errors.map((error) => `${preview.target}:${error}`)),
  educationOnly: true,
  productionReady: false,
}, null, 2));
