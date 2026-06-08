(function attachTrainingFlowState(global) {
  const steps = [
    {
      key: "read",
      label: "先读图",
      text: "只看结构、前高、失效位和隐藏未来。",
      target: "#multiTimeframePanel",
    },
    {
      key: "choose",
      label: "再选择",
      text: "选择不是买卖建议，只是课堂判断。",
      target: "#multiTimeframePanel",
    },
    {
      key: "write",
      label: "写证据",
      text: "按“看到什么→怎么判断→哪里认错→不做什么”写。",
      target: "#decisionArea",
    },
    {
      key: "review",
      label: "看错因",
      text: "提交后只看最大问题和下一步练习。",
      target: "#feedbackPanel",
    },
  ];

  const summaries = {
    read: "先别急着选答案，先把图看懂。",
    choose: "已经读图，下一步只做课堂判断。",
    write: "已经选择了，现在把理由写成可复盘证据。",
    submit: "补齐证据后提交，AI 只评价学习过程。",
    review: "看这次最大问题，然后去回放同一题。",
  };

  function stageFrom({ feedbackVisible = false, selected = null, plan = "" } = {}) {
    const hasSelection = selected !== null && selected !== undefined;
    const hasPlan = String(plan || "").trim().length > 0;
    const key = feedbackVisible ? "review" : hasSelection && hasPlan ? "submit" : hasSelection ? "write" : "read";
    const activeIndex = key === "read" ? 0 : key === "write" || key === "submit" ? 2 : key === "review" ? 3 : 1;
    return {
      key,
      activeIndex,
      summary: summaries[key] || summaries.read,
      steps,
      educationOnly: true,
      productionReady: false,
    };
  }

  global.TradeGymTrainingFlow = {
    steps,
    stageFrom,
  };
})(window);
