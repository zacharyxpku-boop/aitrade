const backtestCategories = ["data_bias", "sample_bias", "cost_model", "metric_misuse", "regime_risk", "workflow_error", "psychology"];
const labels = [
  "future leakage", "look ahead bias", "survivorship bias", "small sample", "cherry picking", "overfitting",
  "curve fitting", "ignored slippage", "ignored spread", "ignored fees", "metric worship", "drawdown blindness",
  "expectancy misuse", "profit factor misuse", "sharpe misuse", "out of sample missing", "walk forward missing",
  "regime shift ignored", "event context missing", "manual cleanup bias",
];

const backtestMistakeCandidates = Array.from({ length: 1000 }, (_, index) => {
  const label = labels[index % labels.length];
  const category = backtestCategories[index % backtestCategories.length];
  return {
    id: `btm_${String(index + 1).padStart(3, "0")}`,
    label: `${label} ${Math.floor(index / labels.length) + 1}`,
    category,
    description: `This candidate flags ${label} as an education review issue in backtest interpretation.`,
    whyItMatters: "Learners must know that research metrics are diagnostics, not proof of future outcomes.",
    learnerMisuse: "A learner may treat a backtest number as certainty instead of reviewing assumptions and data boundaries.",
    boundaryNote: "Backtest mistake candidates are for education diagnostics only and cannot support performance promises.",
  };
});

module.exports = {
  backtestMistakeCandidates,
};
