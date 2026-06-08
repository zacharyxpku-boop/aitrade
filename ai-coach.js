const { config } = require("./config");

const PROVIDER = config.aiCoach.provider;
const PROMPT_VERSION = "tradegym-coach-v1";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_ANTHROPIC_MODEL = "claude-3-5-haiku-latest";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

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

function diagnosePlanGapDetails({ correct, plan }) {
  const text = String(plan || "");
  const gaps = [];
  if (!correct) gaps.push({ tag: "结构判断不匹配", message: "选项和题目结构不匹配，先回到图上找失效位置。" });
  if (/(结果|后来|事后|最终|回头看|未来|证明)/.test(text) && !/(当时|可见|不知道|不能用|事后不可用|隐藏未来)/.test(text)) {
    gaps.push({ tag: "偷看未来风险", message: "有偷看未来或事后归因的风险：先写当时可见证据，再看结果。" });
  }
  if (!/止损|失效|认错|跌破|放弃|不成立/.test(text)) gaps.push({ tag: "缺失失效条件", message: "没有写清楚哪里认错。" });
  if (/(新闻|消息|情绪|热度).*(所以|因此|就).*(做|追|进|加|冲)/.test(text)) {
    gaps.push({ tag: "情绪当行动理由", message: "把消息或情绪写成了行动理由；它只能做背景和偏见检查。" });
  }
  if (!/仓位|小仓|轻仓|不重仓|风险/.test(text)) gaps.push({ tag: "风险边界薄弱", message: "没有说明风险边界。" });
  if (!/观望|等待|确认|回踩|不做|先不/.test(text)) gaps.push({ tag: "等待条件缺失", message: "没有写出等待或不做的条件。" });
  if (!/新闻|消息|情绪|事件|背景|干扰/.test(text)) gaps.push({ tag: "情绪边界缺失", message: "没有把消息和情绪放回背景框架。" });
  if (text.length < 28) gaps.push({ tag: "理由空泛", message: "理由太短，更像结论，不像训练计划。" });
  return {
    message: gaps[0]?.message || "这次主要做对的是：先写过程，再写动作，没有把单根K线当成全部依据。",
    tags: gaps.map((item) => item.tag),
    allMessages: gaps.map((item) => item.message),
  };
}

function diagnosePlanGap({ correct, plan }) {
  return diagnosePlanGapDetails({ correct, plan }).message;
}

function buildRuleBasedTrainingFeedback({ scenario, selectedIndex, plan, fallbackReason = "" }) {
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
  const gapDetails = diagnosePlanGapDetails({ correct, plan });
  const planGap = gapDetails.message;
  const compliance = inputReview.passed
    ? "本次复盘保持在教学范围内。"
    : `${inputReview.message}，系统不会生成实盘买卖建议。`;
  const body = `${scenario.feedback} 最大问题：${planGap} ${planSignal} ${compliance}`;
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
    tags: inputReview.passed ? [...new Set([...(scenario.tags || []), ...gapDetails.tags])] : [...new Set([...(scenario.tags || []), ...gapDetails.tags, "合规风险话术"])],
    diagnosis: {
      primary: planGap,
      tags: gapDetails.tags,
      allMessages: gapDetails.allMessages,
    },
    nextPath: scenario.nextPath,
    complianceReview: {
      input: inputReview,
      output: outputReview,
    },
    fallbackReason,
    providerRun: providerRunSnapshot({
      fallbackReason,
      externalAttempted: false,
      externalProviderUsed: false,
      inputReview,
      outputReview,
    }),
  };
}

function coachPrompt({ scenario, selectedIndex, plan }) {
  return [
    "你是 AI 交易教育训练场的复盘教练，只能做教育反馈。",
    "禁止荐股、禁止实盘买卖建议、禁止收益承诺、禁止券商/真实资金/自动交易指导。",
    "只评价学习过程：结构、失效条件、风险边界、新闻情绪是否被误当依据。",
    "请输出 JSON，字段为 title, body, tags, nextPath。",
    `题目：${scenario.title}`,
    `问题：${scenario.question}`,
    `用户选择：${scenario.options[selectedIndex] || ""}`,
    `标准训练选项：${scenario.options[scenario.answer] || ""}`,
    `用户计划：${plan || "未填写"}`,
    `场景技术背景：${scenario.technical || ""}`,
    `新闻背景：${scenario.news || ""}`,
    `情绪背景：${scenario.sentiment || ""}`,
  ].join("\n");
}

function safeParseJson(text) {
  const source = String(text || "").trim();
  try {
    return JSON.parse(source);
  } catch {
    const match = source.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
}

async function callOpenAiCoach(prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.aiCoach.apiKey}`,
    },
    body: JSON.stringify({
      model: config.aiCoach.model || DEFAULT_OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are an education-only trading learning coach. Return strict JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`OpenAI coach request failed: ${response.status}`);
  const payload = await response.json();
  return payload.choices?.[0]?.message?.content || "";
}

async function callDeepSeekCoach(prompt) {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.aiCoach.apiKey}`,
    },
    body: JSON.stringify({
      model: config.aiCoach.model || DEFAULT_DEEPSEEK_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are an education-only trading learning coach. Return strict JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`DeepSeek coach request failed: ${response.status}`);
  const payload = await response.json();
  return payload.choices?.[0]?.message?.content || "";
}

