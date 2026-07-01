import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { knowledgeLessons } = require("../education-knowledge-lessons.js");

// Knowledge-base self-audit with pass rates.
// Unlike the binary red-line checks, this grades every lesson 0-100 across five
// dimensions and reports commercial-pass / draft-pass / fail rates per module.
// It is a quality instrument for the team, not approval, certification,
// production readiness, or trading guidance.

const FORBIDDEN = /推荐买入|推荐卖出|保证收益|胜率承诺|实盘信号|自动下单|接入券商|真实资金建议/;

function scoreLesson(lesson) {
  const detail = {};

  // 1) Content depth (0-25): hand-authored prose beats template prose.
  let depth = 0;
  if (lesson.handAuthored) depth = 25;
  else {
    if ((lesson.plainLanguageIntro || "").length >= 90) depth += 6;
    if ((lesson.conceptExplanation || "").length >= 100) depth += 5;
    if ((lesson.antiExamples || []).every((x) => x.length >= 50)) depth += 4;
    depth += 3; // structural completeness is enforced upstream
  }
  detail.contentDepth = Math.min(25, depth);

  // 2) Evidence relevance (0-25): relevance-retrieved refs whose domains match.
  const refs = lesson.corpusEvidenceRefs || [];
  let evidence = 0;
  if (refs.length >= 3) evidence += 8;
  if (refs.every((ref) => ref.matchType === "relevance_retrieval")) evidence += 9;
  const moduleDomain = {
    图表阅读基础: "chart_price_action", 市场结构: "chart_price_action", "K线与价格行为": "chart_price_action",
    趋势: "chart_price_action", 突破: "chart_price_action", 交易区间: "chart_price_action", 反转: "chart_price_action",
    多周期分析: "indicator_pattern_taxonomy", "新闻/情绪/事件偏见": "news_sentiment_events",
    回测误区: "backtesting_research_hygiene", 风险管理: "risk_portfolio", 交易心理: "psychology_behavior",
  }[lesson.module];
  const domainMatched = refs.filter((ref) => (ref.domains || []).includes(moduleDomain)).length;
  evidence += Math.min(8, domainMatched * 3);
  detail.evidenceRelevance = Math.min(25, evidence);

  // 3) Localization (0-15): bilingual bridge present and substantive.
  const terms = lesson.bilingualKeyTerms || [];
  detail.localization = Math.min(15, terms.length * 4 + (terms.every((t) => (t.gloss || "").length >= 20) ? 3 : 0));

  // 4) Authority backing (0-15): named sources, bonus for public-domain classics.
  const readings = lesson.authorityBackedReading || [];
  let authority = Math.min(9, readings.length * 3);
  if (readings.some((r) => r.licenseTier === "public_domain")) authority += 6;
  else if (readings.length) authority += 3;
  detail.authorityBacking = Math.min(15, authority);

  // 5) Safety boundary (0-20): hard zero on any forbidden phrase.
  const blob = JSON.stringify(lesson);
  let safety = 20;
  if (FORBIDDEN.test(blob)) safety = 0;
  if (!/education/i.test(lesson.learnerBoundary || "")) safety = Math.min(safety, 5);
  if (lesson.reviewStatus !== "curriculum_draft") safety = Math.min(safety, 10);
  detail.safetyBoundary = safety;

  const total = detail.contentDepth + detail.evidenceRelevance + detail.localization + detail.authorityBacking + detail.safetyBoundary;
  let grade = "fail_quality";
  if (detail.safetyBoundary === 0) grade = "fail_safety";
  else if (lesson.handAuthored && total >= 80) grade = "commercial_ready";
  else if (total >= 80) grade = "structural_draft";
  else if (total >= 60) grade = "draft_needs_rewrite";
  return { total, grade, detail };
}

const results = knowledgeLessons.map((lesson) => ({
  lessonId: lesson.id,
  module: lesson.module,
  topic: lesson.topic,
  handAuthored: lesson.handAuthored === true,
  ...scoreLesson(lesson),
}));

const byGrade = results.reduce((acc, row) => { acc[row.grade] = (acc[row.grade] || 0) + 1; return acc; }, {});
const moduleStats = {};
for (const row of results) {
  const stats = (moduleStats[row.module] = moduleStats[row.module] || { lessons: 0, commercial: 0, draft: 0, fail: 0, avg: 0 });
  stats.lessons += 1;
  stats.avg += row.total;
  if (row.grade === "commercial_ready") stats.commercial += 1;
  else if (row.grade === "structural_draft" || row.grade === "draft_needs_rewrite") stats.draft += 1;
  else stats.fail += 1;
}
for (const stats of Object.values(moduleStats)) stats.avg = Number((stats.avg / stats.lessons).toFixed(1));

