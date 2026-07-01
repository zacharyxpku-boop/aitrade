import fs from "node:fs";

const batchPath = "docs/LOCAL_COURSE_REWRITE_BATCH_01.json";

function fail(message) {
  throw new Error(message);
}

if (!fs.existsSync(batchPath)) fail(`missing ${batchPath}; run npm.cmd run rewrite:local-course-batch-01 first`);

const report = JSON.parse(fs.readFileSync(batchPath, "utf8"));
const hardForbidden = [
  "推荐买入",
  "推荐卖出",
  "保证收益",
  "胜率承诺",
  "实盘信号",
  "自动下单",
  "接入券商",
  "真实资金建议",
];

if (report.educationOnly !== true) fail("rewrite batch must keep educationOnly true");
if (report.productionReady !== false) fail("rewrite batch must keep productionReady false");
if (report.learnerFacingRelease !== false) fail("rewrite batch must keep learnerFacingRelease false");
if (report.approvalStatus !== "not_approved") fail("rewrite batch must remain not_approved");
if (!Array.isArray(report.draftItems) || report.draftItems.length < 24) fail(`expected at least 24 rewrite drafts, got ${report.draftItems?.length || 0}`);
if (!/internal review/i.test(report.boundary || "")) fail("rewrite batch missing internal review boundary");

const modules = new Set(report.draftItems.map((item) => item.module));
if (modules.size < 12) fail(`expected 12 modules covered, got ${modules.size}`);

for (const item of report.draftItems) {
  const text = JSON.stringify(item);
  const found = hardForbidden.filter((phrase) => text.includes(phrase));
  if (found.length) fail(`${item.id} contains forbidden drift phrase: ${found.join(", ")}`);
  if (item.educationOnly !== true) fail(`${item.id} must keep educationOnly true`);
  if (item.productionReady !== false) fail(`${item.id} must keep productionReady false`);
  if (item.learnerFacingRelease !== false) fail(`${item.id} must keep learnerFacingRelease false`);
  if (item.approvalStatus !== "not_approved") fail(`${item.id} must remain not_approved`);
  if (item.status !== "codex_local_course_assisted_draft") fail(`${item.id} has unexpected status ${item.status}`);
  if (!Array.isArray(item.localCourseEvidence) || item.localCourseEvidence.length < 2) fail(`${item.id} missing local course evidence`);
  if ((item.rewrittenIntro || "").length < 80) fail(`${item.id} intro too thin`);
  if ((item.conceptTeaching || "").length < 80) fail(`${item.id} conceptTeaching too thin`);
  if ((item.localCourseSynthesis || "").length < 80) fail(`${item.id} localCourseSynthesis too thin`);
  if ((item.observationPractice || "").length < 50) fail(`${item.id} observationPractice too thin`);
  if (!/不复用 PDF 原句|不复制 PDF/.test(`${item.conceptTeaching} ${item.reviewerNotes?.join(" ") || ""}`)) {
    fail(`${item.id} missing no-copy PDF boundary`);
  }
  if (!/structural_draft|not_approved|review/.test(text)) fail(`${item.id} missing draft/review boundary`);
}

console.log(JSON.stringify({
  ok: true,
  educationOnly: true,
  productionReady: false,
  learnerFacingRelease: false,
  approvalStatus: "not_approved",
  drafts: report.draftItems.length,
  modules: modules.size,
  sourceDocuments: report.sourceDocuments,
  sourceChunks: report.sourceChunks,
  outputJson: batchPath,
}, null, 2));
