const riskDomains = [
  "invalidation", "no_action_condition", "position_thinking_boundary", "uncertainty", "loss_aversion",
  "confirmation_bias", "recency_bias", "overconfidence", "fomo", "revenge_behavior", "process_discipline",
  "journal_review", "attention_control", "post_event_emotion", "risk_language",
];

const riskLabels = [
  "missing invalidation", "forcing conclusion", "overweighting last candle", "headline attachment",
  "chasing after spike", "moving target after feedback", "ignoring no-action condition", "confidence after one case",
  "mistaking demo for proof", "metric worship", "sample cherry picking", "forgetting data boundary",
  "ignoring uncertainty", "not naming conflict", "emotion after wrong answer", "trying to recover previous mistake",
  "reading outcome instead of process", "skipping journal evidence", "single source narrative", "changing criteria mid-review",
];

const riskPsychologyCandidates = Array.from({ length: 3000 }, (_, index) => {
  const domain = riskDomains[index % riskDomains.length];
  const label = riskLabels[Math.floor(index / riskDomains.length) % riskLabels.length];
  return {
    id: `rpc_${String(index + 1).padStart(5, "0")}`,
    label: `${label} ${Math.floor(index / (riskDomains.length * riskLabels.length)) + 1}`,
    category: domain,
    educationUse: "Use as a learner mistake or coaching-focus candidate after review.",
    riskMechanism: "The learner may turn uncertainty, emotion, or a small sample into an overconfident conclusion.",
    coachingQuestion: "What evidence would make you pause, rewrite, or choose no action in this learning case?",
    learnerFacingAllowed: false,
    boundaryNote: "Risk and psychology candidates support education review only and do not guide real funds.",
  };
});

module.exports = {
  riskPsychologyCandidates,
};
