const { knowledgeBrowserIndex } = require("./education-knowledge-browser-index");
const { corpusChunks, corpusDocuments } = require("./education-corpus-index");
const { glossaryByDomain } = require("./education-bilingual-glossary");
const { lessonOverrides } = require("./education-lesson-overrides");

// Module -> bilingual-glossary domain, so each Chinese lesson surfaces the
// English source terms it bridges. Bilingual key terms turn an English-sourced
// evidence base into something a Chinese learner can actually navigate.
const moduleToGlossaryDomain = {
  图表阅读基础: "chart_price_action",
  市场结构: "chart_price_action",
  "K线与价格行为": "chart_price_action",
  趋势: "chart_price_action",
  突破: "chart_price_action",
  交易区间: "chart_price_action",
  反转: "chart_price_action",
  多周期分析: "indicator_pattern_taxonomy",
  "新闻/情绪/事件偏见": "news_sentiment_events",
  回测误区: "backtesting_research_hygiene",
  风险管理: "risk_portfolio",
  交易心理: "psychology_behavior",
};

function bilingualKeyTermsFor(node, index) {
  const domain = moduleToGlossaryDomain[node.module] || "chart_price_action";
  const pool = glossaryByDomain[domain] || [];
  if (!pool.length) return [];
  // Rotate a 3-term window so same-module lessons don't all show identical terms.
  return [0, 1, 2].map((offset) => pool[(index + offset) % pool.length]).map((entry) => ({
    en: entry.en,
    zh: entry.zh,
    aliases: entry.aliases || [],
    gloss: entry.gloss,
    domain: entry.domain,
    note: "双语术语桥：中文释义为原创教育表达，用于对照英文来源，不含买卖建议。",
  }));
}

// Source provenance map: lets a lesson name the authoritative work behind each
// evidence chunk (title, license tier, year). Names are facts/citations, not
// copied content, so they are safe to surface to learners as further reading.
const corpusDocById = new Map(corpusDocuments.map((doc) => [doc.id, doc]));

const TIER_LABEL = {
  public_domain: "公有领域",
  open_access: "开放获取",
  share_alike: "CC BY-SA 署名",
};

function cleanSourceName(name) {
  return String(name || "").replace(/\s+/g, " ").trim().slice(0, 90);
}

// Build a learner-facing "权威延伸阅读" list from evidence refs: cite the source
// by name + provenance, with an original one-line framing of why it is relevant.
// Never copies source prose; open-access stays citation-only, public-domain and
// CC BY-SA may carry a short reviewer excerpt downstream (handled in retrieval).
function authorityBackedReadingFor(refs, topic) {
  const seen = new Set();
  const out = [];
  for (const ref of refs) {
    const doc = corpusDocById.get(ref.documentId);
    if (!doc || seen.has(doc.sourceId)) continue;
    seen.add(doc.sourceId);
    out.push({
      sourceName: cleanSourceName(doc.name),
      sourceUrl: doc.url,
      licenseTier: doc.tier,
      licenseLabel: TIER_LABEL[doc.tier] || doc.tier,
      provenance: doc.publicationYear ? `${doc.publicationYear} 年文献` : (doc.tier === "open_access" ? "学术论文" : "公开资料"),
      relevanceFraming: `可对照阅读「${topic}」在该来源中的原始论述，用于加深理解，课程讲解仍为原创表达。`,
      citationOnly: doc.tier === "open_access",
    });
  }
  return out.slice(0, 3);
}

// Corpus evidence wiring: lessons reference license-cleared research chunks by id.
// Only references travel with the lesson; chunk text stays in the research layer.
const moduleToChunkCategory = {
  图表阅读基础: "chart_reading",
  市场结构: "chart_reading",
  "K线与价格行为": "chart_reading",
  趋势: "chart_reading",
  突破: "breakout",
  交易区间: "breakout",
  反转: "chart_reading",
  多周期分析: "indicator_taxonomy",
  "新闻/情绪/事件偏见": "news_sentiment",
  回测误区: "backtest",
  风险管理: "psychology_risk",
  交易心理: "psychology_risk",
};

const chunksByCategory = new Map();
for (const chunk of corpusChunks) {
  for (const category of chunk.conceptCategoryCandidates) {
    if (!chunksByCategory.has(category)) chunksByCategory.set(category, []);
    chunksByCategory.get(category).push(chunk);
  }
}
const fallbackChunks = corpusChunks.filter((chunk) => chunk.domains.length > 0);

const { searchChunks, queryTermsForNode } = require("./education-corpus-retrieval");

const EVIDENCE_USE_NOTE = "Internal research evidence for reviewers and AI explanation grounding. Lesson wording stays original; this chunk text is not republished to learners.";

