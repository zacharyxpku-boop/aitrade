import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { localCourseCoverageIndex } = require("../education-local-course-coverage");
const { knowledgeLessons } = require("../education-knowledge-lessons");

const batchSizePerModule = Number(process.env.LOCAL_COURSE_REWRITE_PER_MODULE || 2);
const lessonByNodeId = new Map(knowledgeLessons.map((lesson) => [lesson.nodeId, lesson]));
const modules = [...new Set(localCourseCoverageIndex.rewriteIntake.map((item) => item.module))];

function pad(value) {
  return String(value).padStart(2, "0");
}

function evidenceNames(item) {
  return (item.localCourseEvidence || [])
    .slice(0, 3)
    .map((evidence) => evidence.sourceRelativePath || evidence.name || evidence.documentId);
}

function itemForBatch(module, batchIndex) {
  const rows = localCourseCoverageIndex.rewriteIntake.filter((item) => item.module === module);
  return rows.slice(batchIndex * batchSizePerModule, (batchIndex + 1) * batchSizePerModule);
}

function rewriteDraftFor(item, batchId, sequence) {
  const lesson = lessonByNodeId.get(item.nodeId) || {};
  const topic = item.topic || lesson.topic || item.title;
  const module = item.module || lesson.module;
  const evidence = evidenceNames(item);
  const evidencePhrase = evidence.length ? evidence.join("; ") : "local course notes";
  return {
    id: `${batchId}_${pad(sequence + 1)}`,
    batchId,
    nodeId: item.nodeId,
    lessonId: lesson.id || `lesson_${item.nodeId}`,
    module,
    topic,
    title: `${module}: ${topic} local-course-assisted rewrite draft`,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    sourceMode: "local_private_course_reviewer_background_plus_green_source_boundary",
    localCourseEvidence: item.localCourseEvidence,
    rewrittenIntro:
      `这一节把「${topic}」处理成观察训练，而不是行动结论。本地课程材料提示 reviewer：学习者需要先描述画面，再解释证据的边界。课堂开头不要求预测方向，只要求把背景、位置、节奏和失效条件拆开写清楚。`,
    conceptTeaching:
      `在「${module}」模块里，「${topic}」要被讲成可复查的读图动作：先确认它出现在哪个结构背景里，再说明它与前后证据的关系，最后写出什么情况会推翻当前解释。改写时只吸收 ${evidencePhrase} 的主题结构，不复用 PDF 原句。`,
    localCourseSynthesis:
      "本地课程提供的是 reviewer 线索：哪些概念被反复强调、哪些误读容易出现、哪些案例适合改造成复盘题。进入课程正文时，这些线索必须变成原创中文讲解，并与公开绿色来源的术语、许可和风险边界交叉检查。",
    observationPractice:
      "给学习者一张历史图表，只要求写三行：可见事实、当前解释、失效条件。评分只看证据是否具体、周期是否分清、是否写出不确定性，不评价结果方向。",
    reviewerNotes: [
      "检查本地课程是否仅作为 reviewer-only 背景，不复制 PDF 句子。",
      "检查是否保留 observation-first 顺序：事实、解释、边界、失效条件。",
      "检查是否和 green/public source 的术语、许可、风险边界一致。",
      "检查是否仍是 structural_draft，不进入 learner-facing release。",
    ],
    forbiddenDrift: [
      "不得输出具体交易行动指令。",
      "不得承诺结果、胜率、收益或策略有效性。",
      "不得加入券商流程、自动化执行或真实资金指导。",
      "不得复制本地 PDF 原文或把私有课程材料当作公开引用。",
    ],
    status: "codex_local_course_assisted_draft",
    nextGate: "separate_reviewer_source_fit_and_originality_review",
  };
}

function buildBatch(batchIndex) {
  const batchId = `local_course_rewrite_batch_${pad(batchIndex + 1)}`;
  const selected = modules.flatMap((module) => itemForBatch(module, batchIndex));
  const draftItems = selected.map((item, index) => rewriteDraftFor(item, batchId, index));
  return {
    generatedAt: new Date().toISOString(),
    batchId,
    batchNumber: batchIndex + 1,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    sourceRoot: localCourseCoverageIndex.sourceRoot,
    sourceDocuments: localCourseCoverageIndex.documents,
    sourceChunks: localCourseCoverageIndex.chunks,
    lessonsPerModule: batchSizePerModule,
    drafts: draftItems.length,
    modules: new Set(draftItems.map((item) => item.module)).size,
    draftItems,
    boundary: "Codex-generated local-course-assisted rewrite draft pack for internal review. It absorbs local PDF course structure into original education-only lesson drafts, but it is not approval, learner-facing release, investment advice, trading signals, broker workflow, automation, return promises, or real-money guidance.",
  };
}

