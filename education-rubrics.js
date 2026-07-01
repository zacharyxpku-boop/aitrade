const rubricFocuses = [
  "structure_first",
  "multi_timeframe_order",
  "location_before_pattern",
  "breakout_validation",
  "range_context",
  "reversal_vs_pullback",
  "news_as_background",
  "backtest_hygiene",
];

const rubrics = Array.from({ length: 80 }, (_, index) => {
  const focus = rubricFocuses[index % rubricFocuses.length];
  return {
    id: `rubric_${String(index + 1).padStart(3, "0")}`,
    title: `教育批改标准 ${index + 1}: ${focus}`,
    focus,
    criteria: [
      "是否先描述D1/H4/H1/M15的阅读顺序，而不是先下结论。",
      "是否说明价格所在位置、结构背景和可观察证据。",
      "是否指出常见错因，并把新闻/情绪当作背景和偏见检查。",
      "是否写出下一次只改一件事，且不包含实盘动作。",
    ],
    passSignal: "学习者能用结构、周期、背景和错因解释自己的判断过程。",
    failSignal: "学习者直接跳到行动结论，或把单一形态、新闻标题、一次样本当依据。",
    coachInstruction: "只批改学习过程；不得给出交易方向、收益预期、即时交易提示或资金操作指令。",
    boundaryNote: "Rubric 只用于教育批改，不评价策略收益，也不输出真实交易建议。",
  };
});

module.exports = {
  rubrics,
};
