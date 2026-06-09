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

async function fetchJson(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      "user-agent": "TradeGym live smoke/1.0",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${url} did not return JSON: ${text.slice(0, 200)}`);
  }
  return { url, status: response.status, data, text };
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
  "Post-submit learning panel refresh skipped",
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

const bootstrap = await fetchJson("/api/bootstrap");
if (bootstrap.status !== 200 || !bootstrap.data.scenarios?.[0]?.id) {
  throw new Error(`live bootstrap failed: ${bootstrap.status}`);
}
const scenario = bootstrap.data.scenarios[0];
const attempt = await fetchJson("/api/attempts", {
  method: "POST",
  body: JSON.stringify({
    scenarioId: scenario.id,
    selectedIndex: 0,
    plan: "live smoke short training plan",
  }),
});
if (attempt.status !== 201 || !attempt.data.feedback || !attempt.data.attempt?.id) {
  throw new Error(`live training submit failed: ${attempt.status} ${attempt.text.slice(0, 300)}`);
}

const postSubmitEndpoints = [
  "/api/notifications",
  "/api/course-packages",
];
const postSubmitChecks = [];
for (const endpoint of postSubmitEndpoints) {
  const result = await fetchJson(endpoint);
  postSubmitChecks.push({ endpoint, status: result.status });
  if (result.status !== 200) {
    throw new Error(`live post-submit endpoint failed: ${endpoint} ${result.status} ${result.text.slice(0, 300)}`);
  }
}

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
  liveTrainingSubmit: {
    status: attempt.status,
    attemptId: attempt.data.attempt.id,
    postSubmitChecks,
  },
  productionReady: false,
  educationOnly: true,
}));