function writeBatch(batch) {
  const suffix = pad(batch.batchNumber);
  fs.writeFileSync(`docs/LOCAL_COURSE_REWRITE_BATCH_${suffix}.json`, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
  const md = [
    `# Local Course Rewrite Batch ${suffix}`,
    "",
    "Codex-generated rewrite drafts using local private course PDFs as reviewer-only background.",
    "",
    `- Drafts: ${batch.drafts}`,
    `- Modules covered: ${batch.modules}`,
    `- Source documents: ${batch.sourceDocuments}`,
    `- Source chunks: ${batch.sourceChunks}`,
    `- Learner-facing release: ${batch.learnerFacingRelease}`,
    `- Approval status: ${batch.approvalStatus}`,
    "",
    "## Drafts",
    "",
    ...batch.draftItems.map((item) => [
      `### ${item.id} - ${item.module} / ${item.topic}`,
      "",
      `- Node: ${item.nodeId}`,
      `- Evidence: ${evidenceNames(item).join("; ")}`,
      "",
      item.rewrittenIntro,
      "",
      item.conceptTeaching,
      "",
      item.observationPractice,
      "",
    ].join("\n")),
    "## Boundary",
    "",
    batch.boundary,
    "",
  ].join("\n");
  fs.writeFileSync(`docs/LOCAL_COURSE_REWRITE_BATCH_${suffix}.md`, md, "utf8");
}

fs.mkdirSync("docs", { recursive: true });

const batchesNeeded = Math.ceil(Math.max(...modules.map((module) => localCourseCoverageIndex.rewriteIntake.filter((item) => item.module === module).length)) / batchSizePerModule);
const batches = Array.from({ length: batchesNeeded }, (_, index) => buildBatch(index));
for (const batch of batches) writeBatch(batch);

const index = {
  generatedAt: new Date().toISOString(),
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  sourceDocuments: localCourseCoverageIndex.documents,
  sourceChunks: localCourseCoverageIndex.chunks,
  totalRewriteIntake: localCourseCoverageIndex.rewriteIntake.length,
  batches: batches.map((batch) => ({
    batchId: batch.batchId,
    batchNumber: batch.batchNumber,
    drafts: batch.drafts,
    modules: batch.modules,
    json: `docs/LOCAL_COURSE_REWRITE_BATCH_${pad(batch.batchNumber)}.json`,
    md: `docs/LOCAL_COURSE_REWRITE_BATCH_${pad(batch.batchNumber)}.md`,
  })),
  totalDrafts: batches.reduce((sum, batch) => sum + batch.drafts, 0),
  moduleCounts: batches.flatMap((batch) => batch.draftItems).reduce((counts, item) => {
    counts[item.module] = (counts[item.module] || 0) + 1;
    return counts;
  }, {}),
  boundary: "All local-course rewrite batches are internal review drafts. They are not learner-facing release, approval, investment advice, trading signals, broker workflow, automation, return promises, or real-money guidance.",
};

fs.writeFileSync("docs/LOCAL_COURSE_REWRITE_BATCH_INDEX.json", `${JSON.stringify(index, null, 2)}\n`, "utf8");
fs.writeFileSync("docs/LOCAL_COURSE_REWRITE_BATCH_INDEX.md", [
  "# Local Course Rewrite Batch Index",
  "",
  `- Total rewrite intake: ${index.totalRewriteIntake}`,
  `- Total drafts generated: ${index.totalDrafts}`,
  `- Batches: ${index.batches.length}`,
  `- Modules: ${Object.keys(index.moduleCounts).length}`,
  `- Learner-facing release: ${index.learnerFacingRelease}`,
  `- Approval status: ${index.approvalStatus}`,
  "",
  "## Batches",
  "",
  ...index.batches.map((batch) => `- ${batch.batchId}: ${batch.drafts} drafts / ${batch.modules} modules`),
  "",
  "## Module Counts",
  "",
  ...Object.entries(index.moduleCounts).map(([module, count]) => `- ${module}: ${count}`),
  "",
  "## Boundary",
  "",
  index.boundary,
  "",
].join("\n"), "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  batches: index.batches.length,
  totalDrafts: index.totalDrafts,
  totalRewriteIntake: index.totalRewriteIntake,
  modules: Object.keys(index.moduleCounts).length,
  outputJson: "docs/LOCAL_COURSE_REWRITE_BATCH_INDEX.json",
  outputMd: "docs/LOCAL_COURSE_REWRITE_BATCH_INDEX.md",
}, null, 2));