async function callAnthropicCoach(prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.aiCoach.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.aiCoach.model || DEFAULT_ANTHROPIC_MODEL,
      max_tokens: 500,
      temperature: 0.2,
      system: "You are an education-only trading learning coach. Return strict JSON only.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`Anthropic coach request failed: ${response.status}`);
  const payload = await response.json();
  return (payload.content || []).map((item) => item.text || "").join("\n");
}

async function generateTrainingFeedback({ scenario, selectedIndex, plan }) {
  const base = buildRuleBasedTrainingFeedback({ scenario, selectedIndex, plan });
  if (PROVIDER === "mock") return base;
  if (!["openai", "anthropic", "deepseek"].includes(PROVIDER)) {
    return buildRuleBasedTrainingFeedback({ scenario, selectedIndex, plan, fallbackReason: `Unsupported provider: ${PROVIDER}` });
  }
  if (!config.aiCoach.apiKey) {
    return buildRuleBasedTrainingFeedback({ scenario, selectedIndex, plan, fallbackReason: `${PROVIDER} API key missing; used local education fallback.` });
  }
  try {
    const raw = PROVIDER === "openai"
      ? await callOpenAiCoach(coachPrompt({ scenario, selectedIndex, plan }))
      : PROVIDER === "deepseek"
        ? await callDeepSeekCoach(coachPrompt({ scenario, selectedIndex, plan }))
        : await callAnthropicCoach(coachPrompt({ scenario, selectedIndex, plan }));
    const parsed = safeParseJson(raw);
    if (!parsed?.body) throw new Error("External coach did not return usable JSON body");
    const body = String(parsed.body || "").slice(0, 1200);
    const outputReview = reviewCompliance(`${parsed.title || ""} ${body} ${(parsed.tags || []).join(" ")} ${parsed.nextPath || ""}`);
    if (!outputReview.passed) {
      return buildRuleBasedTrainingFeedback({ scenario, selectedIndex, plan, fallbackReason: `External output blocked: ${outputReview.hits.join("、")}` });
    }
    return {
      ...base,
      provider: PROVIDER,
      promptVersion: PROMPT_VERSION,
      title: String(parsed.title || base.title).slice(0, 120),
      body,
      tags: Array.isArray(parsed.tags) && parsed.tags.length ? parsed.tags.map(String).slice(0, 6) : base.tags,
      nextPath: String(parsed.nextPath || base.nextPath).slice(0, 400),
      moderationStatus: base.complianceReview.input.passed ? "approved" : "needs_review",
      complianceReview: {
        input: base.complianceReview.input,
        output: outputReview,
      },
      providerRun: providerRunSnapshot({
        externalAttempted: true,
        externalProviderUsed: true,
        inputReview: base.complianceReview.input,
        outputReview,
      }),
      externalProviderUsed: true,
    };
  } catch (error) {
    return buildRuleBasedTrainingFeedback({ scenario, selectedIndex, plan, fallbackReason: error.message || "External coach failed; used local education fallback." });
  }
}

function replayTagsForReview(review) {
  return review.passed ? ["回放练习"] : ["回放练习", "合规风险话术"];
}

function providerStatus() {
  const externalConfigured = ["openai", "anthropic", "deepseek"].includes(PROVIDER) && Boolean(config.aiCoach.apiKey);
  return {
    provider: PROVIDER,
    promptVersion: PROMPT_VERSION,
    mode: externalConfigured ? "external" : "fallback",
    model: providerModelName(),
    apiKeyConfigured: Boolean(config.aiCoach.apiKey),
    externalConfigured,
    fallbackAvailable: true,
    complianceFilter: "education-only-output-review",
    productionReady: false,
  };
}

module.exports = {
  generateTrainingFeedback,
  providerStatus,
  replayTagsForReview,
  reviewCompliance,
};

function providerModelName() {
  if (PROVIDER === "anthropic") return config.aiCoach.model || DEFAULT_ANTHROPIC_MODEL;
  if (PROVIDER === "deepseek") return config.aiCoach.model || DEFAULT_DEEPSEEK_MODEL;
  if (PROVIDER === "openai") return config.aiCoach.model || DEFAULT_OPENAI_MODEL;
  return "local-rule-based";
}

function providerRunSnapshot({ fallbackReason = "", externalAttempted = false, externalProviderUsed = false, inputReview = null, outputReview = null } = {}) {
  const externalConfigured = ["openai", "anthropic", "deepseek"].includes(PROVIDER) && Boolean(config.aiCoach.apiKey);
  return {
    provider: PROVIDER,
    mode: externalProviderUsed ? "external" : "fallback",
    model: providerModelName(),
    promptVersion: PROMPT_VERSION,
    apiKeyConfigured: Boolean(config.aiCoach.apiKey),
    externalConfigured,
    externalAttempted,
    externalProviderUsed,
    fallbackUsed: !externalProviderUsed,
    fallbackReason: fallbackReason || (!externalConfigured ? "mock_or_missing_key_local_fallback" : ""),
    moderationStatus: inputReview?.passed === false || outputReview?.passed === false ? "needs_review" : "approved",
    inputComplianceStatus: inputReview?.status || "not_checked",
    outputComplianceStatus: outputReview?.status || "not_checked",
    educationOnly: true,
    productionReady: false,
  };
}
