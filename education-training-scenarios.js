const { knowledgeNodes } = require("./education-knowledge-taxonomy");
const { marketCases } = require("./education-market-cases");
const { rubrics } = require("./education-rubrics");
const { scenarioQualityScore } = require("./education-knowledge-quality");

function caseForNode(node) {
  return marketCases.find((item) => item.id === node.relatedCaseIds[0]) || marketCases[0];
}

const trainingScenarios = knowledgeNodes.map((node, index) => {
  const marketCase = caseForNode(node);
  const rubric = rubrics.find((item) => item.id === node.rubricIds[0]) || rubrics[0];
  const item = {
    id: `scenario_${String(index + 1).padStart(3, "0")}`,
    title: `轻训练 ${index + 1}: ${node.title}`,
    knowledgeNodeId: node.id,
    marketCaseId: marketCase.id,
    question: `阅读“${marketCase.title}”后，学习者应该如何解释“${node.topic}”？`,
    choices: [
      "先写D1/H4/H1/M15的观察顺序，再说明不确定性和常见误区。",
      "只根据M15局部K线给出结论。",
      "只根据新闻标题解释全部价格变化。",
      "把一次demo样本总结成固定规则。",
    ],
    shortAnswerPrompt: "用两三句话说明：先看什么、为什么看、容易错在哪里、下一次只改一件什么事。",
    expectedObservation: `学习者应说明${node.topic}需要结合价格位置、多周期结构、背景材料和反例来读，不能直接变成行动结论。`,
    coachRubric: rubric.criteria,
    mistakeTagIds: node.mistakeTagIds,
    nextPracticeSuggestion: node.nextNodeIds.length
      ? `下一步学习：${node.nextNodeIds[0]}，继续用同一张检查表复盘。`
      : "下一步回到本模块第一节点，做一轮综合复盘。",
    boundaryNote: "训练题只批改图表阅读和学习过程，不输出荐股、即时交易提示、收益承诺或资金操作指导。",
    reviewStatus: "draft",
  };
  return {
    ...item,
    qualityScore: scenarioQualityScore(item),
  };
});

module.exports = {
  trainingScenarios,
};
