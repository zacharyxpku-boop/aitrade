const { learningModules, conceptClusters } = require("./education-concept-clusters");
const { distillationCandidates } = require("./education-distillation-candidates");
const { patternTaxonomy } = require("./education-pattern-taxonomy");
const { mistakeTags } = require("./education-mistake-tags");
const { rubrics } = require("./education-rubrics");
const { trainingScenarios } = require("./education-training-scenarios");
const { conceptCandidates } = require("./education-concept-candidates");
const { sourceReviews } = require("./education-source-harvest-engine");

const conceptById = new Map(conceptCandidates.map((concept) => [concept.id, concept]));
const reviewBySourceId = new Map(sourceReviews.map((review) => [review.sourceId, review]));

function hasReviewedLearnerFacingSource(candidate) {
  return (candidate.conceptCandidateIds || []).some((conceptId) => {
    const concept = conceptById.get(conceptId);
    const review = concept ? reviewBySourceId.get(concept.sourceId) : null;
    return Boolean(review && review.allowedForLearnerFacing);
  });
}

const moduleAngles = {
  图表阅读基础: "把图表当作行为记录，先描述事实，再解释结构。",
  市场结构: "用高低点、关键区域和价格接受/拒绝建立观察框架。",
  "K线与价格行为": "把K线形态放回位置、结构和多周期背景中理解。",
  趋势: "区分趋势延续、回调、加速和衰竭，不把局部波动当全局结论。",
  突破: "把突破理解为市场是否接受新价格区域，而不是穿过一条线。",
  交易区间: "先识别区间边界和中部噪音，再讨论局部动作。",
  反转: "反转需要结构证据链，不是一根K线或一个标题。",
  多周期分析: "按D1、H4、H1、M15顺序建立上下文，避免小周期先入为主。",
  "新闻/情绪/事件偏见": "新闻情绪只做背景和偏见检查，不替代图表证据。",
  回测误区: "把回测当作研究卫生检查，不当作未来结果证明。",
  风险管理: "训练失效条件、不行动条件和可复盘计划，而不是动作指令。",
  交易心理: "识别害怕错过、确认偏误和结果导向对学习判断的干扰。",
};

const moduleWhy = {
  图表阅读基础: "因为价格图记录的是已发生的成交行为，先把事实读对，后面的解释才有根。",
  市场结构: "因为高低点和关键区域决定了任何局部信号所处的语境，语境错了细节再准也没用。",
  "K线与价格行为": "因为同一根K线在不同位置含义完全不同，离开位置谈形态等于离开句子谈单词。",
  趋势: "因为趋势判断错位是初学者最大的系统性误差来源，把回调当反转、把衰竭当延续都源于此。",
  突破: "因为假突破和有效突破在突破瞬间看起来一样，区别只能从随后的价格接受程度里读出来。",
  交易区间: "因为区间中部的波动多数是噪音，不先画清边界就复盘等于在噪音里找规律。",
  反转: "因为反转是低频事件，把高频的回调误判为反转会系统性扭曲复盘结论。",
  多周期分析: "因为小周期永远能找到支持任何观点的细节，先定大周期才能防止视角被局部牵着走。",
  "新闻/情绪/事件偏见": "因为新闻和情绪到达你眼前时往往已被价格部分消化，时间差本身就是偏差源。",
  回测误区: "因为回测里的前视偏差、幸存者偏差和过拟合会让错误方法看起来有效，识别它们是研究的卫生底线。",
  风险管理: "因为失效条件写不清楚，复盘时就无法区分『判断错了』和『运气不好』，学习闭环会断掉。",
  交易心理: "因为确认偏误和结果导向会在复盘阶段悄悄改写记忆，不主动设防就学不到真东西。",
};

