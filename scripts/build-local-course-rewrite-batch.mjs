import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { localCourseCoverageIndex } = require("../education-local-course-coverage");
const { knowledgeLessons } = require("../education-knowledge-lessons");

const batchId = process.env.LOCAL_COURSE_REWRITE_BATCH_ID || "local_course_rewrite_batch_01";
const lessonsPerModule = Number(process.env.LOCAL_COURSE_REWRITE_PER_MODULE || 2);
const lessonByNodeId = new Map(knowledgeLessons.map((lesson) => [lesson.nodeId, lesson]));

function uniqueModules(items) {
  return [...new Set(items.map((item) => item.module))];
}

function selectBatchItems() {
  const out = [];
  for (const module of uniqueModules(localCourseCoverageIndex.rewriteIntake)) {
    out.push(...localCourseCoverageIndex.rewriteIntake.filter((item) => item.module === module).slice(0, lessonsPerModule));
  }
  return out;
}

function evidenceNames(item) {
  return (item.localCourseEvidence || []).slice(0, 3).map((evidence) => evidence.sourceRelativePath || evidence.name || evidence.documentId);
}

function rewriteDraftFor(item, sequence) {
  const lesson = lessonByNodeId.get(item.nodeId) || {};
  const evidence = evidenceNames(item);
  const topic = item.topic || lesson.topic || item.title;
  const module = item.module || lesson.module;
  const evidencePhrase = evidence.length ? evidence.join("；") : "本地课程笔记";
  return {
    id: `${batchId}_${String(sequence + 1).padStart(2, "0")}`,
    batchId,
    nodeId: item.nodeId,
    lessonId: lesson.id || `lesson_${item.nodeId}`,
    module,
    topic,
    title: `${module}：${topic} 本地课程辅助改写稿`,
    educationOnly: true,
    productionReady: false,
    learnerFacingRelease: false,
    approvalStatus: "not_approved",
    sourceMode: "local_private_course_reviewer_background_plus_green_source_boundary",
    localCourseEvidence: item.localCourseEvidence,
    rewrittenIntro:
      `这一节先把「${topic}」当成观察训练，而不是结论训练。本地课程材料里反复出现的重点不是让学习者记住某个口号，而是让他们把画面拆成背景、位置、节奏和失效条件。课堂开头先让学习者说清楚自己看见了什么，再让他们解释为什么这些证据还不足以推出确定结论。`,
    conceptTeaching:
      `在「${module}」模块里，「${topic}」应被讲成一套可复查的读图动作：先定位它发生在哪个背景里，再说明它和前后结构的关系，最后写出哪些新信息会推翻当前解释。改写时只吸收 ${evidencePhrase} 的主题结构，不复用 PDF 原句。`,
    localCourseSynthesis:
      `本地课程可提供三类 reviewer 线索：第一，哪些概念在课程体系中被反复强调；第二，初学者容易把哪些观察误写成行动结论；第三，哪些案例适合改造成复盘问题。进入课程正文时，这些线索必须改写为原创中文解释，并和公开绿色来源边界交叉检查。`,
    observationPractice:
      `给学习者一张历史图表，只要求完成三行记录：一行写可见事实，一行写当前解释，一行写失效条件。答案不评价结果方向，只评价证据是否具体、周期是否分清、是否写出了不确定性。`,
    reviewerNotes: [
      "检查是否只使用本地课程作为 reviewer-only 背景，不复制 PDF 句子。",
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

const items = selectBatchItems().map(rewriteDraftFor);

const report = {
  generatedAt: new Date().toISOString(),
  batchId,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  sourceRoot: localCourseCoverageIndex.sourceRoot,
  sourceDocuments: localCourseCoverageIndex.documents,
  sourceChunks: localCourseCoverageIndex.chunks,
  lessonsPerModule,
  drafts: items.length,
  modules: uniqueModules(items).length,
  draftItems: items,
  boundary: "This is a Codex-generated local-course-assisted rewrite draft pack for internal review. It absorbs local PDF course structure into original education-only lesson drafts, but it is not approval, learner-facing release, investment advice, trading signals, broker workflow, automation, return promises, or real-money guidance.",
};

fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync("docs/LOCAL_COURSE_REWRITE_BATCH_01.json", `${JSON.stringify(report, null, 2)}\n`, "utf8");

const md = [
  "# Local Course Rewrite Batch 01",
  "",
  "Codex-generated rewrite drafts using local private course PDFs as reviewer-only background.",
  "",
  `- Drafts: ${report.drafts}`,
  `- Modules covered: ${report.modules}`,
  `- Source documents: ${report.sourceDocuments}`,
  `- Source chunks: ${report.sourceChunks}`,
  `- Learner-facing release: ${report.learnerFacingRelease}`,
  `- Approval status: ${report.approvalStatus}`,
  "",
  "## Drafts",
  "",
  ...items.map((item) => [
    `### ${item.id} · ${item.module} / ${item.topic}`,
    "",
    `- Node: ${item.nodeId}`,
    `- Evidence: ${evidenceNames(item).join("；")}`,
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
  report.boundary,
  "",
].join("\n");

fs.writeFileSync("docs/LOCAL_COURSE_REWRITE_BATCH_01.md", md, "utf8");

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  batchId,
  drafts: report.drafts,
  modules: report.modules,
  outputJson: "docs/LOCAL_COURSE_REWRITE_BATCH_01.json",
  outputMd: "docs/LOCAL_COURSE_REWRITE_BATCH_01.md",
}, null, 2));
