const distillationRules = [
  {
    id: "rule_original_expression",
    title: "原创教育表达优先",
    appliesTo: ["KnowledgeNodeV2", "rubricDraft", "practicePrompt"],
    rule: "Learner-facing explanations must be original Chinese teaching language, not copied from source text.",
    learnerFacingGate: true,
    boundaryNote: "Original expression can teach concepts, but still cannot become action guidance.",
  },
  {
    id: "rule_research_only_block",
    title: "research_only 阻断",
    appliesTo: ["ConceptCandidate", "SourceInventory"],
    rule: "research_only sources can support clustering and internal drafts, but cannot directly produce learner-facing nodes.",
    learnerFacingGate: true,
    boundaryNote: "Unreviewed sources remain internal research material.",
  },
  {
    id: "rule_multi_timeframe",
    title: "多周期阅读必备",
    appliesTo: ["KnowledgeNodeV2"],
    rule: "Every node must include D1, H4, H1, and M15 reading guidance.",
    learnerFacingGate: false,
    boundaryNote: "Timeframe guidance is a learning sequence, not an execution sequence.",
  },
  {
    id: "rule_news_as_context",
    title: "新闻情绪只做背景",
    appliesTo: ["news_sentiment", "event_context"],
    rule: "News and sentiment can explain context and bias, but cannot be written as a reason to act.",
    learnerFacingGate: true,
    boundaryNote: "News context is not a trading instruction.",
  },
  {
    id: "rule_backtest_as_diagnostic",
    title: "回测只做诊断",
    appliesTo: ["backtest", "metric"],
    rule: "Backtest and metric candidates must be taught as diagnostics, not as proof of future results.",
    learnerFacingGate: true,
    boundaryNote: "Metrics are learning evidence quality checks only.",
  },
  {
    id: "rule_pattern_label_not_decision",
    title: "形态标签不是结论",
    appliesTo: ["candlestick", "chart_pattern", "indicator"],
    rule: "A pattern or indicator label must be paired with location, structure, context, and anti-example.",
    learnerFacingGate: true,
    boundaryNote: "Pattern names classify observations; they do not provide decisions.",
  },
];

module.exports = {
  distillationRules,
};
