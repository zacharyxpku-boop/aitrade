(function attachTrialFlowState(global) {
  const steps = [
    { key: "intro", view: "dashboard", label: "导入", hint: "知道这是教育训练，不是荐股或实盘。" },
    { key: "read_chart", view: "trainer", label: "读图", hint: "先看多周期、前高、区间和失效位。" },
    { key: "answer", view: "trainer", label: "作答", hint: "按格式写：看到什么、怎么判断、错在哪里认错、不做什么。" },
    { key: "review", view: "coach", label: "复盘", hint: "看 AI 指出具体错因，不看涨跌输赢。" },
    { key: "replay", view: "replay", label: "回放", hint: "只看当时可见信息，遮住未来。" },
    { key: "misconception", view: "replay", label: "误区", hint: "用人话理解样本、做对比例和过拟合。" },
    { key: "feedback", view: "community", label: "反馈", hint: "反馈学习流程是否清楚、有帮助。" },
  ];

  function stateFrom({ view = "dashboard", attempts = [], replayNotes = [], paperTrades = [] } = {}) {
    const hasTraining = attempts.some((item) => item.type === "training");
    const hasReplay = replayNotes.length > 0;
    const hasPaperTrade = paperTrades.length > 0;
    const hasBacktestDrill = attempts.some((item) => item.type === "backtest_misconception");
    const currentIndexByProgress = hasBacktestDrill ? 6 : hasPaperTrade ? 5 : hasReplay ? 4 : hasTraining ? 3 : view === "trainer" ? 1 : 0;
    const viewIndex = steps.findIndex((step) => step.view === view);
    const currentIndex = Math.max(currentIndexByProgress, viewIndex);
    return {
      steps,
      currentIndex: Math.max(0, currentIndex),
      completedKeys: new Set([
        "intro",
        hasTraining ? "read_chart" : null,
        hasTraining ? "answer" : null,
        hasTraining ? "review" : null,
        hasReplay ? "replay" : null,
        hasBacktestDrill ? "misconception" : null,
      ].filter(Boolean)),
      evidence: {
        hasTraining,
        hasReplay,
        hasPaperTrade,
        hasBacktestDrill,
      },
      educationOnly: true,
      productionReady: false,
    };
  }

  global.TradeGymTrialFlow = {
    steps,
    stateFrom,
  };
})(window);