// Canonical module -> coverage domain map; the self-audit grades evidence by
// this alignment, so retrieval boosts the same domain to keep refs on-topic.
const moduleToEvidenceDomain = {
  图表阅读基础: "chart_price_action",
  市场结构: "chart_price_action",
  "K线与价格行为": "chart_price_action",
  趋势: "chart_price_action",
  突破: "chart_price_action",
  交易区间: "chart_price_action",
  反转: "chart_price_action",
  多周期分析: "indicator_pattern_taxonomy",
  "新闻/情绪/事件偏见": "news_sentiment_events",
  回测误区: "backtesting_research_hygiene",
  风险管理: "risk_portfolio",
  交易心理: "psychology_behavior",
};

function corpusEvidenceRefsFor(node, index) {
  const category = moduleToChunkCategory[node.module];
  const domain = moduleToEvidenceDomain[node.module];
  // Relevance retrieval first: query by the node's matched concept terms,
  // boosted toward the module's coverage domain.
  const retrieved = searchChunks(`${queryTermsForNode(node)} ${node.topic}`, { category, domain, limit: 3 });
  if (retrieved.length >= 3) {
    return retrieved.map((hit) => ({
      chunkId: hit.chunkId,
      documentId: hit.documentId,
      sourceUrl: hit.url,
      licenseTier: hit.tier,
      domains: hit.domains,
      charCount: hit.charCount,
      relevanceScore: hit.score,
      matchType: "relevance_retrieval",
      evidenceUse: EVIDENCE_USE_NOTE,
    }));
  }
  // Rotation fallback keeps every lesson grounded even when retrieval is thin.
  const pool = (chunksByCategory.get(category) || []);
  const usable = pool.length >= 3 ? pool : fallbackChunks;
  if (!usable.length) return retrieved;
  const rotated = [0, 1, 2].map((offset) => usable[(index * 3 + offset) % usable.length]).map((chunk) => ({
    chunkId: chunk.id,
    documentId: chunk.documentId,
    sourceUrl: chunk.url,
    licenseTier: chunk.tier,
    domains: chunk.domains,
    charCount: chunk.charCount,
    matchType: "category_rotation",
    evidenceUse: EVIDENCE_USE_NOTE,
  }));
  const seen = new Set(retrieved.map((hit) => hit.chunkId));
  return [...retrieved.map((hit) => ({
    chunkId: hit.chunkId,
    documentId: hit.documentId,
    sourceUrl: hit.url,
    licenseTier: hit.tier,
    domains: hit.domains,
    charCount: hit.charCount,
    relevanceScore: hit.score,
    matchType: "relevance_retrieval",
    evidenceUse: EVIDENCE_USE_NOTE,
  })), ...rotated.filter((ref) => !seen.has(ref.chunkId))].slice(0, 3);
}

const lessonFrames = [
  "Start with the slowest timeframe and ask what the learner can actually see.",
  "Treat the setup as a reading exercise: evidence first, interpretation second.",
  "Make the learner separate structure, timing, and story before writing a conclusion.",
  "Use the lesson to slow down pattern naming and make context explicit.",
  "Frame the chart as a case review, not as a prediction task.",
];

function teacherScriptFor(node, authorityNames, index) {
  const frame = lessonFrames[index % lessonFrames.length];
  return [
    `${frame} For ${node.topic}, the first move is to describe the visible context without attaching a result to it.`,
    `Then compare the learner's observation with the multi-timeframe view. The point is to notice where the local detail agrees or conflicts with the larger background.`,
    `Close by naming a mistake the learner could make here. Use ${authorityNames.join(" and ") || "the reviewed source context"} only as taxonomy and boundary support, not as copied course text.`,
  ];
}

function caseDiscussionPromptFor(node) {
  return `If a learner sees ${node.topic} in a replay case, ask them to write what is visible, what is uncertain, and what would make the reading invalid. Do not ask them what to buy or sell.`;
}

const introHooks = [
  (topic) => `你大概率遇到过这种情况：图刚翻开，「${topic}」四个字还没想完，结论已经先冒出来了。`,
  (topic) => `很多学习者复盘时卡在同一个地方：能认出「${topic}」，但说不清自己是怎么认出来的。`,
  (topic) => `想象你在回放一段历史行情，走到一半暂停：眼前这个画面算不算「${topic}」？多数人答得很快，答对的不多。`,
  (topic) => `「${topic}」是那种听起来简单、写复盘时却最容易写成套话的主题。`,
  (topic) => `如果让你只用图表事实（不带任何预判）描述一次「${topic}」，你能写出几句？这节课就练这个。`,
  (topic) => `复盘笔记里写「这里出现了${topic}」很容易，难的是写清楚证据链条——这恰恰是这节课的重点。`,
];

function plainLanguageIntroFor(node, index) {
  const hook = introHooks[index % introHooks.length](node.topic);
  return `${hook}这一节（${node.title}，难度：${node.difficulty}）先把概念讲透：「${node.topic}」在${node.module}里到底解决什么观察问题、初学者最常在哪一步出错。我们先读讲解、看反例，最后才进入练习，不着急做题。`;
}

