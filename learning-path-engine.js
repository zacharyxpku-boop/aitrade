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
  return {
    generatedAt: new Date().toISOString(),
    educationOnly: true,
    level: completedTraining < 3 ? "starter" : completedTraining < 10 ? "builder" : "advanced",
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
        ? `Review knowledge point: ${knowledgePoint.title}`
        : "Complete one daily training scenario to create an error profile",
      scenario
        ? `Practice scenario: ${scenario.title}`
        : "Generate or publish a teaching scenario before assigning practice",
      recentMistake
        ? `Rewrite the plan from your last weak attempt: ${recentMistake.title}`
        : "Write a plan that includes structure, invalidation, and risk limit",
    ],
    constraints: [
      "Education-only learning path.",
      "No stock recommendation, live signal, guaranteed return, or real-money trading instruction.",
      trainingLeft == null ? "Login required to calculate remaining daily practice." : `Daily training left: ${trainingLeft}`,
    ],
  };
}

module.exports = {
  buildLearningPath,
};