const handAuthoredCount = results.filter((row) => row.handAuthored).length;
const commercialRate = (byGrade.commercial_ready || 0) / results.length;
const overallPassRate = ((byGrade.commercial_ready || 0) + (byGrade.structural_draft || 0) + (byGrade.draft_needs_rewrite || 0)) / results.length;
const rewritePriorities = [...results]
  .filter((row) => !row.handAuthored && row.grade !== "fail_safety")
  .sort((a, b) => {
    if (a.total !== b.total) return b.total - a.total;
    return a.lessonId.localeCompare(b.lessonId);
  })
  .slice(0, 20)
  .map((row) => ({
    lessonId: row.lessonId,
    module: row.module,
    topic: row.topic,
    total: row.total,
    grade: row.grade,
    reason: "High-structure draft still needs hand-authored prose and factual review before learner-facing promotion.",
  }));

const report = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  lessonsAudited: results.length,
  gradeCounts: byGrade,
  handAuthoredLessons: handAuthoredCount,
  generatedDraftLessons: results.length - handAuthoredCount,
  handAuthoredCoverage: Number((handAuthoredCount / results.length).toFixed(4)),
  commercialPassRate: Number(commercialRate.toFixed(4)),
  overallPassRate: Number(overallPassRate.toFixed(4)),
  averageScore: Number((results.reduce((sum, row) => sum + row.total, 0) / results.length).toFixed(1)),
  moduleStats,
  rewritePriorities,
  weakestLessons: [...results].sort((a, b) => a.total - b.total).slice(0, 10).map((row) => ({ lessonId: row.lessonId, module: row.module, total: row.total, grade: row.grade })),
  boundary: "Self-audit grades draft curriculum quality for the team. Only hand-authored high-scoring lessons can be marked commercial_ready; generated high-scoring lessons remain structural_draft. This is not approval, certification, production readiness, or trading guidance.",
  results,
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync("docs/KNOWLEDGE_SELF_AUDIT.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync("docs/KNOWLEDGE_SELF_AUDIT.md", [
  "# Knowledge Self-Audit",
  "",
  "Five-dimension graded audit of all lesson drafts (content depth / evidence relevance / localization / authority backing / safety boundary).",
  "",
  `- Lessons audited: ${results.length}`,
  `- Commercial-ready hand-authored lessons: ${byGrade.commercial_ready || 0} (${(commercialRate * 100).toFixed(1)}%)`,
  `- Structural drafts (>=80 but not hand-authored): ${byGrade.structural_draft || 0}`,
  `- Drafts needing rewrite (60-79): ${byGrade.draft_needs_rewrite || 0}`,
  `- Fail: ${(byGrade.fail_quality || 0) + (byGrade.fail_safety || 0)}`,
  `- Hand-authored coverage: ${handAuthoredCount}/${results.length} (${((handAuthoredCount / results.length) * 100).toFixed(1)}%)`,
  `- Average score: ${report.averageScore}/100`,
  "",
  "## Per-Module",
  "",
  "| Module | Lessons | Commercial | Draft | Fail | Avg |",
  "|---|---|---|---|---|---|",
  ...Object.entries(moduleStats).map(([module, stats]) => `| ${module} | ${stats.lessons} | ${stats.commercial} | ${stats.draft} | ${stats.fail} | ${stats.avg} |`),
  "",
  "## Rewrite Priorities",
  "",
  ...rewritePriorities.slice(0, 10).map((row) => `- ${row.lessonId} (${row.module}, ${row.total}/100): ${row.reason}`),
  "",
  "## Boundary",
  "",
  report.boundary,
  "",
].join("\n"), "utf8");

if ((byGrade.fail_safety || 0) > 0) throw new Error(`self-audit found ${byGrade.fail_safety} safety failures`);
if ((byGrade.commercial_ready || 0) > handAuthoredCount) throw new Error("commercial_ready count cannot exceed hand-authored lessons");

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  lessonsAudited: results.length,
  gradeCounts: byGrade,
  handAuthoredLessons: handAuthoredCount,
  generatedDraftLessons: results.length - handAuthoredCount,
  handAuthoredCoverage: report.handAuthoredCoverage,
  commercialPassRate: report.commercialPassRate,
  overallPassRate: report.overallPassRate,
  averageScore: report.averageScore,
  outputMd: "docs/KNOWLEDGE_SELF_AUDIT.md",
}, null, 2));