function aiReviewPromptsFor(node) {
  return [
    "学习者是否先描述图表证据、后给出解释？两类语句是否能逐句区分？",
    "学习者是否按D1、H4、H1、M15的顺序分别写了独立内容，而不是一句话套四个周期？",
    `学习者是否写出了这次「${node.topic}」解读的失效条件？缺失即提示补写。`,
    "学习者是否至少列出一条反向证据或不确定性？是否把形态、新闻或回测数字写成了确定性依据？",
    "全文是否出现操作指令式语句（应当没有）？若出现，请指出原句并要求改写为观察语言。",
  ];
}

function buildLesson(node, index) {
  const authorityNames = node.authorityContextRefs.map((ref) => ref.name).slice(0, 2);
  const directConcepts = node.reviewedSourceRefs.flatMap((ref) => ref.matchedConcepts || []).slice(0, 4);
  const teacherScript = teacherScriptFor(node, authorityNames, index);
  const corpusEvidenceRefs = corpusEvidenceRefsFor(node, index);
  return {
    id: `lesson_${node.id}`,
    nodeId: node.id,
    module: node.module,
    topic: node.topic,
    title: node.title,
    sequence: index + 1,
    educationOnly: true,
    productionReady: false,
    learningGoal: `Explain ${node.topic} as an observation skill, not as an action rule.`,
    plainLanguageIntro: plainLanguageIntroFor(node, index),
    teacherScript,
    conceptExplanation: node.definition,
    principleExplanation: node.principle,
    observationChecklist: [
      "Name the higher-timeframe background before discussing local detail.",
      "Separate visible structure from story or emotion.",
      "Describe uncertainty and conflicting evidence explicitly.",
      "State what the chart does not prove.",
    ],
    multiTimeframeWalkthrough: node.multiTimeframeView,
    commonMistakes: node.commonMistakes,
    antiExamples: node.antiExamples,
    practicePrompt: node.practicePrompt,
    caseDiscussionPrompt: caseDiscussionPromptFor(node),
    aiReviewPrompts: aiReviewPromptsFor(node),
    rubricDraft: node.rubricDraft,
    corpusEvidenceRefs,
    authorityBackedReading: authorityBackedReadingFor(corpusEvidenceRefs, node.topic),
    bilingualKeyTerms: bilingualKeyTermsFor(node, index),
    sourceEvidence: {
      reviewedSourceRefCount: node.reviewedSourceRefs.length,
      authorityContextRefCount: node.authorityContextRefs.length,
      corpusEvidenceRefCount: corpusEvidenceRefs.length,
      authorityBackedReadingCount: authorityBackedReadingFor(corpusEvidenceRefs, node.topic).length,
      matchedConceptCount: directConcepts.length,
      authorityContextNames: authorityNames,
      sourceUseBoundary: "Sources support taxonomy, context, and boundary review only. Lesson wording is original and education-only.",
    },
    learnerBoundary: "This lesson is for chart-reading education and review practice only. It does not recommend securities, provide live signals, promise results, connect brokers, automate orders, or guide real funds.",
    closingReviewPrompt: `After finishing ${node.topic}, ask the learner to rewrite one sentence that sounded too certain and replace it with observable evidence.`,
    reviewStatus: "curriculum_draft",
  };
}

// Hand-authored overrides upgrade template prose to commercial-grade writing
// per lesson, while structure/evidence/boundary fields stay generated.
const knowledgeLessons = knowledgeBrowserIndex.learnerFacingNodes.map((node, index) => {
  const lesson = buildLesson(node, index);
  const override = lessonOverrides[node.id];
  if (!override) return lesson;
  const { handAuthoredNote, ...fields } = override;
  return { ...lesson, ...fields, handAuthored: true, handAuthoredNote };
});

const knowledgeLessonReport = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  lessons: knowledgeLessons.length,
  modules: [...new Set(knowledgeLessons.map((lesson) => lesson.module))].length,
  lessonsWithReviewedSources: knowledgeLessons.filter((lesson) => lesson.sourceEvidence.reviewedSourceRefCount > 0).length,
  lessonsWithAuthorityContext: knowledgeLessons.filter((lesson) => lesson.sourceEvidence.authorityContextRefCount > 0).length,
  lessonsWithCorpusEvidence: knowledgeLessons.filter((lesson) => lesson.sourceEvidence.corpusEvidenceRefCount > 0).length,
  lessonsWithAuthorityReading: knowledgeLessons.filter((lesson) => (lesson.authorityBackedReading || []).length > 0).length,
  lessonsWithBilingualTerms: knowledgeLessons.filter((lesson) => (lesson.bilingualKeyTerms || []).length >= 3).length,
  lessonsHandAuthored: knowledgeLessons.filter((lesson) => lesson.handAuthored === true).length,
  uniquePlainLanguageIntros: new Set(knowledgeLessons.map((lesson) => lesson.plainLanguageIntro)).size,
  boundary: "Lesson drafts are original education scaffolds. They are not expert-final course copy and not trading guidance.",
};

module.exports = {
  knowledgeLessons,
  knowledgeLessonReport,
};
