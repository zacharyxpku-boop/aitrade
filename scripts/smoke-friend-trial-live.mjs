const baseUrl = (process.env.LIVE_BASE_URL || process.env.APP_BASE_URL || "https://aitrade-ll84.vercel.app").replace(/\/+$/, "");

async function fetchText(path) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "TradeGym live smoke/1.0",
    },
  });
  const text = await response.text();
  return { url, status: response.status, text };
}

function requireIncludes(label, text, checks) {
  const missing = checks.filter((item) => !text.includes(item));
  if (missing.length) {
    throw new Error(`${label} missing: ${missing.join(", ")}`);
  }
}

function requireExcludes(label, text, checks) {
  const found = checks.filter((item) => text.includes(item));
  if (found.length) {
    throw new Error(`${label} forbidden content: ${found.join(", ")}`);
  }
}

const page = await fetchText("/friend-trial");
const app = await fetchText("/app.js");
const styles = await fetchText("/styles.css");

for (const item of [page, app, styles]) {
  if (item.status !== 200) {
    throw new Error(`${item.url} returned ${item.status}`);
  }
}

requireIncludes("live /friend-trial", page.text, [
  "AI 交易教育训练场",
  "不荐股",
  "不实盘",
  "本地 demo AI",
  "mock provider",
  "课程路线图",
  "来源透明",
  "本题数据来源",
  "本次回放的数据边界",
  "反馈后的下一步训练",
]);

requireIncludes("live app.js", app.text, [
  "course-roadmap",
  "source-trust-card",
  "professional-reading-map",
  "historical-context-strip",
  "question-bank-quality",
  "learner-data-credibility",
  "training-plan-gap-card",
  "courseRoadmapHtml",
  "sourceCardHtml",
  "educationOnly",
  "productionReady",
]);

requireIncludes("live styles.css", styles.text, [
  ".course-roadmap",
  ".source-trust-card",
  ".source-trust-grid",
  ".professional-reading-map",
  ".historical-context-strip",
  ".question-bank-quality",
  ".learner-data-credibility",
  ".training-plan-gap-card",
]);

requireExcludes("live /friend-trial", page.text, [
  "朋友试用",
  "推荐买入",
  "推荐卖出",
  "保证收益",
  "已连接券商",
  "接入券商下单",
  "自动下单",
]);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  page: {
    status: page.status,
    bytes: page.text.length,
    courseRoadmap: page.text.includes("课程路线图"),
    sourceTrust: page.text.includes("来源透明"),
    providerLabel: page.text.includes("本地 demo AI") && page.text.includes("mock provider"),
  },
  app: {
    status: app.status,
    bytes: app.text.length,
  },
  styles: {
    status: styles.status,
    bytes: styles.text.length,
  },
  productionReady: false,
  educationOnly: true,
}));