const tfTaskVariants = {
  D1: [
    (topic) => `先用一句话写下日线主结构（趋势段、区间还是转换期），再标出与「${topic}」最相关的关键价格区域在哪。`,
    (topic) => `统计最近20根日线的高低点推进方向，判断「${topic}」出现的大背景是顺势还是逆势。`,
    (topic) => `在日线上找出最近一次结构破坏的位置，写明它对「${topic}」的解读构成支持还是约束。`,
  ],
  H4: [
    (topic) => `在H4上定位「${topic}」相对日线关键区域的位置：是在区域内部、边缘测试，还是已经离开。`,
    (topic) => `用H4检查当前波段的推进质量：每段推进的幅度和回撤深度，是否与「${topic}」的判断一致。`,
    (topic) => `在H4标出最近的两个摆动高点和两个摆动低点，确认「${topic}」所处的波段阶段。`,
  ],
  H1: [
    (topic) => `观察H1的节奏变化：成交活跃区间在收窄还是放宽，价格对关键位是接受还是拒绝，与「${topic}」预期是否冲突。`,
    (topic) => `在H1上找一处与「${topic}」判断相矛盾的证据，如果找不到，写明你检查过哪些位置。`,
    (topic) => `记录H1最近一次测试关键位的反应速度和回落深度，作为「${topic}」证据链的中间层。`,
  ],
  M15: [
    (topic) => `M15只用来补充局部触发细节：写下你看到的最小级别行为，并注明它不能单独支撑「${topic}」结论。`,
    (topic) => `在M15找出最近一段波动里最容易被过度解读的一根K线，说明为什么它在高周期语境下不重要。`,
    (topic) => `用M15验证高周期判断的时间一致性：局部行为与H1/H4方向冲突时，先记录冲突而不是改结论。`,
  ],
};

function multiTimeframeViewFor(topic, index) {
  // Mixed-radix rotation: combination period is 81, which together with the
  // topic cycle keeps timeframe task sets unique across all learner-facing nodes.
  return {
    D1: tfTaskVariants.D1[index % 3](topic),
    H4: tfTaskVariants.H4[Math.floor(index / 3) % 3](topic),
    H1: tfTaskVariants.H1[Math.floor(index / 9) % 3](topic),
    M15: tfTaskVariants.M15[Math.floor(index / 27) % 3](topic),
  };
}

const antiExampleVariants = [
  (topic, pattern) => `反例：学习者在M15看到一根长影线就写下「${topic}已确认」，没有回看H4位置。错在：单根K线的证据等级不足以支撑结构级结论，且复盘里没有写失效条件，事后无法检验。`,
  (topic, pattern) => `反例：复盘里写「出现${pattern}，所以后市大概率会延续」。错在：把分类标签当成了因果机制，又没有列出任何一条反向证据，这条复盘无法被证伪。`,
  (topic, pattern) => `反例：学习者用一次成功的「${topic}」案例总结出固定规则，下次直接套用。错在：样本量为1，没有区分结构必然与运气成分，也没检查两次案例的背景是否可比。`,
  (topic, pattern) => `反例：看到新闻标题与「${topic}」方向一致，就把判断信心从五成改成九成。错在：新闻到达时价格往往已部分消化信息，且没有评估这条新闻是否本来就是从价格反推出来的解读。`,
  (topic, pattern) => `反例：回测里「${topic}」相关规则收益很好，于是直接当作有效结论写进笔记。错在：没有检查前视偏差和参数过拟合，把研究卫生问题误认为方法优势。`,
];

function antiExamplesFor(topic, patternName, index) {
  const first = antiExampleVariants[index % antiExampleVariants.length](topic, patternName);
  const second = antiExampleVariants[(index + 2) % antiExampleVariants.length](topic, patternName);
  return [first, second, "反例：复盘只记录看对的案例，看错的直接跳过。错在：复盘样本被结果筛选过，确认偏误会让任何方法看起来都在变准。"];
}

function commonMistakesFor(topic, patternName, mistakeA, mistakeB) {
  return [
    `把「${patternName}」当成完整分析直接下结论，跳过了结构定位这一步；标签只是开始观察的入口，不是观察的终点。`,
    `${mistakeA.label}：在「${topic}」的场景里，常见表现是盯着M15局部变化反复修改判断，却没回头核对D1/H4背景有没有变。`,
    `${mistakeB.label}：复盘时只挑印证自己观点的片段记录，导致一次巧合被写成了普适规律。`,
    "引用新闻、情绪或回测数字时不标注不确定性和数据边界，把背景参考当成了证据本体。",
  ];
}

function rubricDraftFor(topic) {
  return [
    "是否按D1→H4→H1→M15的顺序描述观察，且每个周期都有独立内容（顺序与覆盖均可逐项核对）。",
    `是否明确写出了「${topic}」这次解读的失效条件（缺失该句即判不通过）。`,
    "是否至少列出一条反向证据或不确定性，并说明它为什么不足以推翻当前解读（条数可数）。",
    "是否全文没有出现买卖、加减仓、止盈止损等操作指令式语句（可用关键词扫描判定）。",
    "是否区分了「图表事实」与「个人解释」两类语句（每类至少一句，可标注核对）。",
  ];
}

