const { config } = require("./config");

const PROVIDER = config.aiCoach.provider;
const PROMPT_VERSION = "tradegym-coach-v1";

const bannedTerms = ["买入", "卖出", "梭哈", "稳赚", "保证收益", "荐股", "跟单", "实盘信号"];

function reviewCompliance(text) {
  const source = String(text || "");
  const hits = bannedTerms.filter((term) => source.includes(term));
  return {
    passed: hits.length === 0,
    hits,
    status: hits.length ? "needs_review" : "approved",
    message: hits.length ? `触发合规拦截词：${hits.join("、")}` : "通过",
  };
}

function scorePlan(plan) {
  const text = String(plan || "");
  let score = 58;
  if (/止损|失效|认错|跌破|放弃/.test(text)) score += 14;
  if (/仓位|小仓|轻仓|不重仓/.test(text)) score += 10;
  if (/观望|等待|确认|回踩/.test(text)) score += 10;
  if (text.length >= 28) score += 8;
  return Math.min(score, 96);
}

function generateTrainingFeedback({ scenario, selectedIndex, plan }) {
  const correct = selectedIndex === scenario.answer;
  const planScore = scorePlan(plan);
  const inputReview = reviewCompliance(plan);
  const riskScore = inputReview.passed ? planScore : Math.max(45, planScore - 24);
  const scores = [
    correct ? scenario.baseScores[0] : Math.max(45, scenario.baseScores[0] - 22),
    scenario.baseScores[1],
    riskScore,
  ];
  const planSignal = planScore >= 80
    ? "你的计划里包含了等待、止损或仓位意识，训练质量较好。"
    : "你的计划还不够完整，真实训练里必须写清楚失效条件和仓位理由。";
  const compliance = inputReview.passed
    ? "本次复盘保持在教学范围内。"
    : `${inputReview.message}，系统不会生成实盘买卖建议。`;
  const body = `${scenario.feedback} ${planSignal} ${compliance}`;
  const outputReview = reviewCompliance(body);
  const moderationStatus = inputReview.passed && outputReview.passed ? "approved" : "needs_review";

  return {
    provider: PROVIDER,
    promptVersion: PROMPT_VERSION,
    moderationStatus,
    correct,
    title: correct ? scenario.feedbackTitle : "这次判断需要修正",
    body,
    scores,
    tags: inputReview.passed ? scenario.tags : [...scenario.tags, "合规风险话术"],
    nextPath: scenario.nextPath,
    complianceReview: {
      input: inputReview,
      output: outputReview,
    },
  };
}

function replayTagsForReview(review) {
  return review.passed ? ["回放练习"] : ["回放练习", "合规风险话术"];
}

function providerStatus() {
  return {
    provider: PROVIDER,
    promptVersion: PROMPT_VERSION,
    mode: PROVIDER === "mock" ? "fallback" : "external",
  };
}

module.exports = {
  generateTrainingFeedback,
  providerStatus,
  replayTagsForReview,
  reviewCompliance,
};
