function topProfileTags(profile = {}) {
  return Object.entries(profile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));
}

function findKnowledgePoint(knowledgePoints = [], tags = []) {
  const normalized = tags.map((item) => item.tag.toLowerCase()).join(" ");
  return knowledgePoints.find((item) => normalized.includes(String(item.concept || "").toLowerCase()))
    || knowledgePoints[0]
    || null;
}

function findScenario(scenarios = [], tags = [], knowledgePoint) {
  const normalized = [
    ...tags.map((item) => item.tag),
    knowledgePoint?.concept,
    knowledgePoint?.title,
  ].filter(Boolean).join(" ").toLowerCase();
  return scenarios.find((scenario) => (
    [scenario.tag, scenario.title, ...(scenario.tags || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .split(/\s+/)
      .some((part) => normalized.includes(part))
  )) || scenarios[0] || null;
}

function buildLearningPath({ profile = {}, attempts = [], knowledgePoints = [], scenarios = [], entitlement = null } = {}) {
  const tags = topProfileTags(profile);
  const weakTag = tags[0]?.tag || "no-profile-yet";
  const knowledgePoint = findKnowledgePoint(knowledgePoints, tags);
  const scenario = findScenario(scenarios, tags, knowledgePoint);
  const completedTraining = attempts.filter((item) => item.type === "training").length;
  const recentMistake = attempts.find((item) => item.correct === false) || null;
  const trainingLeft = entitlement?.remaining?.training ?? null;
  const focus = knowledgePoint?.concept || weakTag;
  const level = completedTraining < 3 ? "starter" : completedTraining < 10 ? "builder" : "advanced";
  const stage = level === "starter"
    ? { label: "入门", focus: "看结构和失效", objective: "先把前高、跌回区间、认错点和观望条件写清楚。" }
    : level === "builder"
      ? { label: "进阶", focus: "多周期 + 消息情绪边界", objective: "分清高周期背景、中周期结构、当前周期动作，以及消息情绪只是背景。" }
      : { label: "综合", focus: "回放、复盘和指标误区", objective: "把训练答案、回放记录、模拟样本和回测误区串成一条学习证据链。" };
  return {
    generatedAt: new Date().toISOString(),
    educationOnly: true,
    level,
    stage,
    focus,
    weakTags: tags,
    recommendedKnowledgePoint: knowledgePoint ? {
      id: knowledgePoint.id,
      title: knowledgePoint.title,
      concept: knowledgePoint.concept,
      learningObjective: knowledgePoint.learningObjective,
    } : null,
    recommendedScenario: scenario ? {
      id: scenario.id,
      title: scenario.title,
      tag: scenario.tag,
    } : null,
    nextActions: [
      knowledgePoint
        ? `先补课：${knowledgePoint.title}`
        : "先完成一题训练，系统才能生成错因画像",
      scenario
        ? `再练一题：${scenario.title}`
        : "先发布一题教学场景，再进入训练",
      recentMistake
        ? `重写上一次薄弱题的训练计划：${recentMistake.title}`
        : "写一份包含结构、失效条件、风险边界和不做条件的训练计划",
      `当前阶段目标：${stage.objective}`,
    ],
    constraints: [
      "只做教育学习路径。",
      "No stock recommendation, live signal, guaranteed return, or real-money trading instruction.",
      "不提供荐股、实时信号、收益承诺或真实资金交易指导。",
      trainingLeft == null ? "需要登录后计算今日剩余训练次数。" : `今日剩余训练次数：${trainingLeft}`,
    ],
  };
}

module.exports = {
  buildLearningPath,
};