function qualityScore(node) {
  const filled = [
    node.definition,
    node.principle,
    node.whyItMatters,
    node.howToRead,
    node.multiTimeframeView,
    node.commonMistakes,
    node.antiExamples,
    node.practicePrompt,
    node.rubricDraft,
    node.sourceBoundary,
    node.licenseBoundary,
    node.boundaryNote,
  ].filter((value) => Array.isArray(value) ? value.length : value && Object.keys(value).length).length;
  return Math.min(100, 55 + filled * 4);
}

const knowledgeNodeTarget = 1500;
const learnerFacingTarget = 360;
let learnerFacingIssued = 0;

const knowledgeNodesV2 = Array.from({ length: knowledgeNodeTarget }, (_, index) => {
  const cluster = conceptClusters[index % conceptClusters.length];
  const candidate = distillationCandidates[index % distillationCandidates.length];
  const module = learningModules[index % learningModules.length];
  const pattern = patternTaxonomy[index % patternTaxonomy.length];
  const mistakeA = mistakeTags[index % mistakeTags.length];
  const mistakeB = mistakeTags[(index + 11) % mistakeTags.length];
  const rubric = rubrics[index % rubrics.length];
  const scenario = trainingScenarios[index % trainingScenarios.length];
  const originalLearnerNode = hasReviewedLearnerFacingSource(candidate) && learnerFacingIssued < learnerFacingTarget;
  if (originalLearnerNode) learnerFacingIssued += 1;
  const reviewStatus = originalLearnerNode ? "reviewed" : "draft";
  const item = {
    id: `knv2_${String(index + 1).padStart(4, "0")}`,
    title: `${module}：${cluster.topic} 教学节点 ${Math.floor(index / learningModules.length) + 1}`,
    module,
    topic: cluster.topic,
    difficulty: index % 3 === 0 ? "starter" : index % 3 === 1 ? "builder" : "advanced",
    difficultyStage: index % 4 === 0 ? "入门" : index % 4 === 1 ? "进阶" : index % 4 === 2 ? "专题" : "综合案例",
    sourceClusterIds: [cluster.id],
    conceptCandidateIds: candidate.conceptCandidateIds,
    patternTaxonomyIds: [pattern.id],
    trainingScenarioDraftIds: [scenario.id],
    definition: `「${cluster.topic}」是${module}里的一个可训练观察单元，说的是：当这个现象出现时，图表上能被直接看到的事实有哪些、它通常出现在什么位置。这一节不要求你预测任何走势，只要求你练习把「看到了什么」「它在哪里」「哪些还不确定」三件事分开说清楚。`,
    principle: `${moduleAngles[module]}${moduleWhy[module] || ""}`,
    whyItMatters: `如果不理解“${cluster.topic}”，学习者容易把标签、新闻、指标或局部波动当成完整依据。`,
    howToRead: `先用一句话描述D1背景，再写H4结构位置，接着看H1节奏，最后只用M15补充局部细节。`,
    multiTimeframeView: multiTimeframeViewFor(cluster.topic, index),
    commonMistakes: commonMistakesFor(cluster.topic, pattern.name, mistakeA, mistakeB),
    antiExamples: antiExamplesFor(cluster.topic, pattern.name, index),
    practicePrompt: `请用四步写下“${cluster.topic}”的学习复盘：D1背景、H4结构、H1节奏、M15细节，并指出一个你可能犯的错。`,
    rubricDraft: rubricDraftFor(cluster.topic),
    mistakeTagIds: [mistakeA.id, mistakeB.id],
    rubricIds: [rubric.id],
    nextNodeIds: [`knv2_${String(((index + 1) % knowledgeNodeTarget) + 1).padStart(4, "0")}`],
    prerequisiteNodeIds: [`knv2_${String(((index + knowledgeNodeTarget - 1) % knowledgeNodeTarget) + 1).padStart(4, "0")}`],
    sourceBoundary: originalLearnerNode
      ? "Original TradeGym education expression generated from low-risk taxonomy cues; no external text copied."
      : "Draft distilled from candidate taxonomy; requires human source and pedagogy review before learner-facing use.",
    licenseBoundary: originalLearnerNode
      ? "original_expression_allowed_after_review"
      : "draft_only_until_source_license_terms_review",
    learnerFacingAllowed: originalLearnerNode,
    reviewStatus,
    boundaryNote: "This node teaches chart reading and learning review only; it does not provide action guidance, performance proof, broker workflow, or real-funds instruction.",
  };
  return {
    ...item,
    qualityScore: qualityScore(item),
  };
});

module.exports = {
  knowledgeNodesV2,
};
