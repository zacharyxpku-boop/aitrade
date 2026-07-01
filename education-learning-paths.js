const { knowledgeNodes, domains } = require("./education-knowledge-taxonomy");

const learningPathEdges = [];

for (const domain of domains) {
  const nodes = knowledgeNodes.filter((item) => item.module === domain.label);
  for (let index = 0; index < nodes.length - 1; index += 1) {
    learningPathEdges.push({
      id: `edge_${nodes[index].id}_${nodes[index + 1].id}`,
      fromNodeId: nodes[index].id,
      toNodeId: nodes[index + 1].id,
      relation: "next_in_module",
      learnerReason: "同一课程域内由基础观察推进到更复杂情境。",
      boundaryNote: "学习路径只推荐下一课，不推荐真实交易动作。",
    });
  }
}

knowledgeNodes.forEach((node, index) => {
  const cross = knowledgeNodes[(index + 8) % knowledgeNodes.length];
  const review = knowledgeNodes[(index + 16) % knowledgeNodes.length];
  learningPathEdges.push({
    id: `edge_cross_${node.id}_${cross.id}`,
    fromNodeId: node.id,
    toNodeId: cross.id,
    relation: "cross_module_support",
    learnerReason: "跨模块补充结构、周期、情绪或复盘角度。",
    boundaryNote: "跨模块推荐只服务教育复盘，不形成实盘判断。",
  });
  learningPathEdges.push({
    id: `edge_review_${node.id}_${review.id}`,
    fromNodeId: node.id,
    toNodeId: review.id,
    relation: "review_after_mistake",
    learnerReason: "当对应错因反复出现时，回到这个节点复盘。",
    boundaryNote: "错因复盘只定位学习问题，不评价策略表现。",
  });
});

module.exports = {
  learningPathEdges,
};
